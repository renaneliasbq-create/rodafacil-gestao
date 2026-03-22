export const dynamic = 'force-dynamic'

import { unstable_noStore as noStore } from 'next/cache'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, MESES } from '@/lib/utils'
import { FileBarChart, TrendingUp } from 'lucide-react'
import { ExportCSV } from './export-csv'
import { FiltroPeriodo } from './filtro-periodo'

export default async function RelatoriosPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  noStore()
  const supabase = createClient()

  const hoje = new Date()
  const ano = hoje.getFullYear()
  const p = searchParams.p ?? 'ano'

  // Calculate dataInicio and dataFim based on period
  let dataInicio: string
  let dataFim: string
  let periodoLabel: string

  if (p === 's1') {
    dataInicio = `${ano}-01-01`
    dataFim = `${ano}-06-30`
    periodoLabel = `1º Semestre ${ano}`
  } else if (p === 's2') {
    dataInicio = `${ano}-07-01`
    dataFim = `${ano}-12-31`
    periodoLabel = `2º Semestre ${ano}`
  } else if (p === 'mes') {
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const ultimoDia = new Date(ano, hoje.getMonth() + 1, 0).getDate()
    dataInicio = `${ano}-${mes}-01`
    dataFim = `${ano}-${mes}-${ultimoDia}`
    periodoLabel = `${MESES[hoje.getMonth()]} ${ano}`
  } else if (p === 'custom' && searchParams.ini && searchParams.fim) {
    dataInicio = searchParams.ini
    dataFim = searchParams.fim
    periodoLabel = `${formatDate(searchParams.ini)} – ${formatDate(searchParams.fim)}`
  } else {
    // default: ano
    dataInicio = `${ano}-01-01`
    dataFim = `${ano}-12-31`
    periodoLabel = `Ano ${ano}`
  }

  const [
    { data: pagamentos },
    { data: despesas },
    { data: retiradas },
    { data: motoristas },
    { data: veiculos },
    { data: contratos },
    { data: todasDespesas },
  ] = await Promise.all([
    supabase.from('pagamentos')
      .select('*, motorista:users(nome)')
      .gte('data_vencimento', dataInicio)
      .lte('data_vencimento', dataFim)
      .order('data_vencimento', { ascending: false }),
    supabase.from('despesas')
      .select('*, veiculo:veiculos(placa, modelo)')
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: false }),
    supabase.from('retiradas')
      .select('*, motorista:users(nome)')
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: false }),
    supabase.from('users').select('id, nome, email, telefone, cpf, cnh, created_at').eq('tipo', 'motorista').order('nome'),
    supabase.from('veiculos').select('*').order('placa'),
    supabase.from('contratos').select('id, veiculo_id'),
    supabase.from('despesas').select('veiculo_id, valor, descricao'),
  ])

  // Generate months in the selected period
  function getMesesNoPeriodo(ini: string, fim: string) {
    const meses: { ano: number; mes: number; ini: string; fim: string; label: string }[] = []
    const [anoIni, mesIni] = ini.split('-').map(Number)
    const [anoFim, mesFim] = fim.split('-').map(Number)
    let a = anoIni, m = mesIni
    while (a < anoFim || (a === anoFim && m <= mesFim)) {
      const mesStr = String(m).padStart(2, '0')
      const ultimoDia = new Date(a, m, 0).getDate()
      meses.push({
        ano: a, mes: m,
        ini: `${a}-${mesStr}-01`,
        fim: `${a}-${mesStr}-${ultimoDia}`,
        label: `${MESES[m - 1]}${a !== ano ? ` ${a}` : ''}`,
      })
      m++
      if (m > 12) { m = 1; a++ }
    }
    return meses
  }

  const mesesNoPeriodo = getMesesNoPeriodo(dataInicio, dataFim)

  const resumoMensal = mesesNoPeriodo.map(({ ini: ini_, fim: fim_, label }) => {
    const receita = pagamentos
      ?.filter(p => p.status === 'pago' && p.data_vencimento >= ini_ && p.data_vencimento <= fim_)
      .reduce((s, p) => s + p.valor, 0) ?? 0
    const despesa = despesas
      ?.filter(d => d.data >= ini_ && d.data <= fim_)
      .reduce((s, d) => s + d.valor, 0) ?? 0
    const retirada = retiradas
      ?.filter(r => r.data >= ini_ && r.data <= fim_)
      .reduce((s, r) => s + r.valor, 0) ?? 0
    return { mes: label, receita, despesa, retirada, lucro: receita - despesa - retirada }
  }).reverse()

  const totalReceita  = resumoMensal.reduce((s, r) => s + r.receita, 0)
  const totalDespesa  = resumoMensal.reduce((s, r) => s + r.despesa, 0)
  const totalRetirada = resumoMensal.reduce((s, r) => s + r.retirada, 0)
  const totalLucro    = totalReceita - totalDespesa - totalRetirada

  // Resumo de bônus (acumulado desde o início, não filtrado por ano)
  const bonusCombustivel = (todasDespesas ?? [])
    .filter(d => d.descricao === 'Bônus motorista - pagamentos em dia')
    .reduce((s, d) => s + d.valor, 0)
  const bonusNatal = (todasDespesas ?? [])
    .filter(d => d.descricao === 'Bônus de natal - ceia')
    .reduce((s, d) => s + d.valor, 0)
  const totalBonus = bonusCombustivel + bonusNatal

  // Payback por veículo
  const todosPagamentos = pagamentos ?? []
  const paybackPorVeiculo = (veiculos ?? [])
    .filter(v => v.valor_compra != null && v.valor_compra > 0)
    .map(v => {
      const contratosIds = new Set((contratos ?? []).filter(c => c.veiculo_id === v.id).map(c => c.id))
      const receita = todosPagamentos
        .filter(p => p.status === 'pago' && contratosIds.has(p.contrato_id))
        .reduce((s, p) => s + p.valor, 0)
      const despesa = (todasDespesas ?? [])
        .filter(d => d.veiculo_id === v.id)
        .reduce((s, d) => s + d.valor, 0)
      const lucroAcumulado = receita - despesa
      const pct = Math.min(100, Math.max(0, (lucroAcumulado / v.valor_compra) * 100))
      return {
        id: v.id,
        nome: `${v.marca} ${v.modelo}`,
        placa: v.placa,
        valorCompra: v.valor_compra as number,
        receita,
        despesa,
        lucroAcumulado,
        pct,
        pago: lucroAcumulado >= v.valor_compra,
      }
    })

  // Resumo por motorista
  const resumoPorMotorista = (motoristas ?? []).map(m => {
    const recebido  = pagamentos?.filter(p => p.motorista_id === m.id && p.status === 'pago').reduce((s, p) => s + p.valor, 0) ?? 0
    const retirado  = retiradas?.filter(r => r.motorista_id === m.id).reduce((s, r) => s + r.valor, 0) ?? 0
    const pendente  = pagamentos?.filter(p => p.motorista_id === m.id && p.status !== 'pago').reduce((s, p) => s + p.valor, 0) ?? 0
    return { nome: m.nome, recebido, retirado, pendente, saldo: recebido - retirado }
  }).filter(m => m.recebido > 0 || m.retirado > 0)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 text-sm mt-0.5">{periodoLabel}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <ExportCSV
            label="Pagamentos"
            filename={`pagamentos_${ano}.csv`}
            headers={['Motorista', 'Referência', 'Vencimento', 'Pagamento', 'Status', 'Valor']}
            rows={pagamentos?.map(p => {
              const m = (Array.isArray(p.motorista) ? p.motorista[0] : p.motorista) as { nome: string } | null
              return [m?.nome ?? '', p.referencia ?? '', p.data_vencimento, p.data_pagamento ?? '', p.status, String(p.valor)]
            }) ?? []}
          />
          <ExportCSV
            label="Retiradas"
            filename={`retiradas_${ano}.csv`}
            headers={['Motorista', 'Data', 'Observação', 'Valor']}
            rows={retiradas?.map(r => {
              const m = (Array.isArray(r.motorista) ? r.motorista[0] : r.motorista) as { nome: string } | null
              return [m?.nome ?? '', r.data, r.observacao ?? '', String(r.valor)]
            }) ?? []}
          />
          <ExportCSV
            label="Despesas"
            filename={`despesas_${ano}.csv`}
            headers={['Data', 'Categoria', 'Descrição', 'Veículo', 'Valor']}
            rows={despesas?.map(d => {
              const v = (Array.isArray(d.veiculo) ? d.veiculo[0] : d.veiculo) as { placa: string } | null
              return [d.data, d.categoria, d.descricao ?? '', v?.placa ?? '', String(d.valor)]
            }) ?? []}
          />
          <ExportCSV
            label="Motoristas"
            filename={`motoristas_${ano}.csv`}
            headers={['Nome', 'E-mail', 'Telefone', 'CPF', 'CNH', 'Cadastro']}
            rows={motoristas?.map(m => [m.nome, m.email, m.telefone ?? '', m.cpf ?? '', m.cnh ?? '', formatDate(m.created_at)]) ?? []}
          />
        </div>
      </div>

      {/* Filter bar */}
      <div className="card p-4">
        <Suspense>
          <FiltroPeriodo />
        </Suspense>
      </div>

      {/* KPIs do período */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Receita total</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(totalReceita)}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Retiradas</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(totalRetirada)}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Despesas</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalDespesa)}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Lucro líquido</p>
          <p className={`text-2xl font-bold mt-1 ${totalLucro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(totalLucro)}
          </p>
        </div>
      </div>

      {/* Resumo de bônus */}
      {totalBonus > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Bônus concedidos — acumulado</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-1">⛽ Bônus combustível</p>
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(bonusCombustivel)}</p>
              <p className="text-xs text-amber-500 mt-1">Pagamentos em dia · R$ 180 cada</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">🎄 Bônus de natal</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(bonusNatal)}</p>
              <p className="text-xs text-red-400 mt-1">Ceia de natal · R$ 150 cada</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total em bônus</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalBonus)}</p>
              <p className="text-xs text-gray-400 mt-1">Investimento no relacionamento</p>
            </div>
          </div>
        </div>
      )}

      {/* Resumo mensal */}
      <div className="card">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <FileBarChart className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Resumo mensal — {periodoLabel}</h2>
        </div>
        <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
          <span>Mês</span>
          <span className="text-right">Receita</span>
          <span className="text-right">Retiradas</span>
          <span className="text-right">Despesas</span>
          <span className="text-right">Lucro</span>
        </div>
        <div className="divide-y divide-gray-50">
          {resumoMensal.map((r) => (
            <div key={r.mes} className="grid grid-cols-5 gap-4 items-center px-5 py-3">
              <span className="text-sm font-medium text-gray-900">{r.mes}</span>
              <span className="text-sm text-emerald-600 font-semibold text-right">{formatCurrency(r.receita)}</span>
              <span className="text-sm text-purple-600 font-semibold text-right">{formatCurrency(r.retirada)}</span>
              <span className="text-sm text-red-500 font-semibold text-right">{formatCurrency(r.despesa)}</span>
              <span className={`text-sm font-bold text-right ${r.lucro >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {formatCurrency(r.lucro)}
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-4 items-center px-5 py-3.5 bg-gray-50 border-t border-gray-200">
          <span className="text-sm font-bold text-gray-900">Total</span>
          <span className="text-sm font-bold text-emerald-600 text-right">{formatCurrency(totalReceita)}</span>
          <span className="text-sm font-bold text-purple-600 text-right">{formatCurrency(totalRetirada)}</span>
          <span className="text-sm font-bold text-red-500 text-right">{formatCurrency(totalDespesa)}</span>
          <span className={`text-sm font-bold text-right ${totalLucro >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
            {formatCurrency(totalLucro)}
          </span>
        </div>
      </div>

      {/* Resumo por motorista */}
      {resumoPorMotorista.length > 0 && (
        <div className="card">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Resumo por motorista — {periodoLabel}</h2>
          </div>
          <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            <span className="col-span-2">Motorista</span>
            <span className="text-right">Recebido</span>
            <span className="text-right">Retiradas</span>
            <span className="text-right">Saldo</span>
          </div>
          <div className="divide-y divide-gray-50">
            {resumoPorMotorista.map((m) => (
              <div key={m.nome} className="grid grid-cols-5 gap-4 items-center px-5 py-3">
                <span className="text-sm font-medium text-gray-900 col-span-2">{m.nome}</span>
                <span className="text-sm text-emerald-600 font-semibold text-right">{formatCurrency(m.recebido)}</span>
                <span className="text-sm text-purple-600 font-semibold text-right">{formatCurrency(m.retirado)}</span>
                <span className={`text-sm font-bold text-right ${m.saldo >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {formatCurrency(m.saldo)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payback por veículo */}
      {paybackPorVeiculo.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 p-5 border-b border-gray-100">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Payback por veículo</h2>
            <span className="text-xs text-gray-400 ml-1">Acumulado desde o início</span>
          </div>
          <div className="hidden sm:grid grid-cols-6 gap-3 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            <span className="col-span-2">Veículo</span>
            <span className="text-right">Investimento</span>
            <span className="text-right">Receita</span>
            <span className="text-right">Despesas</span>
            <span className="text-right">Recuperado</span>
          </div>
          <div className="divide-y divide-gray-50">
            {paybackPorVeiculo.map(v => (
              <div key={v.id} className="px-5 py-4">
                <div className="grid grid-cols-6 gap-3 items-center mb-2">
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-gray-900">{v.nome}</p>
                    <p className="text-xs text-gray-400 font-mono">{v.placa}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-right">{formatCurrency(v.valorCompra)}</span>
                  <span className="text-sm text-emerald-600 font-semibold text-right">{formatCurrency(v.receita)}</span>
                  <span className="text-sm text-red-500 font-semibold text-right">{formatCurrency(v.despesa)}</span>
                  <div className="text-right">
                    {v.pago ? (
                      <span className="badge bg-emerald-100 text-emerald-700 text-xs">Pago ✓</span>
                    ) : (
                      <span className="text-sm font-bold text-blue-600">{v.pct.toFixed(1)}%</span>
                    )}
                  </div>
                </div>
                {/* Barra de progresso */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${v.pago ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${v.pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Lucro acumulado: <span className={`font-medium ${v.lucroAcumulado >= 0 ? 'text-gray-600' : 'text-red-500'}`}>{formatCurrency(v.lucroAcumulado)}</span>
                  {!v.pago && (
                    <> · Falta recuperar: <span className="font-medium text-gray-600">{formatCurrency(v.valorCompra - v.lucroAcumulado)}</span></>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frota */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Frota — {veiculos?.length ?? 0} veículos</h2>
        </div>
        <div className="hidden sm:grid grid-cols-4 gap-4 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
          <span>Placa</span>
          <span className="col-span-2">Veículo</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-gray-50">
          {veiculos?.map(v => (
            <div key={v.id} className="grid grid-cols-4 gap-4 items-center px-5 py-3">
              <span className="text-sm font-bold tracking-wider text-gray-900">{v.placa}</span>
              <span className="text-sm text-gray-900 col-span-2">{v.marca} {v.modelo} · {v.ano}</span>
              <span className="text-sm text-gray-500">{v.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
