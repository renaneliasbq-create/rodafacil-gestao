export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, MESES } from '@/lib/utils'
import { DashboardChart } from '@/components/gestor/dashboard-chart'
import { PeriodSelector, type PeriodoValue } from '@/components/gestor/period-selector'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, Users, Car, AlertCircle,
  ArrowUpRight, ArrowDownRight, CheckCircle2, Bell,
  MessageCircle, Trophy,
} from 'lucide-react'
import { Suspense } from 'react'

// ── Helpers de data ───────────────────────────────────────────────

function calcularIntervalo(periodo: PeriodoValue): {
  inicio: string; fim: string
  inicioAnterior: string; fimAnterior: string
  mesesGrafico: number; labelPeriodo: string
} {
  const hoje = new Date()
  const ano  = hoje.getFullYear()
  const mes  = hoje.getMonth() + 1
  const pad  = (n: number) => String(n).padStart(2, '0')
  const ultimoDia = (a: number, m: number) => new Date(a, m, 0).getDate()

  switch (periodo) {
    case 'mes_anterior': {
      const mA = mes === 1 ? 12 : mes - 1; const aA = mes === 1 ? ano - 1 : ano
      const mA2 = mA === 1 ? 12 : mA - 1;  const aA2 = mA === 1 ? aA - 1 : aA
      return {
        inicio: `${aA}-${pad(mA)}-01`, fim: `${aA}-${pad(mA)}-${ultimoDia(aA, mA)}`,
        inicioAnterior: `${aA2}-${pad(mA2)}-01`, fimAnterior: `${aA2}-${pad(mA2)}-${ultimoDia(aA2, mA2)}`,
        mesesGrafico: 6, labelPeriodo: `${MESES[mA - 1]}/${aA}`,
      }
    }
    case 'ultimos_3': {
      const d = new Date(ano, mes - 3, 1)
      return {
        inicio: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`, fim: `${ano}-${pad(mes)}-${ultimoDia(ano, mes)}`,
        inicioAnterior: (() => { const d2 = new Date(ano, mes - 6, 1); return `${d2.getFullYear()}-${pad(d2.getMonth() + 1)}-01` })(),
        fimAnterior: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${ultimoDia(d.getFullYear(), d.getMonth() + 1)}`,
        mesesGrafico: 3, labelPeriodo: 'Últimos 3 meses',
      }
    }
    case 'ultimos_6': {
      const d = new Date(ano, mes - 6, 1)
      return {
        inicio: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`, fim: `${ano}-${pad(mes)}-${ultimoDia(ano, mes)}`,
        inicioAnterior: (() => { const d2 = new Date(ano, mes - 12, 1); return `${d2.getFullYear()}-${pad(d2.getMonth() + 1)}-01` })(),
        fimAnterior: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${ultimoDia(d.getFullYear(), d.getMonth() + 1)}`,
        mesesGrafico: 6, labelPeriodo: 'Últimos 6 meses',
      }
    }
    case 'ano_atual':
      return {
        inicio: `${ano}-01-01`, fim: `${ano}-${pad(mes)}-${ultimoDia(ano, mes)}`,
        inicioAnterior: `${ano - 1}-01-01`, fimAnterior: `${ano - 1}-${pad(mes)}-${ultimoDia(ano - 1, mes)}`,
        mesesGrafico: mes, labelPeriodo: `Ano ${ano}`,
      }
    default: {
      const mA = mes === 1 ? 12 : mes - 1; const aA = mes === 1 ? ano - 1 : ano
      return {
        inicio: `${ano}-${pad(mes)}-01`, fim: `${ano}-${pad(mes)}-${ultimoDia(ano, mes)}`,
        inicioAnterior: `${aA}-${pad(mA)}-01`, fimAnterior: `${aA}-${pad(mA)}-${ultimoDia(aA, mA)}`,
        mesesGrafico: 6, labelPeriodo: `${MESES[mes - 1]}/${ano}`,
      }
    }
  }
}

function gerarMesesGrafico(qtd: number): { mes: string; ini: string; fim: string }[] {
  const hoje = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return Array.from({ length: qtd }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (qtd - 1 - i), 1)
    const m = d.getMonth() + 1; const a = d.getFullYear()
    return { mes: `${MESES[m - 1]}/${String(a).slice(2)}`, ini: `${a}-${pad(m)}-01`, fim: `${a}-${pad(m)}-${new Date(a, m, 0).getDate()}` }
  })
}

