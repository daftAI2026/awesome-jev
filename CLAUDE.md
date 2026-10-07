# Awesome JEV - TypeSafe Jev / System One 项目与新闻目录
React 19 + TypeScript 6 + TanStack Start/Router + Vite 8 + Tailwind CSS 4 + Base UI/shadcn + Cloudflare Workers，Node 24

<directory>
src/ - 路由、目录界面、共享纯工具与 OG 服务端边界 (5 子目录: components, hooks, i18n, lib, routes)
data/ - GitHub 项目与 AIHOT 新闻的独立 JSON 快照，容量告警/发布门槛见局部地图
docs/ - 架构、视觉、数据与运行规范；视觉以 docs/design.md 为准
scripts/ - 自动 GitHub 身份建基线/按 ID 刷新、服务端采集/审核、构建期展示投影、索引资产生成与最新 main 增量叠加发布、Node test，不进入前端请求链
public/ - 静态 favicon、索引、机器文档、原版品牌与许可完备字库 (3 子目录: agents, agent-logos, og-fonts)
radar/ - 生态与替代实现的状态及发布报告
.agents/ - 项目专用 Agent 复核 skill 与独立分类收据交接 (1 子目录: skills)，不部署云端 Agent
.github/ - 投稿模板、隔离的建议性审核、条件收录与可信数据发布；收录 CI 显式唤醒 main 控制器
</directory>
<config>
package.json - Node 24 与构建/检查命令的权威；构建先检查规范数据与收录依据覆盖率，无额外模型请求
vite.config.ts - Start 唯一入口（不保留旧 SPA index.html/main.tsx）、展示虚拟模块、有限目录的三语言预渲染与 Cloudflare 服务端构建
wrangler.toml - awesome-jev-project Worker、目录分页 SSR 路径与 Static Assets 字库绑定配置
src/index.css - 唯一语义主题、字体与视觉 token
</config>

仓库开启 `delete_branch_on_merge`，本仓已合并 PR 的来源分支统一由 GitHub 原生回收，不区分人工或机器人；合并后的清理不另建链路；未合并的明确不匹配纯投稿 PR 由独立拒收门关闭，本仓合格分支以原审核 head 做 CAS 回收并记终态，不管理外部 fork。权限与安全边界见 docs/collector.md。

仅 `main` 启用基础分支保护：禁止强推和删除，管理员同样受约束；不锁分支、不限制普通推送、不新增 PR 审批或必需 CI 门禁，保留可信采集器的普通推送与收录机器人的 squash 合并。此保护不替代收录控制器的精确版本 CI 校验。

分享图在 /api/og/site 与 /api/og/projects/{owner}/{repo} 按请求生成白底 PNG，使用 @cf-wasm/resvg 0.4.0。完整已发布目录决定计数与项目文字，内容版本地址驱动 Workers Cache；构建不生成/存储项目 PNG。字库通过 ASSETS 绑定读取，WASM 和规范快照不进入浏览器启动包。/og.png 兼容地址也读取当前快照；失败返回 no-store 503，不复用旧图。

数据 → 纯工具/页面 loader → 组件。目录交互共享构建期展示投影，规范 JSON 保留富审计；详情与新闻 loader 使用 Start 同源服务端函数；项目详情额外交付最多三条具有共同具体主题的同分类摘要，完整快照不进入全站启动包。路由语言驱动文案；有效详情可预渲染，未知地址保留 HTTP 404。404 由 NotFoundPage 共用恢复布局，不建立第二套主题或目录数据。

全部项目、各分类、Top100、新闻与收藏来源共用每页 50 条规则。搜索/筛选/排序先作用于全量结果，再切片。父级目录语言路由验证 page/sort；逐页 canonical 与语言 alternates 共用范围规则。目录索引路径使用 Worker-first SSR；详情和机器文档保留 Assets-first。分页不拆分快照、不改变身份，不把搜索词写入 URL。

项目/新闻预览共用 PreviewDialogFrame；调用方保留数据与导航历史，外壳以真实来源卡片的纯几何驱动 Motion 官方 arc 进出与 Base UI 焦点/退出生命周期。减少动态效果即时生效，失效来源仅淡出并恢复主内容焦点，不动画化侧栏或独立详情。

三语言 /og-workbench 是唯一工作台入口，侧栏统一 OG 分享图、SEO 检查和真实页面预览，URL 工具/目标状态使用白名单，仅在本地开发模式可访问；生产构建 GET/HEAD 返回真实 404，在 beforeLoad 和 loader 处阻止工作台数据读取，不接受 URL/Host 开关。工作台不进入 sitemap；本轮 OG/SEO/预览目标不处理新闻。OG 图片 API 仍公开供社交爬虫读取。

分类页 H1/用途说明与 metadata 共用语言文案。只统计 GitHub 出站、分类和相关项目点击，不统计搜索词或本机收藏；开发环境不加载 Umami，失败不阻塞导航。

Agents 页脚复用三语言与本站主题，布局/品牌资产/按钮名称沿用 OpenFree 原版。构建从规范项目/新闻快照生成 llms.txt、llms-full.txt 和八份互链 Markdown，不输出审核分数、本机收藏或凭据。Static Assets 的 _headers 明确 TXT/Markdown 媒体类型。聊天入口仅传同一公开问题，不调用 API；五品牌端点沿用原版；只替换本站公开问题与文档地址，不增加免责声明段落。

访问地址: https://awesomejev.cc；站点地图: https://awesomejev.cc/sitemap.xml。
验证: npm run typecheck、npm run lint、npm test、npm run build、npm run test:delivery（构建后真实 HTTP/模块图，零跳过）。使用 Node 24；不将 .env 或采集凭据写入文档。

法则: 极简·稳定·导航·版本精确；修改后按文件头部 → 局部地图 → 全局地图检查。
