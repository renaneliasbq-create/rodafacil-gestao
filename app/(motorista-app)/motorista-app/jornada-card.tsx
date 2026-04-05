'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Car } from 'lucide-react'
import { iniciarJornada, pausarJornada, retomarJornada, encerrarJornada } from './jornada-actions'

/* ── Types ──────────────────────────────────────────────────────── */
export type JornadaAtiva = {
  id: string
  hora_inicio: string
  plataforma: string | null
  status: 'rodando' | 'pausado'
} | null

export type PausaJornada = {
  id: string
  motivo: string | null
  inicio_pausa: string
  fim_pausa: string | null
  duracao_minutos: number | null
}

interface Props {
  jornada: JornadaAtiva
  pausas: PausaJornada[]
  ganhosHoje: number
  despesasHoje: number
}

/* ── Constantes ─────────────────────────────────────────────────── */
const MOTIVOS_PAUSA = [
  { value: 'almoco',   label: '☕ Almoço'   },
  { value: 'posto',    label: '⛽ Posto'    },
  { value: 'descanso', label: '😴 Descanso' },
  { value: 'outro',    label: 'Outro'       },
]

const PLATAFORMAS = [
  { value: 'Todas',   label: 'Todas'   },
  { value: 'Uber',    label: 'Uber'    },
  { value: '99',      label: '99'      },
  { value: 'iFood',   label: 'iFood'   },
  { value: 'InDrive', label: 'InDrive' },
]

/* ── Helpers ────────────────────────────────────────────────────── */
function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

