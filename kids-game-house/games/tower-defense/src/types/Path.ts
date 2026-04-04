/**
 * 路径系统类型定义
 */

/**
 * 路径点坐标
 */
export interface Waypoint {
  x: number
  y: number
}

/**
 * 路径跟随者接口
 * 任何需要沿路径移动的实体都应实现此接口
 */
export interface PathFollower {
  x: number
  y: number
  rotation: number
}

/**
 * 路径数据
 */
export interface PathData {
  /** 路径点数组 */
  waypoints: Waypoint[]
  /** 路径总长度 */
  totalLength: number
}

/**
 * 路径类接口
 */
export interface IPath {
  /** 获取所有路径点 */
  getWaypoints(): Waypoint[]
  
  /** 计算从起点到指定点的距离 */
  getDistanceAt(point: Waypoint): number
  
  /** 根据距离获取路径上的点 */
  getPointAtDistance(distance: number): Waypoint
  
  /** 绘制路径（调试用） */
  draw(graphics: Phaser.GameObjects.Graphics): void
}
