/**
 * [INPUT]: 依赖 TanStack Outlet 与 App 目录布局
 * [OUTPUT]: 对外提供 目录的无路径布局 Route
 * [POS]: routes 的目录容器，详情独立页不依赖此布局
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
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
