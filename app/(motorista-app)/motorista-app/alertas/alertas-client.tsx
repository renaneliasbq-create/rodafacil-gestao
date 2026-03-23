'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { criarAlerta, deletarAlerta, type AlertaState } from './actions'
import { Plus, X, Loader2, Trash2, CreditCard, FileText, Shield, Wrench, FileCheck, Bell } from 'lucide-react'

export const TIPOS_ALERTA = [
  { nome: 'CNH',           icon: CreditCard, bg: 'bg-blue-100',   text: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700' },
  { nome: 'CRLV',          icon: FileText,   bg: 'bg-purple-100', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  { nome: 'Seguro',        icon: Shield,     bg: 'bg-emerald-100',text: 'text-emerald-600',badge: 'bg-emerald-100 text-emerald-700' },
  { nome: 'Revisão',       icon: Wrench,     bg: 'bg-orange-100', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  { nome: 'IPVA',          icon: FileCheck,  bg: 'bg-yellow-100', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  { nome: 'Outro',         icon: Bell,       bg: 'bg-gray-100',   text: 'text-gray-500',   badge: 'bg-gray-100 text-gray-600' },
]

export function getTipo(nome: string) {
  return TIPOS_ALERTA.find(t => t.nome === nome) ?? TIPOS_ALERTA[TIPOS_ALERTA.length - 1]
}

function BtnSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[44px]"
    >
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Salvar alerta'}
    </button>
  )
}

function ModalAlerta({ onClose }: { onClose: () => void }) {
  const [state, formAction] = useFormState<AlertaState, FormData>(criarAlerta, null)
  const [tipo, setTipo]     = useState('CNH')
  const formRef             = useRef<HTMLFormElement>(null)
  const prevState           = useRef(state)

  useEffect(() => {
    if (prevState.current !== null && state === null) onClose()
    prevState.current = state
  }, [state, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900">Novo alerta</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form ref={formRef} action={formAction} className="px-5 py-4 space-y-4">
          {state?.error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {state.error}
            </div>
          )}

          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_ALERTA.map(t => {
                const Icon = t.icon
                const ativo = tipo === t.nome
                return (
                  <button
                    key={t.nome}
                    type="button"
                    onClick={() => setTipo(t.nome)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                      ativo ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ativo ? 'bg-yellow-100' : t.bg}`}>
                      <Icon className={`w-4 h-4 ${ativo ? 'text-yellow-600' : t.text}`} />
                    </div>
                    <span className={`text-xs font-semibold ${ativo ? 'text-yellow-700' : 'text-gray-500'}`}>{t.nome}</span>
                  </button>
                )
              })}
            </div>
            <input type="hidden" name="tipo" value={tipo} />
          </div>

          {/* Data de vencimento */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Data de vencimento
            </label>
            <input
              name="data_vencimento"
              type="date"
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Observação <span className="normal-case font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              name="descricao"
              type="text"
              placeholder={
                tipo === 'CNH'     ? 'ex: CNH categoria B' :
                tipo === 'CRLV'    ? 'ex: Honda Civic ABC-1234' :
                tipo === 'Revisão' ? 'ex: Revisão dos 50.000 km' :
                'Descrição...'
              }
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <BtnSubmit />
        </form>
      </div>
    </div>
  )
}

export function BtnDeletarAlerta({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  function handleDelete() {
    if (!confirm('Excluir este alerta?')) return
    startTransition(() => deletarAlerta(id))
  }
  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}

export function BtnNovoAlerta() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
      >
        <Plus className="w-4 h-4" />
        Novo alerta
      </button>
      {open && <ModalAlerta onClose={() => setOpen(false)} />}
    </>
  )
}
