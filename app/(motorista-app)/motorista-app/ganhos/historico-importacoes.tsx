'use client'

import { useState, useEffect, useTransition } from 'react'
import { History, X, Trash2, Loader2, FileText } from 'lucide-react'
import { fmt } from './ganhos-shared'
import { buscarHistoricoImportacoes, desfazerImportacao } from './actions-importacao'
import { useRouter } from 'next/navigation'

/* ── Tipos ───────────────────────────────────────────────────────── */
interface ImportacaoItem {
  id: string
  plataforma: string
  arquivo_nome: string
  total_registros: number
  registros_importados: number
  registros_ignorados: number
  valor_total_importado: number
  created_at: string
}

/* ── Helpers ─────────────────────────────────────────────────────── */
const BADGE: Record<string, string> = {
  uber:  'bg-black text-white',
  '99':  'bg-yellow-400 text-yellow-900',
  ifood: 'bg-red-500 text-white',
}

const LABEL: Record<string, string> = {
  uber:  'Uber',
  '99':  '99',
  ifood: 'iFood',
}

function fmtDataHora(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/* ── Modal ───────────────────────────────────────────────────────── */
function HistoricoModal({
  onClose,
}: {
  onClose: () => void
}) {
  const router = useRouter()
  const [items, setItems] = useState<ImportacaoItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [desfazendoId, setDesfazendoId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Carrega ao montar
  useEffect(() => {
    buscarHistoricoImportacoes().then(data => {
      setItems(data as ImportacaoItem[])
      setLoading(false)
    })
  }, [])

  function handleDesfazer(id: string) {
    if (confirmId !== id) {
      setConfirmId(id)
      return
    }
    setDesfazendoId(id)
    setConfirmId(null)
    startTransition(async () => {
      try {
        await desfazerImportacao(id)
        setItems(prev => prev?.filter(i => i.id !== id) ?? null)
        router.refresh()
      } finally {
        setDesfazendoId(null)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gray-500" />
            <h2 className="text-base font-bold text-gray-900">Histórico de importações</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : !items || items.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center gap-2">
              <FileText className="w-10 h-10 text-gray-300" />
              <p className="text-sm text-gray-500">Nenhuma importação ainda.</p>
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {items.map((item, idx) => {
                const isFirst = idx === 0
                const isDesfazendo = desfazendoId === item.id
                const isConfirm = confirmId === item.id

                return (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100"
                  >
                    {/* Topo: badge + data */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE[item.plataforma] ?? 'bg-gray-400 text-white'}`}>
                        {LABEL[item.plataforma] ?? item.plataforma}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {fmtDataHora(item.created_at)}
                      </span>
                    </div>

                    {/* Arquivo */}
                    <p className="text-xs text-gray-500 truncate mb-2" title={item.arquivo_nome}>
                      {item.arquivo_nome}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-semibold text-emerald-700">
                        {fmt(item.valor_total_importado)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {item.registros_importados} registro{item.registros_importados !== 1 ? 's' : ''}
                      </span>
                      {item.registros_ignorados > 0 && (
                        <span className="text-xs text-gray-400">
                          · {item.registros_ignorados} ignorado{item.registros_ignorados !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Botão desfazer — só para a mais recente */}
                    {isFirst && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        {isConfirm ? (
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-red-600 font-medium flex-1">
                              Isso apagará {item.registros_importados} registro{item.registros_importados !== 1 ? 's' : ''}. Confirma?
                            </p>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-xs px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 font-medium"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleDesfazer(item.id)}
                              disabled={isDesfazendo}
                              className="text-xs px-3 py-1.5 rounded-xl bg-red-500 text-white font-medium flex items-center gap-1 min-h-[36px]"
                            >
                              {isDesfazendo ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Confirmar'
                              )}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDesfazer(item.id)}
                            disabled={isDesfazendo || isPending}
                            className="flex items-center gap-1.5 text-xs text-red-500 font-medium py-1 min-h-[44px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Desfazer esta importação
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Botão exposto ───────────────────────────────────────────────── */
export function BtnHistoricoImportacoes() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Histórico de importações"
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 px-3 py-2 rounded-xl bg-gray-100 active:bg-gray-200 min-h-[44px]"
      >
        <History className="w-4 h-4" />
        <span className="hidden sm:inline">Histórico</span>
      </button>

      {open && <HistoricoModal onClose={() => setOpen(false)} />}
    </>
  )
}
