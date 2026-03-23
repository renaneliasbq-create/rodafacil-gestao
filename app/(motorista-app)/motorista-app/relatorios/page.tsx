import { createClient } from '@/lib/supabase/server'
import { BarChart2, TrendingUp, TrendingDown, Gauge, Clock, Target, Award } from 'lucide-react'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const PLATAFORMA_COLORS: Record<string, string> = {
  'Uber':    'bg-black text-white',
  '99':      'bg-yellow-400 text-yellow-900',
  'iFood':   'bg-red-500 text-white',
  'Indrive': 'bg-emerald-600 text-white',
  'Outro':   'bg-gray-400 text-white',
}

function Indicador({
  label, valor, sub, icon: Icon, cor, destaque,
}: {
  label: string
  valor: string
  sub?: string
  icon: React.ElementType
  cor: string
  destaque?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl border p-4 shadow-sm ${destaque ? 'border-emerald-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
          <p className={`text-xl font-extrabold ${destaque ? 'text-emerald-600' : 'text-gray-900'}`}>{valor}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { mes?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Mês selecionado
  const hoje = new Date()
  const [anoStr, mesStr] = (
    searchParams.mes ?? `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  ).split('-')
  const ano = parseInt(anoStr)
  const mes = parseInt(mesStr)
  const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`
  const fimMes    = new Date(ano, mes, 0).toISOString().split('T')[0]
  const mesLabel  = new Date(ano, mes - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())

  // Mês anterior para comparativo
  const mesAnt     = mes === 1 ? 12 : mes - 1
  const anoAnt     = mes === 1 ? ano - 1 : ano
  const inicioAnt  = `${anoAnt}-${String(mesAnt).padStart(2, '0')}-01`
  const fimAnt     = new Date(anoAnt, mesAnt, 0).toISOString().split('T')[0]

  const [
    { data: ganhos },
    { data: despesas },
    { data: kmRows },
    { data: ganhosAnt },
    { data: despesasAnt },
  ] = await Promise.all([
    supabase.from('motorista_ganhos')
      .select('plataforma, valor_bruto, valor_liquido, horas_trabalhadas')
      .eq('motorista_id', user.id).gte('data', inicioMes).lte('data', fimMes),
    supabase.from('motorista_despesas')
      .select('categoria, valor')
      .eq('motorista_id', user.id).gte('data', inicioMes).lte('data', fimMes),
    supabase.from('motorista_quilometragem')
      .select('km_total')
      .eq('motorista_id', user.id).gte('data', inicioMes).lte('data', fimMes),
    supabase.from('motorista_ganhos')
      .select('valor_liquido')
      .eq('motorista_id', user.id).gte('data', inicioAnt).lte('data', fimAnt),
    supabase.from('motorista_despesas')
      .select('valor')
      .eq('motorista_id', user.id).gte('data', inicioAnt).lte('data', fimAnt),
  ])

  // ── Cálculos principais ──────────────────────────────────────
  const totalBruto   = (ganhos ?? []).reduce((s, g) => s + (g.valor_bruto   ?? 0), 0)
  const totalLiq     = (ganhos ?? []).reduce((s, g) => s + (g.valor_liquido ?? 0), 0)
  const totalDesp    = (despesas ?? []).reduce((s, d) => s + (d.valor ?? 0), 0)
  const totalKm      = (kmRows ?? []).reduce((s, r) => s + (r.km_total ?? 0), 0)
  const totalHoras   = (ganhos ?? []).reduce((s, g) => s + (g.horas_trabalhadas ?? 0), 0)
  const lucroReal    = totalLiq - totalDesp
  const margem       = totalBruto > 0 ? (lucroReal / totalBruto) * 100 : 0
  const ganhoPorHora = totalHoras > 0 ? totalLiq / totalHoras : 0
  const custoPorKm   = totalKm   > 0 ? totalDesp / totalKm   : 0
  const lucPorKm     = totalKm   > 0 ? lucroReal  / totalKm  : 0
  const taxaMedia    = totalBruto > 0 ? ((totalBruto - totalLiq) / totalBruto) * 100 : 0

  // Comparativo mês anterior
  const liqAnt  = (ganhosAnt  ?? []).reduce((s, g) => s + (g.valor_liquido ?? 0), 0)
  const despAnt = (despesasAnt ?? []).reduce((s, d) => s + (d.valor        ?? 0), 0)
  const lucroAnt = liqAnt - despAnt
  const varLucro  = lucroAnt > 0 ? ((lucroReal - lucroAnt) / lucroAnt) * 100 : null

  // Por plataforma
  const porPlat: Record<string, { bruto: number; liq: number; horas: number; count: number }> = {}
  for (const g of (ganhos ?? [])) {
    const p = g.plataforma ?? 'Outro'
    if (!porPlat[p]) porPlat[p] = { bruto: 0, liq: 0, horas: 0, count: 0 }
    porPlat[p].bruto += g.valor_bruto      ?? 0
    porPlat[p].liq   += g.valor_liquido    ?? 0
    porPlat[p].horas += g.horas_trabalhadas ?? 0
    porPlat[p].count += 1
  }
  const platsSorted = Object.entries(porPlat).sort((a, b) => b[1].liq - a[1].liq)

  // Por categoria de despesa
  const porCat: Record<string, number> = {}
  for (const d of (despesas ?? [])) {
    const c = d.categoria ?? 'Outros'
    porCat[c] = (porCat[c] ?? 0) + (d.valor ?? 0)
  }
  const catsSorted = Object.entries(porCat).sort((a, b) => b[1] - a[1])

  const temDados = totalBruto > 0 || totalDesp > 0

  return (
    <div className="pb-6">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-400 mt-0.5">{mesLabel}</p>
      </div>

      {!temDados ? (
        <div className="mx-4 flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-3">
            <BarChart2 className="w-7 h-7 text-purple-300" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Sem dados neste mês</p>
          <p className="text-xs text-gray-400 max-w-xs">Registre ganhos e despesas para ver sua análise completa aqui.</p>
        </div>
      ) : (
        <>
          {/* ── Lucro real — destaque ── */}
          <div className="mx-4 mb-4">
            <div className={`rounded-2xl p-5 ${lucroReal >= 0 ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-emerald-200' : 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-200'} shadow-lg`}>
              <p className="text-white/80 text-sm font-medium mb-1">Lucro Real do Mês</p>
              <p className="text-4xl font-extrabold text-white">{fmt(lucroReal)}</p>

              {varLucro !== null && (
                <div className="mt-2 flex items-center gap-1.5">
                  {varLucro >= 0
                    ? <TrendingUp className="w-4 h-4 text-white/80" />
                    : <TrendingDown className="w-4 h-4 text-white/80" />
                  }
                  <p className="text-sm text-white/80">
                    {varLucro >= 0 ? '+' : ''}{varLucro.toFixed(1)}% vs mês anterior
                    {lucroAnt > 0 && <span className="ml-1">({fmt(lucroAnt)})</span>}
                  </p>
                </div>
              )}

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-white/15 rounded-xl px-2 py-2 text-center">
                  <p className="text-white/70 text-[10px] font-medium">Ganho líquido</p>
                  <p className="text-white font-bold text-sm">{fmt(totalLiq)}</p>
                </div>
                <div className="bg-white/15 rounded-xl px-2 py-2 text-center">
                  <p className="text-white/70 text-[10px] font-medium">Despesas</p>
                  <p className="text-white font-bold text-sm">{fmt(totalDesp)}</p>
                </div>
                <div className="bg-white/15 rounded-xl px-2 py-2 text-center">
                  <p className="text-white/70 text-[10px] font-medium">Margem</p>
                  <p className="text-white font-bold text-sm">{margem.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Calculadora de eficiência ── */}
          <div className="px-4 mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Eficiência operacional</p>
            <div className="grid grid-cols-2 gap-2">
              <Indicador
                label="Ganho por hora"
                valor={ganhoPorHora > 0 ? fmt(ganhoPorHora) : '—'}
                sub={totalHoras > 0 ? `${totalHoras.toFixed(1)}h trabalhadas` : 'Sem horas registradas'}
                icon={Clock}
                cor="bg-blue-100 text-blue-600"
              />
              <Indicador
                label="Lucro por KM"
                valor={lucPorKm > 0 ? `R$ ${lucPorKm.toFixed(2)}` : '—'}
                sub={totalKm > 0 ? `${totalKm.toLocaleString('pt-BR')} km rodados` : 'Sem KM registrado'}
                icon={Gauge}
                cor="bg-orange-100 text-orange-500"
              />
              <Indicador
                label="Custo por KM"
                valor={custoPorKm > 0 ? `R$ ${custoPorKm.toFixed(2)}` : '—'}
                sub="despesas / km rodados"
                icon={TrendingDown}
                cor="bg-red-100 text-red-500"
              />
              <Indicador
                label="Taxa média plat."
                valor={taxaMedia > 0 ? `${taxaMedia.toFixed(1)}%` : '—'}
                sub="bruto → líquido"
                icon={Target}
                cor="bg-purple-100 text-purple-600"
              />
            </div>
          </div>

          {/* ── Ranking de plataformas ── */}
          {platsSorted.length > 0 && (
            <div className="px-4 mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Lucro por plataforma</p>
              <div className="space-y-2">
                {platsSorted.map(([plat, v], i) => {
                  const gph = v.horas > 0 ? v.liq / v.horas : null
                  const taxa = v.bruto > 0 ? ((v.bruto - v.liq) / v.bruto * 100) : 0
                  return (
                    <div key={plat} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        {i === 0 && <Award className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PLATAFORMA_COLORS[plat] ?? 'bg-gray-400 text-white'}`}>{plat}</span>
                        <span className="text-xs text-gray-400">{v.count} corrida{v.count !== 1 ? 's' : ''}</span>
                        <span className="ml-auto text-sm font-extrabold text-emerald-600">{fmt(v.liq)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-gray-400">Bruto</p>
                          <p className="text-xs font-semibold text-gray-700">{fmt(v.bruto)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Taxa</p>
                          <p className="text-xs font-semibold text-gray-700">{taxa.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Por hora</p>
                          <p className="text-xs font-semibold text-gray-700">{gph ? fmt(gph) : '—'}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Despesas por categoria ── */}
          {catsSorted.length > 0 && (
            <div className="px-4 mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Composição das despesas</p>
              <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm space-y-2.5">
                {catsSorted.map(([cat, valor]) => {
                  const pct = totalDesp > 0 ? (valor / totalDesp * 100) : 0
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{cat}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
                          <span className="text-xs font-bold text-gray-900">{fmt(valor)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Total despesas</span>
                  <span className="text-sm font-extrabold text-red-500">{fmt(totalDesp)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Resumo DRE simplificado ── */}
          <div className="px-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Resumo financeiro</p>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {[
                { label: 'Receita bruta',     valor: totalBruto, color: 'text-gray-900' },
                { label: 'Taxa das plataformas', valor: -(totalBruto - totalLiq), color: 'text-red-500', indent: true },
                { label: 'Receita líquida',   valor: totalLiq,   color: 'text-gray-900', bold: true },
                { label: 'Total de despesas', valor: -totalDesp, color: 'text-red-500', indent: true },
                { label: 'Lucro real',        valor: lucroReal,  color: lucroReal >= 0 ? 'text-emerald-600' : 'text-red-600', bold: true, border: true },
              ].map((row, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-2.5 ${row.border ? 'border-t-2 border-gray-100 bg-gray-50' : 'border-b border-gray-50'}`}
                >
                  <span className={`text-sm ${row.bold ? 'font-semibold text-gray-800' : 'text-gray-500'} ${row.indent ? 'pl-3' : ''}`}>
                    {row.label}
                  </span>
                  <span className={`text-sm font-bold ${row.color}`}>
                    {row.valor < 0 ? `-${fmt(Math.abs(row.valor))}` : fmt(row.valor)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
