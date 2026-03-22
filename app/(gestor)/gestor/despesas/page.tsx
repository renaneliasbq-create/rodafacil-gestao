export const dynamic = 'force-dynamic'

import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowUpCircle, CheckCircle2, Car, X } from 'lucide-react'
import Link from 'next/link'
import { NovaDespesaForm } from './nova-form'
import { AcoesDespesa } from './acoes-form'

const CATEGORIA_LABELS: Record<string, string> = {
  manutencao: 'Manutenção', emplacamento: 'Emplacamento', ipva: 'IPVA',
  seguro: 'Seguro', multa: 'Multa', combustivel: 'Combustível',
  administrativa: 'Administrativa', outro: 'Outro',
}

const CATEGORIA_COLORS: Record<string, string> = {
  manutencao: 'bg-orange-100 text-orange-700',
  emplacamento: 'bg-blue-100 text-blue-700',
  ipva: 'bg-purple-100 text-purple-700',
  seguro: 'bg-teal-100 text-teal-700',
  multa: 'bg-red-100 text-red-700',
  combustivel: 'bg-yellow-100 text-yellow-700',
  administrativa: 'bg-gray-100 text-gray-600',
  outro: 'bg-gray-100 text-gray-500',
}

export default async function DespesasPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  noStore()
  const supabase = createClient()
  const selectedVeiculo = searchParams.v ?? null

  const [
    { data: despesas },
    { data: veiculos },
    { data: motoristas },
  ] = await Promise.all([
    supabase.from('despesas')
      .select('id, categoria, valor, data, descricao, created_at, veiculo_id, motorista_id')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('veiculos').select('id, placa, modelo').order('placa'),
    supabase.from('users').select('id, nome').eq('tipo', 'motorista').order('nome'),
  ])

  // Lookup maps para exibição
  const veiculoById = Object.fromEntries((veiculos ?? []).map(v => [v.id, v]))
  const motoristaById = Object.fromEntries((motoristas ?? []).map(m => [m.id, m]))

  // Lista filtrada (usada em totais e categorias)
  const despesasFiltradas = selectedVeiculo
    ? (despesas ?? []).filter(d => d.veiculo_id === selectedVeiculo)
    : (despesas ?? [])

  // Totais por categoria (baseados no filtro ativo)
  const totalGeral = despesasFiltradas.reduce((s, d) => s + d.valor, 0)
  const porCategoria: Record<string, number> = despesasFiltradas.reduce((acc, d) => {
    acc[d.categoria] = (acc[d.categoria] ?? 0) + d.valor
    return acc
  }, {} as Record<string, number>)

  // Totais por veículo
  const porVeiculo: Record<string, { placa: string; modelo: string; total: number }> = {}
  for (const d of (despesas ?? [])) {
    if (!d.veiculo_id) continue
    const v = veiculoById[d.veiculo_id]
    if (!v) continue
    if (!porVeiculo[d.veiculo_id]) porVeiculo[d.veiculo_id] = { placa: v.placa, modelo: v.modelo, total: 0 }
    porVeiculo[d.veiculo_id].total += d.valor
  }
  const despesasSemVeiculo = (despesas ?? []).filter(d => !d.veiculo_id).reduce((s, d) => s + d.valor, 0)

  return (
    <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Despesas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Total: {formatCurrency(totalGeral)}</p>
        </div>
        <NovaDespesaForm veiculos={veiculos ?? []} motoristas={motoristas ?? []} />
      </div>

      {searchParams.ok && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4" />
          Despesa registrada com sucesso!
        </div>
      )}

      {/* Resumo por categoria — todas */}
      {Object.keys(porCategoria).length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Por categoria</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.entries(porCategoria) as [string, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([cat, val]) => (
                <div key={cat} className="bg-gray-50 rounded-xl p-3">
                  <span className={`badge text-xs ${CATEGORIA_COLORS[cat] ?? 'bg-gray-100 text-gray-500'}`}>
                    {CATEGORIA_LABELS[cat] ?? cat}
                  </span>
                  <p className="text-base font-bold text-gray-900 mt-2">{formatCurrency(val)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {totalGeral > 0 ? ((val / totalGeral) * 100).toFixed(0) : 0}% do total
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Resumo por veículo */}
      {Object.keys(porVeiculo).length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Car className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">Por veículo</h2>
            <span className="text-xs text-gray-400 ml-1">Clique para filtrar</span>
            {selectedVeiculo && (
              <Link href="/gestor/despesas" className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <X className="w-3 h-3" /> Limpar filtro
              </Link>
            )}
          </div>
          <div className="space-y-1">
            {Object.entries(porVeiculo)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([id, v]) => {
                const ativo = selectedVeiculo === id
                return (
                  <Link
                    key={id}
                    href={ativo ? '/gestor/despesas' : `/gestor/despesas?v=${id}`}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                      ativo ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-semibold ${ativo ? 'text-blue-700' : 'text-gray-900'}`}>{v.placa}</p>
                      <p className="text-xs text-gray-400">{v.modelo}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${ativo ? 'text-blue-700' : 'text-gray-900'}`}>{formatCurrency(v.total)}</p>
                      <p className="text-xs text-gray-400">{totalGeral > 0 ? ((v.total / totalGeral) * 100).toFixed(0) : 0}%</p>
                    </div>
                  </Link>
                )
              })}
            {despesasSemVeiculo > 0 && (
              <div className="flex items-center justify-between px-3 py-2.5">
                <p className="text-sm text-gray-400">Sem veículo vinculado</p>
                <p className="text-sm font-semibold text-gray-500">{formatCurrency(despesasSemVeiculo)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista */}
      {(() => {
        const lista = despesasFiltradas
        const veiculoFiltrado = selectedVeiculo ? veiculoById[selectedVeiculo] : null
        return (
      <div className="card">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <ArrowUpCircle className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">
            {veiculoFiltrado ? `Despesas · ${veiculoFiltrado.placa}` : 'Todas as despesas'}
          </h2>
          <span className="ml-auto text-xs text-gray-400">{lista.length} registros</span>
        </div>

        {lista.length > 0 ? (
          <>
            <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <span>Data</span>
              <span>Categoria</span>
              <span className="col-span-2">Descrição / Vínculo</span>
              <span className="text-right">Valor</span>
            </div>
            <div className="divide-y divide-gray-50">
              {lista.map((d) => {
                const v = d.veiculo_id ? veiculoById[d.veiculo_id] : null
                const m = d.motorista_id ? motoristaById[d.motorista_id] : null
                return (
                  <div key={d.id}>
                    {/* Mobile */}
                    <div className="sm:hidden px-4 py-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className={`badge text-xs ${CATEGORIA_COLORS[d.categoria] ?? 'bg-gray-100 text-gray-500'}`}>
                            {CATEGORIA_LABELS[d.categoria] ?? d.categoria}
                          </span>
                          <p className="text-sm text-gray-900 mt-1">{d.descricao ?? '—'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDate(d.data)}
                            {v ? ` · ${v.placa}` : ''}
                            {m ? ` · ${m.nome}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(d.valor)}</p>
                          <AcoesDespesa despesa={d} veiculos={veiculos ?? []} motoristas={motoristas ?? []} />
                        </div>
                      </div>
                    </div>
                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-5 gap-4 items-center px-5 py-3">
                      <p className="text-sm text-gray-600">{formatDate(d.data)}</p>
                      <span className={`badge w-fit text-xs ${CATEGORIA_COLORS[d.categoria] ?? 'bg-gray-100 text-gray-500'}`}>
                        {CATEGORIA_LABELS[d.categoria] ?? d.categoria}
                      </span>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-900">{d.descricao ?? '—'}</p>
                        <p className="text-xs text-gray-400">
                          {v ? `${v.placa} · ${v.modelo}` : ''}
                          {v && m ? ' · ' : ''}
                          {m ? m.nome : ''}
                        </p>
                      </div>
                      <AcoesDespesa
                        despesa={d}
                        veiculos={veiculos ?? []}
                        motoristas={motoristas ?? []}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="py-14 text-center">
            <ArrowUpCircle className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {veiculoFiltrado ? `Nenhuma despesa para ${veiculoFiltrado.placa}` : 'Nenhuma despesa registrada'}
            </p>
          </div>
        )}
      </div>
        )
      })()}
    </div>
  )
}
