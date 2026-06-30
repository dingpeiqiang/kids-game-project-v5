/**
 * 切饼干游戏 - 渲染逻辑
 */

import type { Cookie, Particle, Slice, LevelConfig, Shockwave, ScorePopup, LevelTransition } from './types'
import { GAME_CONFIG } from './config'

/**
 * 绘制切割轨迹（性能优化版）
 * - 减少图层数量
 * - 优化shadowBlur
 */
export function drawSlices(ctx: CanvasRenderingContext2D, slices: Slice[]): void {
  const MAX_SLICES = 8 // 切割轨迹数量上限
  if (slices.length > MAX_SLICES) {
    slices.splice(0, slices.length - MAX_SLICES)
  }
  
  for (let i = slices.length - 1; i >= 0; i--) {
    const s = slices[i]
    s.life -= 0.035 // 稍快的衰减
    if (s.life <= 0) {
      slices.splice(i, 1)
      continue
    }
    
    const alpha = s.life
    
    // 简化为两层：外层光晕 + 内层核心
    ctx.save()
    // 外层发光
    ctx.shadowColor = `rgba(255, 150, 80, ${alpha * 0.8})`
    ctx.shadowBlur = 25 * alpha
    ctx.lineCap = 'round'
    ctx.lineWidth = 25 * alpha
    ctx.strokeStyle = `rgba(255, 150, 80, ${alpha * 0.4})`
    ctx.beginPath()
    ctx.moveTo(s.x1, s.y1)
    ctx.lineTo(s.x2, s.y2)
    ctx.stroke()
    
    // 内层渐变核心
    const gradient = ctx.createLinearGradient(s.x1, s.y1, s.x2, s.y2)
    gradient.addColorStop(0, `rgba(255, 230, 150, ${alpha})`)
    gradient.addColorStop(0.5, `rgba(255, 150, 50, ${alpha})`)
    gradient.addColorStop(1, `rgba(255, 230, 150, ${alpha})`)
    
    ctx.lineWidth = 12 * alpha
    ctx.strokeStyle = gradient
    ctx.shadowColor = `rgba(255, 255, 255, ${alpha})`
    ctx.shadowBlur = 15 * alpha
    ctx.stroke()
    ctx.restore()
    
    // 简化的端点发光
    const drawEndPoint = (x: number, y: number) => {
      const radius = 8 * alpha
      ctx.save()
      ctx.shadowColor = `rgba(255, 220, 150, ${alpha})`
      ctx.shadowBlur = 15 * alpha
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    
    drawEndPoint(s.x1, s.y1)
    drawEndPoint(s.x2, s.y2)
  }
}

/**
 * 绘制冲击波效果（性能优化版）
 * - 简化为两层光环
 * - 减少shadowBlur的使用
 */
export function drawShockwaves(ctx: CanvasRenderingContext2D, shockwaves: Shockwave[]): void {
  const MAX_SHOCKWAVES = 10 // 冲击波数量上限
  if (shockwaves.length > MAX_SHOCKWAVES) {
    shockwaves.splice(0, shockwaves.length - MAX_SHOCKWAVES)
  }
  
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const s = shockwaves[i]
    
    s.radius += 12
    s.life -= 0.045
    
    if (s.life <= 0 || s.radius >= s.maxRadius) {
      shockwaves.splice(i, 1)
      continue
    }
    
    const alpha = s.life * (1 - s.radius / s.maxRadius)
    
    ctx.save()
    
    // 外层光环（主效果）
    ctx.strokeStyle = s.color
    ctx.globalAlpha = alpha * 0.9
    ctx.lineWidth = 6
    ctx.shadowColor = s.color
    ctx.shadowBlur = 20
    
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2)
    ctx.stroke()
    
    // 内层简化光环
    ctx.lineWidth = 3
    ctx.globalAlpha = alpha * 0.5
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.radius * 0.7, 0, Math.PI * 2)
    ctx.stroke()
    
    ctx.restore()
  }
}

/**
 * 绘制分数飘字（性能优化版）
 */
