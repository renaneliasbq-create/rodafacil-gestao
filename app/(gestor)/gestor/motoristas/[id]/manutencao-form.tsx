'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { criarManutencao } from '../actions'
import { useState } from 'react'
import { Loader2, Wrench, X } from 'lucide-react'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Registrar manutenção'}
    </button>
  )
}

interface Props { motoristaId: string; veiculoId: string; veiculoNome: string }

const TIPOS = ['Troca de óleo', 'Revisão', 'Pneus', 'Freios', 'Suspensão', 'Elétrica', 'Funilaria', 'Outro']

export function NovaManutencaoForm({ motoristaId, veiculoId, veiculoNome }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(criarManutencao, null)

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary py-1.5 text-xs gap-1.5 border-orange-200 text-orange-600 hover:bg-orange-50">
        <Wrench className="w-3.5 h-3.5" /> Nova manutenção
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 m-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900">Registrar manutenção</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-5">{veiculoNome}</p>
            <form action={action} className="space-y-4">
              <input type="hidden" name="motorista_id" value={motoristaId} />
              <input type="hidden" name="veiculo_id" value={veiculoId} />
              {state?.error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tipo *</label>
                <select name="tipo" required className="input">
                  <option value="">Selecione o tipo</option>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição</label>
                <input name="descricao" type="text" className="input" placeholder="Detalhes da manutenção" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor (R$)</label>
                  <input name="valor" type="number" step="0.01" className="input" placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data *</label>
                  <input name="data" type="date" required className="input"
                    defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">KM atual</label>
                <input name="quilometragem" type="number" className="input" placeholder="Ex: 45000" />
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
