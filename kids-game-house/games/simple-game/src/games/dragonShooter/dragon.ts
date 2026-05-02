// ============================================
// dragonShooter 龙实体逻辑
// ============================================

import type { Dragon, DragonSegment, GameState, CustomRoute } from './types'
import { RouteFollower } from './types'
import {
  DRAGON_CONFIGS,
  POWERUP_ICONS,
  BASE_W,
  BASE_H,
  CENTER_X,
  COLORS
} from './constants'
import { getRouteForDragon } from './routes'
import { easeOutCubic } from './effects'

/** 龙身体节段间距倍率：1.0=紧挨（圆心距≈直径），>1=有间隙，<1=微重叠 */
export const DRAGON_SEGMENT_GAP = 1.0

// 颜色变亮工具
/** 获取龙头位置（第一个节段） */
export function getDragonHeadPosition(dragon: Dragon): { x: number; y: number } | null {
  if (!dragon.alive || dragon.segments.length === 0) return null
  const head = dragon.segments[0]
  return { x: head.x, y: head.y }
}

/** 检查龙是否已死亡 */
export function isDragonDead(dragon: Dragon): boolean {
  return !dragon.alive || dragon.segments.length === 0
}

export function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, (num >> 16) + amt)
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt)
  const B = Math.min(255, (num & 0x0000FF) + amt)
  return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`
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
  const segments: DragonSegment[] = []

  const powerUpTypes = Object.keys(POWERUP_ICONS) as Array<keyof typeof POWERUP_ICONS>

  let attachCount = 0
  if (type === 'boss') attachCount = 3
  else if (type === 'elite') attachCount = 2
  else if (type === 'large') attachCount = 1
  else if (type === 'medium') attachCount = 1
  else if (level >= 3) attachCount = 1

  const attachedIndices = new Set<number>()
  for (let i = 0; i < attachCount; i++) {
    const maxIdx = Math.min(config.segments - 2, 20)
    const idx = Math.floor(Math.random() * (maxIdx - 3)) + 3
    attachedIndices.add(idx)
  }

  for (let i = 0; i < config.segments; i++) {
    const hpMult = i === 0 ? 1.5 : 1
    const hpRandom = 0.7 + Math.random() * 0.6
    const hp = Math.max(1, Math.floor(config.hp * hpMult * hpRandom * (1 + level * 0.03)))
    const size = config.size

    let attachedPowerUp: keyof typeof POWERUP_ICONS | undefined
    if (attachedIndices.has(i)) {
      attachedPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
    }

    segments.push({
      x: x,
      y: -50,
      size: size,
      color: i === 0 ? lightenColor(config.color, 25) : config.color,
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
  const speedMultiplier = 1 + (level - 1) * 0.05
  const finalSpeed = baseSpeed * speedMultiplier

  const routeFollower = new RouteFollower(route, finalSpeed)

  // 缓存像素速度（updateDragon 不再调用 rf.update，需自行管理推进）
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
    totalSegments: config.segments,
    isRetracting: false,
    retractAnimProgress: 0,
    retractStartProgress: 0,
    retractTargetProgress: 0
  }

  // 注册像素速度缓存
  PIXEL_SPEED_CACHE.set(dragonObj.id, cachedPixelSpeed)

  return dragonObj
}

// 注意：spawnDragons 的主实现在 gameState.ts 中（需要 routeLoader）
// 此文件不再导出独立的 spawnDragons，避免签名冲突

// 分裂龙
export function splitDragon(state: GameState, dragon: Dragon, splitIdx: number) {
  const config = DRAGON_CONFIGS[dragon.type]
  if (!config.canSplit) return

  const backSegs = dragon.segments.slice(splitIdx + 1)
  if (backSegs.length < 2) return

  const splitCount = 2 + Math.floor(Math.random() * 2)
  const perSplit = Math.floor(backSegs.length / splitCount)

  for (let i = 0; i < splitCount; i++) {
    const start = i * perSplit
    const end = Math.min(start + perSplit, backSegs.length)
    if (end - start < 2) continue

    const newSegs = backSegs.slice(start, end)
    const newType = newSegs.length >= 5 ? 'medium' : 'small'
    const newConfig = DRAGON_CONFIGS[newType]

    const newDragonId = ++state.lastDragonId
    const newRoute = getRouteForDragon(newDragonId, state.level)

    const routeLength = newRoute.points.length
    const targetDuration = 60
    const baseSpeed = routeLength / targetDuration
    const speedMultiplier = 1 + (state.level - 1) * 0.05
    const finalSpeed = baseSpeed * speedMultiplier

    const newRouteFollower = new RouteFollower(newRoute, finalSpeed)

    const newDragon: Dragon = {
      id: newDragonId,
      segments: newSegs.map((seg, idx) => ({
        ...seg,
        x: seg.x + (Math.random() - 0.5) * 35,
        y: seg.y,
        isHead: idx === 0,
        size: newConfig.size * (1 - idx * 0.04),
        hp: Math.max(1, Math.floor(newConfig.hp * (1 + state.level * 0.08))),
        maxHp: Math.max(1, Math.floor(newConfig.hp * (1 + state.level * 0.08)))
      })),
      alive: true,
      type: newType,
      speed: dragon.speed,
      slowed: false,
      slowTimer: 0,
      routeFollower: newRouteFollower,
      progress: 0,
      spawnX: newSegs[0]?.x || dragon.spawnX,
      retracting: false,
      retractTimer: 0,
      totalSegments: newSegs.length,
      isRetracting: false,
      retractAnimProgress: 0,
      retractStartProgress: 0,
      retractTargetProgress: 0
    }

    state.dragons.push(newDragon)
  }

  dragon.segments = dragon.segments.slice(0, splitIdx)
}

// 更新龙
export function updateDragons(
  state: GameState,
  dt: number,
  createExplosion: (x: number, y: number, color: string, size: number) => void,
  createHitEffect: (x: number, y: number, color: string) => void,
  createHitFlash: (seg: DragonSegment) => void,
  audioService: { click: () => void; win: () => void },
  engine: { addScore: (score: number, x: number, y: number) => void }
) {
  for (let i = state.dragons.length - 1; i >= 0; i--) {
    const dragon = state.dragons[i]
    if (!dragon.alive) {
      state.dragons.splice(i, 1)
      continue
    }

    // 更新减速状态
    if (dragon.slowTimer > 0) {
      dragon.slowTimer -= dt
      dragon.slowed = true
    } else {
      dragon.slowed = false
    }

    const speedMult = dragon.slowed ? 0.5 : 1
    const head = dragon.segments[0]
    const routeLen = dragon.routeFollower.getTotalLength()

    const oldX = head.x
    const oldY = head.y
    const oldProgress = dragon.progress

    const follower = dragon.routeFollower
    let pos = null

    if (!dragon.isRetracting) {
      pos = follower.update(dt * speedMult)

      if (pos) {
        head.x = pos.x
        head.y = pos.y
      }

      dragon.progress = follower.getProgress()
    }

    const moveDist = Math.sqrt(Math.pow(head.x - oldX, 2) + Math.pow(head.y - oldY, 2))
    const progressDelta = (dragon.progress - oldProgress) * routeLen

    if (!(state as any)._frameCount) (state as any)._frameCount = 0
    ;(state as any)._frameCount++

    if ((state as any)._frameCount % 60 === 0) {
      console.log('🐉 龙头移动:', {
        frame: (state as any)._frameCount,
        dt: dt.toFixed(3),
        speedMult,
        isRetracting: dragon.isRetracting
      })
    }

    // 检查是否到达终点
    if (follower.isFinished()) {
      if (dragon.type === 'boss' || dragon.segments.length > 15) {
        return 'gameover'
      }
      dragon.alive = false
      continue
    }

    // 根据龙的大小计算身体节之间的像素间距
    const config = DRAGON_CONFIGS[dragon.type]
    const baseSize = config.size
    const pixelSpacing = baseSize * 1.8

    // 获取龙头当前的总距离（像素）
    let headDistance = (dragon.routeFollower as any)._currentDistance || 0

    // 更新龙头进度（回缩动画）
    if (dragon.isRetracting) {
      if (!(dragon as any)._retractStartTime) {
        ;(dragon as any)._retractStartTime = performance.now()
        ;(dragon as any)._retractDuration = 500
      }

      const elapsed = performance.now() - (dragon as any)._retractStartTime
      const t = Math.min(elapsed / (dragon as any)._retractDuration, 1)
      const p = easeOutCubic(t)

      const newProgress = dragon.retractStartProgress + (dragon.retractTargetProgress - dragon.retractStartProgress) * p
      dragon.progress = newProgress

      dragon.routeFollower.setProgress(newProgress)

      const routeLength = dragon.routeFollower.getTotalLength()
      ;(dragon.routeFollower as any)._currentDistance = newProgress * routeLength

      const headPos = dragon.routeFollower.getPositionAt(newProgress)
      if (headPos) {
        head.x = headPos.x
        head.y = headPos.y
      }

      // 动画结束
      if (t >= 1) {
        dragon.progress = dragon.retractTargetProgress
        dragon.routeFollower.setProgress(dragon.retractTargetProgress)
        ;(dragon.routeFollower as any)._currentDistance = dragon.retractTargetProgress * routeLength
        dragon.isRetracting = false
        ;(dragon as any)._retractStartTime = undefined

        ;(dragon as any)._justRetracted = true

        for (let j = 1; j < dragon.segments.length; j++) {
          const seg = dragon.segments[j]
          const segDistance = dragon.retractTargetProgress * routeLength - j * pixelSpacing
          if (segDistance >= 0) {
            const pos = dragon.routeFollower.getPositionByDistance(segDistance)
            if (pos) {
              seg.x = pos.x
              seg.y = pos.y
            }
          }
        }
      }
    } else {
      // 正常更新逻辑（非回缩状态）
      const follower = dragon.routeFollower
      const pos = follower.update(dt * speedMult)

      if (pos) {
        head.x = pos.x
        head.y = pos.y
      }

      dragon.progress = follower.getProgress()
    }

    // 更新身体节位置
    if (true) {
      for (let j = 1; j < dragon.segments.length; j++) {
        const seg = dragon.segments[j]
        const segDistance = headDistance - j * pixelSpacing

        if (segDistance >= 0) {
          const pos = dragon.routeFollower.getPositionByDistance(segDistance)
          if (pos) {
            const smoothFactor = 1 - Math.exp(-12 * dt)
            seg.x += (pos.x - seg.x) * smoothFactor
            seg.y += (pos.y - seg.y) * smoothFactor
          }
        } else {
          const startPos = (dragon.routeFollower as any).route.points[0]
          if (startPos) {
            const smoothFactor = 1 - Math.exp(-12 * dt)
            seg.x += (startPos.x - seg.x) * smoothFactor
            seg.y += (startPos.y - seg.y) * smoothFactor
          }
        }
      }
    }

    // 碰撞检测
    const playerY = BASE_H - 55
    for (const seg of dragon.segments) {
      const dist = Math.sqrt(
        Math.pow(seg.x - state.playerX, 2) +
        Math.pow(seg.y - playerY, 2)
      )
      if (dist < seg.size + 20) {
        if (state.invincibleTimer <= 0) {
          state.playerHP--
          state.invincibleTimer = 1.5
          createExplosion(state.playerX, playerY, COLORS.accent, 15)

          if (state.playerHP <= 0) {
            return 'gameover'
          }
        }
        break
      }
    }
  }

  // 检查龙头是否到达底部
  for (const dragon of state.dragons) {
    if (dragon.alive && dragon.segments.length > 0) {
      const head = dragon.segments[0]
      if (head.y >= BASE_H - head.size) {
        return 'gameover'
      }
    }
  }

  return null
}

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