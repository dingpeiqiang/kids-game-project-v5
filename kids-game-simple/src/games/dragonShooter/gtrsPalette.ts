import type { GtrsCanvasStyle } from '../../utils/gtrsCanvasTheme'
import { shiftHue } from './dragon'

/** 按龙类型与路线索引从 GTRS game_palette 取基础色 */
export function dragonBaseColorFromGtrs(
  gtrs: GtrsCanvasStyle | undefined,
  type: string,
  routeIndex: number | undefined,
): string | null {
  if (!gtrs?.palette?.length) return null
  const order = ['small', 'medium', 'large', 'elite', 'boss']
  const idx = Math.max(0, order.indexOf(type))
  const paletteIdx = idx >= 0 ? idx % gtrs.palette.length : 0
  let color = gtrs.palette[paletteIdx]
  if (routeIndex !== undefined && routeIndex > 0) {
    color = shiftHue(color, routeIndex * 60)
  }
  return color
}