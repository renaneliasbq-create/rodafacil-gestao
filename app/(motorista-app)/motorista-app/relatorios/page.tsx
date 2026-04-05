import { createClient } from '@/lib/supabase/server'
import { BarChart2, TrendingUp, TrendingDown, Gauge, Clock, Target, Award } from 'lucide-react'
import { BlocoEvolucao, BloCoDiaSemana, BlocoHistorico } from './graficos-relatorios'
import type { DadosDiario, DadosSemana, DadosDiaSemana, DadosMensal } from './graficos-relatorios'
import { NavMesRelatorio } from './nav-mes-relatorio'
import { MetaBloco } from './meta-bloco'
import { InsightsBloco } from './insights-bloco'
import { ComparadorTurnoChart } from './comparador-turno-chart'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDurMin(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}min`
}

function fmtHoraISO(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDataCurta(data: string): string {
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const [y, m, d] = data.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay()
  return `${d}/${m} · ${DIAS[dow]}`
}

const PLATAFORMA_COLORS: Record<string, string> = {
  uber:    'bg-black text-white',
  '99':    'bg-yellow-400 text-yellow-900',
  ifood:   'bg-red-500 text-white',
  indrive: 'bg-emerald-600 text-white',
  outro:   'bg-gray-400 text-white',
}
function platColor(nome: string) {
  return PLATAFORMA_COLORS[nome.toLowerCase()] ?? 'bg-gray-400 text-white'
}

function Indicador({
  label, valor, sub, icon: Icon, cor, destaque,
}: {
  label: string; valor: string; sub?: string
  icon: React.ElementType; cor: string; destaque?: boolean
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

/* ── Gauge SVG (server-side) ─────────────────────────────────────── */
function GaugeScore({ score }: { score: number }) {
  const cx = 100, cy = 100, r = 72

  function ap(s1: number, s2: number) {
    const a1 = (1 - s1 / 100) * Math.PI
    const a2 = (1 - s2 / 100) * Math.PI
    const x1 = (cx + r * Math.cos(a1)).toFixed(1)
    const y1 = (cy - r * Math.sin(a1)).toFixed(1)
    const x2 = (cx + r * Math.cos(a2)).toFixed(1)
    const y2 = (cy - r * Math.sin(a2)).toFixed(1)
    const large = Math.abs(s2 - s1) > 50 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }

  const na = (1 - score / 100) * Math.PI
  const nx = (cx + 56 * Math.cos(na)).toFixed(1)
  const ny = (cy - 56 * Math.sin(na)).toFixed(1)

  const scoreColor = score >= 71 ? 'text-emerald-600' : score >= 41 ? 'text-amber-500' : 'text-red-500'
  const scoreLabel = score >= 71 ? 'Saudável 🟢' : score >= 41 ? 'Regular 🟡' : 'Atenção 🔴'

  return (
    <div className="flex flex-col items-center py-2">
      <svg viewBox="0 20 200 88" className="w-full max-w-[200px]">
        <path d={ap(0, 100)} stroke="#e5e7eb" strokeWidth="12" fill="none" strokeLinecap="butt" />
        <path d={ap(0, 40)}   stroke="#fca5a5" strokeWidth="12" fill="none" />
        <path d={ap(40, 70)}  stroke="#fcd34d" strokeWidth="12" fill="none" />
        <path d={ap(70, 100)} stroke="#34d399" strokeWidth="12" fill="none" />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#374151" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#374151" />
      </svg>
      <p className={`text-4xl font-extrabold -mt-1 ${scoreColor}`}>{score}</p>
      <p className={`text-xs font-semibold mt-0.5 ${scoreColor}`}>{scoreLabel}</p>
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

  // ── Mês selecionado ──────────────────────────────────────────────
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
  const ehMesAtual = ano === hoje.getFullYear() && mes === hoje.getMonth() + 1

  // ── Mês anterior ─────────────────────────────────────────────────
  const mesAnt    = mes === 1 ? 12 : mes - 1
  const anoAnt    = mes === 1 ? ano - 1 : ano
  const inicioAnt = `${anoAnt}-${String(mesAnt).padStart(2, '0')}-01`
  const fimAnt    = new Date(anoAnt, mesAnt, 0).toISOString().split('T')[0]

  // ── Histórico 6 meses ────────────────────────────────────────────
  const inicio6m = (() => {
    const d = new Date(ano, mes - 1 - 5, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })()

  // ── Queries paralelas ────────────────────────────────────────────
  const [
    { data: ganhos },
    { data: despesas },
    { data: kmRows },
    { data: ganhosAnt },
    { data: despesasAnt },
    { data: metaRow },
    { data: ganhos6m },
    { data: despesas6m },
    { data: jornadasMes },
  ] = await Promise.all([
    supabase.from('motorista_ganhos')
      .select('data, plataforma, valor_bruto, valor_liquido, horas_trabalhadas, km_rodados, turno')
      .eq('motorista_id', user.id).gte('data', inicioMes).lte('data', fimMes),
    supabase.from('motorista_despesas')
      .select('data, categoria, valor')
      .eq('motorista_id', user.id).gte('data', inicioMes).lte('data', fimMes),
    supabase.from('motorista_quilometragem')
      .select('km_total')
      .eq('motorista_id', user.id).gte('data', inicioMes).lte('data', fimMes),
    supabase.from('motorista_ganhos')
      .select('data, valor_liquido')
      .eq('motorista_id', user.id).gte('data', inicioAnt).lte('data', fimAnt),
    supabase.from('motorista_despesas')
      .select('data, valor')
      .eq('motorista_id', user.id).gte('data', inicioAnt).lte('data', fimAnt),
    supabase.from('motorista_metas')
      .select('valor')
      .eq('motorista_id', user.id)
      .eq('mes', `${ano}-${String(mes).padStart(2, '0')}`)
      .maybeSingle(),
    supabase.from('motorista_ganhos')
      .select('data, valor_bruto, valor_liquido')
      .eq('motorista_id', user.id).gte('data', inicio6m).lte('data', fimMes),
    supabase.from('motorista_despesas')
      .select('data, valor')
      .eq('motorista_id', user.id).gte('data', inicio6m).lte('data', fimMes),
    supabase.from('motorista_jornadas')
      .select('id, data, hora_inicio, hora_fim, plataforma, duracao_efetiva_minutos, duracao_pausas_minutos, duracao_total_minutos, ganhos_registrados, despesas_registradas, lucro_jornada')
      .eq('motorista_id', user.id)
      .eq('status', 'encerrada')
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .order('data', { ascending: false }),
  ])

  const g   = ganhos    ?? []
  const d   = despesas  ?? []
  const k   = kmRows    ?? []
  const ga  = ganhosAnt  ?? []
  const da  = despesasAnt ?? []

  // ── Métricas principais ──────────────────────────────────────────
  const totalBruto = g.reduce((s, r) => s + (r.valor_bruto   ?? 0), 0)
  const totalLiq   = g.reduce((s, r) => s + (r.valor_liquido ?? 0), 0)
  const totalDesp  = d.reduce((s, r) => s + (r.valor ?? 0), 0)
  const totalKm    = k.reduce((s, r) => s + (r.km_total ?? 0), 0)
  const totalHoras = g.reduce((s, r) => s + (r.horas_trabalhadas ?? 0), 0)
  const lucroReal  = totalLiq - totalDesp
  const margem     = totalBruto > 0 ? (lucroReal / totalBruto) * 100 : 0
  const ganhoPorHora = totalHoras > 0 ? totalLiq / totalHoras : 0
  const custoPorKm   = totalKm > 0 ? totalDesp / totalKm : 0
  const lucPorKm     = totalKm > 0 ? lucroReal / totalKm  : 0
  const taxaMedia    = totalBruto > 0 ? ((totalBruto - totalLiq) / totalBruto) * 100 : 0

  // ── Comparativo mês anterior ─────────────────────────────────────
  const liqAnt  = ga.reduce((s, r) => s + (r.valor_liquido ?? 0), 0)
  const despAnt = da.reduce((s, r) => s + (r.valor ?? 0), 0)
  const lucroAnt = liqAnt - despAnt
  const varLucro = lucroAnt !== 0 ? ((lucroReal - lucroAnt) / Math.abs(lucroAnt)) * 100 : null

  // ── Bloco 1: lucro acumulado diário ──────────────────────────────
  const gainByDay: Record<number, number> = {}
  const despByDay: Record<number, number> = {}
  for (const r of g) {
    if (!r.data) continue
    const dia = parseInt(r.data.split('-')[2])
    gainByDay[dia] = (gainByDay[dia] ?? 0) + (r.valor_liquido ?? 0)
  }
  for (const r of d) {
    if (!r.data) continue
    const dia = parseInt(r.data.split('-')[2])
    despByDay[dia] = (despByDay[dia] ?? 0) + (r.valor ?? 0)
  }
  const totalDiasMes = new Date(ano, mes, 0).getDate()
  const diaAtual     = ehMesAtual ? hoje.getDate() : null
  const ateHoje      = diaAtual ?? totalDiasMes
  let acum = 0
  const lucroAcumulado: DadosDiario[] = []
  for (let dia = 1; dia <= ateHoje; dia++) {
    acum += (gainByDay[dia] ?? 0) - (despByDay[dia] ?? 0)
    lucroAcumulado.push({ dia, lucroAcum: Math.round(acum * 100) / 100 })
  }

  // ── Bloco 1: comparativo semanal ─────────────────────────────────
  const SEMANAS = ['Sem. 1', 'Sem. 2', 'Sem. 3', 'Sem. 4', 'Sem. 5']
  function weekOf(dia: number) { return Math.min(4, Math.floor((dia - 1) / 7)) }

  const atualPorSem: Record<number, number> = {}
  for (const r of g) {
    if (!r.data) continue
    const wk = weekOf(parseInt(r.data.split('-')[2]))
    atualPorSem[wk] = (atualPorSem[wk] ?? 0) + (r.valor_liquido ?? 0)
  }
  for (const r of d) {
    if (!r.data) continue
    const wk = weekOf(parseInt(r.data.split('-')[2]))
    atualPorSem[wk] = (atualPorSem[wk] ?? 0) - (r.valor ?? 0)
  }
  const antPorSem: Record<number, number> = {}
  for (const r of ga) {
    if (!r.data) continue
    const wk = weekOf(parseInt(r.data.split('-')[2]))
    antPorSem[wk] = (antPorSem[wk] ?? 0) + (r.valor_liquido ?? 0)
  }
  for (const r of da) {
    if (!r.data) continue
    const wk = weekOf(parseInt(r.data.split('-')[2]))
    antPorSem[wk] = (antPorSem[wk] ?? 0) - (r.valor ?? 0)
  }
  const comparativoSemanal: DadosSemana[] = SEMANAS.map((semana, i) => ({
    semana,
    atual:    Math.round((atualPorSem[i] ?? 0) * 100) / 100,
    anterior: Math.round((antPorSem[i]  ?? 0) * 100) / 100,
  }))

  // ── Bloco 1: projeção de fechamento ──────────────────────────────
  const diasTrabalhados = new Set(g.map(r => r.data).filter(Boolean)).size
  const projecao = ehMesAtual && diasTrabalhados > 0
    ? Math.round((lucroReal / diasTrabalhados) * totalDiasMes * 100) / 100
    : null

  // ── Bloco 2: performance por dia da semana ───────────────────────
  const liqPorData: Record<string, number> = {}
  for (const r of g) {
    if (!r.data) continue
    liqPorData[r.data] = (liqPorData[r.data] ?? 0) + (r.valor_liquido ?? 0)
  }
  const somaDS: Record<number, number> = {}
  const contDS: Record<number, number> = {}
  for (const [data, liq] of Object.entries(liqPorData)) {
    const dow = new Date(data + 'T12:00:00').getDay()
    somaDS[dow] = (somaDS[dow] ?? 0) + liq
    contDS[dow] = (contDS[dow] ?? 0) + 1
  }
  const LABELS_DIA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const diasSemanaComDados = [0,1,2,3,4,5,6]
    .filter(dow => (contDS[dow] ?? 0) > 0)
    .map(dow => ({
      label: LABELS_DIA[dow],
      media: Math.round((somaDS[dow] / contDS[dow]) * 100) / 100,
      count: contDS[dow],
      isMax: false,
      isMin: false,
    }))
  if (diasSemanaComDados.length >= 2) {
    const maxM = Math.max(...diasSemanaComDados.map(d => d.media))
    const minM = Math.min(...diasSemanaComDados.map(d => d.media))
    for (const d2 of diasSemanaComDados) {
      d2.isMax = d2.media === maxM
      d2.isMin = d2.media === minM
    }
  }
  const performanceDiaSemana: DadosDiaSemana[] = diasSemanaComDados

  // ── Bloco 3: plataformas expandidas ──────────────────────────────
  const porPlat: Record<string, { bruto: number; liq: number; horas: number; km: number; count: number }> = {}
  for (const r of g) {
    const p = r.plataforma ?? 'outro'
    if (!porPlat[p]) porPlat[p] = { bruto: 0, liq: 0, horas: 0, km: 0, count: 0 }
    porPlat[p].bruto += r.valor_bruto      ?? 0
    porPlat[p].liq   += r.valor_liquido    ?? 0
    porPlat[p].horas += r.horas_trabalhadas ?? 0
    porPlat[p].km    += r.km_rodados       ?? 0
    porPlat[p].count += 1
  }
  const plataformasExpandidas = Object.entries(porPlat).map(([nome, v]) => {
    const taxa    = v.bruto > 0 ? (v.bruto - v.liq) / v.bruto * 100 : 0
    const gph     = v.horas > 0 ? v.liq / v.horas : 0
    const gpk     = v.km > 0 ? v.liq / v.km : 0
    const share   = totalLiq > 0 ? v.liq / totalLiq : 0
    const despAtrib = Math.round(totalDesp * share * 100) / 100
    const lucro   = v.liq - despAtrib
    return { nome, corridas: v.count, bruto: v.bruto, liq: v.liq, taxa, horas: v.horas, km: v.km, gph, gpk, despAtrib, lucro }
  }).sort((a, b) => b.gph - a.gph)

  // ── Bloco 4: score de saúde financeira ───────────────────────────
  const margemScore = totalBruto > 0 ? Math.min(100, Math.max(0, margem / 30 * 100)) : 0
  const varScore    = varLucro != null ? Math.min(100, Math.max(0, 50 + varLucro)) : 50
  const propDesp    = totalLiq > 0 ? totalDesp / totalLiq : 1
  const despScore   = Math.min(100, Math.max(0, (1 - propDesp) * 100))
  const score       = Math.round(margemScore * 0.4 + varScore * 0.3 + despScore * 0.3)

  // ── Meta ─────────────────────────────────────────────────────────
  const metaValor = metaRow?.valor ? Number(metaRow.valor) : null
  const mesParam  = `${ano}-${String(mes).padStart(2, '0')}`

  // ── Histórico 6 meses ────────────────────────────────────────────
  const g6 = ganhos6m  ?? []
  const d6 = despesas6m ?? []

  const hist6: DadosMensal[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ano, mes - 1 - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const mStr  = `${y}-${String(m).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      .replace('.', '').replace(' de ', '/')
    const receitaM = g6.filter(r => r.data?.startsWith(mStr)).reduce((s, r) => s + (r.valor_liquido ?? 0), 0)
    const despM    = d6.filter(r => r.data?.startsWith(mStr)).reduce((s, r) => s + (r.valor ?? 0), 0)
    const lucroM   = receitaM - despM
    const brutoM   = g6.filter(r => r.data?.startsWith(mStr)).reduce((s, r) => s + (r.valor_bruto ?? 0), 0)
    const margemM  = brutoM > 0 ? (lucroM / brutoM) * 100 : 0
    const diasM    = new Set(g6.filter(r => r.data?.startsWith(mStr)).map(r => r.data)).size
    if (receitaM > 0 || despM > 0) {
      hist6.push({ mes: mStr, label, receita: receitaM, despesas: despM, lucro: lucroM, margem: margemM, diasTrab: diasM, isAtual: mStr === mesParam })
    }
  }

  // ── Dados para insights ───────────────────────────────────────────
  const melhorDiaSemana = performanceDiaSemana.find(d => d.isMax)?.label ?? null
  const piorDiaSemana   = performanceDiaSemana.find(d => d.isMin)?.label ?? null
  const melhorPlat      = plataformasExpandidas[0]?.nome ?? null
  const piorPlat        = plataformasExpandidas.length > 1 ? plataformasExpandidas[plataformasExpandidas.length - 1].nome : null
  const metaAtingida    = metaValor != null ? (lucroReal >= metaValor ? 'sim' : `não (${Math.round(lucroReal / metaValor * 100)}% atingido)`) : null

  // ── Despesas por categoria ────────────────────────────────────────
  const porCat: Record<string, number> = {}
  for (const r of d) {
    const c = r.categoria ?? 'Outros'
    porCat[c] = (porCat[c] ?? 0) + (r.valor ?? 0)
  }
  const catsSorted = Object.entries(porCat).sort((a, b) => b[1] - a[1])

  const temDados = totalBruto > 0 || totalDesp > 0

  return (
    <div className="pb-6">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4 flex items-start justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-gray-900">Relatórios</h1>
        <NavMesRelatorio ano={ano} mes={mes} />
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
                    ? <TrendingUp  className="w-4 h-4 text-white/80" />
                    : <TrendingDown className="w-4 h-4 text-white/80" />}
                  <p className="text-sm text-white/80">
                    {varLucro >= 0 ? '+' : ''}{varLucro.toFixed(1)}% vs mês anterior
                    {lucroAnt !== 0 && <span className="ml-1">({fmt(lucroAnt)})</span>}
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

          {/* ── BLOCO 1: Evolução do Mês ── */}
          <BlocoEvolucao
            lucroAcumulado={lucroAcumulado}
            comparativoSemanal={comparativoSemanal}
            projecao={projecao}
            diasTrabalhados={diasTrabalhados}
            totalDiasMes={totalDiasMes}
            lucroReal={lucroReal}
            mesLabel={mesLabel}
            diaAtual={diaAtual}
          />

          {/* ── Eficiência operacional ── */}
          <div className="px-4 mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Eficiência operacional</p>
            <div className="grid grid-cols-2 gap-2">
              <Indicador label="Ganho por hora"  valor={ganhoPorHora > 0 ? fmt(ganhoPorHora) : '—'} sub={totalHoras > 0 ? `${totalHoras.toFixed(1)}h trabalhadas` : 'Sem horas registradas'} icon={Clock} cor="bg-blue-100 text-blue-600" />
              <Indicador label="Lucro por KM"    valor={lucPorKm > 0 ? `R$ ${lucPorKm.toFixed(2)}` : '—'} sub={totalKm > 0 ? `${totalKm.toLocaleString('pt-BR')} km` : 'Sem KM registrado'} icon={Gauge} cor="bg-orange-100 text-orange-500" />
              <Indicador label="Custo por KM"    valor={custoPorKm > 0 ? `R$ ${custoPorKm.toFixed(2)}` : '—'} sub="despesas / km rodados" icon={TrendingDown} cor="bg-red-100 text-red-500" />
              <Indicador label="Taxa média plat." valor={taxaMedia > 0 ? `${taxaMedia.toFixed(1)}%` : '—'} sub="bruto → líquido" icon={Target} cor="bg-purple-100 text-purple-600" />
            </div>
          </div>

          {/* ── BLOCO 2: Performance por dia da semana ── */}
          <BloCoDiaSemana dados={performanceDiaSemana} />

          {/* ── BLOCO 2b: Comparador de Turno ── */}
          {(() => {
            // Constantes de configuração dos turnos
            const TURNO_CFG: Record<string, { label: string; emoji: string; cor: string; bgCard: string; textCard: string }> = {
              manha:     { label: 'Manhã',     emoji: '🌅', cor: '#f59e0b', bgCard: 'bg-amber-500',   textCard: 'text-white'       },
              tarde:     { label: 'Tarde',     emoji: '☀️',  cor: '#0ea5e9', bgCard: 'bg-sky-500',     textCard: 'text-white'       },
              noite:     { label: 'Noite',     emoji: '🌙', cor: '#1e293b', bgCard: 'bg-slate-800',   textCard: 'text-slate-100'   },
              madrugada: { label: 'Madrugada', emoji: '🌃', cor: '#7c3aed', bgCard: 'bg-purple-900',  textCard: 'text-purple-100'  },
            }
            const ORDEM = ['manha', 'tarde', 'noite', 'madrugada']
            const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

            // Filtra registros com turno válido
            const comTurno = (ganhos ?? []).filter(
              g => g.turno && g.turno !== 'nao_informado'
            )
            if (comTurno.length < 3) return null

            // Agrupa métricas por turno
            type Metricas = { totalLiq: number; totalH: number; count: number; dias: Set<string> }
            const porTurno: Record<string, Metricas> = {}

            for (const g of comTurno) {
              const t = g.turno as string
              if (!porTurno[t]) porTurno[t] = { totalLiq: 0, totalH: 0, count: 0, dias: new Set() }
              porTurno[t].totalLiq += g.valor_liquido ?? 0
              porTurno[t].totalH   += g.horas_trabalhadas ?? 0
              porTurno[t].count    += 1
              porTurno[t].dias.add(g.data ?? '')
            }

            // Mínimo 3 registros por turno para aparecer
            const turnos = ORDEM
              .filter(t => (porTurno[t]?.count ?? 0) >= 3)
              .map(t => {
                const m = porTurno[t]
                const rph = m.totalH > 0 ? m.totalLiq / m.totalH : 0
                return {
                  turno:       t,
                  label:       TURNO_CFG[t].label,
                  emoji:       TURNO_CFG[t].emoji,
                  cor:         TURNO_CFG[t].cor,
                  bgCard:      TURNO_CFG[t].bgCard,
                  textCard:    TURNO_CFG[t].textCard,
                  rph,
                  mediaLiq:    m.totalLiq / m.count,
                  registros:   m.count,
                  diasAtivos:  m.dias.size,
                  melhor:      false,
                }
              })
              .sort((a, b) => b.rph - a.rph)

            if (turnos.length === 0) return null

            // Marca o vencedor
            turnos[0].melhor = true
            const vencedor  = turnos[0]
            const segundo   = turnos[1]

            // Diferença percentual em relação ao segundo
            const diffPct = segundo && segundo.rph > 0
              ? Math.round((vencedor.rph / segundo.rph - 1) * 100)
              : null

            // Grid dia × turno (AVG valor_liquido)
            const gridDia: Record<number, Record<string, { soma: number; cnt: number }>> = {}
            for (const g of comTurno) {
              if (!g.data || !g.turno) continue
              const [y, m, d] = g.data.split('-').map(Number)
              const dow = new Date(y, m - 1, d).getDay()
              if (!gridDia[dow]) gridDia[dow] = {}
              if (!gridDia[dow][g.turno]) gridDia[dow][g.turno] = { soma: 0, cnt: 0 }
              gridDia[dow][g.turno].soma += g.valor_liquido ?? 0
              gridDia[dow][g.turno].cnt  += 1
            }

            // Apenas dias e turnos com dados
            const diasComDados = [1,2,3,4,5,6,0].filter(d => gridDia[d])
            const turnosGrid   = ORDEM.filter(t => turnos.some(x => x.turno === t))

            return (
              <div className="px-4 mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Comparador de Turno</p>

                {/* Card vencedor */}
                <div className={`${vencedor.bgCard} rounded-2xl px-5 py-4 mb-3 shadow-lg`}>
                  <p className={`text-xs font-bold ${vencedor.textCard} opacity-70 mb-1`}>🏆 Seu turno mais rentável</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className={`text-2xl font-extrabold ${vencedor.textCard} leading-tight`}>
                        {vencedor.emoji} {vencedor.label.toUpperCase()}
                      </p>
                      <p className={`text-sm font-semibold ${vencedor.textCard} opacity-90 mt-0.5`}>
                        {vencedor.rph > 0
                          ? `R$ ${vencedor.rph.toFixed(2).replace('.', ',')}/hora em média`
                          : `R$ ${vencedor.mediaLiq.toFixed(2).replace('.', ',')}/registro em média`}
                      </p>
                    </div>
                    {diffPct !== null && diffPct > 0 && (
                      <span className={`text-xs font-bold ${vencedor.textCard} opacity-80 bg-white/20 rounded-xl px-3 py-1.5`}>
                        +{diffPct}% vs {segundo.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cards por turno */}
                <div className="space-y-2 mb-3">
                  {turnos.map((t, i) => (
                    <div
                      key={t.turno}
                      className={`bg-white border rounded-2xl px-4 py-3 shadow-sm ${t.melhor ? 'border-amber-300' : 'border-gray-100'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{t.emoji}</span>
                          <span className="text-sm font-bold text-gray-900">{t.label}</span>
                          {t.melhor && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              Melhor
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 font-medium">#{i + 1}</span>
                        </div>
                        <span className="text-sm font-extrabold text-gray-900">
                          {t.rph > 0
                            ? `R$ ${t.rph.toFixed(0)}/h`
                            : `R$ ${t.mediaLiq.toFixed(0)} médio`}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{t.registros}</p>
                          <p className="text-[10px] text-gray-400">Registros</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">R$ {t.mediaLiq.toFixed(0)}</p>
                          <p className="text-[10px] text-gray-400">R$ médio</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{t.diasAtivos}</p>
                          <p className="text-[10px] text-gray-400">Dias ativos</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gráfico de barras horizontais — só se tiver R$/hora */}
                {turnos.some(t => t.rph > 0) && (
                  <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm mb-3">
                    <p className="text-xs font-semibold text-gray-500 mb-3">R$ por hora por turno</p>
                    <ComparadorTurnoChart
                      dados={turnos.filter(t => t.rph > 0).map(t => ({
                        turno:  t.turno,
                        label:  t.label,
                        emoji:  t.emoji,
                        rph:    parseFloat(t.rph.toFixed(2)),
                        cor:    t.cor,
                        melhor: t.melhor,
                      }))}
                    />
                  </div>
                )}

                {/* Grid dia × turno */}
                {diasComDados.length > 0 && turnosGrid.length > 1 && (
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500">Melhor combinação dia + turno</p>
                    </div>
                    {/* Cabeçalho */}
                    <div
                      className="grid text-[10px] font-bold text-gray-400 uppercase px-4 py-2 border-b border-gray-50"
                      style={{ gridTemplateColumns: `80px repeat(${turnosGrid.length}, 1fr)` }}
                    >
                      <span />
                      {turnosGrid.map(t => (
                        <span key={t} className="text-center">{TURNO_CFG[t].emoji}</span>
                      ))}
                    </div>
                    {/* Linhas */}
                    {diasComDados.map(dow => {
                      const row = gridDia[dow] ?? {}
                      const vals = turnosGrid.map(t => row[t] ? row[t].soma / row[t].cnt : null)
                      const maxVal = Math.max(...vals.filter(Boolean) as number[])
                      return (
                        <div
                          key={dow}
                          className="grid items-center px-4 py-2 border-b border-gray-50 last:border-0"
                          style={{ gridTemplateColumns: `80px repeat(${turnosGrid.length}, 1fr)` }}
                        >
                          <span className="text-xs font-semibold text-gray-700">{DIAS_SEMANA[dow]}</span>
                          {vals.map((v, i) => (
                            <span
                              key={i}
                              className={`text-center text-xs font-bold rounded-lg py-1 ${
                                v === null
                                  ? 'text-gray-200'
                                  : v === maxVal && maxVal > 0
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'text-gray-600'
                              }`}
                            >
                              {v === null ? '—' : `R$${v.toFixed(0)}`}
                            </span>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── BLOCO 3: Análise profunda por plataforma ── */}
          {plataformasExpandidas.length > 0 && (
            <div className="px-4 mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Análise por plataforma</p>

              {/* Ranking rápido */}
              <div className="flex gap-2 mb-3">
                {plataformasExpandidas.slice(0, 3).map((p, i) => {
                  const medalha = ['🥇', '🥈', '🥉'][i]
                  return (
                    <div key={p.nome} className="flex-1 bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
                      <p className="text-lg leading-none mb-1">{medalha}</p>
                      <p className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mb-1 ${platColor(p.nome)}`}>
                        {p.nome}
                      </p>
                      <p className="text-xs font-extrabold text-gray-800">
                        {p.gph > 0 ? `${fmt(p.gph)}/h` : '—'}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Cards detalhados */}
              <div className="space-y-3">
                {plataformasExpandidas.map((p, i) => (
                  <div key={p.nome} className="bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      {i === 0 && <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${platColor(p.nome)}`}>{p.nome}</span>
                      <span className="text-xs text-gray-400">{p.corridas} corrida{p.corridas !== 1 ? 's' : ''}</span>
                      <span className="ml-auto text-sm font-extrabold text-emerald-600">{fmt(p.liq)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <p className="text-[10px] text-gray-400">Receita bruta</p>
                        <p className="text-xs font-semibold text-gray-700">{fmt(p.bruto)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Taxa plataforma</p>
                        <p className="text-xs font-semibold text-gray-700">{p.taxa.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Ganho / hora</p>
                        <p className="text-xs font-semibold text-gray-700">{p.gph > 0 ? fmt(p.gph) : '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Ganho / km</p>
                        <p className="text-xs font-semibold text-gray-700">{p.gpk > 0 ? `R$ ${p.gpk.toFixed(2)}` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Despesas atrib.</p>
                        <p className="text-xs font-semibold text-red-500">{fmt(p.despAtrib)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Lucro real</p>
                        <p className={`text-xs font-extrabold ${p.lucro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(p.lucro)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 px-1">
                Despesas atribuídas proporcionalmente à receita de cada plataforma.
              </p>
            </div>
          )}

          {/* ── Composição das despesas ── */}
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

          {/* ── Resumo financeiro ── */}
          <div className="px-4 mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Resumo financeiro</p>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {[
                { label: 'Receita bruta',       valor: totalBruto,              color: 'text-gray-900' },
                { label: 'Taxa das plataformas', valor: -(totalBruto - totalLiq), color: 'text-red-500', indent: true },
                { label: 'Receita líquida',      valor: totalLiq,                color: 'text-gray-900', bold: true },
                { label: 'Total de despesas',    valor: -totalDesp,              color: 'text-red-500', indent: true },
                { label: 'Lucro real',           valor: lucroReal,               color: lucroReal >= 0 ? 'text-emerald-600' : 'text-red-600', bold: true, border: true },
              ].map((row, i) => (
                <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${row.border ? 'border-t-2 border-gray-100 bg-gray-50' : 'border-b border-gray-50'}`}>
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

          {/* ── BLOCO 4: Saúde financeira ── */}
          <div className="px-4 mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Saúde financeira</p>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-4 py-4">

              <GaugeScore score={score} />

              {/* Composição do score */}
              <div className="mt-4 space-y-2.5">
                {[
                  { label: 'Margem de lucro', pct: Math.round(margemScore), valor: `${margem.toFixed(1)}%` },
                  { label: 'Var. vs mês anterior', pct: Math.round(varScore), valor: varLucro != null ? `${varLucro >= 0 ? '+' : ''}${varLucro.toFixed(1)}%` : '—' },
                  { label: 'Proporção desp./receita', pct: Math.round(despScore), valor: `${(propDesp * 100).toFixed(0)}%` },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{item.valor}</span>
                        <span className="text-[10px] font-bold text-gray-700 w-6 text-right">{item.pct}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.pct >= 70 ? 'bg-emerald-400' : item.pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 4.3 Alerta automático de despesas */}
              {propDesp > 0.5 && (
                <div className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <span className="text-base flex-shrink-0">🚨</span>
                  <p className="text-xs text-red-700 leading-snug">
                    Suas despesas representam <strong>{(propDesp * 100).toFixed(0)}%</strong> da receita — acima do limite crítico de 50%. Revise seus custos com urgência.
                  </p>
                </div>
              )}
              {propDesp > 0.3 && propDesp <= 0.5 && (
                <div className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                  <span className="text-base flex-shrink-0">⚠️</span>
                  <p className="text-xs text-amber-700 leading-snug">
                    Despesas em <strong>{(propDesp * 100).toFixed(0)}%</strong> da receita — atenção ao limite de 30%. Considere reduzir custos variáveis.
                  </p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 leading-snug">
                  Score calculado com base em margem de lucro (40%), variação vs mês anterior (30%) e proporção despesa/receita (30%).
                </p>
              </div>

              {/* 4.2 Meta mensal */}
              <MetaBloco mes={mesParam} mesLabel={mesLabel} lucroReal={lucroReal} meta={metaValor} />
            </div>
          </div>

          {/* ── BLOCO 5: Histórico 6 meses ── */}
          <BlocoHistorico dados={hist6} mesAtual={mesParam} />

          {/* ── BLOCO 6: Histórico de jornadas do mês ── */}
          {(() => {
            const jornadas = jornadasMes ?? []
            if (jornadas.length === 0) return null

            const totalJornadas    = jornadas.length
            const totalEfetivo     = jornadas.reduce((s, j) => s + (j.duracao_efetiva_minutos ?? 0), 0)
            const mediaEfetivo     = Math.round(totalEfetivo / totalJornadas)
            const totalLucroJorn   = jornadas.reduce((s, j) => s + (j.lucro_jornada ?? 0), 0)
            const mediaLucroJorn   = totalLucroJorn / totalJornadas

            // Mapeia label da plataforma para cor
            const JORN_PLAT_COLOR: Record<string, string> = {
              'Uber':    'bg-black text-white',
              '99':      'bg-yellow-400 text-yellow-900',
              'iFood':   'bg-red-500 text-white',
              'InDrive': 'bg-emerald-600 text-white',
            }

            return (
              <div className="px-4 mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Jornadas do mês</p>

                {/* Resumo agregado */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
                    <p className="text-xl font-extrabold text-gray-900">{totalJornadas}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Jornadas</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
                    <p className="text-sm font-extrabold text-blue-600">{fmtDurMin(mediaEfetivo)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Média efetiva</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
                    <p className={`text-sm font-extrabold ${mediaLucroJorn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {fmt(mediaLucroJorn)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Lucro médio</p>
                  </div>
                </div>

                {/* Lista de jornadas */}
                <div className="space-y-2">
                  {jornadas.map(j => {
                    const efetivoMin  = j.duracao_efetiva_minutos ?? 0
                    const totalMin    = j.duracao_total_minutos   ?? 0
                    const eficiencia  = totalMin > 0 ? Math.round(efetivoMin / totalMin * 100) : 0
                    const lucro       = j.lucro_jornada ?? 0
                    const platColor   = j.plataforma ? (JORN_PLAT_COLOR[j.plataforma] ?? 'bg-gray-200 text-gray-700') : null

                    return (
                      <div key={j.id} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-700">
                              {j.data ? fmtDataCurta(j.data) : '—'}
                            </span>
                            {j.plataforma && platColor && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${platColor}`}>
                                {j.plataforma}
                              </span>
                            )}
                          </div>
                          <span className={`text-sm font-extrabold ${lucro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {fmt(lucro)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 mb-2">
                          {j.hora_inicio && j.hora_fim && (
                            <span>🕐 {fmtHoraISO(j.hora_inicio)} → {fmtHoraISO(j.hora_fim)}</span>
                          )}
                          <span>⏱ {fmtDurMin(efetivoMin)} rodando</span>
                          {(j.duracao_pausas_minutos ?? 0) > 0 && (
                            <span>⏸ {fmtDurMin(j.duracao_pausas_minutos!)} pausado</span>
                          )}
                        </div>

                        {/* Barra de eficiência */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${eficiencia >= 70 ? 'bg-emerald-400' : eficiencia >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${eficiencia}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 w-12 text-right">{eficiencia}% ativo</span>
                        </div>

                        {(j.ganhos_registrados ?? 0) > 0 && (
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                            <span>💰 {fmt(j.ganhos_registrados ?? 0)}</span>
                            <span>💸 {fmt(j.despesas_registradas ?? 0)}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* ── BLOCO 7: Insights com IA ── */}
          <InsightsBloco dados={{
            lucroReal,
            varLucro,
            margem,
            melhorDia: melhorDiaSemana,
            piorDia: piorDiaSemana,
            melhorPlataforma: melhorPlat,
            piorPlataforma: piorPlat,
            totalDesp,
            propDesp,
            diasTrabalhados,
            metaAtingida,
          }} />
        </>
      )}
    </div>
  )
}
