# src/routes/
> L2 | 父级: ../CLAUDE.md

成员清单
__root.tsx: TanStack 文档壳、首屏语言/主题初始化和统一 404 边界
_directory.tsx: 无路径目录布局，将 App 与子路由 Outlet 组合
_directory.{-$locale}.category.$category.tsx: 分类白名单校验与分类元数据，非法分类交给根 404
_directory.{-$locale}.index.tsx: 目录首页及对应语言的搜索元数据
_directory.{-$locale}.news.tsx: 新闻索引与摘要数据加载，保留目录布局
_directory.{-$locale}.preview.$owner.$repo.tsx: 目录内项目预览，公开 URL 由路由遮罩承担
_directory.{-$locale}.saved.tsx: 浏览器本地收藏的验证搜索状态，禁止索引
_directory.{-$locale}.top100.tsx: 全目录星标前 100 的页面身份与元数据
_directory.{-$locale}.tsx: 语言分组，拒绝未知语言参数并向子路由传递布局
{-$locale}.news.$id.tsx: 新闻独立摘要页，校验 ID 并呈现专用缺失说明
{-$locale}.projects.$owner.$repo.tsx: 项目独立页，校验来源身份并呈现专用缺失说明

法则: 成员完整·依赖单向·数据来源明确
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
