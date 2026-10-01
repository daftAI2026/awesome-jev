# 收录依据复核待补证清单

> 2026-10-02（Asia/Shanghai）｜全量审查已完成；访问状态只代表查验当时，不推断删除、私有或迁移。

剩余 494 项全部逐项复核：467 项可补依据，27 项待来源或收录范围补充。加上首批 39 项，本轮共补 506 项。原 1,666 项依据及作者简介、ID、URL、分类、评分和顺序均保留。

## 处理规则

- 已审但未证实的项目保留原数据，不生成空说明、不自动删除或降低准入阈值。
- 来源恢复或补充后，读取固定提交、核验短引文，再经既有 inclusion 导入器更新并移除此清单中的已解决项。
- 每次构建运行离线 inclusion:check 输出覆盖率；新收录后用 inclusion --queue 补审，模型评分不能代替文字依据。

## 20 项来源不可访问

已尝试公开 GitHub 仓库/HEAD 读取；有历史固定来源的也尝试 raw 文件。返回 NOT_FOUND/HTTP 404 或无法解析固定来源，不能从名称、作者简介和旧评分编造依据。

| 项目 | 稳定 ID | 记录中的历史固定来源 |
| --- | --- | --- |
| [typesafe-ai/Overwatch](https://github.com/typesafe-ai/Overwatch) | `gh-typesafe-ai-overwatch` | 无固定记录 |
| [Xubqpanda/JevRepo](https://github.com/Xubqpanda/JevRepo) | `gh-xubqpanda-jevrepo` | 无固定记录 |
| [sudorandom/protoc-gen-jev](https://github.com/sudorandom/protoc-gen-jev) | `gh-10-sudorandom-protoc-gen-jev` | [固定记录](https://github.com/sudorandom/protoc-gen-jev/blob/0ede106c68a2bba5c3fe1a6dec61d80c08580702/README.md) |
| [generallymatthew/factlabel](https://github.com/generallymatthew/factlabel) | `gh-16-generallymatthew-factlabel` | [固定记录](https://github.com/generallymatthew/factlabel/blob/4a698d010f2688bb4dd22be4f477ca0f30739a60/README.md) |
| [eriestra/almond-fastloop](https://github.com/eriestra/almond-fastloop) | `gh-eriestra-almond-fastloop` | 无固定记录 |
| [deadczarvc/jev-factkeep-compaction](https://github.com/deadczarvc/jev-factkeep-compaction) | `gh-10-deadczarvc-jev-factkeep-compaction` | [固定记录](https://github.com/deadczarvc/jev-factkeep-compaction/blob/5cae8b76e691bb1555d2d228fef7233472a42c86/README.md) |
| [JohnsonRan/pi-jev](https://github.com/JohnsonRan/pi-jev) | `gh-10-johnsonran-pi-jev` | [固定记录](https://github.com/johnsonran/pi-jev/blob/625f9a2752a30ba970798e79023089489039423e/README.md) |
| [v60samurai/jev-atlas](https://github.com/v60samurai/jev-atlas) | `gh-10-v60samurai-jev-atlas` | [固定记录](https://github.com/v60samurai/jev-atlas/blob/e780e4d6f2f4eb72f6c7f6d5b92e7ab0041e8e10/README.md) |
| [codewitheren/jev-openrouter-demo](https://github.com/codewitheren/jev-openrouter-demo) | `gh-12-codewitheren-jev-openrouter-demo` | [固定记录](https://github.com/codewitheren/jev-openrouter-demo/blob/60e28089a6990f8632dfac45d819fd3bba713b09/README.md) |
| [dperezcabrera/system-one-poker](https://github.com/dperezcabrera/system-one-poker) | `gh-13-dperezcabrera-system-one-poker` | [固定记录](https://github.com/dperezcabrera/system-one-poker/blob/f3b17165707bb68341d38c2b1dd1961d2cc3360f/README.md) |
| [zhlei07/open-system-one](https://github.com/zhlei07/open-system-one) | `gh-7-zhlei07-open-system-one` | [固定记录](https://github.com/zhlei07/open-system-one/blob/e2f50d0e6101dfa0f86c44d8060d2e4b120fe40f/README.md) |
| [itani404/jev-explained](https://github.com/itani404/jev-explained) | `gh-8-itani404-jev-explained` | [固定记录](https://github.com/itani404/jev-explained/blob/7937c5f4c85d7b3efe5261c52e1510a03c0b9e57/README.md) |
| [adhamelhayek-lab/jev-connector](https://github.com/adhamelhayek-lab/jev-connector) | `gh-adhamelhayek-lab-jev-connector` | 无固定记录 |
| [altregubov/jev-antigravity-decider](https://github.com/altregubov/jev-antigravity-decider) | `gh-altregubov-jev-antigravity-decider` | 无固定记录 |
| [BunsDev/river-oaks](https://github.com/BunsDev/river-oaks) | `gh-bunsdev-river-oaks` | 无固定记录 |
| [gloridifice/pi-jev-router](https://github.com/gloridifice/pi-jev-router) | `gh-gloridifice-pi-jev-router` | 无固定记录 |
| [SaremS/jevscan](https://github.com/SaremS/jevscan) | `gh-sarems-jevscan` | 无固定记录 |
| [thomasschafer/jev-bench](https://github.com/thomasschafer/jev-bench) | `gh-thomasschafer-jev-bench` | 无固定记录 |
| [thumay9700/jev-plays](https://github.com/thumay9700/jev-plays) | `gh-thumay9700-jev-plays` | 无固定记录 |
| [trophee-bot/typesafe-oracles](https://github.com/trophee-bot/typesafe-oracles) | `gh-trophee-bot-typesafe-oracles` | 无固定记录 |

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
