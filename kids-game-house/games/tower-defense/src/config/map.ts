/**
 * 地图配置
 * 保留原有 JavaScript 版本的所有功能
 */

/**
 * 地图网格数据
 * 0 = 可放置区域，1 = 路径
 */
export const mapData: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 1, 1, 1, 1, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 1, 1, 1, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
]

/**
 * 地图宽度（格子数）
 */
export const MAP_WIDTH = 10

/**
 * 地图高度（格子数）
 */
export const MAP_HEIGHT = 10

/**
 * 格子尺寸（像素）
 */
export const TILE_SIZE = 64

/**
 * 导出地图（兼容原 JS 版本的 array 方法）
 */
export function cloneMap(): number[][] {
  return mapData.map(row => row.slice())
}

export default {
  map: cloneMap,
  WIDTH: MAP_WIDTH,
  HEIGHT: MAP_HEIGHT,
  TILE_SIZE
}