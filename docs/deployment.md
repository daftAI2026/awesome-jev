<!--
[INPUT]: 依赖 site 工作流、production 环境、Workers 构建触发器与区域设置
[OUTPUT]: 提供同版本部署、MCP/网站免费 CPU 门槛与区域防护边界
[POS]: docs 的站点发布契约；采集准入归 collector.md
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# 站点部署

## MCP 发布门禁

保留现有 `site` 同版本构建、交付和部署链。
不新增 Action、付费套餐、模型或存储服务。
`/mcp` 三语言页面与 `/mcp.md` 走静态资产。
`/api/mcp` 与网站共享 Workers Free 请求额度。
Native RateLimit 绑定为 `MCP_RATE_LIMITER`。
namespace `1375643526` 专用于本站 MCP。
上线前核对账号中无同 namespace 冲突。
匿名 IP 在每个边缘位置限流 120 次/60 秒。
本机模拟、单位置限流不证明全局防刷能力。

执行 typecheck、lint、test、build、test:delivery。
MCP 交付测试使用真实 Worker 与官方客户端。
它覆盖新旧协议、隐藏身份、三语言和媒体类型。
新版测试显式固定 `2026-07-28` 并断言协议版本和 era。
SDK 版本不代表客户端实际协商的协议版本。
SDK 与 MCP 投影不得进入浏览器 JavaScript。
构建继续执行免费静态资产数量门禁。
Worker isolate 启动须低于平台启动上限。
MCP 首次请求、热请求与已有页面分别测 CPU。
使用 CF-Ray 将主动请求对照同版本日志。
HTTP 200、本机毫秒与缓存命中均不是 CPU 证明。
所有主动样本必须低于免费 10ms，且 outcome 正常。
未达到门禁时修复或回滚，不提交目录。

SDK 的 `preloadSchemas()` 只构造 schema。
Zod 首次解析仍会初始化分类层惰性对象。
模块期解析现代发现和旧版通知两条合成消息。
此步骤无网络或计时器，不执行工具。
它不替代 SDK 的逐请求分派和结果验证。
工具 JSON Schema 在模块期转换一次。
复用描述时保留原 Zod 校验与转换。
每请求仍创建独立 Server，不共享协议会话。

生产验收后校验 `server.json` 并发布官方 Registry。
服务版本独立于网站 package 的内部版本。
读取 Registry 最新记录确认名称、版本与端点。
Glama 另行提交公共 Connector，并读取结果。
遇到账户注册或条款确认时请求用户操作。
不得把已提交、审核中与已收录写成同一状态。

## 免费 CPU 与静态交付

2026-10-20 方案保留 Workers Free。
不修改套餐、CPU 付费上限或区域规则。
免费 HTTP 请求的 CPU 预算为 10ms。
SSR 与 WASM 冷渲染不靠偶发超额容忍运行。

### 根因与复测边界

北京 2026-10-19 的指标包含 6876 次调用。
其中 177 次为 exceededResources，占 2.57%。
另有 130 次客户端断连，不能合并成 CPU 错误。
旧版目录 SSR 样本 CPU 为 160–253ms。
旧版全站 OG 样本 CPU 为 294ms。
这些样本返回 200，不等同于失败路径分布。
历史日志未开启，不能补造全部失败 URL。

本机同快照排序的 CPU 中位数：
stars 从 69.916ms 降至 2.413ms。
name 从 100.780ms 降至 2.738ms。
两种排序的完整项目 ID 次序均保持不变。
该测量使用 Node 24，不是 Cloudflare CPU。
生产验收仍需对照同版本冷请求日志与指标。

本机验收：809 项离线测试，738 通过、71 项需 HTTP 环境。
完整交付另有 72 项通过，零失败、零跳过。
3057 张 PNG 与 18609 个静态文件通过构建门槛。
浏览器搜索、预览、收藏、排序偏好和分页已验证。
这些结果不冒充生产 CPU 或发布完成。

### 交付边界

