'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export type FormState = { error?: string } | null

const pagamentoSchema = z.object({
  motorista_id:    z.string().uuid('Motorista obrigatório'),
  contrato_id:     z.string().uuid('Contrato obrigatório'),
  valor:           z.coerce.number().positive('Valor inválido'),
  data_vencimento: z.string().min(1, 'Data obrigatória'),
  referencia:      z.string().optional(),
  observacao:      z.string().optional(),
})

export async function criarPagamento(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = pagamentoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()
  const { error } = await supabase.from('pagamentos').insert({
    ...parsed.data,
    status: 'pendente',
    referencia: parsed.data.referencia || null,
    observacao: parsed.data.observacao || null,
  })

  if (error) return { error: 'Erro ao criar lançamento.' }
  redirect('/gestor/receitas?ok=1')
}

const marcarPagoSchema = z.object({
  id:               z.string().uuid(),
  data_pagamento:   z.string().min(1),
  forma_pagamento:  z.enum(['pix', 'boleto', 'dinheiro', 'transferencia']),
})

export async function marcarPago(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = marcarPagoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()

  // Busca o pagamento atual para ter contrato_id e data_vencimento
  const { data: pagamento } = await supabase
    .from('pagamentos')
    .select('contrato_id, motorista_id, data_vencimento, valor')
    .eq('id', parsed.data.id)
    .single()

  // Marca como pago
  const { error } = await supabase.from('pagamentos').update({
    status: 'pago',
    data_pagamento: parsed.data.data_pagamento,
    forma_pagamento: parsed.data.forma_pagamento,
  }).eq('id', parsed.data.id)

  if (error) return { error: 'Erro ao atualizar pagamento.' }

  // Auto-gera o próximo pagamento com base na periodicidade do contrato
  if (pagamento?.contrato_id && pagamento?.data_vencimento) {
    const { data: contrato } = await supabase
      .from('contratos')
      .select('status, periodicidade, valor_aluguel, data_fim')
      .eq('id', pagamento.contrato_id)
      .single()

    if (contrato?.status === 'ativo') {
      const atual = new Date(pagamento.data_vencimento + 'T12:00:00')
      let proxima: Date

      if (contrato.periodicidade === 'semanal') {
        proxima = new Date(atual.getTime() + 7 * 86_400_000)
      } else if (contrato.periodicidade === 'quinzenal') {
        proxima = new Date(atual.getTime() + 14 * 86_400_000)
      } else {
        // mensal
        proxima = new Date(atual.getFullYear(), atual.getMonth() + 1, atual.getDate())
      }

      const proximaStr = proxima.toISOString().split('T')[0]

      // Só cria se não ultrapassar data_fim e não existir pagamento duplicado
      const dentroPrazo = !contrato.data_fim || proximaStr <= contrato.data_fim
      if (dentroPrazo) {
        const { data: existente } = await supabase
          .from('pagamentos')
          .select('id')
          .eq('contrato_id', pagamento.contrato_id)
          .eq('data_vencimento', proximaStr)
          .maybeSingle()

        if (!existente) {
          await supabase.from('pagamentos').insert({
            contrato_id:    pagamento.contrato_id,
            motorista_id:   pagamento.motorista_id,
            valor:          contrato.valor_aluguel,
            data_vencimento: proximaStr,
            status:         'pendente',
          })
        }
      }
    }
  }

  redirect('/gestor/receitas?pago=1')
}

export async function deletarPagamento(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('pagamentos').delete().eq('id', id)
  revalidatePath('/gestor/receitas')
}

export async function salvarComprovante(id: string, url: string, path: string): Promise<FormState> {
  const supabase = createClient()
  const { error } = await supabase.from('pagamentos').update({
    comprovante_url: url,
    comprovante_path: path,
  }).eq('id', id)
  if (error) return { error: 'Erro ao salvar comprovante.' }
  revalidatePath('/gestor/receitas')
  return null
}

export async function deletarComprovante(id: string, path: string): Promise<void> {
  const supabase = createClient()
  if (path) await supabase.storage.from('comprovantes').remove([path])
  await supabase.from('pagamentos').update({ comprovante_url: null, comprovante_path: null }).eq('id', id)
  revalidatePath('/gestor/receitas')
}

export async function editarPagamento(id: string, formData: FormData): Promise<FormState> {
  const schema = z.object({
    valor: z.coerce.number().positive('Valor inválido'),
    data_vencimento: z.string().min(1, 'Data obrigatória'),
    referencia: z.string().optional(),
    status: z.enum(['pendente', 'pago', 'atrasado']),
  })
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()
  const { error } = await supabase.from('pagamentos').update({
    valor: parsed.data.valor,
    data_vencimento: parsed.data.data_vencimento,
    referencia: parsed.data.referencia || null,
    status: parsed.data.status,
  }).eq('id', id)

  if (error) return { error: 'Erro ao atualizar lançamento.' }
  revalidatePath('/gestor/receitas')
  return null
}
