/**
 * 🎮 游戏类型定义
 * 
 * 为 game-template 提供完整的 TypeScript 类型支持
 */

/**
 * 难度级别
 */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme'

/**
 * 难度配置
 */
export interface DifficultyConfig {
  /** 速度（像素/秒） */
  speed: number
  /** 分数倍率 */
  scoreMultiplier: number
  /** 初始长度 */
  initialLength: number
}

/**
 * 难度配置表
 */
export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { 
    speed: 150, 
    scoreMultiplier: 1.0, 
    initialLength: 4 
  },
  medium: { 
    speed: 200, 
    scoreMultiplier: 1.2, 
    initialLength: 4 
  },
  hard: { 
    speed: 300, 
    scoreMultiplier: 1.5, 
    initialLength: 5 
  },
  extreme: { 
    speed: 400, 
    scoreMultiplier: 2.0, 
    initialLength: 6 
  }
}

/**
 * 游戏配置接口
 */
export interface GameConfig {
  /** 难度级别 */
  difficulty: Difficulty
  /** 初始长度（3-10） */
  initialLength: number
  /** 移动速度（100-500 px/s） */
  speed: number
  /** 单元格大小（30-60 px） */
  cellSize: number
  /** 普通食物得分（1-100） */
  normalFoodScore: number
  /** 奖励食物得分（10-200） */
  bonusFoodScore: number
  /** 特殊食物得分（50-500） */
  specialFoodScore: number
  /** 启用动态难度调整 */
  enableDynamicDifficulty: boolean
  /** 自动暂停（失焦时） */
  autoPauseOnBlur: boolean
  /** 启用粒子效果 */
  enableParticles: boolean
  /** BGM 音量（0-1） */
  bgmVolume: number
  /** SFX 音量（0-1） */
  sfxVolume: number
  /** 全局静音 */
  muted: boolean
}

/**
 * 默认游戏配置
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  difficulty: 'medium',
  initialLength: 4,
  speed: 200,
  cellSize: 40,
  normalFoodScore: 10,
  bonusFoodScore: 50,
  specialFoodScore: 100,
  enableDynamicDifficulty: false,
  autoPauseOnBlur: true,
  enableParticles: true,
  bgmVolume: 0.7,
  sfxVolume: 0.8,
  muted: false
}

/**
 * 主题信息
 */
export interface ThemeInfo {
  themeId: string
  themeName: string
  themeVersion: string
}

/**
 * GTRS 数据结构
 */
export interface GTRSData {
  themeInfo: ThemeInfo
  resources: any[]
  config?: any
}
