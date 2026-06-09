export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Cell {
  x: number;
  y: number;
  walls: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
  visited: boolean;
}

export interface Key {
  id: number;
  position: Position;
  collected: boolean;
}

export interface Trap {
  id: number;
  position: Position;
  type: 'slow' | 'fog' | 'time';
  active: boolean;
}

export interface Powerup {
  id: number;
  position: Position;
  type: 'vision' | 'stopwatch' | 'hint';
  collected: boolean;
}

export interface MazeConfig {
  size: number;
  cellSize: number;
  wallHeight: number;
  keyCount: number;
  trapCount: number;
  timeLimit: number;
  fogRadius: number;
}

export interface GameState {
  currentLevel: number;
  keysCollected: number;
  totalKeys: number;
  timeRemaining: number;
  score: number;
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  playerPosition: Position;
  playerRotation: number;
}

export interface LevelConfig {
  level: number;
  mazeSize: number;
  cellSize: number;
  keyCount: number;
  trapCount: number;
  timeLimit: number;
  fogRadius: number;
  hasFog: boolean;
}

export interface PlayerStats {
  speed: number;
  speedMultiplier: number;
  visionRadius: number;
}

export interface MiniMapData {
  maze: Cell[][];
  playerPosition: Position;
  keys: Key[];
  traps: Trap[];
  exitPosition: Position;
  cellSize: number;
}