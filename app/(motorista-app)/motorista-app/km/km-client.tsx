'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function NavMes({ ano, mes }: { ano: number; mes: number }) {
  const router = useRouter()

  function navegar(delta: number) {
    const d = new Date(ano, mes - 1 + delta, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    router.push(`/motorista-app/km?mes=${y}-${m}`)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => navegar(-1)}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px]"
      >
        <ChevronLeft className="w-5 h-5 text-gray-500" />
      </button>
      <button
        onClick={() => navegar(1)}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px]"
      >
        <ChevronRight className="w-5 h-5 text-gray-500" />
      </button>
    </div>
  )
}
