export const CATEGORIES = ['agents', 'browser', 'sdk', 'developer', 'research', 'resources', 'applications', 'other'] as const
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABEL = {
  agents: 'categoryAgents',
  browser: 'categoryBrowser',
  sdk: 'categorySdk',
  developer: 'categoryDeveloper',
  research: 'categoryResearch',
  resources: 'categoryResources',
  applications: 'categoryApplications',
  other: 'categoryOther',
} as const

export const NEWS_CATEGORIES = ['ai-models', 'ai-products', 'industry', 'paper', 'tip'] as const

export const NEWS_CATEGORY_LABEL = {
  'ai-models': 'newsCategoryModels',
  'ai-products': 'newsCategoryProducts',
  industry: 'newsCategoryIndustry',
  paper: 'newsCategoryPaper',
  tip: 'newsCategoryTutorial',
} as const
