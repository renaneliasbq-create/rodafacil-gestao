'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { criarVencimento } from './actions'

interface Veiculo  { id: string; placa: string; modelo: string }
interface Motorista { id: string; nome: string }

interface Props {
  veiculos:   Veiculo[]
  motoristas: Motorista[]
}

const TIPOS_VEICULO = [
  { value: 'crlv',    label: 'CRLV' },
  { value: 'seguro',  label: 'Seguro' },
  { value: 'ipva',    label: 'IPVA' },
  { value: 'revisao', label: 'Revisão' },
  { value: 'licenca', label: 'Licença' },
  { value: 'outro',   label: 'Outro' },
]

const TIPOS_MOTORISTA = [
  { value: 'cnh',   label: 'CNH' },
  { value: 'outro', label: 'Outro' },
]

export function NovoVencimentoForm({ veiculos, motoristas }: Props) {
  const [open, setOpen]       = useState(false)
  const [refTipo, setRefTipo] = useState<'veiculo' | 'motorista'>('veiculo')
  const [erro, setErro]       = useState<string | null>(null)
  const [isPending, start]    = useTransition()

  const tipos = refTipo === 'veiculo' ? TIPOS_VEICULO : TIPOS_MOTORISTA

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const fd = new FormData(e.currentTarget)
    fd.set('ref_tipo', refTipo)
    start(async () => {
      const result = await criarVencimento(fd)
      if (result?.error) {
        setErro(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => { setErro(null); setOpen(true) }}
        className="btn-primary flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Novo alerta</span>
        <span className="sm:hidden">Novo</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-6 sm:m-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Novo alerta de vencimento</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>
              )}

              {/* Tipo de referência */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Pertence a *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['veiculo', 'motorista'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setRefTipo(t)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        refTipo === t
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {t === 'veiculo' ? 'Veículo' : 'Motorista'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seleção do veículo ou motorista */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {refTipo === 'veiculo' ? 'Veículo *' : 'Motorista *'}
                </label>
                <select name="ref_id" required className="input">
                  <option value="">Selecione</option>
                  {refTipo === 'veiculo'
                    ? veiculos.map(v => (
                        <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>
                      ))
                    : motoristas.map(m => (
                        <option key={m.id} value={m.id}>{m.nome}</option>
                      ))
                  }
                </select>
              </div>

              {/* Tipo do documento */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Documento *
                </label>
                <select name="tipo" required className="input">
                  <option value="">Selecione</option>
                  {tipos.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Data de vencimento */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Data de vencimento *
                </label>
                <input name="data_vencimento" type="date" required className="input" />
              </div>

              {/* Descrição opcional */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Observação (opcional)
                </label>
                <input
                  name="descricao"
                  type="text"
                  className="input"
                  placeholder="Ex: Seguro Porto Seguro, apólice 12345"
                />
              </div>

              <div className="flex gap-3 pt-2 pb-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary flex-1 min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary flex-1 min-h-[44px]"
                >
                  {isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
                    : 'Salvar alerta'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
