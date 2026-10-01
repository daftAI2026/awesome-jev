# src/lib/
> L2 | 父级: ../CLAUDE.md

成员清单
catalog-updated-at.ts: 历史时间戳校验与固定时区展示，缺失时不造时间
categories.ts: 项目/新闻分类及标签键的共享白名单
inclusion.ts: 收录证据结构校验，前端与采集脚本共用
locale-head.ts: 有效页面规范 URL、语言 alternates 和分享元数据
locale-routes.ts: en/zh/ja 路径识别、转换和 hreflang 的纯规则
masonry.ts: 有序虚拟瀑布流的纯布局工具
news.ts: 新闻身份、摘要索引边界和展示工具
project-routes.ts: GitHub 项目规范路径与目录身份查找
saved.ts: 仅存来源 ID/保存时间的本地收藏契约及搜索校验
search.ts: Fuse.js 项目检索，保持数据来源边界
sort.ts: 项目排序与全局星标排名
types.ts: 前端目录数据和展示模式的公共类型
utils.ts: 共享类名组合等小型工具

法则: 成员完整·依赖单向·数据来源明确
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
