/**
 * 游戏更新逻辑模块
 * 负责每帧的游戏状态更新：玩家、敌人、子弹、特效、碰撞等
 */

import * as C from '../config'
import type {
  Player, Enemy, InputState, Bullet, DropItem,
  Particle, Shockwave, FloatText, Equipment, SkillInstance, ScreenShake,
} from '../types'
import { updatePlayer, addExp, type PlayerUpdateResult } from './player'
import { updateEnemies } from './enemies'
import { checkPlayerAttack, checkSkillAttack } from './combat'
import { generateDrops, pickupDrops, applyEquipment } from './equipment'
import { updateParticles, updateShockwaves, updateFloatTexts, updateBullets, updateDrops } from '../render/effects'
import type { DungeonManager } from './dungeon'
import { spawnHitEffects, spawnSkillEffects, spawnDeathEffects, spawnRoomEnemiesFromState } from './game-effects'
import { updateScreenShake } from './effects'

export interface GameUpdateState {
  player: Player
  enemies: Enemy[]
  bullets: Bullet[]
  drops: DropItem[]
  particles: Particle[]
  shockwaves: Shockwave[]
  floatTexts: FloatText[]
  inventory: Equipment[]
  score: number
  gold: number
  combo: number
  lastHitTime: number
  maxCombo: number
  shownComboMilestones: number[]
  roomCleared: boolean
  roomClearTimer: number
  doorOpen: boolean
  doorReached: boolean
  gameOver: boolean
  victory: boolean
  cameraX: number
  targetCameraX: number
  fadeInTimer: number
  // 滑动过渡
  transitionPhase: 'none' | 'slide_out' | 'slide_in'
  transitionProgress: number
  screenShake: ScreenShake | null
}

