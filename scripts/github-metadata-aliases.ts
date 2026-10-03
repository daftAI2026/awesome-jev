/**
 * [INPUT]: 依赖人工复核的 GitHub 旧/新路径同一 immutable repository ID 与固定提交证据
 * [OUTPUT]: 对外提供历史迁移的数字 ID 种子与既有核验凭据，不改目录 URL、ID 或审计身份
 * [POS]: scripts 的旧数据身份锚点；自动基线优先，后续改名不再追加人工例外或绑定历史目标名称
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
interface MetadataIdentityAlias {
  readonly target: string
  readonly repositoryId: number
  readonly checkedAt: string
  readonly evidenceUrl: string
}

// --- 2026-10-01 人工逐项查验旧/新 REST ID 相同且固定 commit 存在；不得自动追加 ---
export const METADATA_IDENTITY_ALIASES: Readonly<Record<string, MetadataIdentityAlias>> = {
  'abdelstark/awesome-typesafe': {
    target: 'abdelstark/awesome-typesafe-jev', repositoryId: 1374058281, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/AbdelStark/awesome-typesafe-jev/tree/ee13749965de70203f4afd557a70905b25746697',
  },
  'itsmostafa/typesafe-mcp': {
    target: 'itsmostafa/system-one-connector', repositoryId: 1373977947, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/itsmostafa/system-one-connector/tree/f9094b20196cf58a8f9305e48aba4bd2e1731690',
  },
  'gamesonrblx/jevbridge': {
    target: 'tacticocc/jevbridge', repositoryId: 1375279784, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/tacticocc/Jevbridge/tree/d4e8f7d483b8a5649218970eedbaf4f4a1e1e832',
  },
  'bunsdev/typesafe-ai-playground': {
    target: 'typesafeai/typesafe-playground', repositoryId: 1373324760, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/TypeSafeAI/typesafe-playground/tree/0fbc9ef9d99157a2f86631fa3b385ef88ca79a10',
  },
  'huntedman/jevlint': {
    target: 'iamtoomas/jevlint', repositoryId: 1374372746, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/iamtoomas/JevLint/tree/58de897ab1e39fa2fee9e45d16dcdac53a8a7d0a',
  },
  'devagrawal09/jev-code': {
    target: 'devagrawal09/stanley-code', repositoryId: 1374632146, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/devagrawal09/stanley-code/tree/85f39e71db0f615b8ce6161a6672a2bf955fa7fd',
  },
  'bunsdev/clarity-judge': {
    target: 'typesafeai/clarity-judge', repositoryId: 1373738071, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/TypeSafeAI/clarity-judge/tree/f7051ab8115aca726cdc16a4d131aeaa527bdabf',
  },
  'phureewat29/got-jev': {
    target: 'phureewat29/jev-got', repositoryId: 1374274889, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/phureewat29/jev-got/tree/232fc0ad0cc6f4d4e095df71ac5f05b0f49033a9',
  },
  'zavocc/ground-zero': {
    target: 'wmcbtech30/ground-zero', repositoryId: 1375280181, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/wmcbtech30/ground-zero/tree/cccd02c4a0083ca912d158c08f93bdc291469a9b',
  },
  'tinyhumansai/tinyjevclient': {
    target: 'tinyhumansai/tinydecisionmodels', repositoryId: 1374366286, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/tinyhumansai/tinydecisionmodels/tree/19ad7b184c605d620b859728d2d757ed699e711d',
  },
  'bunsdev/typesafe-ui': {
    target: 'typesafeai/typesafe-ui', repositoryId: 1373757159, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/TypeSafeAI/typesafe-ui/tree/61e5e9e30face27cf03da0035c79cde408240cca',
  },
  'xubqpanda/jevloop': {
    target: 'zjunlp/jevloop', repositoryId: 1378477219, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/zjunlp/JevLoop/tree/455c428ff63cfa91c66d2f5e9eadb89eae550acf',
  },
  'fruitymcdoo/jevchat': {
    target: 'sonofsaris/jevchat', repositoryId: 1378948439, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/SonOfSaris/JevChat/tree/6f0ec0f9390cacef9fd491dcd6f628355dbfac35',
  },
  'church-of-lane/csharp-jef-sdk': {
    target: 'church-of-lane/csharp-typesafe-sdk', repositoryId: 1378876381, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/Church-of-Lane/csharp-typesafe-sdk/tree/4f277494b96268d38edac6bf3d64de5209909e7c',
  },
  'completedottech/jev-factorio-agent': {
    target: 'jevplays-games/jev-factorio-agent', repositoryId: 1379060982, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/jevplays-games/jev-factorio-agent/tree/09f3f3424c8a6d77fec9d1cb04cf0b6f1bdde6ad',
  },
  'navidkashani/jev-guard': {
    target: 'veronalabs/spamlens', repositoryId: 1380305332, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/veronalabs/spamlens/tree/cdcbc62c966e4936dd422cc0f9be4df42b8cce8d',
  },
  'peterfriese/jev-foundation-models': {
    target: 'peterfriese/system-one-foundation-models', repositoryId: 1380219642, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/peterfriese/system-one-foundation-models/tree/8fbd6648d8f37b3aea73f374f109982e695d9124',
  },
  'bald0wang/jev-docs-zh': {
    target: 'datawhalechina/jev-cookbook', repositoryId: 1378018272, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/datawhalechina/jev-cookbook/tree/2b28cdbc5b133f032e34dfdccd60dd79e7f135b7',
  },
  'carlaiau/readwithjev': {
    target: 'carlaiau/read-with-jev', repositoryId: 1375767462, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/carlaiau/read-with-jev/tree/e97c84ba6792ceae987f604b7571529110893ab6',
  },
  'uehaj/jev-semgrep': {
    target: 'uehaj/sys1grep', repositoryId: 1376671563, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/uehaj/sys1grep/tree/ee7a455a8e646b8795b4e1e32674d59f76ef571e',
  },
  'jiangkoumo/ego-jev': {
    target: 'jiangkoumo/ego-decision-layer', repositoryId: 1376818592, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/jiangkoumo/ego-decision-layer/tree/8ec42930bec22f8c9af1909cf2c2ff1411862e7d',
  },
  'prestonkakukdev/agent-defense': {
    target: 'prestonkakukdev/jev-defense', repositoryId: 1380546311, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/prestonkakukdev/Jev-Defense/tree/1991b21159a0ea27bee0e81fb374c2ff187e7df6',
  },
  'stephenlb/truetype.ai-open': {
    target: 'stephenlb/system-one-model', repositoryId: 1376388571, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/stephenlb/system-one-model/tree/a07e6941e943e952af97f447f84aede36277520d',
  },
  'dperezcabrera/system-one-chess': {
    target: 'dperezcabrera/ai-chess-lab', repositoryId: 1380374177, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/dperezcabrera/ai-chess-lab/tree/0fecfbe2ed63365a3ada933b041026e7ec39a226',
  },
  'pakkio/openjev': {
    target: 'pakkio/jev-pakkio', repositoryId: 1377404048, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/pakkio/jev-pakkio/tree/a90e58de4bb59dd0c5a44b82f0af924d883e37a9',
  },
  'tayaee/typesafe-ai-jev-demo': {
    target: 'tayaee/classifier-benchmark-results', repositoryId: 1376777707, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/tayaee/classifier-benchmark-results/tree/1aae90198b20d6e470cf1382a63c8d796638317a',
  },
  'vbarrai/jurai': {
    target: 'vbarrai/comparai', repositoryId: 1388198234, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/vbarrai/comparai/tree/431a85dd5249d3da5e109a6fcdf03e6cfc727841',
  },
  'faizullah9181/esketcher': {
    target: 'faizullah9181/jev-esketcher', repositoryId: 1383974102, checkedAt: '2026-10-01',
    evidenceUrl: 'https://github.com/Faizullah9181/jev-esketcher/tree/f8e15570380dd639ae34c090afd2e4571b8af2db',
  },
}
