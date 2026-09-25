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
