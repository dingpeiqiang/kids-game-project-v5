import type { Player, InputState, SkillInstance, ClassType, Platform } from '../types'
import * as C from '../config'
import { CLASS_CONFIGS } from '../data/classes'
import { createSkillsForClass } from '../data/skills'

// 玩家更新结果 - 包含攻击/技能触发信息
export interface PlayerUpdateResult {
  player: Player
  attackTriggered: boolean
  attackDamage: number
  attackRange: number
  attackKnockback: number
  attackLaunch: number
  skill1Triggered: boolean
  skill2Triggered: boolean
  skill3Triggered: boolean
  skill4Triggered: boolean
  skillDamage: number
  skillRange: number
  skillAOE: number
  skillKnockback: number
  skillLaunch: number
}

export function createPlayer(classType: ClassType, level: number = 1): Player {
  const cfg = CLASS_CONFIGS[classType]
  const skills = createSkillsForClass(classType, level)

  return {
    x: 200,
    y: C.GROUND_Y - C.PLAYER_HEIGHT,
    width: C.PLAYER_WIDTH,
    height: C.PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    hp: C.PLAYER_MAX_HP,
    maxHp: cfg ? C.PLAYER_MAX_HP + 20 : C.PLAYER_MAX_HP,
    mp: cfg ? cfg.baseMp : C.PLAYER_MAX_MP,
    maxMp: cfg ? cfg.baseMp : C.PLAYER_MAX_MP,
    level,
    exp: 0,
    expToNext: C.EXP_TO_LEVEL(level),
    attackPower: cfg ? cfg.baseAtk : C.ATTACK_DAMAGE,
    attackSpeed: cfg ? cfg.baseAttackSpeed : 1,
    moveSpeed: cfg ? cfg.baseSpeed : C.PLAYER_SPEED,
    facingRight: true,
    invincible: 0,
    attacking: false,
    attackStep: 0,
    attackTimer: 0,
    lastAttackTime: 0,
    skills,
    skill1Cooldown: 0,
    skill2Cooldown: 0,
    skill3Cooldown: 0,
    skill4Cooldown: 0,
    usingSkill1: false,
    usingSkill2: false,
    usingSkill3: false,
    usingSkill4: false,
    skillTimer: 0,
    hitStun: 0,
    knockedDown: false,
    knockdownTimer: 0,
    dashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    walkFrame: 0,
    classType: classType,
    lives: C.PLAYER_MAX_LIVES,
  }
}

