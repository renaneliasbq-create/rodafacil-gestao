'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { criarSeguro } from '../actions'
import { useState, useEffect, useRef } from 'react'
import { Loader2, ShieldCheck, X } from 'lucide-react'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Registrar seguro'}
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

interface Props { motoristaId: string; veiculoId: string }

export function NovoSeguroForm({ motoristaId, veiculoId }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(criarSeguro, null)

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary py-1.5 text-xs gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50">
        <ShieldCheck className="w-3.5 h-3.5" /> Novo seguro
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 m-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Registrar seguro</h2>
                <p className="text-xs text-gray-400 mt-0.5">Custo de seguro do veículo</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form action={action} className="space-y-4">
              <AutoFechar state={state} onClose={() => setOpen(false)} />
              <input type="hidden" name="motorista_id" value={motoristaId} />
              <input type="hidden" name="veiculo_id" value={veiculoId} />
              {state?.error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição</label>
                <input name="descricao" type="text" className="input" placeholder='Ex: "Renovação anual", "Parcela 3/10"' />
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
