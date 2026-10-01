# radar/
> L2 | 父级: ../CLAUDE.md

成员清单
state.json: 核心搜索页与候选审查检查点；metadataCursor 是旧版位置续点，metadataNext 是优先身份锚点，仅随验证后快照发布推进
latest.json: 核心轮次结果与取证收据；新轮次报告 Top100 完整度、其它批次、剩余数及实际 GraphQL cost，失败不伪称刷新成功
alternatives-state.json: 替代实现的独立搜索/候选检查点，不复用核心元数据续点或付费账本
alternatives-latest.json: 替代实现的独立审查与新增记录，不替代核心元数据报告

状态由 scripts 的对应采集器生成，不手工重置以假装完成轮次。失败诊断 artifact 不可 --apply，成功发布才构成下一轮规范检查点；UTC 请求预算另由受信 artifact 保存，不在这些文件中。

法则: 独立状态·发布后推进·诊断不等于快照
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
