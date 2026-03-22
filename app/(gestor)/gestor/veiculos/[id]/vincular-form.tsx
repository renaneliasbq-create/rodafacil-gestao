'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { criarContrato } from '../../motoristas/actions'
import { Loader2 } from 'lucide-react'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Vinculando...</> : 'Vincular motorista'}
    </button>
  )
}

interface Motorista { id: string; nome: string }

export function VincularMotoristaForm({ veiculoId, motoristas }: { veiculoId: string; motoristas: Motorista[] }) {
  const [state, action] = useFormState(criarContrato, null)

  if (motoristas.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Nenhum motorista sem veículo disponível.{' '}
        <a href="/gestor/motoristas/novo" className="text-blue-600 underline">Cadastre um motorista</a>.
      </p>
    )
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="veiculo_id" value={veiculoId} />
      {state?.error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Motorista *</label>
        <select name="motorista_id" required className="input text-sm">
          <option value="">Selecione o motorista</option>
          {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor (R$) *</label>
          <input name="valor_aluguel" type="number" step="0.01" required placeholder="0,00" className="input text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Periodicidade *</label>
          <select name="periodicidade" required className="input text-sm">
            <option value="">Selecione</option>
            <option value="semanal">Semanal</option>
            <option value="quinzenal">Quinzenal</option>
            <option value="mensal">Mensal</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data início *</label>
        <input name="data_inicio" type="date" required className="input text-sm"
          defaultValue={new Date().toISOString().split('T')[0]} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input name="caucao_valor" type="number" step="0.01" placeholder="Caução (R$)" className="input text-sm" />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input name="caucao_pago" type="checkbox" value="true" className="rounded" />
          Caução pago
        </label>
      </div>

      <Submit />
    </form>
  )
}
