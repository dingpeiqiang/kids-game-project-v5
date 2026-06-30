import type { BulletTier, EnemyKind, PickupKind, PlayMode } from './types'

export const GAME_CONFIG = {
  arenaHalfW: 9,
  arenaHalfD: 14,
  playerSpeed: 11,
  playerMaxHp: 8,
  playerHitRadius: 0.55,
  bulletHitRadius: 0.35,
  enemyHitRadius: 0.65,
  pickupRadius: 0.7,
  maxPlayerBullets: 50,
  maxEnemyBullets: 50,
  maxEnemies: 45,
  maxPickups: 20,
  comboWindowSec: 2.4,
  comboMulCap: 4,
  clearScreenCooldown: 14,
  clearScreenDuration: 0.35,
  totalWaves: 6,
  fireTierDuration: 12,
  shieldDuration: 8,
  slowMoDuration: 6,
} as const

export const BULLET_TIER_DEFS: Record<
  BulletTier,
  { fireRate: number; damage: number; pierce: number; spread: number; speed: number }
> = {
  1: { fireRate: 0.14, damage: 12, pierce: 0, spread: 0, speed: 22 },
  2: { fireRate: 0.12, damage: 11, pierce: 0, spread: 0.35, speed: 22 },
  3: { fireRate: 0.16, damage: 9, pierce: 0, spread: 0.55, speed: 20 },
  4: { fireRate: 0.22, damage: 28, pierce: 4, spread: 0, speed: 26 },
}

export const ENEMY_DEFS: Record<
  EnemyKind,
  {
    hp: number
    speed: number
    score: number
    shootInterval: number
    bulletSpeed: number
    color: string
    scale: number
  }
> = {
  grunt: { hp: 18, speed: 3.2, score: 80, shootInterval: 0, bulletSpeed: 0, color: '#7EC8E3', scale: 0.75 },
  dart: { hp: 28, speed: 5.5, score: 120, shootInterval: 0, bulletSpeed: 0, color: '#B388FF', scale: 0.7 },
  tank: { hp: 95, speed: 1.8, score: 220, shootInterval: 2.2, bulletSpeed: 9, color: '#FFB74D', scale: 1.15 },
  boss: { hp: 680, speed: 2.4, score: 2500, shootInterval: 0.85, bulletSpeed: 11, color: '#FF6B6B', scale: 2.2 },
}

export const PICKUP_DEFS: Record<PickupKind, { label: string; color: string; weight: number }> = {
  fireUp: { label: '火力+', color: '#FFD93D', weight: 3 },
  shield: { label: '护盾', color: '#4ECDC4', weight: 2 },
  heal: { label: '回血', color: '#6BCB77', weight: 2 },
  slowMo: { label: '缓速', color: '#9B59B6', weight: 2 },
}

export interface WaveSpec {
  groups: { kind: EnemyKind; count: number }[]
  spawnInterval: number
  meteorChance: number
}

const CASUAL_WAVES: WaveSpec[] = [
  { groups: [{ kind: 'grunt', count: 10 }], spawnInterval: 0.55, meteorChance: 0 },
  { groups: [{ kind: 'grunt', count: 14 }], spawnInterval: 0.5, meteorChance: 0.02 },
  { groups: [{ kind: 'grunt', count: 8 }, { kind: 'dart', count: 6 }], spawnInterval: 0.48, meteorChance: 0.04 },
  { groups: [{ kind: 'grunt', count: 10 }, { kind: 'dart', count: 8 }, { kind: 'tank', count: 2 }], spawnInterval: 0.45, meteorChance: 0.05 },
  { groups: [{ kind: 'dart', count: 12 }, { kind: 'tank', count: 5 }], spawnInterval: 0.4, meteorChance: 0.06 },
  { groups: [{ kind: 'grunt', count: 16 }, { kind: 'dart', count: 10 }, { kind: 'tank', count: 6 }], spawnInterval: 0.38, meteorChance: 0.08 },
]

const COMPETE_WAVES: WaveSpec[] = [
  { groups: [{ kind: 'grunt', count: 12 }], spawnInterval: 0.45, meteorChance: 0.02 },
  { groups: [{ kind: 'grunt', count: 16 }], spawnInterval: 0.42, meteorChance: 0.04 },
  { groups: [{ kind: 'grunt', count: 10 }, { kind: 'dart', count: 8 }], spawnInterval: 0.38, meteorChance: 0.06 },
  { groups: [{ kind: 'grunt', count: 12 }, { kind: 'dart', count: 10 }, { kind: 'tank', count: 3 }], spawnInterval: 0.35, meteorChance: 0.08 },
  { groups: [{ kind: 'dart', count: 14 }, { kind: 'tank', count: 7 }], spawnInterval: 0.32, meteorChance: 0.1 },
  { groups: [{ kind: 'grunt', count: 18 }, { kind: 'dart', count: 12 }, { kind: 'tank', count: 8 }], spawnInterval: 0.3, meteorChance: 0.12 },
]

export function wavesForMode(mode: PlayMode): WaveSpec[] {
  return mode === 'compete' ? COMPETE_WAVES : CASUAL_WAVES
}

export function modeSpawnMul(mode: PlayMode): number {
  return mode === 'compete' ? 1.25 : 1
}

export function modeComboMul(mode: PlayMode): number {
  return mode === 'compete' ? 1.35 : 1
}

export function clampArena(x: number, z: number): { x: number; z: number } {
  return {
    x: Math.max(-GAME_CONFIG.arenaHalfW, Math.min(GAME_CONFIG.arenaHalfW, x)),
    z: Math.max(-GAME_CONFIG.arenaHalfD + 2, Math.min(GAME_CONFIG.arenaHalfD - 1, z)),
  }
}

export function pickRandomPickup(): PickupKind {
  const entries = Object.entries(PICKUP_DEFS) as [PickupKind, (typeof PICKUP_DEFS)[PickupKind]][]
  const total = entries.reduce((s, [, d]) => s + d.weight, 0)
  let r = Math.random() * total
  for (const [k, d] of entries) {
    r -= d.weight
    if (r <= 0) return k
  }
  return 'fireUp'
}