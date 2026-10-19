# src/
> L2 | 父级: ../CLAUDE.md

成员清单
server.ts: Worker 静态交付入口；先读有限页面与 PNG，其他请求延迟加载 Start
ssr-handler.ts: 原有请求作用域与流式 SSR；开发、预渲染和未覆盖路由共用
start.ts: Start 异常公开策略入口，SSR/服务端函数水合不输出内部错误正文
cloudflare-env.d.ts: Wrangler 自动生成 ASSETS 绑定类型，运行时全局类型由 workers-types 提供
App.tsx: 目录每页 50 条、新闻有界页与按需静态历史搜索、浏览/Agents 页脚编排，手机 Grid 固定分类/操作两行、桌面保留 Flex，连接数据/说明/筛选/收藏与遮罩预览
directory-catalog.d.ts: 展示目录与静态交付清单的虚拟模块类型桥，避免前端引用 Node 插件
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
