/**
 * [INPUT]: 依赖 HeaderChoiceMenu 与路由驱动的 i18n
 * [OUTPUT]: 对外提供 LanguageMenu 语言控制
 * [POS]: components 的语言入口，沿用等价路径切换而非客户端翻译补丁
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Globe } from '@phosphor-icons/react'
import { HeaderChoiceMenu } from '@/components/HeaderChoiceMenu'
import { useI18n } from '@/i18n'

export function LanguageMenu() {
  const { locale, setLocale, t } = useI18n()

  return <HeaderChoiceMenu
    label={t('languageLabel')}
    icon={<Globe className="size-4" aria-hidden />}
    value={locale}
    options={[{ value: 'en', label: 'English' }, { value: 'zh', label: '简体中文' }, { value: 'ja', label: '日本語' }]}
    onValueChange={(next) => {
      if (next === 'en' || next === 'zh' || next === 'ja') setLocale(next)
    }}
  />
}
