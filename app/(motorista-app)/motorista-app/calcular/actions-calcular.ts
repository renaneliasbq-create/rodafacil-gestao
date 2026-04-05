'use server'

import { createClient } from '@/lib/supabase/server'

/* ── Tipo do contexto enviado ao Claude ──────────────────────────── */
export interface ContextoMotorista {
  // Ganho médio por hora — por plataforma (últimos 30 dias)
  ganhoPorHora: Record<string, number>
  // Média de ganho líquido por dia da semana (0=dom … 6=sab)
  mediaPorDiaSemana: Record<number, number>
  // Ganho médio por HORA por dia da semana (últimos 90 dias)
  ganhoPorHoraPorDia: Record<number, number>
  // Quantas sessões (dias distintos) por dia da semana
  contagemPorDia: Record<number, number>
  // Melhor plataforma (maior ganho/h) por dia da semana
  melhorPlataformaPorDia: Record<number, string>
  // Turnos por dia da semana, ordenados do mais rentável para o menos
  turnosPorDia: Record<number, TurnoInfo[]>
  // Despesa média por dia trabalhado
  despesaMediaDia: number
  // KM médio rodado por hora
  kmPorHora: number | null
  // Tipo de combustível do veículo
  tipoCombustivel: string | null
  // Dias com registros de ganho (histórico total)
  diasHistorico: number
  // Contexto temporal (servidor, sem timezone drift no cliente)
  diaSemana: string   // ex: "terça-feira"
  horaAtual: string   // ex: "14:32"
  dataHoje: string    // ex: "2026-03-24"
  // Média projetada para hoje (baseada no dia da semana)
  mediaGanhoHoje: number | null
  // Preço aproximado do combustível (última despesa com categoria combustivel)
  precoCombustivelRef: number | null
}

const DIAS = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado']

export interface TurnoInfo {
  id: 'manha' | 'tarde' | 'noite' | 'madrugada'
  label: string
  emoji: string
  inicio: number   // hora inclusive
  fim: number      // hora exclusive
  ganhoMedioHora: number
  count: number    // corridas com hora_inicio neste turno
}

const TURNOS: Omit<TurnoInfo, 'ganhoMedioHora' | 'count'>[] = [
  { id: 'manha',     label: 'Manhã',     emoji: '🌅', inicio: 6,  fim: 12 },
  { id: 'tarde',     label: 'Tarde',     emoji: '☀️', inicio: 12, fim: 18 },
  { id: 'noite',     label: 'Noite',     emoji: '🌆', inicio: 18, fim: 24 },
  { id: 'madrugada', label: 'Madrugada', emoji: '🌙', inicio: 0,  fim: 6  },
]

function turnoDeHora(h: number): typeof TURNOS[number] | null {
  return TURNOS.find(t => h >= t.inicio && h < t.fim) ?? null
}

