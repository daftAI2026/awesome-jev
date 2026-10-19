# src/routes/
> L2 | 父级: ../CLAUDE.md

成员清单
_directory.{-$locale}.tags.$tag.tsx: 标签计数/每页 50 条元数据，同义地址 301、未知 404、长尾 noindex
_directory.{-$locale}.tags.index.tsx: 三语言公开标签索引与同源元数据，App 复用展示投影
api.og.site.ts: 全站开发 PNG/405 回退端点；生产轻入口先交付构建 PNG
api.og.projects.$owner.$repo.ts: 项目开发 PNG/405 回退端点；生产静态清单先校验公开身份
og[.]png.ts: 旧全站分享地址的开发兼容路由；生产轻入口复用同版本 PNG
__root.tsx: TanStack 文档壳、首屏语言/主题初始化和统一 404/500 边界；错误响应 no-store/noindex，移除成功 SEO
_directory.tsx: 无路径目录布局，将 App 与子路由 Outlet 组合
_directory.{-$locale}.category.$category.tsx: 分类白名单校验与可见用途说明同源的逐页分类元数据，非法分类交给根 404
_directory.{-$locale}.index.tsx: 目录首页与逐页语言搜索元数据
_directory.{-$locale}.news.tsx: Start 仅交付当前 50 条、计数和可选单条预览，页码驱动 loader，逐页规范地址同源
_directory.{-$locale}.preview.$owner.$repo.tsx: 复用目录投影与独立页分享图身份，遮罩 head 不回退成全站图
_directory.{-$locale}.saved.tsx: 浏览器本地收藏的验证搜索状态，禁止索引
_directory.{-$locale}.top100.tsx: 全目录星标前 100 的逐页身份与元数据
_directory.{-$locale}.tsx: 语言分组，拒绝未知语言，校验 page/sort 并向子路由传递布局
{-$locale}.og-workbench.tsx: 唯一三语言 DEV 工作台入口；侧栏 OG/SEO/预览共享校验搜索状态，生产 beforeLoad/loader 均拒绝 GET/HEAD 并返回 404
{-$locale}.news.$id.tsx: 新闻独立摘要页，Start 交付单条记录，校验 ID 并呈现专用缺失说明
{-$locale}.projects.$owner.$repo.tsx: 项目独立页，Start 交付当前项目与最多三条相关摘要，提供单列分类/公开标签与页脚内链，规范身份决定分享图，旧地址永久 301，缺失返回真实 404

法则: 成员完整·依赖单向·数据来源明确
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
