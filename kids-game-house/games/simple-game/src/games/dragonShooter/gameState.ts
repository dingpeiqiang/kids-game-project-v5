// ============================================
// dragonShooter 游戏状态管理 & 核心循环
// ============================================

import type {
  GameState, Dragon, Bullet, Particle, PowerUp, FloatText,
  CoinDrop, Cloud, Dust, CustomRoute
} from './types'
import type { RouteEditor } from './routes'
import { audioService } from '../../services/audio'
import {
  BASE_W, BASE_H, CANVAS_W, CANVAS_H, CANVAS_OFFSET_X,
  COLORS, SCENES, DRAGON_CONFIGS, POWERUP_ICONS, BUFF_OPTIONS,
  MAX_PARTICLES, MAX_POWERUPS, MAX_COIN_DROPS, MAX_FLOAT_TEXTS, MAX_BULLETS,
  STORAGE_KEY
} from './constants'
import { lightenColor, spawnExplosionParticles, spawnDeathEffect } from './effects'
import {
  createDragon as _createDragon,
  updateDragon,
  killDragonSegment,
  splitDragon,
  isDragonDead,
  getDragonHeadPosition,
  DRAGON_SEGMENT_GAP
} from './dragon'
import { routeLoader } from './routeLoader'

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
    playerHP: 3,
    playerMaxHP: 3,
    invincibleTimer: 0,
    bulletDamage: 10,
    bulletSpeed: 7,
    shootCooldown: 450,
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
    currentScene: 0,
    isPaused: false,
    touch: { active: false, startX: 0, startY: 0, currentX: 0, startTime: 0 },
    dragCount: 0,
    maxDragons: 1,
    isRouteEditMode: false,
    isRouteSelectMode: false
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
  for (let i = state.floatTexts.length - 1; i >= 0; i--) {
    const ft = state.floatTexts[i]
    ft.life -= dt
    ft.y += ft.vy
    if (ft.life <= 0) state.floatTexts.splice(i, 1)
  }
}

/**
 * 更新粒子效果
 */
export function updateParticles(state: GameState, dt: number) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i]
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.15 // 重力
    p.life -= dt
    if (p.life <= 0) state.particles.splice(i, 1)
  }
  // 性能限制
  while (state.particles.length > MAX_PARTICLES) state.particles.shift()
}

/**
 * 更新金币掉落
 */
export function updateCoinDrops(state: GameState, dt: number) {
  for (let i = state.coinDrops.length - 1; i >= 0; i--) {
    const c = state.coinDrops[i]
    c.y += c.vy
    c.vy += 0.3
    c.life -= dt
    // 收集检测（简化：玩家附近自动收集）
    const dx = c.x - state.playerX
    const dy = c.y - (BASE_H - 55)
    if (Math.sqrt(dx * dx + dy * dy) < 40) {
      state.coins++
      state.coinDrops.splice(i, 1)
      state.floatTexts.push({ x: c.x, y: c.y, text: '+$1', color: '#FFD700', life: 1, vy: -1, size: 16 })
      continue
    }
    if (c.life <= 0 || c.y > BASE_H + 20) state.coinDrops.splice(i, 1)
  }
  while (state.coinDrops.length > MAX_COIN_DROPS) state.coinDrops.shift()
}

/**
 * 更新道具
 */
export function updatePowerUps(state: GameState, dt: number) {
  for (let i = state.powerUps.length - 1; i >= 0; i--) {
    const p = state.powerUps[i]
    p.bobPhase += dt * 3
    p.life -= dt

    // 玩家收集检测
    const dx = p.x - state.playerX
    const dy = p.y - (BASE_H - 55)
    if (Math.sqrt(dx * dx + dy * dy) < 35) {
      applyBuff(state, p.type)
      state.powerUps.splice(i, 1)
      state.floatTexts.push({ x: p.x, y: p.y, text: BUFF_OPTIONS.find(b => b.id === p.type)?.name || '', color: '#FFF', life: 1.2, vy: -0.8, size: 18 })
      continue
    }

    if (p.life <= 0) state.powerUps.splice(i, 1)
  }
  while (state.powerUps.length > MAX_POWERUPS) state.powerUps.shift()
}

/**
 * 应用 Buff 效果
 */
function applyBuff(state: GameState, type: string) {
  switch (type) {
    case 'damage':
      state.bulletDamage++
      break
    case 'multiShot':
      state.bulletCount = Math.min(5, state.bulletCount + 1)
      break
    case 'pierce':
      state.bulletPierce++
      break
    case 'heal':
      if (state.playerHP < state.playerMaxHP) state.playerHP++
      break
  }
}

/**
 * 射击逻辑
 */
