'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { registrarKm, deletarKm, type KmState } from './actions'
import { Plus, X, Loader2, Trash2, Gauge } from 'lucide-react'

function BtnSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[44px]"
    >
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Salvar registro'}
    </button>
  )
}

function ModalKm({ onClose, kmFinalAnterior }: { onClose: () => void; kmFinalAnterior?: number }) {
  const [state, formAction] = useFormState<KmState, FormData>(registrarKm, null)
  const [inicial, setInicial] = useState(kmFinalAnterior ? String(kmFinalAnterior) : '')
  const [final, setFinal]     = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) onClose()
  }, [state, onClose])

  const hoje = new Date().toISOString().split('T')[0]
  const kmInicial = parseInt(inicial.replace(/\D/g, ''), 10)
  const kmFinal   = parseInt(final.replace(/\D/g, ''), 10)
  const kmTotal   = !isNaN(kmInicial) && !isNaN(kmFinal) && kmFinal > kmInicial
    ? kmFinal - kmInicial
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900">Registrar KM</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form ref={formRef} action={formAction} className="px-5 py-4 space-y-4">
          {state?.error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {state.error}
            </div>
          )}

          {/* Data */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data</label>
            <input
              name="data"
              type="date"
              defaultValue={hoje}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* KM par: inicial + final lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                KM inicial
              </label>
              <input
                name="km_inicial"
                type="text"
                inputMode="numeric"
                value={inicial}
                onChange={e => setInicial(e.target.value)}
                placeholder="ex: 48.500"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {kmFinalAnterior && (
                <p className="text-[10px] text-blue-500 mt-1">Último registrado: {kmFinalAnterior.toLocaleString('pt-BR')} km</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                KM final
              </label>
              <input
                name="km_final"
                type="text"
                inputMode="numeric"
                value={final}
                onChange={e => setFinal(e.target.value)}
                placeholder="ex: 48.850"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Preview KM total */}
          {kmTotal !== null ? (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <Gauge className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-blue-500 font-medium">KM rodados hoje</p>
                <p className="text-xl font-extrabold text-blue-700">{kmTotal.toLocaleString('pt-BR')} km</p>
              </div>
            </div>
          ) : (inicial || final) ? (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              <p className="text-xs text-red-500">KM final deve ser maior que o inicial</p>
            </div>
          ) : null}

          <BtnSubmit />
        </form>
      </div>
    </div>
  )
}

export function BtnDeletarKm({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Excluir este registro de KM?')) return
    startTransition(() => deletarKm(id))
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}

export function BtnRegistrarKm({ kmFinalAnterior }: { kmFinalAnterior?: number }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
      >
        <Plus className="w-4 h-4" />
        Registrar
      </button>
      {open && <ModalKm onClose={() => setOpen(false)} kmFinalAnterior={kmFinalAnterior} />}
    </>
  )
}
