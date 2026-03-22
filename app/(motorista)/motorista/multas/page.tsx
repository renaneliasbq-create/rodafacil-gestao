import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

export default async function MultasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: multas } = await supabase
    .from('multas')
    .select('*, veiculo:veiculos(placa, modelo, marca)')
    .eq('motorista_id', user.id)
    .order('data', { ascending: false })

  const totalPendente = multas
    ?.filter(m => m.status === 'pendente')
    .reduce((s, m) => s + m.valor, 0) ?? 0

  const totalPago = multas
    ?.filter(m => m.status === 'paga')
    .reduce((s, m) => s + m.valor, 0) ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Multas</h1>
        <p className="text-gray-500 text-sm mt-0.5">Infrações vinculadas ao seu veículo</p>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Pendente</p>
          <p className={`text-xl font-bold mt-1 ${totalPendente > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {formatCurrency(totalPendente)}
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Pago</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPago)}</p>
        </div>
      </div>

      {/* Lista */}
      <div className="card">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <AlertTriangle className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Registro de Multas</h2>
          <span className="ml-auto text-xs text-gray-400">{multas?.length ?? 0} registros</span>
        </div>

        {multas && multas.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {multas.map((m) => {
              const veiculo = m.veiculo as Record<string, string> | null
              return (
                <div key={m.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`badge ${m.status === 'paga' ? STATUS_COLORS.paga : STATUS_COLORS.pendente}`}>
                          {m.status === 'paga' ? 'Paga' : 'Pendente'}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(m.data)}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1.5">{m.infracao}</p>
                      {veiculo && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {veiculo.marca} {veiculo.modelo} · {veiculo.placa}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                      {formatCurrency(m.valor)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <AlertTriangle className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-emerald-600 font-medium">Nenhuma multa registrada</p>
            <p className="text-xs text-gray-400 mt-1">Continue assim! Dirija com segurança.</p>
          </div>
        )}
      </div>
    </div>
  )
}
