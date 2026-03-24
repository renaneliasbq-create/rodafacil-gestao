'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { pagarComCartao } from './actions'
import { fmtPreco } from '@/lib/pagarme/plans'
import { CreditCard, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

/* ── máscaras ──────────────────────────────────────── */
function maskNumero(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}
function maskValidade(v: string) {
  return v.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2')
}
function maskCvv(v: string) {
  return v.replace(/\D/g, '').slice(0, 4)
}

/* ── detecção de bandeira ──────────────────────────── */
function detectarBandeira(numero: string): 'visa' | 'mastercard' | 'amex' | 'elo' | null {
  const d = numero.replace(/\D/g, '')
  if (/^4/.test(d)) return 'visa'
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return 'mastercard'
  if (/^3[47]/.test(d)) return 'amex'
  if (/^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|650[0-5])/.test(d)) return 'elo'
  return null
}

function BandeiraIcon({ bandeira }: { bandeira: ReturnType<typeof detectarBandeira> }) {
  if (!bandeira) return null
  const cores: Record<string, string> = {
    visa: 'bg-blue-600',
    mastercard: 'bg-red-500',
    amex: 'bg-blue-400',
    elo: 'bg-yellow-500',
  }
  const labels: Record<string, string> = {
    visa: 'VISA', mastercard: 'MC', amex: 'AMEX', elo: 'ELO',
  }
  return (
    <div className={`${cores[bandeira]} text-white text-[9px] font-black px-1.5 py-0.5 rounded`}>
      {labels[bandeira]}
    </div>
  )
}

/* ── tokenização no client (dados nunca vão ao servidor) ─── */
async function tokenizarCartao(dados: {
  numero: string
  nome: string
  mes: string
  ano: string
  cvv: string
}): Promise<{ token?: string; error?: string }> {
  const publicKey = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY
  if (!publicKey) return { error: 'Chave pública não configurada.' }

  const auth = 'Basic ' + btoa(publicKey + ':')

  try {
    const res = await fetch(
      `https://api.pagar.me/core/v5/tokens?appId=${publicKey}`,
      {
        method: 'POST',
        headers: {
          Authorization: auth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'card',
          card: {
            number:      dados.numero.replace(/\D/g, ''),
            holder_name: dados.nome.toUpperCase(),
            exp_month:   dados.mes,
            exp_year:    dados.ano.length === 2 ? `20${dados.ano}` : dados.ano,
            cvv:         dados.cvv,
          },
        }),
      }
    )

    const json = await res.json()
    if (!res.ok) {
      const msg = json?.message ?? json?.errors?.[0]?.message ?? 'Dados do cartão inválidos.'
      return { error: msg }
    }
    return { token: json.id }
  } catch {
    return { error: 'Erro de conexão ao tokenizar cartão.' }
  }
}

/* ── selector de parcelas ──────────────────────────── */
function gerarParcelas(valorCentavos: number): Array<{ n: number; label: string }> {
  const parcelas = []
  for (let n = 1; n <= 12; n++) {
    const valorParcela = valorCentavos / n
    const label = n === 1
      ? `1x de ${fmtPreco(valorParcela)} (sem juros)`
      : n <= 6
      ? `${n}x de ${fmtPreco(valorParcela)} (sem juros)`
      : `${n}x de ${fmtPreco(valorParcela)}`
    parcelas.push({ n, label })
  }
  return parcelas
}

