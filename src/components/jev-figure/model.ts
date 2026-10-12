/**
 * [INPUT]: 依赖本地播放时间，不接受手动输出选择
 * [OUTPUT]: 提供轮换选项、0.3 秒教学节奏、静态位姿与 decisionPose
 * [POS]: Jev 分选器的纯教学模型；预设输出不代表真实模型推理
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export const DEMO_OPTIONS = ['search', 'code', 'review'] as const
// ---- 快速判断、短暂停留；时间是教学节奏，不是 Jev 延迟测量 ----
export const CYCLE_SECONDS = 0.3
export const INPUT_END = CYCLE_SECONDS * 0.25
export const DECISION_END = CYCLE_SECONDS * 0.35
export const OUTPUT_END = CYCLE_SECONDS * 0.6
export const RESET_START = CYCLE_SECONDS * 0.825
export const REST_TIME = CYCLE_SECONDS * 0.7
const FADE_SECONDS = CYCLE_SECONDS * 0.1
export const OUTPUT_Y = [-44, 0, 44] as const

const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

export function decisionPose(seconds: number) {
  const elapsed = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const index = Math.floor(elapsed / CYCLE_SECONDS) % DEMO_OPTIONS.length
  const time = elapsed % CYCLE_SECONDS
  const y = OUTPUT_Y[index]
  const opacity = time < FADE_SECONDS ? time / FADE_SECONDS : time > RESET_START ? Math.max(0, 1 - (time - RESET_START) / FADE_SECONDS) : 1
  if (time < INPUT_END) return { index, x: -104 + 104 * ease(time / INPUT_END), y: 0, headY: 0, opacity, phase: 'input' as const }
  if (time < DECISION_END) {
    const progress = ease((time - INPUT_END) / (DECISION_END - INPUT_END))
    return { index, x: 0, y: y * progress, headY: y * progress, opacity, phase: 'decision' as const }
  }
  if (time < RESET_START) return { index, x: 108 * ease((time - DECISION_END) / (OUTPUT_END - DECISION_END)), y, headY: y, opacity, phase: 'output' as const }
  // ---- 收回空载滑台，输入卡在下一轮淡入 ----
  return { index, x: 108, y, headY: y * (1 - ease((time - RESET_START) / (CYCLE_SECONDS - RESET_START))), opacity, phase: 'reset' as const }
}
