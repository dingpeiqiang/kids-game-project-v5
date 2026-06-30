import type { Level } from './types'

export const GAME_CONFIG = {
  CANVAS_WIDTH: 480,
  CANVAS_HEIGHT: 320,
  LEFT_PANEL_WIDTH: 100,
  RIGHT_PANEL_WIDTH: 100,
  GRAVITY: 0.9,
  PLAYER_SPEED: 9,
  PLAYER_JUMP_FORCE: -17,
  PLAYER_WIDTH: 32,
  PLAYER_HEIGHT: 48,
  BULLET_SPEED: 14,
  BULLET_WIDTH: 12,
  BULLET_HEIGHT: 6,
  ENEMY_BULLET_SPEED: 5,
  SHOOT_COOLDOWN: 350,
  INVINCIBLE_DURATION: 60,
  PARTICLE_MAX: 150,
  BULLET_MAX: 200,
  COMBO_TIMEOUT: 2000,
  DOUBLE_JUMP_UNLOCK_LEVEL: 3,
  RAPID_FIRE_DURATION: 10000,
  SPREAD_SHOT_DURATION: 8000,
  SHIELD_DURATION: 5000,
  TRANSFORM_DURATION: 8000,
  SLIDE_DURATION: 420,
  SLIDE_SPEED: 14,
  MELEE_COOLDOWN: 450,
  MELEE_DAMAGE: 4,
  MELEE_RANGE: 52,
}

/** 站在主地面平台上的玩家 Y（与 level platforms y = CANVAS_HEIGHT - 40 对齐） */
export function getDefaultPlayerSpawnY(): number {
  return GAME_CONFIG.CANVAS_HEIGHT - 40 - GAME_CONFIG.PLAYER_HEIGHT
}

export const POWERUP_CONFIG = {
  HP: { icon: '❤️', color: '#ff4444', chance: 0.35 },
  MAX_HP: { icon: '💚', color: '#44ff44', chance: 0.15 },
  RAPID: { icon: '⚡', color: '#ffff44', chance: 0.22 },
  SPREAD: { icon: '💥', color: '#ff8800', chance: 0.18 },
  SHIELD: { icon: '🛡️', color: '#4488ff', chance: 0.15 },
  TRANSFORM: { icon: '⭐', color: '#FFD700', chance: 0.08 },
}

export const ENEMY_CONFIG = {
  NORMAL: {
    width: 28,
    height: 32,
    hp: 3,
    speed: 2.0,
    score: 100,
    color: '#ff6b6b',
    shootInterval: 1800,
  },
  ELITE: {
    width: 36,
    height: 40,
    hp: 6,
    speed: 2.8,
    score: 300,
    color: '#ffa502',
    shootInterval: 1200,
  },
  BOSS: {
    width: 100,
    height: 80,
    hp: 50,
    speed: 1.0,
    score: 5000,
    color: '#ff0066',
    shootInterval: 2000,
  },
}
