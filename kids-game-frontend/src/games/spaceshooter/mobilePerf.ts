/**
 * 太空射击 — 移动端 / WebView 性能档位（Android 卡顿时常因 Canvas 2D + 每帧 texture.refresh）
 */
const MOBILE_UA =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

export type SpaceShooterRenderQuality = 'high' | 'low'

export interface SpaceShooterPerfProfile {
  isMobile: boolean
  /** 关闭发光阴影等昂贵 Canvas 2D 效果 */
  lowFx: boolean
  /** 传给 renderer */
  renderQuality: SpaceShooterRenderQuality
  /** 星空粒子数量上限 */
  starCount: number
  /** 单帧爆炸粒子预算系数 (0~1) */
  particleBudgetMul: number
  /** Phaser 优先 WebGL */
  preferWebGL: boolean
}

function detectMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  if (MOBILE_UA.test(navigator.userAgent)) return true
  const vv = typeof window !== 'undefined' ? window.visualViewport : null
  const w = vv?.width ?? window.innerWidth
  return w < 768
}

/** 低端 Android WebView：无 WebGL2 或内存紧张时可再收紧 */
function isLikelyLowEndAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  if (!/Android/i.test(navigator.userAgent)) return false
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (typeof mem === 'number' && mem <= 3) return true
  const cores = navigator.hardwareConcurrency
  if (typeof cores === 'number' && cores <= 4) return true
  return false
}

let cached: SpaceShooterPerfProfile | null = null

export function getSpaceShooterPerfProfile(): SpaceShooterPerfProfile {
  if (cached) return cached
  const isMobile = detectMobile()
  const lowEnd = isMobile && isLikelyLowEndAndroid()
  cached = {
    isMobile,
    lowFx: isMobile,
    renderQuality: isMobile ? 'low' : 'high',
    starCount: lowEnd ? 36 : isMobile ? 48 : 80,
    particleBudgetMul: lowEnd ? 0.45 : isMobile ? 0.65 : 1,
    preferWebGL: isMobile,
  }
  return cached
}

export function resolvePhaserRenderType(PhaserNS: typeof Phaser): number {
  const perf = getSpaceShooterPerfProfile()
  if (!perf.preferWebGL) return PhaserNS.CANVAS
  if (typeof PhaserNS.WEBGL !== 'undefined') return PhaserNS.WEBGL
  return PhaserNS.AUTO
}