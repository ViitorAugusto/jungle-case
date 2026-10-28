import { expect, test } from '../support/test.ts'

test.describe('smoke', () => {
  test('abre a página inicial com os mocks ativos', async ({ page, mock }) => {
    await mock.open('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('controle do servidor simulado aplica e reseta o cenário', async ({ mock }) => {
    await mock.open('/', { scenario: 'empty' })
    expect((await mock.state()).config.scenario).toBe('empty')

    await mock.reset()
    expect((await mock.state()).config.scenario).toBe('success')
  })
})
