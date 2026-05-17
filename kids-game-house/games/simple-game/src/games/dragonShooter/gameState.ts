// ============================================
// dragonShooter 游戏状态管理 & 核心循环
// ============================================

import type {
  GameState, Dragon, Bullet, Particle, PowerUp, FloatText,
  CoinDrop, Cloud, Dust, CustomRoute, PowerUpSelectState, PowerUpCard, ActiveBuff
} from './types'
import type { RouteEditor } from './routes'
import { audioService } from '../../services/audio'
import {
  BASE_W, BASE_H, CANVAS_W, CANVAS_H, CANVAS_OFFSET_X,
  COLORS, SCENES, DRAGON_CONFIGS, POWERUP_ICONS, BUFF_OPTIONS,
  LEVEL_CONFIGS,
  MAX_PARTICLES, MAX_POWERUPS, MAX_COIN_DROPS, MAX_FLOAT_TEXTS, MAX_BULLETS,
  STORAGE_KEY
} from './constants'
import { lightenColor, triggerScreenWave, createRingWave, createEnergyBurst, createFireEffect, createFreezeEffect, createToxinCloud, createSlashWave, createCritEffect, createDefDownEffect } from './effects'
import {
  createDragon as _createDragon,
  updateDragon,
  killDragonSegment,
  isDragonDead,
  getDragonHeadPosition,
  DRAGON_SEGMENT_GAP
} from './dragon'
import { routeLoader } from './routeLoader'

// 对象池 - 用于减少垃圾回收压力
const particlePool: Particle[] = []
const bulletPool: Bullet[] = []
const floatTextPool: FloatText[] = []
const coinDropPool: CoinDrop[] = []

/**
 * 从对象池获取粒子对象
 */
function getParticleFromPool(): Particle {
  if (particlePool.length > 0) {
    const p = particlePool.pop()!
    // 重置属性
    p.vx = 0
    p.vy = 0
    p.life = 0
    p.maxLife = 0
    p.size = 0
    p.color = '#FFFFFF'
    return p
  }
  return {
    x: 0, y: 0,
    vx: 0, vy: 0,
    life: 0, maxLife: 0,
    size: 0, color: '#FFFFFF'
  }
}

/**
 * 回收粒子对象到对象池
 */
function recycleParticle(particle: Particle): void {
  if (particlePool.length < 100) { // 限制池大小
    particlePool.push(particle)
  }
}

/**
 * 从对象池获取子弹对象
 */
function getBulletFromPool(): Bullet {
  if (bulletPool.length > 0) {
    const b = bulletPool.pop()!
    // 重置属性
    b.vx = 0
    b.vy = 0
    b.damage = 0
    b.pierce = 0
    b.size = 0
    return b
  }
  return {
    x: 0, y: 0,
    vx: 0, vy: 0,
    damage: 0, pierce: 0, size: 0
  }
}

/**
 * 回收子弹对象到对象池
 */
function recycleBullet(bullet: Bullet): void {
  if (bulletPool.length < 50) { // 限制池大小
    bulletPool.push(bullet)
  }
}

/**
 * 从对象池获取浮动文字对象
 */
function getFloatTextFromPool(): FloatText {
  if (floatTextPool.length > 0) {
    const ft = floatTextPool.pop()!
    // 重置属性
    ft.text = ''
    ft.color = '#FFFFFF'
    ft.life = 0
    ft.vy = 0
    ft.size = 0
    return ft
  }
  return {
    x: 0, y: 0,
    text: '', color: '#FFFFFF',
    life: 0, vy: 0, size: 0
  }
}

/**
 * 回收浮动文字对象到对象池
 */
function recycleFloatText(ft: FloatText): void {
  if (floatTextPool.length < 50) { // 限制池大小
    floatTextPool.push(ft)
  }
}

/**
 * 从对象池获取金币掉落对象
 */
function getCoinDropFromPool(): CoinDrop {
  if (coinDropPool.length > 0) {
    const c = coinDropPool.pop()!
    // 重置属性
    c.vy = 0
    c.life = 0
    return c
  }
  return {
    x: 0, y: 0,
    vy: 0, life: 0
  }
}

/**
 * 回收金币掉落对象到对象池
 */
function recycleCoinDrop(coin: CoinDrop): void {
  if (coinDropPool.length < 30) { // 限制池大小
    coinDropPool.push(coin)
  }
}

/**
 * 创建初始游戏状态
 */
export function createInitialState(): GameState {
  return {
    mode: 'challenge',
    phase: 'start',
    level: 1,
    score: 0,
    coins: 0,
    combo: 0,
    comboTimer: 0,
    maxCombo: 0,
    totalKills: 0,
    timeLeft: 300,
    playerX: BASE_W / 2,
    playerY: BASE_H - 55,      // 默认在底部
    playerStartX: BASE_W / 2,  // 玩家初始位置X
    playerStartY: BASE_H - 55, // 玩家初始位置Y
    shootAngle: -Math.PI / 2,  // 默认向上射击
    canMove: true,             // 默认可以移动
    isSelected: true,          // 默认选中（可移动）
    playerHP: 3,
    playerMaxHP: 3,
    invincibleTimer: 0,
    freezeTimer: 0,
    shieldTimer: 0,
    slowAllTimer: 0,
    bigShotTimer: 0,
    bulletDamage: 15,  // 🎯 提升基础伤害（原10），更快击杀
    bulletSpeed: 8,    // 🎯 提升子弹速度（原7），更流畅
    shootCooldown: 350, // 🎯 降低冷却时间（原450），射速更快
    bulletCount: 1,
    bulletPierce: 0,
    lastShotTime: 0,
    dragons: [],
    bullets: [],
    particles: [],
    powerUps: [],
    floatTexts: [],
    coinDrops: [],
    clouds: [],
    dusts: [],
    lastDragonId: 0,
    levelProgress: 0,
    levelTarget: 3,
    dragonsSpawnedInLevel: 0,  // 本关已生成的龙总数
    // 关卡过渡状态
    levelTransition: false,
    levelTransitionTimer: 0,
    currentScene: 0,
    isPaused: false,
    touch: { active: false, startX: 0, startY: 0, currentX: 0, startTime: 0 },
    dragCount: 0,
    maxDragons: 1,
    isRouteEditMode: false,
    isRouteSelectMode: false,
    // 20道具的 stack 字段初始化
    rapidFireStacks: 0, multiShotStacks: 0, armorPierceStacks: 0,
    heavyHitStacks: 0, rapidBurstStacks: 0, autoAimStacks: 0,
    blastStacks: 0, slashStacks: 0, ringWaveStacks: 0, windPressureStacks: 0,
    chainBlastStacks: 0, splashStacks: 0,
    burnStacks: 0, slowFieldStacks: 0, toxinStacks: 0,
    energyFieldStacks: 0, defDownStacks: 0,
    slashBladeStacks: 0, executeWaveStacks: 0, critStacks: 0,
    // 一次性/状态型
    bigShotStacks: 0, lightningStacks: 0, slowBulletStacks: 0,
    bombReady: false, bombDamageStacks: 0,
    // 漏掉的字段
    slowBulletTimer: 0,
    powerupSelect: null,
    activeBuffs: [],
    // 🎯 屏幕震动效果初始化
    screenShake: {
      intensity: 0,
      duration: 0,
      cooldown: 0  // 🎯 初始无冷却
    },
    screenFlash: {
      color: '#FFFFFF',
      alpha: 0,
      duration: 0
    },
    // 🎯 道具加持特效初始化
    powerupEffects: {
      flashAlpha: 0,
      flashColor: '#FFFFFF',
      rings: []
    }
  }
}

/**
 * 初始化云朵和尘埃背景
 */
export function initClouds(state: GameState) {
  state.clouds = []
  state.dusts = []
  for (let i = 0; i < 12; i++) {
    state.clouds.push({
      x: Math.random() * BASE_W,
      y: Math.random() * BASE_H,
      speed: 0.15 + Math.random() * 0.25,
      size: 25 + Math.random() * 45,
      opacity: 0.3 + Math.random() * 0.3
    })
  }
  for (let i = 0; i < 5; i++) {
    state.dusts.push({
      x: Math.random() * BASE_W,
      y: Math.random() * BASE_H,
      speed: 0.03 + Math.random() * 0.05,
      size: 2 + Math.random() * 2
    })
  }
}

/**
 * 更新云朵和尘埃动画
 */
export function updateClouds(state: GameState) {
  for (const cloud of state.clouds) {
    cloud.x += cloud.speed
    if (cloud.x > BASE_W + 50) cloud.x = -50
  }
  for (const dust of state.dusts) {
    dust.y += dust.speed
    if (dust.y > BASE_H + 10) dust.y = -10
  }
}

/**
 * 更新飘字
 */