`src/server.ts` 按已验证查询读取有限 HTML。
主目录、分类、Top100、新闻和可索引标签进入清单。
排序保留 stars/name/date，新闻仍按时间排序。
越界页码读取最后一页，不读取第一页代替。
内部 `/_pages` 不进入 canonical 或 sitemap。
编码标签也使用内部资产地址，避免文件寻址歧义。
构建适配 Start 1.171.52 的两次路径解码。
回归直接执行框架完整流水线。
构建片段阻止斜杠污染 page/sort。
HTTP 不接收该片段或合成查询项。
真实交付另检查 C/C#/C++ 内容。
预览、长尾标签、收藏和 RPC 保留原 SSR。
这些入口仍需发布后观察，不承诺全站零超限。

`npm run build` 在 Vite 后生成全部公开 OG PNG。
PNG 与 HTML 随同一份 dist 验证、上传和部署。
无运行时外部图片服务，无额外部署步骤。
生成失败或超过 20000 静态文件时拒绝交付。
不通过删数据、删检查或自动付费绕过容量门槛。

Wrangler 源配置开启 invocation logs 并隐藏查询字符串。
当前 Free 包含每日 200000 个日志事件，保留三天。
日志有配额与投递边界，不能据缺失推断请求成功。
以 GraphQL 请求指标对照日志中的 outcome、CPU 和版本。
首轮验收检查冷/热页面与 PNG 的真实执行路径。
回滚使用上一份已验制品，不单独替换 HTML 或 PNG。

