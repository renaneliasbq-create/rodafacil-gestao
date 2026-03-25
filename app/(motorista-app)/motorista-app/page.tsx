import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  TrendingUp, ArrowUpCircle, Gauge, Bell, ChevronRight,
  TrendingDown, Car, Plus, AlertTriangle,
} from 'lucide-react'
import { BtnImportarExtratoCard } from './ganhos/importar-extrato-modal'

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

  // Período: mês atual
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const fimMes    = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]

  const mesLabel = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())

  // Queries paralelas
  const [
    { data: profile },
    { data: ganhos },
    { data: despesas },
    { data: kmRows },
    { data: alertas },
    { data: ganhosRecentes },
    { data: despesasRecentes },
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

    supabase.from('motorista_quilometragem')
      .select('km_total')
      .eq('motorista_id', user.id)
      .gte('data', inicioMes)
      .lte('data', fimMes),

    supabase.from('motorista_alertas')
      .select('id, tipo, descricao, data_vencimento')
      .eq('motorista_id', user.id)
      .lte('data_vencimento', new Date(hoje.getTime() + 15 * 86400000).toISOString().split('T')[0])
      .order('data_vencimento', { ascending: true })
      .limit(3),

    supabase.from('motorista_ganhos')
      .select('data, plataforma, valor_liquido')
      .eq('motorista_id', user.id)
      .order('data', { ascending: false })
      .limit(4),

    supabase.from('motorista_despesas')
      .select('data, categoria, descricao, valor')
      .eq('motorista_id', user.id)
      .order('data', { ascending: false })
      .limit(3),
  ])

  const primeiroNome = profile?.nome?.split(' ')[0] ?? 'Motorista'

  // Totais
  const totalGanhosBruto  = (ganhos ?? []).reduce((s, g) => s + (g.valor_bruto   ?? 0), 0)
  const totalGanhosLiq    = (ganhos ?? []).reduce((s, g) => s + (g.valor_liquido ?? 0), 0)
  const totalDespesas     = (despesas ?? []).reduce((s, d) => s + (d.valor ?? 0), 0)
  const lucroReal         = totalGanhosLiq - totalDespesas
  const totalKm           = (kmRows ?? []).reduce((s, r) => s + (r.km_total ?? 0), 0)
  const totalHoras        = (ganhos ?? []).reduce((s, g) => s + (g.horas_trabalhadas ?? 0), 0)
  const ganhoPorHora      = totalHoras > 0 ? totalGanhosLiq / totalHoras : 0
  const margemLucro       = totalGanhosBruto > 0 ? (lucroReal / totalGanhosBruto) * 100 : 0

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
          <span className="text-xs text-gray-400 font-medium bg-gray-100 rounded-full px-3 py-1">{mesLabel}</span>
        </div>
      </div>

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

      {/* ── Atividade recente ── */}
      {((ganhosRecentes?.length ?? 0) > 0 || (despesasRecentes?.length ?? 0) > 0) && (
        <div className="mx-4 mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Atividade recente</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {(ganhosRecentes ?? []).map((g, i) => (
              <div key={`g-${i}`} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{g.plataforma}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(g.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <p className="text-sm font-bold text-emerald-600">+{fmt(g.valor_liquido)}</p>
              </div>
            ))}
            {(despesasRecentes ?? []).map((d, i) => (
              <div key={`d-${i}`} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ArrowUpCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{d.descricao ?? d.categoria}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <p className="text-sm font-bold text-red-500">-{fmt(d.valor)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
