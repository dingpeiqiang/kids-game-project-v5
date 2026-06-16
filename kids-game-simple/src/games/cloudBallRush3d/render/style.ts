import { Color3 } from '@babylonjs/core'
import type { TrackTheme } from '../types'

/** 全局锁定：低多边形马卡龙治愈 3D — 柔光、低饱和、无写实 */
export const ART_STYLE = {
  name: 'lowpoly-macaron-healing-3d',
  ballSegments: 16,
  propSegments: 8,
  emissiveScale: 0.22,
  specularSoft: 0.28,
} as const

export function macaronColor(rgb: [number, number, number]): Color3 {
  return new Color3(rgb[0], rgb[1], rgb[2])
}

export function themePalette(theme: TrackTheme): {
  ground: Color3
  groundIce: Color3
  accent: Color3
  barrier: Color3
  slow: Color3
  bounce: Color3
  finish: Color3
  star: Color3
} {
  switch (theme) {
    case 'meadow':
      return {
        ground: macaronColor([0.62, 0.88, 0.68]),
        groundIce: macaronColor([0.85, 0.95, 1]),
        accent: macaronColor([0.55, 0.82, 0.55]),
        barrier: macaronColor([0.95, 0.78, 0.82]),
        slow: macaronColor([0.75, 0.7, 0.55]),
        bounce: macaronColor([0.55, 0.95, 0.75]),
        finish: macaronColor([0.45, 0.95, 0.65]),
        star: macaronColor([1, 0.92, 0.45]),
      }
    case 'cloud':
      return {
        ground: macaronColor([0.78, 0.9, 1]),
        groundIce: macaronColor([0.85, 0.95, 1]),
        accent: macaronColor([0.65, 0.82, 0.98]),
        barrier: macaronColor([0.9, 0.85, 1]),
        slow: macaronColor([0.7, 0.75, 0.85]),
        bounce: macaronColor([0.5, 0.88, 0.95]),
        finish: macaronColor([0.5, 0.92, 0.78]),
        star: macaronColor([1, 0.95, 0.55]),
      }
    case 'ice':
      return {
        ground: macaronColor([0.72, 0.9, 0.98]),
        groundIce: macaronColor([0.88, 0.96, 1]),
        accent: macaronColor([0.65, 0.85, 0.95]),
        barrier: macaronColor([0.85, 0.92, 1]),
        slow: macaronColor([0.6, 0.78, 0.9]),
        bounce: macaronColor([0.45, 0.85, 0.95]),
        finish: macaronColor([0.4, 0.88, 0.92]),
        star: macaronColor([0.85, 0.95, 1]),
      }
    case 'star':
    default:
      return {
        ground: macaronColor([0.48, 0.42, 0.72]),
        groundIce: macaronColor([0.55, 0.5, 0.78]),
        accent: macaronColor([0.55, 0.45, 0.75]),
        barrier: macaronColor([0.75, 0.65, 0.9]),
        slow: macaronColor([0.45, 0.4, 0.6]),
        bounce: macaronColor([0.65, 0.55, 0.95]),
        finish: macaronColor([0.55, 0.95, 0.7]),
        star: macaronColor([1, 0.88, 0.5]),
      }
  }
}

export function applySoftMatte(
  diffuse: Color3,
  emissiveMul: number = ART_STYLE.emissiveScale,
): { diffuse: Color3; specular: Color3; emissive: Color3 } {
  return {
    diffuse,
    specular: new Color3(ART_STYLE.specularSoft, ART_STYLE.specularSoft, ART_STYLE.specularSoft),
    emissive: diffuse.scale(emissiveMul),
  }
}