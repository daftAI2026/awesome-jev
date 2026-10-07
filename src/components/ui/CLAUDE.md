# src/components/ui/
> L2 | 父级: ../CLAUDE.md

成员清单
pagination.tsx: shadcn base-nova 分页原语，复用本站 Base UI Button 与 Phosphor
alert.tsx: 警告语义容器与内容原语
badge.tsx: 短状态/计数标记原语，标准过渡避免继承显隐动画
button.tsx: Base UI Button 与 cva 变体，页面提供动作语义，标准过渡保留颜色/焦点/按压
card.tsx: 卡片分区与内容组合原语
input.tsx: 文本输入基础样式和状态
select.tsx: Base UI 下拉选择组合
separator.tsx: 分隔线语义原语
sheet.tsx: Base UI 侧面板组合，用于窄屏目录导航
toggle-group.tsx: 互斥/多选切换组，组合 toggle 变体
toggle.tsx: 按压状态切换原语，标准过渡不动画化继承显隐

法则: 成员完整·依赖单向·数据来源明确
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
