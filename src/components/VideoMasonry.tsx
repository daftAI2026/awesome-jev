import type { DirectoryItem } from '@/lib/types'
import { CardMasonry } from '@/components/CardMasonry'

export function VideoMasonry({ items }: { items: DirectoryItem[] }) {
  return <CardMasonry items={items} />
}
