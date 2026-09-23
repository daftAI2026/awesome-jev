import { Moon, Sun } from '@phosphor-icons/react'
import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

const STORAGE_KEY = 'awesome-jev-theme'
const CHANGE_EVENT = 'awesome-jev-theme-change'
type ThemePreference = 'system' | 'light' | 'dark'

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch { /* ignore */ }
  return 'system'
}

function syncDocument(preference: ThemePreference) {
  document.documentElement.classList.toggle('light', preference === 'light')
  document.documentElement.classList.toggle('dark', preference === 'dark')
}

function applyPreference(preference: 'light' | 'dark') {
  syncDocument(preference)
  try { localStorage.setItem(STORAGE_KEY, preference) } catch { /* ignore */ }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function isDarkTheme(): boolean {
  const preference = readPreference()
  return preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
}

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    syncDocument(readPreference())
    onChange()
  }
  media.addEventListener('change', onChange)
  window.addEventListener('storage', onStorage)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    media.removeEventListener('change', onChange)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

export function ThemeToggle() {
  const { t } = useI18n()
  const isDark = useSyncExternalStore(subscribe, isDarkTheme, () => false)
  const label = t(isDark ? 'switchToLight' : 'switchToDark')

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="size-9 text-muted-foreground"
      aria-label={label}
      title={label}
      onClick={() => {
        applyPreference(isDark ? 'light' : 'dark')
      }}
    >
      {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </Button>
  )
}
