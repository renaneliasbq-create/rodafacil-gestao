'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarVencimento(formData: FormData) {
  const supabase = createClient()

  const tipo            = formData.get('tipo') as string
  const ref_tipo        = formData.get('ref_tipo') as string
  const ref_id          = formData.get('ref_id') as string
  const descricao       = formData.get('descricao') as string | null
  const data_vencimento = formData.get('data_vencimento') as string

  if (!tipo || !ref_tipo || !ref_id || !data_vencimento) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  const { error } = await supabase.from('vencimentos').insert({
    tipo,
    ref_tipo,
    ref_id,
    descricao: descricao || null,
    data_vencimento,
  })

  if (error) return { error: 'Erro ao salvar. Tente novamente.' }

  revalidatePath('/gestor/alertas')
  return null
}

export async function deletarVencimento(id: string) {
  const supabase = createClient()
  await supabase.from('vencimentos').delete().eq('id', id)
  revalidatePath('/gestor/alertas')
}
