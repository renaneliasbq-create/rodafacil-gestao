'use client'

import { useTransition, useState } from 'react'
import { Trash2, CheckCircle2, Loader2, X } from 'lucide-react'
import { deletarPagamento, deletarRetirada, confirmarPagamento, confirmarMulta, confirmarManutencao } from '../actions'
import { useFormState, useFormStatus } from 'react-dom'

function SubmitConfirmar() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary flex-1 py-1.5 text-sm">
      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar'}
    </button>
  )
}

export function DeletePagamento({ id, motoristaId }: { id: string; motoristaId: string }) {
  const [pending, start] = useTransition()

  function handleClick() {
    if (!confirm('Excluir este recebível?')) return
    start(() => deletarPagamento(id, motoristaId))
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      title="Excluir recebível"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}

export function ConfirmarPagamento({ id, motoristaId }: { id: string; motoristaId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(confirmarPagamento, null)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
        title="Confirmar pagamento"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
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
              <input type="hidden" name="motorista_id" value={motoristaId} />
              {state?.error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data do pagamento *</label>
                <input name="data_pagamento" type="date" required className="input"
                  defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Forma</label>
                <select name="forma_pagamento" className="input">
                  <option value="">Selecione</option>
                  <option value="pix">PIX</option>
                  <option value="transferencia">Transferência</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                <SubmitConfirmar />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export function ConfirmarMulta({ id, motoristaId }: { id: string; motoristaId: string }) {
  const [pending, start] = useTransition()

  function handleClick() {
    if (!confirm('Marcar esta multa como paga?')) return
    start(() => confirmarMulta(id, motoristaId))
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="p-1.5 text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
      title="Marcar como paga"
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
    </button>
  )
}

export function ConfirmarManutencao({ id, motoristaId }: { id: string; motoristaId: string }) {
  const [pending, start] = useTransition()

  function handleClick() {
    if (!confirm('Marcar esta manutenção como concluída?')) return
    start(() => confirmarManutencao(id, motoristaId))
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="p-1.5 text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
      title="Marcar como concluída"
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
    </button>
  )
}

export function DeleteRetirada({ id, motoristaId }: { id: string; motoristaId: string }) {
  const [pending, start] = useTransition()

  function handleClick() {
    if (!confirm('Excluir esta retirada?')) return
    start(() => deletarRetirada(id, motoristaId))
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      title="Excluir retirada"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}
