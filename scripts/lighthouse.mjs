// Auditoria Lighthouse do build de produção (mocks ativos, cenário padrão).
// Para cada página e perfil (mobile/desktop) roda N medições em um navegador
// com perfil novo, escolhe a mediana e grava HTML/JSON de todas as execuções
// mais um resumo com notas, LCP/CLS/TBT, versões e ambiente.
//
// Uso: npm run lighthouse -- [--skip-build] [--assert] [--out <pasta>]
//   --skip-build  reaproveita o dist/ existente
//   --assert      sai com código 1 se alguma mediana ficar abaixo da meta
//   --out         grava direto nessa pasta (ex.: docs/auditoria/lighthouse para a
//                 rodada final versionada); sem ele, lighthouse-reports/<data>/

import { spawn, spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { parseArgs } from 'node:util'

import { chromium } from '@playwright/test'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse, { desktopConfig } from 'lighthouse'
import { computeMedianRun } from 'lighthouse/core/lib/median-run.js'

import { lighthouseConfig as config } from './lighthouse.config.mjs'

const { values: args } = parseArgs({
  options: {
    'skip-build': { type: 'boolean', default: false },
    assert: { type: 'boolean', default: false },
    out: { type: 'string' },
  },
})
const baseUrl = `http://localhost:${config.port}`
const root = path.resolve(import.meta.dirname, '..')

const npm = (script) => {
  const result = spawnSync('npm', ['run', script], { cwd: root, stdio: 'inherit', shell: true })
  if (result.status !== 0) throw new Error(`npm run ${script} falhou`)
}

/** Sobe `vite preview` sem shell, para encerrar o processo diretamente no fim. */
const startPreview = () =>
  spawn(
    process.execPath,
    [
      path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
      'preview',
      '--port',
      String(config.port),
      '--strictPort',
    ],
    { cwd: root, stdio: 'ignore' },
  )

const waitForServer = async (url, timeoutMs = 30_000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Ainda subindo.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Servidor não respondeu em ${url}`)
}

const flagsFor = (formFactor, port) => ({
  port,
  output: ['html', 'json'],
  logLevel: 'error',
  onlyCategories: config.categories,
  formFactor,
})

const runOnce = async (url, formFactor) => {
  const chrome = await chromeLauncher.launch({
    chromePath: chromium.executablePath(),
    chromeFlags: config.chromeFlags,
  })
  try {
    const result = await lighthouse(
      url,
      flagsFor(formFactor, chrome.port),
      formFactor === 'desktop' ? desktopConfig : undefined,
    )
    if (!result) throw new Error(`Lighthouse sem resultado para ${url}`)
    return result
  } finally {
    chrome.kill()
  }
}

const score = (lhr, category) => Math.round((lhr.categories[category]?.score ?? 0) * 100)

const summarize = (lhr) => ({
  scores: Object.fromEntries(config.categories.map((category) => [category, score(lhr, category)])),
  metrics: Object.fromEntries(
    Object.entries(config.metrics).map(([key, auditId]) => [
      key,
      {
        value: lhr.audits[auditId]?.numericValue ?? null,
        display: lhr.audits[auditId]?.displayValue ?? null,
      },
    ]),
  ),
})

const meetsTargets = (scores) =>
  config.categories.every((category) => scores[category] >= config.targets[category])

const describeThrottling = (lhr) => {
  const { throttling, throttlingMethod, screenEmulation } = lhr.configSettings
  return `${throttlingMethod}, RTT ${throttling.rttMs} ms, ${Math.round(throttling.throughputKbps)} Kbps, CPU ${throttling.cpuSlowdownMultiplier}x, tela ${screenEmulation.width}x${screenEmulation.height}`
}

const toMarkdown = (summary) => {
  const { targets } = config
  const rows = summary.results.map(({ page, formFactor, medianRun, median: { scores, metrics } }) =>
    [
      page,
      formFactor,
      scores.performance,
      scores.accessibility,
      scores['best-practices'],
      scores.seo,
      metrics.lcp.display,
      metrics.cls.display,
      metrics.tbt.display,
      medianRun,
      meetsTargets(scores) ? 'atingida' : 'abaixo',
    ].join(' | '),
  )
  const env = summary.environment
  return [
    `# Lighthouse — ${summary.generatedAt}`,
    '',
    `Mediana de ${config.runs} execuções por página e perfil. Metas: Performance ≥ ${targets.performance}, Accessibility ≥ ${targets.accessibility}, Best Practices ≥ ${targets['best-practices']}, SEO ≥ ${targets.seo}.`,
    '',
    '| Página | Perfil | Perf | A11y | BP | SEO | LCP | CLS | TBT | Execução mediana | Meta |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
    ...rows.map((row) => `| ${row} |`),
    '',
    '## Ambiente',
    '',
    `- Lighthouse ${env.lighthouse}; navegador: ${env.browser}`,
    `- Node ${env.node}; ${env.os}; CPU ${env.cpu}; ${env.memoryGb} GB`,
    `- BenchmarkIndex do host: ${env.benchmarkIndex}`,
    `- Condições mobile: ${env.conditions.mobile}`,
    `- Condições desktop: ${env.conditions.desktop}`,
    '',
  ].join('\n')
}

const auditProfile = async (outputDir, page, formFactor) => {
  const runs = []
  for (let run = 1; run <= config.runs; run += 1) {
    console.log(`Lighthouse ${page.id} ${formFactor} ${run}/${config.runs}`)
    const { lhr, report } = await runOnce(`${baseUrl}${page.path}`, formFactor)
    const [html, json] = report
    const name = `${page.id}-${formFactor}-${run}`
    await writeFile(path.join(outputDir, `${name}.html`), html)
    await writeFile(path.join(outputDir, `${name}.json`), json)
    runs.push(lhr)
  }
  const median = computeMedianRun(runs)
  return { median, runs, medianRun: runs.indexOf(median) + 1 }
}

const main = async () => {
  if (!args['skip-build']) npm('build')

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputDir = args.out ? path.resolve(root, args.out) : path.join(root, config.outputDir, stamp)
  await mkdir(outputDir, { recursive: true })

  const preview = startPreview()
  const results = []
  const conditions = {}
  let reference = null

  try {
    await waitForServer(baseUrl)
    for (const page of config.pages) {
      for (const formFactor of config.formFactors) {
        const { median, runs, medianRun } = await auditProfile(outputDir, page, formFactor)
        conditions[formFactor] = describeThrottling(median)
        reference = median
        results.push({
          page: page.id,
          path: page.path,
          formFactor,
          medianRun,
          median: summarize(median),
          runs: runs.map(summarize),
        })
      }
    }
  } finally {
    preview.kill()
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    url: baseUrl,
    runsPerProfile: config.runs,
    targets: config.targets,
    environment: {
      lighthouse: reference?.lighthouseVersion,
      browser: reference?.environment.hostUserAgent,
      benchmarkIndex: reference?.environment.benchmarkIndex,
      node: process.version,
      os: `${os.type()} ${os.release()} ${os.arch()}`,
      cpu: os.cpus()[0]?.model.trim(),
      memoryGb: Math.round(os.totalmem() / 1024 ** 3),
      conditions,
    },
    results,
  }

  await writeFile(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2))
  const markdown = toMarkdown(summary)
  await writeFile(path.join(outputDir, 'summary.md'), markdown)
  console.log(`\n${markdown}\nRelatórios em ${path.relative(root, outputDir)}`)

  const belowTarget = results.some(({ median }) => !meetsTargets(median.scores))
  if (belowTarget && args.assert) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
