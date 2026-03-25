export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { Car, Plus, CheckCircle2, Lock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { getAssinaturaStatus, getLimiteVeiculos } from '@/lib/assinatura'

export default async function VeiculosPage({ searchParams }: { searchParams: { ok?: string } }) {
  const supabase = createClient()

  const [{ data: veiculos }, { data: { user } }] = await Promise.all([
    supabase.from('veiculos').select('*').order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  // Motorista atual por veículo
  const { data: contratos } = await supabase
    .from('contratos')
    .select('veiculo_id, motorista:users(nome)')
    .eq('status', 'ativo')

  const motoristaAtual = (veiculoId: string) => {
    const c = contratos?.find(c => c.veiculo_id === veiculoId)
    const m = (Array.isArray(c?.motorista) ? c?.motorista[0] : c?.motorista) as { nome: string } | null
    return m?.nome ?? null
  }

  // Limite do plano
  const assinatura = user ? await getAssinaturaStatus(user.id) : null
  const limite = assinatura ? getLimiteVeiculos(assinatura) : null

  const total = veiculos?.length ?? 0
  const alugados = veiculos?.filter(v => v.status === 'alugado').length ?? 0
  const disponiveis = veiculos?.filter(v => v.status === 'disponivel').length ?? 0
  const limiteAtingido = limite !== null && total >= limite
  const pctUso = limite ? Math.min((total / limite) * 100, 100) : 0

  return (
    <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Veículos</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {total} na frota · {alugados} alugados · {disponiveis} disponíveis
          </p>
        </div>
        {limiteAtingido ? (
          <Link href="/gestor/veiculos/novo" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            <Lock className="w-4 h-4" />
            Limite atingido
          </Link>
        ) : (
          <Link href="/gestor/veiculos/novo" className="btn-primary">
            <Plus className="w-4 h-4" />
            Novo veículo
          </Link>
        )}
      </div>

      {/* Barra de uso do plano */}
      {limite !== null && (
        <div className={`rounded-xl border px-4 py-3.5 ${limiteAtingido ? 'bg-amber-50 border-amber-200' : pctUso >= 80 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${limiteAtingido ? 'text-amber-700' : 'text-gray-600'}`}>
              {limiteAtingido ? '🔒 Limite do plano atingido' : `Veículos do plano`}
            </span>
            <span className={`text-xs font-bold ${limiteAtingido ? 'text-amber-700' : 'text-gray-700'}`}>
              {total} / {limite}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${limiteAtingido ? 'bg-amber-500' : pctUso >= 80 ? 'bg-yellow-400' : 'bg-blue-500'}`}
              style={{ width: `${pctUso}%` }}
            />
          </div>
          {limiteAtingido && (
            <div className="flex items-center justify-between mt-2.5">
              <p className="text-xs text-amber-600">Faça upgrade para adicionar mais veículos.</p>
              <Link href="/planos" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors">
                <TrendingUp className="w-3.5 h-3.5" />
                Ver planos
              </Link>
            </div>
          )}
        </div>
      )}

      {searchParams.ok && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4" />
          Veículo cadastrado com sucesso!
        </div>
      )}

      <div className="card">
        {veiculos && veiculos.length > 0 ? (
          <>
            <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <span>Placa</span>
              <span className="col-span-2">Veículo</span>
              <span>Motorista</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-gray-50">
              {veiculos.map((v) => (
                <Link key={v.id} href={`/gestor/veiculos/${v.id}`} className="block hover:bg-gray-50 transition-colors">
                  {/* Mobile */}
                  <div className="sm:hidden flex items-center justify-between px-4 py-3.5">
                    <div>
                      <p className="text-sm font-bold tracking-wider text-gray-900">{v.placa}</p>
                      <p className="text-xs text-gray-500">{v.marca} {v.modelo} · {v.ano}</p>
                      {motoristaAtual(v.id) && <p className="text-xs text-gray-400 mt-0.5">{motoristaAtual(v.id)}</p>}
                    </div>
                    <span className={`badge ${STATUS_COLORS[v.status as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_LABELS[v.status]}
                    </span>
                  </div>
                  {/* Desktop */}
                  <div className="hidden sm:grid grid-cols-5 gap-4 items-center px-5 py-4">
                    <p className="text-sm font-bold tracking-wider text-gray-900">{v.placa}</p>
                    <div className="col-span-2">
                      <p className="text-sm font-semibold text-gray-900">{v.marca} {v.modelo}</p>
                      <p className="text-xs text-gray-400">{v.ano}{v.cor ? ` · ${v.cor}` : ''}</p>
                    </div>
                    <p className="text-sm text-gray-600">{motoristaAtual(v.id) ?? '—'}</p>
                    <span className={`badge w-fit ${STATUS_COLORS[v.status as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_LABELS[v.status]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <Car className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-400">Nenhum veículo cadastrado</p>
            <Link href="/gestor/veiculos/novo" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" /> Cadastrar veículo
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
