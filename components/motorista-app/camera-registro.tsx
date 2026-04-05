'use client'

import { useState, useRef, useTransition } from 'react'
import { Camera, ImageIcon, X, Check, ChevronDown, Edit2, AlertCircle } from 'lucide-react'
import { salvarRegistroRapido } from '@/app/(motorista-app)/motorista-app/calcular/registro-rapido-actions'

/* ── Helpers ─────────────────────────────────────────────────────── */
function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const hoje = () => new Date().toISOString().split('T')[0]

const CAT_DESP = [
  { value: 'combustivel', label: 'Combustível',  emoji: '⛽' },
  { value: 'manutencao',  label: 'Manutenção',   emoji: '🔧' },
  { value: 'seguro',      label: 'Seguro',        emoji: '🛡️' },
  { value: 'ipva',        label: 'IPVA',          emoji: '📋' },
  { value: 'lavagem',     label: 'Lavagem',       emoji: '🚿' },
  { value: 'multa',       label: 'Multa',         emoji: '🚨' },
  { value: 'outros',      label: 'Outros',        emoji: '📦' },
]
const CAT_GANHO = [
  { value: 'uber',    label: 'Uber',    emoji: '⚫' },
  { value: '99',      label: '99',      emoji: '🟡' },
  { value: 'ifood',   label: 'iFood',   emoji: '🔴' },
  { value: 'indrive', label: 'inDrive', emoji: '🟢' },
  { value: 'outros',  label: 'Outros',  emoji: '📦' },
]

function emojiCat(tipo: string, cat: string) {
  const lista = tipo === 'despesa' ? CAT_DESP : CAT_GANHO
  return lista.find(c => c.value === cat)?.emoji ?? '📦'
}
function labelCat(tipo: string, cat: string) {
  const lista = tipo === 'despesa' ? CAT_DESP : CAT_GANHO
  return lista.find(c => c.value === cat)?.label ?? cat
}

/* ── Resize image ────────────────────────────────────────────────── */
async function redimensionar(file: File, maxPx = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject
    img.src = url
  })
}

/* ── Tipos ───────────────────────────────────────────────────────── */
interface DadosFoto {
  tipo: 'despesa' | 'ganho'
  categoria: string
  valor: number
  data: string
  descricao: string | null
  plataforma: string | null
  confianca: 'alta' | 'media' | 'baixa'
  observacao: string
}

type Etapa = 'fechado' | 'escolha' | 'processando' | 'preview' | 'editar' | 'sucesso'

