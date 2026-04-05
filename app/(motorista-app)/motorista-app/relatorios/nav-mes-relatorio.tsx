'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MESES_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

export function NavMesRelatorio({ ano, mes }: { ano: number; mes: number }) {
  const router = useRouter()
  const hoje   = new Date()

  function navegar(delta: number) {
    const d = new Date(ano, mes - 1 + delta, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    router.push(`/motorista-app/relatorios?mes=${y}-${m}`)
  }

  function onSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(`/motorista-app/relatorios?mes=${e.target.value}`)
  }

  // Gera opções: 24 meses atrás até o mês atual, em ordem CRESCENTE (mais antigo → mais recente)
  const opcoes: { valor: string; label: string }[] = []
  for (let i = 23; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    opcoes.push({
      valor: `${y}-${String(m).padStart(2, '0')}`,
      label: `${MESES_PT[m - 1]} ${y}`,
    })
  }

  const valorAtual = `${ano}-${String(mes).padStart(2, '0')}`
  const isHoje = ano === hoje.getFullYear() && mes === hoje.getMonth() + 1

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => navegar(-1)}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="w-5 h-5 text-gray-500" />
      </button>

      <select
        value={valorAtual}
        onChange={onSelectChange}
        className="text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl px-3 py-1.5 border-none outline-none appearance-none text-center cursor-pointer min-w-[140px]"
      >
        {opcoes.map(o => (
          <option key={o.valor} value={o.valor}>{o.label}</option>
        ))}
      </select>

      <button
        onClick={() => navegar(1)}
        disabled={isHoje}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Próximo mês"
      >
        <ChevronRight className="w-5 h-5 text-gray-500" />
      </button>
    </div>
  )
}
