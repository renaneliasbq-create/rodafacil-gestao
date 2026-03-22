import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { CreditCard } from 'lucide-react'

const FORMA_LABELS: Record<string, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferência',
}

export default async function PagamentosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: pagamentos } = await supabase
    .from('pagamentos')
    .select('*')
    .eq('motorista_id', user.id)
    .order('data_vencimento', { ascending: false })

  const totalPago = pagamentos?.filter(p => p.status === 'pago').reduce((s, p) => s + p.valor, 0) ?? 0
  const totalPendente = pagamentos?.filter(p => p.status === 'pendente').reduce((s, p) => s + p.valor, 0) ?? 0
  const totalAtrasado = pagamentos?.filter(p => p.status === 'atrasado').reduce((s, p) => s + p.valor, 0) ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Pagamentos</h1>
        <p className="text-gray-500 text-sm mt-0.5">Histórico completo das suas cobranças</p>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Pago</p>
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

      {/* Lista */}
      <div className="card">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Todas as cobranças</h2>
          <span className="ml-auto text-xs text-gray-400">{pagamentos?.length ?? 0} registros</span>
        </div>

        {pagamentos && pagamentos.length > 0 ? (
          <>
            {/* Cabeçalho da tabela — desktop */}
            <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <span className="col-span-2">Referência / Vencimento</span>
              <span>Forma</span>
              <span>Status</span>
              <span className="text-right">Valor</span>
            </div>

            <div className="divide-y divide-gray-50">
              {pagamentos.map((p) => (
                <div key={p.id} className="px-5 py-3.5 sm:grid sm:grid-cols-5 sm:gap-4 sm:items-center flex flex-col gap-1.5">
                  {/* Referência */}
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-gray-900">
                      {p.referencia ?? 'Aluguel'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Venc. {formatDate(p.data_vencimento)}
                      {p.data_pagamento ? ` · Pago ${formatDate(p.data_pagamento)}` : ''}
                    </p>
                  </div>

                  {/* Forma de pagamento */}
                  <span className="text-sm text-gray-600">
                    {p.forma_pagamento ? FORMA_LABELS[p.forma_pagamento] ?? p.forma_pagamento : '—'}
                  </span>

                  {/* Status */}
                  <div>
                    <span className={`badge ${STATUS_COLORS[p.status as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </div>

                  {/* Valor */}
                  <p className="text-sm font-semibold text-gray-900 sm:text-right">
                    {formatCurrency(p.valor)}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">Nenhum pagamento registrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
