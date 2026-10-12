# src/components/jev-figure/
> L2 | 父级: ../CLAUDE.md

成员清单
JevDecisionFigure.tsx: 错误页的 SVG 分选器，说明在上、裁切留白后的机器居中、路由在下；桌面 subgrid 对齐 RecoveryPage 分割线；Choice 出口自动轮换；图面支持键盘暂停，离屏/隐藏/减少动态效果时静止
model.ts: 本地示例与 0.3 秒循环/0.03 秒判断位姿；不调用 Jev，不伪造性能
art.generated.ts: Anatomy kit 离线生成的前后分层 SVG 与投影；由 scripts/generate-jev-figure.mjs 重建
figure.css: 四面灰阶映射本站语义 token，仅作用于本图

法则: 恢复动作优先·教学与真实推理分离·无逐帧 React 渲染
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
