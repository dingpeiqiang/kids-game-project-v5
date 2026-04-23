import type { PlayerData } from '../types'

const KEYS = {
  coins: 'platform_coins',
  best: 'platform_best',
  todayGames: 'platform_today_games',
  todayDate: 'platform_today_date',
  doubleCard: 'platform_double_card',
  history: 'platform_history',
  loginDays: 'platform_login_days',
  lastLogin: 'platform_last_login',
  guideSkipped: 'platform_guide_skipped',
  items: 'platform_items', // 道具数据
}

export class StorageService {
  private data: PlayerData

  constructor() {
    const today = new Date().toDateString()
    const storedDate = localStorage.getItem(KEYS.todayDate) || ''

    // 每日重置
    if (storedDate !== today) {
      localStorage.setItem(KEYS.todayGames, '0')
      localStorage.setItem(KEYS.todayDate, today)
      // 每日登录奖励
      const lastLogin = localStorage.getItem(KEYS.lastLogin)
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      const loginDays = lastLogin === yesterday
        ? parseInt(localStorage.getItem(KEYS.loginDays) || '1') + 1
        : 1
      localStorage.setItem(KEYS.loginDays, String(loginDays))
      // 50%概率给双倍卡
      if (localStorage.getItem(KEYS.doubleCard) !== '1' && Math.random() < 0.5) {
        localStorage.setItem(KEYS.doubleCard, '1')
      }
      localStorage.setItem(KEYS.lastLogin, today)
    }

    this.data = {
      name: '玩家',
      coins: parseInt(localStorage.getItem(KEYS.coins) || '0'),
      bestScores: JSON.parse(localStorage.getItem(KEYS.best) || '{}'),
      todayGames: parseInt(localStorage.getItem(KEYS.todayGames) || '0'),
      todayDate: localStorage.getItem(KEYS.todayDate) || today,
      hasDoubleCard: localStorage.getItem(KEYS.doubleCard) === '1',
      playHistory: JSON.parse(localStorage.getItem(KEYS.history) || '[]'),
      loginDays: parseInt(localStorage.getItem(KEYS.loginDays) || '1'),
      lastLogin: localStorage.getItem(KEYS.lastLogin) || '',
      guideSkipped: JSON.parse(localStorage.getItem(KEYS.guideSkipped) || '{}'),
      items: JSON.parse(localStorage.getItem(KEYS.items) || '{}'), // 不再需要初始道具
    }
  }

  get = () => this.data

  updateBest(gameId: string, score: number) {
    const prev = this.data.bestScores[gameId] || 0
    if (score > prev) {
      this.data.bestScores[gameId] = score
      localStorage.setItem(KEYS.best, JSON.stringify(this.data.bestScores))
    }
  }

  addCoins(amount: number) {
    this.data.coins += amount
    localStorage.setItem(KEYS.coins, String(this.data.coins))
  }

  incrementGames() {
    this.data.todayGames++
    localStorage.setItem(KEYS.todayGames, String(this.data.todayGames))
  }

  useDoubleCard() {
    this.data.hasDoubleCard = false
    localStorage.setItem(KEYS.doubleCard, '0')
  }

  skipGuide(gameId: string) {
    this.data.guideSkipped[gameId] = true
    localStorage.setItem(KEYS.guideSkipped, JSON.stringify(this.data.guideSkipped))
  }

  resetGuide(gameId: string) {
    delete this.data.guideSkipped[gameId]
    localStorage.setItem(KEYS.guideSkipped, JSON.stringify(this.data.guideSkipped))
  }

  // 道具相关方法
  getItem(itemId: string): number {
    return this.data.items[itemId] || 0
  }

  addItem(itemId: string, count: number = 1) {
    this.data.items[itemId] = (this.data.items[itemId] || 0) + count
    localStorage.setItem(KEYS.items, JSON.stringify(this.data.items))
  }

  useItem(itemId: string): boolean {
    if (this.getItem(itemId) > 0) {
      this.data.items[itemId]--
      localStorage.setItem(KEYS.items, JSON.stringify(this.data.items))
      return true
    }
    return false
  }

  buyItem(itemId: string, price: number): boolean {
    if (this.data.coins >= price) {
      this.data.coins -= price
      this.addItem(itemId)
      localStorage.setItem(KEYS.coins, String(this.data.coins))
      return true
    }
    return false
  }
}

export const storageService = new StorageService()
