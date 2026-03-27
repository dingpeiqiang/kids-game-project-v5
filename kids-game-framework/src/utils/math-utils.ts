/**
 * 🔢 数学工具函数
 */

/**
 * 线性插值
 * @example lerp(0, 100, 0.5) → 50
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * 限制数值在指定范围内
 * @example clamp(150, 0, 100) → 100
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * 生成随机整数（包含边界）
 * @example randomInt(1, 6) → 1~6 之间的整数
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 计算两点之间的距离
 * @example distance(0, 0, 3, 4) → 5
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 计算两点之间的距离平方（性能优化版，避免 sqrt）
 */
export function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return dx * dx + dy * dy
}

/**
 * 角度转弧度
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * 弧度转角度
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI
}

/**
 * 计算两点之间的角度（弧度）
 */
export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1)
}

/**
 * 平滑插值（Smooth Step）
 */
export function smoothStep(min: number, max: number, value: number): number {
  const t = clamp((value - min) / (max - min), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * 检查一个数是否在范围内
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}
