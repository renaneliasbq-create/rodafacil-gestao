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

  const { error } = await supabase.from('despesas').insert({
    ...parsed.data,
    descricao: parsed.data.descricao || null,
    veiculo_id: parsed.data.veiculo_id || null,
    motorista_id: parsed.data.motorista_id || null,
    created_by: user?.id ?? null,
  })

  if (error) return { error: 'Erro ao registrar despesa.' }
  revalidatePath('/gestor/despesas')
  revalidatePath('/gestor/relatorios')
  return null
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
