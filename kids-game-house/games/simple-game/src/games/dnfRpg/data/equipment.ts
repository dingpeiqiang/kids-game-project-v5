import type { Equipment, EquipmentQuality, EquipmentSlot } from '../types'

interface EquipGen {
  name: string
  quality: EquipmentQuality
  slot: EquipmentSlot
  attackBonus: number
  defenseBonus: number
  speedBonus: number
  mpBonus: number
  hpBonus: number
  icon: string
  level: number
  description: string
  setBonus?: string
}

const EQUIPMENT_TABLE: EquipGen[] = [
  // ========== 白色 普通 ==========
  { name: '生锈的铁剑', quality: 'white', slot: 'weapon', attackBonus: 2, defenseBonus: 0, speedBonus: 0, mpBonus: 0, hpBonus: 0, icon: '🗡', level: 1, description: '已生锈的铁剑' },
  { name: '旧布甲', quality: 'white', slot: 'armor', attackBonus: 0, defenseBonus: 2, speedBonus: 0, mpBonus: 0, hpBonus: 5, icon: '👕', level: 1, description: '破旧的布甲' },
  { name: '木制项链', quality: 'white', slot: 'accessory', attackBonus: 0, defenseBonus: 0, speedBonus: 1, mpBonus: 5, hpBonus: 0, icon: '📿', level: 1, description: '简单木制项链' },

  // ========== 蓝色 高级 ==========
  { name: '精铁长剑', quality: 'blue', slot: 'weapon', attackBonus: 6, defenseBonus: 0, speedBonus: 1, mpBonus: 0, hpBonus: 0, icon: '⚔', level: 5, description: '精铁打造的长剑' },
  { name: '硬皮甲', quality: 'blue', slot: 'armor', attackBonus: 0, defenseBonus: 5, speedBonus: 1, mpBonus: 0, hpBonus: 15, icon: '🧥', level: 5, description: '坚韧的皮甲' },
  { name: '青铜戒指', quality: 'blue', slot: 'accessory', attackBonus: 2, defenseBonus: 1, speedBonus: 1, mpBonus: 10, hpBonus: 10, icon: '💍', level: 5, description: '青铜打造的戒指' },

  // ========== 紫色 稀有 ==========
  { name: '流光星陨刀', quality: 'purple', slot: 'weapon', attackBonus: 14, defenseBonus: 0, speedBonus: 3, mpBonus: 5, hpBonus: 0, icon: '🌠', level: 10, description: '带有星辰之力的太刀' },
  { name: '鳞岩甲', quality: 'purple', slot: 'armor', attackBonus: 2, defenseBonus: 12, speedBonus: 1, mpBonus: 5, hpBonus: 30, icon: '🦴', level: 10, description: '用鳞岩制成的重甲' },
  { name: '紫金护符', quality: 'purple', slot: 'accessory', attackBonus: 4, defenseBonus: 3, speedBonus: 2, mpBonus: 20, hpBonus: 20, icon: '🔰', level: 10, description: '紫色秘法护符' },

  // ========== 粉色 神器 ==========
  { name: '魔剑-阿波菲斯', quality: 'pink', slot: 'weapon', attackBonus: 28, defenseBonus: 0, speedBonus: 5, mpBonus: 10, hpBonus: 0, icon: '💜', level: 15, description: '蕴含黑暗力量的魔剑', setBonus: '暗黑之力' },
  { name: '传承:神圣斗篷', quality: 'pink', slot: 'armor', attackBonus: 5, defenseBonus: 20, speedBonus: 3, mpBonus: 10, hpBonus: 50, icon: '👑', level: 15, description: '传承自古代王国的斗篷', setBonus: '传承之力' },
  { name: '王者之星', quality: 'pink', slot: 'accessory', attackBonus: 8, defenseBonus: 5, speedBonus: 4, mpBonus: 30, hpBonus: 30, icon: '⭐', level: 15, description: '王者之力的证明', setBonus: '王者意志' },

  // ========== 史诗 ==========
  { name: '荒古遗尘巨剑', quality: 'epic', slot: 'weapon', attackBonus: 45, defenseBonus: 0, speedBonus: 2, mpBonus: 20, hpBonus: 50, icon: '🔥', level: 20, description: '远古巨人的遗物武器' },
  { name: '超大陆-瓦巴纳米', quality: 'epic', slot: 'armor', attackBonus: 10, defenseBonus: 35, speedBonus: 5, mpBonus: 20, hpBonus: 80, icon: '🌍', level: 20, description: '拥有超大陆意志的铠甲', setBonus: '超大陆意志' },
  { name: '罗塞塔石碑', quality: 'epic', slot: 'accessory', attackBonus: 12, defenseBonus: 10, speedBonus: 5, mpBonus: 50, hpBonus: 50, icon: '📜', level: 20, description: '远古文明的智慧结晶', setBonus: '远古智慧' },
]

