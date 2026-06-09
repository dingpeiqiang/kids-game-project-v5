import { GAME_CONFIG, SKILL_CONFIG } from '../config'
import type { GameState } from '../types'

/**
 * 绘制 UI 层
 */
export function drawUI(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
): void {
  drawPlayerHUD(ctx, state, w, h)
  drawEnemyHUD(ctx, state, w, h)
  drawTowerStatus(ctx, state, w, h)
  drawTimer(ctx, state, w, h)
  if (state.player.isDead) {
    drawDeathOverlay(ctx, state, w, h)
  }
}

/**
 * 玩家 HUD：血条、等级、经验、金币、技能冷却
 */
function drawPlayerHUD(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
): void {
  const p = state.player
  const margin = 10
  const barW = w * 0.35
  const barH = h * 0.022
  const x = margin
  const y = margin

  // 血条背景
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(x, y, barW, barH)
  // 血条
  const hpRatio = Math.max(0, p.hp / p.maxHp)
  const hpColor = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ff9800' : '#f44336'
  ctx.fillStyle = hpColor
  ctx.fillRect(x, y, barW * hpRatio, barH)
  // 血条边框
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, barW, barH)
  // 血量文字
  ctx.fillStyle = '#ffffff'
  ctx.font = `${barH * 0.8}px sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(`${Math.ceil(p.hp)}/${p.maxHp}`, x + 4, y + barH * 0.82)

  // 等级
  const lvY = y + barH + 8
  ctx.fillStyle = '#ffd700'
  ctx.font = `bold ${h * 0.022}px sans-serif`
  ctx.fillText(`Lv.${p.level}`, x, lvY + h * 0.022)

  // 经验条
  const expW = barW * 0.6
  const expH = h * 0.012
  const expX = x + w * 0.06
  const expY = lvY + h * 0.008
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(expX, expY, expW, expH)
  if (p.level < GAME_CONFIG.MAX_LEVEL) {
    ctx.fillStyle = '#7c4dff'
    ctx.fillRect(expX, expY, expW * (p.exp / p.expToNext), expH)
  } else {
    ctx.fillStyle = '#ffd700'
    ctx.fillRect(expX, expY, expW, expH)
  }
  ctx.strokeStyle = '#888888'
  ctx.lineWidth = 0.5
  ctx.strokeRect(expX, expY, expW, expH)

  // 金币
  ctx.fillStyle = '#ffd700'
  ctx.font = `${h * 0.02}px sans-serif`
  ctx.fillText(`Gold: ${p.gold}`, x, expY + expH + h * 0.022)

  // 技能冷却显示
  drawSkillCooldowns(ctx, p.skillCooldowns, w, h)
}

/**
 * 技能冷却图标
 */
function drawSkillCooldowns(
  ctx: CanvasRenderingContext2D,
  cooldowns: number[],
  w: number,
  h: number,
): void {
  const skillSize = h * 0.045
  const gap = w * 0.01
  const startX = w * 0.02
  const startY = h * 0.22

  for (let i = 0; i < cooldowns.length; i++) {
    const sx = startX + i * (skillSize + gap)
    const sy = startY

    const config = SKILL_CONFIG[i + 1]
    if (!config) continue

    // 技能背景
    ctx.fillStyle = cooldowns[i] > 0 ? 'rgba(50,50,50,0.7)' : 'rgba(30,30,30,0.7)'
    ctx.strokeStyle = cooldowns[i] > 0 ? '#666666' : '#ffd700'
    ctx.lineWidth = 2
    roundRect(ctx, sx, sy, skillSize, skillSize, 6)

    // 技能标签
    ctx.fillStyle = cooldowns[i] > 0 ? '#888888' : '#ffffff'
    ctx.font = `bold ${skillSize * 0.5}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(config.label, sx + skillSize / 2, sy + skillSize * 0.65)

    // 冷却遮罩
    if (cooldowns[i] > 0) {
      const cdRatio = cooldowns[i] / config.cooldown
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(sx, sy, skillSize, skillSize * cdRatio)

      // 冷却秒数
      ctx.fillStyle = '#ffffff'
      ctx.font = `${skillSize * 0.35}px sans-serif`
      ctx.fillText(
        `${Math.ceil(cooldowns[i] / 1000)}`,
        sx + skillSize / 2,
        sy + skillSize / 2 + skillSize * 0.12,
      )
    }
  }
}

