'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function definirMeta(mes: string, valor: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('motorista_metas')
    .upsert({ motorista_id: user.id, mes, valor }, { onConflict: 'motorista_id,mes' })

  if (error) return { error: error.message }
  revalidatePath('/motorista-app/relatorios')
  return { ok: true }
}

export async function removerMeta(mes: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  await supabase
    .from('motorista_metas')
    .delete()
    .eq('motorista_id', user.id)
    .eq('mes', mes)

  revalidatePath('/motorista-app/relatorios')
  return { ok: true }
}
