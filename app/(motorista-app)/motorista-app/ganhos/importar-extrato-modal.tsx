'use client'

import { useState, useRef } from 'react'
import { X, ChevronLeft, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { fmt } from './ganhos-shared'

/* ── Tipos ──────────────────────────────────────────────────────── */
export type PlataformaImport = 'uber' | '99' | 'ifood'

export interface RegistroImportado {
  data: string            // YYYY-MM-DD
  plataforma: PlataformaImport
  tipo: string            // 'corrida' | 'gorjeta' | 'bonus' | 'entrega' | etc.
  valor_bruto: number
  valor_liquido: number
  horas_trabalhadas: number | null
  duplicado: boolean      // true = já existe no banco
  _linhaOriginal?: number
}

/* ── Dados de plataforma ────────────────────────────────────────── */
const PLATAFORMAS = [
  {
    id: 'uber' as const,
    nome: 'Uber',
    cor: 'bg-black text-white',
    corBorder: 'border-black',
    corSel: 'ring-black',
    emoji: '⚫',
    instrucoes: [
      'Abra o app do Uber Driver',
      'Toque em Ganhos no menu inferior',
      'Toque em Histórico de ganhos',
      'Selecione o período desejado',
      'Toque em Exportar → CSV',
      'Salve o arquivo e importe aqui',
    ],
  },
  {
    id: '99' as const,
    nome: '99',
    cor: 'bg-yellow-400 text-yellow-900',
    corBorder: 'border-yellow-400',
    corSel: 'ring-yellow-400',
    emoji: '🟡',
    instrucoes: [
      'Abra o app 99Motorista',
      'Vá em Financeiro → Extrato',
      'Selecione o período',
      'Toque em Exportar relatório',
      'Salve o arquivo e importe aqui',
    ],
  },
  {
    id: 'ifood' as const,
    nome: 'iFood',
    cor: 'bg-red-500 text-white',
    corBorder: 'border-red-500',
    corSel: 'ring-red-500',
    emoji: '🔴',
    instrucoes: [
      'Acesse o Portal do Entregador iFood',
      'Vá em Financeiro → Relatórios',
      'Selecione o período desejado',
      'Faça o download em CSV',
      'Importe o arquivo aqui',
    ],
  },
]

/* ── Badge de plataforma ────────────────────────────────────────── */
const PLAT_BADGE: Record<string, string> = {
  uber:    'bg-black text-white',
  '99':    'bg-yellow-400 text-yellow-900',
  ifood:   'bg-red-500 text-white',
}
const PLAT_LABEL: Record<string, string> = {
  uber: 'Uber', '99': '99', ifood: 'iFood',
}

/* ── Card de registro no preview ────────────────────────────────── */
function RegistroCard({
  registro: r,
  isDuplicado = false,
}: {
  registro: RegistroImportado
  isDuplicado?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
      isDuplicado ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100 shadow-sm'
    }`}>
      {/* Badge plataforma */}
      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex-shrink-0 ${PLAT_BADGE[r.plataforma] ?? 'bg-gray-400 text-white'}`}>
        {PLAT_LABEL[r.plataforma] ?? r.plataforma}
      </span>

      {/* Dados */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs font-semibold text-gray-800">
            {new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short',
            })}
          </p>
          <span className="text-[10px] text-gray-400 capitalize">{r.tipo}</span>
          {r.horas_trabalhadas != null && (
            <span className="text-[10px] text-gray-400">{r.horas_trabalhadas}h</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className={`text-sm font-bold ${isDuplicado ? 'text-gray-500' : 'text-emerald-700'}`}>
            {fmt(r.valor_liquido)}
          </p>
          {r.valor_bruto !== r.valor_liquido && (
            <p className="text-[10px] text-gray-400">bruto {fmt(r.valor_bruto)}</p>
          )}
        </div>
      </div>

      {/* Status */}
      {isDuplicado ? (
        <span className="text-[9px] font-bold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
          Já existe
        </span>
      ) : (
        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">
          Novo
        </span>
      )}
    </div>
  )
}

