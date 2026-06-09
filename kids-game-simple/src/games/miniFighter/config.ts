import type { GameConfig } from './types';

export const GAME_CONFIG: GameConfig = {
  PLAYER_SPEED: 3.5,
  ATTACK_RANGE: 1.8,
  ATTACK_WIDTH: 1.2,
  ATTACK_DAMAGE: 12,
  ATTACK_KNOCKBACK: 1.5,
  ATTACK_COOLDOWN: 400,
  ATTACK_DURATION: 250,
  BLOCK_DAMAGE_REDUCTION: 0.8,
  BLOCK_ENERGY_GAIN: 10,
  DODGE_DISTANCE: 3.0,
  DODGE_COOLDOWN: 1500,
  DODGE_DURATION: 300,
  DODGE_INVINCIBLE_DURATION: 300,
  ULTIMATE_DAMAGE: 35,
  ULTIMATE_RANGE: 3.5,
  ULTIMATE_KNOCKBACK: 3.0,
  ULTIMATE_ENERGY_COST: 100,
  ULTIMATE_DURATION: 400,
  ULTIMATE_COOLDOWN: 2000,
  STUN_DURATION: 100,
  STUN_ON_HIT: 200,
  ENERGY_PER_HIT: 15,
  ENERGY_PER_BLOCK: 10,
  MAX_ENERGY: 100,
  MAX_HP: 100,
  ARENA_SIZE: 12,
  ARENA_BOUNDARY_PADDING: 1.5,
  AI_REACTION_TIME: 800,
  AI_ATTACK_CHANCE: { easy: 0.3, normal: 0.5, hard: 0.7 },
  AI_BLOCK_CHANCE: { easy: 0, normal: 0.3, hard: 0.5 },
  AI_DODGE_CHANCE: { easy: 0, normal: 0.2, hard: 0.4 },
  AI_ULTIMATE_THRESHOLD: 0.7,
};

export const LEVEL_CONFIG = [
  { level: 1, difficulty: 'easy' as const, aiName: '新手机器人' },
  { level: 2, difficulty: 'easy' as const, aiName: '训练机器人' },
  { level: 3, difficulty: 'normal' as const, aiName: '战斗机器人' },
  { level: 4, difficulty: 'normal' as const, aiName: '精英机器人' },
  { level: 5, difficulty: 'hard' as const, aiName: '终极Boss' },
];

export const COLORS = {
  PLAYER: 0xff4444,
  AI: 0x4444ff,
  ARENA: 0x333333,
  ARENA_EDGE: 0x00ffff,
  HIT_EFFECT: 0xff0000,
  BLOCK_EFFECT: 0xffffff,
  ULTIMATE_EFFECT: 0xffd700,
  BACKGROUND: 0x1a1a2e,
};

export const INPUT_KEYS = {
  MOVE_FORWARD: ['KeyW', 'ArrowUp'],
  MOVE_BACKWARD: ['KeyS', 'ArrowDown'],
  MOVE_LEFT: ['KeyA', 'ArrowLeft'],
  MOVE_RIGHT: ['KeyD', 'ArrowRight'],
  ATTACK: ['KeyJ'],
  BLOCK: ['KeyK'],
  DODGE: ['KeyL'],
  ULTIMATE: ['Space'],
  RESET: ['KeyR'],
};