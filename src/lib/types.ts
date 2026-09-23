export type ItemType = 'github' | 'x' | 'youtube'

/** GitHub, X, and YouTube collectors may emit null for unknown fields. */
export interface SourceMeta {
  stars?: number | null
  forks?: number | null
  openIssues?: number | null
  language?: string | null
  author?: string | null
  handle?: string | null
  likes?: number | null
  replies?: number | null
  retweets?: number | null
  bookmarks?: number | null
  date?: string | null
  repo?: string | null
  /** X / YouTube: remote preview image URLs (first used as card image / video poster). */
  mediaUrls?: string[] | null
  /** X: remote mp4 URLs from the post; the UI plays the first inside the card. */
  videoUrls?: string[] | null
  /** Optional profile avatar URL (X or GitHub). */
  avatarUrl?: string | null
  /** YouTube: watch id `xxxxxxxxxxx`. */
  videoId?: string | null
  /** YouTube: view count. */
  views?: number | null
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
  /** GitHub / YouTube only. X posts live in `data/x.json` and omit tags. */
  tags?: string[]
  url: string
  sourceMeta: SourceMeta
}

export type FilterType = ItemType

export type GithubSort = 'stars' | 'date' | 'name'
export type GithubView = 'cards' | 'list'
export type XSort = 'date' | 'likes'
export type YoutubeSort = 'date' | 'views'
