'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

/* ── ícones inline ─────────────────────────────────────────────────── */
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

/* ── dados ─────────────────────────────────────────────────────────── */
const FAQS = [
  { q: 'O sistema é para quem?', a: 'Para dois perfis: donos de frota que precisam gerenciar veículos, contratos e motoristas — e motoristas de aplicativo que querem organizar seus ganhos de Uber, 99, iFood, inDrive e outros. Cada perfil tem seu próprio painel personalizado.' },
  { q: 'Preciso baixar algum aplicativo?', a: 'O acesso é 100% pelo navegador, no celular ou no computador. Sem instalação. O portal do motorista foi desenvolvido especialmente para uso no celular, com interface rápida e intuitiva.' },
  { q: 'Como funciona o assistente de IA?', a: 'O assistente analisa seus dados de ganhos, despesas e histórico de corridas e gera recomendações personalizadas: qual plataforma rende mais para você, qual turno é mais lucrativo, quando vale a pena rodar menos. Inteligência real, baseada nos seus próprios números.' },
  { q: 'Como funciona o cadastro por voz?', a: 'Você fala e o app registra. Após uma corrida, basta dizer "ganhei R$ 47 na Uber agora" e o sistema registra automaticamente. Sem digitar nada, sem perder tempo.' },
  { q: 'Como importar o extrato das plataformas?', a: 'Dentro do app você acessa a área de importação, faz upload do extrato da Uber, 99, iFood ou inDrive (arquivo Excel ou PDF que cada plataforma disponibiliza no app deles), e o RodaFácil SC processa tudo automaticamente — sem digitar corrida por corrida.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Utilizamos infraestrutura segura com autenticação individual. Cada usuário acessa apenas seus próprios dados. Nunca compartilhamos informações com terceiros.' },
  { q: 'Como funciona para donos de frota?', a: 'Você cadastra seus veículos, vincula motoristas, registra contratos e acompanha tudo em um painel centralizado. Controle de multas com parcelamento automático para o motorista, alertas de vencimento de documentos e relatórios de rentabilidade por veículo.' },
  { q: 'Quanto custa após o trial de 60 dias?', a: 'Para motoristas: R$ 19,90/mês. Para donos de frota: R$ 49,90/mês. Sem fidelidade, cancele quando quiser. Os 60 dias de trial são gratuitos, sem precisar cadastrar cartão.' },
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

/* ── componente principal ───────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [contatoEnviado, setContatoEnviado] = useState(false)
  const [contatoForm, setContatoForm] = useState({ nome: '', email: '', mensagem: '' })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function enviarWhatsApp(e: React.FormEvent) {
    e.preventDefault()
    const texto = encodeURIComponent(`Olá! Sou ${contatoForm.nome} (${contatoForm.email}).\n\n${contatoForm.mensagem}`)
    window.open(`https://wa.me/5547999987722?text=${texto}`, '_blank')
    setContatoEnviado(true)
  }

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
        .glow-badge {
          background: rgba(99,179,237,0.15);
          border: 1px solid rgba(99,179,237,0.35);
        }
        .feature-icon-bg {
          background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%);
        }
        .unique-badge {
          background: linear-gradient(90deg, #f59e0b, #ef4444);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .float-anim { animation: float 3s ease-in-out infinite; }
        .gradient-text {
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* ── NAVBAR ───────────────────────────────────────────────────── */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-blue-950/95 backdrop-blur-xl shadow-lg shadow-black/20' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">RF</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">RodaFácil SC</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-blue-200">
            <a href="#motorista" className="hover:text-white transition-colors">Motoristas</a>
            <a href="#gestor" className="hover:text-white transition-colors">Donos de Frota</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <Link href="/login" className="bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
            Entrar
          </Link>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="hero-bg min-h-screen flex items-center pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 relative z-10 w-full">
          <div className="max-w-3xl mx-auto text-center">
            {/* badge exclusivo */}
            <div className="inline-flex items-center gap-2 glow-badge rounded-full px-4 py-2 mb-8">
              <span className="text-yellow-400 text-sm">⚡</span>
              <span className="text-blue-200 text-xs font-semibold tracking-wide uppercase">Único no mercado</span>
              <span className="text-yellow-400 text-sm">⚡</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6">
              Gerencie sua frota ou<br />
              <span className="gradient-text">maximize seus ganhos</span><br />
              como motorista de app
            </h1>

            <p className="text-blue-200 text-lg sm:text-xl leading-relaxed mb-4 max-w-2xl mx-auto">
              O único sistema com <strong className="text-white">assistente de IA, registro por voz e scan de recibo por foto</strong>. Recursos que nenhum outro aplicativo do mercado tem.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-10 text-sm">
              <span className="glass-card rounded-full px-4 py-1.5 text-blue-100">🤖 IA que analisa seus dados</span>
              <span className="glass-card rounded-full px-4 py-1.5 text-blue-100">🎙️ Registro por voz</span>
              <span className="glass-card rounded-full px-4 py-1.5 text-blue-100">📸 Scan de recibo por foto</span>
              <span className="glass-card rounded-full px-4 py-1.5 text-blue-100">📊 Importação Uber / 99 / iFood</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-white text-blue-900 font-extrabold text-base px-8 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-2xl shadow-black/30"
              >
                Começar grátis por 60 dias
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#motorista"
                className="inline-flex items-center gap-2 text-blue-200 hover:text-white text-sm font-semibold transition-colors"
              >
                Ver os recursos exclusivos ↓
              </a>
            </div>

            <p className="mt-5 text-blue-300 text-xs">
              Sem cartão de crédito · Acesso imediato · Cancele quando quiser
            </p>
          </div>

          {/* stats flutuantes */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { n: '60', label: 'dias gratuitos', suffix: '' },
              { n: '4', label: 'plataformas integradas', suffix: '+' },
              { n: '100', label: 'seguro e na nuvem', suffix: '%' },
              { n: '0', label: 'cartão necessário', suffix: '' },
            ].map(({ n, label, suffix }) => (
              <div key={label} className="glass-card rounded-2xl p-4 text-center">
                <div className="text-3xl font-black text-white">{n}<span className="text-blue-400">{suffix}</span></div>
                <div className="text-blue-300 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO MOTORISTA ──────────────────────────────────────────── */}
      <section id="motorista" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* cabeçalho */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2 mb-5">
              <span className="text-emerald-600 text-sm font-bold">🚗 Para motoristas de aplicativo</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Recursos que <span className="text-blue-700">nenhum outro app</span> tem
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Enquanto outros apps só deixam você digitar valores manualmente, o RodaFácil SC automatiza tudo — do registro ao diagnóstico financeiro.
            </p>
          </div>

          {/* grid de features exclusivas */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">

            {/* IA */}
            <div className="card-lift rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white p-7 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full">
                EXCLUSIVO
              </div>
              <div className="w-14 h-14 feature-icon-bg rounded-2xl flex items-center justify-center text-2xl mb-5">🤖</div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Assistente de IA Personalizado</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Nosso assistente analisa <strong>seus dados reais</strong> — plataformas, turnos, bairros, dias da semana — e responde perguntas como: "Onde estou perdendo dinheiro?", "Qual plataforma vale mais para mim?" ou "Quando devo parar de rodar hoje?"
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Analisa padrões no seu histórico</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Recomenda horários e plataformas mais rentáveis</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500 flex-shrink-0" /> Alertas quando você está abaixo da sua média</li>
              </ul>
            </div>

            {/* VOZ */}
            <div className="card-lift rounded-3xl border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white p-7 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full">
                EXCLUSIVO
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-700 to-purple-500 rounded-2xl flex items-center justify-center text-2xl mb-5">🎙️</div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Registro por Voz</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Acabou a corrida? Sem tirar os olhos da estrada. Fale naturalmente e o app registra tudo automaticamente. Rápido, prático, sem digitação.
              </p>
              <div className="bg-purple-900 rounded-2xl p-4">
                <p className="text-purple-200 text-xs font-mono">
                  "Ganhei R$ 52 na Uber agora"<br />
                  <span className="text-green-400">✓ Registrado automaticamente</span>
                </p>
              </div>
              <p className="text-gray-500 text-xs mt-3">Funciona com qualquer valor, plataforma ou categoria de despesa</p>
            </div>

            {/* FOTO */}
            <div className="card-lift rounded-3xl border-2 border-green-100 bg-gradient-to-br from-green-50 to-white p-7 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full">
                EXCLUSIVO
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-700 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl mb-5">📸</div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Scan de Recibo por Foto</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Tirou um combustível? Fotografou o recibo e pronto. A IA lê o valor, identifica a categoria e registra a despesa automaticamente. Fim dos recibos perdidos e digitação errada.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0" /> Reconhece nota fiscal e comprovante</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0" /> Categoriza automaticamente (combustível, manutenção…)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0" /> Armazena imagem do comprovante</li>
              </ul>
            </div>

            {/* IMPORTAÇÃO */}
            <div className="card-lift rounded-3xl border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white p-7 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full">
                EXCLUSIVO
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-amber-500 rounded-2xl flex items-center justify-center text-2xl mb-5">📊</div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Importação de Extratos</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Importe o extrato diretamente das plataformas e tenha tudo no RodaFácil SC sem digitar corrida por corrida. Semanas de dados em segundos.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Uber', '99', 'iFood', 'inDrive'].map(p => (
                  <span key={p} className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1.5 rounded-xl">{p}</span>
                ))}
              </div>
            </div>
          </div>

          {/* features secundárias */}
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: '⚡',
                title: 'Comparador de Turnos',
                desc: 'Compare manhã, tarde e noite lado a lado. Veja em qual turno você ganha mais por hora e ajuste sua rotina para maximizar o lucro.',
                color: 'from-yellow-50',
                border: 'border-yellow-100',
              },
              {
                icon: '📍',
                title: 'Controle de KM',
                desc: 'Registre a quilometragem rodada por dia e plataforma. Calcule o custo real por km e descubra se vale a pena rodar mais.',
                color: 'from-sky-50',
                border: 'border-sky-100',
              },
              {
                icon: '📈',
                title: 'Metas & Evolução',
                desc: 'Defina metas mensais de faturamento e acompanhe semana a semana. Gráficos claros que mostram se você está no caminho certo.',
                color: 'from-rose-50',
                border: 'border-rose-100',
              },
            ].map(({ icon, title, desc, color, border }) => (
              <div key={title} className={`card-lift rounded-2xl border-2 ${border} bg-gradient-to-br ${color} to-white p-6`}>
                <div className="text-3xl mb-3">{icon}</div>
                <h4 className="font-extrabold text-gray-900 text-base mb-2">{title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA MOTORISTA ────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-blue-950 to-blue-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-blue-300 text-sm font-semibold uppercase tracking-widest mb-3">60 dias grátis · Sem cartão de crédito</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Comece hoje e veja quanto você<br />realmente está ganhando
          </h2>
          <p className="text-blue-200 mb-8">
            A maioria dos motoristas descobre que está ganhando <strong className="text-white">20-30% menos</strong> do que pensa após ver o cálculo real de despesas e taxa de plataforma.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-blue-900 font-extrabold text-base px-10 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-xl"
          >
            Criar conta grátis agora
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── SEÇÃO GESTOR ─────────────────────────────────────────────── */}
      <section id="gestor" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-5">
              <span className="text-blue-700 text-sm font-bold">🚙 Para donos de frota</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Controle total da sua frota.<br /><span className="text-blue-700">Em um único lugar.</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Acabou a planilha, o caderninho e o WhatsApp de cobrança. Gerencie veículos, motoristas e finanças com a seriedade que seu negócio merece.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🚗',
                title: 'Gestão de Veículos',
                desc: 'Cadastre toda a frota com documentação, IPVA, seguro e revisões. Alertas automáticos de vencimento para nunca ser pego de surpresa.',
                badge: null,
              },
              {
                icon: '👤',
                title: 'Contratos de Motoristas',
                desc: 'Registre contratos, diárias, comissões e histórico de cada motorista. Controle quem está rodando qual veículo e quando.',
                badge: null,
              },
              {
                icon: '🎯',
                title: 'Rentabilidade por Veículo',
                desc: 'Veja o lucro real de cada veículo separado: receita menos todas as despesas. Descubra qual carro dá mais retorno e qual está no prejuízo.',
                badge: 'Destaque',
              },
              {
                icon: '🚨',
                title: 'Parcelamento de Multas',
                desc: 'Quando um motorista toma uma multa, registre o acordo de parcelamento semanal e acompanhe o pagamento de cada parcela automaticamente.',
                badge: 'Exclusivo',
              },
              {
                icon: '⚠️',
                title: 'Controle de Inadimplência',
                desc: 'Visualize rapidamente quais motoristas estão devendo parcelas de multa ou aluguel. Histórico completo de pagamentos e pendências.',
                badge: null,
              },
              {
                icon: '📊',
                title: 'Relatórios Financeiros',
                desc: 'DRE simplificado por veículo e por período. Receitas, despesas, lucro líquido e margem — tudo organizado para uma gestão profissional.',
                badge: null,
              },
            ].map(({ icon, title, desc, badge }) => (
              <div key={title} className="card-lift bg-white rounded-2xl border border-gray-200 p-6 relative">
                {badge && (
                  <span className={`absolute top-4 right-4 text-xs font-black px-2.5 py-1 rounded-full ${badge === 'Exclusivo' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'bg-blue-100 text-blue-700'}`}>
                    {badge}
                  </span>
                )}
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-extrabold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Em 3 passos você começa</h2>
            <p className="text-gray-500 text-lg">100% self-service, sem precisar falar com ninguém</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                n: '01',
                icon: '📝',
                title: 'Crie sua conta',
                desc: 'Cadastro em menos de 1 minuto. Escolha seu perfil — motorista ou dono de frota — e já tenha acesso imediato ao painel.',
              },
              {
                n: '02',
                icon: '⚙️',
                title: 'Configure em minutos',
                desc: 'Adicione seus veículos ou importe o extrato das plataformas. A IA vai calibrar as recomendações para o seu perfil de corrida.',
              },
              {
                n: '03',
                icon: '📈',
                title: 'Tome decisões melhores',
                desc: 'Com dados reais na mão, descubra onde está perdendo dinheiro e como aumentar seu lucro líquido sem trabalhar mais horas.',
              },
            ].map(({ n, icon, title, desc }) => (
              <div key={n} className="text-center">
                <div className="w-16 h-16 feature-icon-bg rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-blue-900/30">
                  {icon}
                </div>
                <div className="text-blue-600 font-black text-sm mb-2">{n}</div>
                <h3 className="font-extrabold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ──────────────────────────────────────────────── */}
      <section className="py-24 bg-blue-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">O que dizem os usuários</h2>
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => <StarSvg key={i} className="w-5 h-5 text-yellow-400" />)}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                nome: 'Rafael S.',
                tipo: 'Motorista Uber · SC',
                stars: 5,
                texto: 'Descobri que estava no prejuízo às quartas à tarde. A IA me mostrou isso direto. Troquei o turno e aumentei meu ganho líquido em quase R$ 400 no mês. Incrível.',
              },
              {
                nome: 'Marcos P.',
                tipo: 'Dono de Frota · 6 veículos',
                stars: 5,
                texto: 'Antes eu controlava tudo em planilha e WhatsApp. Hoje vejo a rentabilidade de cada carro em tempo real. O controle de multa parcelada salvou minha vida — não perco mais uma parcela.',
              },
              {
                nome: 'Ana L.',
                tipo: 'Motorista 99 e iFood · SC',
                stars: 5,
                texto: 'O cadastro por voz mudou tudo. Termino a corrida, falo o valor, registrado. Antes eu esquecia de registrar metade das corridas. Agora tenho o histórico completo.',
              },
              {
                nome: 'Thiago M.',
                tipo: 'Motorista inDrive · SC',
                stars: 5,
                texto: 'Importei 3 meses de extrato da Uber em 2 minutos. Ver tudo organizado, com gráfico por semana, me deu uma clareza que nunca tive. Recomendo demais.',
              },
              {
                nome: 'Carla N.',
                tipo: 'Dona de Frota · 12 veículos',
                stars: 5,
                texto: 'O relatório de inadimplência é um diferencial enorme. Sei exatamente quem está devendo quanto. Reduzi meu prejuízo com motoristas devedores drasticamente.',
              },
              {
                nome: 'Diego R.',
                tipo: 'Motorista Uber e 99 · SC',
                stars: 5,
                texto: 'Fotografei o comprovante do combustível e o app registrou sozinho. Não precisei digitar nada. É esse tipo de detalhe que faz a diferença no dia a dia.',
              },
            ].map(({ nome, tipo, stars, texto }) => (
              <div key={nome} className="glass-card rounded-2xl p-6 card-lift">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(stars)].map((_, i) => <StarSvg key={i} className="w-4 h-4 text-yellow-400" />)}
                </div>
                <p className="text-blue-100 text-sm leading-relaxed mb-4">"{texto}"</p>
                <div>
                  <p className="font-bold text-white text-sm">{nome}</p>
                  <p className="text-blue-400 text-xs">{tipo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ───────────────────────────────────────────────────── */}
      <section id="planos" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">Preços transparentes</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              60 dias grátis para qualquer plano
            </h2>
            <p className="text-gray-500 text-lg">Sem cartão de crédito. Cancele quando quiser. Sem fidelidade.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* Motorista */}
            <div className="card-lift rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-60" />
              <div className="relative">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl mb-5">🚗</div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-1">Motorista Pro</h3>
                <p className="text-gray-500 text-sm mb-6">Para motoristas de aplicativo</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black text-gray-900">R$ 19</span>
                  <span className="text-gray-500">,90/mês</span>
                </div>
                <p className="text-emerald-600 text-sm font-bold mb-6">60 dias grátis para testar</p>
                <ul className="space-y-2.5 mb-8">
                  {[
                    '🤖 Assistente de IA personalizado',
                    '🎙️ Registro de ganhos por voz',
                    '📸 Scan de recibo por foto',
                    '📊 Importação Uber, 99, iFood, inDrive',
                    '⚡ Comparador de turnos',
                    '📍 Controle de KM rodado',
                    '📈 Metas e evolução mensal',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
                >
                  Começar grátis por 60 dias
                </Link>
              </div>
            </div>

            {/* Gestor */}
            <div className="card-lift rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-60" />
              <div className="relative">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mb-5">🚙</div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-1">Dono de Frota</h3>
                <p className="text-gray-500 text-sm mb-6">Para gestores de frota</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black text-gray-900">R$ 49</span>
                  <span className="text-gray-500">,90/mês</span>
                </div>
                <p className="text-blue-600 text-sm font-bold mb-6">60 dias grátis para testar</p>
                <ul className="space-y-2.5 mb-8">
                  {[
                    '🚗 Gestão completa de veículos',
                    '👤 Contratos e histórico de motoristas',
                    '🎯 Rentabilidade por veículo',
                    '🚨 Parcelamento de multas com motorista',
                    '⚠️ Controle de inadimplência',
                    '🔔 Alertas de vencimento de documentos',
                    '📊 Relatórios financeiros completos',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="block text-center bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
                >
                  Começar grátis por 60 dias
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            Pagamento via PIX, cartão de crédito ou boleto. Acesso imediato após confirmação.
          </p>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────── */}
      <section className="py-20 hero-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 glow-badge rounded-full px-4 py-2 mb-6">
            <span className="text-yellow-400 text-sm">🎁</span>
            <span className="text-blue-200 text-xs font-semibold tracking-wide uppercase">Oferta por tempo limitado</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-5">
            Tente por 60 dias. Se não valer,<br />cancele sem burocracia.
          </h2>
          <p className="text-blue-200 text-lg mb-8">
            Sem cartão de crédito. Seus dados ficam salvos para sempre, mesmo no trial. Comece agora e descubra o quanto dinheiro você está deixando na mesa.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-blue-900 font-extrabold text-base px-10 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-2xl shadow-black/30"
          >
            Quero meus 60 dias grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Perguntas frequentes</h2>
            <p className="text-gray-500">Tire suas dúvidas antes de começar</p>
          </div>
          <div className="space-y-3">
            {FAQS.map(item => <FaqItem key={item.q} {...item} />)}
          </div>
        </div>
      </section>

      {/* ── CONTATO ──────────────────────────────────────────────────── */}
      <section id="contato" className="py-24 bg-white">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Fale com a gente</h2>
            <p className="text-gray-500">Dúvidas? Sugestões? A gente responde rápido.</p>
          </div>

          {contatoEnviado ? (
            <div className="text-center bg-green-50 border border-green-200 rounded-3xl p-10">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="font-extrabold text-gray-900 text-xl mb-2">Mensagem enviada!</h3>
              <p className="text-gray-500 text-sm">Vamos responder pelo WhatsApp em breve.</p>
              <button onClick={() => setContatoEnviado(false)} className="mt-4 text-blue-600 text-sm font-semibold hover:underline">
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={enviarWhatsApp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nome</label>
                <input
                  type="text" required
                  value={contatoForm.nome}
                  onChange={e => setContatoForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Seu nome"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">E-mail</label>
                <input
                  type="email" required
                  value={contatoForm.email}
                  onChange={e => setContatoForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="seu@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mensagem</label>
                <textarea
                  required rows={4}
                  value={contatoForm.mensagem}
                  onChange={e => setContatoForm(f => ({ ...f, mensagem: e.target.value }))}
                  placeholder="Como podemos ajudar?"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar pelo WhatsApp
              </button>
            </form>
          )}

          <div className="mt-10 pt-8 border-t border-gray-100 grid grid-cols-3 gap-4 text-center text-sm text-gray-500">
            <div>
              <div className="text-xl mb-1">📧</div>
              <a href="mailto:renaneliasbq@gmail.com" className="hover:text-blue-600 break-all text-xs">renaneliasbq@gmail.com</a>
            </div>
            <div>
              <div className="text-xl mb-1">📱</div>
              <a href="https://wa.me/5547999987722" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 text-xs">(47) 99998-7722</a>
            </div>
            <div>
              <div className="text-xl mb-1">📍</div>
              <span className="text-xs">Santa Catarina, SC</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-blue-950 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">RF</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">RodaFácil SC</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-blue-300">
              <a href="#motorista" className="hover:text-white transition-colors">Motoristas</a>
              <a href="#gestor" className="hover:text-white transition-colors">Donos de Frota</a>
              <a href="#planos" className="hover:text-white transition-colors">Planos</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
            </nav>
            <p className="text-blue-400 text-xs text-center md:text-right">
              © {new Date().getFullYear()} RodaFácil SC · Santa Catarina, Brasil
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
