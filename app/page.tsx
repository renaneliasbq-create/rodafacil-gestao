import Link from 'next/link'

function CarIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l3-4A1 1 0 0018 9h-5V5a1 1 0 00-1-1H3z"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

const FEATURES = [
  { title: 'Dashboard financeiro', desc: 'Receitas, despesas e lucro em tempo real com gráficos intuitivos.' },
  { title: 'Gestão de motoristas', desc: 'Cadastre motoristas, vincule veículos e controle contratos com facilidade.' },
  { title: 'Controle de recebíveis', desc: 'Acompanhe pagamentos, inadimplentes e registre suas retiradas.' },
  { title: 'Análise de payback', desc: 'Saiba exatamente quando cada veículo se pagou e o lucro acumulado.' },
  { title: 'Histórico de manutenções', desc: 'Registre e acompanhe toda a manutenção da sua frota.' },
  { title: 'Relatórios exportáveis', desc: 'Gere relatórios por período e exporte para CSV com um clique.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <CarIcon />
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            Roda<span className="text-blue-400">Fácil</span>
          </span>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Login de gerenciamento
        </Link>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-900/50 border border-blue-700/50 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-8">
          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
          Gestão completa para frotas de aluguel
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
          Gerencie sua frota<br />
          <span className="text-blue-400">com inteligência</span>
        </h1>

        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Controle motoristas, pagamentos, manutenções e análise de payback tudo em um único painel. Simples, rápido e mobile-first.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-blue-900/50"
        >
          Acessar o painel de gestão
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <CheckIcon />
                <h3 className="font-semibold text-white">{f.title}</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-center">
        <div className="bg-blue-900/40 border border-blue-700/40 rounded-3xl p-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Pronto para começar?</h2>
          <p className="text-slate-300 mb-8 text-sm">Acesse agora o painel com seu e-mail e senha de gestor.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors"
          >
            Login de gerenciamento
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} RodaFácil · Sistema de gestão de frotas
      </footer>
    </div>
  )
}
