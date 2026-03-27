/**
 * 🎮 游戏配置常量
 */

// ============================================================================
// 🎯 游戏代码枚举
// ============================================================================

export enum GAME_CODE {
  SNAKE = 'snake',
  PVZ = 'pvz',
  PLANE = 'plane',
  CHROMOSOME = 'chromosome'
}

// ============================================================================
// 📊 游戏 ID 映射（从后端获取）
// ============================================================================

export const GAME_ID_MAP: Record<string, number> = {
  [GAME_CODE.SNAKE]: 1,
  [GAME_CODE.PVZ]: 2,
  [GAME_CODE.PLANE]: 3,
  [GAME_CODE.CHROMOSOME]: 4
}

// ============================================================================
// 🎚️ 难度配置
// ============================================================================

export const DIFFICULTY_CONFIGS = {
  easy: {
    name: 'easy',
    nameCN: '简单',
    speed: 3,
    scoreMultiplier: 1,
    obstacleCount: 0
  },
  medium: {
    name: 'medium',
    nameCN: '中等',
    speed: 5,
    scoreMultiplier: 1.5,
    obstacleCount: 3
  },
  hard: {
    name: 'hard',
    nameCN: '困难',
    speed: 8,
    scoreMultiplier: 2,
    obstacleCount: 6
  }
} as const

// ============================================================================
// ⚙️ 默认游戏配置
// ============================================================================

export const DEFAULT_GAME_CONFIG = {
  width: 1600,
  height: 900,
  cellSize: 50,
  difficulty: 'medium' as const,
  maxLevel: 10
}

// ============================================================================
// 🎨 主题模式配置
// ============================================================================

export const THEME_MODE_CONFIG = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
} as const

// ============================================================================
// 🔊 音频配置
// ============================================================================

export const AUDIO_CONFIG = {
  defaultBgmVolume: 0.6,
  defaultSoundVolume: 0.8,
  minVolume: 0,
  maxVolume: 1
} as const
