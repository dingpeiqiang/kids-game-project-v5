/**
 * 🎨 颜色工具函数
 */

// ============================================================================
// 🔧 Hex 颜色字符串转数字
// ============================================================================

/**
 * Hex 颜色字符串转数字
 * @param hex 十六进制颜色字符串（如 "#ff0000"）
 * @returns 数字格式颜色值
 */
export function hexToNumber(hex: string): number {
  if (!hex) return 0x000000
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return 0x000000
  const num = parseInt(clean, 16)
  return isNaN(num) ? 0x000000 : num
}

// ============================================================================
// 🔧 数字转 Hex 颜色字符串
// ============================================================================

/**
 * 数字转 Hex 颜色字符串
 * @param num 数字格式颜色值
 * @returns 十六进制颜色字符串（如 "#ff0000"）
 */
export function numberToHex(num: number): string {
  const hex = num.toString(16).padStart(6, '0')
  return `#${hex}`
}

// ============================================================================
// 🔧 RGB 转数字
// ============================================================================

/**
 * RGB 转数字
 * @param r 红色通道 (0-255)
 * @param g 绿色通道 (0-255)
 * @param b 蓝色通道 (0-255)
 * @returns 数字格式颜色值
 */
export function rgbToNumber(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b
}

// ============================================================================
// 🔧 数字转 RGB
// ============================================================================

/**
 * 数字转 RGB
 * @param num 数字格式颜色值
 * @returns RGB 对象 { r, g, b }
 */
export function numberToRgb(num: number): { r: number; g: number; b: number } {
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff
  }
}

// ============================================================================
// 🔧 颜色插值
// ============================================================================

/**
 * 颜色插值（渐变）
 * @param color1 起始颜色（数字格式）
 * @param color2 结束颜色（数字格式）
 * @param factor 插值因子 (0-1)
 * @returns 插值后的颜色（数字格式）
 */
export function lerpColor(color1: number, color2: number, factor: number): number {
  const c1 = numberToRgb(color1)
  const c2 = numberToRgb(color2)
  
  const r = Math.round(c1.r + (c2.r - c1.r) * factor)
  const g = Math.round(c1.g + (c2.g - c1.g) * factor)
  const b = Math.round(c1.b + (c2.b - c1.b) * factor)
  
  return rgbToNumber(r, g, b)
}

// ============================================================================
// 🔧 调整颜色亮度
// ============================================================================

/**
 * 调整颜色亮度
 * @param color 原始颜色（数字格式）
 * @param amount 亮度调整量 (-1 到 1)
 * @returns 调整后的颜色（数字格式）
 */
export function adjustBrightness(color: number, amount: number): number {
  const rgb = numberToRgb(color)
  
  const factor = 1 + amount
  const r = Math.min(255, Math.max(0, Math.round(rgb.r * factor)))
  const g = Math.min(255, Math.max(0, Math.round(rgb.g * factor)))
  const b = Math.min(255, Math.max(0, Math.round(rgb.b * factor)))
  
  return rgbToNumber(r, g, b)
}

// ============================================================================
// 💡 使用示例
// ============================================================================

/**
 * 使用示例：
 * ```typescript
 * import { hexToNumber, numberToHex, lerpColor } from '@kids-game/framework/utils'
 * 
 * // Hex 转数字
 * const color = hexToNumber('#ff0000') // 16711680
 * 
 * // 数字转 Hex
 * const hex = numberToHex(16711680) // "#ff0000"
 * 
 * // 颜色渐变
 * const red = hexToNumber('#ff0000')
 * const blue = hexToNumber('#0000ff')
 * const purple = lerpColor(red, blue, 0.5) // 紫色
 * 
 * // 调整亮度
 * const brighter = adjustBrightness(red, 0.2) // 亮红色
 * const darker = adjustBrightness(red, -0.2)  // 暗红色
 * ```
 */
