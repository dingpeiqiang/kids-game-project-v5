/**
 * 游戏主渲染模块
 * 负责游戏主画面的渲染编排
 */

import * as C from '../config'
import type { Player, Enemy, Bullet, DropItem, Particle, Shockwave, FloatText, Equipment, SkillInstance, ScreenShake } from '../types'
import { drawPlayer } from './player'
import { drawEnemies, drawBossHealthBar } from './enemies'
import {
  drawParticles, drawShockwaves, drawFloatTexts,
  drawBullets, drawDrops,
} from './effects'
import {
  drawUI, drawGameOver, drawVictory, drawCharacterSelect,
  drawRoomClear,
} from './ui'
import { drawDungeonBackground, drawDoor } from './dungeon'
import { drawTouchUI, type TouchUIData } from './touch-ui'
import type { DungeonManager } from '../logic/dungeon'
import type { TouchButtonState, JoystickState } from '../logic/input-manager'
import { getShakeOffset } from '../logic/effects'

export interface GameRenderData {
  player: Player
  enemies: Enemy[]
  bullets: Bullet[]
  drops: DropItem[]
  particles: Particle[]
  shockwaves: Shockwave[]
  floatTexts: FloatText[]
  gold: number
  score: number
  combo: number
  cameraX: number
  fadeInTimer: number
  doorOpen: boolean
  roomCleared: boolean
  gameOver: boolean
  victory: boolean
  inCharSelect: boolean
  hoveredClassIndex: number
  dungeon: DungeonManager
  touchButtons: TouchButtonState[]
  joystick: JoystickState
  skills: SkillInstance[]
  // 滑动过渡
  transitionPhase: 'none' | 'slide_out' | 'slide_in'
  transitionProgress: number
  screenShake: ScreenShake | null
}

export function renderGame(ctx: CanvasRenderingContext2D, data: GameRenderData): void {
  const now = Date.now()

  // 角色选择界面
  if (data.inCharSelect) {
    drawCharacterSelect(ctx, now, data.hoveredClassIndex, ctx.canvas.width)
    return
  }

  // 清屏
  const totalWidth = C.TOTAL_WIDTH

  // 绘制左侧面板背景
  ctx.fillStyle = '#1a1a2a'
  ctx.fillRect(0, 0, C.LEFT_PANEL_WIDTH, C.CANVAS_HEIGHT)

  // 绘制右侧面板背景
  ctx.fillStyle = '#1a1a2a'
  ctx.fillRect(C.LEFT_PANEL_WIDTH + C.CANVAS_WIDTH, 0, C.RIGHT_PANEL_WIDTH, C.CANVAS_HEIGHT)

  // 游戏画面偏移
  ctx.save()
  ctx.translate(C.LEFT_PANEL_WIDTH, 0)

  const room = data.dungeon.getCurrentRoom()

  // 应用相机滚动（世界坐标 → 屏幕坐标）
  ctx.save()

  // 滑动过渡偏移
  let transitionOffsetX = 0
  if (data.transitionPhase === 'slide_out') {
    // 当前房间向左滑出
    transitionOffsetX = -data.transitionProgress * C.CANVAS_WIDTH
  } else if (data.transitionPhase === 'slide_in') {
    // 新房间从右侧滑入
    transitionOffsetX = C.CANVAS_WIDTH * (1 - data.transitionProgress)
  }

  ctx.translate(-data.cameraX + transitionOffsetX, 0)

  // 屏幕震动
  const shake = getShakeOffset(data.screenShake)
  ctx.translate(shake.x, shake.y)

  // 背景
  drawDungeonBackground(ctx, room, data.cameraX)

  // 门
  const doorX = room.width - 10
  drawDoor(ctx, doorX, C.GROUND_Y - 50, data.doorOpen, data.cameraX)

  // 子弹
  drawBullets(ctx, data.bullets, now)

  // 敌人
  drawEnemies(ctx, data.enemies)

  // 道具（在敌人上层绘制，确保可见）
  drawDrops(ctx, data.drops, now)

  // 震波
  drawShockwaves(ctx, data.shockwaves)

  // 玩家
  drawPlayer(ctx, data.player, now)

  // 粒子
  drawParticles(ctx, data.particles, now)

  // 浮动文字
  drawFloatTexts(ctx, data.floatTexts)

  // DNF 式战斗 vignette（突出角色与刀光）
  drawCombatStageVignette(ctx)

  // 恢复相机偏移
  ctx.restore()

  // UI
  const roomName = data.dungeon.getCurrentLevel().name
  drawUI(ctx, data.player, data.gold, data.score, data.combo, roomName)

  // 房间清理提示
  if (data.roomCleared) {
    drawRoomClear(ctx)
  }

  // 淡入效果
  if (data.fadeInTimer > 0) {
    const alpha = data.fadeInTimer / C.FADE_DURATION
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT)
  }

  // 游戏结束
  if (data.gameOver) {
    drawGameOver(ctx)
  }

  // 胜利
  if (data.victory) {
    drawVictory(ctx)
  }

  ctx.restore()

  // 绘制触屏UI
  const touchData: TouchUIData = {
    touchButtons: data.touchButtons,
    joystick: data.joystick,
    dungeon: data.dungeon,
    player: data.player,
    skills: data.skills,
  }
  drawTouchUI(ctx, touchData, totalWidth, now)

  // 面板分隔线
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(C.LEFT_PANEL_WIDTH, 0)
  ctx.lineTo(C.LEFT_PANEL_WIDTH, C.CANVAS_HEIGHT)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(C.LEFT_PANEL_WIDTH + C.CANVAS_WIDTH, 0)
  ctx.lineTo(C.LEFT_PANEL_WIDTH + C.CANVAS_WIDTH, C.CANVAS_HEIGHT)
  ctx.stroke()
}

/** DNF 副本战斗区：四周压暗，中间略亮 */
function drawCombatStageVignette(ctx: CanvasRenderingContext2D): void {
  const w = C.CANVAS_WIDTH
  const h = C.CANVAS_HEIGHT
  const cx = w * 0.5
  const cy = C.GROUND_Y * 0.42

  ctx.save()
  const g = ctx.createRadialGradient(cx, cy, w * 0.12, cx, cy, w * 0.72)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(0.55, 'rgba(0,0,0,0.12)')
  g.addColorStop(1, 'rgba(0,0,0,0.48)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const floorShade = ctx.createLinearGradient(0, C.GROUND_Y - 40, 0, h)
  floorShade.addColorStop(0, 'rgba(0,0,0,0)')
  floorShade.addColorStop(1, 'rgba(0,0,0,0.25)')
  ctx.fillStyle = floorShade
  ctx.fillRect(0, C.GROUND_Y - 40, w, h - C.GROUND_Y + 40)
  ctx.restore()
}