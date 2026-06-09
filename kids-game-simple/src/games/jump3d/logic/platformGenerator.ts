import { GAME_CONFIG } from '../config';
import { Platform, Vector3 } from '../types';

let platformIdCounter = 0;

export function generatePlatform(lastPlatform: Platform | null, score: number): Platform {
  let spacingMultiplier: number;
  let obstacleChance: number;
  let movingChance: number;
  
  if (score < GAME_CONFIG.DIFFICULTY.EASY_THRESHOLD) {
    spacingMultiplier = GAME_CONFIG.DIFFICULTY.EASY_SPACING_MULTIPLIER;
    obstacleChance = GAME_CONFIG.DIFFICULTY.OBSTACLE_CHANCE_EASY;
    movingChance = GAME_CONFIG.DIFFICULTY.MOVING_PLATFORM_CHANCE_EASY;
  } else if (score < GAME_CONFIG.DIFFICULTY.MEDIUM_THRESHOLD) {
    spacingMultiplier = GAME_CONFIG.DIFFICULTY.MEDIUM_SPACING_MULTIPLIER;
    obstacleChance = GAME_CONFIG.DIFFICULTY.OBSTACLE_CHANCE_MEDIUM;
    movingChance = GAME_CONFIG.DIFFICULTY.MOVING_PLATFORM_CHANCE_MEDIUM;
  } else {
    spacingMultiplier = GAME_CONFIG.DIFFICULTY.HARD_SPACING_MULTIPLIER;
    obstacleChance = GAME_CONFIG.DIFFICULTY.OBSTACLE_CHANCE_HARD;
    movingChance = GAME_CONFIG.DIFFICULTY.MOVING_PLATFORM_CHANCE_HARD;
  }
  
  const baseSpacing = GAME_CONFIG.PLATFORM.BASE_SPACING * spacingMultiplier;
  const spacing = baseSpacing + (Math.random() - 0.5) * 1.5;
  
  let platformType: 'normal' | 'moving' | 'special' = 'normal';
  if (Math.random() < movingChance) {
    platformType = 'moving';
  } else if (score >= GAME_CONFIG.DIFFICULTY.MEDIUM_THRESHOLD && Math.random() < 0.1) {
    platformType = 'special';
  }
  
  const width = GAME_CONFIG.PLATFORM.BASE_WIDTH + (Math.random() - 0.5) * 0.6;
  const heightVariance = (Math.random() - 0.5) * GAME_CONFIG.PLATFORM.HEIGHT_VARIANCE;
  
  const position: Vector3 = {
    x: lastPlatform ? lastPlatform.position.x + (Math.random() - 0.5) * 1.5 : 0,
    y: lastPlatform ? lastPlatform.position.y + heightVariance : 0,
    z: lastPlatform ? lastPlatform.position.z + spacing : GAME_CONFIG.PLATFORM.BASE_SPACING,
  };
  
  const hasObstacle = Math.random() < obstacleChance && platformType !== 'moving';
  
  return {
    id: platformIdCounter++,
    position,
    width: Math.max(width, GAME_CONFIG.PLATFORM.MIN_WIDTH),
    depth: GAME_CONFIG.PLATFORM.DEPTH,
    height: GAME_CONFIG.PLATFORM.HEIGHT,
    rotation: (Math.random() - 0.5) * GAME_CONFIG.PLATFORM.ROTATION_VARIANCE,
    type: platformType,
    hasObstacle,
    obstaclePosition: hasObstacle ? {
      x: position.x + (Math.random() - 0.5) * (width / 2 - 0.3),
      y: position.y + GAME_CONFIG.PLATFORM.HEIGHT + 0.2,
      z: position.z + (Math.random() - 0.5) * (GAME_CONFIG.PLATFORM.DEPTH / 2 - 0.3),
    } : undefined,
  };
}

export function generateInitialPlatforms(count: number): Platform[] {
  const platforms: Platform[] = [];
  
  let lastPlatform: Platform | null = null;
  
  for (let i = 0; i < count; i++) {
    const platform = generatePlatform(lastPlatform, 0);
    if (i === 0) {
      platform.position = { x: 0, y: 0, z: 0 };
      platform.width = GAME_CONFIG.PLATFORM.BASE_WIDTH * 1.5;
      platform.type = 'normal';
      platform.hasObstacle = false;
    }
    platforms.push(platform);
    lastPlatform = platform;
  }
  
  return platforms;
}

export function cleanupOldPlatforms(platforms: Platform[], currentIndex: number): Platform[] {
  const keepCount = GAME_CONFIG.PLATFORM.MAX_ACTIVE;
  const startIndex = Math.max(0, currentIndex - 2);
  
  return platforms.slice(startIndex, startIndex + keepCount);
}

export function updateMovingPlatforms(platforms: Platform[], time: number): void {
  platforms.forEach(platform => {
    if (platform.type === 'moving') {
      platform.position.x = Math.sin(time * 0.002 + platform.id) * 0.8;
    }
  });
}