export function updateFloatTexts(state: GameState, dt: number) {
  // 🎯 性能：双指针原地过滤代替 splice（O(n) vs O(n²)）
  let writeIdx = 0
  const arr = state.floatTexts
  for (let i = 0; i < arr.length; i++) {
    const ft = arr[i]
    ft.life -= dt; ft.y += ft.vy
    if (ft.life > 0) {
      if (i !== writeIdx) arr[writeIdx] = ft
      writeIdx++
    } else {
      recycleFloatText(ft)
    }
  }
  arr.length = writeIdx

  if (arr.length > MAX_FLOAT_TEXTS) {
    for (let i = MAX_FLOAT_TEXTS; i < arr.length; i++) recycleFloatText(arr[i])
    arr.length = MAX_FLOAT_TEXTS
  }
}

/**
 * 更新粒子效果
 */
export function updateParticles(state: GameState, dt: number) {
  // 🎯 性能：双指针原地过滤代替 splice
  let writeIdx = 0
  const arr = state.particles
  for (let i = 0; i < arr.length; i++) {
    const p = arr[i]
    p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= dt
    if (p.life > 0) {
      if (i !== writeIdx) arr[writeIdx] = p
      writeIdx++
    } else {
      recycleParticle(p)
    }
  }
  arr.length = writeIdx
  // 性能限制 - 使用更高效的方式截断数组
  if (state.particles.length > MAX_PARTICLES) {
    // 回收多余的粒子
    for (let i = MAX_PARTICLES; i < state.particles.length; i++) {
      recycleParticle(state.particles[i])
    }
    state.particles.length = MAX_PARTICLES
  }
}

/**
 * 更新金币掉落
 */
export function updateCoinDrops(state: GameState, dt: number) {
  // 🎯 性能：双指针原地过滤代替 splice
  let writeIdx = 0
  const arr = state.coinDrops
  for (let i = 0; i < arr.length; i++) {
    const c = arr[i]
    c.y += c.vy; c.vy += 0.3; c.life -= dt

    // 收集检测
    const dx = c.x - state.playerX
    const dy = c.y - (BASE_H - 55)
    if (dx * dx + dy * dy < 1600) {
      state.coins++
      recycleCoinDrop(c)
      audioService.coin()
      const ft = getFloatTextFromPool()
      ft.x = c.x; ft.y = c.y; ft.text = '+$1'; ft.color = '#FFD700'; ft.life = 1; ft.vy = -1; ft.size = 16
      state.floatTexts.push(ft)
      continue
    }

    if (c.life <= 0 || c.y > BASE_H + 20) {
      recycleCoinDrop(c)
      continue
    }

    if (i !== writeIdx) arr[writeIdx] = c
    writeIdx++
  }
  arr.length = writeIdx
  // 性能限制 - 使用更高效的方式截断数组
  if (state.coinDrops.length > MAX_COIN_DROPS) {
    // 回收多余的金币
    for (let i = MAX_COIN_DROPS; i < state.coinDrops.length; i++) {
      recycleCoinDrop(state.coinDrops[i])
    }
    state.coinDrops.length = MAX_COIN_DROPS
  }
}

/**
 * 更新道具（直接拾取型，已废弃，仅保留兼容）
 */
export function updatePowerUps(state: GameState, dt: number) {
  for (let i = state.powerUps.length - 1; i >= 0; i--) {
    const p = state.powerUps[i]
    p.bobPhase += dt * 3
    p.life -= dt

    // 玩家收集检测 - 使用距离平方比较
    const dx = p.x - state.playerX
    const dy = p.y - (BASE_H - 55)
    if (dx * dx + dy * dy < 1225) { // 35*35
      // 直接拾取：只支持旧版4种
      switch (p.type) {
        case 'damage':    state.bulletDamage = Math.floor(state.bulletDamage * 1.5); break
        case 'multiShot': state.bulletCount = Math.min(5, state.bulletCount + 1); break
        case 'pierce':    state.bulletPierce++; break
        case 'heal':      if (state.playerHP < state.playerMaxHP) state.playerHP++; break
      }
      audioService.buff()
      state.powerUps.splice(i, 1)
      continue
    }

    if (p.life <= 0) state.powerUps.splice(i, 1)
  }
  // 性能限制 - 使用更高效的方式截断数组
  if (state.powerUps.length > MAX_POWERUPS) {
    state.powerUps.length = MAX_POWERUPS
  }
}

// applyBuff 已废弃（被 applySelectedPowerUp 替代，直接拾取道具系统已移除）

/**
 * 更新有持续时间的道具（倒计时）
 */
export function updateActiveBuffs(state: GameState, dt: number) {
  const toRemove: number[] = []
  for (let i = 0; i < state.activeBuffs.length; i++) {
    state.activeBuffs[i].remaining -= dt
    if (state.activeBuffs[i].remaining <= 0) {
      toRemove.push(i)
    }
  }
  
  // 🎯 关键修复：倒序删除，并在删除前清除对应效果
  for (let i = toRemove.length - 1; i >= 0; i--) {
    const expiredBuff = state.activeBuffs[toRemove[i]]
    console.log(`⏰ Buff过期: ${expiredBuff.name}, 类型: ${expiredBuff.type}`)
    
    // 清除对应buff的效果
    removeBuffEffect(state, expiredBuff.type)
    
    // 从数组中移除
    state.activeBuffs.splice(toRemove[i], 1)
  }
  
  // 🎯 更新道具加持特效
  updatePowerupEffects(state, dt)
}

/** 🎯 清除buff效果的函数 */
function removeBuffEffect(state: GameState, buffType: string) {
  const S = state as any
  
  switch (buffType) {
    // ── 普攻强化类 ──
    case 'rapidFire':     // 迅击弹：恢复射速
      S.rapidFireStacks = Math.max(0, (S.rapidFireStacks || 1) - 1)
      if (S.rapidFireStacks === 0) {
        // 恢复到基础射速（350ms）
        state.shootCooldown = 350
        console.log('🔄 恢复基础射速: 350ms')
      } else {
        // 还有层数，重新计算射速
        state.shootCooldown = Math.max(60, 350 * Math.pow(0.6, S.rapidFireStacks))
      }
      break
      
    case 'multiShot':     // 多重弹：减少弹道
      S.multiShotStacks = Math.max(0, (S.multiShotStacks || 1) - 1)
      if (S.multiShotStacks === 0) {
        state.bulletCount = 1  // 恢复基础1发
        console.log('🔄 恢复基础弹道: 1发')
      } else {
        state.bulletCount = Math.min(10, 1 + S.multiShotStacks * 2)
      }
      break
      
    case 'armorPierce':   // 破甲弹：减少穿透
      S.armorPierceStacks = Math.max(0, (S.armorPierceStacks || 1) - 1)
      if (S.armorPierceStacks === 0) {
        state.bulletPierce = 1  // 恢复基础穿透
        console.log('🔄 恢复基础穿透: 1')
      } else {
        state.bulletPierce = 1 + S.armorPierceStacks * 3
      }
      break
      
    case 'heavyHit':    // 重击弹：恢复伤害
      S.heavyHitStacks = Math.max(0, (S.heavyHitStacks || 1) - 1)
      if (S.heavyHitStacks === 0) {
        // 需要重新计算基础伤害（考虑其他buff）
        recalculateBaseDamage(state)
        console.log('🔄 恢复基础伤害')
      }
      // 注意：damage是累积乘法，无法精确恢复，依赖recalculateBaseDamage
      break
      
    case 'rapidBurst':    // 连射增幅：恢复冷却
      S.rapidBurstStacks = Math.max(0, (S.rapidBurstStacks || 1) - 1)
      if (S.rapidBurstStacks === 0) {
        recalculateBaseCooldown(state)
        console.log('🔄 恢复基础冷却')
      }
      break
      
    case 'autoAim':       // 精准锁定：减少穿透
      S.autoAimStacks = Math.max(0, (S.autoAimStacks || 1) - 1)
      if (S.autoAimStacks === 0) {
        recalculateBasePierce(state)
      }
      break
      
    // ── 范围爆发类 ──
    case 'blast':
      S.blastStacks = Math.max(0, (S.blastStacks || 1) - 1)
      break
      
    case 'slash':
      S.slashStacks = Math.max(0, (S.slashStacks || 1) - 1)
      break
      
    case 'ringWave':
      S.ringWaveStacks = Math.max(0, (S.ringWaveStacks || 1) - 1)
      break
      
    case 'windPressure':
      S.windPressureStacks = Math.max(0, (S.windPressureStacks || 1) - 1)
      if (S.windPressureStacks === 0) {
        state.slowAllTimer = 0  // 清除减速
      }
      break
      
    case 'chainBlast':
      S.chainBlastStacks = Math.max(0, (S.chainBlastStacks || 1) - 1)
      break
      
    case 'splash':
      S.splashStacks = Math.max(0, (S.splashStacks || 1) - 1)
      break
      
    // ── 持续压制类 ──
    case 'burn':
      S.burnStacks = Math.max(0, (S.burnStacks || 1) - 1)
      break
      
    case 'slowField':
      S.slowFieldStacks = Math.max(0, (S.slowFieldStacks || 1) - 1)
      if (S.slowFieldStacks === 0) {
        state.slowAllTimer = 0
      }
      break
      
    case 'toxin':
      S.toxinStacks = Math.max(0, (S.toxinStacks || 3) - 3)
      break
      
    case 'energyField':
      S.energyFieldStacks = Math.max(0, (S.energyFieldStacks || 1) - 1)
      break
      
    case 'defDown':       // 减防光环：恢复伤害
      S.defDownStacks = Math.max(0, (S.defDownStacks || 1) - 1)
      if (S.defDownStacks === 0) {
        recalculateBaseDamage(state)
      }
      break
      
    // ── 特殊斩杀类 ──
    case 'slashBlade':
      S.slashBladeStacks = Math.max(0, (S.slashBladeStacks || 1) - 1)
      break
      
    case 'executeWave':
      S.executeWaveStacks = Math.max(0, (S.executeWaveStacks || 1) - 1)
      break
      
    case 'crit':          // 极限暴击：恢复伤害
      S.critStacks = Math.max(0, (S.critStacks || 1) - 1)
      if (S.critStacks === 0) {
        recalculateBaseDamage(state)
      }
      break
  }
}

