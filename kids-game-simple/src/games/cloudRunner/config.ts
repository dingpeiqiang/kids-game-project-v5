import type { DifficultyConfig } from './types';

export const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  LANE_WIDTH: 4,
  TRACK_WIDTH: 12,
  TRACK_HEIGHT: 0.5,
  PLAYER_WIDTH: 1.2,
  PLAYER_HEIGHT: 2.0,
  PLAYER_CROUCH_HEIGHT: 1.2,
  PLAYER_DEPTH: 0.8,
  GRAVITY: -0.08,
  JUMP_FORCE: 1.8,
  MOVE_SPEED: 0.15,
  MAX_VELOCITY: 0.2,
  FRICTION: 0.92,
  GROUND_Y: 0,
};

export const DIFFICULTY_LEVELS: Record<number, DifficultyConfig> = {
  1: {
    speedMultiplier: 1.0,
    obstacleSpawnRate: 0.008,
    obstacleDensity: 1,
    collectibleSpawnRate: 0.015,
    gapFrequency: 0,
  },
  2: {
    speedMultiplier: 1.1,
    obstacleSpawnRate: 0.01,
    obstacleDensity: 1,
    collectibleSpawnRate: 0.013,
    gapFrequency: 0.001,
  },
  3: {
    speedMultiplier: 1.2,
    obstacleSpawnRate: 0.012,
    obstacleDensity: 2,
    collectibleSpawnRate: 0.012,
    gapFrequency: 0.002,
  },
  4: {
    speedMultiplier: 1.35,
    obstacleSpawnRate: 0.015,
    obstacleDensity: 2,
    collectibleSpawnRate: 0.01,
    gapFrequency: 0.003,
  },
  5: {
    speedMultiplier: 1.5,
    obstacleSpawnRate: 0.018,
    obstacleDensity: 3,
    collectibleSpawnRate: 0.008,
    gapFrequency: 0.004,
  },
};

export const COLLECTIBLE_SCORES = {
  coin: 10,
  crystal: 30,
  shield: 0,
  slow: 0,
  double: 0,
};

export const SPEED_INCREMENT_DISTANCE = 500;

export const POWERUP_DURATIONS = {
  shield: 5000,
  double: 5000,
  slow: 3000,
};

export const COLORS = {
  track: 0xf5f5f5,
  trackLine: 0xcccccc,
  iceTrack: 0xa8d8ea,
  obstacle: 0xe74c3c,
  obstacleMoving: 0x9b59b6,
  obstaclePendulum: 0xf39c12,
  coin: 0xf1c40f,
  crystal: 0x9b59b6,
  shield: 0x3498db,
  slow: 0x27ae60,
  double: 0xe67e22,
  player: 0x3498db,
  playerCrouching: 0x2980b9,
  sky: 0x87ceeb,
  cloud: 0xffffff,
};

export const TRACK_SEGMENT_LENGTH = 10;

export const MAX_TRACK_SEGMENTS = 20;

export const OBSTACLE_TYPES = ['static', 'moving', 'pendulum', 'spike'] as const;

export const COLLECTIBLE_TYPES = ['coin', 'crystal', 'shield', 'slow', 'double'] as const;