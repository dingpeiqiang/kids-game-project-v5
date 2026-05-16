import type { TowerType, GridPoint } from './types'

export const W = 400
export const H = 600
export const GRID = 10
export const CELL = 40
export const HUD_H = 60
export const PATH_COLOR = 'rgba(100, 100, 130, 0.25)'
export const MAX_COMBO_DISPLAY = 20
export const WAVE_INTERVAL_BASE = 300

export const INFINITE_WAVE_CONFIG = {
  baseEnemyCount: 4,
  enemyGrowthRate: 0.6,
  maxEnemyCount: 28,
  baseHp: 10,
  hpGrowthRate: 0.08,
  baseSpeed: 0.08575,
  speedGrowthRate: 0.001715,
  maxSpeedMultiplier: 1.8,
  bossInterval: 5,
  specialEnemyUnlock: 12,
  eliteEnemyUnlock: 25,
}

export const PATH_POINTS: GridPoint[] = [
  { gx: -1, gy: 1 },
  { gx: 3, gy: 1 },
  { gx: 3, gy: 3 },
  { gx: 7, gy: 3 },
  { gx: 7, gy: 5 },
  { gx: 5, gy: 5 },
  { gx: 5, gy: 7 },
  { gx: 9, gy: 7 },
  { gx: 9, gy: 9 },
]

export const TOWER_TYPES: TowerType[] = [
  { id: 'laser', name: '激光塔', cost: 50, damage: 0.8, range: 2.5, fireRate: 140, color: '#00E5FF', bulletColor: '#00E5FF', bulletSpeed: 9, icon: '⚡' },
  { id: 'cannon', name: '火炮塔', cost: 80, damage: 2.5, range: 2.0, fireRate: 260, color: '#FF6B6B', bulletColor: '#FF6B6B', bulletSpeed: 5, icon: '🔥', aoe: 45 },
  { id: 'ice', name: '冰冻塔', cost: 60, damage: 0.3, range: 2.3, fireRate: 200, color: '#70A1FF', bulletColor: '#70A1FF', bulletSpeed: 7, icon: '❄️', slow: 0.4, slowDur: 150 },
  { id: 'plasma', name: '等离子塔', cost: 100, damage: 1.8, range: 2.8, fireRate: 180, color: '#9C27B0', bulletColor: '#9C27B0', bulletSpeed: 8, icon: '💜', piercing: true },
]

export const SPECIAL_SKILL_MAX_CHARGE = 80

export const powerupIcons: Record<string, string> = {
  'gold': '💰',
  'freeze': '❄️',
  'damage_boost': '⚔️',
  'nuke': '☢️'
}

export const COLORS = {
  gold: '#FFD700',
  health: '#2ECC71',
  healthLow: '#E74C3C',
  combo: ['#FFD700', '#FFA502', '#FF6B6B', '#FF4757'],
  wave: '#FFD700',
  tower: {
    laser: '#00E5FF',
    cannon: '#FF6B6B',
    ice: '#70A1FF',
    plasma: '#9C27B0',
  },
  background: {
    dark: '#0a0a1a',
    medium: '#0d1b2a',
    light: '#1a1a2e',
  },
}
