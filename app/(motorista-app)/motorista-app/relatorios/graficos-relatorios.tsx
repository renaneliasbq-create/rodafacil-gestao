'use client'

import {
  LineChart, Line, BarChart, Bar,
  XAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'

function fmtK(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export interface DadosDiario    { dia: number; lucroAcum: number }
export interface DadosSemana    { semana: string; atual: number; anterior: number }
export interface DadosDiaSemana { label: string; media: number; count: number; isMax: boolean; isMin: boolean }
export interface DadosMensal    { mes: string; label: string; receita: number; despesas: number; lucro: number; margem: number; diasTrab: number; isAtual: boolean }

/* ── Bloco 1: Evolução do Mês ───────────────────────────────────── */
export function BlocoEvolucao({
  lucroAcumulado,
  comparativoSemanal,
  projecao,
  diasTrabalhados,
  totalDiasMes,
  lucroReal,
  mesLabel,
  diaAtual,
}: {
  lucroAcumulado: DadosDiario[]
  comparativoSemanal: DadosSemana[]
  projecao: number | null
  diasTrabalhados: number
  totalDiasMes: number
  lucroReal: number
  mesLabel: string
  diaAtual: number | null
}) {
  const temEvol = lucroAcumulado.length > 1
  const temComp = comparativoSemanal.some(d => d.atual !== 0 || d.anterior !== 0)

  if (!temEvol && !temComp && projecao == null) return null

  return (
    <div className="px-4 mb-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Evolução do mês</p>

      {/* 1.1 Lucro acumulado */}
      {temEvol && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-3">
          <p className="text-xs font-semibold text-gray-500 mb-3">Lucro acumulado dia a dia</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={lucroAcumulado} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval={Math.max(1, Math.floor(lucroAcumulado.length / 5))}
              />
              <Tooltip
                formatter={(v: number) => [fmtK(v), 'Lucro acum.']}
                labelFormatter={(d: number) => `Dia ${d}`}
                contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #e5e7eb', padding: '6px 10px' }}
              />
              {diaAtual != null && (
                <ReferenceLine x={diaAtual} stroke="#a7f3d0" strokeWidth={2} label={{ value: 'hoje', position: 'top', fontSize: 9, fill: '#059669' }} />
              )}
              <Line
                type="monotone"
                dataKey="lucroAcum"
                stroke="#059669"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#059669', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 1.2 Comparativo semanal */}
      {temComp && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Este mês vs mês anterior</p>
          <div className="flex items-center gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className="w-3 h-2 rounded-sm bg-blue-300 inline-block" /> Mês ant.
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" /> Este mês
            </span>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={comparativoSemanal} margin={{ top: 0, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v: number, name: string) => [fmtK(v), name === 'atual' ? 'Este mês' : 'Mês ant.']}
                contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #e5e7eb', padding: '6px 10px' }}
              />
              <Bar dataKey="anterior" fill="#93c5fd" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="atual"    fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 1.3 Projeção de fechamento */}
      {projecao != null && diaAtual != null && (
        <div className={`rounded-2xl px-4 py-3 border ${projecao >= lucroReal ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${projecao >= lucroReal ? 'text-emerald-700' : 'text-amber-700'}`}>
            📈 Projeção de fechamento
          </p>
          <p className={`text-base font-extrabold ${projecao >= lucroReal ? 'text-emerald-800' : 'text-amber-800'}`}>
            {projecao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className={`text-[10px] mt-1 leading-snug ${projecao >= lucroReal ? 'text-emerald-600' : 'text-amber-600'}`}>
            No ritmo atual ({diasTrabalhados} dias trabalhados), projeção para {totalDiasMes} dias do mês.
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Bloco 5: Histórico dos últimos 6 meses ─────────────────────── */
export function BlocoHistorico({ dados, mesAtual }: { dados: DadosMensal[]; mesAtual: string }) {
  if (dados.length === 0) return null

  const melhorLucro = Math.max(...dados.map(d => d.lucro))

  return (
    <div className="px-4 mb-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Histórico — últimos 6 meses</p>

      {/* Gráfico de barras */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-3">
        <p className="text-xs font-semibold text-gray-500 mb-3">Lucro real por mês</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dados} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(v: number, name: string) => [
                v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                name === 'lucro' ? 'Lucro' : name === 'receita' ? 'Receita' : 'Despesas',
              ]}
              contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #e5e7eb', padding: '6px 10px' }}
            />
            <Bar dataKey="lucro" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {dados.map((entry) => (
                <Cell
                  key={entry.mes}
                  fill={
                    entry.lucro === melhorLucro
                      ? '#f59e0b'
                      : entry.isAtual
                      ? '#10b981'
                      : entry.lucro < 0
                      ? '#f87171'
                      : '#6ee7b7'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Melhor mês
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Mês atual
          </span>
        </div>
      </div>

      {/* Cards empilhados (mobile-first) */}
      <div className="space-y-2">
        {dados.map((d) => (
          <div
            key={d.mes}
            className={`bg-white border rounded-2xl px-4 py-3 shadow-sm ${d.isAtual ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-bold ${d.isAtual ? 'text-emerald-700' : 'text-gray-700'}`}>
                {d.label} {d.isAtual && <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full ml-1">atual</span>}
              </span>
              <span className={`text-sm font-extrabold ${d.lucro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {d.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div>
                <p className="text-[9px] text-gray-400">Receita</p>
                <p className="text-[11px] font-semibold text-gray-700">
                  {d.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400">Despesas</p>
                <p className="text-[11px] font-semibold text-red-500">
                  {d.despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400">Margem / Dias</p>
                <p className="text-[11px] font-semibold text-gray-700">{d.margem.toFixed(0)}% · {d.diasTrab}d</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Bloco 2: Performance por Dia da Semana ─────────────────────── */
export function BloCoDiaSemana({ dados }: { dados: DadosDiaSemana[] }) {
  if (dados.length < 2) return null

  const maxMedia = Math.max(...dados.map(d => d.media))

  return (
    <div className="px-4 mb-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Performance por dia da semana</p>
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="space-y-3">
          {dados.map(({ label, media, count, isMax, isMin }) => {
            const pct = maxMedia > 0 ? (media / maxMedia) * 100 : 0
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-xs font-semibold text-gray-700 w-7 flex-shrink-0">{label}</span>
                    {isMax && (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Melhor dia
                      </span>
                    )}
                    {isMin && (
                      <span className="text-[9px] font-bold bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Menos rentável
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-[10px] text-gray-400">{count}x</span>
                    <span className="text-xs font-bold text-gray-800 w-16 text-right">
                      {media.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden ml-7">
                  <div
                    className={`h-full rounded-full transition-all ${isMax ? 'bg-emerald-500' : isMin ? 'bg-red-300' : 'bg-blue-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-gray-400 mt-3 border-t border-gray-50 pt-2">
          Ganho líquido médio por dia trabalhado · mês atual
        </p>
      </div>
    </div>
  )
}
