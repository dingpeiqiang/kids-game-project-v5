import type { Enemy, EnemySpawn, BossConfig, AttackPattern, Player, Bullet, Platform } from '../types'
import * as C from '../config'

let enemyIdCounter = 0

export function createEnemy(spawn: EnemySpawn, roomWidth: number, roomIndex: number): Enemy[] {
  const enemies: Enemy[] = []
  const count = spawn.quantity || 1
  const spacing = spawn.spacing || 60
  const behavior: 'walk' | 'chase' | 'stationary' = spawn.behavior || 'chase'
  
  // 关卡递进难度：越往后的房间，敌人越强
  const difficultyMultiplier = 1 + roomIndex * 0.3

  for (let i = 0; i < count; i++) {
    enemyIdCounter++
    const isElite = spawn.type === 'elite'
    const isRanged = spawn.type === 'ranged'
    const enemyBehavior: Enemy['behavior'] = behavior === 'stationary' ? 'idle' : behavior
    
    const baseHp = isElite ? C.ENEMY_BASE_HP * 3 : (isRanged ? C.ENEMY_BASE_HP * 1.5 : C.ENEMY_BASE_HP)
    const baseSpeed = isElite ? C.ENEMY_SPEED * 1.3 : (isRanged ? C.ENEMY_SPEED * 0.8 : C.ENEMY_SPEED)
    const baseAttack = isElite ? C.ENEMY_ATTACK_DAMAGE * 2 : (isRanged ? C.ENEMY_ATTACK_DAMAGE * 1.2 : C.ENEMY_ATTACK_DAMAGE)
    
    const base = {
      id: enemyIdCounter,
      x: spawn.x + i * spacing,
      y: spawn.y,
      width: isElite ? 32 : (isRanged ? 26 : 28),
      height: isElite ? 48 : (isRanged ? 36 : 40),
      vx: 0,
      vy: 0,
      hp: Math.floor(baseHp * difficultyMultiplier),
      maxHp: Math.floor(baseHp * difficultyMultiplier),
      mp: isRanged ? 50 : 0,
      speed: baseSpeed,
      attackPower: Math.floor(baseAttack * difficultyMultiplier),
      type: spawn.type,
      name: isElite ? '精英怪' : (isRanged ? '远程怪' : '普通怪'),
      isGrounded: true,
      behavior: enemyBehavior,
      behaviorTimer: 0,
      attackTimer: 0,
      attackRange: isRanged ? 120 : C.ENEMY_ATTACK_RANGE,
      shootTimer: 0,
      shootInterval: isRanged ? 1500 : C.ENEMY_ATTACK_COOLDOWN,
      hitStun: 0,
      invincible: 0,
      knockedDown: false,
      knockdownTimer: 0,
      airborn: false,
      airbornVy: 0,
      recentlyHit: 0,
      chargeTimer: 0,
      color: isElite ? '#FF4444' : (isRanged ? '#4488FF' : '#FF6B6B'),
      score: isElite ? 300 : (isRanged ? 150 : 100),
      phase: 1,
      maxPhase: 1,
      patterns: [] as AttackPattern[],
      skills: [],
      skillCooldowns: [],
      dropTable: spawn.dropTable || [],
      // 移动能力：普通怪地面行走，精英怪会跳跃，远程怪保持距离
      canFly: false,
      canJump: isElite || (roomIndex >= 2 && Math.random() < 0.3),
      canShoot: isRanged,
    }
    enemies.push(base)
  }
  return enemies
}

export function createBoss(config: BossConfig): Enemy {
  enemyIdCounter++
  return {
    id: enemyIdCounter,
    x: 500,
    y: C.GROUND_Y - config.height,
    width: config.width,
    height: config.height,
    vx: 0,
    vy: 0,
    hp: config.hp,
    maxHp: config.hp,
    mp: config.mp || 100,
    speed: config.speed,
    attackPower: config.attackPower,
    type: 'boss',
    name: config.name,
    isGrounded: true,
    behavior: 'idle',
    behaviorTimer: 60,
    attackTimer: 0,
    attackRange: 60,
    shootTimer: 0,
    shootInterval: 2000,
    hitStun: 0,
    invincible: 0,
    knockedDown: false,
    knockdownTimer: 0,
    airborn: false,
    airbornVy: 0,
    recentlyHit: 0,
    chargeTimer: 0,
    color: config.color,
    score: 2000,
    phase: 1,
    maxPhase: config.maxPhase,
    patterns: config.skills.map(s => ({
      type: s.type,
      cooldown: s.cooldown,
      damage: s.damage,
      range: s.range,
      duration: s.duration,
    })),
    skills: config.skills,
    skillCooldowns: config.skills.map(() => 0),
    dropTable: config.dropTable || [],
    // Boss移动能力：默认可以飞行和跳跃
    canFly: true,
    canJump: true,
    canShoot: false,
  }
}

