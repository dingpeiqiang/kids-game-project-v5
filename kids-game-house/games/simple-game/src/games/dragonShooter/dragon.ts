// ============================================
// dragonShooter 龙实体逻辑
// ============================================

import type { Dragon, DragonSegment, CustomRoute, PowerUpCardType } from './types'
import { RouteFollower } from './types'
import {
  DRAGON_CONFIGS, LEVEL_CONFIGS, BASE_H, CENTER_X, COLORS,
  POWERUP_ICONS, POWERUP_SEGMENT_CHANCE, POWERUP_SEGMENT_COLORS
} from './constants'
import { easeOutCubic } from './effects'

/** 龙身体节段间距倍率：1.0=紧挨 */
export const DRAGON_SEGMENT_GAP = 1.0

/** 获取龙头位置 */
export function getDragonHeadPosition(dragon: Dragon): { x: number; y: number } | null {
  if (!dragon.alive || dragon.segments.length === 0) return null
  const head = dragon.segments[0]
  return { x: head.x, y: head.y }
}

/** 检查龙是否死亡 */
export function isDragonDead(dragon: Dragon): boolean {
  return !dragon.alive || dragon.segments.length === 0
}

export function lightenColor(color: string, percent: number): string {
  let hex = color.replace('#', '')
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  const num = parseInt(hex, 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt))
  return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1).padStart(6, '0')}`
}

/** 更新单条龙的位置和状态（含身体节段跟随） */
/**
 * 龙移动系统 — 丝滑版 v2
 *
 * 核心设计（修复 kill 后加速 bug）：
 *   - ss.target 由本函数全权管理（推进/回退），不被外部覆盖
 *   - RouteFollower 仅作位置查询工具（getPositionByDistance）
 *   - rf.update() 不再被调用！避免 kill 的回退被覆盖
 *   - _currentDistance / setProgress 仅用于同步（给 isFinished 等检测用）
 *
 *   - _smoothMove.smooth: 平滑后的渲染距离
 *   - _smoothMove.target: 目标距离（逻辑值）
 *   - 每帧：smooth 向 target 插值（前进快/回退慢）
 */

/** 像素速度缓存（createDragon 时计算一次） */
const PIXEL_SPEED_CACHE = new Map<number, number>()

export function getDragonPixelSpeed(dragon: Dragon): number {
  const cached = PIXEL_SPEED_CACHE.get(dragon.id)
  if (cached !== undefined) return cached
  // 与 RouteFollower.update() 相同的计算方式
  const rf = dragon.routeFollower
  const rawSpeed = (rf as any).speed ?? 8
  const avgPointDistance = 5
  const pixelSpeed = rawSpeed * avgPointDistance
  PIXEL_SPEED_CACHE.set(dragon.id, pixelSpeed)
  return pixelSpeed
}

/** 获取/初始化龙的平滑距离缓存 */
function getSmoothState(dragon: Dragon): { smooth: number; target: number; retractSpeed: number } {
  const key = '_smoothMove' as string
  if (!(dragon as any)[key]) {
    let initDist = 0
    try { initDist = (dragon.routeFollower as any)._currentDistance ?? 0 } catch {}
    ;(dragon as any)[key] = {
      smooth: initDist,
      target: initDist,
      retractSpeed: 8
    }
  }
  return (dragon as any)[key]
}

export function updateDragon(dragon: Dragon, dt: number): void {
  if (!dragon.alive || dragon.segments.length === 0) return

  // 减速状态
  if (dragon.slowTimer > 0) {
    dragon.slowTimer -= dt
    dragon.slowed = true
  } else {
    dragon.slowed = false
  }

  const head = dragon.segments[0]
  const rf = dragon.routeFollower
  const ss = getSmoothState(dragon)
  const pixelLen = rf.getPixelLength()
  const pixelSpeed = getDragonPixelSpeed(dragon)

  // === 1. 目标距离推进（由本函数全权控制，不调用 rf.update）===
  if (!dragon.isRetracting) {
    const speedMult = dragon.slowed ? 0.5 : 1
    // 自己推进目标距离，不再依赖 rf.update()
    ss.target = Math.min(pixelLen, ss.target + pixelSpeed * dt * speedMult)

    // 同步 RouteFollower 内部状态（供 isFinished/getProgress 等使用）
    ;(rf as any)._currentDistance = ss.target
    if (pixelLen > 0) {
      rf.setProgress(ss.target / pixelLen)
    }

    // 龙头位置直接从 target 获取
    const headPos = rf.getPositionByDistance(ss.target)
    if (headPos) {
      head.x = headPos.x
      head.y = headPos.y
    }
    dragon.progress = rf.getProgress()
  }

  // 回缩动画模式（isRetracting 由外部如 killDragonSegment 设置）
  if (dragon.isRetracting) {
    if (!(dragon as any)._retractStartTime) {
      ;(dragon as any)._retractStartTime = performance.now()
      ;(dragon as any)._retractDuration = 500
    }
    const elapsed = performance.now() - (dragon as any)._retractStartTime
    const t = Math.min(elapsed / (dragon as any)._retractDuration, 1)
    const p = easeOutCubic(t)
    const newProg = dragon.retractStartProgress + (dragon.retractTargetProgress - dragon.retractStartProgress) * p
    dragon.progress = newProg
    rf.setProgress(newProg)
    ss.target = newProg * pixelLen
    ;(rf as any)._currentDistance = ss.target

    const rp = rf.getPositionByDistance(ss.target)
    if (rp) { head.x = rp.x; head.y = rp.y }
  }

  // === 2. 平滑插值：smooth → target ===
  // 前进时：smooth 快速追上 target（几乎无延迟感）
  // 回退时：smooth 缓慢退回（丝滑倒退效果）
  const distDiff = ss.target - ss.smooth

  if (Math.abs(distDiff) > 0.5) {
    if (distDiff > 0) {
      // 前进：快速跟随
      ss.smooth += distDiff * Math.min(1, dt * 20)
    } else {
      // 回退：慢速丝滑（比前进慢 ~40%，产生"被拉回"的质感）
      const retractRate = ss.retractSpeed * 60 * dt
      ss.smooth -= Math.min(Math.abs(distDiff), retractRate)
    }
  } else {
    ss.smooth = ss.target
  }

  // 边界保护
  ss.smooth = Math.max(0, Math.min(ss.smooth, pixelLen))

  // === 3. 用平滑距离计算所有节段位置 ===
  const smoothDist = ss.smooth

  for (let i = 0; i < dragon.segments.length; i++) {
    const seg = dragon.segments[i]
    const gapPixels = seg.size * 2 * DRAGON_SEGMENT_GAP
    const segDist = Math.max(0, smoothDist - i * gapPixels)
    const bodyPos = rf.getPositionByDistance(segDist)

    if (bodyPos) {
      if (i === 0 && !dragon.isRetracting) {
        // 龙头：前进时已经通过上面设置了精确位置，这里只做微调
        seg.x += (bodyPos.x - seg.x) * 0.3
        seg.y += (bodyPos.y - seg.y) * 0.3
      } else {
        // 身体节段 / 回退时的龙头：使用中等平滑度
        seg.x += (bodyPos.x - seg.x) * 0.25
        seg.y += (bodyPos.y - seg.y) * 0.25
      }
    }

    // 微量摇摆
    seg.wobblePhase += seg.wobbleFreq
    seg.x += Math.sin(seg.wobblePhase) * seg.wobbleAmp * 0.06
    seg.y += Math.cos(seg.wobblePhase * 0.7) * seg.wobbleAmp * 0.04
  }
}

// 创建龙（由 spawnDragons 调用，传入路线和关卡）
export function createDragon(x: number, type: keyof typeof DRAGON_CONFIGS, route: CustomRoute, level: number): Dragon {
  const config = DRAGON_CONFIGS[type]
  if (!config) {
    console.error(`❌ 未知的龙类型: ${type}`)
    throw new Error(`Unknown dragon type: ${type}`)
  }

  // 获取关卡配置：节数由 LEVEL_CONFIGS 决定（替代 DRAGON_CONFIGS 的固定节数）
  const lvlIdx = Math.min(Math.max(0, level - 1), LEVEL_CONFIGS.length - 1)
  const lvlCfg = LEVEL_CONFIGS[lvlIdx]
  // elite/boss 使用更多节数，普通龙使用 baseSegments
  const segmentCount = (type === 'elite' || type === 'boss')
    ? Math.floor(lvlCfg.baseSegments * 1.5)
    : lvlCfg.baseSegments

  const segments: DragonSegment[] = []

  const powerUpTypes = Object.keys(POWERUP_ICONS) as Array<keyof typeof POWERUP_ICONS>

  // 固定附加的道具节段数量（稀有，由类型决定）
  let fixedAttachCount = 0
  if (type === 'boss') fixedAttachCount = 3
  else if (type === 'elite') fixedAttachCount = 2
  else if (type === 'large' || type === 'medium') fixedAttachCount = 1
  else if (level >= 3) fixedAttachCount = 1

  const attachedIndices = new Set<number>()
  for (let i = 0; i < fixedAttachCount; i++) {
    const maxIdx = Math.min(segmentCount - 2, 20)
    const idx = Math.floor(Math.random() * (maxIdx - 3)) + 3
    attachedIndices.add(idx)
  }

  // 随机道具节段（根据概率）
  for (let i = 3; i < segmentCount - 1; i++) {
    if (attachedIndices.has(i)) continue  // 已被固定占用
    if (Math.random() < POWERUP_SEGMENT_CHANCE) {
      attachedIndices.add(i)
    }
  }

  for (let i = 0; i < segmentCount; i++) {
    const hpMult = i === 0 ? 1.5 : 1
    const hpRandom = 0.7 + Math.random() * 0.6
    // HP = 基础HP × 关卡倍率(lvlCfg.hpMult) × 龙头加成 × 随机浮动
    const hp = Math.max(1, Math.floor(config.hp * hpMult * hpRandom * lvlCfg.hpMult))
    const size = config.size

    let attachedPowerUp: PowerUpCardType | undefined
    let segColor = i === 0 ? lightenColor(config.color, 25) : config.color

    if (attachedIndices.has(i)) {
      attachedPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)] as PowerUpCardType
      // 道具节段使用特殊颜色
      segColor = POWERUP_SEGMENT_COLORS[attachedPowerUp].color
    }

    segments.push({
      x: x,
      y: -50,
      size: size,
      color: segColor,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 6 + Math.random() * 6,
      wobbleFreq: 0.002,
      isHead: i === 0,
      hasHorn: type === 'elite' || type === 'boss',
      hasPattern: type === 'elite' || type === 'boss',
      attachedPowerUp,
      hp: hp,
      maxHp: hp
    })
  }

  // 使用传入的路线创建 RouteFollower
  const routeLength = route.points.length
  const targetDuration = 60
  const baseSpeed = routeLength / targetDuration
  // 速度 = 基础速度 × 关卡速度倍率
  const finalSpeed = baseSpeed * lvlCfg.speedMult

  const routeFollower = new RouteFollower(route, finalSpeed)

  // 缓存像素速度
  const avgPointDistance = 5
  const cachedPixelSpeed = finalSpeed * avgPointDistance

  const startPos = route.points[0]
  if (startPos) {
    for (const seg of segments) {
      seg.x = startPos.x
      seg.y = startPos.y
    }
  }

  const dragonObj: Dragon = {
    id: 0, // 由调用方设置
    segments,
    alive: true,
    type,
    speed: 0,
    slowed: false,
    slowTimer: 0,
    routeFollower,
    progress: 0,
    spawnX: x,
    retracting: false,
    retractTimer: 0,
    totalSegments: segmentCount,
    isRetracting: false,
    retractAnimProgress: 0,
    retractStartProgress: 0,
    retractTargetProgress: 0,
    burnTimer: 0,
    burnDamage: 0,
    poisonStacks: 0,
    poisonTimer: 0
  }

  // 注册像素速度缓存
  PIXEL_SPEED_CACHE.set(dragonObj.id, cachedPixelSpeed)

  return dragonObj
}

// 此文件仅导出:
//   createDragon, updateDragon, killDragonSegment, getDragonHeadPosition,
//   getDragonPixelSpeed, isDragonDead, lightenColor, DRAGON_SEGMENT_GAP
// spawnDragons / updateDragons 在 gameState.ts 中

/**
 * 击杀身体节段（核心祖玛机制 — 丝滑版）
 * 
 * 流程：
 *   1. 记录被杀节段的尺寸
 *   2. 从数组中移除该节段  
 *   3. 设置平滑目标距离为「当前 - 回退量」（平滑系统自动丝滑动画）
 *   4. 同步 RouteFollower 内部状态（保持碰撞检测一致）
 *   5. 如果只剩龙头 → 整条龙死亡
 */
export function killDragonSegment(dragon: Dragon, segIdx: number): void {
  if (!dragon.alive) return
  if (segIdx <= 0 || segIdx >= dragon.segments.length) return

  const seg = dragon.segments[segIdx]
  if (!seg || seg.isHead) return

  const rf = dragon.routeFollower
  const ss = getSmoothState(dragon)

  // 1. 记录回退量
  const retractPixels = seg.size * 2 * DRAGON_SEGMENT_GAP

  // 2. 移除节段
  dragon.segments.splice(segIdx, 1)

  // 3. 设置新的目标距离（平滑系统会在后续帧中自动丝滑过渡）
  ss.target = Math.max(0, ss.target - retractPixels)

  // 4. 同步 RouteFollower 内部状态（碰撞/终点检测需要一致）
  ;(rf as any)._currentDistance = ss.target
  const pixelLen = rf.getPixelLength()
  if (pixelLen > 0) {
    rf.setProgress(ss.target / pixelLen)
  }

  console.log(`💀 节段 #${segIdx} 死亡, 回退 ${retractPixels.toFixed(0)}px, 平滑过渡中...`)

  // 5. 检查是否整条龙死亡
  if (dragon.segments.length <= 1) {
    dragon.alive = false
    console.log(`🎉 龙 #${dragon.id} 完全消灭!`)
  }
}

// 碰撞检测与子弹处理