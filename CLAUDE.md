# Awesome JEV - TypeSafe Jev / System One 项目与新闻目录
React 19 + TypeScript 6 + TanStack Start 1.169.1 / Router 1.170.44 + Vite 8（安全基线 8.3.4）+ Tailwind CSS 4 + Base UI/shadcn + Cloudflare Workers，Node 24

<directory>
src/ - 路由、目录界面、共享纯工具与 OG 服务端边界 (5 子目录: components, hooks, i18n, lib, routes)
data/ - GitHub 项目与 AIHOT 新闻的独立 JSON 快照，容量告警/发布门槛见局部地图
docs/ - 架构、视觉、数据与运行规范；视觉以 docs/design.md 为准
scripts/ - 同 ID 自动迁址、持续失效可逆下架与原预算身份复核、独立全目录元数据同步、残页背压/交替审核、精确状态部署等价、自动 GitHub 身份建基线、服务端采集/审核、构建期展示投影、索引资产生成与最新 main 增量叠加发布、Node test，不进入前端请求链
public/ - 静态 favicon、索引、机器文档、原版品牌与许可完备字库 (3 子目录: agents, agent-logos, og-fonts)
radar/ - 生态与替代实现的状态及发布报告
.agents/ - 项目专用 Agent 复核与 Anatomy SVG skill 与独立分类收据交接 (1 子目录: skills)，不部署云端 Agent
.github/ - 七条 Workflow 分离统计、发现、投稿与 site 交付；最终非状态发布显式派发 main 校验
</directory>
<config>
.gitignore - 排除本机日志、构建、浏览器与 Start/Workers 缓存；不排除正式脚本和测试
.oxlintrc.json - 本站 lint 规则；排除固定版本第三方 Anatomy 原件，不改上游源码消除告警
package.json - Node 24、Start ^1.169.1 / Router ^1.170.44 与 Vite ^8.3.4 安全基线及构建/检查命令的权威；构建先检查规范数据与收录依据覆盖率，无额外模型请求
vite.config.ts - 展示与交付清单、有限分页/排序及可索引标签的三语言预渲染，保留原页面身份
wrangler.toml - awesome-jev-project Worker、查询页静态分发、ASSETS 与免费日志配置
src/index.css - 唯一语义主题、字体与视觉 token
src/start.ts - Start 服务端错误公开序列化边界
src/server.ts - Worker 先读取已构建页面/PNG，未覆盖请求延迟加载 ssr-handler
</config>

仓库开启 `delete_branch_on_merge`，本仓已合并 PR 的来源分支统一由 GitHub 原生回收，不区分人工或机器人；合并后的清理不另建链路；未合并的明确不匹配纯投稿 PR 由独立拒收门关闭，本仓合格分支以原审核 head 做 CAS 回收并记终态，不管理外部 fork。权限与安全边界见 docs/collector.md。

仅 `main` 启用基础分支保护：禁止强推和删除，管理员同样受约束；不锁分支、不限制普通推送、不新增 PR 审批或必需 CI 门禁，保留可信采集器的普通推送与收录机器人的 squash 合并。此保护不替代收录控制器的精确版本 CI 校验。

分享图保留 /api/og/site、/api/og/projects/{owner}/{repo} 与 /og.png。构建阶段使用 Node WASM 生成当前公开项目 PNG，写入 dist/client/_og，不写 public 源目录。生产请求先核对构建期身份与内容版本，再通过 ASSETS 流式交付。HEAD/304 不读取图片正文，缺失返回 no-store 404，缺失产物返回 no-store 503，不回退旧图。开发仍使用原运行时渲染器与固定字库缓存；WASM、字库字节和规范快照不进入浏览器启动包。PNG 生成失败或静态文件超过免费 20000 上限时，构建失败，不自动申请付费服务。

数据 → 纯工具/页面 loader → 组件。目录交互共享构建期展示投影，规范 JSON 保留富审计与可逆下架记录；详情与新闻 loader 使用 Start 同源服务端函数；新闻索引仅交付当前 50 条、计数和可选单条预览；排序索引按不可变快照复用。全历史搜索和收藏按需读取客户端静态新闻块，不删除历史、不把搜索词写入 RPC。项目详情额外交付最多三条具有共同具体主题的同分类摘要，完整快照不进入全站启动包。路由语言驱动文案；有效详情可预渲染，未知地址保留 HTTP 404。404 与应用加载/客户端渲染失败由 RecoveryPage 共用恢复布局。恢复页共用 Jev SVG 教学分选器，桌面 subgrid 将双列分割线放在共享行。图由项目级 Anatomy 离线生成，运行时无模型请求；Choice 出口按 0.3 秒节奏自动轮换，无独立控制栏；图面支持键盘暂停，并尊重可见性与减少动态效果。错误 SSR 保留 500，禁缓存和索引；异常正文不进入水合。平台 CPU 终止不在 React 边界内。

