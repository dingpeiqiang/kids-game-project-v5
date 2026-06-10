/** 将 #RRGGBB 转为 rgba 字符串 */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** 略加深十六进制颜色（用于渐变底） */
export function darkenHex(hex: string, amount = 0.25): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  const r = clamp(parseInt(h.slice(0, 2), 16) * (1 - amount))
  const g = clamp(parseInt(h.slice(2, 4), 16) * (1 - amount))
  const b = clamp(parseInt(h.slice(4, 6), 16) * (1 - amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}