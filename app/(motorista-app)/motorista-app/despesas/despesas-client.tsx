'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { registrarDespesa, deletarDespesa, type DespesaState } from './actions'
import { Plus, X, Loader2, Trash2, ChevronDown, Fuel, Wrench, Sparkles, Shield, FileText, Coffee, Smartphone, HelpCircle } from 'lucide-react'

// ── Categorias ──────────────────────────────────────────────────
export const CATEGORIAS = [
  { nome: 'Combustível',       icon: Fuel,         bg: 'bg-orange-100', text: 'text-orange-600',  badge: 'bg-orange-100 text-orange-700' },
  { nome: 'Manutenção',        icon: Wrench,        bg: 'bg-blue-100',   text: 'text-blue-600',    badge: 'bg-blue-100 text-blue-700' },
  { nome: 'Lavagem',           icon: Sparkles,      bg: 'bg-cyan-100',   text: 'text-cyan-600',    badge: 'bg-cyan-100 text-cyan-700' },
  { nome: 'Seguro',            icon: Shield,        bg: 'bg-purple-100', text: 'text-purple-600',  badge: 'bg-purple-100 text-purple-700' },
  { nome: 'IPVA / Docs',       icon: FileText,      bg: 'bg-yellow-100', text: 'text-yellow-600',  badge: 'bg-yellow-100 text-yellow-700' },
  { nome: 'Alimentação',       icon: Coffee,        bg: 'bg-amber-100',  text: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700' },
  { nome: 'Aplicativo',        icon: Smartphone,    bg: 'bg-indigo-100', text: 'text-indigo-600',  badge: 'bg-indigo-100 text-indigo-700' },
  { nome: 'Outros',            icon: HelpCircle,    bg: 'bg-gray-100',   text: 'text-gray-500',    badge: 'bg-gray-100 text-gray-600' },
]

export function getCat(nome: string) {
  return CATEGORIAS.find(c => c.nome === nome) ?? CATEGORIAS[CATEGORIAS.length - 1]
}

export function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Botão submit ─────────────────────────────────────────────────
function BtnSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[44px]"
    >
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Salvar despesa'}
    </button>
  )
}

// ── Modal de registro ────────────────────────────────────────────
function ModalDespesa({ onClose }: { onClose: () => void }) {
  const [state, formAction] = useFormState<DespesaState, FormData>(registrarDespesa, null)
  const [categoria, setCategoria] = useState('Combustível')
  const formRef = useRef<HTMLFormElement>(null)
  const prevState = useRef(state)

  useEffect(() => {
    if (prevState.current !== null && state === null) {
      onClose()
    }
    prevState.current = state
  }, [state, onClose])

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900">Registrar despesa</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form ref={formRef} action={formAction} className="px-5 py-4 space-y-4">
          {state?.error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {state.error}
            </div>
          )}

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Categoria</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIAS.map(cat => {
                const Icon = cat.icon
                const ativo = categoria === cat.nome
                return (
                  <button
                    key={cat.nome}
                    type="button"
                    onClick={() => setCategoria(cat.nome)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${
                      ativo
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ativo ? 'bg-red-100' : cat.bg}`}>
                      <Icon className={`w-4 h-4 ${ativo ? 'text-red-500' : cat.text}`} />
                    </div>
                    <span className={`text-[9px] font-semibold leading-tight text-center px-0.5 ${ativo ? 'text-red-600' : 'text-gray-500'}`}>
                      {cat.nome}
                    </span>
                  </button>
                )
              })}
            </div>
            <input type="hidden" name="categoria" value={categoria} />
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data</label>
            <input
              name="data"
              type="date"
              defaultValue={hoje}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$</span>
              <input
                name="valor"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pl-9 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Descrição <span className="normal-case font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              name="descricao"
              type="text"
              placeholder="ex: Abastecimento posto Shell"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <BtnSubmit />
        </form>
      </div>
    </div>
  )
}

// ── Botão deletar ─────────────────────────────────────────────────
export function BtnDeletarDespesa({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Excluir esta despesa?')) return
    startTransition(() => deletarDespesa(id))
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}

// ── Filtro por categoria ──────────────────────────────────────────
export function FiltroCategoria({
  categorias,
  atual,
}: {
  categorias: string[]
  atual: string | null
}) {
  const [open, setOpen] = useState(false)

  function navegar(c: string | null) {
    setOpen(false)
    const url = new URL(window.location.href)
    if (c) url.searchParams.set('cat', c)
    else url.searchParams.delete('cat')
    window.location.href = url.toString()
  }

  const catAtual = atual ? getCat(atual) : null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        {catAtual ? (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full mr-1 ${catAtual.badge}`}>{atual}</span>
        ) : (
          <span>Todas</span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[150px]">
            <button
              onClick={() => navegar(null)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${!atual ? 'text-red-600 font-semibold bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              Todas
            </button>
            {categorias.map(c => (
              <button
                key={c}
                onClick={() => navegar(c)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${atual === c ? 'text-red-600 font-semibold bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Botão principal "+ Registrar" ─────────────────────────────────
export function BtnRegistrarDespesa() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
      >
        <Plus className="w-4 h-4" />
        Registrar
      </button>
      {open && <ModalDespesa onClose={() => setOpen(false)} />}
    </>
  )
}
