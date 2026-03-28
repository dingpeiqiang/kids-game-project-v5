// ============================================================================
// 🛠️ 通用工具函数
// ============================================================================
// 
// 📌 说明:
//   提供框架中常用的工具函数
//   包括数学计算、类型检查、辅助方法等
// ============================================================================

import type { Position, GridPosition, Rectangle, RGBColor } from '../types/common'

/**
 * ⭐ 将网格坐标转换为像素坐标
 * 
 * @param gridPos - 网格位置
 * @param cellSize - 单元格大小（像素）
 * @returns 像素位置
 * 
 * @example
 * ```typescript
 * const pixelPos = gridToWorld({ col: 5, row: 3 }, 40)
 * // { x: 200, y: 120 }
 * ```
 */
export function gridToWorld(gridPos: GridPosition, cellSize: number): Position {
  return {
    x: gridPos.col * cellSize,
    y: gridPos.row * cellSize
  }
}

/**
 * ⭐ 将像素坐标转换为网格坐标
 * 
 * @param worldPos - 像素位置
 * @param cellSize - 单元格大小（像素）
 * @returns 网格位置
 * 
 * @example
 * ```typescript
 * const gridPos = worldToGrid({ x: 200, y: 120 }, 40)
 * // { col: 5, row: 3 }
 * ```
 */
export function worldToGrid(worldPos: Position, cellSize: number): GridPosition {
  return {
    col: Math.floor(worldPos.x / cellSize),
    row: Math.floor(worldPos.y / cellSize)
  }
}

/**
 * ⭐ 计算两点之间的距离
 * 
 * @param pos1 - 位置 1
 * @param pos2 - 位置 2
 * @returns 距离（像素）
 * 
 * @example
 * ```typescript
 * const distance = getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })
 * // 5
 * ```
 */
export function getDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x
  const dy = pos2.y - pos1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * ⭐ 计算两点之间的平方距离（用于性能优化）
 * 
 * @param pos1 - 位置 1
 * @param pos2 - 位置 2
 * @returns 平方距离
 * 
 * @remarks
 * 不需要精确距离时，使用平方距离可以避免开方运算，提高性能
 * 
 * @example
 * ```typescript
 * const sqDist = getSquaredDistance({ x: 0, y: 0 }, { x: 3, y: 4 })
 * // 25
 * ```
 */
export function getSquaredDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x
  const dy = pos2.y - pos1.y
  return dx * dx + dy * dy
}

/**
 * ⭐ 检查两个矩形是否相交
 * 
 * @param rect1 - 矩形 1
 * @param rect2 - 矩形 2
 * @returns true 如果相交
 * 
 * @example
 * ```typescript
 * const intersects = checkRectangleIntersection(
 *   { x: 0, y: 0, width: 100, height: 100 },
 *   { x: 50, y: 50, width: 100, height: 100 }
 * )
 * // true
 * ```
 */
export function checkRectangleIntersection(rect1: Rectangle, rect2: Rectangle): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  )
}

/**
 * ⭐ 检查点是否在矩形内
 * 
 * @param point - 点坐标
 * @param rect - 矩形区域
 * @returns true 如果点在矩形内
 * 
 * @example
 * ```typescript
 * const inside = isPointInRectangle({ x: 50, y: 50 }, { x: 0, y: 0, width: 100, height: 100 })
 * // true
 * ```
 */
export function isPointInRectangle(point: Position, rect: Rectangle): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

/**
 * ⭐ 限制数值在指定范围内
 * 
 * @param value - 要限制的值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 限制后的值
 * 
 * @example
 * ```typescript
 * const clamped = clamp(150, 0, 100)
 * // 100
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * ⭐ 线性插值
 * 
 * @param start - 起始值
 * @param end - 结束值
 * @param t - 插值因子 (0-1)
 * @returns 插值结果
 * 
 * @remarks
 * t=0 返回 start，t=1 返回 end，t=0.5 返回中间值
 * 
 * @example
 * ```typescript
 * const result = lerp(0, 100, 0.5)
 * // 50
 * ```
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1)
}

/**
 * ⭐ 将 RGB 颜色转换为十六进制字符串
 * 
 * @param color - RGB 颜色对象
 * @returns 十六进制颜色字符串
 * 
 * @example
 * ```typescript
 * const hex = rgbToHex({ r: 255, g: 0, b: 0 })
 * // '#ff0000'
 * ```
 */
