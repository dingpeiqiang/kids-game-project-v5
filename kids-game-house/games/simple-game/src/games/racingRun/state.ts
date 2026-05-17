import type { Obstacle, Coin, Powerup, Particle, FloatText } from './types';
import { LANES } from './config';

export interface GameState {
  // 玩家状态
  currentLane: number;
  targetX: number;
  playerX: number;
  playerW: number;
  playerH: number;

  // 游戏状态
  gameSpeed: number;
  speedMultiplier: number;
  score: number;
  distance: number;
  coinsCollected: number;
  combo: number;
  invincible: number;
  gameEnded: boolean;
  shakeFrames: number;
  frameCount: number;

  // 道具计时器
  boostTimer: number;
  shieldTimer: number;
  magnetTimer: number;
  doubleTimer: number;

  // 游戏元素
  roadLines: Array<{ y: number }>;
  sideObjs: Array<{ y: number; side: number; type: string }>;
  obstacles: Obstacle[];
  coins: Coin[];
  powerups: Powerup[];
  particles: Particle[];
  floatTexts: FloatText[];

  // 生成计时器
  lastObsTime: number;
  lastCoinTime: number;
  lastPowerupTime: number;
}

export function createInitialState(): GameState {
  return {
    // 玩家状态
    currentLane: 1,
    targetX: LANES[1],
    playerX: LANES[1],
    playerW: 40,
    playerH: 60,

    // 游戏状态
    gameSpeed: 3,
    speedMultiplier: 1,
    score: 0,
    distance: 0,
    coinsCollected: 0,
    combo: 0,
    invincible: 0,
    gameEnded: false,
    shakeFrames: 0,
    frameCount: 0,

    // 道具计时器
    boostTimer: 0,
    shieldTimer: 0,
    magnetTimer: 0,
    doubleTimer: 0,

    // 游戏元素
    roadLines: Array.from({ length: 8 }, (_, i) => ({ y: i * 100 })),
    sideObjs: Array.from({ length: 6 }, (_, i) => ({
      y: i * 120,
      side: i % 2,
      type: Math.random() > 0.5 ? '🌲' : '🏠',
    })),
    obstacles: [],
    coins: [],
    powerups: [],
    particles: [],
    floatTexts: [],

    // 生成计时器
    lastObsTime: 0,
    lastCoinTime: 0,
    lastPowerupTime: 0,
  };
}
