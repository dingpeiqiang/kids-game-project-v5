// ============================================================================
// 🎮 可移动对象接口定义
// ============================================================================
// 
// 📌 说明:
//   定义所有可以在游戏世界中移动的对象的通用接口
//   适用于蛇、火车、蠕虫、敌人、玩家等任何移动物体
// ============================================================================

import type { Direction, Position } from '../types/common'

/**
 * ⭐ 可移动游戏对象接口
 * 
 * @remarks
 * 任何需要在游戏世界中移动的物体都应实现此接口
 * GridMovementComponent 将管理所有实现了此接口的对象
 * 
 * @example
 * ```typescript
 * // 实现 IMovableObject 接口
 * class Snake implements IMovableObject {
 *   position = { x: 0, y: 0 }
 *   direction: Direction = 'right'
 *   speed = 200  // 像素/秒
 *   enabled = true
 *   
 *   // 添加蛇特有的属性
 *   segments: SnakeSegment[] = []
 *   length: number = 3
 * }
 * 
 * // 使用 GridMovementComponent 管理
 * const movement = new GridMovementComponent(scene)
 * movement.registerObject(snake)
 * ```
 */
export interface IMovableObject {
  /** 
   * 当前位置（像素坐标）
   * 
   * @remarks
   * 表示物体在游戏世界中的精确位置
   */
  position: Position
  
  /** 
   * 当前移动方向
   * 
   * @remarks
   * 只能是上、下、左、右四个方向之一
   */
  direction: Direction
  
  /** 
   * 移动速度（像素/秒）
   * 
   * @remarks
   * 正值表示向前移动
   * 负值表示向后移动（如果游戏支持）
   * 0 表示静止不动
   */
  speed: number
  
  /** 
   * 是否启用移动
   * 
   * @remarks
   * false 时物体不会响应移动指令
   * 但可能仍然可以被渲染和交互
   */
  enabled: boolean
}

/**
 * ⭐ 网格移动对象扩展接口
 * 
 * @remarks
 * 在 IMovableObject 基础上增加网格相关属性
 * 适用于严格基于网格移动的游戏对象
 * 
 * @example
 * ```typescript
 * class GridBasedSnake implements IGridMovableObject {
 *   position = { x: 0, y: 0 }
 *   direction: Direction = 'right'
 *   speed = 200
 *   enabled = true
 *   
 *   // 网格特定属性
 *   gridPosition = { col: 10, row: 5 }
 *   cellSize = 40
 * }
 * ```
 */
export interface IGridMovableObject extends IMovableObject {
  /** 
   * 当前网格位置（行列索引）
   * 
   * @remarks
   * 表示物体在网格系统中的位置
   */
  gridPosition: {
    col: number  // 列索引
    row: number  // 行索引
  }
  
  /** 
   * 单元格大小（像素）
   * 
   * @remarks
   * 用于在像素坐标和网格坐标间转换
   */
  cellSize?: number
}

/**
 * ⭐ 碰撞体类型枚举
 * 
 * @remarks
 * 定义不同的碰撞检测形状
 */
export enum ColliderType {
  /** 圆形碰撞体 */
  CIRCLE = 'circle',
  /** 矩形碰撞体（AABB） */
  RECTANGLE = 'rectangle',
  /** 多边形碰撞体 */
  POLYGON = 'polygon',
  /** 点碰撞体（用于检测） */
  POINT = 'point'
}

/**
 * ⭐ 碰撞体接口
 * 
 * @remarks
 * 定义了物体的碰撞检测区域
 */
export interface ICollider {
  /** 碰撞体类型 */
  type: ColliderType
  /** 碰撞体中心位置 */
  position: Position
  /** 是否启用碰撞检测 */
  enabled: boolean
  
  // ========== 根据类型不同，需要不同的属性 ==========
  /** 圆形半径（仅 CIRCLE 类型需要） */
  radius?: number
  /** 矩形宽高（仅 RECTANGLE 类型需要） */
  width?: number
  height?: number
  /** 多边形顶点数组（仅 POLYGON 类型需要） */
  vertices?: Position[]
}

/**
 * ⭐ 带碰撞体的移动对象接口
 * 
 * @remarks
 * 结合了移动能力和碰撞检测能力
 */
export interface IMovableWithCollider extends IMovableObject {
  /** 碰撞体 */
  collider: ICollider
}
