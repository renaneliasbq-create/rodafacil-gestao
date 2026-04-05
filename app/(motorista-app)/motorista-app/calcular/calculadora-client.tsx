'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2, Loader2, X, Car, AlertCircle, TrendingUp, Trophy, Check, Edit2, ChevronDown } from 'lucide-react'
import type { ContextoMotorista, TurnoInfo } from './actions-calcular'
import { perguntarAssistente, classificarIntencao } from './actions-ia'
import type { IntencoRegistro } from './actions-ia'
import { salvarRegistroRapido } from './registro-rapido-actions'

/* ── Tipos ───────────────────────────────────────────────────────── */
export type EstadoVoz = 'parado' | 'ouvindo' | 'processando' | 'respondendo' | 'erro' | 'confirmando'
type TipoErro = 'sem-audio' | 'sem-conexao' | 'mic-ocupado' | 'generico' | null

const CAT_DESP_VOZ = [
  { value: 'combustivel', label: 'Combustível',  emoji: '⛽' },
  { value: 'manutencao',  label: 'Manutenção',   emoji: '🔧' },
  { value: 'seguro',      label: 'Seguro',        emoji: '🛡️' },
  { value: 'ipva',        label: 'IPVA',          emoji: '📋' },
  { value: 'lavagem',     label: 'Lavagem',       emoji: '🚿' },
  { value: 'multa',       label: 'Multa',         emoji: '🚨' },
  { value: 'outros',      label: 'Outros',        emoji: '📦' },
]
const CAT_GANHO_VOZ = [
  { value: 'uber',    label: 'Uber',    emoji: '⚫' },
  { value: '99',      label: '99',      emoji: '🟡' },
  { value: 'ifood',   label: 'iFood',   emoji: '🔴' },
  { value: 'indrive', label: 'inDrive', emoji: '🟢' },
  { value: 'outros',  label: 'Outros',  emoji: '📦' },
]
function labelCatVoz(tipo: string, cat: string) {
  const lista = tipo === 'despesa' ? CAT_DESP_VOZ : CAT_GANHO_VOZ
  return lista.find(c => c.value === cat)?.label ?? cat
}

const LABELS_ERRO: Record<NonNullable<TipoErro>, string> = {
  'sem-audio':   'Não ouvi nada. Tente novamente',
  'sem-conexao': 'Sem conexão. Tente novamente',
  'mic-ocupado': 'Microfone ocupado. Tente novamente',
  'generico':    'Não entendi. Tente novamente',
}

const DIAS_SEMANA = ['dom','seg','ter','qua','qui','sex','sáb']
const DIAS_LONGO  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

/* ── Card de hoje no ranking ─────────────────────────────────────── */
function CardHoje({ ctx }: { ctx: ContextoMotorista }) {
  const dowHoje = new Date().getDay()
  const { ganhoPorHoraPorDia, contagemPorDia, melhorPlataformaPorDia } = ctx

  const phHoje = ganhoPorHoraPorDia[dowHoje]

  if (phHoje == null) {
    return (
      <div className="mx-4 mb-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">Sem dados suficientes para hoje</p>
        <p className="text-xs text-amber-700 leading-snug">
          Continue registrando seus ganhos. Quando tivermos histórico de {DIAS_LONGO[dowHoje].toLowerCase()},
          você verá o desempenho deste dia no ranking.
        </p>
      </div>
    )
  }

  // Posição no ranking
  const ranked = Object.entries(ganhoPorHoraPorDia)
    .sort((a, b) => b[1] - a[1])
  const posicao = ranked.findIndex(([d]) => Number(d) === dowHoje) + 1
  const total   = ranked.length

  // Diferença vs média geral da semana
  const mediaGeral = Object.values(ganhoPorHoraPorDia).reduce((s, v) => s + v, 0) / total
  const diff = mediaGeral > 0 ? ((phHoje - mediaGeral) / mediaGeral) * 100 : 0

  const melhorPlat = melhorPlataformaPorDia[dowHoje]
  const count      = contagemPorDia[dowHoje] ?? 0

  // Cores por posição
  const isTop = posicao <= 2
  const isMid = posicao <= Math.ceil(total / 2)
  const grad  = isTop ? 'from-emerald-600 to-emerald-700 shadow-emerald-200'
              : isMid ? 'from-blue-600 to-blue-700 shadow-blue-200'
              :         'from-amber-500 to-amber-600 shadow-amber-200'

  const medalha = posicao === 1 ? '🏆' : posicao === 2 ? '🥈' : posicao === 3 ? '🥉' : null

  return (
    <div className={`mx-4 mb-4 bg-gradient-to-br ${grad} rounded-2xl p-4 shadow-lg`}>
      <p className="text-white/70 text-xs font-medium mb-0.5">Hoje — {DIAS_LONGO[dowHoje]}</p>
      <p className="text-white font-extrabold text-xl leading-tight mb-3">
        {medalha && <span className="mr-1">{medalha}</span>}
        {posicao}° melhor dia da semana
      </p>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/20 rounded-xl px-2 py-2 text-center">
          <p className="text-white/70 text-[10px] font-medium leading-tight mb-0.5">Ganho/hora</p>
          <p className="text-white font-extrabold text-sm">{fmt(phHoje)}</p>
        </div>
        <div className="bg-white/20 rounded-xl px-2 py-2 text-center">
          <p className="text-white/70 text-[10px] font-medium leading-tight mb-0.5">vs. média</p>
          <p className={`font-extrabold text-sm ${diff >= 0 ? 'text-white' : 'text-white/80'}`}>
            {diff >= 0 ? '+' : ''}{diff.toFixed(0)}%
          </p>
        </div>
        <div className="bg-white/20 rounded-xl px-2 py-2 text-center">
          <p className="text-white/70 text-[10px] font-medium leading-tight mb-0.5">
            {melhorPlat ? 'Melhor plat.' : 'Histórico'}
          </p>
          <p className="text-white font-extrabold text-sm capitalize">
            {melhorPlat ? melhorPlat : `${count}d`}
          </p>
        </div>
      </div>

      {/* Explicação do indicador vs. média */}
      <p className="text-white/60 text-[10px] leading-snug mt-3">
        <span className="font-semibold text-white/80">vs. média</span> compara o seu ganho por hora
        de hoje com a média dos outros dias da semana. Positivo significa que hoje costuma render
        mais do que os demais dias.
      </p>
    </div>
  )
}

