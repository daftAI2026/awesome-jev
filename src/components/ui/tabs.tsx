/**
 * [INPUT]: 依赖 Base UI Tabs、cva 与 cn 的语义和样式组合
 * [OUTPUT]: 提供 shadcn base-nova Tabs、TabsList、TabsTrigger 与 TabsContent
 * [POS]: components/ui 的页签原语；页面指定内容，基础层拥有键盘和面板关联
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

function Tabs({ className, orientation = "horizontal", ...props }: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="tabs" data-orientation={orientation} orientation={orientation}
    className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)} {...props} />
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-1 text-muted-foreground group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: { variant: { default: "bg-muted", line: "gap-1 bg-transparent" } },
    defaultVariants: { variant: "default" },
  },
)

function TabsList({ className, variant = "default", ...props }: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return <TabsPrimitive.List data-slot="tabs-list" data-variant={variant}
    className={cn(tabsListVariants({ variant }), className)} {...props} />
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return <TabsPrimitive.Tab data-slot="tabs-trigger" className={cn(
    "relative inline-flex min-h-8 flex-1 items-center justify-center gap-2 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground transition outline-none group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30",
    "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
    "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:right-0 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
    className,
  )} {...props} />
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel data-slot="tabs-content"
    className={cn("min-w-0 flex-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
