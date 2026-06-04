import { GAME_CONFIG } from '../config'
import type { Player } from '../types'

export interface UITimers {
  rapidFireTimer: number
  spreadShotTimer: number
  shieldTimer: number
}

export function drawUI(
  ctx: CanvasRenderingContext2D,
  player: Player,
  score: number,
  currentLevel: number,
  timers: UITimers,
  comboCount: number,
) {
  const p = player
  const t = Date.now()
  const pulse = 1 + Math.sin(t / 300) * 0.02

  ctx.save()

  const panelGrad = ctx.createLinearGradient(8, 8, 8, 53)
  panelGrad.addColorStop(0, 'rgba(30, 30, 50, 0.9)')
  panelGrad.addColorStop(1, 'rgba(10, 10, 30, 0.95)')
  ctx.fillStyle = panelGrad

  ctx.shadowColor = 'rgba(100, 100, 200, 0.5)'
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.roundRect(8, 8, 115, 50, 8)
  ctx.fill()

  ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.shadowBlur = 0

  const scoreGlow = Math.sin(t / 200) > 0.7 ? 6 : 3
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 14px "Arial Black", sans-serif'
  ctx.textAlign = 'left'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = scoreGlow
  ctx.fillText(`★ ${score}`, 15, 26)
  ctx.shadowBlur = 0

  const hpBarWidth = 100
  const hpBarHeight = 10
  const hpRatio = p.hp / p.maxHp
  const hpX = 12
  const hpY = 35

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.beginPath()
  ctx.roundRect(hpX, hpY, hpBarWidth, hpBarHeight, 5)
  ctx.fill()

  const hpGradient = ctx.createLinearGradient(hpX, hpY, hpX + hpBarWidth, hpY)
  hpGradient.addColorStop(0, '#FF3333')
  hpGradient.addColorStop(0.3, '#FF6600')
  hpGradient.addColorStop(0.6, '#FFD700')
  hpGradient.addColorStop(1, '#00FF66')

  const animatedHpWidth = hpBarWidth * hpRatio
  if (animatedHpWidth > 0) {
    ctx.fillStyle = hpGradient
    ctx.shadowColor = hpRatio < 0.3 ? '#FF3333' : '#00FF66'
    ctx.shadowBlur = hpRatio < 0.3 ? 8 : 5
    ctx.beginPath()
    ctx.roundRect(hpX, hpY, animatedHpWidth, hpBarHeight, 5)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 1
  ctx.strokeRect(hpX, hpY, hpBarWidth, hpBarHeight)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 10px "Arial Black", sans-serif'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
  ctx.shadowBlur = 2
  ctx.fillText(`${p.hp}/${p.maxHp}`, hpX + hpBarWidth / 2, hpY + 7)
  ctx.shadowBlur = 0

  for (let i = 0; i < p.lives; i++) {
    const lx = 16 + i * 14
    ctx.fillStyle = '#FF4466'
    ctx.shadowColor = '#FF4466'
    ctx.shadowBlur = 4
    ctx.font = 'bold 12px "Arial Black", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('♥', lx, hpY + hpBarHeight + 12)
    ctx.shadowBlur = 0
  }

  ctx.restore()

  ctx.save()

  const levelPanelGrad = ctx.createLinearGradient(GAME_CONFIG.CANVAS_WIDTH - 110, 8, GAME_CONFIG.CANVAS_WIDTH - 110, 32)
  levelPanelGrad.addColorStop(0, 'rgba(10, 40, 60, 0.9)')
  levelPanelGrad.addColorStop(1, 'rgba(5, 20, 40, 0.95)')
  ctx.fillStyle = levelPanelGrad

  ctx.shadowColor = 'rgba(0, 200, 255, 0.5)'
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.roundRect(GAME_CONFIG.CANVAS_WIDTH - 110, 8, 102, 28, 8)
  ctx.fill()

  ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.shadowBlur = 0

  ctx.fillStyle = '#00E5FF'
  ctx.font = 'bold 16px "Arial Black", sans-serif'
  ctx.textAlign = 'center'
  ctx.shadowColor = '#00E5FF'
  ctx.shadowBlur = 4
  ctx.fillText(`关卡 ${currentLevel}`, GAME_CONFIG.CANVAS_WIDTH - 59, 27)
  ctx.shadowBlur = 0
  ctx.restore()

  let powerupY = GAME_CONFIG.CANVAS_HEIGHT - 36
  const powerupHeight = 24
  const powerupWidth = 115

  if (timers.rapidFireTimer > 0) {
    const powerPulse = 1 + Math.sin(t / 150) * 0.06
    ctx.save()
    ctx.translate(4, 0)
    ctx.scale(powerPulse, powerPulse)

    const puGrad = ctx.createLinearGradient(8, powerupY - 4, 8, powerupY + powerupHeight)
    puGrad.addColorStop(0, 'rgba(255, 255, 68, 0.3)')
    puGrad.addColorStop(1, 'rgba(255, 200, 0, 0.4)')
    ctx.fillStyle = puGrad

    ctx.shadowColor = '#FFFF44'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.roundRect(8, powerupY - 4, powerupWidth, powerupHeight, 8)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 255, 100, 0.6)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.fillStyle = '#FFFF44'
    ctx.font = 'bold 12px "Arial Black", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`⚡ 射速强化 ${Math.ceil(timers.rapidFireTimer / 1000)}s`, 15, powerupY + 13)
    ctx.restore()
    powerupY -= powerupHeight + 8
  }

  if (timers.spreadShotTimer > 0) {
    const spreadPulse = 1 + Math.sin(t / 180) * 0.05
    ctx.save()
    ctx.translate(4, 0)
    ctx.scale(spreadPulse, spreadPulse)

    const puGrad = ctx.createLinearGradient(8, powerupY - 4, 8, powerupY + powerupHeight)
    puGrad.addColorStop(0, 'rgba(255, 136, 0, 0.3)')
    puGrad.addColorStop(1, 'rgba(200, 80, 0, 0.4)')
    ctx.fillStyle = puGrad

    ctx.shadowColor = '#FF8800'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.roundRect(8, powerupY - 4, powerupWidth, powerupHeight, 8)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 150, 50, 0.6)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.fillStyle = '#FFAA00'
    ctx.font = 'bold 12px "Arial Black", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`💥 散射弹 ${Math.ceil(timers.spreadShotTimer / 1000)}s`, 15, powerupY + 13)
    ctx.restore()
    powerupY -= powerupHeight + 8
  }

  if (timers.shieldTimer > 0) {
    const shieldPulse = 1 + Math.sin(t / 120) * 0.07
    ctx.save()
    ctx.translate(4, 0)
    ctx.scale(shieldPulse, shieldPulse)

    const puGrad = ctx.createLinearGradient(8, powerupY - 4, 8, powerupY + powerupHeight)
    puGrad.addColorStop(0, 'rgba(68, 136, 255, 0.3)')
    puGrad.addColorStop(1, 'rgba(30, 80, 200, 0.4)')
    ctx.fillStyle = puGrad

    ctx.shadowColor = '#4488FF'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.roundRect(8, powerupY - 4, powerupWidth, powerupHeight, 8)
    ctx.fill()

    ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.fillStyle = '#66AAFF'
    ctx.font = 'bold 12px "Arial Black", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`🛡️ 能量护盾 ${Math.ceil(timers.shieldTimer / 1000)}s`, 15, powerupY + 13)
    ctx.restore()
  }

  ctx.save()

  const levelGrad = ctx.createLinearGradient(GAME_CONFIG.CANVAS_WIDTH - 65, GAME_CONFIG.CANVAS_HEIGHT - 34, GAME_CONFIG.CANVAS_WIDTH - 65, GAME_CONFIG.CANVAS_HEIGHT - 12)
  const isMaxLevel = p.attackLevel >= 5
  levelGrad.addColorStop(0, isMaxLevel ? 'rgba(80, 20, 100, 0.9)' : 'rgba(30, 30, 50, 0.9)')
  levelGrad.addColorStop(1, isMaxLevel ? 'rgba(50, 10, 80, 0.95)' : 'rgba(10, 10, 30, 0.95)')
  ctx.fillStyle = levelGrad

  ctx.shadowColor = isMaxLevel ? 'rgba(224, 64, 251, 0.6)' : 'rgba(100, 100, 150, 0.4)'
  ctx.shadowBlur = isMaxLevel ? 12 : 8
  ctx.beginPath()
  ctx.roundRect(GAME_CONFIG.CANVAS_WIDTH - 65, GAME_CONFIG.CANVAS_HEIGHT - 34, 57, 26, 8)
  ctx.fill()

  ctx.strokeStyle = isMaxLevel ? 'rgba(224, 64, 251, 0.6)' : 'rgba(100, 150, 200, 0.4)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.shadowBlur = 0

  const levelColor = isMaxLevel ? '#E040FB' : '#FFFFFF'
  ctx.fillStyle = levelColor
  ctx.font = 'bold 14px "Arial Black", sans-serif'
  ctx.textAlign = 'center'
  ctx.shadowColor = levelColor
  ctx.shadowBlur = isMaxLevel ? 5 : 2
  ctx.fillText(`Lv${p.attackLevel}`, GAME_CONFIG.CANVAS_WIDTH - 36.5, GAME_CONFIG.CANVAS_HEIGHT - 17)
  ctx.shadowBlur = 0
  ctx.restore()

  if (comboCount > 1) {
    ctx.save()
    const comboPulse = 1 + Math.sin(t / 100) * 0.1
    const comboColor = comboCount >= 20 ? '#FF4757' : comboCount >= 10 ? '#FFD700' : '#FF6600'
    const fontSize = 18 + Math.min(comboCount, 10)

    ctx.translate(GAME_CONFIG.CANVAS_WIDTH / 2, 50)
    ctx.scale(comboPulse, comboPulse)

    const panelW = 50 + comboCount * 8
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.shadowColor = comboColor
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.roundRect(-panelW / 2, -15, panelW, 30, 15)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.fillStyle = comboColor
    ctx.shadowColor = comboColor
    ctx.shadowBlur = 8
    ctx.font = `bold ${fontSize}px "Arial Black", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${comboCount} COMBO!`, 0, 2)
    ctx.shadowBlur = 0
    ctx.restore()
  }
}

