# .github/workflows/
> L2 | 父级: ../CLAUDE.md

成员清单
alternatives.yml: 独立替代实现的发现与可信快照发布，独立开关和预算，不改变核心雷达状态，复用最新 main 增量发布
news-sync.yml: AIHOT 新闻独立同步与验证，仅发布新闻快照和站点地图，竞争时按 ID 叠加最新 main 并重新验证
radar.yml: 核心生态采集、main 目标 PR 明确 head/推送校验与数据发布；自建收录分支校验后用 Actions-only job 显式唤醒 main，不 checkout 分支；内置 token 能力探针、Top100 诊断隔离，复用最新 main 增量发布
submission-review.yml: 可信 main 上的 Issue/PR 建议性审查与恢复，允许写评论但不改目录或合并 PR
submission-intake.yml: 独立可信 main 条件写入；自动 keep 或维护者 /ok 分类收据生成数据 PR，精确 CI 后合并/关闭；完整不匹配纯投稿的拒收/CAS 回收与有界恢复，无 Jev 凭据

radar/alternatives 发布目录、README 与 sitemap，不再生成或提交 OG 图片；部署后的 Worker 从同一目录快照按请求渲染。

radar/alternatives 的 verify/validate 与 news 的 sync 验证均在 build 后执行 test:delivery；构建图和真实 HTTP 检查不得靠 skip 变绿。

三条发布链路调用 scripts/publish-data.ts，普通路径复用已完成的验证；main 推进时在独立临时工作树叠加本轮增量，重新构建/交付验证。核心重读最终 Top100，但不重跑 Jev。仅 non-fast-forward 竞争重试三次；禁止强推或整体替换远端快照。

法则: 可信代码·权限隔离·发布前验证
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
