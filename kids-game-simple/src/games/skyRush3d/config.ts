import type { BulletTier, EnemyKind, PlayMode } from './types'

export const GAME_CONFIG = {
  arenaHalfW: 14,
  arenaHalfZ: 22,
  playerY: 0,
  playerSpeed: 18,
  playerRadius: 0.55,
  playerMaxHp: 8,
  invulnAfterHit: 1.2,
  comboDecaySec: 2.2,
  clearScreenCooldown: 14,
  bulletCap: 48,
  enemyCap: 36,
  particleCap: 120,
} as const

export const BULLET_TIER_CONFIG: Record<
  BulletTier,
  { interval: number; damage: number; speed: number; pierce: number; spread: number; count: number }
> = {
  1: { interval: 0.22, damage: 1, speed: 28, pierce: 0, spread: 0, count: 1 },
  2: { interval: 0.2, damage: 1, speed: 28, pierce: 0, spread: 0.08, count: 2 },
  3: { interval: 0.18, damage: 1, speed: 26, pierce: 0, spread: 0.35, count: 5 },
  4: { interval: 0.16, damage: 2, speed: 32, pierce: 4, spread: 0.12, count: 3 },
}

export const ENEMY_DEF: Record<
  Exclude<EnemyKind, 'meteor'>,
  { hp: number; speed: number; score: number; radius: number; canShoot: boolean; fireInterval: number }
> = {
  grunt: { hp: 1, speed: 4.5, score: 80, radius: 0.45, canShoot: false, fireInterval: 99 },
  dart: { hp: 2, speed: 7.5, score: 120, radius: 0.4, canShoot: false, fireInterval: 99 },
  tank: { hp: 8, speed: 2.2, score: 280, radius: 0.75, canShoot: true, fireInterval: 2.4 },
  boss: { hp: 120, speed: 1.8, score: 5000, radius: 1.6, canShoot: true, fireInterval: 0.55 },
}

export const METEOR_DEF = { hp: 2, speed: 5, score: 60, radius: 0.5 }

export interface WaveSpec {
  id: number
  label: string
  duration: number
  spawnInterval: number
  weights: Partial<Record<EnemyKind, number>>
  meteorChance: number
}

const CASUAL_WAVES: WaveSpec[] = [
  { id: 1, label: '云端热身', duration: 22, spawnInterval: 1.1, weights: { grunt: 1 }, meteorChance: 0.05 },
  { id: 2, label: '萌怪集群', duration: 24, spawnInterval: 0.95, weights: { grunt: 0.85, dart: 0.15 }, meteorChance: 0.08 },
  { id: 3, label: '穿梭试炼', duration: 26, spawnInterval: 0.85, weights: { grunt: 0.5, dart: 0.4, tank: 0.1 }, meteorChance: 0.1 },
  { id: 4, label: '弹幕初现', duration: 28, spawnInterval: 0.75, weights: { grunt: 0.35, dart: 0.35, tank: 0.3 }, meteorChance: 0.12 },
  { id: 5, label: '重装来袭', duration: 30, spawnInterval: 0.65, weights: { dart: 0.25, tank: 0.55, grunt: 0.2 }, meteorChance: 0.14 },
  { id: 6, label: '天际决战', duration: 32, spawnInterval: 0.55, weights: { grunt: 0.2, dart: 0.3, tank: 0.35, boss: 0.15 }, meteorChance: 0.16 },
]

const COMPETE_WAVES: WaveSpec[] = CASUAL_WAVES.map((w, i) => ({
  ...w,
  duration: w.duration - 2,
  spawnInterval: Math.max(0.4, w.spawnInterval - 0.08),
  meteorChance: w.meteorChance + 0.04,
  weights: i >= 4 ? { ...w.weights, tank: (w.weights.tank ?? 0) + 0.1 } : w.weights,
}))

export function getWavesForMode(mode: PlayMode): WaveSpec[] {
  return mode === 'compete' ? COMPETE_WAVES : CASUAL_WAVES
}

export const MODE_MULTIPLIER: Record<PlayMode, { score: number; enemySpeed: number; spawn: number }> = {
  casual: { score: 1, enemySpeed: 1, spawn: 1 },
  compete: { score: 1.25, enemySpeed: 1.15, spawn: 0.88 },
}

export const POWERUP_WEIGHTS: Record<import('./types').PowerUpKind, number> = {
  firepower: 0.35,
  shield: 0.25,
  heal: 0.25,
  slowMo: 0.15,
}

export const STORAGE_KEY = 'skyRush3d_stats_v1'