import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPlano, fmtPreco, type PlanoId } from '@/lib/pagarme/plans'
import { CartaoForm } from './cartao-form'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'

export default async function CartaoPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>
}) {
  const assinaturaId = searchParams.assinatura_id
  const planoId = searchParams.plano as PlanoId | undefined
  const periodo = (searchParams.periodo ?? 'mensal') as 'mensal' | 'anual'

  if (!assinaturaId || !planoId) redirect('/planos')

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/assinar?plano=${planoId}&periodo=${periodo}`)

  let plano
  try { plano = getPlano(planoId) } catch { redirect('/planos') }

  // Busca assinatura e valida
  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('id, preco_centavos, status')
    .eq('id', assinaturaId)
    .eq('user_id', user.id)
    .single()

  if (!assinatura || assinatura.status === 'ativa') redirect('/gestor/assinatura')

  const preco = assinatura.preco_centavos

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href={`/assinar?plano=${planoId}&periodo=${periodo}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <p className="text-xs text-gray-400">🔒 Checkout seguro · Pagar.me</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Formulário */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
                💳 Cartão de crédito
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900">Dados do cartão</h1>
              <p className="text-gray-500 text-sm mt-1">
                Seus dados são criptografados e nunca armazenados em nossos servidores.
              </p>
            </div>

            <CartaoForm
              assinaturaId={assinaturaId}
              valorCentavos={preco}
            />
          </div>

          {/* Resumo lateral */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                    Resumo do pedido
                  </p>
                  <p className="text-lg font-extrabold text-gray-900">{plano.nome}</p>
                  <p className="text-sm text-gray-500">{plano.descricao}</p>
                </div>
                <div className="border-t border-blue-100 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Período</span>
                    <span className="font-semibold text-gray-900 capitalize">{periodo}</span>
                  </div>
                  {periodo === 'anual' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Desconto anual</span>
                      <span className="font-semibold text-emerald-600">-20%</span>
                    </div>
                  )}
                  <div className="border-t border-blue-100 pt-2 flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-extrabold text-gray-900 text-lg">{fmtPreco(preco)}</span>
                  </div>
                </div>

                <div className="border-t border-blue-100 pt-3 space-y-1.5">
                  {plano.features.slice(0, 4).map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="text-xs text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selos de segurança */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                  Sua segurança
                </p>
                {[
                  '🔒 Dados criptografados (SSL 256-bit)',
                  '🛡️ Tokenização Pagar.me — dados não ficam no servidor',
                  '✅ Aprovação imediata na maioria dos cartões',
                  '❌ Cancele sua assinatura quando quiser',
                ].map(item => (
                  <p key={item} className="text-xs text-gray-500">{item}</p>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
