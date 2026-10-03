# data/
> L2 | 父级: ../CLAUDE.md

成员清单
github.json: 唯一规范 GitHub 项目快照，保留稳定身份、原始简介、人工收录说明及机器证据/GitHub 数字/Node 身份基线与清洗旧地址；已核验数字 ID 唯一，30 项 404 待核验；采集追加/统计刷新由 catalog 校验，浏览器使用构建期展示投影
news.json: 独立 AIHOT Jev 新闻的 ID 增量档案；完整同步后原子替换，不参与项目排名或 README

容量边界: github.json 使用共享 16 MiB 读取预算；data:check/build 在 90% 告警、95% 阻止发布。版本化索引/有界分片是 docs/data-model.md 的迁移预案，当前格式仍是 v1 单文件，不能偷偷添加旧 part-*.json。

法则: 来源独立·身份稳定·保留人工内容·禁止部分快照替代完整目录
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
