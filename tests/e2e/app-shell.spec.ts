import { expect, test } from '@playwright/test'

test('abre a página inicial', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('rota inexistente mostra a página de não encontrado', async ({ page }) => {
  await page.goto('/rota-que-nao-existe')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
})
