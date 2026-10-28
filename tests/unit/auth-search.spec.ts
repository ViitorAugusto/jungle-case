import { expect, test } from '@playwright/test'

import { validateRegistration } from '@domain/entities/profile'

import { afterLoginPath, parseAuthSearch, safeRedirectPath } from '@application/dtos/auth-search'

test.describe('retorno após login', () => {
  test('aceita só caminhos internos', () => {
    expect(safeRedirectPath('/checkout?step=2')).toBe('/checkout?step=2')
    expect(safeRedirectPath('https://exemplo.com')).toBeUndefined()
    expect(safeRedirectPath('//exemplo.com')).toBeUndefined()
    expect(safeRedirectPath('/\\exemplo.com')).toBeUndefined()
    expect(safeRedirectPath(42)).toBeUndefined()
  })

  test('lê redirect e aviso de expiração da URL', () => {
    expect(parseAuthSearch({ redirect: '/perfil', expired: '1' })).toEqual({
      redirect: '/perfil',
      expired: true,
    })
    expect(parseAuthSearch({ redirect: 'https://fora.com' })).toEqual({})
    expect(afterLoginPath({})).toBe('/')
    expect(afterLoginPath({ redirect: '/carteiras' })).toBe('/carteiras')
  })
})

test.describe('cadastro', () => {
  const base = { name: 'Alex Rocha', email: 'alex@teste.dev', password: 'Jungle@123' }

  test('confirmação diferente da senha gera erro no campo', () => {
    expect(validateRegistration({ ...base, confirmPassword: 'Outra@123' })).toEqual({
      confirmPassword: ['As senhas não conferem'],
    })
  })

  test('dados válidos não têm erros', () => {
    expect(validateRegistration({ ...base, confirmPassword: base.password })).toEqual({})
  })
})
