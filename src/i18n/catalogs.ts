import { en, type Messages } from './locales/en'
import { zh } from './locales/zh'
import { ja } from './locales/ja'
import type { Locale } from '@/lib/locale-routes'

export const catalogs: Record<Locale, Messages> = { en, zh, ja }