export function updateGameLogic(
  state: GameUpdateState,
  input: InputState,
  dt: number,
  engine: { addScore: (score: number, x: number, y: number) => void },
  dungeon: DungeonManager,
  finishGame: (victory: boolean, delayMs: number) => void,
  lastFrameTime: { value: number },
): void {
  const now = Date.now()

  if (state.fadeInTimer > 0) {
    state.fadeInTimer -= dt
    return
  }

  // === 过渡动画处理 ===
  if (state.transitionPhase !== 'none') {
    state.transitionProgress += dt / C.TRANSITION_SLIDE_DURATION

    if (state.transitionPhase === 'slide_out') {
      // 滑出阶段：相机保持不动，渲染时偏移
      if (state.transitionProgress >= 1) {
        // 滑出完成，切换房间数据
        state.transitionProgress = 0
        state.transitionPhase = 'slide_in'

        // 加载下一个房间
        const hasNext = dungeon.nextRoom()
        if (hasNext) {
          state.enemies = []
          state.bullets = []
          state.drops = []
          state.roomCleared = false
          state.doorOpen = false
          state.doorReached = false
          state.cameraX = 0
          state.targetCameraX = 0
          if (state.player) {
            state.player.x = 150
            state.player.y = C.GROUND_Y - C.PLAYER_HEIGHT
            state.player.vx = 0
            state.player.vy = 0
          }
          spawnRoomEnemiesFromState(state, dungeon)

          // 处理房间类型特殊效果
          handleRoomTypeEntry(state, dungeon)
        } else {
          state.victory = true
          finishGame(true, C.VICTORY_DELAY)
        }
      }
      return // 滑出期间不更新游戏逻辑
    }

    if (state.transitionPhase === 'slide_in') {
      if (state.transitionProgress >= 1) {
        // 滑入完成，恢复正常
        state.transitionPhase = 'none'
        state.transitionProgress = 0
      }
      return // 滑入期间不更新游戏逻辑
    }
  }

  const room = dungeon.getCurrentRoom()

  // === 玩家更新 ===
  const result = updatePlayer(state.player, input, dt, room.width, room.platforms)
  state.player = result.player

  // === 相机跟随 ===
  updateCameraState(state, room.width)

  // === 攻击处理 ===
  handleAttack(state, result, input, room, dungeon, now)

  // === 技能处理 ===
  handleSkills(state, result, now, dungeon)

  // === Combo超时 ===
  if (now - state.lastHitTime > 2000) {
    state.combo = 0
    state.shownComboMilestones = [] // 重置已显示的连击里程碑
  }

  // === 连击奖励显示（只在里程碑时显示）===
  const comboMilestones = [10, 20, 30, 50, 100]
  const reachedMilestone = comboMilestones.find(m => state.combo >= m && !state.shownComboMilestones.includes(m))
  if (reachedMilestone) {
    state.shownComboMilestones.push(reachedMilestone)
    state.floatTexts.push({
      text: `🔥 COMBO ${reachedMilestone}! 🔥`,
      x: state.player.x + state.player.width / 2,
      y: state.player.y - 40,
      life: 1000,
      maxLife: 1000,
      color: '#FFD700',
      size: 26,
      vy: -5,
      type: 'combo',
    })
  }

  // === 更新敌人 ===
  const enemyResult = updateEnemies(state.enemies, state.player, state.bullets, now, room.width, room.platforms)
  state.enemies = enemyResult.updatedEnemies
  state.bullets = enemyResult.updatedBullets
  state.player = enemyResult.player

  // 敌人攻击玩家
  if (enemyResult.playerHit) {
    if (state.player.invincible <= 0) {
      state.player.hp -= enemyResult.damageToPlayer
      state.player.hitStun = 80
      state.player.invincible = C.INVINCIBLE_DURATION

      if (state.player.hp <= 0) {
        handlePlayerDeath(state, finishGame)
      }
    }
  }

  // 子弹碰撞检测
  checkBulletCollisions(state, engine, finishGame, now)

  // === 清理死亡敌人并生成掉落 ===
  cleanupDeadEnemies(state, engine, dungeon)

  // === 拾取道具 ===
  const pickupResult = pickupDrops(state.drops, state.player)
  state.drops = pickupResult.drops
  state.player = pickupResult.player
  if (pickupResult.goldGained > 0) {
    state.gold += pickupResult.goldGained
  }
  if (pickupResult.equipmentGained) {
    state.player = applyEquipment(state.player, pickupResult.equipmentGained)
    state.inventory.push(pickupResult.equipmentGained)
  }

  // === 房间清理判定 ===
  const activeEnemies = state.enemies.filter(e => e.hp > 0)
  if (activeEnemies.length === 0 && !state.roomCleared) {
    state.roomCleared = true
    state.roomClearTimer = C.ROOM_CLEAR_DELAY
  }

  if (state.roomCleared && !state.doorOpen) {
    state.roomClearTimer -= dt
    if (state.roomClearTimer <= 0) {
      state.doorOpen = true
    }
  }

  // === 进入下一房间（屏幕坐标碰撞检测，与渲染层一致）===
  if (state.doorOpen) {
    const doorWorldX = room.width - 10
    const doorW = 36
    const doorH = 66
    const doorY = C.GROUND_Y - 50

    // 转换为屏幕坐标（与 ctx.translate(-cameraX, 0) 渲染一致）
    const doorScreenX = doorWorldX - state.cameraX
    const playerScreenX = state.player.x - state.cameraX

    // 屏幕空间 AABB 碰撞
    const hit =
      playerScreenX < doorScreenX + doorW &&
      playerScreenX + state.player.width > doorScreenX &&
      state.player.y < doorY + doorH &&
      state.player.y + state.player.height > doorY

    if (hit) {
      state.doorReached = true
      // 检查是否有下一个房间
      const hasBranches = room.branches && room.branches.length > 0
      const hasNextRoom = hasBranches || !dungeon.isLastRoom()

      if (hasNextRoom) {
        // 启动滑动过渡动画
        state.transitionPhase = 'slide_out'
        state.transitionProgress = 0
        // 锁定玩家输入，防止移动
        state.player.vx = 0
        state.player.vy = 0
      } else if (dungeon.isLastLevel()) {
        state.victory = true
        finishGame(true, C.VICTORY_DELAY)
      } else {
        state.victory = true
        finishGame(true, C.VICTORY_DELAY)
      }
    }
  }

  // === 更新特效 ===
  updateParticles(state.particles)
  updateShockwaves(state.shockwaves)
  updateFloatTexts(state.floatTexts)
  updateBullets(state.bullets)
  updateDrops(state.drops)
  state.screenShake = updateScreenShake(state.screenShake, dt)

  const particleLimit = C.isMobileDevice() ? C.PARTICLE_MAX_MOBILE : C.PARTICLE_MAX
  if (state.particles.length > particleLimit) {
    state.particles.splice(0, state.particles.length - particleLimit)
  }

  lastFrameTime.value = now
}

// ============ 相机更新 ============

