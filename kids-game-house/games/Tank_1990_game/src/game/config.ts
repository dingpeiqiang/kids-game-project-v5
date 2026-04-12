
//  src/game/config.ts
//  All game constants, enemy stats, and Phaser config

import Phaser from 'phaser';
import { EnemyConfig, EnemyType } from '../types';

//  Display 
export const TILE = 16;
export const COLS = 26;
export const ROWS = 26;
export const MAP_W = COLS * TILE;   // 416
export const MAP_H = ROWS * TILE;   // 416
export const HUD_W = 72;
export const GAME_W = MAP_W + HUD_W; // 488
export const GAME_H = MAP_H;         // 416

//  Eagle position (grid) 
export const EAGLE_ROW = 24;
export const EAGLE_COL = 12; // occupies 12-13

//  Player spawn 
export const PLAYER_SPAWN_COL = 4;
export const PLAYER_SPAWN_ROW = 24;

//  Depth layers 
export const DEPTH = {
  GROUND: 0,
  TILE: 1,
  ICE: 2,
  EAGLE: 3,
  POWERUP: 4,
  TANK: 5,
  BULLET: 7,
  TREE: 22,   // above tanks
  SHIELD_FX: 12,
  SPAWN_FX: 16,
  EXPLOSION: 18,
  HUD: 30,
  OVERLAY: 50,
} as const;

//  Direction vectors ─
export const DV: Readonly<{ x: number; y: number }[]> = [
  { x: 0, y: -1 }, // UP
  { x: 1, y: 0 }, // RIGHT
  { x: 0, y: 1 }, // DOWN
  { x: -1, y: 0 }, // LEFT
];

// Angle (degrees) to rotate bullet sprite per direction
export const BULLET_ANGLE = [-90, 0, 90, 180] as const;

//  Enemy stats map ─
export const ENEMY_CFG: Record<EnemyType, EnemyConfig> = {
  [EnemyType.BASIC]: {
    speed: 60,
    hp: 1,
    fireRate: 2200,
    score: 100,
  },
  [EnemyType.FAST]: {
    speed: 100,
    hp: 1,
    fireRate: 1800,
    score: 200,
  },
  [EnemyType.ARMORED]: {
    speed: 50,
    hp: 4,
    fireRate: 2800,
    score: 400,
  },
};

//  Player stats per star level ─
export const PLAYER_SPEED = (star: number) => 80 + star * 20;
export const PLAYER_BULLET_SPEED = (star: number) => 200 + star * 40;
export const PLAYER_FIRE_CD = (star: number) => star >= 3 ? 6 : 15;
export const PLAYER_MAX_BULLETS = (star: number) => star >= 2 ? 2 : 1;

//  High-score localStorage key ─
export const HS_KEY = 'bc_hs';

//  Phaser game config 
export const PHASER_CONFIG: Omit<Phaser.Types.Core.GameConfig, 'scene'> = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0a0a0a',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
};
