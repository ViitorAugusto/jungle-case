/**
 * Substituto do pacote `tough-cookie` no bundle dos mocks (alias em `vite.config.ts`).
 *
 * O MSW só usa o `tough-cookie` no próprio cookie jar, que guarda os cookies
 * definidos por respostas simuladas (`Set-Cookie`) e os devolve nas requisições
 * seguintes. A API simulada não usa cookies (sessão por `Authorization`), então
 * o jar fica sempre vazio. Os cookies de `document.cookie` continuam chegando
 * aos handlers, porque o MSW os lê sem passar por aqui. O pacote real (e a
 * Public Suffix List do `tldts`, da qual ele depende) pesava ~9 KB gzip no
 * caminho crítico. Limitação registrada no ARCHITECTURE.md.
 */
type StoredCookie = { readonly key: string; readonly value: string }

export const Cookie = {
  fromJSON: (): StoredCookie | null => null,
}

export class MemoryCookieStore {
  idx: Record<string, Record<string, Record<string, StoredCookie>>> = {}
}

export class CookieJar {
  getCookiesSync(): StoredCookie[] {
    return []
  }

  setCookie(): Promise<void> {
    return Promise.resolve()
  }
}
