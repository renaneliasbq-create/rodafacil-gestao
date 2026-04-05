'use client'

import Link from 'next/link'
import { Mic } from 'lucide-react'
import { CameraRegistro } from '@/components/motorista-app/camera-registro'

export function AssistenteCard() {
  return (
    <div className="mx-4 mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 shadow-lg shadow-emerald-200">
      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight">Pergunte e Registre o que precisar</p>
      </div>

      {/* Botão câmera */}
      <CameraRegistro />

      {/* Botão microfone */}
      <Link
        href="/motorista-app/calcular"
        className="relative flex-shrink-0"
        aria-label="Assistente de voz"
      >
        <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
        <div className="relative w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
          <Mic className="w-5 h-5 text-white" />
        </div>
      </Link>
    </div>
  )
}
