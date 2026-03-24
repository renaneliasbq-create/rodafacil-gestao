'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { verificarStatusPix, type PixData } from './actions'
import { fmtPreco } from '@/lib/pagarme/plans'
import { Copy, Check, Clock, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

const POLL_INTERVAL = 5000 // 5 segundos

/* ── countdown ─────────────────────────────────────── */
function useCountdown(expiresAt: string) {
  const [segundos, setSegundos] = useState(() => {
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
    return Math.max(0, diff)
  })

  useEffect(() => {
    if (segundos <= 0) return
    const timer = setInterval(() => setSegundos(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [segundos])

  const min = Math.floor(segundos / 60).toString().padStart(2, '0')
  const sec = (segundos % 60).toString().padStart(2, '0')
  return { label: `${min}:${sec}`, expirado: segundos === 0 }
}

/* ── botão copiar código PIX ────────────────────────── */
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
        Pix Copia e Cola
      </p>
      <div className="flex gap-2">
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-600 font-mono truncate select-all">
          {codigo.slice(0, 48)}...
        </div>
        <button
          onClick={copiar}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
            copiado
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {copiado
            ? <><Check className="w-4 h-4" /> Copiado!</>
            : <><Copy className="w-4 h-4" /> Copiar</>
          }
        </button>
      </div>
    </div>
  )
}

/* ── estado pago ─────────────────────────────────────── */
function PagamentoConfirmado() {
  return (
    <div className="text-center py-8 space-y-3">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <p className="text-xl font-extrabold text-gray-900">Pagamento confirmado!</p>
      <p className="text-gray-500 text-sm">Redirecionando para sua conta...</p>
    </div>
  )
}

/* ── estado expirado ─────────────────────────────────── */
function QrExpirado({ onRenovar, carregando }: { onRenovar: () => void; carregando: boolean }) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
        <Clock className="w-8 h-8 text-amber-600" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">QR Code expirado</p>
        <p className="text-gray-500 text-sm mt-1">O tempo para pagamento esgotou.</p>
      </div>
      <button
        onClick={onRenovar}
        disabled={carregando}
        className="btn-primary mx-auto"
      >
        {carregando
          ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando novo...</>
          : <><RefreshCw className="w-4 h-4" /> Gerar novo QR Code</>
        }
      </button>
    </div>
  )
}

/* ── componente principal ─────────────────────────────── */
export function PixDisplay({
  pixData,
  assinaturaId,
}: {
  pixData: PixData
  assinaturaId: string
}) {
  const router = useRouter()
  const { label: countdown, expirado } = useCountdown(pixData.expires_at)
  const [statusPago, setStatusPago] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [renovando, setRenovando] = useState(false)

  const checarStatus = useCallback(async () => {
    const res = await verificarStatusPix(pixData.pagamento_id)
    if (res.status === 'paid') {
      setStatusPago(true)
      setTimeout(() => router.push('/assinar/sucesso'), 1500)
    }
  }, [pixData.pagamento_id, router])

  // Polling automático
  useEffect(() => {
    if (statusPago || expirado) return
    const interval = setInterval(checarStatus, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [checarStatus, statusPago, expirado])

  function renovarQr() {
    setRenovando(true)
    router.refresh()
  }

  if (statusPago) return <PagamentoConfirmado />
  if (expirado) return <QrExpirado onRenovar={renovarQr} carregando={renovando} />

  return (
    <div className="space-y-6">
      {erro && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {erro}
        </div>
      )}

      {/* QR Code */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pixData.qr_code_url}
            alt="QR Code PIX"
            width={200}
            height={200}
            className="w-48 h-48 sm:w-56 sm:h-56"
          />
          {/* Logo PIX no centro */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-100">
              <div className="w-8 h-8 bg-teal-500 rounded flex items-center justify-center">
                <span className="text-white font-black text-xs">PIX</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instrução */}
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-gray-700">
            Aponte a câmera do celular para o QR Code
          </p>
          <p className="text-xs text-gray-400">
            Abra o app do seu banco → Pix → Ler QR Code
          </p>
        </div>
      </div>

      {/* Valor + countdown */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
        <div>
          <p className="text-xs text-gray-400">Valor a pagar</p>
          <p className="text-lg font-extrabold text-gray-900">{fmtPreco(pixData.valor_centavos)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Expira em</p>
          <p className={`text-lg font-extrabold tabular-nums ${
            parseInt(countdown.split(':')[0]) < 5 ? 'text-red-600' : 'text-gray-900'
          }`}>
            {countdown}
          </p>
        </div>
      </div>

      {/* Copia e cola */}
      <CopiarCodigo codigo={pixData.qr_code} />

      {/* Aguardando indicador */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Aguardando confirmação do pagamento...
      </div>

      {/* Passos */}
      <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-2.5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Como pagar</p>
        {[
          'Abra o aplicativo do seu banco',
          'Acesse a área Pix',
          'Escaneie o QR Code ou use o código "Copia e Cola"',
          'Confirme o pagamento — o acesso é liberado imediatamente',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {i + 1}
            </div>
            <p className="text-sm text-gray-600">{step}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
