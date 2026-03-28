/**
 * 🎮 贪吃蛇游戏类型定义
 * 
 * 本文件包含贪吃蛇游戏特有的类型定义
 * 通用类型定义见 game-base.types.ts
 */

// ============================================================================
// 通用类型（可抽到框架层）
// ============================================================================

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface DifficultyConfig {
  name: string
  nameCN: string
  speed: number
  /** 蛇初始长度 */
  initialLength: number
  scoreMultiplier: number
  rareFoodChance: number
  color: string
  description: string
}

export interface GameState {
  isPlaying: boolean
  isPaused: boolean
  isGameOver: boolean
  score: number
  highScore: number
  playCount: number
  difficulty: Difficulty
  snakeLength: number
}

export interface Position {
  x: number  // 👉 像素坐标（可以是小数，例如 123.456）
  y: number  // 👉 像素坐标（可以是小数）
}

export interface Food {
  position: Position
  type: 'apple' | 'banana' | 'cherry' | 'coin'
  score: number
  color: string
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

// ============================================================================
// 贪吃蛇特定配置
// ============================================================================

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    name: 'easy',
    nameCN: '简单',
    speed: 150,       // 👉 像素/秒
    initialLength: 3, // 简单模式蛇稍短
    scoreMultiplier: 1,
    rareFoodChance: 0.5,
    color: '#4ade80',
    description: '适合小朋友入门，速度慢，奖励多'
  },
  medium: {
    name: 'medium',
    nameCN: '中等',
    speed: 250,       // 👉 像素/秒
    initialLength: 4,
    scoreMultiplier: 1.5,
    rareFoodChance: 0.3,
    color: '#fbbf24',
    description: '标准挑战，速度与激情并存'
  },
  hard: {
    name: 'hard',
    nameCN: '困难',
    speed: 350,       // 👉 像素/秒
    initialLength: 5, // 困难模式蛇更长，一开始就刺激
    scoreMultiplier: 2,
    rareFoodChance: 0.2,
    color: '#f87171',
    description: '高手专属，超快反应挑战'
  }
}

// 食物类型配置（贪吃蛇特定）
export const FOOD_TYPES = {
  apple: { score: 10, color: '#ef4444', chance: 0.7 },
  banana: { score: 20, color: '#fbbf24', chance: 0.15 },
  cherry: { score: 30, color: '#ef4444', chance: 0.1 },
  coin: { score: 50, color: '#fbbf24', chance: 0.05 }
}
