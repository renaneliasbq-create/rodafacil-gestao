import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Wrench } from 'lucide-react'

export default async function ManutencaoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Pega o veículo do contrato ativo
  const { data: contrato } = await supabase
    .from('contratos')
    .select('veiculo_id, veiculo:veiculos(placa, modelo, marca)')
    .eq('motorista_id', user.id)
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const veiculoId = contrato?.veiculo_id
  const veiculo = (Array.isArray(contrato?.veiculo) ? contrato?.veiculo[0] : contrato?.veiculo) as Record<string, string> | null

  const { data: manutencoes } = veiculoId
    ? await supabase
        .from('manutencoes')
        .select('*')
        .eq('veiculo_id', veiculoId)
        .order('data', { ascending: false })
    : { data: [] }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Manutenção</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Histórico de manutenções do seu veículo
          {veiculo ? ` — ${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})` : ''}
        </p>
      </div>

      {!veiculoId && (
        <div className="card p-6 text-center">
          <p className="text-sm text-gray-400">Nenhum veículo vinculado a um contrato ativo.</p>
        </div>
      )}

      {veiculoId && (
        <div className="card">
          <div className="flex items-center gap-2 p-5 border-b border-gray-100">
            <Wrench className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Histórico de Manutenções</h2>
            <span className="ml-auto text-xs text-gray-400">{manutencoes?.length ?? 0} registros</span>
          </div>

          {manutencoes && manutencoes.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {manutencoes.map((m) => (
                <div key={m.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 px-2.5 py-0.5 text-xs font-semibold">
                          {m.tipo}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(m.data)}</span>
                      </div>
                      {m.descricao && (
                        <p className="text-sm text-gray-600 mt-1.5">{m.descricao}</p>
                      )}
                      {m.quilometragem && (
                        <p className="text-xs text-gray-400 mt-1">
                          KM registrada: {m.quilometragem.toLocaleString('pt-BR')} km
                        </p>
                      )}
                    </div>
                    {m.valor != null && (
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(m.valor)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Wrench className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">Nenhuma manutenção registrada</p>
              <p className="text-xs text-gray-400 mt-1">Os registros serão exibidos aqui</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
