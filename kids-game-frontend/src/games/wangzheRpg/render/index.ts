import { drawBackground } from './background'
import { drawPlayer, drawEnemy, drawMinion, drawTower, drawNeutralCreep } from './entities'
import { drawSkillEffect, drawParticle, drawFloatText } from './effects'
import { drawUI } from './ui'
import type { GameState } from '../types'

/**
 * 主渲染入口：五层渲染架构
 * 背景 → 实体 → 特效 → UI → 弹窗
 */
export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasWidth: number,
  canvasHeight: number,
  cameraX: number,
  cameraY: number,
): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 相机偏移
  ctx.save()
  ctx.translate(-cameraX, -cameraY)

  // 第1层：背景
  drawBackground(ctx, state.worldWidth, state.worldHeight)

  // 第2层：实体
  // 防御塔
  for (const t of state.towers) {
    drawTower(ctx, t)
  }
  // 小兵
  for (const m of state.minions) {
    drawMinion(ctx, m)
  }
  // 野怪
  for (const c of state.neutralCreeps) {
    drawNeutralCreep(ctx, c)
  }
  // 敌方英雄
  drawEnemy(ctx, state.enemy)
  // 玩家英雄
  drawPlayer(ctx, state.player)

  // 第3层：特效
  for (const e of state.skillEffects) {
    drawSkillEffect(ctx, e)
  }
  for (const p of state.particles) {
    drawParticle(ctx, p)
  }
  for (const t of state.floatTexts) {
    drawFloatText(ctx, t)
  }

  ctx.restore()

  // 第4层：UI（屏幕坐标，不随相机偏移）
  drawUI(ctx, state, canvasWidth, canvasHeight)

  // 第5层：弹窗（游戏结束）
  if (state.gameOver) {
    drawGameOverPopup(ctx, state, canvasWidth, canvasHeight)
  }
}

/**
 * 绘制游戏结束弹窗
 */
function drawGameOverPopup(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
): void {
  // 半透明黑色遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, w, h)

  // 弹窗背景
  const pw = w * 0.7
  const ph = h * 0.35
  const px = (w - pw) / 2
  const py = (h - ph) / 2

  ctx.fillStyle = 'rgba(20, 10, 40, 0.95)'
  ctx.strokeStyle = '#ffd700'
  ctx.lineWidth = 3
  roundRect(ctx, px, py, pw, ph, 16)

  // 标题
  ctx.fillStyle = state.victory ? '#ffd700' : '#ff3a3a'
  ctx.font = `bold ${h * 0.04}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(state.victory ? 'VICTORY' : 'DEFEAT', w / 2, py + ph * 0.25)

  // 原因
  ctx.fillStyle = '#ffffff'
  ctx.font = `${h * 0.022}px sans-serif`
  ctx.fillText(state.gameOverReason, w / 2, py + ph * 0.45)

  // 统计
  ctx.fillText(
    `玩家击杀: ${state.playerKills}  |  敌方击杀: ${state.enemyKills}`,
    w / 2,
    py + ph * 0.6,
  )

  // 重新开始按钮
  const btnX = w / 2
  const btnY = py + ph * 0.8
  const btnW = pw * 0.5
  const btnH = ph * 0.15

  ctx.fillStyle = '#ffd700'
  roundRect(ctx, btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8)
  ctx.fillStyle = '#1a0033'
  ctx.font = `bold ${h * 0.025}px sans-serif`
  ctx.fillText('重新开始', btnX, btnY + btnH * 0.12)
}

/**
 * 绘制圆角矩形
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