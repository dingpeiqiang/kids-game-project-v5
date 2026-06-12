import type { PlayerData, GameComment, GameComments } from '../types'

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
  comments: 'platform_comments', // 游戏评论
  favorites: 'platform_favorites', // 收藏列表
  dailyRewardCollected: 'platform_daily_reward_collected', // 签到奖励领取日期
  consecutiveLoginDays: 'platform_consecutive_login_days', // 连续登录天数
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
      
      // 计算连续登录天数
      const consecutiveLoginDays = lastLogin === yesterday
        ? parseInt(localStorage.getItem(KEYS.consecutiveLoginDays) || '1') + 1
        : 1
      localStorage.setItem(KEYS.consecutiveLoginDays, String(consecutiveLoginDays))
      
      // 50%概率给双倍卡
      if (localStorage.getItem(KEYS.doubleCard) !== '1' && Math.random() < 0.5) {
        localStorage.setItem(KEYS.doubleCard, '1')
      }
      localStorage.setItem(KEYS.lastLogin, today)
      // 重置每日签到奖励领取状态
      localStorage.setItem(KEYS.dailyRewardCollected, '')
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
      items: JSON.parse(localStorage.getItem(KEYS.items) || '{}'),
      favorites: JSON.parse(localStorage.getItem(KEYS.favorites) || '[]'),
      dailyRewardCollected: localStorage.getItem(KEYS.dailyRewardCollected) || '',
      consecutiveLoginDays: parseInt(localStorage.getItem(KEYS.consecutiveLoginDays) || '1'),
    }
  }

  get = () => this.data

  save(data: PlayerData) {
    this.data = data
    localStorage.setItem(KEYS.favorites, JSON.stringify(data.favorites))
    localStorage.setItem(KEYS.dailyRewardCollected, data.dailyRewardCollected)
    localStorage.setItem(KEYS.consecutiveLoginDays, String(data.consecutiveLoginDays))
    localStorage.setItem(KEYS.coins, String(data.coins))
  }

  // 签到奖励相关方法
  collectDailyReward(): { ok: boolean; msg: string; coins?: number } {
    const today = new Date().toDateString()
    if (this.data.dailyRewardCollected === today) {
      return { ok: false, msg: '今日已领取' }
    }

    const days = this.data.consecutiveLoginDays
    const baseCoins = 50
    const bonus = Math.min(days - 1, 6) * 10
    const coins = baseCoins + bonus

    this.data.dailyRewardCollected = today
    this.data.coins += coins

    localStorage.setItem(KEYS.dailyRewardCollected, today)
    localStorage.setItem(KEYS.coins, String(this.data.coins))

    return { ok: true, msg: `签到成功！获得 ${coins} 金币`, coins }
  }

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

  // 评论相关方法
  getComments(gameId: string): GameComment[] {
    const allComments: GameComments = JSON.parse(localStorage.getItem(KEYS.comments) || '{}')
    return allComments[gameId] || []
  }

  addComment(gameId: string, content: string, score: number, playerName: string): GameComment {
    const allComments: GameComments = JSON.parse(localStorage.getItem(KEYS.comments) || '{}')
    if (!allComments[gameId]) {
      allComments[gameId] = []
    }
    
    const comment: GameComment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      gameId,
      content,
      score,
      playerName,
      createdAt: Date.now()
    }
    
    allComments[gameId].unshift(comment)
    // 最多保留50条评论
    if (allComments[gameId].length > 50) {
      allComments[gameId] = allComments[gameId].slice(0, 50)
    }
    
    localStorage.setItem(KEYS.comments, JSON.stringify(allComments))
    return comment
  }

  getTotalComments(gameId: string): number {
    return this.getComments(gameId).length
  }

  getAverageScore(gameId: string): number {
    const comments = this.getComments(gameId)
    if (comments.length === 0) return 0
    const total = comments.reduce((sum, c) => sum + c.score, 0)
    return Math.round(total / comments.length * 10) / 10
  }
}

export const storageService = new StorageService()
