// src/types/index.ts

export enum Direction {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
}

export enum TileType {
  EMPTY = 0,
  BRICK = 1,
  STEEL = 2,
  WATER = 3,
  TREE = 4,
  ICE = 5,
  EAGLE = 6,
}

export enum EnemyType {
  BASIC = 'BASIC',
  FAST = 'FAST',
  ARMORED = 'ARMORED',
}

export enum PowerUpType {
  STAR = 'STAR',
  SHIELD = 'SHIELD',
  BOMB = 'BOMB',
  LIFE = 'LIFE',
  TIMER = 'TIMER',
}

export enum AIState {
  PATROL = 'PATROL',
  CHASE = 'CHASE',
  BASE_RUSH = 'BASE_RUSH',
}

// ── Value Objects ─────────────────────────────

export interface Vec2 {
  x: number;
  y: number;
}

// ── Enemy Configuration ───────────────────────

export interface EnemyConfig {
  speed: number;
  hp: number;
  fireRate: number; // ms between shots
  score: number;
}

// ── Level / Wave ──────────────────────────────

export interface WaveEntry {
  type: EnemyType;
  count: number;
}

export interface LevelConfig {
  grid: TileType[][];
  waves: WaveEntry[][];
  totalEnemies: number;
  powerEnemyEvery: number;
  spawnInterval: number; // frames between spawns
  maxOnScreen: number;
}

// ── Scene Transfer Data ────────────────────────

export interface GameInitData {
  level: number;
  lives: number;
  score: number;
}

export interface LevelCompleteData {
  level: number;
  score: number;
  lives: number;
  nextLevel: number;
}

export interface GameOverData {
  score: number;
}

// ── React / HUD State ─────────────────────────

export interface HUDState {
  score: number;
  highScore: number;
  lives: number;
  level: number;         // 0-based
  enemiesLeft: number;
  starLevel: number;         // 0-3
  shieldActive: boolean;
  frozen: boolean;
}

// ── Bullet Data ───────────────────────────────

export interface BulletData {
  isPlayer: boolean;
  direction: Direction;
}
