import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'

export default async function SucessoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nome, tipo')
    .eq('id', user.id)
    .single()

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('plano, perfil, periodo, preco_centavos, status')
    .eq('user_id', user.id)
    .in('status', ['ativa', 'pendente'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const destino = profile?.tipo === 'gestor' ? '/gestor' : '/motorista-app'
  const destinoLabel = profile?.tipo === 'gestor' ? 'Ir para o painel' : 'Ir para o app'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-lg">

        {/* Card principal */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Faixa verde de sucesso */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Tudo certo!</h1>
            <p className="text-emerald-100 text-sm mt-1">
              Sua assinatura foi ativada com sucesso.
            </p>
          </div>

          <div className="px-8 py-7 space-y-6">

            {/* Boas-vindas */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-blue-600 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">Bem-vindo(a) ao RodaFácil SC!</span>
              </div>
              <p className="text-gray-600 text-sm">
                {profile?.nome ? (
                  <>Olá, <strong>{profile.nome.split(' ')[0]}</strong>! Seu acesso está liberado.</>
                ) : (
                  'Seu acesso está liberado.'
                )}
              </p>
            </div>

            {/* Detalhes da assinatura */}
            {assinatura && (
              <div className="bg-gray-50 rounded-2xl px-5 py-4 space-y-2.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                  Sua assinatura
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plano</span>
                  <span className="font-bold text-gray-900 capitalize">{assinatura.plano.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cobrança</span>
                  <span className="font-semibold text-gray-700 capitalize">{assinatura.periodo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Ativa
                  </span>
                </div>
              </div>
            )}

            {/* Próximos passos */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Próximos passos
              </p>
              {(profile?.tipo === 'gestor'
                ? [
                    'Cadastre seus veículos no painel',
                    'Convide seus motoristas pelo sistema',
                    'Acompanhe receitas e despesas em tempo real',
                  ]
                : [
                    'Registre seus ganhos de hoje',
                    'Configure suas metas mensais',
                    'Acompanhe seu lucro líquido por plataforma',
                  ]
              ).map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-600">{step}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href={destino}
              className="btn-primary w-full py-3.5 text-base"
            >
              {destinoLabel}
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="text-center text-xs text-gray-400">
              Dúvidas? Fale conosco via WhatsApp ou e-mail.
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} RodaFácil SC · Santa Catarina
        </p>
      </div>
    </div>
  )
}
