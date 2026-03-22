'use client'

import { useTransition, useState } from 'react'
import { criarDespesa } from './actions'
import { Loader2, Plus, X } from 'lucide-react'

interface Veiculo { id: string; placa: string; modelo: string }
interface Motorista { id: string; nome: string }

export function NovaDespesaForm({ veiculos, motoristas }: { veiculos: Veiculo[]; motoristas: Motorista[] }) {
  const [open, setOpen] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await criarDespesa(null, formData)
      if (result?.error) {
        setErro(result.error)
      } else {
        setOpen(false)
        window.location.href = '/gestor/despesas?ok=1&t=' + Date.now()
      }
    })
  }

  return (
    <>
      <button onClick={() => { setErro(null); setOpen(true) }} className="btn-primary">
        <Plus className="w-4 h-4" />
        Nova despesa
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Nova despesa</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Categoria *</label>
                  <select name="categoria" required className="input">
                    <option value="">Selecione</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="emplacamento">Emplacamento</option>
                    <option value="ipva">IPVA</option>
                    <option value="seguro">Seguro</option>
                    <option value="multa">Multa</option>
                    <option value="combustivel">Combustível</option>
                    <option value="administrativa">Administrativa</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data *</label>
                  <input name="data" type="date" required className="input"
                    defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium pointer-events-none">R$</span>
                  <input name="valor" type="number" step="0.01" min="0" required placeholder="0,00" className="input pl-9" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição</label>
                <input name="descricao" type="text" placeholder="Detalhe da despesa" className="input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Veículo</label>
                  <select name="veiculo_id" className="input">
                    <option value="">Nenhum</option>
                    {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Motorista</label>
                  <select name="motorista_id" className="input">
                    <option value="">Nenhum</option>
                    {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={isPending} className="btn-primary flex-1">
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Registrar despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
