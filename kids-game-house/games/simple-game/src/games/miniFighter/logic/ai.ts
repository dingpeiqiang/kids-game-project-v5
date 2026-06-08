import { GAME_CONFIG, LEVEL_CONFIG } from '../config';
import type { AIState, FighterState, AIAction, Vector3 } from '../types';
import { distanceBetween, normalizeVector } from './combat';

export function updateAI(ai: AIState, player: FighterState, deltaTime: number): { action: AIAction; direction?: Vector3 } {
  const now = Date.now();
  
  if (ai.stunUntil > now) {
    return { action: 'idle' };
  }

  ai.decisionCooldown -= deltaTime;
  ai.actionTimer -= deltaTime;

  if (ai.decisionCooldown <= 0) {
    ai.decisionCooldown = GAME_CONFIG.AI_REACTION_TIME / (ai.difficulty === 'hard' ? 1.5 : ai.difficulty === 'normal' ? 1.2 : 1);
    return decideAction(ai, player);
  }

  if (ai.actionTimer <= 0) {
    return decideAction(ai, player);
  }

  return { action: ai.currentAction };
}

function decideAction(ai: AIState, player: FighterState): { action: AIAction; direction?: Vector3 } {
  const distance = distanceBetween(ai.position, player.position);
  const config = GAME_CONFIG;
  
  const canAttack = ai.attackCooldown <= 0;
  const canDodge = ai.dodgeCooldown <= 0 && !ai.isDodging;
  const canUltimate = ai.energy >= config.ULTIMATE_ENERGY_COST;
  
  const attackChance = config.AI_ATTACK_CHANCE[ai.difficulty];
  const blockChance = config.AI_BLOCK_CHANCE[ai.difficulty];
  const dodgeChance = config.AI_DODGE_CHANCE[ai.difficulty];

  const attackRange = config.ATTACK_RANGE + 0.5;
  
  if (canUltimate && ai.difficulty !== 'easy' && Math.random() < config.AI_ULTIMATE_THRESHOLD) {
    ai.currentAction = 'ultimate';
    ai.actionTimer = config.ULTIMATE_DURATION;
    return { action: 'ultimate' };
  }

  if (distance < attackRange && canAttack && Math.random() < attackChance) {
    ai.currentAction = 'attack';
    ai.actionTimer = config.ATTACK_DURATION;
    return { action: 'attack' };
  }

  if (ai.difficulty !== 'easy' && player.isAttacking && canDodge && Math.random() < dodgeChance) {
    const dodgeDir = normalizeVector({
      x: ai.position.x - player.position.x,
      y: 0,
      z: ai.position.z - player.position.z,
    });
    ai.currentAction = 'dodge';
    ai.actionTimer = config.DODGE_DURATION;
    return { action: 'dodge', direction: dodgeDir };
  }

  if (ai.difficulty !== 'easy' && distance < attackRange && canAttack && Math.random() < blockChance) {
    ai.currentAction = 'block';
    ai.actionTimer = 1000;
    return { action: 'block' };
  }

  if (distance > attackRange || (distance < attackRange && !canAttack)) {
    const moveDir = normalizeVector({
      x: player.position.x - ai.position.x,
      y: 0,
      z: player.position.z - ai.position.z,
    });
    ai.currentAction = 'move';
    ai.actionTimer = 500 + Math.random() * 500;
    return { action: 'move', direction: moveDir };
  }

  ai.currentAction = 'idle';
  ai.actionTimer = 200 + Math.random() * 300;
  return { action: 'idle' };
}

export function createAIState(level: number): AIState {
  const levelConfig = LEVEL_CONFIG[Math.min(level - 1, LEVEL_CONFIG.length - 1)];
  const config = GAME_CONFIG;
  
  return {
    hp: config.MAX_HP,
    maxHp: config.MAX_HP,
    energy: 0,
    maxEnergy: config.MAX_ENERGY,
    isBlocking: false,
    isAttacking: false,
    isDodging: false,
    isStunned: false,
    attackCooldown: 0,
    dodgeCooldown: 0,
    invincibleUntil: 0,
    position: { x: 3, y: 1, z: 0 },
    rotation: Math.PI,
    velocity: { x: 0, y: 0, z: 0 },
    stunUntil: 0,
    difficulty: levelConfig.difficulty,
    currentAction: 'idle',
    actionTimer: 0,
    decisionCooldown: 0,
  };
}

export function createPlayerState(): FighterState {
  const config = GAME_CONFIG;
  return {
    hp: config.MAX_HP,
    maxHp: config.MAX_HP,
    energy: 0,
    maxEnergy: config.MAX_ENERGY,
    isBlocking: false,
    isAttacking: false,
    isDodging: false,
    isStunned: false,
    attackCooldown: 0,
    dodgeCooldown: 0,
    invincibleUntil: 0,
    position: { x: -3, y: 1, z: 0 },
    rotation: 0,
    velocity: { x: 0, y: 0, z: 0 },
    stunUntil: 0,
  };
}