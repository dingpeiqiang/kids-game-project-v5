/**
 * 游戏状态管理
 *
 * 📌 说明:
 *   这是游戏特定的状态管理
 *   可根据具体游戏扩展，但核心结构保持不变
 */
import { defineStore } from 'pinia'
import difficultyConfig from '@/config/difficulty.json'
import { useSettingsStore } from '@/stores/settings'

/**
 * 游戏状态
 */
export type GameStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'gameover'

/**
 * 难度级别
 */
export type DifficultyLevel = 'easy' | 'normal' | 'hard'

/**
 * 难度配置接口
 */
export interface Difficulty {
  id: string
  label: string
  description?: string
  gridCols: number
  gridRows: number
  speed: number
  scoreMultiplier: number
}

/**
 * 自定义游戏配置
 */
export interface CustomGameConfig {
  gridCols?: number
  gridRows?: number
  cellSize?: number
  speed?: number
  [key: string]: any
}

export const useGameStore = defineStore('game', {
  state: () => ({
    // 当前难度
    difficulty: 'normal' as DifficultyLevel,
    
    // 自定义配置
    customConfig: null as CustomGameConfig | null,
    
    // 游戏状态
    status: 'idle' as GameStatus,
    
    // 分数
    score: 0,
    
    // 最高分
    highScore: 0
  }),

  getters: {
    // 获取当前难度配置
    currentDifficultyConfig(): Difficulty {
      const config = difficultyConfig.difficulties.find(
        d => d.id === this.difficulty
      )
      return config || difficultyConfig.difficulties[1]
    },
    
    // 获取游戏网格配置
    gridConfig() {
      const diff = this.currentDifficultyConfig
      return {
        cols: diff.gridCols,
        rows: diff.gridRows
      }
    },
    
    // 获取合并后的游戏配置（customConfig > difficultyConfig）
    mergedConfig(): { gridCols: number; gridRows: number; speed: number } {
      const diff = this.currentDifficultyConfig
      return {
        gridCols: this.customConfig?.gridCols ?? diff.gridCols,
        gridRows: this.customConfig?.gridRows ?? diff.gridRows,
        speed: this.customConfig?.speed ?? diff.speed
      }
    },

    // 获取设置（代理到 settingsStore）
    settings() {
      const settingsStore = useSettingsStore()
      return settingsStore
    }
  },

  actions: {
    // 设置难度
    setDifficulty(difficulty: DifficultyLevel) {
      this.difficulty = difficulty
    },
    
    // 设置自定义配置
    setCustomConfig(config: CustomGameConfig) {
      this.customConfig = config
    },
    
    // 开始游戏
    startGame() {
      this.status = 'playing'
      this.score = 0
    },
    
    // 暂停游戏
    pauseGame() {
      this.status = 'paused'
    },
    
    // 恢复游戏
    resumeGame() {
      this.status = 'playing'
    },
    
    // 添加分数
    addScore(points: number) {
      const multiplier = this.currentDifficultyConfig.scoreMultiplier || 1
      this.score += Math.floor(points * multiplier)
      
      if (this.score > this.highScore) {
        this.highScore = this.score
        localStorage.setItem('highScore', this.highScore.toString())
      }
    },

    // 直接设置分数（由 GameScene 通过 game.events.emit('score') 触发）
    setScore(score: number) {
      this.score = score
      if (score > this.highScore) {
        this.highScore = score
        localStorage.setItem('highScore', this.highScore.toString())
      }
    },
    
    // 游戏结束
    endGame() {
      this.status = 'gameover'
    },
    
    // 重置游戏
    reset() {
      this.status = 'idle'
      this.score = 0
      this.customConfig = null
    },
    
    // 加载最高分
    loadHighScore() {
      const saved = localStorage.getItem('highScore')
      if (saved) {
        this.highScore = parseInt(saved, 10)
      }
    }
  }
})
