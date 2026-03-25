'use server'

import { createClient } from '@/lib/supabase/server'

/* ── Tipo do contexto enviado ao Claude ──────────────────────────── */
export interface ContextoMotorista {
  // Ganho médio por hora — por plataforma (últimos 30 dias)
  ganhoPorHora: Record<string, number>
  // Média de ganho líquido por dia da semana (0=dom … 6=sab)
  mediaPorDiaSemana: Record<number, number>
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

export async function buscarContextoMotorista(): Promise<ContextoMotorista> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const agora   = new Date()
  const dataHoje   = agora.toISOString().split('T')[0]
  const diaSemana  = DIAS[agora.getDay()]
  const horaAtual  = `${String(agora.getHours()).padStart(2,'0')}:${String(agora.getMinutes()).padStart(2,'0')}`

  const vazio: ContextoMotorista = {
    ganhoPorHora: {}, mediaPorDiaSemana: {}, despesaMediaDia: 0,
    kmPorHora: null, tipoCombustivel: null, diasHistorico: 0,
    diaSemana, horaAtual, dataHoje, mediaGanhoHoje: null,
    precoCombustivelRef: null,
  }

  if (!user) return vazio

  // ── Data de corte: 30 dias atrás ────────────────────────────────
  const corte = new Date(agora)
  corte.setDate(corte.getDate() - 30)
  const dataCorte = corte.toISOString().split('T')[0]

  // ── Queries paralelas ────────────────────────────────────────────
  const [
    { data: ganhos },
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

  const g = ganhos    ?? []
  const d = despesas  ?? []
  const k = kmRows    ?? []

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

  // ── Projeção para hoje ───────────────────────────────────────────
  const dowHoje       = agora.getDay()
  const mediaGanhoHoje = mediaPorDiaSemana[dowHoje] ?? null

  return {
    ganhoPorHora,
    mediaPorDiaSemana,
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
