'use client'

import { useTransition, useState, useMemo } from 'react'
import { criarDespesa } from './actions'
import { Loader2, Plus, X } from 'lucide-react'

interface Veiculo { id: string; placa: string; modelo: string }
interface Motorista { id: string; nome: string }

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function NovaDespesaForm({ veiculos, motoristas }: { veiculos: Veiculo[]; motoristas: Motorista[] }) {
  const [open, setOpen] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [categoria, setCategoria] = useState('')
  const [parcelar, setParcelar] = useState(false)
  const [valorStr, setValorStr] = useState('')
  const [nParcelas, setNParcelas] = useState(4)

  const hoje = new Date()
  const proximaSemana = new Date(hoje)
  proximaSemana.setDate(hoje.getDate() + 7)
  const defaultPrimeiraParcela = proximaSemana.toISOString().split('T')[0]

  const valorNum = parseFloat(valorStr) || 0
  const valorParcela = useMemo(() => {
    if (nParcelas < 1 || valorNum <= 0) return 0
    return Math.round((valorNum / nParcelas) * 100) / 100
  }, [valorNum, nParcelas])

  function handleClose() {
    setOpen(false)
    setCategoria('')
    setParcelar(false)
    setValorStr('')
    setNParcelas(4)
    setErro(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await criarDespesa(null, formData)
      if (result?.error) {
        setErro(result.error)
      } else {
        handleClose()
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-6 sm:m-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Nova despesa</h2>
              <button type="button" onClick={handleClose} className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Categoria *</label>
                  <select
                    name="categoria"
                    required
                    className="input"
                    value={categoria}
                    onChange={e => { setCategoria(e.target.value); setParcelar(false) }}
                  >
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
                  <input
                    name="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0,00"
                    className="input pl-9"
                    value={valorStr}
                    onChange={e => setValorStr(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição</label>
                <input name="descricao" type="text" placeholder="Detalhe da despesa" className="input" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* ── Parcelamento (só para multa) ── */}
              {categoria === 'multa' && (
                <div className="border border-orange-200 bg-orange-50 rounded-xl p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={() => setParcelar(!parcelar)}
                      className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${parcelar ? 'bg-orange-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${parcelar ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-sm font-semibold text-gray-800">Parcelar com o motorista</span>
                  </label>

                  {parcelar && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nº de semanas</label>
                          <input
                            type="number"
                            min="2"
                            max="52"
                            className="input"
                            value={nParcelas}
                            onChange={e => setNParcelas(Math.max(2, parseInt(e.target.value) || 2))}
                          />
                          <input type="hidden" name="n_parcelas" value={nParcelas} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">1ª parcela</label>
                          <input
                            name="primeira_parcela"
                            type="date"
                            className="input"
                            defaultValue={defaultPrimeiraParcela}
                          />
                        </div>
                      </div>
                      {valorParcela > 0 && (
                        <p className="text-xs font-semibold text-orange-700 bg-orange-100 rounded-lg px-3 py-2">
                          {nParcelas}x de {fmt(valorParcela)} por semana
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <input type="hidden" name="parcelar" value={parcelar ? 'true' : 'false'} />

              <div className="flex gap-3 pt-2 pb-2">
                <button type="button" onClick={handleClose} className="btn-secondary flex-1 min-h-[44px]">Cancelar</button>
                <button type="submit" disabled={isPending} className="btn-primary flex-1 min-h-[44px]">
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
