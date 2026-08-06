import type { SourceStat } from '../api/types'

export function SourceTable({ data }: { data: SourceStat[] }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-rule bg-paper p-5">
      <h2 className="mb-4 font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-ink-2 uppercase">
        Performance by source
      </h2>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-rule text-ink-2">
            <th className="py-2 pr-2 font-mono text-[0.6875rem] font-medium tracking-[0.06em] uppercase">
              Source
            </th>
            <th className="py-2 pr-2 font-mono text-[0.6875rem] font-medium tracking-[0.06em] uppercase">
              Applications
            </th>
            <th className="py-2 pr-2 font-mono text-[0.6875rem] font-medium tracking-[0.06em] uppercase">
              Interviews+
            </th>
            <th className="py-2 font-mono text-[0.6875rem] font-medium tracking-[0.06em] uppercase">
              Conversion
            </th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-ink-2">
                No data yet
              </td>
            </tr>
          )}
          {data.map((row) => (
            <tr key={row.source} className="border-b border-rule/60 last:border-0">
              <td className="py-2 pr-2 text-ink">{row.source}</td>
              <td className="py-2 pr-2 font-mono text-ink-2 [font-variant-numeric:tabular-nums]">
                {row.total}
              </td>
              <td className="py-2 pr-2 font-mono text-ink-2 [font-variant-numeric:tabular-nums]">
                {row.interviews_or_better}
              </td>
              <td className="py-2 font-mono text-ink-2 [font-variant-numeric:tabular-nums]">
                {(row.conversion_rate * 100).toFixed(0)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
