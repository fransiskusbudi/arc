import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TimelinePoint } from '../api/types'

export function WeeklyVolumeChart({ data }: { data: TimelinePoint[] }) {
  const chartData = data.map((point) => ({
    ...point,
    label: new Date(point.week_start).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  }))

  return (
    <div className="rounded-[var(--radius-card)] border border-rule bg-paper p-5">
      <h2 className="mb-4 font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-ink-2 uppercase">
        Weekly application volume
      </h2>
      <ResponsiveContainer width="100%" height={240} aria-label="Line chart of weekly application volume">
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-rule)" />
          <XAxis
            dataKey="label"
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
            contentStyle={{
              borderRadius: 2,
              borderColor: 'var(--color-rule)',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
