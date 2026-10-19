/**
 * [INPUT]: 依赖展示目录与静态交付清单的类型契约
 * [OUTPUT]: 声明 virtual:directory-catalog 与 virtual:static-catalog
 * [POS]: src 的虚拟模块类型桥，不让运行时依赖 Node 构建实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
declare module 'virtual:directory-catalog' {
  const projects: Array<import('./lib/types').DirectoryItem & { category?: import('./lib/categories').Category }>
  export default projects
}

declare module 'virtual:static-catalog' {
  const catalog: import('./lib/static-delivery').StaticCatalog
  export default catalog
}
