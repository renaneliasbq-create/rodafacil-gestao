export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Car, CheckCircle2, FileText } from 'lucide-react'
import { ContratoForm } from './contrato-form'

export default async function MotoristaDetailPage({
  params, searchParams,
}: {
  params: { id: string }
  searchParams: { contrato?: string }
}) {
  const supabase = createClient()

  const [
    { data: motorista },
    { data: contrato },
    { data: veiculosDisponiveis },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', params.id).single(),
    supabase.from('contratos').select('*, veiculo:veiculos(id, placa, modelo, marca, ano)')
      .eq('motorista_id', params.id).eq('status', 'ativo').limit(1).single(),
    supabase.from('veiculos').select('id, placa, modelo, marca').eq('status', 'disponivel'),
  ])

  if (!motorista) notFound()

  const veiculo = (Array.isArray(contrato?.veiculo) ? contrato?.veiculo[0] : contrato?.veiculo) as Record<string, string> | null

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/gestor/motoristas" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{motorista.nome}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{motorista.email}</p>
        </div>
      </div>

      {searchParams.contrato && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4" />
          Contrato criado com sucesso!
        </div>
      )}

      {/* Dados + Contrato */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Dados pessoais</h2>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Telefone', value: motorista.telefone },
              { label: 'CPF',      value: motorista.cpf },
              { label: 'CNH',      value: motorista.cnh },
              { label: 'Cadastro', value: formatDate(motorista.created_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-900">{value ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Contrato ativo</h2>
          </div>
          {contrato && veiculo ? (
            <div className="space-y-2">
              {[
                { label: 'Veículo', value: `${veiculo.marca} ${veiculo.modelo}` },
                { label: 'Placa',   value: veiculo.placa },
                { label: 'Valor',   value: `${formatCurrency(contrato.valor_aluguel)} / ${STATUS_LABELS[contrato.periodicidade] ?? contrato.periodicidade}` },
                { label: 'Início',  value: formatDate(contrato.data_inicio) },
                { label: 'Status',  value: null },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  {label === 'Status'
                    ? <span className={`badge ${STATUS_COLORS[contrato.status as keyof typeof STATUS_COLORS]}`}>{STATUS_LABELS[contrato.status]}</span>
                    : <span className="text-sm font-medium text-gray-900">{value}</span>
                  }
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-400 mb-4">Nenhum contrato ativo.</p>
              <ContratoForm motoristaId={params.id} veiculos={veiculosDisponiveis ?? []} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
