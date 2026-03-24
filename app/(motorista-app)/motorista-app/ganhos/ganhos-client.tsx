'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { registrarGanho, deletarGanho, type GanhoState } from './actions'
import { Plus, X, Loader2, Trash2, ChevronDown } from 'lucide-react'

// ── Plataformas: valor (BD) → label (exibição) ──────────────────
const PLATAFORMAS = [
  { valor: 'uber',    label: 'Uber' },
  { valor: '99',      label: '99' },
  { valor: 'ifood',   label: 'iFood' },
  { valor: 'indrive', label: 'Indrive' },
  { valor: 'outro',   label: 'Outro' },
]

const TAXAS: Record<string, number> = {
  uber: 25, '99': 20, ifood: 27, indrive: 20, outro: 0,
}

export const BADGE: Record<string, string> = {
  uber:    'bg-black text-white',
  '99':    'bg-yellow-400 text-yellow-900',
  ifood:   'bg-red-500 text-white',
  indrive: 'bg-emerald-600 text-white',
  outro:   'bg-gray-400 text-white',
}

// Label legível a partir do valor do BD
export function labelPlataforma(valor: string) {
  return PLATAFORMAS.find(p => p.valor === valor)?.label ?? valor
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Botão submit ─────────────────────────────────────────────────
function BtnSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[44px]"
    >
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Salvar ganho'}
    </button>
  )
}

// ── Modal de registro ────────────────────────────────────────────
function ModalGanho({ onClose }: { onClose: () => void }) {
  const [state, formAction] = useFormState<GanhoState, FormData>(registrarGanho, null)
  const [plataforma, setPlataforma] = useState('uber')
  const [bruto, setBruto]           = useState('')
  const [taxa, setTaxa]             = useState(25)
  const [liquido, setLiquido]       = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  // Auto-calcula líquido ao mudar plataforma ou bruto
  useEffect(() => {
    const b = parseFloat(bruto.replace(',', '.'))
    if (!isNaN(b) && b > 0) {
      setLiquido((b * (1 - taxa / 100)).toFixed(2).replace('.', ','))
    }
  }, [bruto, taxa])

  // Atualiza taxa ao trocar plataforma
  function handlePlataforma(p: string) {
    setPlataforma(p)
    setTaxa(TAXAS[p] ?? 0)
  }

  useEffect(() => {
    if (state?.success) onClose()
  }, [state, onClose])

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900">Registrar ganho</h2>
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

          {/* Plataforma */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Plataforma</label>
            <div className="flex flex-wrap gap-2">
              {PLATAFORMAS.map(p => (
                <button
                  key={p.valor}
                  type="button"
                  onClick={() => handlePlataforma(p.valor)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    plataforma === p.valor
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="plataforma" value={plataforma} />
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data</label>
            <input
              name="data"
              type="date"
              defaultValue={hoje}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Valor bruto */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Valor bruto (o que aparece no app)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$</span>
              <input
                name="valor_bruto"
                type="text"
                inputMode="decimal"
                value={bruto}
                onChange={e => setBruto(e.target.value)}
                placeholder="0,00"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pl-9 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Taxa */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Taxa da plataforma
              </label>
              <span className="text-xs text-gray-400">padrão {labelPlataforma(plataforma)}: {TAXAS[plataforma]}%</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                value={taxa}
                onChange={e => setTaxa(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
          </div>

          {/* Valor líquido */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Valor líquido recebido
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$</span>
              <input
                name="valor_liquido"
                type="text"
                inputMode="decimal"
                value={liquido}
                onChange={e => setLiquido(e.target.value)}
                placeholder="0,00"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pl-9 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            {bruto && liquido && (
              <p className="text-xs text-emerald-600 mt-1 font-medium">
                Taxa efetiva: {((1 - parseFloat(liquido.replace(',', '.')) / parseFloat(bruto.replace(',', '.'))) * 100).toFixed(1)}%
              </p>
            )}
          </div>

          {/* Horas trabalhadas */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Horas trabalhadas <span className="normal-case font-normal text-gray-400">(opcional)</span>
            </label>
            <div className="relative">
              <input
                name="horas_trabalhadas"
                type="text"
                inputMode="decimal"
                placeholder="ex: 6"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">h</span>
            </div>
          </div>

          <BtnSubmit />
        </form>
      </div>
    </div>
  )
}

// ── Botão de excluir ganho ────────────────────────────────────────
export function BtnDeletarGanho({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Excluir este registro de ganho?')) return
    startTransition(() => deletarGanho(id))
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

// ── Botão de filtro por plataforma ────────────────────────────────
export function FiltroPlatforma({
  plataformas,
  atual,
}: {
  plataformas: string[]
  atual: string | null
}) {
  const [open, setOpen] = useState(false)

  function navegar(p: string | null) {
    setOpen(false)
    const url = new URL(window.location.href)
    if (p) url.searchParams.set('p', p)
    else url.searchParams.delete('p')
    window.location.href = url.toString()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        {atual ? (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full mr-1 ${BADGE[atual] ?? 'bg-gray-400 text-white'}`}>{atual}</span>
        ) : (
          <span>Todas</span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[120px]">
            <button
              onClick={() => navegar(null)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${!atual ? 'text-emerald-600 font-semibold bg-emerald-50' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              Todas
            </button>
            {plataformas.map(p => (
              <button
                key={p}
                onClick={() => navegar(p)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${atual === p ? 'text-emerald-600 font-semibold bg-emerald-50' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Botão principal "+ Registrar" ─────────────────────────────────
export function BtnRegistrarGanho() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
      >
        <Plus className="w-4 h-4" />
        Registrar
      </button>

      {open && <ModalGanho onClose={() => setOpen(false)} />}
    </>
  )
}

export { BADGE, fmt }
