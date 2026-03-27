/**
 * 🎨 颜色工具函数
 */

/**
 * Hex 颜色字符串转 Phaser 数字
 * @example hexToNumber('#ff0000') → 16711680
 */
export function hexToNumber(hex: string): number {
  if (!hex) return 0x000000
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return 0x000000
  const num = parseInt(clean, 16)
  return isNaN(num) ? 0x000000 : num
}

/**
 * 数字颜色转 Hex 字符串
 * @example numberToHex(16711680) → '#ff0000'
 */
export function numberToHex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0')
}

/**
 * 颜色线性插值
 * @param colorA 起始颜色（数字格式）
 * @param colorB 终止颜色（数字格式）
 * @param t 插值系数 0-1
 */
export function lerpColor(colorA: number, colorB: number, t: number): number {
  const ar = (colorA >> 16) & 0xff
  const ag = (colorA >> 8) & 0xff
  const ab = colorA & 0xff
  const br = (colorB >> 16) & 0xff
  const bg = (colorB >> 8) & 0xff
  const bb = colorB & 0xff
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const b = Math.round(ab + (bb - ab) * t)
  return (r << 16) | (g << 8) | b
}

/**
 * 调整颜色亮度
 * @param color 颜色（数字格式）
 * @param amount 调整量（-1 到 1，正数变亮，负数变暗）
 */
export function adjustBrightness(color: number, amount: number): number {
  const r = Math.max(0, Math.min(255, ((color >> 16) & 0xff) + Math.round(255 * amount)))
  const g = Math.max(0, Math.min(255, ((color >> 8) & 0xff) + Math.round(255 * amount)))
  const b = Math.max(0, Math.min(255, (color & 0xff) + Math.round(255 * amount)))
  return (r << 16) | (g << 8) | b
}

/**
 * 生成随机颜色（数字格式）
 */
export function randomColor(): number {
  return Math.floor(Math.random() * 0xffffff)
}

/**
 * 颜色加透明度 → CSS rgba 字符串
 */
export function colorToRgba(color: number, alpha: number): string {
  const r = (color >> 16) & 0xff
  const g = (color >> 8) & 0xff
  const b = color & 0xff
  return `rgba(${r},${g},${b},${alpha})`
}
