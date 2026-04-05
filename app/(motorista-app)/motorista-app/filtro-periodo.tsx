'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

function computePreset(id: string): { de: string; ate: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() // 0-indexed

  switch (id) {
    case 'este_mes': {
      const mes = m + 1
      return {
        de:  `${y}-${String(mes).padStart(2, '0')}-01`,
        ate: new Date(y, mes, 0).toISOString().split('T')[0],
      }
    }
    case 'mes_anterior': {
      const mes = m === 0 ? 12 : m
      const ano = m === 0 ? y - 1 : y
      return {
        de:  `${ano}-${String(mes).padStart(2, '0')}-01`,
        ate: new Date(ano, mes, 0).toISOString().split('T')[0],
      }
    }
    case 'ult_3': {
      const start = new Date(y, m - 2, 1)
      const end   = new Date(y, m + 1, 0)
      return {
        de:  `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`,
        ate: end.toISOString().split('T')[0],
      }
    }
    case 'ult_6': {
      const start = new Date(y, m - 5, 1)
      const end   = new Date(y, m + 1, 0)
      return {
        de:  `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`,
        ate: end.toISOString().split('T')[0],
      }
    }
    case 'este_ano':
      return { de: `${y}-01-01`, ate: `${y}-12-31` }
    default:
      return computePreset('este_mes')
  }
}

const PRESETS = [
  { id: 'este_mes',     label: 'Este mês' },
  { id: 'mes_anterior', label: 'Mês anterior' },
  { id: 'ult_3',        label: 'Últ. 3 meses' },
  { id: 'ult_6',        label: 'Últ. 6 meses' },
  { id: 'este_ano',     label: 'Este ano' },
] as const

const COR = {
  verde:    { ativo: 'bg-emerald-600 text-white border-emerald-600', ring: 'focus:ring-emerald-500', buscar: 'bg-emerald-600' },
  vermelho: { ativo: 'bg-red-500 text-white border-red-500',         ring: 'focus:ring-red-400',     buscar: 'bg-red-500'     },
  azul:     { ativo: 'bg-blue-600 text-white border-blue-600',       ring: 'focus:ring-blue-500',    buscar: 'bg-blue-600'    },
} as const

type CorFiltro = keyof typeof COR

export function FiltroPeriodo({
  de,
  ate,
  cor = 'verde',
}: {
  de: string
  ate: string
  cor?: CorFiltro
}) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const [customOpen, setCustomOpen] = useState(false)
  const [customDe,   setCustomDe]   = useState(de)
  const [customAte,  setCustomAte]  = useState(ate)

  const tema = COR[cor]

  function navTo(novoDe: string, novoAte: string) {
    const sp = new URLSearchParams(searchParams.toString())
    sp.delete('mes')
    sp.set('de', novoDe)
    sp.set('ate', novoAte)
    router.push(`${pathname}?${sp.toString()}`)
  }

  const presetRanges = PRESETS.map(p => ({ ...p, range: computePreset(p.id) }))
  const activePreset = presetRanges.find(p => p.range.de === de && p.range.ate === ate)
  const isCustom     = !activePreset

  return (
    <div className="px-4 mb-4">
      {/* Chips horizontais */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {presetRanges.map(p => (
          <button
            key={p.id}
            onClick={() => {
              setCustomOpen(false)
              navTo(p.range.de, p.range.ate)
            }}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-full border transition-colors whitespace-nowrap ${
              activePreset?.id === p.id
                ? tema.ativo
                : 'bg-white text-gray-600 border-gray-200'
            }`}
            style={{ minHeight: 36 }}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setCustomOpen(v => !v)}
          className={`flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-full border transition-colors whitespace-nowrap flex items-center gap-1 ${
            isCustom || customOpen
              ? tema.ativo
              : 'bg-white text-gray-600 border-gray-200'
          }`}
          style={{ minHeight: 36 }}
        >
          Personalizado
          <ChevronDown className={`w-3 h-3 transition-transform ${customOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Seletor de datas personalizado */}
      {customOpen && (
        <div className="mt-3 bg-white border border-gray-200 rounded-2xl p-3 flex items-end gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-medium text-gray-400 block mb-1">De</label>
            <input
              type="date"
              value={customDe}
              onChange={e => setCustomDe(e.target.value)}
              className={`w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 ${tema.ring}`}
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-medium text-gray-400 block mb-1">Até</label>
            <input
              type="date"
              value={customAte}
              onChange={e => setCustomAte(e.target.value)}
              className={`w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 ${tema.ring}`}
            />
          </div>
          <button
            onClick={() => {
              if (customDe && customAte && customDe <= customAte) {
                navTo(customDe, customAte)
                setCustomOpen(false)
              }
            }}
            className={`flex-shrink-0 ${tema.buscar} text-white text-xs font-bold px-4 rounded-xl`}
            style={{ minHeight: 40 }}
          >
            Buscar
          </button>
        </div>
      )}
    </div>
  )
}
