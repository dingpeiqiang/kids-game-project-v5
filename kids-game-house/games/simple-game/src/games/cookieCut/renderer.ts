/**
 * 切饼干游戏 - 渲染逻辑
 */

import type { Cookie, Particle, Slice, LevelConfig } from './types'
import { GAME_CONFIG } from './config'

/**
 * 绘制切割轨迹
 */
export function drawSlices(ctx: CanvasRenderingContext2D, slices: Slice[]): void {
  slices.forEach((s, i) => {
    s.life -= 0.05
    if (s.life <= 0) {
      slices.splice(i, 1)
      return
    }
    
    ctx.lineCap = 'round'
    ctx.lineWidth = 16 * s.life
    ctx.strokeStyle = `rgba(255, 200, 100, ${s.life * 0.6})`
    ctx.beginPath()
    ctx.moveTo(s.x1, s.y1)
    ctx.lineTo(s.x2, s.y2)
    ctx.stroke()
    
    ctx.lineWidth = 4 * s.life
    ctx.strokeStyle = `rgba(255, 255, 255, ${s.life})`
    ctx.stroke()
  })
}

/**
 * 绘制饼干
 */
export function drawCookies(ctx: CanvasRenderingContext2D, cookies: Cookie[]): void {
  cookies.forEach(c => {
    if (c.sliced) return
    
    ctx.save()
    ctx.translate(c.x, c.y)
    ctx.rotate(c.rotation)
    
    // 发光效果
    ctx.shadowColor = c.color
    ctx.shadowBlur = 15
    
    ctx.font = `${c.size}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(c.emoji, 0, 0)
    ctx.restore()
  })
}

/**
 * 绘制粒子（支持旋转和掉落效果）
 */
export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  particles.forEach(p => {
    // 确保透明度在有效范围内
    const alpha = Math.max(0, Math.min(1, p.life))
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    
    // 如果粒子有旋转属性，使用旋转绘制
    if (p.rotation !== undefined && p.rotSpeed) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      
      // 绘制矩形碎片（更有碎片感）
      const size = Math.max(0.5, p.size * alpha)  // 确保最小尺寸为0.5
      ctx.fillRect(-size / 2, -size / 2, size, size)
      
      ctx.restore()
    } else if (p.isFalling) {
      // 掉落粒子：绘制为小圆点，带发光效果，像雪花/粉末
      const radius = Math.max(0.5, p.size * alpha)  // 确保半径不为负
      
      // 添加柔和的光晕
      ctx.shadowColor = p.color
      ctx.shadowBlur = 4
      
      ctx.beginPath()
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.shadowBlur = 0
    } else {
      // 圆形粉末/微尘
      const radius = Math.max(0.5, p.size * alpha)  // 确保半径不为负
      ctx.beginPath()
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
      ctx.fill()
      
      // 对于很小的粒子，添加发光效果
      if (p.size < 2) {
        ctx.shadowColor = p.color
        ctx.shadowBlur = 3
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }
    
    ctx.globalAlpha = 1
  })
}

/**
 * 绘制UI（分数、时间、连击、关卡等）
 */
export function drawUI(
  ctx: CanvasRenderingContext2D,
  score: number,
  combo: number,
  gameStartTime: number,
  levelConfig?: LevelConfig
): void {
  const W = GAME_CONFIG.canvasWidth
  const H = GAME_CONFIG.canvasHeight
  
  // 关卡信息（左上角）
  if (levelConfig) {
    ctx.fillStyle = '#00FF88'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`第 ${levelConfig.level} 关`, 15, 35)
    
    ctx.fillStyle = '#FFD700'
    ctx.font = '16px sans-serif'
    ctx.fillText(levelConfig.name, 15, 58)
    
    // 目标分数
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '14px sans-serif'
    ctx.fillText(`目标: ${levelConfig.targetScore}`, 15, 78)
  }
  
  // 分数（中上）
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 40px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(String(score), W / 2, 55)
  
  // 连击
  if (combo >= 2) {
    ctx.fillStyle = '#FF9F43'
    ctx.font = 'bold 28px sans-serif'
    ctx.fillText(`${combo} 连击!`, W / 2, 100)
  }

  // 时间（右上角）
  const elapsed = Date.now() - gameStartTime
  const duration = levelConfig?.duration || GAME_CONFIG.gameDuration
  const remaining = Math.max(0, duration - elapsed)
  const seconds = Math.ceil(remaining / 1000)
  
  ctx.fillStyle = seconds <= 10 ? '#FF4444' : '#fff'
  ctx.font = 'bold 24px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`${seconds}s`, W - 15, 50)

  // 提示（底部）
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '18px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🍪 滑动切割上升的饼干!', W / 2, H - 25)
}

/**
 * 绘制背景（支持屏幕震动和丰富效果）
 */
export function drawBackground(ctx: CanvasRenderingContext2D, shakeIntensity: number = 0): void {
  const W = GAME_CONFIG.canvasWidth
  const H = GAME_CONFIG.canvasHeight
  
  // 应用屏幕震动
  if (shakeIntensity > 0) {
    const shakeX = (Math.random() - 0.5) * shakeIntensity
    const shakeY = (Math.random() - 0.5) * shakeIntensity
    ctx.save()
    ctx.translate(shakeX, shakeY)
  }
  
  // 1. 基础渐变背景
  const baseGrad = ctx.createLinearGradient(0, 0, 0, H)
  baseGrad.addColorStop(0, '#3D2817')    // 深棕色顶部
  baseGrad.addColorStop(0.5, '#2D1B0E')  // 中棕色中间
  baseGrad.addColorStop(1, '#1A0F08')    // 深棕色底部
  ctx.fillStyle = baseGrad
  ctx.fillRect(0, 0, W, H)
  
  // 2. 添加木纹纹理效果
  ctx.globalAlpha = 0.08
  for (let i = 0; i < 20; i++) {
    const y = (i / 20) * H
    const thickness = 2 + Math.random() * 3
    ctx.fillStyle = i % 2 === 0 ? '#4A3420' : '#261510'
    ctx.fillRect(0, y, W, thickness)
  }
  ctx.globalAlpha = 1
  
  // 3. 添加温暖的光晕效果（从中心向外）
  const glowGrad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.8)
  glowGrad.addColorStop(0, 'rgba(255, 200, 100, 0.15)')  // 中心暖光
  glowGrad.addColorStop(0.5, 'rgba(255, 150, 50, 0.08)')
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')           // 边缘透明
  ctx.fillStyle = glowGrad
  ctx.fillRect(0, 0, W, H)
  
  // 4. 添加装饰性的小点（模拟面粉/糖粉）
  ctx.globalAlpha = 0.15
  ctx.fillStyle = '#FFF8DC'
  for (let i = 0; i < 30; i++) {
    const x = (i * 37 + 13) % W  // 使用伪随机分布
    const y = (i * 53 + 29) % H
    const size = 1 + (i % 3)
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  
  // 5. 添加边框装饰
  ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)'
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, W - 4, H - 4)
  
  // 恢复坐标系
  if (shakeIntensity > 0) {
    ctx.restore()
  }
}
