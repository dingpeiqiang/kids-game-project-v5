export interface PlayerState {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  isJumping: boolean;
  isCrouching: boolean;
  lane: number;
  shieldActive: boolean;
  shieldTimer: number;
  doubleScoreActive: boolean;
  doubleScoreTimer: number;
  slowModeActive: boolean;
  slowModeTimer: number;
}

export interface Obstacle {
  id: string;
  type: 'static' | 'moving' | 'pendulum' | 'spike';
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  movingDirection?: number;
  movingRange?: number;
  initialX?: number;
  rotation?: number;
  rotationSpeed?: number;
}

export interface Collectible {
  id: string;
  type: 'coin' | 'crystal' | 'shield' | 'slow' | 'double';
  position: { x: number; y: number; z: number };
  collected: boolean;
  rotation: number;
}

export interface TrackSegment {
  id: string;
  position: { x: number; y: number; z: number };
  type: 'normal' | 'ice' | 'broken';
  hasGap: boolean;
}

export interface GameState {
  player: PlayerState;
  obstacles: Obstacle[];
  collectibles: Collectible[];
  trackSegments: TrackSegment[];
  score: number;
  distance: number;
  speed: number;
  maxSpeed: number;
  gameOver: boolean;
  isPaused: boolean;
  highScore: number;
  speedLevel: number;
  distanceLevel: number;
}

export interface DifficultyConfig {
  speedMultiplier: number;
  obstacleSpawnRate: number;
  obstacleDensity: number;
  collectibleSpawnRate: number;
  gapFrequency: number;
}

export type Lane = -1 | 0 | 1;

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  crouch: boolean;
  reset: boolean;
}