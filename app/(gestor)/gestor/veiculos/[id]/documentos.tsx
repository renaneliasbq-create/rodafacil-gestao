'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { salvarDocumento, deletarDocumento } from '../actions'
import { FileText, Loader2, Paperclip, Trash2, Upload } from 'lucide-react'

interface Documento {
  id: string
  nome: string
  url: string
  path: string
}

interface Props {
  entidade: 'veiculo' | 'motorista'
  refId: string
  documentos: Documento[]
  label?: string
}

export function DocumentosSection({ entidade, refId, documentos, label = 'Documentos' }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [deletingId, startDelete] = useTransition()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setErro(null)
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const nomeSanitizado = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const path = `${entidade}/${refId}/${Date.now()}-${nomeSanitizado}`

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(path, file, { upsert: false })

      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(path)

      const result = await salvarDocumento(entidade, refId, file.name, path, publicUrl)
      if (result?.error) throw new Error(result.error)

      router.refresh()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar arquivo')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleDelete(id: string, path: string) {
    if (!confirm('Excluir este documento?')) return
    startDelete(async () => {
      await deletarDocumento(id, path)
      router.refresh()
    })
  }

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
        >
          {uploading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" />Enviando...</>
          ) : (
            <><Upload className="w-3.5 h-3.5" />Adicionar</>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {erro && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-2">{erro}</p>
      )}

      {documentos.length === 0 ? (
        <p className="text-xs text-gray-400">Nenhum documento anexado.</p>
      ) : (
        <div className="space-y-1.5">
          {documentos.map(doc => (
            <div key={doc.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 truncate"
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{doc.nome}</span>
              </a>
              <button
                onClick={() => handleDelete(doc.id, doc.path)}
                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                title="Excluir"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