/** 🎯 重新计算基础伤害（考虑所有伤害相关buff） */
function recalculateBaseDamage(state: GameState) {
  const S = state as any
  let damage = 15  // 基础伤害
  
  // 应用所有活跃的伤害buff
  if (S.heavyHitStacks > 0) {
    damage *= Math.pow(2.0, S.heavyHitStacks)
  }
  if (S.defDownStacks > 0) {
    damage *= Math.pow(1.15, S.defDownStacks)
  }
  if (S.critStacks > 0) {
    damage *= Math.pow(1.5, S.critStacks)
  }
  
  state.bulletDamage = Math.floor(damage)
}

/** 🎯 重新计算基础冷却（考虑所有冷却相关buff） */
function recalculateBaseCooldown(state: GameState) {
  const S = state as any
  let cooldown = 350  // 基础冷却

  // 应用所有活跃的冷却buff
  if (S.rapidFireStacks > 0) {
    cooldown *= Math.pow(0.6, S.rapidFireStacks)
  }
  if (S.rapidBurstStacks > 0) {
    cooldown *= Math.pow(0.3, S.rapidBurstStacks)
  }

  state.shootCooldown = Math.max(30, cooldown)
}

/** 🎯 重新计算基础穿透（考虑所有穿透相关buff） */
function recalculateBasePierce(state: GameState) {
  const S = state as any
  let pierce = 1  // 基础穿透
  
  // 应用所有活跃的穿透buff
  if (S.armorPierceStacks > 0) {
    pierce += S.armorPierceStacks * 3
  }
  if (S.autoAimStacks > 0) {
    pierce += S.autoAimStacks
  }
  
  state.bulletPierce = pierce
  console.log(`🎯 重新计算穿透: ${state.bulletPierce} (armorPierce=${S.armorPierceStacks || 0}, autoAim=${S.autoAimStacks || 0})`)
}

/** 给 state 添加或刷新一个 activeBuff（叠加或刷新时间） */
function addOrRefreshBuff(state: GameState, type: string, name: string, icon: string, color: string, duration: number, stacks?: number) {
  const existing = state.activeBuffs.find(b => b.type === type)
  if (existing) {
    existing.remaining = duration
    if (stacks !== undefined) existing.stacks = (existing.stacks || 1) + stacks
  } else {
    state.activeBuffs.push({ type, name, icon, color, duration, remaining: duration, stacks })
  }
  
  // 🎯 触发道具加持特效
  triggerPowerupEffect(state, color)
}

/**
 * 🎯 触发道具加持特效（屏幕闪光 + 光环扩散）
 */
function triggerPowerupEffect(state: GameState, color: string) {
  // 1. 屏幕闪光
  state.powerupEffects.flashAlpha = 0.3  // 30%透明度
  state.powerupEffects.flashColor = color

  // 2. 创建扩散光环（从玩家位置）
  const ring = {
    x: state.playerX,
    y: state.playerY,
    radius: 20,
    maxRadius: 150,
    color: color,
    alpha: 1.0,
    lineWidth: 4,
    delay: 0     // 立即开始
  }
  state.powerupEffects.rings.push(ring)

  // 3. 创建第二层光环（延迟0.1秒，更大）
  const ring2 = {
    x: state.playerX,
    y: state.playerY,
    radius: 20,
    maxRadius: 200,
    color: color,
    alpha: 0.8,
    lineWidth: 3,
    delay: 0.1  // 延迟0.1秒
  }
  state.powerupEffects.rings.push(ring2)
}

/**
 * 🎯 更新道具加持特效（每帧调用）
 */
function updatePowerupEffects(state: GameState, dt: number) {
  // 1. 衰减屏幕闪光
  if (state.powerupEffects.flashAlpha > 0) {
    state.powerupEffects.flashAlpha -= dt * 2
    if (state.powerupEffects.flashAlpha < 0) state.powerupEffects.flashAlpha = 0
  }

  // 2. 更新光环扩散（双指针原地过滤）
  const rings = state.powerupEffects.rings
  let writeIdx = 0
  for (let i = 0; i < rings.length; i++) {
    const ring = rings[i]

    // 延迟光环：未到时间则跳过
    if (ring.delay > 0) {
      ring.delay -= dt
      if (ring.delay > 0) {
        rings[writeIdx++] = ring
        continue
      }
      // delay 耗尽，重置为立即开始
      ring.delay = 0
    }

    // 扩大半径（使用剩余距离的比例，确保匀速）
    const remaining = ring.maxRadius - ring.radius
    if (remaining > 0.5) {
      const expandSpeed = remaining * 3  // 约0.33秒到达
      ring.radius += expandSpeed * dt
      if (ring.radius > ring.maxRadius) ring.radius = ring.maxRadius
    }

    // 衰减透明度（基于时间而非帧，保证一致性）
    ring.alpha -= dt * 1.5
    ring.lineWidth = Math.max(0.5, 4 * ring.alpha)

    // 保留未消亡的光环
    if (ring.alpha > 0 && ring.radius < ring.maxRadius) {
      rings[writeIdx++] = ring
    }
  }
  rings.length = writeIdx

  // 3. 更新全屏冲击波
  const sw = state.powerupEffects.screenWave
  if (sw) {
    sw.radius += sw.speed * dt
    sw.alpha -= dt * 1.5
    if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
      state.powerupEffects.screenWave = undefined
    }
  }
}

/**
 * 射击逻辑
 */
export function shoot(state: GameState) {
  const now = Date.now()
  if (now - state.lastShotTime < state.shootCooldown) return
  state.lastShotTime = now

  const baseAngle = state.shootAngle  // 使用玩家当前的射击角度
  const spread = 0.08
  const count = state.bulletCount
  const bigShot = state.bigShotTimer > 0
  const bulletSz = bigShot ? 11 : 6
  const actualSpeed = state.bulletSpeed * (state.slowBulletTimer > 0 ? 0.6 : 1)

  for (let i = 0; i < count; i++) {
    let angle = baseAngle
    if (count > 1) angle = baseAngle + ((i / (count - 1)) - 0.5) * spread * (count - 1)

    if (state.bullets.length >= MAX_BULLETS) {
      const removed = state.bullets.shift()!
      recycleBullet(removed)
    }

    const bullet = getBulletFromPool()
    
    //  关键修复：子弹从箭头尖端发射，而不是固定偏移
    // 箭头尖端距离玩家中心约 42 像素（与 renderer.ts 中的箭头位置一致）
    const arrowTipDistance = 42
    bullet.x = state.playerX + Math.cos(angle) * arrowTipDistance
    bullet.y = state.playerY + Math.sin(angle) * arrowTipDistance
    
    bullet.vx = Math.cos(angle) * actualSpeed
    bullet.vy = Math.sin(angle) * actualSpeed
    bullet.damage = state.bulletDamage
    bullet.pierce = state.bulletPierce
    bullet.size = bulletSz
    state.bullets.push(bullet)

    audioService.shoot()
  }
}

/**
 * 更新子弹和碰撞检测
 */
