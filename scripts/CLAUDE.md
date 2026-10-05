# scripts/
> L2 | 父级: ../CLAUDE.md

成员清单
publication-merge.ts: 三方纯数据增量合并，保留最新 main 顺序/人工字段/撤回，禁止旧快照整体覆盖
publish-data.ts: 三采集器共享发布器，先 fetch main，再叠加本轮结果/重建验证/普通 push；仅竞争重试三次，不重跑模型
publish-data.test.ts: Node test 真实本地 Git 竞争、三采集器叠加、验证失败不推送和临时工作树清理
onsite-seo.test.ts: Node test 相关项目、工作台输入、SEO 诊断与有界流读取的离线边界验证
alternative-audit.test.ts: Node test alternative-audit 的契约与回归验证，运行 npm test
alternative-audit.ts: 既有目录的替代实现证据审计；运行暂停保留已完成检查点而不污染待审状态
alternatives-radar.test.ts: Node test alternatives-radar 的契约与回归验证，运行 npm test
alternatives-radar.ts: 独立替代实现队列，复用目录发布和预算边界，发现前补旧项身份，数字 ID 排除改名后的已收录对象
awesome-jev-banner.txt: 目录字符字标的原始资产
catalog-updated-at.test.ts: Node test catalog-updated-at 的契约与回归验证，运行 npm test
catalog.test.ts: Node test catalog 的契约与回归验证，运行 npm test
catalog.ts: GitHub 规范目录的嵌套类型/数字身份唯一与旧地址安全/增量身份校验与已建立数字 ID 的不可替换保护、共享容量告警/提前发布门槛、README 渲染及受控快照应用
category-order.test.ts: Node test 分类排序与手机版固定两行/桌面 Flex 控制栏契约，运行 npm test
code-discovery.test.ts: Node test code-discovery 的契约与回归验证，运行 npm test
code-discovery.ts: 代码搜索线索与固定提交内容证据提取
directory-catalog.test.ts: 身份基线/审计字段不泄漏、全目录展示/检索/排序等价及真实 Vite client/SSR 热更新的投影回归
directory-catalog.ts: 构建期展示白名单与虚拟模块，规范快照保留完整审计且无第二份生成数据
og-image.test.ts: 真实 WASM PNG、白底排版、动态计数及 HTTP 版本/缓存/失败边界回归
og-delivery.test.ts: 实际 Worker PNG、缓存/条件请求、三语言项目元数据与生产工作台 GET/HEAD/查询参数的 404 隔离检查
share-image.test.ts: 项目图片身份与共享 OG/Twitter 元数据契约
generate-sitemap.test.ts: Node test generate-sitemap 的契约与回归验证，运行 npm test
generate-sitemap.ts: 生成三种语言的有限索引，排除收藏和不足摘要
github-client.test.ts: Node test 响应头/限流/截止、读写隔离与未知写入不重试的离线回归
github-ref-cleanup.ts: 专用单 ref updateRefs expected SHA 删除能力，无通用 GraphQL 写入口或自动重试
github-ref-cleanup.test.ts: 专用 CAS 删除能力的固定 mutation、expected SHA 与未知写入不重试回归
github-client.ts: 共享只读 REST/GraphQL、响应头驱动限流及独立无重试写入；未知写入由调用方重读，截止覆盖取证
github-identity.ts: 数字 ID/不透明 Node ID 的统一读取校验，供目录验证、首次身份建基线、统计刷新与双队列去重共用
github-metadata-aliases.ts: 28 条历史核验的数字 ID 种子；旧数据建基线时防止身份替换，后续改名不再追加人工例外
github-metadata.test.ts: Node test 首次自动改名、后续 ID 查询/迁移、防重占、Top100 固定点与历史种子、目录增删续点和实际额度暂停回归
github-metadata.ts: 同一只读客户端的 50 项批读，首次解析自动建 ID 基线、发现前补未轮到旧项身份、之后按 Node ID 查询并报告当前名；每轮 Top100 成功刷新，其它最多 1000 项按身份锚点续读；独立能力探针不加载付费凭据
github-evidence.ts: 固定提交的 GitHub 来源与替代实现证据
inclusion.test.ts: Node test inclusion 的契约与回归验证，运行 npm test
inclusion.ts: 采集侧收录证据校验与改动验证
jev-client.ts: 仅服务端的 Jev 审核请求和决策契约
locale-routes.test.ts: Node test locale-routes 的契约与回归验证，运行 npm test
masonry.test.ts: Node test 通道/间距和水合前滚动的窗口/位置契约，避免自然流丢失虚拟前缀
model-types.ts: 采集、GitHub 来源与模型审核的共享类型；GitHubIdentity 区分数字身份与不透明查询地址，previousUrls 只记录地址历史，GitHubQuery 仅声明只读 GraphQL
news-sync.test.ts: Node test news-sync 的契约与回归验证，运行 npm test
not-found.test.ts: Node test 真实 HTTP 404/三语言/恢复链接与正常页索引回归，需 TEST_SITE_ORIGIN
page-delivery.test.ts: Node test favicon 真实 SVG、三语言旧地址 301、启动模块总依赖、有界推荐/分类内链与三语言 H1/摘要一致性，使用 TEST_BUILD_OUTPUT/TEST_SITE_ORIGIN
news-sync.ts: 独立 AIHOT 新闻快照同步与数据校验
prepare-build-history.test.ts: Node test prepare-build-history 的契约与回归验证，运行 npm test
prepare-build-history.ts: 构建前 Git 历史准备，保证更新时间来自真实数据
project-routes.test.ts: Node test 路径安全、精确项目查找与清洗旧地址重定向契约
radar-budget.test.ts: Node test radar-budget 的契约与回归验证，运行 npm test
radar-budget.ts: 审核请求预算与持久化边界
radar.test.ts: Node test radar 的契约与回归验证，运行 npm test
radar.ts: Top100 优先刷新、其它项续点、发现前补旧项身份/ID 去重的核心生态发现与可信快照发布；Top 不完整先存诊断并非零退出，完整 Top 的部分轮转允许发布
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
submission-review.ts: 可信投稿提取、共享输入指纹/固定版本目录读取、保留真实评分的可失效报告与请求前预算评论
submission-agent-review.ts: 独立 OK 分类收据/报告摘要绑定与别名兼容的只读 CLI，安全支持 stdin/eval/print 库导入，不替 Agent 授权
submission-agent-review.test.ts: CLI 别名/求值模式导入、分类收据、短口令/权限、输入版本与原有 CI/许可证门的离线回归
submission-catalog-pr.ts: 固定 merge-base 上的纯追加目录与完整 README/sitemap 共用验证，正负向自动处理均拒绝夹带改动
submission-rejection.ts: 最终整仓不匹配的拒收意图/真实关闭事件与本仓 expected SHA 清理；单次尝试/终态持久化，未知删除结果保留分支转人工
submission-github.ts: 正负向投稿共用的有界分页、固定 SHA 文件与 main 读取
submission-rejection.test.ts: 关闭事件/拒收收据、分支 CAS、fork/共享/保护保留及未知写入恢复的离线状态机
submission-rejection-policy.test.ts: 完整最终不匹配、混合结果及报告失效的负向纯政策回归
submission-intake-policy.ts: 共用真实报告/当前输入绑定、独立 Agent 分类准入及完整 unrelated 拒收门；不扩大人工授权
submission-intake-policy.test.ts: Node test 虚假/过期报告、完整覆盖、命令语法及纯数据改动边界
submission-intake.ts: 可信正负向投稿编排；/ok 分类授权与历史命令、数据 PR/精确 CI/合并关闭，独立拒收及近期关闭请求恢复，无模型调用
submission-intake-fixtures.ts: 固定 Git 对象、真实目录生成与权限/CI 状态转换的共享离线夹具，不产生线上副作用
submission-intake.test.ts: Node test 模拟 GitHub 状态转换、CI 来源、批准失效、交接失败后的重扫与写入恢复，不产生线上操作
submission-intake-workflow.test.ts: Node test 执行隔离 Bash/gh 交接命令，约束成功 CI、自建分支编号、可信 main 与 Actions-only 权限
ui-transitions.test.ts: Node test UI 过渡与编译后 CSS、真实卡片端点/滚动重测/来源失效纯几何、官方 arc-presence 接法/完成回调稳定性/复开来源与焦点回落护栏；真实轨迹/历史/焦点另做浏览器验收

verify-delivery.test.ts: 真实子进程验证交付编排的失败/跳过/取消与自有进程清理
verify-delivery.ts: 构建后零跳过 HTTP/模块图验收，拥有临时预览生命周期，不调用采集接口

法则: 成员完整·依赖单向·数据来源明确
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
