'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { verificarStatusBoleto, type BoletoData } from './actions'
import { fmtPreco } from '@/lib/pagarme/plans'
import {
  Copy, Check, ExternalLink, Clock, RefreshCw,
  CheckCircle2, AlertCircle, FileText,
} from 'lucide-react'

const POLL_INTERVAL = 15000 // 15s — boleto é lento, não precisa de polling agressivo

/* ── formata linha digitável em blocos legíveis ─────── */
function formatarLinha(linha: string) {
  // Remove espaços extras e deixa em grupos de 5
  return linha.replace(/\s/g, '').match(/.{1,10}/g)?.join(' ') ?? linha
}

/* ── formata data de vencimento ──────────────────────── */
function fmtVencimento(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/* ── botão copiar código de barras ───────────────────── */
function CopiarCodigo({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Linha digitável
      </p>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
        <p className="text-xs font-mono text-gray-700 break-all leading-relaxed select-all">
          {formatarLinha(codigo)}
        </p>
      </div>
      <button
        onClick={copiar}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
          copiado
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {copiado
          ? <><Check className="w-4 h-4" /> Código copiado!</>
          : <><Copy className="w-4 h-4" /> Copiar código de barras</>
        }
      </button>
    </div>
  )
}

/* ── estado pago ─────────────────────────────────────── */
function PagamentoConfirmado() {
  return (
    <div className="text-center py-10 space-y-3">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <p className="text-xl font-extrabold text-gray-900">Pagamento confirmado!</p>
      <p className="text-gray-500 text-sm">Redirecionando para sua conta...</p>
    </div>
  )
}

/* ── estado expirado ─────────────────────────────────── */
function BoletoExpirado({ onRenovar, carregando }: { onRenovar: () => void; carregando: boolean }) {
  return (
    <div className="text-center py-10 space-y-4">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
        <Clock className="w-8 h-8 text-amber-600" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">Boleto vencido</p>
        <p className="text-gray-500 text-sm mt-1">A data de vencimento passou.</p>
      </div>
      <button
        onClick={onRenovar}
        disabled={carregando}
        className="btn-primary mx-auto"
      >
        {carregando
          ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando novo...</>
          : <><RefreshCw className="w-4 h-4" /> Gerar novo boleto</>
        }
      </button>
    </div>
  )
}

/* ── componente principal ────────────────────────────── */
export function BoletoDisplay({
  boletoData,
}: {
  boletoData: BoletoData
}) {
  const router = useRouter()
  const [statusPago, setStatusPago] = useState(false)
  const [expirado, setExpirado] = useState(
    new Date(boletoData.expires_at) < new Date()
  )
  const [renovando, setRenovando] = useState(false)

  const checarStatus = useCallback(async () => {
    const res = await verificarStatusBoleto(boletoData.pagamento_id)
    if (res.status === 'paid') {
      setStatusPago(true)
      setTimeout(() => router.push('/assinar/sucesso'), 1500)
    } else if (res.status === 'expired') {
      setExpirado(true)
    }
  }, [boletoData.pagamento_id, router])

  // Polling mais lento — boleto demora dias para compensar
  useEffect(() => {
    if (statusPago || expirado) return
    const interval = setInterval(checarStatus, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [checarStatus, statusPago, expirado])

  // Atualiza expiração em tempo real
  useEffect(() => {
    const check = () => {
      if (new Date(boletoData.expires_at) < new Date()) setExpirado(true)
    }
    const t = setInterval(check, 60000)
    return () => clearInterval(t)
  }, [boletoData.expires_at])

  if (statusPago) return <PagamentoConfirmado />
  if (expirado)   return <BoletoExpirado onRenovar={() => { setRenovando(true); router.refresh() }} carregando={renovando} />

  return (
    <div className="space-y-6">

      {/* Ícone + status */}
      <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">Boleto gerado com sucesso</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Pague até{' '}
            <span className="font-semibold text-amber-700">
              {fmtVencimento(boletoData.expires_at)}
            </span>
          </p>
        </div>
      </div>

      {/* Valor */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
        <div>
          <p className="text-xs text-gray-400">Valor a pagar</p>
          <p className="text-2xl font-extrabold text-gray-900">{fmtPreco(boletoData.valor_centavos)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Vencimento</p>
          <p className="text-sm font-bold text-amber-600">
            {new Date(boletoData.expires_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Botão abrir PDF */}
      <a
        href={boletoData.boleto_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2.5 w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl text-sm transition-all"
      >
        <FileText className="w-4 h-4" />
        Abrir boleto (PDF)
        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
      </a>

      {/* Linha digitável + copiar */}
      <CopiarCodigo codigo={boletoData.boleto_barcode} />

      {/* Aguardando */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Aguardando confirmação de pagamento...
      </div>

      {/* Instruções */}
      <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-2.5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Como pagar</p>
        {[
          'Clique em "Abrir boleto (PDF)" ou copie a linha digitável',
          'Acesse o internet banking ou app do seu banco',
          'Pague em qualquer banco, lotérica ou correspondente bancário',
          'Após o pagamento, seu acesso é liberado em até 1 dia útil',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {i + 1}
            </div>
            <p className="text-sm text-gray-600">{step}</p>
          </div>
        ))}
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Após o pagamento, enviaremos um e-mail de confirmação. O acesso ao sistema
          é liberado automaticamente em até 1 dia útil após a compensação bancária.
        </p>
      </div>
    </div>
  )
}
