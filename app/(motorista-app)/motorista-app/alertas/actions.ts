'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AlertaState = { error?: string } | null

export async function criarAlerta(
  _prev: AlertaState,
  formData: FormData
): Promise<AlertaState> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const tipo            = formData.get('tipo')            as string
  const descricao       = (formData.get('descricao') as string)?.trim() || null
  const data_vencimento = formData.get('data_vencimento') as string

  if (!tipo)            return { error: 'Selecione o tipo.' }
  if (!data_vencimento) return { error: 'Informe a data de vencimento.' }

  const { error } = await supabase.from('motorista_alertas').insert({
    motorista_id: user.id,
    tipo,
    descricao,
    data_vencimento,
  })

  if (error) return { error: 'Erro ao salvar. Tente novamente.' }

  revalidatePath('/motorista-app/alertas')
  revalidatePath('/motorista-app')
  return null
}

export async function deletarAlerta(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('motorista_alertas').delete().eq('id', id).eq('motorista_id', user.id)

  revalidatePath('/motorista-app/alertas')
  revalidatePath('/motorista-app')
}
