'use client'

import { useState, useTransition } from 'react'
import { Target, X } from 'lucide-react'
import { definirMeta, removerMeta } from './meta-actions'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function MetaBloco({
  mes,
  mesLabel,
  lucroReal,
  meta,
}: {
  mes: string
  mesLabel: string
  lucroReal: number
  meta: number | null
}) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(meta ? meta.toFixed(2).replace('.', ',') : '')
  const [isPending, startTransition] = useTransition()

  function salvar() {
    const num = parseFloat(valor.replace(',', '.'))
    if (isNaN(num) || num <= 0) return
    startTransition(async () => {
      await definirMeta(mes, num)
      setEditando(false)
    })
  }

  function remover() {
    startTransition(async () => {
      await removerMeta(mes)
      setValor('')
    })
  }

  if (meta !== null && !editando) {
    const pct     = Math.min(100, Math.round((lucroReal / meta) * 100))
    const restante = meta - lucroReal
    const atingiu  = lucroReal >= meta

    return (
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-gray-700">Meta de {mesLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditando(true)} className="text-[10px] text-gray-400 underline">editar</button>
            <button onClick={remover} disabled={isPending} className="text-gray-300 hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">{fmt(lucroReal)} de {fmt(meta)}</span>
          <span className={`text-xs font-bold ${atingiu ? 'text-emerald-600' : 'text-amber-600'}`}>
            {pct}%
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${atingiu ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!atingiu && (
          <p className="text-[10px] text-gray-400 mt-1.5">
            Faltam <span className="font-semibold text-amber-600">{fmt(restante)}</span> para atingir a meta
          </p>
        )}
        {atingiu && (
          <p className="text-[10px] text-emerald-600 font-semibold mt-1.5">
            Meta atingida! 🎉 Você superou em {fmt(lucroReal - meta)}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="mt-4 pt-3 border-t border-gray-100">
      {editando ? (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Meta para {mesLabel}</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={e => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-emerald-400"
              />
            </div>
            <button
              onClick={salvar}
              disabled={isPending}
              className="bg-emerald-600 text-white text-xs font-semibold px-4 rounded-xl disabled:opacity-50"
            >
              Salvar
            </button>
            <button onClick={() => setEditando(false)} className="text-gray-400 text-xs px-2">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditando(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-200 rounded-xl text-xs font-semibold text-gray-400 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
        >
          <Target className="w-3.5 h-3.5" />
          Definir meta do mês
        </button>
      )}
    </div>
  )
}
