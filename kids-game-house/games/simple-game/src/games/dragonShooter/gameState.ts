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
import { lightenColor, spawnExplosionParticles, spawnDeathEffect } from './effects'
import {
  createDragon as _createDragon,
  updateDragon,
  killDragonSegment,
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
    // 关卡过渡
    levelTransition: false,
    levelTransitionTimer: 0,
    playerX: BASE_W / 2,
    playerHP: 3,
    playerMaxHP: 3,
    invincibleTimer: 0,
    freezeTimer: 0,
    shieldTimer: 0,
    slowAllTimer: 0,
    bigShotTimer: 0,
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
      audioService.coin()
      state.floatTexts.push({ x: c.x, y: c.y, text: '+$1', color: '#FFD700', life: 1, vy: -1, size: 16 })
      continue
    }
    if (c.life <= 0 || c.y > BASE_H + 20) state.coinDrops.splice(i, 1)
  }
  while (state.coinDrops.length > MAX_COIN_DROPS) state.coinDrops.shift()
}

/**
 * 更新道具（直接拾取型，已废弃，仅保留兼容）
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
  while (state.powerUps.length > MAX_POWERUPS) state.powerUps.shift()
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
  // 倒序删除避免索引偏移
  for (let i = toRemove.length - 1; i >= 0; i--) {
    state.activeBuffs.splice(toRemove[i], 1)
  }
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
  const bigShot = state.bigShotTimer > 0
  const bulletSz = bigShot ? 11 : 6
  const actualSpeed = state.bulletSpeed * (state.slowBulletTimer > 0 ? 0.6 : 1)

  for (let i = 0; i < count; i++) {
    let angle = baseAngle
    if (count > 1) angle = baseAngle + ((i / (count - 1)) - 0.5) * spread * (count - 1)

    if (state.bullets.length >= MAX_BULLETS) state.bullets.shift()

    state.bullets.push({
      x: state.playerX,
      y: BASE_H - 80,
      vx: Math.cos(angle) * actualSpeed,
      vy: Math.sin(angle) * actualSpeed,
      damage: state.bulletDamage,
      pierce: state.bulletPierce,
      size: bulletSz
    })

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

          audioService.hit()

          // 命中粒子效果
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

          const S = state as any
          // chainBlast：命中后触发连锁爆破
          if (S.chainBlastStacks > 0) {
            const chainR = 60 + S.chainBlastStacks * 10
            for (const drag of state.dragons) {
              if (!drag.alive) continue
              for (let si2 = drag.segments.length - 1; si2 >= 0; si2--) {
                const s2 = drag.segments[si2]
                const d2 = Math.sqrt((b.x - s2.x) ** 2 + (b.y - s2.y) ** 2)
                if (d2 < chainR && d2 > 0) {
                  const chainDmg = b.damage * 0.35
                  s2.hp -= chainDmg
                  state.floatTexts.push({ x: s2.x, y: s2.y - s2.size, text: `-${Math.round(chainDmg)}`, color: '#FF9F43', life: 0.5, vy: -1, size: 12 })
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
            for (const drag of state.dragons) {
              if (!drag.alive || drag === dragon) continue
              for (let si2 = drag.segments.length - 1; si2 >= 0; si2--) {
                const s2 = drag.segments[si2]
                const d2 = Math.sqrt((b.x - s2.x) ** 2 + (b.y - s2.y) ** 2)
                if (d2 < splashR + s2.size) {
                  s2.hp -= b.damage * 0.4  // 散射伤害 40%
                  if (s2.hp <= 0) handleSegmentDeath(state, drag, si2)
                }
              }
            }
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
  const killedPowerUp = seg.attachedPowerUp ?? null

  // 死亡特效
  spawnExplosionParticles(state, seg.x, seg.y, seg.color, 12)
  audioService.kill()

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

  // 翻开动画
  if (ps.revealedIdx !== null && ps.revealProgress < 1) {
    ps.revealProgress = Math.min(1, ps.revealProgress + dt * 4)
    if (ps.revealProgress >= 1) {
      ps.revealProgress = 1
      console.log('🃏 翻牌动画完成')
      setTimeout(() => {
        console.log('🃏 开始关闭动画')
        if (state.powerupSelect) state.powerupSelect.closing = true
      }, 500)
    }
  }

  // 关闭动画
  if (ps.closing && ps.closeProgress < 1) {
    ps.closeProgress = Math.min(1, ps.closeProgress + dt * 3)
    if (ps.closeProgress >= 1) {
      console.log('🃏 关闭动画完成，应用道具:', ps.cards[ps.revealedIdx!].name)
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
    state.floatTexts.push({
      x: state.playerX, y: BASE_H - 80,
      text, color: card.color, life: 1.5, vy: -1, size: 16
    })
  }
  const S = state as any

  switch (card.type) {
    // ── 一，普攻强化类（6）─────────────────────────────────────
    case 'rapidFire':     // 迅击弹：攻速大幅提升（叠加 shootCooldown 减少）
      S.rapidFireStacks = (S.rapidFireStacks || 0) + 1
      state.shootCooldown = Math.max(80, state.shootCooldown * 0.7)
      pushText('⚡ 迅击弹！')
      break
    case 'multiShot':     // 多重弹：额外弹道
      S.multiShotStacks = (S.multiShotStacks || 0) + 1
      state.bulletCount = Math.min(8, state.bulletCount + 1)
      pushText('🔫 多重弹！')
      break
    case 'armorPierce':   // 破甲弹：无视部分龙防御（穿透+1）
      S.armorPierceStacks = (S.armorPierceStacks || 0) + 1
      state.bulletPierce += 2
      pushText('🔪 破甲弹！')
      break
    case 'heavyHit':      // 重击弹：单发伤害大幅提高
      S.heavyHitStacks = (S.heavyHitStacks || 0) + 1
      state.bulletDamage = Math.floor(state.bulletDamage * 1.8)
      pushText('💪 重击弹！')
      break
    case 'rapidBurst':    // 连射增幅：短时间极速连射（临时极短冷却）
      S.rapidBurstStacks = (S.rapidBurstStacks || 0) + 1
      state.shootCooldown = Math.max(40, state.shootCooldown * 0.4)
      addOrRefreshBuff(state, 'rapidBurst', '连射增幅', '🔥', '#FF4500', 5)
      pushText('🔥 连射增幅！')
      break
    case 'autoAim':       // 精准锁定：子弹自动吸附龙身
      S.autoAimStacks = (S.autoAimStacks || 0) + 1
      state.bulletPierce += 1
      pushText('🎯 精准锁定！')
      break

    // ── 二，范围爆发类（6）─────────────────────────────────────
    case 'blast':         // 爆裂冲击：小范围爆炸
      S.blastStacks = (S.blastStacks || 0) + 1
      audioService.explosion()
      pushText('💥 爆裂冲击！')
      break
    case 'slash':         // 横向横扫：横向范围伤害（立即触发）
      S.slashStacks = (S.slashStacks || 0) + 1
      for (const dragon of state.dragons) {
        for (const seg of dragon.segments) {
          if (Math.abs(seg.y - state.playerX) < 120) {  // 横向范围
            seg.hp -= state.bulletDamage * 0.5
            if (seg.hp <= 0) handleSegmentDeath(state, dragon, dragon.segments.indexOf(seg))
          }
        }
      }
      pushText('⚔️ 横向横扫！')
      break
    case 'ringWave':      // 环形震荡：定时释放环形冲击波（叠加 timer）
      S.ringWaveStacks = (S.ringWaveStacks || 0) + 1
      S._ringWaveTimer = (S._ringWaveTimer || 0) + 3
      addOrRefreshBuff(state, 'ringWave', '环形震荡', '🌊', '#00CED1', 12)
      pushText('🌊 环形震荡！')
      break
    case 'windPressure':  // 全屏风压：大范围减速龙
      S.windPressureStacks = (S.windPressureStacks || 0) + 1
      state.slowAllTimer = Math.max(state.slowAllTimer, (state.slowAllTimer || 0) + 5)
      addOrRefreshBuff(state, 'windPressure', '全屏风压', '🌪️', '#87CEEB', 5)
      pushText('🌪️ 全屏风压！')
      break
    case 'chainBlast':    // 分段爆破：命中后连锁爆破（叠加）
      S.chainBlastStacks = (S.chainBlastStacks || 0) + 1
      pushText('⛓️ 分段爆破！')
      break
    case 'splash':        // 范围溅射：伤害小幅溅射周围（叠加溅射倍率）
      S.splashStacks = (S.splashStacks || 0) + 1
      pushText('💦 范围溅射！')
      break

    // ── 三，持续压制类（5）─────────────────────────────────────
    case 'burn':          // 持续灼烧：每帧对所有龙附加灼烧层数
      S.burnStacks = (S.burnStacks || 0) + 1
      pushText('🔥 持续灼烧！')
      break
    case 'slowField':     // 迟缓领域：降低整条龙移动速度
      S.slowFieldStacks = (S.slowFieldStacks || 0) + 1
      state.slowAllTimer = Math.max(state.slowAllTimer || 0, 8)
      addOrRefreshBuff(state, 'slowField', '迟缓领域', '❄️', '#87CEFA', 8)
      pushText('❄️ 迟缓领域！')
      break
    case 'toxin':         // 毒素侵蚀：持续叠加毒素掉血
      S.toxinStacks = (S.toxinStacks || 0) + 3
      addOrRefreshBuff(state, 'toxin', '毒素侵蚀', '☠️', '#9ACD32', 10)
      pushText('☠️ 毒素侵蚀！')
      break
    case 'energyField':   // 能量涌动：角色周围持续生成伤害圈（叠加）
      S.energyFieldStacks = (S.energyFieldStacks || 0) + 1
      addOrRefreshBuff(state, 'energyField', '能量涌动', '⚡', '#FFD700', 8)
      pushText('⚡ 能量涌动！')
      break
    case 'defDown':       // 减防光环：降低全场巨龙防御（叠加）
      S.defDownStacks = (S.defDownStacks || 0) + 1
      state.bulletDamage = Math.floor(state.bulletDamage * 1.15)
      pushText('🛡️ 减防光环！')
      break

    // ── 四，特殊斩杀类（3）─────────────────────────────────────
    case 'slashBlade':    // 断龙利刃：概率直接斩断一节龙身
      S.slashBladeStacks = (S.slashBladeStacks || 0) + 1
      // 立即触发一次斩断
      for (const dragon of state.dragons) {
        if (dragon.alive && dragon.segments.length > 3) {
          killDragonSegment(dragon, Math.floor(dragon.segments.length / 2))
          break
        }
      }
      pushText('🗡️ 断龙利刃！')
      break
    case 'executeWave':   // 斩杀剑气：纵向长剑气贯穿路线
      S.executeWaveStacks = (S.executeWaveStacks || 0) + 1
      audioService.lightning()
      pushText('⚡ 斩杀剑气！')
      break
    case 'crit':          // 极限暴击：大幅提升暴击概率
      S.critStacks = (S.critStacks || 0) + 1
      state.bulletDamage = Math.floor(state.bulletDamage * 1.5)
      pushText('💢 极限暴击！')
      break
  }
  audioService.buff()
}

/**
 * 生成龙（根据关卡进度）
 */
