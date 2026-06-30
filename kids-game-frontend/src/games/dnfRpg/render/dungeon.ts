/**
 * 地下城背景渲染（精简版）
 * 保持DNF风格但去除过度装饰，确保画面清晰不杂乱
 */

import type { DungeonRoom, Platform } from '../types'
import * as C from '../config'
import { getDungeonTheme } from './dungeon-theme'
import {
  drawBackdropSky,
  drawBackdropMidground,
  drawBossArenaStage,
} from './dungeon-backdrop'

// ============ 视差系数 ============
const PARALLAX_FAR = 0.15
const PARALLAX_MID = 0.4
const PARALLAX_NEAR = 0.7

export function drawDungeonBackground(
  ctx: CanvasRenderingContext2D,
  room: DungeonRoom,
  camX: number,
): void {
  ctx.save()

  const theme = getDungeonTheme(room)

  // 1. 天空/背景渐变
  drawSkyAndCaveTop(ctx, room)

  // 2. 主题远景插画（森林/废墟/Boss 等）
  drawBackdropSky(ctx, room, theme, camX)
  drawBackdropMidground(ctx, room, theme, camX)

  // 3. 房间类型氛围
  drawRoomTypeAtmosphere(ctx, room, camX)

  // 4. 远景柱 + 火把（与插画叠层）
  drawFarLayer(ctx, room, camX)

  // 5. 墙壁主体 + 地面（按关卡配色 / 主题）
  drawWallAndGround(ctx, room, camX, theme)

  // 5b. Boss 半圆擂台 + 锁边
  drawBossArenaStage(ctx, room, camX, theme)

  // 4b. 可站立平台（DNF 式浮空台）
  if (room.platforms?.length) {
    drawPlatforms(ctx, room.platforms, camX, theme)
  }

  // 5. 近景装饰（少量，带可视范围裁剪优化）
  drawNearDecorations(ctx, room, camX)

  // 6. 房间名条（副本感）
  drawRoomNamePlate(ctx, room.name, camX)

  // 6. 障碍物
  if (room.obstacles && room.obstacles.length > 0) {
    drawObstacles(ctx, room.obstacles, camX)
  }

  ctx.restore()
}

// ============ 房间类型特效层 ============
function drawRoomTypeAtmosphere(ctx: CanvasRenderingContext2D, room: DungeonRoom, camX: number): void {
  const time = Date.now() / 1000

  switch (room.roomType) {
    case 'treasure':
      // 宝箱房：金色光柱和漂浮金币粒子
      drawTreasureAtmosphere(ctx, room, camX, time)
      break
    case 'rest':
      // 休息房：温暖光晕和治愈粒子
      drawRestAtmosphere(ctx, room, camX, time)
      break
    case 'boss':
      // Boss房：暗红色雾气
      drawBossAtmosphere(ctx, room, camX, time)
      break
    case 'secret':
      // 隐藏房：紫色闪烁光晕
      drawSecretAtmosphere(ctx, room, camX, time)
      break
  }
}

