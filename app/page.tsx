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
  'Ganhos por plataforma: Uber, 99, inDrive e outros lado a lado',
  'Despesas categorizadas: combustível, manutenção, alimentação e mais',
  'Taxa média e lucro líquido calculados automaticamente',
  'Metas mensais com acompanhamento semana a semana',
  'Histórico completo de ganhos e despesas por período',
]

const FAQS = [
  { q: 'O sistema é para quem?', a: 'Para dois perfis: donos de frota que precisam gerenciar veículos, contratos e motoristas — e motoristas de aplicativo que querem organizar seus ganhos de Uber, 99, inDrive e outros. Cada um tem seu próprio painel.' },
  { q: 'Preciso baixar algum aplicativo?', a: 'O acesso é 100% pelo navegador, no celular ou no computador. Sem instalação. O portal do motorista foi desenvolvido especialmente para uso no celular.' },
  { q: 'Como funciona para donos de frota?', a: 'Você cadastra seus veículos, vincula motoristas, registra contratos e acompanha despesas. Tudo em um painel centralizado, com visão por veículo, motorista e período.' },
  { q: 'Como funciona para motoristas de app?', a: 'Você registra seus ganhos por plataforma e suas despesas do dia a dia. O sistema calcula sua taxa média, lucro líquido e compara sua evolução mês a mês.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Utilizamos infraestrutura segura com autenticação individual. Cada usuário acessa apenas seus próprios dados.' },
  { q: 'Como posso começar?', a: 'É simples e 100% self-service! Acesse nossa página de planos, escolha o plano ideal, faça o pagamento via PIX, cartão ou boleto e já tenha acesso imediato ao sistema. Sem precisar falar com ninguém.' },
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
                Roda<span className="text-blue-400">Fácil</span><span className="text-blue-300 font-bold ml-0.5">SC</span>
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
              {[['#como-funciona','Como funciona'],['#diferenciais','Diferenciais'],['#manutencao','Motoristas'],['#faq','FAQ']].map(([href, label]) => (
                <a key={href} href={href} className={`hover:text-blue-500 transition-colors ${scrolled ? 'text-gray-500' : 'text-white/70 hover:text-white'}`}>{label}</a>
              ))}
              <Link href="/planos" className={`font-semibold hover:text-blue-500 transition-colors ${scrolled ? 'text-blue-600' : 'text-blue-300 hover:text-blue-200'}`}>
                Planos e preços
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={`border font-medium px-4 py-2 rounded-lg text-sm transition-all ${scrolled ? 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600' : 'border-white/30 hover:border-white/60 text-white/80 hover:text-white hover:bg-white/5'}`}
              >
                Login Gerenciamento
              </Link>
              <Link
                href="/planos"
                className={`font-semibold px-5 py-2 rounded-lg text-sm transition-all shadow-sm ${scrolled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-blue-800 hover:bg-blue-50'}`}
              >
                Assinar agora
              </Link>
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
                Gestão para frotas e motoristas · SC
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-white leading-[1.1] tracking-tight mb-6">
                Sua frota e<br/>
                seus ganhos,<br/>
                <span className="relative inline-block">
                  <span className="relative z-10 text-blue-300">sob controle.</span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-blue-600/30 rounded-sm -z-0"></span>
                </span>
              </h1>

              <p className="text-blue-100/70 text-base leading-relaxed mb-10 max-w-md">
                Do proprietário de frota que precisa de visão total ao motorista
                que quer entender seus ganhos reais — a RodaFácil tem a solução
                certa para você.
              </p>

              <div className="flex flex-wrap gap-3 mb-14">
                <Link href="/planos" className="inline-flex items-center gap-2 bg-white text-blue-800 hover:bg-blue-50 font-bold px-7 py-3.5 rounded-xl text-sm transition-all shadow-xl hover:shadow-2xl hover:scale-[1.03]">
                  Ver planos e preços
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#como-funciona" className="inline-flex items-center gap-2 border border-white/20 text-white/80 hover:border-white/50 hover:text-white font-medium px-7 py-3.5 rounded-xl text-sm transition-all hover:bg-white/5">
                  Ver como funciona
                </a>
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-4">
                {[['40','Veículos gerenciados'],['Imediato','Acesso na hora'],['100%','Digital, sem papel']].map(([val, label], i) => (
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
                    <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Seu painel</p>
                    <p className="text-white font-bold text-lg mt-0.5">Gestão em tempo real</p>
                  </div>
                  <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-400/20">● Ativo</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CarSvg className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">Frota e motoristas</p>
                      <p className="text-white/40 text-xs mt-0.5">Contratos · Despesas · Relatórios</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">Ativo</p>
                      <p className="text-blue-300 text-xs">online 24h</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[['Uber','Ganhos'],['99','Despesas'],['inDrive','Metas']].map(([p, sub]) => (
                    <div key={p} className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
                      <p className="text-white font-bold text-base">{p}</p>
                      <p className="text-white/40 text-xs mt-0.5">{sub}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Ganhos e despesas organizados</p>
                      <p className="text-blue-300/70 text-xs">Resultados · Metas · Análises</p>
                    </div>
                  </div>
                </div>
                <Link href="/planos" className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold text-center py-3 rounded-xl transition-colors">
                  Ver planos e começar →
                </Link>
              </div>
              <div className="absolute -top-5 -right-5 bg-white text-gray-900 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                Configurado em 24h
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#0f172a] border border-white/10 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl">
                <span className="text-blue-400 font-bold">SC</span> · Gestão inteligente
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
            <p className="text-gray-400 mt-3 max-w-sm mx-auto text-sm">Em 3 passos você já tem controle total da sua operação.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', color: 'bg-blue-600', title: 'Escolha seu plano', desc: 'Acesse a página de planos, escolha o ideal para o seu perfil e conclua o pagamento online — PIX, cartão ou boleto. Tudo em minutos.', icon: <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
              { num: '2', color: 'bg-blue-700', title: 'Configure sua operação', desc: 'Dono de frota? Cadastre seus veículos e motoristas. Motorista? Comece a registrar seus ganhos e despesas por plataforma.', icon: <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg> },
              { num: '3', color: 'bg-blue-800', title: 'Tenha controle total', desc: 'Acompanhe frota, motoristas, ganhos e despesas em tempo real. Dados precisos para decisões melhores.', icon: <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
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
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-6">Tudo pensado<br/>para quem move</h2>
              <p className="text-blue-200/60 text-sm leading-relaxed mb-10">Cada funcionalidade foi desenvolvida para que donos de frota e motoristas tenham clareza e controle total sobre suas operações.</p>
              <div className="space-y-5">
                {[
                  { title: 'Gestão de frota completa', desc: 'Veículos, motoristas, contratos e despesas centralizados em um único painel.', icon: <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> },
                  { title: 'Controle de ganhos por plataforma', desc: 'Motoristas acompanham Uber, 99, inDrive e outros lado a lado, com lucro líquido real.', icon: <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> },
                  { title: 'Relatórios e insights automáticos', desc: 'Veja o que está indo bem e o que precisa de atenção, sem esforço e sem planilha.', icon: <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg> },
                  { title: 'Acesso em qualquer dispositivo', desc: 'Painel web completo para gestores e portal mobile para motoristas. Sempre na palma da mão.', icon: <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
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
                { val: '40', label: 'veículos gerenciados', bar: 'w-4/5', cls: 'bg-white/5 border border-white/10', valCls: 'text-white', labelCls: 'text-blue-300/60', barCls: 'bg-blue-500' },
                { val: '48h', label: 'para estar no ar', bar: 'w-3/5', cls: 'bg-white/5 border border-white/10', valCls: 'text-white', labelCls: 'text-blue-300/60', barCls: 'bg-blue-400' },
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
                    <p className="text-blue-200/70 text-sm">média de ganhos monitorados/mês</p>
                  </div>
                  <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                  </div>
                </div>
              </div>
              {[
                { val: '100%', label: 'digital, sem papel', bar: 'w-full', barCls: 'bg-blue-300' },
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
              <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">Para motoristas de app</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-5">Seus ganhos organizados, de verdade</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">Chega de planilha ou achismo. Veja exatamente quanto você ganhou, quanto gastou e o que sobrou — por plataforma e por período.</p>
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
                <p className="font-bold text-sm">Ganhos por plataforma</p>
                <p className="text-blue-200 text-xs mt-1">Uber · 99 · inDrive</p>
              </div>
              <div className="card-lift bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <p className="font-bold text-sm text-gray-900">Despesas</p>
                <p className="text-gray-400 text-xs mt-1">Categorias · Comprovantes</p>
              </div>
              <div className="card-lift bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                </div>
                <p className="font-bold text-sm text-gray-900">Metas mensais</p>
                <p className="text-gray-400 text-xs mt-1">Progresso semana a semana</p>
              </div>
              <div className="card-lift bg-[#172554] rounded-2xl p-6 text-white">
                <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </div>
                <p className="font-bold text-sm">Análises e histórico</p>
                <p className="text-blue-300 text-xs mt-1">Evolução mês a mês</p>
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
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">O que nossos usuários dizem</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-lift bg-white rounded-2xl p-7 shadow-sm border border-blue-100">
              <div className="flex gap-0.5 mb-5">{Array(5).fill(0).map((_, i) => <StarSvg key={i} className="w-4 h-4 text-blue-500" />)}</div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">"Antes eu gerenciava tudo no papel. Hoje vejo cada veículo, cada motorista e cada despesa em segundos. É outra realidade."</p>
              <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">FA</div>
                <div><p className="font-semibold text-gray-900 text-sm">Francisco A.</p><p className="text-gray-400 text-xs">Dono de frota · SC</p></div>
              </div>
            </div>
            <div className="card-lift bg-blue-700 rounded-2xl p-7 shadow-sm">
              <div className="flex gap-0.5 mb-5">{Array(5).fill(0).map((_, i) => <StarSvg key={i} className="w-4 h-4 text-blue-200" />)}</div>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">"Nunca soube quanto realmente ganhava descontando tudo. Com o app ficou claro — passei a trabalhar de forma mais inteligente e a ganhar mais."</p>
              <div className="flex items-center gap-3 pt-5 border-t border-blue-600">
                <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">AR</div>
                <div><p className="font-semibold text-white text-sm">Ana R.</p><p className="text-blue-300 text-xs">Motorista Uber/99 · SC</p></div>
              </div>
            </div>
            <div className="card-lift bg-white rounded-2xl p-7 shadow-sm border border-blue-100">
              <div className="flex gap-0.5 mb-5">{Array(5).fill(0).map((_, i) => <StarSvg key={i} className="w-4 h-4 text-blue-500" />)}</div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">"O histórico de ganhos me ajudou a entender em qual dia e horário eu ganho mais. Hoje trabalho de forma mais estratégica."</p>
              <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                <div className="w-9 h-9 bg-blue-800 rounded-full flex items-center justify-center text-white text-xs font-bold">RS</div>
                <div><p className="font-semibold text-gray-900 text-sm">Roberto S.</p><p className="text-gray-400 text-xs">Motorista inDrive · SC</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANOS TEASER ─────────────────────────────────── */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">Planos</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Simples, transparente e acessível</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">Escolha o plano ideal para o seu perfil. Assine online em minutos, sem burocracia.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Motorista Pro', preco: 'R$19,90', sub: '/mês', desc: 'Para motoristas de app', cor: 'border-blue-100', icon: '🚗' },
              { label: 'Gestor Starter', preco: 'R$49,90', sub: '/mês', desc: 'Frota pequena até 5 veículos', cor: 'border-blue-100', icon: '🏢' },
              { label: 'Gestor Pro', preco: 'R$99,90', sub: '/mês', desc: 'Frota média até 15 veículos', cor: 'border-blue-500 ring-2 ring-blue-500/20', destaque: true, icon: '⭐' },
              { label: 'Gestor Frota', preco: 'R$199,90', sub: '/mês', desc: 'Frota grande sem limite', cor: 'border-blue-100', icon: '🚛' },
            ].map(({ label, preco, sub, desc, cor, destaque, icon }) => (
              <div key={label} className={`relative rounded-2xl border-2 ${cor} bg-white p-6 flex flex-col gap-3 card-lift`}>
                {destaque && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Mais popular</span>
                )}
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                </div>
                <div className="mt-auto">
                  <span className="text-2xl font-extrabold text-gray-900">{preco}</span>
                  <span className="text-gray-400 text-xs">{sub}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/planos" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]">
              Ver todos os planos e detalhes
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-gray-400 text-xs mt-3">Cancele quando quiser · Sem fidelidade</p>
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
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">Pronto para ter controle total?</h2>
          <p className="text-blue-200 text-sm mb-8 max-w-md mx-auto">Dono de frota ou motorista de app — configure sua conta em minutos e comece a tomar decisões com dados reais.</p>
          <Link href="/planos" className="inline-flex items-center gap-2 bg-white text-blue-800 hover:bg-blue-50 font-bold px-8 py-4 rounded-xl text-sm transition-all shadow-xl hover:scale-[1.03]">
            Ver planos e começar
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── CONTATO ───────────────────────────────────────── */}
      <section id="contato" className="py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-blue-100 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">Fale com a gente</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Ficou com alguma dúvida?</h2>
            <p className="text-gray-400 text-sm mt-3">Nossa equipe está aqui para te ajudar. Mas se preferir, você já pode assinar agora mesmo — direto pelo site, sem precisar falar com ninguém.</p>
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
                <p className="font-bold text-gray-900 text-base mb-6">Envie sua mensagem</p>
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    const fd = new FormData(e.currentTarget as HTMLFormElement)
                    const nome = fd.get('nome')
                    const telefone = fd.get('telefone')
                    const perfil = fd.get('plataforma')
                    const mensagem = fd.get('mensagem')
                    const texto = encodeURIComponent(`Olá! Me chamo ${nome} e tenho uma dúvida sobre a Roda Fácil.\nPerfil: ${perfil}\n${mensagem ? 'Mensagem: ' + mensagem : ''}`)
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
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Perfil *</label>
                    <select name="plataforma" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                      <option value="">Como você usa a Roda Fácil?</option>
                      <option>Sou dono de frota</option>
                      <option>Sou motorista de aplicativo</option>
                      <option>Sou dono de frota e motorista</option>
                      <option>Ainda estou conhecendo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sua dúvida *</label>
                    <textarea rows={3} name="mensagem" placeholder="Escreva sua dúvida ou comentário..." required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"></textarea>
                  </div>
                  <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl text-sm transition-all hover:scale-[1.01] shadow-md flex items-center justify-center gap-2">
                    Enviar pelo WhatsApp
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="border-t border-gray-100 pt-4 text-center">
                    <p className="text-gray-400 text-xs mb-3">Prefere já começar sem precisar de ajuda?</p>
                    <Link href="/planos" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors">
                      Ver planos e assinar agora
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
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
                <span className="text-lg font-extrabold tracking-tight">Roda<span className="text-blue-400">Fácil</span><span className="text-blue-300 font-bold ml-0.5">SC</span></span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">A plataforma inteligente para donos de frota e motoristas de aplicativo gerenciarem suas operações com clareza e controle.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Navegação</p>
              <ul className="space-y-2.5 text-sm text-white/50">
                {[['#como-funciona','Como funciona'],['#diferenciais','Diferenciais'],['#manutencao','Para motoristas'],['#faq','Perguntas frequentes'],].map(([href, label]) => (
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
