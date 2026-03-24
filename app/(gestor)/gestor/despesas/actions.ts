'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export type FormState = { error?: string } | null

const despesaSchema = z.object({
  categoria:   z.enum(['manutencao', 'emplacamento', 'ipva', 'seguro', 'multa', 'combustivel', 'administrativa', 'outro']),
  valor:       z.coerce.number().positive('Valor inválido'),
  data:        z.string().min(1, 'Data obrigatória'),
  descricao:   z.string().optional(),
  veiculo_id:  z.string().optional(),
  motorista_id: z.string().optional(),
})

export async function criarDespesa(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = despesaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: despesa, error } = await supabase.from('despesas').insert({
    ...parsed.data,
    descricao: parsed.data.descricao || null,
    veiculo_id: parsed.data.veiculo_id || null,
    motorista_id: parsed.data.motorista_id || null,
    created_by: user?.id ?? null,
  }).select('id').single()

  if (error) return { error: 'Erro ao registrar despesa.' }

  // Parcelamento de multa
  const parcelar = formData.get('parcelar') === 'true'
  const nParcelas = parseInt(formData.get('n_parcelas') as string)
  const primeiraParcela = formData.get('primeira_parcela') as string

  if (parsed.data.categoria === 'multa' && parcelar && nParcelas >= 2 && primeiraParcela) {
    const valorParcela = Math.round((parsed.data.valor / nParcelas) * 100) / 100
    const parcelas = []
    for (let i = 0; i < nParcelas; i++) {
      const dt = new Date(primeiraParcela + 'T12:00:00')
      dt.setDate(dt.getDate() + i * 7)
      parcelas.push({
        despesa_id: despesa.id,
        numero: i + 1,
        valor: i < nParcelas - 1 ? valorParcela : Math.round((parsed.data.valor - valorParcela * (nParcelas - 1)) * 100) / 100,
        data_vencimento: dt.toISOString().split('T')[0],
      })
    }
    await supabase.from('multa_parcelas').insert(parcelas)
  }

  revalidatePath('/gestor/despesas')
  revalidatePath('/gestor/relatorios')
  return null
}

export async function marcarParcelaPaga(parcelaId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('multa_parcelas')
    .update({ pago_em: new Date().toISOString().split('T')[0] })
    .eq('id', parcelaId)
  revalidatePath('/gestor/despesas')
}

export async function desmarcarParcelaPaga(parcelaId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('multa_parcelas')
    .update({ pago_em: null })
    .eq('id', parcelaId)
  revalidatePath('/gestor/despesas')
}

export async function salvarComprovanteDespesa(id: string, url: string, path: string): Promise<FormState> {
  const supabase = createClient()
  const { error } = await supabase.from('despesas').update({ comprovante_url: url, comprovante_path: path }).eq('id', id)
  if (error) return { error: 'Erro ao salvar comprovante.' }
  revalidatePath('/gestor/despesas')
  revalidatePath('/gestor/empresa')
  return null
}

export async function deletarComprovanteDespesa(id: string, path: string): Promise<void> {
  const supabase = createClient()
  if (path) await supabase.storage.from('comprovantes').remove([path])
  await supabase.from('despesas').update({ comprovante_url: null, comprovante_path: null }).eq('id', id)
  revalidatePath('/gestor/despesas')
  revalidatePath('/gestor/empresa')
}

export async function deletarDespesa(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('despesas').delete().eq('id', id)
  revalidatePath('/gestor/despesas')
  revalidatePath('/gestor/relatorios')
}

export async function editarDespesa(id: string, formData: FormData): Promise<FormState> {
  const parsed = despesaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()
  const { error } = await supabase.from('despesas').update({
    ...parsed.data,
    descricao: parsed.data.descricao || null,
    veiculo_id: parsed.data.veiculo_id || null,
    motorista_id: parsed.data.motorista_id || null,
  }).eq('id', id)

  if (error) return { error: 'Erro ao atualizar despesa.' }
  revalidatePath('/gestor/despesas')
  revalidatePath('/gestor/relatorios')
  return null
}
