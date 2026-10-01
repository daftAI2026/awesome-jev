<!--
[INPUT]: 依赖贡献者的目录或代码改动及 CONTRIBUTING.md 的校验流程
[OUTPUT]: 生成可审阅的 PR 说明，数据新增仍由既有机器人提供建议
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

The review bot does not merge PRs or approve inclusion. Maintainers make the final decision.
机器人不会自动合并或批准收录，最终由维护者确认。请勿提交密钥或私有资料。
