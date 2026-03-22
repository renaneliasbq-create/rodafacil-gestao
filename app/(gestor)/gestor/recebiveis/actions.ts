'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type FormState = { error?: string; success?: boolean } | null

const saqueSchema = z.object({
  valor: z.coerce.number().positive('Valor inválido'),
  data: z.string().min(1, 'Data obrigatória'),
  descricao: z.string().optional(),
})

export async function registrarSaque(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = saqueSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = createClient()
  const { error } = await supabase.from('saques').insert({
    valor: parsed.data.valor,
    data: parsed.data.data,
    descricao: parsed.data.descricao || null,
  })

  if (error) return { error: 'Erro ao registrar saque.' }
  revalidatePath('/gestor/recebiveis')
  return { success: true }
}

export async function deletarSaque(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('saques').delete().eq('id', id)
  revalidatePath('/gestor/recebiveis')
}
