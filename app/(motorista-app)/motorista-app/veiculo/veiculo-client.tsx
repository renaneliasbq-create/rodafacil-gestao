'use client'

import { useState, useRef, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { salvarVeiculo, type VeiculoState } from './actions'
import { Pencil, Plus, X, Loader2 } from 'lucide-react'

const COMBUSTIVEIS = ['Flex', 'Gasolina', 'Etanol', 'GNV', 'Elétrico', 'Híbrido']

const MARCAS_COMUNS = [
  'Chevrolet', 'Fiat', 'Ford', 'Honda', 'Hyundai',
  'Jeep', 'Nissan', 'Renault', 'Toyota', 'Volkswagen', 'Outra',
]

interface Veiculo {
  marca: string
  modelo: string
  placa: string
  ano: number
  cor: string | null
  tipo_combustivel: string
  valor_compra: number | null
}

function BtnSubmit({ novo }: { novo: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[44px]"
    >
      {pending
        ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
        : novo ? 'Cadastrar veículo' : 'Salvar alterações'
      }
    </button>
  )
}

function FormVeiculo({ veiculo, onClose }: { veiculo?: Veiculo; onClose: () => void }) {
  const [state, formAction] = useFormState<VeiculoState, FormData>(salvarVeiculo, null)
  const [marca, setMarca]   = useState(veiculo?.marca ?? '')
  const [marcaCustom, setMarcaCustom] = useState(!MARCAS_COMUNS.includes(veiculo?.marca ?? '') && !!veiculo?.marca)
  const formRef = useRef<HTMLFormElement>(null)
  const prevState = useRef(state)

  useEffect(() => {
    if (prevState.current !== null && state === null) onClose()
    prevState.current = state
  }, [state, onClose])

  const anoAtual = new Date().getFullYear()

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900">
            {veiculo ? 'Editar veículo' : 'Cadastrar veículo'}
          </h2>
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

          {/* Marca */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Marca</label>
            {!marcaCustom ? (
              <div className="flex flex-wrap gap-2">
                {MARCAS_COMUNS.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      if (m === 'Outra') { setMarcaCustom(true); setMarca('') }
                      else setMarca(m)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      marca === m && m !== 'Outra'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={marca}
                  onChange={e => setMarca(e.target.value)}
                  placeholder="Digite a marca"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button type="button" onClick={() => { setMarcaCustom(false); setMarca('') }}
                  className="px-3 py-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-xl text-sm">
                  ↩
                </button>
              </div>
            )}
            <input type="hidden" name="marca" value={marca} />
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Modelo</label>
            <input
              name="modelo"
              type="text"
              defaultValue={veiculo?.modelo}
              placeholder="ex: Onix, HB20, Civic..."
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Ano + Placa lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ano</label>
              <input
                name="ano"
                type="number"
                defaultValue={veiculo?.ano}
                min={1990}
                max={anoAtual + 1}
                placeholder={String(anoAtual)}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Placa</label>
              <input
                name="placa"
                type="text"
                defaultValue={veiculo?.placa}
                placeholder="ABC-1234"
                maxLength={8}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Cor <span className="normal-case font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              name="cor"
              type="text"
              defaultValue={veiculo?.cor ?? ''}
              placeholder="ex: Branco, Prata, Preto..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Combustível */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Combustível</label>
            <div className="flex flex-wrap gap-2">
              {COMBUSTIVEIS.map(c => (
                <label key={c} className="cursor-pointer">
                  <input type="radio" name="tipo_combustivel" value={c}
                    defaultChecked={veiculo?.tipo_combustivel === c || (!veiculo && c === 'Flex')}
                    className="sr-only peer"
                  />
                  <span className="px-3 py-1.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-500 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 transition-all inline-block">
                    {c}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Valor de compra */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Valor de compra <span className="normal-case font-normal text-gray-400">(opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$</span>
              <input
                name="valor_compra"
                type="text"
                inputMode="decimal"
                defaultValue={veiculo?.valor_compra ? String(veiculo.valor_compra).replace('.', ',') : ''}
                placeholder="0,00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pl-9 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          <BtnSubmit novo={!veiculo} />
        </form>
      </div>
    </div>
  )
}

export function BtnCadastrarVeiculo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
      >
        <Plus className="w-4 h-4" />
        Cadastrar
      </button>
      {open && <FormVeiculo onClose={() => setOpen(false)} />}
    </>
  )
}

export function BtnEditarVeiculo({ veiculo }: { veiculo: Veiculo }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 bg-white px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
      >
        <Pencil className="w-4 h-4" />
        Editar
      </button>
      {open && <FormVeiculo veiculo={veiculo} onClose={() => setOpen(false)} />}
    </>
  )
}