export function drawScorePopups(ctx: CanvasRenderingContext2D, popups: ScorePopup[]): void {
  const MAX_POPUPS = 15 // 飘字数量上限
  if (popups.length > MAX_POPUPS) {
    popups.splice(0, popups.length - MAX_POPUPS)
  }
  
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i]
    
    p.y -= 2.8
    p.life -= 0.025
    
    if (p.life <= 0) {
      popups.splice(i, 1)
      continue
    }
    
    const alpha = p.life
    const scale = 1 + (1 - p.life) * 0.5
    
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(p.x, p.y)
    ctx.scale(scale, scale)
    
    // 简化的颜色选择
    let textColor, shadowColor, fontSize
    if (p.combo >= 8) {
      textColor = '#FF0000'
      shadowColor = 'rgba(255, 0, 0, 0.7)'
      fontSize = 36
    } else if (p.combo >= 5) {
      textColor = '#FFD700'
      shadowColor = 'rgba(255, 215, 0, 0.6)'
      fontSize = 30
    } else if (p.combo >= 3) {
      textColor = '#FF9F43'
      shadowColor = 'rgba(255, 159, 67, 0.5)'
      fontSize = 26
    } else {
      textColor = '#FFFFFF'
      shadowColor = 'rgba(255, 255, 255, 0.4)'
      fontSize = 22
    }
    
    ctx.shadowColor = shadowColor
    ctx.shadowBlur = 12 + p.combo * 1.5
    
    ctx.fillStyle = textColor
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    ctx.fillText(`+${p.score}`, 0, 0)
    
    if (p.combo >= 2) {
      ctx.font = `bold ${16 + p.combo}px sans-serif`
      ctx.fillStyle = p.combo >= 5 ? '#FFD700' : '#FFE66D'
      ctx.shadowBlur = 8
      ctx.fillText(`${p.combo}x`, 0, -fontSize - 4)
    }
    
    ctx.restore()
  }
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
 * 绘制粒子（性能优化版）
 * - 简化闪光效果
 * - 减少shadowBlur使用
 * - 合并相似粒子的渲染
 */
