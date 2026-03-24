import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PLANOS, type PlanoId } from '@/lib/pagarme/plans'
import Link from 'next/link'
import { CheckoutForm } from './checkout-form'

const CarSvg = () => (
  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l3-4A1 1 0 0018 9h-5V5a1 1 0 00-1-1H3z"/>
  </svg>
)

export default async function AssinarPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>
}) {
  const planoId  = searchParams.plano  as PlanoId | undefined
  const periodo  = (searchParams.periodo ?? 'mensal') as 'mensal' | 'anual'

  // Valida plano
  const planoValido = planoId && PLANOS.some(p => p.id === planoId)
  if (!planoValido) redirect('/planos')

  // Verifica autenticação
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/assinar?plano=${planoId}&periodo=${periodo}`)
  }

  // Busca perfil do usuário
  const { data: profile } = await supabase
    .from('users')
    .select('nome, email, tipo')
    .eq('id', user.id)
    .single()

  // Verifica assinatura ativa
  const { data: assinaturaAtiva } = await supabase
    .from('assinaturas')
    .select('id, plano, status')
    .eq('user_id', user.id)
    .in('status', ['ativa', 'trial'])
    .maybeSingle()

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/planos" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <CarSvg />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">
                Roda<span className="text-blue-600">Fácil</span><span className="text-blue-400 font-bold ml-0.5 text-base">SC</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 hidden sm:block">
              🔒 Checkout seguro
            </p>
          </div>
        </div>
      </header>

      {/* Assinatura ativa — aviso */}
      {assinaturaAtiva && (
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <p className="font-bold text-amber-800 text-sm mb-1">Você já tem uma assinatura ativa</p>
            <p className="text-amber-700 text-sm">
              Seu plano atual está ativo. Para trocar de plano, acesse{' '}
              <Link href="/gestor/assinatura" className="underline font-semibold">
                Minha Assinatura
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {/* Formulário de checkout */}
      {!assinaturaAtiva && (
        <CheckoutForm
          planoId={planoId}
          periodo={periodo}
          userEmail={profile?.email ?? user.email ?? ''}
          userName={profile?.nome ?? ''}
        />
      )}
    </div>
  )
}
