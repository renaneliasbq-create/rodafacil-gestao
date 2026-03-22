export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS, MESES } from '@/lib/utils'
import { DashboardChart } from '@/components/gestor/dashboard-chart'
import { PeriodSelector, type PeriodoValue } from '@/components/gestor/period-selector'
import {
  TrendingUp, Users, Car, AlertCircle, CreditCard,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { Suspense } from 'react'

// Calcula intervalo de datas com base no período selecionado
function calcularIntervalo(periodo: PeriodoValue): {
  inicio: string
  fim: string
  inicioAnterior: string
  fimAnterior: string
  mesesGrafico: number
  labelPeriodo: string
} {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth() + 1 // 1-based

  const pad = (n: number) => String(n).padStart(2, '0')
  const ultimoDia = (a: number, m: number) => new Date(a, m, 0).getDate()

  switch (periodo) {
    case 'mes_anterior': {
      const mAnt = mes === 1 ? 12 : mes - 1
      const aAnt = mes === 1 ? ano - 1 : ano
      const mAnt2 = mAnt === 1 ? 12 : mAnt - 1
      const aAnt2 = mAnt === 1 ? aAnt - 1 : aAnt
      return {
        inicio: `${aAnt}-${pad(mAnt)}-01`,
        fim: `${aAnt}-${pad(mAnt)}-${ultimoDia(aAnt, mAnt)}`,
        inicioAnterior: `${aAnt2}-${pad(mAnt2)}-01`,
        fimAnterior: `${aAnt2}-${pad(mAnt2)}-${ultimoDia(aAnt2, mAnt2)}`,
        mesesGrafico: 6,
        labelPeriodo: `${MESES[mAnt - 1]}/${aAnt}`,
      }
    }
    case 'ultimos_3': {
      const d = new Date(ano, mes - 3, 1)
      return {
        inicio: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`,
        fim: `${ano}-${pad(mes)}-${ultimoDia(ano, mes)}`,
        inicioAnterior: (() => { const d2 = new Date(ano, mes - 6, 1); return `${d2.getFullYear()}-${pad(d2.getMonth() + 1)}-01` })(),
        fimAnterior: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${ultimoDia(d.getFullYear(), d.getMonth() + 1)}`,
        mesesGrafico: 3,
        labelPeriodo: 'Últimos 3 meses',
      }
    }
    case 'ultimos_6': {
      const d = new Date(ano, mes - 6, 1)
      return {
        inicio: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`,
        fim: `${ano}-${pad(mes)}-${ultimoDia(ano, mes)}`,
        inicioAnterior: (() => { const d2 = new Date(ano, mes - 12, 1); return `${d2.getFullYear()}-${pad(d2.getMonth() + 1)}-01` })(),
        fimAnterior: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${ultimoDia(d.getFullYear(), d.getMonth() + 1)}`,
        mesesGrafico: 6,
        labelPeriodo: 'Últimos 6 meses',
      }
    }
    case 'ano_atual': {
      return {
        inicio: `${ano}-01-01`,
        fim: `${ano}-${pad(mes)}-${ultimoDia(ano, mes)}`,
        inicioAnterior: `${ano - 1}-01-01`,
        fimAnterior: `${ano - 1}-${pad(mes)}-${ultimoDia(ano - 1, mes)}`,
        mesesGrafico: mes,
        labelPeriodo: `Ano ${ano}`,
      }
    }
    default: { // mes_atual
      const mAnt = mes === 1 ? 12 : mes - 1
      const aAnt = mes === 1 ? ano - 1 : ano
      return {
        inicio: `${ano}-${pad(mes)}-01`,
        fim: `${ano}-${pad(mes)}-${ultimoDia(ano, mes)}`,
        inicioAnterior: `${aAnt}-${pad(mAnt)}-01`,
        fimAnterior: `${aAnt}-${pad(mAnt)}-${ultimoDia(aAnt, mAnt)}`,
        mesesGrafico: 6,
        labelPeriodo: `${MESES[mes - 1]}/${ano}`,
      }
    }
  }
}

// Gera lista de meses para o gráfico
function gerarMesesGrafico(qtd: number): { mes: string; ini: string; fim: string }[] {
  const hoje = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return Array.from({ length: qtd }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (qtd - 1 - i), 1)
    const m = d.getMonth() + 1
    const a = d.getFullYear()
    return {
      mes: `${MESES[m - 1]}/${String(a).slice(2)}`,
      ini: `${a}-${pad(m)}-01`,
      fim: `${a}-${pad(m)}-${new Date(a, m, 0).getDate()}`,
    }
  })
}

