import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { FunnelStage } from '../api/types'

export function FunnelChart({ data }: { data: FunnelStage[] }) {
  const chartData = data.map((stage) => ({ ...stage, stage: capitalize(stage.stage) }))

  return (
    <div className="rounded-[var(--radius-card)] border border-rule bg-paper p-5">
      <h2 className="mb-4 font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-ink-2 uppercase">
        Pipeline funnel
      </h2>
      <ResponsiveContainer width="100%" height={240} aria-label="Bar chart of application count by pipeline stage">
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-rule)" />
          <XAxis
            dataKey="stage"
            tick={{ fontSize: 12, fill: 'var(--color-ink-2)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: 'var(--color-ink-2)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-paper-2)' }}
            contentStyle={{
              borderRadius: 6,
              borderColor: 'var(--color-rule)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
            }}
          />
          <Bar dataKey="count" fill="var(--color-accent)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
