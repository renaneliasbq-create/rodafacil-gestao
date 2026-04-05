'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface DadosInsights {
  lucroReal: number
  varLucro: number | null
  margem: number
  melhorDia: string | null
  piorDia: string | null
  melhorPlataforma: string | null
  piorPlataforma: string | null
  totalDesp: number
  propDesp: number
  diasTrabalhados: number
  metaAtingida: string | null
}

interface Insight {
  tipo: 'positivo' | 'alerta' | 'sugestao'
  texto: string
}

const ICONE: Record<string, string> = {
  positivo: '📈',
  alerta:   '⚠️',
  sugestao: '💡',
}

const COR: Record<string, string> = {
  positivo: 'bg-emerald-50 border-emerald-100',
  alerta:   'bg-amber-50 border-amber-100',
  sugestao: 'bg-blue-50 border-blue-100',
}

const COR_TEXTO: Record<string, string> = {
  positivo: 'text-emerald-800',
  alerta:   'text-amber-800',
  sugestao: 'text-blue-800',
}

export function InsightsBloco({ dados }: { dados: DadosInsights }) {
  const [insights, setInsights] = useState<Insight[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(false)

  async function buscar() {
    setLoading(true)
    setErro(false)
    try {
      const res = await fetch('/api/motorista/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      })
      const json = await res.json()
      if (json.insights) setInsights(json.insights)
      else setErro(true)
    } catch {
      setErro(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          💡 O que os dados dizem sobre você
        </p>
        {insights && (
          <button
            onClick={buscar}
            disabled={loading}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 disabled:opacity-40"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        )}
      </div>

      {!insights && !loading && !erro && (
        <button
          onClick={buscar}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl py-5 text-sm font-semibold text-blue-700 hover:from-blue-100 hover:to-indigo-100 transition-colors"
        >
          <span className="text-base">✨</span>
          Gerar insights com IA
        </button>
      )}

      {loading && (
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-6 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Analisando seus dados...
          </div>
        </div>
      )}

      {erro && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-4 text-center">
          <p className="text-xs text-red-600 mb-2">Não foi possível gerar os insights agora.</p>
          <button onClick={buscar} className="text-xs font-semibold text-red-700 underline">Tentar novamente</button>
        </div>
      )}

      {insights && (
        <div className="space-y-2.5">
          {insights.map((ins, i) => (
            <div key={i} className={`border rounded-2xl px-4 py-3 ${COR[ins.tipo] ?? 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-start gap-2">
                <span className="text-base flex-shrink-0 mt-0.5">{ICONE[ins.tipo] ?? '💡'}</span>
                <p className={`text-sm leading-snug ${COR_TEXTO[ins.tipo] ?? 'text-gray-800'}`}>{ins.texto}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
