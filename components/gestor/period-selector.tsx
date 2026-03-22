'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export const PERIODOS = [
  { value: 'mes_atual',     label: 'Este mês' },
  { value: 'mes_anterior',  label: 'Mês anterior' },
  { value: 'ultimos_3',     label: 'Últimos 3 meses' },
  { value: 'ultimos_6',     label: 'Últimos 6 meses' },
  { value: 'ano_atual',     label: 'Este ano' },
] as const

export type PeriodoValue = typeof PERIODOS[number]['value']

export function PeriodSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const atual = (searchParams.get('periodo') ?? 'mes_atual') as PeriodoValue

  function select(value: PeriodoValue) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('periodo', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
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
    </div>
  )
}