export function updateBullets(state: GameState, dt: number) {
  for (let bi = state.bullets.length - 1; bi >= 0; bi--) {
    const b = state.bullets[bi]
    b.x += b.vx
    b.y += b.vy

    // 边界移除
    if (b.x < -50 || b.x > BASE_W + 50 || b.y < -200 || b.y > BASE_H + 50) {
      recycleBullet(b)
      state.bullets.splice(bi, 1)
      continue
    }

    // 龙碰撞检测 - 优化：使用距离平方比较避免开方运算
    for (let di = state.dragons.length - 1; di >= 0; di--) {
      const dragon = state.dragons[di]
      if (!dragon.alive) continue

      for (let si = dragon.segments.length - 1; si >= 0; si--) {
        const seg = dragon.segments[si]
        const dx = b.x - seg.x
        const dy = b.y - seg.y
        const distSquared = dx * dx + dy * dy
        const collisionRadius = seg.size + b.size
        
        if (distSquared < collisionRadius * collisionRadius) {
          // 命中！
          seg.hp -= b.damage
          state.combo++
          state.comboTimer = 2
          state.maxCombo = Math.max(state.maxCombo, state.combo)

          const comboBonus = Math.floor(state.combo / 5)
          const scorePerHit = DRAGON_CONFIGS[dragon.type]?.score || 10
          const earnedScore = scorePerHit + comboBonus * 5
          state.score += earnedScore

          // 飘字
          const ft = getFloatTextFromPool()
          ft.x = seg.x
          ft.y = seg.y - seg.size - 8
          ft.text = `-${b.damage}`
          ft.color = state.combo > 5 ? '#FFD700' : '#FFFFFF'
          ft.life = 0.8
          ft.vy = -1.2
          ft.size = 14 + Math.min(state.combo, 10)
          state.floatTexts.push(ft)

          audioService.hit()

          // 命中粒子效果
          for (let k = 0; k < 4; k++) {
            if (state.particles.length < MAX_PARTICLES) {
              const p = getParticleFromPool()
              p.x = seg.x
              p.y = seg.y
              p.vx = (Math.random() - 0.5) * 6
              p.vy = (Math.random() - 0.5) * 6
              p.life = 0.4 + Math.random() * 0.3
              p.maxLife = 0.7
              p.size = 2 + Math.random() * 3
              p.color = seg.color
              state.particles.push(p)
            }
          }

          // 节段死亡
          if (seg.hp <= 0) {
            handleSegmentDeath(state, dragon, si)
          }

          const S = state as any
          // chainBlast：命中后触发连锁爆破
          if (S.chainBlastStacks > 0) {
            const chainR = 60 + S.chainBlastStacks * 10
            const chainRSquared = chainR * chainR
            for (const drag of state.dragons) {
              if (!drag.alive) continue
              for (let si2 = drag.segments.length - 1; si2 >= 0; si2--) {
                const s2 = drag.segments[si2]
                
                // 🎯 关键修复：跳过已死亡的节段
                if (s2.hp <= 0) continue
                
                const d2x = b.x - s2.x
                const d2y = b.y - s2.y
                const d2Squared = d2x * d2x + d2y * d2y
                if (d2Squared < chainRSquared && d2Squared > 0) {
                  const chainDmg = b.damage * 0.35
                  s2.hp -= chainDmg
                  const ft = getFloatTextFromPool()
                  ft.x = s2.x
                  ft.y = s2.y - s2.size
                  ft.text = `-${Math.round(chainDmg)}`
                  ft.color = '#FF9F43'
                  ft.life = 0.5
                  ft.vy = -1
                  ft.size = 12
                  state.floatTexts.push(ft)
                  if (s2.hp <= 0) handleSegmentDeath(state, drag, si2)
                }
              }
            }
          }

          // 子弹穿透：保留子弹 + 范围散射伤害（splashStacks 增强溅射）
          if (b.pierce > 0) {
            b.pierce--
            b.size *= 0.85
            // 散射范围（splashStacks 增强：基础30 + 每层5%）
            const splashMult = 1 + (S.splashStacks || 0) * 0.05
            const splashR = (10 + b.size) * splashMult
            const splashRSquared = splashR * splashR
            for (const drag of state.dragons) {
              if (!drag.alive || drag === dragon) continue
              for (let si2 = drag.segments.length - 1; si2 >= 0; si2--) {
                const s2 = drag.segments[si2]
                
                // 🎯 关键修复：跳过已死亡的节段
                if (s2.hp <= 0) continue
                
                const d2x = b.x - s2.x
                const d2y = b.y - s2.y
                const d2Squared = d2x * d2x + d2y * d2y
                if (d2Squared < splashRSquared + s2.size * s2.size) {
                  s2.hp -= b.damage * 0.4  // 散射伤害 40%
                  if (s2.hp <= 0) handleSegmentDeath(state, drag, si2)
                }
              }
            }
          } else {
            recycleBullet(b)
            state.bullets.splice(bi, 1)
          }
          break
        }
      }
    }
  }
}

/**
 * 处理节段死亡
 */
function handleSegmentDeath(state: GameState, dragon: Dragon, segmentIndex: number) {
  const seg = dragon.segments[segmentIndex]
  
  // 🎯 关键修复：防止重复处理已死亡的节段
  if (seg.hp > 0) {
    return  // 血量还大于0，不应该进入死亡处理
  }
  
  const killedPowerUp = seg.attachedPowerUp ?? null

  // 🎯 死亡特效 - 增强版
  spawnExplosionParticles(state, seg.x, seg.y, seg.color, 18)  // 🎯 更多粒子（原12）
  audioService.kill()
  
  // 🎯 屏幕震动效果（根据龙的类型调整强度）
  const isHead = seg.isHead
  
  // 🎯 关键优化：添加冷却时间，防止频繁触发
  if (state.screenShake.cooldown <= 0) {
    // 只有在非冷却期才触发震动
    const shakeIntensity = isHead ? 4 : 2  // 从 8/4 降低到 4/2
    state.screenShake.intensity = shakeIntensity
    state.screenShake.duration = 0.15  // 从 0.3秒 缩短到 0.15秒
    
    // 🎯 设置冷却时间：龙头击杀后0.3秒内不再触发，龙身0.2秒
    state.screenShake.cooldown = isHead ? 0.3 : 0.2
  }

  // 金币掉落（概率）
  if (Math.random() < 0.15 && state.coinDrops.length < MAX_COIN_DROPS) {
    const c = getCoinDropFromPool()
    c.x = seg.x
    c.y = seg.y
    c.vy = -3 - Math.random() * 2
    c.life = 5
    state.coinDrops.push(c)
  }

  // 分裂或死亡
  killDragonSegment(dragon, segmentIndex)

  // 道具节段：打开道具选择弹窗
  if (killedPowerUp && state.phase === 'playing') {
    openPowerUpSelect(state)
    return
  }

  if (isDragonDead(dragon)) {
    // 死亡奖励
    spawnDeathEffect(state, dragon)

    const config = DRAGON_CONFIGS[dragon.type]
    state.score += config?.score || 0
    state.totalKills++

    if ((config as any)?.isTreasure && state.coins !== undefined) {
      // 宝箱龙给大量金币
      for (let i = 0; i < 5; i++) {
        if (state.coinDrops.length < MAX_COIN_DROPS) {
          const c = getCoinDropFromPool()
          c.x = dragon.segments[0].x + (Math.random() - 0.5) * 40
          c.y = dragon.segments[0].y + (Math.random() - 0.5) * 30
          c.vy = -4 - Math.random() * 3
          c.life = 6
          state.coinDrops.push(c)
        }
      }
    }

    dragon.alive = false
    state.levelProgress++
    
    // 显示关卡进度提示
    const ft = getFloatTextFromPool()
    ft.x = BASE_W / 2
    ft.y = BASE_H / 3
    ft.text = `🐉 ${state.levelProgress}/${state.levelTarget}`
    ft.color = '#4CAF50'
    ft.life = 1.5
    ft.vy = -0.5
    ft.size = 20
    state.floatTexts.push(ft)
    console.log(`✅ 龙被消灭! 关卡进度: ${state.levelProgress}/${state.levelTarget}`)
  }
  // 无分裂机制：龙被纯击打消灭，不再产生新龙
}

/**
 * 打开道具选择弹窗：从 BUFF_OPTIONS 中随机抽取 3 张（根据关卡允许的分类）
 */
function openPowerUpSelect(state: GameState) {
  // 获取当前关卡允许的道具分类
  const lvlIdx = Math.min(Math.max(0, state.level - 1), LEVEL_CONFIGS.length - 1)
  const lvlCfg = LEVEL_CONFIGS[lvlIdx]

  // 只从允许分类中抽取
  const allowedPool = BUFF_OPTIONS.filter(c => lvlCfg.allowedCategories.includes(c.category))
  const shuffled = [...allowedPool].sort(() => Math.random() - 0.5)
  const cards = shuffled.slice(0, 3) as PowerUpCard[]

  state.powerupSelect = {
    cards,
    revealedIdx: null,
    revealProgress: 0,
    closeProgress: 0,
    closing: false
  }
  state.phase = 'powerup_select'
  state.isPaused = true
}

/**
 * 更新道具选择弹窗状态（动画）
 */
