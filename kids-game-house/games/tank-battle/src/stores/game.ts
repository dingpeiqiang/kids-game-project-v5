import { defineStore } from 'pinia'

interface GameState {
  status: 'idle' | 'playing' | 'paused' | 'gameover' | 'victory'
  score: number
  lives: number
  level: number
  isGameOver: boolean
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    status: 'idle',
    score: 0,
    lives: 3,
    level: 1,
    isGameOver: false,
  }),

  getters: {
    getStatus: (state) => state.status,
    getScore: (state) => state.score,
    getLives: (state) => state.lives,
    getLevel: (state) => state.level,
  },

  actions: {
    setStatus(status: GameState['status']) {
      this.status = status
    },

    addScore(points: number) {
      this.score += points
    },

    loseLife() {
      if (this.lives <= 0) return
      this.lives--
      if (this.lives <= 0) {
        this.setGameOver(true)
      }
    },

    nextLevel() {
      this.level++
    },

    setGameOver(isOver: boolean) {
      this.isGameOver = isOver
      if (isOver) {
        this.status = 'gameover'
      }
    },

    reset() {
      this.status = 'idle'
      this.score = 0
      this.lives = 3
      this.level = 1
      this.isGameOver = false
    },
  },
})
