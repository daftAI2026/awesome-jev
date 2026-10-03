# 收录依据复核待补证清单

> 2026-10-03（Asia/Shanghai）｜当前剩余 7 项；访问状态只代表查验当时，不推断删除、私有或迁移。

2026-10-02 的历史复核覆盖剩余 494 项：467 项可补依据、27 项待补证；加上首批 39 项，共补 506 项。2026-10-03 按明确授权移除不可访问来源后，当前待补证清单减至 7 项；保留记录的简介、ID、URL、分类、评分及证据未改写。

## 处理规则

- 已审但未证实的项目保留原数据，不生成空说明、不自动删除或降低准入阈值。
- 来源恢复或补充后，读取固定提交、核验短引文，再经既有 inclusion 导入器更新并移除此清单中的已解决项。
- 每次构建运行离线 inclusion:check 输出覆盖率；新收录后用 inclusion --queue 补审，模型评分不能代替文字依据。

## 已按授权移除的不可访问来源

2026-10-03 使用官方 GH CLI 再次核验目录中 30 个未建立 GitHub ID 的来源，全部再次返回 HTTP 404；同一认证可读取已知公共仓库。按维护者“再次检查，仍没有就删除”的明确授权移除这 30 条，其中包括此前待补证表中的全部 20 条不可访问来源。当前只保留以下 7 个仍有实际可读来源的待补证项目。404 不被解释为已确认删除或私有；移除记录可从 Git 历史恢复，不新增自动删除规则。

## 2 个可读元数据但无源码提交的空仓库

仓库元数据 size 为 0，defaultBranchRef 无提交；分支/contents 返回 404、tree 返回 409，无法固定源码。
- [above-the-fold/typesafe-sdk-swift](https://github.com/above-the-fold/typesafe-sdk-swift)（`gh-above-the-fold-typesafe-sdk-swift`）。
- [hifizz/jev-finance-benchmark](https://github.com/hifizz/jev-finance-benchmark)（`gh-hifizz-jev-finance-benchmark`）。

## 3 个仅有占位 README 的仓库

固定完整 tree 只有 README；两行内容仅含标题与演示标签，没有具体用途或源码链接。不能把仓库名解读成已实现功能。
- [cardotrejos/jev-should-i-apply](https://github.com/cardotrejos/jev-should-i-apply)（`gh-cardotrejos-jev-should-i-apply`）。
- [cardotrejos/jev-ad-preflight](https://github.com/cardotrejos/jev-ad-preflight)（`gh-cardotrejos-jev-ad-preflight`）。
- [cardotrejos/jev-user-jury](https://github.com/cardotrejos/jev-user-jury)（`gh-cardotrejos-jev-user-jury`）。

## 1 个标准应用模板

- [rdk16/jevudio](https://github.com/rdk16/jevudio)（`gh-rdk16-jevudio`）：固定 HEAD `e65a0a45f09066781cc53581701e43fafcb9b778` 的 README、完整 tree、Vue/Rust 入口及配置已读，当前可见实现为标准 Tauri greet 模板，未能证实具体 Jev 用途。

## 1 个间接 CI 角色

- [typesafe-ai/daggerverse](https://github.com/typesafe-ai/daggerverse)（`gh-typesafe-ai-daggerverse`）：已扫描固定 tree 的 138 份代码/配置/文档，没有发现直接 Jev 推理接入；未声称覆盖全部资产、私有消费者或历史。
- [n8n 连接器的固定依赖](https://github.com/typesafe-ai/n8n-nodes-typesafe-ai/blob/c12537bbd9ed7159b7bbe23678ca128c7b2fb52b/dagger.json) 指向其 GitHub/zizmor 模块；[连接器的 System One 客户端](https://github.com/typesafe-ai/n8n-nodes-typesafe-ai/blob/c12537bbd9ed7159b7bbe23678ca128c7b2fb52b/nodes/TypeSafeAi/api.ts) 证实具体消费链。
- 关键使用证据跨仓，现有引用规则只允许同仓。保留待维护者裁定间接基础设施范围，不为了补齐一个字段放宽全局证据边界。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
