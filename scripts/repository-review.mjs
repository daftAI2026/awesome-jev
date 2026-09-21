import { createHash } from 'node:crypto'
import { TextDecoder } from 'node:util'
import { candidateRow } from './catalog.mjs'
import { evidenceIssue } from './github-evidence.mjs'
import { FACT_MODEL, FACT_NAMES, FACT_BATCH_BYTES, FACT_BATCH_ITEMS, reviewDecision } from './jev-client.mjs'
import { memoryReviewStore } from './review-store.mjs'

export const REVIEW_POLICY = 'whole-project-v1'
const MAX_BLOB_BYTES = 8 * 1024 * 1024
const SEGMENT_BYTES = 8000
const shaPattern = /^[a-f0-9]{40}$/
const decoder = new TextDecoder('utf-8', { fatal: true })
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
export const taskId = (key) => digest([REVIEW_POLICY, FACT_MODEL, key])
const safePath = (path) => typeof path === 'string' && path.length <= 4096 && ![...path].some((c) => c.charCodeAt(0) < 32) &&
  !path.startsWith('/') && !path.split('/').some((p) => !p || p === '.' || p === '..')
const urlFor = (task, file, part) => `https://github.com/${task.repo}/blob/${task.sha}/${file.path.split('/').map(encodeURIComponent).join('/')}${part ? `#L${part.lineStart}-L${part.lineEnd}` : ''}`

export function exclusion(path, mode) {
  if (!safePath(path)) return 'unsafe-path'
  if (mode === '120000') return 'symlink'
  if (mode === '160000') return 'submodule'
  if (/(?:^|\/)(?:node_modules|vendor|third_party|third-party|external|\.venv|venv)(?:\/|$)/i.test(path)) return 'dependency'
  if (/(?:^|\/)(?:\.git|dist|build|coverage|\.next|target|__pycache__)(?:\/|$)|(?:^|\/)(?:package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|go\.sum)$|\.(?:map|min\.[jt]s)$/i.test(path)) return 'generated'
  if (/(?:^|\/)(?:\.env(?:\.|$)|credentials(?:\.[^/]*)?$|secrets?\.(?:json|ya?ml|toml)$|id_rsa$)|\.(?:pem|key|p12|pfx)$/i.test(path)) return 'sensitive'
  if (/\.(?:png|jpe?g|gif|ico|webp|pdf|zip|gz|7z|tar|mp[34]|wav|ogg|woff2?|ttf|eot|exe|dll|so|dylib|wasm|bin|gb|rom)$/i.test(path)) return 'binary'
  return null
}
export function segmentText(text) {
  const parts = []
  let start = 0, end = 0, bytes = 0, lineStart = 1, lineEnd = 1
  for (const char of text) {
    const size = Buffer.byteLength(JSON.stringify(char)) - 2
    if (bytes + size > SEGMENT_BYTES) {
      parts.push({ start, end, lineStart, lineEnd }); start = end; bytes = 0; lineStart = lineEnd
    }
    end += char.length; bytes += size
    if (char === '\n') lineEnd++
  }
  if (end > start) parts.push({ start, end, lineStart, lineEnd })
  return parts
}
const validFacts = (facts) => FACT_NAMES.every((name) => Number.isFinite(facts?.[name]) && facts[name] >= 0 && facts[name] <= 1)
function validateTask(task, key) {
  if (task.policy !== REVIEW_POLICY || task.repo !== key || !shaPattern.test(task.sha) || !Array.isArray(task.files) || !Array.isArray(task.queue) ||
    !task.row || task.row.url !== `https://github.com/${key}` || typeof task.initialDone !== 'boolean') throw new Error('submission-invalid-task')
  for (const dir of task.queue) if (!shaPattern.test(dir.sha) || (dir.path && !safePath(dir.path))) throw new Error('submission-invalid-task')
  for (const file of task.files) {
    if (typeof file.path !== 'string' || !['pending', 'done', 'excluded', 'blocked'].includes(file.status) ||
      (file.parts && (!Array.isArray(file.parts) || file.parts.some((p) => !Number.isSafeInteger(p.start) || !Number.isSafeInteger(p.end) || p.start < 0 || p.end <= p.start || (p.facts && !validFacts(p.facts)))))) throw new Error('submission-invalid-task')
  }
}
export function taskResult(task, pending = false) {
  const eligible = task.files.filter((f) => f.status !== 'excluded')
  const progress = { checked: eligible.filter((f) => f.status === 'done').length, total: eligible.length,
    excluded: task.files.length - eligible.length, blocked: eligible.filter((f) => f.status === 'blocked').length, inventoryComplete: task.queue.length === 0 }
  const entries = task.files.flatMap((file) => (file.parts ?? []).filter((p) => p.facts).map((part) => ({ file, part })))
  const base = { repo: task.repo, deep: true, progress, evidence: `https://github.com/${task.repo}/tree/${task.sha}` }
  if (pending || task.queue.length || eligible.some((f) => f.status === 'pending')) return { ...base, status: 'pending', reason: 'scan-pending' }
  if (progress.blocked) return { ...base, status: 'review', reason: 'incomplete-evidence', evidenceLinks: eligible.filter((f) => f.status === 'blocked').slice(0, 3).map((f) => urlFor(task, f)) }
  if (task.instructionFlag || entries.some(({ part }) => part.facts.injection >= 0.5)) return { ...base, status: 'review', reason: 'instruction-like-evidence' }
  if (entries.some(({ part }) => part.facts.conflict >= 0.5)) return { ...base, status: 'review', reason: 'conflicting-evidence' }
  const supports = entries.filter(({ part }) => part.facts.related >= 0.9 && part.facts.useful >= 0.9 && part.facts.mock < 0.5)
  if (supports.length) return { ...base, status: 'keep', evidenceLinks: supports.slice(0, 3).map(({ file, part }) => urlFor(task, file, part)) }
  if (entries.length && entries.every(({ part }) => part.facts.related <= 0.1)) return { ...base, status: 'drop', reason: 'unrelated-evidence' }
  return { ...base, status: 'review', reason: entries.some(({ part }) => part.facts.related >= 0.9) ? 'insufficient-usage-evidence' : 'insufficient-provider-context' }
}

