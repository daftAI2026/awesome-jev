/**
 * [INPUT]: 依赖 en/zh/ja 同构文案及 Locale 类型
 * [OUTPUT]: 对外提供 按语言索引的 catalogs
 * [POS]: i18n 的纯文案汇合点，供服务端 head 与 React 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { en, type Messages } from './locales/en'
import { zh } from './locales/zh'
import { ja } from './locales/ja'
import type { Locale } from '@/lib/locale-routes'

export const catalogs: Record<Locale, Messages> = { en, zh, ja }
