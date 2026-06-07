/**
 * 游戏特效生成模块
 * 负责打击粒子、技能特效、死亡特效、房间敌人刷新等
 */

import type { Enemy, Player } from '../types'
import type { GameUpdateState } from './game-update'
import { createEnemy, createBoss } from './enemies'
import type { DungeonManager } from './dungeon'
import * as C from '../config'

// ============ 职业技能配色方案 ============
const CLASS_SKILL_COLORS: Record<string, {
  primary: string
  secondary: string
  glow: string
  particle: string[]
}> = {
  swordsman: {
    primary: '#FF4444',
    secondary: '#FF6666',
    glow: 'rgba(255,68,68,0.6)',
    particle: ['#FF4444', '#FF6666', '#FFAA00', '#FFFFFF'],
  },
  fighter: {
    primary: '#FF6B00',
    secondary: '#FF9933',
    glow: 'rgba(255,107,0,0.6)',
    particle: ['#FF6B00', '#FF9933', '#FFD700', '#FFFFFF'],
  },
  archer: {
    primary: '#4CAF50',
    secondary: '#81C784',
    glow: 'rgba(76,175,80,0.6)',
    particle: ['#4CAF50', '#81C784', '#00E5FF', '#FFFFFF'],
  },
  mage: {
    primary: '#9C27B0',
    secondary: '#E040FB',
    glow: 'rgba(156,39,176,0.6)',
    particle: ['#9C27B0', '#E040FB', '#00E5FF', '#FFFFFF'],
  },
  gunner: {
    primary: '#2196F3',
    secondary: '#64B5F6',
    glow: 'rgba(33,150,243,0.6)',
    particle: ['#2196F3', '#64B5F6', '#00E5FF', '#FFFFFF'],
  },
}

// ============ 打击特效 ============

export function spawnHitEffects(state: GameUpdateState, x: number, y: number, damage: number, isCritical: boolean = false): void {
  const count = C.isMobileDevice() ? (isCritical ? 6 : 3) : (isCritical ? 10 : 5)
  const colors = isCritical ? ['#FFD700', '#FFAA00', '#FFFFFF', '#FFFF00'] : ['#FFD700', '#FFFFFF']
  
  for (let j = 0; j < count; j++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * (isCritical ? 6 : 4) + (isCritical ? 3 : 2)
    const colorIdx = j % colors.length
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (isCritical ? 3 : 2),
      life: isCritical ? 450 : 350,
      maxLife: isCritical ? 450 : 350,
      color: colors[colorIdx],
      size: Math.random() * (isCritical ? 5 : 3) + (isCritical ? 3 : 2),
      shape: isCritical ? (j % 3 === 0 ? 'star' : 'spark') : 'spark',
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * (isCritical ? 25 : 15),
    })
  }

  // 打击闪光（暴击时更大更亮）
  state.shockwaves.push({
    x, y,
    radius: isCritical ? 10 : 5,
    maxRadius: isCritical ? 50 : 30,
    life: isCritical ? 300 : 200,
    color: isCritical ? '#FFD700' : '#FFFFFF',
  })

  if (isCritical) {
    // 暴击额外闪光
    state.shockwaves.push({
      x, y,
      radius: 5,
      maxRadius: 35,
      life: 180,
      color: '#FFFFFF',
    })
  }

  // 伤害数字（暴击时更大更醒目）
  const damageText = isCritical ? `暴击! -${damage}` : `-${damage}`
  state.floatTexts.push({
    text: damageText,
    x, y: y - 15,
    life: isCritical ? 900 : 700,
    maxLife: isCritical ? 900 : 700,
    color: isCritical ? '#FFD700' : (damage > 30 ? '#FF4444' : '#FF8800'),
    size: isCritical ? 24 : (damage > 40 ? 18 : (damage > 25 ? 16 : 14)),
    vy: isCritical ? -5 : -3,
    type: 'damage',
  })
}

// ============ 技能特效（增强版） ============

