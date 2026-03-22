'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { criarMotorista } from '../actions'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Cadastrando...</> : <><UserPlus className="w-4 h-4" />Cadastrar motorista</>}
    </button>
  )
}

export default function NovoMotoristaPage() {
  const [state, action] = useFormState(criarMotorista, null)

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/gestor/motoristas" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Novo Motorista</h1>
          <p className="text-gray-500 text-sm mt-0.5">Preencha os dados para criar a conta</p>
        </div>
      </div>

      <form action={action} className="card p-6 space-y-5">
        {state?.error && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600">
            {state.error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Nome completo *
            </label>
            <input name="nome" type="text" required placeholder="João da Silva" className="input" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              E-mail *
            </label>
            <input name="email" type="email" required placeholder="joao@email.com" className="input" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Senha inicial *
            </label>
            <input name="senha" type="text" required placeholder="Mínimo 6 caracteres" className="input" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Telefone
            </label>
            <input name="telefone" type="tel" placeholder="(47) 99999-0000" className="input" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              CPF
            </label>
            <input name="cpf" type="text" placeholder="000.000.000-00" className="input" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              CNH
            </label>
            <input name="cnh" type="text" placeholder="Número da CNH" className="input" />
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <Link href="/gestor/motoristas" className="btn-secondary flex-1 justify-center">
            Cancelar
          </Link>
          <div className="flex-1">
            <SubmitButton />
          </div>
        </div>
      </form>
    </div>
  )
}
