import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getTheme, setTheme, type Theme } from '../theme'

const STATIONS = [
  { to: '/', end: true, label: 'Dashboard' },
  { to: '/applications', end: false, label: 'Applications' },
  { to: '/pipeline', end: false, label: 'Pipeline' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `group flex items-center gap-2 border-l-2 px-4 py-2.5 font-mono text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] sm:px-4 ${
    isActive
      ? 'border-accent text-ink'
      : 'border-transparent text-ink-2 hover:border-rule-2 hover:text-ink'
  }`
}

/** Compact variant for the mobile header fascia — three destinations have to
 * fit next to the wordmark and theme toggle in ~390px, so the active marker
 * is a bottom rule instead of the side-rail's lamp. */
function mobileNavLinkClass({ isActive }: { isActive: boolean }) {
  return `border-b-2 px-1.5 py-1 font-mono text-[0.625rem] font-medium tracking-[0.03em] uppercase transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] ${
    isActive ? 'border-accent text-ink' : 'border-transparent text-ink-2'
  }`
}

function NavLamp({ isActive }: { isActive: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`size-[7px] shrink-0 rounded-full transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] ${
        isActive ? 'bg-accent' : 'bg-rule-2 group-hover:bg-ink-2'
      }`}
    />
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-dvh bg-paper text-ink sm:flex">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-rule bg-paper-2 px-3 py-3 sm:hidden">
        <span className="shrink-0 font-display text-sm font-bold tracking-[0.06em] text-ink uppercase">
          Arc
        </span>
        <div className="flex min-w-0 items-center gap-1">
          <nav className="flex min-w-0 gap-1">
            {STATIONS.map((s) => (
              <NavLink key={s.to} to={s.to} end={s.end} className={mobileNavLinkClass}>
                {s.label}
              </NavLink>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <aside className="hidden sm:sticky sm:top-0 sm:flex sm:h-dvh sm:w-52 sm:shrink-0 sm:flex-col sm:border-r sm:border-rule sm:bg-paper-2">
        <div className="flex items-center justify-between border-b border-rule px-5 pt-6 pb-5">
          <span className="font-display text-lg font-bold tracking-[0.04em] text-ink uppercase">
            Arc
          </span>
          <ThemeToggle />
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-0 pt-4">
          {STATIONS.map((s) => (
            <NavLink key={s.to} to={s.to} end={s.end} className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <NavLamp isActive={isActive} />
                  {s.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-rule px-5 py-4">
          <p className="truncate font-mono text-[0.6875rem] text-ink-2">{user?.email}</p>
          <button
            onClick={logout}
            className="mt-2 font-mono text-xs tracking-[0.04em] text-ink-2 uppercase underline decoration-rule-2 decoration-1 underline-offset-2 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] hover:text-ink hover:decoration-ink-2 focus-visible:decoration-ink-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  )
}

function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(() => getTheme())

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === 'dark'}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-input)] text-ink-2 transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] hover:bg-paper-3 hover:text-ink focus-visible:text-ink"
    >
      {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.3" />
      <path
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        d="M8 1v1.6M8 13.4V15M15 8h-1.6M2.6 8H1M12.7 3.3l-1.13 1.13M4.43 11.57 3.3 12.7M12.7 12.7l-1.13-1.13M4.43 4.43 3.3 3.3"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.5 9.7A5.8 5.8 0 0 1 6.3 2.5a5.8 5.8 0 1 0 7.2 7.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}
