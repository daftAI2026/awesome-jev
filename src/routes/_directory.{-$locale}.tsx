import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_directory/{-$locale}')({
  beforeLoad: ({ params }) => {
    if (params.locale && params.locale !== 'zh') throw notFound()
  },
  component: Outlet,
})
