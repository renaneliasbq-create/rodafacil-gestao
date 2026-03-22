'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type FormState = { error?: string } | null

const CATEGORIAS_EMPRESA = ['contador', 'alvara', 'certificado_digital', 'software', 'telefone_internet', 'aluguel', 'imposto', 'bancario', 'outro'] as const

const empresaSchema = z.object({
  categoria:   z.enum(CATEGORIAS_EMPRESA),
  descricao:   z.string().optional(),
  valor:       z.coerce.number().positive('Valor inválido'),
  data:        z.string().min(1, 'Data obrigatória'),
})

export async function criarGastoCnpj(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = empresaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('despesas').insert({
    categoria:   'administrativa',
    descricao:   `[CNPJ] ${parsed.data.categoria}: ${parsed.data.descricao || ''}`.trim(),
    valor:       parsed.data.valor,
    data:        parsed.data.data,
    veiculo_id:  null,
    motorista_id: null,
    created_by:  user?.id ?? null,
  })

  if (error) return { error: 'Erro ao registrar gasto.' }
  revalidatePath('/gestor/empresa')
  revalidatePath('/gestor/relatorios')
  return null
}

export async function deletarGastoCnpj(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('despesas').delete().eq('id', id)
  revalidatePath('/gestor/empresa')
  revalidatePath('/gestor/relatorios')
}

export async function editarGastoCnpj(id: string, formData: FormData): Promise<FormState> {
  const parsed = empresaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()
  const { error } = await supabase.from('despesas').update({
    valor: parsed.data.valor,
    data: parsed.data.data,
    descricao: `[CNPJ] ${parsed.data.categoria}: ${parsed.data.descricao || ''}`.trim(),
  }).eq('id', id)

  if (error) return { error: 'Erro ao atualizar gasto.' }
  revalidatePath('/gestor/empresa')
  revalidatePath('/gestor/relatorios')
  return null
}