依据：[CPU/资产限制](https://developers.cloudflare.com/workers/platform/limits/)、[免费日志](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)。

## HTTP 到 HTTPS

2026-10-15，维护者授权开启区域级 `always_use_https`。
本站 `awesomejev.cc` 的设置已由 `off` 改为 `on`。
Cloudflare 在边缘返回 301，保留路径和查询参数。
不新增 Worker 跳转代码，不修改 HSTS 或证书配置。
设置独立于 GitHub 构建和 Worker 制品。
回滚只将本站该设置恢复为 `off`。

首页与 Top100 分页的 HTTP 请求已验证为 301。
HTTPS 新闻样本返回 200，canonical 使用 HTTPS。
GSC 的样本实际测试显示“网址可编入 Google 索引”。
此结果不代表全部 98 条待评估网址已收录。

依据：[Always Use HTTPS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/)。

## 站点交付与凭据边界

`site.yml` 的 `verify` 校验精确提交。
它执行类型、离线测试、分类、数据和 lint 检查。
它构建应用，再执行零跳过交付检查。
可信 `main` 校验成功后封装 `dist`。
压缩包保留隐藏文件和 `.build-sha`。
产物只保留一天，不包含源码或本机 `.env`。

`deploy` 读取同次运行的不可变 artifact ID。
它验证提交 SHA、Worker 名称和预编译配置。
它串行部署，并在上传前重读当前 `main`。
D 等于 main 时允许部署。
main 仅增加六条白名单状态文件时仍允许 D。
完整历史逐提交检查；非状态改动或 revert 均拒绝 D。
白名单与发布器共用 scripts/site-publication.ts。
Git 历史不足或读取失败时拒绝部署。
不把此检查称为与 main 更新的原子事务。
GitHub 读取失败时，停止部署。
部署使用锁定 Wrangler，不执行第二次构建。
Worker 版本说明记录 GitHub 提交 SHA。
后续非状态 main 改动由新的 site 校验交付。
纯状态提交不改变已验制品的 .build-sha。
快照验证和最终 main 交付仍各构建一次。
前者的 dirty-data dist 不能冒充最终 main 产物。

Worker 仍是 `awesome-jev-project`。
站点仍是 `https://awesomejev.cc`。
分页 SSR、详情 HTML 和数据快照保持同版本。
此方案复用构建产物，不是增量编译。
Wrangler 只上传发生变化的静态资产。

## GitHub 设置

- 环境：`production`，仅允许 `main` 分支。
- 环境 Secret：`CLOUDFLARE_API_TOKEN`。
- Token 权限：指定账户的 `Workers Scripts Edit`。
- 仓库变量：`CLOUDFLARE_ACCOUNT_ID`。
- 仓库开关：`CLOUDFLARE_ACTIONS_DEPLOY_ENABLED=true`。

Secret 只注入最终部署步骤。
PR 校验、机器人分支和采集器不读取部署 Secret。
不把本机 OAuth 凭据复制到 GitHub。
不授予 CI 创建 Token、DNS 或账户管理员权限。

## 数据发布

`GITHUB_TOKEN` 推送不触发普通 `push` Actions。
四采集器读取 status、site_changed、published_sha。
只有 published、site_changed=true 且开关启用才派发 site。
条件使用最终合并、生成和暂存后的差异。
纯状态提交仍保存，但不派发站点构建。
`unchanged` 不派发。
派发失败会使发布 job 失败；已推送数据不回滚。
维护者可在 main 派发 site.yml 的 mode=validate。
恢复派发不重新付费扫描。
收录控制器保留原有显式 `main` 校验派发。
候选快照准入检查仍保留，不拿部署替代准入。

## 切换顺序

1. 保存专用 Secret，确认环境仅允许 `main`。
2. 测试本机检查、完整构建和真实交付。
3. 发布工作流并打开部署开关。
4. 等待 `verify` 与 `deploy` 都成功。
5. 检查生产页面、分页、机器文档与 OG。
6. 备份本站不含凭据的构建配置。
7. 断开本站 Worker 的 Git 构建连接。
8. 重读触发器，确认列表为空。
9. 确认原 Worker 与生产 HTTP 仍有效。

断开操作移除本站构建配置，不删除 Worker。
生产版本、域名、ASSETS 与站点保持有效。
保存原仓库、分支、构建命令与缓存设置。
不修改账户的 GitHub App 或其他项目。
新路径失败时，保留旧触发器，先修复故障。

## 恢复

1. 将 GitHub 部署开关设为 `false`。
2. 在本站 Worker 的 Settings → Builds 选择 Connect。
3. 重新选择 `daftAI2026/awesome-jev` 与 `main`。
4. 恢复根目录 `/`、构建命令 `npm run build`。
5. 恢复 `npx wrangler deploy`、缓存并关闭预览构建。
6. 在 Cloudflare 对当前 `main` 发起构建。
7. 检查部署成功及生产 HTTP。

只重跑部署 job 时，必须保留同次运行的产物。
产物过期后，在当前 `main` 派发完整校验。
GitHub 校验成功不等于生产部署成功。
以部署 job、Worker 版本和生产 HTTP 共同验收。

## 官方依据

- [Cloudflare GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Cloudflare 构建连接与断开](https://developers.cloudflare.com/workers/ci-cd/builds/#disconnecting-builds)
- [GitHub 事件触发边界](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow)
- [GitHub Actions 计费](https://docs.github.com/en/billing/concepts/product-billing/github-actions)

仓库公开且使用标准 `ubuntu-latest` runner。
此路径不消耗 Cloudflare Workers Builds 分钟。
仓库改为私有或使用付费 runner 时，重新核对额度。

## 2026-10-08 切换实证

- 首次提交：`e89e6d4b183c11fc5a59c057e3edb630cfee5f55`。
- [首次 GitHub 发布运行](https://github.com/daftAI2026/awesome-jev/actions/runs/37761942924) 校验与部署均成功。
- 校验耗时 3 分 48 秒；部署耗时 49 秒。
- 首次 GitHub Worker 版本：`96cc6fe6-9cfa-4b9f-8f02-897c3a9a9f6d`。
- 版本说明包含完整 GitHub 提交 SHA。
- 本机离线检查通过 504 项；真实交付检查通过 46 项。
- 交付检查零跳过；异目录产物 dry-run 通过。
- 生产首页、Top100/新闻第二页均返回 200。
- 生产 TXT/Markdown 媒体类型与 OG PNG 均有效。

分支排除尝试返回 400，未采用该配置。
最终通过 `cf builds workers delete` 断开本站构建。
操作后触发器列表为空，原 Worker 仍存在。
仅本站构建配置被移除，账户 GitHub App 保留。

不含凭据的原设置备份：
`deployment-backup.local/cloudflare-build-before-cutover-2026-10-08.json`。
备份包含仓库、分支、构建命令和缓存设置。
备份不包含 Token、Secret 或环境变量。
`*.local` 忽略此目录，备份不进入仓库或产物。


## CPU 探测防护

站点级 WAF 在 Worker SSR 前执行。
规则仅匹配 `awesomejev.cc` 与 `www.awesomejev.cc`。
配置独立于 Wrangler 发布，不修改 Worker 制品。
规则阶段为 `http_request_firewall_custom`。
规则集 ID：`c0782cd8426f4053aa6306aad09a6e85`。

| 规则 ref | 动作 | 边界 |
| --- | --- | --- |
| `awesome_jev_extreme_page_probe` | `block` | 仅目录根路径的精确 `page=999999` 探测 |
| `awesome_jev_shapbot_tag_challenge` | `managed_challenge` | 仅未验证 ShapBot 的三语言标签路径 |

超大页码规则表达式：

```text
(http.host in {"awesomejev.cc" "www.awesomejev.cc"} and http.request.uri.path in {"/" "/zh" "/ja"} and any(http.request.uri.args["page"][*] eq "999999"))
```

标签抓取规则表达式：

```text
(http.host in {"awesomejev.cc" "www.awesomejev.cc"} and not cf.client.bot and lower(http.user_agent) contains "shapbot/" and (http.request.uri.path in {"/tags" "/zh/tags" "/ja/tags"} or starts_with(http.request.uri.path, "/tags/") or starts_with(http.request.uri.path, "/zh/tags/") or starts_with(http.request.uri.path, "/ja/tags/")))
```

`cf.client.bot` 是 Cloudflare 的验证事实。
User-Agent 自称 Googlebot 不等于通过验证。
此防护不按国家、IP 或 ASN 封禁。
此防护不修改全站 Bot Fight Mode。
正常页码、普通标签访问和静态资产保持原路。

规则变更先用 `cf cli search` 定位命令。
搜索词只写动作与资源类型，不写账号信息。
用 `cf schema` 核对 zone 范围。
先执行 `--validate-only`，再发布并读回。
更新时只操作对应 ref，保留其他规则。
回滚时停用对应 ref，不清空规则集。
验收探测拦截、标签挑战与正常页面。
已验证机器人豁免另靠真实机器人事件核对。

此防护不是 SSR CPU 优化。
User-Agent 可伪装，不构成完整反爬边界。
新请求模式与合法 SSR 仍须单独测量。
关闭邮件不会修复资源超限。
告警读取过去 24 小时，不承诺即时消失。

依据：[Cloudflare 自定义规则](https://developers.cloudflare.com/waf/custom-rules/create-api/)、[机器人防护](https://developers.cloudflare.com/use-cases/solutions/stop-malicious-bots/)、[Workers CPU 限制](https://developers.cloudflare.com/workers/platform/limits/)。

## IndexNow：Cloudflare Crawler Hints

2026-10-12 已为 `awesomejev.cc` 开启 Crawler Hints。
控制台路径：Caching → Configuration → Crawler Hints。
启用后开关显示开启；使用现有 Free 套餐。
用户确认免费条件后同意启用与补充条款。
只修改本站，不修改其他域名。

[Bing 官方接入页](https://www.bing.com/indexnow/getstarted)支持此方式。
Cloudflare 依据缓存 MISS 信号发送 IndexNow 通知。
不在仓库新建密钥文件或重复提交 Action。
不增加 CI 凭据权限，不为通知改动缓存规则。
保持错误页与长尾标签的 noindex。

开关开启不等于 Bing 已收到通知或完成收录。
首次核对时，Bing IndexNow 仍显示接入介绍页。
后续在本站 IndexNow 报告查看 Cloudflare 来源。
Worker 动态 SSR 不保证产生每次更新的缓存信号。
此机制不替代 sitemap，也不承诺 Google 接收。

依据：[Cloudflare Crawler Hints 文档](https://developers.cloudflare.com/cache/advanced-configuration/crawler-hints/)。


## Workflow 解耦上线检查

此清单约束七条 Workflow 的原子切换。
实际迁移基线与验证证据见 workflow-verification.md。

1. 禁用旧采集写入口，核对全部非终态运行。
2. 等待旧付费运行完成 scan/validate/publish。
3. 排空后读取最新 main 状态，重跑迁移。
4. 原子发布独立统计、site 与全部 CI 绑定。
5. 同时上线纯状态派发门和部署等价判断。
6. 验证当天预算承接旧账本，不重新得到额度。
7. 核对同次 artifact ID、真实构建 SHA 和部署消息。
8. 检查三语言分页、项目详情、更新时间与 OG。

不得以禁用入口代替旧运行已结束的证据。
预算上传完成也不代表旧发布 job 已排空。
不得将 collector 或 PR 产物交给 production。
不取消正在付费或部署的任务。
不重置状态、预算或 Cloudflare 构建连接。