export function drawGameOverScreen(ctx: CanvasRenderingContext2D, score: number) {
  const t = Date.now()
  const cx = GAME_CONFIG.CANVAS_WIDTH / 2
  const cy = GAME_CONFIG.CANVAS_HEIGHT / 2

  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, GAME_CONFIG.CANVAS_WIDTH * 0.7)
  bgGrad.addColorStop(0, 'rgba(80, 10, 10, 0.9)')
  bgGrad.addColorStop(0.5, 'rgba(40, 5, 5, 0.95)')
  bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)

  const pulse = 1 + Math.sin(t / 150) * 0.04
  ctx.save()
  ctx.translate(cx, cy - 40)
  ctx.scale(pulse, pulse)

  ctx.fillStyle = '#FF3333'
  ctx.font = 'bold 40px "Arial Black", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#FF3333'
  ctx.shadowBlur = 25
  ctx.fillText('GAME OVER', 0, 0)
  ctx.shadowBlur = 0
  ctx.restore()

  ctx.save()
  ctx.translate(cx, cy + 25)

  const scorePanelGrad = ctx.createLinearGradient(0, -20, 0, 20)
  scorePanelGrad.addColorStop(0, 'rgba(255, 50, 50, 0.2)')
  scorePanelGrad.addColorStop(1, 'rgba(255, 50, 50, 0.05)')
  ctx.fillStyle = scorePanelGrad
  ctx.shadowColor = 'rgba(255, 50, 50, 0.3)'
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.roundRect(-70, -20, 140, 40, 10)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.shadowBlur = 0

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('最终得分', 0, -5)

  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 20px "Arial Black", sans-serif'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 4
  ctx.fillText(`${score}`, 0, 14)
  ctx.shadowBlur = 0
  ctx.restore()

  const blinkAlpha = 0.3 + Math.sin(t / 150) * 0.7
  ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('点击任意位置重新开始', cx, cy + 90)
}

