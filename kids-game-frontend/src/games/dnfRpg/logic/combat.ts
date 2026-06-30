import type { Player, Enemy, Bullet, SkillInstance } from '../types'
import * as C from '../config'
import { CLASS_CONFIGS } from '../data/classes'
import { calcSkillDamage } from '../data/skills'

// 矩形碰撞检测
export function rectCollision(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
  const shrink = 4
  return a.x + shrink < b.x + b.width - shrink &&
    a.x + a.width - shrink > b.x + shrink &&
    a.y + shrink < b.y + b.height - shrink &&
    a.y + a.height - shrink > b.y + shrink
}

// 玩家普通攻击检测
export function checkPlayerAttack(player: Player, enemies: Enemy[], attackRange: number = C.ATTACK_RANGE, attackDamage: number = player.attackPower, attackKnockback: number = 6, attackLaunch: number = -4, now: number = Date.now(), comboMultiplier: number = 1): { enemies: Enemy[]; hitEnemies: Enemy[]; hitCount: number; combo: number; maxCombo: number; lastHitTime: number; totalDamage: number; isCritical: boolean } {
  let hitCount = 0
  let updatedEnemies = enemies.map(e => ({ ...e }))
  let combo = 0
  let maxCombo = 0
  let lastHitTime = 0
  let totalDamage = 0
  let isCritical = false

  if (!player.attacking) return { enemies: updatedEnemies, hitEnemies: updatedEnemies, hitCount, combo, maxCombo, lastHitTime, totalDamage, isCritical }

  // 攻击判定框（玩家前方）
  const atkBox = {
    x: player.facingRight ? player.x + player.width : player.x - attackRange,
    y: player.y - 5,
    width: attackRange + player.width,
    height: player.height,
  }

  // 暴击判定（解压模式：高暴击率）
  const critChance = 0.2 + comboMultiplier * 0.05 // 基础20%，每连击+5%
  const isCrit = Math.random() < critChance
  const critMultiplier = isCrit ? 2 : 1
  isCritical = isCrit

  updatedEnemies = updatedEnemies.map(enemy => {
    if (enemy.hp <= 0) return enemy
    if (enemy.invincible > 0) return enemy
    if (!rectCollision(atkBox, enemy)) return enemy
    if (enemy.recentlyHit > 0) return enemy // 防止同一帧多次判定

    // DNF式连击/浮空/保护系统
    let e = { ...enemy }
    
    // 连击伤害加成（解压模式：连击越高伤害越高）
    const comboBonus = 1 + Math.min(comboMultiplier * 0.15, 1) // 最高+100%伤害
    const damageMult = (1 + player.attackStep * 0.3) * comboBonus * critMultiplier
    const baseDamage = Math.round(attackDamage * damageMult)
    e.hp -= baseDamage
    totalDamage += baseDamage
    e.recentlyHit = 100

    // 击退/浮空（增强打击感）
    const knockbackMult = isCrit ? 1.5 : 1
    e.vx = (player.facingRight ? attackKnockback : -attackKnockback) * knockbackMult

    // 第3击及以上：浮空
    if (player.attackStep >= 2) {
      if (e.isGrounded || !e.airborn) {
        e.vy = attackLaunch * knockbackMult
        e.isGrounded = false
        e.airborn = true
      }
    }

    // 最后一击：大击退
    if (player.attackStep >= 3) {
      e.vx = (player.facingRight ? attackKnockback + 4 : -(attackKnockback + 4)) * knockbackMult
      e.vy = -8 * knockbackMult
      e.knockedDown = true
      e.knockdownTimer = C.KNOCKDOWN_DURATION
      e.airborn = true
    }

    e.hitStun = isCrit ? 120 : 80
    hitCount++
    combo++
    lastHitTime = now
    return e
  })

  return { enemies: updatedEnemies, hitEnemies: updatedEnemies, hitCount, combo, maxCombo, lastHitTime, totalDamage, isCritical }
}

