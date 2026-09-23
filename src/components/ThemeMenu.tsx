import { Moon, Sun } from '@phosphor-icons/react'
import { useSyncExternalStore } from 'react'
import { HeaderChoiceMenu } from '@/components/HeaderChoiceMenu'
import { useI18n } from '@/i18n'

const STORAGE_KEY = 'awesome-jev-theme'
const CHANGE_EVENT = 'awesome-jev-theme-change'
type ThemePreference = 'system' | 'light' | 'dark'
type ThemeSnapshot = `${ThemePreference}:${'light' | 'dark'}`
let sessionPreference: ThemePreference | null = null

function readPreference(): ThemePreference {
  if (sessionPreference) return sessionPreference
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch { /* ignore */ }
  return 'system'
}

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function isDark(preference: ThemePreference): boolean {
  return preference === 'dark' || (preference === 'system' && prefersDark())
}

function snapshot(): ThemeSnapshot {
  const preference = readPreference()
  return `${preference}:${isDark(preference) ? 'dark' : 'light'}`
}

function syncDocument(preference: ThemePreference) {
  document.documentElement.classList.toggle('light', preference === 'light')
  document.documentElement.classList.toggle('dark', isDark(preference))
}

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    sessionPreference = null
    syncDocument(readPreference())
    onChange()
  }
  const onSystemChange = () => {
    if (readPreference() === 'system') syncDocument('system')
    onChange()
  }
  media.addEventListener('change', onSystemChange)
  window.addEventListener('storage', onStorage)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    media.removeEventListener('change', onSystemChange)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

function commitPreference(preference: ThemePreference) {
  sessionPreference = preference
  syncDocument(preference)
  try {
    if (preference === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, preference)
  } catch { /* keep current-tab preference */ }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function applyPreference(preference: ThemePreference) {
  const update = () => commitPreference(preference)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (isDark(readPreference()) === isDark(preference) || reducedMotion || !document.startViewTransition) {
    update()
    return
  }
  window.setTimeout(() => {
    if (document.hidden || isDark(readPreference()) === isDark(preference)) update()
    else document.startViewTransition(update)
  }, 0)
}

export function ThemeMenu() {
  const { t } = useI18n()
  const current = useSyncExternalStore(subscribe, snapshot, () => 'system:light')
  const [preference, effective] = current.split(':') as [ThemePreference, 'light' | 'dark']

  return <HeaderChoiceMenu
    label={t('themeLabel')}
    icon={effective === 'dark' ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
    value={preference}
    options={[
      { value: 'system', label: t('themeSystem') },
      { value: 'light', label: t('themeLight') },
      { value: 'dark', label: t('themeDark') },
    ]}
    onValueChange={(next) => {
      if (next === 'system' || next === 'light' || next === 'dark') applyPreference(next)
    }}
  />
}
