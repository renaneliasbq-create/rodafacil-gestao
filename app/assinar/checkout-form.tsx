'use client'

import { useState, useTransition, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { iniciarAssinatura, type IniciarState } from './actions'
import { getPlano, fmtPreco, type PlanoId } from '@/lib/pagarme/plans'
import { Check, Loader2, ChevronRight, Smartphone, CreditCard, Receipt } from 'lucide-react'

/* ── helpers de máscara simples ─────────────────────── */
function maskCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}
function maskCNPJ(v: string) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}
function maskDoc(v: string) {
  const digits = v.replace(/\D/g, '')
  return digits.length <= 11 ? maskCPF(digits) : maskCNPJ(digits)
}
function maskTel(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}
function maskCEP(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

/* ── resumo do plano ─────────────────────────────────── */
function ResumoPlano({ planoId, periodo }: { planoId: PlanoId; periodo: 'mensal' | 'anual' }) {
  let plano
  try { plano = getPlano(planoId) } catch { return null }
  const preco = periodo === 'anual' ? plano.preco_anual : plano.preco_mensal

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-0.5">
            Plano selecionado
          </p>
          <p className="text-lg font-extrabold text-gray-900">{plano.nome}</p>
          <p className="text-sm text-gray-500">{plano.descricao}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-extrabold text-gray-900">{fmtPreco(preco)}</p>
          <p className="text-xs text-gray-400">/mês · {periodo === 'anual' ? 'cobrado anualmente' : 'cobrado mensalmente'}</p>
          {periodo === 'anual' && (
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">2 meses grátis</p>
          )}
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
  )
}

