'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Target, Pencil, Loader2 } from 'lucide-react'
import { salvarMeta } from './actions'
import { fmt } from './ganhos-shared'

interface Props {
  meta: number | null
  totalLiq: number
  mes: number
  ano: number
}

export function GanhosMetaCard({ meta, totalLiq, mes, ano }: Props) {
  const router = useRouter()
  const [editando, setEditando] = useState(meta === null)
  const [valorInput, setValorInput] = useState(
    meta ? String(meta.toFixed(2)).replace('.', ',') : ''
  )
  const [isPending, setIsPending] = useState(false)

  const pct = meta && meta > 0 ? Math.min((totalLiq / meta) * 100, 100) : 0
  const restante = meta ? Math.max(meta - totalLiq, 0) : 0
  const barColor =
    pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'

  async function salvar() {
    const valor = parseFloat(valorInput.replace(',', '.'))
    if (isNaN(valor) || valor <= 0) return
    setIsPending(true)
    await salvarMeta(mes, ano, valor)
    router.refresh()
    setEditando(false)
    setIsPending(false)
  }

  if (editando) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-emerald-500" />
          <p className="text-sm font-bold text-gray-800">Meta mensal de ganho</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={valorInput}
              onChange={e => setValorInput(e.target.value)}
              placeholder="0,00"
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <button
            onClick={salvar}
            disabled={isPending}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 min-h-[44px]"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
          </button>
          {meta !== null && (
            <button
              onClick={() => setEditando(false)}
              className="px-3 py-2 text-gray-400 hover:text-gray-600 text-sm min-h-[44px]"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-500" />
          <p className="text-sm font-bold text-gray-800">Meta mensal</p>
        </div>
        <button
          onClick={() => {
            setValorInput(String(meta!.toFixed(2)).replace('.', ','))
            setEditando(true)
          }}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mb-1.5">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span className="font-semibold">{pct.toFixed(0)}% atingido</span>
          <span>meta: {fmt(meta!)}</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-xs mt-2">
        <span className="text-emerald-600 font-bold">{fmt(totalLiq)} conquistado</span>
        {restante > 0 ? (
          <span className="text-gray-400">faltam {fmt(restante)}</span>
        ) : (
          <span className="text-emerald-600 font-semibold">✓ Meta atingida!</span>
        )}
      </div>
    </div>
  )
}