export function spawnDragons(state: GameState) {
  if (state.dragons.filter(d => d.alive).length >= state.maxDragons) return
  
  // 根据关卡决定龙类型（elite/boss 由 LEVEL_CONFIGS.eliteChance/bossChance 控制概率）
  let type: Dragon['type'] = 'small'
  const r = Math.random()
  const lvlIdx = Math.min(Math.max(0, state.level - 1), LEVEL_CONFIGS.length - 1)
  const lvlCfg = LEVEL_CONFIGS[lvlIdx]

  if (state.level >= 8 && r < lvlCfg.bossChance) type = 'boss'
  else if (state.level >= 5 && r < lvlCfg.bossChance + lvlCfg.eliteChance) type = 'elite'
  else if (state.level >= 3 && r < 0.3) type = 'large'
  else if (state.level >= 2 && r < 0.45) type = 'medium'

  // 选择路线：按已有龙的数量轮询，每条龙走不同路线
  const allRoutes = routeLoader.getRoutesForLevel(state.level)
  if (allRoutes.length === 0) return

  // 已有龙数量作为索引，轮询使用路线（多路线时每条龙走不同路线）
  const route = allRoutes[state.dragons.length % allRoutes.length]

  if (route.points.length < 10) return

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

  // ringWave 定时触发
  if ((S._ringWaveTimer || 0) > 0) {
    S._ringWaveTimer -= dt
    if (S._ringWaveTimer <= 0) {
      S._ringWaveTimer = 2  // 每2秒触发一次
      // 以玩家为中心生成环形冲击波
      audioService.explosion()
      for (const dragon of state.dragons) {
        for (let si = dragon.segments.length - 1; si >= 0; si--) {
          const seg = dragon.segments[si]
          const dist = Math.sqrt((seg.x - state.playerX) ** 2 + (seg.y - (BASE_H - 55)) ** 2)
          if (dist < 150) {
            const dmg = state.bulletDamage * 0.3
            seg.hp -= dmg
            state.floatTexts.push({ x: seg.x, y: seg.y - seg.size, text: `-${Math.round(dmg)}`, color: '#3498DB', life: 0.6, vy: -1, size: 12 })
            if (seg.hp <= 0) handleSegmentDeath(state, dragon, si)
          }
        }
      }
    }
  }

  for (let i = state.dragons.length - 1; i >= 0; i--) {
    const dragon = state.dragons[i]

    if (!dragon.alive) {
      state.dragons.splice(i, 1)
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
        let dmg = 0
        if (hasBurn)  dmg += burnDPS  * dt
        if (hasToxin) dmg += toxinDPS * dt
        if (dmg > 0) {
          seg.hp -= dmg
          if (seg.hp <= 0) handleSegmentDeath(state, dragon, si)
        }
      }
    }

    // energyField：玩家周围持续伤害圈
    if (energyFieldStacks > 0) {
      const playerY = BASE_H - 55
      for (let si = dragon.segments.length - 1; si >= 0; si--) {
        const seg = dragon.segments[si]
        const dist = Math.sqrt((seg.x - state.playerX) ** 2 + (seg.y - playerY) ** 2)
        if (dist < energyR) {
          const efDmg = (state.bulletDamage * 0.08 * energyFieldStacks) * dt
          if (efDmg > 0) {
            seg.hp -= efDmg
            if (seg.hp <= 0) handleSegmentDeath(state, dragon, si)
          }
        }
      }
    }

    updateDragon(dragon, dt)

    // 检查是否到达终点（龙头触底 = 游戏结束）
    const headPos = getDragonHeadPosition(dragon)
    if (headPos && headPos.y >= BASE_H - 20) {
      state.playerHP--
      audioService.lose()
      dragon.alive = false

      if (state.playerHP <= 0) {
        state.phase = 'gameOver'
        setTimeout(() => { _gameOverCallback?.() }, 3000)
      } else {
        // 非即死：给予短暂无敌并显示提示
        state.invincibleTimer = 1.5
        state.floatTexts.push({
          x: BASE_W / 2, y: BASE_H / 2,
          text: '⚠️ 怪物入侵！', color: '#FF4444',
          life: 1.5, vy: -0.5, size: 22
        })
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
  console.log(`[level] lv=${state.level} progress=${state.levelProgress}/${state.levelTarget}`)
  if (state.levelProgress >= state.levelTarget) {
    state.level++
    state.levelProgress = 0
    state.levelTarget = Math.min(8, 3 + Math.floor(state.level * 0.5))
    state.currentScene = (state.currentScene + 1) % SCENES.length

    // 奖励
    if (state.playerHP < state.playerMaxHP) state.playerHP++
    state.invincibleTimer = 3

    // 进入关卡过渡（暂停2秒，显示大字提示）
    state.isPaused = true
    state.levelTransition = true
    state.levelTransitionTimer = 2.0

    audioService.levelUp()
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
