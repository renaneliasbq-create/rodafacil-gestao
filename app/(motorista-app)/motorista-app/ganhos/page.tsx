import { createClient } from '@/lib/supabase/server'
import { TrendingUp } from 'lucide-react'
import { BtnRegistrarGanho, BtnDeletarGanho, FiltroPlatforma } from './ganhos-client'
import { BADGE, fmt, labelPlataforma } from './ganhos-shared'

export default async function GanhosPage({
  searchParams,
}: {
  searchParams: { p?: string; mes?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Período selecionado (default: mês atual)
  const hoje = new Date()
  const [anoStr, mesStr] = (searchParams.mes ?? `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`).split('-')
  const ano = parseInt(anoStr)
  const mes = parseInt(mesStr)
  const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`
  const fimMes    = new Date(ano, mes, 0).toISOString().split('T')[0]
  const mesLabel  = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())

  const filtroPlat = searchParams.p ?? null

  // Busca todos do período (para stats) e filtrados (para lista)
  const [{ data: todos }, { data: lista }] = await Promise.all([
    supabase.from('motorista_ganhos')
      .select('plataforma, valor_bruto, valor_liquido, horas_trabalhadas')
      .eq('motorista_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes),

    supabase.from('motorista_ganhos')
      .select('id, data, plataforma, valor_bruto, valor_liquido, horas_trabalhadas')
      .eq('motorista_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .order('data', { ascending: false }),
  ])

  const all = todos ?? []
  const listaFiltrada = (lista ?? []).filter(g => !filtroPlat || g.plataforma === filtroPlat)

  // Totais do período
  const totalBruto   = all.reduce((s, g) => s + (g.valor_bruto   ?? 0), 0)
  const totalLiq     = all.reduce((s, g) => s + (g.valor_liquido ?? 0), 0)
  const totalHoras   = all.reduce((s, g) => s + (g.horas_trabalhadas ?? 0), 0)
  const ganhoPorHora = totalHoras > 0 ? totalLiq / totalHoras : 0
  const taxaMedia    = totalBruto > 0 ? ((totalBruto - totalLiq) / totalBruto * 100) : 0

  // Plataformas presentes
  const plataformas = [...new Set(all.map(g => g.plataforma).filter(Boolean))] as string[]

  // Agrupa lista por data
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
          <p className="text-sm text-gray-400 mt-0.5">{mesLabel}</p>
        </div>
        <BtnRegistrarGanho />
      </div>

      {/* ── Cards de resumo ── */}
      <div className="px-4 mb-5">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-4 shadow-lg shadow-emerald-200">
          <p className="text-emerald-100 text-xs font-medium mb-1">Ganho líquido total</p>
          <p className="text-3xl font-extrabold text-white mb-3">{totalLiq > 0 ? fmt(totalLiq) : 'R$ —'}</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/15 rounded-xl px-2 py-2 text-center">
              <p className="text-emerald-100 text-[10px] font-medium">Bruto</p>
              <p className="text-white font-bold text-sm">{totalBruto > 0 ? fmt(totalBruto) : '—'}</p>
            </div>
            <div className="bg-white/15 rounded-xl px-2 py-2 text-center">
              <p className="text-emerald-100 text-[10px] font-medium">Por hora</p>
              <p className="text-white font-bold text-sm">{ganhoPorHora > 0 ? fmt(ganhoPorHora) : '—'}</p>
            </div>
            <div className="bg-white/15 rounded-xl px-2 py-2 text-center">
              <p className="text-emerald-100 text-[10px] font-medium">Taxa média</p>
              <p className="text-white font-bold text-sm">{taxaMedia > 0 ? `${taxaMedia.toFixed(1)}%` : '—'}</p>
            </div>
          </div>
          {taxaMedia > 0 && (
            <p className="text-emerald-100/70 text-[10px] mt-2 text-center leading-snug">
              Taxa média: % do bruto retida pelas plataformas. Quanto menor, mais você ficou do que rodou.
            </p>
          )}
        </div>
      </div>

      {/* ── Por plataforma (mini-cards) ── */}
      {plataformas.length > 1 && (
        <div className="px-4 mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Por plataforma</p>
          <div className="grid grid-cols-2 gap-2">
            {plataformas.map(p => {
              const ganhoP = all.filter(g => g.plataforma === p)
              const liqP   = ganhoP.reduce((s, g) => s + (g.valor_liquido ?? 0), 0)
              const pct    = totalLiq > 0 ? (liqP / totalLiq * 100) : 0
              return (
                <div key={p} className="bg-white border border-gray-100 rounded-2xl px-3 py-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE[p] ?? 'bg-gray-400 text-white'}`}>{labelPlataforma(p)}</span>
                    <span className="text-xs text-gray-400">{ganhoP.length}x</span>
                  </div>
                  <p className="text-base font-extrabold text-gray-900">{fmt(liqP)}</p>
                  <div className="h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
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
          <div className="space-y-4">
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
