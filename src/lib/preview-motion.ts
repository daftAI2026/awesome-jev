/**
 * [INPUT]: 依赖调用方测量的来源卡片、居中弹窗和可见视口矩形，不读取 DOM 或导航状态
 * [OUTPUT]: 对外提供 previewOriginTransform，计算卡片中心对应的位移与等比缩放，来源缺失时仅淡出
 * [POS]: lib 的预览几何纯规则，由 PreviewDialogFrame 测量适配器消费，独立于 Motion 的轨迹插值
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
interface PreviewRect {
  left: number
  top: number
  width: number
  height: number
}

export function previewOriginTransform(source: PreviewRect | null, popup: PreviewRect, viewport: { width: number; height: number }) {
  const fadeOnly = { opacity: 0, x: 0, y: 0, scale: 1 }
  if (!source || ![source.left, source.top, source.width, source.height, popup.left, popup.top, popup.width, popup.height].every(Number.isFinite) ||
    source.width <= 0 || source.height <= 0 || popup.width <= 0 || popup.height <= 0 ||
    source.left >= viewport.width || source.top >= viewport.height || source.left + source.width <= 0 || source.top + source.height <= 0) {
    return fadeOnly
  }
  return {
    opacity: 0,
    x: source.left + source.width / 2 - (popup.left + popup.width / 2),
    y: source.top + source.height / 2 - (popup.top + popup.height / 2),
    scale: Math.min(source.width / popup.width, source.height / popup.height, 1),
  }
}