function updateCameraState(state: GameUpdateState, roomWidth: number): void {
  // 相机目标：玩家居中显示（视角跟随玩家，玩家移动控制角色本身）
  const targetX = state.player.x + state.player.width / 2 - C.CANVAS_WIDTH / 2
  const diff = targetX - state.cameraX

  // 边界限制：相机不能超出房间边界
  const minCameraX = 0
  const maxCameraX = Math.max(0, roomWidth - C.CANVAS_WIDTH)

  // 快速平滑跟随
  if (Math.abs(diff) > 0.5) {
    state.cameraX += diff * 0.18
  } else {
    state.cameraX = targetX
  }

  state.cameraX = Math.max(minCameraX, Math.min(state.cameraX, maxCameraX))
  state.targetCameraX = state.cameraX
}

// ============ 攻击处理 ============

function handleAttack(
  state: GameUpdateState,
  result: ReturnType<typeof updatePlayer>,
  input: InputState,
  room: ReturnType<DungeonManager['getCurrentRoom']>,
  dungeon: DungeonManager,
  now: number,
): void {
  if (result.attackTriggered) {
    if (state.player.classType === 'archer' || state.player.classType === 'gunner') {
      const dir = state.player.facingRight ? 1 : -1
      state.bullets.push({
        x: state.player.x + (state.player.facingRight ? state.player.width : 0),
        y: state.player.y + state.player.height / 2 - 5,
        vx: dir * 6,
        vy: 0,
        width: 10,
        height: 4,
        damage: result.attackDamage,
        isPlayerBullet: true,
        color: '#00E5FF',
        pierce: false,
        life: 2000,
        maxLife: 2000,
        trail: true,
        owner: 'player',
      })
    } else {
      const atkResult = checkPlayerAttack(
        state.player, state.enemies,
        result.attackRange, result.attackDamage,
        result.attackKnockback, result.attackLaunch, now,
        state.combo, // 传递当前连击数
      )
      state.enemies = atkResult.enemies
      if (atkResult.hitCount > 0) {
        state.combo++
        state.lastHitTime = now
        if (state.combo > state.maxCombo) state.maxCombo = state.combo
        const hitEnemy = state.enemies.find(e => e.hp > 0 && e.recentlyHit > 0)
        if (hitEnemy) {
          const damage = atkResult.totalDamage > 0 ? atkResult.totalDamage : result.attackDamage
          spawnHitEffects(state, hitEnemy.x + hitEnemy.width / 2, hitEnemy.y + hitEnemy.height / 2, damage, atkResult.isCritical)
        }
      }
    }
  }
}

// ============ 技能处理 ============

const SKILL_TRIGGERS: (keyof PlayerUpdateResult)[] = [
  'skill1Triggered',
  'skill2Triggered',
  'skill3Triggered',
  'skill4Triggered',
]

function buildTempSkill(result: PlayerUpdateResult, slot: number): SkillInstance {
  const n = slot + 1
  return {
    id: `skill_${n}`,
    name: `技能${n}`,
    level: 1,
    maxLevel: 5,
    cooldown: 0,
    currentCooldown: 0,
    mpCost: 0,
    damage: result.skillDamage,
    range: result.skillRange,
    knockback: result.skillKnockback,
    launchHeight: result.skillLaunch,
    aoeRadius: result.skillAOE,
    duration: 500,
    spCost: 0,
    description: '',
    icon: `S${n}`,
    unlockLevel: 1,
  }
}

function pushRangedSkill1Bullets(state: GameUpdateState, result: PlayerUpdateResult): void {
  const p = state.player
  const dir = p.facingRight ? 1 : -1
  const baseX = p.x + (p.facingRight ? p.width : 0)
  const baseY = p.y + p.height / 2 - 5
  for (let i = -1; i <= 1; i++) {
    state.bullets.push({
      x: baseX,
      y: baseY + i * 8,
      vx: dir * 5.5,
      vy: 0,
      width: 10,
      height: 4,
      damage: result.skillDamage,
      isPlayerBullet: true,
      color: '#00E5FF',
      pierce: false,
      life: 2000,
      maxLife: 2000,
      trail: true,
      owner: 'player',
    })
  }
}

function pushRangedSkill2Bullet(state: GameUpdateState, result: PlayerUpdateResult): void {
  const p = state.player
  const dir = p.facingRight ? 1 : -1
  state.bullets.push({
    x: p.x + (p.facingRight ? p.width : 0),
    y: p.y + p.height / 2 - 8,
    vx: dir * 8,
    vy: 0,
    width: 18,
    height: 6,
    damage: result.skillDamage,
    isPlayerBullet: true,
    color: '#FFD700',
    pierce: true,
    life: 2500,
    maxLife: 2500,
    trail: true,
    owner: 'player',
  })
}

