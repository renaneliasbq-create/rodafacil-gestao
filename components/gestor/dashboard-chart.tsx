'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface DataPoint {
  mes: string
  receita: number
  despesa: number
}

interface DashboardChartProps {
  data: DataPoint[]
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function DashboardChart({ data }: DashboardChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        Sem dados suficientes para o gráfico
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          width={50}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatBRL(value),
            name === 'receita' ? 'Receita' : 'Despesa',
          ]}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            fontSize: '12px',
          }}
        />
        <Legend
          formatter={(value) => value === 'receita' ? 'Receita' : 'Despesa'}
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Area
          type="monotone"
          dataKey="receita"
          stroke="#1d4ed8"
          strokeWidth={2}
          fill="url(#gradReceita)"
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Area
          type="monotone"
          dataKey="despesa"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#gradDespesa)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
