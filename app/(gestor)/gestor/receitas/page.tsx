export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { CreditCard, Car, CheckCircle2, X } from 'lucide-react'
import Link from 'next/link'
import { NovoPagamentoForm } from './novo-form'
import { MarcarPagoForm } from './marcar-pago-form'
import { AcoesReceita } from './acoes-form'

export default async function ReceitasPage({ searchParams }: { searchParams: { ok?: string; pago?: string; form?: string; v?: string } }) {
  const supabase = createClient()
  const selectedVeiculo = searchParams.v ?? null

  const [
    { data: pagamentos },
    { data: motoristas },
    { data: contratos },
    { data: todosContratos },
    { data: veiculos },
  ] = await Promise.all([
    supabase.from('pagamentos')
      .select('*, motorista:users(nome)')
      .order('data_vencimento', { ascending: false })
      .limit(50),
    supabase.from('users').select('id, nome').eq('tipo', 'motorista').order('nome'),
    supabase.from('contratos').select('id, motorista_id, valor_aluguel').eq('status', 'ativo'),
    supabase.from('contratos').select('id, veiculo_id'),
    supabase.from('veiculos').select('id, placa, modelo').order('placa'),
  ])

  // Lookup maps
  const contratoPorId = Object.fromEntries((todosContratos ?? []).map(c => [c.id, c]))
  const veiculoPorId = Object.fromEntries((veiculos ?? []).map(v => [v.id, v]))

  // Lista filtrada por veículo (usada nos totais e na lista)
  const pagamentosFiltrados = selectedVeiculo
    ? (pagamentos ?? []).filter(p => contratoPorId[p.contrato_id]?.veiculo_id === selectedVeiculo)
    : (pagamentos ?? [])

  const totalPago = pagamentosFiltrados.filter(p => p.status === 'pago').reduce((s, p) => s + p.valor, 0)
  const totalPendente = pagamentosFiltrados.filter(p => p.status === 'pendente').reduce((s, p) => s + p.valor, 0)
  const totalAtrasado = pagamentosFiltrados.filter(p => p.status === 'atrasado').reduce((s, p) => s + p.valor, 0)
  const totalGeral = totalPago + totalPendente + totalAtrasado

  // Receita por veículo (sempre todos, para navegação)
  const porVeiculo: Record<string, { placa: string; modelo: string; pago: number; pendente: number; atrasado: number }> = {}
  for (const p of (pagamentos ?? [])) {
    const contrato = contratoPorId[p.contrato_id]
    if (!contrato?.veiculo_id) continue
    const veiculo = veiculoPorId[contrato.veiculo_id]
    if (!veiculo) continue
    if (!porVeiculo[contrato.veiculo_id])
      porVeiculo[contrato.veiculo_id] = { placa: veiculo.placa, modelo: veiculo.modelo, pago: 0, pendente: 0, atrasado: 0 }
    if (p.status === 'pago') porVeiculo[contrato.veiculo_id].pago += p.valor
    else if (p.status === 'pendente') porVeiculo[contrato.veiculo_id].pendente += p.valor
    else if (p.status === 'atrasado') porVeiculo[contrato.veiculo_id].atrasado += p.valor
  }

  return (
    <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Receitas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Cobranças e pagamentos</p>
        </div>
        <NovoPagamentoForm motoristas={motoristas ?? []} contratos={contratos ?? []} />
      </div>

      {(searchParams.ok || searchParams.pago) && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4" />
          {searchParams.pago ? 'Pagamento confirmado!' : 'Lançamento criado com sucesso!'}
        </div>
      )}

      {/* Totais */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Recebido</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPago)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Pendente</p>
          <p className="text-xl font-bold text-yellow-600 mt-1">{formatCurrency(totalPendente)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Atrasado</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalAtrasado)}</p>
        </div>
      </div>

      {/* Receita por veículo */}
      {Object.keys(porVeiculo).length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Car className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">Por veículo</h2>
            <span className="text-xs text-gray-400 ml-1">Clique para filtrar</span>
            {selectedVeiculo && (
              <Link href="/gestor/receitas" className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <X className="w-3 h-3" /> Limpar filtro
              </Link>
            )}
          </div>
          <div className="space-y-1">
            {Object.entries(porVeiculo)
              .sort((a, b) => (b[1].pago + b[1].pendente + b[1].atrasado) - (a[1].pago + a[1].pendente + a[1].atrasado))
              .map(([id, v]) => {
                const total = v.pago + v.pendente + v.atrasado
                const ativo = selectedVeiculo === id
                return (
                  <Link
                    key={id}
                    href={ativo ? '/gestor/receitas' : `/gestor/receitas?v=${id}`}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                      ativo ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-semibold ${ativo ? 'text-blue-700' : 'text-gray-900'}`}>{v.placa}</p>
                      <p className="text-xs text-gray-400">{v.modelo}</p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-xs text-gray-400">Recebido</p>
                        <p className={`text-sm font-semibold ${ativo ? 'text-blue-600' : 'text-emerald-600'}`}>{formatCurrency(v.pago)}</p>
                        {totalPago > 0 && (
                          <p className="text-xs text-gray-400">{((v.pago / totalPago) * 100).toFixed(0)}% do total</p>
                        )}
                      </div>
                      {v.pendente > 0 && (
                        <div>
                          <p className="text-xs text-gray-400">Pendente</p>
                          <p className="text-sm font-semibold text-yellow-600">{formatCurrency(v.pendente)}</p>
                        </div>
                      )}
                      {v.atrasado > 0 && (
                        <div>
                          <p className="text-xs text-gray-400">Atrasado</p>
                          <p className="text-sm font-semibold text-red-500">{formatCurrency(v.atrasado)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400">Total</p>
                        <p className={`text-sm font-bold ${ativo ? 'text-blue-700' : 'text-gray-900'}`}>{formatCurrency(total)}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
          </div>
        </div>
      )}

      {/* Lista */}
      {(() => {
        const lista = pagamentosFiltrados
        const veiculoFiltrado = selectedVeiculo ? veiculoPorId[selectedVeiculo] : null
        return (
        <div className="card">
          <div className="flex items-center gap-2 p-5 border-b border-gray-100">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">
              {veiculoFiltrado ? `Lançamentos · ${veiculoFiltrado.placa}` : 'Todos os lançamentos'}
            </h2>
            <span className="ml-auto text-xs text-gray-400">{lista.length} registros</span>
          </div>

          {lista.length > 0 ? (
            <>
              <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <span className="col-span-2">Motorista / Referência</span>
                <span>Vencimento</span>
                <span>Status</span>
                <span className="text-right">Valor</span>
              </div>
              <div className="divide-y divide-gray-50">
                {lista.map((p) => {
                  const m = (Array.isArray(p.motorista) ? p.motorista[0] : p.motorista) as { nome: string } | null
                  return (
                    <div key={p.id}>
                      {/* Mobile */}
                      <div className="sm:hidden px-4 py-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{m?.nome ?? '—'}</p>
                            <p className="text-xs text-gray-400">{p.referencia ?? 'Aluguel'} · {formatDate(p.data_vencimento)}</p>
                          </div>
                          <AcoesReceita pagamento={p} />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`badge ${STATUS_COLORS[p.status as keyof typeof STATUS_COLORS]}`}>
                            {STATUS_LABELS[p.status]}
                          </span>
                          {p.status !== 'pago' && <MarcarPagoForm id={p.id} />}
                        </div>
                      </div>
                      {/* Desktop */}
                      <div className="hidden sm:grid grid-cols-5 gap-4 items-center px-5 py-3">
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-900">{m?.nome ?? '—'}</p>
                          <p className="text-xs text-gray-400">{p.referencia ?? 'Aluguel'}</p>
                        </div>
                        <p className="text-sm text-gray-600">{formatDate(p.data_vencimento)}</p>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${STATUS_COLORS[p.status as keyof typeof STATUS_COLORS]}`}>
                            {STATUS_LABELS[p.status]}
                          </span>
                          {p.status !== 'pago' && <MarcarPagoForm id={p.id} />}
                        </div>
                        <AcoesReceita pagamento={p} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="py-14 text-center">
              <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                {veiculoFiltrado ? `Nenhum lançamento para ${veiculoFiltrado.placa}` : 'Nenhum lançamento cadastrado'}
              </p>
            </div>
          )}
        </div>
        )
      })()}
    </div>
  )
}