export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  // 先绘制普通粒子
  particles.forEach(p => {
    if (p.isSparkle) return // 闪光粒子后面单独处理
    
    const alpha = Math.max(0, Math.min(1, p.life))
    if (alpha < 0.05) return // 跳过几乎看不见的粒子
    
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    
    if (p.rotation !== undefined && p.rotSpeed) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      const size = Math.max(0.5, p.size * alpha)
      ctx.shadowColor = p.color
      ctx.shadowBlur = 3 // 减少shadowBlur
      ctx.fillRect(-size / 2, -size / 2, size, size)
      ctx.restore()
    } else {
      const radius = Math.max(0.5, p.size * alpha)
      ctx.shadowColor = p.color
      ctx.shadowBlur = 2 // 减少shadowBlur
      ctx.beginPath()
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  
  // 单独绘制闪光粒子（数量少，效果好）
  particles.forEach(p => {
    if (!p.isSparkle) return
    
    const alpha = Math.max(0, Math.min(1, p.life))
    if (alpha < 0.05) return
    
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    const radius = Math.max(0.5, p.size * alpha)
    
    ctx.shadowColor = p.color
    ctx.shadowBlur = 8 // 闪光粒子保持一定的发光
    ctx.beginPath()
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
    ctx.fill()
    
    // 简化的十字光芒
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(Math.PI / 4)
    ctx.shadowBlur = 4
    ctx.fillRect(-radius * 2, -radius / 3, radius * 4, radius * 0.6)
    ctx.restore()
  })
  
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
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
  
  // 连击（解压爽快感版 - 超夸张）
  if (combo >= 2) {
    ctx.save()
    
    // 根据连击数选择颜色（更鲜艳）
    let comboColor: string
    let glowColor: string
    let comboScale: number
    if (combo >= 20) {
      comboColor = '#FF0000'
      glowColor = 'rgba(255, 0, 0, 1)'
      comboScale = 2.5
    } else if (combo >= 15) {
      comboColor = '#FF0000'
      glowColor = 'rgba(255, 0, 0, 0.95)'
      comboScale = 2.2
    } else if (combo >= 10) {
      comboColor = '#FF6B6B'
      glowColor = 'rgba(255, 107, 107, 0.9)'
      comboScale = 1.9
    } else if (combo >= 7) {
      comboColor = '#FFD700'
      glowColor = 'rgba(255, 215, 0, 0.85)'
      comboScale = 1.6
    } else if (combo >= 5) {
      comboColor = '#FFE66D'
      glowColor = 'rgba(255, 230, 109, 0.8)'
      comboScale = 1.4
    } else if (combo >= 3) {
      comboColor = '#FF9F43'
      glowColor = 'rgba(255, 159, 67, 0.7)'
      comboScale = 1.2
    } else {
      comboColor = '#FFB84D'
      glowColor = 'rgba(255, 184, 77, 0.6)'
      comboScale = 1.1
    }
    
    // 超强发光效果
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 35 + combo * 4
    
    // 绘制超大连击数字
    ctx.font = `bold ${36 * comboScale}px sans-serif`
    ctx.fillStyle = comboColor
    ctx.fillText(`${combo}`, W / 2 - 40, 110)
    
    // 绘制"连击!"文字（更大）
    ctx.font = 'bold 24px sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowBlur = 20
    ctx.fillText('连击!', W / 2 + 20, 110)
    
    // 超多彩的装饰
    if (combo >= 20) {
      ctx.font = 'bold 22px sans-serif'
      ctx.fillStyle = '#FF0000'
      ctx.fillText('🔥🔥🔥', W / 2 - 90, 110)
      ctx.fillText('🔥🔥🔥', W / 2 + 60, 110)
    } else if (combo >= 15) {
      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = '#FF6B6B'
      ctx.fillText('🔥🔥', W / 2 - 75, 110)
      ctx.fillText('🔥🔥', W / 2 + 50, 110)
    } else if (combo >= 10) {
      ctx.font = 'bold 18px sans-serif'
      ctx.fillStyle = '#FF6B6B'
      ctx.fillText('🔥🔥', W / 2 - 70, 110)
      ctx.fillText('🔥🔥', W / 2 + 45, 110)
    } else if (combo >= 7) {
      ctx.font = 'bold 18px sans-serif'
      ctx.fillStyle = '#FFD700'
      ctx.fillText('✨🔥', W / 2 - 65, 110)
      ctx.fillText('🔥✨', W / 2 + 40, 110)
    } else if (combo >= 5) {
      ctx.font = 'bold 16px sans-serif'
      ctx.fillStyle = '#FFD700'
      ctx.fillText('✨', W / 2 - 55, 110)
      ctx.fillText('✨', W / 2 + 35, 110)
    }
    
    ctx.restore()
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

/**
 * 绘制关卡过渡动画
 */
export function drawLevelTransition(ctx: CanvasRenderingContext2D, transition: LevelTransition): void {
  const W = GAME_CONFIG.canvasWidth
  const H = GAME_CONFIG.canvasHeight
  
  if (!transition.active) return
  
  let alpha = 0
  let scale = 1
  let offsetY = 0
  
  if (transition.direction === 'out') {
    // 淡出效果
    alpha = transition.progress
    scale = 1 - transition.progress * 0.1
    offsetY = -transition.progress * 20
  } else if (transition.direction === 'show') {
    // 显示关卡信息
    const showProgress = transition.progress - 1
    if (showProgress < 0.3) {
      alpha = showProgress / 0.3
      scale = 0.8 + alpha * 0.2
      offsetY = -20 + alpha * 20
    } else if (showProgress > 0.7) {
      alpha = 1 - (showProgress - 0.7) / 0.3
      scale = 1 - (showProgress - 0.7) * 0.2
      offsetY = alpha * 20
    } else {
      alpha = 1
      scale = 1
      offsetY = 0
    }
  } else if (transition.direction === 'in') {
    // 淡入效果
    alpha = 1 - transition.progress
    scale = 0.9 + transition.progress * 0.1
    offsetY = transition.progress * 20
  }
  
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(W / 2, H / 2 + offsetY)
  ctx.scale(scale, scale)
  
  // 绘制背景遮罩
  const bgAlpha = transition.direction === 'show' ? 0.9 : 0.7
  ctx.fillStyle = `rgba(20, 15, 10, ${bgAlpha})`
  ctx.fillRect(-W / 2, -H / 2, W, H)
  
  // 添加装饰性边框
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 4
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 20
  ctx.strokeRect(-W / 2 + 20, -H / 2 + 60, W - 40, 160)
  
  // 绘制关卡编号
  ctx.font = 'bold 72px sans-serif'
  ctx.fillStyle = '#FFD700'
  ctx.textAlign = 'center'
  ctx.shadowBlur = 30
  ctx.fillText(`第 ${transition.level} 关`, 0, -25)
  
  // 绘制关卡名称
  ctx.font = 'bold 28px sans-serif'
  ctx.fillStyle = '#FFFFFF'
  ctx.shadowBlur = 15
  ctx.fillText(transition.name, 0, 25)
  
  // 绘制装饰图案
  ctx.font = '36px sans-serif'
  ctx.fillText('🍪', -120, 0)
  ctx.fillText('✨', 120, 0)
  
  ctx.restore()
}
