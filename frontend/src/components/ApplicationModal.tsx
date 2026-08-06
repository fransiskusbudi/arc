import { useEffect, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react'
import { STATUSES } from '../api/types'
import type { Application, ApplicationInput } from '../api/types'

interface Props {
  application?: Application
  onClose: () => void
  onSave: (payload: ApplicationInput) => Promise<void>
}

const emptyForm: ApplicationInput = {
  company: '',
  role: '',
  source: '',
  location: '',
  salary: '',
  cv_variant: '',
  url: '',
  status: 'lead',
  date_applied: '',
  next_action: '',
  next_followup: '',
  notes: '',
}

export function ApplicationModal({ application, onClose, onSave }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<ApplicationInput>(
    application
      ? {
          company: application.company,
          role: application.role,
          source: application.source ?? '',
          location: application.location ?? '',
          salary: application.salary ?? '',
          cv_variant: application.cv_variant ?? '',
          url: application.url ?? '',
          status: application.status,
          date_applied: application.date_applied ?? '',
          next_action: application.next_action ?? '',
          next_followup: application.next_followup ?? '',
          notes: application.notes ?? '',
        }
      : emptyForm,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
  }, [])

  function handleBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose()
  }

  function update<K extends keyof ApplicationInput>(key: K, value: ApplicationInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = {
        ...form,
        source: form.source || null,
        location: form.location || null,
        salary: form.salary || null,
        cv_variant: form.cv_variant || null,
        url: form.url || null,
        date_applied: form.date_applied || null,
        next_action: form.next_action || null,
        next_followup: form.next_followup || null,
        notes: form.notes || null,
      }
      await onSave(payload)
    } catch {
      setError('Failed to save application')
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      className="m-auto max-h-[min(80vh,40rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-[var(--radius-card)] border border-rule bg-paper p-0 backdrop:bg-ink/40"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="mb-4 font-display text-lg font-bold tracking-[-0.005em] text-ink uppercase">
          {application ? 'Edit application' : 'New application'}
        </h2>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-[var(--radius-input)] border border-status-rejected/40 bg-status-rejected/[0.06] px-3 py-2 text-sm text-status-rejected"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Company" required>
            <input
              required
              value={form.company}
              onChange={(e) => update('company', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Role" required>
            <input
              required
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value as ApplicationInput['status'])}
              className={inputClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source">
            <input value={form.source ?? ''} onChange={(e) => update('source', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Location">
            <input
              value={form.location ?? ''}
              onChange={(e) => update('location', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Salary">
            <input value={form.salary ?? ''} onChange={(e) => update('salary', e.target.value)} className={inputClass} />
          </Field>
          <Field label="CV variant">
            <input
              value={form.cv_variant ?? ''}
              onChange={(e) => update('cv_variant', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="URL">
            <input value={form.url ?? ''} onChange={(e) => update('url', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Date applied">
            <input
              type="date"
              value={form.date_applied ?? ''}
              onChange={(e) => update('date_applied', e.target.value)}
              className={`${inputClass} font-mono [font-variant-numeric:tabular-nums]`}
            />
          </Field>
          <Field label="Next follow-up">
            <input
              type="date"
              value={form.next_followup ?? ''}
              onChange={(e) => update('next_followup', e.target.value)}
              className={`${inputClass} font-mono [font-variant-numeric:tabular-nums]`}
            />
          </Field>
          <Field label="Next action" full>
            <input
              value={form.next_action ?? ''}
              onChange={(e) => update('next_action', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Notes" full>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              className={`${inputClass} h-auto min-h-24 resize-y py-1.5`}
            />
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-[var(--radius-input)] border border-rule-2 px-4 text-sm font-medium text-ink-2 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] hover:bg-paper-2 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-9 rounded-[var(--radius-input)] bg-ink px-4 text-sm font-medium text-paper transition-[background-color,transform] duration-[var(--dur-short)] ease-[var(--ease-out)] hover:bg-ink/90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

const inputClass =
  'h-9 w-full rounded-[var(--radius-input)] border border-rule-2 bg-paper px-3 text-sm text-ink outline outline-2 outline-transparent outline-offset-1 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] placeholder:text-ink-2 hover:bg-paper-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-55'

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string
  required?: boolean
  full?: boolean
  children: ReactNode
}) {
  return (
    <label className={`block text-sm ${full ? 'col-span-2' : ''}`}>
      <span className="mb-1 block font-mono text-[0.6875rem] font-medium tracking-[0.06em] text-ink-2 uppercase">
        {label}
        {required && <span className="text-status-rejected"> *</span>}
      </span>
      {children}
    </label>
  )
}
