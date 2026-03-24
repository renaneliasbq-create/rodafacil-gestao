import { createClient } from '@/lib/supabase/server'
import { ArrowUpCircle } from 'lucide-react'
import { BtnRegistrarDespesa, BtnDeletarDespesa, FiltroCategoria } from './despesas-client'
import { getCat, fmt } from './despesas-shared'

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: { cat?: string; mes?: string }
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

  const filtroCat = searchParams.cat ?? null

  const [{ data: todas }, { data: lista }] = await Promise.all([
    supabase.from('motorista_despesas')
      .select('categoria, valor')
      .eq('motorista_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes),

    supabase.from('motorista_despesas')
      .select('id, data, categoria, descricao, valor')
      .eq('motorista_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .order('data', { ascending: false }),
  ])

  const all = todas ?? []
  const listaFiltrada = (lista ?? []).filter(d => !filtroCat || d.categoria === filtroCat)

  // Totais
  const totalGeral = all.reduce((s, d) => s + (d.valor ?? 0), 0)

  // Por categoria (ordenado por valor)
  const porCategoria: Record<string, number> = {}
  for (const d of all) {
    const c = d.categoria ?? 'Outros'
    porCategoria[c] = (porCategoria[c] ?? 0) + (d.valor ?? 0)
  }
  const catsSorted = Object.entries(porCategoria).sort((a, b) => b[1] - a[1])
  const categorias = catsSorted.map(([c]) => c)

  // Agrupa lista por data
  const porData: Record<string, typeof listaFiltrada> = {}
  for (const d of listaFiltrada) {
    if (!porData[d.data]) porData[d.data] = []
    porData[d.data].push(d)
  }
  const datas = Object.keys(porData).sort((a, b) => b.localeCompare(a))

  // Maior categoria para destaque
  const maiorCat = catsSorted[0]

  return (
    <div className="pb-6">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Despesas</h1>
          <p className="text-sm text-gray-400 mt-0.5">{mesLabel}</p>
        </div>
        <BtnRegistrarDespesa />
      </div>

      {/* ── Card resumo ── */}
      <div className="px-4 mb-5">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium mb-1">Total de despesas</p>
          <p className="text-3xl font-extrabold text-gray-900 mb-3">
            {totalGeral > 0 ? fmt(totalGeral) : 'R$ —'}
          </p>

          {catsSorted.length > 0 && (
            <div className="space-y-2">
              {catsSorted.slice(0, 4).map(([cat, valor]) => {
                const pct = totalGeral > 0 ? (valor / totalGeral * 100) : 0
                const info = getCat(cat)
                const Icon = info.icon
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${info.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${info.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-gray-700">{getCat(cat).nome}</span>
                        <span className="text-xs font-bold text-gray-900">{fmt(valor)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: getCat(cat).bar
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">{pct.toFixed(0)}%</span>
                  </div>
                )
              })}
              {catsSorted.length > 4 && (
                <p className="text-xs text-gray-400 text-center pt-1">
                  +{catsSorted.length - 4} categorias
                </p>
              )}
            </div>
          )}

          {maiorCat && totalGeral > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getCat(maiorCat[0]).badge}`}>
                {getCat(maiorCat[0]).nome}
              </span>
              <p className="text-xs text-gray-500">
                representa {(maiorCat[1] / totalGeral * 100).toFixed(0)}% dos gastos
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Filtro + lista ── */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {listaFiltrada.length} registro{listaFiltrada.length !== 1 ? 's' : ''}
            {filtroCat ? ` · ${getCat(filtroCat).nome}` : ''}
          </p>
          {categorias.length > 0 && (
            <FiltroCategoria categorias={categorias} atual={filtroCat} />
          )}
        </div>

        {listaFiltrada.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
              <ArrowUpCircle className="w-7 h-7 text-red-300" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {filtroCat ? `Nenhuma despesa de ${getCat(filtroCat).nome}` : 'Nenhuma despesa registrada'}
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
                  {porData[data].map(d => {
                    const info = getCat(d.categoria)
                    const Icon = info.icon
                    return (
                      <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${info.bg}`}>
                          <Icon className={`w-4 h-4 ${info.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {d.descricao || getCat(d.categoria).nome}
                          </p>
                          {d.descricao && (
                            <p className="text-xs text-gray-400">{getCat(d.categoria).nome}</p>
                          )}
                        </div>
                        <p className="text-sm font-bold text-red-500 flex-shrink-0">-{fmt(d.valor ?? 0)}</p>
                        <BtnDeletarDespesa id={d.id} />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
