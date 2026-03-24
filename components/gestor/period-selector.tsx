'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CalendarDays } from 'lucide-react'

export const PERIODOS = [
  { value: 'mes_atual',    label: 'Este mês' },
  { value: 'mes_anterior', label: 'Mês anterior' },
  { value: 'ultimos_3',    label: 'Últimos 3 meses' },
  { value: 'ultimos_6',    label: 'Últimos 6 meses' },
  { value: 'ano_atual',    label: 'Este ano' },
] as const

export type PeriodoValue = typeof PERIODOS[number]['value'] | 'personalizado'

export function PeriodSelector() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const atual = (searchParams.get('periodo') ?? 'mes_atual') as PeriodoValue

  const [de,  setDe]  = useState(searchParams.get('de')  ?? '')
  const [ate, setAte] = useState(searchParams.get('ate') ?? '')

  function select(value: PeriodoValue) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('periodo', value)
    params.delete('de')
    params.delete('ate')
    router.push(`${pathname}?${params.toString()}`)
  }

  function aplicarCustom() {
    if (!de || !ate || de > ate) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('periodo', 'personalizado')
    params.set('de', de)
    params.set('ate', ate)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Linha de pills */}
      <div className="flex flex-wrap items-center gap-1 bg-gray-100 rounded-lg p-1">
        {PERIODOS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => select(value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap',
              atual === value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {label}
          </button>
        ))}

        {/* Botão Personalizado */}
        <button
          onClick={() => {
            if (atual !== 'personalizado') {
              // só ativa o modo, sem navegar ainda
              const params = new URLSearchParams(searchParams.toString())
              params.set('periodo', 'personalizado')
              router.push(`${pathname}?${params.toString()}`)
            }
          }}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
            atual === 'personalizado'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Personalizado
        </button>
      </div>

      {/* Seletor de datas — só aparece quando "Personalizado" está ativo */}
      {atual === 'personalizado' && (
        <div className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">De</span>
            <input
              type="date"
              value={de}
              onChange={e => setDe(e.target.value)}
              className="border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Até</span>
            <input
              type="date"
              value={ate}
              onChange={e => setAte(e.target.value)}
              min={de}
              className="border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            />
          </div>
          <button
            onClick={aplicarCustom}
            disabled={!de || !ate || de > ate}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-md transition-colors"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
