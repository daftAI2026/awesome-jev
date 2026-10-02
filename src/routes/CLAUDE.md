# src/routes/
> L2 | 父级: ../CLAUDE.md

成员清单
api.og.site.ts: 全站 GET/HEAD 动态 PNG/405 端点，计数来自完整已发布目录
api.og.projects.$owner.$repo.ts: 项目 GET/HEAD 动态 PNG/405 端点，规范目录身份控制可生成范围
og[.]png.ts: 旧全站分享地址的运行时兼容路由，与新端点共享当前数据和缓存
__root.tsx: TanStack 文档壳、首屏语言/主题初始化和统一 404 边界
_directory.tsx: 无路径目录布局，将 App 与子路由 Outlet 组合
_directory.{-$locale}.category.$category.tsx: 分类白名单校验与分类元数据，非法分类交给根 404
_directory.{-$locale}.index.tsx: 目录首页及对应语言的搜索元数据
_directory.{-$locale}.news.tsx: Start 服务端函数加载新闻索引，预渲染与客户端导航消费同一快照
_directory.{-$locale}.preview.$owner.$repo.tsx: 复用目录投影与独立页分享图身份，遮罩 head 不回退成全站图
_directory.{-$locale}.saved.tsx: 浏览器本地收藏的验证搜索状态，禁止索引
_directory.{-$locale}.top100.tsx: 全目录星标前 100 的页面身份与元数据
_directory.{-$locale}.tsx: 语言分组，拒绝未知语言参数并向子路由传递布局
{-$locale}.og-workbench.tsx: DEV 编译期开关隔离的三语言本地工作台；生产 beforeLoad/loader 均拒绝访问并返回 404，不靠 noindex 鉴权
{-$locale}.news.$id.tsx: 新闻独立摘要页，Start 交付单条记录，校验 ID 并呈现专用缺失说明
{-$locale}.projects.$owner.$repo.tsx: 项目独立页，Start 交付单条记录，规范身份决定项目分享图，缺失返回真实 404

法则: 成员完整·依赖单向·数据来源明确
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
