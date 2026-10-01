/**
 * [INPUT]: 依赖 lib/types 与 lib/categories 的前端展示契约
 * [OUTPUT]: 对外声明 virtual:directory-catalog 的默认目录数组类型
 * [POS]: src 的构建虚拟模块类型桥，不让前端依赖 Node 构建实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
declare module 'virtual:directory-catalog' {
  const projects: Array<import('./lib/types').DirectoryItem & { category?: import('./lib/categories').Category }>
  export default projects
}