// 技能攻击检测
export function checkSkillAttack(player: Player, enemies: Enemy[], skill: SkillInstance): {
  enemies: Enemy[]
  hitEnemies: Enemy[]
  bullets: Bullet[]
  hitCount: number
} {
  let hitCount = 0
  let updatedEnemies = enemies.map(e => ({ ...e }))
  const newBullets: Bullet[] = []
  const hitEnemiesList: Enemy[] = []

  const damage = calcSkillDamage(skill.damage, skill.level, player.attackPower)

  // 范围AOE技能
  if (skill.aoeRadius > 0) {
    const centerX = player.x + player.width / 2 + (player.facingRight ? skill.range / 2 : -skill.range / 2)
    const centerY = player.y + player.height / 2

    updatedEnemies = updatedEnemies.map(enemy => {
      if (enemy.hp <= 0) return enemy
      const dx = enemy.x + enemy.width / 2 - centerX
      const dy = enemy.y + enemy.height / 2 - centerY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > skill.aoeRadius) return enemy

      let e = { ...enemy }
      e.hp -= damage
      e.vx = player.facingRight ? skill.knockback : -skill.knockback
      e.vy = skill.launchHeight
      e.hitStun = 150
      e.airborn = skill.launchHeight < 0
      if (skill.launchHeight < 0) e.isGrounded = false
      hitCount++
      hitEnemiesList.push(e)
      return e
    })
  }

  // 远程子弹技能（range > 100 且 非AOE）
  if (skill.range > 100 && skill.aoeRadius === 0) {
    const bulletCount = skill.id.includes('multi') ? 3 : 1
    for (let i = 0; i < bulletCount; i++) {
      newBullets.push({
        x: player.facingRight ? player.x + player.width : player.x - 10,
        y: player.y + player.height / 2 - 4 + (bulletCount > 1 ? (i - 1) * 8 : 0),
        vx: player.facingRight ? 6 : -6,
        vy: 0,
        width: 12,
        height: 8,
        damage,
        isPlayerBullet: true,
        color: '#FFD700',
        pierce: skill.id.includes('pierce') || skill.id.includes('shot'),
        life: 2000,
        maxLife: 2000,
        trail: true,
        owner: 'player',
      })
    }
  }

  // 近战单体技能（range <= 100 且 非AOE）—— 直接命中前方敌人
  if (skill.range <= 100 && skill.aoeRadius === 0) {
    const attackX = player.x + (player.facingRight ? player.width : -skill.range)
    const attackY = player.y
    const attackW = skill.range
    const attackH = player.height

    updatedEnemies = updatedEnemies.map(enemy => {
      if (enemy.hp <= 0) return enemy
      // AABB碰撞检测
      if (
        enemy.x + enemy.width > attackX &&
        enemy.x < attackX + attackW &&
        enemy.y + enemy.height > attackY &&
        enemy.y < attackY + attackH
      ) {
        let e = { ...enemy }
        e.hp -= damage
        e.vx = player.facingRight ? skill.knockback : -skill.knockback
        e.vy = skill.launchHeight
        e.hitStun = 200
        e.airborn = skill.launchHeight < 0
        if (skill.launchHeight < 0) e.isGrounded = false
        hitCount++
        hitEnemiesList.push(e)
        return e
      }
      return enemy
    })
  }

  return { enemies: updatedEnemies, hitEnemies: hitEnemiesList, bullets: newBullets, hitCount }
}

// 敌人攻击玩家（攻击范围判定，不再要求物理重叠）
export function checkEnemyAttack(enemies: Enemy[], player: Player): { player: Player; bullets: Bullet[] } {
  let p = { ...player }
  const newBullets: Bullet[] = []
  if (p.invincible > 0) return { player: p, bullets: newBullets }

  enemies.forEach(enemy => {
    if (enemy.hp <= 0) return
    if (enemy.behavior !== 'attack') return

    // 攻击范围判定：中心点距离 < 攻击范围 + 玩家半径
    const eCenterX = enemy.x + enemy.width / 2
    const eCenterY = enemy.y + enemy.height / 2
    const pCenterX = p.x + p.width / 2
    const pCenterY = p.y + p.height / 2
    const dist = Math.sqrt((eCenterX - pCenterX) ** 2 + (eCenterY - pCenterY) ** 2)

    if (enemy.canShoot) {
      // 远程敌人发射子弹
      if (dist < enemy.attackRange + Math.max(p.width, p.height) / 2) {
        const dir = p.x > enemy.x ? 1 : -1
        newBullets.push({
          x: enemy.x + (dir === 1 ? enemy.width : 0),
          y: enemy.y + enemy.height / 2 - 5,
          vx: dir * C.ENEMY_BULLET_SPEED,
          vy: 0,
          width: 10,
          height: 6,
          damage: enemy.attackPower,
          isPlayerBullet: false,
          color: '#FF4488',
          pierce: false,
          life: 2000,
          maxLife: 2000,
          trail: false,
          owner: 'enemy',
        })
      }
    } else {
      // 近战敌人直接攻击
      if (dist < enemy.attackRange + Math.max(p.width, p.height) / 2) {
        p.hp -= enemy.attackPower
        p.invincible = C.INVINCIBLE_DURATION
        p.hitStun = 80
        p.vx = p.x < enemy.x ? -5 : 5

        // 击倒判定
        if (enemy.type === 'elite' || enemy.type === 'boss') {
          p.knockedDown = true
          p.knockdownTimer = C.KNOCKDOWN_DURATION
        }
      }
    }
  })

  return { player: p, bullets: newBullets }
}

