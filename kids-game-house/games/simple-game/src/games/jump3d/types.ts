export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  position: Vector3;
  velocity: Vector3;
  isJumping: boolean;
  isGrounded: boolean;
  scale: number;
  currentPlatformIndex: number;
}

export interface Platform {
  id: number;
  position: Vector3;
  width: number;
  depth: number;
  height: number;
  rotation: number;
  type: 'normal' | 'moving' | 'special';
  hasObstacle: boolean;
  obstaclePosition?: Vector3;
}

export interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isCharging: boolean;
  chargeTime: number;
  currentLevel: number;
}

export interface ScoreRecord {
  highScore: number;
  maxCombo: number;
}

export interface CameraState {
  position: Vector3;
  target: Vector3;
  isFollowing: boolean;
}

export interface LandingResult {
  success: boolean;
  isPerfect: boolean;
  isEdge: boolean;
  platformIndex: number;
}

export interface PowerupType {
  id: string;
  type: 'stable' | 'doubleScore' | 'shield';
  position: Vector3;
  active: boolean;
}
