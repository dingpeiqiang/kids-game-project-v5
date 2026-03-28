// ============================================================================
// 🎮 通用类型定义
// ============================================================================
// 
// 📌 说明:
//   定义框架中最基础的、通用的类型
//   所有组件都可以使用这些基础类型
// ============================================================================

/**
 * ⭐ 方向类型
 * 
 * @remarks
 * 用于表示网格移动的方向
 * 适用于蛇、火车、蠕虫等任何网格移动物体
 */
export type Direction = 'up' | 'down' | 'left' | 'right'

/**
 * ⭐ 位置接口（像素坐标）
 * 
 * @remarks
 * 表示游戏世界中的二维位置（以像素为单位）
 * 
 * @example
 * ```typescript
 * const position: Position = { x: 100, y: 200 }
 * ```
 */
export interface Position {
  /** X 坐标（像素） */
  x: number
  /** Y 坐标（像素） */
  y: number
}

/**
 * ⭐ 网格位置接口（网格坐标）
 * 
 * @remarks
 * 表示网格系统中的位置（行列索引）
 * 
 * @example
 * ```typescript
 * const gridPos: GridPosition = { col: 5, row: 3 }
 * ```
 */
export interface GridPosition {
  /** 列索引（从 0 开始） */
  col: number
  /** 行索引（从 0 开始） */
  row: number
}

/**
 * ⭐ 尺寸接口
 * 
 * @remarks
 * 表示二维空间中的尺寸
 * 
 * @example
 * ```typescript
 * const size: Size = { width: 800, height: 600 }
 * ```
 */
export interface Size {
  /** 宽度 */
  width: number
  /** 高度 */
  height: number
}

/**
 * ⭐ 矩形区域接口
 * 
 * @remarks
 * 由位置和尺寸定义的矩形区域
 * 
 * @example
 * ```typescript
 * const rect: Rectangle = {
 *   x: 0,
 *   y: 0,
 *   width: 800,
 *   height: 600
 * }
 * ```
 */
export interface Rectangle extends Position, Size {
  // 继承 x, y, width, height
}

/**
 * ⭐ 颜色接口
 * 
 * @remarks
 * 支持多种颜色表示方式
 * 
 * @example
 * ```typescript
 * const color1: Color = '#ff0000'
 * const color2: Color = { r: 255, g: 0, b: 0 }
 * ```
 */
export type Color = string | RGBColor

/**
 * ⭐ RGB 颜色接口
 */
export interface RGBColor {
  /** 红色通道 (0-255) */
  r: number
  /** 绿色通道 (0-255) */
  g: number
  /** 蓝色通道 (0-255) */
  b: number
  /** 透明度 (0-1)，可选 */
  a?: number
}

/**
 * ⭐ 速度接口
 * 
 * @remarks
 * 表示物体的移动速度
 * 
 * @example
 * ```typescript
 * const speed: Speed = {
 *   pixelsPerSecond: 200,
 *   cellsPerSecond: 5
 * }
 * ```
 */
export interface Speed {
  /** 像素/秒 */
  pixelsPerSecond: number
  /** 单元格/秒（可选） */
  cellsPerSecond?: number
}
