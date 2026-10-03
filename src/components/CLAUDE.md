# src/components/
> L2 | 父级: ../CLAUDE.md

成员清单
AsciiWordmark.tsx: 原始字符字标，CSS 容器宽度适配
CardMasonry.tsx: 有序项目虚拟瀑布流，预就绪保持 SSR 前缀与阅读位置，就绪提交同步接管有界窗口
DecryptedBrand.tsx: 品牌链接与悬停解码适配，遵循减少动态效果偏好
DecryptedText.tsx: React Bits 字符解码实现，被品牌适配器消费
FeaturedProjectBorder.tsx: 星标阈值边框适配，按可见性控制装饰动画
GithubList.tsx: 项目排名列表，虚拟化并保留详情/收藏动作
GithubProjectDialog.tsx: 项目预览与独立页共享证据正文，独立页分类可导航，GitHub 出站统计不阻塞点击
HeaderChoiceMenu.tsx: Base UI 单选菜单组合，主题/语言共用
ItemCard.tsx: 项目卡片的来源、证据、排名和收藏入口
ItemRow.tsx: 项目列表单行的排名、详情与收藏入口
LanguageMenu.tsx: 路由语言选择，保持页面身份并持久化显式偏好
NewsDialog.tsx: 新闻摘要预览，复用独立页内容而非伪造正文
NewsItemContent.tsx: 新闻摘要、元数据及原始来源链接的共享展示
NewsPanel.tsx: 新闻索引、检索和虚拟时间线
NotFoundPage.tsx: 全局/项目/新闻共享 404，独立语言边界和同语言恢复入口
PreviewDialogFooter.tsx: 预览对话框底部来源动作的共享容器
PreviewDialogHeader.tsx: 预览对话框标题、收藏与关闭动作的共享容器
SaveButton.tsx: 无导航副作用的收藏动作与可访问状态
SavedPanel.tsx: 本地收藏按来源/分类筛选，复用项目/新闻展示
StarBorder.css: 上游边框视觉规则
StarBorder.tsx: 上游装饰边框组件，与站点适配器分离
StarBorderProject.css: 项目卡片专用语义 token 边框与可见性动画规则
ThemeMenu.tsx: 系统/明/暗主题偏好同步与现有主题类适配
VideoMasonry.tsx: 视频内容的布局组件，非当前 GitHub 主结果来源

子模块
workbench/: 见 workbench/CLAUDE.md，单一 DEV 工作台壳与 OG/SEO/真实页面预览
ui/: 见 ui/CLAUDE.md

法则: 成员完整·依赖单向·数据来源明确
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
