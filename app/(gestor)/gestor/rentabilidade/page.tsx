export const dynamic = 'force-dynamic'

import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Trophy, Car, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function RentabilidadePage() {
  noStore()
  const supabase = createClient()

  const [
    { data: veiculos },
    { data: contratos },
    { data: pagamentosPagos },
    { data: todasDespesas },
  ] = await Promise.all([
    supabase.from('veiculos').select('id, placa, marca, modelo, ano, status, valor_compra').order('placa'),
    supabase.from('contratos').select('id, veiculo_id, motorista_id, motorista:users!motorista_id(nome), data_inicio').order('data_inicio', { ascending: false }),
    supabase.from('pagamentos').select('valor, contrato_id').eq('status', 'pago'),
    supabase.from('despesas').select('veiculo_id, valor'),
  ])

  // Motorista atual por veículo (contrato mais recente)
  const motoristaPorVeiculo: Record<string, string> = {}
  for (const c of contratos ?? []) {
    if (!motoristaPorVeiculo[c.veiculo_id]) {
      const mot = c.motorista as { nome: string } | null
      if (mot?.nome) motoristaPorVeiculo[c.veiculo_id] = mot.nome
    }
  }

  // contrato_id → veiculo_id
  const veiculoPorContrato: Record<string, string> = {}
  for (const c of contratos ?? []) {
    veiculoPorContrato[c.id] = c.veiculo_id
  }

  // Calcula receita e despesa por veículo
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

  // Monta ranking
  const ranking = (veiculos ?? []).map(v => {
    const receita = receitaPorVeiculo[v.id] ?? 0
    const despesa = despesaPorVeiculo[v.id] ?? 0
    const lucro   = receita - despesa
    const margem  = receita > 0 ? (lucro / receita) * 100 : null
    return {
      id:         v.id,
      placa:      v.placa,
      nome:       `${v.marca} ${v.modelo}`,
      ano:        v.ano,
      status:     v.status,
      valorCompra: v.valor_compra as number | null,
      motorista:  motoristaPorVeiculo[v.id] ?? null,
      receita,
      despesa,
      lucro,
      margem,
    }
  }).sort((a, b) => b.lucro - a.lucro)

  const comReceita = ranking.filter(v => v.receita > 0)
  const maxLucro   = Math.max(...ranking.map(v => v.lucro), 1)
  const minLucro   = Math.min(...ranking.map(v => v.lucro), 0)

  // Médias da frota
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

  // Barra proporcional: positivo usa maxLucro como referência, negativo usa minLucro
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
        <p className="text-gray-500 text-sm mt-0.5">Comparativo de lucro por veículo — acumulado desde o início</p>
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
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Média por veículo</p>
              <p className={`text-base md:text-xl font-bold truncate ${mediaLucro >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                {formatCurrency(mediaLucro)}
              </p>
              <p className="text-xs text-gray-400 mt-1">lucro médio</p>
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
                {melhor.margem !== null && (
                  <p className="text-xs text-gray-400 mt-0.5">{melhor.margem.toFixed(1)}% de margem</p>
                )}
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
                {pior.margem !== null && (
                  <p className="text-xs text-gray-400 mt-0.5">{pior.margem.toFixed(1)}% de margem</p>
                )}
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
                const badge = badgePerformance(v.lucro, v.receita)
                const bw    = barWidth(v.lucro)
                const positivo = v.lucro >= 0

                return (
                  <div key={v.id} className="px-4 sm:px-5 py-4">
                    {/* Header da linha */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Posição */}
                        <div className="flex-shrink-0 w-8 text-center">
                          {idx < 3
                            ? <span className="text-xl leading-none">{medalhas[idx]}</span>
                            : <span className="text-sm font-bold text-gray-300 leading-8">#{idx + 1}</span>
                          }
                        </div>
                        {/* Info do veículo */}
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
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all ${positivo ? 'bg-emerald-400' : 'bg-red-400'}`}
                            style={{ width: `${Math.max(bw, 2)}%` }}
                          />
                        </div>
                      </div>

                      {/* Detalhes receita / despesa */}
                      <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                        <span>
                          Receita: <span className="font-semibold text-emerald-600">{formatCurrency(v.receita)}</span>
                        </span>
                        <span>
                          Despesas: <span className="font-semibold text-red-500">{formatCurrency(v.despesa)}</span>
                        </span>
                        {v.valorCompra && v.valorCompra > 0 && (
                          <span>
                            Investimento: <span className="font-semibold text-gray-600">{formatCurrency(v.valorCompra)}</span>
                          </span>
                        )}
                        {totalReceita > 0 && v.receita > 0 && (
                          <span>
                            Participação: <span className="font-semibold text-blue-500">{((v.receita / totalReceita) * 100).toFixed(1)}% da receita</span>
                          </span>
                        )}
                      </div>
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
