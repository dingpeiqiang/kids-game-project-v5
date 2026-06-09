import type { Obstacle, Collectible } from './types';

export interface Bounds {
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
}

export function checkCollision(player: Bounds, obstacle: Obstacle): boolean {
  const playerHalfWidth = player.size.width / 2;
  const playerHalfHeight = player.size.height / 2;
  const playerHalfDepth = player.size.depth / 2;
  
  const obstacleHalfWidth = obstacle.size.width / 2;
  const obstacleHalfHeight = obstacle.size.height / 2;
  const obstacleHalfDepth = obstacle.size.depth / 2;

  return (
    player.position.x - playerHalfWidth < obstacle.position.x + obstacleHalfWidth &&
    player.position.x + playerHalfWidth > obstacle.position.x - obstacleHalfWidth &&
    player.position.y - playerHalfHeight < obstacle.position.y + obstacleHalfHeight &&
    player.position.y + playerHalfHeight > obstacle.position.y - obstacleHalfHeight &&
    player.position.z - playerHalfDepth < obstacle.position.z + obstacleHalfDepth &&
    player.position.z + playerHalfDepth > obstacle.position.z - obstacleHalfDepth
  );
}

export function checkCollectibleCollision(player: Bounds, collectible: Collectible): boolean {
  const distance = Math.sqrt(
    Math.pow(player.position.x - collectible.position.x, 2) +
    Math.pow(player.position.y - collectible.position.y, 2) +
    Math.pow(player.position.z - collectible.position.z, 2)
  );
  return distance < 1.5;
}

export function checkFall(player: Bounds, trackHeight: number): boolean {
  return player.position.y < trackHeight - 2;
}