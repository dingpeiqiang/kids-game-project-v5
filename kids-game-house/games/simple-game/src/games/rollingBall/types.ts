export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Ball {
  position: Vector3D;
  velocity: Vector3D;
  rotation: Vector3D;
  radius: number;
  hasShield: boolean;
  isSpeedBoost: boolean;
  speedBoostTimer: number;
}

export interface TrackSegment {
  start: Vector3D;
  end: Vector3D;
  width: number;
  type: 'normal' | 'ice' | 'sand';
}

export interface Crystal {
  position: Vector3D;
  collected: boolean;
  size: number;
}

export interface Obstacle {
  position: Vector3D;
  type: 'static' | 'pendulum' | 'moving';
  size: Vector3D;
  angle?: number;
  speed?: number;
  minX?: number;
  maxX?: number;
}

export interface Level {
  id: number;
  name: string;
  track: TrackSegment[];
  crystals: Crystal[];
  obstacles: Obstacle[];
  startPosition: Vector3D;
  endPosition: Vector3D;
  timeLimit?: number;
  perfectScore: number;
}

export interface GameState {
  level: number;
  score: number;
  time: number;
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  perfectCompletion: boolean;
  collectedCrystals: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  forward: boolean;
  backward: boolean;
  reset: boolean;
}

export interface CameraConfig {
  distance: number;
  angle: number;
  height: number;
  followSpeed: number;
  shakeIntensity: number;
}

export interface PhysicsConfig {
  gravity: number;
  friction: number;
  iceFriction: number;
  sandFriction: number;
  bounce: number;
  maxSpeed: number;
  acceleration: number;
}

export type TerrainType = 'normal' | 'ice' | 'sand';
