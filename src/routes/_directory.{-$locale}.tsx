import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { isLocalizedRouteParam } from '@/lib/locale-routes'

export const Route = createFileRoute('/_directory/{-$locale}')({
  beforeLoad: ({ params }) => {
    if (!isLocalizedRouteParam(params.locale)) throw notFound()
  },
  component: Outlet,
})
