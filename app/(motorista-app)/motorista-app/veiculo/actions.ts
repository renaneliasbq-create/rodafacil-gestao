'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type VeiculoState = { error?: string; success?: boolean } | null

export async function salvarVeiculo(
  _prev: VeiculoState,
  formData: FormData
): Promise<VeiculoState> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const marca            = (formData.get('marca')           as string)?.trim()
  const modelo           = (formData.get('modelo')          as string)?.trim()
  const placa            = (formData.get('placa')           as string)?.trim().toUpperCase()
  const anoStr           = formData.get('ano')              as string
  const cor              = (formData.get('cor')             as string)?.trim() || null
  const tipo_combustivel = formData.get('tipo_combustivel') as string
  const valorStr         = formData.get('valor_compra')     as string

  if (!marca)            return { error: 'Informe a marca.' }
  if (!modelo)           return { error: 'Informe o modelo.' }
  if (!placa)            return { error: 'Informe a placa.' }
  if (!tipo_combustivel) return { error: 'Selecione o combustível.' }

  const ano = parseInt(anoStr, 10)
  if (isNaN(ano) || ano < 1990 || ano > new Date().getFullYear() + 1) {
    return { error: 'Informe um ano válido.' }
  }

  const valor_compra = valorStr ? parseFloat(valorStr.replace(',', '.')) : null

  // Verifica se já existe um veículo para este motorista
  const { data: existente } = await supabase
    .from('motorista_veiculo')
    .select('id')
    .eq('motorista_id', user.id)
    .single()

  const payload = { marca, modelo, placa, ano, cor, tipo_combustivel, valor_compra }

  if (existente) {
    await supabase.from('motorista_veiculo').update(payload).eq('id', existente.id)
  } else {
    await supabase.from('motorista_veiculo').insert({ ...payload, motorista_id: user.id })
  }

  revalidatePath('/motorista-app/veiculo')
  revalidatePath('/motorista-app')
  return { success: true }
}
