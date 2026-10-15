<!--
[INPUT]: 依赖执行交接、当前代码、离线 TDD 日志与真实交付结果
[OUTPUT]: 记录 Workflow 解耦与目录生命周期的 TDD/交付基线
[POS]: docs 的变更验收基线；生产结果以 Actions 制品和部署记录为准
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# Workflow 解耦验收基线 — 2026-10-15

## 实现状态

批次一、批次二 A 和批次二 B 的代码均已落地。
七条 Workflow 与全部 site 调用方原子发布。
此文记录提交前证据，不推断后续生产结果。

| 变更集 | 本地结果 |
| --- | --- |
| 批次一 | 独立 metadata Workflow/CLI；全目录 50 项批读；统计单写者；核心 v2；资源隔离；残页背压与公平审核；替代队列独立容量 |
| 批次二 A | 独立 site Workflow；保留 verify/production/artifact 边界；迁移四个派发来源、两个监听和 intake 精确 CI 绑定；更新 Checks badge |
| 批次二 B | 最终暂存差异输出 site_changed/published_sha；纯状态不派发；共用白名单与完整提交历史部署判定 |

原有三份每日 2000 HTTP 尝试预算保持不变。
radar.yml 身份、scan job、付费步骤名和 artifact 前缀未改。
review-checkpoint 保留历史 verify/deploy 非付费识别。
身份、取证、0.9/0.9 准入与 production 凭据边界未降低。
没有新增服务、账号、模型、PAT 或环境变量。
未实现全链路一次构建。
快照验证和最终 main 交付仍分别构建。

## 先红后绿证据

以下日志位于本机，不进入部署产物。

| 边界 | 实际红测试 | 日志 |
| --- | --- | --- |
| 全目录、不可访问、异常撤销与计数 | 最终 13 个新增用例在隔离旧实现全部失败 | /tmp/awesome-jev-tdd-metadata-old-final-tests-20261015.log |
| primary/阶段/secondary/认证作用域 | 5 个失败，20 个原用例通过 | /tmp/jev-client-red.log |
| 无模型元数据诊断拒收 | 接线后仍有 2 个业务断言失败，不仅是 import 失败 | /tmp/jev-meta-entry-business-red.log |
| 核心解耦、无损迁移、公平审核与残页 | 5 个业务用例失败 | /tmp/jev-radar-decouple-red.log |
| metadata 发布、无补读统计、状态不构建 | 3 个用例失败 | /tmp/jev-publisher-red.log |
| 状态后继允许部署与非法 SHA 拒绝 | 旧严格策略下 3 个用例失败 | /tmp/jev-site-policy-red.log |
| site CI 路径与工作流交接 | 旧绑定下 25 个用例失败 | /tmp/jev-site-handoff-red.log |
| 迁移 CLI 不读取 API 凭据 | 修正含空格路径的夹具后，旧入口因请求 token 而失败 | /tmp/jev-migration-cli-business-red.log |
| 暂存的纯空白文件名保护 | 旧发布器没有拒绝预存文件 | /tmp/jev-publisher-index-red.log |

后续回归覆盖核心 pending=2000、总容量=4000。
替代实现总容量仍为 2000。
残页在入队或身份去重完成之前不推进查询页码。
搜索阶段五分钟结束后，同一客户端仍可读取取证。
预算中断不虚增候选尝试，也不切换审核组。
并发 metadata/radar 发布保留双方独占检查点。
最终合并差异决定派发，不使用采集开始时的差异。
真实 Git 测试覆盖 D→R、revert、合并、重命名与分叉。
部署脚本真实执行 fetch 和本地历史判定。
真实交付检查没有删除断言或使用 skip 放行。

## 提交前验证

Node 24.21.0，npm 11.19.0。

| 检查 | 结果 |
| --- | --- |
| npm run typecheck | 通过 |
| npm run lint | 通过；保留原有 UI 警告 |
| npm test | 接手复核后 620 通过、0 失败、65 个交付环境用例跳过 |
| npm run categories:check | 2199 个项目分类有效 |
| npm run data:check | 规范目录与 README 一致 |
| npm run inclusion:check | 2152/2199 有依据，47 项仍待补充；未伪造依据 |
| npm run news:check | 通过 |
| npm run build | 通过 |
| npm run test:delivery | 构建后真实 HTTP/模块图 66 通过、0 失败、0 跳过 |
| git diff --check | 通过 |
| 七份 YAML 语法与 needs 引用 | Ruby/Psych 本地解析通过 |

