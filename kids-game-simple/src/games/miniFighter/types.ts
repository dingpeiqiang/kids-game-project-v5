export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface FighterState {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  isBlocking: boolean;
  isAttacking: boolean;
  isDodging: boolean;
  isStunned: boolean;
  attackCooldown: number;
  dodgeCooldown: number;
  invincibleUntil: number;
  position: Vector3;
  rotation: number;
  velocity: Vector3;
  stunUntil: number;
}

export type AIDifficulty = 'easy' | 'normal' | 'hard';

export interface AIState extends FighterState {
  difficulty: AIDifficulty;
  currentAction: AIAction;
  actionTimer: number;
  decisionCooldown: number;
}

export type AIAction = 'idle' | 'move' | 'attack' | 'block' | 'dodge' | 'ultimate';

export interface GameState {
  player: FighterState;
  ai: AIState;
  currentLevel: number;
  isGameOver: boolean;
  isVictory: boolean;
  comboCount: number;
  lastHitTime: number;
}

export interface AttackData {
  position: Vector3;
  direction: Vector3;
  range: number;
  width: number;
  damage: number;
  knockback: number;
  stunDuration: number;
  isUltimate: boolean;
  startTime: number;
}

export interface ParticleEffect {
  id: string;
  type: 'hit' | 'block' | 'ultimate' | 'knockback';
  position: Vector3;
  startTime: number;
  duration: number;
  color: string;
}

export interface HitEffect {
  position: Vector3;
  type: 'hit' | 'block' | 'critical' | 'ultimate';
  timestamp: number;
}

export interface CameraShake {
  intensity: number;
  duration: number;
  startTime: number;
}

export interface InputState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  attack: boolean;
  block: boolean;
  dodge: boolean;
  ultimate: boolean;
  reset: boolean;
}

export interface GameConfig {
  PLAYER_SPEED: number;
  ATTACK_RANGE: number;
  ATTACK_WIDTH: number;
  ATTACK_DAMAGE: number;
  ATTACK_KNOCKBACK: number;
  ATTACK_COOLDOWN: number;
  ATTACK_DURATION: number;
  BLOCK_DAMAGE_REDUCTION: number;
  BLOCK_ENERGY_GAIN: number;
  DODGE_DISTANCE: number;
  DODGE_COOLDOWN: number;
  DODGE_DURATION: number;
  DODGE_INVINCIBLE_DURATION: number;
  ULTIMATE_DAMAGE: number;
  ULTIMATE_RANGE: number;
  ULTIMATE_KNOCKBACK: number;
  ULTIMATE_ENERGY_COST: number;
  ULTIMATE_DURATION: number;
  ULTIMATE_COOLDOWN: number;
  STUN_DURATION: number;
  STUN_ON_HIT: number;
  ENERGY_PER_HIT: number;
  ENERGY_PER_BLOCK: number;
  MAX_ENERGY: number;
  MAX_HP: number;
  ARENA_SIZE: number;
  ARENA_BOUNDARY_PADDING: number;
  AI_REACTION_TIME: number;
  AI_ATTACK_CHANCE: { easy: number; normal: number; hard: number };
  AI_BLOCK_CHANCE: { easy: number; normal: number; hard: number };
  AI_DODGE_CHANCE: { easy: number; normal: number; hard: number };
  AI_ULTIMATE_THRESHOLD: number;
}

export interface GameStats {
  highestLevel: number;
  totalWins: number;
  currentStreak: number;
  bestStreak: number;
}