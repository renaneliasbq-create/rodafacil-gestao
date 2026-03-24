/**
 * Cliente Pagar.me v5 — usa fetch nativo com Basic Auth
 * Documentação: https://docs.pagar.me/reference
 */

const PAGARME_BASE_URL = 'https://api.pagar.me/core/v5'

function getSecretKey(): string {
  const key = process.env.PAGARME_SECRET_KEY
  if (!key) throw new Error('PAGARME_SECRET_KEY não configurada')
  return key
}

function authHeader(key: string): string {
  return 'Basic ' + Buffer.from(key + ':').toString('base64')
}

async function pagarmeRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: object
): Promise<T> {
  const secretKey = getSecretKey()

  const res = await fetch(`${PAGARME_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: authHeader(secretKey),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  const json = await res.json()

  if (!res.ok) {
    const msg = json?.message ?? json?.errors?.[0]?.message ?? `Pagar.me erro ${res.status}`
    throw new Error(msg)
  }

  return json as T
}

export const pagarme = {
  get: <T>(path: string) => pagarmeRequest<T>('GET', path),
  post: <T>(path: string, body: object) => pagarmeRequest<T>('POST', path, body),
  patch: <T>(path: string, body: object) => pagarmeRequest<T>('PATCH', path, body),
  delete: <T>(path: string) => pagarmeRequest<T>('DELETE', path),
}
