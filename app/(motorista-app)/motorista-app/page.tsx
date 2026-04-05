import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  TrendingUp, ArrowUpCircle, Gauge, Bell, ChevronRight,
  TrendingDown, Car, Plus, AlertTriangle, BarChart2,
} from 'lucide-react'
import { BtnImportarExtratoCard } from './ganhos/importar-extrato-modal'
import { AssistenteCard } from './assistente-card'
import { JornadaCard } from './jornada-card'

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
    <div className="flex flex-col items-center py-1">
      <svg viewBox="0 20 200 88" className="w-full max-w-[180px]">
        <path d={ap(0, 100)} stroke="#e5e7eb" strokeWidth="12" fill="none" strokeLinecap="butt" />
        <path d={ap(0, 40)}   stroke="#fca5a5" strokeWidth="12" fill="none" />
        <path d={ap(40, 70)}  stroke="#fcd34d" strokeWidth="12" fill="none" />
        <path d={ap(70, 100)} stroke="#34d399" strokeWidth="12" fill="none" />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#374151" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#374151" />
      </svg>
      <p className={`text-3xl font-extrabold -mt-1 ${scoreColor}`}>{score}</p>
      <p className={`text-xs font-semibold mt-0.5 ${scoreColor}`}>{scoreLabel}</p>
    </div>
  )
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

const PLATAFORMA_COLORS: Record<string, string> = {
  'Uber':  'bg-black text-white',
  '99':    'bg-yellow-400 text-yellow-900',
  'iFood': 'bg-red-500 text-white',
  'Indrive': 'bg-emerald-600 text-white',
  'Outro': 'bg-gray-400 text-white',
}

