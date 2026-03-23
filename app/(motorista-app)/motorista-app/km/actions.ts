'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type KmState = { error?: string } | null

export async function registrarKm(
  _prev: KmState,
  formData: FormData
): Promise<KmState> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const data       = formData.get('data')       as string
  const inicialStr = formData.get('km_inicial') as string
  const finalStr   = formData.get('km_final')   as string

  if (!data) return { error: 'Informe a data.' }

  const km_inicial = parseInt(inicialStr?.replace(/\D/g, ''), 10)
  const km_final   = parseInt(finalStr?.replace(/\D/g, ''), 10)

  if (isNaN(km_inicial) || km_inicial < 0) return { error: 'Informe o KM inicial.' }
  if (isNaN(km_final)   || km_final < 0)   return { error: 'Informe o KM final.' }
  if (km_final <= km_inicial)              return { error: 'KM final deve ser maior que o inicial.' }

  const { error } = await supabase.from('motorista_quilometragem').insert({
    motorista_id: user.id,
    data,
    km_inicial,
    km_final,
  })

  if (error) return { error: 'Erro ao salvar. Tente novamente.' }

  revalidatePath('/motorista-app/km')
  revalidatePath('/motorista-app')
  return null
}

export async function deletarKm(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('motorista_quilometragem').delete().eq('id', id).eq('motorista_id', user.id)

  revalidatePath('/motorista-app/km')
  revalidatePath('/motorista-app')
}
