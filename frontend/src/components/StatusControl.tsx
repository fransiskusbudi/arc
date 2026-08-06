import { useEffect, useId, useRef, useState } from 'react'
import { STATUSES } from '../api/types'
import type { Status } from '../api/types'
import { STATUS_DOT_STYLES, STATUS_STYLES } from './StatusBadge'

interface Props {
  status: Status
  onChange: (status: Status) => Promise<void>
  disabled?: boolean
  className?: string
}

/** Interactive status pill — click/Enter opens a menu of all 7 statuses.
 * Optimistic: the caller applies the change immediately and reverts on error. */
export function StatusControl({ status, onChange, disabled, className }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  async function select(next: Status) {
    setOpen(false)
    if (next === status || pending) return
    setPending(true)
    try {
      await onChange(next)
    } finally {
      setPending(false)
    }
  }

  return (
    <div ref={rootRef} className={`relative inline-block ${className ?? ''}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled || pending}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={`relative inline-flex items-center gap-1 rounded-[var(--radius-tag)] border px-2 py-0.5 font-mono text-[0.6875rem] font-medium tracking-[0.04em] uppercase transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] before:absolute before:-inset-[11px] before:content-[''] hover:bg-paper-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60 ${STATUS_STYLES[status]}`}
      >
        {pending ? 'updating…' : status}
        <ChevronIcon />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Change status"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full left-0 z-[var(--z-dropdown)] mt-1 min-w-[9.5rem] overflow-hidden rounded-[var(--radius-input)] border border-rule bg-paper py-1 shadow-[0_8px_24px_-8px_rgb(0_0_0_/_0.28)]"
        >
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              role="menuitemradio"
              aria-checked={s === status}
              onClick={() => select(s)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[0.6875rem] font-medium tracking-[0.04em] uppercase transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] hover:bg-paper-2 ${
                s === status ? 'text-ink' : 'text-ink-2'
              }`}
            >
              <span className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT_STYLES[s]}`} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
      <path d="M2 3.25 4.5 5.75 7 3.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
