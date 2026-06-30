/** GDD §3 / §4 — 王者萌斗 数值与风格（策划改表只改本文件） */

export const BASE_W = 1280
export const BASE_H = 720

export const ASSET_ROOT = '/assets/kingBaby'

export const COLORS = {
  primary: '#73C0F4',
  accent: '#F8BBD0',
  bg: '#E8F4FC',
  danger: '#FF8A80',
  success: '#81C784',
  ally: '#73C0F4',
  enemy: '#FF8A80',
  bush: '#A5D6A7',
} as const

export const MATCH = {
  maxDurationSec: 240,
  star3Sec: 90,
  star2Sec: 150,
  respawnSec: 5,
} as const

export const HERO_LIUBEI = {
  kind: 'hero_liubei' as const,
  name: '萌版刘备',
  emoji: '🤴',
  maxHp: 1200,
  radius: 36,
  moveSpeed: 220,
  atkDamage: 40,
  atkRange: 140,
  atkInterval: 0.55,
  skill1Damage: 120,
  skill1Radius: 160,
  skill1Cd: 3,
  ultDamage: 80,
  ultCd: 12,
}

export const ENEMY_XIAOBING = {
  kind: 'enemy_xiaobing' as const,
  name: '软萌小兵',
  emoji: '🐣',
  maxHp: 200,
  damage: 15,
  radius: 22,
  moveSpeed: 55,
  gold: 8,
  score: 10,
}

export const ENEMY_YUJI = {
  kind: 'enemy_yuji' as const,
  name: '萌版虞姬',
  emoji: '🏹',
  maxHp: 900,
  damage: 50,
  radius: 34,
  moveSpeed: 130,
  skillDamage: 90,
  skillCd: 5,
  atkRange: 200,
  atkInterval: 1.1,
  gold: 40,
  score: 80,
}

export const CRYSTAL = {
  kind: 'map_crystal' as const,
  maxHp: 2000,
  radius: 48,
}

export const ITEM_SHIELD = {
  kind: 'item_shield' as const,
  absorb: 300,
  duration: 15,
  emoji: '☁️',
}

export const LEVELS = [
  { id: 1, waves: 2, heroAi: false, aiMult: 0.85, shieldDrop: false, label: '萌星入门' },
  { id: 2, waves: 3, heroAi: true, aiMult: 1, shieldDrop: false, label: '虞姬来访' },
  { id: 3, waves: 4, heroAi: true, aiMult: 1.15, shieldDrop: true, label: '大招清线' },
  { id: 4, waves: 4, heroAi: true, aiMult: 1.25, shieldDrop: true, label: '峡谷进阶' },
  { id: 5, waves: 5, heroAi: true, aiMult: 1.35, shieldDrop: true, label: '双路压力' },
  { id: 6, waves: 5, heroAi: true, aiMult: 1.5, shieldDrop: true, label: '萌斗大师' },
] as const

/** 玩家侧 x 小，敌方侧 x 大 */
export const PLAYER_SPAWN = { x: 180, y: BASE_H / 2 }
export const ENEMY_HERO_SPAWN = { x: BASE_W - 220, y: BASE_H / 2 }
export const ALLY_CRYSTAL = { x: 72, y: BASE_H / 2 }
export const ENEMY_CRYSTAL = { x: BASE_W - 72, y: BASE_H / 2 }

export const MINION_LANES = [
  { y: BASE_H * 0.38, fromPlayer: true },
  { y: BASE_H * 0.62, fromPlayer: true },
] as const

export const BUSHES = [
  { x: 420, y: BASE_H * 0.35, w: 100, h: 70 },
  { x: 420, y: BASE_H * 0.58, w: 100, h: 70 },
  { x: BASE_W - 520, y: BASE_H * 0.35, w: 100, h: 70 },
  { x: BASE_W - 520, y: BASE_H * 0.58, w: 100, h: 70 },
] as const

export const WAVE_SPAWN_INTERVAL = 18