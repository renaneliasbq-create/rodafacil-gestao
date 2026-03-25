import { createClient } from '@/lib/supabase/server'
import { NovoVeiculoForm } from './form'
import { ArrowLeft, Lock, TrendingUp, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { getAssinaturaStatus, getLimiteVeiculos } from '@/lib/assinatura'

const UPGRADES: Record<string, { nome: string; limite: string; preco: string; href: string }> = {
  gestor_starter: { nome: 'Gestor Pro',   limite: 'até 20 veículos', preco: 'R$ 99,90/mês', href: '/planos?perfil=gestor&plano=gestor_pro' },
  gestor_pro:     { nome: 'Gestor Frota', limite: 'ilimitado',       preco: 'R$ 199,90/mês', href: '/planos?perfil=gestor&plano=gestor_frota' },
}

export default async function NovoVeiculoPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const assinatura = user ? await getAssinaturaStatus(user.id) : null
  const limite = assinatura ? getLimiteVeiculos(assinatura) : null

  // Verifica se limite já foi atingido
  if (limite !== null) {
    const { count } = await supabase
      .from('veiculos')
      .select('id', { count: 'exact', head: true })

    if ((count ?? 0) >= limite) {
      const upgrade = assinatura?.plano ? UPGRADES[assinatura.plano] : null
      return (
        <div className="p-6 lg:p-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/gestor/veiculos" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </Link>
            <h1 className="text-2xl font-extrabold text-gray-900">Novo Veículo</h1>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 flex gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-800 text-sm">Limite de veículos atingido</p>
              <p className="text-amber-700 text-sm mt-1">
                Seu plano atual permite até <strong>{limite} veículos</strong>. Você já atingiu esse limite.
                Para adicionar mais veículos, faça upgrade do seu plano.
              </p>
            </div>
          </div>

          {upgrade && (
            <div className="bg-white border-2 border-blue-500 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full mb-3">Upgrade recomendado</span>
                  <h2 className="text-lg font-extrabold text-gray-900">{upgrade.nome}</h2>
                  <p className="text-gray-500 text-sm mt-1">{upgrade.limite}</p>
                  <ul className="mt-4 space-y-2">
                    {['Todos os recursos do plano atual', 'Mais veículos na frota', 'Relatórios avançados', 'Suporte prioritário'].map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-extrabold text-gray-900">{upgrade.preco.split('/')[0]}</p>
                  <p className="text-gray-400 text-xs">/mês</p>
                </div>
              </div>
              <Link
                href={upgrade.href}
                className="mt-6 flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                Fazer upgrade para {upgrade.nome}
              </Link>
            </div>
          )}

          {!upgrade && (
            <Link href="/planos" className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
              <TrendingUp className="w-4 h-4" />
              Ver planos disponíveis
            </Link>
          )}
        </div>
      )
    }
  }

  // Formulário normal (dentro do limite)
  const { data: todosMotoristas } = await supabase
    .from('users')
    .select('id, nome')
    .eq('tipo', 'motorista')
    .order('nome')

  const { data: contratosAtivos } = await supabase
    .from('contratos')
    .select('motorista_id')
    .eq('status', 'ativo')

  const motoristasVinculados = new Set(contratosAtivos?.map(c => c.motorista_id))
  const motoristasDisponiveis = (todosMotoristas ?? []).filter(m => !motoristasVinculados.has(m.id))

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/gestor/veiculos" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Novo Veículo</h1>
          <p className="text-gray-500 text-sm mt-0.5">Adicione um veículo à frota</p>
        </div>
      </div>

      <NovoVeiculoForm motoristas={motoristasDisponiveis} />
    </div>
  )
}
