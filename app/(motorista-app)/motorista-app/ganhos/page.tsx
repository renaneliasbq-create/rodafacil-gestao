import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrendingUp, Calendar } from 'lucide-react'
import { BtnRegistrarGanho, BtnDeletarGanho, FiltroPlatforma, NavMes } from './ganhos-client'
import { BtnImportarExtrato } from './importar-extrato-modal'
import { BtnHistoricoImportacoes } from './historico-importacoes'
import { BADGE, fmt, labelPlataforma } from './ganhos-shared'
import { GanhosWeeklyChart } from './ganhos-weekly-chart'
import { GanhosMetaCard } from './ganhos-meta-card'

const FULL_DAY_NAMES = [
  'domingo', 'segunda-feira', 'terça-feira',
  'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado',
]

export default async function GanhosPage({
  searchParams,
}: {
  searchParams: { p?: string; mes?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // ── Período — two-phase: se não há ?mes, vai para o mês mais recente com dados ──
  const hoje = new Date()
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

  if (!searchParams.mes) {
    const inicioMesAtual = `${mesAtual}-01`
    const { data: ganhoAtual } = await supabase
      .from('motorista_ganhos')
      .select('data')
      .eq('motorista_id', user.id)
      .gte('data', inicioMesAtual)
      .limit(1)
      .maybeSingle()

    if (!ganhoAtual) {
      const { data: maisRecente } = await supabase
        .from('motorista_ganhos')
        .select('data')
        .eq('motorista_id', user.id)
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (maisRecente?.data) {
        const mesRedirect = maisRecente.data.slice(0, 7)
        redirect(`/motorista-app/ganhos?mes=${mesRedirect}`)
      }
    }
  }

  const [anoStr, mesStr] = (
    searchParams.mes ?? mesAtual
  ).split('-')
  const ano = parseInt(anoStr)
  const mes = parseInt(mesStr)
  const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`
  const fimMes    = new Date(ano, mes, 0).toISOString().split('T')[0]
  const daysInMonth = new Date(ano, mes, 0).getDate()
  const mesLabel  = new Date(ano, mes - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
  const mesNome   = new Date(ano, mes - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long' })

  // Mês anterior
  const prevMes   = mes === 1 ? 12 : mes - 1
  const prevAno   = mes === 1 ? ano - 1 : ano
  const prevInicio = `${prevAno}-${String(prevMes).padStart(2, '0')}-01`
  const prevFim    = new Date(prevAno, prevMes, 0).toISOString().split('T')[0]
  const prevMesLabel = new Date(prevAno, prevMes - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long' })

  const filtroPlat = searchParams.p ?? null

  // ── Queries paralelas ────────────────────────────────────────────
  const [
    { data: todosRaw },
    { data: lista },
    { data: prevRaw },
    { data: metaRaw },
  ] = await Promise.all([
    supabase.from('motorista_ganhos')
      .select('data, plataforma, valor_bruto, valor_liquido, horas_trabalhadas')
      .eq('motorista_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes),

    supabase.from('motorista_ganhos')
      .select('id, data, plataforma, valor_bruto, valor_liquido, horas_trabalhadas')
      .eq('motorista_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .order('data', { ascending: false }),

    supabase.from('motorista_ganhos')
      .select('valor_liquido')
      .eq('motorista_id', user.id)
      .gte('data', prevInicio)
      .lte('data', prevFim),

    supabase.from('motorista_metas')
      .select('valor_meta')
      .eq('motorista_id', user.id)
      .eq('mes', mes)
      .eq('ano', ano)
      .maybeSingle(),
  ])

  const all  = todosRaw ?? []
  const listaFiltrada = (lista ?? []).filter(g => !filtroPlat || g.plataforma === filtroPlat)

  // ── Totais ───────────────────────────────────────────────────────
  const totalBruto = all.reduce((s, g) => s + (g.valor_bruto   ?? 0), 0)
  const totalLiq   = all.reduce((s, g) => s + (g.valor_liquido ?? 0), 0)
  const totalHoras = all.reduce((s, g) => s + (g.horas_trabalhadas ?? 0), 0)
  const ganhoPorHora = totalHoras > 0 ? totalLiq / totalHoras : 0
  const taxaMedia    = totalBruto > 0 ? (totalBruto - totalLiq) / totalBruto * 100 : 0

  // ── Comparativo mês anterior ─────────────────────────────────────
  const prevTotalLiq = (prevRaw ?? []).reduce((s, g) => s + (g.valor_liquido ?? 0), 0)
  const hasPrev      = (prevRaw ?? []).length > 0
  const diff         = totalLiq - prevTotalLiq

  // ── Dias trabalhados ─────────────────────────────────────────────
  const workingDays = new Set(all.filter(g => g.data).map(g => g.data)).size
  let businessDays  = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(ano, mes - 1, d).getDay()
    if (dow !== 0 && dow !== 6) businessDays++
  }

  // ── Gráfico semanal ──────────────────────────────────────────────
  const semanas = [
    { semana: 'Sem 1', ganho: 0 },
    { semana: 'Sem 2', ganho: 0 },
    { semana: 'Sem 3', ganho: 0 },
    { semana: 'Sem 4', ganho: 0 },
  ]
  for (const g of all) {
    if (!g.data) continue
    const day = parseInt(g.data.split('-')[2])
    const idx = Math.min(Math.floor((day - 1) / 7), 3)
    semanas[idx].ganho += g.valor_liquido ?? 0
  }

  // ── Melhor dia da semana ─────────────────────────────────────────
  const dayTotals: Record<number, { sum: number; count: number }> = {}
  for (const g of all) {
    if (!g.data) continue
    const dow = new Date(g.data + 'T12:00:00').getDay()
    if (!dayTotals[dow]) dayTotals[dow] = { sum: 0, count: 0 }
    dayTotals[dow].sum   += g.valor_liquido ?? 0
    dayTotals[dow].count += 1
  }
  let bestDow = -1, bestAvg = 0
  for (const [dow, d] of Object.entries(dayTotals)) {
    const avg = d.sum / d.count
    if (avg > bestAvg) { bestAvg = avg; bestDow = parseInt(dow) }
  }
  const bestDay = bestDow >= 0
    ? { nome: FULL_DAY_NAMES[bestDow], media: bestAvg }
    : null

  // ── Projeção ─────────────────────────────────────────────────────
  const isCurrentMonth = ano === hoje.getFullYear() && mes === hoje.getMonth() + 1
  const dayOfMonth     = hoje.getDate()
  const daysRemaining  = daysInMonth - dayOfMonth
  const avgPerDay      = workingDays > 0 ? totalLiq / workingDays : 0
  const projection     = isCurrentMonth && workingDays > 0
    ? totalLiq + avgPerDay * daysRemaining
    : null

  // ── Plataformas + R$/hora ────────────────────────────────────────
  const plataformas = [...new Set(all.map(g => g.plataforma).filter(Boolean))] as string[]
  const phByPlat: Record<string, number> = {}
  for (const p of plataformas) {
    const gP    = all.filter(g => g.plataforma === p)
    const liqP  = gP.reduce((s, g) => s + (g.valor_liquido ?? 0), 0)
    const hrsP  = gP.reduce((s, g) => s + (g.horas_trabalhadas ?? 0), 0)
    if (hrsP > 0) phByPlat[p] = liqP / hrsP
  }
  const bestPhPlat = Object.keys(phByPlat).length > 1
    ? Object.entries(phByPlat).reduce((a, b) => a[1] > b[1] ? a : b)[0]
    : null

  // ── Meta ─────────────────────────────────────────────────────────
  const metaValor = metaRaw?.valor_meta ? Number(metaRaw.valor_meta) : null

  // ── Agrupa lista por data ────────────────────────────────────────
  const porData: Record<string, typeof listaFiltrada> = {}
  for (const g of listaFiltrada) {
    const key = g.data
    if (!porData[key]) porData[key] = []
    porData[key].push(g)
  }
  const datas = Object.keys(porData).sort((a, b) => b.localeCompare(a))

  return (
    <div className="pb-6">

      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Ganhos</h1>
          <NavMes mes={mes} ano={ano} label={mesLabel} />
        </div>
        <div className="flex items-center gap-2">
          <BtnHistoricoImportacoes />
          <BtnImportarExtrato />
          <BtnRegistrarGanho />
        </div>
      </div>

      {/* ── Card verde de resumo ── */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-4 shadow-lg shadow-emerald-200">
          <p className="text-emerald-100 text-xs font-medium mb-1">Ganho líquido total</p>
          <p className="text-3xl font-extrabold text-white mb-1">
            {totalLiq > 0 ? fmt(totalLiq) : 'R$ —'}
          </p>

          {/* Comparativo mês anterior */}
          {hasPrev && totalLiq > 0 && (
            <p className={`text-xs font-medium mb-3 ${diff >= 0 ? 'text-emerald-200' : 'text-red-300'}`}>
              {diff >= 0 ? '↑' : '↓'} {fmt(Math.abs(diff))} {diff >= 0 ? 'acima' : 'abaixo'} de {prevMesLabel}
            </p>
          )}
          {(!hasPrev || totalLiq === 0) && <div className="mb-3" />}

          {/* 4 mini-cards em 2×2 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/15 rounded-xl px-2 py-2 text-center">
              <p className="text-emerald-100 text-[10px] font-medium">Bruto</p>
              <p className="text-white font-bold text-sm">{totalBruto > 0 ? fmt(totalBruto) : '—'}</p>
            </div>
            <div className="bg-white/15 rounded-xl px-2 py-2 text-center">
              <p className="text-emerald-100 text-[10px] font-medium">Por hora</p>
              <p className="text-white font-bold text-sm">{ganhoPorHora > 0 ? fmt(ganhoPorHora) : '—'}</p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="bg-white/15 rounded-xl px-2 py-2 text-center">
                <p className="text-emerald-100 text-[10px] font-medium">Taxa média</p>
                <p className="text-white font-bold text-sm">{taxaMedia > 0 ? `${taxaMedia.toFixed(1)}%` : '—'}</p>
              </div>
              {taxaMedia > 0 && (
                <p className="text-emerald-100/70 text-[10px] text-center leading-snug">
                  % do bruto retida pelas plataformas. Quanto menor, melhor.
                </p>
              )}
            </div>
            <div className="bg-white/15 rounded-xl px-2 py-2 text-center">
              <p className="text-emerald-100 text-[10px] font-medium">Dias trabalhados</p>
              <p className="text-white font-bold text-sm">{workingDays > 0 ? `${workingDays}d` : '—'}</p>
              {workingDays > 0 && (
                <p className="text-emerald-100/60 text-[9px] leading-tight mt-0.5">
                  de {businessDays} úteis em {mesNome}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Gráfico semanal ── */}
      <div className="px-4 mb-4">
        <div className="bg-white border border-gray-100 rounded-2xl px-3 py-3 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Evolução semanal
          </p>
          <GanhosWeeklyChart data={semanas} />
        </div>
      </div>

      {/* ── Meta mensal ── */}
      <div className="px-4 mb-4">
        {metaValor === null ? (
          <GanhosMetaCard meta={null} totalLiq={totalLiq} mes={mes} ano={ano} />
        ) : (
          <GanhosMetaCard meta={metaValor} totalLiq={totalLiq} mes={mes} ano={ano} />
        )}
      </div>

      {/* ── Melhor dia da semana ── */}
      {bestDay && (
        <div className="px-4 mb-4">
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 leading-tight">
                Melhor dia: {bestDay.nome}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {fmt(bestDay.media)} de média neste mês
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Por plataforma (com R$/hora) ── */}
      {plataformas.length > 1 && (
        <div className="px-4 mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Por plataforma
          </p>
          <div className="grid grid-cols-2 gap-2">
            {plataformas.map(p => {
              const gP   = all.filter(g => g.plataforma === p)
              const liqP = gP.reduce((s, g) => s + (g.valor_liquido ?? 0), 0)
              const pct  = totalLiq > 0 ? (liqP / totalLiq * 100) : 0
              const phP  = phByPlat[p]
              const isBest = bestPhPlat === p
              return (
                <div key={p} className="bg-white border border-gray-100 rounded-2xl px-3 py-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE[p] ?? 'bg-gray-400 text-white'}`}>
                      {labelPlataforma(p)}
                    </span>
                    <span className="text-xs text-gray-400">{gP.length}x</span>
                  </div>
                  <p className="text-base font-extrabold text-gray-900">{fmt(liqP)}</p>
                  {phP != null && (
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(phP)}/h</p>
                  )}
                  {isBest && phP != null && (
                    <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Mais rentável
                    </span>
                  )}
                  <div className="h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Projeção do mês ── */}
      {projection !== null && projection > 0 && (
        <div className="px-4 mb-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3.5">
            <p className="text-sm font-bold text-emerald-800 leading-tight">
              📈 No ritmo atual, você fecha {mesNome} com {fmt(projection)}
            </p>
            <p className="text-xs text-emerald-600/80 mt-1">
              Baseado nos seus {workingDays} dia{workingDays !== 1 ? 's' : ''} trabalhados
            </p>
          </div>
        </div>
      )}

      {/* ── Filtro + lista ── */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {listaFiltrada.length} registro{listaFiltrada.length !== 1 ? 's' : ''}
            {filtroPlat ? ` · ${filtroPlat}` : ''}
          </p>
          {plataformas.length > 0 && (
            <FiltroPlatforma plataformas={plataformas} atual={filtroPlat} />
          )}
        </div>

        {listaFiltrada.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {filtroPlat ? `Nenhum ganho de ${filtroPlat}` : 'Nenhum ganho registrado'}
            </p>
            <p className="text-xs text-gray-400">Toque em "Registrar" para adicionar.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {datas.map(data => (
              <div key={data}>
                <p className="text-xs font-semibold text-gray-400 mb-2">
                  {new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'short', day: '2-digit', month: 'short',
                  }).replace(/^\w/, c => c.toUpperCase())}
                </p>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {porData[data].map(g => (
                    <div key={g.id} className="flex items-center gap-3 px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${BADGE[g.plataforma] ?? 'bg-gray-400 text-white'}`}>
                        {labelPlataforma(g.plataforma)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-emerald-700">+{fmt(g.valor_liquido ?? 0)}</p>
                        <p className="text-xs text-gray-400">
                          Bruto: {fmt(g.valor_bruto ?? 0)}
                          {g.horas_trabalhadas ? ` · ${g.horas_trabalhadas}h` : ''}
                        </p>
                      </div>
                      <BtnDeletarGanho id={g.id} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
