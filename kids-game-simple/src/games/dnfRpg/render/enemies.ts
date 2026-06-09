import type { Enemy } from '../types'
import * as C from '../config'

export function drawEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]): void {
  enemies.forEach(enemy => {
    if (enemy.hp <= 0) return
    drawEnemy(ctx, enemy)
  })
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
  const sx = Math.round(enemy.x)
  const sy = Math.round(enemy.y)

  ctx.save()

  // 受击闪烁
  if (enemy.recentlyHit > 0) {
    ctx.globalAlpha = 0.6
  }

  // 阴影（在敌人脚下）
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath()
  ctx.ellipse(sx + enemy.width / 2, sy + enemy.height + 2, enemy.width * 0.5, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Boss特殊绘制 - 光环
  if (enemy.type === 'boss') {
    ctx.strokeStyle = enemy.color
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.3
    ctx.strokeRect(sx - 4, sy - 4, enemy.width + 8, enemy.height + 8)
    ctx.globalAlpha = 1
  }

  // 身体
  const isHit = enemy.hitStun > 0
  ctx.fillStyle = isHit ? '#FFFFFF' : enemy.color

  if (enemy.type === 'boss') {
    // Boss - 更大更威武
    ctx.fillRect(sx + 2, sy + 16, enemy.width - 4, 22)
    // 头
    ctx.fillStyle = '#FFD5A0'
    ctx.fillRect(sx + 4, sy + 2, enemy.width - 8, 18)
    // 冠/角
    ctx.fillStyle = enemy.color
    ctx.fillRect(sx + 6, sy - 4, enemy.width - 12, 8)
    // 眼睛（发红光）
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(sx + enemy.width / 2 - 3, sy + 8, 6, 4)
  } else if (enemy.type === 'elite') {
    // 精英 - 比普通大
    ctx.fillRect(sx + 3, sy + 14, enemy.width - 6, 18)
    ctx.fillStyle = '#FFD5A0'
    ctx.fillRect(sx + 5, sy + 2, enemy.width - 10, 14)
    // 精英标记
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(sx + sx % 2, sy - 2, enemy.width, 3)
  } else {
    // 普通
    ctx.fillRect(sx + 3, sy + 12, enemy.width - 6, 16)
    ctx.fillStyle = '#E0A060'
    ctx.fillRect(sx + 5, sy + 2, enemy.width - 10, 12)
    // 眼睛
    ctx.fillStyle = '#333'
    ctx.fillRect(sx + 8, sy + 6, 3, 3)
    ctx.fillRect(sx + enemy.width - 11, sy + 6, 3, 3)
  }

  // 血条
  drawEnemyHealthBar(ctx, sx, sy, enemy)

  ctx.restore()
}

function drawEnemyHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, enemy: Enemy): void {
  const barWidth = enemy.width + 10
  const barHeight = 3
  const barX = x - 5
  const barY = y - 8

  // 背景
  ctx.fillStyle = '#333'
  ctx.fillRect(barX, barY, barWidth, barHeight)

  // 血量
  const hpRatio = Math.max(0, enemy.hp / enemy.maxHp)
  const color = hpRatio > 0.5 ? '#44CC44' : hpRatio > 0.25 ? '#FFAA00' : '#FF4444'
  ctx.fillStyle = color
  ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight)

  // Boss血条更大
  if (enemy.type === 'boss') {
    ctx.fillStyle = '#FFD700'
    ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2)
  }
}

export function drawBossHealthBar(ctx: CanvasRenderingContext2D, boss: Enemy): void {
  if (boss.hp <= 0) return

  const barWidth = 300
  const barHeight = 20
  const barX = C.CANVAS_WIDTH / 2 - barWidth / 2
  const barY = 15

  ctx.save()

  // 背景
  ctx.fillStyle = 'rgba(0,0,0,0.7)'
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4)

  // 名字
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(boss.name, C.CANVAS_WIDTH / 2, barY - 5)

  // 血量
  const hpRatio = Math.max(0, boss.hp / boss.maxHp)
  const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0)
  if (hpRatio > 0.5) {
    gradient.addColorStop(0, '#44CC44')
    gradient.addColorStop(1, '#22AA22')
  } else if (hpRatio > 0.25) {
    gradient.addColorStop(0, '#FFAA00')
    gradient.addColorStop(1, '#FF8800')
  } else {
    gradient.addColorStop(0, '#FF4444')
    gradient.addColorStop(1, '#CC0000')
  }
  ctx.fillStyle = gradient
  ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight)

  // 文字
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 12px Arial'
  ctx.fillText(`${Math.ceil(boss.hp)} / ${boss.maxHp}`, C.CANVAS_WIDTH / 2, barY + 14)

  // 阶段指示
  if (boss.maxPhase > 1) {
    ctx.fillStyle = '#AAAAAA'
    ctx.font = '10px Arial'
    ctx.fillText(`阶段 ${boss.phase} / ${boss.maxPhase}`, C.CANVAS_WIDTH / 2, barY + barHeight + 12)
  }

  ctx.restore()
}