export function updateEnemy(enemy: Enemy, playerX: number, playerY: number, dt: number, roomWidth: number, platforms?: Platform[]): Enemy {
  if (enemy.hp <= 0) return { ...enemy, hp: 0 }

  let e = { ...enemy }

  // 受击硬直
  if (e.hitStun > 0) {
    e.hitStun -= dt
    e.vx *= 0.95
    e.vy *= 0.95
    return applyEnemyPhysics(e, roomWidth)
  }

  // 最近被击中闪烁
  if (e.recentlyHit > 0) e.recentlyHit -= dt

  // 冲锋计时器
  if (e.chargeTimer > 0) {
    e.chargeTimer -= dt
    if (e.chargeTimer <= 0) {
      e.speed = e.speed / 3
      e.chargeTimer = 0
    }
  }

  // DNF风格：敌人只在地面水平移动
  const dx = playerX - e.x
  const distX = Math.abs(dx)

  // Boss阶段性检查
  if (e.type === 'boss') {
    const hpRatio = e.hp / e.maxHp
    const newPhase = hpRatio < 0.33 ? 3 : hpRatio < 0.66 ? 2 : 1
    e.phase = newPhase
  }

  // Boss技能冷却
  if (e.skills.length > 0) {
    e.skillCooldowns = e.skillCooldowns.map((cd, i) => {
      const skill = e.skills[i]
      if (!skill || e.phase < skill.phaseRequired) return cd
      return Math.max(0, cd - dt)
    })
  }

  // AI行为（仅水平移动，使用加速度平滑过渡）
  const chaseAccel = 0.12  // 追踪加速度系数

  // 攻击冷却始终递减（无论是否在攻击范围内）
  if (e.attackTimer > 0) e.attackTimer -= dt

  // 落地检测
  const isOnGround = e.y + e.height >= C.GROUND_Y - 5

  switch (e.behavior) {
    case 'chase':
      if (e.canShoot) {
        // 远程敌人：保持距离攻击
        const optimalRange = e.attackRange * 0.7
        if (distX > e.attackRange + 50) {
          // 太远：靠近玩家
          const targetVx = dx > 0 ? e.speed : -e.speed
          e.vx += (targetVx - e.vx) * chaseAccel
        } else if (distX < optimalRange) {
          // 太近：后退保持距离
          const targetVx = dx > 0 ? -e.speed : e.speed
          e.vx += (targetVx - e.vx) * chaseAccel * 0.5
        } else {
          // 最佳距离：停止移动并攻击
          e.vx *= 0.8
          if (e.attackTimer <= 0) {
            e.behavior = 'attack'
            e.attackTimer = e.shootInterval
            e.behaviorTimer = 300
          }
        }
      } else {
        // 近战敌人：接近并攻击
        if (distX > e.attackRange) {
          const targetVx = dx > 0 ? e.speed : -e.speed
          e.vx += (targetVx - e.vx) * chaseAccel
          
          // 精英怪在地面时随机跳跃
          if (e.canJump && isOnGround && Math.random() < 0.005) {
            e.vy = -5
          }
        } else {
          if (e.attackTimer <= 0) {
            e.behavior = 'attack'
            e.attackTimer = e.shootInterval
            e.behaviorTimer = 500
          } else {
            e.vx *= 0.8
          }
        }
      }
      break

    case 'walk':
      e.behaviorTimer -= dt
      if (e.behaviorTimer <= 0) {
        e.vx = (Math.random() > 0.5 ? 1 : -1) * e.speed * 0.5
        e.behaviorTimer = 1000 + Math.random() * 1500
      }
      if (distX < e.attackRange + 50 && e.attackTimer <= 0) {
        e.behavior = 'attack'
        e.attackTimer = e.shootInterval
        e.behaviorTimer = e.canShoot ? 300 : 400
      }
      // 随机跳跃
      if (e.canJump && isOnGround && Math.random() < 0.003) {
        e.vy = -4
      }
      break

    case 'attack': {
      // 原地攻击：急停站定，面向玩家挥砍或射击
      e.vx *= 0.5
      e.behaviorTimer -= dt
      if (e.behaviorTimer <= 0) {
        e.behavior = 'chase'
      }
      break
    }

    default:
      e.behaviorTimer -= dt
      if (e.behaviorTimer <= 0) {
        e.behavior = 'chase'
      }
  }

  // applyEnemyPhysics统一处理X/Y轴位移
  return applyEnemyPhysics(e, roomWidth)
}

