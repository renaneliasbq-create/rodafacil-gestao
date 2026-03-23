'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { CalendarDays, Printer } from 'lucide-react'

export function FiltroDre() {
  const router = useRouter()
  const params = useSearchParams()
  const p = params.get('p') ?? 'ano'
  const [ini, setIni] = useState(params.get('ini') ?? '')
  const [fim, setFim] = useState(params.get('fim') ?? '')

  function navTo(search: string) {
    router.push('/gestor/relatorios/dre?' + search)
  }

  function handleCustom() {
    if (ini && fim) navTo(`p=custom&ini=${ini}&fim=${fim}`)
  }

  const btnClass = (val: string) =>
    `px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
      p === val
        ? 'bg-blue-600 text-white'
        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
    }`

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <CalendarDays className="w-3.5 h-3.5" />
          Período:
        </div>
        <button className={btnClass('ano')}  onClick={() => navTo('p=ano')}>Ano atual</button>
        <button className={btnClass('s1')}   onClick={() => navTo('p=s1')}>1º Semestre</button>
        <button className={btnClass('s2')}   onClick={() => navTo('p=s2')}>2º Semestre</button>
        <button className={btnClass('mes')}  onClick={() => navTo('p=mes')}>Mês atual</button>
        <button className={btnClass('custom')} onClick={() => navTo('p=custom')}>Personalizado</button>

        {p === 'custom' && (
          <div className="flex items-center gap-2 mt-1 w-full sm:w-auto sm:mt-0">
            <input type="date" value={ini} onChange={e => setIni(e.target.value)} className="input text-xs py-1.5 h-8" />
            <span className="text-xs text-gray-400">até</span>
            <input type="date" value={fim} onChange={e => setFim(e.target.value)} className="input text-xs py-1.5 h-8" />
            <button onClick={handleCustom} disabled={!ini || !fim} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white disabled:opacity-40">
              Filtrar
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        <Printer className="w-4 h-4" />
        Imprimir / Salvar PDF
      </button>
    </div>
  )
}
