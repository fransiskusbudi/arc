import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import { StatusControl } from '../components/StatusControl'
import { ApplicationModal } from '../components/ApplicationModal'
import { api } from '../api/client'
import type { Application, ApplicationInput, Status, StatusHistoryEntry } from '../api/types'

export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [application, setApplication] = useState<Application | null>(null)
  const [history, setHistory] = useState<StatusHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    Promise.all([api.getApplication(Number(id)), api.getHistory(Number(id))])
      .then(([app, hist]) => {
        setApplication(app)
        setHistory(hist)
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function handleSave(payload: ApplicationInput) {
    if (!application) return
    await api.updateApplication(application.id, payload)
    setEditing(false)
    load()
  }

  async function handleDelete() {
    if (!application || !confirm('Delete this application?')) return
    await api.deleteApplication(application.id)
    navigate('/applications')
  }

  async function handleStatusChange(status: Status) {
    if (!application) return
    setApplication({ ...application, status })
    try {
      await api.updateApplication(application.id, { status })
      load()
    } catch {
      load()
    }
  }

  if (loading || !application) {
    return (
      <Layout>
        <p className="text-sm text-ink-2">Loading…</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <Link
        to="/applications"
        className="mb-4 inline-block text-sm text-ink-2 underline decoration-transparent decoration-1 underline-offset-2 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] hover:text-ink hover:decoration-rule-2"
      >
        ← Back to applications
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="min-w-0 font-display text-display font-medium tracking-[-0.01em] text-ink [overflow-wrap:anywhere]">
            {application.company}
          </h1>
          <p className="text-ink-2">{application.role}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusControl status={application.status} onChange={handleStatusChange} />
          <button
            onClick={() => setEditing(true)}
            className="rounded-[var(--radius-input)] border border-rule-2 px-3 py-1.5 text-sm font-medium text-ink transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] hover:bg-paper-2"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="rounded-[var(--radius-input)] border border-status-rejected/40 px-3 py-1.5 text-sm font-medium text-status-rejected transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] hover:bg-status-rejected/[0.06]"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-rule bg-paper p-5">
          <h2 className="mb-4 font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-ink-2 uppercase">
            Details
          </h2>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <DetailRow label="Source" value={application.source} />
            <DetailRow label="Location" value={application.location} />
            <DetailRow label="Salary" value={application.salary} />
            <DetailRow label="CV variant" value={application.cv_variant} />
            <DetailRow label="Date applied" value={application.date_applied} mono />
            <DetailRow label="Next follow-up" value={application.next_followup} mono />
            <DetailRow label="Next action" value={application.next_action} full />
            <DetailRow label="Notes" value={application.notes} full />
            {application.url && (
              <div className="col-span-2">
                <dt className="font-mono text-[0.6875rem] font-medium tracking-[0.06em] text-ink-2 uppercase">
                  URL
                </dt>
                <dd>
                  <a
                    href={application.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink underline decoration-rule-2 decoration-1 underline-offset-2 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] hover:text-accent hover:decoration-accent"
                  >
                    {application.url}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-[var(--radius-card)] border border-rule bg-paper p-5">
          <h2 className="mb-4 font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-ink-2 uppercase">
            Status history
          </h2>
          <ol className="relative space-y-4 border-l border-rule pl-4">
            {history.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute top-1.5 -left-[1.32rem] size-1.5 rounded-full bg-ink-2" />
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={entry.status} />
                  <span className="font-mono text-xs text-ink-2 [font-variant-numeric:tabular-nums]">
                    {new Date(entry.changed_at).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {editing && (
        <ApplicationModal application={application} onClose={() => setEditing(false)} onSave={handleSave} />
      )}
    </Layout>
  )
}

function DetailRow({
  label,
  value,
  full,
  mono,
}: {
  label: string
  value: string | null
  full?: boolean
  mono?: boolean
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <dt className="font-mono text-[0.6875rem] font-medium tracking-[0.06em] text-ink-2 uppercase">
        {label}
      </dt>
      <dd className={`text-ink ${mono ? 'font-mono [font-variant-numeric:tabular-nums]' : ''}`}>
        {value || '—'}
      </dd>
    </div>
  )
}
