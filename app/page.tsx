'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

/* ── ícones inline ─────────────────────────────────────────────────── */
const CarSvg = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l3-4A1 1 0 0018 9h-5V5a1 1 0 00-1-1H3z"/>
  </svg>
)
const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
  </svg>
)
const Check = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
  </svg>
)
const StarSvg = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
)

const MANUTENCAO_ITEMS = [
  'Revisões preventivas periódicas conforme o fabricante',
  'Pneus e freios sempre revisados e calibrados',
  'Atendimento rápido em caso de imprevistos mecânicos',
  'Documentação 100% regularizada — IPVA, licenciamento e seguro',
  'Higienização completa antes de cada entrega',
]

const FAQS = [
  { q: 'Preciso ter CNPJ para alugar?', a: 'Não. Você pode alugar como pessoa física. Basta ter CNH válida, estar cadastrado em alguma plataforma e passar pela nossa análise.' },
  { q: 'Qual é o prazo do contrato?', a: 'Trabalhamos exclusivamente com contratos mensais, renovados a cada mês. Sem surpresas e sem letras miúdas.' },
  { q: 'É obrigatório pagar caução?', a: 'Sim. No início do contrato é cobrado um valor de caução como garantia, devolvido ao final da locação desde que o veículo seja entregue nas mesmas condições. Entre em contato para saber o valor.' },
  { q: 'Posso escolher qual veículo vou usar?', a: 'Os veículos são indicados conforme a disponibilidade da frota. Todos estão revisados e habilitados para rodar nas plataformas.' },
  { q: 'E se o carro tiver algum problema mecânico?', a: 'Nossa equipe entra em ação rapidamente. Problemas por desgaste normal são por nossa conta. Você não fica parado por muito tempo.' },
  { q: 'Como é feito o pagamento?', a: 'Pagamento via PIX ou boleto, conforme o plano. Sem taxas escondidas ou surpresas.' },
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
      {open && (
        <div className="px-6 pb-5 text-gray-500 text-sm leading-relaxed">{a}</div>
      )}
    </div>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="font-sans antialiased bg-white text-gray-900">
      <style>{`
        html { scroll-behavior: smooth; }
        .hero-bg {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #1d4ed8 100%);
          position: relative; overflow: hidden;
        }
        .hero-bg::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0);
          background-size: 32px 32px;
        }
        .hero-bg::after {
          content: '';
          position: absolute; top: -200px; right: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%);
          border-radius: 50%;
        }
        .card-lift { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .card-lift:hover { transform: translateY(-5px); box-shadow: 0 24px 48px rgba(0,0,0,0.10); }
        .glass-card {
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .stat-item { border-left: 2px solid rgba(255,255,255,0.15); }
        .stat-item:first-child { border-left: none; }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────── */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <CarSvg className="w-4 h-4 text-white" />
              </div>
              <span className={`text-lg font-extrabold tracking-tight ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                Roda<span className="text-blue-400">Fácil</span>
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
              {[['#como-funciona','Como funciona'],['#diferenciais','Diferenciais'],['#manutencao','Manutenção'],['#faq','FAQ']].map(([href, label]) => (
                <a key={href} href={href} className={`hover:text-blue-500 transition-colors ${scrolled ? 'text-gray-500' : 'text-white/70 hover:text-white'}`}>{label}</a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={`border font-medium px-4 py-2 rounded-lg text-sm transition-all ${scrolled ? 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600' : 'border-white/30 hover:border-white/60 text-white/80 hover:text-white hover:bg-white/5'}`}
              >
                Login Gerenciamento
              </Link>
              <a
                href="#contato"
                className={`font-semibold px-5 py-2 rounded-lg text-sm transition-all shadow-sm ${scrolled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-blue-800 hover:bg-blue-50'}`}
              >
                Quero locar
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="hero-bg min-h-screen flex flex-col justify-center pt-16">
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* LEFT */}
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold px-4 py-1.5 rounded-full mb-7">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                Vagas abertas · Santa Catarina, SC
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-white leading-[1.1] tracking-tight mb-6">
                Dirija nos apps<br/>
                sem ter<br/>
                <span className="relative inline-block">
                  <span className="relative z-10 text-blue-300">carro próprio.</span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-blue-600/30 rounded-sm -z-0"></span>
                </span>
              </h1>

              <p className="text-blue-100/70 text-base leading-relaxed mb-10 max-w-md">
                Locação mensal de veículos para motoristas de Uber, 99 e inDrive.
                Frota revisada, contrato simples e suporte dedicado.
              </p>

              <div className="flex flex-wrap gap-3 mb-14">
                <a href="#contato" className="inline-flex items-center gap-2 bg-white text-blue-800 hover:bg-blue-50 font-bold px-7 py-3.5 rounded-xl text-sm transition-all shadow-xl hover:shadow-2xl hover:scale-[1.03]">
                  Quero locar agora
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#como-funciona" className="inline-flex items-center gap-2 border border-white/20 text-white/80 hover:border-white/50 hover:text-white font-medium px-7 py-3.5 rounded-xl text-sm transition-all hover:bg-white/5">
                  Ver como funciona
                </a>
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-4">
                {[['40','Veículos na frota'],['48h','Para começar a rodar'],['100%','Frota revisada']].map(([val, label], i) => (
                  <div key={val} className={`stat-item ${i === 0 ? 'pl-0' : 'pl-5'}`}>
                    <p className="text-2xl font-extrabold text-white">{val}</p>
                    <p className="text-blue-300/70 text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: mockup */}
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-3xl scale-95"></div>
              <div className="relative glass-card rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Sua locação</p>
                    <p className="text-white font-bold text-lg mt-0.5">Contrato Mensal Ativo</p>
                  </div>
                  <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-400/20">● Ativo</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CarSvg className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">Veículo disponível</p>
                      <p className="text-white/40 text-xs mt-0.5">Revisado · Plataformas liberadas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">Pronto</p>
                      <p className="text-blue-300 text-xs">para rodar</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['Uber','99','inDrive'].map(p => (
                    <div key={p} className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
                      <p className="text-white font-bold text-base">{p}</p>
                      <p className="text-white/40 text-xs mt-0.5">Liberado</p>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Manutenção em dia</p>
                      <p className="text-blue-300/70 text-xs">Revisão · Pneus · Documentação</p>
                    </div>
                  </div>
                </div>
                <a href="#contato" className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold text-center py-3 rounded-xl transition-colors">
                  Solicitar locação →
                </a>
              </div>
              <div className="absolute -top-5 -right-5 bg-white text-gray-900 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                Aprovado em 24h
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#0f172a] border border-white/10 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl">
                <span className="text-blue-400 font-bold">SC</span> · Contrato mensal
              </div>
            </div>
          </div>
        </div>
        {/* Wave */}
        <div className="relative h-16">
          <svg className="absolute bottom-[-1px] left-0 right-0 w-full" viewBox="0 0 1440 64" fill="none" preserveAspectRatio="none">
            <path d="M0 64L1440 64L1440 0C1200 48 960 64 720 48C480 32 240 0 0 0L0 64Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────── */}
      <section id="como-funciona" className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">Simples assim</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Como funciona</h2>
            <p className="text-gray-400 mt-3 max-w-sm mx-auto text-sm">Em 3 passos você já pode estar rodando e gerando renda.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', color: 'bg-blue-600', title: 'Cadastre-se', desc: 'Preencha o formulário com seus dados. Tudo online, sem filas e sem burocracia.', icon: <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
              { num: '2', color: 'bg-blue-700', title: 'Retire o veículo disponível', desc: 'Indicamos o carro disponível da frota. Todos revisados e habilitados para as plataformas.', icon: <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg> },
              { num: '3', color: 'bg-blue-800', title: 'Comece a ganhar', desc: 'Assine o contrato mensal, pague o caução e saia rodando. Em até 48h gerando renda.', icon: <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
            ].map(({ num, color, title, desc, icon }) => (
              <div key={num} className="text-center group">
                <div className="relative inline-flex mb-6">
                  <div className={`w-20 h-20 ${color} rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform`}>
                    {icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-blue-200 rounded-full flex items-center justify-center text-xs font-extrabold text-blue-700 shadow-sm">{num}</div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIFERENCIAIS ──────────────────────────────────── */}
      <section id="diferenciais" className="py-28 bg-blue-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block bg-blue-500/20 text-blue-300 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">Por que a Roda Fácil?</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-6">Tudo pensado<br/>para o motorista</h2>
              <p className="text-blue-200/60 text-sm leading-relaxed mb-10">Cada detalhe foi desenvolvido para que você tenha a melhor experiência e maximize seus ganhos desde o primeiro dia.</p>
              <div className="space-y-5">
                {[
                  { title: 'Aprovação em até 24 horas', desc: 'Análise rápida, sem complicação e sem espera.', icon: <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> },
                  { title: 'Contrato mensal transparente', desc: 'Sem taxas escondidas. Você sabe exatamente o que paga.', icon: <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> },
                  { title: 'Uber, 99 e inDrive liberados', desc: 'Toda a frota já habilitada. É só vincular e rodar.', icon: <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg> },
                  { title: 'Suporte dedicado', desc: 'Time sempre disponível. Você nunca fica na mão.', icon: <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
                ].map(({ title, desc, icon }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">{icon}</div>
                    <div>
                      <p className="text-white font-semibold text-sm">{title}</p>
                      <p className="text-blue-200/50 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: '40', label: 'veículos na frota', bar: 'w-4/5', cls: 'bg-white/5 border border-white/10', valCls: 'text-white', labelCls: 'text-blue-300/60', barCls: 'bg-blue-500' },
                { val: '48h', label: 'para começar a rodar', bar: 'w-3/5', cls: 'bg-white/5 border border-white/10', valCls: 'text-white', labelCls: 'text-blue-300/60', barCls: 'bg-blue-400' },
              ].map(({ val, label, bar, cls, valCls, labelCls, barCls }) => (
                <div key={val} className={`card-lift ${cls} rounded-2xl p-7`}>
                  <p className={`text-4xl font-extrabold ${valCls} mb-1`}>{val}</p>
                  <p className={`${labelCls} text-sm`}>{label}</p>
                  <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${bar} ${barCls} rounded-full`}></div>
                  </div>
                </div>
              ))}
              <div className="card-lift bg-blue-600 border border-blue-500 rounded-2xl p-7 col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-extrabold text-white mb-1">R$ 4.000+</p>
                    <p className="text-blue-200/70 text-sm">média de faturamento mensal</p>
                  </div>
                  <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                  </div>
                </div>
              </div>
              {[
                { val: '100%', label: 'frota revisada', bar: 'w-full', barCls: 'bg-blue-300' },
                { val: '0', label: 'burocracia desnecessária', bar: 'w-0', barCls: 'bg-blue-500' },
              ].map(({ val, label, bar, barCls }) => (
                <div key={val} className="card-lift bg-white/5 border border-white/10 rounded-2xl p-7">
                  <p className="text-4xl font-extrabold text-white mb-1">{val}</p>
                  <p className="text-blue-300/60 text-sm">{label}</p>
                  <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${bar} ${barCls} rounded-full`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MANUTENÇÃO ────────────────────────────────────── */}
      <section id="manutencao" className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">Frota sempre em dia</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-5">Manutenção cuidada para você focar só em ganhar</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">Carro parado é dinheiro perdido. Nossa equipe mantém a frota em dia para que você nunca fique na mão.</p>
              <div className="space-y-3">
                {MANUTENCAO_ITEMS.map(item => (
                  <div key={item} className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3.5">
                    <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-gray-700 font-medium text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="card-lift bg-blue-600 rounded-2xl p-6 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <p className="font-bold text-sm">Revisão Periódica</p>
                <p className="text-blue-200 text-xs mt-1">Conforme o fabricante</p>
              </div>
              <div className="card-lift bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <p className="font-bold text-sm text-gray-900">Seguro em dia</p>
                <p className="text-gray-400 text-xs mt-1">Documentação ok</p>
              </div>
              <div className="card-lift bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                </div>
                <p className="font-bold text-sm text-gray-900">Higienização</p>
                <p className="text-gray-400 text-xs mt-1">Antes de cada entrega</p>
              </div>
              <div className="card-lift bg-[#172554] rounded-2xl p-6 text-white">
                <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </div>
                <p className="font-bold text-sm">Suporte Ágil</p>
                <p className="text-blue-300 text-xs mt-1">Imprevistos resolvidos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ───────────────────────────────────── */}
      <section className="py-28 bg-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-blue-100 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">Depoimentos</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">O que nossos motoristas dizem</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-lift bg-white rounded-2xl p-7 shadow-sm border border-blue-100">
              <div className="flex gap-0.5 mb-5">{Array(5).fill(0).map((_, i) => <StarSvg key={i} className="w-4 h-4 text-blue-500" />)}</div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">"Em menos de 2 dias já estava rodando na Uber. O processo foi simples e o carro estava impecável. Recomendo demais!"</p>
              <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">CM</div>
                <div><p className="font-semibold text-gray-900 text-sm">Carlos M.</p><p className="text-gray-400 text-xs">Motorista Uber · SC</p></div>
              </div>
            </div>
            <div className="card-lift bg-blue-700 rounded-2xl p-7 shadow-sm">
              <div className="flex gap-0.5 mb-5">{Array(5).fill(0).map((_, i) => <StarSvg key={i} className="w-4 h-4 text-blue-200" />)}</div>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">"Nunca pensei que seria tão fácil. Hoje faço uma renda extra de mais de R$ 3.000 por mês rodando no meu próprio tempo."</p>
              <div className="flex items-center gap-3 pt-5 border-t border-blue-600">
                <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">AR</div>
                <div><p className="font-semibold text-white text-sm">Ana R.</p><p className="text-blue-300 text-xs">Motorista 99 · SC</p></div>
              </div>
            </div>
            <div className="card-lift bg-white rounded-2xl p-7 shadow-sm border border-blue-100">
              <div className="flex gap-0.5 mb-5">{Array(5).fill(0).map((_, i) => <StarSvg key={i} className="w-4 h-4 text-blue-500" />)}</div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">"O suporte é excelente. Tive um problema com o carro e resolveram no mesmo dia. Muito diferente de outras locadoras."</p>
              <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                <div className="w-9 h-9 bg-blue-800 rounded-full flex items-center justify-center text-white text-xs font-bold">RS</div>
                <div><p className="font-semibold text-gray-900 text-sm">Roberto S.</p><p className="text-gray-400 text-xs">Motorista inDrive · SC</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section id="faq" className="py-28 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">Dúvidas</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => <FaqItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────── */}
      <section className="py-20 bg-blue-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">Pronto para começar a rodar?</h2>
          <p className="text-blue-200 text-sm mb-8 max-w-md mx-auto">Em até 48 horas você pode estar gerando renda. Preencha o formulário e a gente entra em contato.</p>
          <a href="#contato" className="inline-flex items-center gap-2 bg-white text-blue-800 hover:bg-blue-50 font-bold px-8 py-4 rounded-xl text-sm transition-all shadow-xl hover:scale-[1.03]">
            Solicitar locação agora
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── CONTATO ───────────────────────────────────────── */}
      <section id="contato" className="py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-blue-100 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">Fale com a gente</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Dê o primeiro passo</h2>
            <p className="text-gray-400 text-sm mt-3">Nossa equipe entra em contato em breve para tirar todas as suas dúvidas.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-blue-700 px-6 py-5">
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Contato direto</p>
                  <p className="text-white font-bold">Fale com a Roda Fácil</p>
                </div>
                <div className="px-6 py-5 space-y-5">
                  <a href="mailto:renaneliasbq@gmail.com" className="flex items-start gap-3 group">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">E-mail</p>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">renaneliasbq@gmail.com</p>
                    </div>
                  </a>
                  <a href="tel:+5547999987722" className="flex items-start gap-3 group">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">WhatsApp / Telefone</p>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">(47) 99998-7722</p>
                    </div>
                  </a>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Localização</p>
                      <p className="text-sm font-semibold text-gray-900">Santa Catarina, SC</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <p className="font-bold text-gray-900 text-base mb-6">Solicitar locação</p>
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    const fd = new FormData(e.currentTarget as HTMLFormElement)
                    const nome = fd.get('nome')
                    const telefone = fd.get('telefone')
                    const plataforma = fd.get('plataforma')
                    const mensagem = fd.get('mensagem')
                    const texto = encodeURIComponent(`Olá! Me chamo ${nome} e tenho interesse em locar um veículo.\nPlataforma: ${plataforma}\n${mensagem ? 'Mensagem: ' + mensagem : ''}`)
                    window.open(`https://wa.me/5547999987722?text=${texto}`, '_blank')
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nome completo *</label>
                      <input type="text" name="nome" placeholder="Seu nome" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">WhatsApp *</label>
                      <input type="tel" name="telefone" placeholder="(47) 99999-9999" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Plataforma *</label>
                    <select name="plataforma" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                      <option value="">Selecione uma plataforma</option>
                      <option>Uber</option>
                      <option>99</option>
                      <option>inDrive</option>
                      <option>Mais de uma</option>
                      <option>Ainda não tenho cadastro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mensagem (opcional)</label>
                    <textarea rows={3} name="mensagem" placeholder="Alguma dúvida?" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"></textarea>
                  </div>
                  <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl text-sm transition-all hover:scale-[1.01] shadow-md flex items-center justify-center gap-2">
                    Quero começar a rodar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-center text-gray-300 text-xs">Seus dados estão seguros. Contato somente sobre sua locação.</p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-[#0f172a] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CarSvg className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-extrabold tracking-tight">Roda<span className="text-blue-400">Fácil</span></span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">A solução mais simples para motoristas de aplicativo que querem gerar renda extra com praticidade e segurança.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Navegação</p>
              <ul className="space-y-2.5 text-sm text-white/50">
                {[['#como-funciona','Como funciona'],['#diferenciais','Diferenciais'],['#manutencao','Manutenção'],['#faq','Perguntas frequentes']].map(([href, label]) => (
                  <li key={href}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Contato</p>
              <ul className="space-y-3 text-sm text-white/50">
                <li className="flex items-center gap-2"><svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>renaneliasbq@gmail.com</li>
                <li className="flex items-center gap-2"><svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>(47) 99998-7722</li>
                <li className="flex items-center gap-2"><svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>Santa Catarina, SC</li>
              </ul>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/25">
            <span>© {new Date().getFullYear()} RodaFácil. Todos os direitos reservados.</span>
            <span>Santa Catarina · Brasil</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
