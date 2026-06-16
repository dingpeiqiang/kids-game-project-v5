/** 兼容 import('./colorSort')；大厅 id 为 sort，见 sort/sort.lifecycle.ts */
export { initSort as initColorSort, destroySort as destroyColorSort } from '../sort/sort.lifecycle'
export { startColorSortLifecycle } from './ColorSortGame'