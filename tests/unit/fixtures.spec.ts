import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { expect, test } from '@playwright/test'

import { descriptionParagraphs } from '@domain/entities/nft'

import { mulEth } from '@mocks/db/eth'
import { fixtureIds } from '@mocks/db/fixture-ids'
import { createFixtureNfts, createFixtureReviews, fixtureCollections } from '@mocks/db/fixtures'
import { summarize } from '@mocks/services/pricing'

const nfts = createFixtureNfts()
const nft = (id: string) => nfts.find((item) => item.id === id)
const edition = (nftId: string, editionId: string) =>
  nft(nftId)?.editions.find((item) => item.id === editionId)

/** Garante que os ids publicados para os testes descrevem as fixtures reais. */
test.describe('fixture-ids x fixtures', () => {
  test('NFT disponível tem estoque na edição indicada', () => {
    const { id, editionId } = fixtureIds.nfts.available
    expect(edition(id, editionId)?.available).toBeGreaterThan(0)
  })

  test('NFT parcialmente esgotado: edição disponível com estoque e esgotada com zero', () => {
    const { id, availableEditionId, soldOutEditionId } = fixtureIds.nfts.partiallySoldOut
    expect(edition(id, availableEditionId)?.available).toBeGreaterThan(0)
    expect(edition(id, soldOutEditionId)?.available).toBe(0)
  })

  test('NFT esgotado não tem nenhuma edição disponível', () => {
    const soldOut = nft(fixtureIds.nfts.soldOut.id)
    expect(soldOut?.editions.every((item) => item.available === 0)).toBe(true)
    expect(edition(fixtureIds.nfts.soldOut.id, fixtureIds.nfts.soldOut.editionId)).toBeDefined()
  })

  test('NFT inexistente não está no catálogo', () => {
    expect(nft(fixtureIds.nfts.missing.id)).toBeUndefined()
  })

  test('toda imagem aponta para uma arte do Figma que existe em public/', () => {
    for (const item of nfts) {
      for (const image of item.images) {
        expect(image.url).toMatch(/^\/images\/nfts\/kurio-nft-[1-4]-640\.jpg$/)
        expect(existsSync(resolve('public', `.${image.url}`)), image.url).toBe(true)
      }
    }
  })

  test('página 1 do Figma: cards e artes na ordem', () => {
    const art = (index: number) => `/images/nfts/kurio-nft-${index}-640.jpg`
    expect(nfts.slice(0, 9).map((item) => [item.name, item.images[0]?.url])).toEqual([
      ['Emerald Ape #042', art(1)],
      ['Sage Nomad #009', art(2)],
      ['Neon Vessel #552', art(3)],
      ['Cosmic Bloom #118', art(2)],
      ['Violet Nomad #314', art(2)],
      ['Ivory Baron #088', art(3)],
      ['Golden Beat #207', art(4)],
      ['Golden Frequency #071', art(4)],
      ['Golden Signal #160', art(4)],
    ])
  })
})

const countBy = (key: (item: (typeof nfts)[number]) => string) =>
  nfts.reduce<Record<string, number>>((counts, item) => {
    counts[key(item)] = (counts[key(item)] ?? 0) + 1
    return counts
  }, {})