export function updatePowerUpSelect(state: GameState, dt: number) {
  const ps = state.powerupSelect
  if (!ps) return

  // 翻开动画（只在翻牌过程中设置一次 setTimeout）
  if (ps.revealedIdx !== null && ps.revealProgress < 1) {
    ps.revealProgress = Math.min(1, ps.revealProgress + dt * 4)
    if (ps.revealProgress >= 1) {
      ps.revealProgress = 1
      // setTimeout 只设置一次（翻牌完成的第1帧）
      setTimeout(() => {
        // 保护：确认弹窗仍存在且未关闭
        if (state.powerupSelect && !state.powerupSelect.closing) {
          state.powerupSelect.closing = true
        }
      }, 2000)
    }
  }

  // 关闭动画
  if (ps.closing && ps.closeProgress < 1) {
    ps.closeProgress = Math.min(1, ps.closeProgress + dt * 3)
    if (ps.closeProgress >= 1) {
      applySelectedPowerUp(state, ps.cards[ps.revealedIdx!])
      state.powerupSelect = null
      state.phase = 'playing'
      state.isPaused = false
    }
  }
}

/**
 * 应用选中的道具效果（全 20 种）
 */
function applySelectedPowerUp(state: GameState, card: PowerUpCard) {
  const pushText = (text: string) => {
    const ft = getFloatTextFromPool()
    ft.x = state.playerX
    ft.y = BASE_H - 80
    ft.text = text
    ft.color = card.color
    ft.life = 1.5
    ft.vy = -1
    ft.size = 16
    state.floatTexts.push(ft)
  }
  const S = state as any

  switch (card.type) {
    // ── 一，普攻强化类（6）─────────────────────────────────────
    case 'rapidFire':     // 迅击弹：攻速大幅提升（叠加 shootCooldown 减少）
      S.rapidFireStacks = (S.rapidFireStacks || 0) + 1
      state.shootCooldown = Math.max(60, state.shootCooldown * 0.6)  // 🎯 更强的射速提升（原0.7）
      addOrRefreshBuff(state, 'rapidFire', '迅击弹', '⚡', '#FFD700', 20)
      createEnergyBurst(state, state.playerX, state.playerY, '#FF6B6B', 8)
      triggerScreenWave(state, '#FFD700')
      pushText('⚡ 迅击弹！')
      break
    case 'multiShot':     // 多重弹：额外弹道
      S.multiShotStacks = (S.multiShotStacks || 0) + 1
      state.bulletCount = Math.min(10, state.bulletCount + 2)  // 🎯 每次+2发（原+1），最多10发
      addOrRefreshBuff(state, 'multiShot', '多重弹', '🔫', '#FF6B6B', 20)
      createRingWave(state, state.playerX, state.playerY, '#2ED573')
      pushText('🔫 多重弹！')
      break
    case 'armorPierce':   // 破甲弹：无视部分龙防御（穿透+1）
      S.armorPierceStacks = (S.armorPierceStacks || 0) + 1
      state.bulletPierce += 3  // 🎯 更强的穿透（原+2）
      addOrRefreshBuff(state, 'armorPierce', '破甲弹', '🔪', '#B0C4DE', 20)
      createCritEffect(state, state.playerX, state.playerY)
      pushText('🔪 破甲弹！')
      break
    case 'heavyHit':    // 重击弹：单发伤害大幅提高
      S.heavyHitStacks = (S.heavyHitStacks || 0) + 1
      state.bulletDamage = Math.floor(state.bulletDamage * 2.0)  // 🎯 双倍伤害（原1.8）
      addOrRefreshBuff(state, 'heavyHit', '重击弹', '💪', '#FF4500', 20)
      createEnergyBurst(state, state.playerX, state.playerY, '#FF9F43', 16)
      triggerScreenWave(state, '#FF4500')
      pushText('💪 重击弹！')
      break
    case 'rapidBurst':    // 连射增幅：短时间极速连射（临时极短冷却）
      S.rapidBurstStacks = (S.rapidBurstStacks || 0) + 1
      state.shootCooldown = Math.max(30, state.shootCooldown * 0.3)  // 🎯 更快的连射（原0.4）
      addOrRefreshBuff(state, 'rapidBurst', '连射增幅', '🔥', '#FF4500', 20)
      createFireEffect(state, state.playerX, state.playerY, '#EE5A24')
      pushText('🔥 连射增幅！')
      break
    case 'autoAim':       // 精准锁定：子弹自动吸附龙身
      S.autoAimStacks = (S.autoAimStacks || 0) + 1
      state.bulletPierce += 1
      addOrRefreshBuff(state, 'autoAim', '精准锁定', '🎯', '#00CED1', 20)
      createCritEffect(state, state.playerX, state.playerY)
      triggerScreenWave(state, '#00CED1')
      pushText('🎯 精准锁定！')
      break

    // ── 二，范围爆发类（6）─────────────────────────────────────
    case 'blast':         // 爆裂冲击：小范围爆炸（持续60秒，每秒触发）
      S.blastStacks = (S.blastStacks || 0) + 1
      addOrRefreshBuff(state, 'blast', '爆裂冲击', '💥', '#FF6347', 20)
      audioService.explosion()
      createExplosion(state, state.playerX, state.playerY, '#FF4757', 50)
      triggerScreenWave(state, '#FF4757')
      pushText('💥 爆裂冲击！')
      break
    case 'slash':         // 横向横扫：横向范围伤害（持续60秒）
      S.slashStacks = (S.slashStacks || 0) + 1
      addOrRefreshBuff(state, 'slash', '横向横扫', '⚔️', '#DDA0DD', 20)
      createSlashWave(state, state.playerX, state.playerY, BASE_W, 60, '#7F8C8D')
      triggerScreenWave(state, '#DDA0DD')
      pushText('⚔️ 横向横扫！')
      break
    case 'ringWave':      // 环形震荡：定时释放环形冲击波（叠加 timer）
      S.ringWaveStacks = (S.ringWaveStacks || 0) + 1
      S._ringWaveTimer = (S._ringWaveTimer || 0) + 3
      addOrRefreshBuff(state, 'ringWave', '环形震荡', '🌊', '#00CED1', 20)
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          createRingWave(state, state.playerX, state.playerY, '#3498DB')
        }, i * 150)
      }
      pushText('🌊 环形震荡！')
      break
    case 'windPressure':  // 全屏风压：大范围减速龙
      S.windPressureStacks = (S.windPressureStacks || 0) + 1
      state.slowAllTimer = Math.max(state.slowAllTimer, (state.slowAllTimer || 0) + 60)
      addOrRefreshBuff(state, 'windPressure', '全屏风压', '🌪️', '#87CEEB', 20)
      createFreezeEffect(state, BASE_W / 2, BASE_H / 2)
      triggerScreenWave(state, '#87CEEB')
      pushText('🌪️ 全屏风压！')
      break
    case 'chainBlast':    // 分段爆破：命中后连锁爆破（持续60秒）
      S.chainBlastStacks = (S.chainBlastStacks || 0) + 1
      addOrRefreshBuff(state, 'chainBlast', '分段爆破', '⛓️', '#808080', 20)
      createEnergyBurst(state, state.playerX, state.playerY, '#E67E22', 10)
      triggerScreenWave(state, '#E67E22')
      pushText('⛓️ 分段爆破！')
      break
    case 'splash':        // 范围溅射：伤害小幅溅射周围（持续60秒）
      S.splashStacks = (S.splashStacks || 0) + 1
      addOrRefreshBuff(state, 'splash', '范围溅射', '💦', '#1E90FF', 20)
      createRingWave(state, state.playerX, state.playerY, '#1ABC9C')
      pushText('💦 范围溅射！')
      break

    // ── 三，持续压制类（5）─────────────────────────────────────
    case 'burn':          // 持续灼烧：每帧对所有龙附加灼烧层数（持续60秒）
      S.burnStacks = (S.burnStacks || 0) + 1
      addOrRefreshBuff(state, 'burn', '持续灼烧', '🔥', '#FF4500', 20)
      createFireEffect(state, state.playerX, state.playerY, '#E74C3C')
      triggerScreenWave(state, '#E74C3C')
      pushText('🔥 持续灼烧！')
      break
    case 'slowField':     // 迟缓领域：降低整条龙移动速度
      S.slowFieldStacks = (S.slowFieldStacks || 0) + 1
      state.slowAllTimer = Math.max(state.slowAllTimer || 0, 60)
      addOrRefreshBuff(state, 'slowField', '迟缓领域', '❄️', '#87CEFA', 20)
      createFreezeEffect(state, state.playerX, state.playerY)
      triggerScreenWave(state, '#00CEC9')
      pushText('❄️ 迟缓领域！')
      break
    case 'toxin':         // 毒素侵蚀：持续叠加毒素掉血
      S.toxinStacks = (S.toxinStacks || 0) + 3
      addOrRefreshBuff(state, 'toxin', '毒素侵蚀', '☠️', '#9ACD32', 20)
      createToxinCloud(state, state.playerX, state.playerY)
      triggerScreenWave(state, '#6C5CE7')
      pushText('☠️ 毒素侵蚀！')
      break
    case 'energyField':   // 能量涌动：角色周围持续生成伤害圈（叠加）
      S.energyFieldStacks = (S.energyFieldStacks || 0) + 1
      addOrRefreshBuff(state, 'energyField', '能量涌动', '⚡', '#FFD700', 20)
      createEnergyBurst(state, state.playerX, state.playerY, '#FDCB6E', 8)
      triggerScreenWave(state, '#FDCB6E')
      pushText('⚡ 能量涌动！')
      break
    case 'defDown':       // 减防光环：降低全场巨龙防御（持续60秒）
      S.defDownStacks = (S.defDownStacks || 0) + 1
      state.bulletDamage = Math.floor(state.bulletDamage * 1.15)
      addOrRefreshBuff(state, 'defDown', '减防光环', '🛡️', '#B0C4DE', 20)
      createDefDownEffect(state, state.dragons)
      triggerScreenWave(state, '#636E72')
      pushText('🛡️ 减防光环！')
      break

    // ── 四，特殊斩杀类（3）─────────────────────────────────────
    case 'slashBlade':    // 断龙利刃：概率直接斩断一节龙身（持续60秒）
      S.slashBladeStacks = (S.slashBladeStacks || 0) + 1
      addOrRefreshBuff(state, 'slashBlade', '断龙利刃', '🗡️', '#8B0000', 20)
      // 立即触发一次斩断
      for (const dragon of state.dragons) {
        if (dragon.alive && dragon.segments.length > 3) {
          killDragonSegment(dragon, Math.floor(dragon.segments.length / 2))
          createSlashWave(state, dragon.segments[0].x, dragon.segments[0].y, 80, 80, '#D63031')
          break
        }
      }
      triggerScreenWave(state, '#D63031')
      pushText('🗡️ 断龙利刃！')
      break
    case 'executeWave':   // 斩杀剑气：纵向长剑气贯穿路线（持续60秒）
      S.executeWaveStacks = (S.executeWaveStacks || 0) + 1
      addOrRefreshBuff(state, 'executeWave', '斩杀剑气', '⚡', '#9370DB', 20)
      audioService.lightning()
      createSlashWave(state, state.playerX, 0, 40, BASE_H, '#0984E3')
      triggerScreenWave(state, '#0984E3')
      pushText('⚡ 斩杀剑气！')
      break
    case 'crit':          // 极限暴击：大幅提升暴击概率（持续60秒）
      S.critStacks = (S.critStacks || 0) + 1
      state.bulletDamage = Math.floor(state.bulletDamage * 1.5)
      addOrRefreshBuff(state, 'crit', '极限暴击', '💢', '#FF1493', 20)
      createCritEffect(state, state.playerX, state.playerY)
      triggerScreenWave(state, '#E84393')
      pushText('💢 极限暴击！')
      break
  }
  audioService.buff()
}

