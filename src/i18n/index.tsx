import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useRouterState } from '@tanstack/react-router'
import { en, type MessageKey, type Messages } from './locales/en'
import { zh } from './locales/zh'
import { LOCALE_STORAGE_KEY, localeFromPath, localizedPath, type Locale } from '@/lib/locale-routes'

export type { Locale } from '@/lib/locale-routes'

const catalogs: Record<Locale, Messages> = { en, zh }

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const locale = localeFromPath(pathname)

  const setLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    const target = localizedPath(window.location.pathname, next) + window.location.search + window.location.hash
    if (target !== window.location.pathname + window.location.search + window.location.hash) window.location.replace(target)
  }, [])

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      let text = catalogs[locale][key] ?? catalogs.en[key] ?? String(key)
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replaceAll(`{${k}}`, String(v))
        }
      }
      return text
    },
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
