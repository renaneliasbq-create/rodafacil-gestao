export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Users, Plus, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function MotoristasPage({ searchParams }: { searchParams: { ok?: string } }) {
  const supabase = createClient()

  const { data: motoristas } = await supabase
    .from('users')
    .select('id, nome, email, telefone, cpf, created_at')
    .eq('tipo', 'motorista')
    .order('nome')

  // Contratos ativos por motorista
  const { data: contratos } = await supabase
    .from('contratos')
    .select('motorista_id, status, veiculo:veiculos(placa, modelo)')
    .eq('status', 'ativo')

  const contratoAtivo = (id: string) =>
    contratos?.find(c => c.motorista_id === id)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Motoristas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{motoristas?.length ?? 0} cadastrados</p>
        </div>
        <Link href="/gestor/motoristas/novo" className="btn-primary">
          <Plus className="w-4 h-4" />
          Novo motorista
        </Link>
      </div>

      {searchParams.ok && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4" />
          Motorista cadastrado com sucesso!
        </div>
      )}

      <div className="card">
        {motoristas && motoristas.length > 0 ? (
          <>
            <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <span className="col-span-2">Nome / E-mail</span>
              <span>Telefone</span>
              <span>Veículo</span>
              <span>Cadastro</span>
            </div>
            <div className="divide-y divide-gray-50">
              {motoristas.map((m) => {
                const contrato = contratoAtivo(m.id)
                const veiculo = (Array.isArray(contrato?.veiculo) ? contrato?.veiculo[0] : contrato?.veiculo) as Record<string, string> | null
                return (
                  <Link
                    key={m.id}
                    href={`/gestor/motoristas/${m.id}`}
                    className="grid grid-cols-5 gap-4 items-center px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="col-span-2">
                      <p className="text-sm font-semibold text-gray-900">{m.nome}</p>
                      <p className="text-xs text-gray-400">{m.email}</p>
                    </div>
                    <p className="text-sm text-gray-600">{m.telefone ?? '—'}</p>
                    <div>
                      {veiculo ? (
                        <span className="badge bg-blue-100 text-blue-700">
                          {veiculo.placa}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sem veículo</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{formatDate(m.created_at)}</p>
                  </Link>
                )
              })}
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-400">Nenhum motorista cadastrado</p>
            <Link href="/gestor/motoristas/novo" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" /> Cadastrar primeiro motorista
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
