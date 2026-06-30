import type { LevelConfig } from '../types/level'
import { GAME_CONFIG } from '../config'

export const level1Config: LevelConfig = {
  id: 1,
  name: '丛林突围',
  description: '穿越茂密的丛林，消灭沿途的敌人，到达终点',
  
  duration: 300000,
  requiredScore: 5000,
  
  background: {
    color: '#1a2f1a',
    parallaxLayers: [
      { image: 'bg-layer-1', speed: 0.1, y: 0 },
      { image: 'bg-layer-2', speed: 0.2, y: 50 },
      { image: 'bg-layer-3', speed: 0.3, y: 100 },
    ],
    stars: {
      count: 50,
      speed: 0.5,
      colors: ['#ffffff', '#cccccc', '#999999']
    },
    clouds: {
      count: 5,
      speed: 0.2,
      sizes: [60, 80, 100]
    }
  },

  platforms: [
    { x: 0, y: GAME_CONFIG.CANVAS_HEIGHT - 40, width: 6000, height: 40, type: 'normal' },
    { x: 120, y: GAME_CONFIG.CANVAS_HEIGHT - 90, width: 100, height: 16, type: 'normal' },
    { x: 300, y: GAME_CONFIG.CANVAS_HEIGHT - 120, width: 80, height: 16, type: 'normal' },
    { x: 80, y: GAME_CONFIG.CANVAS_HEIGHT - 150, width: 60, height: 16, type: 'normal' },
    { x: 500, y: GAME_CONFIG.CANVAS_HEIGHT - 80, width: 100, height: 16, type: 'normal' },
    { x: 700, y: GAME_CONFIG.CANVAS_HEIGHT - 110, width: 80, height: 16, type: 'normal' },
    { x: 850, y: GAME_CONFIG.CANVAS_HEIGHT - 140, width: 90, height: 16, type: 'normal' },
    { x: 1100, y: GAME_CONFIG.CANVAS_HEIGHT - 100, width: 80, height: 16, type: 'normal' },
    { x: 1350, y: GAME_CONFIG.CANVAS_HEIGHT - 80, width: 100, height: 16, type: 'normal' },
    { x: 1600, y: GAME_CONFIG.CANVAS_HEIGHT - 130, width: 90, height: 16, type: 'normal' },
    { x: 1850, y: GAME_CONFIG.CANVAS_HEIGHT - 100, width: 80, height: 16, type: 'normal' },
    { x: 2100, y: GAME_CONFIG.CANVAS_HEIGHT - 80, width: 100, height: 16, type: 'normal' },
    { x: 2350, y: GAME_CONFIG.CANVAS_HEIGHT - 120, width: 90, height: 16, type: 'normal' },
    { x: 2600, y: GAME_CONFIG.CANVAS_HEIGHT - 90, width: 80, height: 16, type: 'normal' },
    { x: 2850, y: GAME_CONFIG.CANVAS_HEIGHT - 80, width: 100, height: 16, type: 'normal' },
    { x: 3100, y: GAME_CONFIG.CANVAS_HEIGHT - 140, width: 90, height: 16, type: 'normal' },
    { x: 3350, y: GAME_CONFIG.CANVAS_HEIGHT - 100, width: 80, height: 16, type: 'normal' },
    { x: 3600, y: GAME_CONFIG.CANVAS_HEIGHT - 80, width: 100, height: 16, type: 'normal' },
    { x: 3850, y: GAME_CONFIG.CANVAS_HEIGHT - 110, width: 90, height: 16, type: 'normal' },
    { x: 4100, y: GAME_CONFIG.CANVAS_HEIGHT - 90, width: 80, height: 16, type: 'normal' },
    { x: 4350, y: GAME_CONFIG.CANVAS_HEIGHT - 80, width: 100, height: 16, type: 'normal' },
    { x: 4600, y: GAME_CONFIG.CANVAS_HEIGHT - 130, width: 90, height: 16, type: 'normal' },
    { x: 4850, y: GAME_CONFIG.CANVAS_HEIGHT - 100, width: 80, height: 16, type: 'normal' },
    { x: 5100, y: GAME_CONFIG.CANVAS_HEIGHT - 80, width: 100, height: 16, type: 'normal' },
    { x: 5350, y: GAME_CONFIG.CANVAS_HEIGHT - 120, width: 90, height: 16, type: 'normal' },
    { x: 5600, y: GAME_CONFIG.CANVAS_HEIGHT - 90, width: 80, height: 16, type: 'normal' },
  ],

  enemySpawns: [
    { type: 'melee', x: 400, quantity: 3, spacing: 70, groupId: 'wave-1', behavior: 'walk' },
    { type: 'normal', x: 650, groupId: 'wave-1', behavior: 'walk', shootInterval: 2500 },
    { type: 'normal', x: 800, behavior: 'fly', groupId: 'wave-1', patrolRange: 120, flyHeight: 140, shootInterval: 2500 },
    { type: 'melee', x: 900, quantity: 3, spacing: 80, groupId: 'wave-2', behavior: 'walk' },
    { type: 'elite', x: 1150, groupId: 'wave-2', behavior: 'stationary', shootInterval: 1800 },
    { type: 'melee', x: 1350, quantity: 2, spacing: 70, behavior: 'jump', groupId: 'wave-3', jumpHeight: 80 },
    { type: 'melee', x: 1550, quantity: 2, spacing: 70, behavior: 'walk', groupId: 'wave-3' },
    { type: 'normal', x: 1700, groupId: 'wave-3', behavior: 'walk', shootInterval: 2000 },
    { type: 'normal', x: 1850, behavior: 'fly', groupId: 'wave-3', patrolRange: 130, flyHeight: 110, shootInterval: 2200 },
    { type: 'melee', x: 1900, quantity: 3, spacing: 70, groupId: 'wave-4', behavior: 'walk' },
    { type: 'elite', x: 2150, groupId: 'wave-4', behavior: 'stationary', shootInterval: 1500 },
    { type: 'melee', x: 2250, quantity: 2, spacing: 70, groupId: 'wave-4', behavior: 'walk' },
    { type: 'melee', x: 2450, quantity: 2, spacing: 70, groupId: 'wave-5', behavior: 'walk' },
    { type: 'normal', x: 2600, groupId: 'wave-5', behavior: 'walk', shootInterval: 1800 },
    { type: 'elite', x: 2750, groupId: 'wave-5', behavior: 'walk', shootInterval: 1200 },
    { type: 'melee', x: 2850, quantity: 2, spacing: 70, groupId: 'wave-5', behavior: 'walk' },
    { type: 'melee', x: 3050, quantity: 3, spacing: 70, groupId: 'wave-6', behavior: 'walk' },
    { type: 'normal', x: 3250, behavior: 'fly', groupId: 'wave-6', patrolRange: 150, flyHeight: 130, shootInterval: 2000 },
    { type: 'normal', x: 3400, behavior: 'fly', groupId: 'wave-6', patrolRange: 140, flyHeight: 90, shootInterval: 2300 },
    { type: 'melee', x: 3450, quantity: 3, spacing: 80, groupId: 'wave-7', behavior: 'walk' },
    { type: 'melee', x: 3700, behavior: 'jump', groupId: 'wave-7', jumpHeight: 80 },
    { type: 'elite', x: 3850, groupId: 'wave-7', behavior: 'stationary', shootInterval: 1400 },
    { type: 'normal', x: 4000, behavior: 'fly', groupId: 'wave-7', patrolRange: 130, flyHeight: 150, shootInterval: 2100 },
    { type: 'melee', x: 4050, quantity: 4, spacing: 80, groupId: 'wave-8', behavior: 'walk' },
    { type: 'melee', x: 4300, quantity: 2, spacing: 70, groupId: 'wave-8', behavior: 'jump', jumpHeight: 60 },
    { type: 'elite', x: 4500, groupId: 'wave-8', behavior: 'walk', shootInterval: 1000 },
    { type: 'melee', x: 4700, quantity: 4, spacing: 70, groupId: 'wave-9', behavior: 'walk' },
    { type: 'normal', x: 4950, behavior: 'fly', groupId: 'wave-9', patrolRange: 150, flyHeight: 120, shootInterval: 1800 },
    { type: 'normal', x: 5100, behavior: 'fly', groupId: 'wave-9', patrolRange: 140, flyHeight: 160, shootInterval: 1900 },
    { type: 'melee', x: 5050, quantity: 2, spacing: 70, behavior: 'walk', groupId: 'wave-9' },
    { type: 'melee', x: 5300, quantity: 4, spacing: 80, groupId: 'wave-10', behavior: 'walk' },
    { type: 'elite', x: 5600, groupId: 'wave-10', behavior: 'walk', shootInterval: 900 },
    { type: 'melee', x: 5750, quantity: 2, spacing: 70, behavior: 'walk', groupId: 'wave-10' },
    { type: 'normal', x: 5900, behavior: 'fly', groupId: 'wave-10', patrolRange: 130, flyHeight: 110, shootInterval: 2000 },
  ],

  powerupSpawns: [
    { type: 'health', x: 400, delay: 4000 },
    { type: 'rapidFire', x: 650, delay: 6500 },
    { type: 'spreadShot', x: 950, delay: 9500 },
    { type: 'shield', x: 1200, delay: 12000 },
    { type: 'health', x: 1600, delay: 16000 },
    { type: 'doubleJump', x: 2000, delay: 20000 },
    { type: 'rapidFire', x: 2500, delay: 25000 },
    { type: 'shield', x: 3000, delay: 30000 },
    { type: 'spreadShot', x: 3500, delay: 35000 },
    { type: 'health', x: 4000, delay: 40000 },
    { type: 'rapidFire', x: 4500, delay: 45000 },
    { type: 'shield', x: 5000, delay: 50000 },
    { type: 'health', x: 5500, delay: 55000 },
  ],

  traps: [
    { type: 'spike', x: 1200, y: GAME_CONFIG.CANVAS_HEIGHT - 16, width: 48, cooldown: 240 },
    { type: 'spike', x: 1300, y: GAME_CONFIG.CANVAS_HEIGHT - 16, width: 48, cooldown: 240 },
    { type: 'fire', x: 2000, y: GAME_CONFIG.CANVAS_HEIGHT - 16, width: 48, cooldown: 180 },
    { type: 'fire', x: 2100, y: GAME_CONFIG.CANVAS_HEIGHT - 16, width: 48, cooldown: 180 },
    { type: 'laser', x: 3600, y: GAME_CONFIG.CANVAS_HEIGHT - 100, width: 64, cooldown: 300 },
    { type: 'laser', x: 3700, y: GAME_CONFIG.CANVAS_HEIGHT - 100, width: 64, cooldown: 300 },
    { type: 'electric', x: 2800, y: GAME_CONFIG.CANVAS_HEIGHT - 16, width: 48, cooldown: 200 },
    { type: 'electric', x: 2900, y: GAME_CONFIG.CANVAS_HEIGHT - 16, width: 48, cooldown: 200 },
    { type: 'spike', x: 4300, y: GAME_CONFIG.CANVAS_HEIGHT - 16, width: 48, cooldown: 200 },
    { type: 'spike', x: 4400, y: GAME_CONFIG.CANVAS_HEIGHT - 16, width: 48, cooldown: 200 },
    { type: 'fire', x: 5100, y: GAME_CONFIG.CANVAS_HEIGHT - 16, width: 48, cooldown: 160 },
    { type: 'fire', x: 5200, y: GAME_CONFIG.CANVAS_HEIGHT - 16, width: 48, cooldown: 160 },
  ],

  hasBoss: false,

  exit: {
    x: 5800,
    y: GAME_CONFIG.CANVAS_HEIGHT - 80,
    width: 64,
    height: 80,
  },

  difficulty: 'easy',
  enemyDensity: 1.0,
  spawnRate: 1.0,

  maxEnemiesOnScreen: 12,
  particleLimit: 200,
  bulletLimit: 50,

  dynamicDifficulty: true,
  difficultyScaling: 0.1,
  playerSkillThreshold: 0.7,

  cullingDistance: 1000,
  preloadDistance: 800,

  debugMode: false,
  showHitboxes: false,
  showSpawnPoints: false,

  weatherEffects: [
    { type: 'wind', intensity: 0.3, startDelay: 10000, duration: 30000 },
    { type: 'fog', intensity: 0.2, startDelay: 20000 },
    { type: 'rain', intensity: 0.4, startDelay: 40000, duration: 60000 },
    { type: 'wind', intensity: 0.5, startDelay: 70000, duration: 40000 }
  ],

  ambientSounds: [
    { type: 'ambient', file: 'jungle-ambience', volume: 0.3, loop: true },
    { type: 'sound', file: 'bird-chirp', volume: 0.2, loop: true, delay: 5000 },
    { type: 'sound', file: 'insect-chirp', volume: 0.15, loop: true, delay: 15000 },
    { type: 'sound', file: 'water-flow', volume: 0.25, loop: true, delay: 30000 },
    { type: 'sound', file: 'thunder', volume: 0.8, loop: false, delay: 45000, interval: 15000 }
  ],
};
