'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { criarContrato } from '../actions'
import { Loader2 } from 'lucide-react'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Criando...</> : 'Criar contrato'}
    </button>
  )
}

interface Veiculo { id: string; placa: string; modelo: string; marca: string }

export function ContratoForm({ motoristaId, veiculos }: { motoristaId: string; veiculos: Veiculo[] }) {
  const [state, action] = useFormState(criarContrato, null)

  if (veiculos.length === 0) {
    return <p className="text-xs text-gray-400">Nenhum veículo disponível. <a href="/gestor/veiculos/novo" className="text-blue-600 underline">Cadastre um veículo</a>.</p>
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="motorista_id" value={motoristaId} />
      {state?.error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}

      <select name="veiculo_id" required className="input text-sm">
        <option value="">Selecione o veículo</option>
        {veiculos.map(v => (
          <option key={v.id} value={v.id}>{v.marca} {v.modelo} — {v.placa}</option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2">
        <input name="valor_aluguel" type="number" step="0.01" required placeholder="Valor (R$)" className="input text-sm" />
        <select name="periodicidade" required className="input text-sm">
          <option value="">Periodicidade</option>
          <option value="semanal">Semanal</option>
          <option value="quinzenal">Quinzenal</option>
          <option value="mensal">Mensal</option>
        </select>
      </div>

      <input name="data_inicio" type="date" required className="input text-sm" />

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
