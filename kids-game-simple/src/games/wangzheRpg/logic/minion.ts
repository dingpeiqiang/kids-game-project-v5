import type { Minion, Player, Enemy, Tower, Particle, FloatText, LaneType } from '../types'
import { GAME_CONFIG, LANE_PATHS } from '../config'
import { aabbOverlap, distance } from './combat'

/**
 * 在指定分路生成一波小兵
 */
export function spawnMinionWave(
  minions: Minion[],
  waveNumber: number,
  lane: LaneType,
): void {
  const path = LANE_PATHS[lane]
  const size = GAME_CONFIG.MINION_SIZE
  const hpBonus = waveNumber * 20

  // 玩家方小兵（从左侧出发）
  for (let i = 0; i < GAME_CONFIG.MINION_PER_WAVE; i++) {
    const spawn = path.player[0]
    minions.push({
      x: spawn.x + (i - 1) * 20,
      y: spawn.y + (i - 1) * 8,
      width: size,
      height: size,
      hp: GAME_CONFIG.MINION_HP + hpBonus,
      maxHp: GAME_CONFIG.MINION_HP + hpBonus,
      isDead: false,
      team: 'player',
      attackCooldown: 0,
      moveDir: 1,
      targetX: path.player[1].x,
      targetY: path.player[1].y,
      currentTarget: null,
      targetIndex: -1,
      hitFlashTimer: 0,
      lane,
    })
  }

  // 敌方小兵（从右侧出发）
  for (let i = 0; i < GAME_CONFIG.MINION_PER_WAVE; i++) {
    const spawn = path.enemy[0]
    minions.push({
      x: spawn.x + (i - 1) * 20,
      y: spawn.y + (i - 1) * 8,
      width: size,
      height: size,
      hp: GAME_CONFIG.MINION_HP + hpBonus,
      maxHp: GAME_CONFIG.MINION_HP + hpBonus,
      isDead: false,
      team: 'enemy',
      attackCooldown: 0,
      moveDir: -1,
      targetX: path.enemy[1].x,
      targetY: path.enemy[1].y,
      currentTarget: null,
      targetIndex: -1,
      hitFlashTimer: 0,
      lane,
    })
  }
}

/**
 * 小兵寻路：沿预设路径点移动
 */
function updateMinionPathing(m: Minion): void {
  const path = LANE_PATHS[m.lane]
  const waypoints = m.team === 'player' ? path.player : path.enemy

  const dx = m.targetX - m.x
  const dy = m.targetY - m.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist < 5) {
    // 到达当前路径点，选择下一个
    let currentIdx = -1
    for (let i = 0; i < waypoints.length; i++) {
      if (Math.abs(waypoints[i].x - m.targetX) < 10 && Math.abs(waypoints[i].y - m.targetY) < 10) {
        currentIdx = i
        break
      }
    }
    if (currentIdx >= 0 && currentIdx < waypoints.length - 1) {
      const next = waypoints[currentIdx + 1]
      m.targetX = next.x
      m.targetY = next.y
    }
  }

  if (dist > 0) {
    m.moveDir = Math.atan2(dy, dx)
  }
}

/**
 * 获取小兵优先攻击目标类型
 */
function findTarget(
  m: Minion,
  minions: Minion[],
  player: Player,
  enemy: Enemy,
  towers: Tower[],
  allMinions: Minion[],
): { targetType: 'player' | 'enemy' | 'minion' | 'tower' | null; targetIndex: number } {
  const detectRange = GAME_CONFIG.MINION_DETECT_RANGE
  const myTeam = m.team
  const enemyTeam = myTeam === 'player' ? 'enemy' : 'player'

  let bestDist = detectRange
  let bestTarget: { targetType: 'player' | 'enemy' | 'minion' | 'tower' | null; targetIndex: number } = { targetType: null, targetIndex: -1 }

  // 1. 优先英雄
  if (myTeam === 'player') {
    if (!enemy.isDead) {
      const d = distance(m.x, m.y, enemy.x, enemy.y)
      if (d < bestDist) {
        bestDist = d
        bestTarget = { targetType: 'enemy', targetIndex: 0 }
      }
    }
  } else {
    if (!player.isDead) {
      const d = distance(m.x, m.y, player.x, player.y)
      if (d < bestDist) {
        bestDist = d
        bestTarget = { targetType: 'player', targetIndex: 0 }
      }
    }
  }

  // 2. 敌方小兵
  for (let i = 0; i < allMinions.length; i++) {
    const om = allMinions[i]
    if (om.isDead || om.team !== enemyTeam) continue
    const d = distance(m.x, m.y, om.x, om.y)
    if (d < bestDist) {
      bestDist = d
      bestTarget = { targetType: 'minion', targetIndex: i }
    }
  }

  // 3. 敌方防御塔
  for (let i = 0; i < towers.length; i++) {
    const t = towers[i]
    if (t.isDestroyed || t.team !== enemyTeam) continue
    const d = distance(m.x, m.y, t.x, t.y)
    if (d < bestDist) {
      bestDist = d
      bestTarget = { targetType: 'tower', targetIndex: i }
    }
  }

  return bestTarget
}

