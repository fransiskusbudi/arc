export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-rule bg-paper px-4 py-4 sm:px-5">
      <p className="font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-ink-2 uppercase">
        {label}
      </p>
      <p className="mt-1.5 font-mono text-3xl font-medium text-ink [font-variant-numeric:tabular-nums]">
        {value}
      </p>
    </div>
  )
}