function applySkillMeleeResult(
  state: GameUpdateState,
  result: PlayerUpdateResult,
  skillResult: ReturnType<typeof checkSkillAttack>,
  comboAdd: number,
  now: number,
): void {
  state.enemies = skillResult.enemies
  state.bullets.push(...skillResult.bullets)
  if (skillResult.hitEnemies.length > 0) {
    state.combo += comboAdd
    state.lastHitTime = now
    if (state.combo > state.maxCombo) state.maxCombo = state.combo
    const hitEnemy = skillResult.hitEnemies[0]
    spawnHitEffects(
      state,
      hitEnemy.x + hitEnemy.width / 2,
      hitEnemy.y + hitEnemy.height / 2,
      result.skillDamage,
      false,
    )
  }
}

function handleSkills(
  state: GameUpdateState,
  result: PlayerUpdateResult,
  now: number,
  _dungeon: DungeonManager,
): void {
  const ranged = state.player.classType === 'archer' || state.player.classType === 'gunner'
  const cx = state.player.x + state.player.width / 2
  const cy = state.player.y + state.player.height / 2

  for (let slot = 0; slot < 4; slot++) {
    if (!result[SKILL_TRIGGERS[slot]]) continue

    spawnSkillEffects(state, cx, cy, state.player.classType, slot)
    const comboAdd = slot + 1

    if (ranged && slot === 0) {
      pushRangedSkill1Bullets(state, result)
      continue
    }
    if (ranged && slot === 1) {
      pushRangedSkill2Bullet(state, result)
      continue
    }

    const skillResult = checkSkillAttack(state.player, state.enemies, buildTempSkill(result, slot))
    applySkillMeleeResult(state, result, skillResult, comboAdd, now)
  }
}

function handlePlayerDeath(
  state: GameUpdateState,
  finishGame: (victory: boolean, delayMs: number) => void,
): void {
  state.player.lives--
  if (state.player.lives > 0) {
    state.player.hp = state.player.maxHp
    state.player.mp = state.player.maxMp
    state.player.x = 150
    state.player.y = C.GROUND_Y - C.PLAYER_HEIGHT
    state.player.vx = 0
    state.player.vy = 0
    state.player.invincible = C.INVINCIBLE_DURATION * 3
    state.player.attacking = false
    state.player.knockedDown = false
  } else {
    state.gameOver = true
    finishGame(false, C.GAME_OVER_DELAY)
  }
}

function spawnBulletHitFx(state: GameUpdateState, b: Bullet, damage: number): void {
  const particleCount = C.isMobileDevice() ? 4 : 8
  for (let j = 0; j < particleCount; j++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 4 + 2
    state.particles.push({
      x: b.x,
      y: b.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 350,
      maxLife: 350,
      color: j % 2 === 0 ? '#00E5FF' : '#FFFFFF',
      size: Math.random() * 3 + 2,
      shape: 'spark',
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    })
  }
  state.particles.push({
    x: b.x,
    y: b.y,
    vx: 0,
    vy: 0,
    life: 200,
    maxLife: 200,
    color: '#FFFFFF',
    size: 8,
    shape: 'circle',
  })
  state.floatTexts.push({
    text: `-${damage}`,
    x: b.x,
    y: b.y - 15,
    life: 600,
    maxLife: 600,
    color: '#FF4444',
    size: 14,
    vy: -2.5,
    type: 'damage',
  })
}

// ============ 子弹碰撞 ============

function checkBulletCollisions(
  state: GameUpdateState,
  engine: { addScore: (score: number, x: number, y: number) => void },
  finishGame: (victory: boolean, delayMs: number) => void,
  now: number,
): void {
  const activeEnemies = state.enemies.filter(e => e.hp > 0)

  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i]
    let hit = false

    if (b.isPlayerBullet) {
      const bulletLeft = b.x - b.width / 2
      const bulletRight = b.x + b.width / 2
      const bulletTop = b.y - b.height / 2
      const bulletBottom = b.y + b.height / 2

      for (const enemy of activeEnemies) {
        if (bulletRight < enemy.x ||
            bulletLeft > enemy.x + enemy.width ||
            bulletBottom < enemy.y ||
            bulletTop > enemy.y + enemy.height) {
          continue
        }

        enemy.hp -= b.damage
        enemy.hitStun = 200
        enemy.recentlyHit = 200
        hit = true
        state.combo++
        state.lastHitTime = now
        if (state.combo > state.maxCombo) state.maxCombo = state.combo
        spawnBulletHitFx(state, b, b.damage)

        if (enemy.hp <= 0) {
          spawnDeathEffects(state, enemy)
        }
        break
      }
    } else {
      const bulletLeft = b.x - b.width / 2
      const bulletRight = b.x + b.width / 2
      const bulletTop = b.y - b.height / 2
      const bulletBottom = b.y + b.height / 2

      const playerLeft = state.player.x
      const playerRight = state.player.x + state.player.width
      const playerTop = state.player.y
      const playerBottom = state.player.y + state.player.height

      if (!(bulletRight < playerLeft ||
            bulletLeft > playerRight ||
            bulletBottom < playerTop ||
            bulletTop > playerBottom)) {

        if (state.player.invincible <= 0) {
          state.player.hp -= b.damage
          state.player.hitStun = 100
          state.player.invincible = C.INVINCIBLE_DURATION
          hit = true

          if (state.player.hp <= 0) {
            handlePlayerDeath(state, finishGame)
          }
        }
      }
    }

    if (hit) {
      state.bullets.splice(i, 1)
    }
  }
}

