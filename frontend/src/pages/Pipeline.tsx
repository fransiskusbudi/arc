import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Layout } from '../components/Layout'
import { StatusControl } from '../components/StatusControl'
import { api } from '../api/client'
import type { Application, Status } from '../api/types'

type ColumnKey = 'lead' | 'applied' | 'interviewing' | 'offer' | 'done'

const COLUMNS: { key: ColumnKey; label: string; note: string; statuses: Status[] }[] = [
  { key: 'lead', label: 'Lead', note: 'platform', statuses: ['lead'] },
  { key: 'applied', label: 'Applied', note: 'departure', statuses: ['applied'] },
  { key: 'interviewing', label: 'Interviewing', note: 'in transit', statuses: ['interviewing'] },
  { key: 'offer', label: 'Offer', note: 'arrival', statuses: ['offer'] },
  { key: 'done', label: 'Done', note: 'sideline', statuses: ['rejected', 'withdrawn', 'declined'] },
]

const MAIN_LINE = COLUMNS.filter((c) => c.key !== 'done')
const SIDELINE = COLUMNS.find((c) => c.key === 'done')!

function columnForStatus(status: Status): ColumnKey {
  return COLUMNS.find((c) => c.statuses.includes(status))?.key ?? 'lead'
}

/** Moving a card into a multi-status column (Done) needs one concrete status
 * to write back. If the card is already in that bucket, keep it as-is;
 * otherwise default to the most common terminal state (rejected) — the
 * card's own StatusControl can refine to withdrawn/declined in one click. */
function resolveStatusForColumn(column: ColumnKey, currentStatus: Status): Status {
  const col = COLUMNS.find((c) => c.key === column)
  if (!col) return currentStatus
  return col.statuses.includes(currentStatus) ? currentStatus : col.statuses[0]
}

function emptyBoard(): Record<ColumnKey, number[]> {
  return { lead: [], applied: [], interviewing: [], offer: [], done: [] }
}

function groupByColumn(apps: Application[]): Record<ColumnKey, number[]> {
  const board = emptyBoard()
  for (const app of apps) board[columnForStatus(app.status)].push(app.id)
  return board
}

function computeDragEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  return !coarsePointer && window.innerWidth >= 640
}

function useDragEnabled(): boolean {
  const [enabled, setEnabled] = useState(computeDragEnabled)
  useEffect(() => {
    const update = () => setEnabled(computeDragEnabled())
    const mq = window.matchMedia('(pointer: coarse)')
    window.addEventListener('resize', update)
    mq.addEventListener('change', update)
    return () => {
      window.removeEventListener('resize', update)
      mq.removeEventListener('change', update)
    }
  }, [])
  return enabled
}

