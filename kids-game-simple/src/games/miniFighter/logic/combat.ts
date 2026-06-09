import { GAME_CONFIG } from '../config';
import type { FighterState, AttackData, Vector3 } from '../types';

export function createAttackData(attacker: FighterState, isUltimate: boolean): AttackData {
  const config = GAME_CONFIG;
  const direction = {
    x: Math.sin(attacker.rotation),
    y: 0,
    z: Math.cos(attacker.rotation),
  };

  return {
    position: { ...attacker.position },
    direction,
    range: isUltimate ? config.ULTIMATE_RANGE : config.ATTACK_RANGE,
    width: isUltimate ? config.ATTACK_WIDTH * 1.5 : config.ATTACK_WIDTH,
    damage: isUltimate ? config.ULTIMATE_DAMAGE : config.ATTACK_DAMAGE,
    knockback: isUltimate ? config.ULTIMATE_KNOCKBACK : config.ATTACK_KNOCKBACK,
    stunDuration: isUltimate ? config.STUN_ON_HIT * 2 : config.STUN_ON_HIT,
    isUltimate,
    startTime: Date.now(),
  };
}

export function checkAttackCollision(attack: AttackData, target: FighterState): boolean {
  const dx = target.position.x - attack.position.x;
  const dz = target.position.z - attack.position.z;
  
  const distance = Math.sqrt(dx * dx + dz * dz);
  if (distance > attack.range) return false;
  
  const dotProduct = (dx * attack.direction.x + dz * attack.direction.z) / distance;
  const angle = Math.acos(dotProduct);
  
  return angle < attack.width / 2;
}

export function applyDamage(attacker: FighterState, defender: FighterState, attack: AttackData): { hit: boolean; blocked: boolean; isUltimate: boolean } {
  const now = Date.now();
  
  if (defender.invincibleUntil > now) {
    return { hit: false, blocked: false, isUltimate: attack.isUltimate };
  }

  if (defender.isBlocking) {
    const reducedDamage = attack.damage * (1 - GAME_CONFIG.BLOCK_DAMAGE_REDUCTION);
    defender.hp = Math.max(0, defender.hp - reducedDamage);
    defender.energy = Math.min(defender.maxEnergy, defender.energy + GAME_CONFIG.BLOCK_ENERGY_GAIN);
    applyKnockback(defender, attack.direction, attack.knockback * 0.3);
    return { hit: true, blocked: true, isUltimate: attack.isUltimate };
  }

  defender.hp = Math.max(0, defender.hp - attack.damage);
  attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + GAME_CONFIG.ENERGY_PER_HIT);
  applyKnockback(defender, attack.direction, attack.knockback);
  defender.stunUntil = now + attack.stunDuration;
  defender.isStunned = true;
  
  return { hit: true, blocked: false, isUltimate: attack.isUltimate };
}

export function applyKnockback(target: FighterState, direction: Vector3, strength: number): void {
  target.velocity.x = direction.x * strength;
  target.velocity.z = direction.z * strength;
}

export function clampToArena(position: Vector3): Vector3 {
  const halfSize = GAME_CONFIG.ARENA_SIZE / 2 - GAME_CONFIG.ARENA_BOUNDARY_PADDING;
  return {
    x: Math.max(-halfSize, Math.min(halfSize, position.x)),
    y: position.y,
    z: Math.max(-halfSize, Math.min(halfSize, position.z)),
  };
}

export function distanceBetween(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function normalizeVector(v: Vector3): Vector3 {
  const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (length === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}