function diasAtraso(dataVencimento: string): number {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const venc = new Date(dataVencimento + 'T12:00:00')
  return Math.max(0, Math.floor((hoje.getTime() - venc.getTime()) / 86_400_000))
}

function diasParaVencer(dataVencimento: string): number {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const venc = new Date(dataVencimento + 'T12:00:00')
  return Math.floor((venc.getTime() - hoje.getTime()) / 86_400_000)
}

function whatsappUrl(telefone: string | null | undefined, nome: string, valor: number, dias: number): string | null {
  if (!telefone) return null
  const num = telefone.replace(/\D/g, '')
  const intl = num.startsWith('55') ? num : `55${num}`
  if (intl.length < 12) return null
  const msg = encodeURIComponent(
    `Olá ${nome}, identificamos um pagamento em atraso de ${formatCurrency(valor)}${dias > 0 ? ` (${dias} dia${dias > 1 ? 's' : ''})` : ''}. Podemos resolver? 🙏`
  )
  return `https://wa.me/${intl}?text=${msg}`
}

const TIPO_LABELS: Record<string, string> = {
  crlv: 'CRLV', seguro: 'Seguro', ipva: 'IPVA',
  revisao: 'Revisão', licenca: 'Licença', cnh: 'CNH', outro: 'Outro',
}

// ── Variação comparativa ──────────────────────────────────────────

