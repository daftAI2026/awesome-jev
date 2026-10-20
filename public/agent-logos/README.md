<!--
[INPUT]: OpenFree 资产、交接包许可与官方客户端品牌资产
[OUTPUT]: 品牌资产来源与安全转换记录
[POS]: public/agent-logos 的来源凭据；不构成商标授权
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# 聊天入口与 MCP 客户端品牌资产

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

## MCP 客户端识别

Claude 家族的 MCP 标签使用下述厂商单色标。
ChatGPT 与 Codex 复用 `openai.svg`。
它保留 OpenAI Blossom 原路径。
该图标识别厂商，不声称是 Codex 专属图标。
复用不改变既有文件，也不新增运行时下载。

### Anthropic 厂商单色标

于 2026-10-21 读取 [Anthropic 官方 press-kit](https://www.anthropic.com/press-kit)。
以下文件保持 ZIP 原始字节，不裁切、不改色。
它们标识 Anthropic 厂商，不冒充 Claude 产品专属图标。
Claude 与 Claude Code 的 MCP 标签可共用厂商标。
页脚继续使用既有 `claude-ai-icon.svg`。

| 本地文件 | ZIP 内路径（`Anthropic media resources/Anthropic logos/Anthropic logos/` 下） | viewBox | 字节 |
| --- | --- | --- | --- |
| `anthropic.svg` | `2 Anthropic symbol/SVG/Anthropic symbol - Slate.svg` | `0 0 92 64` | 350 |
| `anthropic-dark.svg` | `2 Anthropic symbol/SVG/Anthropic symbol - Ivory.svg` | `0 0 92 64` | 340 |

原版 SHA256：

```text
anthropic.svg       d55918884053460f24c958fca3fba8d10b48fdd86e73ba3cd1237713bc0a03bb
anthropic-dark.svg  38fc06d8e9390654cc4e96aa53691e2e78d929667c0034805b6d1b3891ba22dd
```

press-kit SHA256：`c68ac92df86c825f95177e24016fcc9a8863a3fd4ca344fe6f0700b2c1e07151`。
包内独立 Claude Spark 只有 Clay 橙色版本。
不从完整字标裁切 Spark，也不把橙色原件改黑。
浅色背景使用 Slate，深色背景使用 Ivory。
[Anthropic 品牌规则](https://www.anthropic.com/legal/trademark-guidelines) 禁止改变颜色或比例。
资源包未附独立开源许可，不套用其他资产的 MIT。
本来源记录不代替品牌使用许可或表示官方背书。

### Cursor

Cursor 使用 [官方品牌页](https://cursor.com/brand) 的资源。
于 2026-10-21 读取 [官方 ZIP](https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/brand/cursor-brand-assets.zip)。

- `cursor.svg`：原样复制 `General Logos/Cube/SVG/CUBE_2D_LIGHT.svg`。
- `cursor-dark.svg`：原样复制 `General Logos/Cube/SVG/CUBE_2D_DARK.svg`。

浅色与深色背景各用对应原版，不对 Cursor 改色。
两份 SVG 各为 793 字节，无脚本或外部引用。
该包未附独立 LICENSE，不套用 LobeHub MIT。

### VS Code

MCP 标签使用 Microsoft 官方 `vscode-codicon.svg`。
它是 [Codicons 的 VS Code UI glyph](https://github.com/microsoft/vscode-codicons/blob/5a6ad49557af022f97987cb3cfc3412b5d03f554/src/icons/vscode.svg)，不是修改后的 stable 产品标。
固定提交为 `5a6ad49557af022f97987cb3cfc3412b5d03f554`。
原件为 16×16，共 1040 字节，保留 `fill="currentColor"`。
SHA256 为 `f9130337f239b034092a047fd4b2c771843f0b58362447b4b94e0ed9d6bb9886`。
图形版权归 Microsoft 与上游贡献者。
图形采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，正文保留在 `CODICONS-LICENSE.txt`。
该文件与固定提交的 LICENSE 字节相同。
许可 SHA256 为 `af5e030844efddbc7ab00dcfea8b019703753d4d9f5172d727c533a492aec665`。
SVG 未作修改；只用于客户端配置教程识别。
上游 [README](https://github.com/microsoft/vscode-codicons/blob/5a6ad49557af022f97987cb3cfc3412b5d03f554/README.md) 不授予商标权，不将版权许可写成品牌授权。

### Hermes

MCP 标签使用官方 `hermes-mono.png`。
源文件是 [Hermes desktop 原版 tinted 图](https://github.com/NousResearch/hermes-agent/blob/5eee5d02e85eaad32dfade3030d27fcfad204e72/apps/desktop/assets/icon.icon/Assets/mono.png)。
固定提交为 `5eee5d02e85eaad32dfade3030d27fcfad204e72`。
该图为 1024×1024 PNG，共 75581 字节。
SHA256 为 `8e88dcec5b87a07eadd3a89d8f029f0eddd5f456aae29ae3c54c36e08bca4a55`。
原件包含灰度、白色与透明通道，不使用 CSS 去色。
该提交的 MIT 正文原样保存在 `HERMES-LICENSE.txt`。
该许可不代表本站获得商标背书。

### Gemini CLI

页脚继续使用原 `gemini.svg`，不改色或路径。
MCP 标签使用 [Gemini CLI 官方品牌页](https://geminicli.com/brand-kit/) 的单色配对。
于 2026-10-21 读取，保持原 SVG 字节、路径与遮罩。

| 本地文件 | 官方来源 | 尺寸 | 字节 |
| --- | --- | --- | --- |
| `gemini-cli-mono.svg` | [Monotone on light](https://geminicli.com/brandassets/gemini-cli-icon_monotone_on_light.svg) | 512×512 | 2321 |
| `gemini-cli-mono-dark.svg` | [Monotone on dark](https://geminicli.com/brandassets/gemini-cli-icon_monotone_on_dark.svg) | 512×512 | 2321 |

原版 SHA256：

```text
gemini-cli-mono.svg       4ecb094718b12b9f865e6c26cbea5ccd0aad0d54ae9154bad7b3b5e36bb102ac
gemini-cli-mono-dark.svg  60efbc885db0e30b839459e5aa991ca15a6fc439bf18d971f673cf63398c1834
```

[官方图标指南](https://geminicli.com/brandassets/gemini_cli_logo_icon_guidelines.pdf) 要求不修改资产。
浅色与深色背景分别使用对应原版。
不使用去色滤镜，不套用 CLI 软件的 Apache 许可。
识别用途同时遵循 [Google 品牌规则](https://about.google/brand-resource-center/guidance/)。

### 既有单色原件完整性

以下文件保持既有字节。MCP 标签复用不覆盖页脚原件。

| 文件 | viewBox | 字节 | SHA256 |
| --- | --- | --- | --- |
| `openai.svg` | `0 0 256 260` | 1690 | `a4b4dae5e28790a0fb3dc7b5d8bb199b0dd6938a002e52a8b6355394c321718e` |
| `cursor.svg` | `0 0 466.73 532.09` | 793 | `c483c02f78eb2619778fdd959e72a9adfac4844854472cd2653d4cbfd60e4d71` |
| `cursor-dark.svg` | `0 0 466.73 532.09` | 793 | `cd0e3e5d8991a4cdd4577f8896cd063105207665165c73e25a1ff918dd367eb7` |

品牌使用边界见 [OpenAI](https://openai.com/brand/) 与 [Anthropic](https://www.anthropic.com/legal/trademark-guidelines) 官方指南。
公开文件来源不构成本站已获商标授权的证明。
品牌商标归各自权利人；入口不表示合作或背书。
界面图标继续使用 Phosphor，不引入第二套图标库。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
