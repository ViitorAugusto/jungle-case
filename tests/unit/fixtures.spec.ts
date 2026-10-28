import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { expect, test } from '@playwright/test'

import { fixtureIds } from '@mocks/db/fixture-ids'
import { createFixtureNfts } from '@mocks/db/fixtures'

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
    expect(nfts.slice(0, 3).map((item) => [item.name, item.images[0]?.url])).toEqual([
      ['Emerald Ape #042', '/images/nfts/kurio-nft-1-640.jpg'],
      ['Sage Nomad #009', '/images/nfts/kurio-nft-2-640.jpg'],
      ['Neon Vessel #552', '/images/nfts/kurio-nft-3-640.jpg'],
    ])
    expect(nft('nft-007')?.images[0]?.url).toBe('/images/nfts/kurio-nft-4-640.jpg')
  })
})
