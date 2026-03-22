'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { atualizarPerfil } from './actions'
import { Loader2, CheckCircle2 } from 'lucide-react'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary min-h-[44px] px-6">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Salvar perfil'}
    </button>
  )
}

function maskTelefone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.replace(/^(\d{0,2})/, '($1')
  if (digits.length <= 7) return digits.replace(/^(\d{2})(\d{0,5})/, '($1) $2')
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

interface Props {
  nome: string
  telefone: string | null
}

export function PerfilForm({ nome, telefone }: Props) {
  const [state, action] = useFormState(atualizarPerfil, null)

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
      )}
      {state?.success && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {state.success}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Nome completo *
          </label>
          <input name="nome" type="text" required defaultValue={nome} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Telefone
          </label>
          <input
            name="telefone"
            type="tel"
            defaultValue={telefone ?? ''}
            placeholder="(47) 99999-0000"
            className="input"
            onChange={e => { e.target.value = maskTelefone(e.target.value) }}
          />
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Submit />
      </div>
    </form>
  )
}
