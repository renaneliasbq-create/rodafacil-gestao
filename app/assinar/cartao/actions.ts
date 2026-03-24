'use server'

import { createClient } from '@/lib/supabase/server'
import { pagarme } from '@/lib/pagarme/client'
import { getPlano, type PlanoId } from '@/lib/pagarme/plans'

interface PagarmeCharge {
  id: string
  status: string
  last_transaction: {
    transaction_type: string
    status: string
    acquirer_message?: string
  }
}

interface PagarmeOrder {
  id: string
  status: string
  charges: PagarmeCharge[]
}

export type CartaoResult =
  | { status: 'paid' }
  | { status: 'failed'; error: string }

/**
 * Cria pedido de cartão no Pagar.me usando o token gerado no client.
 * Dados do cartão NUNCA passam pelo nosso servidor.
 */
export async function pagarComCartao(
  assinaturaId: string,
  cardToken: string,
  parcelas: number
): Promise<CartaoResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'failed', error: 'Sessão expirada. Faça login novamente.' }

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('plano, periodo, preco_centavos, status, pagarme_customer_id, user_id')
    .eq('id', assinaturaId)
    .eq('user_id', user.id)
    .single()

  if (!assinatura) return { status: 'failed', error: 'Assinatura não encontrada.' }
  if (assinatura.status === 'ativa') return { status: 'paid' }
  if (!assinatura.pagarme_customer_id) return { status: 'failed', error: 'Cliente Pagar.me não encontrado.' }

  let plano
  try { plano = getPlano(assinatura.plano as PlanoId) } catch {
    return { status: 'failed', error: 'Plano inválido.' }
  }

  const mesAtual = new Date().toISOString().slice(0, 7)

  try {
    const order = await pagarme.post<PagarmeOrder>('/orders', {
      customer_id: assinatura.pagarme_customer_id,
      items: [
        {
          amount:      assinatura.preco_centavos,
          description: `${plano.nome} · ${assinatura.periodo === 'anual' ? 'Anual' : 'Mensal'}`,
          quantity:    1,
          code:        assinatura.plano,
        },
      ],
      payments: [
        {
          payment_method: 'credit_card',
          credit_card: {
            installments:         parcelas,
            statement_descriptor: 'RODAFACILSC',
            card_token:           cardToken,
          },
        },
      ],
    })

    const charge = order.charges?.[0]
    const tx = charge?.last_transaction

    // Salva o registro do pagamento
    await supabase.from('assinatura_pagamentos').insert({
      assinatura_id:     assinaturaId,
      user_id:           user.id,
      pagarme_order_id:  order.id,
      pagarme_charge_id: charge?.id ?? null,
      metodo:            'cartao',
      status:            order.status === 'paid' ? 'paid' : 'failed',
      valor_centavos:    assinatura.preco_centavos,
      referencia_mes:    mesAtual,
      pago_em:           order.status === 'paid' ? new Date().toISOString() : null,
    })

    if (order.status === 'paid') {
      // Ativa a assinatura
      await supabase
        .from('assinaturas')
        .update({
          status:               'ativa',
          current_period_start: new Date().toISOString().split('T')[0],
          current_period_end:   calcularProximoVencimento(assinatura.periodo),
          updated_at:           new Date().toISOString(),
        })
        .eq('id', assinaturaId)

      return { status: 'paid' }
    }

    // Pagamento recusado
    const motivo = tx?.acquirer_message ?? charge?.status ?? 'Cartão recusado.'
    return { status: 'failed', error: `Pagamento não aprovado: ${motivo}` }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar pagamento.'
    return { status: 'failed', error: msg }
  }
}

function calcularProximoVencimento(periodo: string): string {
  const d = new Date()
  if (periodo === 'anual') {
    d.setFullYear(d.getFullYear() + 1)
  } else {
    d.setMonth(d.getMonth() + 1)
  }
  return d.toISOString().split('T')[0]
}
