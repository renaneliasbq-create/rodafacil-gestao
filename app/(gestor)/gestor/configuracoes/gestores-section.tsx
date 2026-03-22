'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { criarGestor, removerGestor } from './actions'
import { UserPlus, X, Loader2, Trash2, ShieldCheck } from 'lucide-react'

interface Gestor {
  id: string
  nome: string
  email: string
  telefone: string | null
  created_at: string
}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary flex-1 min-h-[44px]">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Criando...</> : 'Criar acesso'}
    </button>
  )
}

function AutoFechar({ state, onClose }: { state: unknown; onClose: () => void }) {
  const { pending } = useFormStatus()
  const wasSubmitting = useRef(false)
  useEffect(() => {
    if (pending) { wasSubmitting.current = true; return }
    if (wasSubmitting.current && !pending && (state as { success?: string } | null)?.success) {
      wasSubmitting.current = false
      onClose()
    }
  }, [pending, state, onClose])
  return null
}

function maskTelefone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.replace(/^(\d{0,2})/, '($1')
  if (digits.length <= 7) return digits.replace(/^(\d{2})(\d{0,5})/, '($1) $2')
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

export function GestoresSection({ gestores, currentUserId }: { gestores: Gestor[]; currentUserId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(criarGestor, null)
  const [removendo, startRemover] = useTransition()
  const [erroRemover, setErroRemover] = useState<string | null>(null)

  function handleRemover(id: string) {
    if (!confirm('Remover acesso deste gestor?')) return
    startRemover(async () => {
      const result = await removerGestor(id)
      if (result.error) setErroRemover(result.error)
    })
  }

  return (
    <>
      <div className="space-y-2">
        {erroRemover && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erroRemover}</p>
        )}

        {gestores.map(g => (
          <div key={g.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-blue-700">
                  {g.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{g.nome}</p>
                  {g.id === currentUserId && (
                    <span className="badge bg-blue-100 text-blue-700 shrink-0">Você</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{g.email}</p>
              </div>
            </div>
            {g.id !== currentUserId && (
              <button
                onClick={() => handleRemover(g.id)}
                disabled={removendo}
                className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="Remover acesso"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors min-h-[44px]"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar gestor
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-6 sm:m-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Novo gestor</h2>
                <p className="text-xs text-gray-400 mt-0.5">Acesso completo ao painel</p>
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form action={action} className="space-y-4">
              <AutoFechar state={state} onClose={() => setOpen(false)} />
              {state?.error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nome completo *</label>
                <input name="nome" type="text" required className="input" placeholder="João da Silva" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">E-mail *</label>
                  <input name="email" type="email" required className="input" placeholder="joao@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Telefone</label>
                  <input name="telefone" type="tel" className="input" placeholder="(47) 99999-0000"
                    onChange={e => { e.target.value = maskTelefone(e.target.value) }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Senha inicial *</label>
                <input name="senha" type="text" required className="input" placeholder="Mínimo 6 caracteres" />
              </div>

              <div className="flex gap-3 pt-2 pb-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 min-h-[44px]">Cancelar</button>
                <Submit />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
