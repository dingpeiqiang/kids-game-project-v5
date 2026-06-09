export type BlockType = 'grass' | 'dirt' | 'stone' | 'wood' | 'sand' | 'snow';

export interface Block {
  type: BlockType;
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  rotationY: number;
  rotationX: number;
  isGrounded: boolean;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  currentBlockType: BlockType;
  gameTime: number;
  isDay: boolean;
}

export interface WorldChunk {
  x: number;
  z: number;
  blocks: Map<string, Block>;
  mesh: THREE.Group | null;
  loaded: boolean;
}

export interface SavedWorld {
  seed: number;
  blocks: Array<{ x: number; y: number; z: number; type: BlockType }>;
  playerPosition: { x: number; y: number; z: number };
  gameTime: number;
}

export interface RaycastResult {
  hit: boolean;
  block?: Block;
  face?: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';
  position?: { x: number; y: number; z: number };
}