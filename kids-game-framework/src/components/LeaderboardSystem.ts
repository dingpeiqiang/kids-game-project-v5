/**
 * 🏆【可复用组件】排行榜系统
 *
 * 封装排行榜功能，支持：
 * - 本地排行榜
 * - 排行榜 UI 渲染
 * - 排名计算
 */

/**
 * 排行榜条目
 */
export interface LeaderboardEntry {
  /** 排名 */
  rank: number
  /** 玩家名称 */
  playerName: string
  /** 分数 */
  score: number
  /** 额外信息（如等级、时间） */
  extra?: string
  /** 是否是当前玩家 */
  isCurrentPlayer?: boolean
  /** 上榜时间 */
  timestamp?: number
}

/**
 * 排行榜配置
 */
export interface LeaderboardConfig {
  /** 排行榜维度（如：easy, medium, hard） */
  dimension: string
  /** 最大显示数量 */
  maxEntries?: number
  /** 是否只显示好友 */
  friendsOnly?: boolean
}

/**
 * ⭐ 排行榜系统
 *
 * @example
 * const leaderboard = new LeaderboardSystem('snake')
 *
 * // 提交分数
 * leaderboard.submitScore('玩家1', 1000, 'easy')
 *
 * // 获取排行榜
 * const list = leaderboard.getLeaderboard('easy')
 *
 * // 获取玩家排名
 * const rank = leaderboard.getPlayerRank('玩家1', 'easy')
 */
export class LeaderboardSystem {
  private gameCode: string
  private prefix: string

  constructor(gameCode: string) {
    this.gameCode = gameCode
    this.prefix = `kidsgame_${gameCode}_leaderboard_`
  }

  // ============================================================================
  // 🏆 分数提交
  // ============================================================================

  /**
   * ⭐ 提交分数
   */
  submitScore(playerName: string, score: number, dimension: string = 'all'): LeaderboardEntry {
    const key = `${this.prefix}${dimension}`
    const entries = this.loadEntries(key)

    // 添加新分数
    const entry: LeaderboardEntry = {
      rank: 0,
      playerName,
      score,
      timestamp: Date.now()
    }
    entries.push(entry)

    // 排序并更新排名
    entries.sort((a, b) => b.score - a.score)

    // 只保留前 N 名
    const maxEntries = 100
    const finalEntries = entries.slice(0, maxEntries).map((e, i) => ({
      ...e,
      rank: i + 1
    }))

    // 保存
    this.saveEntries(key, finalEntries)

    // 返回玩家排名
    const playerEntry = finalEntries.find(e => e.playerName === playerName && e.timestamp === entry.timestamp)
    return playerEntry || { rank: -1, playerName, score }
  }

  /**
   * ⭐ 获取排行榜
   */
  getLeaderboard(dimension: string = 'all', limit: number = 10): LeaderboardEntry[] {
    const key = `${this.prefix}${dimension}`
    const entries = this.loadEntries(key)
    return entries.slice(0, limit).map(e => ({
      ...e,
      isCurrentPlayer: e.playerName === this.getCurrentPlayerName()
    }))
  }

  /**
   * ⭐ 获取玩家排名
   */
  getPlayerRank(playerName: string, dimension: string = 'all'): number {
    const key = `${this.prefix}${dimension}`
    const entries = this.loadEntries(key)
    const entry = entries.find(e => e.playerName === playerName)
    return entry?.rank || -1
  }

  /**
   * ⭐ 检查是否上榜
   */
  isOnLeaderboard(score: number, dimension: string = 'all'): boolean {
    const key = `${this.prefix}${dimension}`
    const entries = this.loadEntries(key)

    // 如果未满，直接上榜
    if (entries.length < 10) return true

    // 如果比最后一名高，上榜
    const lowest = entries[entries.length - 1]
    return score > lowest.score
  }

  // ============================================================================
  // 💾 数据存储
  // ============================================================================

  private loadEntries(key: string): LeaderboardEntry[] {
    const json = localStorage.getItem(key)
    if (!json) return []

    try {
      return JSON.parse(json)
    } catch {
      return []
    }
  }

  private saveEntries(key: string, entries: LeaderboardEntry[]): void {
    localStorage.setItem(key, JSON.stringify(entries))
  }

  // ============================================================================
  // 🔧 工具方法
  // ============================================================================

  /**
   * ⭐ 获取玩家名称
   */
  private getCurrentPlayerName(): string {
    return localStorage.getItem('kidsgame_player_name') || '匿名玩家'
  }

  /**
   * ⭐ 设置玩家名称
   */
  setPlayerName(name: string): void {
    localStorage.setItem('kidsgame_player_name', name)
  }

  /**
   * ⭐ 清除排行榜
   */
  clearLeaderboard(dimension?: string): void {
    if (dimension) {
      localStorage.removeItem(`${this.prefix}${dimension}`)
    } else {
      // 清除所有维度
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
  }

  /**
   * ⭐ 获取我的排名信息
   */
  getMyRankInfo(dimension: string = 'all'): LeaderboardEntry | null {
    const playerName = this.getCurrentPlayerName()
    const rank = this.getPlayerRank(playerName, dimension)
    if (rank === -1) return null

    const list = this.getLeaderboard(dimension)
    return list[rank - 1] || null
  }
}
