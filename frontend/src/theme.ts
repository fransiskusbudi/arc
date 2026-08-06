export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'arc-theme'

export function getTheme(): Theme {
  const current = document.documentElement.getAttribute('data-theme')
  return current === 'dark' ? 'dark' : 'light'
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(STORAGE_KEY, theme)
}
