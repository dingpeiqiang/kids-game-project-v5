/**
 * 游戏配置常量
 */

// 游戏代码枚举
export enum GAME_CODE {
  SNAKE = 'snake',
  PVZ = 'pvz',
  PLANE = 'plane',
  CHROMOSOME = 'chromosome'
}

// 游戏 ID 映射（从后端获取）
export const GAME_ID_MAP: Record<string, number> = {
  [GAME_CODE.SNAKE]: 1,
  [GAME_CODE.PVZ]: 2,
  [GAME_CODE.PLANE]: 3,
  [GAME_CODE.CHROMOSOME]: 4
}

// 难度配置
export const DIFFICULTY_CONFIGS = {
  easy: {
    speed: 3,
    scoreMultiplier: 1,
    obstacleCount: 0
  },
  medium: {
    speed: 5,
    scoreMultiplier: 1.5,
    obstacleCount: 3
  },
  hard: {
    speed: 8,
    scoreMultiplier: 2,
    obstacleCount: 6
  }
} as const

// 默认游戏配置
export const DEFAULT_GAME_CONFIG = {
  width: 1600,
  height: 900,
  cellSize: 50,
  difficulty: 'medium' as const,
  maxLevel: 10
}
