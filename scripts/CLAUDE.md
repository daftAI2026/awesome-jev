# scripts/
> L2 | 父级: ../CLAUDE.md

成员清单
alternative-audit.test.ts: Node test alternative-audit 的契约与回归验证，运行 npm test
alternative-audit.ts: 既有目录的替代实现证据审计；运行暂停保留已完成检查点而不污染待审状态
alternatives-radar.test.ts: Node test alternatives-radar 的契约与回归验证，运行 npm test
alternatives-radar.ts: 独立替代实现队列，复用目录发布和预算边界
awesome-jev-banner.txt: 目录字符字标的原始资产
catalog-updated-at.test.ts: Node test catalog-updated-at 的契约与回归验证，运行 npm test
catalog.test.ts: Node test catalog 的契约与回归验证，运行 npm test
catalog.ts: GitHub 规范目录的嵌套类型/增量身份校验、共享容量告警/提前发布门槛、README 渲染及受控快照应用
category-order.test.ts: Node test category-order 的契约与回归验证，运行 npm test
code-discovery.test.ts: Node test code-discovery 的契约与回归验证，运行 npm test
code-discovery.ts: 代码搜索线索与固定提交内容证据提取
directory-catalog.test.ts: 全目录展示/检索/排序等价及真实 Vite client/SSR 热更新的投影回归
directory-catalog.ts: 构建期展示白名单与虚拟模块，规范快照保留完整审计且无第二份生成数据
generate-og.ts: 依据目录计数生成 Open Graph SVG/PNG
generate-sitemap.test.ts: Node test generate-sitemap 的契约与回归验证，运行 npm test
generate-sitemap.ts: 生成三种语言的有限索引，排除收藏和不足摘要
github-client.test.ts: Node test 实际响应头、限流等待、截止与权限错误的离线回归
github-client.ts: 共享 GitHub 读取、响应头驱动限流及整轮暂停分类，截止覆盖发现/刷新/取证
github-metadata-aliases.ts: 28 条人工复核的统计迁移映射，固定查验日期/源码提交和 immutable repository ID；不重写公开 URL 或作者内容
github-metadata.test.ts: Node test Top100 固定点、28 条迁移及 immutable ID 防重占、目录增删续点和实际额度暂停回归
github-metadata.ts: 同一只读客户端的 50 项批读；每轮 Top100 成功刷新，其它最多 1000 项按身份锚点续读；独立能力探针不加载付费凭据
github-evidence.ts: 固定提交的 GitHub 来源与替代实现证据
inclusion.test.ts: Node test inclusion 的契约与回归验证，运行 npm test
inclusion.ts: 采集侧收录证据校验与改动验证
jev-client.ts: 仅服务端的 Jev 审核请求和决策契约
locale-routes.test.ts: Node test locale-routes 的契约与回归验证，运行 npm test
masonry.test.ts: Node test 通道/间距和水合前滚动的窗口/位置契约，避免自然流丢失虚拟前缀
model-types.ts: 采集、GitHub 来源与模型审核的共享类型；GitHubQuery 只允许客户端声明的只读 GraphQL
news-sync.test.ts: Node test news-sync 的契约与回归验证，运行 npm test
not-found.test.ts: Node test 真实 HTTP 404/三语言/恢复链接与正常页索引回归，需 TEST_SITE_ORIGIN
page-delivery.test.ts: Node test 启动模块总依赖、单条详情与预渲染读取内容，使用 TEST_BUILD_OUTPUT/TEST_SITE_ORIGIN
news-sync.ts: 独立 AIHOT 新闻快照同步与数据校验
prepare-build-history.test.ts: Node test prepare-build-history 的契约与回归验证，运行 npm test
prepare-build-history.ts: 构建前 Git 历史准备，保证更新时间来自真实数据
project-routes.test.ts: Node test project-routes 的契约与回归验证，运行 npm test
radar-budget.test.ts: Node test radar-budget 的契约与回归验证，运行 npm test
radar-budget.ts: 审核请求预算与持久化边界
radar.test.ts: Node test radar 的契约与回归验证，运行 npm test
radar.ts: Top100 优先刷新、其它项续点、核心生态发现与可信快照发布；Top 不完整先存诊断并非零退出，完整 Top 的部分轮转允许发布
repository-review.test.ts: Node test repository-review 的契约与回归验证，运行 npm test
repository-review.ts: 固定提交的整仓审核与文件排除策略
review-checkpoint.ts: 核对可信 workflow/attempt/jobs，按 collect 时序定位预算；当日缺失账本拒绝回退
review-store.test.ts: Node test review-store 的契约与回归验证，运行 npm test
review-store.ts: 有界本地审核状态存储与失效清理
review-types.ts: 整仓审核任务、队列与存储的接口契约
saved.test.ts: Node test saved 的契约与回归验证，运行 npm test
scroll-restoration.test.ts: Node test 首次水合、迟到滚动、导航与 hash 的恢复策略边界
score-sources.ts: 离线来源打分/分类入口，不进入前端包
submission-entry.test.ts: Node test 页头链接、表单标题与单仓库候选提取，离线验证投稿接入而不创建真实申请
submission-review.test.ts: Node test submission-review 的契约与回归验证，运行 npm test
submission-review.ts: 可信投稿提取、带输入版本的可失效报告与串行节流的请求前预算评论
ui-transitions.test.ts: Node test UI 原语显隐过渡与编译后 CSS，保留颜色、焦点和按压反馈而排除 visibility

verify-delivery.test.ts: 真实子进程验证交付编排的失败/跳过/取消与自有进程清理
verify-delivery.ts: 构建后零跳过 HTTP/模块图验收，拥有临时预览生命周期，不调用采集接口

法则: 成员完整·依赖单向·数据来源明确
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
