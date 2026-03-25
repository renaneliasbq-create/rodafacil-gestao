'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff, Volume2, Loader2, X, Car } from 'lucide-react'

/* ── Tipos ───────────────────────────────────────────────────────── */
export type EstadoVoz = 'parado' | 'ouvindo' | 'processando' | 'respondendo' | 'erro'

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
}: {
  estado: EstadoVoz
  onClick: () => void
}) {
  const configs = {
    parado: {
      bg: 'bg-emerald-600',
      ring: '',
      label: 'Pergunte em voz alta',
      labelColor: 'text-gray-500',
      icon: <Mic className="w-9 h-9 text-white" />,
    },
    ouvindo: {
      bg: 'bg-emerald-500',
      ring: 'ring-4 ring-emerald-300 ring-offset-2',
      label: 'Ouvindo...',
      labelColor: 'text-emerald-600 font-semibold',
      icon: <Mic className="w-9 h-9 text-white" />,
    },
    processando: {
      bg: 'bg-amber-500',
      ring: '',
      label: 'Calculando...',
      labelColor: 'text-amber-600 font-semibold',
      icon: <Loader2 className="w-9 h-9 text-white animate-spin" />,
    },
    respondendo: {
      bg: 'bg-blue-600',
      ring: '',
      label: 'Respondendo...',
      labelColor: 'text-blue-600 font-semibold',
      icon: <SoundWaveIcon />,
    },
    erro: {
      bg: 'bg-red-500',
      ring: '',
      label: 'Não entendi. Tente novamente',
      labelColor: 'text-red-500 font-medium',
      icon: <MicOff className="w-9 h-9 text-white" />,
    },
  }

  const c = configs[estado]

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Anel pulsante visível apenas no estado "ouvindo" */}
      <div className="relative flex items-center justify-center">
        {estado === 'ouvindo' && (
          <>
            <span className="absolute w-[100px] h-[100px] rounded-full bg-emerald-400/30 animate-ping" />
            <span className="absolute w-[120px] h-[120px] rounded-full bg-emerald-400/15 animate-ping [animation-delay:0.3s]" />
          </>
        )}
        <button
          onClick={onClick}
          aria-label={c.label}
          className={`
            relative z-10 w-[80px] h-[80px] rounded-full flex items-center justify-center
            shadow-lg active:scale-95 transition-transform
            ${c.bg} ${c.ring}
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
  const [estadoVoz, setEstadoVoz] = useState<EstadoVoz>('parado')
  const [bannerVisto, setBannerVisto] = useState(true) // true = já foi visto (oculto)
  const [resposta, setResposta] = useState<string | null>(null)

  // Verifica se é a primeira vez — mostra banner
  useEffect(() => {
    const visto = localStorage.getItem('roda_fácil_banner_voz_visto')
    if (!visto) setBannerVisto(false)
  }, [])

  function fecharBanner() {
    localStorage.setItem('roda_fácil_banner_voz_visto', '1')
    setBannerVisto(true)
  }

  // Cicla pelos estados para visualização na Etapa 1
  // (será substituído pela lógica real nas etapas seguintes)
  function handleVozClick() {
    if (estadoVoz === 'respondendo') {
      setEstadoVoz('parado')
      return
    }
    const sequencia: EstadoVoz[] = ['parado', 'ouvindo', 'processando', 'respondendo']
    const idx = sequencia.indexOf(estadoVoz)
    setEstadoVoz(sequencia[(idx + 1) % sequencia.length])
  }

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

      {/* ── Botão de voz ── */}
      <div className="mx-4 bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-8 flex flex-col items-center mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
          Assistente por voz
        </p>

        <BotaoVoz estado={estadoVoz} onClick={handleVozClick} />

        {/* Área de resposta */}
        {resposta && (
          <div className="mt-6 w-full bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4">
            <p className="text-sm text-blue-900 leading-relaxed">{resposta}</p>
            <button className="mt-2 flex items-center gap-1.5 text-xs text-blue-500 font-medium">
              <Volume2 className="w-3.5 h-3.5" />
              Ouvir novamente
            </button>
          </div>
        )}

        {/* Sugestões de perguntas */}
        {estadoVoz === 'parado' && !resposta && (
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

        <button
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors min-h-[44px]"
        >
          Calcular
        </button>
      </div>

    </div>
  )
}
