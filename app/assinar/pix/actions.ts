'use server'

import { createClient } from '@/lib/supabase/server'
import { pagarme } from '@/lib/pagarme/client'
import { getPlano, type PlanoId } from '@/lib/pagarme/plans'

interface PagarmeCharge {
  id: string
  last_transaction: {
    qr_code: string
    qr_code_url: string
  }
}

interface PagarmeOrder {
  id: string
  status: string
  charges: PagarmeCharge[]
}

export interface PixData {
  pagamento_id: string
  order_id: string
  qr_code: string
  qr_code_url: string
  expires_at: string
  valor_centavos: number
}

/**
 * Cria (ou recupera) um pedido PIX para a assinatura.
 * Se já existe um pagamento pendente não-expirado, reutiliza.
 */
export async function criarOuRecuperarPix(assinaturaId: string): Promise<
  { data: PixData } | { error: string }
> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  // Busca assinatura
  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('id, plano, periodo, preco_centavos, status, pagarme_customer_id, user_id')
    .eq('id', assinaturaId)
    .eq('user_id', user.id)
    .single()

  if (!assinatura) return { error: 'Assinatura não encontrada.' }
  if (assinatura.status === 'ativa') return { error: 'Esta assinatura já está ativa.' }

  // Verifica se já tem PIX pendente e válido
  const { data: pagamentoExistente } = await supabase
    .from('assinatura_pagamentos')
    .select('id, pagarme_order_id, pix_qrcode, pix_qrcode_url, pix_expires_at, valor_centavos')
    .eq('assinatura_id', assinaturaId)
    .eq('metodo', 'pix')
    .eq('status', 'waiting_payment')
    .gt('pix_expires_at', new Date().toISOString())
    .maybeSingle()

  if (pagamentoExistente?.pix_qrcode) {
    return {
      data: {
        pagamento_id:   pagamentoExistente.id,
        order_id:       pagamentoExistente.pagarme_order_id!,
        qr_code:        pagamentoExistente.pix_qrcode,
        qr_code_url:    pagamentoExistente.pix_qrcode_url!,
        expires_at:     pagamentoExistente.pix_expires_at!,
        valor_centavos: pagamentoExistente.valor_centavos,
      },
    }
  }

  // Cria novo pedido PIX no Pagar.me
  if (!assinatura.pagarme_customer_id) return { error: 'Cliente Pagar.me não encontrado.' }

  let plano
  try { plano = getPlano(assinatura.plano as PlanoId) } catch { return { error: 'Plano inválido.' } }

  const expires_in = 3600 // 1 hora
  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()
  const mesAtual = new Date().toISOString().slice(0, 7) // ex: "2026-03"

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
          payment_method: 'pix',
          pix: { expires_in },
        },
      ],
    })

    const charge = order.charges?.[0]
    const tx = charge?.last_transaction

    if (!tx?.qr_code) return { error: 'Erro ao gerar QR Code PIX. Tente novamente.' }

    // Salva no banco
    const { data: pagamento, error: dbErr } = await supabase
      .from('assinatura_pagamentos')
      .insert({
        assinatura_id:    assinaturaId,
        user_id:          user.id,
        pagarme_order_id: order.id,
        pagarme_charge_id: charge.id,
        metodo:           'pix',
        status:           'waiting_payment',
        valor_centavos:   assinatura.preco_centavos,
        referencia_mes:   mesAtual,
        pix_qrcode:       tx.qr_code,
        pix_qrcode_url:   tx.qr_code_url,
        pix_expires_at:   expiresAt,
      })
      .select('id')
      .single()

    if (dbErr) return { error: 'Erro ao registrar pagamento.' }

    return {
      data: {
        pagamento_id:   pagamento.id,
        order_id:       order.id,
        qr_code:        tx.qr_code,
        qr_code_url:    tx.qr_code_url,
        expires_at:     expiresAt,
        valor_centavos: assinatura.preco_centavos,
      },
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao criar pagamento PIX.'
    return { error: msg }
  }
}

/**
 * Verifica o status atual do pagamento (usado pelo polling do client).
 * Retorna 'paid', 'waiting_payment', 'failed' ou 'expired'.
 */
export async function verificarStatusPix(pagamentoId: string): Promise<{
  status: 'paid' | 'waiting_payment' | 'failed' | 'expired'
}> {
  const supabase = createClient()

  const { data } = await supabase
    .from('assinatura_pagamentos')
    .select('status, pix_expires_at, assinatura_id')
    .eq('id', pagamentoId)
    .single()

  if (!data) return { status: 'failed' }

  if (data.status === 'paid') return { status: 'paid' }

  if (data.pix_expires_at && new Date(data.pix_expires_at) < new Date()) {
    return { status: 'expired' }
  }

  return { status: data.status as 'waiting_payment' | 'failed' }
}
