<!--
[INPUT]: 规范项目/新闻快照、路由语言与 Workers 静态资产
[OUTPUT]: Agents 页脚与构建期机器文档的公开边界
[POS]: docs 的机器阅读契约；视觉规则仍归 design.md
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# Agents 页脚与机器文档

## 依赖方向

App 保留原社区说明，挂载 AgentsFooter。
AgentsFooter 复用路由语言与本站主题。
布局、按钮名称和图标按 OpenFree 原版复制。
agent-links 提供五品牌和文档清单。
站名读取英文 documentTitle。域名读取 SITE_ORIGIN。
不引入 Router、AI SDK 或聊天请求。

## 构建出口

`npm run agents:generate` 读取规范快照。
`npm run build` 在 Vite 构建前运行生成器。
生成器复用项目/新闻校验、分类、排名和路径。
生成八份互链 Markdown、llms.txt 与 llms-full.txt。
`public/agents/CLAUDE.md` 记录生成成员。
禁止手工编辑生成文档或双写目录事实。

项目文档仅输出作者简介、主题、分类、语言和星标。
项目链接使用真实三语言详情地址和 GitHub 来源。
新闻文档仅输出有摘要的条目及双来源地址。
不输出审核分数、身份审计、本机收藏或凭据。
标签没有独立路由。合集仅说明 Top 100 与本机收藏。
不制造价格、广告、案例或指南页面。
作者文本转义后进入 Markdown，不执行原文 HTML。

`public/_headers` 定义 TXT 的 text/plain。
同一文件定义 Markdown 的 text/markdown。
机器文档响应均使用 nosniff。
此规则由 Workers Static Assets 执行。

## 外链与诚实边界

ChatGPT、Claude、Perplexity、Gemini、Grok 共用公开问题。
URLSearchParams 将问题编码为 q。
问题要求先读文档、引用来源、声明读取失败。
英文、中文和日文问题指定对应回答语言。
不发送搜索词、收藏、Token 或隐藏上下文。
外链使用新窗口及 noopener noreferrer。

Gemini 品牌入口指向 Google AI Mode。
按钮 title 与 accessible name 仅标识品牌。
不在按钮名称后追加 Google AI Mode。
Footer 不显示独立免责声明段落。
不声称 Gemini App 支持官方预填深链。
提供方决定是否采用 q，不保证自动发送。
SVG 采用 OpenFree 原版，README 记录来源。
交接包 MIT 正文保留，不扩大其适用范围。
OpenAI 与 Grok 暗色反相，彩色品牌保留原色。
品牌不表示合作或背书。
机器文档不证明搜索收录，不保证引用或 GEO 排名。

## 验证

运行 typecheck、lint、test、build 与 test:delivery。
离线测试验证快照一致性、互链和公开字段边界。
单测不要求采集器额外提交派生文档。
交付测试核对已构建文档与当前规范快照。
交付测试匿名 GET 文档并验证媒体类型。
交付测试检查全部本站文档与实体链接。
浏览器验收三语言、明暗、键盘与 320 CSS px。
用户确认预览后才提交、推送和发布。
线上完成以实际远端 SHA 和部署结果为准。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