// Boss技能检测
export function checkBossSkillAttack(enemies: Enemy[], player: Player): { player: Player; bullets: Bullet[] } {
  let p = { ...player }
  const newBullets: Bullet[] = []

  enemies.forEach(enemy => {
    if (enemy.hp <= 0 || enemy.type !== 'boss') return

    enemy.skills.forEach((skill, i) => {
      if (skill.phaseRequired > enemy.phase) return
      if (enemy.skillCooldowns[i] > 0) return

      const dist = Math.abs(enemy.x - player.x)
      if (dist > skill.range) return

      // 执行Boss技能
      switch (skill.type) {
        case 'melee':
          if (rectCollision(player, enemy)) {
            p.hp -= skill.damage
            p.invincible = C.INVINCIBLE_DURATION
            p.hitStun = 120
            p.vx = player.x < enemy.x ? -8 : 8
            p.knockedDown = true
            p.knockdownTimer = C.KNOCKDOWN_DURATION
          }
          break

        case 'spread':
          for (let a = -2; a <= 2; a++) {
            newBullets.push({
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 3,
              vx: Math.cos(a * 0.4) * C.ENEMY_BULLET_SPEED * (player.x > enemy.x ? 1 : -1),
              vy: Math.sin(a * 0.4) * C.ENEMY_BULLET_SPEED,
              width: 8,
              height: 8,
              damage: skill.damage,
              isPlayerBullet: false,
              color: '#FF4444',
              pierce: false,
              life: 1500,
              maxLife: 1500,
              trail: false,
              owner: 'boss',
            })
          }
          break

        case 'charge':
          enemy.speed *= 3
          enemy.vx = (player.x > enemy.x ? 1 : -1) * enemy.speed
          enemy.chargeTimer = 300
          break

        case 'laser': {
          const dir = player.x > enemy.x ? 1 : -1
          const laser: Bullet = {
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 3,
            vx: dir * 8,
            vy: 0,
            width: 200,
            height: 6,
            damage: skill.damage,
            isPlayerBullet: false,
            color: '#FF0000',
            pierce: true,
            life: 800,
            maxLife: 800,
            trail: false,
            owner: 'boss',
          }
          newBullets.push(laser)
          break
        }

        case 'teleport': {
          const newX = player.x + (Math.random() > 0.5 ? 80 : -80)
          enemy.x = Math.max(0, Math.min(newX, 600))
          enemy.invincible = 200
          break
        }
      }

      // 设置技能冷却
      enemy.skillCooldowns[i] = skill.cooldown
    })
  })

  return { player: p, bullets: newBullets }
}

// 子弹更新
export function updateBullets(bullets: Bullet[], enemies: Enemy[], player: Player, dt: number): {
  bullets: Bullet[]
  enemies: Enemy[]
  player: Player
} {
  const updatedBullets: Bullet[] = []
  let updatedEnemies = enemies.map(e => ({ ...e }))
  let updatedPlayer = { ...player }

  bullets.forEach(bullet => {
    let b = { ...bullet }
    b.x += b.vx
    b.y += b.vy
    b.life -= dt

    // 超出范围移除
    if (b.life <= 0 || b.x < -50 || b.x > 700 || b.y < -50 || b.y > 500) return

    let hit = false

    if (b.isPlayerBullet) {
      // 玩家子弹击中敌人
      for (let i = 0; i < updatedEnemies.length; i++) {
        const e = updatedEnemies[i]
        if (e.hp <= 0) continue
        if (rectCollision(b, e)) {
          e.hp -= b.damage
          e.hitStun = 100
          e.recentlyHit = 80
          e.vx = b.vx > 0 ? 3 : -3
          hit = true
          if (!b.pierce) break
        }
      }
    } else {
      // 敌人子弹击中玩家
      if (updatedPlayer.invincible <= 0 && rectCollision(b, updatedPlayer)) {
        updatedPlayer.hp -= b.damage
        updatedPlayer.invincible = C.INVINCIBLE_DURATION
        updatedPlayer.hitStun = 150
        updatedPlayer.vx = b.vx > 0 ? 3 : -3
        hit = true
      }
    }

    if (!hit) updatedBullets.push(b)
  })

  return { bullets: updatedBullets, enemies: updatedEnemies, player: updatedPlayer }
}