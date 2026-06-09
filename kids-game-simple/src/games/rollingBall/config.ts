import type { Level, CameraConfig, PhysicsConfig } from './types';

export const CAMERA_CONFIG: CameraConfig = {
  distance: 12,
  angle: Math.PI / 4,
  height: 6,
  followSpeed: 0.08,
  shakeIntensity: 0.1,
};

export const PHYSICS_CONFIG: PhysicsConfig = {
  gravity: 0.5,
  friction: 0.92,
  iceFriction: 0.99,
  sandFriction: 0.85,
  bounce: 0.3,
  maxSpeed: 15,
  acceleration: 0.3,
};

export const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  FALL_THRESHOLD: -50,
  CRYSTAL_SCORE: 10,
  SHIELD_DURATION: 5000,
  SPEED_BOOST_DURATION: 3000,
};

export const LEVELS: Level[] = [
  {
    id: 1,
    name: '新手入门',
    startPosition: { x: -25, y: 2, z: 0 },
    endPosition: { x: 25, y: 2, z: 0 },
    track: [
      { start: { x: -25, y: 0, z: -3 }, end: { x: 25, y: 0, z: -3 }, width: 6, type: 'normal' },
      { start: { x: -25, y: 0, z: 3 }, end: { x: 25, y: 0, z: 3 }, width: 6, type: 'normal' },
    ],
    crystals: [
      { position: { x: -20, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: -15, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: -10, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: -5, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: 0, y: 1.5, z: 0 }, collected: false, size: 1.2 },
      { position: { x: 5, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: 10, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: 15, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: 20, y: 1.5, z: 0 }, collected: false, size: 0.8 },
    ],
    obstacles: [],
    perfectScore: 90,
  },
  {
    id: 2,
    name: '断桥挑战',
    startPosition: { x: -25, y: 2, z: 0 },
    endPosition: { x: 25, y: 2, z: 0 },
    track: [
      { start: { x: -25, y: 0, z: -3 }, end: { x: -10, y: 0, z: -3 }, width: 6, type: 'normal' },
      { start: { x: -10, y: 0, z: -3 }, end: { x: -10, y: 0, z: 3 }, width: 6, type: 'normal' },
      { start: { x: -10, y: 0, z: 3 }, end: { x: 10, y: 0, z: 3 }, width: 6, type: 'normal' },
      { start: { x: 10, y: 0, z: 3 }, end: { x: 10, y: 0, z: -3 }, width: 6, type: 'normal' },
      { start: { x: 10, y: 0, z: -3 }, end: { x: 25, y: 0, z: -3 }, width: 6, type: 'normal' },
    ],
    crystals: [
      { position: { x: -20, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: -15, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: -5, y: 1.5, z: 3 }, collected: false, size: 0.8 },
      { position: { x: 0, y: 1.5, z: 3 }, collected: false, size: 1.2 },
      { position: { x: 5, y: 1.5, z: 3 }, collected: false, size: 0.8 },
      { position: { x: 15, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: 20, y: 1.5, z: 0 }, collected: false, size: 0.8 },
    ],
    obstacles: [
      { position: { x: -8, y: 1, z: 0 }, type: 'static', size: { x: 2, y: 2, z: 2 } },
      { position: { x: 8, y: 1, z: 0 }, type: 'static', size: { x: 2, y: 2, z: 2 } },
    ],
    perfectScore: 70,
  },
  {
    id: 3,
    name: '冰面滑行',
    startPosition: { x: -25, y: 2, z: 0 },
    endPosition: { x: 25, y: 2, z: 0 },
    track: [
      { start: { x: -25, y: 0, z: -3 }, end: { x: -10, y: 0, z: -3 }, width: 6, type: 'normal' },
      { start: { x: -10, y: 0, z: -3 }, end: { x: 10, y: 0, z: 3 }, width: 6, type: 'ice' },
      { start: { x: 10, y: 0, z: 3 }, end: { x: 25, y: 0, z: 3 }, width: 6, type: 'normal' },
    ],
    crystals: [
      { position: { x: -20, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: -15, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: -5, y: 1.5, z: 0 }, collected: false, size: 1.0 },
      { position: { x: 0, y: 1.5, z: 1.5 }, collected: false, size: 1.2 },
      { position: { x: 5, y: 1.5, z: 3 }, collected: false, size: 1.0 },
      { position: { x: 15, y: 1.5, z: 3 }, collected: false, size: 0.8 },
      { position: { x: 20, y: 1.5, z: 3 }, collected: false, size: 0.8 },
    ],
    obstacles: [],
    perfectScore: 70,
  },
  {
    id: 4,
    name: '摆锤陷阱',
    startPosition: { x: -25, y: 2, z: 0 },
    endPosition: { x: 25, y: 2, z: 0 },
    track: [
      { start: { x: -25, y: 0, z: -2 }, end: { x: -15, y: 0, z: -2 }, width: 4, type: 'normal' },
      { start: { x: -15, y: 0, z: -2 }, end: { x: -5, y: 2, z: 2 }, width: 4, type: 'normal' },
      { start: { x: -5, y: 2, z: 2 }, end: { x: 5, y: 0, z: 2 }, width: 4, type: 'normal' },
      { start: { x: 5, y: 0, z: 2 }, end: { x: 15, y: 2, z: -2 }, width: 4, type: 'normal' },
      { start: { x: 15, y: 2, z: -2 }, end: { x: 25, y: 0, z: -2 }, width: 4, type: 'normal' },
    ],
    crystals: [
      { position: { x: -20, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: -10, y: 2.5, z: 0 }, collected: false, size: 1.0 },
      { position: { x: 0, y: 2.5, z: 2 }, collected: false, size: 1.2 },
      { position: { x: 10, y: 2.5, z: 0 }, collected: false, size: 1.0 },
      { position: { x: 20, y: 1.5, z: 0 }, collected: false, size: 0.8 },
    ],
    obstacles: [
      { position: { x: 0, y: 4, z: 0 }, type: 'pendulum', size: { x: 1, y: 0.5, z: 4 }, angle: 0, speed: 2 },
    ],
    perfectScore: 50,
  },
  {
    id: 5,
    name: '终极挑战',
    startPosition: { x: -30, y: 2, z: 0 },
    endPosition: { x: 30, y: 2, z: 0 },
    timeLimit: 120,
    track: [
      { start: { x: -30, y: 0, z: -3 }, end: { x: -20, y: 0, z: -3 }, width: 5, type: 'sand' },
      { start: { x: -20, y: 0, z: -3 }, end: { x: -10, y: 0, z: 3 }, width: 5, type: 'normal' },
      { start: { x: -10, y: 0, z: 3 }, end: { x: 10, y: 0, z: 3 }, width: 5, type: 'ice' },
      { start: { x: 10, y: 0, z: 3 }, end: { x: 20, y: 0, z: -3 }, width: 5, type: 'normal' },
      { start: { x: 20, y: 0, z: -3 }, end: { x: 30, y: 0, z: -3 }, width: 5, type: 'sand' },
    ],
    crystals: [
      { position: { x: -25, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: -18, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: -12, y: 1.5, z: 3 }, collected: false, size: 1.0 },
      { position: { x: -5, y: 1.5, z: 3 }, collected: false, size: 1.0 },
      { position: { x: 0, y: 1.5, z: 3 }, collected: false, size: 1.5 },
      { position: { x: 5, y: 1.5, z: 3 }, collected: false, size: 1.0 },
      { position: { x: 12, y: 1.5, z: 3 }, collected: false, size: 1.0 },
      { position: { x: 18, y: 1.5, z: 0 }, collected: false, size: 0.8 },
      { position: { x: 25, y: 1.5, z: 0 }, collected: false, size: 0.8 },
    ],
    obstacles: [
      { position: { x: 0, y: 1, z: 3 }, type: 'moving', size: { x: 3, y: 2, z: 1 }, speed: 1, minX: -4, maxX: 4 },
      { position: { x: 15, y: 3, z: 0 }, type: 'pendulum', size: { x: 1, y: 0.5, z: 3 }, angle: Math.PI / 2, speed: 3 },
    ],
    perfectScore: 90,
  },
];

export const COLORS = {
  normal: 0xcccccc,
  ice: 0x87CEEB,
  sand: 0xf4a460,
  crystal: 0xffd700,
  crystalGlow: 0xffff00,
  obstacle: 0x8B4513,
  ball: 0x4169E1,
  ballShield: 0x00CED1,
  endZone: 0x00ff00,
  skyTop: 0x87CEEB,
  skyBottom: 0xE0F6FF,
};
