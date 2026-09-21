import { createHash } from 'node:crypto'
import { TextDecoder } from 'node:util'
import { candidateRow } from './catalog.ts'
import { evidenceIssue } from './github-evidence.ts'
import { FACT_MODEL, FACT_NAMES, FACT_BATCH_BYTES, FACT_BATCH_ITEMS, reviewDecision } from './jev-client.ts'
import { memoryReviewStore } from './review-store.ts'
import type {
  FactScores,
  ReviewApi,
  ReviewEvidence,
  ReviewFile,
  ReviewOptions,
  ReviewPart,
  ReviewQueueEntry,
  ReviewRepository,
  ReviewResult,
  ReviewRow,
  ReviewSegment,
  ReviewTask,
  Reviewer,
} from './review-types.ts'
import { isRecord, stringValue } from './review-types.ts'

export const REVIEW_POLICY = 'whole-project-v1'
const MAX_BLOB_BYTES = 8 * 1024 * 1024
const SEGMENT_BYTES = 8000
const shaPattern = /^[a-f0-9]{40}$/
const decoder = new TextDecoder('utf-8', { fatal: true })
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')

export const taskId = (key: string): string => digest([REVIEW_POLICY, FACT_MODEL, key])

const safePath = (path: string): boolean => typeof path === 'string' && path.length <= 4096 &&
  ![...path].some((character) => character.charCodeAt(0) < 32) && !path.startsWith('/') &&
  !path.split('/').some((part) => !part || part === '.' || part === '..')

const urlFor = (task: ReviewTask, file: ReviewFile, part?: ReviewPart): string =>
  `https://github.com/${task.repo}/blob/${task.sha}/${file.path.split('/').map(encodeURIComponent).join('/')}${part ? `#L${part.lineStart}-L${part.lineEnd}` : ''}`

export function exclusion(path: string, mode: string): string | null {
  if (!safePath(path)) return 'unsafe-path'
  if (mode === '120000') return 'symlink'
  if (mode === '160000') return 'submodule'
  if (/(?:^|\/)(?:node_modules|vendor|third_party|third-party|external|\.venv|venv)(?:\/|$)/i.test(path)) return 'dependency'
  if (/(?:^|\/)(?:\.git|dist|build|coverage|\.next|target|__pycache__)(?:\/|$)|(?:^|\/)(?:package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|go\.sum)$|\.(?:map|min\.[jt]s)$/i.test(path)) return 'generated'
  if (/(?:^|\/)(?:\.env(?:\.|$)|credentials(?:\.[^/]*)?$|secrets?\.(?:json|ya?ml|toml)$|id_rsa$)|\.(?:pem|key|p12|pfx)$/i.test(path)) return 'sensitive'
  if (/\.(?:png|jpe?g|gif|ico|webp|pdf|zip|gz|7z|tar|mp[34]|wav|ogg|woff2?|ttf|eot|exe|dll|so|dylib|wasm|bin|gb|rom)$/i.test(path)) return 'binary'
  return null
}

export function segmentText(text: string): ReviewPart[] {
  const parts: ReviewPart[] = []
  let start = 0
  let end = 0
  let bytes = 0
  let lineStart = 1
  let lineEnd = 1
  for (const character of text) {
    const size = Buffer.byteLength(JSON.stringify(character)) - 2
    if (bytes + size > SEGMENT_BYTES) {
      parts.push({ start, end, lineStart, lineEnd })
      start = end
      bytes = 0
      lineStart = lineEnd
    }
    end += character.length
    bytes += size
    if (character === '\n') lineEnd++
  }
  if (end > start) parts.push({ start, end, lineStart, lineEnd })
  return parts
}

const validFacts = (facts: unknown): facts is FactScores => {
  if (!isRecord(facts)) return false
  return FACT_NAMES.every((name: string) => {
    const value = facts[name]
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
  })
}

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : ''

function validateTask(task: ReviewTask, key: string): void {
  if (task.policy !== REVIEW_POLICY || task.repo !== key || !shaPattern.test(task.sha) || !Array.isArray(task.files) ||
    !Array.isArray(task.queue) || !task.row || task.row.url !== `https://github.com/${key}` || typeof task.initialDone !== 'boolean') {
    throw new Error('submission-invalid-task')
  }
  for (const directory of task.queue) {
    if (!shaPattern.test(directory.sha) || (directory.path && !safePath(directory.path))) throw new Error('submission-invalid-task')
  }
  for (const file of task.files) {
    if (typeof file.path !== 'string' || !['pending', 'done', 'excluded', 'blocked'].includes(file.status) ||
      (file.parts && (!Array.isArray(file.parts) || file.parts.some((part) =>
        !Number.isSafeInteger(part.start) || !Number.isSafeInteger(part.end) || part.start < 0 || part.end <= part.start ||
        (part.facts && !validFacts(part.facts)))))) throw new Error('submission-invalid-task')
  }
}

