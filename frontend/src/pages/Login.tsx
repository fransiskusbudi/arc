import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'

export function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="font-display text-3xl font-bold tracking-[0.08em] text-ink uppercase">
            Arc
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-rule-2" />
          <p className="mt-3 font-mono text-[0.6875rem] tracking-[0.1em] text-ink-2 uppercase">
            Station entrance
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-[var(--radius-card)] border border-rule bg-paper px-7 py-8"
        >
          <h1 className="mb-1 font-display text-xl font-bold tracking-[-0.005em] text-ink">
            Sign in
          </h1>
          <p className="mb-6 text-sm text-ink-2">Track your job search, one application at a time.</p>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-[var(--radius-input)] border border-status-rejected/40 bg-status-rejected/[0.06] px-3 py-2 text-sm text-status-rejected"
            >
              {error}
            </div>
          )}

          <label className="mb-5 block">
            <span className="mb-1.5 block font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-ink-2 uppercase">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? 'true' : undefined}
              disabled={submitting}
              className={inputClass}
            />
          </label>

          <label className="mb-6 block">
            <span className="mb-1.5 block font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-ink-2 uppercase">
              Password
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error ? 'true' : undefined}
              disabled={submitting}
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="h-9 w-full rounded-[var(--radius-input)] bg-accent text-sm font-medium tracking-[0.02em] text-accent-ink uppercase transition-[background-color,transform] duration-[var(--dur-short)] ease-[var(--ease-out)] hover:bg-accent/90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputClass =
  'h-9 w-full rounded-[var(--radius-input)] border border-rule-2 bg-paper px-3 text-sm text-ink outline outline-2 outline-transparent outline-offset-1 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] placeholder:text-ink-2 hover:bg-paper-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-55 aria-[invalid=true]:border-status-rejected'
