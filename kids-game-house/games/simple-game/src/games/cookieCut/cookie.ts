/**
 * 切饼干游戏 - 饼干逻辑
 */

import type { Cookie, LevelConfig } from './types'
import { COOKIES } from './config'

/**
 * 生成新饼干（支持关卡配置）
 */
export function spawnCookie(levelConfig?: LevelConfig): Cookie {
  const cookieSizeMin = levelConfig?.cookieSizeMin || 50
  const cookieSizeMax = levelConfig?.cookieSizeMax || 70
  const canvasWidth = levelConfig?.canvasWidth || 400
  const canvasHeight = levelConfig?.canvasHeight || 600
  const verticalSpeed = levelConfig?.verticalSpeed || 3
  const horizontalSpeed = levelConfig?.horizontalSpeed || 1.5
  const rotationSpeed = levelConfig?.rotationSpeed || 0.08
  
  const size = cookieSizeMin + Math.random() * (cookieSizeMax - cookieSizeMin)
  const x = 60 + Math.random() * (canvasWidth - 120)
  const template = COOKIES[Math.floor(Math.random() * COOKIES.length)]
  
  return {
    x,
    y: canvasHeight + size,
    vx: (Math.random() - 0.5) * horizontalSpeed,
    vy: -(verticalSpeed + Math.random() * 2),
    size,
    rotation: 0,
    rotSpeed: (Math.random() - 0.5) * rotationSpeed,
    ...template,
    sliced: false
  }
}

/**
 * 更新饼干位置和状态（支持关卡配置和冻结效果）
 */
export function updateCookies(cookies: Cookie[], levelConfig?: LevelConfig): void {
  const canvasWidth = levelConfig?.canvasWidth || 400
  
  for (let i = cookies.length - 1; i >= 0; i--) {
    const c = cookies[i]
    
    // 检查是否被冻结
    const isFrozen = (window as any).cookieFreeze && Date.now() < (window as any).cookieFreeze
    
    if (!isFrozen) {
      c.x += c.vx
      c.y += c.vy
      c.rotation += c.rotSpeed
    }
    
    // 左右边界反弹
    if (c.x < c.size / 2) {
      c.x = c.size / 2
      c.vx *= -0.8
    }
    if (c.x > canvasWidth - c.size / 2) {
      c.x = canvasWidth - c.size / 2
      c.vx *= -0.8
    }
    
    // 超出顶部移除
    if (c.y < -c.size * 2) {
      cookies.splice(i, 1)
    }
  }
}

/**
 * 检查切割碰撞
 */
export function checkSlice(
  cookies: Cookie[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  onSlice: (cookie: Cookie, combo: number) => void
): number {
  const sliceLen = Math.hypot(x2 - x1, y2 - y1)
  if (sliceLen < 20) return 0

  let slicedCount = 0
  
  for (let i = cookies.length - 1; i >= 0; i--) {
    const c = cookies[i]
    if (c.sliced) continue

    const dx = x2 - x1
    const dy = y2 - y1
    const fx = c.x - x1
    const fy = c.y - y1
    const t = Math.max(0, Math.min(1, (fx * dx + fy * dy) / (sliceLen * sliceLen || 1)))
    const dist = Math.hypot(c.x - (x1 + t * dx), c.y - (y1 + t * dy))
    
    if (dist < c.size / 2 + 25) {
      c.sliced = true
      slicedCount++
      onSlice(c, slicedCount)
      cookies.splice(i, 1)
    }
  }
  
  return slicedCount
}
