'use client'

import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Paperclip, Loader2, ExternalLink, Trash2 } from 'lucide-react'

type SaveFn = (id: string, url: string, path: string) => Promise<{ error?: string } | null>
type DeleteFn = (id: string, path: string) => Promise<void>

interface Props {
  registroId: string
  comprovanteUrl: string | null
  comprovantePath: string | null
  onSave: SaveFn
  onDelete: DeleteFn
}

export function ComprovanteUpload({ registroId, comprovanteUrl, comprovantePath, onSave, onDelete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(comprovanteUrl)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setErro('Máx. 10 MB.'); return }
    setErro(null)
    startTransition(async () => {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${registroId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('comprovantes').upload(path, file, { upsert: true })
      if (uploadError) { setErro('Erro no upload.'); return }
      const { data } = supabase.storage.from('comprovantes').getPublicUrl(path)
      const result = await onSave(registroId, data.publicUrl, path)
      if (result?.error) { setErro(result.error); return }
      setUrl(data.publicUrl)
    })
  }

  function handleDelete() {
    if (!confirm('Remover comprovante?')) return
    startTransition(async () => {
      await onDelete(registroId, comprovantePath ?? '')
      setUrl(null)
    })
  }

  if (isPending) return <div className="p-1.5 text-gray-300"><Loader2 className="w-3.5 h-3.5 animate-spin" /></div>

  if (url) {
    return (
      <div className="flex items-center gap-0.5">
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          title="Ver comprovante">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={handleDelete}
          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Remover comprovante">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <>
      <button onClick={() => inputRef.current?.click()}
        className="p-1.5 text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
        title="Anexar comprovante">
        <Paperclip className="w-3.5 h-3.5" />
      </button>
      {erro && <span className="text-xs text-red-500">{erro}</span>}
      <input ref={inputRef} type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden" onChange={handleFile} />
    </>
  )
}