/* ── Ranking visual da semana ────────────────────────────────────── */
function RankingDias({ ctx }: { ctx: ContextoMotorista }) {
  const { ganhoPorHoraPorDia, contagemPorDia, melhorPlataformaPorDia } = ctx
  const dowHoje = new Date().getDay()

  const diasComDados = Object.entries(ganhoPorHoraPorDia)
    .map(([d, ph]) => ({ dow: Number(d), ph }))
    .sort((a, b) => b.ph - a.ph)

  if (diasComDados.length < 2) return null

  const maxPH = diasComDados[0].ph

  function corRank(rank: number, total: number) {
    if (rank === 1) return { num: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400' }
    if (rank <= 2)  return { num: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' }
    if (rank <= Math.ceil(total / 2)) return { num: 'bg-blue-100 text-blue-600', bar: 'bg-blue-400' }
    return { num: 'bg-gray-100 text-gray-400', bar: 'bg-gray-300' }
  }

  return (
    <div className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ranking da semana</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Ganho por hora · últimos 90 dias</p>
      </div>
      <div className="divide-y divide-gray-50">
        {diasComDados.map(({ dow, ph }, i) => {
          const isHoje = dow === dowHoje
          const rank   = i + 1
          const pct    = maxPH > 0 ? (ph / maxPH) * 100 : 0
          const count  = contagemPorDia[dow] ?? 0
          const cor    = corRank(rank, diasComDados.length)
          const melhor = melhorPlataformaPorDia[dow]

          return (
            <div
              key={dow}
              className={`px-4 py-3 ${isHoje ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-center gap-3 mb-1.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${cor.num}`}>
                  {rank}
                </span>
                <span className={`text-sm flex-1 ${isHoje ? 'font-extrabold text-gray-900' : 'font-medium text-gray-700'}`}>
                  {DIAS_LONGO[dow]}
                  {isHoje && (
                    <span className="ml-2 text-[9px] font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded-full">
                      HOJE
                    </span>
                  )}
                </span>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-800">{fmt(ph)}/h</p>
                  {melhor && (
                    <p className="text-[10px] text-gray-400 capitalize">{melhor}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-9">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${cor.bar}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 w-8 text-right flex-shrink-0">
                  {count}x
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-[10px] text-gray-400">
          "x" = dias trabalhados neste dia da semana nos últimos 90 dias
        </p>
      </div>
    </div>
  )
}

/* ── Turnos de hoje ──────────────────────────────────────────────── */
function CardTurnosHoje({ ctx }: { ctx: ContextoMotorista }) {
  const dowHoje = new Date().getDay()
  const turnos: TurnoInfo[] = ctx.turnosPorDia?.[dowHoje] ?? []

  if (turnos.length === 0) {
    return (
      <div className="mx-4 mb-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">Análise por turno indisponível</p>
        <p className="text-xs text-amber-700 leading-snug">
          Importe seus extratos com horário de início da corrida para ver qual turno (manhã, tarde, noite ou madrugada) rende mais em cada dia da semana.
        </p>
      </div>
    )
  }

  const maxPH = turnos[0].ganhoMedioHora

  return (
    <div className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Melhores turnos hoje</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Ganho por hora · histórico de {DIAS_LONGO[dowHoje].toLowerCase()}</p>
      </div>
      <div className="divide-y divide-gray-50">
        {turnos.map((t, i) => {
          const isTop = i === 0
          const pct   = maxPH > 0 ? (t.ganhoMedioHora / maxPH) * 100 : 0
          const bar   = isTop ? 'bg-emerald-500' : i === 1 ? 'bg-blue-400' : 'bg-gray-300'
          const num   = isTop ? 'bg-emerald-100 text-emerald-700' : i === 1 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'

          return (
            <div key={t.id} className={`px-4 py-3 ${isTop ? 'bg-emerald-50/40' : ''}`}>
              <div className="flex items-center gap-3 mb-1.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${num}`}>
                  {i + 1}
                </span>
                <span className="text-lg leading-none flex-shrink-0">{t.emoji}</span>
                <span className={`text-sm flex-1 ${isTop ? 'font-extrabold text-gray-900' : 'font-medium text-gray-700'}`}>
                  {t.label}
                  {isTop && (
                    <span className="ml-2 text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                      MELHOR
                    </span>
                  )}
                </span>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-800">{fmt(t.ganhoMedioHora)}/h</p>
                  <p className="text-[10px] text-gray-400">{t.count} corridas</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-9">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 w-14 text-right flex-shrink-0">
                  {t.inicio}h–{t.fim === 24 ? '0h' : `${t.fim}h`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-[10px] text-gray-400">
          Baseado em corridas com hora de início registrada nos últimos 90 dias.
        </p>
      </div>
    </div>
  )
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

  // Registro por voz
  const [pendingRegistro, setPendingRegistro] = useState<IntencoRegistro | null>(null)
  const [registroSalvo, setRegistroSalvo]     = useState(false)
  const [salvando, setSalvando]               = useState(false)
  const [editandoReg, setEditandoReg]         = useState(false)
  const [eVal, setEVal]   = useState('')
  const [eCat, setECat]   = useState('')
  const [eTipo, setETipo] = useState<'despesa' | 'ganho'>('despesa')
  const [eData, setEData] = useState('')

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

      if (!texto) {
        setTipoErro('sem-audio')
        setEstadoVoz('erro')
        return
      }

      setTranscricao(texto)
      setEstadoVoz('processando')
      setPendingRegistro(null)
      setRegistroSalvo(false)
      setEditandoReg(false)

      timeoutRef.current = setTimeout(() => {
        setTipoErro('generico')
        setEstadoVoz('erro')
      }, 12_000)

      classificarIntencao(texto, contexto)
        .then(resultado => {
          clearTimeout(timeoutRef.current!)
          if (resultado.intencao === 'registro') {
            const reg = resultado
            setPendingRegistro(reg)
            setETipo(reg.tipo)
            setECat(reg.categoria ?? '')
            setEVal(reg.valor?.toFixed(2).replace('.', ',') ?? '')
            setEData(new Date().toISOString().split('T')[0])
            falar(reg.resposta_voz)
            setEstadoVoz('confirmando')
          } else {
            setResposta(resultado.resposta)
            // falar é acionado pelo useEffect de resposta
          }
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
          Quando rodar hoje?
        </h1>
        <p className="text-sm text-gray-400 mt-1">Veja qual dia da semana rende mais e planeje sua jornada.</p>
      </div>

      {/* Card de hoje no ranking */}
      <CardHoje ctx={contexto} />

      {/* Ranking semanal */}
      <RankingDias ctx={contexto} />

      {/* Melhores turnos de hoje */}
      <CardTurnosHoje ctx={contexto} />

      {/* Card de contexto do assistente (colapsado abaixo) */}
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

          {/* ── Card de confirmação de registro por voz ── */}
          {(estadoVoz === 'confirmando' || registroSalvo) && pendingRegistro && !editandoReg && (
            <div className="mt-3 w-full">
              {registroSalvo ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-4 flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-emerald-800">Pronto, anotado! ✅</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">🎤 Registro por voz</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tipo</span>
                      <span className="font-semibold text-gray-900 capitalize">{pendingRegistro.tipo === 'despesa' ? 'Despesa' : 'Ganho'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Categoria</span>
                      <span className="font-semibold text-gray-900">{labelCatVoz(pendingRegistro.tipo, pendingRegistro.categoria ?? '')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Valor</span>
                      <span className="font-semibold text-gray-900">
                        {pendingRegistro.valor ? pendingRegistro.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                      </span>
                    </div>
                    {pendingRegistro.horas && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Horas</span>
                        <span className="font-semibold text-gray-900">{pendingRegistro.horas}h</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Data</span>
                      <span className="font-semibold text-gray-900">hoje</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setEditandoReg(true) }}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 min-h-[48px]"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      disabled={salvando || !pendingRegistro.valor}
                      onClick={async () => {
                        if (!pendingRegistro.valor) return
                        setSalvando(true)
                        const r = await salvarRegistroRapido({
                          tipo:       pendingRegistro.tipo,
                          categoria:  pendingRegistro.categoria ?? 'outros',
                          valor:      pendingRegistro.valor,
                          data:       new Date().toISOString().split('T')[0],
                          descricao:  pendingRegistro.descricao,
                          plataforma: pendingRegistro.plataforma,
                          horas:      pendingRegistro.horas,
                          origem:     'voz',
                          confianca:  pendingRegistro.confianca,
                        })
                        setSalvando(false)
                        if (r.ok) {
                          setRegistroSalvo(true)
                          setEstadoVoz('parado')
                          falar('Pronto, anotado!')
                          if ('vibrate' in navigator) navigator.vibrate(100)
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 min-h-[48px]"
                    >
                      {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Confirmar</>}
                    </button>
                  </div>
                  {!pendingRegistro.valor && (
                    <p className="text-xs text-amber-600 text-center mt-2">Valor não identificado — toque em Editar para preencher.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Edição inline do registro por voz */}
          {editandoReg && pendingRegistro && (
            <div className="mt-3 w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Editar registro</p>
              <div className="flex gap-2">
                {(['despesa', 'ganho'] as const).map(t => (
                  <button key={t} onClick={() => { setETipo(t); setECat('') }}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize min-h-[40px] ${eTipo === t ? (t === 'despesa' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white') : 'bg-gray-100 text-gray-600'}`}>
                    {t === 'despesa' ? 'Despesa' : 'Ganho'}
                  </button>
                ))}
              </div>
              <div className="relative">
                <select value={eCat} onChange={e => setECat(e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white min-h-[44px]">
                  <option value="">Categoria…</option>
                  {(eTipo === 'despesa' ? CAT_DESP_VOZ : CAT_GANHO_VOZ).map(c => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                <input type="text" inputMode="decimal" value={eVal} onChange={e => setEVal(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm min-h-[44px]" />
              </div>
              <input type="date" value={eData} onChange={e => setEData(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm min-h-[44px]" />
              <button
                disabled={salvando || !eCat || !eVal}
                onClick={async () => {
                  const val = parseFloat(eVal.replace(',', '.'))
                  if (!eCat || isNaN(val) || val <= 0) return
                  setSalvando(true)
                  const r = await salvarRegistroRapido({
                    tipo:       eTipo,
                    categoria:  eCat,
                    valor:      val,
                    data:       eData || new Date().toISOString().split('T')[0],
                    descricao:  pendingRegistro.descricao,
                    plataforma: eTipo === 'ganho' ? eCat : null,
                    horas:      pendingRegistro.horas,
                    origem:     'voz',
                    confianca:  pendingRegistro.confianca,
                  })
                  setSalvando(false)
                  if (r.ok) {
                    setRegistroSalvo(true)
                    setEditandoReg(false)
                    setEstadoVoz('parado')
                    falar('Pronto, anotado!')
                    if ('vibrate' in navigator) navigator.vibrate(100)
                  }
                }}
                className="w-full bg-emerald-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40 min-h-[48px]"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
              <button onClick={() => setEditandoReg(false)} className="w-full text-xs text-gray-400 py-1">Cancelar</button>
            </div>
          )}

          {/* Resposta em texto */}
          {resposta && estadoVoz !== 'confirmando' && (
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

          {/* Sugestões */}
          {estadoVoz === 'parado' && !transcricao && !registroSalvo && (
            <div className="mt-6 w-full space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-3">Perguntar ou registrar</p>
              {[
                '"Vale a pena rodar hoje?"',
                '"Qual plataforma compensa mais?"',
                '"Coloquei 80 reais de gasolina"',
                '"Ganhei 350 na Uber hoje, 6 horas"',
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
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Cálculo manual</p>

        {/* Texto introdutório */}
        <div className="mb-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 space-y-2">
          <p className="text-sm font-semibold text-emerald-800 leading-snug">
            Saiba antes de sair se vai compensar rodar hoje.
          </p>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Informe quantas horas planeja trabalhar. Com base no seu histórico real de ganhos e despesas, calculamos o <strong>ganho esperado</strong>, o <strong>custo proporcional do dia</strong> (combustível, manutenção, seguro, etc.) e o seu <strong>lucro líquido estimado</strong>.
          </p>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Isso evita que você rode no prejuízo sem perceber — muitos motoristas confundem faturamento com lucro e acabam pagando para trabalhar. Use este cálculo antes de cada jornada para tomar decisões mais inteligentes sobre quando e quanto vale a pena rodar.
          </p>
        </div>
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
