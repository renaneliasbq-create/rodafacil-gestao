export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Users, Plus, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

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
    <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
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
                const telefoneNumeros = m.telefone?.replace(/\D/g, '')
                const whatsappUrl = telefoneNumeros ? `https://wa.me/55${telefoneNumeros}` : null
                return (
                  <div key={m.id} className="relative hover:bg-gray-50 transition-colors">
                    <Link href={`/gestor/motoristas/${m.id}`} className="absolute inset-0" />
                    {/* Mobile */}
                    <div className="sm:hidden flex items-center justify-between px-4 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{m.nome}</p>
                        <p className="text-xs text-gray-400 truncate">{m.email}</p>
                        {veiculo && (
                          <span className="mt-1 inline-block badge bg-blue-100 text-blue-700">{veiculo.placa}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0 relative z-10">
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500 hover:text-green-600 transition-colors"
                            title="Abrir WhatsApp"
                          >
                            <WhatsAppIcon />
                          </a>
                        )}
                        <p className="text-xs text-gray-500 whitespace-nowrap">{m.telefone ?? '—'}</p>
                      </div>
                    </div>
                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-5 gap-4 items-center px-5 py-4">
                      <div className="col-span-2 pointer-events-none">
                        <p className="text-sm font-semibold text-gray-900">{m.nome}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                      </div>
                      <div className="relative z-10 flex items-center gap-2">
                        <p className="text-sm text-gray-600">{m.telefone ?? '—'}</p>
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500 hover:text-green-600 transition-colors flex-shrink-0"
                            title="Abrir WhatsApp"
                          >
                            <WhatsAppIcon />
                          </a>
                        )}
                      </div>
                      <div className="pointer-events-none">
                        {veiculo ? (
                          <span className="badge bg-blue-100 text-blue-700">{veiculo.placa}</span>
                        ) : (
                          <span className="text-xs text-gray-400">Sem veículo</span>
                        )}
                      </div>
                      <p className="pointer-events-none text-xs text-gray-400">{formatDate(m.created_at)}</p>
                    </div>
                  </div>
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
