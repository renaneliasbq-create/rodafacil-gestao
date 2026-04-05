import { createClient } from '@/lib/supabase/server'
import { Gauge, TrendingUp, Calendar, Route } from 'lucide-react'
import { parsePeriodo, labelPeriodo } from '../periodo-utils'
import { FiltroPeriodo } from '../filtro-periodo'

/* ── Configuração visual por plataforma ───────────────────────── */
const PLAT: Record<string, { label: string; bg: string; text: string; bar: string }> = {
  uber:    { label: 'Uber',    bg: 'bg-gray-900',   text: 'text-white',      bar: 'bg-gray-800' },
  '99':    { label: '99',      bg: 'bg-yellow-400', text: 'text-yellow-900', bar: 'bg-yellow-400' },
  ifood:   { label: 'iFood',   bg: 'bg-red-500',    text: 'text-white',      bar: 'bg-red-500' },
  indrive: { label: 'InDrive', bg: 'bg-indigo-500', text: 'text-white',      bar: 'bg-indigo-500' },
  outro:   { label: 'Outro',   bg: 'bg-gray-400',   text: 'text-white',      bar: 'bg-gray-400' },
}

function cfg(plat: string) {
  return PLAT[plat] ?? PLAT.outro
}

/* ── Page ─────────────────────────────────────────────────────── */
export default async function KmPage({
  searchParams,
}: {
  searchParams: { mes?: string; de?: string; ate?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Período
  const { de: inicioMes, ate: fimMes } = parsePeriodo({
    de: searchParams.de,
    ate: searchParams.ate,
    mes: searchParams.mes,
  })
  const periodoLabel = labelPeriodo(inicioMes, fimMes)

  // Busca ganhos com km no período
  const { data: ganhos } = await supabase
    .from('motorista_ganhos')
    .select('plataforma, data, km_rodados')
    .eq('motorista_id', user.id)
    .gte('data', inicioMes)
    .lte('data', fimMes)
    .not('km_rodados', 'is', null)
    .order('data', { ascending: false })

  const lista = ganhos ?? []

  // Agrega por plataforma e por dia
  const kmPlat: Record<string, number> = {}
  const kmDia: Record<string, { total: number; plataformas: string[] }> = {}

  for (const g of lista) {
    const km = Number(g.km_rodados ?? 0)
    kmPlat[g.plataforma] = (kmPlat[g.plataforma] ?? 0) + km

    if (!kmDia[g.data]) kmDia[g.data] = { total: 0, plataformas: [] }
    kmDia[g.data].total += km
    if (!kmDia[g.data].plataformas.includes(g.plataforma)) {
      kmDia[g.data].plataformas.push(g.plataforma)
    }
  }

  const totalKm      = Object.values(kmPlat).reduce((s, v) => s + v, 0)
  const diasAtivos   = Object.keys(kmDia).length
  const mediaDiaria  = diasAtivos > 0 ? totalKm / diasAtivos : 0
  const kmPorCorrida = lista.length > 0 ? totalKm / lista.length : 0
  const temDados     = totalKm > 0

  const plataformasOrd = Object.entries(kmPlat).sort((a, b) => b[1] - a[1])
  const diasOrd        = Object.entries(kmDia).sort((a, b) => b[0].localeCompare(a[0]))
  const maxKmDia       = diasOrd.length > 0 ? Math.max(...diasOrd.map(([, d]) => d.total)) : 1

  return (
    <div className="pb-6">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900">Quilometragem</h1>
        <p className="text-sm text-gray-400 mt-0.5">{periodoLabel}</p>
      </div>

      {/* ── Filtro de período ── */}
      <FiltroPeriodo de={inicioMes} ate={fimMes} cor="azul" />

      {/* ── Card principal + stats ── */}
      <div className="px-4 mb-5">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 shadow-lg shadow-blue-200 mb-3">
          <p className="text-blue-100 text-xs font-medium mb-1">Total rodado no período</p>
          <p className="text-4xl font-extrabold text-white mb-0.5">
            {temDados ? Math.round(totalKm).toLocaleString('pt-BR') : '—'}
          </p>
          {temDados && <p className="text-blue-200 text-sm font-medium">quilômetros</p>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-tight">Dias ativos</p>
            <p className="text-lg font-extrabold text-gray-900">{diasAtivos > 0 ? diasAtivos : '—'}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-tight">Média/dia</p>
            <p className="text-lg font-extrabold text-gray-900">
              {mediaDiaria > 0 ? Math.round(mediaDiaria) : '—'}
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-1.5">
              <Route className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-tight">Km/corrida</p>
            <p className="text-lg font-extrabold text-gray-900">
              {kmPorCorrida > 0 ? kmPorCorrida.toFixed(1) : '—'}
            </p>
          </div>
        </div>
      </div>

      {temDados ? (
        <>
          {/* ── Por plataforma ── */}
          <div className="px-4 mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Por plataforma</p>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-50">
              {plataformasOrd.map(([plat, km]) => {
                const c   = cfg(plat)
                const pct = totalKm > 0 ? (km / totalKm) * 100 : 0
                return (
                  <div key={plat} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                          {c.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-gray-900">
                          {Math.round(km).toLocaleString('pt-BR')} km
                        </p>
                        <p className="text-[10px] text-gray-400">{pct.toFixed(0)}% do total</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Por dia ── */}
          <div className="px-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Por dia
            </p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {diasOrd.map(([data, d]) => {
                const pct = maxKmDia > 0 ? (d.total / maxKmDia) * 100 : 0
                return (
                  <div key={data} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Gauge className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-extrabold text-gray-900">
                            {Math.round(d.total).toLocaleString('pt-BR')} km
                          </p>
                          <div className="flex gap-1 flex-shrink-0">
                            {d.plataformas.map(p => {
                              const c = cfg(p)
                              return (
                                <span
                                  key={p}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}
                                >
                                  {c.label}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
                            weekday: 'short', day: '2-digit', month: 'short',
                          }).replace(/^\w/, c => c.toUpperCase())}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        /* ── Empty state ── */
        <div className="px-4">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <Route className="w-8 h-8 text-blue-300" />
            </div>
            <p className="text-sm font-bold text-gray-700 mb-1">Nenhum KM registrado</p>
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
              Os quilômetros são calculados automaticamente ao importar o extrato CSV da Uber ou da 99. Importe seu extrato na aba Ganhos para ver os dados aqui.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
