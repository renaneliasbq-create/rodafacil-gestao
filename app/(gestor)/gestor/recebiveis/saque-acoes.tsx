'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deletarSaque, salvarComprovanteSaque, deletarComprovanteSaque } from './actions'
import { ComprovanteUpload } from '@/components/gestor/comprovante-upload'

interface Props {
  id: string
  comprovanteUrl: string | null
  comprovantePath: string | null
}

export function SaqueAcoes({ id, comprovanteUrl, comprovantePath }: Props) {
  const [pending, start] = useTransition()

  function handleDelete() {
    if (!confirm('Excluir esta retirada?')) return
    start(() => deletarSaque(id))
  }

  return (
    <div className="flex items-center gap-0.5">
      <ComprovanteUpload
        registroId={id}
        comprovanteUrl={comprovanteUrl}
        comprovantePath={comprovantePath}
        onSave={salvarComprovanteSaque}
        onDelete={deletarComprovanteSaque}
      />
      <button
        onClick={handleDelete}
        disabled={pending}
        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
        title="Excluir"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