export function taskResult(task: ReviewTask, pending = false): ReviewResult {
  const eligible = task.files.filter((file) => file.status !== 'excluded')
  const progress = {
    checked: eligible.filter((file) => file.status === 'done').length,
    total: eligible.length,
    excluded: task.files.length - eligible.length,
    blocked: eligible.filter((file) => file.status === 'blocked').length,
    inventoryComplete: task.queue.length === 0,
  }
  const entries = task.files.flatMap((file) => (file.parts ?? []).filter((part) => part.facts).map((part) => ({ file, part })))
  const base = { repo: task.repo, deep: true, progress, evidence: `https://github.com/${task.repo}/tree/${task.sha}` }
  const linksFor = (predicate: (part: ReviewPart) => boolean): string[] => entries
    .filter(({ part }) => predicate(part))
    .slice(0, 3)
    .map(({ file, part }) => urlFor(task, file, part))
  const relatedLinks = (): string[] => [...entries]
    .filter(({ part }) => (part.facts?.related ?? 0) >= 0.5)
    .sort((a, b) => (b.part.facts?.related ?? 0) - (a.part.facts?.related ?? 0))
    .slice(0, 3)
    .map(({ file, part }) => urlFor(task, file, part))
  if (pending || task.queue.length || eligible.some((file) => file.status === 'pending')) {
    return { ...base, status: 'pending', reason: 'scan-pending' }
  }
  if (progress.blocked) {
    return {
      ...base,
      status: 'review',
      reason: 'incomplete-evidence',
      evidenceLinks: eligible.filter((file) => file.status === 'blocked').slice(0, 3).map((file) => urlFor(task, file)),
    }
  }
  if (task.instructionFlag || entries.some(({ part }) => (part.facts?.injection ?? 0) >= 0.5)) {
    return {
      ...base,
      status: 'review',
      reason: 'instruction-like-evidence',
      evidenceLinks: linksFor((part) => (part.facts?.injection ?? 0) >= 0.5),
    }
  }
  if (entries.some(({ part }) => (part.facts?.conflict ?? 0) >= 0.5)) {
    return {
      ...base,
      status: 'review',
      reason: 'conflicting-evidence',
      evidenceLinks: linksFor((part) => (part.facts?.conflict ?? 0) >= 0.5),
    }
  }
  const supports = entries.filter(({ part }) => {
    const facts = part.facts
    return facts !== undefined && facts.related >= 0.9 && facts.useful >= 0.9 && facts.mock < 0.5
  })
  if (supports.length) {
    return { ...base, status: 'keep', evidenceLinks: supports.slice(0, 3).map(({ file, part }) => urlFor(task, file, part)) }
  }
  if (entries.length && entries.every(({ part }) => (part.facts?.related ?? 0) <= 0.1)) {
    return { ...base, status: 'drop', reason: 'unrelated-evidence' }
  }
  return {
    ...base,
    status: 'review',
    reason: entries.some(({ part }) => (part.facts?.related ?? 0) >= 0.9)
      ? 'insufficient-usage-evidence'
      : 'insufficient-provider-context',
    evidenceLinks: relatedLinks(),
  }
}

interface GitCommitResponse { tree?: { sha?: unknown } }
interface GitTreeEntry { path?: unknown; mode?: unknown; sha?: unknown; type?: unknown; size?: unknown }
interface GitTreeResponse { tree?: unknown; truncated?: unknown }
interface GitBlobResponse { encoding?: unknown; content?: unknown }

const asRepository = (value: ReviewRepository): ReviewRepository => value
const asRow = (value: unknown): ReviewRow => value as ReviewRow