/* ── componente principal ──────────────────────────── */
export function CartaoForm({
  assinaturaId,
  valorCentavos,
}: {
  assinaturaId: string
  valorCentavos: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [numero, setNumero] = useState('')
  const [nome, setNome] = useState('')
  const [validade, setValidade] = useState('')
  const [cvv, setCvv] = useState('')
  const [parcelas, setParcelas] = useState(1)
  const [erro, setErro] = useState<string | null>(null)
  const [etapa, setEtapa] = useState<'form' | 'processando' | 'aprovado'>('form')

  const bandeira = detectarBandeira(numero)
  const listaParc = gerarParcelas(valorCentavos)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    // Validações básicas no client
    const digits = numero.replace(/\D/g, '')
    if (digits.length < 13) { setErro('Número do cartão inválido.'); return }
    if (!nome.trim() || nome.trim().split(' ').length < 2) {
      setErro('Informe o nome completo como aparece no cartão.')
      return
    }
    const [mes, ano] = validade.split('/')
    if (!mes || !ano || mes.length !== 2 || ano.length !== 2) {
      setErro('Validade inválida. Use MM/AA.')
      return
    }
    if (cvv.length < 3) { setErro('CVV inválido.'); return }

    setEtapa('processando')

    startTransition(async () => {
      // 1. Tokeniza no client
      const { token, error: tokenError } = await tokenizarCartao({
        numero, nome, mes, ano, cvv,
      })

      if (tokenError || !token) {
        setErro(tokenError ?? 'Erro ao processar cartão.')
        setEtapa('form')
        return
      }

      // 2. Envia token + parcelas para o servidor
      const result = await pagarComCartao(assinaturaId, token, parcelas)

      if (result.status === 'paid') {
        setEtapa('aprovado')
        setTimeout(() => router.push('/assinar/sucesso'), 1500)
      } else {
        setErro(result.error)
        setEtapa('form')
      }
    })
  }

  /* ── tela de processando ── */
  if (etapa === 'processando') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <p className="text-lg font-bold text-gray-900">Processando pagamento...</p>
        <p className="text-sm text-gray-400">Não feche esta janela.</p>
      </div>
    )
  }

  /* ── tela de aprovado ── */
  if (etapa === 'aprovado') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <p className="text-lg font-bold text-gray-900">Pagamento aprovado!</p>
        <p className="text-sm text-gray-400">Redirecionando para sua conta...</p>
      </div>
    )
  }

  /* ── formulário ── */
  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {erro && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {erro}
        </div>
      )}

      {/* Número do cartão */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Número do cartão *
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            inputMode="numeric"
            required
            value={numero}
            onChange={e => setNumero(maskNumero(e.target.value))}
            placeholder="0000 0000 0000 0000"
            className="input pl-10 pr-16 font-mono tracking-widest"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <BandeiraIcon bandeira={bandeira} />
          </div>
        </div>
      </div>

      {/* Nome no cartão */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Nome no cartão *
        </label>
        <input
          type="text"
          required
          value={nome}
          onChange={e => setNome(e.target.value.toUpperCase())}
          placeholder="NOME SOBRENOME"
          className="input uppercase tracking-wide"
          autoComplete="cc-name"
        />
      </div>

      {/* Validade + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Validade *
          </label>
          <input
            type="text"
            inputMode="numeric"
            required
            value={validade}
            onChange={e => setValidade(maskValidade(e.target.value))}
            placeholder="MM/AA"
            className="input font-mono tracking-widest"
            autoComplete="cc-exp"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            CVV *
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              required
              value={cvv}
              onChange={e => setCvv(maskCvv(e.target.value))}
              placeholder={bandeira === 'amex' ? '0000' : '000'}
              className="input font-mono tracking-widest"
              autoComplete="cc-csc"
            />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
          </div>
        </div>
      </div>

      {/* Parcelas */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Parcelamento
        </label>
        <select
          value={parcelas}
          onChange={e => setParcelas(parseInt(e.target.value))}
          className="input"
        >
          {listaParc.map(p => (
            <option key={p.n} value={p.n}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
        <span className="text-sm text-gray-500">Total a pagar</span>
        <span className="text-lg font-extrabold text-gray-900">{fmtPreco(valorCentavos)}</span>
      </div>

      {/* Botão */}
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-full py-3.5 text-base"
      >
        {isPending
          ? <><Loader2 className="w-5 h-5 animate-spin" />Processando...</>
          : <><Lock className="w-4 h-4" />Pagar {fmtPreco(valorCentavos)}</>
        }
      </button>

      {/* Segurança */}
      <div className="flex items-center justify-center gap-4 pt-1">
        {['🔒 SSL 256-bit', '🛡️ Pagar.me', '💳 Dados criptografados'].map(item => (
          <span key={item} className="text-xs text-gray-400">{item}</span>
        ))}
      </div>
    </form>
  )
}
