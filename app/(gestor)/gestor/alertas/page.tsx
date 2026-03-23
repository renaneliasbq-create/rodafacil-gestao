export const dynamic = 'force-dynamic'

import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Bell, Car, User, CheckCircle2 } from 'lucide-react'
import { NovoVencimentoForm } from './novo-vencimento-form'
import { DeleteVencimento } from './delete-btn'

const TIPO_LABELS: Record<string, string> = {
  crlv:    'CRLV',
  seguro:  'Seguro',
  ipva:    'IPVA',
  revisao: 'Revisão',
  licenca: 'Licença',
  cnh:     'CNH',
  outro:   'Outro',
}

const TIPO_COLORS: Record<string, string> = {
  crlv:    'bg-blue-100 text-blue-700',
  seguro:  'bg-teal-100 text-teal-700',
  ipva:    'bg-purple-100 text-purple-700',
  revisao: 'bg-orange-100 text-orange-700',
  licenca: 'bg-indigo-100 text-indigo-700',
  cnh:     'bg-cyan-100 text-cyan-700',
  outro:   'bg-gray-100 text-gray-500',
}

function diasParaVencer(dataVencimento: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const venc = new Date(dataVencimento + 'T12:00:00')
  return Math.floor((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function nivelAlerta(dias: number) {
  if (dias < 0)   return { label: 'Vencido',  badge: 'bg-red-100 text-red-700',       barra: 'bg-red-500',    ordem: 0 }
  if (dias <= 7)  return { label: 'Crítico',  badge: 'bg-red-100 text-red-700',        barra: 'bg-red-500',    ordem: 1 }
  if (dias <= 15) return { label: 'Urgente',  badge: 'bg-orange-100 text-orange-700',  barra: 'bg-orange-500', ordem: 2 }
  if (dias <= 30) return { label: 'Atenção',  badge: 'bg-yellow-100 text-yellow-700',  barra: 'bg-yellow-500', ordem: 3 }
  return                 { label: 'Ok',       badge: 'bg-green-100 text-green-700',    barra: 'bg-green-400',  ordem: 4 }
}

export default async function AlertasPage() {
  noStore()
  const supabase = createClient()

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  // Busca vencimentos nos próximos 90 dias + já vencidos
  const limite90 = new Date(hoje)
  limite90.setDate(limite90.getDate() + 90)

  const [
    { data: vencimentos },
    { data: veiculos },
    { data: motoristas },
  ] = await Promise.all([
    supabase
      .from('vencimentos')
      .select('*')
      .lte('data_vencimento', limite90.toISOString().split('T')[0])
      .order('data_vencimento', { ascending: true }),
    supabase.from('veiculos').select('id, placa, modelo').order('placa'),
    supabase.from('users').select('id, nome').eq('tipo', 'motorista').order('nome'),
  ])

  // Lookup maps
  const veiculoById   = Object.fromEntries((veiculos   ?? []).map(v => [v.id, v]))
  const motoristaById = Object.fromEntries((motoristas ?? []).map(m => [m.id, m]))

  // Enriquece com dias e nível
  const lista = (vencimentos ?? []).map(v => ({
    ...v,
    dias:  diasParaVencer(v.data_vencimento),
    nivel: nivelAlerta(diasParaVencer(v.data_vencimento)),
    nome:  v.ref_tipo === 'veiculo'
      ? veiculoById[v.ref_id]?.placa ?? '—'
      : motoristaById[v.ref_id]?.nome ?? '—',
    subtitulo: v.ref_tipo === 'veiculo'
      ? veiculoById[v.ref_id]?.modelo ?? ''
      : 'Motorista',
  })).sort((a, b) => a.dias - b.dias)

  // Contadores por nível
  const qtdVencido  = lista.filter(v => v.dias < 0).length
  const qtdCritico  = lista.filter(v => v.dias >= 0 && v.dias <= 7).length
  const qtdUrgente  = lista.filter(v => v.dias >= 8 && v.dias <= 15).length
  const qtdAtencao  = lista.filter(v => v.dias >= 16 && v.dias <= 30).length

  // Todos os vencimentos para exibir também os >90 dias no futuro (busca separada)
  const { data: futuros } = await supabase
    .from('vencimentos')
    .select('*')
    .gt('data_vencimento', limite90.toISOString().split('T')[0])
    .order('data_vencimento', { ascending: true })

  const listaFuturos = (futuros ?? []).map(v => ({
    ...v,
    dias:  diasParaVencer(v.data_vencimento),
    nivel: nivelAlerta(diasParaVencer(v.data_vencimento)),
    nome:  v.ref_tipo === 'veiculo'
      ? veiculoById[v.ref_id]?.placa ?? '—'
      : motoristaById[v.ref_id]?.nome ?? '—',
    subtitulo: v.ref_tipo === 'veiculo'
      ? veiculoById[v.ref_id]?.modelo ?? ''
      : 'Motorista',
  }))

  const listaCompleta = [...lista, ...listaFuturos]

  return (
    <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Alertas de Vencimento</h1>
          <p className="text-gray-500 text-sm mt-0.5">Documentos e revisões com prazo próximo</p>
        </div>
        <NovoVencimentoForm veiculos={veiculos ?? []} motoristas={motoristas ?? []} />
      </div>

      {listaCompleta.length === 0 ? (
        <div className="card py-20 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-base font-semibold text-gray-700">Nenhum alerta cadastrado</p>
          <p className="text-sm text-gray-400 mt-1">
            Cadastre os vencimentos de CRLV, CNH, seguro e revisões para receber alertas.
          </p>
        </div>
      ) : (
        <>
          {/* Cards de resumo — apenas se houver itens urgentes */}
          {(qtdVencido + qtdCritico + qtdUrgente + qtdAtencao) > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Vencidos',        count: qtdVencido,  classes: 'border-red-200 bg-red-50',      text: 'text-red-700',    dot: 'bg-red-500'    },
                { label: 'Crítico (≤7d)',   count: qtdCritico,  classes: 'border-red-200 bg-red-50',      text: 'text-red-600',    dot: 'bg-red-400'    },
                { label: 'Urgente (8–15d)', count: qtdUrgente,  classes: 'border-orange-200 bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
                { label: 'Atenção (16–30d)',count: qtdAtencao,  classes: 'border-yellow-200 bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
              ].map(({ label, count, classes, text, dot }) => (
                <div key={label} className={`rounded-xl border p-3 ${classes}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                    <span className={`text-xs font-semibold ${text}`}>{label}</span>
                  </div>
                  <p className={`text-2xl font-extrabold ${text}`}>{count}</p>
                </div>
              ))}
            </div>
          )}

          {/* Lista completa */}
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-gray-100">
              <Bell className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Todos os vencimentos</h2>
              <span className="ml-auto text-xs text-gray-400">{listaCompleta.length} registros</span>
            </div>

            {/* Desktop header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <span className="col-span-3">Veículo / Motorista</span>
              <span className="col-span-2">Documento</span>
              <span className="col-span-3">Observação</span>
              <span className="col-span-2">Vencimento</span>
              <span className="col-span-1">Status</span>
              <span className="col-span-1" />
            </div>

            <div className="divide-y divide-gray-50">
              {listaCompleta.map((v) => {
                const diasAbs = Math.abs(v.dias)
                const diasLabel = v.dias < 0
                  ? `Venceu há ${diasAbs} dia${diasAbs !== 1 ? 's' : ''}`
                  : v.dias === 0
                  ? 'Vence hoje'
                  : `${v.dias} dia${v.dias !== 1 ? 's' : ''}`

                return (
                  <div key={v.id}>
                    {/* Mobile */}
                    <div className="sm:hidden px-4 py-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              {v.ref_tipo === 'veiculo'
                                ? <Car className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                : <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              }
                              <p className="text-sm font-semibold text-gray-900">{v.nome}</p>
                            </div>
                            <span className={`badge text-xs ${TIPO_COLORS[v.tipo] ?? 'bg-gray-100 text-gray-500'}`}>
                              {TIPO_LABELS[v.tipo] ?? v.tipo}
                            </span>
                          </div>
                          {v.subtitulo && v.ref_tipo === 'veiculo' && (
                            <p className="text-xs text-gray-400 mt-0.5">{v.subtitulo}</p>
                          )}
                          {v.descricao && (
                            <p className="text-xs text-gray-500 mt-0.5">{v.descricao}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-xs text-gray-400">{formatDate(v.data_vencimento)}</p>
                            <span className={`badge text-xs ${v.nivel.badge}`}>{diasLabel}</span>
                          </div>
                        </div>
                        <DeleteVencimento id={v.id} />
                      </div>
                    </div>

                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-5 py-3.5">
                      <div className="col-span-3 flex items-center gap-2 min-w-0">
                        {v.ref_tipo === 'veiculo'
                          ? <Car className="w-4 h-4 text-gray-300 flex-shrink-0" />
                          : <User className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        }
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{v.nome}</p>
                          {v.subtitulo && v.ref_tipo === 'veiculo' && (
                            <p className="text-xs text-gray-400 truncate">{v.subtitulo}</p>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <span className={`badge text-xs w-fit ${TIPO_COLORS[v.tipo] ?? 'bg-gray-100 text-gray-500'}`}>
                          {TIPO_LABELS[v.tipo] ?? v.tipo}
                        </span>
                      </div>

                      <div className="col-span-3">
                        <p className="text-sm text-gray-500 truncate">{v.descricao ?? '—'}</p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-sm text-gray-700">{formatDate(v.data_vencimento)}</p>
                      </div>

                      <div className="col-span-1">
                        <span className={`badge text-xs w-fit ${v.nivel.badge}`}>
                          {v.nivel.label === 'Ok' ? `${v.dias}d` : diasLabel}
                        </span>
                      </div>

                      <div className="col-span-1 flex justify-end">
                        <DeleteVencimento id={v.id} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
