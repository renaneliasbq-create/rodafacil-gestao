'use client'

import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { salvarAvatar } from './actions'
import { Camera, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface Props {
  userId: string
  nome: string
  fotoUrl: string | null
}

export function AvatarUpload({ userId, nome, fotoUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(fotoUrl)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErro('Imagem deve ter no máximo 5 MB.')
      return
    }

    setErro(null)

    // Preview imediato
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    startTransition(async () => {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        setErro('Erro ao fazer upload. Tente novamente.')
        setPreview(fotoUrl)
        return
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const result = await salvarAvatar(data.publicUrl)

      if (result.error) {
        setErro(result.error)
        setPreview(fotoUrl)
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="relative group">
        {/* Avatar */}
        <div
          onClick={() => !isPending && inputRef.current?.click()}
          className="w-20 h-20 rounded-full overflow-hidden cursor-pointer ring-2 ring-gray-100 hover:ring-blue-300 transition-all relative"
        >
          {preview ? (
            <Image
              src={preview}
              alt="Avatar"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-700">
                {nome.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Overlay de câmera */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            {isPending
              ? <Loader2 className="w-5 h-5 text-white animate-spin" />
              : <Camera className="w-5 h-5 text-white" />
            }
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
          disabled={isPending}
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => !isPending && inputRef.current?.click()}
          disabled={isPending}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
        >
          {isPending ? 'Enviando foto...' : 'Alterar foto'}
        </button>
        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG ou WebP · máx. 5 MB</p>
        {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
      </div>
    </div>
  )
}
