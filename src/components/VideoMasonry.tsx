/**
 * [INPUT]: 依赖 DirectoryItem 展示类型与 CardMasonry 的共享有序布局
 * [OUTPUT]: 对外提供 VideoMasonry 的条目布局转接组件
 * [POS]: components 的兼容展示入口，复用 CardMasonry 而不建立独立布局算法或数据来源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { DirectoryItem } from '@/lib/types'
import { CardMasonry } from '@/components/CardMasonry'

export function VideoMasonry({ items }: { items: DirectoryItem[] }) {
  return <CardMasonry items={items} />
}
