import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { criarOuRecuperarPix } from './actions'
import { getPlano, fmtPreco, type PlanoId } from '@/lib/pagarme/plans'
import { PixDisplay } from './pix-display'
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default async function PixPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>
}) {
  const assinaturaId = searchParams.assinatura_id
  const planoId = searchParams.plano as PlanoId | undefined
  const periodo = (searchParams.periodo ?? 'mensal') as 'mensal' | 'anual'

  if (!assinaturaId || !planoId) redirect('/planos')

  // Verifica sessão
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/assinar?plano=${planoId}&periodo=${periodo}`)

  let plano
  try { plano = getPlano(planoId) } catch { redirect('/planos') }

  const preco = periodo === 'anual' ? plano.preco_anual * 12 : plano.preco_mensal

  // Cria ou recupera o PIX
  const result = await criarOuRecuperarPix(assinaturaId)

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
          <p className="text-xs text-gray-400">🔒 Pagamento seguro via Pagar.me</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Coluna principal */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                Pagamento via PIX
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900">Pague com PIX</h1>
              <p className="text-gray-500 text-sm mt-1">
                Escaneie o QR Code ou copie o código. Aprovação imediata.
              </p>
            </div>

            {'error' in result ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 px-5 py-4 rounded-2xl">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Não foi possível gerar o PIX</p>
                    <p className="text-sm mt-0.5">{result.error}</p>
                  </div>
                </div>
                <Link
                  href={`/assinar?plano=${planoId}&periodo=${periodo}`}
                  className="btn-secondary"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Tentar novamente
                </Link>
              </div>
            ) : (
              <PixDisplay
                pixData={result.data}
                assinaturaId={assinaturaId}
              />
            )}
          </div>

          {/* Resumo lateral */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                  Resumo do pedido
                </p>
                <p className="text-lg font-extrabold text-gray-900">{plano.nome}</p>
                <p className="text-sm text-gray-500">{plano.descricao}</p>
              </div>
              <div className="border-t border-blue-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plano</span>
                  <span className="font-semibold text-gray-900">{plano.nome}</span>
                </div>
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
              <div className="space-y-1.5 pt-1">
                {[
                  '⚡ Acesso liberado imediatamente',
                  '🔒 Pagar.me · SSL 256-bit',
                  '❌ Cancele quando quiser',
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
