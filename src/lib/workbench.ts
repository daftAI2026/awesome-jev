/**
 * [INPUT]: 依赖分类白名单、规范项目身份与语言路径规则
 * [OUTPUT]: 对外提供工作台搜索状态校验、规范身份选择、目标路径与项目投影类型
 * [POS]: lib 的单一工作台契约；工具共享目标，不接受任意主机或生产访问开关
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { CATEGORIES, type Category } from './categories.ts'
import { localizedPath, type Locale } from './locale-routes.ts'
import { projectPathFromUrl } from './project-routes.ts'

export const WORKBENCH_TOOLS = ['og', 'seo', 'preview'] as const
export const WORKBENCH_PRESETS = ['home', 'category', 'project', 'top100', 'saved', 'missing'] as const
export type WorkbenchTool = (typeof WORKBENCH_TOOLS)[number]
export type WorkbenchPreset = (typeof WORKBENCH_PRESETS)[number]
export interface WorkbenchProject { url: string; title: string; summary: string; category?: Category }
export interface WorkbenchSearch {
  tool: WorkbenchTool
  preset: WorkbenchPreset
  category: Category
  project?: string
  width: 'desktop' | 'mobile'
}

export function workbenchSearch(input: Record<string, unknown>): WorkbenchSearch {
  return {
    tool: WORKBENCH_TOOLS.find((value) => value === input.tool) ?? 'og',
    preset: WORKBENCH_PRESETS.find((value) => value === input.preset) ?? 'home',
    category: CATEGORIES.find((value) => value === input.category) ?? 'browser',
    project: typeof input.project === 'string' && projectPathFromUrl(input.project) ? input.project : undefined,
    width: input.width === 'mobile' ? 'mobile' : 'desktop',
  }
}

export function workbenchPage(search: WorkbenchSearch, locale: Locale, project?: WorkbenchProject): string {
  const path = search.preset === 'category' ? `/category/${search.category}`
    : search.preset === 'project' ? (project && projectPathFromUrl(project.url)) || '/__workbench-missing-page'
    : search.preset === 'top100' ? '/top100'
    : search.preset === 'saved' ? '/saved'
    : search.preset === 'missing' ? '/__workbench-missing-page' : '/'
  return localizedPath(path, locale)
}

export function selectWorkbenchProject(projects: readonly WorkbenchProject[], requested?: string): WorkbenchProject | undefined {
  const path = requested && projectPathFromUrl(requested)
  return (path && projects.find((item) => projectPathFromUrl(item.url) === path)) || projects[0]
}
