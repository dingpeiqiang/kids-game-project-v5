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

// 🎯 新增：色相偏移函数，用于根据路线索引调整龙的颜色
export function shiftHue(color: string, degrees: number): string {
  let hex = color.replace('#', '')
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  
  // RGB 转 HSL
  let r = parseInt(hex.substring(0, 2), 16) / 255
  let g = parseInt(hex.substring(2, 4), 16) / 255
  let b = parseInt(hex.substring(4, 6), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  const l = (max + min) / 2
  let s = 0
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  
  // 色相偏移
  h = (h + degrees / 360) % 1
  if (h < 0) h += 1
  
  // HSL 转 RGB
  let newR, newG, newB
  
  if (s === 0) {
    newR = newG = newB = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    newR = hue2rgb(p, q, h + 1/3)
    newG = hue2rgb(p, q, h)
    newB = hue2rgb(p, q, h - 1/3)
  }
  
  // 转回十六进制
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
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

  // === 动态加速机制：每5秒判断一次，当龙身可见比例<50%时触发1.5s加速 ===
  let speedBoost = 1.0  // 默认速度倍率

  // 初始化检查间隔计时器
  if (dragon._boostCheckInterval === undefined) {
    dragon._boostCheckInterval = 0
  }

  if (dragon._isBoosting) {
    // 正在加速中
    dragon._boostTimer! -= dt
    speedBoost = 2.0
    if (dragon._boostTimer! <= 0) {
      dragon._isBoosting = false
      dragon._boostTimer = 0
    }
  } else {
    // 未在加速，每帧倒计时检查间隔
    dragon._boostCheckInterval -= dt
    if (dragon._boostCheckInterval <= 0) {
      dragon._boostCheckInterval = 5.0  // 下次检查：5秒后

      // 计算龙身可见比例：龙总长 = segments.length × 节段间距(像素)
      // 可见长度 = head.progress × 路线总长
      // 但更直观：progress 表示头走了路线全长的百分比
      // 龙身可见比例 ≈ max(0, 1 - totalLengthInRoutePixels / (headProgress × routePixelLength))
      // 简化：用 head.progress 作为主要指标（头走到哪，尾还在后面）
      // visibleRatio = head.progress（头已走的路程 / 路线全长），即龙身可见百分比
      const visibleRatio = Math.min(1, Math.max(0, dragon.progress))
      const hiddenRatio = 1 - visibleRatio

      if (hiddenRatio > 0.5 && !dragon.slowed) {
        dragon._isBoosting = true
        dragon._boostTimer = 1.5
        speedBoost = 2.0
      }
    }
  }

  // === 1. 目标距离推进（由本函数全权控制，不调用 rf.update）===
  if (!dragon.isRetracting) {
    const speedMult = dragon.slowed ? 0.5 : speedBoost
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
export function createDragon(x: number, type: keyof typeof DRAGON_CONFIGS, route: CustomRoute, level: number, routeIndex?: number): Dragon {
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
  
  // 🎯 关键优化：确保龙头附近（前10个节段内）至少有一个道具
  // 这样玩家在游戏早期就能获得道具，提升游戏体验
  if (segmentCount > 10 && fixedAttachCount > 0) {
    // 在龙头附近（第3-8个节段）放置第一个道具
    const nearHeadIndex = Math.floor(Math.random() * 6) + 3  // 3-8之间
    attachedIndices.add(nearHeadIndex)
    console.log(`🎁 龙头附近道具: 节段 #${nearHeadIndex}`)
  }
  
  // 剩余的固定道具随机分布
  for (let i = attachedIndices.size; i < fixedAttachCount; i++) {
    const maxIdx = Math.min(segmentCount - 2, 20)
    let idx: number
    do {
      idx = Math.floor(Math.random() * (maxIdx - 3)) + 3
    } while (attachedIndices.has(idx))  // 避免重复
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
    
    // 🎯 关键修复：根据路线索引调整颜色，让不同路线的龙显示不同颜色
    let baseColor = config.color
    if (routeIndex !== undefined && routeIndex > 0) {
      // 路线0使用原始颜色，路线1+使用调整后的颜色
      const hueShift = routeIndex * 60  // 每条路线色相偏移60度
      baseColor = shiftHue(config.color, hueShift)
    }
    
    let segColor = i === 0 ? lightenColor(baseColor, 25) : baseColor

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
    // 同步 RouteFollower 的初始距离为 0（与节的初始位置一致）
    // 这样龙会从路线起点开始移动
    ;(routeFollower as any)._currentDistance = 0
    routeFollower.setProgress(0)
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
    // 🎯 保存路线索引，用于渲染时区分不同路线的龙
    routeIndex,
    burnTimer: 0,
    burnDamage: 0,
    poisonStacks: 0,
    poisonTimer: 0,
    // 初始化加速状态
    _boostTimer: 0,
    _boostCheckInterval: 0,  // 首次立即检查
    _isBoosting: false
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