export async function reviewRepository(api, review, key, evidence, {
  store = memoryReviewStore(), inspect, manual = false, deadline = Infinity, maxOperations = 300,
} = {}) {
  const id = taskId(key)
  const context = digest([evidence.repo.name, evidence.repo.description ?? '', key, REVIEW_POLICY, FACT_MODEL])
  let task = await store.load(id)
  if (task) validateTask(task, key)
  // 未完任务固定旧版本继续；完成后只有版本改变才重建，不靠重复抽签提高置信度。
  if (task?.result && (task.sha !== evidence.sha || task.context !== context)) task = null
  let operations = 0
  const read = async (path) => {
    if (++operations > maxOperations || Date.now() >= deadline) throw new Error('submission-run-budget')
    return api(path)
  }
  if (!task) {
    const commit = await read(`/repos/${key}/git/commits/${evidence.sha}`)
    if (!shaPattern.test(commit.tree?.sha ?? '')) throw new Error('github-invalid-tree')
    task = { policy: REVIEW_POLICY, context, repo: key, sha: evidence.sha, row: { ...candidateRow(evidence.repo), url: `https://github.com/${key}` }, initialDone: false,
      queue: [{ path: '', sha: commit.tree.sha }], files: [], inFlight: null, instructionFlag: evidenceIssue(evidence.repo, evidence.text) === 'instruction-like-evidence' }
    await store.save(id, task)
  }
  if (task.result) return task.result
  if (task.inFlight) {
    if (!manual) return { ...taskResult(task, true), status: 'review', reason: 'unconfirmed-request' }
    task.inFlight = null
    await store.save(id, task)
  }
  const checkpoint = () => store.save(id, task)
  const finish = async () => {
    task.completedAt = new Date().toISOString()
    task.receipt = { ...(task.result.progress ?? {}), manifestHash: digest(task.files.map(({ path, sha, status, reason }) => ({ path, sha, status, reason }))), limitations: task.files.filter((f) => f.status === 'blocked').map(({ path, reason }) => ({ path, reason })), exclusions: Object.fromEntries([...new Set(task.files.filter((f) => f.status === 'excluded').map((f) => f.reason))].map((reason) => [reason, task.files.filter((f) => f.status === 'excluded' && f.reason === reason).length])), segments: task.files.reduce((n, f) => n + (f.parts?.length ?? 0), 0), models: [...new Set(task.files.flatMap((f) => (f.parts ?? []).map((p) => p.model)))] }
    task.files = []; task.queue = []; task.initial = null; task.inFlight = null
    await checkpoint()
    return task.result
  }
  const paid = async (kind, invoke) => {
    try {
      return await invoke(async () => {
        if (Date.now() >= deadline) throw new Error('submission-run-budget')
        task.inFlight = { kind, at: new Date().toISOString() }
        await checkpoint()
      })
    } catch (error) {
      // 连接中断或成功响应无法解析时无法确认是否已计费，不自动再次发送。
      if (!['jev-network-or-timeout', 'jev-invalid-response'].includes(error.message)) { task.inFlight = null; await checkpoint() }
      throw error
    }
  }
  try {
    if (!task.initialDone) {
      if (evidence.sha === task.sha && evidence.text.length <= 12000 && !evidenceIssue(evidence.repo, evidence.text)) {
        const score = await paid('initial', (beforeRequest) => review(task.row, evidence.text, { beforeRequest, attempts: 1 }))
        const status = reviewDecision(score)
        task.initial = score
        if (status !== 'review') task.result = { repo: key, status, score, evidence: evidence.evidenceUrl }
      }
      task.inFlight = null; task.initialDone = true
      await checkpoint()
      if (task.result) return finish()
    }
    // 非递归树逐目录推进；不把 GitHub 截断的 recursive tree 当成完整清单。
    while (task.queue.length) {
      const dir = task.queue[0]
      const tree = await read(`/repos/${key}/git/trees/${dir.sha}`)
      if (!Array.isArray(tree.tree) || tree.truncated) throw new Error('github-incomplete-tree')
      const additions = [], directories = []
      for (const entry of tree.tree) {
        const path = dir.path ? `${dir.path}/${entry.path}` : entry.path
        const reason = exclusion(path, entry.mode)
        if (reason) { additions.push({ path, status: 'excluded', reason }); continue }
        if (!shaPattern.test(entry.sha ?? '')) throw new Error('github-invalid-tree')
        if (entry.type === 'tree') directories.push({ path, sha: entry.sha })
        else if (entry.type === 'blob' && ['100644', '100755'].includes(entry.mode) && Number.isSafeInteger(entry.size) && entry.size >= 0) {
          additions.push({ path, sha: entry.sha, size: entry.size, status: 'pending' })
        } else additions.push({ path, status: 'blocked', reason: 'unsupported-entry' })
      }
      task.queue.shift(); task.queue.push(...directories)
      task.files.push(...additions)
      await checkpoint()
    }
    const texts = new Map()
    while (task.files.some((f) => f.status === 'pending')) {
      const segments = [], targets = []
      for (const file of task.files.filter((f) => f.status === 'pending')) {
        if (file.size > MAX_BLOB_BYTES) { file.status = 'blocked'; file.reason = 'oversized-file'; await checkpoint(); continue }
        if (!texts.has(file.path)) {
          let blob
          try { blob = await read(`/repos/${key}/git/blobs/${file.sha}`) } catch (error) {
            if (error.message === 'submission-run-budget' && segments.length) break
            throw error
          }
          if (blob.encoding !== 'base64' || typeof blob.content !== 'string' || blob.content.length > MAX_BLOB_BYTES * 1.5) throw new Error('github-invalid-blob')
          const bytes = Buffer.from(blob.content, 'base64')
          if (bytes.length !== file.size || createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') !== file.sha) throw new Error('github-blob-mismatch')
          if (bytes.includes(0)) { file.status = 'excluded'; file.reason = 'binary'; await checkpoint(); continue }
          let text
          try { text = decoder.decode(bytes) } catch { file.status = 'blocked'; file.reason = 'unsupported-encoding'; await checkpoint(); continue }
          if (text.startsWith('version https://git-lfs.github.com/spec/')) { file.status = 'blocked'; file.reason = 'external-lfs-object'; await checkpoint(); continue }
          texts.set(file.path, text)
          if (!file.parts) { file.parts = segmentText(text); if (!file.parts.length) file.status = 'done'; await checkpoint() }
        }
        for (const part of file.parts.filter((p) => !p.facts)) {
          const segment = { path: file.path, start: part.start, lineStart: part.lineStart, text: texts.get(file.path).slice(part.start, part.end) }
          const next = [...segments, segment]
          if (next.length > FACT_BATCH_ITEMS || Buffer.byteLength(JSON.stringify({ project: { name: task.row.title, summary: task.row.summary }, segments: next })) > FACT_BATCH_BYTES) break
          segments.push(segment); targets.push({ file, part })
        }
        if (segments.length && (segments.length >= FACT_BATCH_ITEMS || file.parts.some((p) => !p.facts && !targets.some((t) => t.part === p)))) break
      }
      if (!segments.length) {
        if (task.files.some((f) => f.status === 'pending')) throw new Error('submission-batch-too-large')
        break
      }
      if (!inspect) throw new Error('submission-missing-inspector')
      const answer = await paid('segments', (beforeRequest) => inspect(task.row, segments, { beforeRequest }))
      if (!Array.isArray(answer?.facts) || answer.facts.length !== targets.length || answer.facts.some((f) => !validFacts(f))) throw new Error('jev-invalid-response')
      targets.forEach(({ file, part }, i) => { part.facts = answer.facts[i]; part.model = answer.model; if (file.parts.every((p) => p.facts)) { file.status = 'done'; texts.delete(file.path) } })
      task.inFlight = null
      await checkpoint()
    }
    task.result = taskResult(task)
    return finish()
  } catch (error) {
    if (['submission-project-budget', 'submission-daily-requests', 'submission-run-budget'].includes(error.message)) return taskResult(task, true)
    if (task.inFlight) return { ...taskResult(task, true), status: 'review', reason: 'unconfirmed-request' }
    throw error
  }
}
