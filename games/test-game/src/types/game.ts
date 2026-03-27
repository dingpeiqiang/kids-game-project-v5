/**
 * 🎮 test-game 游戏类型定义
 */

export type Difficulty = 'easy' | 'normal' | 'hard'

export interface DifficultyConfig {
  name: string
  nameCN: string
  speed: number
  scoreMultiplier: number
  color: string
  description: string
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    name: 'easy',
    nameCN: '简单',
    speed: 150,
    scoreMultiplier: 1,
    color: '#4ade80',
    description: '适合小朋友入门，速度慢，奖励多'
  },
  normal: {
    name: 'normal',
    nameCN: '普通',
    speed: 250,
    scoreMultiplier: 1.5,
    color: '#fbbf24',
    description: '标准挑战，速度与乐趣并存'
  },
  hard: {
    name: 'hard',
    nameCN: '困难',
    speed: 350,
    scoreMultiplier: 2,
    color: '#f87171',
    description: '高手专属，超快反应挑战'
  }
}

export interface GameState {
  isPlaying: boolean
  isPaused: boolean
  isGameOver: boolean
  score: number
  highScore: number
  playCount: number
  difficulty: Difficulty
}
