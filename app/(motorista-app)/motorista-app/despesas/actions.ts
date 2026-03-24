'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type DespesaState = { error?: string; success?: boolean } | null

export async function registrarDespesa(
  _prev: DespesaState,
  formData: FormData
): Promise<DespesaState> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const categoria  = formData.get('categoria')  as string
  const data       = formData.get('data')        as string
  const descricao  = (formData.get('descricao') as string)?.trim() || null
  const valorStr   = formData.get('valor')       as string

  if (!categoria) return { error: 'Selecione a categoria.' }
  if (!data)       return { error: 'Informe a data.' }

  const valor = parseFloat(valorStr?.replace(',', '.'))
  if (isNaN(valor) || valor <= 0) return { error: 'Informe o valor.' }

  const { error } = await supabase.from('motorista_despesas').insert({
    motorista_id: user.id,
    categoria,
    data,
    descricao,
    valor,
  })

  if (error) return { error: 'Erro ao salvar. Tente novamente.' }

  revalidatePath('/motorista-app/despesas')
  revalidatePath('/motorista-app')
  return { success: true }
}

export async function deletarDespesa(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('motorista_despesas').delete().eq('id', id).eq('motorista_id', user.id)

  revalidatePath('/motorista-app/despesas')
  revalidatePath('/motorista-app')
}
