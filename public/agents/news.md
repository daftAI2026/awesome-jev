<!--
[INPUT]: 规范项目与新闻快照的公开展示字段
[OUTPUT]: 互链机器阅读文档
[POS]: public/agents 的构建产物；修改 scripts/generate-llms.ts 后重新生成
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# Awesome JEV: Source-attributed news

[llms.txt](https://awesomejev.cc/llms.txt) · [llms-full.txt](https://awesomejev.cc/llms-full.txt) · [Reading guide](https://awesomejev.cc/agents/index.md) · [Categories](https://awesomejev.cc/agents/categories.md) · [Repository topics](https://awesomejev.cc/agents/tags.md) · [Top 100 and local saved items](https://awesomejev.cc/agents/collections.md) · [GitHub projects](https://awesomejev.cc/agents/projects.md) · [Source-attributed news](https://awesomejev.cc/agents/news.md) · [Submit a project](https://awesomejev.cc/agents/submit.md) · [About and boundaries](https://awesomejev.cc/agents/about.md)

[News index \(en\)](https://awesomejev.cc/news) · [News index \(zh\)](https://awesomejev.cc/zh/news) · [News index \(ja\)](https://awesomejev.cc/ja/news)

News pages contain source-attributed summaries, not full articles. Publication time is taken from the source when available. Items without summaries are excluded from this document.

## Strands 发布开源决策模型 Strands Decider 2B

[Summary page \(en\)](https://awesomejev.cc/news/yzqy6x4npmqcmfkh4l2y4pvh6) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/yzqy6x4npmqcmfkh4l2y4pvh6) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/yzqy6x4npmqcmfkh4l2y4pvh6)

[Hacker News 热门（buzzing.cc 中文翻译）](https://strandsagents.com/blog/introducing-strands-decider/) · [AIHOT](https://aihot.news/items/yzqy6x4npmqcmfkh4l2y4pvh6)

Source publication: 2026-10-07T05:49:51.293Z

Strands labs 发布开源决策模型 strands-decider-2b，基于 Qwen3.5-2B 去掉 LM head 换成约百万参数的 pointer head，只能在给定选项中做选择和打分，适合本地 CPU 或 GPU 运行。

## Laya 开发者指南：用 CLINC150 实测零样本决策与校准

[Summary page \(en\)](https://awesomejev.cc/news/t2hejmd7b9emfl60v7mvcm7v9) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/t2hejmd7b9emfl60v7mvcm7v9) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/t2hejmd7b9emfl60v7mvcm7v9)

[MarkTechPost（RSS）](https://www.marktechpost.com/2026/10/06/a-developers-guide-to-laya-zero-shot-decisions-and-calibration/) · [AIHOT](https://aihot.news/items/t2hejmd7b9emfl60v7mvcm7v9)

Source publication: 2026-10-07T00:53:03.000Z

教程实测 Convai Innovations 开源决策引擎 Laya 0.3.27，一个 4.21 亿参数的非自回归 System 1 模型，单次前向返回类型化问题的概率且零输出 token。

## TypeSafe AI 在 Modal 上三天内将 Jev 扩展至超万亿 token

[Summary page \(en\)](https://awesomejev.cc/news/hjekicue5z8u9zo2kqf54j5eq) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/hjekicue5z8u9zo2kqf54j5eq) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/hjekicue5z8u9zo2kqf54j5eq)

[Modal 官方工程博客（RSS）](https://modal.com/blog/typesafeai-case-study) · [AIHOT](https://aihot.news/items/hjekicue5z8u9zo2kqf54j5eq)

Source publication: 2026-10-05T00:00:00.000Z

TypeSafe AI 的首个模型 Jev 在 Modal 上于发布后三天内处理超 1 万亿 token，并在 OpenRouter 1K-10K token 上下文榜单登顶，承接 15.1% 的请求。Jev 并非大语言模型，而是非自回归的 System One Model，以状态和问题为输入，并行输出带概率的结构化类型值，训练采用自研的 RLCD 方法。

## Simon Willison 发布 llm-openai-decisions 0.1a0 插件接入 OpenAI Decisions API

[Summary page \(en\)](https://awesomejev.cc/news/n9yheyt20g958eyaqgb7yuxf5) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/n9yheyt20g958eyaqgb7yuxf5) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/n9yheyt20g958eyaqgb7yuxf5)

[Simon Willison 博客](https://simonwillison.net/2026/Oct/6/llm-openai-decisions/) · [AIHOT](https://aihot.news/items/n9yheyt20g958eyaqgb7yuxf5)

Source publication: 2026-10-06T23:04:13.000Z

Simon Willison 发布 llm-openai-decisions 0.1a0 插件，用于调用 OpenAI 上周 DevDay 预告的 Jev 风格 Decisions API，并让 GPT-6 Astra 参照其 llm-typesafe 插件生成代码。

## Perplexity Decision API 价格减半

[Summary page \(en\)](https://awesomejev.cc/news/mw4rg080w2u4bdoh3hskx6kqd) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/mw4rg080w2u4bdoh3hskx6kqd) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/mw4rg080w2u4bdoh3hskx6kqd)

[X：Aravind Srinivas（Perplexity CEO） \(@AravSrinivas\)](https://x.com/AravSrinivas/status/2107573198145663233) · [AIHOT](https://aihot.news/items/mw4rg080w2u4bdoh3hskx6kqd)

Source publication: 2026-10-06T20:46:21.000Z

另外，Perplexity Decision API 的价格减半了，现在每百万 input tokens 只要 2 美分。尽情享用！

## Musubi 发布开源权重内容审核决策模型 PolicyLM-1.7B

[Summary page \(en\)](https://awesomejev.cc/news/g4oxc2p07nvvl5q2bpdf4zjh2) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/g4oxc2p07nvvl5q2bpdf4zjh2) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/g4oxc2p07nvvl5q2bpdf4zjh2)

[TechCrunch：AI（RSS）](https://techcrunch.com/2026/10/06/how-ai-decision-models-could-change-content-moderation/) · [AIHOT](https://aihot.news/items/g4oxc2p07nvvl5q2bpdf4zjh2)

Source publication: 2026-10-06T20:35:20.000Z

Musubi 于周二宣布发布面向实时内容审核的轻量级决策模型 PolicyLM-1.7B，采用开放权重。该模型可将自然语言编写的内容政策在 50 毫秒内应用到消息上，成本和速度接近传统 AI 分类器，且政策变更时无需重新训练。决策模型自 9 月 Typesafe AI 发布 Jev 后成为热点，OpenAI 和 Amazon 随后也推出了同类模型。

## LLM-as-Jev：LLM 已是 Jev 式决策模型——何时以及如何微调

[Summary page \(en\)](https://awesomejev.cc/news/luzb6hbyck0brnyrbgpggc1fk) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/luzb6hbyck0brnyrbgpggc1fk) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/luzb6hbyck0brnyrbgpggc1fk)

[HuggingFace Daily Papers（社区热门论文）](https://arxiv.org/abs/2610.02076) · [AIHOT](https://aihot.news/items/luzb6hbyck0brnyrbgpggc1fk)

Source publication: 2026-10-04T00:00:00.000Z

研究提出 LLM-as-Jev 框架，通过下一 token 在方括号数字标识上的概率直接提取校准决策，无需生成自由文本。在 Qwen3.5-4B 和 Qwen3-0.6B 上，4B 模型免训练即匹配同骨干的社区 Jev 式模型，并原生支持图像多模态决策；微调仅对弱模型和特定任务（如多选项意图路由）收益明显，KL 锚定可防止对话生成能力退化，LoRA 在强模型上表现最佳。

## Perplexity 开源决策模型登顶 HF 榜单

[Summary page \(en\)](https://awesomejev.cc/news/g3sz2rqkp840i8qr4ca1sxbvd) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/g3sz2rqkp840i8qr4ca1sxbvd) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/g3sz2rqkp840i8qr4ca1sxbvd)

[X：Aravind Srinivas（Perplexity CEO） \(@AravSrinivas\)](https://x.com/AravSrinivas/status/2107522748167954442) · [AIHOT](https://aihot.news/items/g3sz2rqkp840i8qr4ca1sxbvd)

Source publication: 2026-10-06T17:25:53.000Z

Perplexity 在 Hugging Face Decision Index（决策模型基准）上夺冠。我们的模型是开放权重的，所有人都可以使用！ @perplexitydevs：pplx-decider-v1.1-27b，我们更新后的开放权重多模态决策模型，现已可用。 它在新版 @huggingface Decision Index 0.3 基准上得分最高。pplx-decider-v1.1-27b 的成本是 v1 的一半，每百万输入 token 仅 $0.02。 https://huggingface.co/spaces/multimodalart/jev-decision-index

## OpenRouter 对比页新增多款决策模型

[Summary page \(en\)](https://awesomejev.cc/news/cmpvx64p6smykuaabnrmz7y08) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmpvx64p6smykuaabnrmz7y08) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmpvx64p6smykuaabnrmz7y08)

[X：OpenRouter \(@OpenRouter\)](https://x.com/OpenRouter/status/2107491841385927088) · [AIHOT](https://aihot.news/items/cmpvx64p6smykuaabnrmz7y08)

Source publication: 2026-10-06T15:23:04.000Z

小贴士 💡 对比 Clef、Jev 及另外 10 款决策模型的功能与用量 使用对比页面：https://openrouter.ai/compare/cloudflare/clef-flash/cloudflare/clef/typesafe/jev-1.13/perplexity/pplx-decider-v1-27b

## Jev-as-a-Judge 实战教程：用 Jev 评估智能体执行轨迹

[Summary page \(en\)](https://awesomejev.cc/news/jq4swepzr4j7x4kue9qhox4l5) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/jq4swepzr4j7x4kue9qhox4l5) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/jq4swepzr4j7x4kue9qhox4l5)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2107472222398886011) · [AIHOT](https://aihot.news/items/jq4swepzr4j7x4kue9qhox4l5)

Source publication: 2026-10-06T14:05:07.000Z

DAIR.AI 的 Elvis Saravia 发布 Jev-as-a-Judge 交互式指南，讲解如何用 TypeSafe AI 的决策模型 Jev 对智能体完整执行轨迹（请求、工具调用及结果、最终回复）做评估。

## Jev-as-a-Judge 提升 LLM 评判可靠性

[Summary page \(en\)](https://awesomejev.cc/news/wmznb43k0jmiy8ofu2xnt1u3m) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/wmznb43k0jmiy8ofu2xnt1u3m) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/wmznb43k0jmiy8ofu2xnt1u3m)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2107473121628610574) · [AIHOT](https://aihot.news/items/wmznb43k0jmiy8ofu2xnt1u3m)

Source publication: 2026-10-06T14:08:41.000Z

这是 Jev 最令人印象深刻的应用场景之一。 我大量从事 agent 评测、评判器和验证器方面的工作。 我发现 Jev-as-a-Judge 通过一致性提升了 LLM 评判器的可靠性。这使其非常适合用于评判器、验证器和持续监控。

## 用 Jev-as-a-Judge 提升智能体评估可靠性

[Summary page \(en\)](https://awesomejev.cc/news/umpmrn2m43bj52s1scb8t05mp) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/umpmrn2m43bj52s1scb8t05mp) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/umpmrn2m43bj52s1scb8t05mp)

[X：DAIR.AI \(@dair\_ai\)](https://x.com/dair_ai/status/2107473353472926161) · [AIHOT](https://aihot.news/items/umpmrn2m43bj52s1scb8t05mp)

Source publication: 2026-10-06T14:09:37.000Z

用 Jev-as-a-Judge 提升智能体评估的可靠性。 https://x.com/omarsar0/status/2107472222398886011?s=20

## SoK：网络控制回路中的语义决策引擎

[Summary page \(en\)](https://awesomejev.cc/news/pv7rp67nz5ji5abt9zye3ibwl) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/pv7rp67nz5ji5abt9zye3ibwl) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/pv7rp67nz5ji5abt9zye3ibwl)

[HuggingFace Daily Papers（社区热门论文）](https://arxiv.org/abs/2610.06425) · [AIHOT](https://aihot.news/items/pv7rp67nz5ji5abt9zye3ibwl)

Source publication: 2026-10-05T00:00:00.000Z

一篇 SoK 系统梳理了 139 个论文家族，按决策接口、执行路径与校验归属分类。其中 50 个家族声称其引擎适配控制回路或时间预算，仅 4 个给出匹配测量；全部 139 个中只有 4 个报告截止时间达成情况。缺口集中在决策不含确定性计算步骤之处：72 个家族提出 22 项声称，无一有支撑，仅 2 个指明覆盖责任方。

## SearchJev：面向搜索智能体的快速校准 System-1 模型

[Summary page \(en\)](https://awesomejev.cc/news/d3uk2i5c0lcqqb2flkf9lcr5y) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/d3uk2i5c0lcqqb2flkf9lcr5y) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/d3uk2i5c0lcqqb2flkf9lcr5y)

[HuggingFace Daily Papers（社区热门论文）](https://arxiv.org/abs/2610.05107) · [AIHOT](https://aihot.news/items/d3uk2i5c0lcqqb2flkf9lcr5y)

Source publication: 2026-10-04T00:00:00.000Z

SearchJev 是一款面向搜索智能体的快速校准 System-1 模型，通过直接对合法选项打分而非自回归生成来做搜索决策，并提出 SLCD 方法从不确定监督中学习并校准决策置信度。

## Reflection 发布 501B-A23B 开源编码模型 Beam

[Summary page \(en\)](https://awesomejev.cc/news/krivwcmcv6qloa3az7f5j0jip) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/krivwcmcv6qloa3az7f5j0jip) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/krivwcmcv6qloa3az7f5j0jip)

[Latent Space（RSS）](https://www.latent.space/p/ainews-reflection-beam-501b-a23b) · [AIHOT](https://aihot.news/items/krivwcmcv6qloa3az7f5j0jip)

Source publication: 2026-10-06T06:28:43.000Z

Reflection 发布文本-only 的 501B 总参数 / 23B 激活 MoE 模型 Beam，面向编码、智能体和科学任务，从零训练，完整权重将在本月以 Apache 2.0 发布。

## 卡兹克解读 A16Z 两份 AI 报告：AI 使用很广但用得还浅，头部 1% 用户月均花 903 美元

[Summary page \(en\)](https://awesomejev.cc/news/tfuj58rvo46hvh8l2nzcbpf7n) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/tfuj58rvo46hvh8l2nzcbpf7n) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/tfuj58rvo46hvh8l2nzcbpf7n)

[X：卡兹克 \(@Khazix0918\)](https://x.com/Khazix0918/status/2107297777583825359) · [AIHOT](https://aihot.news/items/tfuj58rvo46hvh8l2nzcbpf7n)

Source publication: 2026-10-06T02:31:56.000Z

作者解读 A16Z 第七版《Top 100 消费级 AI 应用》和 90 多页的《市场状况 II》报告，指出反常识数据。美国近一半人用过 AI 但只有 25% 每天在用，截至 2026 年 8 月仅 4.5% 有 ChatGPT、Gemini 或 Claude 个人付费订阅；付费用户中头部 1% 月均消费 903 美元、贡献 19.5% 的全部消费。

## flow-1：RL 训练找 agent 错误

[Summary page \(en\)](https://awesomejev.cc/news/o0547uzw4bdme530dsv5cq6jv) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/o0547uzw4bdme530dsv5cq6jv) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/o0547uzw4bdme530dsv5cq6jv)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2107273821824622885) · [AIHOT](https://aihot.news/items/o0547uzw4bdme530dsv5cq6jv)

Source publication: 2026-10-06T00:56:45.000Z

和 Jev 一样，我相信 RL 会解锁更多类似的成果，大幅削减关键智能体操作的成本。 flow-1 在性能上有竞争力，但在发现 agent trace 中的失败方面能大幅节省成本。 RSI 不只适用于通用智能。它同样会加速专用智能。

## Hao AI Lab 开源 Minecraft 智能体 Jev，对真人玩家胜率 70%

[Summary page \(en\)](https://awesomejev.cc/news/ctsuo4u6rnyjmg2jvu7dhjt9y) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/ctsuo4u6rnyjmg2jvu7dhjt9y) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/ctsuo4u6rnyjmg2jvu7dhjt9y)

[X：Sky Computing Lab \(@haoailab\)](https://x.com/haoailab/status/2107227312911716584) · [AIHOT](https://aihot.news/items/ctsuo4u6rnyjmg2jvu7dhjt9y)

Source publication: 2026-10-05T21:51:56.000Z

Hao AI Lab 发布完全开源的 Minecraft 智能体 Jev，经 1,795 轮对局后公开其工作方式。该智能体采用 Prompt 进化而非训练，由 SOTA LLM 智能体在人类监督下进化提示词；在 NVIDIA Blackwell 上每次决策耗时 24 ms，比某领先推理引擎快 2.5 倍；在 Block UHC 对真人玩家胜率 70%。

## Liquid AI 发布 d1 决策模型并新增图像输入能力

[Summary page \(en\)](https://awesomejev.cc/news/uu1qa3hh83kc9i4u832wpywyp) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/uu1qa3hh83kc9i4u832wpywyp) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/uu1qa3hh83kc9i4u832wpywyp)

[Liquid AI 模型与工程博客（网页）](https://www.liquid.ai/blog/d1-decision-model) · [AIHOT](https://aihot.news/items/uu1qa3hh83kc9i4u832wpywyp)

Source publication: 2026-10-05T00:00:00.000Z

Liquid AI 发布 d1 决策模型，新增文本与图像输入，可通过 console.liquid.ai 和 d1 Playground 使用。

## Replit 上周更新：GPT-6.1 Sol 与 Claude Sonnet 5.5

[Summary page \(en\)](https://awesomejev.cc/news/xnpgytx3xm59vpq5kxu2y49x4) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/xnpgytx3xm59vpq5kxu2y49x4) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/xnpgytx3xm59vpq5kxu2y49x4)

[X：Replit \(@Replit\)](https://x.com/Replit/status/2107131199307063778) · [AIHOT](https://aihot.news/items/xnpgytx3xm59vpq5kxu2y49x4)

Source publication: 2026-10-05T15:30:01.000Z

如果你错过了，以下是上周发布的内容： - 使用新模型构建：GPT-6.1 Sol 和 Claude Sonnet 5.5 - 通过 AI 集成让 agent 使用 Jev - 更新了 Settings 中的 UI - 企业版：通过公司级规则或受控例外设置高级 Workplace 设置。 更多内容请查看我们的 changelog： https://docs.replit.com/updates/2026/10/02/changelog

## TypeSafe AI 决策模型 Jev 日处理量达 1 万亿 Token，OpenAI 等巨头跟进推出同类工具

[Summary page \(en\)](https://awesomejev.cc/news/im7v0rfruaoz3f9j50iiwrnus) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/im7v0rfruaoz3f9j50iiwrnus) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/im7v0rfruaoz3f9j50iiwrnus)

[IT之家（RSS）](https://www.ithome.com/1/009/744.htm) · [AIHOT](https://aihot.news/items/im7v0rfruaoz3f9j50iiwrnus)

Source publication: 2026-10-05T00:06:48.000Z

据《华尔街日报》报道，TypeSafe AI 于 9 月 15 日发布的决策模型 Jev 不生成文本，而是用“面向校准决策的强化学习”把输入归类到预设输出，日均处理 token 已达一万亿，约 25% 的财富世界 500 强企业在用。

## Meta 等提出 Context Language Models，模型自管上下文

[Summary page \(en\)](https://awesomejev.cc/news/tzi9tbjk38i07bf4np38x2o0z) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/tzi9tbjk38i07bf4np38x2o0z) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/tzi9tbjk38i07bf4np38x2o0z)

[X：DAIR.AI \(@dair\_ai\)](https://x.com/dair_ai/status/2106770783607373994) · [AIHOT](https://aihot.news/items/tzi9tbjk38i07bf4np38x2o0z)

Source publication: 2026-10-04T15:37:51.000Z

Meta 及合作者提出 Context Language Models（CLMs），把实时上下文当作模型可自由编辑的文件，无需训练即可零样本使用。在 BrowseComp-Plus 上比 SOTA 上下文管理策略准确率高 11.4%、FLOPs 少 21.5%；12 小时 EdgeBench 上分数高 5%、FLOPs 少 59%。

## DAIR.AI 本周 AI 论文精选

[Summary page \(en\)](https://awesomejev.cc/news/wxv737emy0o7657qwtavt4s9v) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/wxv737emy0o7657qwtavt4s9v) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/wxv737emy0o7657qwtavt4s9v)

[X：DAIR.AI \(@dair\_ai\)](https://x.com/dair_ai/status/2106770888054182374) · [AIHOT](https://aihot.news/items/wxv737emy0o7657qwtavt4s9v)

Source publication: 2026-10-04T15:38:16.000Z

本周顶级 AI 论文（9月28日 - 10月4日）： - JAZ - CASD - Agensh - Jev-Mem - AutoGym - Taste-Bench - Context Language Models 继续阅读了解更多：

## BestBlogs 早报：VS Code 周更、Google 托管智能体与递归语言模型

[Summary page \(en\)](https://awesomejev.cc/news/xseqbyh071p3ve74ogno96fbn) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/xseqbyh071p3ve74ogno96fbn) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/xseqbyh071p3ve74ogno96fbn)

[X：洪明 \(@hongming731\)](https://x.com/hongming731/status/2106534639485714701) · [AIHOT](https://aihot.news/items/xseqbyh071p3ve74ogno96fbn)

Source publication: 2026-10-03T23:59:30.000Z

BestBlogs 早报精讲三篇：VS Code 团队借 AI 从月更转向周更，智能体生成代码存活率从 GPT-4.1 时的 55% 升至 86%，切到 TypeScript Go 后构建速度提升约 10 倍。

## BestBlogs 早报：VS Code 周更与递归语言模型等十则

[Summary page \(en\)](https://awesomejev.cc/news/ea8951um0rh81a5o9w1v64npw) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/ea8951um0rh81a5o9w1v64npw) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/ea8951um0rh81a5o9w1v64npw)

[X：洪明 \(@hongming731\)](https://x.com/hongming731/status/2106534702387773741) · [AIHOT](https://aihot.news/items/ea8951um0rh81a5o9w1v64npw)

Source publication: 2026-10-03T23:59:45.000Z

BestBlogs 早报汇总十则 AI 动态：VS Code 团队将发布节奏从月更改为周更，代码存活率由 55% 升至 86%；Google DeepMind 的 Interactions API 用交互标识保存上下文与思维签名，并以环境标识复用托管智能体沙箱；DatologyAI 将预训练合成数据生成规模扩大到 12 万亿 token。

## Latent Space AINews 汇总 GPT-6.1 Sol 与 Sonnet 5.5 等两日 AI 动态

[Summary page \(en\)](https://awesomejev.cc/news/sp27vk4zx0a1kbb5a43cxbn89) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/sp27vk4zx0a1kbb5a43cxbn89) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/sp27vk4zx0a1kbb5a43cxbn89)

[Latent Space（RSS）](https://www.latent.space/p/ainews-not-much-happened-today-cee) · [AIHOT](https://aihot.news/items/sp27vk4zx0a1kbb5a43cxbn89)

Source publication: 2026-10-03T08:45:15.000Z

Latent Space 发布 10/1-10/2 的 AINews 日报，汇总了 GPT-6.1 Sol 定价 $2/$10 每百万 token、Agent Arena 排名，以及 Sonnet 5.5、Decision Models、Claude Code 插件、多份 RL 与评测研究等动态。

## 亚马逊 Strands Agents 推出 Strands Decider 2B 开源决策模型，支持本地部署

[Summary page \(en\)](https://awesomejev.cc/news/jlcw6a57l3eemfz10bzfm5zjz) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/jlcw6a57l3eemfz10bzfm5zjz) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/jlcw6a57l3eemfz10bzfm5zjz)

[IT之家（RSS）](https://www.ithome.com/1/009/509.htm) · [AIHOT](https://aihot.news/items/jlcw6a57l3eemfz10bzfm5zjz)

Source publication: 2026-10-03T08:50:25.000Z

亚马逊 Strands Agents 团队推出 Strands Decider 2B 决策模型，已在 GitHub 开源、权重上线 Hugging Face，可在本地 CPU / GPU 运行。

## Meta Muse、OpenAI Dots 与 Uber 助手：智能体主动开口后，何时保持沉默

[Summary page \(en\)](https://awesomejev.cc/news/dwisfgfbgkllh4uvsjgqia3uw) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/dwisfgfbgkllh4uvsjgqia3uw) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/dwisfgfbgkllh4uvsjgqia3uw)

[MarkTechPost（RSS）](https://www.marktechpost.com/2026/10/03/meta-openai-and-uber-just-taught-ai-agents-to-talk-first-what-about-when-to-stay-quiet/) · [AIHOT](https://aihot.news/items/dwisfgfbgkllh4uvsjgqia3uw)

Source publication: 2026-10-03T07:05:11.000Z

作者分析 Meta Muse、OpenAI Dots 和 Uber 司机助手的共同点：智能体主动开口，把难点从写什么转移到何时打断、用哪个渠道。

## Cathie Wood 谈 AI 中的杰文斯悖论

[Summary page \(en\)](https://awesomejev.cc/news/ll6ji6hh8emoep9zk3he8xljn) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/ll6ji6hh8emoep9zk3he8xljn) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/ll6ji6hh8emoep9zk3he8xljn)

[X：Rohan Paul \(@rohanpaul\_ai\)](https://x.com/rohanpaul_ai/status/2106230944394821928) · [AIHOT](https://aihot.news/items/ll6ji6hh8emoep9zk3he8xljn)

Source publication: 2026-10-03T03:52:43.000Z

Cathie Wood 解释了杰文斯悖论在 AI 中如何愈演愈烈： 同样的答案每年成本降低 99.99%，而用量却在爆炸式增长。 即便价格暴跌，OpenAI 的年化收入仍在约一年内从 $20B 增至 $70B，超过了 Anthropic 报告的 $65B。更便宜的调用并没有让业务萎缩。用量爆炸了。 她还说，这就是 GDP 爆发式增长的引擎。 ---- 来自 "ARK Invest" YouTube 频道，（链接见评论）

## 决策 AI 模型解读：TypeSafe Jev 对比 Fastino GLiDE、GLiNER2.5-Decide 与开源竞争者

[Summary page \(en\)](https://awesomejev.cc/news/d6dkxfl31arzstmc0ho1qrtzu) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/d6dkxfl31arzstmc0ho1qrtzu) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/d6dkxfl31arzstmc0ho1qrtzu)

[MarkTechPost（RSS）](https://www.marktechpost.com/2026/10/02/decision-ai-models-explained-typesafe-jev-vs-fastino-glide-gliner2-5-decide-and-open-source-competitors/) · [AIHOT](https://aihot.news/items/d6dkxfl31arzstmc0ho1qrtzu)

Source publication: 2026-10-03T03:31:15.000Z

MarkTechPost 解读决策 AI 模型这一新品类：模型返回带概率的类型化决策而非生成文本。Jev 输入 $0.042/百万 token 且输出免费，TypeSafe 自评中 Jev 以 0.4 秒每例的准确率追平 Claude Sonnet 5。

## BestBlogs 早报：GPT-6 选型、LEO 智能体采购与 Airbnb AI 改造

[Summary page \(en\)](https://awesomejev.cc/news/xm8y5t0llcnk9iv6b4gmk89x6) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/xm8y5t0llcnk9iv6b4gmk89x6) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/xm8y5t0llcnk9iv6b4gmk89x6)

[X：洪明 \(@hongming731\)](https://x.com/hongming731/status/2106188031988584669) · [AIHOT](https://aihot.news/items/xm8y5t0llcnk9iv6b4gmk89x6)

Source publication: 2026-10-03T01:02:12.000Z

OpenAI 发布 GPT-6 系列选型指南，按任务区分 Astra（最难推理）、Sol（复杂编码、研究与电脑操作）、Luna（目标明确的重复执行）三档，并建议同时衡量成功率、延迟与每次成功任务成本，提示词缓存输入最高可比非缓存便宜 95%。

## BestBlogs 早报：GPT-6 选型与企业 Agent 部署

[Summary page \(en\)](https://awesomejev.cc/news/wg9mxh2xnpnrybbqviuezcnqj) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/wg9mxh2xnpnrybbqviuezcnqj) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/wg9mxh2xnpnrybbqviuezcnqj)

[X：洪明 \(@hongming731\)](https://x.com/hongming731/status/2106188091325362229) · [AIHOT](https://aihot.news/items/wg9mxh2xnpnrybbqviuezcnqj)

Source publication: 2026-10-03T01:02:26.000Z

BestBlogs 10-03 早报聚焦 GPT-6 系列模型选型指南，OpenAI 实操文档将 GPT-6 Astra、Sol、Luna 的选择落到任务难度、延迟与成本，并给出推理强度、提示词与技能边界调整建议。

## Wagtail 团队复盘使用 GLM 5.3 Flash 进行为期一个月的编程

[Summary page \(en\)](https://awesomejev.cc/news/ao3jf8pnu46lb4v4heud759fo) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/ao3jf8pnu46lb4v4heud759fo) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/ao3jf8pnu46lb4v4heud759fo)

[Hacker News 热门（buzzing.cc 中文翻译）](https://wagtail.org/blog/one-month-on-glm-53-flash/) · [AIHOT](https://aihot.news/items/ao3jf8pnu46lb4v4heud759fo)

Source publication: 2026-10-03T00:55:48.630Z

Wagtail 团队尝试整月只用 GLM 5.3 Flash 编程，最终该模型只消耗 2B tokens 中的一半，能耗约 35 kWh 而非 10。

## ldraw-nova v0.6.0 开源：用 AI 智能体生成 LDraw 乐高模型

[Summary page \(en\)](https://awesomejev.cc/news/vfex0tbyg3pizjgy97jw7dp63) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/vfex0tbyg3pizjgy97jw7dp63) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/vfex0tbyg3pizjgy97jw7dp63)

[Hacker News：AI 热帖](https://github.com/anteloc/ldraw-nova) · [AIHOT](https://aihot.news/items/vfex0tbyg3pizjgy97jw7dp63)

Source publication: 2026-10-02T20:00:15.000Z

作者开源 ldraw-nova v0.6.0，让 AI 智能体根据提示规划并用真实 LDraw 零件生成乐高模型，产出 LDraw 源码、3D/VR 视图和可编辑的 glTF 文件。智能体通过 plan. 和生成 Python 脚本产出模型，绕开了其不擅长的几何数学；项目用 Docker 部署，支持 Meta Quest 3 VR，作者指出目前生成速度慢且只有高端模型能产出大型正确模型。

## Replit 本周更新：聊天内交互图表与新模型选择

[Summary page \(en\)](https://awesomejev.cc/news/g9d7538k6pwrf6adz0uoct21y) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/g9d7538k6pwrf6adz0uoct21y) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/g9d7538k6pwrf6adz0uoct21y)

[X：Replit \(@Replit\)](https://x.com/Replit/status/2106149526746591286) · [AIHOT](https://aihot.news/items/g9d7538k6pwrf6adz0uoct21y)

Source publication: 2026-10-02T22:29:12.000Z

Replit 本周上线聊天内交互图表功能，用户对 Replit Agent 说“let's visualize this”即可在对话中生成可视化。同时新增 GPT-6.1 Sol 和 Claude Sonnet 5.5 两款模型可选，构建时手动选择或保持 auto 模式由 Replit 自动决定。

## OpenRouter 推出 Model Router Benchmarks，可对比 7 款模型路由器

[Summary page \(en\)](https://awesomejev.cc/news/xtqxnhjyb9guloz7igklgv8rd) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/xtqxnhjyb9guloz7igklgv8rd) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/xtqxnhjyb9guloz7igklgv8rd)

[X：OpenRouter \(@OpenRouter\)](https://x.com/OpenRouter/status/2106144438389280848) · [AIHOT](https://aihot.news/items/xtqxnhjyb9guloz7igklgv8rd)

Source publication: 2026-10-02T22:08:59.000Z

OpenRouter 推出 Model Router Benchmarks，可并排比较 7 款路由器在 6 项基准上的质量、速度和成本。页面包含 Jev Router、Unbiased Pareto、NVIDIA Switchyard 等，入口为 https://openrouter.ai/benchmarks/routers。

## OpenRouter 发布三类模型路由器基准测试

[Summary page \(en\)](https://awesomejev.cc/news/s9ul98qq7vwqxi7rdb1m2x5g9) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/s9ul98qq7vwqxi7rdb1m2x5g9) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/s9ul98qq7vwqxi7rdb1m2x5g9)

[X：OpenRouter \(@OpenRouter\)](https://x.com/OpenRouter/status/2106144450598846974) · [AIHOT](https://aihot.news/items/s9ul98qq7vwqxi7rdb1m2x5g9)

Source publication: 2026-10-02T22:09:01.000Z

发布之初，我们对三类模型路由器进行基准测试： - 模型混合：Unbiased Pareto、Sakana Fugu - 模型选择器：Auto Router、Jev Router - 模型切换器：NVIDIA Switchyard 领先的单个模型也纳入作为对比。

## Jev 入门比想象中简单

[Summary page \(en\)](https://awesomejev.cc/news/ssock8csml24jiwmm4do1fryp) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/ssock8csml24jiwmm4do1fryp) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/ssock8csml24jiwmm4do1fryp)

[@typesafeai](https://x.com/typesafeai/status/2106135928918208713) · [AIHOT](https://aihot.news/items/ssock8csml24jiwmm4do1fryp)

Source publication: 2026-10-02T21:35:10.000Z

用上 Jev 了吗？比你想象的简单！

## OpenRouter 推出 Model Router Benchmarks 页面比较各模型路由器表现

[Summary page \(en\)](https://awesomejev.cc/news/quihg7htbkrlfnude11usbki8) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/quihg7htbkrlfnude11usbki8) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/quihg7htbkrlfnude11usbki8)

[OpenRouter：Announcements（RSS）](https://openrouter.ai/blog/announcements/model-router-benchmarks/) · [AIHOT](https://aihot.news/items/quihg7htbkrlfnude11usbki8)

Source publication: 2026-10-02T00:00:00.000Z

OpenRouter 推出 Model Router Benchmarks 页面，用质量、速度、成本三类基准比较 Auto Router、Free Models Router、Unbiased 的 Pareto、Sakana 的 Fugu、Jev Router、NVIDIA 的 Switchyard 等路由器，并以顶尖模型作基线。

## Perplexity 开源多款模型与工具，涵盖决策模型、嵌入、本地推理引擎和研究 Agent 基准

[Summary page \(en\)](https://awesomejev.cc/news/y8444ykcftz6xyt9sikintwck) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/y8444ykcftz6xyt9sikintwck) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/y8444ykcftz6xyt9sikintwck)

[X：Aravind Srinivas（Perplexity CEO） \(@AravSrinivas\)](https://x.com/AravSrinivas/status/2106119404433908149) · [AIHOT](https://aihot.news/items/y8444ykcftz6xyt9sikintwck)

Source publication: 2026-10-02T20:29:30.000Z

Perplexity CEO Aravind Srinivas 汇总近期开源成果：pplx-decider-v1-27b 多模态决策模型在 11 个基准平均 85.7%，pplx-embed-v2-context-9b-preview 在 ConTEB 和 turbopuffer context-bench 领先。

## Cloudflare 发布决策模型 Clef 和 Clef-flash，称智能体决策无需人类介入

[Summary page \(en\)](https://awesomejev.cc/news/buksr9bsnxbhebvm775kga7z8) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/buksr9bsnxbhebvm775kga7z8) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/buksr9bsnxbhebvm775kga7z8)

[The Decoder：AI News（RSS）](https://the-decoder.com/cloudflare-says-its-new-clef-model-means-humans-no-longer-need-to-be-in-the-loop-for-ai-agents/) · [AIHOT](https://aihot.news/items/buksr9bsnxbhebvm775kga7z8)

Source publication: 2026-10-02T18:19:51.000Z

Cloudflare 发布面向 AI 智能体的决策模型 Clef 和 Clef-flash，输出带概率的分类结果，称智能体可据此自主决策并在必要时交给人类。据其自报数据，Clef-flash 中位延迟约 39 毫秒、Clef 约 209 毫秒，均快于竞品 Jev 的 524 毫秒以上。

## Jev 结合 PageIndex 实现长文档搜索

[Summary page \(en\)](https://awesomejev.cc/news/mb26uw50pn1n1f3xxi97iwwo9) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/mb26uw50pn1n1f3xxi97iwwo9) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/mb26uw50pn1n1f3xxi97iwwo9)

[@typesafeai](https://x.com/typesafeai/status/2106071115915550786) · [AIHOT](https://aihot.news/items/mb26uw50pn1n1f3xxi97iwwo9)

Source publication: 2026-10-02T17:17:37.000Z

Jev 能像你一样🔍搜索长文档！🕵️

## JevSpawn：通过组合式动作空间实现自适应智能体推理

[Summary page \(en\)](https://awesomejev.cc/news/nsgsppuhdxji84da9rpmiqv01) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/nsgsppuhdxji84da9rpmiqv01) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/nsgsppuhdxji84da9rpmiqv01)

[HuggingFace Daily Papers（社区热门论文）](https://arxiv.org/abs/2610.00437) · [AIHOT](https://aihot.news/items/nsgsppuhdxji84da9rpmiqv01)

Source publication: 2026-09-30T00:00:00.000Z

JevSpawn 是一种组合式策略，将自然语言任务描述与有限域概率探索连接起来，通过并行动作生成配合反馈驱动的分支选择、表示修正与备选方案恢复，在无需额外训练的情况下减少重复生成和上下文计算。在八项基准任务上对比七种智能体基线和一种 TypeSafe Jev 变体，JevSpawn 任务表现更优、导航更快。

## Pi 1.0 与 Pi Durable 发布，Latent Space 同时汇总 Gemini 4 Argon、GPT-6.1 Sol 等动态

[Summary page \(en\)](https://awesomejev.cc/news/n29mugxykl7a9rqouv0hij217) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/n29mugxykl7a9rqouv0hij217) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/n29mugxykl7a9rqouv0hij217)

[Latent Space（RSS）](https://www.latent.space/p/ainews-pi-10-pi-durable-and-aie-nyc) · [AIHOT](https://aihot.news/items/n29mugxykl7a9rqouv0hij217)

Source publication: 2026-10-02T06:40:53.000Z

Latent Space 报道 Earendil 的 Pi 1.0 与 Pi Durable 同日登上 HN 首页：Pi 1.0 新增 MCP 原生支持、扩展机制。

## AWS Strands Labs 发布开源决策模型 Strands Decider 2B，中位延迟约 115 ms

[Summary page \(en\)](https://awesomejev.cc/news/ci1av3or7imwd2u2w2u7z2dcp) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/ci1av3or7imwd2u2w2u7z2dcp) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/ci1av3or7imwd2u2w2u7z2dcp)

[MarkTechPost（RSS）](https://www.marktechpost.com/2026/10/01/aws-strands-labs-releases-strands-decider-2b/) · [AIHOT](https://aihot.news/items/ci1av3or7imwd2u2w2u7z2dcp)

Source publication: 2026-10-02T06:35:00.000Z

AWS Strands Labs 开源决策模型 Strands Decider 2B（1.9B 参数），不生成文本，只在选项、yes/no 概率或量表评分中给出带置信度的答案。

## Cloudflare 推出基于 Qwen 的开源多模态决策模型 Clef

[Summary page \(en\)](https://awesomejev.cc/news/hecloufmmayhnvll62l69d6h4) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/hecloufmmayhnvll62l69d6h4) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/hecloufmmayhnvll62l69d6h4)

[IT之家（RSS）](https://www.ithome.com/1/009/262.htm) · [AIHOT](https://aihot.news/items/hecloufmmayhnvll62l69d6h4)

Source publication: 2026-10-02T04:45:28.000Z

Cloudflare 于 10 月 1 日发布基于 Qwen 的开源多模态决策模型 Clef，包含 Clef 与 Clef-flash 两款，分别基于 Qwen3.8-27B 和 Qwen3.5-9B。

## Cloudflare 发布开源权重决策模型 Clef 与 Clef-flash，输出类型化概率而非文本

[Summary page \(en\)](https://awesomejev.cc/news/t1ixwnkwkt64gce0yabfu6kps) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/t1ixwnkwkt64gce0yabfu6kps) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/t1ixwnkwkt64gce0yabfu6kps)

[MarkTechPost（RSS）](https://www.marktechpost.com/2026/10/01/cloudflare-releases-clef-and-clef-flash/) · [AIHOT](https://aihot.news/items/t1ixwnkwkt64gce0yabfu6kps)

Source publication: 2026-10-02T01:00:41.000Z

Cloudflare Workers AI 团队发布首批自训模型 Clef（27B，基于 Qwen3.8-27B）和 Clef-flash（9B，基于 Qwen3.5-9B），二者为决策模型，针对类型化问题返回各选项概率而非自由文本，以 Apache 2.0 开源并兼容 TypeSafe AI 的 Jev System One API。

## Jev 语义 VAD 用于实时语音 AI

[Summary page \(en\)](https://awesomejev.cc/news/dxqwoencgcj9we267cjiy7gok) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/dxqwoencgcj9we267cjiy7gok) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/dxqwoencgcj9we267cjiy7gok)

[@typesafeai](https://x.com/typesafeai/status/2105809232738283853) · [AIHOT](https://aihot.news/items/dxqwoencgcj9we267cjiy7gok)

Source publication: 2026-10-01T23:56:59.000Z

🗣️ 有没有觉得 AI 机器人根本没在听？🗣️ 它们只是还没有一个小小的 Jev 来帮忙！ （引用推文核心要点：作者探索了 Jev 的一个用例——用于实时语音 AI 的语义 VAD。将其接入 @AgoraIO ConvoAI，利用实时转录和近期对话作为上下文，判断用户是否真的说完了。这让 Jev 在处理犹豫、未完成的思路，以及那些你停顿一下还在想接下来要说什么的时刻时表现出色。这是 Jev 在实时 AI 循环中很好契合的一个例子。）

## 6G Open RAN 意图解读时延对比：Jev-1.13.0 决策模型与 LLM 在 RANIntent v1 上的评测

[Summary page \(en\)](https://awesomejev.cc/news/bhcdhu6511003l60hnkb7iou8) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/bhcdhu6511003l60hnkb7iou8) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/bhcdhu6511003l60hnkb7iou8)

[HuggingFace Daily Papers（社区热门论文）](https://arxiv.org/abs/2609.23136) · [AIHOT](https://aihot.news/items/bhcdhu6511003l60hnkb7iou8)

Source publication: 2026-10-02T00:00:00.000Z

在 RANIntent v1 基准、ns-3 闭环仿真及真实 A1/E2 路径上，Jev-1.13.0 等决策模型与 LLM 被对比解读意图的时延与无线性能。Jev-1.13.0 在 99.8% 的调用中满足 1 s 近实时预算，而两个托管 LLM 仅分别为 17.9% 和 0%；中位解读耗时 0.286 至 2.35 s，A1 与 E2 传输则低于 25 ms。

## Earendil 发布 Pi 1.0 稳定版及实验性包 Pi Durable

[Summary page \(en\)](https://awesomejev.cc/news/jqh01tpk9gz8m6vfej4v363gv) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/jqh01tpk9gz8m6vfej4v363gv) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/jqh01tpk9gz8m6vfej4v363gv)

[Hacker News 热门（buzzing.cc 中文翻译）](https://earendil.com/posts/pi-1-0/) · [AIHOT](https://aihot.news/items/jqh01tpk9gz8m6vfej4v363gv)

Source publication: 2026-10-01T20:07:24.622Z

Earendil 发布 Pi 1.0，一个稳定、极简、可扩展的智能体编码框架，每周有数十万人使用。1.0 新增 Codemode（原生支持 MCP 及 Jev、图像模型等非 LLM 模型）、虚拟模型扩展支持、延迟工具加载、Anthropic 模型缓存预热、会话中途系统消息、新 TUI 主题和默认全屏模式。

## Jev 重排序模型提升搜索匹配率

[Summary page \(en\)](https://awesomejev.cc/news/c1svybwl2956ap2ekjm5vjpam) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/c1svybwl2956ap2ekjm5vjpam) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/c1svybwl2956ap2ekjm5vjpam)

[@typesafeai](https://x.com/typesafeai/status/2105741653701242938) · [AIHOT](https://aihot.news/items/c1svybwl2956ap2ekjm5vjpam)

Source publication: 2026-10-01T19:28:27.000Z

Jev 是一款出色的重排序模型，你没听错。

## Jev 大幅提升研究智能体性能

[Summary page \(en\)](https://awesomejev.cc/news/y9pw0j2qxta0tbn3abu7g79w1) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/y9pw0j2qxta0tbn3abu7g79w1) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/y9pw0j2qxta0tbn3abu7g79w1)

[@typesafeai](https://x.com/typesafeai/status/2105733977147617750) · [AIHOT](https://aihot.news/items/y9pw0j2qxta0tbn3abu7g79w1)

Source publication: 2026-10-01T18:57:57.000Z

Jev 对研究智能体来说是一个巨大的增强！ @edwardirby 构建了一个 @youdotcom 智能体来监控商业风险，并将 Jev 与普通的 LLM 评判器进行了对比。 • 报告质量相同 • 但 LLM 反复无常：对同一威胁的评分从 0.35 -&gt; 0.68 -&gt; 0.50 • LLM 漏掉了 11 项调查中的 5 项。Jev 一项都没漏。 • Jev 便宜 250 倍，快 3-6 倍 详细文章 👇

## DSPy Jev 用例与讲解合集

[Summary page \(en\)](https://awesomejev.cc/news/yhq0ps172icdchqufk33lwmsg) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/yhq0ps172icdchqufk33lwmsg) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/yhq0ps172icdchqufk33lwmsg)

[@typesafeai](https://x.com/typesafeai/status/2105735351570755814) · [AIHOT](https://aihot.news/items/yhq0ps172icdchqufk33lwmsg)

Source publication: 2026-10-01T19:03:25.000Z

这段来自 @DSPyOSS 的 office hours 录像是一座金矿，里面有大量优秀的 Jev 用例和讲解！

## Perplexity 开源多模态决策模型 pplx-decider-v1-27b 并推出 Decisions API

[Summary page \(en\)](https://awesomejev.cc/news/smgs03cbw68rel1fb7sxi6pkn) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/smgs03cbw68rel1fb7sxi6pkn) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/smgs03cbw68rel1fb7sxi6pkn)

[X：Aravind Srinivas（Perplexity CEO） \(@AravSrinivas\)](https://x.com/AravSrinivas/status/2105726953554927677) · [AIHOT](https://aihot.news/items/smgs03cbw68rel1fb7sxi6pkn)

Source publication: 2026-10-01T18:30:02.000Z

Perplexity CEO Aravind Srinivas 宣布开源其多模态决策模型 pplx-decider-v1-27b，并通过 Decisions API 提供。该模型输出固定答案集上的概率分布而非文本，价格为 $0.04/million input tokens，基准总分 85.71%，在 7,210 行评测面板上高于 Jev 的 84.51% 且价格仅为几分之一。

## Cloudflare 发布开源决策模型 Clef 与 Clef-flash，并推出 RL 微调服务

[Summary page \(en\)](https://awesomejev.cc/news/wx18gjj92zgt5rt0rtj1wy5cc) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/wx18gjj92zgt5rt0rtj1wy5cc) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/wx18gjj92zgt5rt0rtj1wy5cc)

[Hacker News 热门（buzzing.cc 中文翻译）](https://blog.cloudflare.com/clef-decision-models/) · [AIHOT](https://aihot.news/items/wx18gjj92zgt5rt0rtj1wy5cc)

Source publication: 2026-10-01T17:31:03.157Z

Cloudflare 发布两款决策模型 Clef 和 Clef-flash，托管在 Workers AI 上，并以 Apache 2.0 许可证在 Hugging Face 完全开源。

## LangChain 讲解如何在 Agent Harness 中构建模型路由器

[Summary page \(en\)](https://awesomejev.cc/news/t6jf7f9e5zbw4sxftwim9wgk7) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/t6jf7f9e5zbw4sxftwim9wgk7) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/t6jf7f9e5zbw4sxftwim9wgk7)

[LangChain：Blog（RSS）](https://www.langchain.com/blog/how-to-build-a-model-router-in-the-harness) · [AIHOT](https://aihot.news/items/t6jf7f9e5zbw4sxftwim9wgk7)

Source publication: 2026-10-01T17:01:32.000Z

LangChain 在其开源编码 Agent Open SWE 中构建模型路由器，在 973 个线程的 A/B 测试中，中位成本从 $2.61 降到 $0.94（降 64%），PR 合并率 29.2% 对 27.3%，质量无可测变化。

## Amazon 开源决策模型 Strands Decider 2B，灵感来自 TypeSafe 的 Jev

[Summary page \(en\)](https://awesomejev.cc/news/w3kh8rtzn3fi26wgpvsem9jn7) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/w3kh8rtzn3fi26wgpvsem9jn7) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/w3kh8rtzn3fi26wgpvsem9jn7)

[TechCrunch：AI（RSS）](https://techcrunch.com/2026/10/01/amazon-releases-its-own-jev-clone-as-decision-models-flood-the-web/) · [AIHOT](https://aihot.news/items/w3kh8rtzn3fi26wgpvsem9jn7)

Source publication: 2026-10-01T16:49:22.000Z

AWS 开源高速低成本决策模型 Strands Decider 2B，可在预设选项间排序并输出置信度，完全开源且可本地运行。

## 在 PostgreSQL 中实现亚秒级语义过滤：AlloyDB 集成超快 Jev 模型

[Summary page \(en\)](https://awesomejev.cc/news/qc3k7t07l5r5hhqpdu8atdniv) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/qc3k7t07l5r5hhqpdu8atdniv) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/qc3k7t07l5r5hhqpdu8atdniv)

[Google AI：DEV 作者专属（RSS）](https://dev.to/googleai/sub-second-semantic-filtering-in-postgresql-integrating-the-ultra-fast-jev-model-with-alloydb-m8k) · [AIHOT](https://aihot.news/items/qc3k7t07l5r5hhqpdu8atdniv)

Source publication: 2026-09-29T17:00:53.000Z

AlloyDB for PostgreSQL 通过模型端点管理接入 TypeSafe AI 的 Jev 模型，可在数据库内直接执行布尔判断与多分类等语义评估，无需预先准备嵌入向量。Jev 面向毫秒级结构化输出优化，配合 ai.if 和 ai.analyze\_sentiment 等原生函数，在 3 万条商品数据的电商数据集上实现高吞吐语义查询。

## Jev 决策导向模型推荐重排序实证研究：与 Qwen 重排序器的质量-延迟权衡对比

[Summary page \(en\)](https://awesomejev.cc/news/e35nbut09oibxnr7lcfhdefv8) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/e35nbut09oibxnr7lcfhdefv8) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/e35nbut09oibxnr7lcfhdefv8)

[HuggingFace Daily Papers（社区热门论文）](https://arxiv.org/abs/2609.40241) · [AIHOT](https://aihot.news/items/e35nbut09oibxnr7lcfhdefv8)

Source publication: 2026-09-30T00:00:00.000Z

一项受控实证研究对比了 TypeSafe AI 称为"System One Model"的 Jev 与推荐专用模型及 pointwise、listwise Qwen 重排序器在多个 Amazon Reviews 领域和候选集规模下的推荐重排序表现。结果显示 Jev 在保持较强推荐效果的同时，延迟增长比 pointwise Qwen 重排序器更为平缓，但服务延迟仍显著高于推荐专用模型。

## JEV 等直接决策模型存在序数尺度利用偏差，BA-LoRA 后训练可将利用率从约 47% 提升至 86%

[Summary page \(en\)](https://awesomejev.cc/news/r3hcndpnyfh6rf00flkfb52ex) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/r3hcndpnyfh6rf00flkfb52ex) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/r3hcndpnyfh6rf00flkfb52ex)

[HuggingFace Daily Papers（社区热门论文）](https://arxiv.org/abs/2609.38827) · [AIHOT](https://aihot.news/items/r3hcndpnyfh6rf00flkfb52ex)

Source publication: 2026-09-30T00:00:00.000Z

研究分析 JEV 1.13 与三个开源 KEV 模型，发现直接决策模型存在"序数尺度利用偏差"：在 ANLI 上 JEV 准确率 74.95%，却把 38.8% 的预测和 51.3% 的错误都归为 Neutral。

## OpenClaw 播客第12期谈决策模型与智能体

[Summary page \(en\)](https://awesomejev.cc/news/ytx2eh7sl54lo6owh2pvjnvpt) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/ytx2eh7sl54lo6owh2pvjnvpt) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/ytx2eh7sl54lo6owh2pvjnvpt)

[X：OpenClaw \(@openclaw\)](https://x.com/openclaw/status/2105475400797413578) · [AIHOT](https://aihot.news/items/ytx2eh7sl54lo6owh2pvjnvpt)

Source publication: 2026-10-01T01:50:28.000Z

Jev &amp; OpenClaw Enterprise @hrudolph 和 @Pat\_Erichsen 与来自 @typesafeai 的 @allietheicon 以及 @jlehman\_ 讨论决策模型。来自 @OpenAI 的 @kevins8 稍后加入，讨论工作中的智能体。 观看或收听 The ClawCast 第 12 期： https://openclaw.ai/podcast/episode-12

## 研究揭示 Jev 式类型化决策模型主要依赖标签而非定义

[Summary page \(en\)](https://awesomejev.cc/news/t9u0xjc7crcjbnlw28wy99sqd) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/t9u0xjc7crcjbnlw28wy99sqd) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/t9u0xjc7crcjbnlw28wy99sqd)

[HuggingFace Daily Papers（社区热门论文）](https://arxiv.org/abs/2610.02586) · [AIHOT](https://aihot.news/items/t9u0xjc7crcjbnlw28wy99sqd)

Source publication: 2026-10-01T00:00:00.000Z

一项研究考察四个开源权重类型化决策模型，发现模型概率大多跟随选项标签而非定义：删除全部定义后 laya-td 准确率仍为 0.8559 对 0.8487，而将选项改名为 A 和 B 反而提升准确率 +0.1511。

## Latent Space 在 OpenAI DevDay 专访 Ari Weinstein 与 Nikunj Handa，谈 Computer Use 进展与 Decisions API 由来

[Summary page \(en\)](https://awesomejev.cc/news/do7k6m2naho7vii0d5mlirn2b) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/do7k6m2naho7vii0d5mlirn2b) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/do7k6m2naho7vii0d5mlirn2b)

[Latent Space（RSS）](https://www.latent.space/p/devday-2026) · [AIHOT](https://aihot.news/items/do7k6m2naho7vii0d5mlirn2b)

Source publication: 2026-09-30T22:23:40.000Z

Latent Space 在 OpenAI DevDay 发布两段专访：Computer Use 负责人 Ari Weinstein 称 Computer Use 已比几个月前"180 度不同"。

## Databricks 发布 AI Function ai\_decide，在治理数据上快速做出结构化决策

[Summary page \(en\)](https://awesomejev.cc/news/blfxgizov33uqqfl9irmbkok9) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/blfxgizov33uqqfl9irmbkok9) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/blfxgizov33uqqfl9irmbkok9)

[Databricks：Blog（RSS）](https://www.databricks.com/blog/introducing-aidecide-make-fast-decisions-your-governed-data) · [AIHOT](https://aihot.news/items/blfxgizov33uqqfl9irmbkok9)

Source publication: 2026-09-30T16:59:34.000Z

Databricks 推出新的 AI Function ai\_decide（Beta），由 TypeSafe AI 的 Jev 决策模型驱动，对文本评估一个或多个问题，在几分之一秒内返回概率、命名标准中的选项或有序量表评分，延迟和成本低于 LLM。

## Inception 的 Mercury Decide 决策模型上线 OpenRouter，免费早期访问

[Summary page \(en\)](https://awesomejev.cc/news/kjf2un3kf7i90rvutuj8b3065) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/kjf2un3kf7i90rvutuj8b3065) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/kjf2un3kf7i90rvutuj8b3065)

[X：OpenRouter \(@OpenRouter\)](https://x.com/OpenRouter/status/2105374270243426760) · [AIHOT](https://aihot.news/items/kjf2un3kf7i90rvutuj8b3065)

Source publication: 2026-09-30T19:08:36.000Z

Inception 的 Mercury Decide 模型已在 OpenRouter 上线，提供免费早期访问。它是决策模型，接收应用状态和类型化问题，返回附带概率的类型化答案；Inception 称其在 JevBench v1.4 上是 OpenRouter 上最智能的决策模型。地址：https://openrouter.ai/inception/mercury-decide:free

## OpenAI 推出 Decisions API，对标 TypeSafe AI 的 Jev 决策模型

[Summary page \(en\)](https://awesomejev.cc/news/rsfw3qx0oz8ikdgdviwmeyoxp) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/rsfw3qx0oz8ikdgdviwmeyoxp) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/rsfw3qx0oz8ikdgdviwmeyoxp)

[TechCrunch：AI（RSS）](https://techcrunch.com/2026/09/30/openais-jev-clone-could-help-the-frontier-lab-stop-its-swarming-agents/) · [AIHOT](https://aihot.news/items/rsfw3qx0oz8ikdgdviwmeyoxp)

Source publication: 2026-09-30T19:00:57.000Z

OpenAI 在 Dev Day 上发布 Decisions API，可为 Luna 模型预设选项并输出概率，功能类似 TypeSafe AI 本月初推出的软件自动化模型 Jev。该 API 目前为限量预览，Altman 称聚焦单一选择可让模型在保持图像理解、多语言与安全能力的同时极快运行。开发者已用 Jev 监控 AI 智能体行为，单次监控成本 2.94 美元，而前沿 LLM 需 372 美元。

## OpenClaw Enterprise 推出 ClawCast 第12期

[Summary page \(en\)](https://awesomejev.cc/news/ipj744kb2bbev4v7nrkw8lclm) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/ipj744kb2bbev4v7nrkw8lclm) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/ipj744kb2bbev4v7nrkw8lclm)

[X：OpenClaw \(@openclaw\)](https://x.com/openclaw/status/2105364577731182750) · [AIHOT](https://aihot.news/items/ipj744kb2bbev4v7nrkw8lclm)

Source publication: 2026-09-30T18:30:05.000Z

The ClawCast — Jev &amp; OpenClaw Enterprise（第12期）https://x.com/i/broadcasts/1mxPaZewLAmKN

## Jev 重排序销售数据性能提升

[Summary page \(en\)](https://awesomejev.cc/news/x9ex8yeuhpvrqlufpgvjmveej) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/x9ex8yeuhpvrqlufpgvjmveej) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/x9ex8yeuhpvrqlufpgvjmveej)

[@typesafeai](https://x.com/typesafeai/status/2105356405998063911) · [AIHOT](https://aihot.news/items/x9ex8yeuhpvrqlufpgvjmveej)

Source publication: 2026-09-30T17:57:37.000Z

给后排的朋友们： • 用 Jev 对销售数据做生产级重排序 • 快 20 倍 • 便宜 10 倍 • 准确率提升 12% 你们懂了吗？

## OpenClaw 播客聊 Jev 与企业版

[Summary page \(en\)](https://awesomejev.cc/news/mwjpf3tb5hxgs7xgjd9ec80jq) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/mwjpf3tb5hxgs7xgjd9ec80jq) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/mwjpf3tb5hxgs7xgjd9ec80jq)

[X：OpenClaw \(@openclaw\)](https://x.com/openclaw/status/2105349910136799335) · [AIHOT](https://aihot.news/items/mwjpf3tb5hxgs7xgjd9ec80jq)

Source publication: 2026-09-30T17:31:48.000Z

今天的 Clawcast 我们和 @allietheicon 聊 Jev 的一切，和 @kevins8 &amp;amp; @jlehman\_ 聊 OpenClaw Enterprise 我们将在多个平台同步直播，点击这里在你选择的平台加入我们：https://openclaw.ai/podcast/episode-12

## Pi.dev 官方复盘：为何把曾公开拒绝的 MCP 纳入核心

[Summary page \(en\)](https://awesomejev.cc/news/z9lxb2hubagac2ibm7i26at6j) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/z9lxb2hubagac2ibm7i26at6j) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/z9lxb2hubagac2ibm7i26at6j)

[Hacker News 热门（buzzing.cc 中文翻译）](https://earendil.com/posts/you-said-no-mcp/) · [AIHOT](https://aihot.news/items/z9lxb2hubagac2ibm7i26at6j)

Source publication: 2026-09-30T11:24:17.398Z

Earendil 团队发文解释 Pi 此前曾公开声明不支持 MCP，如今却将其纳入核心功能。原因一是 MCP 本身一年间已有改进，二是为支持延迟工具加载等新模型能力所需的工具元数据改动本身通用，还能让 Jev 更容易在 Pi 中使用。

## Jev 心里想"我不知道"却不说出口：Sys1Cal-v1 概率校准数据集发布

[Summary page \(en\)](https://awesomejev.cc/news/pfbo0wtwfjx63fuwikw8q6b6v) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/pfbo0wtwfjx63fuwikw8q6b6v) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/pfbo0wtwfjx63fuwikw8q6b6v)

[HuggingFace Daily Papers（社区热门论文）](https://arxiv.org/abs/2609.35342) · [AIHOT](https://aihot.news/items/pfbo0wtwfjx63fuwikw8q6b6v)

Source publication: 2026-09-28T00:00:00.000Z

针对 System One 模型 Jev 的概率校准承诺缺乏公开测试的问题，研究者发布 Sys1Cal-v1 数据集，用已知精确概率 P\(A\) 的真/假命题，通过 Noul、Choice、Score 三个原语查询并以全变差距离评估。

## OpenAI DevDay 2026 发布 dots 智能体与 GPT-6.1 Sol，ChatGPT 周活达 12 亿

[Summary page \(en\)](https://awesomejev.cc/news/b1z2bgkg2nggn8j8969j42r3v) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/b1z2bgkg2nggn8j8969j42r3v) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/b1z2bgkg2nggn8j8969j42r3v)

[Latent Space（RSS）](https://www.latent.space/p/ainews-openai-devday-2026-dots-61) · [AIHOT](https://aihot.news/items/b1z2bgkg2nggn8j8969j42r3v)

Source publication: 2026-09-30T05:53:10.000Z

OpenAI 在 DevDay 2026 发布常驻智能体 dots（由 GPT-6 Astra 驱动，连接 4000+ 应用）、GPT-6.1 Sol（定价 $2/$10 每百万 token。

## Chinese-Jev：将 System One 模型引入中文任务

[Summary page \(en\)](https://awesomejev.cc/news/filfkf59gnd0qas2h386bf4tm) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/filfkf59gnd0qas2h386bf4tm) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/filfkf59gnd0qas2h386bf4tm)

[HuggingFace Daily Papers（社区热门论文）](https://arxiv.org/abs/2609.36965) · [AIHOT](https://aihot.news/items/filfkf59gnd0qas2h386bf4tm)

Source publication: 2026-09-29T00:00:00.000Z

研究者推出 Chinese-Jev，将 Jev 这类 System One 模型扩展到中文决策任务，并发布评测基准 CJ-Bench。

## OpenAI DevDay 2026、Manus 2.0 与 Claude Sonnet 5.5 发布

[Summary page \(en\)](https://awesomejev.cc/news/s8c4avy3el5n2hb52o8z87tvt) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/s8c4avy3el5n2hb52o8z87tvt) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/s8c4avy3el5n2hb52o8z87tvt)

[X：洪明 \(@hongming731\)](https://x.com/hongming731/status/2105091066156536126) · [AIHOT](https://aihot.news/items/s8c4avy3el5n2hb52o8z87tvt)

Source publication: 2026-09-30T00:23:15.000Z

OpenAI DevDay 2026 发布常驻智能体 Dots、协作空间 ChatGPT Space、基于 GPT-6 Luna 的 Decisions API 及 Codex 云端环境。

## Liquid AI 发布决策模型 d1：零输出 token 返回校准概率

[Summary page \(en\)](https://awesomejev.cc/news/u78k2wjhfgffqy7g206rz5vq9) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/u78k2wjhfgffqy7g206rz5vq9) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/u78k2wjhfgffqy7g206rz5vq9)

[MarkTechPost（RSS）](https://www.marktechpost.com/2026/09/29/liquid-ai-releases-d1-a-decision-model-that-returns-calibrated-probabilities-with-zero-output-tokens/) · [AIHOT](https://aihot.news/items/u78k2wjhfgffqy7g206rz5vq9)

Source publication: 2026-09-29T21:47:09.000Z

Liquid AI 发布决策模型 d1，专为结构化选择设计，通过 Noul、Choice、Score 三种原语一次调用返回类型化答案和校准概率，output\_tokens 为 0。

## OpenAI 推出 Decisions API，150 毫秒内返回低延迟分类与路由决策

[Summary page \(en\)](https://awesomejev.cc/news/r27trg0y98xon29qoy450q2xp) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/r27trg0y98xon29qoy450q2xp) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/r27trg0y98xon29qoy450q2xp)

[IT之家（RSS）](https://www.ithome.com/1/008/531.htm) · [AIHOT](https://aihot.news/items/r27trg0y98xon29qoy450q2xp)

Source publication: 2026-09-29T18:35:38.000Z

OpenAI 在 2026 开发者日活动中推出面向实时、低延迟分类与路由场景的 Decisions API，基于小型模型 Luna，约 150 毫秒内返回结果，比通过常规 API 使用 Luna 快约 10 倍。

## Dex Horthy 回应基准测试调侃

[Summary page \(en\)](https://awesomejev.cc/news/awdsg1s0u5lw1wz5sxf0pysyn) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/awdsg1s0u5lw1wz5sxf0pysyn) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/awdsg1s0u5lw1wz5sxf0pysyn)

[X：Dex Horthy（HumanLayer）\(@dexhorthy\)](https://x.com/dexhorthy/status/2104989793587458376) · [AIHOT](https://aihot.news/items/awdsg1s0u5lw1wz5sxf0pysyn)

Source publication: 2026-09-29T17:40:50.000Z

兄弟以为我就是一堆 benchmark 堆出来的 哈哈

## Every 实测 OpenAI DevDay 2026：20 多项发布与上手体验

[Summary page \(en\)](https://awesomejev.cc/news/ygpfzpxndpanyy7k5lmdvsq8q) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/ygpfzpxndpanyy7k5lmdvsq8q) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/ygpfzpxndpanyy7k5lmdvsq8q)

[Every：最新文章（网页）](https://every.to/vibe-check/vibe-check-openai-devday-2026) · [AIHOT](https://aihot.news/items/ygpfzpxndpanyy7k5lmdvsq8q)

Source publication: 2026-09-29T00:00:00.000Z

Every 评测 OpenAI DevDay 2026 发布的 20 多项产品和功能。作者实测后认为 Dots 持久智能体已改变其使用习惯但 bug 较多，Space 办公套件体验较好；Decisions API 在部分测试中以 76/78 对 73/78 的准确率和 230 毫秒对 500 毫秒的响应速度优于 Jev，但另一些测试落后，定价未公布。

## OpenAI 在 DevDay 2026 扩展 Codex 与 API，推出 Decisions API 和 Ultrafast 高速档

[Summary page \(en\)](https://awesomejev.cc/news/e87ab33yq7kxillai9e3kcfpw) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/e87ab33yq7kxillai9e3kcfpw) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/e87ab33yq7kxillai9e3kcfpw)

[The Decoder：AI News（RSS）](https://the-decoder.com/openai-expands-codex-and-its-api-at-devday-with-security-scans-a-decisions-api-and-ultrafast/) · [AIHOT](https://aihot.news/items/e87ab33yq7kxillai9e3kcfpw)

Source publication: 2026-09-29T17:14:41.000Z

OpenAI 在旧金山 DevDay 2026 上宣布多项开发者产品更新。Codex 新增可复用云环境、语音控制和代码审查视图，Codex Security Cloud 可按需或定时扫描 GitHub 仓库漏洞。

## Jev 招募数据人才提升可靠性

[Summary page \(en\)](https://awesomejev.cc/news/we4jce319iny3w4cbvrz6lmtz) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/we4jce319iny3w4cbvrz6lmtz) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/we4jce319iny3w4cbvrz6lmtz)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2104953831067115644) · [AIHOT](https://aihot.news/items/we4jce319iny3w4cbvrz6lmtz)

Source publication: 2026-09-29T15:17:56.000Z

加入我们！让 jev 更可靠！🤘

## Jeeves：基于 Qwen3.5-9B 的推理型 Jev 式决策模型，开源权重与训练代码

[Summary page \(en\)](https://awesomejev.cc/news/wfwvct2ktujzouxctzcjsi195) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/wfwvct2ktujzouxctzcjsi195) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/wfwvct2ktujzouxctzcjsi195)

[Hacker News 热门（buzzing.cc 中文翻译）](https://github.com/PostHog/jeeves) · [AIHOT](https://aihot.news/items/wfwvct2ktujzouxctzcjsi195)

Source publication: 2026-09-29T14:10:13.139Z

PostHog 发布 Jeeves，一个基于 Qwen3.5-9B（LoRA + pointer head）的推理型 Jev 式分类器，采用 SFT 与 CISPO 训练，并配备 block-4 扩散草稿器。

## 从 Bag-of-Words 到 Jev：Sebastian Raschka 解读语言模型文本分类与 Jev 热潮

[Summary page \(en\)](https://awesomejev.cc/news/jzoqeqrxi6h81opcvei6el6kv) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/jzoqeqrxi6h81opcvei6el6kv) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/jzoqeqrxi6h81opcvei6el6kv)

[Ahead of AI（RSS）](https://magazine.sebastianraschka.com/p/classifier-history-and-jev) · [AIHOT](https://aihot.news/items/jzoqeqrxi6h81opcvei6el6kv)

Source publication: 2026-09-29T10:50:25.000Z

Sebastian Raschka 长文梳理从 bag-of-words、RNN、CNN 到 BERT/GPT 的文本分类技术史，解读 TypeSafe AI 新发布的 Jev 为何走红。

## Jev-LDE 让 LLM 少样本示例一次编辑到位

[Summary page \(en\)](https://awesomejev.cc/news/sl7fcwao68xpe5h0r02zyhy8p) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/sl7fcwao68xpe5h0r02zyhy8p) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/sl7fcwao68xpe5h0r02zyhy8p)

[X：马东锡 NLP \(@dongxi\_nlp\)](https://x.com/dongxi_nlp/status/2104802445150839013) · [AIHOT](https://aihot.news/items/sl7fcwao68xpe5h0r02zyhy8p)

Source publication: 2026-09-29T05:16:22.000Z

You Only Edit Once： 通过局部示例精修激发 LLM 的上下文能力 挑选最佳少样本示例是一种缓慢的 System-2 搜索：组合爆炸，且往往需要反复调用 LLM。 我们把它变成了 System 1。⚡ Jev-LDE，一个 1.7B 的编辑器，扫一眼检索到的示例，只做一次编辑。LLM 只回答一次。 平均 1-shot 准确率 81.2 → 88.1 You Only Edit Once 🧵 动画演示（示意示例）。查询：“How far is it from Denver to Aspen?” 语义 TopK 检索出三个相似示例：“Where is Aspen, Colorado?”（Location）、“What state is Denver in?”（Location）、“Who founded Denver?”（Person）。Jev-LDE，一个 1.7B 的 System-1 编辑器，标记出第一个虽然主题相同但答案类型错误，并输出一个动作：将 S1 替换为候选 C1，“How far is Boston from NYC?”（Number）。冻结的目标 LLM 随后回答“Number”，这是正确的；若不编辑，它会回答“Location”。结尾卡片：在 3 个基准和 4 个目标 LLM 上，平均 1-shot 准确率从 81.2 提升至 88.1，在 48 个设置中有 44 个达到最佳或并列最佳，墙钟时间增加 11%。

## Claude Opus 5.5 擅长解说视频，SimpleBench 得分 88.4%

[Summary page \(en\)](https://awesomejev.cc/news/apvgfhosqmg51wedkf7bmrguv) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/apvgfhosqmg51wedkf7bmrguv) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/apvgfhosqmg51wedkf7bmrguv)

[Latent Space（RSS）](https://www.latent.space/p/ainews-opus-55-is-good-at-explainer) · [AIHOT](https://aihot.news/items/apvgfhosqmg51wedkf7bmrguv)

Source publication: 2026-09-29T02:44:29.000Z

Claude Opus 5.5 本周发布后在解说视频生成上刷屏，并以 88.4% 领跑 SimpleBench。它在视觉评测中被评为 Anthropic 迄今最强视觉模型，成本比 Fable 5.1 低约 60%；在 Terminal-Bench-Science 上推理强度从 low 的 24% 升至 xhigh 的 62%，但 max 档会强制最低推理预算并回落至 59%。

## Jev 1.13 红队测试曝安全漏洞

[Summary page \(en\)](https://awesomejev.cc/news/t1xquzbkxjspzr5kbc4ffn4ya) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/t1xquzbkxjspzr5kbc4ffn4ya) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/t1xquzbkxjspzr5kbc4ffn4ya)

[@typesafeai](https://x.com/typesafeai/status/2104768408890003807) · [AIHOT](https://aihot.news/items/t1xquzbkxjspzr5kbc4ffn4ya)

Source publication: 2026-09-29T03:01:08.000Z

Jev 不好用？它是为可组合性而生的！ 需要更多 Jev！

## Jev 用 AI 自动化现实世界任务

[Summary page \(en\)](https://awesomejev.cc/news/dsr0rnzbghu1gvk5c8fufgpcm) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/dsr0rnzbghu1gvk5c8fufgpcm) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/dsr0rnzbghu1gvk5c8fufgpcm)

[@typesafeai](https://x.com/typesafeai/status/2104772007481180633) · [AIHOT](https://aihot.news/items/dsr0rnzbghu1gvk5c8fufgpcm)

Source publication: 2026-09-29T03:15:26.000Z

每一天，Jev 都在自动化新形式的现实世界任务，把🌎级⚡️快速智能带入排序、过滤、分类和路由等基础模块。 如果 AI 能解决新的数学问题，那么 AI 就能正确地路由一通客户支持电话！

## Jev 可组合性设计引热议

[Summary page \(en\)](https://awesomejev.cc/news/cpyqay9lnpozok8iq7wmd71qu) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cpyqay9lnpozok8iq7wmd71qu) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cpyqay9lnpozok8iq7wmd71qu)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2104770579513716929) · [AIHOT](https://aihot.news/items/cpyqay9lnpozok8iq7wmd71qu)

Source publication: 2026-09-29T03:09:45.000Z

我们的推特小哥太会整活了 🧑‍🍳

## 反基准测试者的Jevons悖论警告

[Summary page \(en\)](https://awesomejev.cc/news/nvg1g1j18yygmc47vmejunx6u) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/nvg1g1j18yygmc47vmejunx6u) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/nvg1g1j18yygmc47vmejunx6u)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2104722291900969162) · [AIHOT](https://aihot.news/items/nvg1g1j18yygmc47vmejunx6u)

Source publication: 2026-09-28T23:57:52.000Z

再次重申，我极度反对基准测试（：

## Ollama 支持基于 Jev API 的决策模型，新增 nimble 等三款模型

[Summary page \(en\)](https://awesomejev.cc/news/pxpre8jnvupr5x5k3nwpm2cbh) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/pxpre8jnvupr5x5k3nwpm2cbh) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/pxpre8jnvupr5x5k3nwpm2cbh)

[Ollama：Blog（RSS）](https://ollama.com/blog/ollama-now-supports-jev-style-decision-models) · [AIHOT](https://aihot.news/items/pxpre8jnvupr5x5k3nwpm2cbh)

Source publication: 2026-09-29T00:00:00.000Z

Ollama 0.35 通过新 /v1/systemone 端点支持基于 TypeSafe Jev API 的决策模型，可在本地一次请求回答多个命名问题，适合工单分诊、模型路由和内容审核等快速决策任务。

## Jeff 发布 0.8B 与 2B 决策模型，兼容 Jev 请求格式，单次决策约 22 毫秒

[Summary page \(en\)](https://awesomejev.cc/news/r5d81b72ad8xn1wawp0qplhtb) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/r5d81b72ad8xn1wawp0qplhtb) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/r5d81b72ad8xn1wawp0qplhtb)

[Hacker News 热门（buzzing.cc 中文翻译）](https://github.com/firelex/jeff) · [AIHOT](https://aihot.news/items/r5d81b72ad8xn1wawp0qplhtb)

Source publication: 2026-09-28T22:08:12.429Z

Jeff 发布基于 Qwen3.5 与 Gemma 4 微调的零样本分类模型 Jeff-Qwen3.5-0.8B、Jeff-Qwen3.5-2B 和 Jeff-Gemma4-E2B，与 Jev 使用相同请求格式，单次前向输出各选项校准概率。

## JevRAG 变体涌现引热议

[Summary page \(en\)](https://awesomejev.cc/news/aixvia20tpjftq4s228bpgacj) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/aixvia20tpjftq4s228bpgacj) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/aixvia20tpjftq4s228bpgacj)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2104687674351145192) · [AIHOT](https://aihot.news/items/aixvia20tpjftq4s228bpgacj)

Source publication: 2026-09-28T21:40:19.000Z

大量 JevRAG 变体正在涌现。 至少可以说很有意思。 这些范围有限的测试其实得不出什么结论，但它引发了讨论，也指向了在当前 RAG 和智能体系统中寻找优化方向的激动人心的路径。 我一直在测试自己做的 JevRAG，用于论文探索。 到目前为止，我在用 Jev 做重排序上取得了更多成功，也找到了一些非常有意思的论文搜索方式，把语义搜索和 Jev 结合起来。 更多内容很快分享。

## Jev 安全红队测试与防护实践

[Summary page \(en\)](https://awesomejev.cc/news/vmg53ai84fl5wj816m6lep3r6) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/vmg53ai84fl5wj816m6lep3r6) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/vmg53ai84fl5wj816m6lep3r6)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2104682600103284917) · [AIHOT](https://aihot.news/items/vmg53ai84fl5wj816m6lep3r6)

Source publication: 2026-09-28T21:20:09.000Z

围绕一个简单原语做真正工程实践的好例子！！！ 不要把 Jev 直接接入高层决策，而是编程定义你想要的行为！ （跟人说"去编程"听起来很奇怪，但这真的很酷）

## GPT Researcher 用 Jev 替代嵌入向量

[Summary page \(en\)](https://awesomejev.cc/news/xuhclilqy83suhpgjzazidrla) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/xuhclilqy83suhpgjzazidrla) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/xuhclilqy83suhpgjzazidrla)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2104665229712035929) · [AIHOT](https://aihot.news/items/xuhclilqy83suhpgjzazidrla)

Source publication: 2026-09-28T20:11:08.000Z

太酷了！

## Jev 路由多模型协同编程演示

[Summary page \(en\)](https://awesomejev.cc/news/sa8qvpcdonhneie8ylyioccva) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/sa8qvpcdonhneie8ylyioccva) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/sa8qvpcdonhneie8ylyioccva)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2104623036133417456) · [AIHOT](https://aihot.news/items/sa8qvpcdonhneie8ylyioccva)

Source publication: 2026-09-28T17:23:28.000Z

这就是编程的未来。 多个 AI 模型在同一个 Codex 会话中工作，由 Jev 路由它们处理任务的不同部分。 在这里，我让它构建了一个全栈演示应用： &gt; Opus 5.5 负责规划。 &gt; GPT-6 Astra 构建后端。 &gt; Kimi K3 构建前端。 &gt; DeepSeek 负责测试。 &gt; GLM 5.3 Flash 撰写文档。 Jev 负责切换。我从未碰过模型选择器。同样的构建，成本降低 40%，速度快 15%。

## TypeSafe AI 谈 Jev 模型理念

[Summary page \(en\)](https://awesomejev.cc/news/jn9ijjw3ioma472a01rw0le21) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/jn9ijjw3ioma472a01rw0le21) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/jn9ijjw3ioma472a01rw0le21)

[@typesafeai](https://x.com/typesafeai/status/2104620914143019189) · [AIHOT](https://aihot.news/items/jn9ijjw3ioma472a01rw0le21)

Source publication: 2026-09-28T17:15:02.000Z

我们的座右铭背后有很多含义：Building Prod, Not God。 这项技术将改变世界，但这要靠勤勉的努力和创造力来实现，而不是靠故弄玄虚的诉求。 @a16z 与 @CompleteSkeptic 深入探讨了这一理念以及更多内容。

## TypeSafe AI 谈 Jev 模型与自动化

[Summary page \(en\)](https://awesomejev.cc/news/dpzwvps8nckq7z68b6ts5z8ze) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/dpzwvps8nckq7z68b6ts5z8ze) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/dpzwvps8nckq7z68b6ts5z8ze)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2104614704614404485) · [AIHOT](https://aihot.news/items/dpzwvps8nckq7z68b6ts5z8ze)

Source publication: 2026-09-28T16:50:22.000Z

又录了一期播客，更深入地聊了我的哲学和对软件的热爱！这次超级好玩

## RespanAI Span-01 上线 OpenRouter

[Summary page \(en\)](https://awesomejev.cc/news/sh8y52tos5b64o0sbr7yzowwb) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/sh8y52tos5b64o0sbr7yzowwb) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/sh8y52tos5b64o0sbr7yzowwb)

[X：OpenRouter \(@OpenRouter\)](https://x.com/OpenRouter/status/2104601540938154160) · [AIHOT](https://aihot.news/items/sh8y52tos5b64o0sbr7yzowwb)

Source publication: 2026-09-28T15:58:03.000Z

来自 @RespanAI 的 Span-01 和 Span-01 Lite 已在 OpenRouter 上线。 它们是用于智能体轨迹的决策模型。发送一个 span 和你关心的行为，就能得到每种行为存在的概率，比如“用户是否感到沮丧？”或“这个工具调用是否安全可运行？”

## Unsloth 支持 4GB 内存本地运行 Laya Decision 模型

[Summary page \(en\)](https://awesomejev.cc/news/hhvby02194zyzsxi98vnleqdk) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/hhvby02194zyzsxi98vnleqdk) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/hhvby02194zyzsxi98vnleqdk)

[X：Unsloth \(@UnslothAI\)](https://x.com/UnslothAI/status/2104592692072304916) · [AIHOT](https://aihot.news/items/hhvby02194zyzsxi98vnleqdk)

Source publication: 2026-09-28T15:22:53.000Z

Unsloth 宣布可在仅 4GB 内存的设备上本地运行 Laya Decision 模型，支持 Mac、Windows、Linux 的 CPU、统一内存和 GPU 环境。默认多语言模型 678MB，另有 English 与 Typed decisions 档需 5GB RAM、846MB；可通过 Unsloth Desktop 以 Jev 兼容 API 提供服务，数据留在本地，指南见 https://unsloth.ai/docs/models/decision-laya。

## Jev scoring 用作 RAG 重排序

[Summary page \(en\)](https://awesomejev.cc/news/cmukp9ajb206wro9h2vmqqtdu) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmukp9ajb206wro9h2vmqqtdu) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmukp9ajb206wro9h2vmqqtdu)

[X：Dex Horthy（HumanLayer）\(@dexhorthy\)](https://x.com/dexhorthy/status/2104415621589164181) · [AIHOT](https://aihot.news/items/cmukp9ajb206wro9h2vmqqtdu)

Source publication: 2026-09-28T03:39:16.000Z

把 jev scoring 用作 RAG 重排序器非常合理。Rippling 内部 GTM 团队的应用做得很不错。

## TypeSafe AI 的 Jev 的 20 个智能体用例解读

[Summary page \(en\)](https://awesomejev.cc/news/cmukovht61zrzro9hvn3ud5ed) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmukovht61zrzro9hvn3ud5ed) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmukovht61zrzro9hvn3ud5ed)

[MarkTechPost（RSS）](https://www.marktechpost.com/2026/09/27/20-agentic-use-cases-of-typesafe-ais-jev) · [AIHOT](https://aihot.news/items/cmukovht61zrzro9hvn3ud5ed)

Source publication: 2026-09-28T03:07:10.000Z

MarkTechPost 整理了 TypeSafe AI 首个 System One 决策模型 Jev 的 20 个智能体用例，涵盖模型路由、工具调用风险把关、重排、引用核验与提示词注入筛查等。

## Jev 回归并开放注册

[Summary page \(en\)](https://awesomejev.cc/news/cmukex8kb1ozuro9hr1j031kj) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmukex8kb1ozuro9hr1j031kj) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmukex8kb1ozuro9hr1j031kj)

[@typesafeai](https://x.com/typesafeai/status/2104337822350221795) · [AIHOT](https://aihot.news/items/cmukex8kb1ozuro9hr1j031kj)

Source publication: 2026-09-27T22:30:08.000Z

女士们先生们，agents 和 assistants 们， 我们非常激动地宣布 Jev 回来了。 容量已提升，注册现已开放！

## Jev 回归开放注册，免费额度暂停

[Summary page \(en\)](https://awesomejev.cc/news/cmukex8ju1oztro9h7kxaseoq) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmukex8ju1oztro9h7kxaseoq) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmukex8ju1oztro9h7kxaseoq)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2104338649999626397) · [AIHOT](https://aihot.news/items/cmukex8ju1oztro9h7kxaseoq)

Source publication: 2026-09-27T22:33:25.000Z

好消息：任何人都可以注册了 💪 坏消息：我们不得不暂时关闭免费额度（仅针对新用户）——我们真的很想让大家都能体验 jev，但少数不良用户让所有人都很难受 😢 \[引用 @typesafeai\]：女士们先生们，智能体和助手们， 我们非常激动地宣布 Jev 回来了。 容量已提升，注册已开放！

## CodeRabbit 举办 Jev 首届黑客松

[Summary page \(en\)](https://awesomejev.cc/news/cmukbpi4q1i9tro9hmihndqth) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmukbpi4q1i9tro9hmihndqth) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmukbpi4q1i9tro9hmihndqth)

[@typesafeai](https://x.com/typesafeai/status/2104316580482175443) · [AIHOT](https://aihot.news/items/cmukbpi4q1i9tro9hmihndqth)

Source publication: 2026-09-27T21:05:43.000Z

CodeRabbit 在总部举办 Jev 首届黑客松，160+ 名开发者参与约 4 小时编程，并邀请 @allietheicon 分享如何与 Jev 这类新型 AI 模型协作。她谈到 Jev 对编程与软件开发带来的范式转变，并给出实用技巧与示例。

## Jev 玩 Minecraft 反应速度碾压人类

[Summary page \(en\)](https://awesomejev.cc/news/cmuk9bb281fvbro9hlrpu9n25) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuk9bb281fvbro9hlrpu9n25) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuk9bb281fvbro9hlrpu9n25)

[X：Sky Computing Lab \(@haoailab\)](https://x.com/haoailab/status/2104302648786919643) · [AIHOT](https://aihot.news/items/cmuk9bb281fvbro9hlrpu9n25)

Source publication: 2026-09-27T20:10:22.000Z

🚀 我们让 Jev 玩 Minecraft。我们就是打不过它！😭 ⚡ Jev：24 毫秒决策 🧠 你：约 200 毫秒反应 它在你看到它动之前就已经动了。太强了！ 🎮 https://mc.alexzms.com（加入服务器来赢）

## Jev 零样本检测对齐失效，AUROC 0.886

[Summary page \(en\)](https://awesomejev.cc/news/cmuk841qg1erhro9hxvpkekc5) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuk841qg1erhro9hxvpkekc5) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuk841qg1erhro9hxvpkekc5)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2104295014117589053) · [AIHOT](https://aihot.news/items/cmuk841qg1erhro9hxvpkekc5)

Source publication: 2026-09-27T19:40:01.000Z

TypeSafe AI 的校准决策模型 Jev 只需一个通用 yes/no 问题，用其概率作为评分，无需额外训练即可区分模型失效与正常回复，中位 AUROC 达 0.886。

## Jev 与无法解释的失败的常态化

[Summary page \(en\)](https://awesomejev.cc/news/cmuk4ndyx1b6nro9hell1wd2j) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuk4ndyx1b6nro9hell1wd2j) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuk4ndyx1b6nro9hell1wd2j)

[Hacker News 热门（buzzing.cc 中文翻译）](https://www.ihatethefuture.com/2026/09/the-normalization-of-inexplicable.html) · [AIHOT](https://aihot.news/items/cmuk4ndyx1b6nro9hell1wd2j)

Source publication: 2026-09-27T17:35:10.539Z

作者评论 TypeSafe AI 推出的 AI 模型 Jev，认为其用户不做 evals、把置信度分数当形式或甩锅理由，丢弃了对失败原因的追查。他担忧 LLM 驱动的开发会让"有时就是烂"成为排查的可接受终点，而本可用几条提示词搭建的 eval 反而能解决部分问题。

## 小米 MiMo-V3 的 HySparse2 等本周 AI 论文

[Summary page \(en\)](https://awesomejev.cc/news/cmuk4hvff17horo9hftcowxzz) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuk4hvff17horo9hftcowxzz) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuk4hvff17horo9hftcowxzz)

[X：DAIR.AI \(@dair\_ai\)](https://x.com/dair_ai/status/2104263416252625124) · [AIHOT](https://aihot.news/items/cmuk4hvff17horo9hftcowxzz)

Source publication: 2026-09-27T17:34:28.000Z

小米 MiMo 团队为即将推出的 MiMo-V3 打造了注意力架构 HySparse2，在 80B-A3B MoE 模型上把 prefill FLOPs 较 MiMo-V2 系列的 Hybrid SWA 降低 5.02x、较 HySparse 降低 2.92x，KV cache 从 12.09 GB 降至 2.69 GB。

## DAIR.AI 本周顶级 AI 论文盘点

[Summary page \(en\)](https://awesomejev.cc/news/cmuk4hvff17hnro9h3pyjofd6) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuk4hvff17hnro9h3pyjofd6) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuk4hvff17hnro9h3pyjofd6)

[X：DAIR.AI \(@dair\_ai\)](https://x.com/dair_ai/status/2104263606305190279) · [AIHOT](https://aihot.news/items/cmuk4hvff17hnro9h3pyjofd6)

Source publication: 2026-09-27T17:35:13.000Z

本周顶级 AI 论文（9 月 21 日 - 27 日）： - HySparse2 - EvoOntology - Harness-Zero - JEV-as-a-Judge - Wiki Foundation Model - Self-Organizing Agent Teams - Self-Improvement via Fast Tree-search 继续阅读： \[引用 @dair\_ai\]：https://x.com/i/article/2104259869402599424

## 把 Jev 用作 Agent 编辑后的模糊 linter：规则筛选与置信度分层实验

[Summary page \(en\)](https://awesomejev.cc/news/cmuk1ojkt14qzro9hm5tbu25i) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuk1ojkt14qzro9hm5tbu25i) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuk1ojkt14qzro9hm5tbu25i)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2104248143739015190) · [AIHOT](https://aihot.news/items/cmuk1ojkt14qzro9hm5tbu25i)

Source publication: 2026-09-27T16:33:47.000Z

Michael Thiessen 实验将 Jev 作为 Agent harness 中编辑后运行的模糊 linter：把编码指南拆成无需额外上下文和推理的微小规则，并构建合成 eval 加 held out 集防止过拟合。

## Julia-1 分类模型发布，训练仅花 104 美元

[Summary page \(en\)](https://awesomejev.cc/news/cmuk0lz7b13m2ro9hm92v09yi) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuk0lz7b13m2ro9hm92v09yi) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuk0lz7b13m2ro9hm92v09yi)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2104235323970523543) · [AIHOT](https://aihot.news/items/cmuk0lz7b13m2ro9hm92v09yi)

Source publication: 2026-09-27T15:42:50.000Z

supersonicai 发布首个分类模型 Julia-1，号称几乎能在任何设备上运行，训练与实验的云 GPU 花费约 R$540（US$104.08）。

## Every 团队实测 Opus 5.5、GPT-6 Sol 和 Grok 4.7，团队成员各归其位

[Summary page \(en\)](https://awesomejev.cc/news/cmujufpjc0xddro9hypacbclr) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmujufpjc0xddro9hypacbclr) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmujufpjc0xddro9hypacbclr)

[Every：最新文章（网页）](https://every.to/context-window/opus-5-5-and-sol-split-the-team) · [AIHOT](https://aihot.news/items/cmujufpjc0xddro9hypacbclr)

Source publication: 2026-09-27T13:17:32.963Z

Every 团队对本周发布的三款模型做了 Vibe Check。团队实测发现 Opus 5.5 在产品和设计工作上的表现持平或超过 Fable 5.1，且每 token 成本低 60%。

## Privatemode 团队用 GLM-5.3-Flash 将 LLM 变成单次前向的类型化决策模型

[Summary page \(en\)](https://awesomejev.cc/news/cmujrs8b40uo9ro9h3fuuyn6w) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmujrs8b40uo9ro9h3fuuyn6w) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmujrs8b40uo9ro9h3fuuyn6w)

[Hacker News 热门（buzzing.cc 中文翻译）](https://www.privatemode.ai/blog/system-one-from-glm-flash) · [AIHOT](https://aihot.news/items/cmujrs8b40uo9ro9h3fuuyn6w)

Source publication: 2026-09-27T11:32:15.779Z

Privatemode 团队展示了一种无需微调的方法，通过编号选项、预填 choice\_index: 前缀并读取选项索引的 log 概率，让 GLM-5.3-Flash 在单次前向中输出带概率的类型化决策。

## BestBlogs 精选周刊第 114 期：智能过剩之后，瓶颈向任务链后方移动

[Summary page \(en\)](https://awesomejev.cc/news/cmujmngfs0lypro9hdgsbd3b1) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmujmngfs0lypro9hdgsbd3b1) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmujmngfs0lypro9hdgsbd3b1)

[X：洪明 \(@hongming731\)](https://x.com/hongming731/status/2104139011564654837) · [AIHOT](https://aihot.news/items/cmujmngfs0lypro9hdgsbd3b1)

Source publication: 2026-09-27T09:20:08.000Z

BestBlogs 精选周刊第 114 期发布，梳理 Claude Opus 5.5、GPT-6 Sol 与 Luna、Grok 4.7、MiMo-V2.6 等集中在同一窗口的发布，并提出核心判断：模型能力每前进一步，系统瓶颈就向任务链后方移动一步。

## Jev 与 Instructor 能否搭配使用

[Summary page \(en\)](https://awesomejev.cc/news/cmuiuc9kb06snrohyjhhldvwk) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuiuc9kb06snrohyjhhldvwk) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuiuc9kb06snrohyjhhldvwk)

[X：Jason Liu \(@jxnlco\)](https://x.com/jxnlco/status/2103944048327479651) · [AIHOT](https://aihot.news/items/cmuiuc9kb06snrohyjhhldvwk)

Source publication: 2026-09-26T20:25:25.000Z

有人想用 jev 搭配 instructor 吗？

## 巴西 Supersonic Labs 发布 144.3M 参数开源决策模型 Julia 1，可在 CPU 上运行

[Summary page \(en\)](https://awesomejev.cc/news/cmuitc2zq05nrrohypr5i9jqb) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuitc2zq05nrrohypr5i9jqb) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuitc2zq05nrrohypr5i9jqb)

[MarkTechPost（RSS）](https://www.marktechpost.com/2026/09/26/supersonic-labs-releases-julia-1-a-144-3m-parameter-open-decision-model-that-runs-on-a-cpu) · [AIHOT](https://aihot.news/items/cmuitc2zq05nrrohypr5i9jqb)

Source publication: 2026-09-26T19:50:57.000Z

巴西 AI 实验室 Supersonic Labs 发布 144.3M 参数的开源决策模型 Julia 1，权重以 Apache 2.0 协议托管在 Hugging Face，可在普通 CPU 上运行，不生成文本，只对 2 到 20 个候选答案输出选择和概率。

## Jev 成 OpenRouter 分类请求首选

[Summary page \(en\)](https://awesomejev.cc/news/cmuiqff1b02vurohyiw16gh81) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuiqff1b02vurohyiw16gh81) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuiqff1b02vurohyiw16gh81)

[X：OpenRouter \(@OpenRouter\)](https://x.com/OpenRouter/status/2103915026205806610) · [AIHOT](https://aihot.news/items/cmuiqff1b02vurohyiw16gh81)

Source publication: 2026-09-26T18:30:05.000Z

Jev 正迅速成为 OpenRouter 上分类请求的首选。 它占据了该类别每周请求量的 27%，几乎是此前位居榜首的 DeepSeek V4 Flash 份额的两倍

## Jev 能否玩 Overcooked？

[Summary page \(en\)](https://awesomejev.cc/news/cmuimu72l0rq2rov0e42zl2u9) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuimu72l0rq2rov0e42zl2u9) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuimu72l0rq2rov0e42zl2u9)

[X：Jason Liu \(@jxnlco\)](https://x.com/jxnlco/status/2103885150828544302) · [AIHOT](https://aihot.news/items/cmuimu72l0rq2rov0e42zl2u9)

Source publication: 2026-09-26T16:31:22.000Z

jev 能玩 Overcooked 吗？

## OpenRouter 推出 Jev Router，为每次 LLM 调用自动选择模型和推理力度

[Summary page \(en\)](https://awesomejev.cc/news/cmuil686g0py1rov0hvs1d3ol) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuil686g0py1rov0hvs1d3ol) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuil686g0py1rov0hvs1d3ol)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2103875089779261682) · [AIHOT](https://aihot.news/items/cmuil686g0py1rov0hvs1d3ol)

Source publication: 2026-09-26T15:51:24.000Z

Jev 现以 typesafe/jev-router 形式打包上线，OpenRouter 会为每个请求自动选择模型和推理力度。作者用 Pi SDK 构建的支持智能体测试，同一 8 个案例对比固定 GPT-6 Sol 基线共 32 次真实调用，两者全部答对，路由成本低一半以上（$0.008 vs $0.018），中位响应时间也更短（1.5s vs 1.9s）。

## 用读取 token 概率实现 Jev 风格的单函数 LLM 封装器，支持视觉模型

[Summary page \(en\)](https://awesomejev.cc/news/cmuifjdga0kbsrov06p9igbjd) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuifjdga0kbsrov06p9igbjd) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuifjdga0kbsrov06p9igbjd)

[Hacker News 热门（buzzing.cc 中文翻译）](http://allanrbo.blogspot.com/2026/09/a-jev-like-wrapper-for-llms-including.html) · [AIHOT](https://aihot.news/items/cmuifjdga0kbsrov06p9igbjd)

Source publication: 2026-09-26T13:01:20.496Z

作者 allanrbo 分享一个借鉴 Jev 思路的单函数封装方法：让模型只输出一个选项字母，通过 logprobs 读取各选项的 token 概率作为结构化答案，并扩展 attachments 字段支持图片输入。

## 作者分享用 logprobs 读取 LLM 选项概率的单函数封装，并扩展到视觉模型

[Summary page \(en\)](https://awesomejev.cc/news/cmui5ah9r067qrov0vninzs7o) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmui5ah9r067qrov0vninzs7o) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmui5ah9r067qrov0vninzs7o)

[Hacker News：AI 热帖](http://allanrbo.blogspot.com/2026/09/a-jev-like-wrapper-for-llms-including.html) · [AIHOT](https://aihot.news/items/cmui5ah9r067qrov0vninzs7o)

Source publication: 2026-09-26T04:20:58.000Z

作者受 Jev 及 OpenJev、SemIf 启发，实现了一个单函数封装：让 LLM 只生成一个选项字母，再读取 top\_logprobs 得到各选项概率。

## jev 将复活架构最佳实践并与 ML 结合

[Summary page \(en\)](https://awesomejev.cc/news/cmuhpehti0hnirojn2y0mmm17) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuhpehti0hnirojn2y0mmm17) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuhpehti0hnirojn2y0mmm17)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2103654904275537968) · [AIHOT](https://aihot.news/items/cmuhpehti0hnirojn2y0mmm17)

Source publication: 2026-09-26T01:16:27.000Z

太赞同了 我认为 jev 对自动化最大的好处之一，将来自复活架构最佳实践：状态管理、封装、抽象！！！！ 并将它们与 ML 的最佳实践结合：度量/评估，使用校准/不确定性 （加截图是因为我不知道怎么引用两条帖子 🤦）

## Jev 等分类器模型涌现，开发者好时机

[Summary page \(en\)](https://awesomejev.cc/news/cmuhobuxw0ghjrojn2gmug7q6) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuhobuxw0ghjrojn2gmug7q6) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuhobuxw0ghjrojn2gmug7q6)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2103641648362348929) · [AIHOT](https://aihot.news/items/cmuhobuxw0ghjrojn2gmug7q6)

Source publication: 2026-09-26T00:23:47.000Z

很高兴看到像 Jev 这样的分类器模型越来越多地被构建出来。 做开发者的好时机 🥹🫶

## Codex 宕机后用 Claude Code 监控

[Summary page \(en\)](https://awesomejev.cc/news/cmuhlhsho0dodrojn85080ei0) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuhlhsho0dodrojn85080ei0) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuhlhsho0dodrojn85080ei0)

[X：Yuchen Jin \(@Yuchenj\_UW\)](https://x.com/Yuchenj_UW/status/2103627959810801857) · [AIHOT](https://aihot.news/items/cmuhlhsho0dodrojn85080ei0)

Source publication: 2026-09-25T23:29:23.000Z

Codex 挂了。 于是我配置了 Claude Code 来检查它什么时候恢复。 然后我用 Jev 来决定 Claude Code 该什么时候检查。 我可能有点问题了。

## Show HN：杰夫在玩《宝可梦 红版》

[Summary page \(en\)](https://awesomejev.cc/news/cmuhkew690ccnrojnd99nxrqt) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuhkew690ccnrojnd99nxrqt) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuhkew690ccnrojnd99nxrqt)

[Hacker News 热门（buzzing.cc 中文翻译）](https://jev-pokemon.vercel.app/) · [AIHOT](https://aihot.news/items/cmuhkew690ccnrojnd99nxrqt)

Source publication: 2026-09-25T22:56:30.740Z

开发者发布 Show HN 项目"杰夫在玩《宝可梦 红版》"，页面默认静音、取消静音后可听游戏音频，右侧面板实时展示每一步决策与 Jev 的胜率。该项目由 FRIGADE 赞助，FRIGADE 是一款能自主学习产品并在应用内向每位用户提示下一步的 AI 助手，页面同时提供代码查看入口。

## OpenRouter 推出 Jev 缓存感知模型路由

[Summary page \(en\)](https://awesomejev.cc/news/cmuhk1idq0c1jrojngwxivbid) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuhk1idq0c1jrojngwxivbid) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuhk1idq0c1jrojngwxivbid)

[@typesafeai](https://x.com/typesafeai/status/2103612889655353346) · [AIHOT](https://aihot.news/items/cmuhk1idq0c1jrojngwxivbid)

Source publication: 2026-09-25T22:29:30.000Z

你从未体验过这样的路由方式。 @OpenRouter 将 Jev 带入你所有的 LLM 调用，让你的智能体工作流不再浪费任何一个 token。 一如既往，更快、更便宜、更智能。去构建未来吧。 @OpenRouter：推出 typesafe/jev-router：一个由 Jev 和 @typesafeai 驱动的缓存感知模型路由器。 Jev Router 为每个请求挑选最佳模型和推理强度，在质量、速度和成本之间取得平衡。 以下是它的工作原理 👇🏻

## OpenRouter 推出 Jev 缓存感知模型路由器

[Summary page \(en\)](https://awesomejev.cc/news/cmuhjk70a0blcrojnu1s4rnq6) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuhjk70a0blcrojnu1s4rnq6) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuhjk70a0blcrojnu1s4rnq6)

[X：OpenRouter \(@OpenRouter\)](https://x.com/OpenRouter/status/2103610898690855161) · [AIHOT](https://aihot.news/items/cmuhjk70a0blcrojnu1s4rnq6)

Source publication: 2026-09-25T22:21:36.000Z

介绍 typesafe/jev-router：一个由 Jev 和 @typesafeai 驱动的缓存感知模型路由器 Jev Router 为每个请求挑选最佳模型和推理力度，在质量、速度和成本之间取得平衡。 工作原理如下 👇🏻

## Jev-Mem：受 System-One/System-Two 启发的智能体记忆架构

[Summary page \(en\)](https://awesomejev.cc/news/cmuhilhcs0ahbrojntvlypdr2) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuhilhcs0ahbrojntvlypdr2) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuhilhcs0ahbrojntvlypdr2)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2103603205821366311) · [AIHOT](https://aihot.news/items/cmuhilhcs0ahbrojntvlypdr2)

Source publication: 2026-09-25T21:51:01.000Z

Jev-Mem 是一种受 System-One/System-Two 认知启发的新型智能体记忆架构，将记忆构建提速 6.6 倍、查询延迟降低 36.7%。在 LoCoMo 上，它以 LLM 评审 0.777 的总分较最强基线相对提升 11.0%，记忆构建耗时 158 秒，平均查询延迟降至 0.93 秒。

## SGLang 如何用 Score API 与 MIS 扩展 JEV 类决策模型服务

[Summary page \(en\)](https://awesomejev.cc/news/cmuhijm640ag7rojnp00p9tuu) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuhijm640ag7rojnp00p9tuu) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuhijm640ag7rojnp00p9tuu)

[LMSYS：Blog（Chatbot Arena 团队）](https://www.lmsys.org/blog/2026-09-25-sglang-decision-models) · [AIHOT](https://aihot.news/items/cmuhijm640ag7rojnp00p9tuu)

Source publication: 2026-09-24T16:00:00.000Z

SGLang 团队介绍用 Score API 与多条目评分（MIS）服务 JEV 类决策模型：/v1/score 通过 label\_token\_ids 显式请求标签 token 分数，MIS 在单次请求内复用共享 query 计算并隔离各候选。

## DSPy 3.4.0 发布：原生支持 Jev 与 System One

[Summary page \(en\)](https://awesomejev.cc/news/cmuhfr7vq043xrojn2j1gmi76) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuhfr7vq043xrojn2j1gmi76) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuhfr7vq043xrojn2j1gmi76)

[@typesafeai](https://x.com/typesafeai/status/2103587838004785352) · [AIHOT](https://aihot.news/items/cmuhfr7vq043xrojn2j1gmi76)

Source publication: 2026-09-25T20:49:58.000Z

DSPy 方法论 🤝 System One 编程，而非提示！ DSPy 3.4.0 刚刚发布！ 此版本在 DSPy 中原生支持 Jev 和 System one 模型！可与兼容的 signatures 一起使用。此版本还包含一个全新的优化器 ReAnchor，专门用于以置信度校准输出。

## Ollaya 发布，本地运行开源决策模型并兼容 TypeSafe API

[Summary page \(en\)](https://awesomejev.cc/news/cmuhf1x2403gvrojn41jenj54) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuhf1x2403gvrojn41jenj54) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuhf1x2403gvrojn41jenj54)

[Hacker News 热门（buzzing.cc 中文翻译）](https://ollaya.dev/) · [AIHOT](https://aihot.news/items/cmuhf1x2403gvrojn41jenj54)

Source publication: 2026-09-25T20:02:09.638Z

Ollaya 发布，一个开源的本地决策模型运行工具，对文本或 JSON 的类型化问题返回毫秒级校准答案。支持 laya、decider、nli、gliclass 等开放权重模型，兼容 TypeSafe 的 /v1/systemone 和 /v1/models 接口，官方 TypeSafe Python SDK 0.7.1 可直接使用。

## TypeSafe Jevelopers Discord 首周

[Summary page \(en\)](https://awesomejev.cc/news/cmuhdm4zd0a22ro3bl170rppz) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuhdm4zd0a22ro3bl170rppz) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuhdm4zd0a22ro3bl170rppz)

[@typesafeai](https://x.com/typesafeai/status/2103569575061451137) · [AIHOT](https://aihot.news/items/cmuhdm4zd0a22ro3bl170rppz)

Source publication: 2026-09-25T19:37:23.000Z

Discord 里正在发生严肃的 Jevelopments，在 @allietheicon 的注视下 👀 \[引用 @allietheicon\]：TypeSafe Jevelopers Discord 的第一周真是疯狂

## LangGraph 如何编排 TypeSafe AI 决策模型 Jev 构建生产级智能体

[Summary page \(en\)](https://awesomejev.cc/news/cmuhcf9g008saro3bzfk9999o) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuhcf9g008saro3bzfk9999o) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuhcf9g008saro3bzfk9999o)

[LangChain：Blog（RSS）](https://www.langchain.com/blog/building-prod-with-jev-and-langgraph) · [AIHOT](https://aihot.news/items/cmuhcf9g008saro3bzfk9999o)

Source publication: 2026-09-25T19:11:55.000Z

LangGraph 可编排 TypeSafe AI 的决策模型 Jev，用于构建更快、更便宜的生产级智能体。该方案展示了 LangGraph 在智能体编排中的实际用法。

## jevmem v0.5 发布：为 Claude Code 自动保存项目记忆

[Summary page \(en\)](https://awesomejev.cc/news/cmuhba2mw07ijro3bsmvqjdan) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuhba2mw07ijro3bsmvqjdan) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuhba2mw07ijro3bsmvqjdan)

[Hacker News：AI 热帖](https://github.com/Avinash-jetwani/jevmem) · [AIHOT](https://aihot.news/items/cmuhba2mw07ijro3bsmvqjdan)

Source publication: 2026-09-25T16:04:04.000Z

作者发布 jevmem v0.5，一个为 Claude Code 自动保存项目记忆的工具，将对话中的决策、约束、bug 和 todo 写入 JEVMEM.md，旧结论标记为 superseded 而非删除，下次会话注入相关记忆行；也支持 Cursor 和 Codex。

## DSPy 3.4.0 原生支持 Jev 与 System One 模型

[Summary page \(en\)](https://awesomejev.cc/news/cmuh7vel607jjro55rdyowkhu) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuh7vel607jjro55rdyowkhu) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuh7vel607jjro55rdyowkhu)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2103529287676567888) · [AIHOT](https://aihot.news/items/cmuh7vel607jjro55rdyowkhu)

Source publication: 2026-09-25T16:57:18.000Z

DSPy 3.4.0 发布，原生支持 Jev 和 System One 模型，并新增专为置信度校准输出设计的优化器 ReAnchor。Elvis Saravia 称用 Jev 构建自定义 harness 在 guardrails、路由和验证器上效果良好，并看好其在技能结构化、工具调用、动态工作流与上下文工程中的应用。

## NaceAI 发布 Drex 决策模型，输出选项概率

[Summary page \(en\)](https://awesomejev.cc/news/cmuh6syb806ggro5584qf6nzw) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuh6syb806ggro5584qf6nzw) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuh6syb806ggro5584qf6nzw)

[X：Rohan Paul \(@rohanpaul\_ai\)](https://x.com/rohanpaul_ai/status/2103523705603461145) · [AIHOT](https://aihot.news/items/cmuh6syb806ggro5584qf6nzw)

Source publication: 2026-09-25T16:35:07.000Z

NaceAI 推出 Drex，一个 sub-6B 决策模型，不生成文本而是直接输出各选项概率，一次前向即可完成，面向智能体路由、工具选择、重排序与策略检查等场景。Drex 采用小型扩散模型加 RLAF 架构，定价 $0.04/1M input tokens，延迟低于 1 秒，在 Decision Index 上排名 \#1，40 项 benchmark 中赢下 23 项，开放权重与技术报告即将发布。

## DSPy 3.4.0 发布：新增 ReAnchor 优化器

[Summary page \(en\)](https://awesomejev.cc/news/cmuh640ch05lxro55p0838gfp) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuh640ch05lxro55p0838gfp) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuh640ch05lxro55p0838gfp)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2103515857909678542) · [AIHOT](https://aihot.news/items/cmuh640ch05lxro55p0838gfp)

Source publication: 2026-09-25T16:03:56.000Z

太荣幸了！🥹 DSPy 3.4.0 刚刚发布！ 此版本在 DSPy 中原生支持 Jev 和 System one 模型！可与兼容的 signatures 一起使用。此版本还包含一个全新的优化器 ReAnchor，专门用于校准输出的置信度。

## System One 模型推动自定义 Agent Harness 新浪潮

[Summary page \(en\)](https://awesomejev.cc/news/cmuh5qc4s052lro55yvozxh2j) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuh5qc4s052lro55yvozxh2j) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuh5qc4s052lro55yvozxh2j)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2103513870904053936) · [AIHOT](https://aihot.news/items/cmuh5qc4s052lro55yvozxh2j)

Source publication: 2026-09-25T15:56:02.000Z

DAIR.AI 的 Elvis Saravia 指出，System One 模型正将自定义 agent harness 推向新高度，Jev 之后又出现 Contrastive Language Model（CLM），CLM 比 Jev 快 9 倍，在长周期任务上验证表现更优。

## Jev：用 RLCD 训练的单次调用模型零样本检测 AI 对齐失效

[Summary page \(en\)](https://awesomejev.cc/news/cmugvdzah1b46rogvaei9bq7r) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmugvdzah1b46rogvaei9bq7r) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmugvdzah1b46rogvaei9bq7r)

[HuggingFace Daily Papers（社区热门论文）](https://arxiv.org/abs/2609.29429) · [AIHOT](https://aihot.news/items/cmugvdzah1b46rogvaei9bq7r)

Source publication: 2026-09-24T00:00:00.000Z

用强化学习校准决策（RLCD）训练的模型 Jev 可在单次调用中对同一输入回答多个带类型的问题并给出校准概率，零样本检测对齐失效的中位 AUROC 达 0.886，在多数基准上超过有监督基线。

## Fastino 发布 GLiNER2.5-Decide：可在 CPU 上运行的 340M 开源权重决策模型

[Summary page \(en\)](https://awesomejev.cc/news/cmughpw5b0sx7rogv4dmfcg9o) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmughpw5b0sx7rogv4dmfcg9o) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmughpw5b0sx7rogv4dmfcg9o)

[MarkTechPost（RSS）](https://www.marktechpost.com/2026/09/24/fastino-releases-gliner2-5-decide-a-340m-open-weight-decision-model-that-runs-on-cpu) · [AIHOT](https://aihot.news/items/cmughpw5b0sx7rogv4dmfcg9o)

Source publication: 2026-09-25T04:46:38.000Z

Fastino Labs 发布 340M 参数开源权重决策模型 GLiNER2.5-Decide，接受文本和类型化问题 schema，返回带概率分布、置信度和约束可行性元数据的结构化答案，权重采用 Apache 2.0，可运行于 CPU、GPU 或气隙环境。

## Opus 5.5 制作讲解视频的开源 agent 方案 shipvideo 发布

[Summary page \(en\)](https://awesomejev.cc/news/cmug60l2n0gnerogvv72ttoi2) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmug60l2n0gnerogvv72ttoi2) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmug60l2n0gnerogvv72ttoi2)

[Hacker News 热门（buzzing.cc 中文翻译）](https://launchvideo.io/) · [AIHOT](https://aihot.news/items/cmug60l2n0gnerogvv72ttoi2)

Source publication: 2026-09-24T23:23:18.882Z

作者发布 launchvideo.io 与 diggerhq/shipvideo 仓库，用 anthropic/claude-opus-5.5 通过 OpenComputer serverless agent 把一个 URL 或提示词直接渲染成 MP4 讲解视频，单次运行无人工编辑。

## Product Hunt 9月30日举办 HYPERSHIP DAY

[Summary page \(en\)](https://awesomejev.cc/news/cmug2gi4g09ajrogvibob01bt) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmug2gi4g09ajrogvibob01bt) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmug2gi4g09ajrogvibob01bt)

[@typesafeai](https://x.com/typesafeai/status/2103233636413903158) · [AIHOT](https://aihot.news/items/cmug2gi4g09ajrogvibob01bt)

Source publication: 2026-09-24T21:22:29.000Z

Product Hunt 将于 9 月 30 日举办 HYPERSHIP DAY，由 Jev 开发商 @typesafeai 与 @supabase 联合赞助。想参与的开发者需在 9 月 30 日午夜前提交发布，当天需实时构建并上线多个功能，奖品包括 Jev 和 Supabase credits、swag 礼盒及后续公布的秘密奖品。不发布的用户也可当天体验新产品、提交功能请求并观察产品实时迭代。

## JevSearch 用 Jev 验证搜索结果

[Summary page \(en\)](https://awesomejev.cc/news/cmug0bd95070xrogvww0pcaha) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmug0bd95070xrogvww0pcaha) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmug0bd95070xrogvww0pcaha)

[@typesafeai](https://x.com/typesafeai/status/2103218258405118035) · [AIHOT](https://aihot.news/items/cmug0bd95070xrogvww0pcaha)

Source publication: 2026-09-24T20:21:23.000Z

相关性很重要，但相关于什么？Jev 给你任何套路 SEO 都钻不进去的搜索智能 🪱 我构建了 JevSearch，用 Jev 搜索网络并验证你的结果。 给出一个查询和筛选标准，用 @browserbase search 获取 t25 结果，然后 Jev 打分并返回 t5 结果。 Jev 常常会选择初始前 5 之外的 url，认为它们更相关。

## 在 Databricks SQL 中运行开源决策模型 SemIf-OpenJev

[Summary page \(en\)](https://awesomejev.cc/news/cmufxxbbd04kjrogv9bwgbwuo) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmufxxbbd04kjrogv9bwgbwuo) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmufxxbbd04kjrogv9bwgbwuo)

[Databricks：Blog（RSS）](https://www.databricks.com/blog/running-open-jev-sql-databricks) · [AIHOT](https://aihot.news/items/cmufxxbbd04kjrogv9bwgbwuo)

Source publication: 2026-09-24T16:55:01.000Z

Databricks 发布可导入 Notebook，支持在 SQL 中通过 ai\_query 直接调用开源决策模型 SemIf-OpenJev，并返回结构化分类结果与选项概率。该流程借助 Serverless GPU 与 AI Runtime 自动下载模型、注册并创建 GPU Model Serving 端点，三步即可完成部署，示例用于将酒店评论分类为好评或差评。

## dejevnerates 项目仍在建设中

[Summary page \(en\)](https://awesomejev.cc/news/cmufx3m1603mmrogv3z84gzsa) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmufx3m1603mmrogv3z84gzsa) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmufx3m1603mmrogv3z84gzsa)

[@typesafeai](https://x.com/typesafeai/status/2103196683932983335) · [AIHOT](https://aihot.news/items/cmufx3m1603mmrogv3z84gzsa)

Source publication: 2026-09-24T18:55:39.000Z

我们正在努力为你们这些 dejevnerates 带来你们想要的东西，注册仍然关闭，敬请期待！🏗️

## Jev 用于 RAG 的语义匹配与重排

[Summary page \(en\)](https://awesomejev.cc/news/cmufstbci07fyroxzup6yzhjl) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmufstbci07fyroxzup6yzhjl) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmufstbci07fyroxzup6yzhjl)

[@typesafeai](https://x.com/typesafeai/status/2103165951781032167) · [AIHOT](https://aihot.news/items/cmufstbci07fyroxzup6yzhjl)

Source publication: 2026-09-24T16:53:32.000Z

继续搞，Jev 的大多数最佳实践还有待发掘！ \[引用 @Vtrivedy10\]：Jev 用于 RAG 几乎所有情况下，相比点积相似度，你更应信任 Jev 的语义匹配能力 在小数据场景下作为直接相似度指标非常有用 在大数据场景下则是出色的重排器

## Project Jev 一周省下 50 万

[Summary page \(en\)](https://awesomejev.cc/news/cmufrqscv068droxz7lnihscn) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmufrqscv068droxz7lnihscn) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmufrqscv068droxz7lnihscn)

[@typesafeai](https://x.com/typesafeai/status/2103162217076318276) · [AIHOT](https://aihot.news/items/cmufrqscv068droxz7lnihscn)

Source publication: 2026-09-24T16:38:42.000Z

省下五十万，token 用量翻 100 倍，小意思 💅

## jev 登顶 OpenRouter 短上下文模型榜

[Summary page \(en\)](https://awesomejev.cc/news/cmufqo62r04veroxzhzh4axuq) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmufqo62r04veroxzhzh4axuq) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmufqo62r04veroxzhzh4axuq)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2103156606318108892) · [AIHOT](https://aihot.news/items/cmufqo62r04veroxzhzh4axuq)

Source publication: 2026-09-24T16:16:24.000Z

jev 是 OpenRouter 上 1k-10k 上下文的最强模型！

## Jev-as-a-Judge 论文：廉价裁判置信时接受、不确定时上升至 GPT-6，保留 99% 准确率并省约 43% 费用

[Summary page \(en\)](https://awesomejev.cc/news/cmufpw01h03v5roxzbjbbud56) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmufpw01h03v5roxzbjbbud56) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmufpw01h03v5roxzbjbbud56)

[X：DAIR.AI \(@dair\_ai\)](https://x.com/dair_ai/status/2103147453717545278) · [AIHOT](https://aihot.news/items/cmufpw01h03v5roxzbjbbud56)

Source publication: 2026-09-24T15:40:02.000Z

论文介绍 JEV-as-a-Judge，发现多数评测可用廉价裁判，仅把不确定判定交给前沿模型。在 510 个保留偏好对上，级联接受 JEV 置信判定、其余上升至 GPT-6 Astra，保留 GPT-6 约 99% 的准确率，费用约为其 57%。

## CLM-8B 发布：比 Jev 快 9 倍的 System One 模型

[Summary page \(en\)](https://awesomejev.cc/news/cmufo5akc07fpro8wkfc467ex) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmufo5akc07fpro8wkfc467ex) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmufo5akc07fpro8wkfc467ex)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2103139055013646646) · [AIHOT](https://aihot.news/items/cmufo5akc07fpro8wkfc467ex)

Source publication: 2026-09-24T15:06:39.000Z

Contrastive Language Model（CLM）发布，这是一个用对比学习目标训练的 System One 模型，CLM-8B 推理速度最高比 Jev 快 9 倍，在 computer-use、游戏和工具调用任务上性能相当。

## 斯坦福与 NVIDIA 发布对比式语言模型 CLM-8B

[Summary page \(en\)](https://awesomejev.cc/news/cmufkk74d038xro8wkn32j6re) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmufkk74d038xro8wkn32j6re) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmufkk74d038xro8wkn32j6re)

[Hacker News 热门（buzzing.cc 中文翻译）](https://contrastive-lm.notion.site/) · [AIHOT](https://aihot.news/items/cmufkk74d038xro8wkn32j6re)

Source publication: 2026-09-24T13:07:21.703Z

斯坦福大学与 NVIDIA Research 团队发布 Contrastive Language Models（CLM）及 CLM-8B 模型，用 InfoNCE 对比目标连接状态与动作，作为 System One 决策模型。

## Stanford 与 NVIDIA Research 发布对比语言模型 CLM-8B

[Summary page \(en\)](https://awesomejev.cc/news/cmufae54k03neroagmmeho0rr) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmufae54k03neroagmmeho0rr) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmufae54k03neroagmmeho0rr)

[Hacker News：AI 热帖](https://contrastive-lm.notion.site/) · [AIHOT](https://aihot.news/items/cmufae54k03neroagmmeho0rr)

Source publication: 2026-09-24T04:20:59.000Z

Stanford 与 NVIDIA Research 团队发布 Contrastive Language Models（CLM）及 CLM-8B，用对比学习连接状态与动作，作为快速决策的 System One 模型。

## 1.395元复现Jev原型：百度千帆Token Plan最佳实践

[Summary page \(en\)](https://awesomejev.cc/news/cmuf9jgea05x8rocsw2y3zzlm) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuf9jgea05x8rocsw2y3zzlm) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuf9jgea05x8rocsw2y3zzlm)

[公众号：百度智能云（文心）](https://mp.weixin.qq.com/s?__biz=MzA5NTQ5MzE5OQ%3D%3D&mid=2653160541&idx=3&sn=bbd3bba3e1980287f3087427da8678c9) · [AIHOT](https://aihot.news/items/cmuf9jgea05x8rocsw2y3zzlm)

Source publication: 2026-09-22T11:29:10.000Z

百度千帆Token Plan个人版以313.9积分（折合1.395元）支持Opencode（基座模型DeepSeek-V4-Flash）在llama.cpp中复现TypeSafe AI的Jev机制，用约400行C++把自回归LLM改造为单次前向传播的结构化决策引擎。

## Contrastive-LM 发布开源模型 CLM-8B，零-shot 下评分 Agent 动作比 Jev 快最多 9 倍

[Summary page \(en\)](https://awesomejev.cc/news/cmuf3bxxo08ubrood3j8q8lrn) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuf3bxxo08ubrood3j8q8lrn) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuf3bxxo08ubrood3j8q8lrn)

[MarkTechPost（RSS）](https://www.marktechpost.com/2026/09/23/contrastive-lm-releases-clm-8b-an-open-system-one-model-that-scores-agent-actions-up-to-9x-faster-than-jev) · [AIHOT](https://aihot.news/items/cmuf3bxxo08ubrood3j8q8lrn)

Source publication: 2026-09-24T05:27:41.000Z

Contrastive-LM 发布开放模型 CLM-8B，首个对比语言模型（CLM），不为生成文本而训练，而是对候选动作按当前状态打分并返回概率，主打与 TypeSafe AI 的 System One 模型 Jev 相同的接口。

## ElevenLabs 实时情绪分析

[Summary page \(en\)](https://awesomejev.cc/news/cmuf20swz07agroodkchdzy1v) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuf20swz07agroodkchdzy1v) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuf20swz07agroodkchdzy1v)

[@typesafeai](https://x.com/typesafeai/status/2102979122964406712) · [AIHOT](https://aihot.news/items/cmuf20swz07agroodkchdzy1v)

Source publication: 2026-09-24T04:31:09.000Z

这可不只是转录分析，快交出你的秘密！马上就去玩玩 @ElevenLabsDevs 上线的实时版本 \[引用 @ElevenLabsDevs\]：Jev 与 ElevenLabs 带来的实时情绪分析。 通话者还在说话时，每个短语就已染上它所承载情绪的颜色。右侧六个仪表实时追踪通话的情绪。

## LLM 蒸馏 Jev 之类

[Summary page \(en\)](https://awesomejev.cc/news/cmuezvoo304uvroodxv2i3pft) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuezvoo304uvroodxv2i3pft) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuezvoo304uvroodxv2i3pft)

[@typesafeai](https://x.com/typesafeai/status/2102965218720756045) · [AIHOT](https://aihot.news/items/cmuezvoo304uvroodxv2i3pft)

Source publication: 2026-09-24T03:35:54.000Z

LLM 蒸馏 Jev 之类

## OpenClaw 2026.9.6 发布

[Summary page \(en\)](https://awesomejev.cc/news/cmuez2jrq041aroodhes2mly9) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuez2jrq041aroodhes2mly9) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuez2jrq041aroodhes2mly9)

[X：OpenClaw \(@openclaw\)](https://x.com/openclaw/status/2102955928693989413) · [AIHOT](https://aihot.news/items/cmuez2jrq041aroodhes2mly9)

Source publication: 2026-09-24T02:58:59.000Z

OpenClaw 2026.9.6 🦞 🤖 Opus 5.5、GPT-6 Sol/Luna、Grok 4.7 🔧 托管更新 🧵 重启恢复 📊 30 天用量 🐙 GitHub 阅读器 💻 远程文件、记忆与技能 📝 实时会议记录 🧠 Jev + 决策模型 2,614 PRs · 351 位贡献者 · 更多内容 ↓ https://docs.openclaw.ai/releases/2026.9.6

## JEV 让 LLM 推理实现即时反馈

[Summary page \(en\)](https://awesomejev.cc/news/cmuexqizy03aoroowri5o5yc4) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuexqizy03aoroowri5o5yc4) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuexqizy03aoroowri5o5yc4)

[@typesafeai](https://x.com/typesafeai/status/2102950669858767194) · [AIHOT](https://aihot.news/items/cmuexqizy03aoroowri5o5yc4)

Source publication: 2026-09-24T02:38:05.000Z

JEV 将通用语义推理引入判别式推理范式，实现任意上下文输入、校准结构化决策输出。在 JEV + Perfectly 的示例中，用复杂查询从 500 位 ECCV 2026 研究者的论文中理解 AI 研究者，性能达到 Claude 某模型同等水平。

## Jev 作 Judge 做智能体评估，低置信度升级到前沿模型

[Summary page \(en\)](https://awesomejev.cc/news/cmuev7lmz04fyroyqopvgqwkm) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuev7lmz04fyroyqopvgqwkm) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuev7lmz04fyroyqopvgqwkm)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2102934356108972278) · [AIHOT](https://aihot.news/items/cmuev7lmz04fyroyqopvgqwkm)

Source publication: 2026-09-24T01:33:15.000Z

Elvis Saravia 提出用 Jev-as-a-Judge 做智能体评估，认为这是目前最惊艳的 Jev 用例之一。他的早期测试指向一套兼顾准确率与成本的优化流程：高置信度场景用 Jev，低置信度判定则升级到前沿模型（GPT-6 或 Opus 5.5）。他强调 Jev 并非处处适用，前沿模型也不该包揽所有评估，完整指南即将发布。

## ClawCast 迎来 Allie 做客 Discord

[Summary page \(en\)](https://awesomejev.cc/news/cmueurtqk03slroyq3uvmsq6a) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmueurtqk03slroyq3uvmsq6a) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmueurtqk03slroyq3uvmsq6a)

[X：Peter Steinberger \(@steipete\)](https://x.com/steipete/status/2102839395766472969) · [AIHOT](https://aihot.news/items/cmueurtqk03slroyq3uvmsq6a)

Source publication: 2026-09-23T19:15:55.000Z

太酷了，@allietheicon（来自 Jev/TypeSafe）加入了我们在 Discord 上的 ClawCast！https://discord.com/invite/clawd

## TypeSafe AI 的 System One 模型 Jev 编程指南：类型化决策、置信度与投机式批量提问

[Summary page \(en\)](https://awesomejev.cc/news/cmuetoik404c4rohbioiq18ye) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuetoik404c4rohbioiq18ye) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuetoik404c4rohbioiq18ye)

[MarkTechPost（RSS）](https://www.marktechpost.com/2026/09/23/a-coding-guide-to-typesafe-ai-jev) · [AIHOT](https://aihot.news/items/cmuetoik404c4rohbioiq18ye)

Source publication: 2026-09-24T00:53:09.000Z

这篇教程演示 TypeSafe AI 的首个 System One 模型 Jev 的用法，该模型不生成文本，而是对程序状态返回 Choice、Score、Noul 三种类型化判断供代码直接分支。

## Jev模型生态系统数据分析研究

[Summary page \(en\)](https://awesomejev.cc/news/gdixx5lv54xep7bno51l7wceq) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/gdixx5lv54xep7bno51l7wceq) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/gdixx5lv54xep7bno51l7wceq)

[HuggingFace Daily Papers（社区热门论文）](https://arxiv.org/abs/2609.30216) · [AIHOT](https://aihot.news/items/gdixx5lv54xep7bno51l7wceq)

Source publication: 2026-09-24T00:00:00.000Z

该研究对GitHub上2170个公开Jev项目进行了大规模数据分析，探讨Jev这一低成本决策模型在自然语言问答、二元判断和评分等场景中的应用。研究发现Jev作为可复用决策组件，其功能随工作流变化，且公众关注度集中在路由和接口代理，而非项目数量本身。

## Modal 与 CMU 推出 Quail：联合优化查询规划器与推理引擎，加速 AI-SQL

[Summary page \(en\)](https://awesomejev.cc/news/cmuiz28lz0eusrohy07p4mcvt) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuiz28lz0eusrohy07p4mcvt) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuiz28lz0eusrohy07p4mcvt)

[Modal 官方工程博客（RSS）](https://modal.com/blog/quail-billion-tpm) · [AIHOT](https://aihot.news/items/cmuiz28lz0eusrohy07p4mcvt)

Source publication: 2026-09-24T00:00:00.000Z

Modal 与 CMU Full Stack Data Lab 联合推出查询感知推理层 Quail，通过联合优化查询规划器与推理引擎加速 AI-SQL 查询。在某个多表连接查询上，Quail 单张 H100 GPU 每分钟处理超 10 亿 token，比同硬件 vLLM 基线快 10 倍以上，Modal 上成本低于每 10 亿 token 6 美分。

## Jev AI 模型引关注

[Summary page \(en\)](https://awesomejev.cc/news/cmueq8e9n0f7troyno9saf9wp) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmueq8e9n0f7troyno9saf9wp) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmueq8e9n0f7troyno9saf9wp)

[@typesafeai](https://x.com/typesafeai/status/2102900621284417806) · [AIHOT](https://aihot.news/items/cmueq8e9n0f7troyno9saf9wp)

Source publication: 2026-09-23T23:19:12.000Z

人人都想知道 Jev 是什么，却没人问 Jev 过得怎么样 https://en.wikipedia.org/wiki/Jev\_\(AI\_model\)

## 如何在 Together 平台上用 17 美元训练自己的 Jev 分类器

[Summary page \(en\)](https://awesomejev.cc/news/cmueopn2p0du2royney9xs03m) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmueopn2p0du2royney9xs03m) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmueopn2p0du2royney9xs03m)

[Together AI 研究与产品博客（RSS）](https://www.together.ai/blog/how-to-train-your-own-jev) · [AIHOT](https://aihot.news/items/cmueopn2p0du2royney9xs03m)

Source publication: 2026-09-23T00:00:00.000Z

Together AI 在 Qwen3.5 4B 基础上推出 Jev 类分类器 together/Tev1-4B-experimental，已上线其 serverless 平台。该博客展示了如何以 17 美元微调出自己的版本。

## Jev+Treg 打造智能体版 Clay 人物搜索

[Summary page \(en\)](https://awesomejev.cc/news/cmueki1qb05rlroyn4k2zk1q2) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmueki1qb05rlroyn4k2zk1q2) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmueki1qb05rlroyn4k2zk1q2)

[X：Rohan Paul \(@rohanpaul\_ai\)](https://x.com/rohanpaul_ai/status/2102859958039777717) · [AIHOT](https://aihot.news/items/cmueki1qb05rlroyn4k2zk1q2)

Source publication: 2026-09-23T20:37:37.000Z

Treg 联合 Jev 推出面向 AI 智能体的开源人物搜索工具，可跨 60+ 数据源检索线索，每条线索仅 $0.0089，比 Clay 便宜 85%，并在人物搜索基准上排名第一。Jev 作为决策模型对候选线索按角色、公司等标准打分，返回结构化概率而非生成文本，可插件式接入任意智能体。

## TypeSafe 决策模型 Jev 使用教程：用 TypeScript 在 OpenRouter 上实现市场商品审核

[Summary page \(en\)](https://awesomejev.cc/news/cmuek20s205hkroynl449lqr2) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuek20s205hkroynl449lqr2) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuek20s205hkroynl449lqr2)

[OpenRouter：Announcements（RSS）](https://openrouter.ai/blog/tutorials/how-to-use-jev) · [AIHOT](https://aihot.news/items/cmuek20s205hkroynl449lqr2)

Source publication: 2026-09-23T00:00:00.000Z

OpenRouter 发布 Jev 使用教程，Jev 是 TypeSafe 推出的决策模型（模型 ID typesafe/jev-1.13），通过 OpenRouter Decisions API 接收 state 和问题，返回带概率的类型化答案而非生成文本。

## 如何充分利用 Jev：分类模型、Jev 检查与意图驱动软件

[Summary page \(en\)](https://awesomejev.cc/news/cmuejn95f04vqroynypfjn7jh) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuejn95f04vqroynypfjn7jh) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuejn95f04vqroynypfjn7jh)

[Every：最新文章（网页）](https://every.to/context-window/how-to-get-the-most-out-of-jev) · [AIHOT](https://aihot.news/items/cmuejn95f04vqroynypfjn7jh)

Source publication: 2026-09-22T16:00:00.000Z

Jev 的分类模型正在刷屏时间线，文章介绍如何把主观问题转化为 Jev 检查，并探讨意图驱动软件的到来。

## Rick and Morty 讲透 Jev AI

[Summary page \(en\)](https://awesomejev.cc/news/cmueho4yn065rrovx7uqxb1ce) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmueho4yn065rrovx7uqxb1ce) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmueho4yn065rrovx7uqxb1ce)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2102840267007205630) · [AIHOT](https://aihot.news/items/cmueho4yn065rrovx7uqxb1ce)

Source publication: 2026-09-23T19:19:23.000Z

天哪——这该不会本该是我们的发布视频吧？🥹 \[引用 @princedoesai\]：天哪。 Rick and Morty 给我讲 Jev AI，比任何技术演示都讲得清楚。

## Kev-4B 上线硅基流动

[Summary page \(en\)](https://awesomejev.cc/news/cmuec3fqj0v44roghe38ned3r) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuec3fqj0v44roghe38ned3r) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuec3fqj0v44roghe38ned3r)

[X：硅基流动 SiliconFlow \(@SiliconFlowAI\)](https://x.com/SiliconFlowAI/status/2102794117977903544) · [AIHOT](https://aihot.news/items/cmuec3fqj0v44roghe38ned3r)

Source publication: 2026-09-23T16:16:00.000Z

不是每次模型调用都需要一个答案。有时，它只需要一个决策。👏 欢迎 Kev-4B 加入硅基流动。Kev-4B 是 Jev 的开源社区版，基于 Qwen3.5-4B 构建，用于结构化决策。路由。排序。审批。升级——无需再生成一段回复。无需部署或适配。一个硅基流动 API key，Kev 即可接入你的工作流。特别感谢 @jaredpalmer 开源 Kev。❤️ 在硅基流动上试用 Kev-4B。⚡️

## 玉伯谈 Jev 模型：系统一模型才刚开始

[Summary page \(en\)](https://awesomejev.cc/news/cmue8ofzm0r6uroghhbx42nhf) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmue8ofzm0r6uroghhbx42nhf) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmue8ofzm0r6uroghhbx42nhf)

[X：Frank Wang 玉伯 \(@lifesinger\)](https://x.com/lifesinger/status/2102772248985870349) · [AIHOT](https://aihot.news/items/cmue8ofzm0r6uroghhbx42nhf)

Source publication: 2026-09-23T14:49:06.000Z

玉伯称这是他见过关于 Jev 最浅入深出的一篇文章，印象最深的点包括：模型该给代码用还是给人用、为什么在 OpenAI 做不出来、什么是杰文斯悖论、不看公开榜单而看内部工作流、用户数据没用、老看 PMF 容易扼杀创新。他还提到借助 Jev 这类模型 SaaS 有大机会，并把 Jev 定义为"系统一模型"，认为系统一模型才刚刚开始，同时表示不看好 neo lab。

## 用 Jev 和 Pi 构建自定义 harness 的思路

[Summary page \(en\)](https://awesomejev.cc/news/cmue7msqq0q1kroghdvw8fr7b) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmue7msqq0q1kroghdvw8fr7b) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmue7msqq0q1kroghdvw8fr7b)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2102763652101161232) · [AIHOT](https://aihot.news/items/cmue7msqq0q1kroghdvw8fr7b)

Source publication: 2026-09-23T14:14:56.000Z

刚刚发布了一些关于使用 Jev 和 Pi 构建自定义 harness 的思路。 这是系列的第一篇。 其中一些思路包括 gates、routing 和 verifiers。 但在后续文章中，我计划更深入地探讨更新的思路，并对成本和效率进行基准测试。

## InstructGPT 前成员 Diogo Almeida 谈离开 OpenAI 与不聊天模型 Jev 的由来

[Summary page \(en\)](https://awesomejev.cc/news/cmue7lu9z0q15rogh48n8uirl) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmue7lu9z0q15rogh48n8uirl) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmue7lu9z0q15rogh48n8uirl)

[X：Frank Wang 玉伯 \(@lifesinger\)](https://x.com/lifesinger/status/2102764610109813192) · [AIHOT](https://aihot.news/items/cmue7lu9z0q15rogh48n8uirl)

Source publication: 2026-09-23T14:18:45.000Z

TypeSafe 联合创始人兼 CEO Diogo Almeida 在 Latent Space 访谈中讲述其离开 OpenAI 的经历，他参与过 InstructGPT 和 RLHF 早期工作，但认为优化方向过度面向人而公司难以转向为代码服务的智能，遂创业开发非聊天的大 型可编程模型 Jev（System One）。

## 用 Pi 和 Jev 构建自定义 harness

[Summary page \(en\)](https://awesomejev.cc/news/cmue78fh50prkrogh123f0smh) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmue78fh50prkrogh123f0smh) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmue78fh50prkrogh123f0smh)

[X：DAIR.AI \(@dair\_ai\)](https://x.com/dair_ai/status/2102762841698898127) · [AIHOT](https://aihot.news/items/cmue78fh50prkrogh123f0smh)

Source publication: 2026-09-23T14:11:43.000Z

学习用 Pi 和 Jev 构建自定义 harness。 附带一个交互式 playground 来测试该 harness。 https://x.com/omarsar0/status/2102762406204076532?s=20

## 如何用 Pi SDK 和 Jev 构建自定义 Agent harness

[Summary page \(en\)](https://awesomejev.cc/news/cmue6k79h0oruroghf3cfe87j) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmue6k79h0oruroghf3cfe87j) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmue6k79h0oruroghf3cfe87j)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2102762406204076532) · [AIHOT](https://aihot.news/items/cmue6k79h0oruroghf3cfe87j)

Source publication: 2026-09-23T14:09:59.000Z

作者发布交互式教程，演示用 Pi SDK（TypeScript Agent 工具包）和 TypeSafe AI 的小模型 Jev 构建自定义 Agent harness。

## JEV-as-a-Judge：置信时接受，不确定时升级

[Summary page \(en\)](https://awesomejev.cc/news/cmue2hf6w0k6lrogh323szven) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmue2hf6w0k6lrogh323szven) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmue2hf6w0k6lrogh323szven)

[HuggingFace Daily Papers（社区热门论文）](https://arxiv.org/abs/2609.26550) · [AIHOT](https://aihot.news/items/cmue2hf6w0k6lrogh323szven)

Source publication: 2026-09-22T00:00:00.000Z

JEV-as-a-Judge 用仅做决策的评审模型做低成本初筛，在普通偏好与证据支撑的事实性任务上，与最强对比的 SOTA LLM 评审差距在 3 个百分点以内，费用仅为其 0.36%。当判断需要检查推导过程或抵御精心编写的错误答案时，差距会扩大，且 JEV 与对比模型的差距集中在低置信度决策上。一个冻结的级联流程接受高置信度判定、升级不确定判定，以更低成本保留了对比模型 99% 的准确率。

## 用25行Python代码实现Jev：一个本地运行的分类概率模型

[Summary page \(en\)](https://awesomejev.cc/news/cmudxd6qk0b8crogh5aduuxxe) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmudxd6qk0b8crogh5aduuxxe) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmudxd6qk0b8crogh5aduuxxe)

[Hacker News 热门（buzzing.cc 中文翻译）](https://www.nobodywho.ai/posts/jev-in-25-lines) · [AIHOT](https://aihot.news/items/cmudxd6qk0b8crogh5aduuxxe)

Source publication: 2026-09-23T09:18:26.848Z

有人用25行Python代码复现了Jev：加载Qwen3-0.6B-GGUF模型，对提示词中的选项标签取logits并归一化为概率，示例中"Phishing"概率达0.885。作者称Jev本质是接收带选项的提示词并输出概率的分类器，速度快、本地运行、数据不外传。该文为戏仿博客，作者同时给出OpenJev等更完整的开源实现链接。

## 用 25 行 Python 实现 Jev：一个本地运行的分类概率模型

[Summary page \(en\)](https://awesomejev.cc/news/cmuduxq5808mnroghv31b4dqf) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuduxq5808mnroghv31b4dqf) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuduxq5808mnroghv31b4dqf)

[Hacker News：AI 热帖](https://www.nobodywho.ai/posts/jev-in-25-lines) · [AIHOT](https://aihot.news/items/cmuduxq5808mnroghv31b4dqf)

Source publication: 2026-09-23T07:26:23.000Z

有人用 25 行 Python 代码复现了 Jev：加载 Qwen3-0.6B-GGUF 模型，对邮件分类任务输出 Legitimate、Spam、Phishing 三个选项的概率，示例中 Phishing 概率为 0.885。作者称这是恶搞博文，强调它不调用 API、不训练模型，只是本地快速分类，并推荐了 OpenJev 等更完整的开源实现。

## JevBench v1.4.1 发布：面向类型化决策模型的可重复基准测试

[Summary page \(en\)](https://awesomejev.cc/news/cmudu5ho307q5roghwle4c3sr) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmudu5ho307q5roghwle4c3sr) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmudu5ho307q5roghwle4c3sr)

[Hacker News 热门（buzzing.cc 中文翻译）](https://benchmarkheaven.com/jev-models) · [AIHOT](https://aihot.news/items/cmudu5ho307q5roghwle4c3sr)

Source publication: 2026-09-23T08:00:24.141Z

JevBench v1.4.1 发布，这是 Benchmark Heaven 面向 Jev 类决策模型的可重复基准，输入状态与有界评分标准、输出类型化答案，基于 534 个公开加 308 个密封决策、协议 jevbench::v1.4 评分。榜单共 77 个系统，Jev 1.13.0 以 77 分居首，JevK5 v0.2.0 与 Hopper 分列二、三。

## Nokia 开源 AnyJev：无需训练将开放 LLM 变成校准决策模型

[Summary page \(en\)](https://awesomejev.cc/news/cmuds094r05cdroghwwmmc65a) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuds094r05cdroghwwmmc65a) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuds094r05cdroghwwmmc65a)

[MarkTechPost（RSS）](https://www.marktechpost.com/2026/09/23/nokia-open-sources-anyjev-a-training-free-layer-that-turns-any-open-llm-into-a-calibrated-decision-model) · [AIHOT](https://aihot.news/items/cmuds094r05cdroghwwmmc65a)

Source publication: 2026-09-23T07:09:38.000Z

Nokia 应用研究团队开源 AnyJev，一个 Python 库，无需训练即可把开放 LLM 变成可输出概率的决策模型，接口借鉴 TypeSafe AI 于 2026 年 9 月发布的 Jev。

## 豆包工作 /plan 与 /goal 功能获好评

[Summary page \(en\)](https://awesomejev.cc/news/cmudqgjcd0ogtrogg2y2d6c5p) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmudqgjcd0ogtrogg2y2d6c5p) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmudqgjcd0ogtrogg2y2d6c5p)

[X：马东锡 NLP \(@dongxi\_nlp\)](https://x.com/dongxi_nlp/status/2102647304264298856) · [AIHOT](https://aihot.news/items/cmudqgjcd0ogtrogg2y2d6c5p)

Source publication: 2026-09-23T06:32:37.000Z

用户用豆包工作的 /plan、/goal 及任务队列功能完成 40 份关于 Jev 的研究文件，并整理成五主题知识库和研究观察站。该用户称这些功能非常好用，并为字节团队点赞。

## Jev 实现动态 UI 文本框

[Summary page \(en\)](https://awesomejev.cc/news/cmudnnjbe0hporogggdm18xlz) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmudnnjbe0hporogggdm18xlz) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmudnnjbe0hporogggdm18xlz)

[@typesafeai](https://x.com/typesafeai/status/2102628596879880649) · [AIHOT](https://aihot.news/items/cmudnnjbe0hporogggdm18xlz)

Source publication: 2026-09-23T05:18:17.000Z

应用的动态 UI 是著名的坟场，至少对 PM 来说是这样，甚至对整个产品和公司也是如此。如果真有这么简单呢？Jev 正在做这件事。

## PostHog 玩梗 jev 引共鸣

[Summary page \(en\)](https://awesomejev.cc/news/cmudmkxva0gi5rogg2wox5yov) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmudmkxva0gi5rogg2wox5yov) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmudmkxva0gi5rogg2wox5yov)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2102616999318958145) · [AIHOT](https://aihot.news/items/cmudmkxva0gi5rogg2wox5yov)

Source publication: 2026-09-23T04:32:12.000Z

posthog 拿 jev 玩梗，感觉就像当年《南方公园》里出现 ChatGPT 那会儿 🥹

## 用豆包工作研究 Jev：从模型判断到软件决策

[Summary page \(en\)](https://awesomejev.cc/news/cmudm693b0g1xrogg6sqibgzb) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmudm693b0g1xrogg6sqibgzb) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmudm693b0g1xrogg6sqibgzb)

[X：马东锡 NLP \(@dongxi\_nlp\)](https://x.com/dongxi_nlp/status/2102615749663531012) · [AIHOT](https://aihot.news/items/cmudm693b0g1xrogg6sqibgzb)

Source publication: 2026-09-23T04:27:14.000Z

作者用豆包工作的计划模式、目标模式和任务队列完成对 Jev 的研究，产出五主题知识库、24 项声明核查记录和可点回证据的研究观察站。Jev 由 TypeSafe 发布，厂商报告 193.6 倍速度和 444.6 倍成本优势；独立早期测试中 24 份挪威语文档中位延迟 0.32 秒，加入限定词后 ECE 从 0.040 升至 0.116。

## JEV 分类器意外发现家庭 WiFi 后门

[Summary page \(en\)](https://awesomejev.cc/news/cmud7kt5r05bqrorax1pr87nc) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmud7kt5r05bqrorax1pr87nc) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmud7kt5r05bqrorax1pr87nc)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2102513797441462513) · [AIHOT](https://aihot.news/items/cmud7kt5r05bqrorax1pr87nc)

Source publication: 2026-09-22T21:42:06.000Z

用户用 @typesafeai 的 JEV 驱动分类器分析 Wireshark 抓取的网络数据包，意外发现家庭 WiFi 网络中的后门威胁，经前沿 AI 模型验证后重置设备并加固网络。该网络数据包分析工具即将开源。主推文以"做得智能又便宜、铺得到处都是"概括 JEV 的路线，并称之为"jevon's paradox"。

## Metaview 全线接入 typesafe 的 jev，搜索提速约 10 倍

[Summary page \(en\)](https://awesomejev.cc/news/cmud7kt5r05bprorasrihdvn3) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmud7kt5r05bprorasrihdvn3) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmud7kt5r05bprorasrihdvn3)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2102515801421185267) · [AIHOT](https://aihot.news/items/cmud7kt5r05bprorasrihdvn3)

Source publication: 2026-09-22T21:50:04.000Z

MetaviewAI 上周末将 typesafeai 的 jev 接入其所有 agent，候选人搜索从数分钟缩短到数秒，准确率不变、约快 10 倍，且每次搜索成本明显更低。jev 让团队把智能当作软件来构建：将每个 agent 拆成最小语义单元、逐个查询、自设阈值，并通过新增问题而非修改系统提示词来修 bug。

## OpenClaw 核心支持决策模型

[Summary page \(en\)](https://awesomejev.cc/news/cmud4mk4803m4roa91kt0er0t) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmud4mk4803m4roa91kt0er0t) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmud4mk4803m4roa91kt0er0t)

[X：OpenClaw \(@openclaw\)](https://x.com/openclaw/status/2102488199486656862) · [AIHOT](https://aihot.news/items/cmud4mk4803m4roa91kt0er0t)

Source publication: 2026-09-22T20:00:23.000Z

一切都在往 Jev 的方向发展！ 上周 @jlehman\_ 为 OpenClaw 核心和插件推送了决策模型支持 了解我们如何思考使用它们，以及你如何用这个强大的新工具让 OpenClaw 变得更好！ https://openclaw.ai/blog/decision-models-in-openclaw

## Paradigm Frontiers 活动预告：CompleteSkeptic 任嘉宾

[Summary page \(en\)](https://awesomejev.cc/news/cmud4d3n405lwrov66q7uhqmh) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmud4d3n405lwrov66q7uhqmh) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmud4d3n405lwrov66q7uhqmh)

[@typesafeai](https://x.com/typesafeai/status/2102488989983015332) · [AIHOT](https://aihot.news/items/cmud4d3n405lwrov66q7uhqmh)

Source publication: 2026-09-22T20:03:32.000Z

Paradigm Frontiers 活动宣布 @CompleteSkeptic 将作为特别嘉宾出席，活动时间为 10 月 12-14 日，地点在旧金山 Fort Mason，申请本周截止。主推文称近期进展超出预期，并预告几周后 Paradigm Frontiers 将有新内容发布。

## Pydantic AI 智能体现已运行于 Jev

[Summary page \(en\)](https://awesomejev.cc/news/cmud3aitp04aprov6dvqb2dyg) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmud3aitp04aprov6dvqb2dyg) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmud3aitp04aprov6dvqb2dyg)

[@typesafeai](https://x.com/typesafeai/status/2102483632585920833) · [AIHOT](https://aihot.news/items/cmud3aitp04aprov6dvqb2dyg)

Source publication: 2026-09-22T19:42:14.000Z

@pydantic 从一开始就是类型安全的！现在由 Jev 驱动你的 Pydantic AI 智能体调用，返回速度比以往更快 ⚡️⚡️ Pydantic AI 智能体现已运行于 Jev，这是来自 @typesafeai 的分类器。 Jev 不生成文本，它回答带类型的问题。所以你已写好的 output\_type 就是问题，答案会以你的模型形式返回，每个字段一个置信度。 https://pydantic.io/8iAZ9

## JEV 驱动分类器意外发现家庭 WiFi 后门

[Summary page \(en\)](https://awesomejev.cc/news/cmud3aitp04aorov6u4cc6gkk) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmud3aitp04aorov6u4cc6gkk) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmud3aitp04aorov6u4cc6gkk)

[@typesafeai](https://x.com/typesafeai/status/2102484110363275374) · [AIHOT](https://aihot.news/items/cmud3aitp04aorov6u4cc6gkk)

Source publication: 2026-09-22T19:44:08.000Z

开发者用 JEV 驱动的分类器分析 Wireshark 抓取的家庭 WiFi 网络数据包，意外发现严重威胁，经前沿 AI 模型验证后确认，最终重置设备并加固网络。该网络数据包分析工具即将开源。

## Jev 专题：AI That Works 第75期

[Summary page \(en\)](https://awesomejev.cc/news/cmucyoyj20537ronirfgez60t) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmucyoyj20537ronirfgez60t) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmucyoyj20537ronirfgez60t)

[X：Dex Horthy（HumanLayer）\(@dexhorthy\)](https://x.com/dexhorthy/status/2102447433603313813) · [AIHOT](https://aihot.news/items/cmucyoyj20537ronirfgez60t)

Source publication: 2026-09-22T17:18:24.000Z

关于 Jev 的一切：🦄 AI That Works \#75 https://x.com/i/broadcasts/1qJVmyramPAGB

## OpenRouter 实测 Jev 1.13 与 Claude Opus 5 在 Banking77 分类任务上的准确率、延迟与成本

[Summary page \(en\)](https://awesomejev.cc/news/cmucxyky704ftronibjzp4dos) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmucxyky704ftronibjzp4dos) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmucxyky704ftronibjzp4dos)

[OpenRouter：Announcements（RSS）](https://openrouter.ai/blog/insights/jev-vs-claude-opus-5-classification) · [AIHOT](https://aihot.news/items/cmucxyky704ftronibjzp4dos)

Source publication: 2026-09-22T00:00:00.000Z

OpenRouter 用 Banking77 测试集的 3,080 条客服语料对比 Jev 1.13 与 Claude Opus 5 的意图分类表现。Jev 准确率 81.0% 比 Opus 的 84.4% 低 3.3 个百分点，但中位延迟 175 ms 约为 Opus（2,266 ms）的 1/13，每千次请求成本 $0.11 对 $2.42（启用提示词缓存）。

## Simon Willison 发布 llm-typesafe 0.1a0，为 LLM 插件接入 TypeSafe AI 的 Jev 模型

[Summary page \(en\)](https://awesomejev.cc/news/cmucxdnhr0saxroedzl8k4p57) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmucxdnhr0saxroedzl8k4p57) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmucxdnhr0saxroedzl8k4p57)

[Simon Willison 博客](https://simonwillison.net/2026/Sep/22/llm-typesafe) · [AIHOT](https://aihot.news/items/cmucxdnhr0saxroedzl8k4p57)

Source publication: 2026-09-22T15:54:16.000Z

Simon Willison 发布 LLM 插件 llm-typesafe 0.1a0，为 TypeSafe AI 的新模型 Jev 提供支持，可通过 \`llm install llm-typesafe\` 安装并设置 API key。该插件支持 yes/no、choice 和 score 三类提问，例如 noul 问题返回 \`{"type": "noul", "noul": 0.99}\`。

## 分析认为 OpenAI 具备快速跟进 TypeSafe 的 Jev 并将分类能力内嵌进模型的优势

[Summary page \(en\)](https://awesomejev.cc/news/cmucwvmws0ronroedd6u1rmzw) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmucwvmws0ronroedd6u1rmzw) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmucwvmws0ronroedd6u1rmzw)

[Hacker News 热门（buzzing.cc 中文翻译）](https://arcturus-labs.com/blog/2026/09/21/will-openai-eat-jevs-lunch) · [AIHOT](https://aihot.news/items/cmucwvmws0ronroedd6u1rmzw)

Source publication: 2026-09-22T16:37:52.173Z

作者分析 TypeSafe 的 Jev 本质上是基于常规 LLM 的 logprobs 做通用分类，OpenAI 多年来已在工具调用中用单个 token 充当微型分类器，具备快速复制 Jev 并把分类能力折叠进自家模型和智能体的条件。

## OpenRouter 用 Jev 自动分类 LLM 请求

[Summary page \(en\)](https://awesomejev.cc/news/cmucu8im70omcroedhbgu1l65) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmucu8im70omcroedhbgu1l65) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmucu8im70omcroedhbgu1l65)

[X：OpenRouter \(@OpenRouter\)](https://x.com/OpenRouter/status/2102418328979435759) · [AIHOT](https://aihot.news/items/cmucu8im70omcroedhbgu1l65)

Source publication: 2026-09-22T15:22:45.000Z

提示：使用 @typesafeai 的 Jev，通过 Classifiers 自动分类你的 LLM 请求：https://openrouter.ai/workspaces/default/classifiers 随后你可以在 Explore 中分析结果：https://openrouter.ai/activity/explore

## OpenRouter：Jev 上线带动新用户

[Summary page \(en\)](https://awesomejev.cc/news/cmucmqmro0fn6roeds7hlnajz) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmucmqmro0fn6roeds7hlnajz) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmucmqmro0fn6roeds7hlnajz)

[X：OpenRouter \(@OpenRouter\)](https://x.com/OpenRouter/status/2102367448586744127) · [AIHOT](https://aihot.news/items/cmucmqmro0fn6roeds7hlnajz)

Source publication: 2026-09-22T12:00:34.000Z

问：哪些模型受 Jev 到来的影响最大？ 答：许多实验室的 flash 版本模型。 另外：OpenRouter 上近一半的 Jev 用户在前一周还没用过任何模型。这次发布激起了足够的兴趣，把他们从场边拉了进来。

## 在人类璀璨的艺术中遨游，如此美妙，谢谢 Jev

[Summary page \(en\)](https://awesomejev.cc/news/cmucjlc6c08mlroed188c42wi) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmucjlc6c08mlroed188c42wi) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmucjlc6c08mlroed188c42wi)

[X：ZHO \(@ZHO\_ZHO\_ZHO\)](https://x.com/ZHO_ZHO_ZHO/status/2102347016840028273) · [AIHOT](https://aihot.news/items/cmucjlc6c08mlroed188c42wi)

Source publication: 2026-09-22T10:39:23.000Z

在人类璀璨的艺术中遨游，如此美妙，谢谢 Jev \[引用 @ZHO\_ZHO\_ZHO\]：Jev 正在疯狂工作（视频未加速

## Jev 搭配 Exa 联网搜索效果惊人

[Summary page \(en\)](https://awesomejev.cc/news/cmucci2d6038iroij2viijgon) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmucci2d6038iroij2viijgon) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmucci2d6038iroij2viijgon)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2102294042185023816) · [AIHOT](https://aihot.news/items/cmucci2d6038iroij2viijgon)

Source publication: 2026-09-22T07:08:53.000Z

这是真的吗？还是夸张了？（抱歉） \[引用 @TheIshanGoswami\]：Jev 搭配 Exa 简直离谱。 &amp;gt; Jev 不用联网搜索时会自信地给出错误输出 &amp;gt; Jev 用上联网搜索后准确率真的高很多 免费试用 Jev（搭配 Exa 联网搜索）👇

## Jev 因需求激增暂停新用户注册

[Summary page \(en\)](https://awesomejev.cc/news/cmucbfeut0kharots3wf2bnef) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmucbfeut0kharots3wf2bnef) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmucbfeut0kharots3wf2bnef)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2102282924699840980) · [AIHOT](https://aihot.news/items/cmucbfeut0kharots3wf2bnef)

Source publication: 2026-09-22T06:24:42.000Z

AI 产品 Jev 因需求激增已暂停新用户注册，现有用户服务不受影响。官方称此举是为保障现有用户的服务质量，同时让团队得以休息，并将尽快恢复开放注册。

## Jev 因需求激增暂停注册

[Summary page \(en\)](https://awesomejev.cc/news/cmucacvms0jherotsh8pnnrjn) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmucacvms0jherotsh8pnnrjn) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmucacvms0jherotsh8pnnrjn)

[@typesafeai](https://x.com/typesafeai/status/2102281508950307159) · [AIHOT](https://aihot.news/items/cmucacvms0jherotsh8pnnrjn)

Source publication: 2026-09-22T06:19:04.000Z

我们看到了极其巨大的需求涌入，不得不暂时暂停 Jev 的注册。我们需要确保现有注册用户的服务质量，他们的服务将继续正常运行。我们正在努力尽快让所有人都能开放使用 Jev。谢谢。

## Jev-Mem：用 System-One 控制平面打造高效 AI 智能体记忆架构

[Summary page \(en\)](https://awesomejev.cc/news/cmuc5srxo0abfrots6ur78l90) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuc5srxo0abfrots6ur78l90) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuc5srxo0abfrots6ur78l90)

[HuggingFace Daily Papers（社区热门论文）](https://arxiv.org/abs/2609.23986) · [AIHOT](https://aihot.news/items/cmuc5srxo0abfrots6ur78l90)

Source publication: 2026-09-21T00:00:00.000Z

Jev-Mem 是一种受 System-One/System-Two 认知启发的新型智能体记忆架构，通过专用 System-One 控制平面在构建阶段管理记忆类型与关系组织，并在检索时动态完成查询路由、检索预算分配、图遍历、候选打分与自适应停止，System-Two 仅用于复杂推理与答案合成。

## TypeSafe Jev 接入 MotherDuck，文本分类快 50 倍

[Summary page \(en\)](https://awesomejev.cc/news/cmuc0pmoe04g1rots1wchwbmo) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuc0pmoe04g1rots1wchwbmo) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuc0pmoe04g1rots1wchwbmo)

[@typesafeai](https://x.com/typesafeai/status/2102206611024716181) · [AIHOT](https://aihot.news/items/cmuc0pmoe04g1rots1wchwbmo)

Source publication: 2026-09-22T01:21:27.000Z

TypeSafe 新模型 Jev 以 SQL 函数 prompt\_jev\(\) 接入 MotherDuck，文本分类速度提升约 50 倍、成本降至约 1%。10 万行数据仅需 40 秒、花费 $0.50，达到前沿 LLM 准确率，而 LLM 方案耗时 32 分钟、花费 $37。

## BestBlogs 早报：Jev 决策模型与 Warp 软件工厂

[Summary page \(en\)](https://awesomejev.cc/news/cmuby5qr404jsro9irkni3knk) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuby5qr404jsro9irkni3knk) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuby5qr404jsro9irkni3knk)

[X：洪明 \(@hongming731\)](https://x.com/hongming731/status/2102192210318164301) · [AIHOT](https://aihot.news/items/cmuby5qr404jsro9irkni3knk)

Source publication: 2026-09-22T00:24:14.000Z

TypeSafe AI CEO 在 Latent.Space 访谈中介绍 Jev——面向软件控制流的 System One 模型，采用 RLCD（强化学习校准决策）训练，追求概率与实际信息相称，相关方法尚未公开发表。

## BestBlogs 早报：Jev 模型与 AI 软件工厂实践

[Summary page \(en\)](https://awesomejev.cc/news/cmuby5qr404jrro9iyb3bpyrm) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuby5qr404jrro9iyb3bpyrm) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuby5qr404jrro9iyb3bpyrm)

[X：洪明 \(@hongming731\)](https://x.com/hongming731/status/2102192282367914319) · [AIHOT](https://aihot.news/items/cmuby5qr404jrro9iyb3bpyrm)

Source publication: 2026-09-22T00:24:31.000Z

BestBlogs 09-22 早报收录 10 篇内容，涵盖 Jev System One 决策模型、Warp 的 AI 软件工厂流程、UiPath 关于工作流程才是核心资产的判断，以及生产级智能体控制平面与 Loop engineering 方法论。

## Simon Willison 评 TypeSafe AI 新形态决策模型 Jev

[Summary page \(en\)](https://awesomejev.cc/news/cmubwxqlr02y6rokikumgdixn) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubwxqlr02y6rokikumgdixn) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubwxqlr02y6rokikumgdixn)

[Simon Willison 博客](https://simonwillison.net/2026/Sep/21/jev) · [AIHOT](https://aihot.news/items/cmubwxqlr02y6rokikumgdixn)

Source publication: 2026-09-21T23:09:20.000Z

TypeSafe AI 上周发布 Jev，作者称其为 System One 或决策模型：接受文本输入但输出浮点置信分数而非文本，仅按输入计费 $0.042/百万 tokens，低于 GPT-5 Nano 的 $0.05。

## AI 实验室调侃机器之神与婴儿

[Summary page \(en\)](https://awesomejev.cc/news/cmubwfaok05ipro99dtdxzy3w) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubwfaok05ipro99dtdxzy3w) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubwfaok05ipro99dtdxzy3w)

[@typesafeai](https://x.com/typesafeai/status/2102178536970985861) · [AIHOT](https://aihot.news/items/cmubwfaok05ipro99dtdxzy3w)

Source publication: 2026-09-21T23:29:54.000Z

大型 AI 实验室：机器之神随时降临，别把孩子带到那个世界去！ TypeSafe： \[引用 @craigweiss\]：给我儿子取名 Jev

## Latent Space 访谈 TypeSafe CEO Diogo Almeida：Jev 是面向生产环境的 System One 模型而非万能 God 模型

[Summary page \(en\)](https://awesomejev.cc/news/cmubulddp03l2ro99gf6r3q7d) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubulddp03l2ro99gf6r3q7d) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubulddp03l2ro99gf6r3q7d)

[Latent Space（RSS）](https://www.latent.space/p/jev) · [AIHOT](https://aihot.news/items/cmubulddp03l2ro99gf6r3q7d)

Source publication: 2026-09-21T22:13:49.000Z

Latent Space 发布对 TypeSafe AI CEO Diogo Almeida 的约两小时访谈，围绕其新模型 Jev 展开。

## TypeSafe CEO 谈 System One Model 与可靠 AI

[Summary page \(en\)](https://awesomejev.cc/news/cmubua4mj0396ro993w3kiy40) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubua4mj0396ro993w3kiy40) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubua4mj0396ro993w3kiy40)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2102166782664749173) · [AIHOT](https://aihot.news/items/cmubua4mj0396ro993w3kiy40)

Source publication: 2026-09-21T22:43:12.000Z

TypeSafe CEO Jev 在播客中提出 System One Model，主张 AI 应做软件内的可靠决策而非聊天优先。他称 TypeSafe 拒绝公开 benchmark 和 API 层拒答，认为数据与任务选择比堆算力更重要，System One Model 或重塑编程智能体。即便有 10 亿美元，他也不会从头预训练模型。

## HF 热门榜首开源多语言决策模型

[Summary page \(en\)](https://awesomejev.cc/news/cmubqsb9b03varoci9d10ccq1) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubqsb9b03varoci9d10ccq1) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubqsb9b03varoci9d10ccq1)

[X：Clément Delangue（Hugging Face CEO） \(@ClementDelangue\)](https://x.com/ClementDelangue/status/2102140443194503358) · [AIHOT](https://aihot.news/items/cmubqsb9b03varoci9d10ccq1)

Source publication: 2026-09-21T20:58:32.000Z

HF 上排名第一的热门模型是一个开源多语言 system 1 决策模型，就在 Jev 开始走红几天之后。开源 AI 社区太棒了！

## Jev 正在疯狂工作（视频未加速

[Summary page \(en\)](https://awesomejev.cc/news/cmubqno3i03r2rocij41qzmor) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubqno3i03r2rocij41qzmor) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubqno3i03r2rocij41qzmor)

[X：ZHO \(@ZHO\_ZHO\_ZHO\)](https://x.com/ZHO_ZHO_ZHO/status/2102139594561191962) · [AIHOT](https://aihot.news/items/cmubqno3i03r2rocij41qzmor)

Source publication: 2026-09-21T20:55:09.000Z

Jev 正在疯狂工作（视频未加速

## OpenRouter 社区 System One 用例评选

[Summary page \(en\)](https://awesomejev.cc/news/cmubofwji04dwro4vba5ofu04) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubofwji04dwro4vba5ofu04) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubofwji04dwro4vba5ofu04)

[X：OpenRouter \(@OpenRouter\)](https://x.com/OpenRouter/status/2102125748723339774) · [AIHOT](https://aihot.news/items/cmubofwji04dwro4vba5ofu04)

Source publication: 2026-09-21T20:00:08.000Z

1/ 上周，Jev - @typesafeai 的 System One 模型在 OpenRouter 上线。关注度极高。 我们邀请社区寻找最具创新性的方式，将快速且低成本的决策应用到他们的项目中。 当然，我们得让 Jev 来选出 5 位获奖者。

## Jev 现已上线

[Summary page \(en\)](https://awesomejev.cc/news/cmubnunov03ssro4v6cz4e6d0) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubnunov03ssro4v6cz4e6d0) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubnunov03ssro4v6cz4e6d0)

[@typesafeai](https://x.com/typesafeai/status/2102121915733405896) · [AIHOT](https://aihot.news/items/cmubnunov03ssro4v6cz4e6d0)

Source publication: 2026-09-21T19:44:54.000Z

Jev 现已上线：https://console.typesafe.ai

## Elvis Saravia 推荐 typesafe 编码智能体笔记

[Summary page \(en\)](https://awesomejev.cc/news/cmubnjftn03jgro4vin9hpioh) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubnjftn03jgro4vin9hpioh) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubnjftn03jgro4vin9hpioh)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2102113906529538496) · [AIHOT](https://aihot.news/items/cmubnjftn03jgro4vin9hpioh)

Source publication: 2026-09-21T19:13:05.000Z

Elvis Saravia 推荐一份关于 typesafe 与编码智能体结合的笔记文档，认为其中给出了在 agent harness 中放置 Jev 的实用思路。他提到文档涵盖审批门、MCP/工具调用路由、模型路由、动态子智能体模式和结构化技能等此前分享过的想法。他建议把文档喂给自己的智能体来探索。

## OpenRouter：决策模型市场潜力巨大

[Summary page \(en\)](https://awesomejev.cc/news/cmubl85hs032bro0lxhod57si) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubl85hs032bro0lxhod57si) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubl85hs032bro0lxhod57si)

[X：OpenRouter \(@OpenRouter\)](https://x.com/OpenRouter/status/2102103905815396635) · [AIHOT](https://aihot.news/items/cmubl85hs032bro0lxhod57si)

Source publication: 2026-09-21T18:33:21.000Z

像 Jev 这样的决策模型，其可触达市场可能非常庞大 图表来自 https://openrouter.ai/rankings\#task-spend

## Hugging Face CEO：LLM API 并非 90% 场景最佳方案

[Summary page \(en\)](https://awesomejev.cc/news/cmubja6lg1295rolnxm9jpm9k) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubja6lg1295rolnxm9jpm9k) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubja6lg1295rolnxm9jpm9k)

[X：Clément Delangue（Hugging Face CEO） \(@ClementDelangue\)](https://x.com/ClementDelangue/status/2102085295650828487) · [AIHOT](https://aihot.news/items/cmubja6lg1295rolnxm9jpm9k)

Source publication: 2026-09-21T17:19:23.000Z

Hugging Face CEO Clément Delangue 认为，对现实世界 90% 的用例而言，LLM API 远非最佳 AI 方案——它们过于重型、慢、贵且难以控制。他引用 @willdepue 关于零样本分类器 Jev 的讨论，称随着 AI 成熟和广泛采用，未来几年将逐渐认识到这一点。

## LangSmith 上线 Jev-as-a-Judge 评估功能

[Summary page \(en\)](https://awesomejev.cc/news/cmubi8bwb1141roln8scp6ida) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubi8bwb1141roln8scp6ida) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubi8bwb1141roln8scp6ida)

[LangChain：Blog（RSS）](https://www.langchain.com/blog/jev-is-now-available-in-langsmith-evals) · [AIHOT](https://aihot.news/items/cmubi8bwb1141roln8scp6ida)

Source publication: 2026-09-21T16:57:21.000Z

LangSmith 现已支持将 Jev 用作评估裁判（Jev-as-a-Judge），可对智能体 trace 进行结构化反馈评估，覆盖生产运行、数据集与回归测试场景。官方称该方式更快、更便宜。

## Tomer Tunguz 谈 AI 优化 if-then 判断：专用决策器把分类成本降近百倍

[Summary page \(en\)](https://awesomejev.cc/news/cmubhvftd10qjrolnr7q9k3lt) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubhvftd10qjrolnr7q9k3lt) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubhvftd10qjrolnr7q9k3lt)

[Tomer Tunguz 博客（VC 分析）](https://tomtunguz.com/ai-comes-for-the-if-statement) · [AIHOT](https://aihot.news/items/cmubhvftd10qjrolnr7q9k3lt)

Source publication: 2026-09-21T00:00:00.000Z

Tomer Tunguz 撰文提出最新一波 AI 正在接管软件中的 if-then 判断原语，Jev 与 SemIf 这类专用决策器以数百毫秒返回结果，成本比传统生成式调用低约 76x 到 209x。作者在自己的 Agent 中替换了约四分之一的调用，在 98 条人工核验的生产邮件线程上，Jev 达到 80%、本地 SemIf 达到 82% 的分类准确率，高于生产模型的 47%。

## HuggingFace 上 300 万个专用模型

[Summary page \(en\)](https://awesomejev.cc/news/cmubh50s40zy2rolngstxafql) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubh50s40zy2rolngstxafql) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubh50s40zy2rolngstxafql)

[X：Clément Delangue（Hugging Face CEO） \(@ClementDelangue\)](https://x.com/ClementDelangue/status/2102071917926613310) · [AIHOT](https://aihot.news/items/cmubh50s40zy2rolngstxafql)

Source publication: 2026-09-21T16:26:14.000Z

我喜欢 Jev 的一点是：多年来，大型通用模型几乎吸走了 AI 领域所有的氧气。 但在更加专业化和定制化的模型上存在巨大机会，这些模型为特定任务和语言而构建，因此成本低几个数量级、速度更快、优化更好。@huggingface 上公开可用的这类模型有 300 万个。 让我们构建一个更加多元的 AI 生态！

## 用 Jev 整理 2.3K 篇 AI 论文，成本仅 0.14 美元

[Summary page \(en\)](https://awesomejev.cc/news/cmubg1erd0ymbrolni8v6mpwi) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmubg1erd0ymbrolni8v6mpwi) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmubg1erd0ymbrolni8v6mpwi)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2102066232383979749) · [AIHOT](https://aihot.news/items/cmubg1erd0ymbrolni8v6mpwi)

Source publication: 2026-09-21T16:03:38.000Z

用 Jev 重新整理约 2.3K 篇 AI 研究论文，总成本 $0.14、耗时约 83 秒。Jev 与旧标签（由 DeepSeek V4 Flash 生成）一致率 75%，并找出约 579 处高置信度主题变更；人工抽检 30 处分歧后全部采纳，变更已在生产环境验证。作者认为通过组合 System One 与 System Two 模型可显著改进流水线。

## jev-leftpad：用 LLM 调用替代 padStart\(\) 的 npm 包

[Summary page \(en\)](https://awesomejev.cc/news/cmub8u57l0qphroln9gas77lx) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmub8u57l0qphroln9gas77lx) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmub8u57l0qphroln9gas77lx)

[Hacker News 热门（buzzing.cc 中文翻译）](https://github.com/f/jev-leftpad) · [AIHOT](https://aihot.news/items/cmub8u57l0qphroln9gas77lx)

Source publication: 2026-09-21T12:14:52.115Z

npm 包 jev-leftpad 把 JavaScript 的字符串补位交给大模型完成：调用 leftPad\(value, targetLength\) 时通过 TypeSafe 的 @typesafe-ai/sdk 请求 jev-latest，由模型在 space\_0 到 space\_10 中选一个选项，因此最多只能补 10 个空格。

## Jev × Tripo × Astra 联动演示：Tripo P2.0 生成 3D 资产与 VRM 模型

[Summary page \(en\)](https://awesomejev.cc/news/cmub5mte50jusrolngdryrri1) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmub5mte50jusrolngdryrri1) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmub5mte50jusrolngdryrri1)

[Tripo（官方 X）](https://x.com/tripoai/status/2101988205642092805) · [AIHOT](https://aihot.news/items/cmub5mte50jusrolngdryrri1)

Source publication: 2026-09-21T10:53:35.000Z

Jev × Tripo × Astra 联动 Demo 展示了用 Tripo P2.0 生成 3D 资产与 VRM 模型、由 Jev 驱动语音激活战斗与逻辑的流畅工作流。Jev 负责地图无限扩展、商人文本谈判判定、战斗自由行动判定及语音动作特效分类，Tripo SmartMesh P2.0 生成随机出现的 NPC/敌人/资产与部分魔法特效资产。10 分钟试玩版链接在推文回复中。

## Kev：基于 Qwen3.5 的开源小型决策模型家族发布

[Summary page \(en\)](https://awesomejev.cc/news/cmub4jrmf0igcroln00yszy63) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmub4jrmf0igcroln00yszy63) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmub4jrmf0igcroln00yszy63)

[Hacker News 热门（buzzing.cc 中文翻译）](https://github.com/jaredpalmer/kev/tree/main) · [AIHOT](https://aihot.news/items/cmub4jrmf0igcroln00yszy63)

Source publication: 2026-09-21T10:38:36.945Z

Kev 发布了一组基于 Qwen3.5 的小型决策模型，包含 0.8B、4B 和 9B 三个规格，采用 rank-16 LoRA 加 pointer head 架构，支持在同一请求中处理 yes/no、多选和打分问题并返回概率。

## Jev 迷宫寻路实测：纯随机数发生器反超

[Summary page \(en\)](https://awesomejev.cc/news/cmuayck790bkjrolnwtlbuehx) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuayck790bkjrolnwtlbuehx) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuayck790bkjrolnwtlbuehx)

[X：karminski \(@karminski3\)](https://x.com/karminski3/status/2101941770003361893) · [AIHOT](https://aihot.news/items/cmuayck790bkjrolnwtlbuehx)

Source publication: 2026-09-21T07:49:04.000Z

作者用 Rust + xoshiro256++ 搭了个与 Jev API 格式相同的纯随机数 server，与 Jev 做迷宫寻路对抗测试，结果纯随机无并发顺序请求 892 步通关、耗时不到 300ms，而 Jev 跑了 2306 步，其中 2295 步困在 \(7,4\) 拐角的 3 个格子里原地打转直至超时。

## 号称史上最快量子Jev：单次推理0.12ms，将开源

[Summary page \(en\)](https://awesomejev.cc/news/cmuaw7dxb096qroln5haa1pri) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuaw7dxb096qroln5haa1pri) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuaw7dxb096qroln5haa1pri)

[X：karminski \(@karminski3\)](https://x.com/karminski3/status/2101923782407639249) · [AIHOT](https://aihot.news/items/cmuaw7dxb096qroln5haa1pri)

Source publication: 2026-09-21T06:37:36.000Z

作者宣布将发布号称史上最快的"量子Jev"，单次推理仅需0.12ms，性能达Jev的400x，且不花钱、能解决Jev解决不了的问题。细节稍后公布并以MIT协议开源。

## Jev 新模型明日发布

[Summary page \(en\)](https://awesomejev.cc/news/cmuaopakd0r90ro5t6y64dgck) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuaopakd0r90ro5t6y64dgck) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuaopakd0r90ro5t6y64dgck)

[X：swyx \(@swyx\)](https://x.com/swyx/status/2101873256097804529) · [AIHOT](https://aihot.news/items/cmuaopakd0r90ro5t6y64dgck)

Source publication: 2026-09-21T03:16:49.000Z

Jev 明天发布 【引用 @CompleteSkeptic】：在联合发明 ChatGPT 之后，我一直在问自己：为什么超人类水平的聊天模型没有带来 AGI？ 过去两年我一直在 stealth 模式下构建一种新的模型训练方式（RLCD），以及一种新型前沿 AI 模型，今天正式发布：Jev • 快 20-200 倍 • 便宜 40-400 倍（输出 token 免费）• 为决策优化的前沿可组合智能 据我所知，这是通往 AI 驱动的经济革命的最短路径

## 用 Jev 概率 API 拼出的聊天机器人 jevchat：把杰夫变成（很烂的）聊天模型

[Summary page \(en\)](https://awesomejev.cc/news/cmuaogvp40qy0ro5tdi4aulmb) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuaogvp40qy0ro5tdi4aulmb) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuaogvp40qy0ro5tdi4aulmb)

[Hacker News 热门（buzzing.cc 中文翻译）](https://github.com/kyle-pena-nlp/jevchat) · [AIHOT](https://aihot.news/items/cmuaogvp40qy0ro5tdi4aulmb)

Source publication: 2026-09-21T03:17:09.766Z

jevchat 把 Jev 的概率打分接口当作语言模型使用：每一步让 Jev 在给定问题和已生成回复的情况下，为字母表或 token 列表中每个候选符号返回概率，再由采样器归一化后抽取下一个符号，抽到 STOP 即结束。

## laya-mlx 移植版：比 Jev 快 50 倍，本地跑贪吃蛇

[Summary page \(en\)](https://awesomejev.cc/news/cmuakeye30mgsro5tmkdupgr9) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuakeye30mgsro5tmkdupgr9) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuakeye30mgsro5tmkdupgr9)

[X：karminski \(@karminski3\)](https://x.com/karminski3/status/2101839176224391358) · [AIHOT](https://aihot.news/items/cmuakeye30mgsro5tmkdupgr9)

Source publication: 2026-09-21T01:01:24.000Z

开发者将开源文本概率分类系统 Laya 移植到 MLX 并做性能优化，推出 laya-mlx，号称比 Jev 快 50 倍，设备内存占用最高 1G。该模型在本地 M3 Max 上以每秒 60 次决策的速度玩贪吃蛇，代码已开源至 GitHub。

## TypeSafe 决策模型 Jev 通过 OpenRouter Decisions API 开放调用

[Summary page \(en\)](https://awesomejev.cc/news/cmudpvn230nxmroggdp0jx9uj) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmudpvn230nxmroggdp0jx9uj) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmudpvn230nxmroggdp0jx9uj)

[OpenRouter：Announcements（RSS）](https://openrouter.ai/blog/insights/what-is-jev) · [AIHOT](https://aihot.news/items/cmudpvn230nxmroggdp0jx9uj)

Source publication: 2026-09-21T00:00:00.000Z

TypeSafe 的决策模型 Jev 已可通过 OpenRouter Decisions API 调用，模型 ID 为 typesafe/jev-1.13，于 2026 年 9 月 15 日发布早期访问。

## Jev 与 LLM-as-a-Judge 对比：TypeSafe 决策模型在封闭评分标准下准确率持平、成本降至 1/5

[Summary page \(en\)](https://awesomejev.cc/news/cmudpvn230nxlroggwv3fzq9g) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmudpvn230nxlroggwv3fzq9g) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmudpvn230nxlroggwv3fzq9g)

[OpenRouter：Announcements（RSS）](https://openrouter.ai/blog/tutorials/jev-vs-llm-as-a-judge) · [AIHOT](https://aihot.news/items/cmudpvn230nxlroggwv3fzq9g)

Source publication: 2026-09-21T00:00:00.000Z

TypeSafe 决策模型 Jev 在封闭评分标准且证据随请求提供时，准确率与 LLM-as-a-Judge 持平，概率校准更好，成本仅为后者的 1/5、延迟为 1/10。

## Jev 面向所有人开放，无需等待名单

[Summary page \(en\)](https://awesomejev.cc/news/cmuadroll0fjaro5tmgw8wlz5) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuadroll0fjaro5tmgw8wlz5) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuadroll0fjaro5tmgw8wlz5)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2101796685903188086) · [AIHOT](https://aihot.news/items/cmuadroll0fjaro5tmgw8wlz5)

Source publication: 2026-09-20T22:12:34.000Z

哎呀。以前"快"可是件坏事 💅 Jev 现已面向所有人开放，无需等待名单。 在这里开始使用：https://console.typesafe.ai

## Jev 现已向所有人开放

[Summary page \(en\)](https://awesomejev.cc/news/cmuacp46v0b19ro5tzymtz1qh) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuacp46v0b19ro5tzymtz1qh) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuacp46v0b19ro5tzymtz1qh)

[@typesafeai](https://x.com/typesafeai/status/2101786156572823624) · [AIHOT](https://aihot.news/items/cmuacp46v0b19ro5tzymtz1qh)

Source publication: 2026-09-20T21:30:43.000Z

Jev 现已向所有人开放。无需等待名单。在此开始使用：https://console.typesafe.ai

## Laya（OS Jev）在 Mac M4 CoreML 离线环境下每秒 45 次决策

[Summary page \(en\)](https://awesomejev.cc/news/cmuabls030a3kro5tfk5zp2zx) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuabls030a3kro5tfk5zp2zx) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuabls030a3kro5tfk5zp2zx)

[Hacker News 热门（buzzing.cc 中文翻译）](https://gist.github.com/fordnox/e592d0f68b543fd044be8e6d040863a0) · [AIHOT](https://aihot.news/items/cmuabls030a3kro5tfk5zp2zx)

Source publication: 2026-09-20T21:13:48.675Z

Laya（OS Jev）可在 Mac M4 上通过 CoreML 离线运行，达到每秒 45 次决策。用户可用 uv 安装 laya-coreml【demo】，并下载 aac6fef/laya-multilingual-coreml-ane 模型到本地，再运行 laya-coreml-snake 演示。

## Jev 新手入门指南：用 System One 模型做结构化判断

[Summary page \(en\)](https://awesomejev.cc/news/cmuabbcbm09p2ro5tz9lc6eb9) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuabbcbm09p2ro5tz9lc6eb9) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuabbcbm09p2ro5tz9lc6eb9)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2101774405521301681) · [AIHOT](https://aihot.news/items/cmuabbcbm09p2ro5tz9lc6eb9)

Source publication: 2026-09-20T20:44:02.000Z

DAIR.AI 发布 Jev 新手指南，Jev 是 TypeSafe 推出的通用 System One 模型，专为快速、聚焦的判断设计，而非长推理或开放式写作。

## Jev 入门指南与 Playground 发布

[Summary page \(en\)](https://awesomejev.cc/news/cmuabbcbm09p1ro5t86snho11) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuabbcbm09p1ro5t86snho11) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuabbcbm09p1ro5t86snho11)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2101775584661573692) · [AIHOT](https://aihot.news/items/cmuabbcbm09p1ro5t86snho11)

Source publication: 2026-09-20T20:48:43.000Z

🔥 推出 Jev Primer 与 Playground 想了解 Jev 如何运作，不用再找了。 这是你入门所需的唯一交互式指南。 不再困惑 Jev 能做什么、不能做什么。我们还打造了专属 Jev Playground，让你现在就能试用各种用例。

## DAIR.AI 发布 Jev 入门介绍与 Playground

[Summary page \(en\)](https://awesomejev.cc/news/cmuaauef109a3ro5t3ydte2t9) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuaauef109a3ro5t3ydte2t9) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuaauef109a3ro5t3ydte2t9)

[X：DAIR.AI \(@dair\_ai\)](https://x.com/dair_ai/status/2101775443300872536) · [AIHOT](https://aihot.news/items/cmuaauef109a3ro5t3ydte2t9)

Source publication: 2026-09-20T20:48:09.000Z

Jev 的初学者入门介绍。另外我们还搭建了一个 Jev Playground，供你测试多个用例。

## HumanLayer 的 Jev 代码搜索 harness 调优

[Summary page \(en\)](https://awesomejev.cc/news/cmuaa8qv708pjro5tzeampqnv) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmuaa8qv708pjro5tzeampqnv) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmuaa8qv708pjro5tzeampqnv)

[X：Dex Horthy（HumanLayer）\(@dexhorthy\)](https://x.com/dexhorthy/status/2101770896679772531) · [AIHOT](https://aihot.news/items/cmuaa8qv708pjro5tzeampqnv)

Source publication: 2026-09-20T20:30:05.000Z

别管我，我就在这儿对 jev harness 做爬山调优，用于代码搜索，你们继续。

## 网友玩梗：人人都在喊jev jev jev

[Summary page \(en\)](https://awesomejev.cc/news/cmua31w3p0cnyrowjwsjxg7jc) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmua31w3p0cnyrowjwsjxg7jc) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmua31w3p0cnyrowjwsjxg7jc)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2101719837592743944) · [AIHOT](https://aihot.news/items/cmua31w3p0cnyrowjwsjxg7jc)

Source publication: 2026-09-20T17:07:12.000Z

所有人：jev jev jev 我奶奶：

## Jev 用例合集自动更新

[Summary page \(en\)](https://awesomejev.cc/news/cmu9zixvm08yvrowjdrrd6n41) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu9zixvm08yvrowjdrrd6n41) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu9zixvm08yvrowjdrrd6n41)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2101696753749655863) · [AIHOT](https://aihot.news/items/cmu9zixvm08yvrowjdrrd6n41)

Source publication: 2026-09-20T15:35:28.000Z

🔥 Awesome Jev Collection 🔥 在我的新 Jev 合集里找灵感吧。 （记得收藏） 它会自动更新从 X 上抓取的最新热门 Jev 用例和演示。 由 Jev 自己完成策展。 意外的是，我发现 Jev 在策展方面也很擅长。 链接在此：https://academy.dair.ai/resources/jev-field-notes

## Jev 值得关注内容持续追踪

[Summary page \(en\)](https://awesomejev.cc/news/cmu9f2efx069lrolzybn0m03d) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu9f2efx069lrolzybn0m03d) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu9f2efx069lrolzybn0m03d)

[X：ZHO \(@ZHO\_ZHO\_ZHO\)](https://x.com/ZHO_ZHO_ZHO/status/2101551309522645430) · [AIHOT](https://aihot.news/items/cmu9f2efx069lrolzybn0m03d)

Source publication: 2026-09-20T05:57:31.000Z

Jev 值得关注内容持续追踪 1/n

## LLM 已知答案概率为何还要先说话

[Summary page \(en\)](https://awesomejev.cc/news/cmu9cxa0m07t2ro8ibzuykdvm) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu9cxa0m07t2ro8ibzuykdvm) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu9cxa0m07t2ro8ibzuykdvm)

[X：ZHO \(@ZHO\_ZHO\_ZHO\)](https://x.com/ZHO_ZHO_ZHO/status/2101534153942720714) · [AIHOT](https://aihot.news/items/cmu9cxa0m07t2ro8ibzuykdvm)

Source publication: 2026-09-20T04:49:21.000Z

既然 LLM 本来就知道答案概率，那为什么逼它先说话？有意思 JEV

## 快速通道申请通过了，可以玩起来了 😁

[Summary page \(en\)](https://awesomejev.cc/news/cmu98mxc603f7rob4q2u3brpg) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu98mxc603f7rob4q2u3brpg) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu98mxc603f7rob4q2u3brpg)

[X：洪明 \(@hongming731\)](https://x.com/hongming731/status/2101502731500536199) · [AIHOT](https://aihot.news/items/cmu98mxc603f7rob4q2u3brpg)

Source publication: 2026-09-20T02:44:29.000Z

快速通道申请通过了，可以玩起来了 😁 【引用 @hongming731】：最近几天 Jev 模型很火，BestBlogs 整理了一期专题，可以组队一起学习一下 😆 https://www.bestblogs.dev/explore/topics/typesafe-jev-release

## Jev 在 Vercel AI Gateway 限时免费

[Summary page \(en\)](https://awesomejev.cc/news/cmu96whtr037lrodq991cv6o7) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu96whtr037lrodq991cv6o7) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu96whtr037lrodq991cv6o7)

[@typesafeai](https://x.com/typesafeai/status/2101490102866493522) · [AIHOT](https://aihot.news/items/cmu96whtr037lrodq991cv6o7)

Source publication: 2026-09-20T01:54:18.000Z

免费 【引用 @vercel\_dev】：Jev by @typesafeai 在 Vercel AI Gateway 上免费至 9 月 25 日。 免费使用 Gateway 上采用速度最快的模型。 https://vercel.com/ai-gateway/models/jev https://x.com/vercel/status/2101077346203971900?s=20

## BestBlogs 整理 Jev 模型专题

[Summary page \(en\)](https://awesomejev.cc/news/cmu96hspn02mprodqgl2whwsb) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu96hspn02mprodqgl2whwsb) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu96hspn02mprodqgl2whwsb)

[X：洪明 \(@hongming731\)](https://x.com/hongming731/status/2101489900164116821) · [AIHOT](https://aihot.news/items/cmu96hspn02mprodqgl2whwsb)

Source publication: 2026-09-20T01:53:30.000Z

最近几天 Jev 模型很火，BestBlogs 整理了一期专题，可以组队一起学习一下 😆 https://www.bestblogs.dev/explore/topics/typesafe-jev-release

## jg CLI 开启 alpha 测试

[Summary page \(en\)](https://awesomejev.cc/news/cmu94g43i04horoxs7jt5q1g9) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu94g43i04horoxs7jt5q1g9) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu94g43i04horoxs7jt5q1g9)

[X：Dex Horthy（HumanLayer）\(@dexhorthy\)](https://x.com/dexhorthy/status/2101477631904661619) · [AIHOT](https://aihot.news/items/cmu94g43i04horoxs7jt5q1g9)

Source publication: 2026-09-20T01:04:45.000Z

谁想 alpha 测试我的新 jg CLI（没错，就是 jevgrep）

## Jev 模型每百万输入 token 仅 $0.042

[Summary page \(en\)](https://awesomejev.cc/news/cmu90gznv03kvrojr9nvhjxs3) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu90gznv03kvrojr9nvhjxs3) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu90gznv03kvrojr9nvhjxs3)

[@typesafeai](https://x.com/typesafeai/status/2101445845212365129) · [AIHOT](https://aihot.news/items/cmu90gznv03kvrojr9nvhjxs3)

Source publication: 2026-09-19T22:58:27.000Z

一旦用了 Jev，就再也回不去了 【引用 @notkevinzhang】：四个词，十八个字母，每百万输入 token 仅 $0.042

## Elvis Saravia 用 Jev 为智能体框架 /goal 功能构建自定义验证器

[Summary page \(en\)](https://awesomejev.cc/news/cmu905sdn0359rojrkmu8x5iy) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu905sdn0359rojrkmu8x5iy) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu905sdn0359rojrkmu8x5iy)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2101443311454036477) · [AIHOT](https://aihot.news/items/cmu905sdn0359rojrkmu8x5iy)

Source publication: 2026-09-19T22:48:23.000Z

Elvis Saravia 用 Jev 为智能体框架的 /goal 功能构建自定义验证器，每轮对话后检查目标是否真正完成，使持续验证成本低到可规模化。此前这类验证由另一个昂贵的推理模型承担，现在可更频繁运行以让智能体保持正轨。

## Jev 能否成为更好的智能体评测器？

[Summary page \(en\)](https://awesomejev.cc/news/cmu9051jc034erojrxrdjbqhq) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu9051jc034erojrxrdjbqhq) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu9051jc034erojrxrdjbqhq)

[LangChain：Blog（RSS）](https://www.langchain.com/blog/jev-agent-evals-langsmith) · [AIHOT](https://aihot.news/items/cmu9051jc034erojrxrdjbqhq)

Source publication: 2026-09-19T23:09:51.000Z

LangChain 测试了 Jev 与 LLM 评委在准确率、可重复性、延迟和成本四个维度的表现，以验证 System One 模型能否为智能体评测提供新思路。

## JevBench 发布：面向类型化决策的新基准

[Summary page \(en\)](https://awesomejev.cc/news/cmu8z37tg030profp4w9mu61q) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu8z37tg030profp4w9mu61q) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu8z37tg030profp4w9mu61q)

[X：Rohan Paul \(@rohanpaul\_ai\)](https://x.com/rohanpaul_ai/status/2101435924790026437) · [AIHOT](https://aihot.news/items/cmu8z37tg030profp4w9mu61q)

Source publication: 2026-09-19T22:19:01.000Z

新基准 JevBench 发布，专为输出受限软件决策而非开放式文本的模型设计，紧随 TypeSafe 9 月 15 日发布 Jev--输入应用状态与固定选项，返回带概率的类型化答案。该基准综合智能、校准、速度与成本，用几何平均防止单一维度优势掩盖短板。GPT-5.6 Luna 在难题准确率上明显高于 Jev 1.13.0，但 Jev 因延迟、校准和成本更优而在综合分上领先。

## Jev 做高频交易？欠拟合与泛化误区解析

[Summary page \(en\)](https://awesomejev.cc/news/cmu8wegm903qtrorrmxzjqphh) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu8wegm903qtrorrmxzjqphh) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu8wegm903qtrorrmxzjqphh)

[X：karminski \(@karminski3\)](https://x.com/karminski3/status/2101419754888245626) · [AIHOT](https://aihot.news/items/cmu8wegm903qtrorrmxzjqphh)

Source publication: 2026-09-19T21:14:46.000Z

Jev 对 K 线本身是欠拟合的，只有当它做到 100% 负相关时才能反着买，而 100% 负相关属于超强泛化、不可能实现，即使每次交易都亏钱也不能算 100% 负相关。此外 70ms 的延迟别说高频交易，连抢火车票都抢不到。

## OpenRouter 评测 Jev 决策模型速度

[Summary page \(en\)](https://awesomejev.cc/news/cmu8vpc8102yvrorr22uz7leh) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu8vpc8102yvrorr22uz7leh) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu8vpc8102yvrorr22uz7leh)

[X：OpenRouter \(@OpenRouter\)](https://x.com/OpenRouter/status/2101412965765529853) · [AIHOT](https://aihot.news/items/cmu8vpc8102yvrorr22uz7leh)

Source publication: 2026-09-19T20:47:48.000Z

1/ Jev，由 @typesafeai 推出的决策模型，引发了大量项目和讨论。我们用 Ori Eval 在 OpenRouter 上针对热门 LLM 的评判能力进行了测试。 Jev 比第二快的模型还快 5 倍以上，甚至它最慢的请求也超过了其他所有模型的中位数。

## markjaquith 最短"什么是 Jev"解释

[Summary page \(en\)](https://awesomejev.cc/news/cmu8qtry803iyro5k56jm4vuc) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu8qtry803iyro5k56jm4vuc) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu8qtry803iyro5k56jm4vuc)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2101376493704315048) · [AIHOT](https://aihot.news/items/cmu8qtry803iyro5k56jm4vuc)

Source publication: 2026-09-19T18:22:52.000Z

好吧这个挺不错的 xD 【引用 @markjaquith】：这是我最新最短的"什么是 Jev"解释

## TypeSafe AI 发布 System One 模型 Jev，返回带概率的类型化决策而非文本

[Summary page \(en\)](https://awesomejev.cc/news/cmu8qsosl03gmro5ke16mf479) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu8qsosl03gmro5ke16mf479) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu8qsosl03gmro5ke16mf479)

[MarkTechPost（RSS）](https://www.marktechpost.com/2026/09/19/typesafe-ai-releases-jev) · [AIHOT](https://aihot.news/items/cmu8qsosl03gmro5ke16mf479)

Source publication: 2026-09-19T18:41:33.000Z

TypeSafe AI 发布 Jev，一个基于 Transformer 但不生成文本的 System One 模型，通过 POST https://api.typesafe.ai/v1/systemone 接收状态和类型化问题，返回带概率和置信度的类型化决策，提供 Choice、Score、Noul 三种问题类型。

## 对 jev 命名感到厌倦

[Summary page \(en\)](https://awesomejev.cc/news/cmu8pr71y08n5ro3kdwcaszld) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu8pr71y08n5ro3kdwcaszld) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu8pr71y08n5ro3kdwcaszld)

[@completeskeptic](https://x.com/CompleteSkeptic/status/2101370481328984475) · [AIHOT](https://aihot.news/items/cmu8pr71y08n5ro3kdwcaszld)

Source publication: 2026-09-19T17:58:58.000Z

还有人厌倦了 jev 这件事吗？我们的品牌是桀骜不驯、疯狂的，不是"jev"（可能是因为我正处于风暴中心） 它有趣是因为给模型起名 jev 本身就很疯狂 （另外说这个可能也很疯狂，但我们还没有营销人员）

## Jev 如何进化智能体 harness 体验

[Summary page \(en\)](https://awesomejev.cc/news/cmu8m89ek1qa5rogr16zrfu1z) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu8m89ek1qa5rogr16zrfu1z) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu8m89ek1qa5rogr16zrfu1z)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2101349932569370826) · [AIHOT](https://aihot.news/items/cmu8m89ek1qa5rogr16zrfu1z)

Source publication: 2026-09-19T16:37:19.000Z

Elvis Saravia 将 Jev 集成进自建 harness，认为它不只是更快更便宜，而是能解锁此前受成本、延迟或缺少合适原语限制的智能体体验。Jev 可用于分类、控制流、确定性工作流和大规模标注，并通过智能决策、结构化智能与按需上下文管理提升可靠性。他还看好 Jev 在动态 UI、LLM 评审、验证器与合成高质量数据上的潜力，完整指南即将发布。

## JEV 相关推文

[Summary page \(en\)](https://awesomejev.cc/news/cmu8m4ukd1q7crogrmvhr7o5a) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu8m4ukd1q7crogrmvhr7o5a) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu8m4ukd1q7crogrmvhr7o5a)

[X：ZHO \(@ZHO\_ZHO\_ZHO\)](https://x.com/ZHO_ZHO_ZHO/status/2101031959648784402) · [AIHOT](https://aihot.news/items/cmu8m4ukd1q7crogrmvhr7o5a)

Source publication: 2026-09-18T19:33:49.000Z

JEV --- \*\*说明\*\*：主推文内容仅为 "JEV" 三个字母，没有更多上下文信息。根据防幻觉规则，无法确定 JEV 具体指代什么（可能是模型名、项目代号或其他），因此标题和正文均保留原文，不做扩写。如需更准确的翻译，请提供更完整的推文内容。

## Nathan Lambert 撰文解释为何仍未接受真正的递归自我改进（RSI）

[Summary page \(en\)](https://awesomejev.cc/news/cmu8llu6p1prhrogrd6nmgfhg) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu8llu6p1prhrogrd6nmgfhg) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu8llu6p1prhrogrd6nmgfhg)

[Nathan Lambert：Interconnects（RSS）](https://www.interconnects.ai/p/where-i-stand-on-rsi) · [AIHOT](https://aihot.news/items/cmu8llu6p1prhrogrd6nmgfhg)

Source publication: 2026-09-19T15:42:20.000Z

Nathan Lambert 撰文阐述他仍不支持真正的递归自我改进（RSI），坚持自己的"有损自我改进"基线判断。

## Convai 发布开源决策模型 Laya，对标 TypeSafe AI 的 Jev

[Summary page \(en\)](https://awesomejev.cc/news/cmu8ezrfp1iy7rogrtexqdmy0) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu8ezrfp1iy7rogrtexqdmy0) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu8ezrfp1iy7rogrtexqdmy0)

[Hacker News 热门（buzzing.cc 中文翻译）](https://laya.convaiinnovations.com/) · [AIHOT](https://aihot.news/items/cmu8ezrfp1iy7rogrtexqdmy0)

Source publication: 2026-09-19T13:15:27.181Z

作者 nandakishor\_ml 发布开源非自回归决策模型家族 Laya，基于双向编码器，单 GPU 推理 32.8 ms（批量 7.2 ms/问题），自称比 TypeSafe AI 的 Jev 快 7.8 倍，权重以 Apache 2.0 开源。

## Encoder 卷土重来：Jev 要做面向 Agent 的泛化决策模型

[Summary page \(en\)](https://awesomejev.cc/news/cmu7yk01w0v90rogr5tnx4kdv) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu7yk01w0v90rogr5tnx4kdv) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu7yk01w0v90rogr5tnx4kdv)

[X：马东锡 NLP \(@dongxi\_nlp\)](https://x.com/dongxi_nlp/status/2101183155294117913) · [AIHOT](https://aihot.news/items/cmu7yk01w0v90rogr5tnx4kdv)

Source publication: 2026-09-19T05:34:36.000Z

Jev 试图补上 BERT 未走完的路线，保留 GPT 的任务泛化能力，同时重获 encoder 与 classifier 式的决策效率，成为面向 service 和 Agent 的泛化 decision model。

## 新模型能力再进化

[Summary page \(en\)](https://awesomejev.cc/news/cmu7ttko80qj0rogr59tgipl1) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu7ttko80qj0rogr59tgipl1) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu7ttko80qj0rogr59tgipl1)

[X：Eric Zakariasson \(@ericzakariasson\)](https://x.com/ericzakariasson/status/2101144294304457030) · [AIHOT](https://aihot.news/items/cmu7ttko80qj0rogr59tgipl1)

Source publication: 2026-09-19T03:00:11.000Z

它正在彻底改变新模型能做到的事

## Jev 上线 Venice API 测试版

[Summary page \(en\)](https://awesomejev.cc/news/cmu7n6b3i0joyrogruwd550j0) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu7n6b3i0joyrogruwd550j0) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu7n6b3i0joyrogruwd550j0)

[@typesafeai](https://x.com/typesafeai/status/2101097027174309926) · [AIHOT](https://aihot.news/items/cmu7n6b3i0joyrogruwd550j0)

Source publication: 2026-09-18T23:52:22.000Z

是 Jev，不是 Jev Jev（@typesafeai 出品）现已上线 Venice API，处于测试阶段。 它只回答，不写作。把你的应用状态和带类型的问题发给它，就能拿回一个代码可以分支处理的带类型答案：一个概率、一个选定选项，或按你的评分标准给出的分数。无需从聊天模型里费劲套出 JSON。

## OpenRouter 实测 Jev 决策模型对比 LLM，何时该用决策模型替代生成文本

[Summary page \(en\)](https://awesomejev.cc/news/cmucqgii60jz4roedj9fsw3qh) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmucqgii60jz4roedj9fsw3qh) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmucqgii60jz4roedj9fsw3qh)

[OpenRouter：Announcements（RSS）](https://openrouter.ai/blog/tutorials/jev-vs-llm-when-to-use-each) · [AIHOT](https://aihot.news/items/cmucqgii60jz4roedj9fsw3qh)

Source publication: 2026-09-19T00:00:00.000Z

OpenRouter 发布教程，实测 TypeSafe 的决策模型 Jev 1.13 与 GPT Luna、Claude Opus 在工单分诊和提示词注入筛查上的表现：Jev 每 1000 张工单成本 $0.0248、中位延迟 194ms，准确率与 LLM 相当。

## Jev 模型征集社区问题反馈

[Summary page \(en\)](https://awesomejev.cc/news/cmu7m3qj30ifyrogrviibayb9) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu7m3qj30ifyrogrviibayb9) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu7m3qj30ifyrogrviibayb9)

[@typesafeai](https://x.com/typesafeai/status/2101093678311997520) · [AIHOT](https://aihot.news/items/cmu7m3qj30ifyrogrviibayb9)

Source publication: 2026-09-18T23:39:03.000Z

告诉我们 Jev 哪里不好！ Jev 并不完美。我们认为它还是太慢、太贵、太笨。我们还有更多招数让它变得更好。但我们需要社区的帮助--请在 Discord 的 model-jaggedness 频道里发布你看到的问题。 也请看看我们已知的 jaggedness 问题：https://docs.typesafe.ai/model-jaggedness/jev-1.13

## OpenRouter 介绍决策模型 Jev

[Summary page \(en\)](https://awesomejev.cc/news/cmu7hc2e80aavrogr7vbwhcjm) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu7hc2e80aavrogr7vbwhcjm) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu7hc2e80aavrogr7vbwhcjm)

[X：OpenRouter \(@OpenRouter\)](https://x.com/OpenRouter/status/2101061688338575739) · [AIHOT](https://aihot.news/items/cmu7hc2e80aavrogr7vbwhcjm)

Source publication: 2026-09-18T21:31:56.000Z

什么是决策模型？ Jev 由 @typesafeai 打造，回答是/否和多项选择题，并给出置信度分数。软件开发的大部分工作是一连串决策，而 Jev 比 LLM 便宜 10 倍、快 10 倍。 让我们通过实际例子来理解：

## TechCrunch 报道新型 AI 模型 Jev

[Summary page \(en\)](https://awesomejev.cc/news/cmu7cgiic05l3rogr4nao81h1) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu7cgiic05l3rogr4nao81h1) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu7cgiic05l3rogr4nao81h1)

[@typesafeai](https://x.com/typesafeai/status/2101024808565870752) · [AIHOT](https://aihot.news/items/cmu7cgiic05l3rogr4nao81h1)

Source publication: 2026-09-18T19:05:24.000Z

感谢 @TechCrunch！！！ 【引用 @TechCrunch】：Jev，一种新型 AI 模型，正在向开发者展示一条更便宜、更快速的软件智能路径。https://spr.ly/6018BGXyam

## OpenAI前研究员创办的TypeSafe发布非LLM新模型Jev，输出校准概率而非文本

[Summary page \(en\)](https://awesomejev.cc/news/cmu7bcjae04b6rogrg6t1tzlo) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu7bcjae04b6rogrg6t1tzlo) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu7bcjae04b6rogrg6t1tzlo)

[TechCrunch：AI（RSS）](https://techcrunch.com/2026/09/18/a-new-kind-of-ai-model-from-a-chatgpt-inventor-is-thrilling-developers) · [AIHOT](https://aihot.news/items/cmu7bcjae04b6rogrg6t1tzlo)

Source publication: 2026-09-18T18:49:30.000Z

OpenAI前研究员、RLHF共同发明人Almeida创办的TypeSafe AI发布基于transformer的新模型Jev，它不输出文本而是产生概率形式的校准决策。

## OpenJev 推出纯浏览器本地决策实验，对比直读概率与逐 token 生成 JSON

[Summary page \(en\)](https://awesomejev.cc/news/cmu6wbl1k0dv5rowkxxtep0kt) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu6wbl1k0dv5rowkxxtep0kt) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu6wbl1k0dv5rowkxxtep0kt)

[Hacker News 热门（buzzing.cc 中文翻译）](https://openjev.com/) · [AIHOT](https://aihot.news/items/cmu6wbl1k0dv5rowkxxtep0kt)

Source publication: 2026-09-18T11:15:43.772Z

OpenJev 是一个纯浏览器、无后端的本地实验站点，用户可在自己的 GPU 上加载模型，对比两种决策方式：直接读取选项 logits 并归一化，或让模型逐 token 写出 JSON 概率分布，并用 performance.now（） 实测各阶段耗时。

## Grok 回复区需要 System 1 反射

[Summary page \(en\)](https://awesomejev.cc/news/cmu6r8orx089wrowkv9edk3lm) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu6r8orx089wrowkv9edk3lm) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu6r8orx089wrowkv9edk3lm)

[X：karminski \(@karminski3\)](https://x.com/karminski3/status/2100873867321647496) · [AIHOT](https://aihot.news/items/cmu6r8orx089wrowkv9edk3lm)

Source publication: 2026-09-18T09:05:36.000Z

@elonmusk X 的回复区需要的是 System 1 反射，而不是 System 2 哲学： 评论："你想看看我的福吗？" Grok（3500ms）：这是中国网络俚语，不是字面意义上问"fortune"或"blessing"………. Jev（70ms）：{"ban"： true}（成本：$0.00004）

## LangChain 用 Jev 增强 harness 做 agent 路由

[Summary page \(en\)](https://awesomejev.cc/news/cmu6i1jgg0pgprofjxol77gj0) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu6i1jgg0pgprofjxol77gj0) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu6i1jgg0pgprofjxol77gj0)

[X：马东锡 NLP \(@dongxi\_nlp\)](https://x.com/dongxi_nlp/status/2100813094951748074) · [AIHOT](https://aihot.news/items/cmu6i1jgg0pgprofjxol77gj0)

Source publication: 2026-09-18T05:04:07.000Z

LangChain 已利用 Jev 增强其 harness，速度非常快。Jev 适合在既定 harness 中承担分析分类工作，例如 agent 路由、模型路由等"螺丝钉"任务。

## 用 Jev 构建 Harness：TypeSafe AI 的 System One 模型如何接入 LangChain

[Summary page \(en\)](https://awesomejev.cc/news/cmu69j7ws0g1rrofjkzsmf8f6) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu69j7ws0g1rrofjkzsmf8f6) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu69j7ws0g1rrofjkzsmf8f6)

[LangChain：Blog（RSS）](https://www.langchain.com/blog/building-a-harness-with-jev) · [AIHOT](https://aihot.news/items/cmu69j7ws0g1rrofjkzsmf8f6)

Source publication: 2026-09-18T01:00:32.000Z

TypeSafe AI 的 System One 模型 Jev 主打快速、结构化的决策，可嵌入 AI 智能体的 agent loop 中。LangChain 发布教程，介绍 Jev 的定位以及如何将其与 LangChain 配合使用。

## Jev 模型上线 OpenRouter 测试版

[Summary page \(en\)](https://awesomejev.cc/news/cmu68boti0eqarofjjh2ddaf0) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu68boti0eqarofjjh2ddaf0) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu68boti0eqarofjjh2ddaf0)

[X：OpenRouter \(@OpenRouter\)](https://x.com/OpenRouter/status/2100744709589316009) · [AIHOT](https://aihot.news/items/cmu68boti0eqarofjjh2ddaf0)

Source publication: 2026-09-18T00:32:23.000Z

由 @typesafeai 开发的 Jev 现已上线 OpenRouter，处于 beta 阶段。 Jev 是一个 System One 模型。它不生成文本，而是接收你的应用状态加上一个带类型的问题，返回一个带类型、附带概率的决策。无需 JSON 提示词、解析层，也没有需要校验的东西。

## TypeSafe AI 发布只做高频决策的大模型 Jev，作者实测其分类判断性价比

[Summary page \(en\)](https://awesomejev.cc/news/cmu67pecj0e0wrofj97vtuwzu) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu67pecj0e0wrofj97vtuwzu) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu67pecj0e0wrofj97vtuwzu)

[公众号：数字生命卡兹克](https://mp.weixin.qq.com/s?__biz=MzIyMzA5NjEyMA%3D%3D&mid=2647686475&idx=1&sn=1d9d43036b6d72fd83b9d5658b351215) · [AIHOT](https://aihot.news/items/cmu67pecj0e0wrofj97vtuwzu)

Source publication: 2026-09-18T00:08:00.000Z

TypeSafe AI 推出专注高频决策的大模型 Jev，不做对话和文字生成，只输出判断，速度比传统大模型快20~200倍，成本0.042美元/百万Token且输出Token免费。作者实测预筛任务中Jev准确性第二且更便宜，在并行判断任务上达到最高准确率和最快速度；模型采用RLCD训练方法优化决策校准，可在官网 https://typesafe.ai/ 申请资格，Vercel 已首发接入。

## Jev 模型：放弃自回归，靠 RLCD 做决策

[Summary page \(en\)](https://awesomejev.cc/news/cmu65t3i50bzbrofj6yb2pxmh) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu65t3i50bzbrofj6yb2pxmh) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu65t3i50bzbrofj6yb2pxmh)

[X：karminski \(@karminski3\)](https://x.com/karminski3/status/2100724328975462779) · [AIHOT](https://aihot.news/items/cmu65t3i50bzbrofj6yb2pxmh)

Source publication: 2026-09-17T23:11:24.000Z

Jev 模型放弃传统自回归架构，无法直接输出普通文本，只能按预定义 Schema 做结构化决策输出，例如垃圾短信二分类会返回带概率的 JSON（isSpam true 0.982 / false 0.018）。其真正护城河是 RLCD（校准强化学习），使输出很难出现概率失真，但代价是模型表现刻板、只适合干活。目前仅支持文本输入，复杂场景需把内容转成文本并定义可选动作，模型再自主决策。

## Jev 模型介绍：放弃自回归、只做结构化决策输出

[Summary page \(en\)](https://awesomejev.cc/news/cmu64qi370ap7rofjzzjjsv18) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu64qi370ap7rofjzzjjsv18) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu64qi370ap7rofjzzjjsv18)

[X：karminski \(@karminski3\)](https://x.com/karminski3/status/2100717944565354595) · [AIHOT](https://aihot.news/items/cmu64qi370ap7rofjzzjjsv18)

Source publication: 2026-09-17T22:46:02.000Z

Jev 模型放弃传统自回归架构，无法直接输出普通文本，只能做决策并输出结构化 JSON，输入时需定义 Schema 并编译为决策槽位，因此输出不会出错。它目前仅支持文本输入，二分类场景可输出如 isSpam 为 true、概率 0.982 的 JSON；复杂场景下定义好可用动作后模型即可自主决策，如玩杀戮尖塔或看盘。

## Jev 模型四大智能体应用场景盘点

[Summary page \(en\)](https://awesomejev.cc/news/cmu60zs02039brofjvtyo7zqm) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu60zs02039brofjvtyo7zqm) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu60zs02039brofjvtyo7zqm)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2100693601021997193) · [AIHOT](https://aihot.news/items/cmu60zs02039brofjvtyo7zqm)

Source publication: 2026-09-17T21:09:18.000Z

Elvis Saravia 列出 Jev 的四个应用方向：LLM-as-a-Judge 评估、agent harness 路由、通过 SOTA 分类能力实现更智能的子智能体创建以扩展编排、以及增强动态 harness 生成。前三个在成本和效率上 ROI 极高，他正将 Jev 用作元 harness 的智能路由器，第四个尚在测试但潜力巨大。

## Jev 或成构建可靠 AI 系统的重要原语

[Summary page \(en\)](https://awesomejev.cc/news/cmu5thpzp0jj9roqokbyyuq8p) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu5thpzp0jj9roqokbyyuq8p) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu5thpzp0jj9roqokbyyuq8p)

[X：Elvis Saravia \(@omarsar0, DAIR.AI\)](https://x.com/omarsar0/status/2100638430229357046) · [AIHOT](https://aihot.news/items/cmu5thpzp0jj9roqokbyyuq8p)

Source publication: 2026-09-17T17:30:04.000Z

好观点！测试之后，Jev 感觉像是构建可靠 AI 系统的一个重要原语。我认为还有更多原语等待被发现，它们能让基于 LLM 的智能体变得更好、更快。

## TypeSafe 开源浏览器智能体 Jev Ultrafast，7.1 秒完成 Google Flights 搜索

[Summary page \(en\)](https://awesomejev.cc/news/cmu5ce77103yero7nv5wgcznx) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu5ce77103yero7nv5wgcznx) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu5ce77103yero7nv5wgcznx)

[Hacker News：AI 热帖](https://github.com/browser-use/jev-ultrafast) · [AIHOT](https://aihot.news/items/cmu5ce77103yero7nv5wgcznx)

Source publication: 2026-09-17T03:12:05.000Z

TypeSafe 发布开源浏览器智能体 Jev Ultrafast，采用动态、带索引的动作空间，每次决策只发一次网络请求，小 LLM 仅在 TYPE\_TEXT 操作时生成文本。

## Dex Horthy：jev 是重读 12 factor agents 的最佳契机

[Summary page \(en\)](https://awesomejev.cc/news/cmu594p4q041cro8tndx9rocs) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu594p4q041cro8tndx9rocs) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu594p4q041cro8tndx9rocs)

[X：Dex Horthy（HumanLayer）\(@dexhorthy\)](https://x.com/dexhorthy/status/2100496400547041778) · [AIHOT](https://aihot.news/items/cmu594p4q041cro8tndx9rocs)

Source publication: 2026-09-17T08:05:41.000Z

HumanLayer 的 Dex Horthy 认为 jev 是重读 12 factor agents 的绝佳契机，因为工具调用本身可拆解为分类+动作。若把 AI 程序设计成在分类、数据结构化、确定性代码与小型智能体式追加对话循环之间切换的流水线，jev 就是极佳的构建模块。引用推文称 jev 让 AI 被组合进系统与产品，而非让 AI 本身成为产品，像是一个此前缺失的原语。

## OpenAI 前 RLHF 研究者 Diogo Almeida 创办 TypeSafe AI，发布不生成文本的结构化决策模型 Jev

[Summary page \(en\)](https://awesomejev.cc/news/cmu57f4kd045rro4o0qrtb1kp) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu57f4kd045rro4o0qrtb1kp) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu57f4kd045rro4o0qrtb1kp)

[IT之家（RSS）](https://www.ithome.com/1/003/584.htm) · [AIHOT](https://aihot.news/items/cmu57f4kd045rro4o0qrtb1kp)

Source publication: 2026-09-17T06:49:46.000Z

TypeSafe AI 于 9 月 16 日发布 System One 模型 Jev，不生成文本，仅输出 Choice、Score、Noul 三类结构化决策，输入词元定价每百万 0.042 美元，输出词元免费。

## Jev 不是聊天机器人：接收文本状态输出结构化打分

[Summary page \(en\)](https://awesomejev.cc/news/cmu56w5ko03gsro4o97xywpzl) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu56w5ko03gsro4o97xywpzl) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu56w5ko03gsro4o97xywpzl)

[X：马东锡 NLP \(@dongxi\_nlp\)](https://x.com/dongxi_nlp/status/2100475029460799584) · [AIHOT](https://aihot.news/items/cmu56w5ko03gsro4o97xywpzl)

Source publication: 2026-09-17T06:40:46.000Z

Jev 不是 chatbot，不能对话，它接收 state（主要是 text data）后打分并输出结构化结果。其定位是固定 workflow 中的"螺丝钉"，适合做日志分析和输出检测。

## 开源项目 jevlike 通过逆向工程复现 Jev 类一次通过选项打分模型

[Summary page \(en\)](https://awesomejev.cc/news/cmu52xi6h095yroqbbz8beyhj) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu52xi6h095yroqbbz8beyhj) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu52xi6h095yroqbbz8beyhj)

[Hacker News 热门（buzzing.cc 中文翻译）](https://github.com/vinnylarouge/jevlike) · [AIHOT](https://aihot.news/items/cmu52xi6h095yroqbbz8beyhj)

Source publication: 2026-09-17T05:13:17.073Z

GitHub 项目 jevlike 发布一个独立起步模型，输入一段文本和 N 个文本选项，单次前向即返回每个选项的概率，输入输出形状与 TypeSafe 未公开设计的商用模型 Jev 相同。

## 前 OpenAI 研究员打造 Jev：不做文本生成、只做选项判断的 AI 模型

[Summary page \(en\)](https://awesomejev.cc/news/cmu48z4fr0ecnro4w8yflkec6) · [Summary page \(zh\)](https://awesomejev.cc/zh/news/cmu48z4fr0ecnro4w8yflkec6) · [Summary page \(ja\)](https://awesomejev.cc/ja/news/cmu48z4fr0ecnro4w8yflkec6)

[The Decoder：AI News（RSS）](https://the-decoder.com/former-openai-researcher-builds-an-ai-model-that-judges-options-instead-of-writing-text) · [AIHOT](https://aihot.news/items/cmu48z4fr0ecnro4w8yflkec6)

Source publication: 2026-09-16T15:19:19.000Z

初创公司 TypeSafe AI 推出模型 Jev，不生成文本，而是在软件内部输出窄域判断与概率，由开发者预设问题与候选答案、模型为选项打分。TypeSafe 称其响应时间为 70 至 500 毫秒，定价为每百万输入 token 0.042 美元、输出不收费，开发者需通过 waitlist 申请接入。公司宣称 Jev 不会产生幻觉，但该保证仅限输出结构，选项内的事实性错误仍可能出现。
