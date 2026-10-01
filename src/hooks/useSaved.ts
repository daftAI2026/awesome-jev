/**
 * [INPUT]: 依赖 React 生命周期、浏览器 localStorage 与 lib/saved 纯存储契约
 * [OUTPUT]: 对外提供 useSaved 收藏状态与可失败的切换操作
 * [POS]: hooks 的浏览器存储适配层，为目录和详情提供同一收藏接口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { parseSaved, SAVED_KEY, toggleSaved, type SavedKind } from '@/lib/saved'

function readSaved() {
  try { return parseSaved(localStorage.getItem(SAVED_KEY)) } catch { return [] }
}

export function useSaved() {
  const [entries, setEntries] = useState<ReturnType<typeof readSaved>>([])
  const entriesRef = useRef(entries)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    const initial = readSaved()
    entriesRef.current = initial
    setEntries(initial)
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SAVED_KEY && event.key !== null) return
      const next = readSaved()
      entriesRef.current = next
      setEntries(next)
      setSaveError(false)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggle = useCallback((kind: SavedKind, id: string) => {
    try {
      const next = toggleSaved(entriesRef.current, kind, id, new Date().toISOString())
      localStorage.setItem(SAVED_KEY, JSON.stringify(next))
      entriesRef.current = next
      setEntries(next)
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }, [])

  return { entries, toggle, saveError }
}