/**
 * 生成龙（根据关卡进度）
 */
export function spawnDragons(state: GameState) {
  let aliveDragons = 0
  for (const dragon of state.dragons) {
    if (dragon.alive) aliveDragons++
  }

  // 所有龙已消灭，且完成了本关目标，进入下一关
  if (aliveDragons === 0 && state.levelProgress >= state.levelTarget) {
    checkLevelUp(state)
    return
  }

  // 已全部生成且还有存活的，不再生成
  if (state.dragonsSpawnedInLevel >= state.levelTarget) return

  // 获取本关卡所有路线
  const allRoutes = routeLoader.getRoutesForLevel(state.level)
  if (allRoutes.length === 0) {
    console.warn('⚠️ 没有可用路线！level=', state.level)
    return
  }

  // 调试日志（只在首次生成时打印）
  if (state.dragonsSpawnedInLevel === 0) {
    console.log(`🐉 关卡 ${state.level} 开始：共 ${allRoutes.length} 条路线`)
  }

  // 一次性生成所有龙（每条路线一条龙）
  // 路线索引决定龙颜色（0=红, 1=蓝, 2=绿, 3=黄, 4=紫）
  for (let routeIdx = 0; routeIdx < allRoutes.length; routeIdx++) {
    const route = allRoutes[routeIdx]
    if (route.points.length < 10) continue

    // 根据关卡决定龙类型
    let type: Dragon['type'] = 'small'
    const r = Math.random()
    const lvlIdx = Math.min(Math.max(0, state.level - 1), LEVEL_CONFIGS.length - 1)
    const lvlCfg = LEVEL_CONFIGS[lvlIdx]
    if (state.level >= 8 && r < lvlCfg.bossChance) type = 'boss'
    else if (state.level >= 5 && r < lvlCfg.bossChance + lvlCfg.eliteChance) type = 'elite'
    else if (state.level >= 3 && r < 0.3) type = 'large'
    else if (state.level >= 2 && r < 0.45) type = 'medium'

    const dragon = _createDragon(0, type, route, state.level, routeIdx)
    dragon.id = ++state.lastDragonId
    state.dragons.push(dragon)
    // 生成龙
  }

  state.dragonsSpawnedInLevel = allRoutes.length
}

/**
 * 更新所有龙的状态
 */
/** 游戏结束回调（由 index.ts 注入） */
let _gameOverCallback: (() => void) | null = null
export function setGameOverCallback(cb: () => void) { _gameOverCallback = cb }

