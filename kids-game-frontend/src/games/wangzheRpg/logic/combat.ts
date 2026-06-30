import { GAME_CONFIG, SKILL_CONFIG } from '../config'
import type { Player, Enemy, Minion, Tower, SkillEffect, Particle, FloatText } from '../types'

/**
 * AABB 碰撞检测
 */
export function rectCollision(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

/**
 * 圆形与矩形碰撞检测
 */
export function circleRectCollision(
  cx: number, cy: number, cr: number,
  rx: number, ry: number, rw: number, rh: number,
): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw))
  const closestY = Math.max(ry, Math.min(cy, ry + rh))
  const dx = cx - closestX
  const dy = cy - closestY
  return (dx * dx + dy * dy) < (cr * cr)
}

/**
 * 创建技能特效
 */
export function createSkillEffect(
  x: number, y: number,
  skillId: number,
): SkillEffect {
  const config = SKILL_CONFIG[skillId]
  return {
    x,
    y,
    radius: 0,
    maxRadius: config.radius,
    duration: config.duration,
    elapsed: 0,
    color: config.color,
    skillId,
  }
}

/**
 * 更新技能特效
 */
export function updateSkillEffects(effects: SkillEffect[], deltaMs: number): void {
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i]
    e.elapsed += deltaMs
    const progress = Math.min(e.elapsed / e.duration, 1)
    e.radius = e.maxRadius * progress
    if (e.elapsed >= e.duration) {
      effects.splice(i, 1)
    }
  }
}

/**
 * 更新粒子
 */
export function updateParticles(particles: Particle[], deltaMs: number): void {
  if (particles.length > GAME_CONFIG.PARTICLE_MAX) {
    particles.splice(0, particles.length - GAME_CONFIG.PARTICLE_MAX)
  }
  const deltaSec = deltaMs / 1000
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx * deltaSec * 60
    p.y += p.vy * deltaSec * 60
    p.life -= deltaMs
    if (p.life <= 0) {
      particles.splice(i, 1)
    }
  }
}

/**
 * 更新浮动文字
 */
export function updateFloatTexts(texts: FloatText[], deltaMs: number): void {
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i]
    t.y -= 0.5 * (deltaMs / 16)
    t.life -= deltaMs
    if (t.life <= 0) {
      texts.splice(i, 1)
    }
  }
}

/**
 * 添加命中粒子
 */
export function addHitParticles(x: number, y: number, color: string, particles: Particle[]): void {
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 2 + 1
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 400,
      maxLife: 400,
      color,
      size: Math.random() * 3 + 2,
    })
  }
}

/**
 * 添加技能粒子
 */
export function addSkillParticles(x: number, y: number, color: string, count: number, particles: Particle[]): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 3 + 1
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 300 + Math.random() * 200,
      maxLife: 500,
      color,
      size: Math.random() * 4 + 2,
    })
  }
}

/**
 * 添加浮动伤害文字
 */
export function addFloatText(x: number, y: number, text: string, color: string, texts: FloatText[]): void {
  texts.push({
    x, y,
    text,
    color,
    life: 800,
    maxLife: 800,
  })
}

/**
 * 检查技能对敌方英雄造成伤害
 */
export function checkSkillDamageHero(
  effect: SkillEffect,
  enemy: Enemy,
  particles: Particle[],
  floatTexts: FloatText[],
): boolean {
  if (enemy.isDead) return false
  if (effect.elapsed < 50) return false

  const hit = circleRectCollision(
    effect.x, effect.y, effect.radius,
    enemy.x, enemy.y, enemy.width, enemy.height,
  )

  if (hit) {
    const config = SKILL_CONFIG[effect.skillId]
    enemy.hp -= config.damage
    enemy.hitFlashTimer = GAME_CONFIG.HIT_FLASH_DURATION
    addHitParticles(
      enemy.x + enemy.width / 2,
      enemy.y + enemy.height / 2,
      config.color,
      particles,
    )
    addFloatText(
      enemy.x + enemy.width / 2,
      enemy.y - 10,
      `-${config.damage}`,
      '#ff3a3a',
      floatTexts,
    )
    return true
  }
  return false
}

/**
 * 检查技能对小兵造成伤害
 */