export function drawVictoryScreen(ctx: CanvasRenderingContext2D, score: number) {
  const t = Date.now()
  const cx = GAME_CONFIG.CANVAS_WIDTH / 2
  const cy = GAME_CONFIG.CANVAS_HEIGHT / 2

  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, GAME_CONFIG.CANVAS_WIDTH * 0.7)
  bgGrad.addColorStop(0, 'rgba(10, 30, 80, 0.9)')
  bgGrad.addColorStop(0.5, 'rgba(5, 15, 40, 0.95)')
  bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)

  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 2 / 30) * i + Math.sin(t / 600) * 0.8
    const dist = 80 + Math.sin(t / 400 + i * 2) * 40
    const px = cx + Math.cos(angle) * dist
    const py = cy + Math.sin(angle) * dist - 10
    const size = 2 + Math.sin(t / 80 + i * 3) * 1.5
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFE66D', '#FF69B4', '#00E5FF']
    ctx.save()
    ctx.fillStyle = colors[i % colors.length]
    ctx.shadowColor = ctx.fillStyle
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(px, py, size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  const pulse = 1 + Math.sin(t / 100) * 0.06
  ctx.save()
  ctx.translate(cx, cy - 45)
  ctx.scale(pulse, pulse)

  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 38px "Arial Black", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 25
  ctx.fillText('🏆 胜利!', 0, 0)
  ctx.shadowBlur = 0
  ctx.restore()

  ctx.save()
  ctx.translate(cx, cy + 30)

  const scorePanelGrad = ctx.createLinearGradient(0, -25, 0, 25)
  scorePanelGrad.addColorStop(0, 'rgba(255, 215, 0, 0.2)')
  scorePanelGrad.addColorStop(1, 'rgba(255, 215, 0, 0.05)')
  ctx.fillStyle = scorePanelGrad
  ctx.shadowColor = 'rgba(255, 215, 0, 0.3)'
  ctx.shadowBlur = 15
  ctx.beginPath()
  ctx.roundRect(-80, -25, 160, 50, 12)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.shadowBlur = 0

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('最终得分', 0, -8)

  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 22px "Arial Black", sans-serif'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 5
  ctx.fillText(`${score}`, 0, 16)
  ctx.shadowBlur = 0
  ctx.restore()
}