'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2, Loader2, X, Car, AlertCircle, TrendingUp } from 'lucide-react'
import type { ContextoMotorista } from './actions-calcular'
import { perguntarAssistente } from './actions-ia'

/* ── Tipos ───────────────────────────────────────────────────────── */
export type EstadoVoz = 'parado' | 'ouvindo' | 'processando' | 'respondendo' | 'erro'
type TipoErro = 'sem-audio' | 'sem-conexao' | 'mic-ocupado' | 'generico' | null

const LABELS_ERRO: Record<NonNullable<TipoErro>, string> = {
  'sem-audio':   'Não ouvi nada. Tente novamente',
  'sem-conexao': 'Sem conexão. Tente novamente',
  'mic-ocupado': 'Microfone ocupado. Tente novamente',
  'generico':    'Não entendi. Tente novamente',
}

const DIAS_SEMANA = ['dom','seg','ter','qua','qui','sex','sáb']

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

/* ── Card de contexto disponível ─────────────────────────────────── */
function CardContexto({ ctx }: { ctx: ContextoMotorista }) {
  const plats   = Object.keys(ctx.ganhoPorHora)
  const temDados = ctx.diasHistorico > 0

  if (!temDados) return (
    <div className="mx-4 mb-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
      <p className="text-xs text-amber-700 font-medium">
        Sem histórico ainda. Continue registrando seus ganhos para o assistente ter dados reais para responder.
      </p>
    </div>
  )

  return (
    <div className="mx-4 mb-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
          O assistente já sabe ({ctx.diasHistorico} dias de histórico)
        </p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {plats.map(p => (
          <p key={p} className="text-xs text-emerald-800">
            <span className="font-semibold capitalize">{p}:</span> {fmt(ctx.ganhoPorHora[p])}/h
          </p>
        ))}
        {ctx.mediaGanhoHoje != null && (
          <p className="text-xs text-emerald-800 col-span-2">
            <span className="font-semibold">Média de {ctx.diaSemana}:</span> {fmt(ctx.mediaGanhoHoje)}
          </p>
        )}
        {ctx.despesaMediaDia > 0 && (
          <p className="text-xs text-emerald-800">
            <span className="font-semibold">Custo/dia:</span> {fmt(ctx.despesaMediaDia)}
          </p>
        )}
        {ctx.kmPorHora != null && (
          <p className="text-xs text-emerald-800">
            <span className="font-semibold">KM/hora:</span> {ctx.kmPorHora} km
          </p>
        )}
      </div>
    </div>
  )
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

/* ── Hook: seleciona voz pt-BR de forma assíncrona ───────────────── */
function useVozPtBR() {
  const vozRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    function carregar() {
      const voices = window.speechSynthesis.getVoices()
      vozRef.current =
        voices.find(v => v.lang === 'pt-BR') ??
        voices.find(v => v.lang.startsWith('pt')) ??
        voices[0] ??
        null
    }

    carregar()
    window.speechSynthesis.onvoiceschanged = carregar
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  return vozRef
}

/* ── Ícone de ondas sonoras ──────────────────────────────────────── */
function SoundWaveIcon() {
  return (
    <div className="flex items-end justify-center gap-[3px] h-7 w-8">
      {[0, 0.15, 0.05, 0.2, 0.1].map((delay, i) => (
        <span
          key={i}
          className="w-[4px] rounded-full bg-white"
          style={{ animation: 'soundwave 0.9s ease-in-out infinite', animationDelay: `${delay}s` }}
        />
      ))}
      <style>{`@keyframes soundwave { 0%,100%{height:4px} 50%{height:24px} }`}</style>
    </div>
  )
}

/* ── Botão de voz ────────────────────────────────────────────────── */
function BotaoVoz({ estado, labelErro, onClick }: { estado: EstadoVoz; labelErro: string; onClick: () => void }) {
  const configs: Record<EstadoVoz, { bg: string; label: string; labelColor: string; icon: React.ReactNode }> = {
    parado:      { bg: 'bg-emerald-600', label: 'Pergunte em voz alta',  labelColor: 'text-gray-500',                 icon: <Mic    className="w-9 h-9 text-white" /> },
    ouvindo:     { bg: 'bg-emerald-500', label: 'Ouvindo...',             labelColor: 'text-emerald-600 font-semibold', icon: <Mic    className="w-9 h-9 text-white" /> },
    processando: { bg: 'bg-amber-500',   label: 'Calculando...',          labelColor: 'text-amber-600 font-semibold',   icon: <Loader2 className="w-9 h-9 text-white animate-spin" /> },
    respondendo: { bg: 'bg-blue-600',    label: 'Toque para parar',       labelColor: 'text-blue-600 font-semibold',    icon: <SoundWaveIcon /> },
    erro:        { bg: 'bg-red-500',     label: labelErro,                labelColor: 'text-red-500 font-medium',       icon: <MicOff className="w-9 h-9 text-white" /> },
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
          disabled={estado === 'processando'}
          aria-label={c.label}
          className={`relative z-10 w-[80px] h-[80px] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed ${c.bg}`}
        >
          {c.icon}
        </button>
      </div>
      <p className={`text-sm text-center min-h-[20px] transition-all ${c.labelColor}`}>{c.label}</p>
    </div>
  )
}

/* ── Cálculo manual local ────────────────────────────────────────── */
interface ResultadoManual {
  ganhoEst:  number | null
  custoEst:  number | null
  lucroEst:  number | null
}
function calcularManual(horas: number, ctx: ContextoMotorista): ResultadoManual {
  const vals = Object.values(ctx.ganhoPorHora)
  const mediaHora = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  const ganhoEst  = mediaHora != null ? Math.round(mediaHora * horas * 100) / 100 : null
  // Custo proporcional: despesaMediaDia calculada sobre 8h padrão
  const custoEst  = ctx.despesaMediaDia > 0 ? Math.round((ctx.despesaMediaDia / 8) * horas * 100) / 100 : null
  const lucroEst  = ganhoEst != null && custoEst != null ? Math.round((ganhoEst - custoEst) * 100) / 100 : null
  return { ganhoEst, custoEst, lucroEst }
}

/* ── Componente principal ────────────────────────────────────────── */
export function CalcularClient({ contexto }: { contexto: ContextoMotorista }) {
  const [estadoVoz, setEstadoVoz]     = useState<EstadoVoz>('parado')
  const [tipoErro, setTipoErro]       = useState<TipoErro>(null)
  const [suportaVoz, setSuportaVoz]   = useState<boolean | null>(null)
  const [bannerVisto, setBannerVisto] = useState(true)
  const [transcricao, setTranscricao] = useState<string | null>(null)
  const [resposta, setResposta]       = useState<string | null>(null)
  const [erroPerm, setErroPerm]       = useState(false)
  const [tentativas, setTentativas]   = useState(0)

  // Calculadora manual
  const [horas, setHoras]           = useState('')
  const [resultManual, setResultManual] = useState<ResultadoManual | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const vozRef         = useVozPtBR()

  /* ── Detecta suporte + cleanup ──────────────────────────────────── */
  useEffect(() => {
    setSuportaVoz(!!(window.SpeechRecognition || window.webkitSpeechRecognition))
    const visto = localStorage.getItem('roda_fácil_banner_voz_visto')
    if (!visto) setBannerVisto(false)
    return () => { clearTimeout(timeoutRef.current!) }
  }, [])

  /* ── Falar resposta via SpeechSynthesis ─────────────────────────── */
  const falar = useCallback((texto: string) => {
    window.speechSynthesis.cancel()

    const utterance      = new SpeechSynthesisUtterance(texto)
    utterance.rate       = 0.9
    utterance.pitch      = 1.0
    utterance.volume     = 1.0
    if (vozRef.current) utterance.voice = vozRef.current

    utterance.onstart = () => setEstadoVoz('respondendo')
    utterance.onend   = () => setEstadoVoz('parado')
    utterance.onerror = () => setEstadoVoz('parado')

    window.speechSynthesis.speak(utterance)
  }, [vozRef])

  /* ── Dispara fala automaticamente quando resposta chega ─────────── */
  useEffect(() => {
    if (resposta) falar(resposta)
  }, [resposta, falar])

  /* ── Cria instância de SpeechRecognition ────────────────────────── */
  const criarRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return null

    const r             = new SR()
    r.lang              = 'pt-BR'
    r.continuous        = false
    r.interimResults    = false
    r.maxAlternatives   = 1

    r.onstart = () => {
      setEstadoVoz('ouvindo')
      setTranscricao(null)
      setResposta(null)
      setTipoErro(null)
      setErroPerm(false)
    }

    r.onresult = (event: SpeechRecognitionEvent) => {
      const texto = (event.results[0]?.[0]?.transcript ?? '').trim()

      // Texto vazio — não chamar API
      if (!texto) {
        setTipoErro('sem-audio')
        setEstadoVoz('erro')
        return
      }

      setTranscricao(texto)
      setEstadoVoz('processando')

      // Timeout de segurança: se a server action travar por >10s, mostra erro
      timeoutRef.current = setTimeout(() => {
        setTipoErro('generico')
        setEstadoVoz('erro')
      }, 10_000)

      perguntarAssistente(texto, contexto)
        .then(resp => {
          clearTimeout(timeoutRef.current!)
          setResposta(resp)
        })
        .catch(() => {
          clearTimeout(timeoutRef.current!)
          setTipoErro('generico')
          setEstadoVoz('erro')
        })
    }

    r.onerror = (event: SpeechRecognitionErrorEvent) => {
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          setErroPerm(true)
          setEstadoVoz('parado')
          break
        case 'no-speech':
          setTipoErro('sem-audio')
          setEstadoVoz('erro')
          break
        case 'network':
          setTipoErro('sem-conexao')
          setEstadoVoz('erro')
          break
        case 'audio-capture':
          setTipoErro('mic-ocupado')
          setEstadoVoz('erro')
          break
        case 'aborted':
          // Parado propositalmente — não é erro
          break
        default:
          setTipoErro('generico')
          setEstadoVoz('erro')
      }
    }

    r.onend = () => {
      // Se ainda estava ouvindo quando terminou (sem resultado e sem erro tratado)
      setEstadoVoz(prev => {
        if (prev === 'ouvindo') {
          setTipoErro('sem-audio')
          return 'erro'
        }
        return prev
      })
    }

    return r
  }, [])

  /* ── Toque no botão ─────────────────────────────────────────────── */
  function handleVozClick() {
    if (estadoVoz === 'respondendo') {
      window.speechSynthesis.cancel()
      setEstadoVoz('parado')
      return
    }
    if (estadoVoz === 'ouvindo') {
      recognitionRef.current?.stop()
      setEstadoVoz('parado')
      return
    }
    if (estadoVoz === 'erro') {
      setTentativas(t => t + 1)
    } else {
      setTentativas(0)
    }

    const r = criarRecognition()
    if (!r) return
    recognitionRef.current = r
    try { r.start() } catch { setEstadoVoz('erro') }
  }

  function fecharBanner() {
    localStorage.setItem('roda_fácil_banner_voz_visto', '1')
    setBannerVisto(true)
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="pb-6">

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
          Vale a pena<br />rodar hoje?
        </h1>
        <p className="text-sm text-gray-400 mt-1">Pergunte em voz alta ou preencha os campos.</p>
      </div>

      {/* Card de contexto disponível */}
      <CardContexto ctx={contexto} />

      {/* Banner segurança */}
      {!bannerVisto && (
        <div className="mx-4 mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <Car className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 font-medium flex-1 leading-snug">
            🚗 Use com o carro parado. Não interaja com o app enquanto dirige.
          </p>
          <button onClick={fecharBanner} className="w-7 h-7 flex items-center justify-center rounded-full text-amber-400 hover:bg-amber-100 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sem suporte */}
      {suportaVoz === false && (
        <div className="mx-4 mb-4 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700">Assistente de voz indisponível</p>
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              Seu navegador não suporta reconhecimento de voz. Use o <strong>Chrome</strong> para acessar essa funcionalidade.
            </p>
          </div>
        </div>
      )}

      {/* Permissão negada */}
      {erroPerm && (
        <div className="mx-4 mb-4 bg-red-50 border border-red-100 rounded-2xl px-4 py-4 flex items-start gap-3">
          <MicOff className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Microfone bloqueado</p>
            <p className="text-xs text-red-500 mt-1 leading-snug">
              Permita o acesso ao microfone nas configurações do navegador.<br />
              <strong>Android:</strong> Configurações → Site → Microfone → Permitir<br />
              <strong>iPhone:</strong> Ajustes → Chrome → Microfone → Ativar
            </p>
          </div>
        </div>
      )}

      {/* Sugestão após 2 falhas */}
      {tentativas >= 2 && estadoVoz === 'erro' && (
        <div className="mx-4 mb-4 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-blue-700">Está com dificuldade? Use a calculadora manual abaixo.</p>
        </div>
      )}

      {/* Botão de voz */}
      {suportaVoz !== false && (
        <div className="mx-4 bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-8 flex flex-col items-center mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Assistente por voz</p>

          <BotaoVoz
            estado={estadoVoz}
            labelErro={tipoErro ? LABELS_ERRO[tipoErro] : LABELS_ERRO['generico']}
            onClick={handleVozClick}
          />

          {/* O que o motorista disse */}
          {transcricao && (
            <div className="mt-5 w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Você disse</p>
              <p className="text-sm text-gray-800 italic">&ldquo;{transcricao}&rdquo;</p>
            </div>
          )}

          {/* Resposta em texto */}
          {resposta && (
            <div className="mt-3 w-full bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4">
              <p className="text-sm text-blue-900 leading-relaxed">{resposta}</p>
              <button
                onClick={() => falar(resposta)}
                className="mt-3 flex items-center gap-1.5 text-xs text-blue-500 font-medium min-h-[36px]"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Ouvir novamente
              </button>
            </div>
          )}

          {/* Sugestões de perguntas */}
          {estadoVoz === 'parado' && !transcricao && (
            <div className="mt-6 w-full space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-3">Você pode perguntar</p>
              {[
                '"Vale a pena rodar hoje?"',
                '"Quanto preciso faturar?"',
                '"Qual plataforma compensa mais?"',
                '"Quanto vou gastar de combustível?"',
              ].map(q => (
                <div key={q} className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5 text-center italic">{q}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 mx-4 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">ou calcule manualmente</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Calculadora manual */}
      <div className="mx-4 bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Cálculo manual</p>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Quantas horas planeja rodar?</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Ex: 6"
            min={1}
            max={16}
            value={horas}
            onChange={e => { setHoras(e.target.value); setResultManual(null) }}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => {
            const h = parseFloat(horas)
            if (!h || h <= 0 || h > 24) return
            setResultManual(calcularManual(h, contexto))
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors min-h-[44px]"
        >
          Calcular
        </button>

        {/* Resultado do cálculo manual */}
        {resultManual && (
          <div className="mt-4 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 space-y-2">
            {resultManual.ganhoEst != null ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ganho estimado</span>
                <span className="font-semibold text-gray-800">{fmt(resultManual.ganhoEst)}</span>
              </div>
            ) : (
              <p className="text-xs text-amber-600">Sem média de ganho/hora ainda. Registre mais dias.</p>
            )}
            {resultManual.custoEst != null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Custo estimado</span>
                <span className="font-semibold text-gray-800">{fmt(resultManual.custoEst)}</span>
              </div>
            )}
            {resultManual.lucroEst != null && (
              <>
                <div className="h-px bg-gray-200 my-1" />
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-700">Lucro estimado</span>
                  <span className={`font-bold text-base ${resultManual.lucroEst >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {fmt(resultManual.lucroEst)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 leading-snug pt-1">
                  Baseado na sua média dos últimos 30 dias. Custo calculado proporcionalmente à jornada padrão de 8h.
                </p>
              </>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
