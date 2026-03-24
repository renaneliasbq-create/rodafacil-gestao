'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cancelarAssinatura } from '@/app/(gestor)/gestor/assinatura/actions'
import { fmtPreco, getPlano, type PlanoId } from '@/lib/pagarme/plans'
import {
  CheckCircle2, Clock, XCircle, ShieldCheck, ArrowRight,
  CreditCard, Smartphone, Receipt, AlertTriangle, X, Loader2,
} from 'lucide-react'

/* ── tipos ────────────────────────────────────────────── */
export interface AssinaturaDetalhes {
  id: string
  plano: string
  perfil: string
  periodo: string
  preco_centavos: number
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancelada_em: string | null
  plano_override: boolean
}

export interface PagamentoHistorico {
  id: string
  metodo: string
  status: string
  valor_centavos: number
  referencia_mes: string | null
  pago_em: string | null
  created_at: string
}

/* ── helpers ──────────────────────────────────────────── */
function fmtData(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const METODO_ICONS: Record<string, React.ReactNode> = {
  pix:    <Smartphone className="w-4 h-4 text-teal-600" />,
  cartao: <CreditCard className="w-4 h-4 text-blue-600" />,
  boleto: <Receipt className="w-4 h-4 text-amber-600" />,
}

const METODO_LABELS: Record<string, string> = {
  pix: 'PIX', cartao: 'Cartão', boleto: 'Boleto',
}

/* ── badge de status ──────────────────────────────────── */
function StatusBadge({ status, periodEnd }: { status: string; periodEnd?: string | null }) {
  if (status === 'ativa' || status === 'trial') {
    return (
      <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        Ativa
      </span>
    )
  }
  if (status === 'cancelada') {
    const futuro = periodEnd && new Date(periodEnd) > new Date()
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
        futuro ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
      }`}>
        <XCircle className="w-3.5 h-3.5" />
        {futuro ? `Cancela em ${fmtData(periodEnd!)}` : 'Cancelada'}
      </span>
    )
  }
  if (status === 'pendente') {
    return (
      <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
        <Clock className="w-3.5 h-3.5" />
        Aguardando pagamento
      </span>
    )
  }
  if (status === 'inadimplente') {
    return (
      <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
        <AlertTriangle className="w-3.5 h-3.5" />
        Inadimplente
      </span>
    )
  }
  return <span className="text-xs text-gray-400">{status}</span>
}

/* ── modal de confirmação de cancelamento ─────────────── */
function ModalCancelar({ onConfirmar, onFechar }: { onConfirmar: () => void; onFechar: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  function confirmar() {
    startTransition(async () => {
      const res = await cancelarAssinatura()
      if (res.error) {
        setErro(res.error)
      } else {
        onConfirmar()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <button onClick={onFechar} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-lg font-extrabold text-gray-900 mb-2">Cancelar assinatura?</h3>
        <p className="text-sm text-gray-500 mb-4">
          Você continuará tendo acesso até o fim do período atual já pago.
          Após essa data, o acesso será encerrado.
        </p>
        {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{erro}</p>}
        <div className="flex gap-3">
          <button onClick={onFechar} className="btn-secondary flex-1 min-h-[44px]">
            Manter plano
          </button>
          <button
            onClick={confirmar}
            disabled={isPending}
            className="flex-1 min-h-[44px] bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Cancelando...</> : 'Cancelar mesmo assim'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── componente principal ─────────────────────────────── */
export function MinhaAssinatura({
  assinatura,
  pagamentos,
  planoOverride,
}: {
  assinatura: AssinaturaDetalhes | null
  pagamentos: PagamentoHistorico[]
  planoOverride: boolean
}) {
  const [modalCancelar, setModalCancelar] = useState(false)
  const [cancelado, setCancelado] = useState(false)

  /* ── acesso administrativo ── */
  if (planoOverride && !assinatura) {
    return (
      <div className="p-4 lg:p-8 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Minha Assinatura</h1>
          <p className="text-gray-500 text-sm mt-0.5">Detalhes do seu plano</p>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Acesso Administrativo</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Sua conta tem acesso completo garantido pelo administrador do sistema.
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ── sem assinatura ── */
  if (!assinatura) {
    return (
      <div className="p-4 lg:p-8 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Minha Assinatura</h1>
        </div>
        <div className="card p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
            <CreditCard className="w-7 h-7 text-gray-400" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Nenhuma assinatura ativa</p>
            <p className="text-sm text-gray-500 mt-1">Escolha um plano para acessar todos os recursos.</p>
          </div>
          <Link href="/planos" className="btn-primary mx-auto">
            Ver planos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  let planoInfo
  try { planoInfo = getPlano(assinatura.plano as PlanoId) } catch { planoInfo = null }

  const isCancelada = assinatura.status === 'cancelada' || cancelado
  const podeRenovar = isCancelada || assinatura.status === 'inadimplente'

  return (
    <>
      {modalCancelar && (
        <ModalCancelar
          onConfirmar={() => { setModalCancelar(false); setCancelado(true) }}
          onFechar={() => setModalCancelar(false)}
        />
      )}

      <div className="p-4 lg:p-8 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Minha Assinatura</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie seu plano e histórico de pagamentos</p>
        </div>

        {/* Card do plano atual */}
        <div className="card p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Plano atual</p>
              <p className="text-xl font-extrabold text-gray-900">{planoInfo?.nome ?? assinatura.plano}</p>
              <p className="text-sm text-gray-500">{planoInfo?.descricao}</p>
            </div>
            <StatusBadge
              status={cancelado ? 'cancelada' : assinatura.status}
              periodEnd={assinatura.current_period_end}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-gray-50 pt-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Valor</p>
              <p className="text-sm font-bold text-gray-900">
                {fmtPreco(assinatura.preco_centavos)}/mês
              </p>
              <p className="text-xs text-gray-400 capitalize">{assinatura.periodo}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Período atual</p>
              <p className="text-sm font-bold text-gray-900">{fmtData(assinatura.current_period_start)}</p>
              <p className="text-xs text-gray-400">início</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">
                {isCancelada ? 'Acesso até' : 'Próxima cobrança'}
              </p>
              <p className={`text-sm font-bold ${isCancelada ? 'text-amber-600' : 'text-gray-900'}`}>
                {fmtData(assinatura.current_period_end)}
              </p>
              {!isCancelada && <p className="text-xs text-gray-400">renovação</p>}
            </div>
          </div>

          {/* Features do plano */}
          {planoInfo && (
            <div className="border-t border-gray-50 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Incluso no plano</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {planoInfo.features.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="border-t border-gray-50 pt-4 flex flex-wrap gap-3">
            {podeRenovar ? (
              <Link href="/planos" className="btn-primary">
                {isCancelada ? 'Renovar assinatura' : 'Escolher plano'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/planos" className="btn-secondary">
                  Trocar de plano
                </Link>
                <button
                  onClick={() => setModalCancelar(true)}
                  className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                >
                  Cancelar assinatura
                </button>
              </>
            )}
          </div>
        </div>

        {/* Histórico de pagamentos */}
        {pagamentos.length > 0 && (
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900 text-sm">Histórico de pagamentos</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {pagamentos.map(p => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {METODO_ICONS[p.metodo] ?? <CreditCard className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {METODO_LABELS[p.metodo] ?? p.metodo}
                      {p.referencia_mes && (
                        <span className="text-gray-400 font-normal"> · {p.referencia_mes}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {p.pago_em ? `Pago em ${fmtData(p.pago_em)}` : fmtData(p.created_at)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{fmtPreco(p.valor_centavos)}</p>
                    <span className={`text-xs font-semibold ${
                      p.status === 'paid'
                        ? 'text-emerald-600'
                        : p.status === 'waiting_payment'
                        ? 'text-amber-500'
                        : 'text-red-500'
                    }`}>
                      {p.status === 'paid' ? 'Pago'
                        : p.status === 'waiting_payment' ? 'Aguardando'
                        : 'Falhou'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
