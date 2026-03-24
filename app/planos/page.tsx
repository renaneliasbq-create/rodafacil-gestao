'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PLANOS, fmtPreco, type Plano, type PlanoId } from '@/lib/pagarme/plans'

/* ── ícones inline ─────────────────────────────────── */
const CarSvg = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l3-4A1 1 0 0018 9h-5V5a1 1 0 00-1-1H3z"/>
  </svg>
)
const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
)

/* ── card de plano ─────────────────────────────────── */
function PlanoCard({ plano, periodo }: { plano: Plano; periodo: 'mensal' | 'anual' }) {
  const preco = periodo === 'anual' ? plano.preco_anual : plano.preco_mensal
  const destaque = !!plano.destaque

  return (
    <div className={`relative flex flex-col rounded-2xl border-2 transition-all duration-200 ${
      destaque
        ? 'border-blue-600 shadow-2xl shadow-blue-100 scale-[1.02]'
        : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
    } bg-white overflow-hidden`}>

      {destaque && (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-blue-700" />
      )}
      {destaque && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            Mais popular
          </span>
        </div>
      )}

      <div className="p-6 sm:p-7">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
          {plano.perfil === 'motorista' ? 'Motorista' : 'Gestor de frota'}
        </p>
        <h3 className="text-xl font-extrabold text-gray-900 mb-1">{plano.nome}</h3>
        <p className="text-sm text-gray-500 mb-5">{plano.descricao}</p>

        <div className="mb-5">
          <div className="flex items-end gap-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              {fmtPreco(preco)}
            </span>
            <span className="text-sm text-gray-400 mb-1">/mês</span>
          </div>
          {periodo === 'anual' && (
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              Cobrado {fmtPreco(preco * 12)}/ano · 2 meses grátis
            </p>
          )}
          {periodo === 'mensal' && (
            <p className="text-xs text-gray-400 mt-1">Cobrado mensalmente · cancele quando quiser</p>
          )}
        </div>

        <Link
          href={`/assinar?plano=${plano.id}&periodo=${periodo}`}
          className={`block w-full text-center font-bold py-3.5 rounded-xl text-sm transition-all ${
            destaque
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
              : 'bg-gray-900 hover:bg-gray-800 text-white'
          }`}
        >
          Começar agora
        </Link>
      </div>

      <div className="border-t border-gray-50 px-6 sm:px-7 py-5">
        {plano.limite_veiculos !== null && (
          <div className="flex items-center gap-2.5 mb-3">
            <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-gray-700 font-medium">Até {plano.limite_veiculos} veículos</span>
          </div>
        )}
        {plano.limite_veiculos === null && (
          <div className="flex items-center gap-2.5 mb-3">
            <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-gray-700 font-medium">Veículos ilimitados</span>
          </div>
        )}
        <ul className="space-y-2.5">
          {plano.features.map(f => (
            <li key={f} className="flex items-start gap-2.5">
              <CheckIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-600">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ── toggle mensal / anual ─────────────────────────── */
function TogglePeriodo({
  periodo,
  onChange,
}: {
  periodo: 'mensal' | 'anual'
  onChange: (v: 'mensal' | 'anual') => void
}) {
  return (
    <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-1">
      {(['mensal', 'anual'] as const).map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            periodo === p
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {p === 'mensal' ? 'Mensal' : (
            <span className="flex items-center gap-1.5">
              Anual
              <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-1.5 py-0.5 rounded-md">
                -20%
              </span>
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ── comparativo de features ───────────────────────── */
const COMPARATIVO_GESTOR = [
  { feature: 'Veículos', starter: 'Até 5', pro: 'Até 20', frota: 'Ilimitados' },
  { feature: 'Motoristas', starter: '✓', pro: '✓', frota: '✓' },
  { feature: 'Controle de despesas', starter: '✓', pro: '✓', frota: '✓' },
  { feature: 'Vencimentos e alertas', starter: '✓', pro: '✓', frota: '✓' },
  { feature: 'Gestão de multas e parcelas', starter: '—', pro: '✓', frota: '✓' },
  { feature: 'Contratos digitais', starter: '—', pro: '✓', frota: '✓' },
  { feature: 'Relatórios avançados', starter: '—', pro: '✓', frota: '✓' },
  { feature: 'API de integração', starter: '—', pro: '—', frota: '✓' },
  { feature: 'Gerente de conta', starter: '—', pro: '—', frota: '✓' },
]

function ComparativoGestor() {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-5 py-4 text-gray-500 font-semibold w-1/2">Recurso</th>
            <th className="px-4 py-4 text-center text-gray-700 font-bold">Starter</th>
            <th className="px-4 py-4 text-center text-blue-700 font-bold bg-blue-50">Pro</th>
            <th className="px-4 py-4 text-center text-gray-700 font-bold">Frota</th>
          </tr>
        </thead>
        <tbody>
          {COMPARATIVO_GESTOR.map((row, i) => (
            <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
              <td className="px-5 py-3.5 text-gray-700">{row.feature}</td>
              <td className={`px-4 py-3.5 text-center ${row.starter === '—' ? 'text-gray-300' : 'text-gray-700 font-medium'}`}>{row.starter}</td>
              <td className={`px-4 py-3.5 text-center bg-blue-50/50 ${row.pro === '—' ? 'text-gray-300' : 'text-blue-700 font-semibold'}`}>{row.pro}</td>
              <td className={`px-4 py-3.5 text-center ${row.frota === '—' ? 'text-gray-300' : 'text-gray-700 font-medium'}`}>{row.frota}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── FAQ ───────────────────────────────────────────── */
const FAQS = [
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Não há fidelidade. Cancele quando quiser diretamente pelo seu painel, sem burocracia.',
  },
  {
    q: 'Como funciona o plano anual?',
    a: 'Você paga 10 meses e ganha 2 meses grátis (desconto de 20%). O valor total é cobrado de uma vez no cartão ou PIX.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'PIX (aprovação imediata), cartão de crédito (parcelado em até 12x) e boleto bancário.',
  },
  {
    q: 'Posso trocar de plano depois?',
    a: 'Sim. Você pode fazer upgrade ou downgrade a qualquer momento. O valor é ajustado proporcionalmente.',
  },
  {
    q: 'Preciso colocar cartão para experimentar?',
    a: 'O acesso é liberado imediatamente após a confirmação do pagamento. Não há período de trial automático — entre em contato conosco se quiser uma demonstração.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left flex items-center justify-between px-6 py-5 font-semibold text-gray-800 text-sm hover:bg-blue-50/50 transition-colors"
      >
        <span>{q}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0 ml-4 transition-colors ${open ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
          {open ? '−' : '+'}
        </div>
      </button>
      {open && <div className="px-6 pb-5 text-gray-500 text-sm leading-relaxed">{a}</div>}
    </div>
  )
}

/* ── página principal ──────────────────────────────── */
export default function PlanosPage() {
  const [periodo, setPeriodo] = useState<'mensal' | 'anual'>('mensal')
  const [perfil, setPerfil] = useState<'motorista' | 'gestor'>('gestor')

  const planosExibidos = PLANOS.filter(p => p.perfil === perfil)

  return (
    <div className="font-sans antialiased bg-white text-gray-900 min-h-screen">
      <style>{`
        html { scroll-behavior: smooth; }
        .hero-planos {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #1d4ed8 100%);
          position: relative; overflow: hidden;
        }
        .hero-planos::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0);
          background-size: 32px 32px;
        }
      `}</style>

      {/* ── Navbar ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <CarSvg className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">
                Roda<span className="text-blue-600">Fácil</span><span className="text-blue-400 font-bold ml-0.5">SC</span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <Link href="/login" className="border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 font-medium px-4 py-2 rounded-lg text-sm transition-all">
                Entrar
              </Link>
              <a href="#planos" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-all shadow-sm">
                Ver planos
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero-planos pt-16">
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Planos simples, sem surpresas
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Escolha o plano<br />
            <span className="text-blue-300">ideal para você</span>
          </h1>
          <p className="text-blue-100/80 text-lg mb-8">
            Sem fidelidade. Cancele quando quiser. Acesso imediato após o pagamento.
          </p>
          <TogglePeriodo periodo={periodo} onChange={setPeriodo} />
        </div>
      </section>

      {/* ── Seletor de perfil + Cards ── */}
      <section id="planos" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* tabs de perfil */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
            {(['gestor', 'motorista'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPerfil(p)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  perfil === p
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p === 'gestor' ? '🚗 Gestor de frota' : '📱 Motorista de app'}
              </button>
            ))}
          </div>
        </div>

        {/* cards */}
        <div className={`grid gap-6 ${
          planosExibidos.length === 1
            ? 'max-w-sm mx-auto'
            : planosExibidos.length === 2
            ? 'sm:grid-cols-2 max-w-2xl mx-auto'
            : 'sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {planosExibidos.map(plano => (
            <PlanoCard key={plano.id} plano={plano} periodo={periodo} />
          ))}
        </div>

        {/* Comparativo (só gestores) */}
        {perfil === 'gestor' && (
          <div className="mt-16">
            <h2 className="text-xl font-extrabold text-gray-900 text-center mb-6">
              Comparativo detalhado
            </h2>
            <ComparativoGestor />
          </div>
        )}
      </section>

      {/* ── Garantias ── */}
      <section className="bg-gray-50 border-y border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: '🔒', titulo: 'Pagamento seguro', desc: 'Processado pelo Pagar.me com criptografia SSL' },
            { icon: '⚡', titulo: 'Acesso imediato', desc: 'Liberado automaticamente após confirmação do PIX ou cartão' },
            { icon: '❌', titulo: 'Sem fidelidade', desc: 'Cancele quando quiser, sem multa e sem burocracia' },
          ].map(item => (
            <div key={item.titulo} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{item.icon}</span>
              <p className="font-bold text-gray-900 text-sm">{item.titulo}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-8">
          Perguntas frequentes
        </h2>
        <div className="space-y-3">
          {FAQS.map(({ q, a }) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="hero-planos py-16">
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Pronto para começar?
          </h2>
          <p className="text-blue-100/80 mb-8">
            Escolha seu plano e tenha acesso em minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { setPerfil('gestor'); document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="bg-white text-blue-800 hover:bg-blue-50 font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow"
            >
              🚗 Planos para gestores
            </button>
            <button
              onClick={() => { setPerfil('motorista'); document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="bg-blue-500/20 border border-blue-400/40 hover:bg-blue-500/30 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all"
            >
              📱 Planos para motoristas
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <CarSvg className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-sm">RodaFácilSC</span>
          </div>
          <p className="text-gray-500 text-xs">© {new Date().getFullYear()} RodaFácil SC. Todos os direitos reservados.</p>
          <Link href="/" className="text-gray-400 hover:text-white text-xs transition-colors">← Voltar ao site</Link>
        </div>
      </footer>
    </div>
  )
}