export default async function GestorDashboardPage({
  searchParams,
}: {
  searchParams: { periodo?: string }
}) {
  const periodo = (searchParams.periodo ?? 'mes_atual') as PeriodoValue
  const { inicio, fim, inicioAnterior, fimAnterior, mesesGrafico, labelPeriodo } = calcularIntervalo(periodo)

  const supabase = createClient()

  const [
    { data: pagamentosPeriodo },
    { data: pagamentosAnterior },
    { data: contratosAtivos },
    { data: veiculos },
    { data: inadimplentes },
    { data: despesasPeriodo },
    { data: ultimosPagamentos },
  ] = await Promise.all([
    supabase.from('pagamentos').select('valor, status')
      .gte('data_vencimento', inicio).lte('data_vencimento', fim),
    supabase.from('pagamentos').select('valor, status')
      .gte('data_vencimento', inicioAnterior).lte('data_vencimento', fimAnterior),
    supabase.from('contratos').select('motorista_id').eq('status', 'ativo'),
    supabase.from('veiculos').select('status'),
    supabase.from('pagamentos').select('valor').eq('status', 'atrasado'),
    supabase.from('despesas').select('valor')
      .gte('data', inicio).lte('data', fim),
    supabase.from('pagamentos')
      .select('id, valor, status, data_vencimento, motorista:users(nome)')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  // KPIs
  const receitaPeriodo = pagamentosPeriodo
    ?.filter(p => p.status === 'pago')
    .reduce((s, p) => s + p.valor, 0) ?? 0

  const receitaAnterior = pagamentosAnterior
    ?.filter(p => p.status === 'pago')
    .reduce((s, p) => s + p.valor, 0) ?? 0

  const variacaoReceita = receitaAnterior > 0
    ? ((receitaPeriodo - receitaAnterior) / receitaAnterior) * 100
    : 0

  const motoristasAtivos = new Set(contratosAtivos?.map(c => c.motorista_id)).size
  const totalVeiculos = veiculos?.length ?? 0
  const veiculosAlugados = veiculos?.filter(v => v.status === 'alugado').length ?? 0
  const veiculosDisponiveis = veiculos?.filter(v => v.status === 'disponivel').length ?? 0
  const veiculosManutencao = veiculos?.filter(v => v.status === 'manutencao').length ?? 0
  const inadimplenciaQtd = inadimplentes?.length ?? 0
  const inadimplenciaValor = inadimplentes?.reduce((s, p) => s + p.valor, 0) ?? 0
  const despesasMes = despesasPeriodo?.reduce((s, d) => s + d.valor, 0) ?? 0
  const lucroEstimado = receitaPeriodo - despesasMes

  // Gráfico
  const mesesParaGrafico = gerarMesesGrafico(mesesGrafico)
  const chartData = await Promise.all(
    mesesParaGrafico.map(async ({ mes, ini, fim: fimM }) => {
      const [{ data: pags }, { data: desps }] = await Promise.all([
        supabase.from('pagamentos').select('valor').eq('status', 'pago')
          .gte('data_vencimento', ini).lte('data_vencimento', fimM),
        supabase.from('despesas').select('valor').gte('data', ini).lte('data', fimM),
      ])
      return {
        mes,
        receita: pags?.reduce((s, p) => s + p.valor, 0) ?? 0,
        despesa: desps?.reduce((s, d) => s + d.valor, 0) ?? 0,
      }
    })
  )

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header com seletor */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">{labelPeriodo} — visão geral do negócio</p>
        </div>
        <Suspense>
          <PeriodSelector />
        </Suspense>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Receita</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(receitaPeriodo)}</p>
            </div>
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-blue-700" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            {variacaoReceita >= 0
              ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
            <span className={`text-xs font-semibold ${variacaoReceita >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {Math.abs(variacaoReceita).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">vs período anterior</span>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Motoristas ativos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{motoristasAtivos}</p>
            </div>
            <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">com contrato ativo</p>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Frota</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalVeiculos}</p>
            </div>
            <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Car className="w-4 h-4 text-purple-700" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-gray-400">{veiculosAlugados} alugados</span>
            {veiculosManutencao > 0 && (
              <span className="text-xs text-orange-500">· {veiculosManutencao} manutenção</span>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Inadimplência</p>
              <p className={`text-2xl font-bold mt-1 ${inadimplenciaValor > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatCurrency(inadimplenciaValor)}
              </p>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${inadimplenciaValor > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertCircle className={`w-4 h-4 ${inadimplenciaValor > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">{inadimplenciaQtd} pagamento{inadimplenciaQtd !== 1 ? 's' : ''} em atraso</p>
        </div>
      </div>

      {/* Gráfico + Resumo financeiro */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Receita × Despesa</h2>
          <DashboardChart data={chartData} />
        </div>

        <div className="card p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">Resumo do período</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-sm text-gray-600">Receita</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(receitaPeriodo)}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">Despesas</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(despesasMes)}</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-sm font-semibold text-gray-700">Lucro estimado</span>
              <span className={`text-sm font-bold ${lucroEstimado >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(lucroEstimado)}
              </span>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Status da frota</p>
            <div className="space-y-2">
              {[
                { label: 'Alugados',    count: veiculosAlugados,    color: 'bg-blue-500' },
                { label: 'Disponíveis', count: veiculosDisponiveis,  color: 'bg-emerald-500' },
                { label: 'Manutenção',  count: veiculosManutencao,  color: 'bg-orange-400' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Atividade recente */}
      <div className="card">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Atividade recente</h2>
          <span className="ml-auto text-xs text-gray-400">últimos lançamentos</span>
        </div>
        {ultimosPagamentos && ultimosPagamentos.length > 0 ? (
          <>
            <div className="hidden sm:grid grid-cols-4 gap-4 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <span className="col-span-2">Motorista / Vencimento</span>
              <span>Status</span>
              <span className="text-right">Valor</span>
            </div>
            <div className="divide-y divide-gray-50">
              {ultimosPagamentos.map((p) => {
                const motorista = (Array.isArray(p.motorista) ? p.motorista[0] : p.motorista) as { nome: string } | null
                return (
                  <div key={p.id} className="grid grid-cols-4 gap-4 items-center px-5 py-3">
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-900">{motorista?.nome ?? '—'}</p>
                      <p className="text-xs text-gray-400">Venc. {formatDate(p.data_vencimento)}</p>
                    </div>
                    <div>
                      <span className={`badge ${STATUS_COLORS[p.status as keyof typeof STATUS_COLORS]}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 text-right">{formatCurrency(p.valor)}</p>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="py-14 text-center">
            <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nenhum lançamento ainda</p>
          </div>
        )}
      </div>
    </div>
  )
}
