import { NftDetailPage } from '../support/pages/nft-detail-page.ts'
import { testData } from '../support/test-data.ts'
import { expect, test } from '../support/test.ts'

/**
 * T02 — acesso direto ao detalhe e recurso inexistente (R03, R16, R45).
 * Nome, imagens e disponibilidade vêm da resposta da API simulada.
 */

const { available, partiallySoldOut, soldOut, missing } = testData.nfts

test.describe('detalhe do NFT', () => {
  test('acesso direto pela URL mostra nome, galeria e edições', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)

    const nft = await detail.loadAfter(available.id, () => mock.open(NftDetailPage.path(available.id)))

    await expect(detail.title).toHaveText(nft.name)
    // A galeria mostra uma imagem por vez; no desktop as miniaturas trocam a imagem principal
    // (o frame mobile do Figma não tem miniaturas, só a primeira imagem).
    if (await detail.thumbnail(1, nft.images.length).isVisible()) {
      for (const [index, image] of nft.images.entries()) {
        await detail.thumbnail(index + 1, nft.images.length).click()
        await expect(detail.image(image.alt)).toBeVisible()
      }
    } else {
      await expect(detail.image(nft.images[0]?.alt ?? '')).toBeVisible()
    }
    await expect(detail.editions.getByRole('radio')).toHaveCount(nft.editions.length)
    await expect(detail.buy).toBeEnabled()
    await expect(detail.addToCart).toBeEnabled()
  })

  test('refresh no detalhe mantém a tela', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    const nft = await detail.loadAfter(available.id, () => mock.open(NftDetailPage.path(available.id)))

    await page.reload()

    await expect(page).toHaveURL(NftDetailPage.path(available.id))
    await expect(detail.title).toHaveText(nft.name)
  })

  test('NFT inexistente mostra estado próprio e volta ao catálogo', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    await mock.open(NftDetailPage.path(missing.id))

    await expect(detail.notFound).toBeVisible()
    await expect(detail.buy).toBeHidden()

    await detail.backToCatalog.click()
    // O link leva à âncora do catálogo no Início (`/#catalogo`).
    await page.waitForURL((url) => url.pathname === '/')
  })

  test('edição esgotada fica indisponível e as demais selecionáveis', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    const nft = await detail.loadAfter(partiallySoldOut.id, () =>
      mock.open(NftDetailPage.path(partiallySoldOut.id)),
    )
    const soldOutEdition = nft.editions.find((edition) => edition.id === partiallySoldOut.soldOutEditionId)
    const availableEdition = nft.editions.find(
      (edition) => edition.id === partiallySoldOut.availableEditionId,
    )
    if (!soldOutEdition || !availableEdition) throw new Error('Fixture de edição esgotada mudou')

    await expect(detail.edition(soldOutEdition.name)).toBeDisabled()
    // Estado esgotado também em texto, não só desabilitado (R72).
    await expect(detail.editions).toContainText('Esgotada')
    await detail.edition(availableEdition.name).check()
    await expect(detail.edition(availableEdition.name)).toBeChecked()
  })

  test('NFT com todas as edições esgotadas não permite compra', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    await mock.open(NftDetailPage.path(soldOut.id))

    for (const radio of await detail.editions.getByRole('radio').all()) await expect(radio).toBeDisabled()
    await expect(detail.buy).toBeDisabled()
    await expect(detail.addToCart).toBeDisabled()
  })

  test('quantidade limitada à disponibilidade da edição', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    const nft = await detail.loadAfter(available.id, () => mock.open(NftDetailPage.path(available.id)))
    const edition = nft.editions.find((candidate) => candidate.id === available.editionId)
    if (!edition) throw new Error('Fixture de edição disponível mudou')

    await detail.edition(edition.name).check()
    await expect(detail.quantity).toHaveValue('1')
    await expect(detail.decreaseQuantity).toBeDisabled()

    for (let quantity = 1; quantity < edition.available; quantity += 1) await detail.increaseQuantity.click()

    await expect(detail.quantity).toHaveValue(String(edition.available))
    await expect(detail.increaseQuantity).toBeDisabled()
  })

  test('quantidade digitada acima do limite é corrigida', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    const nft = await detail.loadAfter(available.id, () => mock.open(NftDetailPage.path(available.id)))
    const edition = nft.editions.find((candidate) => candidate.id === available.editionId)
    if (!edition) throw new Error('Fixture de edição disponível mudou')

    await detail.edition(edition.name).check()
    await detail.quantity.fill(String(edition.available + 10))
    await detail.quantity.blur()

    await expect(detail.quantity).toHaveValue(String(edition.available))
  })
})
