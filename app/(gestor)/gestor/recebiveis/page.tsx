export const dynamic = 'force-dynamic'

import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Wallet, TrendingDown, TrendingUp, CheckCircle2, Trash2, ArrowDownCircle } from 'lucide-react'
import { NovoSaqueForm } from './novo-saque-form'
import { deletarSaque } from './actions'

export default async function RecebiveisPage({ searchParams }: { searchParams: { ok?: string } }) {
  noStore()
  const supabase = createClient()

  const [
    { data: pagamentos },
    { data: saques },
  ] = await Promise.all([
    supabase.from('pagamentos').select('valor, status, data_pagamento'),
    supabase.from('saques').select('*').order('data', { ascending: false }),
  ])

  const totalRecebido = (pagamentos ?? []).filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.valor), 0)
  const totalPendente = (pagamentos ?? []).filter(p => p.status === 'pendente').reduce((s, p) => s + Number(p.valor), 0)
  const totalAtrasado = (pagamentos ?? []).filter(p => p.status === 'atrasado').reduce((s, p) => s + Number(p.valor), 0)
  const totalSaques = (saques ?? []).reduce((s, r) => s + Number(r.valor), 0)
  const saldo = totalRecebido - totalSaques
  const pctRetirado = totalRecebido > 0 ? (totalSaques / totalRecebido) * 100 : 0
  const pctEfetivacao = (totalRecebido + totalPendente + totalAtrasado) > 0
    ? (totalRecebido / (totalRecebido + totalPendente + totalAtrasado)) * 100
    : 0

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Recebíveis</h1>
          <p className="text-gray-500 text-sm mt-0.5">Controle do dinheiro que entra e suas retiradas</p>
        </div>
        <NovoSaqueForm />
      </div>

      {searchParams.ok && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4" />
          Retirada registrada com sucesso!
        </div>
      )}

      {/* Indicadores principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total recebido</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRecebido)}</p>
          <p className="text-xs text-gray-400 mt-1">{pctEfetivacao.toFixed(0)}% de efetivação</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total retirado</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSaques)}</p>
          <p className="text-xs text-gray-400 mt-1">{pctRetirado.toFixed(0)}% do recebido</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Saldo disponível</p>
          </div>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(saldo)}</p>
          <p className="text-xs text-gray-400 mt-1">{saldo >= 0 ? 'Positivo' : 'Negativo'}</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownCircle className="w-4 h-4 text-yellow-500" />
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">A receber</p>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPendente + totalAtrasado)}</p>
          <p className="text-xs text-gray-400 mt-1">{formatCurrency(totalAtrasado)} em atraso</p>
        </div>
      </div>

      {/* Barra de progresso retirado vs recebido */}
      {totalRecebido > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Retirado vs Recebido</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Retirado: <span className="font-semibold text-red-600">{formatCurrency(totalSaques)}</span></span>
              <span className="text-gray-600">Recebido: <span className="font-semibold text-emerald-600">{formatCurrency(totalRecebido)}</span></span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-400 rounded-full transition-all"
                style={{ width: `${Math.min(pctRetirado, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{pctRetirado.toFixed(1)}% retirado</span>
              <span>{(100 - Math.min(pctRetirado, 100)).toFixed(1)}% disponível</span>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de retiradas */}
      <div className="card">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <TrendingDown className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Histórico de retiradas</h2>
          <span className="ml-auto text-xs text-gray-400">{(saques ?? []).length} registros</span>
        </div>

        {(saques ?? []).length > 0 ? (
          <>
            <div className="hidden sm:grid grid-cols-4 gap-4 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <span>Data</span>
              <span className="col-span-2">Descrição</span>
              <span className="text-right">Valor</span>
            </div>
            <div className="divide-y divide-gray-50">
              {(saques ?? []).map((s) => (
                <div key={s.id} className="grid grid-cols-4 gap-4 items-center px-5 py-3">
                  <p className="text-sm text-gray-600">{formatDate(s.data)}</p>
                  <p className="col-span-2 text-sm text-gray-900">{s.descricao ?? '—'}</p>
                  <div className="flex items-center justify-end gap-3">
                    <p className="text-sm font-semibold text-red-600">{formatCurrency(Number(s.valor))}</p>
                    <form action={async () => { 'use server'; await deletarSaque(s.id) }}>
                      <button type="submit" className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-14 text-center">
            <TrendingDown className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nenhuma retirada registrada</p>
          </div>
        )}
      </div>
    </div>
  )
}
