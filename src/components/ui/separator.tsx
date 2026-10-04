/**
 * [INPUT]: 依赖 Base UI Separator 的方向/语义属性与 cn 类名组合
 * [OUTPUT]: 对外提供 Separator 的水平和垂直主题分隔线
 * [POS]: ui 的结构原语，复用 Base UI 可访问语义而不引入布局或业务状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "cn"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
