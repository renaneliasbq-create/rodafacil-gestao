'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { marcarPago } from './actions'
import { useState } from 'react'
import { CheckCircle2, Loader2, X } from 'lucide-react'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary py-1.5 text-xs">
      {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
    </button>
  )
}

export function MarcarPagoForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(marcarPago, null)

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-emerald-600 hover:underline font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 inline mr-0.5" />
        Pago
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 m-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Confirmar pagamento</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form action={action} className="space-y-4">
              <input type="hidden" name="id" value={id} />
              {state?.error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data do pagamento *</label>
                <input name="data_pagamento" type="date" required className="input"
                  defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Forma *</label>
                <select name="forma_pagamento" required className="input">
                  <option value="pix">PIX</option>
                  <option value="transferencia">Transferência</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
              <div className="flex gap-3">
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
