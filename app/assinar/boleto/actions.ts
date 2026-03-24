'use server'

import { createClient } from '@/lib/supabase/server'
import { pagarme } from '@/lib/pagarme/client'
import { getPlano, type PlanoId } from '@/lib/pagarme/plans'

interface PagarmeCharge {
  id: string
  last_transaction: {
    url: string
    line: string
    barcode?: string
  }
}

interface PagarmeOrder {
  id: string
  status: string
  charges: PagarmeCharge[]
}

export interface BoletoData {
  pagamento_id:   string
  order_id:       string
  boleto_url:     string
  boleto_barcode: string   // linha digitável
  expires_at:     string   // ISO date
  valor_centavos: number
}

/** Adiciona dias úteis a uma data (pula sábados e domingos) */
function adicionarDiasUteis(data: Date, dias: number): Date {
  const d = new Date(data)
  let adicionados = 0
  while (adicionados < dias) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) adicionados++
  }
  return d
}

/**
 * Cria (ou recupera) um boleto para a assinatura.
 * Reutiliza se já existir um boleto pendente não-vencido.
 */
export async function criarOuRecuperarBoleto(assinaturaId: string): Promise<
  { data: BoletoData } | { error: string }
> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('plano, periodo, preco_centavos, status, pagarme_customer_id, user_id')
    .eq('id', assinaturaId)
    .eq('user_id', user.id)
    .single()

  if (!assinatura)              return { error: 'Assinatura não encontrada.' }
  if (assinatura.status === 'ativa') return { error: 'Esta assinatura já está ativa.' }
  if (!assinatura.pagarme_customer_id) return { error: 'Cliente Pagar.me não encontrado.' }

  // Reusa boleto pendente ainda dentro da validade
  const { data: existente } = await supabase
    .from('assinatura_pagamentos')
    .select('id, pagarme_order_id, boleto_url, boleto_barcode, boleto_expires_at, valor_centavos')
    .eq('assinatura_id', assinaturaId)
    .eq('metodo', 'boleto')
    .eq('status', 'waiting_payment')
    .gt('boleto_expires_at', new Date().toISOString())
    .maybeSingle()

  if (existente?.boleto_url) {
    return {
      data: {
        pagamento_id:   existente.id,
        order_id:       existente.pagarme_order_id!,
        boleto_url:     existente.boleto_url,
        boleto_barcode: existente.boleto_barcode!,
        expires_at:     existente.boleto_expires_at!,
        valor_centavos: existente.valor_centavos,
      },
    }
  }

  // Gera novo boleto
  let plano
  try { plano = getPlano(assinatura.plano as PlanoId) } catch {
    return { error: 'Plano inválido.' }
  }

  const vencimento = adicionarDiasUteis(new Date(), 3)
  const vencimentoISO = vencimento.toISOString().split('T')[0] + 'T23:59:59Z'
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
          payment_method: 'boleto',
          boleto: {
            instructions:    'Não receber após o vencimento. Pagamento referente à assinatura RodaFácil SC.',
            due_at:          vencimentoISO,
            document_number: `RFSC-${Date.now()}`,
          },
        },
      ],
    })

    const charge = order.charges?.[0]
    const tx = charge?.last_transaction

    if (!tx?.url || !tx?.line) return { error: 'Erro ao gerar boleto. Tente novamente.' }

    const { data: pagamento, error: dbErr } = await supabase
      .from('assinatura_pagamentos')
      .insert({
        assinatura_id:     assinaturaId,
        user_id:           user.id,
        pagarme_order_id:  order.id,
        pagarme_charge_id: charge.id,
        metodo:            'boleto',
        status:            'waiting_payment',
        valor_centavos:    assinatura.preco_centavos,
        referencia_mes:    mesAtual,
        boleto_url:        tx.url,
        boleto_barcode:    tx.line,
        boleto_expires_at: vencimentoISO,
      })
      .select('id')
      .single()

    if (dbErr) return { error: 'Erro ao registrar boleto.' }

    return {
      data: {
        pagamento_id:   pagamento.id,
        order_id:       order.id,
        boleto_url:     tx.url,
        boleto_barcode: tx.line,
        expires_at:     vencimentoISO,
        valor_centavos: assinatura.preco_centavos,
      },
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao gerar boleto.'
    return { error: msg }
  }
}

/**
 * Verifica o status do boleto — usado para polling opcional.
 */
export async function verificarStatusBoleto(pagamentoId: string): Promise<{
  status: 'paid' | 'waiting_payment' | 'failed' | 'expired'
}> {
  const supabase = createClient()

  const { data } = await supabase
    .from('assinatura_pagamentos')
    .select('status, boleto_expires_at')
    .eq('id', pagamentoId)
    .single()

  if (!data) return { status: 'failed' }
  if (data.status === 'paid') return { status: 'paid' }

  if (data.boleto_expires_at && new Date(data.boleto_expires_at) < new Date()) {
    return { status: 'expired' }
  }

  return { status: 'waiting_payment' }
}
