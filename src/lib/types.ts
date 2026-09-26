import type { InclusionBasis } from './inclusion.ts'

export type ItemType = 'github'

/** GitHub metadata may be absent when upstream does not provide a value. */
export interface SourceMeta {
  stars?: number | null
  forks?: number | null
  language?: string | null
  author?: string | null
  date?: string | null
  repo?: string | null
  /** 采集器：配置的相关性命题（Jev 生态或独立实现）的 Noul 概率。 */
  jevAbout?: number | null
  /** Collector: Jev choice for keeping the row on the board. */
  jevKeep?: 'keep' | 'review' | 'drop' | null
  /** Collector: confidence of `jevKeep` (Choice confidence, 0–1). */
  jevKeepConfidence?: number | null
  /** Collector: pinned source used during repository review. */
  jevEvidence?: { evidenceUrl: string } | null
  /** 收录说明独立于作者简介和模型评分；缺失时不能从评分推断。 */
  inclusion?: InclusionBasis
}

export interface DirectoryItem {
  id: string
  type: ItemType
  title: string
  summary: string
  /** GitHub repository topics. */
  tags?: string[]
  url: string
  sourceMeta: SourceMeta
}

export type FilterType = ItemType

export type GithubSort = 'stars' | 'date' | 'name'
export type GithubView = 'cards' | 'list'
