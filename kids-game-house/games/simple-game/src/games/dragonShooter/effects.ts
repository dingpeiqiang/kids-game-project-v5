// ============================================
// dragonShooter 特效系统
// ============================================

import type { Particle, FloatText, HitFlash, DragonSegment, PowerUp, CoinDrop, Dragon } from './types'
import { MAX_PARTICLES, MAX_POWERUPS, MAX_COIN_DROPS, MAX_FLOAT_TEXTS, POWERUP_ICONS, BASE_H, BASE_W, COLORS } from './constants'
import type { GameState } from './types'

// 缓动函数：easeOutCubic
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// 创建爆炸效果
export function createExplosion(
  state: GameState,
  x: number,
  y: number,
  color: string,
  size: number
) {
  const count = Math.floor(size * 0.6)
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 3
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7,
      size: 2 + Math.random() * 2,
      color: i % 2 === 0 ? color : lightenColor(color, 20)
    })
  }

  if (size > 8) {
    state.particles.push({
      x, y,
      vx: 0,
      vy: 0,
      life: 0.1,
      maxLife: 0.1,
      size: size * 1.2,
      color: lightenColor(color, 40)
    })
  }

  const emberCount = Math.floor(size * 0.3)
  for (let i = 0; i < emberCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 0.3 + Math.random() * 0.8
    state.particles.push({
      x: x + (Math.random() - 0.5) * size * 0.5,
      y: y + (Math.random() - 0.5) * size * 0.5,
      vx: Math.cos(angle) * speed * 0.5,
      vy: Math.sin(angle) * speed * 0.5 - 0.3,
      life: 0.6 + Math.random() * 0.4,
      maxLife: 1.0,
      size: 1 + Math.random() * 1.5,
      color: '#FF6347'
    })
  }
}

// 创建命中效果
export function createHitEffect(state: GameState, x: number, y: number, color: string) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1.5 + Math.random() * 3
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5,
      maxLife: 0.5,
      size: 2 + Math.random() * 3,
      color
    })
  }

  if (state.combo > 1) {
    state.floatTexts.push({
      x: x,
      y: y - 10,
      text: `x${Math.min(state.combo, 99)}`,
      color: COLORS.gold,
      life: 0.8,
      vy: -2,
      size: 14
    })
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 道具视觉特效（让玩家明显感知使用效果）
// ═══════════════════════════════════════════════════════════

/** 触发全屏冲击波特效 */
export function triggerScreenWave(state: GameState, color: string) {
  // 同时触发屏幕闪烁（背景色淡入淡出）
  state.screenFlash = { color, alpha: 0.5, duration: 0.3 }
  state.powerupEffects.screenWave = {
    color,
    alpha: 0.8,
    radius: 0,
    maxRadius: Math.max(BASE_W, BASE_H) * 1.5,
    speed: 1200  // 加速让波纹更明显
  }
}

/** 创建环形冲击波（向外扩散的环） */
export function createRingWave(state: GameState, x: number, y: number, color: string) {
  for (let i = 0; i < 4; i++) {  // 增加环数量
    state.particles.push({
      x, y,
      vx: 0, vy: 0,
      life: 1.0,  // 延长持续时间
      maxLife: 1.0,
      size: 35 + i * 25,  // 增大尺寸
      color,
      ring: true
    } as Particle & { ring: boolean })
  }
}

/** 创建能量爆发（向四周扩散的能量球） */
export function createEnergyBurst(state: GameState, x: number, y: number, color: string, count: number = 12) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const speed = 6 + Math.random() * 6  // 加快速度
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.8,
      maxLife: 0.8,
      size: 10 + Math.random() * 6,  // 增大尺寸
      color
    })
  }
}

