'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LabelList, Cell,
} from 'recharts'

export interface WeekData {
  semana: string
  ganho: number
}

function fmtLabel(v: number) {
  if (v === 0) return ''
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`
  return `R$${v.toFixed(0)}`
}

function fmtTooltip(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function GanhosWeeklyChart({ data }: { data: WeekData[] }) {
  const temDados = data.some(d => d.ganho > 0)

  if (!temDados) {
    return (
      <div className="flex items-center justify-center h-[180px] text-xs text-gray-400">
        Nenhum ganho registrado neste mês
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={data}
        margin={{ top: 22, right: 4, left: 4, bottom: 0 }}
        barCategoryGap="35%"
      >
        <XAxis
          dataKey="semana"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          formatter={(v: number) => [fmtTooltip(v), 'Ganho líquido']}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="ganho" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.ganho > 0 ? '#10b981' : '#e5e7eb'} />
          ))}
          <LabelList
            dataKey="ganho"
            position="top"
            formatter={fmtLabel}
            style={{ fontSize: '10px', fill: '#374151', fontWeight: '600' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
