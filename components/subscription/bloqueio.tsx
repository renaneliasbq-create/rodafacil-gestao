import Link from 'next/link'
import { Lock, ArrowRight, Clock, RefreshCw, XCircle, Gift } from 'lucide-react'
import type { AssinaturaInfo } from '@/lib/assinatura'

interface Props {
  info: AssinaturaInfo
  perfil: 'gestor' | 'motorista'
}

export function BloqueioAssinatura({ info, perfil }: Props) {
  const planoIdSugerido = perfil === 'gestor' ? 'gestor_pro' : 'motorista_pro'

  /* ── trial expirado ── */
  if (info.status === 'trial' && info.current_period_end && new Date(info.current_period_end) <= new Date()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-700 to-blue-900 px-8 py-8 text-center">
            <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gift className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-white">Seu trial encerrou</h1>
            <p className="text-blue-200 text-sm mt-1">
              Seus 30 dias gratuitos terminaram. Escolha um plano para continuar.
            </p>
          </div>
          <div className="px-8 py-6 space-y-4">
            <p className="text-gray-600 text-sm text-center">
              Seus dados estão preservados. Assine agora e retome de onde parou.
            </p>
            <Link
              href="/planos"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all"
            >
              Ver planos e preços
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-center text-gray-400">
              Sem fidelidade · Cancele quando quiser · Acesso imediato
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ── aguardando pagamento ── */
  if (info.status === 'pendente') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-amber-500 px-8 py-8 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-white">Aguardando pagamento</h1>
            <p className="text-amber-100 text-sm mt-1">
              Seu acesso será liberado automaticamente após a confirmação.
            </p>
          </div>
          <div className="px-8 py-6 space-y-4">
            <p className="text-gray-600 text-sm text-center">
              Se já pagou o boleto, a compensação pode levar até <strong>1 dia útil</strong>.
              Para PIX ou cartão, o acesso é imediato.
            </p>
            <Link
              href={`/assinar?plano=${planoIdSugerido}&periodo=mensal`}
              className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Verificar status do pagamento
            </Link>
            <p className="text-xs text-center text-gray-400">
              Dúvidas? Entre em contato pelo WhatsApp.
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ── inadimplente / cancelada ── */
  if (info.status === 'inadimplente' || info.status === 'cancelada') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-red-500 px-8 py-8 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-white">
              {info.status === 'cancelada' ? 'Assinatura cancelada' : 'Assinatura vencida'}
            </h1>
            <p className="text-red-100 text-sm mt-1">
              Renove para continuar usando o RodaFácil SC.
            </p>
          </div>
          <div className="px-8 py-6 space-y-4">
            <p className="text-gray-600 text-sm text-center">
              Seus dados estão preservados. Renove agora e retome de onde parou.
            </p>
            <Link
              href="/planos"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all"
            >
              Renovar assinatura
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── sem assinatura (padrão) ── */
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-700 to-blue-900 px-8 py-8 text-center">
          <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Escolha um plano</h1>
          <p className="text-blue-200 text-sm mt-1">
            Para usar o RodaFácil SC, você precisa de uma assinatura ativa.
          </p>
        </div>
        <div className="px-8 py-6 space-y-4">
          <div className="space-y-2.5">
            {(perfil === 'gestor'
              ? [
                  '✅ Gestão completa de veículos e motoristas',
                  '✅ Controle de receitas e despesas',
                  '✅ Relatórios financeiros e rentabilidade',
                  '✅ Alertas de vencimentos',
                ]
              : [
                  '✅ Registro de ganhos por plataforma',
                  '✅ Controle de despesas do dia a dia',
                  '✅ Metas e acompanhamento mensal',
                  '✅ Histórico completo',
                ]
            ).map(item => (
              <p key={item} className="text-sm text-gray-600">{item}</p>
            ))}
          </div>

          <Link
            href="/planos"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all mt-2"
          >
            Ver planos e preços
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-xs text-center text-gray-400">
            Sem fidelidade · Cancele quando quiser · Acesso imediato
          </p>
        </div>
      </div>
    </div>
  )
}
