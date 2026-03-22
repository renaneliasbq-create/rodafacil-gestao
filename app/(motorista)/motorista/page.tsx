import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { Car, CreditCard, AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react'

export default async function MotoristaDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Contrato ativo com veículo
  const { data: contrato } = await supabase
    .from('contratos')
    .select('*, veiculo:veiculos(*)')
    .eq('motorista_id', user.id)
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Próximo pagamento pendente/atrasado
  const { data: proximoPagamento } = await supabase
    .from('pagamentos')
    .select('*')
    .eq('motorista_id', user.id)
    .in('status', ['pendente', 'atrasado'])
    .order('data_vencimento', { ascending: true })
    .limit(1)
    .single()

  // Últimos 5 pagamentos
  const { data: pagamentos } = await supabase
    .from('pagamentos')
    .select('*')
    .eq('motorista_id', user.id)
    .order('data_vencimento', { ascending: false })
    .limit(5)

  // Stats: pagos no mês atual
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]

  const { data: pagamentosMes } = await supabase
    .from('pagamentos')
    .select('valor, status')
    .eq('motorista_id', user.id)
    .gte('data_vencimento', inicioMes)
    .lte('data_vencimento', fimMes)

  const totalPagoMes = pagamentosMes
    ?.filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + p.valor, 0) ?? 0

  const totalPendente = pagamentosMes
    ?.filter(p => p.status !== 'pago')
    .reduce((sum, p) => sum + p.valor, 0) ?? 0

  const veiculo = (Array.isArray(contrato?.veiculo) ? contrato?.veiculo[0] : contrato?.veiculo) as Record<string, string> | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Meu Painel</h1>
        <p className="text-gray-500 text-sm mt-0.5">Resumo da sua locação</p>
      </div>

      {/* Alerta de atraso */}
      {proximoPagamento?.status === 'atrasado' && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Pagamento em atraso</p>
            <p className="text-sm text-red-600 mt-0.5">
              Venceu em {formatDate(proximoPagamento.data_vencimento)} — {formatCurrency(proximoPagamento.valor)}
            </p>
          </div>
        </div>
      )}

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Próx. vencimento</p>
          {proximoPagamento ? (
            <>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {formatDate(proximoPagamento.data_vencimento)}
              </p>
              <span className={`badge mt-1 ${STATUS_COLORS[proximoPagamento.status as keyof typeof STATUS_COLORS]}`}>
                {STATUS_LABELS[proximoPagamento.status]}
              </span>
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-1">Sem pendências</p>
          )}
        </div>

        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Valor do aluguel</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {contrato ? formatCurrency(contrato.valor_aluguel) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {contrato ? STATUS_LABELS[contrato.periodicidade] ?? contrato.periodicidade : ''}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pago este mês</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(totalPagoMes)}</p>
          <div className="flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span className="text-xs text-gray-400">Confirmado</span>
          </div>
        </div>

        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">A pagar</p>
          <p className={`text-lg font-bold mt-1 ${totalPendente > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {formatCurrency(totalPendente)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">Pendente</span>
          </div>
        </div>
      </div>

      {/* Informações do contrato e veículo */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Veículo */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-blue-700" />
            </div>
            <h2 className="font-semibold text-gray-900">Meu Veículo</h2>
          </div>
          {veiculo ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Modelo</span>
                <span className="text-sm font-semibold text-gray-900">
                  {String(veiculo.marca)} {String(veiculo.modelo)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Placa</span>
                <span className="text-sm font-semibold text-gray-900 tracking-wider">
                  {String(veiculo.placa)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Ano</span>
                <span className="text-sm font-semibold text-gray-900">{String(veiculo.ano)}</span>
              </div>
              {veiculo.cor && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Cor</span>
                  <span className="text-sm font-semibold text-gray-900">{String(veiculo.cor)}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nenhum veículo vinculado</p>
          )}
        </div>

        {/* Contrato */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <h2 className="font-semibold text-gray-900">Meu Contrato</h2>
          </div>
          {contrato ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`badge ${STATUS_COLORS[contrato.status as keyof typeof STATUS_COLORS]}`}>
                  {STATUS_LABELS[contrato.status]}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Início</span>
                <span className="text-sm font-semibold text-gray-900">{formatDate(contrato.data_inicio)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Periodicidade</span>
                <span className="text-sm font-semibold text-gray-900">
                  {STATUS_LABELS[contrato.periodicidade] ?? contrato.periodicidade}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Caução</span>
                <span className="text-sm font-semibold text-gray-900">
                  {contrato.caucao_pago
                    ? <span className="text-emerald-600">Pago</span>
                    : contrato.caucao_valor
                      ? formatCurrency(contrato.caucao_valor)
                      : '—'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nenhum contrato ativo</p>
          )}
        </div>
      </div>

      {/* Últimos pagamentos */}
      <div className="card">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Últimos Pagamentos</h2>
        </div>
        {pagamentos && pagamentos.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {pagamentos.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {p.referencia ?? formatDate(p.data_vencimento)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Venc. {formatDate(p.data_vencimento)}
                    {p.data_pagamento ? ` • Pago em ${formatDate(p.data_pagamento)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${STATUS_COLORS[p.status as keyof typeof STATUS_COLORS]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(p.valor)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-400">Nenhum pagamento registrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
