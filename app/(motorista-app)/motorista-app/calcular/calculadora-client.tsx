'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2, Loader2, X, Car, AlertCircle } from 'lucide-react'

/* ── Tipos ───────────────────────────────────────────────────────── */
export type EstadoVoz = 'parado' | 'ouvindo' | 'processando' | 'respondendo' | 'erro'

/* ── Declaração de tipos para a Web Speech API ───────────────────── */
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

/* ── Ícone de ondas sonoras (estado "respondendo") ───────────────── */
function SoundWaveIcon() {
  return (
    <div className="flex items-end justify-center gap-[3px] h-7 w-8">
      {[0, 0.15, 0.05, 0.2, 0.1].map((delay, i) => (
        <span
          key={i}
          className="w-[4px] rounded-full bg-white"
          style={{
            animation: 'soundwave 0.9s ease-in-out infinite',
            animationDelay: `${delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes soundwave {
          0%, 100% { height: 4px; }
          50%       { height: 24px; }
        }
      `}</style>
    </div>
  )
}

/* ── Botão de voz principal ──────────────────────────────────────── */
function BotaoVoz({
  estado,
  onClick,
  disabled = false,
}: {
  estado: EstadoVoz
  onClick: () => void
  disabled?: boolean
}) {
  const configs: Record<EstadoVoz, {
    bg: string; label: string; labelColor: string; icon: React.ReactNode
  }> = {
    parado: {
      bg: 'bg-emerald-600',
      label: 'Pergunte em voz alta',
      labelColor: 'text-gray-500',
      icon: <Mic className="w-9 h-9 text-white" />,
    },
    ouvindo: {
      bg: 'bg-emerald-500',
      label: 'Ouvindo...',
      labelColor: 'text-emerald-600 font-semibold',
      icon: <Mic className="w-9 h-9 text-white" />,
    },
    processando: {
      bg: 'bg-amber-500',
      label: 'Calculando...',
      labelColor: 'text-amber-600 font-semibold',
      icon: <Loader2 className="w-9 h-9 text-white animate-spin" />,
    },
    respondendo: {
      bg: 'bg-blue-600',
      label: 'Toque para parar',
      labelColor: 'text-blue-600 font-semibold',
      icon: <SoundWaveIcon />,
    },
    erro: {
      bg: 'bg-red-500',
      label: 'Não entendi. Tente novamente',
      labelColor: 'text-red-500 font-medium',
      icon: <MicOff className="w-9 h-9 text-white" />,
    },
  }

  const c = configs[estado]

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        {estado === 'ouvindo' && (
          <>
            <span className="absolute w-[100px] h-[100px] rounded-full bg-emerald-400/30 animate-ping" />
            <span className="absolute w-[120px] h-[120px] rounded-full bg-emerald-400/15 animate-ping [animation-delay:0.3s]" />
          </>
        )}
        <button
          onClick={onClick}
          disabled={disabled || estado === 'processando'}
          aria-label={c.label}
          className={`
            relative z-10 w-[80px] h-[80px] rounded-full flex items-center justify-center
            shadow-lg active:scale-95 transition-transform
            disabled:opacity-60 disabled:cursor-not-allowed
            ${c.bg}
          `}
        >
          {c.icon}
        </button>
      </div>
      <p className={`text-sm text-center min-h-[20px] transition-all ${c.labelColor}`}>
        {c.label}
      </p>
    </div>
  )
}

/* ── Componente principal ────────────────────────────────────────── */
export function CalcularClient() {
  const [estadoVoz, setEstadoVoz]       = useState<EstadoVoz>('parado')
  const [suportaVoz, setSuportaVoz]     = useState<boolean | null>(null) // null = ainda verificando
  const [bannerVisto, setBannerVisto]   = useState(true)
  const [transcricao, setTranscricao]   = useState<string | null>(null)
  const [resposta, setResposta]         = useState<string | null>(null)
  const [erroPerm, setErroPerm]         = useState(false)
  const [tentativas, setTentativas]     = useState(0)

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  /* ── Verifica suporte do navegador ─────────────────────────────── */
  useEffect(() => {
    const suporta = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    setSuportaVoz(suporta)

    const visto = localStorage.getItem('roda_fácil_banner_voz_visto')
    if (!visto) setBannerVisto(false)
  }, [])

  /* ── Inicializa o reconhecimento de voz ─────────────────────────── */
  const criarRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return null

    const r = new SR()
    r.lang              = 'pt-BR'
    r.continuous        = false
    r.interimResults    = false
    r.maxAlternatives   = 1

    r.onstart = () => {
      setEstadoVoz('ouvindo')
      setTranscricao(null)
      setResposta(null)
      setErroPerm(false)
    }

    r.onresult = (event: SpeechRecognitionEvent) => {
      const texto = event.results[0]?.[0]?.transcript ?? ''
      setTranscricao(texto)
      setEstadoVoz('processando')
      // Etapa 5 vai substituir isso pela chamada ao Claude
      // Por agora só exibe a transcrição como placeholder
      setTimeout(() => {
        setEstadoVoz('respondendo')
        setResposta(null) // será preenchido pela IA na Etapa 5
      }, 800)
    }

    r.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setErroPerm(true)
        setEstadoVoz('parado')
      } else if (event.error === 'no-speech') {
        setEstadoVoz('erro')
      } else {
        setEstadoVoz('erro')
      }
    }

    r.onend = () => {
      // Se ainda estava ouvindo (sem resultado capturado), vira erro
      setEstadoVoz(prev => prev === 'ouvindo' ? 'erro' : prev)
    }

    return r
  }, [])

  /* ── Toque no botão ─────────────────────────────────────────────── */
  function handleVozClick() {
    // Parar fala em andamento
    if (estadoVoz === 'respondendo') {
      window.speechSynthesis?.cancel()
      setEstadoVoz('parado')
      return
    }

    // Parar escuta em andamento
    if (estadoVoz === 'ouvindo') {
      recognitionRef.current?.stop()
      setEstadoVoz('parado')
      return
    }

    // Após 2 erros consecutivos, sugere digitar
    if (estadoVoz === 'erro') {
      setTentativas(t => t + 1)
    } else {
      setTentativas(0)
    }

    // Iniciar nova escuta
    const r = criarRecognition()
    if (!r) return
    recognitionRef.current = r

    try {
      r.start()
    } catch {
      setEstadoVoz('erro')
    }
  }

  function fecharBanner() {
    localStorage.setItem('roda_fácil_banner_voz_visto', '1')
    setBannerVisto(true)
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="pb-6">

      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
          Vale a pena<br />rodar hoje?
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Pergunte em voz alta ou preencha os campos.
        </p>
      </div>

      {/* ── Banner de segurança (primeira vez) ── */}
      {!bannerVisto && (
        <div className="mx-4 mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <Car className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 font-medium flex-1 leading-snug">
            🚗 Use com o carro parado. Não interaja com o app enquanto dirige.
          </p>
          <button
            onClick={fecharBanner}
            className="w-7 h-7 flex items-center justify-center rounded-full text-amber-400 hover:bg-amber-100 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Aviso: navegador sem suporte ── */}
      {suportaVoz === false && (
        <div className="mx-4 mb-4 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700">Assistente de voz indisponível</p>
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              Seu navegador não suporta reconhecimento de voz. Use o{' '}
              <strong>Chrome</strong> para acessar essa funcionalidade.
            </p>
          </div>
        </div>
      )}

      {/* ── Aviso: permissão de microfone negada ── */}
      {erroPerm && (
        <div className="mx-4 mb-4 bg-red-50 border border-red-100 rounded-2xl px-4 py-4 flex items-start gap-3">
          <MicOff className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Microfone bloqueado</p>
            <p className="text-xs text-red-500 mt-1 leading-snug">
              Permita o acesso ao microfone nas configurações do navegador para usar o assistente.
              <br />
              <strong>Android:</strong> Configurações → Site → Microfone → Permitir
              <br />
              <strong>iPhone:</strong> Ajustes → Chrome → Microfone → Ativar
            </p>
          </div>
        </div>
      )}

      {/* ── Sugestão de usar teclado após 2 falhas ── */}
      {tentativas >= 2 && estadoVoz === 'erro' && (
        <div className="mx-4 mb-4 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-blue-700">
            Está com dificuldade? Use a calculadora manual abaixo.
          </p>
        </div>
      )}

      {/* ── Botão de voz ── */}
      {suportaVoz !== false && (
        <div className="mx-4 bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-8 flex flex-col items-center mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
            Assistente por voz
          </p>

          <BotaoVoz
            estado={estadoVoz}
            onClick={handleVozClick}
          />

          {/* Transcrição capturada */}
          {transcricao && (
            <div className="mt-5 w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Você disse</p>
              <p className="text-sm text-gray-800 italic">&ldquo;{transcricao}&rdquo;</p>
            </div>
          )}

          {/* Área de resposta */}
          {resposta && (
            <div className="mt-3 w-full bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4">
              <p className="text-sm text-blue-900 leading-relaxed">{resposta}</p>
              <button
                onClick={() => window.speechSynthesis?.speak(new SpeechSynthesisUtterance(resposta))}
                className="mt-2 flex items-center gap-1.5 text-xs text-blue-500 font-medium min-h-[36px]"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Ouvir novamente
              </button>
            </div>
          )}

          {/* Sugestões — só quando parado e sem transcrição */}
          {estadoVoz === 'parado' && !transcricao && (
            <div className="mt-6 w-full space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-3">
                Você pode perguntar
              </p>
              {[
                '"Vale a pena rodar hoje?"',
                '"Quanto preciso faturar?"',
                '"Qual plataforma compensa mais?"',
                '"Quanto vou gastar de combustível?"',
              ].map(q => (
                <div
                  key={q}
                  className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5 text-center italic"
                >
                  {q}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 mx-4 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">ou calcule manualmente</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* ── Calculadora manual ── */}
      <div className="mx-4 bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Cálculo manual
        </p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Quantas horas planeja rodar?
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Ex: 6"
              min={1}
              max={16}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Preço do combustível hoje (R$/litro)
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Ex: 5.89"
              step="0.01"
              min={1}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
          </div>
        </div>

        <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors min-h-[44px]">
          Calcular
        </button>
      </div>

    </div>
  )
}