/** 创建火焰/灼烧粒子 */
export function createFireEffect(state: GameState, x: number, y: number, color: string = '#FF4500') {
  for (let i = 0; i < 30; i++) {  // 增加粒子数
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 4
    state.particles.push({
      x: x + (Math.random() - 0.5) * 50,
      y: y + (Math.random() - 0.5) * 50,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 0.8 + Math.random() * 0.5,
      maxLife: 1.3,
      size: 5 + Math.random() * 7,  // 增大尺寸
      color: i % 3 === 0 ? '#FFD700' : color
    })
  }
}

/** 创建冰冻效果 */
export function createFreezeEffect(state: GameState, x: number, y: number) {
  for (let i = 0; i < 25; i++) {  // 增加粒子数
    const angle = Math.random() * Math.PI * 2
    const dist = 20 + Math.random() * 70
    state.particles.push({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: Math.cos(angle) * 0.8,
      vy: Math.sin(angle) * 0.8 - 1.5,
      life: 1.0,
      maxLife: 1.0,
      size: 6 + Math.random() * 6,
      color: '#00CED1'
    })
  }
}

/** 创建毒素云雾 */
export function createToxinCloud(state: GameState, x: number, y: number) {
  for (let i = 0; i < 10; i++) {
    state.particles.push({
      x: x + (Math.random() - 0.5) * 100,
      y: y + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1.5,
      maxLife: 1.5,
      size: 15 + Math.random() * 15,
      color: '#6C5CE7'
    })
  }
}

/** 创建剑气效果（长条形冲击） */
export function createSlashWave(state: GameState, x: number, y: number, width: number, height: number, color: string) {
  for (let i = 0; i < 8; i++) {
    state.particles.push({
      x: x + (Math.random() - 0.5) * width,
      y: y + (Math.random() - 0.5) * height,
      vx: (Math.random() - 0.5) * 2,
      vy: -5 - Math.random() * 5,
      life: 0.3,
      maxLife: 0.3,
      size: 8 + Math.random() * 8,
      color
    })
  }
}

/** 创建暴击光效 */
export function createCritEffect(state: GameState, x: number, y: number) {
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    for (let j = 0; j < 6; j++) {
      state.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * (3 + j * 0.5),
        vy: Math.sin(angle) * (3 + j * 0.5),
        life: 0.4,
        maxLife: 0.4,
        size: 4 + j,
        color: '#FF1493'
      })
    }
  }
}

/** 创建防御降低标记（红色下降箭头） */
export function createDefDownEffect(state: GameState, dragons: Dragon[]) {
  for (const dragon of dragons) {
    if (dragon.alive) {
      const head = dragon.segments[0]
      if (head) {
        for (let i = 0; i < 5; i++) {
          state.particles.push({
            x: head.x + (Math.random() - 0.5) * 20,
            y: head.y - 10,
            vx: 0,
            vy: 2 + Math.random() * 2,
            life: 0.6,
            maxLife: 0.6,
            size: 6,
            color: '#636E72'
          })
        }
      }
    }
  }
}

// 命中闪白效果
let hitFlashes: HitFlash[] = []

export function createHitFlash(seg: DragonSegment) {
  hitFlashes.push({
    x: seg.x,
    y: seg.y,
    timer: 0.1,
    originalColor: seg.color
  })
}

export function updateHitFlashes(dt: number) {
  for (let i = hitFlashes.length - 1; i >= 0; i--) {
    hitFlashes[i].timer -= dt
    if (hitFlashes[i].timer <= 0) {
      hitFlashes.splice(i, 1)
    }
  }
}

export function isFlashing(x: number, y: number): HitFlash | undefined {
  return hitFlashes.find(f => Math.abs(f.x - x) < 5 && Math.abs(f.y - y) < 5)
}

export function clearHitFlashes() {
  hitFlashes = []
}

// 更新粒子
export function updateParticles(state: GameState, dt: number) {
  while (state.particles.length > MAX_PARTICLES) {
    state.particles.shift()
  }

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i]
    p.x += p.vx
    p.y += p.vy
    p.life -= dt
    p.size *= 0.97
    if (p.life <= 0) {
      state.particles.splice(i, 1)
    }
  }
}