function applyEnemyPhysics(enemy: Enemy, roomWidth: number): Enemy {
  let e = { ...enemy }

  // DNF风格：敌人只在地面水平移动，应用重力
  const isOnGround = e.y + e.height >= C.GROUND_Y - 5
  
  if (!e.canFly) {
    // 非飞行敌人应用重力
    if (!isOnGround) {
      e.vy += C.GRAVITY * 0.8
      e.vy = Math.min(e.vy, 10)
    }
  }

  // 水平移动
  e.x += e.vx
  e.y += e.vy

  // 水平边界限制
  if (e.x < 0) {
    e.x = 0
    e.vx = Math.abs(e.vx) * 0.5
  }
  if (e.x + e.width > roomWidth) {
    e.x = roomWidth - e.width
    e.vx = -Math.abs(e.vx) * 0.5
  }

  // 地面限制：敌人不能穿墙/上墙，只能在地面
  if (e.y + e.height > C.GROUND_Y) {
    e.y = C.GROUND_Y - e.height
    e.vy = 0
  }

  return e
}

export function isEnemyAlive(enemy: Enemy): boolean {
  return enemy.hp > 0
}

export function getEnemyDropExp(enemy: Enemy): number {
  switch (enemy.type) {
    case 'normal': return C.EXP_PER_NORMAL
    case 'ranged': return Math.floor(C.EXP_PER_NORMAL * 1.5)
    case 'elite': return C.EXP_PER_ELITE
    case 'boss': return C.EXP_PER_BOSS
    default: return C.EXP_PER_NORMAL
  }
}

// 批量更新敌人（支持game.ts的batch调用）
export function updateEnemies(
  enemies: Enemy[],
  player: Player,
  bullets: Bullet[],
  now: number,
  roomWidth?: number,
  platforms?: Platform[],
): { updatedEnemies: Enemy[]; updatedBullets: Bullet[]; player: Player; playerHit: boolean; damageToPlayer: number } {
  const dt = 16
  const width = roomWidth || 800
  // 敌人不再需要平台碰撞，只在地面行走
  let updatedEnemies = enemies.map(e => updateEnemy(e, player.x, player.y, dt, width))
  let updatedBullets = [...bullets]
  let p = { ...player } as Player
  let playerHit = false
  let damageToPlayer = 0

  // 敌人攻击伤害（支持攻击范围判定，不再需要物理重叠）
  for (const enemy of updatedEnemies) {
    if (enemy.hp <= 0 || enemy.behavior !== 'attack') continue
    if (p.invincible > 0 && !enemy.canShoot) continue // 远程子弹可以穿透无敌

    // 攻击范围判定：计算敌人到玩家的距离
    const eCenterX = enemy.x + enemy.width / 2
    const eCenterY = enemy.y + enemy.height / 2
    const pCenterX = p.x + p.width / 2
    const pCenterY = p.y + p.height / 2
    const hitDist = Math.sqrt((eCenterX - pCenterX) ** 2 + (eCenterY - pCenterY) ** 2)

    // 在攻击范围内即判定命中
    if (hitDist < enemy.attackRange + Math.max(p.width, p.height) / 2) {
      if (enemy.canShoot) {
        // 远程敌人发射子弹
        const dir = p.x > enemy.x ? 1 : -1
        updatedBullets.push({
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
      } else {
        // 近战敌人直接攻击
        playerHit = true
        damageToPlayer += enemy.attackPower
      }
    }
  }

  return { updatedEnemies, updatedBullets, player: p, playerHit, damageToPlayer }
}