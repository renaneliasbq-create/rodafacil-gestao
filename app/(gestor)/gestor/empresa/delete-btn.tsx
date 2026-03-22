'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deletarGastoCnpj } from './actions'

export function DeleteGasto({ id }: { id: string }) {
  const [pending, start] = useTransition()

  function handleClick() {
    if (!confirm('Excluir este gasto?')) return
    start(() => deletarGastoCnpj(id))
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      title="Excluir"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}
