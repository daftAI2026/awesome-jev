# scripts/
> L2 | 父级: ../CLAUDE.md

成员清单
mcp-catalog.ts: 规范快照生成公开 MCP 白名单、身份表和三种排序；单项 UTF-8 JSON 超过 4096 B 阻止构建
mcp-catalog.test.ts: MCP 字段隔离、迁址、隐藏、新身份接管旧地址、全目录排序等价与容量边界
mcp-config.test.ts: 单行 Tabs/家族顺序、三种安装 URL 解码白名单、收藏后入口与品牌原字节契约
mcp-server.test.ts: 新旧协议、纯分类预热、schema 单次转换、只读工具、输入容量与失败封闭限流
mcp-delivery.test.ts: 真实 Worker MCP、三语言静态指南、Markdown 与浏览器隔离门禁
mcp-docs.test.ts: 客户端配置、公开 Markdown 与 Registry 元数据的一致性门禁
generate-og.ts: Node 构建期 PNG 生成与过期版本回收；校验免费 20000 文件上限，不写 public 源文件
generate-og.test.ts: 公开计数、隐藏身份、构建失败和免费容量的离线回归
static-catalog.ts: 构建有限分页/排序与可索引标签清单；隔离 Start 双次解码，公开 URL 与资产身份不变
static-delivery.test.ts: 冷请求、逐页身份、真实框架编码归一与 PNG 条件响应回归
static-delivery-http.test.ts: 真实 Worker 验证三语言查询页不走 SSR，全部有限页面/PNG 存在且未超免费容量
catalog-lifecycle.ts: 数字身份复核、固定证据迁址和可逆下架；异常不累加失效，回滚保留已证实恢复
catalog-lifecycle.test.ts: 假时钟与离线 API 验证 72 小时、多周期、证据连续性和身份隔离
catalog-mutation.ts: 按采集角色授权字段；地址、证据和生命周期原子叠加，保留人工并发编辑
catalog-lifecycle-flow.test.ts: 真实审核/预算到发布、README 和公开入口的串联验收；仅模拟外部 HTTP
catalog-lifecycle-publication.test.ts: 生命周期发布角色、隐退替换、README 和三方竞争回归
catalog-review.ts: 将规范复核请求绑定到原候选池；同 ID 迁移，新 ID 独立收录
catalog-review.test.ts: 身份竞态、旧预算、持久冷却、分类和替代准入回归
public-visibility.test.ts: 真实投影和服务端入口验证全部隐藏状态不进入公开出口
metadata-sync.ts: 无模型统计和生命周期入口，独占续点与失效观察；诊断不能应用
metadata-sync.test.ts: 无模型刷新、编辑保护、统计状态迁移与非法诊断拒收回归
candidate-queue.ts: 两条发现链共用的残页缓冲与背压，显式容量策略；核心额外使用交替审核排序
site-publication.ts: 发布与部署共用六条精确状态白名单；按完整提交历史拒绝旧产物
site-publication.test.ts: 真实临时 Git 验证状态推进、revert、合并、重命名和失败关闭

