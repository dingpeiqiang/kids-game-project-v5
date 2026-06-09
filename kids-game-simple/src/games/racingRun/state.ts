import type { Obstacle, Coin, Powerup, Particle, FloatText, VehicleForm, SceneType, CarColor } from './types';
import { LANES, LEVELS, SCENES } from './config';

export interface GameState {
  // 玩家状态
  currentLane: number;
  targetX: number;
  playerX: number;
  playerW: number;
  playerH: number;
  tilt: number;
  carColor: CarColor; // 车辆颜色

  // 车辆形态
  vehicleForm: VehicleForm;
  vehicleFormTimer: number;
  transforming: boolean;

  // 游戏状态
  gameSpeed: number;
  speedMultiplier: number;
  baseSpeed: number;
  score: number;
  distance: number;
  coinsCollected: number;
  combo: number;
  gameEnded: boolean;
  shakeFrames: number;
  frameCount: number;

  // 关卡状态
  currentLevel: number;
  timeRemaining: number;
  levelComplete: boolean;
  gameWon: boolean;

  // 场景状态
  currentScene: SceneType;
  nextScene: SceneType;
  sceneTransitionProgress: number;

  // 道具计时器
  boostTimer: number;
  shieldTimer: number;
  magnetTimer: number;
  doubleTimer: number;
  invincibleTimer: number;
  spaceshipTimer: number;
  tankTimer: number;
  mechaTimer: number;

  // 碰撞减速状态
  collisionSlowTimer: number;
  collisionFlash: number;
  slowMultiplier: number;

  // 游戏元素激活状态标记
  boostActive: boolean;
  invincibleActive: boolean;

  // 游戏元素
  roadLines: Array<{ y: number }>;
  sideObjs: Array<{ y: number; side: number; type: string }>;
  obstacles: Obstacle[];
  coins: Coin[];
  powerups: Powerup[];
  particles: Particle[];
  floatTexts: FloatText[];
  comboTexts: Array<{ x: number; y: number; text: string; life: number }>;
  bullets: Array<{ x: number; y: number; speed: number; isWide?: boolean }>; // 坦克炮弹
  autoFireTimer?: number; // 坦克自动射击计时器

  // 生成计时器
  lastObsTime: number;
  lastCoinTime: number;
  lastPowerupTime: number;
}

export function createInitialState(carColor: CarColor = 'blue'): GameState {
  const firstLevel = LEVELS[0];
  const sceneTypes = Object.keys(SCENES) as SceneType[];
  const currentScene = sceneTypes[0];
  
  return {
    currentLane: 1,
    targetX: LANES[1],
    playerX: LANES[1],
    playerW: 40,
    playerH: 60,
    tilt: 0,
    carColor: carColor, // 使用传入的颜色

    vehicleForm: 'car',
    vehicleFormTimer: 0,
    transforming: false,

    gameSpeed: 1.8,
    speedMultiplier: 1,
    baseSpeed: 1.8,
    score: 0,
    distance: 0,
    coinsCollected: 0,
    combo: 0,
    gameEnded: false,
    shakeFrames: 0,
    frameCount: 0,

    currentLevel: 1,
    timeRemaining: firstLevel.timeLimit,
    levelComplete: false,
    gameWon: false,

    currentScene,
    nextScene: sceneTypes[1],
    sceneTransitionProgress: 0,

    boostTimer: 0,
    shieldTimer: 0,
    magnetTimer: 0,
    doubleTimer: 0,
    invincibleTimer: 0,
    spaceshipTimer: 0,
    tankTimer: 0,
    mechaTimer: 0,

    collisionSlowTimer: 0,
    collisionFlash: 0,
    slowMultiplier: 1,

    boostActive: false,
    invincibleActive: false,

    roadLines: Array.from({ length: 8 }, (_, i) => ({ y: i * 100 })),
    sideObjs: Array.from({ length: 6 }, (_, i) => ({
      y: i * 120,
      side: i % 2,
      type: SCENES[currentScene].objects[Math.floor(Math.random() * SCENES[currentScene].objects.length)],
    })),
    obstacles: [],
    coins: [],
    powerups: [],
    particles: [],
    floatTexts: [],
    comboTexts: [],
    bullets: [], // 初始化炮弹数组

    lastObsTime: 0,
    lastCoinTime: 0,
    lastPowerupTime: 0,
  };
}