function fmtTempo(seg: number): string {
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = seg % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function fmtHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/* ── Cálculo de tempos sempre baseado em timestamps ─────────────── */
function calcTempos(jornada: NonNullable<JornadaAtiva>, pausas: PausaJornada[], agora: Date) {
  const inicio = new Date(jornada.hora_inicio)

  const segsEncerrados = pausas
    .filter(p => p.fim_pausa != null)
    .reduce((sum, p) => {
      return sum + Math.floor(
        (new Date(p.fim_pausa!).getTime() - new Date(p.inicio_pausa).getTime()) / 1000
      )
    }, 0)

  const pausaAtual    = pausas.find(p => p.fim_pausa == null)
  const segsPausaAtual = pausaAtual
    ? Math.floor((agora.getTime() - new Date(pausaAtual.inicio_pausa).getTime()) / 1000)
    : 0

  const totalSeg = Math.floor((agora.getTime() - inicio.getTime()) / 1000)

  return {
    efetivos: Math.max(0, totalSeg - segsEncerrados - segsPausaAtual),
    pausados: Math.max(0, segsPausaAtual),
    pausaAtual,
  }
}

/* ── Resumo financeiro ──────────────────────────────────────────── */
function ResumoFin({ ganhos, despesas, variante }: {
  ganhos: number; despesas: number; variante: 'green' | 'amber'
}) {
  const lucro  = ganhos - despesas
  const bg     = variante === 'green' ? 'bg-emerald-900/50'    : 'bg-black/20'
  const label  = variante === 'green' ? 'text-emerald-300'     : 'text-amber-200'
  const border = variante === 'green' ? 'border-emerald-700/50' : 'border-amber-600/40'
  return (
    <div className={`${bg} rounded-xl px-4 py-3 mb-4 space-y-1.5`}>
      <div className="flex justify-between text-xs">
        <span className={label}>💰 Ganhos</span>
        <span className="text-white font-semibold">{fmt(ganhos)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className={label}>💸 Despesas</span>
        <span className="text-white font-semibold">{fmt(despesas)}</span>
      </div>
      <div className={`flex justify-between text-sm border-t ${border} pt-1.5`}>
        <span className="text-white font-semibold">✅ Lucro parcial</span>
        <span className={`font-bold ${lucro >= 0 ? 'text-white' : 'text-red-300'}`}>{fmt(lucro)}</span>
      </div>
    </div>
  )
}

/* ── Componente principal ───────────────────────────────────────── */
export function JornadaCard({ jornada, pausas, ganhosHoje, despesasHoje }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // mounted: evita mismatch SSR/cliente (timer calculado só no cliente)
  const [mounted, setMounted] = useState(false)
  const [, setTick]           = useState(0)

  // Controle de notificações de marcos (horas completas já notificadas)
  const notificadoRef = useRef<Set<number>>(new Set())

  useEffect(() => { setMounted(true) }, [])

  // Reseta marcos ao trocar de jornada
  useEffect(() => {
    notificadoRef.current = new Set()
  }, [jornada?.id])

  // Re-render a cada segundo — apenas após hidratação
  useEffect(() => {
    if (!jornada || !mounted) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [jornada, mounted])

  // Notificações de marco (a cada hora completa rodando, só quando aba está em 2º plano)
  useEffect(() => {
    if (!jornada || !mounted || jornada.status !== 'rodando') return
    const id = setInterval(() => {
      const { efetivos } = calcTempos(jornada, pausas, new Date())
      const h = Math.floor(efetivos / 3600)
      if (h < 1 || notificadoRef.current.has(h)) return
      notificadoRef.current.add(h)
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted' &&
        document.hidden
      ) {
        new Notification('🚗 Roda Fácil', {
          body: `Você está rodando há ${h}h! Não esqueça de registrar seus ganhos.`,
          tag: `jornada-${h}h`,
        })
      }
    }, 60_000) // verifica a cada minuto
    return () => clearInterval(id)
  }, [jornada, pausas, mounted])

  // Estado do bottom sheet de ativação
  const [showIniciarSheet, setShowIniciarSheet] = useState(false)
  const [plataformaSel,    setPlataformaSel]    = useState('Todas')

  // Estado do bottom sheet de pausa
  const [showPausarSheet, setShowPausarSheet] = useState(false)
  const [motivoSel,       setMotivoSel]       = useState<string | null>(null)

  // Estado do bottom sheet / sumário de encerramento
  const [showEncerrarSheet, setShowEncerrarSheet] = useState(false)
  const [sumario,           setSumario]           = useState<{
    duracaoEfetiva: number
    duracaoPausas:  number
    duracaoTotal:   number
    ganhos:         number
    despesas:       number
    plataforma:     string | null
    horaInicio:     string
    horaFim:        string
  } | null>(null)

  // Erro compartilhado entre bottom sheets
  const [erroMsg, setErroMsg] = useState<string | null>(null)

  // Cálculo sempre por timestamp — nunca por variável local acumulada
  const { efetivos, pausados, pausaAtual } = (jornada && mounted)
    ? calcTempos(jornada, pausas, new Date())
    : { efetivos: 0, pausados: 0, pausaAtual: undefined }

  // Placeholder enquanto hidrata — evita flash de "00:00:00"
  const timerEfetivo = mounted ? fmtTempo(efetivos) : '—:—:—'
  const timerPausado = mounted ? fmtTempo(pausados)  : '—:—:—'

  // ── Handler: pausar jornada ─────────────────────────────────────
  function handlePausar() {
    if (!jornada) return
    setErroMsg(null)
    startTransition(async () => {
      const res = await pausarJornada(jornada.id, motivoSel)
      if (res.error) {
        setErroMsg('Não foi possível pausar. Tente novamente.')
        return
      }
      setShowPausarSheet(false)
      router.refresh()
    })
  }

  // ── Handler: encerrar jornada ───────────────────────────────────
  function handleEncerrar() {
    if (!jornada) return
    setErroMsg(null)
    startTransition(async () => {
      // Calcula sumário local antes de encerrar (com base nos dados atuais)
      const agora = new Date()
      const { efetivos, pausados } = calcTempos(jornada, pausas, agora)
      const duracaoTotal = Math.floor((agora.getTime() - new Date(jornada.hora_inicio).getTime()) / 1000)

      const res = await encerrarJornada(jornada.id)
      if (res.error) {
        setErroMsg('Não foi possível encerrar. Tente novamente.')
        return
      }
      setSumario({
        duracaoEfetiva: efetivos,
        duracaoPausas:  pausados,
        duracaoTotal,
        ganhos:         ganhosHoje,
        despesas:       despesasHoje,
        plataforma:     jornada.plataforma,
        horaInicio:     jornada.hora_inicio,
        horaFim:        agora.toISOString(),
      })
      setShowEncerrarSheet(false)
    })
  }

  // ── Handler: retomar jornada ────────────────────────────────────
  function handleRetomar() {
    if (!jornada) return
    setErroMsg(null)
    startTransition(async () => {
      const res = await retomarJornada(jornada.id)
      if (res.error) {
        setErroMsg('Não foi possível retomar. Tente novamente.')
        return
      }
      router.refresh()
    })
  }

  // ── Handler: iniciar jornada ────────────────────────────────────
  function handleIniciar() {
    setErroMsg(null)
    const plat = plataformaSel === 'Todas' ? null : plataformaSel
    startTransition(async () => {
      const res = await iniciarJornada(plat)
      if (res.error === 'jornada_ativa') {
        setErroMsg('Você já tem uma jornada ativa. Encerre-a antes de iniciar uma nova.')
        return
      }
      if (res.error) {
        setErroMsg('Não foi possível iniciar. Tente novamente.')
        return
      }
      setShowIniciarSheet(false)
      router.refresh()
      // Solicita permissão de notificação após o usuário iniciar (gesto já ocorreu)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    })
  }

  /* ────────────────── ENCERRADA (sumário) ────────────────── */
  // sumario é setado no handleEncerrar antes do router.refresh().
  // Quando a página re-renderiza, jornada já é null mas sumario ainda existe → exibimos o sumário.
  if (sumario) {
    const lucro = sumario.ganhos - sumario.despesas
    return (
      <div className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏁</span>
            <span className="text-white font-bold text-sm">Jornada Encerrada</span>
          </div>
          <div className="flex gap-4 text-xs text-slate-300">
            <span>🕐 {fmtHora(sumario.horaInicio)} → {fmtHora(sumario.horaFim)}</span>
            {sumario.plataforma && <span>🚗 {sumario.plataforma}</span>}
          </div>
        </div>

        {/* Tempos */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tempo</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-emerald-50 rounded-xl py-3">
              <p className="text-emerald-700 font-mono text-sm font-bold">{fmtTempo(sumario.duracaoEfetiva)}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Rodando</p>
            </div>
            <div className="bg-amber-50 rounded-xl py-3">
              <p className="text-amber-700 font-mono text-sm font-bold">{fmtTempo(sumario.duracaoPausas)}</p>
              <p className="text-xs text-amber-600 mt-0.5">Pausado</p>
            </div>
            <div className="bg-gray-50 rounded-xl py-3">
              <p className="text-gray-700 font-mono text-sm font-bold">{fmtTempo(sumario.duracaoTotal)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total</p>
            </div>
          </div>
        </div>

        {/* Financeiro */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Financeiro</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">💰 Ganhos</span>
              <span className="font-semibold text-emerald-700">{fmt(sumario.ganhos)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">💸 Despesas</span>
              <span className="font-semibold text-red-600">{fmt(sumario.despesas)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
              <span className="font-bold text-gray-900">✅ Lucro</span>
              <span className={`font-bold text-base ${lucro >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {fmt(lucro)}
              </span>
            </div>
          </div>
        </div>

        {/* Prompt de ganhos — aparece só quando nenhum ganho foi registrado */}
        {sumario.ganhos === 0 && (() => {
          // Mapeia plataforma da jornada para o valor usado no form de ganhos
          const platMap: Record<string, string> = {
            uber: 'uber', '99': '99', ifood: 'ifood', indrive: 'indrive',
            Uber: 'uber', iFood: 'ifood', InDrive: 'indrive',
          }
          const platParam = sumario.plataforma ? (platMap[sumario.plataforma] ?? 'uber') : 'uber'
          const href = `/motorista-app/ganhos?registrar=1&plataforma=${platParam}`
          return (
            <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
              <p className="text-sm font-bold text-amber-800 mb-0.5">💰 Nenhum ganho registrado</p>
              <p className="text-xs text-amber-600 mb-3">Registre agora para não perder o controle do dia.</p>
              <Link
                href={href}
                onClick={() => setSumario(null)}
                className="flex items-center justify-center w-full bg-amber-500 text-white font-semibold text-sm rounded-xl py-3.5 min-h-[52px] active:bg-amber-600 transition-colors"
              >
                Registrar ganhos agora →
              </Link>
            </div>
          )
        })()}

        {/* CTA */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => setSumario(null)}
            className="w-full bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl py-3.5 min-h-[52px] active:bg-gray-200 transition-colors"
          >
            Fechar resumo
          </button>
        </div>
      </div>
    )
  }

  /* ────────────────── INATIVO ────────────────── */
  if (!jornada) return (
    <>
      {/* Card */}
      <div className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Car className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Pronto para trabalhar hoje?</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">
              Ative quando sair e registre tudo automaticamente ao voltar.
            </p>
          </div>
        </div>
        <button
          onClick={() => { setErroMsg(null); setPlataformaSel('Todas'); setShowIniciarSheet(true) }}
          className="w-full bg-emerald-600 text-white font-semibold text-sm rounded-xl py-3.5 flex items-center justify-center gap-2 min-h-[52px] active:bg-emerald-700 transition-colors"
        >
          <span>🟢</span>
          Estou Rodando Agora
        </button>
      </div>

      {/* Bottom sheet de ativação */}
      {showIniciarSheet && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => { if (!isPending) setShowIniciarSheet(false) }}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="px-5 pt-3 pb-10">
              <h2 className="text-lg font-bold text-gray-900 mb-0.5">Bora trabalhar! 🚗</h2>
              <p className="text-sm text-gray-500 mb-4">Plataforma de hoje:</p>

              {/* Chips de plataforma */}
              <div className="flex flex-wrap gap-2 mb-6">
                {PLATAFORMAS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPlataformaSel(p.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
                      plataformaSel === p.value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {erroMsg && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
                  {erroMsg}
                </p>
              )}

              <button
                onClick={handleIniciar}
                disabled={isPending}
                className="w-full bg-emerald-600 text-white font-semibold text-sm rounded-xl py-4 min-h-[52px] disabled:opacity-50 active:bg-emerald-700 transition-colors"
              >
                {isPending ? 'Iniciando…' : 'Iniciar jornada'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )

  /* ────────────────── RODANDO ────────────────── */
  if (jornada.status === 'rodando') return (
    <>
      <div className="mx-4 mb-4 rounded-2xl bg-emerald-800 p-5 shadow-lg shadow-emerald-900/30 ring-2 ring-emerald-400/30">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
          <span className="text-emerald-300 font-bold text-xs uppercase tracking-widest">Você Está Rodando</span>
        </div>

        <p className="text-white font-mono text-4xl font-extrabold tracking-tight leading-none mb-2">
          {timerEfetivo}
        </p>

        <div className="flex flex-col gap-0.5 mb-4">
          <p className="text-emerald-300 text-xs">📅 Iniciado às {fmtHora(jornada.hora_inicio)}</p>
          {jornada.plataforma && (
            <p className="text-emerald-300 text-xs">🚗 {jornada.plataforma}</p>
          )}
        </div>

        <ResumoFin ganhos={ganhosHoje} despesas={despesasHoje} variante="green" />

        <div className="flex gap-3">
          <button
            onClick={() => { setErroMsg(null); setMotivoSel(null); setShowPausarSheet(true) }}
            className="flex-1 bg-amber-500 text-white font-semibold text-sm rounded-xl py-3.5 flex items-center justify-center gap-2 min-h-[52px] active:bg-amber-600 transition-colors"
          >
            ⏸️ Pausar
          </button>
          <button
            onClick={() => { setErroMsg(null); setShowEncerrarSheet(true) }}
            className="flex-1 bg-red-600 text-white font-semibold text-sm rounded-xl py-3.5 flex items-center justify-center gap-2 min-h-[52px] active:bg-red-700 transition-colors"
          >
            🔴 Encerrar
          </button>
        </div>
      </div>

      {/* Bottom sheet de encerramento */}
      {showEncerrarSheet && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => { if (!isPending) setShowEncerrarSheet(false) }}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-5 pt-3 pb-10">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Encerrar jornada? 🔴</h2>
              <p className="text-sm text-gray-500 mb-5">Isso vai finalizar o registro de hoje.</p>

              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">⏱ Tempo rodando</span>
                  <span className="font-semibold text-gray-900">{timerEfetivo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">💰 Ganhos do dia</span>
                  <span className="font-semibold text-emerald-700">{fmt(ganhosHoje)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">💸 Despesas</span>
                  <span className="font-semibold text-red-600">{fmt(despesasHoje)}</span>
                </div>
              </div>

              {erroMsg && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
                  {erroMsg}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEncerrarSheet(false)}
                  disabled={isPending}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl py-4 min-h-[52px] active:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEncerrar}
                  disabled={isPending}
                  className="flex-1 bg-red-600 text-white font-semibold text-sm rounded-xl py-4 min-h-[52px] disabled:opacity-50 active:bg-red-700 transition-colors"
                >
                  {isPending ? 'Encerrando…' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom sheet de pausa */}
      {showPausarSheet && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => { if (!isPending) setShowPausarSheet(false) }}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-5 pt-3 pb-10">
              <h2 className="text-lg font-bold text-gray-900 mb-0.5">Pausando jornada ⏸️</h2>
              <p className="text-sm text-gray-500 mb-4">Motivo (opcional):</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {MOTIVOS_PAUSA.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMotivoSel(motivoSel === m.value ? null : m.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
                      motivoSel === m.value
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {erroMsg && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
                  {erroMsg}
                </p>
              )}

              <button
                onClick={handlePausar}
                disabled={isPending}
                className="w-full bg-amber-500 text-white font-semibold text-sm rounded-xl py-4 min-h-[52px] disabled:opacity-50 active:bg-amber-600 transition-colors"
              >
                {isPending ? 'Pausando…' : 'Confirmar pausa'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )

  /* ────────────────── PAUSADO ────────────────── */
  return (
    <div className="mx-4 mb-4 rounded-2xl bg-amber-700 p-5 shadow-lg shadow-amber-900/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 bg-amber-300 rounded-full flex-shrink-0" />
        <span className="text-amber-200 font-bold text-xs uppercase tracking-widest">Jornada Pausada</span>
      </div>

      <p className="text-white font-mono text-4xl font-extrabold tracking-tight leading-none mb-2">
        {timerPausado}
      </p>

      <div className="flex flex-col gap-0.5 mb-4">
        {pausaAtual && (
          <p className="text-amber-200 text-xs">⏸ Pausa iniciada às {fmtHora(pausaAtual.inicio_pausa)}</p>
        )}
        <p className="text-amber-200 text-xs">⏱ Tempo rodando: {timerEfetivo}</p>
      </div>

      <ResumoFin ganhos={ganhosHoje} despesas={despesasHoje} variante="amber" />

      <div className="flex gap-3">
        <button
          onClick={handleRetomar}
          disabled={isPending}
          className="flex-1 bg-emerald-600 text-white font-semibold text-sm rounded-xl py-3.5 flex items-center justify-center gap-2 min-h-[52px] active:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Retomando…' : '🟢 Retomar'}
        </button>
        <button
          onClick={() => { setErroMsg(null); setShowEncerrarSheet(true) }}
          disabled={isPending}
          className="flex-1 bg-red-600 text-white font-semibold text-sm rounded-xl py-3.5 flex items-center justify-center gap-2 min-h-[52px] active:bg-red-700 disabled:opacity-50 transition-colors"
        >
          🔴 Encerrar
        </button>
      </div>

      {/* Bottom sheet de encerramento (pausado) */}
      {showEncerrarSheet && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => { if (!isPending) setShowEncerrarSheet(false) }}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-5 pt-3 pb-10">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Encerrar jornada? 🔴</h2>
              <p className="text-sm text-gray-500 mb-5">Isso vai finalizar o registro de hoje.</p>

              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">⏱ Tempo rodando</span>
                  <span className="font-semibold text-gray-900">{timerEfetivo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">💰 Ganhos do dia</span>
                  <span className="font-semibold text-emerald-700">{fmt(ganhosHoje)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">💸 Despesas</span>
                  <span className="font-semibold text-red-600">{fmt(despesasHoje)}</span>
                </div>
              </div>

              {erroMsg && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
                  {erroMsg}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEncerrarSheet(false)}
                  disabled={isPending}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl py-4 min-h-[52px] active:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEncerrar}
                  disabled={isPending}
                  className="flex-1 bg-red-600 text-white font-semibold text-sm rounded-xl py-4 min-h-[52px] disabled:opacity-50 active:bg-red-700 transition-colors"
                >
                  {isPending ? 'Encerrando…' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

}

