export type VehicleForm = 'car' | 'spaceship' | 'tank' | 'mecha';

export type CarColor = 'red' | 'blue' | 'yellow';

export type PowerupType = 'boost' | 'shield' | 'magnet' | 'double' | 'invincible' | 'clearObs' | 'addTime' | 'spaceship' | 'tank' | 'mecha' | 'scoreBonus';

export type SceneType = 'city' | 'space' | 'desert' | 'snow' | 'futuristic' | 'mechabase';

export interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'car' | 'cone' | 'truck' | 'oil' | 'water' | 'rock' | 'barrier' | 'slowCar' | 'pit' | 'van';
  color: string;
  emoji: string;
  lane: number;
  nearMissAwarded: boolean;
  vx?: number;
  hitProcessed?: boolean;
}

export interface Coin {
  x: number;
  y: number;
  w: number;
  h: number;
  lane: number;
  collected: boolean;
}

export interface Powerup {
  x: number;
  y: number;
  w: number;
  h: number;
  type: PowerupType;
  emoji: string;
  color: string;
  lane: number;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape?: 'circle' | 'diamond' | 'star' | 'spark';
  rotation?: number;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

export interface LevelConfig {
  level: number;
  name: string;
  description: string;
  timeLimit: number;
  distanceGoal: number;
  minObsInterval: number;
  maxObsInterval: number;
  minCoinInterval: number;
  maxCoinInterval: number;
  minPowerupInterval: number;
  maxPowerupInterval: number;
  maxSpeed: number;
  speedIncrement: number;
  
  // 关卡专属配置
  allowedObstacles?: string[];
  allowedPowerups?: string[];
  availableScenes?: SceneType[];
  coinMultiplier?: number;
  scoreMultiplier?: number;
  
  // 关卡特色规则
  hasDynamicObstacles?: boolean;
  hasHiddenPits?: boolean;
  slipperyRoad?: boolean;
  nightMode?: boolean;
  collisionSlowMultiplier?: number;
}

export interface LevelResult {
  level: number;
  completed: boolean;
  timeRemaining: number;
  score: number;
  coinsCollected: number;
  distance: number;
}
