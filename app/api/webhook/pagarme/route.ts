import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateWebhookSignature } from '@/lib/pagarme/webhook'

/* ── tipos do payload Pagar.me ───────────────────────── */
interface PagarmeCharge {
  id: string
  status: string
  payment_method: string
  last_transaction?: {
    status: string
    transaction_type?: string
  }
}

interface PagarmeOrderData {
  id: string
  code?: string
  status: string
  charges?: PagarmeCharge[]
}

interface PagarmeEvent {
  id: string
  type: string
  created_at: string
  data: PagarmeOrderData
}

/* ── helpers ─────────────────────────────────────────── */
function calcularFimPeriodo(periodo: string, inicio: Date): string {
  const d = new Date(inicio)
  if (periodo === 'anual') {
    d.setFullYear(d.getFullYear() + 1)
  } else {
    d.setMonth(d.getMonth() + 1)
  }
  return d.toISOString().split('T')[0]
}

/* ── handler do webhook ──────────────────────────────── */
export async function POST(req: NextRequest) {
  // 1. Lê o body como texto (necessário para validar HMAC)
  const rawBody = await req.text()
  const signature = req.headers.get('x-hub-signature')

  // 2. Valida assinatura
  try {
    if (!validateWebhookSignature(rawBody, signature)) {
      console.warn('[webhook/pagarme] Assinatura inválida')
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }
  } catch (err) {
    console.error('[webhook/pagarme] Erro ao validar assinatura:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }

  // 3. Parse do evento
  let event: PagarmeEvent
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { type, data: orderData } = event

  console.log(`[webhook/pagarme] Evento: ${type} | order: ${orderData?.id}`)

  // 4. Roteamento por tipo de evento
  switch (type) {

    case 'order.paid':
    case 'charge.paid': {
      const orderId = orderData?.id
      if (!orderId) break

      // Busca o pagamento pelo order_id do Pagar.me
      const { data: pagamento } = await supabase
        .from('assinatura_pagamentos')
        .select('id, assinatura_id, status')
        .eq('pagarme_order_id', orderId)
        .maybeSingle()

      if (!pagamento) {
        console.warn(`[webhook/pagarme] Pagamento não encontrado para order ${orderId}`)
        break
      }

      if (pagamento.status === 'paid') {
        console.log(`[webhook/pagarme] Pagamento ${pagamento.id} já estava pago. Ignorando.`)
        break
      }

      const agora = new Date().toISOString()

      // Atualiza pagamento
      await supabase
        .from('assinatura_pagamentos')
        .update({
          status:     'paid',
          pago_em:    agora,
          updated_at: agora,
        })
        .eq('id', pagamento.id)

      // Busca assinatura para calcular período
      const { data: assinatura } = await supabase
        .from('assinaturas')
        .select('id, periodo, status')
        .eq('id', pagamento.assinatura_id)
        .single()

      if (!assinatura) {
        console.error(`[webhook/pagarme] Assinatura ${pagamento.assinatura_id} não encontrada`)
        break
      }

      const hoje = new Date()
      const fimPeriodo = calcularFimPeriodo(assinatura.periodo, hoje)

      // Ativa assinatura
      await supabase
        .from('assinaturas')
        .update({
          status:               'ativa',
          current_period_start: hoje.toISOString().split('T')[0],
          current_period_end:   fimPeriodo,
          updated_at:           agora,
        })
        .eq('id', assinatura.id)

      console.log(`[webhook/pagarme] ✅ Assinatura ${assinatura.id} ativada até ${fimPeriodo}`)
      break
    }

    case 'order.payment_failed':
    case 'charge.payment_failed': {
      const orderId = orderData?.id
      if (!orderId) break

      const { data: pagamento } = await supabase
        .from('assinatura_pagamentos')
        .select('id, assinatura_id')
        .eq('pagarme_order_id', orderId)
        .maybeSingle()

      if (!pagamento) break

      await supabase
        .from('assinatura_pagamentos')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', pagamento.id)

      console.log(`[webhook/pagarme] ❌ Pagamento ${pagamento.id} falhou`)
      break
    }

    case 'order.canceled': {
      const orderId = orderData?.id
      if (!orderId) break

      await supabase
        .from('assinatura_pagamentos')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('pagarme_order_id', orderId)

      break
    }

    case 'subscription.deactivated':
    case 'subscription.canceled': {
      // Para assinaturas recorrentes gerenciadas pelo Pagar.me
      const subId = (orderData as unknown as { id: string })?.id
      if (!subId) break

      await supabase
        .from('assinaturas')
        .update({
          status:       'cancelada',
          cancelada_em: new Date().toISOString(),
          updated_at:   new Date().toISOString(),
        })
        .eq('pagarme_sub_id', subId)

      console.log(`[webhook/pagarme] Assinatura Pagar.me ${subId} cancelada`)
      break
    }

    default:
      console.log(`[webhook/pagarme] Evento não tratado: ${type}`)
  }

  // Sempre responde 200 para o Pagar.me não retentar
  return NextResponse.json({ received: true })
}
