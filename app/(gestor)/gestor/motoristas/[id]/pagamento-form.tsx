'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { criarPagamentoMotorista } from '../actions'
import { useState, useEffect, useRef } from 'react'
import { Loader2, Plus, X } from 'lucide-react'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Criar recebível'}
    </button>
  )
}

// Detecta quando o form passou de pending→idle com sucesso e fecha o modal
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

interface Props {
  motoristaId: string
  contratoId: string
  veiculoId?: string
  valorPadrao: number
  periodicidade: string
}

export function NovoPagamentoForm({ motoristaId, contratoId, veiculoId, valorPadrao, periodicidade }: Props) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('pendente')
  const [bonus, setBonus] = useState(false)
  const [bonusNatal, setBonusNatal] = useState(false)
  const [state, action] = useFormState(criarPagamentoMotorista, null)

  const proximoVencimento = () => {
    const hoje = new Date()
    if (periodicidade === 'semanal') hoje.setDate(hoje.getDate() + 7)
    else if (periodicidade === 'quinzenal') hoje.setDate(hoje.getDate() + 15)
    else hoje.setMonth(hoje.getMonth() + 1)
    return hoje.toISOString().split('T')[0]
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary py-1.5 text-xs gap-1.5">
        <Plus className="w-3.5 h-3.5" /> Novo recebível
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 m-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Novo recebível</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form action={action} className="space-y-4">
              <AutoFechar state={state} onClose={() => setOpen(false)} />
              <input type="hidden" name="motorista_id" value={motoristaId} />
              <input type="hidden" name="contrato_id" value={contratoId} />
              {veiculoId && <input type="hidden" name="veiculo_id" value={veiculoId} />}
              {state?.error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Referência</label>
                <input name="referencia" type="text" className="input" placeholder='Ex: "Semana 10/03 a 17/03"' />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor *</label>
                  <input name="valor" type="number" step="0.01" required className="input" defaultValue={valorPadrao} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Vencimento *</label>
                  <input name="data_vencimento" type="date" required className="input" defaultValue={proximoVencimento()} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status *</label>
                <select name="status" required className="input" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Confirmado (pago)</option>
                </select>
              </div>
              {status === 'pago' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data do pagamento *</label>
                  <input name="data_pagamento" type="date" required className="input"
                    defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              )}
              {/* Bônus de pontualidade */}
              <div
                onClick={() => setBonus(!bonus)}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${bonus ? 'border-amber-400 bg-amber-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <input type="checkbox" name="bonus" value="true" checked={bonus} onChange={() => {}} className="mt-0.5 accent-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Semana de bônus ⛽</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Registrar automaticamente <span className="font-semibold text-amber-600">R$ 180,00</span> como despesa de combustível (bônus - pagamentos em dia)
                  </p>
                </div>
              </div>

              {/* Bônus de natal */}
              <div
                onClick={() => setBonusNatal(!bonusNatal)}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${bonusNatal ? 'border-red-300 bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <input type="checkbox" name="bonus_natal" value="true" checked={bonusNatal} onChange={() => {}} className="mt-0.5 accent-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Bônus de natal 🎄</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Registrar automaticamente <span className="font-semibold text-red-600">R$ 150,00</span> como despesa (bônus de natal - ceia)
                  </p>
                </div>
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
