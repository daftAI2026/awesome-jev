/**
 * [INPUT]: 依赖正式站点 origin、英文站名与三语言路径类型
 * [OUTPUT]: 提供机器文档清单、五个品牌与公开提示词外链
 * [POS]: lib 的 Agents 入口契约；Footer 与构建生成器共用，不调用聊天 API
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { SITE_ORIGIN } from './share-image.ts'
import type { Locale } from './locale-routes.ts'
import { en } from '../i18n/locales/en.ts'

export const AGENT_SITE_NAME = en.documentTitle.split(' · ')[0]
export const AGENT_DOCUMENTS = ['index.md', 'categories.md', 'tags.md', 'collections.md', 'projects.md', 'news.md', 'submit.md', 'about.md'] as const
export const AGENT_DOCUMENT_PATHS = ['/llms.txt', '/llms-full.txt', ...AGENT_DOCUMENTS.map((name) => `/agents/${name}`)]

export const AGENT_PROVIDERS = [
  { name: 'ChatGPT', endpoint: 'https://chatgpt.com/', icon: '/agent-logos/openai.svg', monochrome: true },
  { name: 'Claude', endpoint: 'https://claude.ai/new', icon: '/agent-logos/claude-ai-icon.svg', monochrome: false },
  { name: 'Perplexity', endpoint: 'https://www.perplexity.ai/search', icon: '/agent-logos/perplexity.svg', monochrome: false },
  // --- Gemini 品牌入口使用 Google AI Mode，不声称 Gemini App 支持预填深链 ---
  { name: 'Gemini', endpoint: 'https://www.google.com/search?udm=50', icon: '/agent-logos/gemini.svg', monochrome: false },
  { name: 'Grok', endpoint: 'https://grok.com/', icon: '/agent-logos/grok.svg', monochrome: true },
] as const

export function agentPrompt(locale: Locale): string {
  const sources = `${SITE_ORIGIN}/llms.txt ${SITE_ORIGIN}/llms-full.txt`
  const task = {
    en: `Read ${sources} first. Explain how ${AGENT_SITE_NAME} helps discover TypeSafe Jev / System One GitHub projects, categories, Top 100 and source-attributed news. Cite relevant public pages and original sources. Distinguish repository descriptions from inclusion evidence; alternatives do not imply Jev API compatibility or affiliation. If you cannot access the documents, say so and do not invent conclusions. Answer in English.`,
    zh: `请先阅读 ${sources}，说明 ${AGENT_SITE_NAME} 如何发现 TypeSafe Jev / System One 的 GitHub 项目、分类、Top 100 和注明来源的新闻。引用对应公开页面及原始来源。区分仓库作者简介与收录依据；替代实现不代表 Jev API 兼容或官方关联。若无法访问资料，请明确说明，不编造结论。用中文回答。`,
    ja: `まず ${sources} を読んでください。${AGENT_SITE_NAME} で TypeSafe Jev / System One の GitHub プロジェクト、分類、Top 100、出典付きニュースを探す方法を説明してください。公開ページと原典を引用してください。作者の説明と収録根拠を区別し、代替実装の API 互換性や公式提携を推測しないでください。資料にアクセスできない場合は明示し、結論を作らないでください。日本語で回答してください。`,
  }
  return task[locale]
}

export function agentChatLinks(locale: Locale) {
  return AGENT_PROVIDERS.map(({ endpoint, ...provider }) => {
    const url = new URL(endpoint)
    url.searchParams.set('q', agentPrompt(locale))
    return { ...provider, href: url.href }
  })
}
