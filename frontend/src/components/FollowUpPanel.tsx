import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { StatusControl } from './StatusControl'
import type { Application, Status } from '../api/types'

type Bucket = 'overdue' | 'today' | 'upcoming'

function bucketOf(dateStr: string): Bucket {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${dateStr}T00:00:00`)
  if (due.getTime() < today.getTime()) return 'overdue'
  if (due.getTime() === today.getTime()) return 'today'
  return 'upcoming'
}

export function FollowUpPanel() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    api
      .listApplications({ due: true })
      .then(setApplications)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleStatusChange(id: number, status: Status) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    try {
      await api.updateApplication(id, { status })
      load()
    } catch {
      load()
    }
  }

  const buckets: Record<Bucket, Application[]> = { overdue: [], today: [], upcoming: [] }
  for (const app of applications) {
    if (app.next_followup) buckets[bucketOf(app.next_followup)].push(app)
  }

  return (
    <div className="mb-6 rounded-[var(--radius-card)] border border-rule bg-paper p-5">
      <h2 className="mb-4 font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-ink-2 uppercase">
        Follow-ups
      </h2>

      {loading ? (
        <p className="text-sm text-ink-2">Loading…</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-ink-2">Nothing due in the next 7 days.</p>
      ) : (
        <div className="space-y-5">
          <FollowUpBucket
            title="Overdue"
            items={buckets.overdue}
            onStatusChange={handleStatusChange}
            emphasize
          />
          <FollowUpBucket title="Today" items={buckets.today} onStatusChange={handleStatusChange} />
          <FollowUpBucket
            title="Next 7 days"
            items={buckets.upcoming}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}
    </div>
  )
}

function FollowUpBucket({
  title,
  items,
  onStatusChange,
  emphasize,
}: {
  title: string
  items: Application[]
  onStatusChange: (id: number, status: Status) => Promise<void>
  emphasize?: boolean
}) {
  if (items.length === 0) return null

  return (
    <div>
      <h3
        className={`mb-1.5 font-mono text-[0.6875rem] font-medium tracking-[0.06em] uppercase ${
          emphasize ? 'text-status-rejected' : 'text-ink-2'
        }`}
      >
        {title} <span className="[font-variant-numeric:tabular-nums]">({items.length})</span>
      </h3>
      <ul>
        {items.map((app) => (
          <li
            key={app.id}
            className="relative -mx-2 border-b border-rule/60 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] last:border-0 hover:bg-paper-2"
          >
            <Link
              to={`/applications/${app.id}`}
              className="absolute inset-0 rounded-[var(--radius-input)]"
              aria-label={`${app.company} — ${app.role}`}
            />
            <div className="pointer-events-none relative flex items-center gap-3 px-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">
                  <span className="font-medium">{app.company}</span>{' '}
                  <span className="text-ink-2">· {app.role}</span>
                </p>
                {app.next_action && (
                  <p className="truncate text-xs text-ink-2" title={app.next_action}>
                    {app.next_action}
                  </p>
                )}
              </div>
              <span className="shrink-0 font-mono text-xs text-ink-2 [font-variant-numeric:tabular-nums]">
                {app.next_followup}
              </span>
              <div className="pointer-events-auto relative z-10 shrink-0">
                <StatusControl status={app.status} onChange={(status) => onStatusChange(app.id, status)} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
