import { createClient } from '@/lib/supabase/server'
import { Gauge, TrendingUp, Calendar } from 'lucide-react'
import { BtnRegistrarKm, BtnDeletarKm } from './km-client'

export default async function KmPage({
  searchParams,
}: {
  searchParams: { mes?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Período
  const hoje = new Date()
  const [anoStr, mesStr] = (searchParams.mes ?? `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`).split('-')
  const ano = parseInt(anoStr)
  const mes = parseInt(mesStr)
  const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`
  const fimMes    = new Date(ano, mes, 0).toISOString().split('T')[0]
  const mesLabel  = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())

  const { data: registros } = await supabase
    .from('motorista_quilometragem')
    .select('id, data, km_inicial, km_final, km_total')
    .eq('motorista_id', user.id)
    .gte('data', inicioMes)
    .lte('data', fimMes)
    .order('data', { ascending: false })

  const lista = registros ?? []

  // Stats do mês
  const totalKm    = lista.reduce((s, r) => s + (r.km_total ?? 0), 0)
  const diasRodados = lista.length
  const mediaDiaria = diasRodados > 0 ? totalKm / diasRodados : 0
  const maiorDia    = lista.reduce((max, r) => Math.max(max, r.km_total ?? 0), 0)

  // Último KM final registrado (para sugerir como inicial do próximo)
  const ultimoKmFinal = lista.length > 0
    ? lista.reduce((max, r) => Math.max(max, r.km_final ?? 0), 0)
    : undefined

  // Dias do mês já passados (para calcular % de aproveitamento)
  const diasPassados = mes === hoje.getMonth() + 1 && ano === hoje.getFullYear()
    ? hoje.getDate()
    : new Date(ano, mes, 0).getDate()
  const aproveitamento = diasPassados > 0 ? (diasRodados / diasPassados) * 100 : 0

  // Agrupado por data para o gráfico de barras simplificado
  const maxKmDia = lista.length > 0 ? Math.max(...lista.map(r => r.km_total ?? 0)) : 1

  return (
    <div className="pb-6">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Quilometragem</h1>
          <p className="text-sm text-gray-400 mt-0.5">{mesLabel}</p>
        </div>
        <BtnRegistrarKm kmFinalAnterior={ultimoKmFinal} />
      </div>

      {/* ── Cards de resumo ── */}
      <div className="px-4 mb-5">
        {/* Card principal */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 shadow-lg shadow-blue-200 mb-3">
          <p className="text-blue-100 text-xs font-medium mb-1">Total rodado no mês</p>
          <p className="text-4xl font-extrabold text-white mb-0.5">
            {totalKm > 0 ? totalKm.toLocaleString('pt-BR') : '—'}
          </p>
          {totalKm > 0 && <p className="text-blue-200 text-sm font-medium">quilômetros</p>}
        </div>

        {/* 3 indicadores */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-tight">Dias rodados</p>
            <p className="text-lg font-extrabold text-gray-900">{diasRodados}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-tight">Média/dia</p>
            <p className="text-lg font-extrabold text-gray-900">
              {mediaDiaria > 0 ? `${Math.round(mediaDiaria)}` : '—'}
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-1.5">
              <Gauge className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-tight">Maior dia</p>
            <p className="text-lg font-extrabold text-gray-900">
              {maiorDia > 0 ? maiorDia.toLocaleString('pt-BR') : '—'}
            </p>
          </div>
        </div>

        {/* Barra de aproveitamento do mês */}
        {diasRodados > 0 && (
          <div className="mt-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-gray-500">Dias com registro</p>
              <p className="text-xs font-bold text-blue-600">{diasRodados} de {diasPassados} dias</p>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(aproveitamento, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Gráfico de barras inline ── */}
      {lista.length > 1 && (
        <div className="px-4 mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">KM por dia</p>
          <div className="bg-white border border-gray-100 rounded-2xl px-4 pt-3 pb-2 shadow-sm">
            <div className="flex items-end gap-1.5 h-16">
              {[...lista].reverse().slice(-20).map((r) => {
                const pct = maxKmDia > 0 ? ((r.km_total ?? 0) / maxKmDia) * 100 : 0
                return (
                  <div key={r.id} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="w-full flex items-end justify-center" style={{ height: 52 }}>
                      <div
                        className="w-full bg-blue-400 rounded-t"
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1">Últimos {Math.min(lista.length, 20)} registros</p>
          </div>
        </div>
      )}

      {/* ── Lista ── */}
      <div className="px-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          {lista.length} registro{lista.length !== 1 ? 's' : ''}
        </p>

        {lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
              <Gauge className="w-7 h-7 text-blue-300" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Nenhum registro ainda</p>
            <p className="text-xs text-gray-400 max-w-xs">
              Registre o hodômetro no início e fim de cada dia para acompanhar seus KM rodados.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {lista.map(r => {
              const pct = maxKmDia > 0 ? ((r.km_total ?? 0) / maxKmDia) * 100 : 0
              return (
                <div key={r.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Gauge className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-extrabold text-blue-700">
                          {(r.km_total ?? 0).toLocaleString('pt-BR')} km
                        </p>
                        <BtnDeletarKm id={r.id} />
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'short', day: '2-digit', month: 'short',
                        }).replace(/^\w/, c => c.toUpperCase())}
                        {' · '}
                        {(r.km_inicial ?? 0).toLocaleString('pt-BR')} → {(r.km_final ?? 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  {/* Mini barra */}
                  <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
