import { createFileRoute } from '@tanstack/react-router'
import { catalogs } from '@/i18n/catalogs'
import { localizedHead } from '@/lib/locale-head'
import { localeFromParam } from '@/lib/locale-routes'

export const Route = createFileRoute('/_directory/{-$locale}/')({
  head: ({ params }) => {
    const locale = localeFromParam(params.locale)
    const messages = catalogs[locale]
    return localizedHead({ path: '/', locale, title: messages.documentTitle, description: messages.documentDescription })
  },
  component: () => null,
})