export function spawnSkillEffects(
  state: GameUpdateState,
  x: number,
  y: number,
  classType?: string,
  skillIndex: number = 0,
): void {
  const colors = CLASS_SKILL_COLORS[classType || 'swordsman']

  if (skillIndex === 0) {
    // 技能1：小型爆发特效（快速、锐利）
    spawnSkill1Effect(state, x, y, colors)
  } else if (skillIndex === 1) {
    // 技能2：大型AOE特效（范围广、震撼）
    spawnSkill2Effect(state, x, y, colors)
  } else if (skillIndex === 2) {
    // 技能3：强力单体特效（集中、穿透）
    spawnSkill3Effect(state, x, y, colors)
  } else {
    // 技能4：终极技能特效（全屏、震撼）
    spawnSkill4Effect(state, x, y, colors)
  }
}

function spawnSkill1Effect(
  state: GameUpdateState,
  x: number,
  y: number,
  colors: { primary: string; secondary: string; glow: string; particle: string[] },
): void {
  // 核心冲击波（快速扩散）
  state.shockwaves.push({
    x, y,
    radius: 10,
    maxRadius: 70,
    life: 300,
    color: colors.primary,
  })

  // 内圈闪光
  state.shockwaves.push({
    x, y,
    radius: 5,
    maxRadius: 35,
    life: 180,
    color: '#FFFFFF',
  })

  // 放射状粒子（高速）
  const rayCount = C.isMobileDevice() ? 6 : 10
  for (let i = 0; i < rayCount; i++) {
    const angle = (Math.PI * 2 * i) / rayCount + Math.random() * 0.3
    const speed = 5 + Math.random() * 4
    const colorIdx = i % colors.particle.length
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      life: 400 + Math.random() * 150,
      maxLife: 550,
      color: colors.particle[colorIdx],
      size: Math.random() * 4 + 3,
      shape: i % 3 === 0 ? 'star' : (i % 3 === 1 ? 'spark' : 'circle'),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 20,
    })
  }

  // 拖尾粒子（慢速、渐隐）
  const trailCount = C.isMobileDevice() ? 3 : 5
  for (let i = 0; i < trailCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1.5 + Math.random() * 2
    state.particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 500 + Math.random() * 200,
      maxLife: 700,
      color: colors.secondary,
      size: Math.random() * 6 + 4,
      shape: 'glow',
      rotation: 0,
      rotationSpeed: 0,
    })
  }
}

function spawnSkill2Effect(
  state: GameUpdateState,
  x: number,
  y: number,
  colors: { primary: string; secondary: string; glow: string; particle: string[] },
): void {
  // 多层冲击波（震撼感）
  state.shockwaves.push({
    x, y,
    radius: 15,
    maxRadius: 100,
    life: 450,
    color: colors.primary,
  })

  state.shockwaves.push({
    x, y,
    radius: 8,
    maxRadius: 65,
    life: 320,
    color: colors.secondary,
  })

  state.shockwaves.push({
    x, y,
    radius: 3,
    maxRadius: 40,
    life: 200,
    color: '#FFFFFF',
  })

  // 大量放射粒子
  const burstCount = C.isMobileDevice() ? 10 : 16
  for (let i = 0; i < burstCount; i++) {
    const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.4
    const speed = 4 + Math.random() * 5
    const colorIdx = i % colors.particle.length
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 550 + Math.random() * 200,
      maxLife: 750,
      color: colors.particle[colorIdx],
      size: Math.random() * 5 + 3,
      shape: i % 4 === 0 ? 'star' : (i % 4 === 1 ? 'spark' : (i % 4 === 2 ? 'circle' : 'ring')),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 25,
    })
  }

  // 环形光晕粒子
  const ringCount = C.isMobileDevice() ? 4 : 8
  for (let i = 0; i < ringCount; i++) {
    const angle = (Math.PI * 2 * i) / ringCount
    const dist = 25 + Math.random() * 15
    state.particles.push({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: Math.cos(angle) * 2,
      vy: Math.sin(angle) * 2,
      life: 600 + Math.random() * 200,
      maxLife: 800,
      color: colors.primary,
      size: Math.random() * 8 + 5,
      shape: 'glow',
      rotation: 0,
      rotationSpeed: 0,
    })
  }

  // 升腾能量粒子
  const riseCount = C.isMobileDevice() ? 2 : 4
  for (let i = 0; i < riseCount; i++) {
    state.particles.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 1,
      vy: -3 - Math.random() * 3,
      life: 700 + Math.random() * 300,
      maxLife: 1000,
      color: colors.secondary,
      size: Math.random() * 4 + 3,
      shape: 'spark',
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    })
  }
}