离线测试的 65 个跳过不计为通过。
独立交付验收已执行，不能拿离线绿灯代替。
本机未安装 actionlint，没有声称执行它。
生产验收另查 [site 运行](https://github.com/daftAI2026/awesome-jev/actions/workflows/site.yml)。
必须核对部署步骤实际执行，不能仅看整轮绿色。

接手复核日志：/tmp/jev-takeover-final-unit.log。
构建：/tmp/jev-takeover-build.log。
交付：/tmp/jev-takeover-delivery.log。

## 排空后状态迁移

排空后最新 main：337fe426f9632983881a78e91717c2350699b30d。
旧 core 状态 blob：f68806a01325ff0e78a02fdfe07a89984433d425。
从该 main 重新取出 v1，再执行 --migrate-state。
不是对已迁移的本地 v2 重跑。

全部 2000 个候选和原搜索页码保持逐项一致。
core 仅升级 version=2，移出统计游标，加入 nextReviewLane。
metadata-state 保留 cursor=283 和原身份锚点。
metadata-latest 为 not-run，不编造运行时间或计数。
没有改写 data/github.json 或 data/news.json。
迁移幂等，不覆盖已启动的独立统计续点。

五个旧入口已临时禁用。
in_progress、pending、waiting、requested 均为零。
queued 有两条 10 月 7 日历史异常：
37655524323（投稿审核）、37655513827（新闻）。
两者 jobs、check_runs、artifacts 均为零。
普通取消接口均返回“已完成，不能取消”。
读取接口仍标 queued，不能伪称它们已终态。
两者均不写核心 v1 状态，不阻断本次迁移。
新闻若恢复，仍受普通推送与三方合并保护。
投产后确认最新 main 已实际交付，并恢复原入口。
未取消正在付费或部署的运行。

## 接手复核修复

三个独立 reviewer 检查采集、发布与权限边界。
以下反例均先红后绿：

| 反例 | 红测试 | 证据 |
| --- | --- | --- |
| GraphQL 探针阻断 REST 审核 | 旧命令顺序退出 23，未进入 collect | /tmp/jev-radar-probe-red.log |
| 搜索网络/5xx 连带停审；替代队列未知错误漏停 | 12 个新用例失败 | /tmp/collector-source-isolation-red-20261015.log |
| primary 429、secondary 403 与响应体截止 | 7 个新用例失败 | /tmp/jev-client-adversarial-red-20261015.log |
| 阶段截止丢失已收到的次级限流 | 2 个新用例失败 | /tmp/jev-client-phase-throttle-red-20261015.log |
| Retry-After 与剩余配额同时出现 | 5 个反例失败 | /tmp/jev-client-retry-ambiguity-red-20261015.log |
| 401/坏 JSON 被阶段或整轮截止覆盖 | 6 个反例失败 | /tmp/jev-client-known-failure-red-20261015.log |
| 未知限流正文丢失全局暂停 | 1 个反例失败 | /tmp/jev-client-unread-limit-red-20261015.log |

两队列共享来源失败分类，不降低准入或预算。
统计探针保留为手动诊断，不作发现前置门。
限流正文仅用于分类，不进入公开错误。
未知 Git 历史仍拒绝部署旧产物。
正常过期与 Git 内部失败均输出 current=false。
因此生产验收须核对实际部署步骤与 Worker 版本。

## 投产验收与恢复

1. 合并排空后的最新 main，保留新闻与替代队列。
2. 在隔离工作树验证最终版本，不使用旧 dist。
3. 推送后检查七份 Workflow 的服务端解析。
4. 验证 metadata 全目录批读与不可访问告警。
5. 验证 radar 继承旧预算，不创建新预算域。
6. 核对同次 artifact ID、真实构建 SHA 和部署消息。
7. 执行三语言目录/新闻分页、项目详情与 OG 冒烟。
8. 恢复原 active 入口，确认 main 与工作区同步。

原 HTTPS 设置记录保留，不重复修改区域设置。
不伪造投稿，不为验收重置状态或付费预算。
状态派发门与部署等价判断必须一起上线或回滚。
site 回滚须整体恢复调用方和精确 CI 绑定。
v2 超过 2000 或残页非空时，不交回旧 reader。
保留状态与预算，暂停 writer，优先前向修复。


## 目录生命周期闭环 — 2026-10-16

在既有七条 Workflow 内实现，不新增审核预算。
无模型同步迁移同 ID 地址，并保存旧址。
持续失联满足 72 小时和三个独立周期才下架。
未知身份先隔离，由原 Jev 队列复核。
通过后自动恢复或独立收录，拒绝和报错保持隐藏。
同一发布出口同步 README 与网站，不等待另一个 Bot。

以下先红后绿日志保存在本机，不进入制品：

| 边界 | 日志 |
| --- | --- |
| 生命周期迁移、恢复与时钟 | /tmp/metadata-lifecycle-red-20261016.log |
| 后续认证/限流/格式异常撤销失效累计 | /tmp/metadata-lifecycle-attacks-red-20261016.log |
| 公共出口隐藏状态 | /tmp/jev-public-visibility-red.log |
| 角色授权、原子迁移与并发撤回 | /tmp/jev-lifecycle-publication-red.log |
| 不能绕过绑定替换或用 metadata 新增身份 | /tmp/jev-publication-adversarial-red.log |
| 同 URL 新旧数字身份分别计数 | /tmp/jev-metadata-same-url-red.log |

串联测试只模拟 GitHub 与 Jev HTTP。
实际执行 Jev 响应解析、预算与固定收据生成。
再执行三方合并、README 与公开入口查询。
同 ID 和新 ID 均覆盖 keep/drop/review/error。
只读现场预览核验 2201 个对象、35 次同 ID 迁址。
该预览未发布，没有伪造运行 ID 或失效观察。
生产 72 小时窗口从新有效观察开始，不回填历史。

隔离工作树安装锁定依赖，目录与新闻检查通过。
网站构建通过，真实 HTTP/模块图 68 项零跳过。
最终追加标量身份保护后，类型和 lint 再次通过。
完整单测为 717 通过、0 失败、67 个交付环境跳过。
该追加只改采集发布边界，不改网站构建输入。
生产仍须由精确提交的 site CI 重新构建并部署同份产物。
