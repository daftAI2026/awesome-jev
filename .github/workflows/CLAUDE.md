# .github/workflows/
> L2 | 父级: ../CLAUDE.md

成员清单
alternatives.yml: 独立替代实现发现与增量发布，独立开关/预算；实际推送后派发 main 校验，不持有部署凭据
news-sync.yml: AIHOT 新闻验证与 ID 增量发布；实际推送后派发 main 校验，不修改项目快照或持有部署凭据
radar.yml: 核心候选发现与审核，保留原预算身份与付费步骤；无前置统计探针，采集器严格校验身份
metadata-sync.yml: 全目录统计错峰同步，无模型；独占统计状态，发布阶段共用有限原生队列
site.yml: 精确 PR/main 交付与同次 artifact 部署；允许纯状态后继提交，通知可信 main 收录控制器
submission-review.yml: 可信 main 上的 Issue/PR 建议性审查与恢复，允许写评论但不改目录或合并 PR
submission-intake.yml: 独立可信 main 条件写入；自动 keep 或维护者 /ok 分类收据生成数据 PR，精确 CI 后合并/关闭；完整不匹配纯投稿的拒收/CAS 回收与有界恢复，无 Jev 凭据

radar/alternatives 发布目录、README 与 sitemap，不生成或提交 OG 图片。site 构建同快照的公开 PNG，生产 Worker 只验证身份并交付静态产物。

site 的 verify 与 radar/alternatives/metadata 的 validate 与 news 的 sync 验证均在 build 后执行 test:delivery；构建图和真实 HTTP 检查不得靠 skip 变绿。

四条发布链路调用 scripts/publish-data.ts，普通路径复用已完成的验证；main 推进时在独立临时工作树叠加本轮增量，重新构建/交付验证。发现发布不补读 Top100，也不重跑 Jev。仅 non-fast-forward 竞争重试三次；禁止强推或整体替换远端快照。

main 的 verify 完成全部检查才上传 dist 压缩包。部署读取同次运行的 artifact ID，校验 SHA/Worker 配置。production 仅允许 main；部署 job 不重新构建。仓库开关 CLOUDFLARE_ACTIONS_DEPLOY_ENABLED 控制切换，步骤见 ../../docs/deployment.md。

GITHUB_TOKEN 推送不触发普通 push Actions。四采集器仅在 status=published 且 site_changed=true 时显式派发 main 校验。未变化不派发；派发失败可见，不回滚已发布数据。

法则: 可信代码·权限隔离·发布前验证
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
