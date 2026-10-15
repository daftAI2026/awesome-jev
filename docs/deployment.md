<!--
[INPUT]: 依赖 site 工作流、production 环境、Workers 构建触发器与区域设置
[OUTPUT]: 提供同版本部署、HTTPS 跳转、CPU 探测防护与 Crawler Hints 边界
[POS]: docs 的站点发布契约；采集准入归 collector.md
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# 站点部署

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
