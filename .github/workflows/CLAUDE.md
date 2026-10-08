# .github/workflows/
> L2 | 父级: ../CLAUDE.md

成员清单
alternatives.yml: 独立替代实现发现与增量发布，独立开关/预算；实际推送后派发 main 校验，不持有部署凭据
news-sync.yml: AIHOT 新闻验证与 ID 增量发布；实际推送后派发 main 校验，不修改项目快照或持有部署凭据
radar.yml: 核心采集与版本校验；可信 main 封装已验产物，production job 按 artifact ID 部署且拒绝过期 main；自建收录分支显式唤醒 main 控制器
submission-review.yml: 可信 main 上的 Issue/PR 建议性审查与恢复，允许写评论但不改目录或合并 PR
submission-intake.yml: 独立可信 main 条件写入；自动 keep 或维护者 /ok 分类收据生成数据 PR，精确 CI 后合并/关闭；完整不匹配纯投稿的拒收/CAS 回收与有界恢复，无 Jev 凭据

radar/alternatives 发布目录、README 与 sitemap，不再生成或提交 OG 图片；部署后的 Worker 从同一目录快照按请求渲染。

radar/alternatives 的 verify/validate 与 news 的 sync 验证均在 build 后执行 test:delivery；构建图和真实 HTTP 检查不得靠 skip 变绿。

三条发布链路调用 scripts/publish-data.ts，普通路径复用已完成的验证；main 推进时在独立临时工作树叠加本轮增量，重新构建/交付验证。核心重读最终 Top100，但不重跑 Jev。仅 non-fast-forward 竞争重试三次；禁止强推或整体替换远端快照。

main 的 verify 完成全部检查才上传 dist 压缩包。部署读取同次运行的 artifact ID，校验 SHA/Worker 配置。production 仅允许 main；部署 job 不重新构建。仓库开关 CLOUDFLARE_ACTIONS_DEPLOY_ENABLED 控制切换，步骤见 ../../docs/deployment.md。

GITHUB_TOKEN 推送不触发普通 push Actions。三采集器仅在 status=published 时显式派发 main 校验。未变化不派发；派发失败可见，不回滚已发布数据。

法则: 可信代码·权限隔离·发布前验证
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
