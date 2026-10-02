# src/lib/
> L2 | 父级: ../CLAUDE.md

成员清单
catalog-updated-at.ts: 历史时间戳校验与固定时区展示，缺失时不造时间
catalog.functions.ts: Start 同源只读数据边界，详情交付单条记录，新闻索引按路由读取，快照仅在 handler 内导入
categories.ts: 项目/新闻分类及标签键的共享白名单
inclusion.ts: 收录依据及同仓固定 blob/tree 证据边界，前端与采集共用而不信任类型断言
locale-head.ts: 有效页面规范 URL、语言 alternates 与可覆盖的 OG/Twitter 图片元数据
locale-routes.ts: en/zh/ja 路径识别、转换和 hreflang 的纯规则
masonry.ts: 有序虚拟瀑布流几何与启动状态规则，预就绪保留 SSR 前缀及用户阅读位置
news.ts: 新闻身份、摘要索引边界和展示工具
og-response.ts: 可注入渲染/缓存的 HTTP 策略，先验证身份，规范版本键、HEAD/ETag 与 no-store 失败
og-render.server.ts: Workers WASM 栅格化适配器，通过 ASSETS 读取有界字库并释放渲染对象
og-service.server.ts: 当前规范快照与 Workers Cache 的服务端入口，仅缓存未命中时加载渲染器
og-template.ts: 白底 ASCII 分享图纯 SVG 排版，全文身份与限行文字分离
og-inspection.ts: 浏览器有界同源只读探针，检验实际 OG/Twitter 标签、canonical 与 PNG 响应，不模拟第三方缓存
project-routes.ts: GitHub 项目规范路径与目录身份查找
saved.ts: 仅存来源 ID/保存时间的本地收藏契约及搜索校验
scroll-restoration.ts: 首次水合保留实际阅读位置的一次性策略，后续导航/hash 恢复 Router 默认行为
share-image.ts: 全站/项目内容版本图片地址、尺寸和 OG/Twitter 契约，不加载快照
search.ts: Fuse.js 项目检索，保持数据来源边界
sort.ts: 项目排序与全局星标排名
types.ts: 前端目录数据和展示模式的公共类型
utils.ts: 共享类名组合等小型工具

法则: 成员完整·依赖单向·数据来源明确
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