全部项目、各分类、标签聚合、Top100、新闻与收藏来源共用每页 50 条规则。搜索/筛选/排序先作用于全量结果，再切片。父级目录语言路由验证 page/sort；逐页 canonical 与语言 alternates 共用范围规则。页码归一只修正越界请求，不用旧服务端页撤销待加载的有效页。目录索引保留 Worker-first 以识别查询。轻入口读取已生成的主目录、分类、Top100、新闻、标签索引和可索引标签的有限分页/排序产物。长尾标签、预览、收藏和 RPC 保留原 SSR，不承诺这些请求低于免费 CPU 预算。详情和机器文档保留 Assets-first。分页不拆分快照、不改变身份，不把搜索词写入 URL。

项目/新闻预览共用 PreviewDialogFrame；调用方保留数据与导航历史，外壳以真实来源卡片的纯几何驱动 Motion 官方 arc 进出与 Base UI 焦点/退出生命周期。减少动态效果即时生效，失效来源仅淡出并恢复主内容焦点，不动画化侧栏或独立详情。

三语言 /og-workbench 是唯一工作台入口，侧栏统一 OG 分享图、SEO 检查和真实页面预览，URL 工具/目标状态使用白名单，仅在本地开发模式可访问；生产构建 GET/HEAD 返回真实 404，在 beforeLoad 和 loader 处阻止工作台数据读取，不接受 URL/Host 开关。工作台不进入 sitemap；本轮 OG/SEO/预览目标不处理新闻。OG 图片 API 仍公开供社交爬虫读取。

分类页 H1/用途说明与 metadata 共用语言文案。

公开标签由原始 tags 派生，不重写来源。明确同义名称合并，泛生态词排除。三项目共用标签进入 /tags 与 sitemap；长尾详情可导航但 noindex，未知标签返回 404。标签页复用原目录检索/排序/分页；达到索引门槛的标签进入有限预渲染，长尾仍 noindex。详情末尾单列展示分类和标签；目录/详情页脚提供分类和热门标签内链。Action bot 保留原始来源与审核门槛，不为标签新增付费请求。只统计 GitHub 出站、分类和相关项目点击，不统计搜索词或本机收藏；开发环境不加载 Umami，失败不阻塞导航。

Agents 页脚复用三语言与本站主题，布局/品牌资产/按钮名称沿用 OpenFree 原版。构建从规范项目/新闻快照生成 llms.txt、llms-full.txt 和八份互链 Markdown，不输出审核分数、本机收藏或凭据。Static Assets 的 _headers 明确 TXT/Markdown 媒体类型。聊天入口仅传同一公开问题，不调用 API；五品牌端点沿用原版；只替换本站公开问题与文档地址，不增加免责声明段落。

访问地址: https://awesomejev.cc；站点地图: https://awesomejev.cc/sitemap.xml。
本站区域已开启 Always Use HTTPS。HTTP 在边缘 301 到同路径 HTTPS，并保留查询参数；设置独立于 Worker 制品，不新增应用跳转或 HSTS。回滚与验收见 docs/deployment.md。
本站 WAF 拒绝目录根路径的精确 `page=999999` 探测。未验证 ShapBot 抓取三语言标签页时接受挑战。已验证机器人不受此标签规则约束。正常分页与静态资产保持原路。不封 IP、ASN 或国家。规则独立于 Worker 制品；边界与按 ref 回滚见 docs/deployment.md。此防护不等于 SSR CPU 优化。
本站区域已开启免费的 Cloudflare Crawler Hints。缓存信号驱动 IndexNow 通知，不额外创建 Action 或密钥，不保证每次 Worker SSR 更新都被通知；以 Bing 接收报告另行验证，不把启用等同收录。配置依据见 docs/deployment.md。
验证: npm run typecheck、npm run lint、npm test、npm run build、npm run test:delivery（构建后真实 HTTP/模块图，零跳过）。使用 Node 24；不将 .env 或采集凭据写入文档。

可信 site main 校验封装同版本 dist，production job 按 artifact ID 部署，不重复构建。快照验证与最终 main 交付仍各构建一次。仅六条精确状态文件推进不使旧产物过期；逐提交检查完整 Git 历史，非状态变更及 revert 均拒绝旧产物。部署凭据仅存 production Secret，环境仅允许 main；PR/采集器不持有此凭据。最终 site_changed=true 的数据推送显式派发 site 校验；纯状态保存不派发。部署开关与 Cloudflare Git 构建切换/恢复见 docs/deployment.md。

法则: 极简·稳定·导航·版本精确；修改后按文件头部 → 局部地图 → 全局地图检查。
