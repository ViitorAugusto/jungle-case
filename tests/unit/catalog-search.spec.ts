import { expect, test } from '@playwright/test'

import {
  applyCatalogFilters,
  parseCatalogSearch,
  toCatalogQuery,
  withCatalogPage,
} from '@application/dtos/catalog-search'

import { parseSearch, stringifySearch } from '@main/search-serializer'

test.describe('search params do catálogo', () => {
  test('normaliza entrada da URL e descarta valores inválidos', () => {
    expect(
      parseCatalogSearch({
        q: '  ape ',
        collection: 'arte-digital',
        network: ['solana', 'bitcoin', 'ethereum'],
        min: '0,02',
        max: 'abc',
        tab: 'em-alta',
        sort: 'invalido',
        page: '0',
      }),
    ).toEqual({
      q: 'ape',
      collection: ['arte-digital'],
      network: ['ethereum', 'solana'],
      min: '0.02',
      tab: 'em-alta',
    })
  })

  test('valores padrão não aparecem na URL', () => {
    expect(parseCatalogSearch({ tab: 'todos', page: 1 })).toEqual({})
  })

  test('faixa de preço invertida é corrigida', () => {
    expect(parseCatalogSearch({ min: '12.3', max: '0.5' })).toEqual({ min: '0.5', max: '12.3' })
  })

  test('mudar filtro volta para a página 1; limpar com undefined remove a chave', () => {
    const current = withCatalogPage({ collection: ['fotografia'], q: 'nomad' }, 3)
    expect(current.page).toBe(3)
    expect(applyCatalogFilters(current, { network: ['polygon'] })).toEqual({
      collection: ['fotografia'],
      q: 'nomad',
      network: ['polygon'],
    })
    expect(applyCatalogFilters(current, { q: undefined })).toEqual({ collection: ['fotografia'] })
  })

  test('consulta usa padrão da aba quando não há ordenação explícita', () => {
    const query = toCatalogQuery({ tab: 'novos' })
    expect(query).toMatchObject({ tab: 'novos', sort: null, page: 1, pageSize: 9 })
  })
})

test.describe('serialização da URL', () => {
  test('listas repetem a chave e valores ficam em texto (ida e volta)', () => {
    const search = parseCatalogSearch({ collection: ['fotografia', 'arte-digital'], min: '0.5', page: 2 })
    const query = stringifySearch(search)
    expect(query).toBe('?collection=arte-digital&collection=fotografia&min=0.5&page=2')
    expect(parseCatalogSearch(parseSearch(query))).toEqual(search)
  })

  test('busca vazia não gera query string', () => {
    expect(stringifySearch({})).toBe('')
  })
})