/* ── indicador de etapas ─────────────────────────────── */
function Stepper({ passo }: { passo: 1 | 2 }) {
  const steps = [
    { n: 1, label: 'Seus dados' },
    { n: 2, label: 'Pagamento' },
  ]
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1">
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
              passo > s.n
                ? 'bg-blue-600 text-white'
                : passo === s.n
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {passo > s.n ? <Check className="w-4 h-4" /> : s.n}
            </div>
            <span className={`text-sm font-semibold hidden sm:block ${passo >= s.n ? 'text-gray-900' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-3 transition-colors ${passo > s.n + 1 - 1 ? 'bg-blue-300' : 'bg-gray-100'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── passo 1: dados pessoais ─────────────────────────── */
function Passo1({
  planoId,
  periodo,
  userEmail,
  userName,
  onConcluido,
}: {
  planoId: PlanoId
  periodo: 'mensal' | 'anual'
  userEmail: string
  userName: string
  onConcluido: (assinaturaId: string, customerId: string) => void
}) {
  const [state, formAction] = useActionState<IniciarState, FormData>(iniciarAssinatura, null)
  const [doc, setDoc] = useState('')
  const [tel, setTel] = useState('')
  const [cep, setCep] = useState('')
  const [isPending, startTransition] = useTransition()

  // Quando retornar sucesso, avança para passo 2
  if (state?.assinatura_id && state?.customer_id) {
    onConcluido(state.assinatura_id, state.customer_id)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => { formAction(fd) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="plano" value={planoId} />
      <input type="hidden" name="periodo" value={periodo} />

      {state?.error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Nome completo *
        </label>
        <input
          name="nome"
          type="text"
          required
          defaultValue={userName}
          placeholder="Seu nome completo"
          className="input"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          E-mail *
        </label>
        <input
          name="email"
          type="email"
          required
          defaultValue={userEmail}
          className="input bg-gray-50"
          readOnly
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            CPF / CNPJ *
          </label>
          <input
            name="doc"
            type="text"
            required
            value={doc}
            onChange={e => setDoc(maskDoc(e.target.value))}
            placeholder="000.000.000-00"
            className="input"
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Telefone / WhatsApp *
          </label>
          <input
            name="tel"
            type="text"
            required
            value={tel}
            onChange={e => setTel(maskTel(e.target.value))}
            placeholder="(48) 99999-0000"
            className="input"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            CEP *
          </label>
          <input
            name="cep"
            type="text"
            required
            value={cep}
            onChange={e => setCep(maskCEP(e.target.value))}
            placeholder="00000-000"
            className="input"
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Estado (UF) *
          </label>
          <input
            name="estado"
            type="text"
            required
            maxLength={2}
            placeholder="SC"
            className="input uppercase"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Endereço (rua/av.) *
          </label>
          <input
            name="linha1"
            type="text"
            required
            placeholder="Rua Exemplo"
            className="input"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Número *
          </label>
          <input
            name="numero"
            type="text"
            required
            placeholder="123"
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Cidade *
        </label>
        <input
          name="cidade"
          type="text"
          required
          placeholder="Florianópolis"
          className="input"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-full py-3.5 text-base mt-2"
      >
        {isPending
          ? <><Loader2 className="w-5 h-5 animate-spin" />Processando...</>
          : <>Continuar para pagamento <ChevronRight className="w-5 h-5" /></>
        }
      </button>
    </form>
  )
}

/* ── passo 2: método de pagamento ────────────────────── */
const METODOS = [
  {
    id: 'pix',
    icon: Smartphone,
    titulo: 'PIX',
    desc: 'Aprovação imediata · Mais rápido',
    badge: 'Recomendado',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    destaque: true,
  },
  {
    id: 'cartao',
    icon: CreditCard,
    titulo: 'Cartão de crédito',
    desc: 'Parcele em até 12x · Aprovação imediata',
    badge: null,
    badgeColor: '',
    destaque: false,
  },
  {
    id: 'boleto',
    icon: Receipt,
    titulo: 'Boleto bancário',
    desc: 'Vence em 3 dias úteis',
    badge: null,
    badgeColor: '',
    destaque: false,
  },
] as const

type MetodoId = 'pix' | 'cartao' | 'boleto'

function Passo2({
  planoId,
  periodo,
  assinaturaId,
}: {
  planoId: PlanoId
  periodo: 'mensal' | 'anual'
  assinaturaId: string
}) {
  const [metodo, setMetodo] = useState<MetodoId>('pix')
  const router = useRouter()

  function continuar() {
    router.push(
      `/assinar/${metodo}?assinatura_id=${assinaturaId}&plano=${planoId}&periodo=${periodo}`
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {METODOS.map(m => {
          const Icon = m.icon
          const ativo = metodo === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMetodo(m.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                ativo
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                ativo ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Icon className={`w-5 h-5 ${ativo ? 'text-blue-600' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-bold text-sm ${ativo ? 'text-blue-700' : 'text-gray-900'}`}>{m.titulo}</p>
                  {m.badge && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.badgeColor}`}>
                      {m.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
                ativo ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {ativo && <div className="w-full h-full rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>}
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={continuar}
        className="btn-primary w-full py-3.5 text-base mt-2"
      >
        Continuar com {METODOS.find(m => m.id === metodo)?.titulo}
        <ChevronRight className="w-5 h-5" />
      </button>

      <p className="text-xs text-gray-400 text-center">
        🔒 Pagamento processado com segurança pelo Pagar.me · SSL 256-bit
      </p>
    </div>
  )
}

/* ── componente principal exportado ──────────────────── */
export function CheckoutForm({
  planoId,
  periodo,
  userEmail,
  userName,
}: {
  planoId: PlanoId
  periodo: 'mensal' | 'anual'
  userEmail: string
  userName: string
}) {
  const [passo, setPasso] = useState<1 | 2>(1)
  const [assinaturaId, setAssinaturaId] = useState<string | null>(null)

  function handlePasso1Concluido(aid: string, _cid: string) {
    setAssinaturaId(aid)
    setPasso(2)
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Coluna esquerda: formulário */}
        <div className="lg:col-span-3">
          <Stepper passo={passo} />

          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
            {passo === 1 ? 'Seus dados' : 'Forma de pagamento'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {passo === 1
              ? 'Precisamos de algumas informações para emitir sua nota fiscal.'
              : 'Escolha como prefere pagar.'}
          </p>

          {passo === 1 && (
            <Passo1
              planoId={planoId}
              periodo={periodo}
              userEmail={userEmail}
              userName={userName}
              onConcluido={handlePasso1Concluido}
            />
          )}

          {passo === 2 && assinaturaId && (
            <Passo2
              planoId={planoId}
              periodo={periodo}
              assinaturaId={assinaturaId}
            />
          )}
        </div>

        {/* Coluna direita: resumo */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <ResumoPlano planoId={planoId} periodo={periodo} />
            <div className="mt-4 space-y-2">
              {[
                '✅ Acesso imediato após pagamento',
                '❌ Cancele quando quiser, sem multa',
                '🔒 Dados protegidos com SSL',
              ].map(item => (
                <p key={item} className="text-xs text-gray-500">{item}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