// 技能3：强力单体特效（集中、穿透）
function spawnSkill3Effect(
  state: GameUpdateState,
  x: number,
  y: number,
  colors: { primary: string; secondary: string; glow: string; particle: string[] },
): void {
  // 穿透光束
  state.shockwaves.push({
    x, y,
    radius: 5,
    maxRadius: 150,
    life: 350,
    color: colors.glow,
  })

  // 核心聚能
  state.shockwaves.push({
    x, y,
    radius: 20,
    maxRadius: 35,
    life: 200,
    color: colors.primary,
  })

  // 高速穿透粒子
  const beamCount = C.isMobileDevice() ? 8 : 12
  for (let i = 0; i < beamCount; i++) {
    const angle = (Math.PI * 2 * i) / beamCount
    const speed = 8 + Math.random() * 6
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 400 + Math.random() * 200,
      maxLife: 600,
      color: colors.particle[i % colors.particle.length],
      size: Math.random() * 3 + 2,
      shape: 'spark',
      rotation: 0,
      rotationSpeed: 0,
    })
  }

  // 能量涟漪
  const rippleCount = 3
  for (let i = 0; i < rippleCount; i++) {
    setTimeout(() => {
      state.shockwaves.push({
        x, y,
        radius: 10 + i * 15,
        maxRadius: 60 + i * 20,
        life: 300,
        color: i % 2 === 0 ? colors.primary : colors.secondary,
      })
    }, i * 100)
  }
}

// 技能4：终极技能特效（全屏、震撼）
function spawnSkill4Effect(
  state: GameUpdateState,
  x: number,
  y: number,
  colors: { primary: string; secondary: string; glow: string; particle: string[] },
): void {
  // 大型冲击波（全屏）
  state.shockwaves.push({
    x, y,
    radius: 20,
    maxRadius: 200,
    life: 600,
    color: colors.primary,
  })

  state.shockwaves.push({
    x, y,
    radius: 10,
    maxRadius: 150,
    life: 450,
    color: colors.secondary,
  })

  state.shockwaves.push({
    x, y,
    radius: 5,
    maxRadius: 100,
    life: 300,
    color: '#FFFFFF',
  })

  // 大量爆发粒子
  const burstCount = C.isMobileDevice() ? 15 : 25
  for (let i = 0; i < burstCount; i++) {
    const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.3
    const speed = 6 + Math.random() * 8
    const colorIdx = i % colors.particle.length
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 600 + Math.random() * 300,
      maxLife: 900,
      color: colors.particle[colorIdx],
      size: Math.random() * 6 + 4,
      shape: i % 5 === 0 ? 'star' : (i % 5 === 1 ? 'spark' : (i % 5 === 2 ? 'ring' : (i % 5 === 3 ? 'glow' : 'circle'))),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 30,
    })
  }

  // 环形爆发波
  const ringWaveCount = 4
  for (let i = 0; i < ringWaveCount; i++) {
    setTimeout(() => {
      const ringCount = C.isMobileDevice() ? 6 : 10
      for (let j = 0; j < ringCount; j++) {
        const angle = (Math.PI * 2 * j) / ringCount
        const dist = 30 + i * 25 + Math.random() * 10
        state.particles.push({
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          life: 500 + Math.random() * 200,
          maxLife: 700,
          color: colors.primary,
          size: Math.random() * 5 + 3,
          shape: 'glow',
          rotation: 0,
          rotationSpeed: 0,
        })
      }
    }, i * 150)
  }

  // 天罚光束（从上往下）
  const beamCount = C.isMobileDevice() ? 3 : 5
  for (let i = 0; i < beamCount; i++) {
    setTimeout(() => {
      for (let j = 0; j < 8; j++) {
        state.particles.push({
          x: x + (Math.random() - 0.5) * 60,
          y: y - 100 - Math.random() * 50,
          vx: (Math.random() - 0.5) * 2,
          vy: 5 + Math.random() * 3,
          life: 400 + Math.random() * 200,
          maxLife: 600,
          color: '#FFFFFF',
          size: Math.random() * 8 + 5,
          shape: 'spark',
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 15,
        })
      }
    }, i * 200)
  }
}