/**
 * 获取目标实体的位置
 */
function getTargetPos(
  targetType: string | null,
  targetIndex: number,
  minions: Minion[],
  player: Player,
  enemy: Enemy,
  towers: Tower[],
): { x: number; y: number; width: number; height: number } | null {
  switch (targetType) {
    case 'player': return { x: player.x, y: player.y, width: player.width, height: player.height }
    case 'enemy': return { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
    case 'minion': {
      const m = minions[targetIndex]
      if (m && !m.isDead) return { x: m.x, y: m.y, width: m.width, height: m.height }
      return null
    }
    case 'tower': {
      const t = towers[targetIndex]
      if (t && !t.isDestroyed) return { x: t.x, y: t.y, width: t.width, height: t.height }
      return null
    }
    default: return null
  }
}

/**
 * 更新所有小兵
 */
export function updateMinions(
  minions: Minion[],
  player: Player,
  enemy: Enemy,
  towers: Tower[],
  particles: Particle[],
  floatTexts: FloatText[],
  deltaMs: number,
): void {
  const speed = GAME_CONFIG.MINION_SPEED

  for (let i = minions.length - 1; i >= 0; i--) {
    const m = minions[i]

    if (m.isDead) {
      minions.splice(i, 1)
      continue
    }

    if (m.hitFlashTimer > 0) m.hitFlashTimer -= deltaMs

    // 寻找目标
    const target = findTarget(m, minions, player, enemy, towers, minions)
    m.currentTarget = target.targetType
    m.targetIndex = target.targetIndex

    m.attackCooldown -= deltaMs

    if (target.targetType !== null) {
      const targetPos = getTargetPos(target.targetType, target.targetIndex, minions, player, enemy, towers)
      if (targetPos) {
        const d = distance(m.x, m.y, targetPos.x, targetPos.y)
        const attackRange = GAME_CONFIG.MINION_ATTACK_RANGE + targetPos.width / 2

        if (d <= attackRange) {
          // 在攻击范围内，攻击
          if (m.attackCooldown <= 0) {
            m.attackCooldown = GAME_CONFIG.MINION_ATTACK_INTERVAL
            // 造成伤害
            applyMinionDamage(m, target.targetType, target.targetIndex, minions, player, enemy, towers, particles, floatTexts)
          }
        } else {
          // 靠近目标
          const dx = targetPos.x - m.x
          const dy = targetPos.y - m.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 0) {
            m.x += (dx / dist) * speed * (deltaMs / 16)
            m.y += (dy / dist) * speed * (deltaMs / 16)
          }
        }
      } else {
        // 目标消失，继续寻路
        updateMinionPathing(m)
        const dx = m.targetX - m.x
        const dy = m.targetY - m.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 0) {
          m.x += (dx / dist) * speed * (deltaMs / 16)
          m.y += (dy / dist) * speed * (deltaMs / 16)
        }
      }
    } else {
      // 无目标，沿路径移动
      updateMinionPathing(m)
      const dx = m.targetX - m.x
      const dy = m.targetY - m.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 0) {
        m.x += (dx / dist) * speed * (deltaMs / 16)
        m.y += (dy / dist) * speed * (deltaMs / 16)
      }
    }
  }
}

/**
 * 小兵造成伤害
 */
function applyMinionDamage(
  m: Minion,
  targetType: string | null,
  targetIndex: number,
  minions: Minion[],
  player: Player,
  enemy: Enemy,
  towers: Tower[],
  particles: Particle[],
  floatTexts: FloatText[],
): void {
  const damage = GAME_CONFIG.MINION_ATTACK_DAMAGE

  switch (targetType) {
    case 'player':
      player.hp -= damage
      player.hitFlashTimer = GAME_CONFIG.HIT_FLASH_DURATION
      floatTexts.push({
        x: player.x, y: player.y - 20,
        text: `-${damage}`, color: '#ff4444',
        life: 1000, maxLife: 1000,
      })
      break
    case 'enemy':
      enemy.hp -= damage
      enemy.hitFlashTimer = GAME_CONFIG.HIT_FLASH_DURATION
      floatTexts.push({
        x: enemy.x, y: enemy.y - 20,
        text: `-${damage}`, color: '#ff4444',
        life: 1000, maxLife: 1000,
      })
      break
    case 'minion': {
      const target = minions[targetIndex]
      if (target) {
        target.hp -= damage
        target.hitFlashTimer = GAME_CONFIG.HIT_FLASH_DURATION
        floatTexts.push({
          x: target.x, y: target.y - 15,
          text: `-${damage}`, color: '#ffcc00',
          life: 800, maxLife: 800,
        })
      }
      break
    }
    case 'tower': {
      const target = towers[targetIndex]
      if (target) {
        target.hp -= damage
        floatTexts.push({
          x: target.x, y: target.y - 15,
          text: `-${damage}`, color: '#ffaa00',
          life: 800, maxLife: 800,
        })
      }
      break
    }
  }
}