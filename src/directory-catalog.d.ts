/**
 * [INPUT]: 依赖展示目录、静态交付清单与 MCP 纯查询类型
 * [OUTPUT]: 声明 directory-catalog、static-catalog 与 mcp-catalog 虚拟模块
 * [POS]: src 的构建类型桥；MCP 模块由 Vite 强制隔离在服务端
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

declare module 'virtual:mcp-catalog' {
  const catalog: import('./lib/mcp-catalog').McpCatalog
  export default catalog
}
