export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface VehicleState {
  position: Vector3;
  rotation: number;
  velocity: number;
  angularVelocity: number;
  steeringAngle: number;
  isBraking: boolean;
}

export interface ParkingSpot {
  position: Vector3;
  rotation: number;
  width: number;
  length: number;
}

export interface Obstacle {
  id: string;
  type: 'cone' | 'barrier' | 'wall' | 'car';
  position: Vector3;
  rotation: number;
  width: number;
  height: number;
  depth: number;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  timeLimit: number;
  parkingSpot: ParkingSpot;
  obstacles: Obstacle[];
  startPosition: Vector3;
  startRotation: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameState {
  currentLevel: number;
  score: number;
  maxScore: number;
  timeRemaining: number;
  collisions: number;
  maxCollisions: number;
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  isCompleted: boolean;
  isPerfect: boolean;
}

export type CameraMode = 'follow' | 'top' | 'rear';

export interface CameraConfig {
  followDistance: number;
  followHeight: number;
  topHeight: number;
  rearDistance: number;
  transitionSpeed: number;
}

export interface ParkingResult {
  success: boolean;
  centerDeviation: number;
  angleDeviation: number;
  isFullyInside: boolean;
  score: number;
}

export interface PlayerData {
  bestScore: number;
  completedLevels: number[];
  perfectLevels: number[];
  totalAttempts: number;
}
