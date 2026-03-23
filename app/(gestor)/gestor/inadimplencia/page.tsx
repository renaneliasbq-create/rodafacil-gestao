export const dynamic = 'force-dynamic'

import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AlertTriangle, MessageCircle, Users, TrendingDown, ExternalLink } from 'lucide-react'
import Link from 'next/link'

function diasAtraso(dataVencimento: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const venc = new Date(dataVencimento + 'T12:00:00')
  return Math.max(0, Math.floor((hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24)))
}

function nivelRisco(dias: number) {
  if (dias >= 15) return { label: 'Crítico',    badge: 'bg-red-100 text-red-700',      barra: 'bg-red-500',    dot: 'bg-red-500'    }
  if (dias >= 8)  return { label: 'Alto risco', badge: 'bg-orange-100 text-orange-700', barra: 'bg-orange-500', dot: 'bg-orange-500' }
  if (dias >= 4)  return { label: 'Risco',      badge: 'bg-yellow-100 text-yellow-700', barra: 'bg-yellow-500', dot: 'bg-yellow-400' }
  return            { label: 'Atenção',    badge: 'bg-amber-100 text-amber-700',   barra: 'bg-amber-400',  dot: 'bg-amber-400'  }
}

function gerarLinkWhatsApp(telefone: string | null, nome: string, totalDevido: number, qtdPagamentos: number): string | null {
  if (!telefone) return null
  const tel = telefone.replace(/\D/g, '')
  if (!tel) return null
  const valorFmt = totalDevido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const plural = qtdPagamentos > 1 ? `${qtdPagamentos} pagamentos` : '1 pagamento'
  const msg = encodeURIComponent(
    `Olá ${nome}! 👋\n\n` +
    `Identificamos ${plural} em aberto referente ao aluguel do veículo.\n\n` +
    `💰 Total em aberto: ${valorFmt}\n\n` +
    `Para regularizar, entre em contato com a gente. 🙏\n\n` +
    `_Roda Fácil SC_`
  )
  return `https://wa.me/55${tel}?text=${msg}`
}

