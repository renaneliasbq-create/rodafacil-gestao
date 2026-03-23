'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deletarVencimento } from './actions'

export function DeleteVencimento({ id }: { id: string }) {
  const [pending, start] = useTransition()

  function handleDelete() {
    if (!confirm('Excluir este alerta de vencimento?')) return
    start(() => deletarVencimento(id))
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
      title="Excluir"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
