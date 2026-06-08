import { Block } from '../types';
import { BLOCK_SIZE, PLAYER_WIDTH, PLAYER_HEIGHT } from '../config';

export interface AABB {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export function createBlockAABB(block: Block): AABB {
  return {
    minX: block.x * BLOCK_SIZE,
    minY: block.y * BLOCK_SIZE,
    minZ: block.z * BLOCK_SIZE,
    maxX: (block.x + 1) * BLOCK_SIZE,
    maxY: (block.y + 1) * BLOCK_SIZE,
    maxZ: (block.z + 1) * BLOCK_SIZE,
  };
}

export function createPlayerAABB(x: number, y: number, z: number): AABB {
  const halfWidth = PLAYER_WIDTH / 2;
  return {
    minX: x - halfWidth,
    minY: y,
    minZ: z - halfWidth,
    maxX: x + halfWidth,
    maxY: y + PLAYER_HEIGHT,
    maxZ: z + halfWidth,
  };
}

export function checkAABBCollision(a: AABB, b: AABB): boolean {
  return (
    a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minY < b.maxY &&
    a.maxY > b.minY &&
    a.minZ < b.maxZ &&
    a.maxZ > b.minZ
  );
}

export function checkPlayerCollision(
  playerX: number,
  playerY: number,
  playerZ: number,
  blocks: Map<string, Block>
): { collision: boolean; collisionY: boolean } {
  const playerAABB = createPlayerAABB(playerX, playerY, playerZ);
  let collision = false;
  let collisionY = false;

  const minX = Math.floor(playerAABB.minX / BLOCK_SIZE) - 1;
  const maxX = Math.floor(playerAABB.maxX / BLOCK_SIZE) + 1;
  const minY = Math.floor(playerAABB.minY / BLOCK_SIZE) - 1;
  const maxY = Math.floor(playerAABB.maxY / BLOCK_SIZE) + 1;
  const minZ = Math.floor(playerAABB.minZ / BLOCK_SIZE) - 1;
  const maxZ = Math.floor(playerAABB.maxZ / BLOCK_SIZE) + 1;

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        const key = `${x},${y},${z}`;
        const block = blocks.get(key);
        if (block) {
          const blockAABB = createBlockAABB(block);
          if (checkAABBCollision(playerAABB, blockAABB)) {
            collision = true;
            const playerCenterY = (playerAABB.minY + playerAABB.maxY) / 2;
            const blockCenterY = (blockAABB.minY + blockAABB.maxY) / 2;
            if (Math.abs(playerCenterY - blockCenterY) > PLAYER_WIDTH) {
              collisionY = true;
            }
          }
        }
      }
    }
  }

  return { collision, collisionY };
}

export function resolvePlayerCollision(
  playerX: number,
  playerY: number,
  playerZ: number,
  velocityX: number,
  velocityY: number,
  velocityZ: number,
  blocks: Map<string, Block>
): { x: number; y: number; z: number; velocityX: number; velocityY: number; velocityZ: number; isGrounded: boolean } {
  let newX = playerX;
  let newY = playerY;
  let newZ = playerZ;
  let newVelX = velocityX;
  let newVelY = velocityY;
  let newVelZ = velocityZ;
  let isGrounded = false;

  const stepSize = 0.2;
  const stepsX = Math.ceil(Math.abs(velocityX) / stepSize) || 1;
  const stepsY = Math.ceil(Math.abs(velocityY) / stepSize) || 1;
  const stepsZ = Math.ceil(Math.abs(velocityZ) / stepSize) || 1;
  const maxSteps = Math.max(stepsX, stepsY, stepsZ);

  for (let step = 0; step < maxSteps; step++) {
    const t = step / maxSteps;
    const dx = velocityX * t - (newX - playerX);
    const dy = velocityY * t - (newY - playerY);
    const dz = velocityZ * t - (newZ - playerZ);

    const testX = newX + dx;
    const testY = newY + dy;
    const testZ = newZ + dz;

    const result = checkPlayerCollision(testX, testY, testZ, blocks);
    
    if (result.collision) {
      if (Math.abs(dx) > 0.001) {
        newVelX = 0;
        newX = dx > 0 ? Math.floor(newX + PLAYER_WIDTH / 2) - PLAYER_WIDTH / 2 : Math.ceil(newX - PLAYER_WIDTH / 2) + PLAYER_WIDTH / 2;
      }
      if (Math.abs(dz) > 0.001) {
        newVelZ = 0;
        newZ = dz > 0 ? Math.floor(newZ + PLAYER_WIDTH / 2) - PLAYER_WIDTH / 2 : Math.ceil(newZ - PLAYER_WIDTH / 2) + PLAYER_WIDTH / 2;
      }
      if (result.collisionY) {
        if (dy < 0) {
          isGrounded = true;
          newVelY = 0;
          newY = Math.ceil(newY);
        } else if (dy > 0) {
          newVelY = 0;
          newY = Math.floor(newY + PLAYER_HEIGHT) - PLAYER_HEIGHT;
        }
      }
    } else {
      newX = testX;
      newY = testY;
      newZ = testZ;
    }
  }

  return { x: newX, y: newY, z: newZ, velocityX: newVelX, velocityY: newVelY, velocityZ: newVelZ, isGrounded };
}