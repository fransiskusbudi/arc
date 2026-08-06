import type { Status } from '../api/types'

export const STATUS_STYLES: Record<Status, string> = {
  lead: 'border-status-lead/35 text-status-lead',
  applied: 'border-status-applied/35 text-status-applied',
  interviewing: 'border-status-interviewing/40 text-status-interviewing',
  offer: 'border-status-offer/35 text-status-offer',
  rejected: 'border-status-rejected/35 text-status-rejected',
  withdrawn: 'border-status-withdrawn/35 text-status-withdrawn',
  declined: 'border-status-declined/35 text-status-declined',
}

export const STATUS_DOT_STYLES: Record<Status, string> = {
  lead: 'bg-status-lead',
  applied: 'bg-status-applied',
  interviewing: 'bg-status-interviewing',
  offer: 'bg-status-offer',
  rejected: 'bg-status-rejected',
  withdrawn: 'bg-status-withdrawn',
  declined: 'bg-status-declined',
}

/** Read-only status pill — used for historical/log entries. For the current,
 * editable status of an application, use StatusControl instead. */
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-tag)] border px-2 py-0.5 font-mono text-[0.6875rem] font-medium tracking-[0.04em] uppercase ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  )
}
