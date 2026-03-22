'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { criarPagamento } from './actions'
import { useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Criar lançamento'}
    </button>
  )
}

interface Motorista { id: string; nome: string }
interface Contrato { id: string; motorista_id: string; valor_aluguel: number }

export function NovoPagamentoForm({ motoristas, contratos }: { motoristas: Motorista[]; contratos: Contrato[] }) {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(criarPagamento, null)
  const [motoristaId, setMotoristaId] = useState('')

  const contratosFiltrados = contratos.filter(c => c.motorista_id === motoristaId)

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" />
        Novo lançamento
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-6 sm:m-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Novo lançamento</h2>
              <button onClick={() => setOpen(false)} className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form action={action} className="space-y-4">
              {state?.error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Motorista *</label>
                <select name="motorista_id" required className="input" value={motoristaId} onChange={e => setMotoristaId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Contrato *</label>
                <select name="contrato_id" required className="input" disabled={!motoristaId}>
                  <option value="">Selecione o contrato</option>
                  {contratosFiltrados.map(c => (
                    <option key={c.id} value={c.id}>Contrato — R$ {c.valor_aluguel.toFixed(2)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor *</label>
                  <input name="valor" type="number" step="0.01" required className="input" placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Vencimento *</label>
                  <input name="data_vencimento" type="date" required className="input" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Referência</label>
                <input name="referencia" type="text" className="input" placeholder='Ex: "Aluguel Março/2026"' />
              </div>

              <div className="flex gap-3 pt-2 pb-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 min-h-[44px]">Cancelar</button>
                <div className="flex-1"><Submit /></div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
