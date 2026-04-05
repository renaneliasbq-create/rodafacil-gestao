'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function iniciarJornada(
  plataforma: string | null,
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Bloqueia se já existe jornada ativa (evita duplicatas)
  const { data: existente } = await supabase
    .from('motorista_jornadas')
    .select('id')
    .eq('motorista_id', user.id)
    .in('status', ['rodando', 'pausado'])
    .limit(1)
    .maybeSingle()

  if (existente) return { error: 'jornada_ativa' }

  const agora   = new Date()
  const hojeStr = agora.toISOString().split('T')[0]

  const { error } = await supabase.from('motorista_jornadas').insert({
    motorista_id: user.id,
    data:         hojeStr,
    hora_inicio:  agora.toISOString(),
    plataforma,
    status:       'rodando',
  })

  if (error) return { error: error.message }

  revalidatePath('/motorista-app')
  return { ok: true }
}

export async function pausarJornada(
  jornadaId: string,
  motivo: string | null,
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const agora = new Date().toISOString()

  // Registra a pausa
  const { error: erroPausa } = await supabase.from('motorista_jornada_pausas').insert({
    jornada_id:   jornadaId,
    motorista_id: user.id,
    motivo:       motivo ?? null,
    inicio_pausa: agora,
  })
  if (erroPausa) return { error: erroPausa.message }

  // Atualiza status da jornada
  const { error: erroStatus } = await supabase
    .from('motorista_jornadas')
    .update({ status: 'pausado' })
    .eq('id', jornadaId)
    .eq('motorista_id', user.id)
  if (erroStatus) return { error: erroStatus.message }

  revalidatePath('/motorista-app')
  return { ok: true }
}

export async function retomarJornada(
  jornadaId: string,
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const agora = new Date()

  // Encerra a pausa em aberto (sem fim_pausa)
  const { data: pausaAberta } = await supabase
    .from('motorista_jornada_pausas')
    .select('id, inicio_pausa')
    .eq('jornada_id',   jornadaId)
    .eq('motorista_id', user.id)
    .is('fim_pausa', null)
    .limit(1)
    .maybeSingle()

  if (pausaAberta) {
    const durMinutos = Math.round(
      (agora.getTime() - new Date(pausaAberta.inicio_pausa).getTime()) / 60000
    )
    const { error: erroPausa } = await supabase
      .from('motorista_jornada_pausas')
      .update({ fim_pausa: agora.toISOString(), duracao_minutos: durMinutos })
      .eq('id', pausaAberta.id)
    if (erroPausa) return { error: erroPausa.message }
  }

  // Volta para rodando
  const { error: erroStatus } = await supabase
    .from('motorista_jornadas')
    .update({ status: 'rodando' })
    .eq('id',           jornadaId)
    .eq('motorista_id', user.id)
  if (erroStatus) return { error: erroStatus.message }

  revalidatePath('/motorista-app')
  return { ok: true }
}

export async function encerrarJornada(
  jornadaId: string,
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const agora = new Date()

  // 1. Encerra pausa em aberto (caso esteja pausado)
  const { data: pausaAberta } = await supabase
    .from('motorista_jornada_pausas')
    .select('id, inicio_pausa')
    .eq('jornada_id',   jornadaId)
    .eq('motorista_id', user.id)
    .is('fim_pausa', null)
    .limit(1)
    .maybeSingle()

  if (pausaAberta) {
    const durMinutos = Math.round(
      (agora.getTime() - new Date(pausaAberta.inicio_pausa).getTime()) / 60000
    )
    await supabase
      .from('motorista_jornada_pausas')
      .update({ fim_pausa: agora.toISOString(), duracao_minutos: durMinutos })
      .eq('id', pausaAberta.id)
  }

  // 2. Busca hora_inicio para calcular durações
  const { data: jornada } = await supabase
    .from('motorista_jornadas')
    .select('hora_inicio')
    .eq('id',           jornadaId)
    .eq('motorista_id', user.id)
    .single()

  if (!jornada) return { error: 'Jornada não encontrada' }

  // 3. Soma todas as pausas encerradas
  const { data: todasPausas } = await supabase
    .from('motorista_jornada_pausas')
    .select('duracao_minutos')
    .eq('jornada_id', jornadaId)

  const duracaoPausasMin  = (todasPausas ?? []).reduce((s, p) => s + (p.duracao_minutos ?? 0), 0)
  const duracaoTotalMin   = Math.round((agora.getTime() - new Date(jornada.hora_inicio).getTime()) / 60000)
  const duracaoEfetivaMin = Math.max(0, duracaoTotalMin - duracaoPausasMin)

  // 4. Ganhos e despesas do dia
  const hojeStr = agora.toISOString().split('T')[0]
  const [{ data: ganhosRows }, { data: despesasRows }] = await Promise.all([
    supabase.from('motorista_ganhos').select('valor_liquido').eq('motorista_id', user.id).eq('data', hojeStr),
    supabase.from('motorista_despesas').select('valor').eq('motorista_id', user.id).eq('data', hojeStr),
  ])
  const ganhosTotal   = (ganhosRows   ?? []).reduce((s, r) => s + (r.valor_liquido ?? 0), 0)
  const despesasTotal = (despesasRows ?? []).reduce((s, r) => s + (r.valor         ?? 0), 0)

  // 5. Atualiza jornada como encerrada
  const { error } = await supabase
    .from('motorista_jornadas')
    .update({
      status:                  'encerrada',
      hora_fim:                agora.toISOString(),
      duracao_total_minutos:   duracaoTotalMin,
      duracao_efetiva_minutos: duracaoEfetivaMin,
      duracao_pausas_minutos:  duracaoPausasMin,
      ganhos_registrados:      ganhosTotal,
      despesas_registradas:    despesasTotal,
      lucro_jornada:           ganhosTotal - despesasTotal,
    })
    .eq('id',           jornadaId)
    .eq('motorista_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/motorista-app')
  return { ok: true }
}