export function Pipeline() {
  const [applications, setApplications] = useState<Application[]>([])
  const [board, setBoard] = useState<Record<ColumnKey, number[]>>(emptyBoard)
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const dragEnabled = useDragEnabled()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const byId = useMemo(
    () => Object.fromEntries(applications.map((a) => [a.id, a])) as Record<number, Application>,
    [applications],
  )

  function load() {
    setLoading(true)
    api
      .listApplications()
      .then((apps) => {
        setApplications(apps)
        setBoard(groupByColumn(apps))
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function containerOf(id: UniqueIdentifier): ColumnKey | null {
    if (typeof id === 'string' && COLUMNS.some((c) => c.key === id)) return id as ColumnKey
    const numId = Number(id)
    return COLUMNS.find((c) => board[c.key].includes(numId))?.key ?? null
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeId = active.id as number
    const activeContainer = containerOf(active.id)
    const overContainer = containerOf(over.id)
    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setBoard((prev) => {
      const activeItems = prev[activeContainer]
      const overItems = prev[overContainer]
      const overIndex = overItems.indexOf(Number(over.id))
      const newIndex = overIndex >= 0 ? overIndex : overItems.length
      return {
        ...prev,
        [activeContainer]: activeItems.filter((id) => id !== activeId),
        [overContainer]: [...overItems.slice(0, newIndex), activeId, ...overItems.slice(newIndex)],
      }
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const appId = active.id as number
    const app = byId[appId]
    if (!app) return

    const finalColumn = containerOf(over.id) ?? containerOf(active.id)
    if (!finalColumn) return

    setBoard((prev) => {
      const items = prev[finalColumn]
      const oldIndex = items.indexOf(appId)
      const overIndex = typeof over.id === 'number' ? items.indexOf(over.id as number) : items.length - 1
      if (oldIndex === -1 || overIndex === -1 || oldIndex === overIndex) return prev
      return { ...prev, [finalColumn]: arrayMove(items, oldIndex, overIndex) }
    })

    const originalColumn = columnForStatus(app.status)
    if (finalColumn === originalColumn) return

    const nextStatus = resolveStatusForColumn(finalColumn, app.status)
    if (nextStatus === app.status) return

    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: nextStatus } : a)))
    try {
      setError(null)
      await api.updateApplication(appId, { status: nextStatus })
    } catch {
      setError(`Couldn't move ${app.company} — reverted.`)
      load()
    }
  }

  async function handleStatusChange(id: number, status: Status) {
    const app = byId[id]
    if (!app) return
    const fromColumn = columnForStatus(app.status)
    const toColumn = columnForStatus(status)

    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    if (fromColumn !== toColumn) {
      setBoard((prev) => ({
        ...prev,
        [fromColumn]: prev[fromColumn].filter((x) => x !== id),
        [toColumn]: [...prev[toColumn], id],
      }))
    }
    try {
      setError(null)
      await api.updateApplication(id, { status })
    } catch {
      setError(`Couldn't update ${app.company} — reverted.`)
      load()
    }
  }

  return (
    <Layout>
      <h1 className="font-display text-display font-bold tracking-[-0.005em] text-ink">Pipeline</h1>
      <p className="mt-1 mb-6 font-mono text-[0.6875rem] tracking-[0.08em] text-ink-2 uppercase">
        The journey line — lead to offer
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-[var(--radius-input)] border border-status-rejected/40 bg-status-rejected/[0.06] px-3 py-2 text-sm text-status-rejected"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink-2">Loading…</p>
      ) : (
        <DndContext
          sensors={dragEnabled ? sensors : []}
          collisionDetection={closestCorners}
          onDragStart={(e) => setActiveId(e.active.id as number)}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="-mx-4 flex items-start gap-0 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <div className="flex shrink-0 gap-4">
              {MAIN_LINE.map((column) => (
                <KanbanColumn
                  key={column.key}
                  column={column}
                  applications={board[column.key].map((id) => byId[id]).filter(Boolean)}
                  dragEnabled={dragEnabled}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>

            <div aria-hidden="true" className="mt-[13px] flex w-8 shrink-0 items-center">
              <div className="h-px w-full border-t border-dashed border-rule-2" />
            </div>

            <KanbanColumn
              column={SIDELINE}
              applications={board.done.map((id) => byId[id]).filter(Boolean)}
              dragEnabled={dragEnabled}
              onStatusChange={handleStatusChange}
              sideline
            />
          </div>
          <DragOverlay>
            {activeId && byId[activeId] ? (
              <div className="w-72 border border-ink bg-paper px-3 py-2.5">
                <KanbanCardContent application={byId[activeId]} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </Layout>
  )
}

function KanbanColumn({
  column,
  applications,
  dragEnabled,
  onStatusChange,
  sideline,
}: {
  column: (typeof COLUMNS)[number]
  applications: Application[]
  dragEnabled: boolean
  onStatusChange: (id: number, status: Status) => Promise<void>
  sideline?: boolean
}) {
  const { setNodeRef } = useDroppable({ id: column.key })

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="relative pb-2">
        <div className={`h-px w-full ${sideline ? 'border-t border-dashed border-rule-2' : 'bg-rule-2'}`} />
        <span
          aria-hidden="true"
          className={`absolute top-0 left-0 size-[9px] -translate-y-1/2 border-2 bg-paper ${sideline ? 'rounded-none border-rule-2' : 'rounded-full border-ink'}`}
        />
        <div className="mt-2.5 flex items-baseline justify-between">
          <div className="min-w-0">
            <h2 className="font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-ink uppercase">
              {column.label}
            </h2>
            <p className="font-mono text-[0.625rem] tracking-[0.04em] text-ink-2 lowercase">{column.note}</p>
          </div>
          <span className="shrink-0 font-mono text-xs text-ink-2 [font-variant-numeric:tabular-nums]">
            {applications.length}
          </span>
        </div>
      </div>
      <div ref={setNodeRef} className="flex min-h-24 flex-1 flex-col">
        <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {applications.map((application) => (
            <KanbanCard
              key={application.id}
              application={application}
              dragEnabled={dragEnabled}
              onStatusChange={onStatusChange}
            />
          ))}
        </SortableContext>
        {applications.length === 0 && (
          <p className="mt-2 border border-dashed border-rule-2 px-3 py-4 text-center font-mono text-[0.6875rem] tracking-[0.04em] text-ink-2 uppercase">
            Empty
          </p>
        )}
      </div>
    </div>
  )
}

function KanbanCard({
  application,
  dragEnabled,
  onStatusChange,
}: {
  application: Application
  dragEnabled: boolean
  onStatusChange: (id: number, status: Status) => Promise<void>
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
    disabled: !dragEnabled,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border-b border-rule py-2.5 transition-opacity duration-[var(--dur-short)] ease-[var(--ease-out)] last:border-0 ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <KanbanCardContent application={application} />
        {dragEnabled && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Drag ${application.company} — ${application.role}`}
            className="shrink-0 touch-none p-1 text-ink-2 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] hover:text-ink active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <GripIcon />
          </button>
        )}
      </div>
      <div className="mt-2">
        <StatusControl status={application.status} onChange={(status) => onStatusChange(application.id, status)} />
      </div>
    </div>
  )
}

function KanbanCardContent({ application }: { application: Application }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-display text-sm font-bold tracking-[-0.005em] text-ink uppercase">
        {application.company}
      </p>
      <p className="truncate text-xs text-ink-2">{application.role}</p>
      {(application.next_followup || application.source) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {application.next_followup && (
            <span className="font-mono text-[0.6875rem] text-ink-2 [font-variant-numeric:tabular-nums]">
              {application.next_followup}
            </span>
          )}
          {application.source && (
            <span className="rounded-[var(--radius-tag)] border border-rule-2 px-1.5 py-0.5 font-mono text-[0.625rem] tracking-[0.04em] text-ink-2 uppercase">
              {application.source}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <circle cx="4.5" cy="3" r="1" />
      <circle cx="9.5" cy="3" r="1" />
      <circle cx="4.5" cy="7" r="1" />
      <circle cx="9.5" cy="7" r="1" />
      <circle cx="4.5" cy="11" r="1" />
      <circle cx="9.5" cy="11" r="1" />
    </svg>
  )
}
