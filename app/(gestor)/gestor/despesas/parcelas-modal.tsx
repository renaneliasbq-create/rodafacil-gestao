'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, RotateCcw, Loader2, ListChecks } from 'lucide-react'
import { marcarParcelaPaga, desmarcarParcelaPaga } from './actions'
import { formatCurrency } from '@/lib/utils'

export interface Parcela {
  id: string
  despesa_id: string
  numero: number
  valor: number
  data_vencimento: string
  pago_em: string | null
}

interface Props {
  despesaId: string
  descricao: string | null
  valor: number
  data: string
  motoristaNome: string | null
  parcelas: Parcela[]
}

function fmtData(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function ParcelasButton({ despesaId, descricao, valor, data, motoristaNome, parcelas }: Props) {
  const [open, setOpen] = useState(false)
  const pagas = parcelas.filter(p => p.pago_em).length
  const total = parcelas.length

  const badgeColor =
    pagas === total ? 'bg-emerald-100 text-emerald-700' :
    pagas > 0       ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-colors hover:opacity-80 ${badgeColor}`}
        title="Ver parcelas"
      >
        <ListChecks className="w-3 h-3" />
        {pagas}/{total}
      </button>

      {open && (
        <ParcelasModal
          despesaId={despesaId}
          descricao={descricao}
          valor={valor}
          data={data}
          motoristaNome={motoristaNome}
          parcelas={parcelas}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function ParcelasModal({ descricao, valor, data, motoristaNome, parcelas, onClose }: Props & { onClose: () => void }) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [localParcelas, setLocalParcelas] = useState<Parcela[]>(parcelas)

  const pagas = localParcelas.filter(p => p.pago_em).length
  const total = localParcelas.length
  const pct = total > 0 ? (pagas / total) * 100 : 0

  function handleMarcar(parcela: Parcela) {
    setPendingId(parcela.id)
    startTransition(async () => {
      if (parcela.pago_em) {
        await desmarcarParcelaPaga(parcela.id)
        setLocalParcelas(prev => prev.map(p => p.id === parcela.id ? { ...p, pago_em: null } : p))
      } else {
        await marcarParcelaPaga(parcela.id)
        const hoje = new Date().toISOString().split('T')[0]
        setLocalParcelas(prev => prev.map(p => p.id === parcela.id ? { ...p, pago_em: hoje } : p))
      }
      setPendingId(null)
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md sm:m-4 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Parcelas da multa</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {descricao || 'Multa'} — <span className="font-semibold text-gray-800">{formatCurrency(valor)}</span>
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              {motoristaNome && <span>Motorista: <span className="font-medium text-gray-600">{motoristaNome}</span></span>}
              <span>{fmtData(data)}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progresso */}
        <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-700">{pagas} de {total} parcelas pagas</span>
            <span className="text-xs font-bold text-gray-500">{pct.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-orange-400' : 'bg-red-400'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Lista de parcelas */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
          {localParcelas.map(parcela => {
            const isPago = !!parcela.pago_em
            const isLoading = pendingId === parcela.id
            const vencida = !isPago && parcela.data_vencimento < new Date().toISOString().split('T')[0]

            return (
              <div
                key={parcela.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                  isPago ? 'bg-emerald-50 border-emerald-100' :
                  vencida ? 'bg-red-50 border-red-100' :
                  'bg-gray-50 border-gray-100'
                }`}
              >
                {/* Status icon */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isPago ? 'bg-emerald-500' : vencida ? 'bg-red-400' : 'bg-gray-200'
                }`}>
                  {isPago && <Check className="w-3.5 h-3.5 text-white" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    Parcela {parcela.numero}/{total}
                  </p>
                  <p className={`text-xs ${vencida && !isPago ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    Vence {fmtData(parcela.data_vencimento)}
                    {isPago && parcela.pago_em && ` · Pago em ${fmtData(parcela.pago_em)}`}
                    {vencida && !isPago && ' · Vencida'}
                  </p>
                </div>

                {/* Valor */}
                <p className={`text-sm font-bold flex-shrink-0 ${isPago ? 'text-emerald-600' : 'text-gray-700'}`}>
                  {formatCurrency(parcela.valor)}
                </p>

                {/* Botão */}
                <button
                  onClick={() => handleMarcar(parcela)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-w-[90px] justify-center min-h-[36px] ${
                    isPago
                      ? 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isPago ? (
                    <><RotateCcw className="w-3 h-3" /> Desfazer</>
                  ) : (
                    <><Check className="w-3 h-3" /> Marcar pago</>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="w-full btn-secondary min-h-[44px]">Fechar</button>
        </div>
      </div>
    </div>
  )
}
