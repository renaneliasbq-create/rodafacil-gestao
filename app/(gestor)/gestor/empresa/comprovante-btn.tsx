'use client'

import { ComprovanteUpload } from '@/components/gestor/comprovante-upload'
import { salvarComprovanteDespesa, deletarComprovanteDespesa } from '../despesas/actions'

interface Props {
  id: string
  comprovanteUrl: string | null
  comprovantePath: string | null
}

export function ComprovanteBtnEmpresa({ id, comprovanteUrl, comprovantePath }: Props) {
  return (
    <ComprovanteUpload
      registroId={id}
      comprovanteUrl={comprovanteUrl}
      comprovantePath={comprovantePath}
      onSave={salvarComprovanteDespesa}
      onDelete={deletarComprovanteDespesa}
    />
  )
}