// ============ 死亡敌人清理 ============

function cleanupDeadEnemies(
  state: GameUpdateState,
  engine: { addScore: (score: number, x: number, y: number) => void },
  dungeon: DungeonManager,
): void {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i]
    if (enemy.hp <= 0) {
      const expAmount = enemy.type === 'boss' ? C.EXP_PER_BOSS : enemy.type === 'elite' ? C.EXP_PER_ELITE : C.EXP_PER_NORMAL
      addExp(state.player, expAmount)
      state.score += enemy.score * (1 + Math.floor(state.combo / 5) * 0.5)

      const drops = generateDrops(enemy.x, enemy.y, dungeon.getCurrentLevelIndex() + 1, state.player.level)
      state.drops.push(...drops)

      engine.addScore(enemy.score, enemy.x, enemy.y)
      state.enemies.splice(i, 1)
    }
  }
}

// ============ 房间类型入口处理 ============

function handleRoomTypeEntry(state: GameUpdateState, dungeon: DungeonManager): void {
  const room = dungeon.getCurrentRoom()

  switch (room.roomType) {
    case 'rest':
      // 休息房：自动回血回蓝
      if (room.restEffect) {
        const healAmount = Math.floor(state.player.maxHp * (room.restEffect.healPercent ?? 0) / 100)
        const mpAmount = Math.floor(state.player.maxMp * (room.restEffect.mpRestorePercent ?? 0) / 100)
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmount)
        state.player.mp = Math.min(state.player.maxMp, state.player.mp + mpAmount)

        // 回血特效文字
        state.floatTexts.push({
          text: `+${healAmount} HP`,
          x: state.player.x,
          y: state.player.y - 30,
          life: 1200, maxLife: 1200,
          color: '#22d3ee',
          size: 16, vy: -2,
          type: 'heal',
        })
        state.floatTexts.push({
          text: `+${mpAmount} MP`,
          x: state.player.x + 60,
          y: state.player.y - 30,
          life: 1200, maxLife: 1200,
          color: '#4488FF',
          size: 16, vy: -2,
          type: 'heal',
        })

        // 绿色粒子特效
        for (let i = 0; i < 20; i++) {
          state.particles.push({
            x: state.player.x + Math.random() * 40,
            y: state.player.y + Math.random() * 40,
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 4 - 1,
            life: 800, maxLife: 800,
            color: i % 2 === 0 ? '#22d3ee' : '#4ade80',
            size: Math.random() * 4 + 2,
            shape: 'circle',
            rotation: 0, rotationSpeed: 0,
          })
        }
      }
      // 休息房无敌人，直接开门
      state.roomCleared = true
      state.roomClearTimer = 0
      state.doorOpen = true
      break

    case 'treasure':
      // 宝箱房：清除所有敌人后显示奖励
      if (room.reward) {
        state.floatTexts.push({
          text: '💎 宝箱房间！',
          x: C.CANVAS_WIDTH / 2,
          y: 80,
          life: 2000, maxLife: 2000,
          color: '#fbbf24',
          size: 22, vy: -1,
          type: 'system',
        })
      }
      break

    case 'secret':
      // 隐藏房：特殊发现提示
      state.floatTexts.push({
        text: '🔍 发现隐藏房间！',
        x: C.CANVAS_WIDTH / 2,
        y: 80,
        life: 2500, maxLife: 2500,
        color: '#f472b6',
        size: 20, vy: -1,
        type: 'system',
      })
      break
  }
}