export function updateDragons(state: GameState, dt: number) {
  // 全局减速效果：freezeTimer(冰封50%) 和 slowAllTimer(时光减速30%)
  const freezeActive  = state.freezeTimer  > 0
  const slowAllActive = state.slowAllTimer > 0
  const globalSlow    = freezeActive || slowAllActive

  // DOT 状态（读取一次，避免每条龙重复计算）
  const S = state as any
  const burnDPS     = (S.burnStacks     || 0) * 0.5   // 灼烧：每层0.5dps
  const toxinDPS    = (S.toxinStacks    || 0) * 0.3   // 毒素：每层0.3dps
  const hasBurn     = burnDPS > 0
  const hasToxin    = toxinDPS > 0
  // energyField：能量涌动，持续伤害圈
  const energyFieldStacks = S.energyFieldStacks || 0
  const energyR     = 80 + energyFieldStacks * 15  // 范围随叠加层数扩大
  const energyRSquared = energyR * energyR

  // 🎯 范围伤害中心：随机选一条存活的龙的位置（多个龙时随机）
  let rangeCenterX = state.playerX
  let rangeCenterY = state.playerY || BASE_H - 55
  {
    const aliveHeads = state.dragons
      .filter(d => d.segments.some(s => s.isHead && s.hp > 0))
      .map(d => ({ x: d.segments.find(s => s.isHead)!.x, y: d.segments.find(s => s.isHead)!.y }))
    if (aliveHeads.length > 0) {
      const pick = aliveHeads[Math.floor(Math.random() * aliveHeads.length)]
      rangeCenterX = pick.x
      rangeCenterY = pick.y
    }
  }

  // 范围爆发类持续伤害（每秒触发）
  const blastStacks = S.blastStacks || 0
  const slashStacks = S.slashStacks || 0
  const splashStacks = S.splashStacks || 0
  const ringWaveStacks = S.ringWaveStacks || 0
  const chainBlastStacks = S.chainBlastStacks || 0

  // ringWave 定时触发（以随机存活龙为中心）
  if ((S._ringWaveTimer || 0) > 0) {
    S._ringWaveTimer -= dt
    if (S._ringWaveTimer <= 0) {
      S._ringWaveTimer = 2  // 每2秒触发一次
      audioService.explosion()
      for (const dragon of state.dragons) {
        for (let si = dragon.segments.length - 1; si >= 0; si--) {
          const seg = dragon.segments[si]
          if (seg.hp <= 0) continue
          const distX = seg.x - rangeCenterX
          const distY = seg.y - rangeCenterY
          if (distX * distX + distY * distY < 22500) { // 150*150
            const dmg = state.bulletDamage * 0.3
            seg.hp -= dmg
            const ft = getFloatTextFromPool()
            ft.x = seg.x
            ft.y = seg.y - seg.size
            ft.text = `-${Math.round(dmg)}`
            ft.color = '#3498DB'
            ft.life = 0.6
            ft.vy = -1
            ft.size = 12
            state.floatTexts.push(ft)
            if (seg.hp <= 0) handleSegmentDeath(state, dragon, si)
          }
        }
      }
    }
  }

  // 范围爆发持续伤害（每秒对龙造成范围伤害）
  const blastRadiusSquared = (50 + blastStacks * 10) * (50 + blastStacks * 10)  // 爆炸范围随层数扩大
  const slashWidthSquared = (BASE_W * (0.4 + slashStacks * 0.05)) * (BASE_W * (0.4 + slashStacks * 0.05))  // 横扫宽度扩大
  const splashRadiusSquared = (30 + splashStacks * 5) * (30 + splashStacks * 5)  // 溅射范围
  const chainRadiusSquared = (40 + chainBlastStacks * 5) * (40 + chainBlastStacks * 5)  // 连锁爆破范围

  for (let i = state.dragons.length - 1; i >= 0; i--) {
    const dragon = state.dragons[i]

    if (!dragon.alive) {
      // 🎯 性能：swap-pop 代替 splice（O(1) vs O(n)）
      const last = state.dragons[state.dragons.length - 1]
      if (last !== dragon) state.dragons[i] = last
      state.dragons.pop()
      continue
    }

    // 全局减速注入到龙的独立 slowTimer（取 max，优先冰封）
    if (globalSlow) {
      dragon.slowTimer = 0.2  // 每帧刷新，保持减速状态
      dragon.slowed    = true
    }

    // 持续伤害应用（灼烧 + 毒素）
    if (hasBurn || hasToxin) {
      for (let si = dragon.segments.length - 1; si >= 0; si--) {
        const seg = dragon.segments[si]
        
        // 🎯 关键修复：跳过已死亡的节段
        if (seg.hp <= 0) continue
        
        let dmg = 0
        if (hasBurn)  dmg += burnDPS  * dt
        if (hasToxin) dmg += toxinDPS * dt
        if (dmg > 0) {
          seg.hp -= dmg
          if (seg.hp <= 0) handleSegmentDeath(state, dragon, si)
        }
      }
    }

    // energyField：能量涌动持续伤害（以随机存活龙为中心）
    if (energyFieldStacks > 0) {
      for (let si = dragon.segments.length - 1; si >= 0; si--) {
        const seg = dragon.segments[si]
        if (seg.hp <= 0) continue
        const distX = seg.x - rangeCenterX
        const distY = seg.y - rangeCenterY
        if (distX * distX + distY * distY < energyRSquared) {
          const efDmg = (state.bulletDamage * 0.08 * energyFieldStacks) * dt
          if (efDmg > 0) {
            seg.hp -= efDmg
            if (seg.hp <= 0) handleSegmentDeath(state, dragon, si)
          }
        }
      }
    }

    // blast：爆裂冲击（以随机存活龙为中心）
    if (blastStacks > 0) {
      for (let si = dragon.segments.length - 1; si >= 0; si--) {
        const seg = dragon.segments[si]
        if (seg.hp <= 0) continue
        const dx = seg.x - rangeCenterX
        const dy = seg.y - rangeCenterY
        if (dx * dx + dy * dy < blastRadiusSquared) {
          const dmg = state.bulletDamage * 0.15 * blastStacks * dt  // 每秒伤害
          if (dmg > 0) {
            seg.hp -= dmg
            if (seg.hp <= 0) handleSegmentDeath(state, dragon, si)
          }
        }
      }
    }

    // slash：横向横扫（以随机存活龙为中心）
    if (slashStacks > 0) {
      const slashHalfH = 60 + slashStacks * 10  // 横扫高度范围
      for (let si = dragon.segments.length - 1; si >= 0; si--) {
        const seg = dragon.segments[si]
        if (seg.hp <= 0) continue
        const dx = seg.x - rangeCenterX
        const dy = seg.y - rangeCenterY
        // 以龙为中心，横扫宽度范围内，高度范围内
        if (Math.abs(dx) < BASE_W * (0.4 + slashStacks * 0.05) && Math.abs(dy) < slashHalfH) {
          const dmg = state.bulletDamage * 0.12 * slashStacks * dt
          if (dmg > 0) {
            seg.hp -= dmg
            if (seg.hp <= 0) handleSegmentDeath(state, dragon, si)
          }
        }
      }
    }

    // splash：范围溅射（以随机存活龙为中心）
    if (splashStacks > 0) {
      for (let si = dragon.segments.length - 1; si >= 0; si--) {
        const seg = dragon.segments[si]
        if (seg.hp <= 0) continue
        const dx = seg.x - rangeCenterX
        const dy = seg.y - rangeCenterY
        if (dx * dx + dy * dy < splashRadiusSquared) {
          const dmg = state.bulletDamage * 0.1 * splashStacks * dt
          if (dmg > 0) {
            seg.hp -= dmg
            if (seg.hp <= 0) handleSegmentDeath(state, dragon, si)
          }
        }
      }
    }

    // chainBlast：连锁爆破（以随机存活龙为中心）
    if (chainBlastStacks > 0) {
      for (let si = dragon.segments.length - 1; si >= 0; si--) {
        const seg = dragon.segments[si]
        if (seg.hp <= 0) continue
        const dx = seg.x - rangeCenterX
        const dy = seg.y - rangeCenterY
        if (dx * dx + dy * dy < chainRadiusSquared) {
          const dmg = state.bulletDamage * 0.12 * chainBlastStacks * dt
          if (dmg > 0) {
            seg.hp -= dmg
            if (seg.hp <= 0) handleSegmentDeath(state, dragon, si)
          }
        }
      }
    }

    updateDragon(dragon, dt)

    // 检查龙是否碰到玩家（任何一段碰到玩家都gameover）
    if (dragon.alive) {
      const playerY = state.playerY || BASE_H - 55
      for (const seg of dragon.segments) {
        const dx = seg.x - state.playerX
        const dy = seg.y - playerY
        if (dx * dx + dy * dy < (seg.size + 20) * (seg.size + 20)) {
          // 碰撞！直接 gameover
          state.phase = 'gameOver'
          setTimeout(() => { _gameOverCallback?.() }, 2000)
          return
        }
      }
    }

    // 检查是否到达终点（龙头触底 = 游戏结束）
    const headPos = getDragonHeadPosition(dragon)
    if (headPos && headPos.y >= BASE_H - 20) {
      state.playerHP--
      audioService.lose()
      dragon.alive = false
      state.levelProgress++  // 到达终点的龙也计入进度
      
      // 显示提示
      const ft = getFloatTextFromPool()
      ft.x = BASE_W / 2
      ft.y = BASE_H / 3
      ft.text = `⚠️ ${state.levelProgress}/${state.levelTarget}`
      ft.color = '#FF4444'
      ft.life = 1.5
      ft.vy = -0.5
      ft.size = 20
      state.floatTexts.push(ft)

      if (state.playerHP <= 0) {
        state.phase = 'gameOver'
        setTimeout(() => { _gameOverCallback?.() }, 3000)
      } else {
        // 非即死：给予短暂无敌并显示提示
        state.invincibleTimer = 1.5
        const ft2 = getFloatTextFromPool()
        ft2.x = BASE_W / 2
        ft2.y = BASE_H / 2
        ft2.text = '⚠️ 怪物入侵！'
        ft2.color = '#FF4444'
        ft2.life = 1.5
        ft2.vy = -0.5
        ft2.size = 22
        state.floatTexts.push(ft2)
      }
    }
  }
}

/**
 * 更新计时器（挑战模式）
 */
export function updateTimer(state: GameState, dt: number) {
  if (state.mode === 'challenge' && !state.isPaused) {
    state.timeLeft -= dt
    if (state.timeLeft <= 0) {
      state.timeLeft = 0
      // 时间到通关
      state.phase = 'gameOver'
    }
  }
}

/**
 * 关卡升级检查
 */