test.describe('catálogo x números do Figma', () => {
  test('contagens por coleção do filtro', () => {
    const counts = countBy((item) => item.collection.id)
    expect(fixtureCollections.map(({ id }) => counts[id])).toEqual([33, 12, 65, 39, 23, 17, 19, 13, 18])
  })

  test('contagens por rede', () => {
    const counts = countBy((item) => item.network)
    expect([counts.ethereum, counts.polygon, counts.solana]).toEqual([119, 78, 86])
  })

  test('catálogo é determinístico', () => {
    expect(createFixtureNfts()).toEqual(nfts)
  })

  test('tokens únicos; os do Figma nos NFTs certos', () => {
    expect(new Set(nfts.map((item) => item.tokenId)).size).toBe(nfts.length)
    const token = (name: string) => nfts.find((item) => item.name === name)?.tokenId
    expect([token('Emerald Ape #042'), token('Violet Nomad #314'), token('Ivory Baron #088')]).toEqual([
      '#0042',
      '#0314',
      '#0088',
    ])
  })

  test('Emerald Ape #042: avaliações, atributos, série, 4 imagens e 2 parágrafos', () => {
    const emerald = nfts[0]
    expect(emerald?.rating).toEqual({ average: 4.8, count: 19 })
    expect(emerald?.attributes).toEqual(['Óculos', 'Esmeralda', 'Raro'])
    expect(emerald?.series.name).toBe('Kurio Apes')
    expect(emerald?.images).toHaveLength(4)
    expect(new Set(emerald?.images.map((image) => image.url)).size).toBe(1)
    expect(emerald && descriptionParagraphs(emerald)).toHaveLength(2)
    expect(emerald?.provenance.contractAddress).toMatch(/^0x7A42.*19E8$/)
  })

  test('Emerald Ape #042: chips 1/1, 1/10, 1/50, Aberta; 1/50 é a primeira disponível', () => {
    const editions = nfts[0]?.editions ?? []
    expect(editions.map((item) => item.supply)).toEqual([1, 10, 50, null])
    expect(editions.find((item) => item.available > 0)?.id).toBe('nft-001-std')
    const open = editions.at(-1)
    expect(open?.available).toBeGreaterThan(0)
    expect(open?.priceEth).toBe(editions[2]?.priceEth)
  })

  test('selo RARO: Neon Vessel sim, Emerald Ape não (frame mobile)', () => {
    expect(nfts[2]?.rarity).toBe('raro')
    expect(nfts[0]?.rarity).toBe('comum')
  })

  test('"Mais desta coleção" do Emerald Ape = 5 mais recentes da mesma coleção', () => {
    const emerald = nfts[0]
    const related = nfts
      .filter((item) => item.collection.id === emerald?.collection.id && item.id !== emerald.id)
      .slice(0, 5)
      .map((item) => item.name)
    expect(related).toEqual([
      'Cosmic Bloom #118',
      'Violet Nomad #314',
      'Ivory Baron #088',
      'Golden Beat #207',
      'Golden Signal #160',
    ])
  })

  test('"Colecionadores também viram" = 5 maiores pontuações de tendência', () => {
    const trending = [...nfts]
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 5)
      .map((item) => item.name)
    expect(trending).toEqual([
      'Cosmic Bloom #118',
      'Violet Nomad #314',
      'Ivory Baron #088',
      'Golden Beat #207',
      'Golden Signal #160',
    ])
  })

  test('preços com no máximo 3 casas', () => {
    const prices = nfts.flatMap((item) =>
      item.editions.flatMap((edition) => [edition.priceEth, edition.compareAtPriceEth ?? '0']),
    )
    for (const price of prices) expect(price).toMatch(/^\d+(\.\d{1,3})?$/)
  })

  test('avaliações: quantidade e média batem com o selo do NFT', () => {
    for (const item of nfts.slice(0, 30)) {
      const reviews = createFixtureReviews(item)
      expect(reviews).toHaveLength(item.rating.count)
      const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      expect(Math.round(average * 10) / 10).toBe(item.rating.average)
      for (const review of reviews) expect(review.rating).toBeGreaterThanOrEqual(1)
    }
  })
})

test.describe('resumo de preço no formato do Figma', () => {
  const line = (unitPriceEth: string, quantity: number) => ({
    nftId: 'nft-001',
    editionId: 'nft-001-std',
    tokenId: '#0042',
    nftName: 'Emerald Ape #042',
    editionName: 'Padrão',
    imageUrl: '',
    unitPriceEth,
    quantity,
    available: 50,
    lineTotalEth: mulEth(unitPriceEth, quantity),
  })

  test('carrinho do frame desktop: taxa 0.016 e total 26.846', () => {
    const summary = summarize([line('1.19', 2), line('1.39', 6), line('1.79', 9)], null)
    expect(summary).toEqual({
      subtotalEth: '26.83',
      discountEth: '0',
      networkFeeEth: '0.016',
      totalEth: '26.846',
    })
  })

  test('desconto percentual arredondado a 3 casas', () => {
    const coupon = { code: 'JUNGLE10', kind: 'percentage' as const, value: '1000', description: '' }
    const summary = summarize([line('2.975', 1)], coupon)
    expect(summary.discountEth).toBe('0.298')
    expect(summary.totalEth).toBe('2.693')
  })
})
