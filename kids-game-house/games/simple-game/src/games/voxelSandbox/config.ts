import { BlockType } from './types';

export const BLOCK_SIZE = 1;
export const CHUNK_SIZE = 16;
export const VIEW_DISTANCE = 8;
export const RENDER_DISTANCE = 6;

export const PLAYER_HEIGHT = 1.8;
export const PLAYER_WIDTH = 0.6;
export const PLAYER_SPEED = 5;
export const PLAYER_SPRINT_SPEED = 8;
export const JUMP_FORCE = 8;
export const GRAVITY = 20;
export const FRICTION = 8;

export const GAME_TICK = 1000;
export const DAY_NIGHT_CYCLE = 60000;
export const DAY_START = 0;
export const NIGHT_START = DAY_NIGHT_CYCLE / 2;

export const WORLD_SEED = Math.floor(Math.random() * 1000000);

export const BLOCK_COLORS: Record<BlockType, { top: number; side: number; bottom: number }> = {
  grass: { top: 0x7cb342, side: 0x8bc34a, bottom: 0x689f38 },
  dirt: { top: 0x8d6e63, side: 0x8d6e63, bottom: 0x8d6e63 },
  stone: { top: 0x757575, side: 0x757575, bottom: 0x757575 },
  wood: { top: 0x8d5524, side: 0xa16207, bottom: 0x8d5524 },
  sand: { top: 0xf4a460, side: 0xf4a460, bottom: 0xdaa520 },
  snow: { top: 0xffffff, side: 0xf5f5f5, bottom: 0xe0e0e0 },
};

export const BIOME_THRESHOLDS = {
  snow: 0.8,
  grass: 0.3,
  sand: -0.2,
};

export const TERRAIN_CONFIG = {
  scale: 60,
  height: 40,
  waterLevel: 0,
  groundDepth: 5,
};

export const CONTROLS = {
  moveForward: ['KeyW', 'ArrowUp'],
  moveBackward: ['KeyS', 'ArrowDown'],
  moveLeft: ['KeyA', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  jump: ['Space'],
  sprint: ['ShiftLeft', 'ShiftRight'],
  toggleDayNight: ['KeyO'],
  resetWorld: ['KeyR'],
  unlockMouse: ['Escape'],
};

export const BLOCK_KEYS: Record<string, BlockType> = {
  'Digit1': 'grass',
  'Digit2': 'dirt',
  'Digit3': 'stone',
  'Digit4': 'wood',
  'Digit5': 'sand',
  'Digit6': 'snow',
};

export const STORAGE_KEY = 'voxel-sandbox-world';

export const SKY_COLORS = {
  day: 0x87ceeb,
  night: 0x1a1a2e,
  dawn: 0xffb6c1,
  dusk: 0xffa07a,
};

export const FOG_CONFIG = {
  day: { near: 30, far: 150, density: 0.005 },
  night: { near: 20, far: 100, density: 0.008 },
};

export const SUN_CONFIG = {
  day: { intensity: 1, position: [50, 50, 50] },
  night: { intensity: 0.2, position: [-50, -50, -50] },
};

export const AMBIENT_CONFIG = {
  day: 0xffffff,
  night: 0x444466,
};

export const GRID_SIZE = CHUNK_SIZE * BLOCK_SIZE;