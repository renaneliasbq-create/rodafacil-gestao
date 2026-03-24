/**
 * Validação de assinatura do webhook Pagar.me
 * Pagar.me envia o header X-Hub-Signature com HMAC-SHA256
 */

import { createHmac } from 'crypto'

export function validateWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.PAGARME_WEBHOOK_SECRET
  if (!secret) throw new Error('PAGARME_WEBHOOK_SECRET não configurada')
  if (!signature) return false

  const expected = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  // Comparação segura contra timing attacks
  const sigBuffer = Buffer.from(signature.replace('sha256=', ''), 'hex')
  const expBuffer = Buffer.from(expected, 'hex')

  if (sigBuffer.length !== expBuffer.length) return false

  return sigBuffer.equals(expBuffer)
}
