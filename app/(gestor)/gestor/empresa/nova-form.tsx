'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { criarGastoCnpj } from './actions'
import { useState, useEffect, useRef } from 'react'
import { Loader2, Plus, X } from 'lucide-react'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Registrar gasto'}
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

const CATEGORIAS = [
  { value: 'contador',            label: 'Contador / Contabilidade' },
  { value: 'alvara',              label: 'Alvará / Licença' },
  { value: 'certificado_digital', label: 'Certificado digital' },
  { value: 'software',            label: 'Software / Sistema' },
  { value: 'telefone_internet',   label: 'Telefone / Internet' },
  { value: 'aluguel',             label: 'Aluguel de espaço' },
  { value: 'imposto',             label: 'Imposto / Taxa' },
  { value: 'bancario',            label: 'Tarifa bancária' },
  { value: 'outro',               label: 'Outro' },
]

export function NovoGastoCnpjForm() {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(criarGastoCnpj, null)

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> Novo gasto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-5 sm:p-6 sm:m-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Novo gasto do CNPJ</h2>
                <p className="text-xs text-gray-400 mt-0.5">Despesa administrativa da empresa</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form action={action} className="space-y-4">
              <AutoFechar state={state} onClose={() => setOpen(false)} />
              {state?.error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Categoria *</label>
                <select name="categoria" required className="input">
                  <option value="">Selecione</option>
                  {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição</label>
                <input name="descricao" type="text" className="input" placeholder='Ex: "Mensalidade março", "DAS Simples"' />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="flex gap-3 pt-1 pb-2">
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