/* ── Componente principal ───────────────────────────────────────── */
interface Props {
  onClose: () => void
  onImportado: (mesParam: string) => void
}

export function ImportarExtrato({ onClose, onImportado }: Props) {
  const [step, setStep]                   = useState<1 | 2 | 3 | 4 | 5>(1)
  const [plataforma, setPlataforma]       = useState<PlataformaImport | null>(null)
  const [arquivo, setArquivo]             = useState<File | null>(null)
  const [arrastando, setArrastando]       = useState(false)
  const [erroArquivo, setErroArquivo]     = useState<string | null>(null)
  const [processando, setProcessando]     = useState(false)
  const [registros, setRegistros]         = useState<RegistroImportado[]>([])
  const [erroParser, setErroParser]       = useState<string | null>(null)
  const [importando, setImportando]       = useState(false)
  const [importadosCount, setImportados]  = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const platInfo = PLATAFORMAS.find(p => p.id === plataforma)

  /* ── Navegação ─────────────────────────────────────────────────── */
  function voltar() {
    if (step === 2) { setStep(1); setPlataforma(null) }
    else if (step === 3) setStep(2)
    else if (step === 4) { setStep(3); setRegistros([]); setErroParser(null) }
  }

  function selecionarPlataforma(p: PlataformaImport) {
    setPlataforma(p)
    setStep(2)
  }

  /* ── Validação do arquivo ───────────────────────────────────────── */
  function validarArquivo(f: File): string | null {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx'].includes(ext ?? '')) return 'Aceita apenas arquivos .csv ou .xlsx'
    if (f.size > 10 * 1024 * 1024) return 'Arquivo muito grande (máximo 10MB)'
    return null
  }

  function handleArquivo(f: File) {
    const erro = validarArquivo(f)
    if (erro) { setErroArquivo(erro); return }
    setErroArquivo(null)
    setArquivo(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setArrastando(false)
    const f = e.dataTransfer.files[0]
    if (f) handleArquivo(f)
  }

  /* ── Avança para o preview (parse) ─────────────────────────────── */
  async function avancarParaPreview() {
    if (!arquivo || !plataforma) return
    setProcessando(true)
    setErroParser(null)

    try {
      // Importação dinâmica do parser específico (Etapas 2-4)
      const { parsearCSV } = await import('./parsers/index')
      const resultado = await parsearCSV(arquivo, plataforma)
      setRegistros(resultado)
      setStep(4)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setErroParser(msg)
    } finally {
      setProcessando(false)
    }
  }

  /* ── Importar registros novos ───────────────────────────────────── */
  async function importar() {
    const novos = registros.filter(r => !r.duplicado)
    if (novos.length === 0) return
    setImportando(true)

    try {
      const { importarRegistros } = await import('./actions-importacao')
      const count = await importarRegistros(novos, plataforma!, arquivo!.name)
      setImportados(count)
      setStep(5)
    } catch {
      // erro silencioso — mantém na tela de preview
    } finally {
      setImportando(false)
    }
  }

  const novos      = registros.filter(r => !r.duplicado)
  const duplicados = registros.filter(r => r.duplicado)
  const totalLiq   = novos.reduce((s, r) => s + r.valor_liquido, 0)

  // Mês mais recente nos registros novos — para redirecionar após importar
  const mesRedirect = novos.length > 0
    ? novos.reduce((max, r) => r.data > max ? r.data : max, '').slice(0, 7) // 'YYYY-MM'
    : new Date().toISOString().slice(0, 7)

  // Período legível para exibir no sucesso
  const datas = novos.map(r => r.data).sort()
  const periodoLabel = datas.length > 0
    ? (() => {
        const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        const inicio = fmt(datas[0])
        const fim    = fmt(datas[datas.length - 1])
        return inicio === fim ? inicio : `${inicio} a ${fim}`
      })()
    : null

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[92vh] flex flex-col">
        {/* Handle mobile */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {step > 1 && step < 5 && (
              <button
                onClick={voltar}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-base font-extrabold text-gray-900 leading-tight">Importar extrato</h2>
              {step < 5 && (
                <p className="text-[11px] text-gray-400 font-medium">
                  {step === 1 && 'Passo 1 de 4 · Selecione a plataforma'}
                  {step === 2 && `Passo 2 de 4 · Como exportar da ${platInfo?.nome}`}
                  {step === 3 && 'Passo 3 de 4 · Envie o arquivo'}
                  {step === 4 && 'Passo 4 de 4 · Confirme os registros'}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        {step < 5 && (
          <div className="h-1 bg-gray-100 flex-shrink-0">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-5">

          {/* ── PASSO 1: Selecionar plataforma ─────────────────── */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                Selecione a plataforma do arquivo que vai importar:
              </p>
              {PLATAFORMAS.map(p => (
                <button
                  key={p.id}
                  onClick={() => selecionarPlataforma(p.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-gray-300 bg-white hover:bg-gray-50 transition-all text-left min-h-[64px]"
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${p.cor}`}>
                    {p.nome === '99' ? '99' : p.nome[0]}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900">{p.nome}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Importar histórico de {p.nome === 'iFood' ? 'entregas' : 'corridas'}</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180 ml-auto" />
                </button>
              ))}
            </div>
          )}

          {/* ── PASSO 2: Instruções ────────────────────────────── */}
          {step === 2 && platInfo && (
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold mb-5 ${platInfo.cor}`}>
                {platInfo.nome}
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-4">
                Como exportar seu extrato:
              </p>
              <ol className="space-y-3">
                {platInfo.instrucoes.map((instrucao, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">{instrucao}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="text-xs text-blue-700 font-medium">
                  💡 Dica: exporte sempre em formato CSV para garantir a compatibilidade.
                </p>
              </div>
            </div>
          )}

          {/* ── PASSO 3: Upload ────────────────────────────────── */}
          {step === 3 && (
            <div>
              {/* Drag & drop zone */}
              <div
                onDragEnter={e => { e.preventDefault(); setArrastando(true) }}
                onDragOver={e => { e.preventDefault(); setArrastando(true) }}
                onDragLeave={() => setArrastando(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  arrastando
                    ? 'border-emerald-400 bg-emerald-50'
                    : arquivo
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                }`}
              >
                {arquivo ? (
                  <>
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold text-emerald-700 break-all px-2">{arquivo.name}</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      {(arquivo.size / 1024).toFixed(1)} KB · Toque para trocar
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      {arrastando ? 'Solte o arquivo aqui' : 'Arraste o arquivo ou toque para selecionar'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">CSV ou XLSX · máximo 10MB</p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleArquivo(f) }}
              />

              {erroArquivo && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mt-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{erroArquivo}</p>
                </div>
              )}

              {erroParser && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mt-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{erroParser}</p>
                </div>
              )}
            </div>
          )}

          {/* ── PASSO 4: Preview ───────────────────────────────── */}
          {step === 4 && (
            <div>
              {/* Cards de resumo */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold text-gray-900">{registros.length}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">no arquivo</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold text-emerald-700">{novos.length}</p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">novos</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold text-gray-400">{duplicados.length}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">já existem</p>
                </div>
              </div>

              {/* Banner de total */}
              {novos.length > 0 && (
                <div className="bg-emerald-600 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-[10px] font-semibold uppercase tracking-wide">Valor líquido total</p>
                    <p className="text-white font-extrabold text-lg leading-tight">{fmt(totalLiq)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-100 text-[10px] font-semibold uppercase tracking-wide">A importar</p>
                    <p className="text-white font-bold text-base">{novos.length} registro{novos.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}

              {/* ── Registros NOVOS ── */}
              {novos.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
                    {novos.length} novo{novos.length !== 1 ? 's' : ''} para importar
                  </p>
                  <div className="space-y-1.5">
                    {novos.map((r, i) => (
                      <RegistroCard key={i} registro={r} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Registros DUPLICADOS ── */}
              {duplicados.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-gray-300 rounded-full inline-block" />
                    {duplicados.length} já existente{duplicados.length !== 1 ? 's' : ''} (serão ignorados)
                  </p>
                  <div className="space-y-1.5 opacity-50">
                    {duplicados.map((r, i) => (
                      <RegistroCard key={i} registro={r} isDuplicado />
                    ))}
                  </div>
                </div>
              )}

              {/* Sem novos */}
              {novos.length === 0 && (
                <div className="flex flex-col items-center text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">
                    Tudo já importado!
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                    Todos os {registros.length} registros do arquivo já existem nos seus ganhos.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── PASSO 5: Sucesso ───────────────────────────────── */}
          {step === 5 && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-1">
                Importação concluída!
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {importadosCount} lançamento{importadosCount !== 1 ? 's' : ''} da {platInfo?.nome ?? plataforma} adicionado{importadosCount !== 1 ? 's' : ''} com sucesso.
              </p>

              {/* Resumo final */}
              <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Plataforma</span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${platInfo?.cor ?? 'bg-gray-200 text-gray-700'}`}>
                    {platInfo?.nome}
                  </span>
                </div>
                {periodoLabel && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Período importado</span>
                    <span className="text-xs font-semibold text-gray-700 text-right max-w-[180px] leading-snug capitalize">{periodoLabel}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Registros importados</span>
                  <span className="text-sm font-bold text-gray-900">{importadosCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Valor líquido total</span>
                  <span className="text-sm font-bold text-emerald-700">{fmt(totalLiq)}</span>
                </div>
                {duplicados.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Ignorados (já existiam)</span>
                    <span className="text-sm font-medium text-gray-400">{duplicados.length}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Arquivo</span>
                  <span className="text-xs text-gray-400 truncate max-w-[160px]">{arquivo?.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer com botão de ação */}
        <div className="flex-shrink-0 px-5 pb-6 pt-3 border-t border-gray-100">
          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors min-h-[44px]"
            >
              Tenho o arquivo, continuar →
            </button>
          )}

          {step === 3 && (
            <button
              onClick={avancarParaPreview}
              disabled={!arquivo || processando}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors min-h-[44px] flex items-center justify-center gap-2"
            >
              {processando
                ? <><Loader2 className="w-4 h-4 animate-spin" />Processando arquivo...</>
                : 'Ver registros encontrados →'
              }
            </button>
          )}

          {step === 4 && novos.length > 0 && (
            <button
              onClick={importar}
              disabled={importando}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors min-h-[44px] flex items-center justify-center gap-2"
            >
              {importando
                ? <><Loader2 className="w-4 h-4 animate-spin" />Importando...</>
                : `Importar ${novos.length} registro${novos.length !== 1 ? 's' : ''} novos`
              }
            </button>
          )}

          {step === 4 && novos.length === 0 && (
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl text-sm transition-colors min-h-[44px]"
            >
              Fechar
            </button>
          )}

          {step === 5 && (
            <button
              onClick={() => { onImportado(mesRedirect); onClose() }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors min-h-[44px]"
            >
              Ver ganhos importados ✓
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Botão de entrada (header) ──────────────────────────────────── */
export function BtnImportarExtrato() {
  const [open, setOpen] = useState(false)

  function handleImportado(mesParam: string) {
    window.location.href = `/motorista-app/ganhos?mes=${mesParam}`
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Importar extrato"
        className="flex items-center gap-2 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors min-h-[44px]"
      >
        <Upload className="w-4 h-4" />
        <span className="hidden sm:inline">Importar</span>
      </button>
      {open && (
        <ImportarExtrato
          onClose={() => setOpen(false)}
          onImportado={handleImportado}
        />
      )}
    </>
  )
}

/* ── Card de ação rápida (home do motorista) ────────────────────── */
export function BtnImportarExtratoCard() {
  const [open, setOpen] = useState(false)

  function handleImportado(mesParam: string) {
    window.location.href = `/motorista-app/ganhos?mes=${mesParam}`
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-1.5 bg-purple-50 border border-purple-100 rounded-2xl py-4 w-full transition-colors active:bg-purple-100"
      >
        <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
          <Upload className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs font-semibold text-purple-700 text-center leading-tight">Importar extrato</span>
      </button>
      {open && (
        <ImportarExtrato
          onClose={() => setOpen(false)}
          onImportado={handleImportado}
        />
      )}
    </>
  )
}
