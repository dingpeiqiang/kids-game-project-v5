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

export interface GameState {
  isPlaying: boolean
  isPaused: boolean
  isGameOver: boolean
  score: number
  highScore: number
  playCount: number
  difficulty: Difficulty
}