export default async function InadimplenciaPage() {
  noStore()
  const supabase = createClient()

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const hojeStr = hoje.toISOString().split('T')[0]

  const { data: pagamentos } = await supabase
    .from('pagamentos')
    .select(`
      id, valor, data_vencimento, status, referencia,
      motorista:users!motorista_id(id, nome, telefone),
      contrato:contratos!contrato_id(
        veiculo:veiculos!veiculo_id(placa, modelo)
      )
    `)
    .neq('status', 'pago')
    .lt('data_vencimento', hojeStr)
    .order('data_vencimento', { ascending: true })

  // Agrupa por motorista
  type PagRow = NonNullable<typeof pagamentos>[number]
  type MotoristaGrupo = {
    id: string
    nome: string
    telefone: string | null
    pagamentos: PagRow[]
    totalDevido: number
    maxDias: number
    placas: string[]
  }

  const grupos: Record<string, MotoristaGrupo> = {}
  for (const p of pagamentos ?? []) {
    const mot = p.motorista as { id: string; nome: string; telefone: string | null } | null
    if (!mot) continue
    if (!grupos[mot.id]) {
      grupos[mot.id] = {
        id: mot.id,
        nome: mot.nome,
        telefone: mot.telefone ?? null,
        pagamentos: [],
        totalDevido: 0,
        maxDias: 0,
        placas: [],
      }
    }
    grupos[mot.id].pagamentos.push(p)
    grupos[mot.id].totalDevido += Number(p.valor)
    const dias = diasAtraso(p.data_vencimento)
    if (dias > grupos[mot.id].maxDias) grupos[mot.id].maxDias = dias
    const contrato = p.contrato as { veiculo: { placa: string; modelo: string } | null } | null
    const placa = contrato?.veiculo?.placa
    if (placa && !grupos[mot.id].placas.includes(placa)) grupos[mot.id].placas.push(placa)
  }

  const lista = Object.values(grupos).sort((a, b) => b.maxDias - a.maxDias)

  const totalDevido   = lista.reduce((s, g) => s + g.totalDevido, 0)
  const qtdMotoristas = lista.length
  const ticketMedio   = qtdMotoristas > 0 ? totalDevido / qtdMotoristas : 0

  // Contagem por nível de risco
  const contCritico   = lista.filter(g => g.maxDias >= 15).length
  const contAlto      = lista.filter(g => g.maxDias >= 8  && g.maxDias < 15).length
  const contRisco     = lista.filter(g => g.maxDias >= 4  && g.maxDias < 8).length
  const contAtencao   = lista.filter(g => g.maxDias >= 1  && g.maxDias < 4).length

  return (
    <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Inadimplência</h1>
        <p className="text-gray-500 text-sm mt-0.5">Motoristas com pagamentos vencidos e não pagos</p>
      </div>

      {lista.length === 0 ? (
        <div className="card py-20 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-base font-semibold text-gray-700">Nenhuma inadimplência!</p>
          <p className="text-sm text-gray-400 mt-1">Todos os motoristas estão em dia com os pagamentos.</p>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total em aberto</p>
              </div>
              <p className="text-base md:text-2xl font-bold text-red-600 truncate">{formatCurrency(totalDevido)}</p>
              <p className="text-xs text-gray-400 mt-1">{(pagamentos ?? []).length} pagamentos vencidos</p>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Inadimplentes</p>
              </div>
              <p className="text-base md:text-2xl font-bold text-orange-600">{qtdMotoristas}</p>
              <p className="text-xs text-gray-400 mt-1">motoristas com atraso</p>
            </div>

            <div className="card p-4 col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ticket médio</p>
              </div>
              <p className="text-base md:text-2xl font-bold text-yellow-600 truncate">{formatCurrency(ticketMedio)}</p>
              <p className="text-xs text-gray-400 mt-1">por motorista inadimplente</p>
            </div>
          </div>

          {/* Régua de risco */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm">Régua de risco</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Atenção',    sub: '1 a 3 dias',  count: contAtencao,  classes: 'border-amber-200 bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
                { label: 'Risco',      sub: '4 a 7 dias',  count: contRisco,    classes: 'border-yellow-200 bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
                { label: 'Alto risco', sub: '8 a 14 dias', count: contAlto,     classes: 'border-orange-200 bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
                { label: 'Crítico',    sub: '15+ dias',    count: contCritico,  classes: 'border-red-200 bg-red-50',     text: 'text-red-700',    dot: 'bg-red-500'    },
              ].map(({ label, sub, count, classes, text, dot }) => (
                <div key={label} className={`rounded-xl border p-3 ${classes}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className={`text-xs font-semibold ${text}`}>{label}</span>
                  </div>
                  <p className={`text-2xl font-extrabold ${text}`}>{count}</p>
                  <p className={`text-xs mt-0.5 ${text} opacity-70`}>{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de inadimplentes */}
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-gray-100">
              <AlertTriangle className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Motoristas em atraso</h2>
              <span className="ml-auto text-xs text-gray-400">{lista.length} motoristas</span>
            </div>

            {/* Desktop header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <span className="col-span-3">Motorista</span>
              <span className="col-span-2">Veículo</span>
              <span className="col-span-2">Atraso</span>
              <span className="col-span-2">Pagamentos</span>
              <span className="col-span-2 text-right">Total devido</span>
              <span className="col-span-1" />
            </div>

            <div className="divide-y divide-gray-50">
              {lista.map((g) => {
                const risco = nivelRisco(g.maxDias)
                const waLink = gerarLinkWhatsApp(g.telefone, g.nome, g.totalDevido, g.pagamentos.length)
                return (
                  <div key={g.id}>
                    {/* Mobile */}
                    <div className="sm:hidden px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/gestor/motoristas/${g.id}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate">
                              {g.nome}
                            </Link>
                            <span className={`badge text-xs ${risco.badge}`}>{risco.label}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {g.placas.length > 0 ? g.placas.join(', ') : 'Sem veículo'}
                            {' · '}
                            {g.pagamentos.length} pagamento{g.pagamentos.length > 1 ? 's' : ''}
                            {' · '}
                            {g.maxDias} dia{g.maxDias !== 1 ? 's' : ''} em atraso
                          </p>
                          <p className="text-base font-bold text-red-600 mt-1">{formatCurrency(g.totalDevido)}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors min-h-[44px]"
                              title="Cobrar via WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Cobrar
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Pagamentos individuais no mobile */}
                      <div className="mt-3 space-y-1.5">
                        {g.pagamentos.map(p => {
                          const dias = diasAtraso(p.data_vencimento)
                          return (
                            <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                              <div>
                                <p className="text-xs text-gray-600">{p.referencia ?? formatDate(p.data_vencimento)}</p>
                                <p className="text-xs text-gray-400">Venceu em {formatDate(p.data_vencimento)} · {dias}d atraso</p>
                              </div>
                              <p className="text-xs font-semibold text-red-600">{formatCurrency(Number(p.valor))}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-5 py-4">
                      <div className="col-span-3">
                        <Link href={`/gestor/motoristas/${g.id}`} className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-blue-600 group w-fit">
                          {g.nome}
                          <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        {g.telefone && (
                          <p className="text-xs text-gray-400 mt-0.5">{g.telefone}</p>
                        )}
                      </div>

                      <div className="col-span-2">
                        {g.placas.length > 0
                          ? g.placas.map(p => <span key={p} className="block text-sm text-gray-700 font-medium">{p}</span>)
                          : <span className="text-sm text-gray-400">—</span>
                        }
                      </div>

                      <div className="col-span-2">
                        <span className={`badge text-xs ${risco.badge}`}>{risco.label}</span>
                        <p className="text-xs text-gray-400 mt-1">{g.maxDias} dia{g.maxDias !== 1 ? 's' : ''}</p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-sm text-gray-700">{g.pagamentos.length} pagamento{g.pagamentos.length > 1 ? 's' : ''}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          desde {formatDate(g.pagamentos[0].data_vencimento)}
                        </p>
                      </div>

                      <div className="col-span-2 text-right">
                        <p className="text-sm font-bold text-red-600">{formatCurrency(g.totalDevido)}</p>
                      </div>

                      <div className="col-span-1 flex justify-end">
                        {waLink ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors"
                            title="Cobrar via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Cobrar
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">Sem telefone</span>
                        )}
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
