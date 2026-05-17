import { Shooter, Projectile, BubblePosition } from './types'
import { ParticleSystem } from './ParticleSystem'
import { ComboSystem } from './ComboSystem'

// ==================== UI 辅助函数 ====================

/** 绘制圆角矩形路径 */
function drawRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/** 绘制圆角矩形面板（统一风格） */
function drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = 'rgba(15, 25, 45, 0.85)') {
  ctx.save()
  ctx.fillStyle = color
  drawRoundedRectPath(ctx, x, y, w, h, 8)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private particleSystem: ParticleSystem
  private comboSystem: ComboSystem
  
  private readonly W: number
  private readonly H: number
  private readonly COLORS: string[]
  private readonly BUBBLE_SIZE: number
  private readonly SHOOTER_Y: number
  private readonly COLS: number
  private readonly ROWS: number

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    particleSystem: ParticleSystem,
    comboSystem: ComboSystem,
    W: number,
    H: number,
    COLORS: string[],
    BUBBLE_SIZE: number,
    SHOOTER_Y: number,
    COLS: number,
    ROWS: number
  ) {
    this.canvas = canvas
    this.ctx = ctx
    this.particleSystem = particleSystem
    this.comboSystem = comboSystem
    this.W = W
    this.H = H
    this.COLORS = COLORS
    this.BUBBLE_SIZE = BUBBLE_SIZE
    this.SHOOTER_Y = SHOOTER_Y
    this.COLS = COLS
    this.ROWS = ROWS
  }

  // 绘制游戏画面
  render(
    board: (number | null)[][],
    shooter: Shooter,
    projectile: Projectile | null,
    mouseX: number,
    score: number,
    gameStartTime: number,
    GAME_DURATION: number,
    currentLevel: number = 1,
    totalLevels: number = 10,
    currentPowerup: string | null = null
  ) {
    const ctx = this.ctx
    
    // 清除画布（避免残留）
    ctx.clearRect(0, 0, this.W, this.H)
    
    // 渐变背景 - 更炫酷的深色主题
    const grad = ctx.createLinearGradient(0, 0, 0, this.H)
    grad.addColorStop(0, '#0f0c29')
    grad.addColorStop(0.5, '#302b63')
    grad.addColorStop(1, '#24243e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, this.W, this.H)

    // 添加星空背景效果
    this.drawStars(ctx)

    // 棋盘区域背景 - 半透明玻璃效果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.fillRect(0, 30, this.W, this.ROWS * this.BUBBLE_SIZE + 10)

    // 绘制棋盘上的泡泡
    this.drawBubbles(ctx, board)

    // 飞行中的泡泡（在发射器之前绘制）
    if (projectile) {
      this.drawProjectile(ctx, projectile)
    }

    // 发射轨迹 - 更明显的瞄准线
    this.drawAimLine(ctx, shooter, mouseX)

    // 发射器（最后绘制，覆盖在飞行泡泡上方，避免穿透显示）
    this.drawShooter(ctx, shooter)

    // 下一个泡泡预览
    this.drawNextBubblePreview(ctx, shooter)

    // 粒子效果
    this.drawParticles(ctx)

    // 漂浮分数
    this.drawFloatingScores(ctx)

    // UI 信息
    this.drawUI(ctx, score, gameStartTime, GAME_DURATION, currentLevel, totalLevels, currentPowerup)
  }

  // 绘制星空背景
  private drawStars(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    for (let i = 0; i < 30; i++) {
      // 像素对齐
      const x = Math.round((i * 37) % this.W)
      const y = Math.round((i * 23) % (this.H / 2))
      const size = (i % 3) + 1
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // 绘制泡泡
  private drawBubbles(ctx: CanvasRenderingContext2D, board: (number | null)[][]) {
    for (let y = 0; y < this.ROWS; y++) {
      for (let x = 0; x < this.COLS; x++) {
        const color = board[y]?.[x]
        if (color === null || color === undefined) continue
        
        const pos = this.getBubblePos(x, y)
        
        // 像素对齐 - 避免模糊
        const bx = Math.round(pos.bx)
        const by = Math.round(pos.by)
        
        // 减少光晕效果
        ctx.shadowColor = this.COLORS[color]
        ctx.shadowBlur = 3
        
        // 圆形泡泡 - 更立体的渐变
        const grad = ctx.createRadialGradient(
          bx - 8, by - 8, 0,
          bx, by, this.BUBBLE_SIZE / 2
        )
        grad.addColorStop(0, this.lightenColor(this.COLORS[color], 40))
        grad.addColorStop(0.6, this.COLORS[color])
        grad.addColorStop(1, this.darkenColor(this.COLORS[color], 20))
        
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(bx, by, this.BUBBLE_SIZE / 2 - 2, 0, Math.PI * 2)
        ctx.fill()
        
        // 高光 - 更小更柔和
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.beginPath()
        ctx.arc(bx - 5, by - 5, 4, 0, Math.PI * 2)
        ctx.fill()
        
        // 边缘轮廓（去除光晕）
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(bx, by, this.BUBBLE_SIZE / 2 - 2, 0, Math.PI * 2)
        ctx.stroke()
        
        ctx.shadowBlur = 0
      }
    }
  }

  // 绘制瞄准线
  private drawAimLine(ctx: CanvasRenderingContext2D, shooter: Shooter, mouseX: number) {
    // 像素对齐
    const sx = Math.round(shooter.x)
    const sy = Math.round(shooter.y)
    
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 3
    ctx.setLineDash([8, 8])
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    
    // 延长瞄准线（像素对齐）
    const aimLength = 150
    const targetX = Math.round(sx + Math.cos(shooter.angle) * aimLength)
    const targetY = Math.round(sy + Math.sin(shooter.angle) * aimLength)
    ctx.lineTo(targetX, targetY)
    ctx.stroke()
    ctx.setLineDash([])
    
    // 添加瞄准点（像素对齐）
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.beginPath()
    ctx.arc(targetX, targetY, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // 绘制发射器
  private drawShooter(ctx: CanvasRenderingContext2D, shooter: Shooter) {
    // 像素对齐
    const sx = Math.round(shooter.x)
    const sy = Math.round(shooter.y)
    
    // 减少光晕效果
    ctx.shadowColor = this.COLORS[shooter.color]
    ctx.shadowBlur = 4
    
    const sGrad = ctx.createRadialGradient(
      sx - 6, sy - 6, 0,
      sx, sy, 22
    )
    sGrad.addColorStop(0, this.lightenColor(this.COLORS[shooter.color], 40))
    sGrad.addColorStop(1, this.COLORS[shooter.color])
    
    ctx.fillStyle = sGrad
    ctx.beginPath()
    ctx.arc(sx, sy, 22, 0, Math.PI * 2)
    ctx.fill()
    
    // 发射器边框（更细更淡）
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(sx, sy, 22, 0, Math.PI * 2)
    ctx.stroke()
    
    ctx.shadowBlur = 0
  }

  // 绘制下一个泡泡预览
  private drawNextBubblePreview(ctx: CanvasRenderingContext2D, shooter: Shooter) {
    const centerX = Math.round(this.W / 2)
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('下一个:', centerX, this.H - 80)
    
    ctx.fillStyle = this.COLORS[shooter.color]
    // 减少光晕效果
    ctx.shadowColor = this.COLORS[shooter.color]
    ctx.shadowBlur = 3
    ctx.beginPath()
    ctx.arc(centerX, this.H - 55, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // 绘制飞行中的泡泡
  private drawProjectile(ctx: CanvasRenderingContext2D, projectile: Projectile) {
    // 像素对齐
    const px = Math.round(projectile.x)
    const py = Math.round(projectile.y)
    
    // 减少光晕效果
    ctx.shadowColor = this.COLORS[projectile.color]
    ctx.shadowBlur = 4
    
    const pGrad = ctx.createRadialGradient(
      px - 6, py - 6, 0,
      px, py, this.BUBBLE_SIZE / 2
    )
    pGrad.addColorStop(0, this.lightenColor(this.COLORS[projectile.color], 40))
    pGrad.addColorStop(1, this.COLORS[projectile.color])
    
    ctx.fillStyle = pGrad
    ctx.beginPath()
    ctx.arc(px, py, this.BUBBLE_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()
    
    // 拖尾效果（更淡）
    ctx.strokeStyle = this.COLORS[projectile.color]
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(
      Math.round(px - projectile.vx * 2),
      Math.round(py - projectile.vy * 2)
    )
    ctx.stroke()
    ctx.globalAlpha = 1
    
    ctx.shadowBlur = 0
  }

  // 绘制粒子
  private drawParticles(ctx: CanvasRenderingContext2D) {
    const particles = this.particleSystem.getParticles()
    particles.forEach((p) => {
      // 像素对齐
      const px = Math.round(p.x)
      const py = Math.round(p.y)
      
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      // 减少粒子光晕
      ctx.shadowColor = p.color
      ctx.shadowBlur = 2
      ctx.beginPath()
      ctx.arc(px, py, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    })
  }

  // 绘制漂浮分数
  private drawFloatingScores(ctx: CanvasRenderingContext2D) {
    const scores = this.comboSystem.getFloatingScores()
    scores.forEach((f) => {
      // 像素对齐
      const fx = Math.round(f.x)
      const fy = Math.round(f.y)
      
      ctx.globalAlpha = f.life
      ctx.fillStyle = f.color
      ctx.font = `bold ${f.size}px sans-serif`
      ctx.textAlign = 'center'
      // 减少文字光晕
      ctx.shadowColor = f.color
      ctx.shadowBlur = 4
      ctx.fillText(f.text, fx, fy)
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    })
  }

  // 绘制 UI
  private drawUI(ctx: CanvasRenderingContext2D, score: number, gameStartTime: number, GAME_DURATION: number, currentLevel: number = 1, totalLevels: number = 10, currentPowerup: string | null = null) {
    const TOP_Y = 12
    const PADDING = 12
    
    // 左上角：分数面板
    const scorePanelW = 90
    drawPanel(ctx, PADDING, TOP_Y, scorePanelW, 45)
    
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 6
    ctx.fillText(String(score), PADDING + scorePanelW / 2, TOP_Y + 32)
    ctx.shadowBlur = 0
    
    // 标签
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('分数', PADDING + scorePanelW / 2, TOP_Y + 14)
    
    // 中上：关卡显示
    const levelPanelW = 80
    const levelPanelX = (this.W - levelPanelW) / 2
    drawPanel(ctx, levelPanelX, TOP_Y, levelPanelW, 45, 'rgba(99, 102, 241, 0.25)')
    
    ctx.fillStyle = '#818CF8'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#818CF8'
    ctx.shadowBlur = 6
    ctx.fillText(`${currentLevel}/${totalLevels}`, levelPanelX + levelPanelW / 2, TOP_Y + 32)
    ctx.shadowBlur = 0
    
    // 标签
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('关卡', levelPanelX + levelPanelW / 2, TOP_Y + 14)

    // 右上角：时间面板
    const elapsed = Date.now() - gameStartTime
    const remaining = Math.max(0, GAME_DURATION - elapsed)
    const seconds = Math.ceil(remaining / 1000)
    
    const timePanelW = 70
    const timePanelX = this.W - timePanelW - PADDING
    const isWarning = seconds <= 10
    
    // 根据剩余时间选择面板颜色
    const timePanelColor = isWarning ? 'rgba(255, 68, 68, 0.25)' : 'rgba(15, 25, 45, 0.85)'
    drawPanel(ctx, timePanelX, TOP_Y, timePanelW, 45, timePanelColor)
    
    const timeText = `${seconds}s`
    ctx.fillStyle = isWarning ? '#FF4444' : '#fff'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.shadowColor = isWarning ? '#FF4444' : '#fff'
    ctx.shadowBlur = 6
    ctx.fillText(timeText, timePanelX + timePanelW / 2, TOP_Y + 32)
    ctx.shadowBlur = 0
    
    // 标签
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('时间', timePanelX + timePanelW / 2, TOP_Y + 14)
    
    // 底部：道具状态显示
    if (currentPowerup) {
      const powerupPanelW = 60
      const powerupPanelX = (this.W - powerupPanelW) / 2
      const powerupPanelY = this.H - 50
      
      drawPanel(ctx, powerupPanelX, powerupPanelY, powerupPanelW, 40, 'rgba(251, 191, 36, 0.2)')
      
      const powerupIcons: Record<string, string> = {
        'color_bomb': '💣',
        'clear_row': '🧹',
        'extra_shot': '⚡',
        'multishot': '🔫'
      }
      
      ctx.fillStyle = '#FBBF24'
      ctx.font = '22px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(powerupIcons[currentPowerup] || '✨', powerupPanelX + powerupPanelW / 2, powerupPanelY + 28)
    }
  }

  // 获取泡泡位置
  getBubblePos(x: number, y: number): BubblePosition {
    const offset = y % 2 === 1 ? this.BUBBLE_SIZE / 2 : 0
    return {
      bx: x * this.BUBBLE_SIZE + offset + this.BUBBLE_SIZE / 2,
      by: y * this.BUBBLE_SIZE + this.BUBBLE_SIZE / 2 + 30
    }
  }

  // 颜色变亮
  private lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const R = Math.min(255, (num >> 16) + percent)
    const G = Math.min(255, ((num >> 8) & 0xFF) + percent)
    const B = Math.min(255, (num & 0xFF) + percent)
    return `rgb(${R},${G},${B})`
  }

  // 颜色变暗
  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const R = Math.max(0, (num >> 16) - percent)
    const G = Math.max(0, ((num >> 8) & 0xFF) - percent)
    const B = Math.max(0, (num & 0xFF) - percent)
    return `rgb(${R},${G},${B})`
  }
}
