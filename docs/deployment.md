<!--
[INPUT]: 依赖 radar 工作流、production 环境与 Workers 构建触发器
[OUTPUT]: 提供同版本产物部署、切换验收与恢复步骤
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
6. 将本站 Cloudflare 触发器 `branch_excludes` 设为 `["*"]`。
7. 重读触发器，确认排除全部 Git 分支。

此过滤停止 Git 自动构建，不删除 Worker。
保留仓库连接、原构建命令与触发器，便于恢复。
不修改账户的 GitHub App 或其他项目。
手工 Cloudflare 重试仍能消耗构建分钟。
新路径失败时，保留旧触发器，先修复故障。

## 恢复

1. 将 GitHub 部署开关设为 `false`。
2. 将本站触发器 `branch_excludes` 恢复为 `[]`。
3. 确认包含分支仍为 `["main"]`。
4. 在 Cloudflare 对当前 `main` 发起构建。
5. 检查部署成功及生产 HTTP。

只重跑部署 job 时，必须保留同次运行的产物。
产物过期后，在当前 `main` 派发完整校验。
GitHub 校验成功不等于生产部署成功。
以部署 job、Worker 版本和生产 HTTP 共同验收。

## 官方依据

- [Cloudflare GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Cloudflare 构建分支过滤](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)
- [GitHub 事件触发边界](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow)
- [GitHub Actions 计费](https://docs.github.com/en/billing/concepts/product-billing/github-actions)

仓库公开且使用标准 `ubuntu-latest` runner。
此路径不消耗 Cloudflare Workers Builds 分钟。
仓库改为私有或使用付费 runner 时，重新核对额度。
