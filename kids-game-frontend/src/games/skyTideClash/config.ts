import type { BulletTier, EnemyKind, PlayMode } from './types'

export const GAME_CONFIG = {
  storageKey: 'skyTideClash_stats_v1',
  worldHalfX: 14,
  worldHalfZ: 22,
  playerSpeed: 16,
  playerRadius: 0.55,
  playerMaxHp: 8,
  invulnAfterHit: 1.2,
  comboDecaySec: 2.4,
  maxBullets: 50,
  maxEnemies: 36,
  maxPickups: 12,
  maxExplosions: 30,
  clearScreenCooldown: 18,
  pickupLife: 12,
} as const

export const FIRE_CONFIG: Record<
  BulletTier,
  { interval: number; damage: number; speed: number; spread: number; count: number; pierce: number }
> = {
  1: { interval: 0.22, damage: 1, speed: 28, spread: 0, count: 1, pierce: 0 },
  2: { interval: 0.2, damage: 1, speed: 28, spread: 0.12, count: 2, pierce: 0 },
  3: { interval: 0.18, damage: 1, speed: 26, spread: 0.35, count: 5, pierce: 0 },
  4: { interval: 0.16, damage: 2, speed: 32, spread: 0.08, count: 1, pierce: 4 },
}

export const ENEMY_DEF: Record<
  Exclude<EnemyKind, 'meteor'>,
  { hp: number; speed: number; score: number; radius: number; fireInterval: number; bulletSpeed: number }
> = {
  grunt: { hp: 1, speed: 5.5, score: 80, radius: 0.45, fireInterval: 0, bulletSpeed: 0 },
  skimmer: { hp: 2, speed: 9, score: 120, radius: 0.4, fireInterval: 1.8, bulletSpeed: 14 },
  heavy: { hp: 6, speed: 3.2, score: 280, radius: 0.75, fireInterval: 2.2, bulletSpeed: 11 },
  boss: { hp: 80, speed: 2.4, score: 2500, radius: 1.4, fireInterval: 0.55, bulletSpeed: 16 },
}

export const METEOR = { hp: 2, speed: 7, score: 60, radius: 0.5 } as const

export interface WaveDef {
  id: number
  label: string
  duration: number
  spawnInterval: number
  weights: Partial<Record<EnemyKind, number>>
  meteorChance: number
  spawnBossAtEnd?: boolean
}

const CASUAL_WAVES: WaveDef[] = [
  { id: 1, label: '云端热身', duration: 22, spawnInterval: 1.1, weights: { grunt: 1 }, meteorChance: 0.05 },
  { id: 2, label: '小队俯冲', duration: 24, spawnInterval: 1, weights: { grunt: 0.85, skimmer: 0.15 }, meteorChance: 0.08 },
  { id: 3, label: '穿梭试探', duration: 26, spawnInterval: 0.95, weights: { grunt: 0.5, skimmer: 0.5 }, meteorChance: 0.1 },
  { id: 4, label: '混合空域', duration: 28, spawnInterval: 0.85, weights: { grunt: 0.35, skimmer: 0.4, heavy: 0.25 }, meteorChance: 0.12 },
  { id: 5, label: '重装来袭', duration: 30, spawnInterval: 0.75, weights: { grunt: 0.25, skimmer: 0.35, heavy: 0.4 }, meteorChance: 0.14 },
  { id: 6, label: '天际决战', duration: 45, spawnInterval: 0.65, weights: { grunt: 0.2, skimmer: 0.35, heavy: 0.35 }, meteorChance: 0.16, spawnBossAtEnd: true },
]

const COMPETE_WAVES: WaveDef[] = CASUAL_WAVES.map((w, i) => ({
  ...w,
  duration: w.duration * 0.88,
  spawnInterval: w.spawnInterval * 0.82,
  meteorChance: Math.min(0.22, w.meteorChance + 0.04),
  weights: Object.fromEntries(
    Object.entries(w.weights).map(([k, v]) => [k, (v as number) * (1 + i * 0.05)]),
  ) as WaveDef['weights'],
}))

export function getWaves(mode: PlayMode): WaveDef[] {
  return mode === 'compete' ? COMPETE_WAVES : CASUAL_WAVES
}

export function comboMultiplier(combo: number, mode: PlayMode): number {
  const base = 1 + Math.floor(combo / 5) * 0.15
  const cap = mode === 'compete' ? 3.2 : 2.6
  return Math.min(cap, base)
}

export const PICKUP_WEIGHTS: Array<{ kind: 'firepower' | 'shield' | 'heal' | 'slowMo'; w: number }> = [
  { kind: 'firepower', w: 0.38 },
  { kind: 'shield', w: 0.28 },
  { kind: 'heal', w: 0.22 },
  { kind: 'slowMo', w: 0.12 },
]

export const BUFF_DURATION = {
  firepower: 10,
  shield: 8,
  slowMo: 6,
  healAmount: 2,
} as const