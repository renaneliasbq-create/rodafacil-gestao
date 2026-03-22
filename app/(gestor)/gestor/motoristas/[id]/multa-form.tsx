'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { criarMulta } from '../actions'
import { useState } from 'react'
import { Loader2, AlertTriangle, X } from 'lucide-react'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Registrar multa'}
    </button>
  )
}

interface Props { motoristaId: string; veiculoId: string }

export function NovaMultaForm({ motoristaId, veiculoId }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(criarMulta, null)

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary py-1.5 text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50">
        <AlertTriangle className="w-3.5 h-3.5" /> Nova multa
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 m-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Registrar multa</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form action={action} className="space-y-4">
              <input type="hidden" name="motorista_id" value={motoristaId} />
              <input type="hidden" name="veiculo_id" value={veiculoId} />
              {state?.error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Infração *</label>
                <input name="infracao" type="text" required className="input" placeholder="Descreva a infração" />
              </div>
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