const QUALITY_WEIGHTS: Record<EquipmentQuality, number> = {
  white: 0.4,
  blue: 0.3,
  purple: 0.2,
  pink: 0.08,
  epic: 0.02,
}

let equipIdCounter = 0

export function getRandomEquipment(minLevel: number = 1): Equipment {
  const rand = Math.random()
  let cumulative = 0
  let selectedQuality: EquipmentQuality = 'white'

  for (const [quality, weight] of Object.entries(QUALITY_WEIGHTS)) {
    cumulative += weight
    if (rand <= cumulative) {
      selectedQuality = quality as EquipmentQuality
      break
    }
  }

  const pool = EQUIPMENT_TABLE.filter(e => e.quality === selectedQuality && e.level >= minLevel)
  const available = pool.length > 0 ? pool : EQUIPMENT_TABLE.filter(e => e.quality === selectedQuality)
  const template = available[Math.floor(Math.random() * available.length)]

  equipIdCounter++
  return {
    id: `equip_${equipIdCounter}_${Date.now()}`,
    name: template.name,
    quality: template.quality,
    slot: template.slot,
    attackBonus: template.attackBonus,
    defenseBonus: template.defenseBonus,
    speedBonus: template.speedBonus,
    mpBonus: template.mpBonus,
    hpBonus: template.hpBonus,
    icon: template.icon,
    level: template.level,
    enhanceLevel: 0,
    setBonus: template.setBonus,
    description: template.description,
  }
}

export function getEquipmentByLevel(level: number): Equipment {
  const quality = getEquipmentDropQuality(level)
  const pool = EQUIPMENT_TABLE.filter(e => e.quality === quality && e.level <= level + 2)
  if (pool.length === 0) return getRandomEquipment(1)
  const template = pool[Math.floor(Math.random() * pool.length)]
  equipIdCounter++
  return {
    id: `equip_${equipIdCounter}_${Date.now()}`,
    name: template.name,
    quality: template.quality,
    slot: template.slot,
    attackBonus: template.attackBonus,
    defenseBonus: template.defenseBonus,
    speedBonus: template.speedBonus,
    mpBonus: template.mpBonus,
    hpBonus: template.hpBonus,
    icon: template.icon,
    level: template.level,
    enhanceLevel: 0,
    setBonus: template.setBonus,
    description: template.description,
  }
}

export function getEquipmentDropQuality(level: number): EquipmentQuality {
  const roll = Math.random()
  if (level >= 6 && roll < 0.03) return 'epic'
  if (level >= 4 && roll < 0.08) return 'pink'
  if (level >= 3 && roll < 0.2) return 'purple'
  if (level >= 2 && roll < 0.4) return 'blue'
  return 'white'
}

// 装备强化效果
export function getEnhancedStats(base: Equipment): { attackBonus: number; defenseBonus: number } {
  const enhanceBonus = base.enhanceLevel * 0.1
  return {
    attackBonus: Math.round(base.attackBonus * (1 + enhanceBonus)),
    defenseBonus: Math.round(base.defenseBonus * (1 + enhanceBonus)),
  }
}