# src/
> L2 | 父级: ../CLAUDE.md

成员清单
cloudflare-env.d.ts: Wrangler 自动生成 ASSETS 绑定类型，运行时全局类型由 workers-types 提供
App.tsx: React 目录与 Agents 页脚编排，手机 Grid 固定分类/操作两行、桌面保留 Flex，连接数据/说明/筛选/收藏与遮罩预览
directory-catalog.d.ts: 构建展示虚拟模块的类型桥，避免前端引用 Node 插件实现
index.css: Tailwind 4 语义主题、字体和目录布局规则，窄屏卡片不等待水合才能显示
routeTree.gen.ts: TanStack 自动生成路由树，不手动编辑
router.tsx: TanStack Router 工厂，首次水合保留已有阅读位置，后续滚动恢复与遮罩由 Router 管理

子模块
components/: 见 components/CLAUDE.md
hooks/: 见 hooks/CLAUDE.md
i18n/: 见 i18n/CLAUDE.md
lib/: 见 lib/CLAUDE.md
routes/: 见 routes/CLAUDE.md

法则: 成员完整·依赖单向·数据来源明确
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
