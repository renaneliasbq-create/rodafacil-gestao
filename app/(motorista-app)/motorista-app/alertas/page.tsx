import { createClient } from '@/lib/supabase/server'
import { Bell, CheckCircle } from 'lucide-react'
import { BtnNovoAlerta, BtnDeletarAlerta, getTipo } from './alertas-client'

type Urgencia = 'vencido' | 'critico' | 'urgente' | 'atencao' | 'ok'

function getUrgencia(dataVenc: string, hoje: Date): { urgencia: Urgencia; dias: number } {
  const venc = new Date(dataVenc + 'T12:00:00')
  const dias  = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000)
  if (dias < 0)   return { urgencia: 'vencido',  dias }
  if (dias <= 7)  return { urgencia: 'critico',  dias }
  if (dias <= 15) return { urgencia: 'urgente',  dias }
  if (dias <= 30) return { urgencia: 'atencao',  dias }
  return           { urgencia: 'ok',      dias }
}

const URGENCIA_CONFIG = {
  vencido:  { label: 'Vencido',          bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-500 text-white',        dot: 'bg-red-500' },
  critico:  { label: 'Critico (ate 7d)', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500 text-white',     dot: 'bg-orange-500' },
  urgente:  { label: 'Urgente (8-15d)',  bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500 text-white',     dot: 'bg-yellow-500' },
  atencao:  { label: 'Atencao (16-30d)', bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-500 text-white',       dot: 'bg-blue-500' },
  ok:       { label: 'Em dia (+30d)',    bg: 'bg-gray-50',   border: 'border-gray-200',   badge: 'bg-emerald-500 text-white',    dot: 'bg-emerald-500' },
}

function diasLabel(dias: number) {
  if (dias < 0)  return `Venceu há ${Math.abs(dias)} dia${Math.abs(dias) !== 1 ? 's' : ''}`
  if (dias === 0) return 'Vence hoje'
  if (dias === 1) return 'Vence amanhã'
  return `${dias} dias`
}

export default async function AlertasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const hoje = new Date()

  const { data: alertas } = await supabase
    .from('motorista_alertas')
    .select('id, tipo, descricao, data_vencimento')
    .eq('motorista_id', user.id)
    .order('data_vencimento', { ascending: true })

  const lista = alertas ?? []

  // Enriquece com urgência
  const enriquecidos = lista.map(a => ({
    ...a,
    ...getUrgencia(a.data_vencimento, hoje),
  }))

  // Agrupa por urgência (na ordem de prioridade)
  const ordem: Urgencia[] = ['vencido', 'critico', 'urgente', 'atencao', 'ok']
  const grupos = ordem
    .map(u => ({ urgencia: u, items: enriquecidos.filter(a => a.urgencia === u) }))
    .filter(g => g.items.length > 0)

  // Contadores para o resumo
  const nVencido  = enriquecidos.filter(a => a.urgencia === 'vencido').length
  const nCritico  = enriquecidos.filter(a => a.urgencia === 'critico').length
  const nUrgente  = enriquecidos.filter(a => a.urgencia === 'urgente').length
  const nOk       = enriquecidos.filter(a => a.urgencia === 'ok' || a.urgencia === 'atencao').length

  return (
    <div className="pb-6">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Alertas</h1>
          <p className="text-sm text-gray-400 mt-0.5">Vencimentos e documentos</p>
        </div>
        <BtnNovoAlerta />
      </div>

      {/* ── Resumo ── */}
      {lista.length > 0 && (
        <div className="grid grid-cols-3 gap-2 px-4 mb-5">
          <div className={`rounded-2xl p-3 text-center ${nVencido + nCritico > 0 ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'}`}>
            <p className={`text-2xl font-extrabold ${nVencido + nCritico > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {nVencido + nCritico}
            </p>
            <p className="text-[10px] font-semibold text-gray-500 mt-0.5">Urgentes</p>
          </div>
          <div className={`rounded-2xl p-3 text-center ${nUrgente > 0 ? 'bg-yellow-50 border border-yellow-100' : 'bg-gray-50 border border-gray-100'}`}>
            <p className={`text-2xl font-extrabold ${nUrgente > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
              {nUrgente}
            </p>
            <p className="text-[10px] font-semibold text-gray-500 mt-0.5">Atenção</p>
          </div>
          <div className="rounded-2xl p-3 text-center bg-emerald-50 border border-emerald-100">
            <p className="text-2xl font-extrabold text-emerald-600">{nOk}</p>
            <p className="text-[10px] font-semibold text-gray-500 mt-0.5">Em dia</p>
          </div>
        </div>
      )}

      {/* ── Lista por grupo ── */}
      <div className="px-4 space-y-4">
        {lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mb-3">
              <Bell className="w-7 h-7 text-yellow-300" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Nenhum alerta cadastrado</p>
            <p className="text-xs text-gray-400 max-w-xs">
              Adicione vencimentos de CNH, CRLV, seguro e revisão para ser avisado com antecedência.
            </p>
          </div>
        ) : (
          grupos.map(({ urgencia, items }) => {
            const config = URGENCIA_CONFIG[urgencia]
            return (
              <div key={urgencia}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {config.label}
                  </p>
                </div>
                <div className={`rounded-2xl border ${config.border} ${config.bg} divide-y divide-white/60 overflow-hidden`}>
                  {items.map(a => {
                    const info = getTipo(a.tipo)
                    const Icon = info.icon
                    const dataFmt = new Date(a.data_vencimento + 'T12:00:00')
                      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                    return (
                      <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${info.bg}`}>
                          <Icon className={`w-4 h-4 ${info.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {a.descricao || a.tipo}
                            </p>
                            {a.descricao && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${info.badge}`}>
                                {a.tipo}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {dataFmt}
                            {' · '}
                            <span className={`font-semibold ${
                              urgencia === 'vencido' ? 'text-red-600' :
                              urgencia === 'critico' ? 'text-orange-600' :
                              urgencia === 'urgente' ? 'text-yellow-600' :
                              'text-gray-500'
                            }`}>
                              {diasLabel(a.dias)}
                            </span>
                          </p>
                        </div>
                        <BtnDeletarAlerta id={a.id} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}

        {/* Todos em dia */}
        {lista.length > 0 && nVencido + nCritico + nUrgente === 0 && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 mt-2">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-emerald-700">Tudo em dia! Nenhum vencimento urgente.</p>
          </div>
        )}
      </div>
    </div>
  )
}