// 更新道具
export function updatePowerUps(state: GameState, dt: number, applyPowerUp: (type: 'damage' | 'multiShot' | 'pierce' | 'heal') => void) {
  while (state.powerUps.length > MAX_POWERUPS) {
    state.powerUps.shift()
  }

  for (let i = state.powerUps.length - 1; i >= 0; i--) {
    const p = state.powerUps[i]
    p.y += 0.8
    p.life -= dt
    p.bobPhase += 0.05

    if (p.y > BASE_H + 30 || p.life <= 0) {
      state.powerUps.splice(i, 1)
      continue
    }

    const dist = Math.sqrt(
      Math.pow(p.x - state.playerX, 2) +
      Math.pow(p.y - (BASE_H - 55), 2)
    )
    if (dist < 38) {
      applyPowerUp(p.type)
      state.powerUps.splice(i, 1)
    }
  }
}

// 更新金币掉落
export function updateCoinDrops(state: GameState, dt: number) {
  while (state.coinDrops.length > MAX_COIN_DROPS) {
    state.coinDrops.shift()
  }

  for (let i = state.coinDrops.length - 1; i >= 0; i--) {
    const c = state.coinDrops[i]
    c.y += c.vy
    c.vy += 0.15
    c.life -= dt
    if (c.life <= 0 || c.y > BASE_H + 20) {
      state.coinDrops.splice(i, 1)
    }
  }
}

// 更新浮动文字
export function updateFloatTexts(state: GameState, dt: number) {
  while (state.floatTexts.length > MAX_FLOAT_TEXTS) {
    state.floatTexts.shift()
  }

  for (let i = state.floatTexts.length - 1; i >= 0; i--) {
    const ft = state.floatTexts[i]
    ft.y += ft.vy
    ft.life -= dt
    if (ft.life <= 0) {
      state.floatTexts.splice(i, 1)
    }
  }
}

// 更新云朵
export function updateClouds(state: GameState, BASE_W: number, BASE_H: number) {
  for (const cloud of state.clouds) {
    cloud.y += cloud.speed
    if (cloud.y > BASE_H + cloud.size) {
      cloud.y = -cloud.size
      cloud.x = Math.random() * BASE_W
    }
  }
  for (const dust of state.dusts) {
    dust.y += dust.speed
    if (dust.y > BASE_H + 10) {
      dust.y = -10
      dust.x = Math.random() * BASE_W
    }
  }
}

// 颜色变亮/变暗（带缓存，避免每帧重复解析 hex）
const _lightenCache = new Map<string, string>()
export function lightenColor(color: string, percent: number): string {
  const key = `${color}_${percent}`
  const cached = _lightenCache.get(key)
  if (cached) return cached
  let hex = color.replace('#', '')
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  const num = parseInt(hex, 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt))
  const result = `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1).padStart(6, '0')}`
  if (_lightenCache.size > 500) _lightenCache.clear()
  _lightenCache.set(key, result)
  return result
}

/** 生成爆炸粒子（别名，兼容 gameState.ts 调用） */
export function spawnExplosionParticles(state: GameState, x: number, y: number, color: string, size: number): void {
  createExplosion(state, x, y, color, size)
}

/** 龙死亡特效 */
export function spawnDeathEffect(state: GameState, dragon: Dragon): void {
  // 对每个节段产生爆炸效果
  for (const seg of dragon.segments) {
    createExplosion(state, seg.x, seg.y, seg.color, seg.size)
  }
  // 死亡飘字
  state.floatTexts.push({
    x: dragon.segments[0]?.x ?? 0,
    y: dragon.segments[0]?.y ?? 0,
    text: '💀',
    color: '#FF6B6B',
    life: 1,
    vy: -1,
    size: 24
  })
}