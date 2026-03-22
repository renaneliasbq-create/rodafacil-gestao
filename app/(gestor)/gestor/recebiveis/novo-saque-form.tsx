'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useFormState } from 'react-dom'
import { registrarSaque } from './actions'
import { Plus, X, Loader2 } from 'lucide-react'

export function NovoSaqueForm() {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(registrarSaque, null)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      formRef.current?.reset()
      window.location.href = '/gestor/recebiveis?ok=1&t=' + Date.now()
    }
  }, [state])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => { action(fd) })
  }

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> Registrar retirada
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Nova retirada</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {state?.error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor (R$)</label>
                <input name="valor" type="number" step="0.01" min="0.01" required placeholder="0,00" className="input" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data</label>
                <input name="data" type="date" required defaultValue={hoje} className="input" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição (opcional)</label>
                <input name="descricao" type="text" placeholder="Ex: Pro-labore, pessoal..." className="input" />
              </div>

              <button type="submit" disabled={pending} className="btn-primary w-full">
                {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Registrar retirada'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
