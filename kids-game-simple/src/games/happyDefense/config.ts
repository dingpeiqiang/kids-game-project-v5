import type { BuffKind, CellKind, EnemyKind, TowerKind } from './types'

export const GAME_CONFIG = {
  gridW: 12,
  gridH: 12,
  cellSize: 1.35,
  baseHp: 20,
  startGold: 280,
  sellRefundRatio: 0.65,
  totalWaves: 6,
  comboWindowSec: 2.2,
  comboScoreMulCap: 3,
  maxEnemies: 80,
  maxProjectiles: 50,
  maxFloats: 30,
} as const

/** 地图：0=可建造 1=路径 2=障碍 3=基地 */
export const MAP_LAYOUT: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 2, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 2, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]

export const PATH_WAYPOINTS: { gx: number; gz: number }[] = [
  { gx: 0, gz: 1 },
  { gx: 3, gz: 1 },
  { gx: 3, gz: 4 },
  { gx: 7, gz: 4 },
  { gx: 7, gz: 6 },
  { gx: 11, gz: 6 },
  { gx: 11, gz: 7 },
]

export const TOWER_DEFS: Record<
  TowerKind,
  {
    name: string
    emoji: string
    color: string
    cost: number
    upgradeCost: [number, number]
    range: number
    fireRate: number
    damage: number
    splashRadius: number
    slowDuration: number
    freezeDuration: number
    chainCount: number
    pierce: number
  }
> = {
  popcorn: {
    name: '爆米花塔',
    emoji: '\u{1F37F}',
    color: '#FFB347',
    cost: 60,
    upgradeCost: [45, 70],
    range: 3.2,
    fireRate: 0.35,
    damage: 14,
    splashRadius: 1.4,
    slowDuration: 0,
    freezeDuration: 0,
    chainCount: 0,
    pierce: 0,
  },
  bubble: {
    name: '冰霜泡泡塔',
    emoji: '\u{1F9CA}',
    color: '#7EC8E3',
    cost: 75,
    upgradeCost: [55, 85],
    range: 3.5,
    fireRate: 0.55,
    damage: 10,
    splashRadius: 0,
    slowDuration: 2.5,
    freezeDuration: 0.8,
    chainCount: 0,
    pierce: 0,
  },
  lightning: {
    name: '雷霆闪电塔',
    emoji: '\u26A1',
    color: '#FFE066',
    cost: 110,
    upgradeCost: [80, 120],
    range: 3.8,
    fireRate: 0.9,
    damage: 22,
    splashRadius: 0,
    slowDuration: 0,
    freezeDuration: 0,
    chainCount: 4,
    pierce: 0,
  },
  pierce: {
    name: '超能穿刺塔',
    emoji: '\u{1F52A}',
    color: '#B388FF',
    cost: 95,
    upgradeCost: [70, 105],
    range: 4.2,
    fireRate: 0.75,
    damage: 38,
    splashRadius: 0,
    slowDuration: 0,
    freezeDuration: 0,
    chainCount: 0,
    pierce: 3,
  },
}

export const ENEMY_DEFS: Record<
  EnemyKind,
  { name: string; emoji: string; hp: number; speed: number; reward: number; score: number; leakDamage: number }
> = {
  grunt: { name: '呆萌小怪', emoji: '\u{1F47B}', hp: 28, speed: 1.1, reward: 8, score: 10, leakDamage: 1 },
  flyer: { name: '灵动飞怪', emoji: '\u{1F54A}\uFE0F', hp: 22, speed: 1.85, reward: 10, score: 14, leakDamage: 1 },
  tank: { name: '重装憨憨', emoji: '\u{1F9F8}', hp: 120, speed: 0.65, reward: 22, score: 35, leakDamage: 2 },
  boss: { name: '波次BOSS', emoji: '\u{1F47E}', hp: 520, speed: 0.5, reward: 120, score: 200, leakDamage: 5 },
}

export interface WaveSpec {
  id: number
  label: string
  spawnInterval: number
  groups: { kind: EnemyKind; count: number }[]
}

export const WAVES: WaveSpec[] = [
  {
    id: 1,
    label: '新手解压期',
    spawnInterval: 0.85,
    groups: [{ kind: 'grunt', count: 12 }],
  },
  {
    id: 2,
    label: '轻松刷怪期',
    spawnInterval: 0.75,
    groups: [
      { kind: 'grunt', count: 14 },
      { kind: 'flyer', count: 4 },
    ],
  },
  {
    id: 3,
    label: '节奏提升期',
    spawnInterval: 0.65,
    groups: [
      { kind: 'grunt', count: 16 },
      { kind: 'flyer', count: 8 },
      { kind: 'tank', count: 2 },
    ],
  },
  {
    id: 4,
    label: '策略入门期',
    spawnInterval: 0.58,
    groups: [
      { kind: 'grunt', count: 18 },
      { kind: 'flyer', count: 10 },
      { kind: 'tank', count: 4 },
    ],
  },
  {
    id: 5,
    label: '竞技挑战期',
    spawnInterval: 0.5,
    groups: [
      { kind: 'grunt', count: 22 },
      { kind: 'flyer', count: 14 },
      { kind: 'tank', count: 6 },
    ],
  },
  {
    id: 6,
    label: '极限竞速期',
    spawnInterval: 0.42,
    groups: [
      { kind: 'grunt', count: 24 },
      { kind: 'flyer', count: 16 },
      { kind: 'tank', count: 8 },
      { kind: 'boss', count: 1 },
    ],
  },
]

export const BUFF_OPTIONS: { kind: BuffKind; label: string; duration: number }[] = [
  { kind: 'clearScreen', label: '清屏大招', duration: 0 },
  { kind: 'doubleDamage', label: '火力翻倍', duration: 12 },
  { kind: 'goldRain', label: '金币雨', duration: 0 },
  { kind: 'slowAll', label: '全场减速', duration: 10 },
]

export function cellKindAt(gx: number, gz: number): CellKind {
  if (gx < 0 || gz < 0 || gx >= GAME_CONFIG.gridW || gz >= GAME_CONFIG.gridH) return 'block'
  const v = MAP_LAYOUT[gz]![gx]!
  if (v === 1) return 'path'
  if (v === 2) return 'block'
  if (v === 3) return 'base'
  return 'build'
}

export function gridToWorld(gx: number, gz: number): { x: number; z: number } {
  const cs = GAME_CONFIG.cellSize
  const ox = -(GAME_CONFIG.gridW * cs) / 2 + cs / 2
  const oz = -(GAME_CONFIG.gridH * cs) / 2 + cs / 2
  return { x: ox + gx * cs, z: oz + gz * cs }
}

export function worldToGrid(x: number, z: number): { gx: number; gz: number } | null {
  const cs = GAME_CONFIG.cellSize
  const ox = -(GAME_CONFIG.gridW * cs) / 2 + cs / 2
  const oz = -(GAME_CONFIG.gridH * cs) / 2 + cs / 2
  const gx = Math.round((x - ox) / cs)
  const gz = Math.round((z - oz) / cs)
  if (gx < 0 || gz < 0 || gx >= GAME_CONFIG.gridW || gz >= GAME_CONFIG.gridH) return null
  return { gx, gz }
}