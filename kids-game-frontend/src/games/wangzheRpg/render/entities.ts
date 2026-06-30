import { GAME_CONFIG } from '../config'
import type { Player, Enemy, Minion, Tower, NeutralCreep } from '../types'

/**
 * 绘制玩家英雄 - 丰富动画版本
 * 支持：行走、攻击、技能释放、死亡、待机呼吸、朝向翻转
 */
export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player): void {
  if (player.isDead && player.deathAnimTimer <= 0) return

  ctx.save()

  const cx = player.x + player.width / 2
  const cy = player.y + player.height / 2
  const dir = player.facingDir // 1=右, -1=左

  // 死亡动画
  if (player.isDead && player.deathAnimTimer > 0) {
    drawDeathAnimation(ctx, player, cx, cy, dir)
    ctx.restore()
    return
  }

  // 受击闪烁
  if (player.hitFlashTimer > 0 && Math.floor(player.hitFlashTimer / 60) % 2 === 0) {
    ctx.globalAlpha = 0.5
  }

  // 水平翻转
  ctx.translate(cx, 0)
  ctx.scale(dir, 1)
  ctx.translate(-cx, 0)

  // 动画参数
  const t = player.animTimer
  const isMoving = player.isMoving
  const isAttacking = player.attackAnimTimer > 0
  const isCasting = player.skillCastTimer > 0

  // 行走上下浮动
  let bodyBob = 0
  if (isMoving) {
    bodyBob = Math.sin(t * 0.012) * 3
  } else {
    // 待机呼吸
    bodyBob = Math.sin(t * 0.003) * 1
  }

  const by = player.y + bodyBob

  // 攻击动画偏移
  let attackSwing = 0
  if (isAttacking) {
    const progress = 1 - player.attackAnimTimer / GAME_CONFIG.ATTACK_ANIM_DURATION
    attackSwing = Math.sin(progress * Math.PI) * 25
  }

  // 技能释放光效
  if (isCasting) {
    const castProgress = player.skillCastTimer / 400
    const glowAlpha = Math.sin(castProgress * Math.PI) * 0.4
    const skillColors = ['', '#ffd700', '#ff6347', '#00bfff']
    const glowColor = skillColors[player.skillCastId] || '#ffd700'

    ctx.save()
    ctx.globalAlpha = glowAlpha
    ctx.fillStyle = glowColor
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.arc(cx, cy, 28 + Math.sin(t * 0.05) * 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // --- 光环底圈 ---
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(cx, by + player.height - 4, 18, 6, 0, 0, Math.PI * 2)
  ctx.stroke()

  // --- 披风（带飘动动画） ---
  const capeWave = isMoving ? Math.sin(t * 0.015) * 6 : Math.sin(t * 0.005) * 2
  ctx.fillStyle = '#1a5276'
  ctx.beginPath()
  ctx.moveTo(cx - 4, by + 18)
  ctx.lineTo(cx - 16 + capeWave, by + player.height - 4)
  ctx.lineTo(cx - 2, by + player.height - 8)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx + 4, by + 18)
  ctx.lineTo(cx + 16 - capeWave, by + player.height - 4)
  ctx.lineTo(cx + 2, by + player.height - 8)
  ctx.closePath()
  ctx.fill()

  // --- 腿部（行走动画） ---
  const legAnim = isMoving ? Math.sin(t * 0.012) * 8 : 0
  ctx.fillStyle = '#2c3e50'
  // 左腿
  ctx.save()
  ctx.translate(cx - 4, by + 38 + legAnim)
  ctx.fillRect(-4, 0, 7, 18)
  ctx.restore()
  // 右腿
  ctx.save()
  ctx.translate(cx + 5, by + 38 - legAnim)
  ctx.fillRect(-4, 0, 7, 18)
  ctx.restore()

  // 靴子
  ctx.fillStyle = '#7d6608'
  ctx.fillRect(cx - 9, by + 52 + legAnim, 9, 6)
  ctx.fillRect(cx, by + 52 - legAnim, 9, 6)

  // --- 身体铠甲 ---
  const bodyGrad = ctx.createLinearGradient(cx - 10, 0, cx + 10, 0)
  bodyGrad.addColorStop(0, '#2c5aa0')
  bodyGrad.addColorStop(0.3, '#4169e1')
  bodyGrad.addColorStop(0.5, '#5b8def')
  bodyGrad.addColorStop(0.7, '#4169e1')
  bodyGrad.addColorStop(1, '#2c5aa0')
  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  ctx.roundRect(cx - 10, by + 20, 20, 22, 4)
  ctx.fill()
  ctx.strokeStyle = '#ffd700'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // 铠甲中线
  ctx.strokeStyle = '#ffd700'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cx, by + 22)
  ctx.lineTo(cx, by + 40)
  ctx.stroke()

  // 护肩
  ctx.fillStyle = '#ffd700'
  ctx.beginPath()
  ctx.arc(cx - 10, by + 22, 5, Math.PI * 0.5, Math.PI * 1.5)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 10, by + 22, 5, -Math.PI * 0.5, Math.PI * 0.5)
  ctx.fill()

  // --- 左手臂（带摆动） ---
  const armSwing = isMoving ? Math.cos(t * 0.012) * 6 : 0
  ctx.fillStyle = '#2c5aa0'
  ctx.save()
  ctx.translate(cx - 10, by + 22)
  ctx.rotate(-armSwing * 0.05)
  ctx.fillRect(-4, 0, 6, 14)
  ctx.restore()
  // 左手
  ctx.fillStyle = '#ffdab9'
  ctx.beginPath()
  ctx.arc(cx - 11 + armSwing * 0.3, by + 37, 4, 0, Math.PI * 2)
  ctx.fill()

  // --- 右臂 + 武器（攻击挥砍动画） ---
  ctx.fillStyle = '#2c5aa0'
  ctx.save()
  ctx.translate(cx + 10, by + 22)
  if (isAttacking) {
    ctx.rotate(-attackSwing * 0.04)
  }
  ctx.fillRect(-2, 0, 6, 14)
  // 武器
  const weaponX = 4
  const weaponY = -4
  // 剑柄
  ctx.fillStyle = '#7d6608'
  ctx.fillRect(weaponX - 1, weaponY + 3, 3, 8)
  // 护手
  ctx.fillStyle = '#ffd700'
  ctx.fillRect(weaponX - 3, weaponY + 2, 7, 3)
  // 剑身
  const bladeGrad = ctx.createLinearGradient(0, -20, 0, 0)
  bladeGrad.addColorStop(0, '#ffffff')
  bladeGrad.addColorStop(0.5, '#e0e0e0')
  bladeGrad.addColorStop(1, '#c0c0c0')
  ctx.fillStyle = bladeGrad
  ctx.beginPath()
  if (isAttacking) {
    // 攻击时剑身倾斜
    const swingAngle = attackSwing * 0.04
    ctx.moveTo(weaponX + Math.sin(swingAngle) * 22, weaponY - Math.cos(swingAngle) * 22)
    ctx.lineTo(weaponX + 2, weaponY + 2)
    ctx.lineTo(weaponX - 2, weaponY + 2)
  } else {
    ctx.moveTo(weaponX, weaponY - 22)
    ctx.lineTo(weaponX + 2, weaponY + 2)
    ctx.lineTo(weaponX - 2, weaponY + 2)
  }
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 0.5
  ctx.stroke()
  ctx.restore()

  // 右手
  ctx.fillStyle = '#ffdab9'
  ctx.beginPath()
  ctx.arc(cx + 11, by + 37, 4, 0, Math.PI * 2)
  ctx.fill()

  // 技能释放时抬手特效
  if (isCasting) {
    const castX = cx + 16
    const castY = by + 10
    const castColor = player.skillCastId === 1 ? '#ffd700' : player.skillCastId === 2 ? '#ff6347' : '#00bfff'
    ctx.fillStyle = castColor
    ctx.shadowColor = castColor
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(castX, castY, 5 + Math.sin(t * 0.08) * 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // --- 头部 ---
  ctx.fillStyle = '#ffdab9'
  ctx.fillRect(cx - 3, by + 16, 6, 6)

  ctx.fillStyle = '#ffdab9'
  ctx.beginPath()
  ctx.arc(cx, by + 12, 10, 0, Math.PI * 2)
  ctx.fill()

  // 头发
  ctx.fillStyle = '#1a1a2e'
  ctx.beginPath()
  ctx.arc(cx, by + 8, 11, Math.PI, Math.PI * 2)
  ctx.fill()

  // 眼睛
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(cx - 3, by + 11, 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 3, by + 11, 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1a1a2e'
  ctx.beginPath()
  ctx.arc(cx - 2, by + 11, 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 4, by + 11, 1.5, 0, Math.PI * 2)
  ctx.fill()

  // 头冠
  ctx.fillStyle = '#ffd700'
  ctx.beginPath()
  ctx.moveTo(cx - 5, by + 4)
  ctx.lineTo(cx, by - 4)
  ctx.lineTo(cx + 5, by + 4)
  ctx.closePath()
  ctx.fill()

  ctx.restore()

  // --- 等级标识 ---
  ctx.save()
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`Lv.${player.level}`, cx, player.y - 12)
  ctx.restore()
}

/**
 * 绘制死亡动画
 */
function drawDeathAnimation(
  ctx: CanvasRenderingContext2D,
  player: Player,
  cx: number,
  cy: number,
  dir: number,
): void {
  const progress = 1 - player.deathAnimTimer / 500

  ctx.globalAlpha = 1 - progress * 0.7

  ctx.translate(cx, 0)
  ctx.scale(dir, 1)
  ctx.translate(-cx, 0)

  // 旋转倒下
  const fallAngle = progress * Math.PI * 0.5
  ctx.translate(cx, cy)
  ctx.rotate(fallAngle)
  ctx.translate(-cx, -cy)

  const by = player.y + Math.sin(progress * Math.PI) * 20

  // 简化倒下的身体
  ctx.fillStyle = '#2c5aa0'
  ctx.beginPath()
  ctx.roundRect(cx - 10, by + 20, 20, 22, 4)
  ctx.fill()
  ctx.strokeStyle = '#ffd700'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = '#ffdab9'
  ctx.beginPath()
  ctx.arc(cx, by + 12, 10, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#1a1a2e'
  ctx.beginPath()
  ctx.arc(cx, by + 8, 11, Math.PI, Math.PI * 2)
  ctx.fill()

  // 死亡特效
  ctx.fillStyle = `rgba(255, 0, 0, ${progress * 0.3})`
  ctx.beginPath()
  ctx.arc(cx, cy, 25 * progress, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/**
 * 绘制敌方英雄 - 暗黑风格，丰富动画
 * 支持：行走、攻击、技能释放、死亡、待机、朝向翻转
 */
export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
  if (enemy.isDead && enemy.deathAnimTimer <= 0) return

  ctx.save()

  const cx = enemy.x + enemy.width / 2
  const cy = enemy.y + enemy.height / 2
  const dir = enemy.facingDir

  // 死亡动画
  if (enemy.isDead && enemy.deathAnimTimer > 0) {
    drawEnemyDeathAnimation(ctx, enemy, cx, cy, dir)
    ctx.restore()
    return
  }

  // 受击闪烁
  if (enemy.hitFlashTimer > 0 && Math.floor(enemy.hitFlashTimer / 60) % 2 === 0) {
    ctx.globalAlpha = 0.5
  }

  // 水平翻转
  ctx.translate(cx, 0)
  ctx.scale(dir, 1)
  ctx.translate(-cx, 0)

  // 动画参数
  const t = enemy.animTimer
  const isMoving = enemy.isMoving
  const isAttacking = enemy.attackAnimTimer > 0
  const isCasting = enemy.skillCastTimer > 0

  // 行走上下浮动
  let bodyBob = 0
  if (isMoving) {
    bodyBob = Math.sin(t * 0.012) * 3
  } else {
    bodyBob = Math.sin(t * 0.003) * 1
  }

  const by = enemy.y + bodyBob

  // 攻击动画偏移
  let attackSwing = 0
  if (isAttacking) {
    const progress = 1 - enemy.attackAnimTimer / GAME_CONFIG.ATTACK_ANIM_DURATION
    attackSwing = Math.sin(progress * Math.PI) * 25
  }

  // 技能释放暗红光效
  if (isCasting) {
    const castProgress = enemy.skillCastTimer / 400
    const glowAlpha = Math.sin(castProgress * Math.PI) * 0.4
    ctx.save()
    ctx.globalAlpha = glowAlpha
    ctx.fillStyle = '#ff0000'
    ctx.shadowColor = '#ff0000'
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.arc(cx, cy, 28 + Math.sin(t * 0.05) * 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // --- 暗红色光环 ---
  ctx.strokeStyle = 'rgba(255, 60, 60, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(cx, by + enemy.height - 4, 18, 6, 0, 0, Math.PI * 2)
  ctx.stroke()

  // --- 暗黑斗篷（带飘动） ---
  const capeWave = isMoving ? Math.sin(t * 0.015) * 6 : Math.sin(t * 0.005) * 2
  ctx.fillStyle = '#2a0a0a'
  ctx.beginPath()
  ctx.moveTo(cx - 4, by + 18)
  ctx.lineTo(cx - 18 + capeWave, by + enemy.height - 2)
  ctx.lineTo(cx - 2, by + enemy.height - 8)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx + 4, by + 18)
  ctx.lineTo(cx + 18 - capeWave, by + enemy.height - 2)
  ctx.lineTo(cx + 2, by + enemy.height - 8)
  ctx.closePath()
  ctx.fill()

  // --- 腿部（行走动画） ---
  const legAnim = isMoving ? Math.sin(t * 0.012) * 8 : 0
  ctx.fillStyle = '#1a0a0a'
  ctx.save()
  ctx.translate(cx - 4, by + 38 + legAnim)
  ctx.fillRect(-4, 0, 7, 18)
  ctx.restore()
  ctx.save()
  ctx.translate(cx + 5, by + 38 - legAnim)
  ctx.fillRect(-4, 0, 7, 18)
  ctx.restore()

  // 靴子（暗金）
  ctx.fillStyle = '#5a3a1a'
  ctx.fillRect(cx - 9, by + 52 + legAnim, 9, 6)
  ctx.fillRect(cx, by + 52 - legAnim, 9, 6)

  // --- 身体铠甲 ---
  const bodyGrad = ctx.createLinearGradient(cx - 10, 0, cx + 10, 0)
  bodyGrad.addColorStop(0, '#6a1010')
  bodyGrad.addColorStop(0.3, '#8b2020')
  bodyGrad.addColorStop(0.5, '#a03030')
  bodyGrad.addColorStop(0.7, '#8b2020')
  bodyGrad.addColorStop(1, '#6a1010')
  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  ctx.roundRect(cx - 10, by + 20, 20, 22, 4)
  ctx.fill()
  ctx.strokeStyle = '#ff3a3a'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // 铠甲中线
  ctx.strokeStyle = '#ff3a3a'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cx, by + 22)
  ctx.lineTo(cx, by + 40)
  ctx.stroke()

  // 护肩
  ctx.fillStyle = '#ff3a3a'
  ctx.beginPath()
  ctx.arc(cx - 10, by + 22, 5, Math.PI * 0.5, Math.PI * 1.5)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 10, by + 22, 5, -Math.PI * 0.5, Math.PI * 0.5)
  ctx.fill()

  // --- 左手臂 + 斧头（攻击挥砍动画） ---
  const armSwing = isMoving ? Math.cos(t * 0.012) * 6 : 0
  ctx.fillStyle = '#6a1010'
  ctx.save()
  ctx.translate(cx - 10, by + 22)
  if (isAttacking) {
    ctx.rotate(attackSwing * 0.04)
  }
  ctx.fillRect(-4, 0, 6, 14)
  // 斧柄
  ctx.fillStyle = '#4a2800'
  ctx.fillRect(-5, 2, 3, 12)
  // 斧刃
  ctx.fillStyle = '#808080'
  ctx.beginPath()
  if (isAttacking) {
    const swingAngle = attackSwing * 0.04
    ctx.moveTo(-12 + Math.sin(swingAngle) * 10, -6 - Math.cos(swingAngle) * 10)
    ctx.lineTo(-4, -2)
    ctx.lineTo(-1, 4)
    ctx.lineTo(-4, 8)
  } else {
    ctx.moveTo(-12, -6)
    ctx.lineTo(-4, -2)
    ctx.lineTo(-1, 4)
    ctx.lineTo(-4, 8)
  }
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#cccccc'
  ctx.lineWidth = 0.5
  ctx.stroke()
  ctx.restore()

  // 左手
  ctx.fillStyle = '#deb887'
  ctx.beginPath()
  ctx.arc(cx - 11 + armSwing * 0.3, by + 37, 4, 0, Math.PI * 2)
  ctx.fill()

  // --- 右手臂（带摆动） ---
  ctx.fillStyle = '#6a1010'
  ctx.save()
  ctx.translate(cx + 10, by + 22)
  ctx.rotate(-armSwing * 0.05)
  ctx.fillRect(-2, 0, 6, 14)
  ctx.restore()

  // 右手
  ctx.fillStyle = '#deb887'
  ctx.beginPath()
  ctx.arc(cx + 11 - armSwing * 0.3, by + 37, 4, 0, Math.PI * 2)
  ctx.fill()

  // 技能释放时抬手特效
  if (isCasting) {
    ctx.fillStyle = '#ff0000'
    ctx.shadowColor = '#ff0000'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(cx - 4, by + 10, 5 + Math.sin(t * 0.08) * 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // --- 头部 ---
  ctx.fillStyle = '#deb887'
  ctx.fillRect(cx - 3, by + 16, 6, 6)

  ctx.fillStyle = '#deb887'
  ctx.beginPath()
  ctx.arc(cx, by + 12, 10, 0, Math.PI * 2)
  ctx.fill()

  // 暗黑头盔
  ctx.fillStyle = '#2a0a0a'
  ctx.beginPath()
  ctx.arc(cx, by + 8, 11, Math.PI, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(cx - 11, by + 5, 22, 6)

  // 眼睛（红色发光，随攻击闪动）
  const eyeGlow = isAttacking ? 8 : 4
  ctx.fillStyle = '#ff0000'
  ctx.shadowColor = '#ff0000'
  ctx.shadowBlur = eyeGlow
  ctx.beginPath()
  ctx.arc(cx - 3, by + 11, 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 3, by + 11, 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // 头盔角
  ctx.fillStyle = '#4a4a4a'
  ctx.beginPath()
  ctx.moveTo(cx - 6, by + 4)
  ctx.lineTo(cx - 8, by - 4)
  ctx.lineTo(cx - 2, by + 4)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx + 6, by + 4)
  ctx.lineTo(cx + 8, by - 4)
  ctx.lineTo(cx + 2, by + 4)
  ctx.closePath()
  ctx.fill()

  ctx.restore()

  // --- AI状态指示 ---
  const indicatorColor = enemy.aiState === 'attack' ? '#ff0000' : enemy.aiState === 'chase' ? '#ff8c00' : '#888888'
  ctx.save()
  ctx.fillStyle = indicatorColor
  ctx.beginPath()
  ctx.arc(cx, enemy.y + 4, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // --- 等级标识 ---
  ctx.save()
  ctx.fillStyle = '#ff3a3a'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`Lv.${enemy.level}`, cx, enemy.y - 12)
  ctx.restore()
}

/**
 * 绘制敌方死亡动画
 */
function drawEnemyDeathAnimation(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  cx: number,
  cy: number,
  dir: number,
): void {
  const progress = 1 - enemy.deathAnimTimer / 500

  ctx.globalAlpha = 1 - progress * 0.7

  ctx.translate(cx, 0)
  ctx.scale(dir, 1)
  ctx.translate(-cx, 0)

  // 旋转倒下
  const fallAngle = progress * Math.PI * 0.5
  ctx.translate(cx, cy)
  ctx.rotate(-fallAngle)
  ctx.translate(-cx, -cy)

  const by = enemy.y + Math.sin(progress * Math.PI) * 20

  // 简化倒下的身体
  ctx.fillStyle = '#6a1010'
  ctx.beginPath()
  ctx.roundRect(cx - 10, by + 20, 20, 22, 4)
  ctx.fill()
  ctx.strokeStyle = '#ff3a3a'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = '#deb887'
  ctx.beginPath()
  ctx.arc(cx, by + 12, 10, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#2a0a0a'
  ctx.beginPath()
  ctx.arc(cx, by + 8, 11, Math.PI, Math.PI * 2)
  ctx.fill()

  // 死亡暗影特效
  ctx.fillStyle = `rgba(139, 0, 0, ${progress * 0.4})`
  ctx.beginPath()
  ctx.arc(cx, cy, 30 * progress, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/**
 * 绘制小兵
 */
export function drawMinion(ctx: CanvasRenderingContext2D, minion: Minion): void {
  if (minion.isDead) return

  ctx.save()

  const cx = minion.x + minion.width / 2
  const cy = minion.y + minion.height / 2

  // 受击闪烁
  if (minion.hitFlashTimer > 0 && Math.floor(minion.hitFlashTimer / 60) % 2 === 0) {
    ctx.globalAlpha = 0.5
  }

  const isPlayer = minion.team === 'player'
  const bodyColor = isPlayer ? '#3a6bff' : '#cc3333'
  const borderColor = isPlayer ? '#5b8def' : '#ff4444'

  // 身体
  ctx.fillStyle = bodyColor
  ctx.beginPath()
  ctx.roundRect(cx - 7, minion.y + 6, 14, 14, 3)
  ctx.fill()
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1
  ctx.stroke()

  // 头部
  ctx.fillStyle = isPlayer ? '#ffdab9' : '#deb887'
  ctx.beginPath()
  ctx.arc(cx, minion.y + 5, 6, 0, Math.PI * 2)
  ctx.fill()

  // 头盔
  ctx.fillStyle = isPlayer ? '#2c5aa0' : '#6a1010'
  ctx.beginPath()
  ctx.arc(cx, minion.y + 3, 7, Math.PI, Math.PI * 2)
  ctx.fill()

  // 武器
  ctx.fillStyle = '#cccccc'
  ctx.fillRect(cx + 7, minion.y + 8, 2, 10)

  // 血条
  const hpRatio = minion.hp / minion.maxHp
  ctx.fillStyle = '#333333'
  ctx.fillRect(cx - 8, minion.y - 2, 16, 3)
  if (hpRatio > 0) {
    ctx.fillStyle = isPlayer ? '#3a9dff' : '#ff3a3a'
    ctx.fillRect(cx - 8, minion.y - 2, 16 * hpRatio, 3)
  }

  ctx.restore()
}

/**
 * 绘制防御塔
 */
export function drawTower(ctx: CanvasRenderingContext2D, tower: Tower): void {
  if (tower.isDestroyed) {
    // 废墟
    ctx.save()
    ctx.fillStyle = '#4a4a4a'
    ctx.beginPath()
    ctx.moveTo(tower.x - 16, tower.y + tower.height)
    ctx.lineTo(tower.x + 16, tower.y + tower.height)
    ctx.lineTo(tower.x + 12, tower.y + 10)
    ctx.lineTo(tower.x - 12, tower.y + 10)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    return
  }

  ctx.save()

  const cx = tower.x + tower.width / 2
  const baseY = tower.y + tower.height
  const isPlayer = tower.team === 'player'

  // 底座
  const baseColor = isPlayer ? '#2c5aa0' : '#6a1010'
  ctx.fillStyle = baseColor
  ctx.beginPath()
  ctx.moveTo(cx - 16, baseY)
  ctx.lineTo(cx - 12, baseY - 24)
  ctx.lineTo(cx + 12, baseY - 24)
  ctx.lineTo(cx + 16, baseY)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = isPlayer ? '#ffd700' : '#ff3a3a'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // 塔身
  const towerGrad = ctx.createLinearGradient(cx, 0, cx, baseY)
  towerGrad.addColorStop(0, isPlayer ? '#5b8def' : '#cc3333')
  towerGrad.addColorStop(1, baseColor)
  ctx.fillStyle = towerGrad
  ctx.fillRect(cx - 6, baseY - 44, 12, 22)

  // 塔顶
  ctx.fillStyle = isPlayer ? '#ffd700' : '#ff3a3a'
  ctx.beginPath()
  ctx.moveTo(cx - 8, baseY - 44)
  ctx.lineTo(cx, baseY - 54)
  ctx.lineTo(cx + 8, baseY - 44)
  ctx.closePath()
  ctx.fill()

  // 塔顶宝石
  ctx.fillStyle = isPlayer ? '#ffffff' : '#ff6666'
  ctx.beginPath()
  ctx.arc(cx, baseY - 50, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowColor = isPlayer ? '#ffd700' : '#ff0000'
  ctx.shadowBlur = 6
  ctx.fill()
  ctx.shadowBlur = 0

  // 血条
  const hpRatio = tower.hp / tower.maxHp
  const barW = 36
  const barH = 4
  ctx.fillStyle = '#333333'
  ctx.fillRect(cx - barW / 2, baseY - 58, barW, barH)
  if (hpRatio > 0) {
    ctx.fillStyle = isPlayer ? '#3a9dff' : '#ff3a3a'
    ctx.fillRect(cx - barW / 2, baseY - 58, barW * hpRatio, barH)
  }

  ctx.restore()
}

/**
 * 绘制玩家复活倒计时
 */
export function drawRespawnTimer(ctx: CanvasRenderingContext2D, player: Player, worldWidth: number, worldHeight: number): void {
  if (!player.isDead) return

  const cx = player.x + player.width / 2
  const cy = player.y + player.height / 2

  ctx.save()
  ctx.globalAlpha = 0.7

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
  ctx.beginPath()
  ctx.arc(cx, cy, 25, 0, Math.PI * 2)
  ctx.fill()

  const seconds = Math.ceil(player.respawnTimer / 1000)
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${seconds}s`, cx, cy)

  ctx.restore()
}

/**
 * 绘制敌方复活倒计时
 */
export function drawEnemyRespawnTimer(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
  if (!enemy.isDead) return

  const cx = enemy.x + enemy.width / 2
  const cy = enemy.y + enemy.height / 2

  ctx.save()
  ctx.globalAlpha = 0.7

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
  ctx.beginPath()
  ctx.arc(cx, cy, 25, 0, Math.PI * 2)
  ctx.fill()

  const seconds = Math.ceil(enemy.respawnTimer / 1000)
  ctx.fillStyle = '#ff3a3a'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${seconds}s`, cx, cy)

  ctx.restore()
}

/**
 * 绘制野怪
 */
export function drawNeutralCreep(ctx: CanvasRenderingContext2D, creep: NeutralCreep): void {
  if (creep.isDead) return

  ctx.save()

  const cx = creep.x + creep.width / 2
  const cy = creep.y + creep.height / 2

  if (creep.hitFlashTimer > 0 && Math.floor(creep.hitFlashTimer / 60) % 2 === 0) {
    ctx.globalAlpha = 0.5
  }

  if (creep.type === 'roshan') {
    // Roshan - 大型boss
    ctx.fillStyle = '#4a1a1a'
    ctx.beginPath()
    ctx.arc(cx, cy, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ff4400'
    ctx.lineWidth = 2
    ctx.stroke()

    // 骷髅脸
    ctx.fillStyle = '#ffccaa'
    ctx.beginPath()
    ctx.arc(cx, cy - 2, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ff4400'
    ctx.beginPath()
    ctx.arc(cx - 3, cy - 4, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + 3, cy - 4, 2, 0, Math.PI * 2)
    ctx.fill()
  } else if (creep.type === 'medium') {
    // 中型野怪
    ctx.fillStyle = '#8b6914'
    ctx.beginPath()
    ctx.arc(cx, cy, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#5a4a0a'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = '#ffcc00'
    ctx.beginPath()
    ctx.arc(cx - 3, cy - 3, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + 3, cy - 3, 2.5, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // 小型野怪
    ctx.fillStyle = '#6b8e23'
    ctx.beginPath()
    ctx.arc(cx, cy, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#556b2f'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = '#ffff00'
    ctx.beginPath()
    ctx.arc(cx - 2, cy - 2, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + 2, cy - 2, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // 血条
  const hpRatio = creep.hp / creep.maxHp
  const barW = 24
  const barH = 3
  ctx.fillStyle = '#333333'
  ctx.fillRect(cx - barW / 2, cy - 20, barW, barH)
  if (hpRatio > 0) {
    ctx.fillStyle = '#ffaa00'
    ctx.fillRect(cx - barW / 2, cy - 20, barW * hpRatio, barH)
  }

  ctx.restore()
}