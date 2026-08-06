import type { Status } from '../api/types'

/** Service-state display labels — the pipeline status re-cast as a railway
 * signal. The underlying Status enum (used for API calls, filters, sort) is
 * unchanged; only the on-screen word changes. */
export const STATUS_LABELS: Record<Status, string> = {
  lead: 'Scheduled',
  applied: 'On time',
  interviewing: 'In transit',
  offer: 'Arrived',
  rejected: 'Cancelled',
  withdrawn: 'Withdrawn',
  declined: 'Diverted',
}

export const STATUS_TEXT_STYLES: Record<Status, string> = {
  lead: 'text-status-lead',
  applied: 'text-status-applied',
  interviewing: 'text-status-interviewing',
  offer: 'text-status-offer',
  rejected: 'text-status-rejected',
  withdrawn: 'text-status-withdrawn',
  declined: 'text-status-declined',
}

export const STATUS_LAMP_STYLES: Record<Status, string> = {
  lead: 'bg-status-lead',
  applied: 'bg-status-applied',
  interviewing: 'bg-status-interviewing',
  offer: 'bg-status-offer',
  rejected: 'bg-status-rejected',
  withdrawn: 'bg-status-withdrawn',
  declined: 'bg-status-declined',
}

/** Signal lamp — ≤10px. Every status is a round lamp except "arrived"
 * (offer), which lights as a diamond so it reads distinctly from "on time"
 * at a glance, without relying on colour alone. */
export function StatusLamp({ status, className }: { status: Status; className?: string }) {
  const isDiamond = status === 'offer'
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-[7px] shrink-0 ${isDiamond ? 'rotate-45' : 'rounded-full'} ${STATUS_LAMP_STYLES[status]} ${className ?? ''}`}
    />
  )
}

/** Read-only status readout — lamp + mono uppercase service-state label.
 * Used for historical/log entries. For the current, editable status of an
 * application, use StatusControl instead. */
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[0.6875rem] font-medium tracking-[0.06em] uppercase ${STATUS_TEXT_STYLES[status]}`}>
      <StatusLamp status={status} />
      {STATUS_LABELS[status]}
    </span>
  )
}
