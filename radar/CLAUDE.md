# radar/
> L2 | 父级: ../CLAUDE.md

成员清单
state.json: 核心 v2 搜索与候选检查点，保存绑定原目录的 catalogReview、nextReviewLane 和最多 100 条残页；不再拥有统计续点
latest.json: 核心发现/审核轮次、背压与取证收据；历史 metadata 字段不再作为刷新或发布门
metadata-state.json: version 1 的统计续点 metadataNextId/旧 URL 与失效 observations；按本地 ID 保存独立运行/六小时周期，不手填历史
metadata-latest.json: 独立统计覆盖和生命周期迁址/隔离/恢复计数；失败轮次不冒称有效失效观察
alternatives-state.json: 替代实现的独立搜索/候选检查点，不复用核心元数据续点或付费账本
alternatives-latest.json: 替代实现的独立审查与新增记录，不替代核心元数据报告

状态由 scripts 的对应采集器生成，不手工重置以假装完成轮次。失败诊断 artifact 不可 --apply，成功发布才构成下一轮规范检查点；UTC 请求预算另由受信 artifact 保存，不在这些文件中。

法则: 独立状态·发布后推进·诊断不等于快照
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
