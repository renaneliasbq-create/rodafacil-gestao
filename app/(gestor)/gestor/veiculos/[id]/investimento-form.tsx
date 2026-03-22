'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { salvarInvestimento } from '../actions'
import { useState } from 'react'
import { Loader2, DollarSign, Pencil, X } from 'lucide-react'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary flex-1">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Salvar'}
    </button>
  )
}

interface Props { veiculoId: string; valorAtual?: number | null }

export function InvestimentoForm({ veiculoId, valorAtual }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(salvarInvestimento, null)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
      >
        <Pencil className="w-3.5 h-3.5" />
        {valorAtual ? 'Editar' : 'Definir investimento'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 m-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Valor de compra</h2>
                <p className="text-xs text-gray-400 mt-0.5">Investimento inicial neste veículo</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form action={action} className="space-y-4">
              <input type="hidden" name="veiculo_id" value={veiculoId} />
              {state?.error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Valor pago pelo veículo (R$) *
                </label>
                <input
                  name="valor_compra"
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  className="input"
                  placeholder="0,00"
                  defaultValue={valorAtual ?? undefined}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                <Submit />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
