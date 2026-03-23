'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Loader2, X } from 'lucide-react'
import { deletarPagamento, editarPagamento } from './actions'
import { formatCurrency } from '@/lib/utils'
import { ComprovanteUpload } from './comprovante-upload'

interface Pagamento {
  id: string
  valor: number
  data_vencimento: string
  referencia: string | null
  status: string
  comprovante_url?: string | null
  comprovante_path?: string | null
}

export function AcoesReceita({ pagamento }: { pagamento: Pagamento }) {
  const [editOpen, setEditOpen] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Excluir este lançamento?')) return
    startTransition(async () => {
      await deletarPagamento(pagamento.id)
      window.location.href = '/gestor/receitas?t=' + Date.now()
    })
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await editarPagamento(pagamento.id, formData)
      if (result?.error) {
        setErro(result.error)
      } else {
        setEditOpen(false)
        window.location.href = '/gestor/receitas?t=' + Date.now()
      }
    })
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <p className="text-sm font-semibold text-gray-900">{formatCurrency(pagamento.valor)}</p>
        <ComprovanteUpload
          pagamentoId={pagamento.id}
          comprovanteUrl={pagamento.comprovante_url ?? null}
          comprovantePath={pagamento.comprovante_path ?? null}
        />
        <button
          onClick={() => { setErro(null); setEditOpen(true) }}
          className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          title="Editar"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-5 sm:p-6 sm:m-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Editar lançamento</h2>
              <button type="button" onClick={() => setEditOpen(false)} className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor *</label>
                  <input name="valor" type="number" step="0.01" min="0" required className="input" defaultValue={pagamento.valor} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Vencimento *</label>
                  <input name="data_vencimento" type="date" required className="input" defaultValue={pagamento.data_vencimento} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Referência</label>
                <input name="referencia" type="text" className="input" defaultValue={pagamento.referencia ?? ''} placeholder='Ex: "Aluguel Março/2026"' />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                <select name="status" className="input" defaultValue={pagamento.status}>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="atrasado">Atrasado</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2 pb-2">
                <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary flex-1 min-h-[44px]">Cancelar</button>
                <button type="submit" disabled={isPending} className="btn-primary flex-1 min-h-[44px]">
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
