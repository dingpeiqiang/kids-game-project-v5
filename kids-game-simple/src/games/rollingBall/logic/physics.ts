import type { Ball, Vector3D, TrackSegment, TerrainType } from '../types';
import { PHYSICS_CONFIG } from '../config';

export function updateBall(ball: Ball, input: { left: boolean; right: boolean; forward: boolean; backward: boolean }, terrainType: TerrainType): void {
  let friction = PHYSICS_CONFIG.friction;
  
  switch (terrainType) {
    case 'ice':
      friction = PHYSICS_CONFIG.iceFriction;
      break;
    case 'sand':
      friction = PHYSICS_CONFIG.sandFriction;
      break;
  }

  const speedMultiplier = ball.isSpeedBoost ? 1.5 : 1;

  if (input.forward) {
    ball.velocity.x += PHYSICS_CONFIG.acceleration * speedMultiplier;
  }
  if (input.backward) {
    ball.velocity.x -= PHYSICS_CONFIG.acceleration * speedMultiplier;
  }
  if (input.left) {
    ball.velocity.z += PHYSICS_CONFIG.acceleration * speedMultiplier;
  }
  if (input.right) {
    ball.velocity.z -= PHYSICS_CONFIG.acceleration * speedMultiplier;
  }

  const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.z ** 2);
  if (speed > PHYSICS_CONFIG.maxSpeed) {
    ball.velocity.x = (ball.velocity.x / speed) * PHYSICS_CONFIG.maxSpeed;
    ball.velocity.z = (ball.velocity.z / speed) * PHYSICS_CONFIG.maxSpeed;
  }

  ball.velocity.x *= friction;
  ball.velocity.z *= friction;

  ball.position.x += ball.velocity.x;
  ball.position.z += ball.velocity.z;

  const rotationSpeed = speed * 0.3;
  if (ball.velocity.z !== 0) {
    ball.rotation.x += ball.velocity.z * rotationSpeed;
  }
  if (ball.velocity.x !== 0) {
    ball.rotation.z -= ball.velocity.x * rotationSpeed;
  }

  if (Math.abs(ball.velocity.x) < 0.01) ball.velocity.x = 0;
  if (Math.abs(ball.velocity.z) < 0.01) ball.velocity.z = 0;
}

export function checkTerrainCollision(ball: Ball, track: TrackSegment[]): TerrainType {
  for (const segment of track) {
    if (isPointInSegment(ball.position, segment)) {
      ball.position.y = segment.start.y + ball.radius;
      ball.velocity.y = 0;
      return segment.type;
    }
  }
  ball.velocity.y -= PHYSICS_CONFIG.gravity;
  ball.position.y += ball.velocity.y;
  return 'normal';
}

function isPointInSegment(point: Vector3D, segment: TrackSegment): boolean {
  const minX = Math.min(segment.start.x, segment.end.x) - segment.width / 2;
  const maxX = Math.max(segment.start.x, segment.end.x) + segment.width / 2;
  const minZ = Math.min(segment.start.z, segment.end.z) - segment.width / 2;
  const maxZ = Math.max(segment.start.z, segment.end.z) + segment.width / 2;
  
  return point.x >= minX && point.x <= maxX && point.z >= minZ && point.z <= maxZ;
}

export function checkCrystalCollision(ball: Ball, crystals: { position: Vector3D; collected: boolean; size: number }[]): number {
  let collectedCount = 0;
  for (const crystal of crystals) {
    if (!crystal.collected) {
      const dx = ball.position.x - crystal.position.x;
      const dz = ball.position.z - crystal.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < ball.radius + crystal.size) {
        crystal.collected = true;
        collectedCount++;
      }
    }
  }
  return collectedCount;
}

export function checkObstacleCollision(ball: Ball, obstacles: { position: Vector3D; size: Vector3D }[]): boolean {
  for (const obstacle of obstacles) {
    const dx = ball.position.x - obstacle.position.x;
    const dy = ball.position.y - obstacle.position.y;
    const dz = ball.position.z - obstacle.position.z;
    
    const halfSizeX = obstacle.size.x / 2;
    const halfSizeY = obstacle.size.y / 2;
    const halfSizeZ = obstacle.size.z / 2;

    if (Math.abs(dx) < ball.radius + halfSizeX &&
        Math.abs(dy) < ball.radius + halfSizeY &&
        Math.abs(dz) < ball.radius + halfSizeZ) {
      if (Math.abs(dx) > Math.abs(dz)) {
        ball.velocity.x *= -PHYSICS_CONFIG.bounce;
        ball.position.x = obstacle.position.x + (dx > 0 ? halfSizeX + ball.radius : -halfSizeX - ball.radius);
      } else {
        ball.velocity.z *= -PHYSICS_CONFIG.bounce;
        ball.position.z = obstacle.position.z + (dz > 0 ? halfSizeZ + ball.radius : -halfSizeZ - ball.radius);
      }
      return true;
    }
  }
  return false;
}

export function checkEndZone(ball: Ball, endPosition: Vector3D, radius: number = 3): boolean {
  const dx = ball.position.x - endPosition.x;
  const dz = ball.position.z - endPosition.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  return distance < radius + ball.radius;
}

export function updateObstacles(obstacles: { type: string; position: Vector3D; angle?: number; speed?: number; minX?: number; maxX?: number }[]): void {
  for (const obstacle of obstacles) {
    if (obstacle.type === 'pendulum') {
      obstacle.angle = (obstacle.angle || 0) + (obstacle.speed || 1) * 0.05;
    } else if (obstacle.type === 'moving') {
      const direction = obstacle.speed || 1;
      obstacle.position.x += direction * 0.1;
      if (obstacle.position.x > (obstacle.maxX || 5) || obstacle.position.x < (obstacle.minX || -5)) {
        obstacle.speed = -(obstacle.speed || 1);
      }
    }
  }
}