function Variacao({ pct, valorDiff, inverter = false }: { pct: number; valorDiff?: number; inverter?: boolean }) {
  const positivo = inverter ? pct <= 0 : pct >= 0
  return (
    <div className="flex items-center gap-1 mt-3 flex-wrap">
      {positivo
        ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        : <ArrowDownRight className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
      <span className={`text-xs font-semibold ${positivo ? 'text-emerald-600' : 'text-red-600'}`}>
        {Math.abs(pct).toFixed(1)}%
      </span>
      {valorDiff !== undefined && (
        <span className="text-xs text-gray-400">
          ({valorDiff >= 0 ? '+' : ''}{formatCurrency(valorDiff)})
        </span>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────

export default async function GestorDashboardPage({
  searchParams,
}: {
  searchParams: { periodo?: string; de?: string; ate?: string }
}) {
  const periodo = (searchParams.periodo ?? 'mes_atual') as PeriodoValue

  // Período personalizado: usa as datas direto dos searchParams
  let inicio: string, fim: string, inicioAnterior: string, fimAnterior: string
  let mesesGrafico: number, labelPeriodo: string

  if (periodo === 'personalizado' && searchParams.de && searchParams.ate) {
    inicio = searchParams.de
    fim    = searchParams.ate
    // Período anterior com a mesma duração
    const diffMs  = new Date(fim + 'T12:00:00').getTime() - new Date(inicio + 'T12:00:00').getTime()
    const diffDias = Math.round(diffMs / 86_400_000)
    fimAnterior    = new Date(new Date(inicio + 'T12:00:00').getTime() - 86_400_000).toISOString().split('T')[0]
    inicioAnterior = new Date(new Date(inicio + 'T12:00:00').getTime() - (diffDias + 1) * 86_400_000).toISOString().split('T')[0]
    mesesGrafico   = Math.max(2, Math.min(12, Math.ceil(diffDias / 30)))
    labelPeriodo   = `${new Date(inicio + 'T12:00:00').toLocaleDateString('pt-BR')} – ${new Date(fim + 'T12:00:00').toLocaleDateString('pt-BR')}`
  } else {
    const iv = calcularIntervalo(periodo === 'personalizado' ? 'mes_atual' : periodo)
    inicio = iv.inicio; fim = iv.fim
    inicioAnterior = iv.inicioAnterior; fimAnterior = iv.fimAnterior
    mesesGrafico = iv.mesesGrafico; labelPeriodo = iv.labelPeriodo
  }

  const hojeStr   = new Date().toISOString().split('T')[0]
  const quinzeStr = new Date(Date.now() + 15 * 86_400_000).toISOString().split('T')[0]

  const supabase = createClient()

  const [
    { data: pagsPeriodo },
    { data: pagsAnterior },
    { data: contratosAtivos },
    { data: veiculos },
    { data: pagEmAberto },
    { data: despPeriodo },
    { data: despAnterior },
    { data: venc15d },
  ] = await Promise.all([
    // Pagamentos do período (com contrato_id para snapshot de rentabilidade)
    supabase.from('pagamentos').select('valor, status, contrato_id')
      .gte('data_vencimento', inicio).lte('data_vencimento', fim),

    // Pagamentos do período anterior (comparativo)
    supabase.from('pagamentos').select('valor, status')
      .gte('data_vencimento', inicioAnterior).lte('data_vencimento', fimAnterior),

    // Contratos ativos com motorista e veículo (para ranking + ocupação)
    supabase.from('contratos')
      .select('id, motorista_id, veiculo_id, motorista:users!motorista_id(id, nome, telefone), veiculo:veiculos!veiculo_id(placa, modelo)')
      .eq('status', 'ativo'),

    // Frota completa
    supabase.from('veiculos').select('id, placa, modelo, status'),

    // Pagamentos pendentes e atrasados (inadimplência + alertas + ranking)
    supabase.from('pagamentos')
      .select('id, valor, status, data_vencimento, motorista_id, contrato_id, motorista:users!motorista_id(nome, telefone)')
      .in('status', ['pendente', 'atrasado'])
      .order('data_vencimento', { ascending: true }),

    // Despesas do período (com veiculo_id para rentabilidade)
    supabase.from('despesas').select('valor, veiculo_id')
      .gte('data', inicio).lte('data', fim),

    // Despesas do período anterior (comparativo)
    supabase.from('despesas').select('valor')
      .gte('data', inicioAnterior).lte('data', fimAnterior),

    // Documentos vencendo nos próximos 15 dias
    supabase.from('vencimentos').select('id, tipo, ref_tipo, ref_id, data_vencimento, descricao')
      .gte('data_vencimento', hojeStr).lte('data_vencimento', quinzeStr)
      .order('data_vencimento', { ascending: true }),
  ])

  // ── KPI: Financeiro ────────────────────────────────────────────

  const receitaPeriodo  = (pagsPeriodo  ?? []).filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.valor), 0)
  const receitaAnterior = (pagsAnterior ?? []).filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.valor), 0)
  const varReceita      = receitaAnterior > 0 ? ((receitaPeriodo - receitaAnterior) / receitaAnterior) * 100 : 0

  const despesasPeriodo  = (despPeriodo  ?? []).reduce((s, d) => s + Number(d.valor), 0)
  const despesasAnterior = (despAnterior ?? []).reduce((s, d) => s + Number(d.valor), 0)
  const varDespesas      = despesasAnterior > 0 ? ((despesasPeriodo - despesasAnterior) / despesasAnterior) * 100 : 0

  const lucro  = receitaPeriodo - despesasPeriodo
  const margem = receitaPeriodo > 0 ? (lucro / receitaPeriodo) * 100 : 0

  // ── KPI: Operacional ───────────────────────────────────────────

  const totalVeiculos      = (veiculos ?? []).length
  const veiculosAlugados   = (veiculos ?? []).filter(v => v.status === 'alugado').length
  const veiculosDisponiveis = (veiculos ?? []).filter(v => v.status === 'disponivel').length
  const veiculosManutencao = (veiculos ?? []).filter(v => v.status === 'manutencao').length
  const pctOcupacao        = totalVeiculos > 0 ? (veiculosAlugados / totalVeiculos) * 100 : 0

  const inadimplenciaValor = (pagEmAberto ?? []).reduce((s, p) => s + Number(p.valor), 0)
  const inadimplenciaMots  = new Set((pagEmAberto ?? []).filter(p => p.status === 'atrasado').map(p => p.motorista_id)).size

  const veiculosAtivos = new Set((contratosAtivos ?? []).map(c => c.veiculo_id)).size
  const ticketMedio    = veiculosAtivos > 0 ? receitaPeriodo  / veiculosAtivos : 0
  const ticketAnt      = veiculosAtivos > 0 ? receitaAnterior / veiculosAtivos : 0
  const varTicket      = ticketAnt > 0 ? ((ticketMedio - ticketAnt) / ticketAnt) * 100 : 0

  // ── Gráfico ────────────────────────────────────────────────────

  const mesesParaGrafico = gerarMesesGrafico(mesesGrafico)
  const chartData = await Promise.all(
    mesesParaGrafico.map(async ({ mes, ini, fim: fimM }) => {
      const [{ data: pags }, { data: desps }] = await Promise.all([
        supabase.from('pagamentos').select('valor').eq('status', 'pago')
          .gte('data_vencimento', ini).lte('data_vencimento', fimM),
        supabase.from('despesas').select('valor').gte('data', ini).lte('data', fimM),
      ])
      const receita = pags?.reduce((s, p) => s + Number(p.valor), 0) ?? 0
      const despesa = desps?.reduce((s, d) => s + Number(d.valor), 0) ?? 0
      return { mes, receita, despesa, lucro: receita - despesa }
    })
  )

  // ── Alertas: pagamentos atrasados ─────────────────────────────

  const pagAtrasados = (pagEmAberto ?? []).filter(p => p.status === 'atrasado')

  // ── Alertas: vencimentos de docs ──────────────────────────────

  const veiculoById = Object.fromEntries((veiculos ?? []).map(v => [v.id, v]))
  const motoristaById: Record<string, { nome: string }> = {}
  for (const c of contratosAtivos ?? []) {
    const mot = (Array.isArray(c.motorista) ? c.motorista[0] : c.motorista) as { id: string; nome: string } | null
    if (mot?.id && mot?.nome) motoristaById[c.motorista_id] = mot
  }

  const vencAlertas = (venc15d ?? []).map(v => {
    const dias = diasParaVencer(v.data_vencimento)
    const nome = v.ref_tipo === 'veiculo'
      ? (veiculoById[v.ref_id]?.placa ?? '—')
      : (motoristaById[v.ref_id]?.nome ?? '—')
    return { ...v, dias, nome }
  })

  // ── Snapshot de Rentabilidade (período filtrado) ──────────────

  const veiculoPorContrato: Record<string, string> = {}
  for (const c of contratosAtivos ?? []) veiculoPorContrato[c.id] = c.veiculo_id

  const receitaByVeiculo: Record<string, number> = {}
  for (const p of (pagsPeriodo ?? []).filter(p => p.status === 'pago')) {
    const vid = veiculoPorContrato[p.contrato_id]
    if (vid) receitaByVeiculo[vid] = (receitaByVeiculo[vid] ?? 0) + Number(p.valor)
  }

  const despByVeiculo: Record<string, number> = {}
  for (const d of despPeriodo ?? []) {
    if (d.veiculo_id) despByVeiculo[d.veiculo_id] = (despByVeiculo[d.veiculo_id] ?? 0) + Number(d.valor)
  }

  const veiculoStats = (veiculos ?? [])
    .filter(v => receitaByVeiculo[v.id] || despByVeiculo[v.id])
    .map(v => {
      const rec = receitaByVeiculo[v.id] ?? 0
      const dep = despByVeiculo[v.id] ?? 0
      const luc = rec - dep
      const mar = rec > 0 ? (luc / rec) * 100 : null
      return { ...v, receita: rec, despesa: dep, lucro: luc, margem: mar }
    })
    .sort((a, b) => b.lucro - a.lucro)

  const melhor = veiculoStats[0] ?? null
  const pior   = veiculoStats.length > 1 ? veiculoStats[veiculoStats.length - 1] : null
  const comMargem = veiculoStats.filter(v => v.margem !== null)
  const margemMedia = comMargem.length > 0
    ? comMargem.reduce((s, v) => s + (v.margem ?? 0), 0) / comMargem.length
    : null

  // ── Ranking de Motoristas ─────────────────────────────────────

  const pagPorMotorista: Record<string, NonNullable<typeof pagEmAberto>[number][]> = {}
  for (const p of pagEmAberto ?? []) {
    if (!pagPorMotorista[p.motorista_id]) pagPorMotorista[p.motorista_id] = []
    pagPorMotorista[p.motorista_id].push(p)
  }

  const ranking = (contratosAtivos ?? []).map(c => {
    const motorista = (Array.isArray(c.motorista) ? c.motorista[0] : c.motorista) as { id: string; nome: string; telefone?: string } | null
    const veiculo   = (Array.isArray(c.veiculo)   ? c.veiculo[0]   : c.veiculo)   as { placa: string; modelo: string } | null
    const pags      = pagPorMotorista[c.motorista_id] ?? []

    const atrasado = pags.find(p => p.status === 'atrasado')
    const pendente = pags.find(p => p.status === 'pendente')
    const proximo  = atrasado ?? pendente ?? null

    return {
      contratoId:          c.id,
      motoristaId:         c.motorista_id,
      nome:                motorista?.nome ?? '—',
      telefone:            motorista?.telefone ?? null,
      placa:               veiculo?.placa ?? '—',
      proximo_vencimento:  proximo?.data_vencimento ?? null,
      proximo_valor:       proximo?.valor ? Number(proximo.valor) : null,
      status:              atrasado ? 'atrasado' : pendente ? 'pendente' : 'em_dia' as 'atrasado' | 'pendente' | 'em_dia',
    }
  }).sort((a, b) => {
    const ordem = { atrasado: 0, pendente: 1, em_dia: 2 }
    return (ordem[a.status] - ordem[b.status]) ||
      (a.proximo_vencimento ?? '9').localeCompare(b.proximo_vencimento ?? '9')
  })

  const temAlertas = pagAtrasados.length > 0 || vencAlertas.length > 0

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">{labelPeriodo} — visão geral do negócio</p>
        </div>
        <Suspense>
          <PeriodSelector />
        </Suspense>
      </div>

      {/* ── BLOCO 1: KPIs ──────────────────────────────────────── */}
      <div className="space-y-3">

        {/* Linha A — Financeiro */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">

          {/* Receita */}
          <div className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Receita</p>
                <p className="text-lg lg:text-xl font-bold text-gray-900 mt-1 truncate">{formatCurrency(receitaPeriodo)}</p>
              </div>
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-blue-700" />
              </div>
            </div>
            {receitaAnterior > 0
              ? <Variacao pct={varReceita} valorDiff={receitaPeriodo - receitaAnterior} />
              : <p className="text-xs text-gray-400 mt-3">sem período anterior</p>}
          </div>

          {/* Despesas */}
          <div className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Despesas</p>
                <p className="text-lg lg:text-xl font-bold text-gray-900 mt-1 truncate">{formatCurrency(despesasPeriodo)}</p>
              </div>
              <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
            </div>
            {despesasAnterior > 0
              ? <Variacao pct={varDespesas} inverter />
              : <p className="text-xs text-gray-400 mt-3">vs período anterior</p>}
          </div>

          {/* Lucro */}
          <div className={`card p-4 col-span-2 lg:col-span-1 border-l-4 ${lucro >= 0 ? 'border-emerald-400' : 'border-red-400'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Lucro Líquido</p>
                <p className={`text-lg lg:text-xl font-bold mt-1 truncate ${lucro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(lucro)}
                </p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${lucro >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {lucro >= 0
                  ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                  : <TrendingDown className="w-4 h-4 text-red-600" />}
              </div>
            </div>
            <p className="text-xs mt-3">
              <span className="text-gray-500">Margem: </span>
              <span className={`font-bold ${margem >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {receitaPeriodo > 0 ? `${margem.toFixed(1)}%` : '—'}
              </span>
            </p>
          </div>
        </div>

        {/* Linha B — Operacional */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">

          {/* Inadimplência */}
          <div className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Inadimplência</p>
                <p className={`text-lg lg:text-xl font-bold mt-1 truncate ${inadimplenciaValor > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                  {formatCurrency(inadimplenciaValor)}
                </p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${inadimplenciaValor > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <AlertCircle className={`w-4 h-4 ${inadimplenciaValor > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              {inadimplenciaMots === 0
                ? '✅ Nenhum atraso'
                : `${inadimplenciaMots} motorista${inadimplenciaMots > 1 ? 's' : ''} com atraso`}
            </p>
          </div>

          {/* Ocupação */}
          <div className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ocupação</p>
                <p className={`text-lg lg:text-xl font-bold mt-1 ${
                  totalVeiculos === 0 ? 'text-gray-400'
                  : pctOcupacao >= 100 ? 'text-emerald-600'
                  : pctOcupacao >= 50  ? 'text-yellow-600'
                  : 'text-red-600'
                }`}>
                  {totalVeiculos === 0 ? '—' : `${Math.round(pctOcupacao)}%`}
                </p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                pctOcupacao >= 100 ? 'bg-emerald-100' : pctOcupacao >= 50 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <Car className={`w-4 h-4 ${
                  pctOcupacao >= 100 ? 'text-emerald-600' : pctOcupacao >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              {veiculosAlugados} de {totalVeiculos} alugados
              {veiculosManutencao > 0 && ` · ${veiculosManutencao} manutenção`}
              {veiculosDisponiveis > 0 && ` · ${veiculosDisponiveis} disponível${veiculosDisponiveis > 1 ? 'is' : ''}`}
            </p>
          </div>

          {/* Ticket Médio */}
          <div className="card p-4 col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ticket Médio</p>
                <p className="text-lg lg:text-xl font-bold text-gray-900 mt-1 truncate">
                  {ticketMedio > 0 ? formatCurrency(ticketMedio) : '—'}
                </p>
              </div>
              <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-purple-700" />
              </div>
            </div>
            {ticketAnt > 0
              ? <Variacao pct={varTicket} />
              : <p className="text-xs text-gray-400 mt-3">por veículo ativo</p>}
          </div>
        </div>
      </div>

      {/* ── BLOCO 2: Gráfico ───────────────────────────────────── */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Receita × Despesa × Lucro</h2>
        <DashboardChart data={chartData} />
      </div>

      {/* ── BLOCO 3: Alertas + Rentabilidade ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Painel esquerdo: Alertas */}
        <div className="card">
          <div className="flex items-center gap-2 p-4 border-b border-gray-100">
            <Bell className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Alertas</h2>
            {!temAlertas && (
              <span className="ml-auto text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Tudo em dia
              </span>
            )}
          </div>

          {!temAlertas ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhum alerta pendente</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {/* Pagamentos atrasados */}
              {pagAtrasados.map(p => {
                const mot = (Array.isArray(p.motorista) ? p.motorista[0] : p.motorista) as { nome: string; telefone?: string } | null
                const dias = diasAtraso(p.data_vencimento)
                const waUrl = whatsappUrl(mot?.telefone, mot?.nome ?? '', Number(p.valor), dias)
                return (
                  <div key={p.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{mot?.nome ?? '—'}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(Number(p.valor))} · venc. {formatDate(p.data_vencimento)}
                      </p>
                      <span className="inline-block mt-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        {dias === 0 ? 'Vence hoje' : `${dias}d em atraso`}
                      </span>
                    </div>
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Cobrar via WhatsApp"
                        className="flex-shrink-0 w-8 h-8 bg-green-100 hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </a>
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>
                )
              })}

              {/* Documentos vencendo */}
              {vencAlertas.map(v => {
                const urgente = v.dias <= 7
                const label   = v.dias === 0 ? 'Vence hoje' : `${v.dias}d`
                return (
                  <div key={v.id} className="px-4 py-3 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${urgente ? 'bg-red-100' : 'bg-yellow-100'}`}>
                      <Bell className={`w-4 h-4 ${urgente ? 'text-red-600' : 'text-yellow-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {v.nome} — {TIPO_LABELS[v.tipo] ?? v.tipo}
                      </p>
                      <p className="text-xs text-gray-500">Vence em {formatDate(v.data_vencimento)}</p>
                      <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${urgente ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'}`}>
                        {urgente ? '🔴' : '🟡'} {label}
                      </span>
                    </div>
                    <Link href="/gestor/alertas" className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 pt-1">
                      ver
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Painel direito: Snapshot de Rentabilidade */}
        <div className="card">
          <div className="flex items-center gap-2 p-4 border-b border-gray-100">
            <Trophy className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Rentabilidade da Frota</h2>
            <Link href="/gestor/rentabilidade" className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
              Ver análise completa →
            </Link>
          </div>

          {/* Racional do indicador */}
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">Como funciona:</span> compara o lucro líquido de cada veículo no período — receita recebida menos despesas vinculadas. Quanto maior a margem, maior o retorno sobre o aluguel cobrado.
            </p>
          </div>

          {veiculoStats.length === 0 ? (
            <div className="py-10 text-center">
              <Car className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Sem dados de receita no período</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Melhor veículo */}
              {melhor && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                  <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mb-2">
                    🏆 Melhor desempenho
                  </span>
                  <p className="text-sm font-bold text-gray-900">
                    {melhor.placa} <span className="font-normal text-gray-500">— {melhor.modelo}</span>
                  </p>
                  <p className="text-xl font-extrabold text-emerald-600 mt-1">{formatCurrency(melhor.lucro)}</p>
                  {melhor.margem !== null && (
                    <p className="text-xs text-emerald-600 mt-0.5">{melhor.margem.toFixed(1)}% margem</p>
                  )}
                </div>
              )}

              {/* Pior veículo */}
              {pior && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                  <span className="inline-block text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full mb-2">
                    ⚠️ Atenção
                  </span>
                  <p className="text-sm font-bold text-gray-900">
                    {pior.placa} <span className="font-normal text-gray-500">— {pior.modelo}</span>
                  </p>
                  <p className={`text-xl font-extrabold mt-1 ${pior.lucro >= 0 ? 'text-gray-700' : 'text-red-600'}`}>
                    {formatCurrency(pior.lucro)}
                  </p>
                  {pior.margem !== null && (
                    <p className="text-xs text-gray-500 mt-0.5">{pior.margem.toFixed(1)}% margem</p>
                  )}
                </div>
              )}

              {/* Margem média */}
              {margemMedia !== null && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Margem média da frota</span>
                  <span className={`text-sm font-bold ${margemMedia >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {margemMedia.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── BLOCO 4: Ranking de Motoristas ─────────────────────── */}
      {ranking.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 p-4 border-b border-gray-100">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Ranking de Motoristas</h2>
            <span className="ml-auto text-xs text-gray-400">
              {ranking.length} contrato{ranking.length !== 1 ? 's' : ''} ativo{ranking.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Desktop: tabela */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-12 gap-3 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <span className="col-span-4">Motorista</span>
              <span className="col-span-2">Placa</span>
              <span className="col-span-3">Próx. Vencimento</span>
              <span className="col-span-2">Valor</span>
              <span className="col-span-1">Status</span>
            </div>
            <div className="divide-y divide-gray-50">
              {ranking.map(r => (
                <div key={r.contratoId} className="grid grid-cols-12 gap-3 items-center px-5 py-3">
                  <div className="col-span-4 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.nome}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-mono text-sm font-semibold text-gray-700">{r.placa}</span>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm text-gray-600">
                      {r.proximo_vencimento ? formatDate(r.proximo_vencimento) : '—'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {r.proximo_valor ? formatCurrency(r.proximo_valor) : '—'}
                    </p>
                  </div>
                  <div className="col-span-1">
                    {r.status === 'atrasado' && <span className="badge bg-red-100 text-red-700 text-xs whitespace-nowrap">🔴 Atrasado</span>}
                    {r.status === 'pendente' && <span className="badge bg-yellow-100 text-yellow-700 text-xs whitespace-nowrap">⏳ Pendente</span>}
                    {r.status === 'em_dia'   && <span className="badge bg-emerald-100 text-emerald-700 text-xs whitespace-nowrap">✅ Em dia</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: cards */}
          <div className="sm:hidden divide-y divide-gray-50">
            {ranking.map(r => (
              <div key={r.contratoId} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.nome}</p>
                    <p className="text-xs text-gray-400 font-mono">{r.placa}</p>
                  </div>
                  {r.status === 'atrasado' && <span className="badge bg-red-100 text-red-700 text-xs flex-shrink-0">🔴 Atrasado</span>}
                  {r.status === 'pendente' && <span className="badge bg-yellow-100 text-yellow-700 text-xs flex-shrink-0">⏳ Pendente</span>}
                  {r.status === 'em_dia'   && <span className="badge bg-emerald-100 text-emerald-700 text-xs flex-shrink-0">✅ Em dia</span>}
                </div>
                {r.proximo_vencimento && (
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Venc: {formatDate(r.proximo_vencimento)}</span>
                    {r.proximo_valor && (
                      <span className="font-semibold text-gray-700">{formatCurrency(r.proximo_valor)}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
