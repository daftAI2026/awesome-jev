# radar/
> L2 | 父级: ../CLAUDE.md

成员清单
state.json: 核心 v2 检查点；同一 map 保留历史但只限活跃任务，保存 catalogReview、输入指纹/真实模型调用时间、公平游标及最多 100 条残页
latest.json: 核心轮次、分类 queue 与 reusedReviews 收据；pending 保留旧的全部未收录计数，不再把它显示为首次待审
metadata-state.json: version 1 的统计续点 metadataNextId/旧 URL 与失效 observations；按本地 ID 保存独立运行/六小时周期，不手填历史
metadata-latest.json: 独立统计覆盖和生命周期迁址/隔离/恢复计数；失败轮次不冒称有效失效观察
alternatives-state.json: 替代实现独立检查点；复用活跃容量、公平排序与模型输入指纹，不共享核心预算或元数据续点
alternatives-latest.json: 替代实现的分类队列、判断复用与新增收据，不替代核心元数据报告

状态由 scripts 的对应采集器生成，不手工重置以假装完成轮次。失败诊断 artifact 不可 --apply，成功发布才构成下一轮规范检查点；UTC 请求预算另由受信 artifact 保存，不在这些文件中。

法则: 独立状态·发布后推进·诊断不等于快照
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
