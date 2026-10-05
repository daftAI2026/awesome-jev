<!--
[INPUT]: 依赖贡献者的目录或代码改动及 CONTRIBUTING.md 的校验流程
[OUTPUT]: 生成可审阅的 PR 说明，明确数据投稿的隔离审核、条件收录与拒收边界
[POS]: .github 的通用 PR 模板；项目推荐优先走 Issue，实际目录改动走 PR
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
## Summary / 改动说明

<!-- Describe the actual changes. Not editing files? Use the Submit a project Issue form instead. -->
<!-- 请说明实际修改的文件与意图。只推荐项目、不修改文件时，请使用“提交项目”Issue 表单。 -->

## Project submission, if applicable / 项目收录（如适用）

- Repository / 仓库：
- Jev / System One connection and source evidence / 关联与来源证据：
- Independent alternative's license, if applicable / 独立替代实现的许可证（如适用）：

<!-- Add entries to data/github.json, then run npm run readme:sync. Do not only edit generated README sections. -->
<!-- 请修改 data/github.json 后生成 README，不要只改自动生成的 README 清单；不要虚构模型评分或收录理由。 -->

## Verification / 验证

<!-- Mark applicable checks and explain any omitted checks. Non-catalog PRs may mark catalog checks N/A. -->
<!-- 勾选适用检查，并说明未执行项；非目录改动可注明目录检查不适用。 -->

- [ ] Project additions: checked duplicates and followed CONTRIBUTING.md / 新增项目已检查重复并遵循贡献指南
- [ ] Catalog changes: `npm run readme:sync`, `npm run categories:check`, `npm run data:check`
- [ ] Added/edited inclusion rationale: `npm run inclusion:verify -- <base-commit-sha>`
- [ ] Code/UI changes: `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`

The reviewer only advises. A separate intake bot may merge addition-only catalog PRs after a current recommendation or explicit maintainer approval and exact-version CI.
审核与合并由隔离链路处理；仅新增目录的 PR 在有效审核建议或维护者明确批准及对应版本 CI 通过后，才可能自动合并。请勿提交密钥或私有资料。

A current, complete whole-project unrelated verdict for every candidate may close a catalog-only submission. Needs review, API failures and incomplete scans are not rejection. External fork branches are never deleted by the intake bot.
每项候选都经当前完整整仓审查确认不匹配时，纯目录投稿可能自动关闭；待复核、接口故障或未扫完不算拒收，机器人不删除外部 fork 分支。
