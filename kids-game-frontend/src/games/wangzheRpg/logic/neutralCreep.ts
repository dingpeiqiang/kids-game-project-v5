import type { NeutralCreep, Player, Enemy, Particle, FloatText } from '../types'
import { GAME_CONFIG, CREEP_CAMPS, ROSHAN_POS } from '../config'
import { distance } from './combat'

/**
 * 初始化所有野怪
 */
export function initNeutralCreeps(): NeutralCreep[] {
  const creeps: NeutralCreep[] = []

  for (const camp of CREEP_CAMPS) {
    const hp = camp.type === 'medium' ? GAME_CONFIG.CREEP_MEDIUM_HP : GAME_CONFIG.CREEP_SMALL_HP
    creeps.push({
      x: camp.x,
      y: camp.y,
      width: camp.type === 'medium' ? 24 : 18,
      height: camp.type === 'medium' ? 24 : 18,
      hp,
      maxHp: hp,
      isDead: false,
      attackCooldown: 0,
      attackDamage: GAME_CONFIG.CREEP_ATTACK_DAMAGE,
      respawnTimer: 0,
      type: camp.type,
      hitFlashTimer: 0,
    })
  }

  // Roshan
  creeps.push({
    x: ROSHAN_POS.x,
    y: ROSHAN_POS.y,
    width: 36,
    height: 36,
    hp: GAME_CONFIG.CREEP_ROSHAN_HP,
    maxHp: GAME_CONFIG.CREEP_ROSHAN_HP,
    isDead: false,
    attackCooldown: 0,
    attackDamage: GAME_CONFIG.CREEP_ATTACK_DAMAGE * 2,
    respawnTimer: 0,
    type: 'roshan',
    hitFlashTimer: 0,
  })

  return creeps
}

/**
 * 更新野怪
 */
export function updateNeutralCreeps(
  creeps: NeutralCreep[],
  player: Player,
  enemy: Enemy,
  particles: Particle[],
  floatTexts: FloatText[],
  deltaMs: number,
): void {
  for (const c of creeps) {
    if (c.isDead) {
      c.respawnTimer -= deltaMs
      if (c.respawnTimer <= 0) {
        c.isDead = false
        c.hp = c.maxHp
      }
      continue
    }

    if (c.hitFlashTimer > 0) c.hitFlashTimer -= deltaMs

    // 检测玩家是否进入仇恨范围
    const aggroRange = GAME_CONFIG.CREEP_AGGRO_RANGE
    let target: { x: number; y: number } | null = null

    if (!player.isDead) {
      const d = distance(c.x, c.y, player.x, player.y)
      if (d < aggroRange) {
        target = player
      }
    }

    if (!target && !enemy.isDead) {
      const d = distance(c.x, c.y, enemy.x, enemy.y)
      if (d < aggroRange) {
        target = enemy
      }
    }

    if (target) {
      c.attackCooldown -= deltaMs
      const d = distance(c.x, c.y, target.x, target.y)
      const attackRange = GAME_CONFIG.CREEP_ATTACK_RANGE

      if (d <= attackRange) {
        if (c.attackCooldown <= 0) {
          c.attackCooldown = GAME_CONFIG.CREEP_ATTACK_INTERVAL
          // 攻击目标
          const isPlayer = target === player
          if (isPlayer) {
            player.hp -= c.attackDamage
            player.hitFlashTimer = GAME_CONFIG.HIT_FLASH_DURATION
          } else {
            enemy.hp -= c.attackDamage
            enemy.hitFlashTimer = GAME_CONFIG.HIT_FLASH_DURATION
          }
          floatTexts.push({
            x: target.x, y: target.y - 20,
            text: `-${c.attackDamage}`, color: '#ff6644',
            life: 1000, maxLife: 1000,
          })
        }
      }
    }
  }
}

/**
 * 获取野怪击杀奖励
 */
export function getCreepReward(type: 'small' | 'medium' | 'roshan'): { exp: number; gold: number } {
  switch (type) {
    case 'small': return { exp: GAME_CONFIG.CREEP_SMALL_EXP, gold: GAME_CONFIG.CREEP_SMALL_GOLD }
    case 'medium': return { exp: GAME_CONFIG.CREEP_MEDIUM_EXP, gold: GAME_CONFIG.CREEP_MEDIUM_GOLD }
    case 'roshan': return { exp: GAME_CONFIG.CREEP_ROSHAN_EXP, gold: GAME_CONFIG.CREEP_ROSHAN_GOLD }
  }
}