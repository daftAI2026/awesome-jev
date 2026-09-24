import { createFileRoute, Outlet } from '@tanstack/react-router'
import App from '@/App'

export const Route = createFileRoute('/_directory')({
  component: DirectoryLayout,
})

function DirectoryLayout() {
  return (
    <>
      <App />
      <Outlet />
    </>
  )
}
