import { LevelConfig } from './types';

export const GAME_CONFIG = {
  WALL_HEIGHT: 3,
  CEILING_HEIGHT: 3,
  PLAYER_HEIGHT: 1.8,
  PLAYER_RADIUS: 0.35,
  MOVE_SPEED: 5,
  ROTATION_SPEED: 0.002,
  TOUCH_ROTATION_SENSITIVITY: 0.005,
  COLLISION_OFFSET: 0.1,
};

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    mazeSize: 8,
    cellSize: 2,
    keyCount: 1,
    trapCount: 0,
    timeLimit: 120,
    fogRadius: 20,
    hasFog: false,
  },
  {
    level: 2,
    mazeSize: 10,
    cellSize: 2,
    keyCount: 2,
    trapCount: 2,
    timeLimit: 100,
    fogRadius: 20,
    hasFog: false,
  },
  {
    level: 3,
    mazeSize: 12,
    cellSize: 1.8,
    keyCount: 3,
    trapCount: 4,
    timeLimit: 90,
    fogRadius: 8,
    hasFog: true,
  },
  {
    level: 4,
    mazeSize: 15,
    cellSize: 1.6,
    keyCount: 4,
    trapCount: 6,
    timeLimit: 80,
    fogRadius: 5,
    hasFog: true,
  },
  {
    level: 5,
    mazeSize: 18,
    cellSize: 1.5,
    keyCount: 5,
    trapCount: 8,
    timeLimit: 70,
    fogRadius: 4,
    hasFog: true,
  },
];

export const COLORS = {
  WALL: 0x6b7280,
  WALL_EDGE: 0x4b5563,
  FLOOR: 0x93c5fd,
  CEILING: 0xf3f4f6,
  KEY: 0xfbbf24,
  KEY_GLOW: 0xf59e0b,
  EXIT: 0x34d399,
  EXIT_GLOW: 0x10b981,
  TRAP_SLOW: 0xf97316,
  TRAP_FOG: 0x8b5cf6,
  TRAP_TIME: 0xef4444,
  PLAYER: 0x3b82f6,
  FOG: 0x1e1b4b,
};

export const UI_CONFIG = {
  MINIMAP_SIZE: 150,
  MINIMAP_PADDING: 10,
  MINIMAP_BORDER_WIDTH: 2,
  MINIMAP_BORDER_COLOR: '#ffffff',
  PLAYER_ICON_SIZE: 6,
  KEY_ICON_SIZE: 4,
  TRAP_ICON_SIZE: 4,
  EXIT_ICON_SIZE: 8,
};

export const SOUND_CONFIG = {
  VOLUME: 0.5,
  KEY_COLLECT: 0.7,
  TRAP_HIT: 0.5,
  LEVEL_COMPLETE: 0.8,
  GAME_OVER: 0.6,
};

export const STORAGE_KEYS = {
  HIGH_LEVEL: 'maze_explorer_high_level',
  BEST_TIME: 'maze_explorer_best_time',
  PERFECT_LEVELS: 'maze_explorer_perfect_levels',
  TOTAL_SCORE: 'maze_explorer_total_score',
};