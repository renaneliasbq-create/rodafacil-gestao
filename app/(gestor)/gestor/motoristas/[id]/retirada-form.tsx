'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { criarRetirada } from '../actions'
import { useState, useEffect, useRef } from 'react'
import { Loader2, ArrowDownLeft, X } from 'lucide-react'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Registrar retirada'}
    </button>
  )
}

function AutoFechar({ state, onClose }: { state: unknown; onClose: () => void }) {
  const { pending } = useFormStatus()
  const wasSubmitting = useRef(false)
  useEffect(() => {
    if (pending) { wasSubmitting.current = true; return }
    if (wasSubmitting.current && !pending && state === null) {
      wasSubmitting.current = false
      onClose()
    }
  }, [pending, state, onClose])
  return null
}

export function NovaRetiradaForm({ motoristaId }: { motoristaId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(criarRetirada, null)

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary py-1.5 text-xs gap-1.5 border-purple-200 text-purple-600 hover:bg-purple-50">
        <ArrowDownLeft className="w-3.5 h-3.5" /> Nova retirada
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 m-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Registrar retirada</h2>
                <p className="text-xs text-gray-400 mt-0.5">Valor repassado ao motorista</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form action={action} className="space-y-4">
              <AutoFechar state={state} onClose={() => setOpen(false)} />
              <input type="hidden" name="motorista_id" value={motoristaId} />
              {state?.error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor *</label>
                  <input name="valor" type="number" step="0.01" required className="input" placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data *</label>
                  <input name="data" type="date" required className="input"
                    defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Observação</label>
                <input name="observacao" type="text" className="input" placeholder='Ex: "Semana 10/03 a 17/03"' />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                <div className="flex-1"><Submit /></div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