/* ── Componente principal ────────────────────────────────────────── */
export function CameraRegistro() {
  const [etapa, setEtapa]         = useState<Etapa>('fechado')
  const [imgBase64, setImgBase64] = useState<string | null>(null)
  const [dados, setDados]         = useState<DadosFoto | null>(null)
  const [erroMsg, setErroMsg]     = useState<string | null>(null)
  const [isPending, start]        = useTransition()

  // Form edit
  const [eTipo, setETipo]     = useState<'despesa' | 'ganho'>('despesa')
  const [eCat,  setECat]      = useState('')
  const [eVal,  setEVal]      = useState('')
  const [eData, setEData]     = useState(hoje())
  const [eDesc, setEDesc]     = useState('')

  const fileInputCamera  = useRef<HTMLInputElement>(null)
  const fileInputGaleria = useRef<HTMLInputElement>(null)

  function abrir() { setEtapa('escolha'); setErroMsg(null) }
  function fechar() { setEtapa('fechado'); setImgBase64(null); setDados(null); setErroMsg(null) }

  async function processarArquivo(file: File) {
    setEtapa('processando')
    try {
      const b64 = await redimensionar(file)
      setImgBase64(b64)

      const res = await fetch('/api/motorista/analisar-foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64 }),
      })
      const json = await res.json()
      if (!json.ok || !json.dados) throw new Error(json.error ?? 'Erro na análise')

      const d: DadosFoto = {
        ...json.dados,
        data: json.dados.data ?? hoje(),
      }
      setDados(d)
      // Pre-fill edit form
      setETipo(d.tipo)
      setECat(d.categoria)
      setEVal(d.valor?.toFixed(2).replace('.', ',') ?? '')
      setEData(d.data ?? hoje())
      setEDesc(d.descricao ?? '')
      setEtapa('preview')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido'
      setErroMsg(msg.includes('analisar') ? 'Não conseguimos identificar os dados. Tente com mais luz ou aproxime a câmera.' : 'Não foi possível processar a imagem.')
      setEtapa('escolha')
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processarArquivo(file)
    e.target.value = ''
  }

  function confirmar() {
    if (!dados) return
    start(async () => {
      const res = await salvarRegistroRapido({
        tipo:       dados.tipo,
        categoria:  dados.categoria,
        valor:      dados.valor,
        data:       dados.data,
        descricao:  dados.descricao,
        plataforma: dados.tipo === 'ganho' ? dados.categoria : null,
        horas:      null,
        origem:     'foto',
        confianca:  dados.confianca,
        fotoBase64: imgBase64,
      })
      if (res.ok) setEtapa('sucesso')
      else setErroMsg(res.error ?? 'Erro ao salvar.')
    })
  }

  function salvarEdicao() {
    const val = parseFloat(eVal.replace(',', '.'))
    if (!eCat || isNaN(val) || val <= 0) return
    start(async () => {
      const res = await salvarRegistroRapido({
        tipo:       eTipo,
        categoria:  eCat,
        valor:      val,
        data:       eData,
        descricao:  eDesc || null,
        plataforma: eTipo === 'ganho' ? eCat : null,
        horas:      null,
        origem:     'foto',
        confianca:  dados?.confianca ?? null,
        fotoBase64: imgBase64,
      })
      if (res.ok) setEtapa('sucesso')
      else setErroMsg(res.error ?? 'Erro ao salvar.')
    })
  }

  function abrirEdicao() {
    if (dados) {
      setETipo(dados.tipo)
      setECat(dados.categoria)
      setEVal(dados.valor?.toFixed(2).replace('.', ',') ?? '')
      setEData(dados.data ?? hoje())
      setEDesc(dados.descricao ?? '')
    }
    setEtapa('editar')
  }

  if (etapa === 'fechado') return (
    <button
      onClick={abrir}
      className="w-14 h-14 bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center active:scale-95 transition-transform"
      aria-label="Registrar por foto"
    >
      <Camera className="w-6 h-6 text-gray-700" />
    </button>
  )

  const badge = dados
    ? dados.confianca === 'alta'  ? { text: '✅ Alta confiança',      cls: 'bg-emerald-100 text-emerald-700' }
    : dados.confianca === 'media' ? { text: '⚠️ Confira os dados',    cls: 'bg-amber-100 text-amber-700' }
    :                               { text: '❌ Não conseguimos ler bem', cls: 'bg-red-100 text-red-600' }
    : null

  return (
    <>
      {/* Inputs ocultos */}
      <input ref={fileInputCamera}  type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
      <input ref={fileInputGaleria} type="file" accept="image/*"                        className="hidden" onChange={onFileChange} />

      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={fechar} />

      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            {etapa === 'escolha'     ? 'Registrar por foto'
            : etapa === 'processando' ? 'Analisando imagem…'
            : etapa === 'preview'    ? 'Confirmar registro'
            : etapa === 'editar'     ? 'Editar dados'
            : ''}
          </h2>
          <button onClick={fechar} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4">

          {/* ── ETAPA: escolha ── */}
          {etapa === 'escolha' && (
            <div className="space-y-3">
              {erroMsg && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-snug">{erroMsg}</p>
                </div>
              )}
              <button
                onClick={() => fileInputCamera.current?.click()}
                className="w-full flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 active:bg-gray-100 transition-colors"
              >
                <Camera className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Abrir câmera</p>
                  <p className="text-xs text-gray-400">Tire uma foto agora</p>
                </div>
              </button>
              <button
                onClick={() => fileInputGaleria.current?.click()}
                className="w-full flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 active:bg-gray-100 transition-colors"
              >
                <ImageIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Escolher da galeria</p>
                  <p className="text-xs text-gray-400">JPG, PNG, HEIC</p>
                </div>
              </button>
              <p className="text-[10px] text-gray-400 text-center pt-1">
                Funciona com cupons, notas fiscais, extratos e comprovantes.
              </p>
            </div>
          )}

          {/* ── ETAPA: processando ── */}
          {etapa === 'processando' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 text-emerald-500 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Analisando com IA…</p>
              <p className="text-xs text-gray-400">Isso leva alguns segundos</p>
            </div>
          )}

          {/* ── ETAPA: preview ── */}
          {etapa === 'preview' && dados && (
            <div className="space-y-4">
              {/* Miniatura */}
              {imgBase64 && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgBase64} alt="Preview" className="h-28 rounded-2xl object-cover border border-gray-100 shadow-sm" />
                </div>
              )}

              {/* Badge confiança */}
              {badge && (
                <div className={`text-center text-xs font-semibold py-1.5 rounded-full ${badge.cls}`}>
                  {badge.text}
                </div>
              )}

              {/* Dados */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl divide-y divide-gray-100">
                {[
                  { label: 'Tipo',       value: dados.tipo === 'despesa' ? 'Despesa' : 'Ganho' },
                  { label: 'Categoria',  value: `${emojiCat(dados.tipo, dados.categoria)} ${labelCat(dados.tipo, dados.categoria)}` },
                  { label: 'Valor',      value: dados.valor ? fmt(dados.valor) : '—' },
                  { label: 'Data',       value: dados.data ? new Date(dados.data + 'T12:00:00').toLocaleDateString('pt-BR') : 'Hoje' },
                  ...(dados.descricao ? [{ label: 'Descrição', value: dados.descricao }] : []),
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Observação da IA */}
              {dados.observacao && (
                <p className="text-[11px] text-gray-400 bg-gray-50 rounded-xl px-3 py-2 leading-snug">
                  {dados.observacao}
                </p>
              )}

              {dados.confianca === 'media' && (
                <p className="text-[11px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2 leading-snug">
                  Identificamos as informações, mas confirme se estão corretas antes de salvar.
                </p>
              )}
              {dados.confianca === 'baixa' && (
                <p className="text-[11px] text-red-600 bg-red-50 rounded-xl px-3 py-2 leading-snug">
                  Tente com mais luz ou mais perto. Você pode corrigir os dados abaixo.
                </p>
              )}

              {erroMsg && <p className="text-xs text-red-500 text-center">{erroMsg}</p>}

              {/* Botões */}
              <div className="flex gap-3 pb-2">
                <button
                  onClick={abrirEdicao}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-700 min-h-[48px]"
                >
                  <Edit2 className="w-4 h-4" /> Editar
                </button>
                <button
                  onClick={confirmar}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 min-h-[48px]"
                >
                  <Check className="w-4 h-4" /> Confirmar
                </button>
              </div>
            </div>
          )}

          {/* ── ETAPA: editar ── */}
          {etapa === 'editar' && (
            <div className="space-y-4 pb-4">
              {/* Miniatura */}
              {imgBase64 && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgBase64} alt="Preview" className="h-20 rounded-xl object-cover border border-gray-100" />
                </div>
              )}

              {/* Tipo toggle */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Tipo</label>
                <div className="flex gap-2">
                  {(['despesa', 'ganho'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => { setETipo(t); setECat('') }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors min-h-[48px] ${eTipo === t ? (t === 'despesa' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white') : 'bg-gray-100 text-gray-600'}`}
                    >
                      {t === 'despesa' ? 'Despesa' : 'Ganho'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Categoria</label>
                <div className="relative">
                  <select
                    value={eCat}
                    onChange={e => setECat(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white outline-none min-h-[48px]"
                  >
                    <option value="">Selecionar…</option>
                    {(eTipo === 'despesa' ? CAT_DESP : CAT_GANHO).map(c => (
                      <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Valor */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Valor</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={eVal}
                    onChange={e => setEVal(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none min-h-[48px]"
                  />
                </div>
              </div>

              {/* Data */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Data</label>
                <input
                  type="date"
                  value={eData}
                  onChange={e => setEData(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none min-h-[48px]"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Descrição</label>
                <input
                  type="text"
                  value={eDesc}
                  onChange={e => setEDesc(e.target.value)}
                  placeholder="Ex: Troca de óleo"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none min-h-[48px]"
                />
              </div>

              {erroMsg && <p className="text-xs text-red-500">{erroMsg}</p>}

              <button
                onClick={salvarEdicao}
                disabled={isPending || !eCat || !eVal}
                className="w-full bg-emerald-600 text-white rounded-xl py-3.5 text-sm font-semibold disabled:opacity-40 min-h-[48px]"
              >
                Salvar registro
              </button>
            </div>
          )}

          {/* ── ETAPA: sucesso ── */}
          {etapa === 'sucesso' && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-base font-bold text-gray-900 mb-1">Registrado!</p>
              <p className="text-xs text-gray-400 mb-6">O lançamento foi salvo com sucesso.</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => { setEtapa('escolha'); setImgBase64(null); setDados(null); setErroMsg(null) }}
                  className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-700 min-h-[48px]"
                >
                  Registrar outro
                </button>
                <button
                  onClick={fechar}
                  className="flex-1 bg-emerald-600 text-white rounded-xl py-3 text-sm font-semibold min-h-[48px]"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
