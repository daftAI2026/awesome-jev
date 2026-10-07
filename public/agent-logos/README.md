<!--
[INPUT]: OpenFree 原版 Footer 的公开 SVG 与交接包许可
[OUTPUT]: 品牌资产来源与安全转换记录
[POS]: public/agent-logos 的来源凭据；不构成商标授权
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# 聊天入口品牌资产

按用户要求复用 [OpenFree 原版页脚](https://openfree.tools/) 图标。
于 2026-10-08 从其公开 `/logos/` 目录读取。

- [openai.svg](https://openfree.tools/logos/openai.svg)：原样复制。
- [claude-ai-icon.svg](https://openfree.tools/logos/claude-ai-icon.svg)：原样复制。
- [perplexity.svg](https://openfree.tools/logos/perplexity.svg)：原样复制。
- [gemini.svg](https://openfree.tools/logos/gemini.svg)：原样复制。
- [grok.svg](https://openfree.tools/logos/grok.svg)：保留视觉路径、颜色与滤镜。

Grok 移除了 Figma 导出的 foreignObject。
该节点仅声明背景模糊，不包含图标路径。
不允许脚本、外部引用或 HTML 嵌入。

Perplexity 与交接包 SVG 的 SHA256 一致。
其来源是 `@lobehub/icons-static-svg@1.95.1`。
对应源提交为 `49a2130df7bfa5eb1b088261bff20a37e2967789`。
交接包的 LobeHub MIT 正文保留在 LICENSE.txt。
不能将此许可自动扩大到其他原版资产。
OpenFree 公开资产未声明单独的再分发许可。
本文件只记录来源，不另行授予资产权利。
品牌商标归各自权利人；入口不表示合作或背书。
界面图标继续使用 Phosphor，不引入第二套图标库。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