export async function reviewRepository(
  api: ReviewApi,
  review: Reviewer,
  key: string,
  evidence: ReviewEvidence,
  {
    store = memoryReviewStore(),
    inspect,
    manual = false,
    deadline = Infinity,
    maxOperations = 300,
  }: ReviewOptions = {},
): Promise<ReviewResult> {
  const id = taskId(key)
  const context = digest([evidence.repo.name, evidence.repo.description ?? '', key, REVIEW_POLICY, FACT_MODEL])
  let task = await store.load(id)
  if (task) validateTask(task, key)
  // 未完任务固定旧版本继续；完成后只有版本改变才重建，不靠重复抽签提高置信度。
  if (task?.result && (task.sha !== evidence.sha || task.context !== context)) task = null
  let operations = 0
  const read = async (path: string): Promise<unknown> => {
    if (++operations > maxOperations || Date.now() >= deadline) throw new Error('submission-run-budget')
    return api(path)
  }
  if (!task) {
    const commit = await read(`/repos/${key}/git/commits/${evidence.sha}`) as GitCommitResponse
    const treeSha = stringValue(commit.tree?.sha)
    if (!treeSha || !shaPattern.test(treeSha)) throw new Error('github-invalid-tree')
    const repository = asRepository(evidence.repo)
    const row = asRow(candidateRow(repository as Parameters<typeof candidateRow>[0]))
    task = {
      policy: REVIEW_POLICY,
      context,
      repo: key,
      sha: evidence.sha,
      row: { ...row, url: `https://github.com/${key}` },
      initialDone: false,
      queue: [{ path: '', sha: treeSha }],
      files: [],
      inFlight: null,
      instructionFlag: evidenceIssue(repository as Parameters<typeof evidenceIssue>[0], evidence.text) === 'instruction-like-evidence',
    }
    await store.save(id, task)
  }
  if (task.result) return task.result
  if (task.inFlight) {
    if (!manual) return { ...taskResult(task, true), status: 'review', reason: 'unconfirmed-request' }
    task.inFlight = null
    await store.save(id, task)
  }
  const checkpoint = (): Promise<void> => store.save(id, task as ReviewTask)
  const finish = async (): Promise<ReviewResult> => {
    const result = task?.result
    if (!result) throw new Error('submission-invalid-task')
    task.completedAt = new Date().toISOString()
    const progress = result.progress ?? {}
    task.receipt = {
      ...progress,
      manifestHash: digest(task.files.map(({ path, sha, status, reason }) => ({ path, sha, status, reason }))),
      limitations: task.files.filter((file) => file.status === 'blocked').map(({ path, reason }) => ({ path, reason })),
      exclusions: Object.fromEntries([...new Set(task.files.filter((file) => file.status === 'excluded').map((file) => file.reason))]
        .map((reason) => [reason ?? 'unknown', task.files.filter((file) => file.status === 'excluded' && file.reason === reason).length])),
      segments: task.files.reduce((count, file) => count + (file.parts?.length ?? 0), 0),
      models: [...new Set(task.files.flatMap((file) => (file.parts ?? []).map((part) => part.model).filter((model): model is string => !!model)))],
    }
    task.files = []
    task.queue = []
    task.initial = null
    task.inFlight = null
    await checkpoint()
    return result
  }
  const paid = async <T>(kind: 'initial' | 'segments', invoke: (beforeRequest: () => Promise<void>) => Promise<T>): Promise<T> => {
    try {
      return await invoke(async () => {
        if (Date.now() >= deadline) throw new Error('submission-run-budget')
        task!.inFlight = { kind, at: new Date().toISOString() }
        await checkpoint()
      })
    } catch (error: unknown) {
      // 连接中断或成功响应无法解析时无法确认是否已计费，不自动再次发送。
      if (!['jev-network-or-timeout', 'jev-invalid-response'].includes(errorMessage(error))) {
        task!.inFlight = null
        await checkpoint()
      }
      throw error
    }
  }
  try {
    if (!task.initialDone) {
      const initialAllowed = evidence.sha === task.sha && evidence.text.length <= 12000 &&
        !evidenceIssue(evidence.repo as Parameters<typeof evidenceIssue>[0], evidence.text)
      if (initialAllowed) {
        const score = await paid('initial', (beforeRequest) => review(task!.row, evidence.text, { beforeRequest, attempts: 1 }))
        const status = reviewDecision(score)
        task.initial = score
        if (status !== 'review') task.result = { repo: key, status, score, evidence: evidence.evidenceUrl }
      }
      task.inFlight = null
      task.initialDone = true
      await checkpoint()
      if (task.result) return finish()
    }
    // 非递归树逐目录推进；不把 GitHub 截断的 recursive tree 当成完整清单。
    while (task.queue.length) {
      const directory = task.queue[0]
      const tree = await read(`/repos/${key}/git/trees/${directory.sha}`) as GitTreeResponse
      if (!Array.isArray(tree.tree) || tree.truncated) throw new Error('github-incomplete-tree')
      const additions: ReviewFile[] = []
      const directories: ReviewQueueEntry[] = []
      for (const rawEntry of tree.tree) {
        if (!isRecord(rawEntry)) throw new Error('github-invalid-tree')
        const entry = rawEntry as GitTreeEntry
        const entryPath = stringValue(entry.path)
        const mode = stringValue(entry.mode)
        const entrySha = stringValue(entry.sha)
        const entryType = stringValue(entry.type)
        if (!entryPath || !mode || !entrySha) throw new Error('github-invalid-tree')
        const path = directory.path ? `${directory.path}/${entryPath}` : entryPath
        const reason = exclusion(path, mode)
        if (reason) {
          additions.push({ path, status: 'excluded', reason })
          continue
        }
        if (!shaPattern.test(entrySha)) throw new Error('github-invalid-tree')
        if (entryType === 'tree') {
          directories.push({ path, sha: entrySha })
        } else if (entryType === 'blob' && ['100644', '100755'].includes(mode) &&
          typeof entry.size === 'number' && Number.isSafeInteger(entry.size) && entry.size >= 0) {
          additions.push({ path, sha: entrySha, size: entry.size, status: 'pending' })
        } else {
          additions.push({ path, status: 'blocked', reason: 'unsupported-entry' })
        }
      }
      task.queue.shift()
      task.queue.push(...directories)
      task.files.push(...additions)
      await checkpoint()
    }
    const texts = new Map<string, string>()
    while (task.files.some((file) => file.status === 'pending')) {
      const segments: ReviewSegment[] = []
      const targets: Array<{ file: ReviewFile; part: ReviewPart }> = []
      for (const file of task.files.filter((entry) => entry.status === 'pending')) {
        if ((file.size ?? 0) > MAX_BLOB_BYTES) {
          file.status = 'blocked'
          file.reason = 'oversized-file'
          await checkpoint()
          continue
        }
        if (!texts.has(file.path)) {
          let blob: GitBlobResponse
          try { blob = await read(`/repos/${key}/git/blobs/${file.sha}`) as GitBlobResponse } catch (error: unknown) {
            if (errorMessage(error) === 'submission-run-budget' && segments.length) break
            throw error
          }
          const content = typeof blob.content === 'string' ? blob.content : undefined
          if (blob.encoding !== 'base64' || content === undefined || content.length > MAX_BLOB_BYTES * 1.5) throw new Error('github-invalid-blob')
          const bytes = Buffer.from(content, 'base64')
          if (bytes.length !== file.size || createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') !== file.sha) {
            throw new Error('github-blob-mismatch')
          }
          if (bytes.includes(0)) {
            file.status = 'excluded'
            file.reason = 'binary'
            await checkpoint()
            continue
          }
          let text: string
          try {
            text = decoder.decode(bytes)
          } catch {
            file.status = 'blocked'
            file.reason = 'unsupported-encoding'
            await checkpoint()
            continue
          }
          if (text.startsWith('version https://git-lfs.github.com/spec/')) {
            file.status = 'blocked'
            file.reason = 'external-lfs-object'
            await checkpoint()
            continue
          }
          texts.set(file.path, text)
          if (!file.parts) {
            file.parts = segmentText(text)
            if (!file.parts.length) file.status = 'done'
            await checkpoint()
          }
        }
        const text = texts.get(file.path)
        const parts = file.parts
        if (text === undefined || !parts) throw new Error('submission-invalid-task')
        for (const part of parts.filter((entry) => !entry.facts)) {
          const segment: ReviewSegment = { path: file.path, start: part.start, lineStart: part.lineStart, text: text.slice(part.start, part.end) }
          const next = [...segments, segment]
          if (next.length > FACT_BATCH_ITEMS || Buffer.byteLength(JSON.stringify({ project: { name: task.row.title, summary: task.row.summary }, segments: next })) > FACT_BATCH_BYTES) break
          segments.push(segment)
          targets.push({ file, part })
        }
        if (segments.length && (segments.length >= FACT_BATCH_ITEMS || parts.some((part) => !part.facts && !targets.some((target) => target.part === part)))) break
      }
      if (!segments.length) {
        if (task.files.some((file) => file.status === 'pending')) throw new Error('submission-batch-too-large')
        break
      }
      if (!inspect) throw new Error('submission-missing-inspector')
      const rawAnswer: unknown = await paid('segments', (beforeRequest) => inspect(task!.row, segments, { beforeRequest }))
      const answer = isRecord(rawAnswer) ? rawAnswer : null
      const facts = answer?.facts
      const model = stringValue(answer?.model)
      if (!Array.isArray(facts) || facts.length !== targets.length || facts.some((fact) => !validFacts(fact))) throw new Error('jev-invalid-response')
      targets.forEach(({ file, part }, index) => {
        part.facts = facts[index] as FactScores
        part.model = model
        if (file.parts?.every((entry) => entry.facts)) {
          file.status = 'done'
          texts.delete(file.path)
        }
      })
      task.inFlight = null
      await checkpoint()
    }
    task.result = taskResult(task)
    return finish()
  } catch (error: unknown) {
    if (errorMessage(error) === 'submission-daily-requests') return { ...taskResult(task, true), reason: 'submission-daily-requests' }
    if (['submission-project-budget', 'submission-run-budget'].includes(errorMessage(error))) return taskResult(task, true)
    if (task.inFlight) return { ...taskResult(task, true), status: 'review', reason: 'unconfirmed-request' }
    throw error
  }
}

export type { Inspector, ReviewOptions, ReviewResult, Reviewer } from './review-types.ts'
