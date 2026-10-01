# src/
> L2 | 父级: ../CLAUDE.md

成员清单
App.tsx: React 目录编排，连接数据、筛选、收藏与遮罩预览
index.css: Tailwind 4 语义主题、字体和目录布局规则，所有页面共用
main.tsx: 保留的旧 SPA 入口；当前 TanStack Start 使用框架生成的客户端入口
routeTree.gen.ts: TanStack 自动生成路由树，不手动编辑
router.tsx: TanStack Router 工厂，逐请求隔离并启用滚动恢复与遮罩

子模块
components/: 见 components/CLAUDE.md
hooks/: 见 hooks/CLAUDE.md
i18n/: 见 i18n/CLAUDE.md
lib/: 见 lib/CLAUDE.md
routes/: 见 routes/CLAUDE.md

法则: 成员完整·依赖单向·数据来源明确
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