export function checkLevelUp(state: GameState): boolean {
  // 获取当前关卡的路线数量
  const allRoutes = routeLoader.getRoutesForLevel(state.level)
  const routeCount = allRoutes.length
  
  // 检查是否所有路线的龙都已消灭
  if (state.levelProgress >= state.levelTarget && routeCount > 0) {
    console.log(`✅ 第${state.level}关完成！共${routeCount}条路线，已消灭${state.levelProgress}条龙`)
    
    // 🎯 关键修复：保存本关的统计数据
    state.levelCompleteScore = state.score
    state.levelCompleteKills = state.totalKills
    
    state.level++
    state.levelProgress = 0
    state.dragonsSpawnedInLevel = 0  // 重置本关生成计数
    
    // 根据新关卡的路线数量设置目标
    const nextRoutes = routeLoader.getRoutesForLevel(state.level)
    state.levelTarget = nextRoutes.length > 0 ? nextRoutes.length : 3
    
    // 设置最大同时存在的龙数（等于路线数）
    state.maxDragons = state.levelTarget
    
    state.currentScene = (state.currentScene + 1) % SCENES.length

    // 奖励
    if (state.playerHP < state.playerMaxHP) state.playerHP++
    state.invincibleTimer = 3

    // 🎯 关键修复：直接进入过渡动画，自动进入下一关（无需点击）
    state.isPaused = true
    state.levelTransition = true
    state.levelTransitionTimer = 1.5  // 1.5秒过渡时间（让玩家看清统计信息）
    
    console.log(`🚀 自动进入第${state.level}关...`)
    
    // 延迟执行关卡初始化，等待过渡动画播放
    setTimeout(() => {
      const nextRoutes = routeLoader.getRoutesForLevel(state.level)
      console.log(`📊 获取到 ${nextRoutes.length} 条路线`)

      // 清除旧数据
      state.dragons = []
      state.bullets = []
      state.powerUps = []
      state.particles = []
      state.floatTexts = []
      state.coinDrops = []

      // 重置闯关状态
      state.levelProgress = 0
      state.dragonsSpawnedInLevel = 0
      state.levelTarget = nextRoutes.length > 0 ? nextRoutes.length : 3
      state.maxDragons = state.levelTarget

      // 玩家位置重置
      const firstRoute = nextRoutes[0]
      if (firstRoute?.playerStartX !== undefined && firstRoute?.playerStartY !== undefined) {
        state.playerX = firstRoute.playerStartX
        state.playerY = firstRoute.playerStartY
        state.playerStartX = firstRoute.playerStartX
        state.playerStartY = firstRoute.playerStartY
        console.log(`🎯 使用自定义起点: (${state.playerX}, ${state.playerY})`)
      } else {
        state.playerX = BASE_W / 2
        state.playerY = BASE_H - 55
        state.playerStartX = BASE_W / 2
        state.playerStartY = BASE_H - 55
        console.log(`🎯 使用默认起点: (${state.playerX}, ${state.playerY})`)
      }

      state.phase = 'playing'
      state.levelTransition = false  // 清除过渡状态
      state.isPaused = false
      
      console.log(`✅ 关卡初始化完成: phase=${state.phase}, levelTarget=${state.levelTarget}`)
      
      // 显示关卡开始提示
      state.floatTexts.push({
        x: BASE_W / 2, y: BASE_H / 2,
        text: `🎉 第${state.level}关!`,
        color: '#FFD700', life: 2, vy: -0.5, size: 28
      })
    }, 1200)  // 1200ms后初始化关卡（给过渡动画留300ms余量）

    audioService.levelUp()
    return true
  }
  return false
}

/**
 * 开始下一关（从关卡完成界面调用）
 */
export function startNextLevel(state: GameState) {
  console.log(`🚀 startNextLevel 被调用, 当前关卡: ${state.level}, phase: ${state.phase}`)
  
  // 🎯 关键修复：先启用过渡动画，延迟初始化关卡
  state.levelTransition = true
  state.levelTransitionTimer = 1.0  // 1秒过渡时间
  state.isPaused = false
  
  console.log(`✅ 进入过渡状态: levelTransition=${state.levelTransition}, timer=${state.levelTransitionTimer}`)
  
  // 延迟执行关卡初始化，等待过渡动画播放
  setTimeout(() => {
    const nextRoutes = routeLoader.getRoutesForLevel(state.level)
    console.log(`📊 获取到 ${nextRoutes.length} 条路线`)

    // 清除旧数据
    state.dragons = []
    state.bullets = []
    state.powerUps = []
    state.particles = []
    state.floatTexts = []
    state.coinDrops = []

    // 重置闯关状态
    state.levelProgress = 0
    state.dragonsSpawnedInLevel = 0
    state.levelTarget = nextRoutes.length > 0 ? nextRoutes.length : 3
    state.maxDragons = state.levelTarget

    // 🎯 玩家伤害随关卡提升：每关 +12%
    const levelBonus = Math.pow(1.12, state.level - 1)  // 第1关1.0, 第2关1.12, 第3关1.25...
    const newDamage = Math.floor(15 * levelBonus)
    state.bulletDamage = newDamage
    console.log(`⚔️ 第${state.level}关 玩家伤害: ${state.bulletDamage} (倍率: ${levelBonus.toFixed(2)}x)`)

    // 🎯 显示伤害升级飘字反馈
    const ftDmg = getFloatTextFromPool()
    ftDmg.x = state.playerX
    ftDmg.y = state.playerY - 50
    ftDmg.text = `⚔️ 伤害 +${newDamage}`
    ftDmg.color = '#FFD700'
    ftDmg.life = 2.0
    ftDmg.vy = -0.8
    ftDmg.size = 18
    state.floatTexts.push(ftDmg)

    // 玩家位置重置
    const firstRoute = nextRoutes[0]
    if (firstRoute?.playerStartX !== undefined && firstRoute?.playerStartY !== undefined) {
      state.playerX = firstRoute.playerStartX
      state.playerY = firstRoute.playerStartY
      state.playerStartX = firstRoute.playerStartX
      state.playerStartY = firstRoute.playerStartY
      console.log(`🎯 使用自定义起点: (${state.playerX}, ${state.playerY})`)
    } else {
      state.playerX = BASE_W / 2
      state.playerY = BASE_H - 55
      state.playerStartX = BASE_W / 2
      state.playerStartY = BASE_H - 55
      console.log(`🎯 使用默认起点: (${state.playerX}, ${state.playerY})`)
    }

    state.phase = 'playing'
    state.levelTransition = false  // 清除过渡状态
    
    console.log(`✅ 关卡初始化完成: phase=${state.phase}, levelTarget=${state.levelTarget}`)
    
    // 显示关卡开始提示
    state.floatTexts.push({
      x: BASE_W / 2, y: BASE_H / 2,
      text: `🎉 第${state.level}关!`,
      color: '#FFD700', life: 2, vy: -0.5, size: 28
    })
  }, 800)  // 800ms后初始化关卡（给过渡动画留200ms余量）
}

/**
 * 暂停切换
 */
export function togglePause(state: GameState) {
  state.isPaused = !state.isPaused
}

/**
 * 自定义路线管理
 */
export function loadCustomRoutes(customRoutes: CustomRoute[]): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const routes = JSON.parse(stored)
      if (Array.isArray(routes)) {
        customRoutes.length = 0
        customRoutes.push(...routes)
        console.log(`✅ 已加载 ${customRoutes.length} 条自定义路线`)
      }
    }
  } catch (error) {
    console.error('❌ 加载自定义路线失败:', error)
    customRoutes.length = 0
  }
}

export function saveCustomRoutes(customRoutes: CustomRoute[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customRoutes))
    console.log(`✅ 已保存 ${customRoutes.length} 条自定义路线`)
  } catch (error) {
    console.error('❌ 保存自定义路线失败:', error)
  }
}

/**
 * 生成爆炸粒子效果（使用对象池）
 */
function spawnExplosionParticles(state: GameState, x: number, y: number, color: string, size: number): void {
  const count = Math.floor(size * 0.6)
  for (let i = 0; i < count; i++) {
    if (state.particles.length >= MAX_PARTICLES) break
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 3
    const p = getParticleFromPool()
    p.x = x
    p.y = y
    p.vx = Math.cos(angle) * speed
    p.vy = Math.sin(angle) * speed
    p.life = 0.4 + Math.random() * 0.3
    p.maxLife = 0.7
    p.size = 2 + Math.random() * 2
    p.color = i % 2 === 0 ? color : lightenColor(color, 20)
    state.particles.push(p)
  }

  if (size > 8 && state.particles.length < MAX_PARTICLES) {
    const p = getParticleFromPool()
    p.x = x
    p.y = y
    p.vx = 0
    p.vy = 0
    p.life = 0.1
    p.maxLife = 0.1
    p.size = size * 1.2
    p.color = lightenColor(color, 40)
    state.particles.push(p)
  }

  const emberCount = Math.floor(size * 0.3)
  for (let i = 0; i < emberCount; i++) {
    if (state.particles.length >= MAX_PARTICLES) break
    const angle = Math.random() * Math.PI * 2
    const speed = 0.3 + Math.random() * 0.8
    const p = getParticleFromPool()
    p.x = x + (Math.random() - 0.5) * size * 0.5
    p.y = y + (Math.random() - 0.5) * size * 0.5
    p.vx = Math.cos(angle) * speed * 0.5
    p.vy = Math.sin(angle) * speed * 0.5 - 0.3
    p.life = 0.6 + Math.random() * 0.4
    p.maxLife = 1.0
    p.size = 1 + Math.random() * 1.5
    p.color = '#FF6347'
    state.particles.push(p)
  }
}

/**
 * 龙死亡特效（使用对象池）
 */
function spawnDeathEffect(state: GameState, dragon: Dragon): void {
  // 对每个节段产生爆炸效果
  for (const seg of dragon.segments) {
    spawnExplosionParticles(state, seg.x, seg.y, seg.color, seg.size)
  }
  // 死亡飘字
  const ft = getFloatTextFromPool()
  ft.x = dragon.segments[0]?.x ?? 0
  ft.y = dragon.segments[0]?.y ?? 0
  ft.text = '💀'
  ft.color = '#FF6B6B'
  ft.life = 1
  ft.vy = -1
  ft.size = 24
  state.floatTexts.push(ft)
}
