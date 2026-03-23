'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type GanhoState = { error?: string } | null

export async function registrarGanho(
  _prev: GanhoState,
  formData: FormData
): Promise<GanhoState> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const plataforma = formData.get('plataforma') as string
  const data       = formData.get('data')       as string
  const brutaStr   = formData.get('valor_bruto') as string
  const liqStr     = formData.get('valor_liquido') as string
  const horasStr   = formData.get('horas_trabalhadas') as string

  if (!plataforma) return { error: 'Selecione a plataforma.' }
  if (!data)        return { error: 'Informe a data.' }

  const valor_bruto      = parseFloat(brutaStr?.replace(',', '.'))
  const valor_liquido    = parseFloat(liqStr?.replace(',', '.'))
  const horas_trabalhadas = horasStr ? parseFloat(horasStr.replace(',', '.')) : null

  if (isNaN(valor_bruto) || valor_bruto <= 0)   return { error: 'Informe o valor bruto.' }
  if (isNaN(valor_liquido) || valor_liquido < 0) return { error: 'Informe o valor líquido.' }

  const { error } = await supabase.from('motorista_ganhos').insert({
    motorista_id: user.id,
    plataforma,
    data,
    valor_bruto,
    valor_liquido,
    horas_trabalhadas,
  })

  if (error) return { error: 'Erro ao salvar. Tente novamente.' }

  revalidatePath('/motorista-app/ganhos')
  revalidatePath('/motorista-app')
  return null
}

export async function deletarGanho(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('motorista_ganhos').delete().eq('id', id).eq('motorista_id', user.id)

  revalidatePath('/motorista-app/ganhos')
  revalidatePath('/motorista-app')
}