export function updatePlayer(player: Player, input: InputState, dt: number, roomWidth: number, platforms?: Platform[]): PlayerUpdateResult {
  if (player.hp <= 0) {
    return {
      player: { ...player, hp: 0 },
      attackTriggered: false,
      attackDamage: 0,
      attackRange: 0,
      attackKnockback: 0,
      attackLaunch: 0,
      skill1Triggered: false,
      skill2Triggered: false,
      skill3Triggered: false,
      skill4Triggered: false,
      skillDamage: 0,
      skillRange: 0,
      skillAOE: 0,
      skillKnockback: 0,
      skillLaunch: 0,
    }
  }

  let p = { ...player }
  let attackTriggered = false
  let skill1Triggered = false
  let skill2Triggered = false
  let skill3Triggered = false
  let skill4Triggered = false

  // 默认攻击属性
  let attackDamage = Math.round(p.attackPower * (1 + p.attackStep * 0.3))
  let attackRange = C.ATTACK_RANGE
  let attackKnockback = 6 + p.attackStep * 2
  let attackLaunch = p.attackStep >= 2 ? -6 : 0

  let skillDamage = 0
  let skillRange = 0
  let skillAOE = 0
  let skillKnockback = 0
  let skillLaunch = 0

  // 无敌帧
  if (p.invincible > 0) p.invincible -= dt

  // 受击硬直（缩短，允许快速恢复操作）
  if (p.hitStun > 0) {
    p.hitStun -= dt
    // 硬直期间可以移动（减速），可以攻击/技能来取消硬直
    p.vx *= 0.85
    p.vy *= 0.85
    // 不再直接 return，允许后续攻击/技能/移动判定
  }

  // 击倒（缩短时间，允许快速起身）
  if (p.knockedDown) {
    p.knockdownTimer -= dt
    p.vx *= 0.9
    p.vy *= 0.9
    if (p.knockdownTimer <= 0) {
      p.knockedDown = false
      p.vy = -3  // 起身弹起幅度减小
    }
    // 击倒期间也允许操作（攻击/技能可取消击倒）
  }

  // 技能使用中（DNF 式：施法帧内略减速，四技能共用 skillTimer）
  if (p.usingSkill1 || p.usingSkill2 || p.usingSkill3 || p.usingSkill4) {
    p.skillTimer -= dt
    if (p.skillTimer <= 0) {
      p.usingSkill1 = false
      p.usingSkill2 = false
      p.usingSkill3 = false
      p.usingSkill4 = false
    }
    p.vx *= 0.88
    p.vy *= 0.9
  }

  // 攻击状态（允许移动，仅减速）
  if (p.attacking) {
    p.attackTimer -= dt
    if (p.attackTimer <= 0) {
      p.attacking = false
    }
    p.vx *= 0.85
    p.vy *= 0.85
    // 不再 return，允许后续移动/冲刺判定
  }

  // 冲刺
  if (p.dashCooldown > 0) p.dashCooldown -= dt
  if (p.dashing) {
    p.dashTimer -= dt
    p.vx = p.facingRight ? C.DASH_SPEED : -C.DASH_SPEED
    if (p.dashTimer <= 0) {
      p.dashing = false
    }
    return {
      player: applyPhysics(p, roomWidth, platforms),
      attackTriggered: false, attackDamage, attackRange, attackKnockback, attackLaunch,
      skill1Triggered: false, skill2Triggered: false, skill3Triggered: false, skill4Triggered: false,
      skillDamage, skillRange, skillAOE, skillKnockback, skillLaunch,
    }
  }

  // ---- 攻击触发检测 ----
  if (input.attack) {
    const now = Date.now()
    if (now - p.lastAttackTime > C.ATTACK_COOLDOWN) {
      // 连击步进
      if (now - p.lastAttackTime > C.COMBO_WINDOW) {
        p.attackStep = 0
      } else {
        p.attackStep = (p.attackStep + 1) % C.MAX_COMBO_STEPS
      }
      p.attacking = true
      p.attackTimer = 280
      p.lastAttackTime = now
      attackTriggered = true

      // 根据连击步数调整伤害/击退
      attackDamage = Math.round(p.attackPower * (1 + p.attackStep * 0.3))
      attackRange = C.ATTACK_RANGE + p.attackStep * 5
      attackKnockback = 6 + p.attackStep * 2
      attackLaunch = p.attackStep >= 2 ? -8 : -4
    }
  }

  // ---- 技能触发检测 ----
  if (input.skill1) {
    
    if (p.skill1Cooldown > 0) {
    } else if (p.skills.length === 0) {
    } else {
      const skill = p.skills[0]
      
      if (p.mp >= skill.mpCost) {
        p.mp -= skill.mpCost
        p.skill1Cooldown = skill.cooldown
        // 同步更新 skills 数组的冷却时间（用于 UI 显示）
        p.skills = p.skills.map((s, idx) =>
          idx === 0 ? { ...s, currentCooldown: skill.cooldown } : s
        )
        p.usingSkill1 = true
        p.skillTimer = skill.duration
        skill1Triggered = true
        skillDamage = skill.damage
        skillRange = skill.range
        skillAOE = skill.aoeRadius
        skillKnockback = skill.knockback
        skillLaunch = skill.launchHeight
      } else {
      }
    }
  }

  if (input.skill2) {
    
    if (p.skill2Cooldown > 0) {
    } else if (p.skills.length < 2) {
    } else {
      const skill = p.skills[1]
      
      if (p.mp >= skill.mpCost) {
        p.mp -= skill.mpCost
        p.skill2Cooldown = skill.cooldown
        // 同步更新 skills 数组的冷却时间（用于 UI 显示）
        p.skills = p.skills.map((s, idx) =>
          idx === 1 ? { ...s, currentCooldown: skill.cooldown } : s
        )
        p.usingSkill2 = true
        p.skillTimer = skill.duration
        skill2Triggered = true
        skillDamage = skill.damage
        skillRange = skill.range
        skillAOE = skill.aoeRadius
        skillKnockback = skill.knockback
        skillLaunch = skill.launchHeight
      } else {
      }
    }
  }

  if (input.skill3) {
    
    if (p.skill3Cooldown > 0) {
    } else if (p.skills.length < 3) {
    } else {
      const skill = p.skills[2]
      
      if (p.mp >= skill.mpCost) {
        p.mp -= skill.mpCost
        p.skill3Cooldown = skill.cooldown
        p.skills = p.skills.map((s, idx) =>
          idx === 2 ? { ...s, currentCooldown: skill.cooldown } : s
        )
        p.usingSkill3 = true
        p.skillTimer = skill.duration
        skill3Triggered = true
        skillDamage = skill.damage
        skillRange = skill.range
        skillAOE = skill.aoeRadius
        skillKnockback = skill.knockback
        skillLaunch = skill.launchHeight
      } else {
      }
    }
  }

  if (input.skill4) {
    
    if (p.skill4Cooldown > 0) {
    } else if (p.skills.length < 4) {
    } else {
      const skill = p.skills[3]
      
      if (p.mp >= skill.mpCost) {
        p.mp -= skill.mpCost
        p.skill4Cooldown = skill.cooldown
        p.skills = p.skills.map((s, idx) =>
          idx === 3 ? { ...s, currentCooldown: skill.cooldown } : s
        )
        p.usingSkill4 = true
        p.skillTimer = skill.duration
        skill4Triggered = true
        skillDamage = skill.damage
        skillRange = skill.range
        skillAOE = skill.aoeRadius
        skillKnockback = skill.knockback
        skillLaunch = skill.launchHeight
      } else {
      }
    }
  }

  // DNF风格：横向移动为主，跳跃独立
  const moveAcceleration = 0.6
  const moveDeceleration = 0.85
  const maxMoveSpeed = p.moveSpeed
  
  // 计算移动方向（仅横向）
  let targetVx = 0
  
  // 方向键控制
  if (input.left) {
    targetVx = -maxMoveSpeed
    p.facingRight = false
  } else if (input.right) {
    targetVx = maxMoveSpeed
    p.facingRight = true
  }
  
  // 摇杆输入（仅X轴控制横向移动）
  if (Math.abs(input.stickX) > 0.2) {
    targetVx = input.stickX * maxMoveSpeed
    p.facingRight = input.stickX > 0
  }
  
  // 水平加速/减速
  if (targetVx !== 0) {
    p.vx += (targetVx - p.vx) * moveAcceleration
    p.vx = Math.max(-maxMoveSpeed, Math.min(maxMoveSpeed, p.vx))
  } else {
    p.vx *= moveDeceleration
    if (Math.abs(p.vx) < 0.1) p.vx = 0
  }

  // DNF风格重力系统：在空中时持续应用重力
  const isOnGround = p.y + p.height >= C.GROUND_Y - 5
  
  if (!isOnGround) {
    // 在空中：应用重力，形成抛物线
    p.vy += C.GRAVITY
    // 限制最大下落速度
    p.vy = Math.min(p.vy, 12)
  } else if (p.vy > 0) {
    // 落地时重置垂直速度
    p.vy = 0
    p.y = C.GROUND_Y - p.height
  }

  // 冲刺（DNF风格：冲刺时快速移动且无敌）
  if (input.dash && p.dashCooldown <= 0 && !p.dashing && !p.knockedDown) {
    p.dashing = true
    p.dashTimer = C.DASH_DURATION
    p.dashCooldown = C.DASH_COOLDOWN
    p.invincible = C.DASH_DURATION * 0.5 // 冲刺时短暂无敌
    // 冲刺方向基于当前朝向
    p.vx = p.facingRight ? C.DASH_SPEED : -C.DASH_SPEED
  }

  // DNF风格跳跃：地面时跳跃，空中可微调方向
  if (input.jump && !p.knockedDown && isOnGround) {
    p.vy = C.PLAYER_JUMP_FORCE
    // 跳跃时给予一个小的水平冲量，增强立体感
    if (input.left) {
      p.vx -= 2
    } else if (input.right) {
      p.vx += 2
    }
  }
  
  // 空中控制（DNF风格：跳跃后可以微调方向）
  if (!isOnGround) {
    const airControl = 0.15
    if (input.left) {
      p.vx = Math.max(-maxMoveSpeed * 0.8, p.vx - airControl)
      p.facingRight = false
    } else if (input.right) {
      p.vx = Math.min(maxMoveSpeed * 0.8, p.vx + airControl)
      p.facingRight = true
    }
  }

  // 走路动画帧：水平移动时递增，静止/空中时归零
  const isMoving = Math.abs(p.vx) > 0.5
  if (isMoving) {
    p.walkFrame += dt * 0.015 // 大约每秒递增 ~1
  } else {
    p.walkFrame = 0
  }

  // MP自然回复
  if (p.mp < p.maxMp) {
    p.mp = Math.min(p.maxMp, p.mp + C.MP_REGEN_RATE * (dt / 16.67))
  }

  // 冷却缩减（同步更新 skills 数组用于 UI 显示）
  p.skill1Cooldown = Math.max(0, p.skill1Cooldown - dt)
  p.skill2Cooldown = Math.max(0, p.skill2Cooldown - dt)
  p.skill3Cooldown = Math.max(0, p.skill3Cooldown - dt)
  p.skill4Cooldown = Math.max(0, p.skill4Cooldown - dt)

  // 同步 skills 数组的冷却时间
  if (p.skills.length > 0) {
    p.skills = p.skills.map((s, idx) => {
      let cd: number
      switch (idx) {
        case 0: cd = p.skill1Cooldown; break
        case 1: cd = p.skill2Cooldown; break
        case 2: cd = p.skill3Cooldown; break
        case 3: cd = p.skill4Cooldown; break
        default: cd = s.currentCooldown
      }
      return { ...s, currentCooldown: Math.max(0, cd - (idx < 4 ? 0 : dt)) }
    })
  }

  return {
    player: applyPhysics(p, roomWidth, platforms),
    attackTriggered, attackDamage, attackRange, attackKnockback, attackLaunch,
    skill1Triggered, skill2Triggered, skill3Triggered, skill4Triggered,
    skillDamage, skillRange, skillAOE, skillKnockback, skillLaunch,
  }
}