export function shoot(state: GameState) {
  const now = Date.now()
  if (now - state.lastShotTime < state.shootCooldown) return
  state.lastShotTime = now

  const baseAngle = -Math.PI / 2
  const spread = 0.08
  const count = state.bulletCount

  for (let i = 0; i < count; i++) {
    let angle = baseAngle
    if (count > 1) angle = baseAngle + ((i / (count - 1)) - 0.5) * spread * (count - 1)

    if (state.bullets.length >= MAX_BULLETS) state.bullets.shift()

    state.bullets.push({
      x: state.playerX,
      y: BASE_H - 80,
      vx: Math.cos(angle) * state.bulletSpeed,
      vy: Math.sin(angle) * state.bulletSpeed,
      damage: state.bulletDamage,
      pierce: state.bulletPierce,
      size: 6
    })

    audioService.pop()
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
      state.bullets.splice(bi, 1)
      continue
    }

    // 龙碰撞检测
    for (let di = state.dragons.length - 1; di >= 0; di--) {
      const dragon = state.dragons[di]
      if (!dragon.alive) continue

      for (let si = dragon.segments.length - 1; si >= 0; si--) {
        const seg = dragon.segments[si]
        const dx = b.x - seg.x
        const dy = b.y - seg.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < seg.size + b.size) {
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
          state.floatTexts.push({
            x: seg.x, y: seg.y - seg.size - 8,
            text: `-${b.damage}`,
            color: state.combo > 5 ? '#FFD700' : '#FFFFFF',
            life: 0.8, vy: -1.2, size: 14 + Math.min(state.combo, 10)
          })

          // 命中闪白效果（通过 effects 模块）
          // 粒子效果
          for (let k = 0; k < 4; k++) {
            if (state.particles.length < MAX_PARTICLES) {
              state.particles.push({
                x: seg.x, y: seg.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 0.4 + Math.random() * 0.3,
                maxLife: 0.7,
                size: 2 + Math.random() * 3,
                color: seg.color
              })
            }
          }

          // 节段死亡
          if (seg.hp <= 0) {
            handleSegmentDeath(state, dragon, si)
          }

          // 子弹穿透
          if (b.pierce > 0) {
            b.pierce--
            b.size *= 0.85 // 减小尺寸
          } else {
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
  
  // 死亡特效
  spawnExplosionParticles(state, seg.x, seg.y, seg.color, 12)
  audioService.click()
  
  // 掉落道具
  if (seg.attachedPowerUp && state.powerUps.length < MAX_POWERUPS) {
    state.powerUps.push({
      x: seg.x, y: seg.y,
      type: seg.attachedPowerUp,
      life: 8,
      bobPhase: Math.random() * Math.PI * 2
    })
  }
  
  // 金币掉落（概率）
  if (Math.random() < 0.15 && state.coinDrops.length < MAX_COIN_DROPS) {
    state.coinDrops.push({
      x: seg.x, y: seg.y,
      vy: -3 - Math.random() * 2,
      life: 5
    })
  }

  // 分裂或死亡
  killDragonSegment(dragon, segmentIndex)

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
          state.coinDrops.push({
            x: dragon.segments[0].x + (Math.random() - 0.5) * 40,
            y: dragon.segments[0].y + (Math.random() - 0.5) * 30,
            vy: -4 - Math.random() * 3,
            life: 6
          })
        }
      }
    }

    dragon.alive = false
    state.levelProgress++
  } else if (dragon.type !== 'small' && DRAGON_CONFIGS[dragon.type]?.canSplit !== false) {
    // 分裂成两条小龙
    const splitIdx = Math.max(1, Math.floor(dragon.segments.length / 2))
    splitDragon(state, dragon, splitIdx)
    // splitDragon 内部已将新龙 push 到 state.dragons
    state.maxDragons = Math.min(6, state.maxDragons + 1)
  }
}

/**
 * 生成龙（根据关卡进度）
 */
export function spawnDragons(state: GameState) {
  if (state.dragons.filter(d => d.alive).length >= state.maxDragons) return
  
  // 根据关卡决定龙类型
  let type: Dragon['type'] = 'small'
  const r = Math.random()
  
  if (state.level >= 8 && r < 0.05) type = 'boss'
  else if (state.level >= 5 && r < 0.15) type = 'elite'
  else if (state.level >= 3 && r < 0.3) type = 'large'
  else if (state.level >= 2 && r < 0.45) type = 'medium'
  else if (r < 0.08) type = 'treasure'
  else if (r < 0.04) type = 'coin'

  // 选择路线
  const routes = routeLoader.getRoutesForLevel(state.level)
  const route = routes[Math.floor(Math.random() * routes.length)]
  
  if (!route || route.points.length < 10) return

  const dragon = _createDragon(0, type, route, state.level)
  dragon.id = ++state.lastDragonId
  
  state.dragons.push(dragon)
  console.log(`🐉 生成 ${type} 龙 #${dragon.id}, 节数: ${dragon.segments.length}`)
}

/**
 * 更新所有龙的状态
 */
/** 游戏结束回调（由 index.ts 注入） */
let _gameOverCallback: (() => void) | null = null
export function setGameOverCallback(cb: () => void) { _gameOverCallback = cb }

export function updateDragons(state: GameState, dt: number) {
  for (let i = state.dragons.length - 1; i >= 0; i--) {
    const dragon = state.dragons[i]
    
    if (!dragon.alive) {
      state.dragons.splice(i, 1)
      continue
    }

    updateDragon(dragon, dt)

    // 检查是否到达终点（龙头超出游戏区域底部）
    const headPos = getDragonHeadPosition(dragon)
    if (headPos && headPos.y > BASE_H + 50) {
      // 龙到达底部，玩家受伤
      if (state.invincibleTimer <= 0) {
        state.playerHP--
        state.invincibleTimer = 2
        audioService.lose()
        
        if (state.playerHP <= 0) {
          state.phase = 'gameOver'
          // 3秒后自动返回主界面
          setTimeout(() => {
            _gameOverCallback?.()
          }, 3000)
        }
      }
      // 龙到底后移除（不管是否造成伤害）
      dragon.alive = false
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
  if (state.levelProgress >= state.levelTarget) {
    state.level++
    state.levelProgress = 0
    state.levelTarget = Math.min(8, 3 + Math.floor(state.level * 0.5))
    state.currentScene = (state.currentScene + 1) % SCENES.length
    
    // 奖励
    if (state.playerHP < state.playerMaxHP) state.playerHP++
    state.invincibleTimer = 3
    
    state.floatTexts.push({
      x: BASE_W / 2, y: BASE_H / 2,
      text: `🎉 第${state.level}关!`,
      color: '#FFD700', life: 2, vy: -0.5, size: 28
    })
    
    audioService.buff()
    return true
  }
  return false
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
