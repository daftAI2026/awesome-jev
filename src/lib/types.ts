export type ItemType = 'github'

/** GitHub metadata may be absent when upstream does not provide a value. */
export interface SourceMeta {
  stars?: number | null
  forks?: number | null
  language?: string | null
  author?: string | null
  date?: string | null
  repo?: string | null
  /** Collector: Jev noul P(this row is about TypeSafe Jev). */
  jevAbout?: number | null
  /** Collector: Jev choice for keeping the row on the board. */
  jevKeep?: 'keep' | 'review' | 'drop' | null
  /** Collector: confidence of `jevKeep` (Choice confidence, 0–1). */
  jevKeepConfidence?: number | null
  /** Collector: pinned source used during repository review. */
  jevEvidence?: { evidenceUrl: string } | null
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
