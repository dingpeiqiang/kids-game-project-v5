import { GAME_CONFIG } from '../config';
import { PlayerState, Platform, LandingResult, Vector3 } from '../types';

export function calculateJumpVelocity(chargeTime: number): Vector3 {
  const chargeRatio = Math.min(chargeTime / GAME_CONFIG.PLAYER.CHARGE_DURATION, 1);
  const velocity = GAME_CONFIG.PLAYER.MIN_VELOCITY + 
    (GAME_CONFIG.PLAYER.MAX_VELOCITY - GAME_CONFIG.PLAYER.MIN_VELOCITY) * chargeRatio;
  
  return { x: 0, y: velocity * 0.8, z: velocity };
}

export function updatePlayerPhysics(player: PlayerState, deltaTime: number): void {
  if (player.isJumping) {
    player.velocity.y += GAME_CONFIG.PLAYER.GRAVITY;
    
    player.position.x += player.velocity.x;
    player.position.y += player.velocity.y;
    player.position.z += player.velocity.z;
    
    if (player.position.y <= GAME_CONFIG.WORLD.FALL_THRESHOLD) {
      player.isJumping = false;
      player.isGrounded = false;
    }
  }
  
  if (player.isGrounded && !player.isJumping) {
    player.scale = GAME_CONFIG.PLAYER.IDLE_SCALE;
  }
}

export function checkLanding(player: PlayerState, platforms: Platform[]): LandingResult {
  if (!player.isJumping) {
    return { success: false, isPerfect: false, isEdge: false, platformIndex: -1 };
  }
  
  const playerBottom = player.position.y - GAME_CONFIG.PLAYER.SIZE / 2;
  
  for (let i = player.currentPlatformIndex + 1; i < platforms.length; i++) {
    const platform = platforms[i];
    const platformTop = platform.position.y + platform.height;
    
    if (playerBottom <= platformTop + GAME_CONFIG.PLAYER.GROUND_THRESHOLD &&
        playerBottom >= platformTop - GAME_CONFIG.PLAYER.GROUND_THRESHOLD) {
      
      const dx = player.position.x - platform.position.x;
      const dz = player.position.z - platform.position.z;
      
      const halfWidth = platform.width / 2;
      const halfDepth = platform.depth / 2;
      
      if (Math.abs(dx) <= halfWidth && Math.abs(dz) <= halfDepth) {
        const distFromCenter = Math.sqrt(dx * dx + dz * dz);
        const maxDist = Math.min(halfWidth, halfDepth);
        
        player.position.y = platformTop + GAME_CONFIG.PLAYER.SIZE / 2;
        player.isJumping = false;
        player.isGrounded = true;
        player.velocity = { x: 0, y: 0, z: 0 };
        player.currentPlatformIndex = i;
        player.scale = GAME_CONFIG.PLAYER.LANDING_SCALE;
        
        const perfectThreshold = maxDist * GAME_CONFIG.SCORE.PERFECT_THRESHOLD;
        const edgeThreshold = maxDist * (1 - GAME_CONFIG.SCORE.EDGE_THRESHOLD);
        
        return {
          success: true,
          isPerfect: distFromCenter <= perfectThreshold,
          isEdge: distFromCenter >= edgeThreshold,
          platformIndex: i,
        };
      }
    }
  }
  
  return { success: false, isPerfect: false, isEdge: false, platformIndex: -1 };
}

export function applyLandingBounce(player: PlayerState): void {
  setTimeout(() => {
    player.scale = GAME_CONFIG.PLAYER.IDLE_SCALE;
  }, 100);
}

export function isPlayerFalling(player: PlayerState): boolean {
  return player.isJumping && player.position.y <= GAME_CONFIG.WORLD.FALL_THRESHOLD;
}