export function rgbToHex(color: RGBColor): string {
  const r = color.r.toString(16).padStart(2, '0')
  const g = color.g.toString(16).padStart(2, '0')
  const b = color.b.toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

/**
 * ⭐ 将十六进制颜色转换为 RGB 对象
 * 
 * @param hex - 十六进制颜色字符串
 * @returns RGB 颜色对象
 * 
 * @example
 * ```typescript
 * const rgb = hexToRgb('#ff0000')
 * // { r: 255, g: 0, b: 0 }
 * ```
 */
export function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  
  if (!result) {
    throw new Error(`无效的颜色值：${hex}`)
  }
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  }
}

/**
 * ⭐ 生成随机整数
 * 
 * @param min - 最小值（包含）
 * @param max - 最大值（不包含）
 * @returns 随机整数
 * 
 * @example
 * ```typescript
 * const random = randomInt(1, 10)
 * // 1 到 9 之间的随机整数
 * ```
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min
}

/**
 * ⭐ 生成随机浮点数
 * 
 * @param min - 最小值
 * @param max - 最大值
 * @returns 随机浮点数
 * 
 * @example
 * ```typescript
 * const random = randomFloat(0, 1)
 * // 0 到 1 之间的随机小数
 * ```
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * ⭐ 从数组中随机选择一个元素
 * 
 * @param array - 数组
 * @returns 随机选择的元素，如果数组为空则返回 undefined
 * 
 * @example
 * ```typescript
 * const item = randomChoice(['apple', 'banana', 'orange'])
 * ```
 */
export function randomChoice<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined
  return array[randomInt(0, array.length)]
}

/**
 * ⭐ 深度克隆对象
 * 
 * @param obj - 要克隆的对象
 * @returns 克隆后的对象
 * 
 * @example
 * ```typescript
 * const cloned = deepClone({ a: 1, b: { c: 2 } })
 * ```
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * ⭐ 防抖函数
 * 
 * @param func - 要防抖的函数
 * @param wait - 等待时间（毫秒）
 * @returns 防抖后的函数
 * 
 * @remarks
 * 在指定的时间间隔内，只执行最后一次调用
 * 
 * @example
 * ```typescript
 * const debouncedResize = debounce(() => {
 *   console.log('窗口大小改变')
 * }, 300)
 * 
 * window.addEventListener('resize', debouncedResize)
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(later, wait)
  }
}

/**
 * ⭐ 节流函数
 * 
 * @param func - 要节流的函数
 * @param limit - 时间限制（毫秒）
 * @returns 节流后的函数
 * 
 * @remarks
 * 确保函数在指定的时间间隔内最多执行一次
 * 
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => {
 *   console.log('滚动事件')
 * }, 100)
 * 
 * window.addEventListener('scroll', throttledScroll)
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * ⭐ 格式化数字，添加千位分隔符
 * 
 * @param num - 要格式化的数字
 * @returns 格式化后的字符串
 * 
 * @example
 * ```typescript
 * const formatted = formatNumber(1234567)
 * // '1,234,567'
 * ```
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

/**
 * ⭐ 将角度转换为弧度
 * 
 * @param degrees - 角度值
 * @returns 弧度值
 * 
 * @example
 * ```typescript
 * const radians = degreesToRadians(180)
 * // Math.PI
 * ```
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * ⭐ 将弧度转换为角度
 * 
 * @param radians - 弧度值
 * @returns 角度值
 * 
 * @example
 * ```typescript
 * const degrees = radiansToDegrees(Math.PI)
 * // 180
 * ```
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI)
}
