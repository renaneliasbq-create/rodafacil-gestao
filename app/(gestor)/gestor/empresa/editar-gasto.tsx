'use client'

import { useState, useTransition } from 'react'
import { Pencil, Loader2, X } from 'lucide-react'
import { editarGastoCnpj } from './actions'

interface Gasto {
  id: string
  valor: number
  data: string
  categoria: string
  descricao: string
}

const CATEGORIAS = [
  { value: 'contador',            label: 'Contador / Contabilidade' },
  { value: 'alvara',              label: 'Alvará / Licença' },
  { value: 'certificado_digital', label: 'Certificado digital' },
  { value: 'software',            label: 'Software / Sistema' },
  { value: 'telefone_internet',   label: 'Telefone / Internet' },
  { value: 'aluguel',             label: 'Aluguel de espaço' },
  { value: 'imposto',             label: 'Imposto / Taxa' },
  { value: 'bancario',            label: 'Tarifa bancária' },
  { value: 'outro',               label: 'Outro' },
]

export function EditarGasto({ gasto }: { gasto: Gasto }) {
  const [open, setOpen] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await editarGastoCnpj(gasto.id, formData)
      if (result?.error) {
        setErro(result.error)
      } else {
        setOpen(false)
        window.location.href = '/gestor/empresa?t=' + Date.now()
      }
    })
  }

  return (
    <>
      <button
        onClick={() => { setErro(null); setOpen(true) }}
        className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
        title="Editar"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 m-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Editar gasto do CNPJ</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Categoria *</label>
                <select name="categoria" required className="input" defaultValue={gasto.categoria}>
                  <option value="">Selecione</option>
                  {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição</label>
                <input name="descricao" type="text" className="input" defaultValue={gasto.descricao} placeholder='Ex: "Mensalidade março"' />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor *</label>
                  <input name="valor" type="number" step="0.01" required className="input" defaultValue={gasto.valor} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data *</label>
                  <input name="data" type="date" required className="input" defaultValue={gasto.data} />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={isPending} className="btn-primary flex-1">
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
