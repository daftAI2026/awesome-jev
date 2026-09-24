import { createFileRoute } from '@tanstack/react-router'
import { en } from '@/i18n/locales/en'
import { zh } from '@/i18n/locales/zh'
import { localizedHead } from '@/lib/locale-head'

export const Route = createFileRoute('/_directory/{-$locale}/')({
  head: ({ params }) => {
    const locale = params.locale === 'zh' ? 'zh' : 'en'
    const messages = locale === 'zh' ? zh : en
    return localizedHead({ path: '/', locale, title: messages.documentTitle, description: messages.documentDescription })
  },
  component: () => null,
})