function drawTreasureAtmosphere(ctx: CanvasRenderingContext2D, room: DungeonRoom, camX: number, time: number): void {
  // 金色光柱（从顶部射下）
  const pillarPositions = [room.width * 0.25, room.width * 0.5, room.width * 0.75]
  for (const px of pillarPositions) {
    const sx = px - camX * 0.1
    if (sx < -50 || sx > C.CANVAS_WIDTH + 50) continue
    const flicker = Math.sin(time * 2 + px) * 0.3 + 0.7
    const pillarGrad = ctx.createLinearGradient(sx, 0, sx, C.GROUND_Y)
    pillarGrad.addColorStop(0, `rgba(255, 215, 0, ${flicker * 0.12})`)
    pillarGrad.addColorStop(0.3, `rgba(255, 180, 0, ${flicker * 0.08})`)
    pillarGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = pillarGrad
    ctx.fillRect(sx - 15, 0, 30, C.GROUND_Y)
  }

  // 空中漂浮金色粒子（装饰用，非粒子系统）
  const particleCount = 12
  for (let i = 0; i < particleCount; i++) {
    const px = (room.width * ((i + 1) / (particleCount + 1))) - camX * 0.2
    if (px < -20 || px > C.CANVAS_WIDTH + 20) continue
    const py = (Math.sin(time * 1.5 + i * 1.7) * 0.5 + 0.5) * C.GROUND_Y * 0.6 + C.GROUND_Y * 0.1
    const alpha = Math.sin(time * 2 + i * 2.3) * 0.3 + 0.4
    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`
    ctx.beginPath()
    ctx.arc(px, py, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawRestAtmosphere(ctx: CanvasRenderingContext2D, room: DungeonRoom, camX: number, time: number): void {
  // 暖色光晕（篝火/营地的温暖感）
  const cx = room.width * 0.5 - camX * 0.3
  const cy = C.GROUND_Y * 0.6

  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180)
  glow.addColorStop(0, 'rgba(34, 211, 238, 0.08)')
  glow.addColorStop(0.3, 'rgba(74, 222, 128, 0.05)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.GROUND_Y)

  // 飘落的治愈光点
  const dotCount = 8
  for (let i = 0; i < dotCount; i++) {
    const px = (room.width * ((i + 1) / (dotCount + 1))) - camX * 0.15
    if (px < -30 || px > C.CANVAS_WIDTH + 30) continue
    const py = ((Math.sin(time * 0.8 + i * 2.1) + 1) / 2) * C.GROUND_Y * 0.7 + 20
    const alpha = Math.sin(time * 1.2 + i * 1.5) * 0.2 + 0.25
    ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`
    ctx.beginPath()
    ctx.arc(px, py, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(34, 211, 238, ${alpha * 0.5})`
    ctx.beginPath()
    ctx.arc(px - 3, py - 2, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawBossAtmosphere(ctx: CanvasRenderingContext2D, room: DungeonRoom, camX: number, time: number): void {
  // 暗红色雾气（地面附近）
  for (let i = 0; i < 3; i++) {
    const fogX = (room.width * (i + 1) / 4) - camX * 0.3
    if (fogX < -100 || fogX > C.CANVAS_WIDTH + 100) continue
    const fogY = C.GROUND_Y - 30 + Math.sin(time * 0.5 + i * 2) * 15
    const fogGrad = ctx.createRadialGradient(fogX, fogY, 0, fogX, fogY, 80)
    fogGrad.addColorStop(0, 'rgba(180, 0, 0, 0.08)')
    fogGrad.addColorStop(0.5, 'rgba(120, 0, 0, 0.04)')
    fogGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = fogGrad
    ctx.beginPath()
    ctx.arc(fogX, fogY, 80, 0, Math.PI * 2)
    ctx.fill()
  }

  // 顶部暗色遮罩（营造压迫感）
  const darkGrad = ctx.createLinearGradient(0, 0, 0, C.CEILING_Y + 60)
  darkGrad.addColorStop(0, 'rgba(80, 0, 0, 0.2)')
  darkGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = darkGrad
  ctx.fillRect(0, 0, room.width, C.CEILING_Y + 60)
}

function drawSecretAtmosphere(ctx: CanvasRenderingContext2D, room: DungeonRoom, camX: number, time: number): void {
  // 紫色闪烁光晕
  const secretPulse = Math.sin(time * 2.5) * 0.3 + 0.7
  const secretX = room.width * 0.5 - camX * 0.2
  const secretGrad = ctx.createRadialGradient(secretX, C.GROUND_Y * 0.5, 0, secretX, C.GROUND_Y * 0.5, 150)
  secretGrad.addColorStop(0, `rgba(200, 80, 255, ${secretPulse * 0.06})`)
  secretGrad.addColorStop(0.5, `rgba(150, 50, 200, ${secretPulse * 0.03})`)
  secretGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = secretGrad
  ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.GROUND_Y)

  // 闪烁的小星星
  const starCount = 6
  for (let i = 0; i < starCount; i++) {
    const sx = (room.width * ((i + 1) / (starCount + 1))) - camX * 0.25
    if (sx < -20 || sx > C.CANVAS_WIDTH + 20) continue
    const sy = C.GROUND_Y * 0.3 + Math.sin(time + i * 3) * C.GROUND_Y * 0.2
    const alpha = Math.sin(time * 3 + i * 1.8) * 0.3 + 0.35
    ctx.fillStyle = `rgba(244, 114, 182, ${alpha})`
    ctx.beginPath()
    ctx.arc(sx, sy, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ============ 天空/洞穴顶部 ============
function drawSkyAndCaveTop(ctx: CanvasRenderingContext2D, room: DungeonRoom): void {
  const bg = parseHexColor(room.bgColor)

  // 主背景：整个可视区域都是墙壁/背景（CEILING_Y 到 GROUND_Y）
  const grad = ctx.createLinearGradient(0, 0, 0, C.GROUND_Y)
  grad.addColorStop(0, darkenColor(bg, 0.55))
  grad.addColorStop(0.4, darkenColor(bg, 0.28))
  grad.addColorStop(0.75, darkenColor(bg, 0.18))
  grad.addColorStop(1, room.bgColor)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, room.width, C.GROUND_Y)

  // 顶部深邃感
  const topGrad = ctx.createRadialGradient(C.CANVAS_WIDTH / 2, -30, 0, C.CANVAS_WIDTH / 2, 80, 250)
  topGrad.addColorStop(0, 'rgba(0,0,0,0.65)')
  topGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, C.CANVAS_WIDTH, 140)
}

// ============ 远景层（精简） ============
function drawFarLayer(ctx: CanvasRenderingContext2D, room: DungeonRoom, camX: number): void {
  const bg = parseHexColor(room.bgColor)
  const time = Date.now() / 1000
  const farX = -(camX * PARALLAX_FAR)

  // 远景石柱（每300px一根，简单绘制）
  const pillarCount = Math.ceil(room.width / 300) + 2
  for (let i = 0; i < pillarCount; i++) {
    const px = i * 300 + farX
    if (px > -80 && px < C.CANVAS_WIDTH + 80) {
      // 柱子从天花板延伸到地面（贴墙柱）
      const ph = C.GROUND_Y - C.CEILING_Y - 10

      // 柱子阴影
      ctx.fillStyle = darkenColor(bg, 0.55)
      ctx.fillRect(px - 4, C.CEILING_Y + 4, 20, ph - 4)

      // 柱子主体
      ctx.fillStyle = darkenColor(bg, 0.35)
      ctx.fillRect(px - 6, C.CEILING_Y, 14, ph)

      // 左侧高光
      ctx.fillStyle = darkenColor(bg, 0.18)
      ctx.fillRect(px - 5, C.CEILING_Y, 4, ph)

      // 柱头
      ctx.fillStyle = darkenColor(bg, 0.28)
      ctx.fillRect(px - 10, C.CEILING_Y - 2, 20, 8)

      // 柱底
      ctx.fillStyle = darkenColor(bg, 0.28)
      ctx.fillRect(px - 10, C.GROUND_Y - 10, 20, 8)
    }
  }

  // 远景火把光晕
  const torchPositions = [150, 450, 750]
  torchPositions.forEach((tx, i) => {
    const sx = tx + farX * 0.8
    if (sx > -100 && sx < C.CANVAS_WIDTH + 100) {
      const flicker = Math.sin(time * 4 + i * 2) * 0.15 + 0.85
      const torchY = C.CEILING_Y + 40
      const glow = ctx.createRadialGradient(sx, torchY, 0, sx, torchY, 120)
      glow.addColorStop(0, `rgba(255,180,80,${flicker * 0.15})`)
      glow.addColorStop(0.5, `rgba(255,120,40,${flicker * 0.06})`)
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(sx, torchY, 120, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

// ============ 墙壁 + 地面（DNF风格，主题驱动）============
function drawWallAndGround(
  ctx: CanvasRenderingContext2D,
  room: DungeonRoom,
  camX: number,
  theme: ReturnType<typeof getDungeonTheme>,
): void {
  const bg = parseHexColor(room.bgColor)

  const skyGrad = ctx.createLinearGradient(0, 0, 0, C.GROUND_Y)
  skyGrad.addColorStop(0, theme.wallTop)
  skyGrad.addColorStop(0.35, theme.wallMid)
  skyGrad.addColorStop(0.72, theme.wallBottom)
  skyGrad.addColorStop(1, room.bgColor)
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, room.width, C.GROUND_Y)

  // 地面附近薄雾（格兰之森 / 废墟层次感）
  const fogGrad = ctx.createLinearGradient(0, C.GROUND_Y - 120, 0, C.GROUND_Y)
  fogGrad.addColorStop(0, 'transparent')
  fogGrad.addColorStop(1, theme.fogColor)
  ctx.fillStyle = fogGrad
  ctx.fillRect(0, C.GROUND_Y - 120, room.width, 120)

  // ===== 远景层：远处的拱门和阴影 =====
  const farOffset = camX * 0.15
  const archSpacing = 250
  
  for (let i = -2; i < Math.ceil(room.width / archSpacing) + 2; i++) {
    const archX = i * archSpacing - farOffset
    if (archX < -100 || archX > C.CANVAS_WIDTH + 100) continue
    
    // 远景拱门阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.beginPath()
    ctx.arc(archX, C.GROUND_Y - 80, 50, Math.PI, 0)
    ctx.fill()
    
    ctx.strokeStyle = theme.archStroke
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(archX, C.GROUND_Y - 80, 48, Math.PI, 0)
    ctx.stroke()
  }

  // ===== 中景层：地牢墙壁 =====
  const midOffset = camX * 0.3
  
  // 中景石柱
  const pillarSpacing = 180
  for (let i = -1; i < Math.ceil(room.width / pillarSpacing) + 2; i++) {
    const px = i * pillarSpacing - midOffset + 90
    if (px < -60 || px > C.CANVAS_WIDTH + 60) continue
    
    // 石柱阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
    ctx.fillRect(px - 18, C.CEILING_Y, 36, C.GROUND_Y - C.CEILING_Y - 20)
    
    // 石柱主体
    const pillarGrad = ctx.createLinearGradient(px - 15, 0, px + 15, 0)
    pillarGrad.addColorStop(0, theme.pillarDark)
    pillarGrad.addColorStop(0.35, theme.pillarLight)
    pillarGrad.addColorStop(0.65, theme.pillarLight)
    pillarGrad.addColorStop(1, theme.pillarDark)
    ctx.fillStyle = pillarGrad
    ctx.fillRect(px - 15, C.CEILING_Y, 30, C.GROUND_Y - C.CEILING_Y - 20)
    
    ctx.fillStyle = theme.pillarLight
    ctx.fillRect(px - 18, C.CEILING_Y, 36, 8)
    ctx.fillRect(px - 20, C.CEILING_Y + 8, 40, 4)
    
    // 石柱底部装饰
    ctx.fillStyle = theme.pillarLight
    ctx.fillRect(px - 18, C.GROUND_Y - 28, 36, 8)
    ctx.fillRect(px - 20, C.GROUND_Y - 32, 40, 4)
  }

  ctx.strokeStyle = theme.brickStroke
  ctx.lineWidth = 1
  const brickW = 35
  const brickH = 18
  
  for (let col = Math.floor(camX / brickW) - 2; col < Math.floor((camX + C.CANVAS_WIDTH) / brickW) + 3; col++) {
    const bx = col * brickW - (camX % brickW)
    if (bx < -50 || bx > C.CANVAS_WIDTH + 50) continue
    
    // 竖缝
    ctx.beginPath()
    ctx.moveTo(bx, C.CEILING_Y + 20)
    ctx.lineTo(bx, C.GROUND_Y - 35)
    ctx.stroke()
    
    // 横缝（交错）
    const offset = (col % 2) * (brickW / 2)
    for (let row = 0; row < 20; row++) {
      const by = C.CEILING_Y + 20 + row * brickH
      if (by > C.GROUND_Y - 38) break
      ctx.beginPath()
      ctx.moveTo(bx - 12 + offset, by)
      ctx.lineTo(bx + 12 + offset, by)
      ctx.stroke()
    }
  }

  // ===== 地面区域（DNF风格）=====
  const groundHeight = C.CANVAS_HEIGHT - C.GROUND_Y

  // 地面顶部阴影带
  const shadowGrad = ctx.createLinearGradient(0, C.GROUND_Y - 15, 0, C.GROUND_Y)
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.3)')
  shadowGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = shadowGrad
  ctx.fillRect(0, C.GROUND_Y - 15, room.width, 15)

  // 地面主体
  const groundGrad = ctx.createLinearGradient(0, C.GROUND_Y, 0, C.CANVAS_HEIGHT)
  groundGrad.addColorStop(0, theme.groundTop)
  groundGrad.addColorStop(0.35, theme.groundMid)
  groundGrad.addColorStop(0.75, theme.groundBottom)
  groundGrad.addColorStop(1, darkenColor(parseHexColor(room.groundColor), 0.5))
  ctx.fillStyle = groundGrad
  ctx.fillRect(0, C.GROUND_Y, room.width, groundHeight)

  ctx.strokeStyle = theme.slabStroke
  ctx.lineWidth = 1
  
  const slabW = 50
  const slabH = 12
  for (let col = Math.floor(camX / slabW) - 2; col < Math.floor((camX + C.CANVAS_WIDTH) / slabW) + 3; col++) {
    const sx = col * slabW - (camX % slabW)
    if (sx < -60 || sx > C.CANVAS_WIDTH + 60) continue
    
    ctx.beginPath()
    ctx.moveTo(sx, C.GROUND_Y + 3)
    ctx.lineTo(sx, C.CANVAS_HEIGHT)
    ctx.stroke()
    
    // 横缝（交错）
    const rowOffset = (col % 2) * (slabW / 2)
    for (let row = 0; row < Math.ceil(groundHeight / slabH); row++) {
      const sy = C.GROUND_Y + 3 + row * slabH
      if (sy > C.CANVAS_HEIGHT - 2) break
      ctx.beginPath()
      ctx.moveTo(sx - 18 + rowOffset, sy)
      ctx.lineTo(sx + 18 + rowOffset, sy)
      ctx.stroke()
    }
  }

  ctx.fillStyle = theme.groundHighlight
  ctx.fillRect(0, C.GROUND_Y, room.width, 3)

  // ===== 火把光效 =====
  const torchOffset = camX * 0.2
  const torchSpacing = 220
  
  for (let i = 0; i < Math.ceil(room.width / torchSpacing) + 1; i++) {
    const tx = i * torchSpacing - torchOffset + 110
    if (tx < -50 || tx > C.CANVAS_WIDTH + 50) continue
    
    const time = Date.now() / 1000
    const flicker = Math.sin(time * 3 + i * 2) * 0.2 + 0.8
    
    // 火把光晕
    const glowGrad = ctx.createRadialGradient(tx, C.GROUND_Y - 60, 0, tx, C.GROUND_Y - 60, 120 * flicker)
    glowGrad.addColorStop(0, `rgba(255, 150, 50, ${0.15 * flicker})`)
    glowGrad.addColorStop(0.5, `rgba(255, 100, 30, ${0.08 * flicker})`)
    glowGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = glowGrad
    ctx.fillRect(tx - 150, 0, 300, C.GROUND_Y)
    
    // 火把火焰
    ctx.fillStyle = `rgba(255, ${180 * flicker}, 50, ${0.9 * flicker})`
    ctx.beginPath()
    ctx.moveTo(tx - 3, C.GROUND_Y - 85)
    ctx.lineTo(tx + 3, C.GROUND_Y - 85)
    ctx.lineTo(tx + Math.sin(time * 5 + i) * 3, C.GROUND_Y - 65)
    ctx.lineTo(tx, C.GROUND_Y - 60)
    ctx.lineTo(tx - Math.sin(time * 5 + i) * 3, C.GROUND_Y - 65)
    ctx.closePath()
    ctx.fill()
    
    // 火把木柄
    ctx.fillStyle = '#4a2a1a'
    ctx.fillRect(tx - 4, C.GROUND_Y - 60, 8, 25)
    
    // 火把支架
    ctx.fillStyle = '#8a6a4a'
    ctx.fillRect(tx - 8, C.GROUND_Y - 60, 16, 4)
  }
}

function drawPlatforms(
  ctx: CanvasRenderingContext2D,
  platforms: Platform[],
  camX: number,
  theme: ReturnType<typeof getDungeonTheme>,
): void {
  for (const pl of platforms) {
    const sx = pl.x
    if (sx + pl.width < camX - 40 || sx > camX + C.CANVAS_WIDTH + 40) continue

    const h = pl.height || C.PLATFORM_HEIGHT
    const top = pl.y

    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(sx + 4, top + h, pl.width - 8, C.PLATFORM_SHADOW_OFFSET + 2)

    const grad = ctx.createLinearGradient(sx, top, sx, top + h)
    switch (pl.type) {
      case 'wood':
        grad.addColorStop(0, '#8a6a4a')
        grad.addColorStop(1, '#5a4030')
        break
      case 'ruin':
        grad.addColorStop(0, theme.pillarLight)
        grad.addColorStop(1, theme.pillarDark)
        break
      case 'magic':
        grad.addColorStop(0, 'rgba(180, 120, 255, 0.9)')
        grad.addColorStop(1, 'rgba(80, 40, 120, 0.95)')
        break
      case 'float':
        grad.addColorStop(0, theme.groundTop)
        grad.addColorStop(1, theme.groundMid)
        break
      default:
        grad.addColorStop(0, theme.groundTop)
        grad.addColorStop(1, theme.groundBottom)
    }
    ctx.fillStyle = grad
    ctx.fillRect(sx, top, pl.width, h)

    ctx.strokeStyle = theme.groundHighlight
    ctx.lineWidth = 2
    ctx.strokeRect(sx + 0.5, top + 0.5, pl.width - 1, h - 1)

    if (pl.type === 'ruin' || pl.type === 'stone') {
      ctx.strokeStyle = theme.slabStroke
      ctx.lineWidth = 1
      for (let i = 1; i < 4; i++) {
        const lx = sx + (pl.width / 4) * i
        ctx.beginPath()
        ctx.moveTo(lx, top + 2)
        ctx.lineTo(lx, top + h - 2)
        ctx.stroke()
      }
    }
  }
}

/** 屏幕左上角房间名牌（副本名） */
function drawRoomNamePlate(ctx: CanvasRenderingContext2D, roomName: string, camX: number): void {
  const padX = 14
  const padY = 10
  const text = roomName
  ctx.font = 'bold 15px "Microsoft YaHei", sans-serif'
  const tw = ctx.measureText(text).width
  const boxW = tw + padX * 2
  const boxH = 28
  const x = 12
  const y = C.CEILING_Y + 6

  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
  ctx.strokeStyle = 'rgba(255, 215, 120, 0.45)'
  ctx.lineWidth = 1
  roundRect(ctx, x, y, boxW, boxH, 4)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = 'rgba(255, 235, 180, 0.95)'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + padX, y + boxH / 2)

  ctx.strokeStyle = 'rgba(255, 180, 60, 0.25)'
  ctx.beginPath()
  ctx.moveTo(x + 4, y + boxH + 4)
  ctx.lineTo(x + boxW - 4, y + boxH + 4)
  ctx.stroke()
  ctx.restore()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
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

// ============ 近景装饰（少量） ============
function drawNearDecorations(ctx: CanvasRenderingContext2D, room: DungeonRoom, camX: number): void {
  if (!room.decorations || room.decorations.length === 0) return

  const bg = parseHexColor(room.bgColor)
  const nearX = -(camX * PARALLAX_NEAR)
  const time = Date.now() / 1000

  room.decorations.forEach(dec => {
    const dx = dec.x + nearX * 0.3
    if (dx < -60 || dx > C.CANVAS_WIDTH + 60) return

    switch (dec.type) {
      case 'torch': {
        // 火把杆
        ctx.fillStyle = '#5a4a3a'
        ctx.fillRect(dx - 2, dec.y - 35, 4, 40)
        // 火把头
        ctx.fillStyle = '#3a2a1a'
        ctx.fillRect(dx - 5, dec.y - 42, 10, 10)
        // 火焰
        const flicker = Math.sin(time * 8 + dec.x) * 0.2 + 0.8
        ctx.fillStyle = `rgba(255,${Math.floor(150 + flicker * 50)},0,${flicker})`
        ctx.beginPath()
        ctx.moveTo(dx, dec.y - 55)
        ctx.lineTo(dx - 6, dec.y - 40)
        ctx.lineTo(dx + 6, dec.y - 40)
        ctx.closePath()
        ctx.fill()
        // 内焰
        ctx.fillStyle = `rgba(255,${Math.floor(220 + flicker * 35)},100,${flicker * 0.9})`
        ctx.beginPath()
        ctx.moveTo(dx, dec.y - 50)
        ctx.lineTo(dx - 3, dec.y - 42)
        ctx.lineTo(dx + 3, dec.y - 42)
        ctx.closePath()
        ctx.fill()
        // 光晕
        const glow = ctx.createRadialGradient(dx, dec.y - 45, 0, dx, dec.y - 45, 50)
        glow.addColorStop(0, `rgba(255,180,50,${flicker * 0.2})`)
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(dx, dec.y - 45, 50, 0, Math.PI * 2)
        ctx.fill()
        break
      }

      case 'pillar': {
        const ph = 70
        // 阴影
        ctx.fillStyle = darkenColor(bg, 0.5)
        ctx.fillRect(dx - 3, dec.y - ph + 3, 18, ph - 3)
        // 主体
        ctx.fillStyle = darkenColor(bg, 0.32)
        ctx.fillRect(dx - 5, dec.y - ph, 14, ph)
        // 高光
        ctx.fillStyle = darkenColor(bg, 0.16)
        ctx.fillRect(dx - 4, dec.y - ph, 4, ph)
        // 柱头
        ctx.fillStyle = darkenColor(bg, 0.25)
        ctx.fillRect(dx - 9, dec.y - ph - 8, 18, 6)
        break
      }

      case 'chest': {
        // 箱体
        ctx.fillStyle = '#8B6914'
        ctx.fillRect(dx - 14, dec.y - 12, 28, 14)
        // 箱盖
        ctx.fillStyle = '#A07818'
        ctx.fillRect(dx - 15, dec.y - 18, 30, 8)
        // 锁扣
        ctx.fillStyle = '#FFD700'
        ctx.fillRect(dx - 3, dec.y - 14, 6, 6)
        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.2)'
        ctx.fillRect(dx - 13, dec.y - 17, 26, 2)
        break
      }

      case 'barrel': {
        // 桶身
        ctx.fillStyle = '#8B5A2B'
        ctx.fillRect(dx - 10, dec.y - 16, 20, 18)
        // 金属箍
        ctx.fillStyle = '#666'
        ctx.fillRect(dx - 11, dec.y - 12, 22, 3)
        ctx.fillRect(dx - 11, dec.y - 4, 22, 3)
        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.15)'
        ctx.fillRect(dx - 8, dec.y - 15, 4, 16)
        break
      }

      case 'crystal': {
        const cFlicker = Math.sin(time * 3 + dec.x) * 0.15 + 0.85
        ctx.fillStyle = `rgba(100,200,255,${cFlicker})`
        ctx.shadowColor = '#64C8FF'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.moveTo(dx, dec.y - 24)
        ctx.lineTo(dx - 8, dec.y - 4)
        ctx.lineTo(dx + 8, dec.y - 4)
        ctx.closePath()
        ctx.fill()
        // 内核
        ctx.fillStyle = `rgba(200,240,255,${cFlicker})`
        ctx.beginPath()
        ctx.moveTo(dx, dec.y - 18)
        ctx.lineTo(dx - 4, dec.y - 6)
        ctx.lineTo(dx + 4, dec.y - 6)
        ctx.closePath()
        ctx.fill()
        ctx.shadowBlur = 0
        break
      }

      case 'skull': {
        ctx.fillStyle = '#DDD'
        // 头骨
        ctx.beginPath()
        ctx.arc(dx, dec.y - 6, 8, 0, Math.PI * 2)
        ctx.fill()
        // 眼窝
        ctx.fillStyle = '#333'
        ctx.beginPath()
        ctx.arc(dx - 3, dec.y - 7, 2.5, 0, Math.PI * 2)
        ctx.arc(dx + 3, dec.y - 7, 2.5, 0, Math.PI * 2)
        ctx.fill()
        // 牙齿区域
        ctx.fillRect(dx - 4, dec.y - 1, 8, 3)
        break
      }

      case 'statue': {
        // 底座
        ctx.fillStyle = darkenColor(bg, 0.4)
        ctx.fillRect(dx - 12, dec.y - 8, 24, 10)
        // 身体
        ctx.fillStyle = darkenColor(bg, 0.3)
        ctx.fillRect(dx - 8, dec.y - 36, 16, 30)
        // 头部
        ctx.beginPath()
        ctx.arc(dx, dec.y - 42, 8, 0, Math.PI * 2)
        ctx.fill()
        // 高光
        ctx.fillStyle = darkenColor(bg, 0.18)
        ctx.fillRect(dx - 6, dec.y - 35, 4, 28)
        break
      }

      case 'banner': {
        // 旗杆
        ctx.fillStyle = '#666'
        ctx.fillRect(dx - 1, dec.y - 50, 2, 52)
        // 旗帜
        ctx.fillStyle = '#AA2222'
        ctx.beginPath()
        ctx.moveTo(dx + 1, dec.y - 48)
        ctx.lineTo(dx + 22 + Math.sin(time * 2) * 3, dec.y - 38)
        ctx.lineTo(dx + 1, dec.y - 28)
        ctx.closePath()
        ctx.fill()
        // 旗帜图案
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('★', dx + 10, dec.y - 37)
        break
      }

      case 'throne': {
        // 底座
        ctx.fillStyle = '#6a5a4a'
        ctx.fillRect(dx - 18, dec.y - 10, 36, 12)
        // 靠背
        ctx.fillStyle = '#7a6a5a'
        ctx.fillRect(dx - 16, dec.y - 38, 32, 30)
        // 扶手
        ctx.fillStyle = '#8a7a6a'
        ctx.fillRect(dx - 22, dec.y - 32, 8, 24)
        ctx.fillRect(dx + 14, dec.y - 32, 8, 24)
        // 宝石
        ctx.fillStyle = '#FF4444'
        ctx.shadowColor = '#FF4444'
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.arc(dx, dec.y - 28, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        break
      }

      case 'window': {
        // 窗框
        ctx.fillStyle = '#4a3a2a'
        ctx.fillRect(dx - 18, dec.y - 28, 36, 30)
        // 窗内（发光）
        const wGlow = ctx.createRadialGradient(dx, dec.y - 13, 0, dx, dec.y - 13, 14)
        wGlow.addColorStop(0, 'rgba(255,230,150,0.6)')
        wGlow.addColorStop(1, 'rgba(255,180,80,0.2)')
        ctx.fillStyle = wGlow
        ctx.fillRect(dx - 14, dec.y - 24, 28, 22)
        // 窗格
        ctx.strokeStyle = '#4a3a2a'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(dx, dec.y - 24)
        ctx.lineTo(dx, dec.y - 2)
        ctx.moveTo(dx - 14, dec.y - 13)
        ctx.lineTo(dx + 14, dec.y - 13)
        ctx.stroke()
        break
      }

      case 'weapon_rack': {
        // 架子
        ctx.fillStyle = '#5a4a3a'
        ctx.fillRect(dx - 16, dec.y - 6, 32, 8)
        // 武器剪影
        ctx.strokeStyle = '#888'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(dx - 8, dec.y - 6)
        ctx.lineTo(dx - 8, dec.y - 26)
        ctx.lineTo(dx - 2, dec.y - 30)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(dx + 6, dec.y - 6)
        ctx.lineTo(dx + 6, dec.y - 22)
        ctx.stroke()
        break
      }
    }
  })
}

// ============ 障碍物绘制 ============
function drawObstacles(ctx: CanvasRenderingContext2D, obstacles: unknown[], camX: number): void {
  obstacles.forEach(obs => {
    const o = obs as { type: string; x: number; y: number; width: number; height: number; state?: string }
    const dx = o.x - camX * PARALLAX_NEAR
    if (dx < -o.width - 20 || dx > C.CANVAS_WIDTH + 20) return

    switch (o.type) {
      case 'box':
        drawBox(ctx, dx, o.y, o.width, o.height, o.state)
        break
      case 'barricade':
        drawBarricade(ctx, dx, o.y, o.width, o.height)
        break
      case 'breakable_wall':
      case 'hidden_wall':
        drawBreakableWall(ctx, dx, o.y, o.width, o.height, o.state)
        break
      case 'spikes':
        drawSpikes(ctx, dx, o.y, o.width, o.height)
        break
    }
  })
}

function drawBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, state?: string): void {
  const broken = state === 'broken' || state === 'destroyed'
  // 箱体
  ctx.fillStyle = broken ? '#666' : '#B8860B'
  ctx.fillRect(x, y, w, h)
  // 木纹
  ctx.strokeStyle = broken ? '#555' : '#996600'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + 3, y)
  ctx.lineTo(x + 3, y + h)
  ctx.moveTo(x + w - 3, y)
  ctx.lineTo(x + w - 3, y + h)
  ctx.stroke()
  // 高光
  if (!broken) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillRect(x + 1, y + 1, w - 2, 3)
  }
}

function drawBarricade(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = '#5a4a3a'
  ctx.fillRect(x, y, w, h)
  // 木板纹理
  ctx.strokeStyle = '#4a3a2a'
  ctx.lineWidth = 1
  for (let i = 0; i < 4; i++) {
    const bx = x + (w / 4) * i
    ctx.beginPath()
    ctx.moveTo(bx, y)
    ctx.lineTo(bx, y + h)
    ctx.stroke()
  }
  // 钉子
  ctx.fillStyle = '#888'
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.arc(x + 5 + (w / 4) * i, y + 4, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawBreakableWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, state?: string): void {
  const hidden = state === 'hidden'
  if (hidden) {
    // 隐藏墙壁：几乎看不见，只有微妙的裂缝提示
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    ctx.fillRect(x, y, w, h)
    return
  }
  // 可破坏墙
  ctx.fillStyle = '#6a5a5a'
  ctx.fillRect(x, y, w, h)
  // 裂缝
  ctx.strokeStyle = '#4a3a3a'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x + w * 0.3, y)
  ctx.lineTo(x + w * 0.5, y + h * 0.5)
  ctx.lineTo(x + w * 0.35, y + h)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x + w * 0.7, y)
  ctx.lineTo(x + w * 0.55, y + h * 0.4)
  ctx.lineTo(x + w * 0.72, y + h)
  ctx.stroke()
  // 高光边缘
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fillRect(x, y, w, 2)
  ctx.fillRect(x, y, 2, h)
}

function drawSpikes(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const spikeCount = Math.floor(w / 10)
  ctx.fillStyle = '#AAA'
  for (let i = 0; i < spikeCount; i++) {
    const sx = x + i * 10 + 5
    ctx.beginPath()
    ctx.moveTo(sx, y + h)
    ctx.lineTo(sx - 4, y)
    ctx.lineTo(sx + 4, y)
    ctx.closePath()
    ctx.fill()
  }
  // 底座
  ctx.fillStyle = '#777'
  ctx.fillRect(x, y + h - 3, w, 3)
}

// ============ 门绘制 ============
/** DNF 式时空裂缝传送门（清房后激活） */
export function drawDoor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isOpen: boolean,
  camX: number,
): void {
  const screenX = x - camX
  if (screenX < -90 || screenX > C.CANVAS_WIDTH + 90) return

  const time = Date.now() / 1000
  const portalW = 52
  const portalH = 78
  const cx = screenX + portalW / 2 - 8
  const cy = y + portalH / 2

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  if (!isOpen) {
    // 未激活：暗淡符文框
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = 'rgba(80, 70, 60, 0.6)'
    ctx.lineWidth = 2
    ctx.strokeRect(screenX - 6, y - 8, portalW + 4, portalH + 8)
    ctx.fillStyle = 'rgba(30, 28, 25, 0.75)'
    ctx.fillRect(screenX, y, portalW - 8, portalH)
    ctx.fillStyle = 'rgba(100, 90, 80, 0.5)'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('封印', cx, cy)
    ctx.restore()
    return
  }

  const pulse = Math.sin(time * 4) * 0.12 + 0.88
  const spin = time * 2.2

  // 外圈光晕
  const outer = ctx.createRadialGradient(cx, cy, 8, cx, cy, 65 * pulse)
  outer.addColorStop(0, 'rgba(255, 240, 180, 0.35)')
  outer.addColorStop(0.4, 'rgba(255, 200, 80, 0.15)')
  outer.addColorStop(1, 'transparent')
  ctx.fillStyle = outer
  ctx.beginPath()
  ctx.arc(cx, cy, 65 * pulse, 0, Math.PI * 2)
  ctx.fill()

  // 漩涡椭圆（时空裂缝）
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(spin * 0.15)
  for (let ring = 0; ring < 5; ring++) {
    const rx = 22 - ring * 2
    const ry = 34 - ring * 3
    ctx.strokeStyle = ring % 2 === 0 ? `rgba(255, 220, 120, ${0.5 - ring * 0.08})` : `rgba(100, 200, 255, ${0.35 - ring * 0.05})`
    ctx.lineWidth = 3 - ring * 0.4
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, spin + ring * 0.4, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 裂缝核心
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 18)
  core.addColorStop(0, '#FFFFFF')
  core.addColorStop(0.35, '#FFE566')
  core.addColorStop(0.7, 'rgba(255, 150, 50, 0.6)')
  core.addColorStop(1, 'rgba(80, 40, 120, 0.2)')
  ctx.fillStyle = core
  ctx.beginPath()
  ctx.ellipse(0, 0, 14, 22, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // 漂浮粒子
  for (let i = 0; i < 8; i++) {
    const a = spin + (i / 8) * Math.PI * 2
    const dist = 28 + Math.sin(time * 3 + i) * 6
    const px = cx + Math.cos(a) * dist * 0.9
    const py = cy + Math.sin(a) * dist * 1.1
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 200, 0.9)' : 'rgba(150, 220, 255, 0.7)'
    ctx.beginPath()
    ctx.arc(px, py, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // 符文外框
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = `rgba(255, 200, 80, ${0.7 * pulse})`
  ctx.lineWidth = 2
  ctx.strokeRect(screenX - 4, y - 6, portalW, portalH + 4)

  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 8
  ctx.fillText('▶', cx, y - 12)
  ctx.shadowBlur = 0

  ctx.restore()
}

// ============ 颜色工具函数 ============
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function darkenColor(c: { r: number; g: number; b: number }, amount: number): string {
  const r = Math.max(0, Math.floor(c.r * (1 - amount)))
  const g = Math.max(0, Math.floor(c.g * (1 - amount)))
  const b = Math.max(0, Math.floor(c.b * (1 - amount)))
  return `rgb(${r},${g},${b})`
}

function lightenColor(c: { r: number; g: number; b: number }, amount: number): string {
  const r = Math.min(255, Math.floor(c.r + (255 - c.r) * amount))
  const g = Math.min(255, Math.floor(c.g + (255 - c.g) * amount))
  const b = Math.min(255, Math.floor(c.b + (255 - c.b) * amount))
  return `rgb(${r},${g},${b})`
}