export function checkSkillDamageMinions(
  effect: SkillEffect,
  minions: Minion[],
  particles: Particle[],
  floatTexts: FloatText[],
  playerTeam: 'player',
): void {
  if (effect.elapsed < 50) return

  const config = SKILL_CONFIG[effect.skillId]
  for (const m of minions) {
    if (m.isDead || m.team === playerTeam) continue

    const hit = circleRectCollision(
      effect.x, effect.y, effect.radius,
      m.x, m.y, m.width, m.height,
    )

    if (hit) {
      m.hp -= config.damage
      m.hitFlashTimer = GAME_CONFIG.HIT_FLASH_DURATION
      addHitParticles(m.x + m.width / 2, m.y + m.height / 2, config.color, particles)
      addFloatText(m.x + m.width / 2, m.y - 5, `-${config.damage}`, '#ff3a3a', floatTexts)
    }
  }
}

/**
 * 检查技能对防御塔造成伤害
 */
export function checkSkillDamageTowers(
  effect: SkillEffect,
  towers: Tower[],
  particles: Particle[],
  floatTexts: FloatText[],
  playerTeam: 'player',
): void {
  if (effect.elapsed < 50) return

  const config = SKILL_CONFIG[effect.skillId]
  for (const t of towers) {
    if (t.isDestroyed || t.team === playerTeam) continue

    const hit = circleRectCollision(
      effect.x, effect.y, effect.radius,
      t.x, t.y, t.width, t.height,
    )

    if (hit) {
      t.hp -= config.damage
      addHitParticles(t.x + t.width / 2, t.y + t.height / 2, config.color, particles)
      addFloatText(t.x + t.width / 2, t.y, `-${config.damage}`, '#ff3a3a', floatTexts)
    }
  }
}

/**
 * 给予经验和金币
 */
export function grantExp(exp: number, player: Player): boolean {
  if (player.level >= GAME_CONFIG.MAX_LEVEL) return false
  player.exp += exp
  if (player.exp >= player.expToNext) {
    player.exp -= player.expToNext
    player.level++
    player.expToNext = Math.floor(GAME_CONFIG.EXP_BASE * Math.pow(GAME_CONFIG.EXP_GROWTH, player.level - 1))
    player.maxHp += GAME_CONFIG.LEVEL_HP_BONUS
    player.hp = Math.min(player.hp + GAME_CONFIG.LEVEL_HP_BONUS, player.maxHp)
    return true // 升级了
  }
  return false
}

/**
 * 更新防御塔攻击
 */
export function updateTowers(
  towers: Tower[],
  player: Player,
  enemy: Enemy,
  minions: Minion[],
  particles: Particle[],
  floatTexts: FloatText[],
  deltaMs: number,
): void {
  for (const t of towers) {
    if (t.isDestroyed) continue
    if (t.attackCooldown > 0) {
      t.attackCooldown -= deltaMs
      continue
    }

    // 寻找范围内最近的敌人
    let closestTarget: { x: number; y: number; width: number; height: number; hp: number; hitFlashTimer: number } | null = null
    let closestDist = t.attackRange

    // 检查敌方英雄
    if (t.team === 'player' && !enemy.isDead) {
      const d = distTo(t, enemy)
      if (d < closestDist) {
        closestDist = d
        closestTarget = enemy
      }
    } else if (t.team === 'enemy' && !player.isDead) {
      const d = distTo(t, player)
      if (d < closestDist) {
        closestDist = d
        closestTarget = player
      }
    }

    // 检查小兵
    for (const m of minions) {
      if (m.isDead || m.team === t.team) continue
      const d = distTo(t, m)
      if (d < closestDist) {
        closestDist = d
        closestTarget = m
      }
    }

    if (closestTarget) {
      // 攻击
      closestTarget.hp -= t.attackDamage
      closestTarget.hitFlashTimer = GAME_CONFIG.HIT_FLASH_DURATION
      t.attackCooldown = GAME_CONFIG.TOWER_ATTACK_INTERVAL

      addHitParticles(
        closestTarget.x + closestTarget.width / 2,
        closestTarget.y + closestTarget.height / 2,
        '#ff0000',
        particles,
      )
      addFloatText(
        closestTarget.x + closestTarget.width / 2,
        closestTarget.y - 10,
        `-${t.attackDamage}`,
        '#ff0000',
        floatTexts,
      )
    }
  }
}

function distTo(
  t: Tower,
  target: { x: number; y: number; width: number; height: number },
): number {
  const tx = t.x + t.width / 2
  const ty = t.y + t.height / 2
  const ox = target.x + target.width / 2
  const oy = target.y + target.height / 2
  return Math.sqrt((tx - ox) ** 2 + (ty - oy) ** 2)
}

/**
 * 两点距离
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

/**
 * AABB 重叠检测
 */
export function aabbOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}