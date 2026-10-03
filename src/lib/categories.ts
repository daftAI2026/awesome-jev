/**
 * [INPUT]: 依赖 既有项目/新闻分类与 i18n 标签契约
 * [OUTPUT]: 对外提供 分类白名单、分类类型及名称/用途文案键映射
 * [POS]: lib 的 taxonomy 权威，采集、路由和界面使用同一分类
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export const CATEGORIES = ['agents', 'applications', 'browser', 'developer', 'resources', 'alternatives', 'directories', 'research', 'sdk', 'other'] as const
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABEL = {
  agents: 'categoryAgents',
  browser: 'categoryBrowser',
  sdk: 'categorySdk',
  developer: 'categoryDeveloper',
  research: 'categoryResearch',
  resources: 'categoryResources',
  directories: 'categoryDirectories',
  applications: 'categoryApplications',
  alternatives: 'categoryAlternatives',
  other: 'categoryOther',
} as const

export const CATEGORY_DESCRIPTION = {
  agents: 'categoryAgentsDescription',
  applications: 'categoryApplicationsDescription',
  browser: 'categoryBrowserDescription',
  developer: 'categoryDeveloperDescription',
  resources: 'categoryResourcesDescription',
  directories: 'categoryDirectoriesDescription',
  alternatives: 'categoryAlternativesDescription',
  research: 'categoryResearchDescription',
  sdk: 'categorySdkDescription',
  other: 'categoryOtherDescription',
} as const

export const NEWS_CATEGORIES = ['ai-models', 'ai-products', 'industry', 'paper', 'tip'] as const

export const NEWS_CATEGORY_LABEL = {
  'ai-models': 'newsCategoryModels',
  'ai-products': 'newsCategoryProducts',
  industry: 'newsCategoryIndustry',
  paper: 'newsCategoryPaper',
  tip: 'newsCategoryTutorial',
} as const
