export const dynamic = 'force-dynamic'

import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Trophy, Car, ExternalLink } from 'lucide-react'
import Link from 'next/link'

// Meses completos entre duas datas
function mesesEntre(dataInicio: string, hoje: Date): number {
  const ini = new Date(dataInicio + 'T12:00:00')
  const meses = (hoje.getFullYear() - ini.getFullYear()) * 12 + (hoje.getMonth() - ini.getMonth())
  return Math.max(1, meses)
}

export default async function RentabilidadePage() {
  noStore()
  const supabase = createClient()

  const hoje = new Date()

  const [
    { data: veiculos },
    { data: contratos },
    { data: pagamentosPagos },
    { data: todosPagamentos },
    { data: todasDespesas },
    { data: quilometragem },
  ] = await Promise.all([
    supabase.from('veiculos').select('id, placa, marca, modelo, ano, status, valor_compra').order('placa'),
    supabase.from('contratos').select('id, veiculo_id, motorista:users!motorista_id(nome), data_inicio').order('data_inicio', { ascending: false }),
    supabase.from('pagamentos').select('valor, contrato_id').eq('status', 'pago'),
    supabase.from('pagamentos').select('contrato_id, data_vencimento'),
    supabase.from('despesas').select('veiculo_id, valor'),
    supabase.from('quilometragem').select('veiculo_id, km_atual'),
  ])

  // Motorista atual por veículo (contrato mais recente)
  const motoristaPorVeiculo: Record<string, string> = {}
  // Primeiro contrato por veículo (para meses em operação)
  const primeiroContratoPorVeiculo: Record<string, string> = {}
  for (const c of [...(contratos ?? [])].reverse()) {
    const mot = c.motorista as { nome: string } | null
    if (mot?.nome) motoristaPorVeiculo[c.veiculo_id] = mot.nome
    primeiroContratoPorVeiculo[c.veiculo_id] = c.data_inicio
  }
  // Restaura o mais recente como motorista atual
  for (const c of contratos ?? []) {
    const mot = c.motorista as { nome: string } | null
    if (!motoristaPorVeiculo[c.veiculo_id] && mot?.nome) motoristaPorVeiculo[c.veiculo_id] = mot.nome
    break
  }
  // Corrige: motorista atual = primeiro da lista (já ordenada desc)
  const motoristaAtualPorVeiculo: Record<string, string> = {}
  for (const c of contratos ?? []) {
    if (!motoristaAtualPorVeiculo[c.veiculo_id]) {
      const mot = c.motorista as { nome: string } | null
      if (mot?.nome) motoristaAtualPorVeiculo[c.veiculo_id] = mot.nome
    }
  }

  // contrato_id → veiculo_id
  const veiculoPorContrato: Record<string, string> = {}
  for (const c of contratos ?? []) veiculoPorContrato[c.id] = c.veiculo_id

  // Receita e despesa por veículo
  const receitaPorVeiculo: Record<string, number> = {}
  for (const p of pagamentosPagos ?? []) {
    const vid = veiculoPorContrato[p.contrato_id]
    if (!vid) continue
    receitaPorVeiculo[vid] = (receitaPorVeiculo[vid] ?? 0) + Number(p.valor)
  }

  const despesaPorVeiculo: Record<string, number> = {}
  for (const d of todasDespesas ?? []) {
    if (!d.veiculo_id) continue
    despesaPorVeiculo[d.veiculo_id] = (despesaPorVeiculo[d.veiculo_id] ?? 0) + Number(d.valor)
  }

  // Meses com pagamento por veículo (para taxa de ocupação)
  const mesesComPagamento: Record<string, Set<string>> = {}
  for (const p of todosPagamentos ?? []) {
    const vid = veiculoPorContrato[p.contrato_id]
    if (!vid) continue
    const chave = p.data_vencimento?.substring(0, 7) // "2025-03"
    if (chave) {
      if (!mesesComPagamento[vid]) mesesComPagamento[vid] = new Set()
      mesesComPagamento[vid].add(chave)
    }
  }

  // KM por veículo (min e max)
  const kmPorVeiculo: Record<string, { min: number; max: number }> = {}
  for (const q of quilometragem ?? []) {
    const km = Number(q.km_atual)
    if (!kmPorVeiculo[q.veiculo_id]) {
      kmPorVeiculo[q.veiculo_id] = { min: km, max: km }
    } else {
      if (km < kmPorVeiculo[q.veiculo_id].min) kmPorVeiculo[q.veiculo_id].min = km
      if (km > kmPorVeiculo[q.veiculo_id].max) kmPorVeiculo[q.veiculo_id].max = km
    }
  }

  // Monta ranking
  const ranking = (veiculos ?? []).map(v => {
    const receita    = receitaPorVeiculo[v.id] ?? 0
    const despesa    = despesaPorVeiculo[v.id] ?? 0
    const lucro      = receita - despesa
    const margem     = receita > 0 ? (lucro / receita) * 100 : null
    const valorCompra = v.valor_compra as number | null

    // ROI %
    const roi = (valorCompra && valorCompra > 0) ? (lucro / valorCompra) * 100 : null

    // Meses em operação e lucro mensal
    const primeiroContrato = primeiroContratoPorVeiculo[v.id]
    const mesesOperacao    = primeiroContrato ? mesesEntre(primeiroContrato, hoje) : null
    const lucroMensal      = (mesesOperacao && mesesOperacao > 0) ? lucro / mesesOperacao : null

    // Taxa de ocupação
    const mesesOcupados = mesesComPagamento[v.id]?.size ?? 0
    const taxaOcupacao  = (mesesOperacao && mesesOperacao > 0 && mesesOcupados > 0)
      ? Math.min(100, (mesesOcupados / mesesOperacao) * 100)
      : null

    // Custo por km
    const kmData    = kmPorVeiculo[v.id]
    const kmRodado  = kmData ? kmData.max - kmData.min : null
    const custoPorKm = (kmRodado && kmRodado > 0 && despesa > 0)
      ? despesa / kmRodado
      : null

    return {
      id:            v.id,
      placa:         v.placa,
      nome:          `${v.marca} ${v.modelo}`,
      ano:           v.ano,
      status:        v.status,
      valorCompra,
      motorista:     motoristaAtualPorVeiculo[v.id] ?? null,
      receita,
      despesa,
      lucro,
      margem,
      roi,
      mesesOperacao,
      lucroMensal,
      taxaOcupacao,
      custoPorKm,
      kmRodado,
    }
  }).sort((a, b) => b.lucro - a.lucro)

  const comReceita   = ranking.filter(v => v.receita > 0)
  const maxLucro     = Math.max(...ranking.map(v => v.lucro), 1)
  const minLucro     = Math.min(...ranking.map(v => v.lucro), 0)
  const mediaLucro   = comReceita.length > 0 ? comReceita.reduce((s, v) => s + v.lucro, 0) / comReceita.length : 0
  const totalReceita = ranking.reduce((s, v) => s + v.receita, 0)
  const totalDespesa = ranking.reduce((s, v) => s + v.despesa, 0)
  const totalLucro   = totalReceita - totalDespesa

  const melhor = ranking[0]
  const pior   = ranking[ranking.length - 1]

  function badgePerformance(lucro: number, receita: number) {
    if (receita === 0) return { label: 'Sem receita', classes: 'bg-gray-100 text-gray-500' }
    if (lucro > mediaLucro * 1.1) return { label: 'Acima da média', classes: 'bg-emerald-100 text-emerald-700' }
    if (lucro < mediaLucro * 0.9) return { label: 'Abaixo da média', classes: 'bg-red-100 text-red-600' }
    return { label: 'Na média', classes: 'bg-yellow-100 text-yellow-700' }
  }

  function barWidth(lucro: number): number {
    if (lucro >= 0) return maxLucro > 0 ? (lucro / maxLucro) * 100 : 0
    return minLucro < 0 ? (Math.abs(lucro) / Math.abs(minLucro)) * 100 : 0
  }

  const medalhas = ['🥇', '🥈', '🥉']

  return (
    <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Rentabilidade</h1>
        <p className="text-gray-500 text-sm mt-0.5">Análise de retorno por veículo — acumulado desde o início</p>
      </div>

      {ranking.length === 0 ? (
        <div className="card py-20 text-center">
          <Car className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Nenhum veículo cadastrado</p>
        </div>
      ) : (
        <>
          {/* Cards de resumo da frota */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Receita total</p>
              <p className="text-base md:text-xl font-bold text-emerald-600 truncate">{formatCurrency(totalReceita)}</p>
              <p className="text-xs text-gray-400 mt-1">todos os veículos</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Despesa total</p>
              <p className="text-base md:text-xl font-bold text-red-500 truncate">{formatCurrency(totalDespesa)}</p>
              <p className="text-xs text-gray-400 mt-1">todos os veículos</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Lucro líquido</p>
              <p className={`text-base md:text-xl font-bold truncate ${totalLucro >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(totalLucro)}
              </p>
              <p className="text-xs text-gray-400 mt-1">frota inteira</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Lucro médio/mês</p>
              {(() => {
                const comMes = ranking.filter(v => v.lucroMensal !== null)
                const media  = comMes.length > 0 ? comMes.reduce((s, v) => s + (v.lucroMensal ?? 0), 0) / comMes.length : null
                return media !== null
                  ? <p className={`text-base md:text-xl font-bold truncate ${media >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{formatCurrency(media)}</p>
                  : <p className="text-base font-bold text-gray-300">—</p>
              })()}
              <p className="text-xs text-gray-400 mt-1">por veículo</p>
            </div>
          </div>

          {/* Destaque melhor e pior */}
          {comReceita.length >= 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-4 border-l-4 border-emerald-400">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Melhor desempenho</p>
                </div>
                <p className="text-base font-bold text-gray-900">{melhor.placa} <span className="font-normal text-gray-500 text-sm">— {melhor.nome}</span></p>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">{formatCurrency(melhor.lucro)}</p>
                <div className="flex gap-3 mt-1 flex-wrap">
                  {melhor.margem !== null && <p className="text-xs text-gray-400">{melhor.margem.toFixed(1)}% margem</p>}
                  {melhor.roi !== null && <p className="text-xs text-gray-400">ROI {melhor.roi.toFixed(0)}%</p>}
                  {melhor.lucroMensal !== null && <p className="text-xs text-gray-400">{formatCurrency(melhor.lucroMensal)}/mês</p>}
                </div>
              </div>
              <div className="card p-4 border-l-4 border-red-300">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Menor desempenho</p>
                </div>
                <p className="text-base font-bold text-gray-900">{pior.placa} <span className="font-normal text-gray-500 text-sm">— {pior.nome}</span></p>
                <p className={`text-xl font-extrabold mt-1 ${pior.lucro >= 0 ? 'text-gray-700' : 'text-red-600'}`}>
                  {formatCurrency(pior.lucro)}
                </p>
                <div className="flex gap-3 mt-1 flex-wrap">
                  {pior.margem !== null && <p className="text-xs text-gray-400">{pior.margem.toFixed(1)}% margem</p>}
                  {pior.roi !== null && <p className="text-xs text-gray-400">ROI {pior.roi.toFixed(0)}%</p>}
                  {pior.lucroMensal !== null && <p className="text-xs text-gray-400">{formatCurrency(pior.lucroMensal)}/mês</p>}
                </div>
              </div>
            </div>
          )}

          {/* Ranking visual */}
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-gray-100">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Ranking de rentabilidade</h2>
              <span className="ml-auto text-xs text-gray-400">{ranking.length} veículos</span>
            </div>

            <div className="divide-y divide-gray-50">
              {ranking.map((v, idx) => {
                const badge    = badgePerformance(v.lucro, v.receita)
                const bw       = barWidth(v.lucro)
                const positivo = v.lucro >= 0

                return (
                  <div key={v.id} className="px-4 sm:px-5 py-4">
                    {/* Header da linha */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex-shrink-0 w-8 text-center">
                          {idx < 3
                            ? <span className="text-xl leading-none">{medalhas[idx]}</span>
                            : <span className="text-sm font-bold text-gray-300 leading-8">#{idx + 1}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/gestor/veiculos/${v.id}`}
                              className="text-sm font-bold text-gray-900 hover:text-blue-600 font-mono tracking-wider group flex items-center gap-1"
                            >
                              {v.placa}
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity" />
                            </Link>
                            <span className="badge text-xs bg-gray-100 text-gray-500">{v.nome}</span>
                            <span className={`badge text-xs ${badge.classes}`}>{badge.label}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {v.motorista ? `Motorista: ${v.motorista}` : 'Sem motorista ativo'}
                            {v.ano ? ` · ${v.ano}` : ''}
                            {v.mesesOperacao ? ` · ${v.mesesOperacao} meses em operação` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Lucro destaque */}
                      <div className="text-right flex-shrink-0">
                        <p className={`text-base font-extrabold ${positivo ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(v.lucro)}
                        </p>
                        {v.margem !== null && (
                          <p className="text-xs text-gray-400">{v.margem.toFixed(1)}% margem</p>
                        )}
                      </div>
                    </div>

                    {/* Barra de lucro */}
                    <div className="pl-11">
                      <div className="mb-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${positivo ? 'bg-emerald-400' : 'bg-red-400'}`}
                            style={{ width: `${Math.max(bw, 2)}%` }}
                          />
                        </div>
                      </div>

                      {/* Linha 1: financeiros */}
                      <div className="flex gap-4 text-xs text-gray-500 flex-wrap mb-2">
                        <span>Receita: <span className="font-semibold text-emerald-600">{formatCurrency(v.receita)}</span></span>
                        <span>Despesas: <span className="font-semibold text-red-500">{formatCurrency(v.despesa)}</span></span>
                        {v.valorCompra && v.valorCompra > 0 && (
                          <span>Investimento: <span className="font-semibold text-gray-600">{formatCurrency(v.valorCompra)}</span></span>
                        )}
                        {totalReceita > 0 && v.receita > 0 && (
                          <span>Participação: <span className="font-semibold text-blue-500">{((v.receita / totalReceita) * 100).toFixed(1)}% da receita</span></span>
                        )}
                      </div>

                      {/* Linha 2: novos indicadores de retorno */}
                      {(v.roi !== null || v.lucroMensal !== null || v.taxaOcupacao !== null || v.custoPorKm !== null) && (
                        <div className="flex gap-2 flex-wrap mt-1">
                          {v.roi !== null && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${v.roi >= 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
                              ROI {v.roi >= 0 ? '+' : ''}{v.roi.toFixed(0)}%
                            </span>
                          )}
                          {v.lucroMensal !== null && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${v.lucroMensal >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              {formatCurrency(v.lucroMensal)}/mês
                            </span>
                          )}
                          {v.taxaOcupacao !== null && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${v.taxaOcupacao >= 80 ? 'bg-emerald-50 text-emerald-700' : v.taxaOcupacao >= 60 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>
                              {v.taxaOcupacao.toFixed(0)}% ocupação
                            </span>
                          )}
                          {v.custoPorKm !== null && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              R$ {v.custoPorKm.toFixed(2)}/km
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Insight — veículos abaixo da média */}
          {comReceita.filter(v => v.lucro < mediaLucro * 0.9).length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800 mb-1">
                ⚠️ {comReceita.filter(v => v.lucro < mediaLucro * 0.9).length} veículo(s) abaixo da média da frota
              </p>
              <p className="text-xs text-amber-700">
                {comReceita.filter(v => v.lucro < mediaLucro * 0.9).map(v => v.placa).join(', ')} — considere revisar as despesas ou a rentabilidade desses contratos.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
