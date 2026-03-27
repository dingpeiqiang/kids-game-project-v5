/**
 * 📐 数学工具函数
 */

// ============================================================================
// 🔧 线性插值
// ============================================================================

/**
 * 线性插值
 * @param a 起始值
 * @param b 结束值
 * @param t 插值因子 (0-1)
 * @returns 插值结果
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// ============================================================================
// 🔧 映射数值范围
// ============================================================================

/**
 * 映射数值范围
 * @param value 原始值
 * @param inMin 输入最小值
 * @param inMax 输入最大值
 * @param outMin 输出最小值
 * @param outMax 输出最大值
 * @returns 映射后的值
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

// ============================================================================
// 🔧 限制数值范围
// ============================================================================

/**
 * 限制数值范围（钳制）
 * @param value 原始值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的值
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ============================================================================
// 🔧 判断是否在范围内
// ============================================================================

/**
 * 判断是否在范围内
 * @param value 要判断的值
 * @param min 最小值
 * @param max 最大值
 * @returns 是否在范围内
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

// ============================================================================
// 🔧 随机数生成
// ============================================================================

/**
 * 生成范围内的随机整数
 * @param min 最小值（包含）
 * @param max 最大值（包含）
 * @returns 随机整数
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 生成范围内的随机浮点数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机浮点数
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * 从数组中随机选择一个元素
 * @param array 数组
 * @returns 随机元素
 */
export function randomChoice<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)]
}

// ============================================================================
// 🔧 距离计算
// ============================================================================

/**
 * 计算两点之间的距离
 * @param x1 第一个点的 X 坐标
 * @param y1 第一个点的 Y 坐标
 * @param x2 第二个点的 X 坐标
 * @param y2 第二个点的 Y 坐标
 * @returns 距离
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 计算两点之间的平方距离（避免开方，性能更好）
 * @param x1 第一个点的 X 坐标
 * @param y1 第一个点的 Y 坐标
 * @param x2 第二个点的 X 坐标
 * @param y2 第二个点的 Y 坐标
 * @returns 平方距离
 */
export function distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return dx * dx + dy * dy
}

// ============================================================================
// 🔧 角度转换
// ============================================================================

/**
 * 弧度转角度
 * @param radians 弧度
 * @returns 角度
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI)
}

/**
 * 角度转弧度
 * @param degrees 角度
 * @returns 弧度
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// ============================================================================
// 💡 使用示例
// ============================================================================

/**
 * 使用示例：
 * ```typescript
 * import { lerp, clamp, randomInt, distance } from '@kids-game/framework/utils'
 * 
 * // 线性插值（平滑移动）
 * const pos = lerp(0, 100, 0.5) // 50
 * 
 * // 限制范围
 * const speed = clamp(150, 0, 100) // 100
 * 
 * // 随机整数
 * const dice = randomInt(1, 6)
 * 
 * // 距离计算
 * const dist = distance(0, 0, 3, 4) // 5
 * ```
 */
