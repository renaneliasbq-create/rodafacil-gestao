'use client'

import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList,
} from 'recharts'

type TurnoDado = {
  turno:  string
  label:  string
  emoji:  string
  rph:    number
  cor:    string
  melhor: boolean
}

const LABEL_STYLE = { fontSize: 11, fontWeight: 700, fill: '#374151' }

export function ComparadorTurnoChart({ dados }: { dados: TurnoDado[] }) {
  if (dados.length === 0) return null

  const max = Math.max(...dados.map(d => d.rph))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={dados}
        layout="vertical"
        margin={{ top: 4, right: 56, left: 4, bottom: 4 }}
      >
        <XAxis type="number" hide domain={[0, max * 1.25]} />
        <YAxis
          type="category"
          dataKey="label"
          width={72}
          tick={{ fontSize: 12, fontWeight: 600, fill: '#374151' }}
          tickFormatter={(v, i) => `${dados[i]?.emoji} ${v}`}
          axisLine={false}
          tickLine={false}
        />
        <Bar dataKey="rph" radius={[0, 6, 6, 0]} maxBarSize={32}>
          {dados.map((d) => (
            <Cell
              key={d.turno}
              fill={d.melhor ? '#d97706' : d.cor}
              opacity={d.melhor ? 1 : 0.7}
            />
          ))}
          <LabelList
            dataKey="rph"
            position="right"
            formatter={(v: number) => `R$${v.toFixed(0)}/h`}
            style={LABEL_STYLE}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
