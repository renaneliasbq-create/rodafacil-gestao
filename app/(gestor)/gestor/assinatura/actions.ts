'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function cancelarAssinatura(): Promise<{ error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('id, status')
    .eq('user_id', user.id)
    .in('status', ['ativa', 'trial'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assinatura) return { error: 'Nenhuma assinatura ativa encontrada.' }

  const { error } = await supabase
    .from('assinaturas')
    .update({
      status:       'cancelada',
      cancelada_em: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    })
    .eq('id', assinatura.id)

  if (error) return { error: 'Erro ao cancelar. Tente novamente.' }

  revalidatePath('/gestor/assinatura')
  revalidatePath('/motorista-app/assinatura')
  return {}
}
