<!--
[INPUT]: 依赖 radar 工作流、production 环境与 Workers 构建触发器
[OUTPUT]: 提供同版本部署、项目构建断开、切换实证与恢复步骤
[POS]: docs 的站点发布契约；采集准入归 collector.md
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# 站点部署

## 唯一构建与凭据边界

`radar.yml` 的 `verify` 校验精确提交。
它执行类型、离线测试、分类、数据和 lint 检查。
它构建应用，再执行零跳过交付检查。
可信 `main` 校验成功后封装 `dist`。
压缩包保留隐藏文件和 `.build-sha`。
产物只保留一天，不包含源码或本机 `.env`。

`deploy` 读取同次运行的不可变 artifact ID。
它验证提交 SHA、Worker 名称和预编译配置。
它串行部署，并在上传前重读当前 `main`。
提交已过期时，跳过部署。
GitHub 读取失败时，停止部署。
部署使用锁定 Wrangler，不执行第二次构建。
Worker 版本说明记录 GitHub 提交 SHA。
部署之后的 `main` 推进由后续校验运行交付。

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
三采集器读取发布器的 `status` 输出。
只有 `published` 且开关启用才派发 `main` 校验。
`unchanged` 不派发。
派发失败会使发布 job 失败；已推送数据不回滚。
维护者可在 `main` 重跑 `mode=validate` 恢复部署。
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