// ============ 死亡特效（增强版） ============

export function spawnDeathEffects(state: GameUpdateState, enemy: Enemy): void {
  const cx = enemy.x + enemy.width / 2
  const cy = enemy.y + enemy.height / 2

  // 爆炸冲击波（多层）
  state.shockwaves.push({
    x: cx, y: cy,
    radius: 8,
    maxRadius: 55,
    life: 350,
    color: enemy.color,
  })

  state.shockwaves.push({
    x: cx, y: cy,
    radius: 4,
    maxRadius: 35,
    life: 220,
    color: '#FFFFFF',
  })

  // 爆炸粒子（大量、高速）
  const count = C.isMobileDevice() ? 6 : 12
  for (let j = 0; j < count; j++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 6 + 3
    state.particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3.5,
      life: 600 + Math.random() * 250, maxLife: 850,
      color: enemy.color,
      size: Math.random() * 5 + 2.5,
      shape: j % 4 === 0 ? 'star' : (j % 4 === 1 ? 'spark' : (j % 4 === 2 ? 'circle' : 'glow')),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 18,
    })
  }

  // 碎片粒子（模拟身体碎裂）
  const fragCount = C.isMobileDevice() ? 2 : 5
  for (let i = 0; i < fragCount; i++) {
    const angle = (Math.PI * 2 * i) / fragCount + Math.random() * 0.5
    const speed = 2 + Math.random() * 3
    state.particles.push({
      x: cx + (Math.random() - 0.5) * enemy.width * 0.6,
      y: cy + (Math.random() - 0.5) * enemy.height * 0.6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 700 + Math.random() * 300, maxLife: 1000,
      color: enemy.color,
      size: Math.random() * 7 + 4,
      shape: 'circle',
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
    })
  }

  // 升腾灵魂粒子
  const soulCount = C.isMobileDevice() ? 1 : 3
  for (let i = 0; i < soulCount; i++) {
    state.particles.push({
      x: cx + (Math.random() - 0.5) * 30,
      y: cy - 10,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -2 - Math.random() * 3,
      life: 900 + Math.random() * 400, maxLife: 1300,
      color: '#FFFFFF',
      size: Math.random() * 3 + 2,
      shape: 'spark',
      rotation: 0,
      rotationSpeed: 0,
    })
  }
}

// ============ 房间敌人刷新 ============

export function spawnRoomEnemiesFromState(state: GameUpdateState, dungeon: DungeonManager): void {
  const room = dungeon.getCurrentRoom()
  const levelIndex = dungeon.getCurrentLevelIndex()
  for (const spawn of room.enemies) {
    if (spawn.type === 'boss' && room.bossConfig) {
      state.enemies.push(createBoss(room.bossConfig))
    } else {
      const newEnemies = createEnemy(spawn, room.width, levelIndex)
      state.enemies.push(...newEnemies)
    }
  }
  state.roomCleared = false
  state.doorOpen = false
}