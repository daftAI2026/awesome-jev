<!--
[INPUT]: 规范项目/新闻快照、路由语言与 Workers 静态资产
[OUTPUT]: Agents 页脚、机器文档与匿名只读 MCP 的公开边界
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
聊天入口不引入 AI SDK 或聊天请求。
MCP 链接指向同语言公开接入页。

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
标签文档区分原始主题与公开标签路由。
合集仅说明 Top 100 与本机收藏。
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
提交、推送和发布遵循本次明确授权。
线上完成以实际远端 SHA 和部署结果为准。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## 匿名只读 MCP

三语言 `/mcp` 是静态接入指南。
`/api/mcp` 是 Streamable HTTP 协议入口。
`/mcp.md` 提供可复制的原生客户端配置。
`mcp-config.ts` 是地址和配置的单一来源。
公开服务不要求账户、密钥、OAuth 或 Skill。
客户端自身决定连接功能与模型费用。

服务只注册 `search_projects` 和 `get_project`。
它们读取同一次构建的公开项目快照。
构建生成字段白名单、身份表和排序。
请求不访问 GitHub，不调用模型，不写目录。
结果提供来源 URL、站内 URL 和快照版本。
可信数据提交时间存在时才返回更新时间。
隐藏记录、内部审核和身份审计不进入快照。
旧地址返回当前公开身份；隐藏旧 ID 不返回。
描述与证据是来源数据，不是 Agent 指令。

协议 SDK 2.3.1 支持当前与旧版无会话请求。
SDK 校验器在 isolate 启动期初始化。
不得改为首请求动态加载整个 SDK。
每次 POST 只允许一条消息，正文最多 16 KiB。
JSON 最多 32 层；无效 UTF-8 和批量消息拒绝。
关键词最多 160 字符和八词，单页最多 20 项。
每条公开投影最多 4 KiB JSON，超限阻断构建。
请求不重建 Fuse 索引，不执行动态排序。
浏览器请求校验完整 Origin；无 Origin 客户端可用。
匿名 IP 在每个边缘位置共享每分钟 120 次额度。
限流异常返回 503；限流命中返回 429。
限流不保证精确全局配额，也不阻止请求计费。
服务不记录搜索参数或请求正文。
平台保留脱敏 URL、状态、CPU 与请求元数据。

`server.json` 是官方 Registry 发布元数据。
Registry 不托管服务，不保证安全认证或排名。
Glama 提交与实际目录收录必须分别核验。
生产 HTTP 与 CPU 验收通过后才提交目录。


## Public tags

Generated `tags.md` distinguishes raw repository topics from the normalized public navigation and links `/tags` plus shared tag pages. Raw topic evidence remains in the document. The source no longer claims the site has no tag route. The same explicit aliases and count threshold power HTML and generated navigation.