export default async function MotoristaAppDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const hoje = new Date()

  // Usa o mês atual se tiver dados; senão usa o mês mais recente com dados
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth() + 1
  const inicioMesAtual = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`

  const { data: ultimoGanho } = await supabase
    .from('motorista_ganhos')
    .select('data')
    .eq('motorista_id', user.id)
    .gte('data', inicioMesAtual)
    .limit(1)
    .maybeSingle()

  // Se não há dado no mês atual, busca o mês mais recente com dado
  let refDate = hoje
  let isMesAtual = true
  if (!ultimoGanho) {
    const { data: maisRecente } = await supabase
      .from('motorista_ganhos')
      .select('data')
      .eq('motorista_id', user.id)
      .order('data', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (maisRecente?.data) {
      refDate = new Date(maisRecente.data + 'T12:00:00')
      isMesAtual = false
    }
  }

  const ano     = refDate.getFullYear()
  const mes     = refDate.getMonth() + 1
  const inicioMes = new Date(ano, mes - 1, 1).toISOString().split('T')[0]
  const fimMes    = new Date(ano, mes, 0).toISOString().split('T')[0]

  const mesLabel = new Date(ano, mes - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())

  // Mês anterior (para o score)
  const mesAnt    = mes === 1 ? 12 : mes - 1
  const anoAnt    = mes === 1 ? ano - 1 : ano
  const inicioAnt = `${anoAnt}-${String(mesAnt).padStart(2, '0')}-01`
  const fimAnt    = new Date(anoAnt, mesAnt, 0).toISOString().split('T')[0]

  const hojeStr = hoje.toISOString().split('T')[0]

  // Queries paralelas
  const [
    { data: profile },
    { data: ganhos },
    { data: despesas },
    { data: kmRows },
    { data: alertas },
    { data: ganhosAnt },
    { data: despesasAnt },
    { data: jornadaAtivaRow },
  ] = await Promise.all([
    supabase.from('users').select('nome').eq('id', user.id).single(),

    supabase.from('motorista_ganhos')
      .select('plataforma, valor_bruto, valor_liquido, horas_trabalhadas')
      .eq('motorista_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes),

    supabase.from('motorista_despesas')
      .select('categoria, valor')
      .eq('motorista_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes),

    supabase.from('motorista_ganhos')
      .select('km_rodados')
      .eq('motorista_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .not('km_rodados', 'is', null),

    supabase.from('motorista_alertas')
      .select('id, tipo, descricao, data_vencimento')
      .eq('motorista_id', user.id)
      .lte('data_vencimento', new Date(hoje.getTime() + 15 * 86400000).toISOString().split('T')[0])
      .order('data_vencimento', { ascending: true })
      .limit(3),

    supabase.from('motorista_ganhos')
      .select('valor_liquido')
      .eq('motorista_id', user.id)
      .gte('data', inicioAnt)
      .lte('data', fimAnt),

    supabase.from('motorista_despesas')
      .select('valor')
      .eq('motorista_id', user.id)
      .gte('data', inicioAnt)
      .lte('data', fimAnt),

    supabase.from('motorista_jornadas')
      .select('id, hora_inicio, plataforma, status')
      .eq('motorista_id', user.id)
      .in('status', ['rodando', 'pausado'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // Ganhos e despesas da jornada: filtra por created_at >= hora_inicio
  // (só o que foi registrado durante/após o início da jornada atual)
  const [{ data: ganhosHojeRows }, { data: despesasHojeRows }] = jornadaAtivaRow
    ? await Promise.all([
        supabase.from('motorista_ganhos')
          .select('valor_liquido')
          .eq('motorista_id', user.id)
          .gte('created_at', jornadaAtivaRow.hora_inicio),
        supabase.from('motorista_despesas')
          .select('valor')
          .eq('motorista_id', user.id)
          .gte('created_at', jornadaAtivaRow.hora_inicio),
      ])
    : [{ data: [] }, { data: [] }]

  // Pausas (depende do ID da jornada — query sequencial)
  const { data: pausasRows } = jornadaAtivaRow
    ? await supabase
        .from('motorista_jornada_pausas')
        .select('id, motivo, inicio_pausa, fim_pausa, duracao_minutos')
        .eq('jornada_id', jornadaAtivaRow.id)
        .order('inicio_pausa', { ascending: true })
    : { data: [] }

  const jornadaAtiva = jornadaAtivaRow
    ? { ...jornadaAtivaRow, status: jornadaAtivaRow.status as 'rodando' | 'pausado' }
    : null
  const pausas       = pausasRows ?? []
  const ganhosHoje   = (ganhosHojeRows   ?? []).reduce((s, r) => s + (r.valor_liquido ?? 0), 0)
  const despesasHoje = (despesasHojeRows ?? []).reduce((s, r) => s + (r.valor ?? 0), 0)

  // Turno vencedor (últimos 90 dias) — para o card compacto da home
  const inicio90d = new Date(hoje.getTime() - 90 * 86400000).toISOString().split('T')[0]
  const { data: ganhos90d } = await supabase
    .from('motorista_ganhos')
    .select('turno, valor_liquido, horas_trabalhadas')
    .eq('motorista_id', user.id)
    .gte('data', inicio90d)
    .not('turno', 'eq', 'nao_informado')
    .not('turno', 'is', null)

  const TURNO_LABEL: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', madrugada: 'Madrugada' }
  const TURNO_EMOJI: Record<string, string> = { manha: '🌅', tarde: '☀️', noite: '🌙', madrugada: '🌃' }

  const turnoVencedor = (() => {
    if (!ganhos90d || ganhos90d.length < 6) return null
    const agg: Record<string, { liq: number; h: number; cnt: number }> = {}
    for (const g of ganhos90d) {
      const t = g.turno as string
      if (!agg[t]) agg[t] = { liq: 0, h: 0, cnt: 0 }
      agg[t].liq += g.valor_liquido ?? 0
      agg[t].h   += g.horas_trabalhadas ?? 0
      agg[t].cnt += 1
    }
    const com3 = Object.entries(agg).filter(([, v]) => v.cnt >= 3)
    if (com3.length < 2) return null
    const sorted = com3.sort(([, a], [, b]) => {
      const rphA = a.h > 0 ? a.liq / a.h : a.liq / a.cnt
      const rphB = b.h > 0 ? b.liq / b.h : b.liq / b.cnt
      return rphB - rphA
    })
    const [turno, dados] = sorted[0]
    const rph = dados.h > 0 ? dados.liq / dados.h : dados.liq / dados.cnt
    return { turno, rph, label: TURNO_LABEL[turno] ?? turno, emoji: TURNO_EMOJI[turno] ?? '⏰' }
  })()

  const primeiroNome = profile?.nome?.split(' ')[0] ?? 'Motorista'

  // Totais
  const totalGanhosBruto  = (ganhos ?? []).reduce((s, g) => s + (g.valor_bruto   ?? 0), 0)
  const totalGanhosLiq    = (ganhos ?? []).reduce((s, g) => s + (g.valor_liquido ?? 0), 0)
  const totalDespesas     = (despesas ?? []).reduce((s, d) => s + (d.valor ?? 0), 0)
  const lucroReal         = totalGanhosLiq - totalDespesas
  const totalKm           = (kmRows ?? []).reduce((s, r) => s + (r.km_rodados ?? 0), 0)
  const totalHoras        = (ganhos ?? []).reduce((s, g) => s + (g.horas_trabalhadas ?? 0), 0)
  const ganhoPorHora      = totalHoras > 0 ? totalGanhosLiq / totalHoras : 0
  const margemLucro       = totalGanhosBruto > 0 ? (lucroReal / totalGanhosBruto) * 100 : 0

  // Score de saúde financeira
  const liqAnt   = (ganhosAnt  ?? []).reduce((s, r) => s + (r.valor_liquido ?? 0), 0)
  const despAnt  = (despesasAnt ?? []).reduce((s, r) => s + (r.valor ?? 0), 0)
  const lucroAnt = liqAnt - despAnt
  const varLucro = lucroAnt !== 0 ? ((lucroReal - lucroAnt) / Math.abs(lucroAnt)) * 100 : null
  const margemScore = totalGanhosBruto > 0 ? Math.min(100, Math.max(0, margemLucro / 30 * 100)) : 0
  const varScore    = varLucro != null ? Math.min(100, Math.max(0, 50 + varLucro)) : 50
  const propDesp    = totalGanhosLiq > 0 ? totalDespesas / totalGanhosLiq : 1
  const despScore   = Math.min(100, Math.max(0, (1 - propDesp) * 100))
  const score       = Math.round(margemScore * 0.4 + varScore * 0.3 + despScore * 0.3)

  // Por plataforma
  const porPlataforma: Record<string, { bruto: number; liq: number; count: number }> = {}
  for (const g of (ganhos ?? [])) {
    const p = g.plataforma ?? 'Outro'
    if (!porPlataforma[p]) porPlataforma[p] = { bruto: 0, liq: 0, count: 0 }
    porPlataforma[p].bruto += g.valor_bruto   ?? 0
    porPlataforma[p].liq   += g.valor_liquido ?? 0
    porPlataforma[p].count += 1
  }
  const plataformasSorted = Object.entries(porPlataforma).sort((a, b) => b[1].liq - a[1].liq)

  // Alertas urgentes
  const alertasUrgentes = (alertas ?? []).filter(a => {
    const dias = Math.ceil((new Date(a.data_vencimento).getTime() - hoje.getTime()) / 86400000)
    return dias <= 7
  })

  const temDados = totalGanhosBruto > 0 || totalDespesas > 0

  return (
    <div className="pb-6">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-sm text-gray-400">Bem-vindo de volta,</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-gray-900">{primeiroNome} 👋</h1>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-400 font-medium bg-gray-100 rounded-full px-3 py-1">{mesLabel}</span>
            {!isMesAtual && (
              <span className="text-[10px] text-amber-600 font-medium">último mês com dados</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Jornada ativa ── */}
      <JornadaCard
        jornada={jornadaAtiva}
        pausas={pausas}
        ganhosHoje={ganhosHoje}
        despesasHoje={despesasHoje}
      />

      {/* ── Alerta urgente (se houver) ── */}
      {alertasUrgentes.length > 0 && (
        <div className="mx-4 mb-4 flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700">
              {alertasUrgentes.length === 1
                ? alertasUrgentes[0].descricao
                : `${alertasUrgentes.length} vencimentos em até 7 dias`}
            </p>
          </div>
          <Link href="/motorista-app/alertas" className="text-red-500">
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ── Card principal: Lucro Real ── */}
      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 shadow-lg shadow-emerald-200">
        <div className="flex items-center justify-between mb-1">
          <p className="text-emerald-100 text-sm font-medium">Lucro Real do Mês</p>
          {temDados && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              margemLucro >= 40 ? 'bg-white/20 text-white' : 'bg-red-400/30 text-red-100'
            }`}>
              {margemLucro.toFixed(0)}% margem
            </span>
          )}
        </div>
        <p className="text-3xl font-extrabold text-white mb-4">
          {temDados ? fmt(lucroReal) : 'R$ —'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-xl px-3 py-2">
            <p className="text-emerald-100 text-[10px] font-medium uppercase tracking-wide mb-0.5">Ganhos líquidos</p>
            <p className="text-white font-bold text-base">{temDados ? fmt(totalGanhosLiq) : '—'}</p>
          </div>
          <div className="bg-white/15 rounded-xl px-3 py-2">
            <p className="text-emerald-100 text-[10px] font-medium uppercase tracking-wide mb-0.5">Despesas</p>
            <p className="text-white font-bold text-base">{temDados ? fmt(totalDespesas) : '—'}</p>
          </div>
        </div>
      </div>

      {/* ── Assistente ── */}
      {/* Card compacto: turno mais rentável */}
      {turnoVencedor && (
        <Link href="/motorista-app/relatorios" className="mx-4 mb-4 flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm active:bg-gray-50 transition-colors">
          <span className="text-2xl">{turnoVencedor.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">Turno mais rentável</p>
            <p className="text-sm font-bold text-gray-900 leading-tight">
              {turnoVencedor.label} · R$ {turnoVencedor.rph.toFixed(0)}/h em média
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </Link>
      )}

      <AssistenteCard />

      {/* ── Indicadores rápidos ── */}
      <div className="grid grid-cols-3 gap-3 mx-4 mb-4">
        {/* KM */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-1.5">
            <Gauge className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xs text-gray-400 font-medium">KM rodados</p>
          <p className="text-base font-extrabold text-gray-900">{totalKm > 0 ? totalKm.toLocaleString('pt-BR') : '—'}</p>
        </div>

        {/* Ganho/hora */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
          <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xs text-gray-400 font-medium">Por hora</p>
          <p className="text-base font-extrabold text-gray-900">{ganhoPorHora > 0 ? fmt(ganhoPorHora).replace('R$\u00a0', 'R$') : '—'}</p>
        </div>

        {/* Ganhos brutos */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
          <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-1.5">
            <TrendingDown className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xs text-gray-400 font-medium">Bruto</p>
          <p className="text-base font-extrabold text-gray-900">{totalGanhosBruto > 0 ? fmt(totalGanhosBruto) : '—'}</p>
        </div>
      </div>

      {/* ── Por plataforma ── */}
      {plataformasSorted.length > 0 && (
        <div className="mx-4 mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Por plataforma</p>
          <div className="space-y-2">
            {plataformasSorted.map(([plat, vals]) => {
              const pct = totalGanhosLiq > 0 ? (vals.liq / totalGanhosLiq) * 100 : 0
              const colorClass = PLATAFORMA_COLORS[plat] ?? 'bg-gray-400 text-white'
              return (
                <div key={plat} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorClass}`}>{plat}</span>
                      <span className="text-xs text-gray-400">{vals.count} corridas</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{fmt(vals.liq)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Saúde Financeira ── */}
      {temDados && (
        <div className="mx-4 mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Saúde financeira</p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
            <GaugeScore score={score} />
            <Link
              href="/motorista-app/relatorios"
              className="mt-3 flex items-center justify-center gap-2 w-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-sm rounded-xl py-2.5 active:bg-emerald-100 transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
              Ver relatórios completos
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Ações rápidas ── */}
      <div className="mx-4 mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Lançamento rápido</p>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/motorista-app/ganhos"
            className="flex flex-col items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-2xl py-4 transition-colors active:bg-emerald-100"
          >
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-emerald-700">Ganho</span>
          </Link>

          <BtnImportarExtratoCard />

          <Link
            href="/motorista-app/despesas"
            className="flex flex-col items-center gap-1.5 bg-red-50 border border-red-100 rounded-2xl py-4 transition-colors active:bg-red-100"
          >
            <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center">
              <ArrowUpCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-red-600">Despesa</span>
          </Link>

          <Link
            href="/motorista-app/km"
            className="flex flex-col items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-2xl py-4 transition-colors active:bg-blue-100"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Gauge className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-blue-600">KM</span>
          </Link>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!temDados && (
        <div className="mx-4 mt-2">
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-6 py-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Car className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Nenhum registro ainda</p>
            <p className="text-xs text-gray-400 mb-4">Comece registrando seus ganhos de hoje para ver seu lucro real aqui.</p>
            <Link
              href="/motorista-app/ganhos"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar ganho
            </Link>
          </div>
        </div>
      )}

      {/* ── Alertas de vencimento ── */}
      {(alertas?.length ?? 0) > 0 && alertasUrgentes.length === 0 && (
        <div className="mx-4 mt-2">
          <Link href="/motorista-app/alertas" className="flex items-center gap-3 bg-yellow-50 border border-yellow-100 rounded-2xl px-4 py-3">
            <Bell className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium text-yellow-700">
              {alertas!.length} vencimento{alertas!.length > 1 ? 's' : ''} nos próximos 15 dias
            </p>
            <ChevronRight className="w-4 h-4 text-yellow-400" />
          </Link>
        </div>
      )}
    </div>
  )
}