function applyPhysics(player: Player, roomWidth: number, platforms?: Platform[]): Player {
  let p = { ...player }

  // 应用位移
  p.x += p.vx
  p.y += p.vy

  // DNF风格边界限制
  // 顶部边界：玩家不能高于天花板
  if (p.y < C.CEILING_Y) {
    p.y = C.CEILING_Y
    p.vy = 0
  }

  // 底部边界：玩家不能低于地面
  if (p.y + p.height > C.GROUND_Y) {
    p.y = C.GROUND_Y - p.height
    p.vy = 0
  }

  // 左墙壁边界限制
  if (p.x < 0) {
    p.x = 0
    p.vx = 0
  }

  // 右墙壁边界限制
  if (p.x + p.width > roomWidth) {
    p.x = roomWidth - p.width
    p.vx = 0
  }

  return p
}

export function startAttack(player: Player): Player {
  const now = Date.now()
  if (now - player.lastAttackTime > C.COMBO_WINDOW) {
    return { ...player, attackStep: 0 }
  }
  return player
}

export function addExp(player: Player, amount: number): { player: Player; leveledUp: boolean } {
  let p = { ...player }
  let leveledUp = false
  p.exp += amount
  while (p.exp >= p.expToNext) {
    p.exp -= p.expToNext
    p.level++
    p.expToNext = C.EXP_TO_LEVEL(p.level)
    // 升级奖励
    p.maxHp += 10
    p.hp = Math.min(p.hp + 10, p.maxHp)
    p.maxMp += 5
    p.mp = Math.min(p.mp + 5, p.maxMp)
    p.attackPower += 1
    const config = CLASS_CONFIGS[p.classType]
    if (config) {
      // 解锁新技能
      config.skills.forEach(sd => {
        if (p.level >= sd.unlockLevel && !p.skills.find(s => s.id === sd.id)) {
          p.skills = [...p.skills, {
            id: sd.id,
            name: sd.name,
            level: 1,
            maxLevel: sd.maxLevel,
            cooldown: sd.baseCooldown,
            currentCooldown: 0,
            mpCost: sd.baseMpCost,
            damage: sd.baseDamage,
            range: sd.baseRange,
            knockback: sd.baseKnockback,
            launchHeight: sd.launchHeight,
            aoeRadius: sd.aoeRadius,
            duration: sd.duration,
            spCost: sd.spCost,
            description: sd.description,
            icon: sd.icon,
            unlockLevel: sd.unlockLevel,
          }]
        }
      })
    }
    leveledUp = true
  }
  return { player: p, leveledUp }
}