og-fonts.test.ts: 固定字库成功字节复用、失败重试、未知名称与流容量上限回归
news-page.test.ts: 递增历史下 50 条服务端交付、计数/排序/越界与单条预览回归
generate-jev-figure.mjs: 项目级 Anatomy kit 离线投影 60 实体，生成可信路径和投影；--geometry 输出同源圆角实体与顺序，不在构建请求链运行
jev-figure.test.ts: 本地 0.3 秒教学轨迹、自动出口轮换、真实圆角棱柱遮挡、产物重建、刻度线端与无可执行标记回归
error-policy.test.ts: 错误状态与缺失分离、Error message/stack/cause 脱敏离线回归
error-page-fixture.ts: 当前源码临时复制与测试专用故障路由，生产构建不含触发入口
error-delivery.test.ts: 隔离产物十条真实错误/恢复回归，检查脱敏/状态/索引/恢复入口
tag-delivery.test.ts: 真实 HTTP 三语言标签索引/详情内链、分页、同义 301、特殊字符/长尾 noindex 与未知 404
project-tags.test.ts: 公开标签同义/按项目去重、特殊字符/注入路径、原始快照和 Action bot 候选不变回归
pagination.test.ts: Node 每页 50 条、排名和规范地址回归；归一不撤销服务端待加载的有效页
sort.test.ts: Node 排序语义与全量 ID 次序回归；测试替身阻止逐次重建比较配置
pagination-delivery.test.ts: 三语言分页 HTTP、规范地址与新闻水合不泄漏离页历史回归
generate-llms.ts: Node 构建期公开文档生成器，公开标签路由/原始主题边界同步，分类/排名/路径复用规范规则，展示字段白名单隔离审计
agent-links.test.ts: Node 三语言公开提示词、五品牌 q 参数与 SVG 安全/授权回归
generate-llms.test.ts: Node 真实快照确定性、互链、文本转义与审计字段隔离回归
agent-delivery.test.ts: 真实 HTTP 机器文档/全部内链/页脚回归；GET 读完正文后复用连接，避免临时端口耗尽
publication-merge.ts: 三方增量合并，按角色授权迁址/下架/复核；保留最新 main 的人工编辑与撤回
publish-data.ts: 四采集器共享增量发布器，保留独占检查点与最新 main；输出最终 site_changed/提交 SHA，不重跑模型或统计
deployment-workflow.test.ts: Node 隔离 Bash 验证已验产物/隐藏文件、SHA/Worker 配置、过期部署拒绝、采集资源隔离与四采集器按最终差异派发；无线上写入
publish-data.test.ts: Node test 真实本地 Git 竞争、四采集器叠加与纯状态发布、验证失败不推送和临时工作树清理
onsite-seo.test.ts: Node 首页描述 25–160 字符/品牌身份、相关项目、工作台输入、SEO 诊断与有界流读取的离线边界验证
alternative-audit.test.ts: Node test alternative-audit 的契约与回归验证，运行 npm test
alternative-audit.ts: 既有目录的替代实现证据审计；运行暂停保留已完成检查点而不污染待审状态
alternatives-radar.test.ts: Node test alternatives-radar 的契约与回归验证，运行 npm test
alternatives-radar.ts: 独立替代实现队列，复用来源失败分类、目录发布和预算边界，发现前补旧项身份，数字 ID 排除改名后的已收录对象
awesome-jev-banner.txt: 目录字符字标的原始资产
catalog-updated-at.test.ts: Node test catalog-updated-at 的契约与回归验证，运行 npm test
catalog.test.ts: Node test catalog 的契约与回归验证，运行 npm test
catalog.ts: GitHub 规范目录的嵌套类型/数字身份唯一与旧地址安全/增量身份校验与已建立数字 ID 的不可替换保护、共享容量告警/提前发布门槛、README 渲染及受控快照应用
category-order.test.ts: Node test 分类排序与手机版固定两行/桌面 Flex 控制栏契约，运行 npm test
code-discovery.test.ts: Node test code-discovery 的契约与回归验证，运行 npm test
code-discovery.ts: 代码搜索线索与固定提交内容证据提取
directory-catalog.test.ts: 展示等价、MCP 服务端隔离与真实 Vite client/SSR 热更新回归
directory-catalog.ts: 展示/交付/MCP 三种投影；MCP 直接导出 JS 对象，共享可信时间，禁止客户端加载
og-image.test.ts: 同键并发合并/失败重试、真实 WASM PNG、白底排版与版本/缓存边界回归
og-delivery.test.ts: Worker 冷并发响应体独立、PNG 与缓存/条件请求、三语言项目元数据与生产工作台 GET/HEAD/查询参数的 404 隔离检查
share-image.test.ts: 项目图片身份与共享 OG/Twitter 元数据契约
generate-sitemap.test.ts: Node 三语言有限索引、摘要门槛、同义标签/长尾排除与身份唯一回归
generate-sitemap.ts: 三语言有限索引、MCP 指南与共用标签，排除 API、收藏和不足摘要
github-client.test.ts: 响应头与正文共同区分主/次级限流，阶段响应体截止、读写隔离与未知写入不重试回归
github-ref-cleanup.ts: 专用单 ref updateRefs expected SHA 删除能力，无通用 GraphQL 写入口或自动重试
github-ref-cleanup.test.ts: 专用 CAS 删除能力的固定 mutation、expected SHA 与未知写入不重试回归
github-client.ts: 共享只读 REST/GraphQL，主限流按资源隔离、次级限流全局等待；阶段截止覆盖响应体，已知认证/格式错误不降级；独立写入不重试
github-identity.ts: 数字 ID/不透明 Node ID 的统一读取校验，供目录验证、首次身份建基线、统计刷新与双队列去重共用
github-metadata-aliases.ts: 28 条历史核验的数字 ID 种子；旧数据建基线时防止身份替换，后续改名不再追加人工例外
github-metadata.test.ts: Node 离线验证 5000 项单轮批读、不可访问隔离、身份/响应异常整轮撤销、未知成本、续点恢复及历史改名身份
github-metadata.ts: 同一只读客户端的 50 项身份批读，默认遍历全目录；不可访问留旧且继续，身份/响应异常撤销本轮增量；分别报告尝试、新鲜、不可访问与未完成数；独立同步入口调用，发现端仅使用身份补齐
github-evidence.ts: 固定提交的 GitHub 来源与替代实现证据
inclusion.test.ts: Node test inclusion 的契约与回归验证，运行 npm test
inclusion.ts: 采集侧收录证据校验与改动验证
jev-client.ts: 仅服务端的 Jev 审核请求和决策契约
locale-routes.test.ts: Node test 三语言路径、hreflang 与首页 GitHub 目录搜索/分享文案契约
masonry.test.ts: Node test 通道/间距和水合前滚动的窗口/位置契约，避免自然流丢失虚拟前缀
model-types.ts: 原始 tags 与公开投影分界，采集、GitHub 来源与模型审核共享类型；GitHubIdentity 区分数字身份与不透明查询地址，previousUrls 只记录地址历史，GitHubApi 支持阶段截止；GitHubQuery 仅声明只读 GraphQL
news-sync.test.ts: Node test news-sync 的契约与回归验证，运行 npm test
not-found.test.ts: Node test 三语言非法编码路径 400、真实 404/恢复链接与正常页索引回归，需 TEST_SITE_ORIGIN
page-delivery.test.ts: Node 三语言首页唯一描述真实 HTTP、favicon 真实 SVG、三语言旧地址 301、启动模块总依赖、有界推荐/分类内链与三语言 H1/摘要一致性，使用 TEST_BUILD_OUTPUT/TEST_SITE_ORIGIN
news-sync.ts: 独立 AIHOT 新闻快照同步与数据校验
prepare-build-history.test.ts: Node test prepare-build-history 的契约与回归验证，运行 npm test
prepare-build-history.ts: 构建前 Git 历史准备，保证更新时间来自真实数据
project-routes.test.ts: Node test 路径安全、精确项目查找与清洗旧地址重定向契约
radar-budget.test.ts: Node test radar-budget 的契约与回归验证，运行 npm test
radar-budget.ts: 审核请求预算与持久化边界
radar.test.ts: Node test radar 的契约与回归验证，运行 npm test
radar.ts: 核心发现与审核，共享来源失败分类；v1 无损升级 v2；五分钟发现窗口、交替审核、身份去重与诊断拒收，目录复核共用原预算，统计由 metadata-sync 独占
repository-review.test.ts: Node test repository-review 的契约与回归验证，运行 npm test
repository-review.ts: 固定提交的整仓审核与文件排除策略
review-checkpoint.ts: 核对可信 workflow/attempt/jobs，按 collect 时序定位预算；已知 verify/部署无采集，未知任务与当日缺失账本拒绝回退
review-store.test.ts: Node 状态持久化与可信预算恢复回归；部署 job 名称跟随真实工作流，未知任务和缺失付费账本仍拒绝
review-store.ts: 有界本地审核状态存储与失效清理
review-types.ts: 整仓审核任务、队列与存储的接口契约
saved.test.ts: Node test saved 的契约与回归验证，运行 npm test
scroll-restoration.test.ts: Node test 首次水合、迟到滚动、导航与 hash 的恢复策略边界
score-sources.ts: 离线来源打分/分类入口，不进入前端包
submission-entry.test.ts: Node test 页头链接、表单标题与单仓库候选提取，离线验证投稿接入而不创建真实申请
submission-review.test.ts: Node test submission-review 的契约与回归验证，运行 npm test
submission-review.ts: 可信投稿提取、共享输入指纹/固定版本目录读取、保留真实评分的可失效报告与请求前预算评论
submission-agent-review.ts: 独立 OK 分类收据/报告摘要绑定与按协议解析的路径/URL 别名 CLI，安全支持 stdin/eval/print 导入，不替 Agent 授权
submission-agent-review.test.ts: CLI 路径/URL 别名与求值模式、分类收据、短口令/权限、输入版本与原有 CI/许可证门的离线回归
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
verify-delivery.ts: 构建后零跳过页面/OG/Agents/MCP/分页/标签验收，只拥有自有预览生命周期

法则: 成员完整·依赖单向·数据来源明确
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
