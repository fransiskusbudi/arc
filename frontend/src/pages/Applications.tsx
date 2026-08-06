import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { StatusControl } from '../components/StatusControl'
import { ApplicationModal } from '../components/ApplicationModal'
import { api } from '../api/client'
import { STATUSES } from '../api/types'
import type { Application, ApplicationInput, Status } from '../api/types'

export function Applications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modalApplication, setModalApplication] = useState<Application | 'new' | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api
      .listApplications({ status: statusFilter || undefined, q: search || undefined })
      .then(setApplications)
      .finally(() => setLoading(false))
  }, [statusFilter, search])

  useEffect(() => {
    const timeout = setTimeout(load, 200)
    return () => clearTimeout(timeout)
  }, [load])

  async function handleSave(payload: ApplicationInput) {
    if (modalApplication === 'new') {
      await api.createApplication(payload)
    } else if (modalApplication) {
      await api.updateApplication(modalApplication.id, payload)
    }
    setModalApplication(null)
    load()
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this application?')) return
    await api.deleteApplication(id)
    load()
  }

  async function handleStatusChange(id: number, status: Status) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    try {
      await api.updateApplication(id, { status })
    } catch {
      load()
    }
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-display font-bold tracking-[-0.005em] text-ink">
            Applications
          </h1>
          <p className="mt-1 font-mono text-[0.6875rem] tracking-[0.08em] text-ink-2 uppercase">Timetable</p>
        </div>
        <button
          onClick={() => setModalApplication('new')}
          className="h-9 shrink-0 rounded-[var(--radius-input)] bg-ink px-4 text-sm font-medium whitespace-nowrap text-paper transition-[background-color,transform] duration-[var(--dur-short)] ease-[var(--ease-out)] hover:bg-ink/90 active:translate-y-px"
        >
          New application
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Search company or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} w-full sm:w-64`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${inputClass} w-auto`}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="py-6 text-center text-sm text-ink-2 sm:hidden">Loading…</p>}
      {!loading && applications.length === 0 && (
        <p className="py-6 text-center text-sm text-ink-2 sm:hidden">No applications yet</p>
      )}
      {!loading && applications.length > 0 && (
        <ul className="flex flex-col gap-3 sm:hidden">
          {applications.map((application) => (
            <li
              key={application.id}
              className="rounded-[var(--radius-card)] border border-rule bg-paper p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <Link
                  to={`/applications/${application.id}`}
                  className="min-w-0 [overflow-wrap:anywhere]"
                >
                  <p className="font-display text-base font-bold tracking-[-0.005em] text-ink uppercase">{application.company}</p>
                  <p className="text-sm text-ink-2">{application.role}</p>
                </Link>
                <StatusControl
                  status={application.status}
                  onChange={(status) => handleStatusChange(application.id, status)}
                  className="shrink-0"
                />
              </div>
              <div className="mb-3 flex items-center gap-2">
                <PlatformTag source={application.source} />
                <span className="font-mono text-xs text-ink-2 [font-variant-numeric:tabular-nums]">
                  {application.date_applied ?? '—'}
                </span>
              </div>
              <div className="flex items-center gap-4 border-t border-rule/60 pt-3">
                <button
                  onClick={() => setModalApplication(application)}
                  className="flex min-h-10 items-center text-sm text-ink-2 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] hover:text-ink"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(application.id)}
                  className="flex min-h-10 items-center text-sm text-status-rejected/80 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] hover:text-status-rejected"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="hidden overflow-x-auto rounded-[var(--radius-card)] border border-rule bg-paper sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-rule text-ink-2">
              <th className="px-4 py-3 font-mono text-[0.6875rem] font-medium tracking-[0.06em] uppercase">
                Company
              </th>
              <th className="px-4 py-3 font-mono text-[0.6875rem] font-medium tracking-[0.06em] uppercase">
                Role
              </th>
              <th className="px-4 py-3 font-mono text-[0.6875rem] font-medium tracking-[0.06em] uppercase">
                Status
              </th>
              <th className="px-4 py-3 font-mono text-[0.6875rem] font-medium tracking-[0.06em] uppercase">
                Source
              </th>
              <th className="px-4 py-3 font-mono text-[0.6875rem] font-medium tracking-[0.06em] uppercase">
                Applied
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-2">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && applications.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-2">
                  No applications yet
                </td>
              </tr>
            )}
            {applications.map((application) => (
              <tr
                key={application.id}
                className="border-b border-rule/60 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] last:border-0 hover:bg-paper-2"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/applications/${application.id}`}
                    className="font-display font-bold tracking-[-0.005em] text-ink uppercase underline decoration-transparent decoration-1 underline-offset-2 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] hover:decoration-rule-2"
                  >
                    {application.company}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-2">{application.role}</td>
                <td className="px-4 py-3">
                  <StatusControl
                    status={application.status}
                    onChange={(status) => handleStatusChange(application.id, status)}
                  />
                </td>
                <td className="px-4 py-3">
                  <PlatformTag source={application.source} />
                </td>
                <td className="px-4 py-3 font-mono text-ink-2 [font-variant-numeric:tabular-nums]">
                  {application.date_applied ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setModalApplication(application)}
                      className="text-ink-2 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(application.id)}
                      className="text-status-rejected/80 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] hover:text-status-rejected"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalApplication && (
        <ApplicationModal
          application={modalApplication === 'new' ? undefined : modalApplication}
          onClose={() => setModalApplication(null)}
          onSave={handleSave}
        />
      )}
    </Layout>
  )
}

const inputClass =
  'h-9 rounded-[var(--radius-input)] border border-rule-2 bg-paper px-3 text-sm text-ink outline outline-2 outline-transparent outline-offset-1 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] placeholder:text-ink-2 hover:bg-paper-2 focus-visible:outline-focus'

/** Source rendered like a platform indicator plate on a timetable. */
function PlatformTag({ source }: { source: string | null }) {
  if (!source) return <span className="text-ink-2">—</span>
  return (
    <span className="inline-flex items-center rounded-[var(--radius-tag)] border border-rule-2 px-1.5 py-0.5 font-mono text-[0.6875rem] tracking-[0.04em] text-ink-2 uppercase">
      {source}
    </span>
  )
}