/**
 * 敌方 HUD
 */
function drawEnemyHUD(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
): void {
  const e = state.enemy
  const margin = 10
  const barW = w * 0.35
  const barH = h * 0.022
  const x = w - margin - barW
  const y = margin

  // 血条背景
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(x, y, barW, barH)
  // 血条
  const hpRatio = Math.max(0, e.hp / e.maxHp)
  ctx.fillStyle = '#f44336'
  ctx.fillRect(x, y, barW * hpRatio, barH)
  // 边框
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, barW, barH)
  // 血量
  ctx.fillStyle = '#ffffff'
  ctx.font = `${barH * 0.8}px sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText(`${Math.ceil(e.hp)}/${e.maxHp}`, x + barW - 4, y + barH * 0.82)

  // 等级
  ctx.fillStyle = '#ff3a3a'
  ctx.font = `bold ${h * 0.022}px sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText(`Lv.${e.level}`, x + barW, y + barH + h * 0.03)
}

/**
 * 防御塔状态
 */
function drawTowerStatus(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
): void {
  const playerTowers = state.towers.filter(t => t.team === 'player')
  const enemyTowers = state.towers.filter(t => t.team === 'enemy')

  const barW = w * 0.12
  const barH = h * 0.015
  const y = h * 0.1

  // 我方塔（显示存活数量）
  const playerAlive = playerTowers.filter(t => !t.isDestroyed).length
  const playerTotal = playerTowers.length
  ctx.textAlign = 'center'
  ctx.font = `${h * 0.016}px sans-serif`
  ctx.fillStyle = '#3a6bff'
  ctx.fillText(`我方塔 ${playerAlive}/${playerTotal}`, w * 0.08, y - 5)

  // 敌方塔（显示存活数量）
  const enemyAlive = enemyTowers.filter(t => !t.isDestroyed).length
  const enemyTotal = enemyTowers.length
  ctx.fillStyle = '#cc3333'
  ctx.fillText(`敌方塔 ${enemyAlive}/${enemyTotal}`, w * 0.92, y - 5)

  // 基地血条
  const playerBase = playerTowers.find(t => t.tier === 4)
  const enemyBase = enemyTowers.find(t => t.tier === 4)

  if (playerBase && !playerBase.isDestroyed) {
    const bx = w * 0.08
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(bx - barW / 2, y, barW, barH)
    ctx.fillStyle = '#4caf50'
    ctx.fillRect(bx - barW / 2, y, barW * (playerBase.hp / playerBase.maxHp), barH)
    ctx.strokeStyle = '#ffd700'
    ctx.lineWidth = 1
    ctx.strokeRect(bx - barW / 2, y, barW, barH)
  }

  if (enemyBase && !enemyBase.isDestroyed) {
    const bx = w * 0.92
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(bx - barW / 2, y, barW, barH)
    ctx.fillStyle = '#f44336'
    ctx.fillRect(bx - barW / 2, y, barW * (enemyBase.hp / enemyBase.maxHp), barH)
    ctx.strokeStyle = '#ffd700'
    ctx.lineWidth = 1
    ctx.strokeRect(bx - barW / 2, y, barW, barH)
  }
}

/**
 * 倒计时
 */
function drawTimer(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
): void {
  const mins = Math.floor(state.remainingTime / 60000)
  const secs = Math.floor((state.remainingTime % 60000) / 1000)
  const text = `${mins}:${secs.toString().padStart(2, '0')}`

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${h * 0.025}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(text, w / 2, h * 0.05)

  // 波次
  ctx.font = `${h * 0.016}px sans-serif`
  ctx.fillStyle = '#aaaaaa'
  ctx.fillText(`第 ${state.waveNumber} 波`, w / 2, h * 0.08)
}

/**
 * 死亡遮罩
 */
function drawDeathOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(0, 0, w, h)

  const secs = Math.ceil(state.player.respawnTimer / 1000)
  ctx.fillStyle = '#ff3a3a'
  ctx.font = `bold ${h * 0.04}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(`复活倒计时: ${secs}s`, w / 2, h / 2)
}

/**
 * 圆角矩形
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}