export async function buscarContextoMotorista(): Promise<ContextoMotorista> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const agora   = new Date()
  const dataHoje   = agora.toISOString().split('T')[0]
  const diaSemana  = DIAS[agora.getDay()]
  const horaAtual  = `${String(agora.getHours()).padStart(2,'0')}:${String(agora.getMinutes()).padStart(2,'0')}`

  const vazio: ContextoMotorista = {
    ganhoPorHora: {}, mediaPorDiaSemana: {}, ganhoPorHoraPorDia: {},
    contagemPorDia: {}, melhorPlataformaPorDia: {}, turnosPorDia: {},
    despesaMediaDia: 0, kmPorHora: null, tipoCombustivel: null,
    diasHistorico: 0, diaSemana, horaAtual, dataHoje,
    mediaGanhoHoje: null, precoCombustivelRef: null,
  }

  if (!user) return vazio

  // ── Datas de corte ───────────────────────────────────────────────
  const corte30 = new Date(agora)
  corte30.setDate(corte30.getDate() - 30)
  const dataCorte = corte30.toISOString().split('T')[0]

  const corte90 = new Date(agora)
  corte90.setDate(corte90.getDate() - 90)
  const dataCorte90 = corte90.toISOString().split('T')[0]

  // ── Queries paralelas ────────────────────────────────────────────
  const [
    { data: ganhos },
    { data: ganhos90 },
    { data: despesas },
    { data: kmRows },
    { data: veiculo },
    { data: combustivelRows },
  ] = await Promise.all([
    supabase
      .from('motorista_ganhos')
      .select('data, plataforma, valor_liquido, horas_trabalhadas')
      .eq('motorista_id', user.id)
      .gte('data', dataCorte)
      .order('data', { ascending: false }),

    // Janela estendida de 90 dias para análise por dia da semana e turnos
    supabase
      .from('motorista_ganhos')
      .select('data, plataforma, valor_liquido, horas_trabalhadas, hora_inicio')
      .eq('motorista_id', user.id)
      .gte('data', dataCorte90),

    supabase
      .from('motorista_despesas')
      .select('data, valor, categoria')
      .eq('motorista_id', user.id)
      .gte('data', dataCorte),

    supabase
      .from('motorista_quilometragem')
      .select('data, km_total')
      .eq('motorista_id', user.id)
      .gte('data', dataCorte),

    supabase
      .from('motorista_veiculo')
      .select('tipo_combustivel')
      .eq('motorista_id', user.id)
      .maybeSingle(),

    supabase
      .from('motorista_despesas')
      .select('valor, data')
      .eq('motorista_id', user.id)
      .eq('categoria', 'combustivel')
      .order('data', { ascending: false })
      .limit(3),
  ])

  const g   = ganhos    ?? []
  const g90 = ganhos90  ?? []
  const d   = despesas  ?? []
  const k   = kmRows    ?? []

  // ── Ganho por hora por plataforma ────────────────────────────────
  const porPlat: Record<string, { liq: number; horas: number }> = {}
  for (const row of g) {
    const p = row.plataforma ?? 'outro'
    if (!porPlat[p]) porPlat[p] = { liq: 0, horas: 0 }
    porPlat[p].liq   += row.valor_liquido    ?? 0
    porPlat[p].horas += row.horas_trabalhadas ?? 0
  }
  const ganhoPorHora: Record<string, number> = {}
  for (const [p, v] of Object.entries(porPlat)) {
    if (v.horas > 0) ganhoPorHora[p] = Math.round(v.liq / v.horas * 100) / 100
  }

  // ── Média por dia da semana ──────────────────────────────────────
  // Agrupa ganhos por data → soma por dia da semana → divide pelo nº de datas
  const porData: Record<string, number> = {}
  for (const row of g) {
    if (!row.data) continue
    porData[row.data] = (porData[row.data] ?? 0) + (row.valor_liquido ?? 0)
  }
  const somaDS: Record<number, number> = {}
  const contDS: Record<number, number> = {}
  for (const [data, total] of Object.entries(porData)) {
    const dow = new Date(data + 'T12:00:00').getDay()
    somaDS[dow]  = (somaDS[dow]  ?? 0) + total
    contDS[dow]  = (contDS[dow]  ?? 0) + 1
  }
  const mediaPorDiaSemana: Record<number, number> = {}
  for (const dow of Object.keys(somaDS).map(Number)) {
    mediaPorDiaSemana[dow] = Math.round(somaDS[dow] / contDS[dow] * 100) / 100
  }

  // ── Dias com histórico ───────────────────────────────────────────
  const diasHistorico = Object.keys(porData).length

  // ── Despesa média por dia trabalhado ─────────────────────────────
  const totalDesp = d.reduce((s, r) => s + (r.valor ?? 0), 0)
  const despesaMediaDia = diasHistorico > 0
    ? Math.round(totalDesp / diasHistorico * 100) / 100
    : 0

  // ── KM por hora (correlaciona km diário com horas do dia) ────────
  let kmPorHora: number | null = null
  const kmPorDataMap: Record<string, number> = {}
  for (const row of k) {
    if (row.data) kmPorDataMap[row.data] = (kmPorDataMap[row.data] ?? 0) + (row.km_total ?? 0)
  }
  const horasPorData: Record<string, number> = {}
  for (const row of g) {
    if (row.data) horasPorData[row.data] = (horasPorData[row.data] ?? 0) + (row.horas_trabalhadas ?? 0)
  }
  let totalKm = 0, totalHoras = 0
  for (const [data, km] of Object.entries(kmPorDataMap)) {
    const h = horasPorData[data] ?? 0
    totalKm    += km
    totalHoras += h
  }
  if (totalHoras > 0 && totalKm > 0) {
    kmPorHora = Math.round(totalKm / totalHoras * 100) / 100
  }

  // ── Tipo de combustível ──────────────────────────────────────────
  const tipoCombustivel = veiculo?.tipo_combustivel ?? null

  // ── Preço de referência do combustível ───────────────────────────
  // Usa a média das últimas 3 despesas de combustível como proxy de preço
  let precoCombustivelRef: number | null = null
  if (combustivelRows && combustivelRows.length > 0) {
    const media = combustivelRows.reduce((s, r) => s + (r.valor ?? 0), 0) / combustivelRows.length
    if (media > 0) precoCombustivelRef = Math.round(media * 100) / 100
  }

  // ── Análise por dia da semana (90 dias) ─────────────────────────
  // Agrega liq, horas e contagem de datas distintas por dow
  const dowLiq:    Record<number, number>              = {}
  const dowHoras:  Record<number, number>              = {}
  const dowDatas:  Record<number, Set<string>>         = {}
  const dowPlatL:  Record<number, Record<string, number>> = {}
  const dowPlatH:  Record<number, Record<string, number>> = {}

  for (const row of g90) {
    if (!row.data) continue
    const dow  = new Date(row.data + 'T12:00:00').getDay()
    const liq  = row.valor_liquido    ?? 0
    const hrs  = row.horas_trabalhadas ?? 0
    const plat = row.plataforma ?? 'outro'

    dowLiq[dow]   = (dowLiq[dow]   ?? 0) + liq
    dowHoras[dow] = (dowHoras[dow] ?? 0) + hrs

    if (!dowDatas[dow]) dowDatas[dow] = new Set()
    dowDatas[dow].add(row.data)

    if (!dowPlatL[dow]) dowPlatL[dow] = {}
    if (!dowPlatH[dow]) dowPlatH[dow] = {}
    dowPlatL[dow][plat] = (dowPlatL[dow][plat] ?? 0) + liq
    dowPlatH[dow][plat] = (dowPlatH[dow][plat] ?? 0) + hrs
  }

  const ganhoPorHoraPorDia:    Record<number, number> = {}
  const contagemPorDia:        Record<number, number> = {}
  const melhorPlataformaPorDia: Record<number, string> = {}

  for (const dowStr of Object.keys(dowLiq)) {
    const dow   = Number(dowStr)
    const count = dowDatas[dow]?.size ?? 0
    contagemPorDia[dow] = count

    if (dowHoras[dow] > 0) {
      ganhoPorHoraPorDia[dow] = Math.round(dowLiq[dow] / dowHoras[dow] * 100) / 100
    }

    // Melhor plataforma: maior ganho/hora; fallback: maior ganho total
    const platL = dowPlatL[dow] ?? {}
    let bestPlat = '', bestPH = -1
    for (const [plat, liq] of Object.entries(platL)) {
      const hrs = dowPlatH[dow]?.[plat] ?? 0
      const ph  = hrs > 0 ? liq / hrs : liq
      if (ph > bestPH) { bestPH = ph; bestPlat = plat }
    }
    if (bestPlat) melhorPlataformaPorDia[dow] = bestPlat
  }

  // ── Turnos por dia da semana ─────────────────────────────────────
  // Agrupa corridas com hora_inicio por (dow, turno) e calcula ganho médio/hora
  // dow → turnoId → { somaLiq, somaHoras, count }
  const turnoAgg: Record<number, Record<string, { liq: number; horas: number; count: number }>> = {}

  for (const row of g90) {
    if (!row.data || row.hora_inicio == null) continue
    const dow   = new Date(row.data + 'T12:00:00').getDay()
    const turno = turnoDeHora(row.hora_inicio)
    if (!turno) continue

    if (!turnoAgg[dow]) turnoAgg[dow] = {}
    if (!turnoAgg[dow][turno.id]) turnoAgg[dow][turno.id] = { liq: 0, horas: 0, count: 0 }
    turnoAgg[dow][turno.id].liq   += row.valor_liquido    ?? 0
    turnoAgg[dow][turno.id].horas += row.horas_trabalhadas ?? 0
    turnoAgg[dow][turno.id].count += 1
  }

  const turnosPorDia: Record<number, TurnoInfo[]> = {}
  for (const [dowStr, turnos] of Object.entries(turnoAgg)) {
    const dow = Number(dowStr)
    const infos: TurnoInfo[] = []
    for (const [turnoId, agg] of Object.entries(turnos)) {
      const def = TURNOS.find(t => t.id === turnoId)!
      const ganhoMedioHora = agg.horas > 0
        ? Math.round(agg.liq / agg.horas * 100) / 100
        : Math.round(agg.liq / agg.count * 100) / 100
      infos.push({ ...def, ganhoMedioHora, count: agg.count })
    }
    turnosPorDia[dow] = infos.sort((a, b) => b.ganhoMedioHora - a.ganhoMedioHora)
  }

  // ── Projeção para hoje ───────────────────────────────────────────
  const dowHoje        = agora.getDay()
  const mediaGanhoHoje = mediaPorDiaSemana[dowHoje] ?? null

  return {
    ganhoPorHora,
    mediaPorDiaSemana,
    ganhoPorHoraPorDia,
    contagemPorDia,
    melhorPlataformaPorDia,
    despesaMediaDia,
    kmPorHora,
    tipoCombustivel,
    diasHistorico,
    diaSemana,
    horaAtual,
    dataHoje,
    mediaGanhoHoje,
    precoCombustivelRef,
  }
}
