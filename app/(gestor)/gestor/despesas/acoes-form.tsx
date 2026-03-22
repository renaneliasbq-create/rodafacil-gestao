'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Loader2, X } from 'lucide-react'
import { deletarDespesa, editarDespesa } from './actions'
import { formatCurrency } from '@/lib/utils'

interface Veiculo { id: string; placa: string; modelo: string }
interface Motorista { id: string; nome: string }

interface Despesa {
  id: string
  categoria: string
  valor: number
  data: string
  descricao: string | null
  veiculo_id: string | null
  motorista_id: string | null
}

const CATEGORIAS = [
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'emplacamento', label: 'Emplacamento' },
  { value: 'ipva', label: 'IPVA' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'multa', label: 'Multa' },
  { value: 'combustivel', label: 'Combustível' },
  { value: 'administrativa', label: 'Administrativa' },
  { value: 'outro', label: 'Outro' },
]

export function AcoesDespesa({ despesa, veiculos, motoristas }: {
  despesa: Despesa
  veiculos: Veiculo[]
  motoristas: Motorista[]
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Excluir esta despesa?')) return
    startTransition(async () => {
      await deletarDespesa(despesa.id)
      window.location.href = '/gestor/despesas?t=' + Date.now()
    })
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await editarDespesa(despesa.id, formData)
      if (result?.error) {
        setErro(result.error)
      } else {
        setEditOpen(false)
        window.location.href = '/gestor/despesas?t=' + Date.now()
      }
    })
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <p className="text-sm font-semibold text-gray-900">{formatCurrency(despesa.valor)}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Editar despesa</h2>
              <button type="button" onClick={() => setEditOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Categoria *</label>
                  <select name="categoria" required className="input" defaultValue={despesa.categoria}>
                    <option value="">Selecione</option>
                    {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data *</label>
                  <input name="data" type="date" required className="input" defaultValue={despesa.data} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium pointer-events-none">R$</span>
                  <input name="valor" type="number" step="0.01" min="0" required className="input pl-9" defaultValue={despesa.valor} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição</label>
                <input name="descricao" type="text" className="input" defaultValue={despesa.descricao ?? ''} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Veículo</label>
                  <select name="veiculo_id" className="input" defaultValue={despesa.veiculo_id ?? ''}>
                    <option value="">Nenhum</option>
                    {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Motorista</label>
                  <select name="motorista_id" className="input" defaultValue={despesa.motorista_id ?? ''}>
                    <option value="">Nenhum</option>
                    {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={isPending} className="btn-primary flex-1">
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
