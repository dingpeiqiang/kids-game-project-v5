/**
 * 🎮 test-game 游戏状态管理
 */
import { defineStore } from 'pinia'
import type { Difficulty, GameState } from '@/types/game'

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    highScore: 0,
    playCount: 0,
    difficulty: 'normal' as Difficulty
  }),

  actions: {
    setDifficulty(difficulty: Difficulty) {
      this.difficulty = difficulty
    },

    startGame() {
      this.isPlaying = true
      this.isPaused = false
      this.isGameOver = false
      this.score = 0
    },

    endGame(finalScore: number) {
      this.isPlaying = false
      this.isGameOver = true
      this.score = finalScore
      
      // 更新最高分
      if (finalScore > this.highScore) {
        this.highScore = finalScore
      }
      
      // 增加游玩次数
      this.playCount++
    },

    pauseGame() {
      this.isPaused = true
    },

    resumeGame() {
      this.isPaused = false
    },

    loadFromLocalStorage() {
      const savedHighScore = localStorage.getItem('test-game-high-score')
      const savedPlayCount = localStorage.getItem('test-game-play-count')
      
      if (savedHighScore) {
        this.highScore = parseInt(savedHighScore, 10)
      }
      if (savedPlayCount) {
        this.playCount = parseInt(savedPlayCount, 10)
      }
    },

    saveToLocalStorage() {
      localStorage.setItem('test-game-high-score', String(this.highScore))
      localStorage.setItem('test-game-play-count', String(this.playCount))
    }
  }
})
