/** GDD §3 / §4 — 打了个龙 数值与风格（策划改表只改本文件） */

export const BASE_W = 400
export const BASE_H = 600

export const ASSET_ROOT = '/assets/beatDragon'

export const COLORS = {
  primary: '#58A6FF',
  accent: '#FFB86C',
  bg: '#F0F4FF',
  danger: '#F87171',
  success: '#4ADE80',
  hero: '#42A5F5',
  dragonNormal: '#7E57C2',
  dragonFire: '#EF5350',
  boxBuff: '#FFD600',
  bullet: '#E3F2FD',
} as const

export const HERO = {
  kind: 'hero_player' as const,
  name: '屠龙勇者',
  emoji: '🧙',
  maxHp: 5,
  fireRate: 1.2,
  damage: 8,
  radius: 28,
  yRatio: 0.88,
}

export const DRAGON_NORMAL = {
  kind: 'dragon_normal' as const,
  segments: 6,
  totalHp: 620,
  segmentHp: 620 / 6,
  segmentWidth: 58,
  segmentHeight: 36,
  yRatio: 0.22,
  bulletInterval: 0.8,
  color: COLORS.dragonNormal,
}

export const DRAGON_FIRE = {
  kind: 'dragon_fire' as const,
  segments: 8,
  totalHp: 950,
  segmentHp: 950 / 8,
  segmentWidth: 56,
  segmentHeight: 34,
  yRatio: 0.2,
  bulletInterval: 0.65,
  color: COLORS.dragonFire,
}

export const BULLET_PLAYER = {
  speed: 6,
  radius: 5,
}

export const BULLET_ENEMY = {
  speed: 3.2,
  radius: 8,
  damage: 1,
}

/** 每 N 段龙身含一个宝箱段 */
export const BOX_EVERY_SEGMENTS = 2

export const BUFF_OPTIONS = [
  { id: 'pierce', name: '穿透弹', emoji: '💥', desc: '子弹可穿透 2 个目标' },
  { id: 'multi', name: '多重射击', emoji: '🔫', desc: '每次发射 3 发' },
  { id: 'atk', name: '攻击强化', emoji: '⚔️', desc: '伤害 +40%' },
  { id: 'rate', name: '攻速提升', emoji: '⚡', desc: '射速 +35%' },
  { id: 'heal', name: '生命恢复', emoji: '❤️', desc: '回复 2 点生命' },
] as const

export type BuffId = (typeof BUFF_OPTIONS)[number]['id']

export const WAVES = [
  { id: 1, dragon: 'dragon_normal' as const, label: '普通长龙', guideBuff: true },
  { id: 2, dragon: 'dragon_normal' as const, label: '分支来袭', extraSegments: 1 },
  { id: 3, dragon: 'dragon_fire' as const, label: '烈焰巨龙', boss: true },
] as const

export const ENDLESS_HP_MULT = 1.15