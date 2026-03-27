/**
 * 💾【可复用组件】存档系统
 *
 * 封装本地存储功能，支持：
 * - 游戏存档
 * - 设置保存
 * - 历史记录
 */

/**
 * 存档数据
 */
export interface SaveData {
  /** 存档 key */
  key: string
  /** 存档数据 */
  data: any
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
}

/**
 * 游戏存档
 */
export interface GameSave {
  /** 存档 ID */
  id: string
  /** 存档名称 */
  name: string
  /** 当前分数 */
  score: number
  /** 当前等级/关卡 */
  level: number
  /** 游戏状态 */
  gameState: any
  /** 游戏时间（毫秒） */
  playTime: number
  /** 创建时间 */
  createdAt: number
}

/**
 * ⭐ 存档系统
 *
 * @example
 * const save = new SaveSystem('my-game')
 *
 * // 保存游戏
 * save.saveGame({
 *   id: 'save_1',
 *   name: '存档1',
 *   score: 1000,
 *   level: 5,
 *   gameState: { ... },
 *   playTime: 60000
 * })
 *
 * // 加载游戏
 * const data = save.loadGame('save_1')
 *
 * // 保存设置
 * save.setSettings({ sound: true, difficulty: 'easy' })
 */
export class SaveSystem {
  private gameCode: string
  private prefix: string

  constructor(gameCode: string) {
    this.gameCode = gameCode
    this.prefix = `kidsgame_${gameCode}_`
  }

  // ============================================================================
  // 💾 游戏存档
  // ============================================================================

  /**
   * ⭐ 保存游戏
   */
  saveGame(save: GameSave): void {
    const key = `${this.prefix}save_${save.id}`
    const data: SaveData = {
      key: save.id,
      data: save,
      createdAt: save.createdAt || Date.now(),
      updatedAt: Date.now()
    }
    localStorage.setItem(key, JSON.stringify(data))
  }

  /**
   * ⭐ 加载游戏存档
   */
  loadGame(saveId: string): GameSave | null {
    const key = `${this.prefix}save_${saveId}`
    const json = localStorage.getItem(key)
    if (!json) return null

    try {
      const data: SaveData = JSON.parse(json)
      return data.data as GameSave
    } catch {
      return null
    }
  }

  /**
   * ⭐ 获取所有存档列表
   */
  getAllSaves(): GameSave[] {
    const saves: GameSave[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(`${this.prefix}save_`)) {
        try {
          const json = localStorage.getItem(key)
          if (json) {
            const data: SaveData = JSON.parse(json)
            saves.push(data.data as GameSave)
          }
        } catch {
          // 忽略无效数据
        }
      }
    }
    return saves.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /**
   * ⭐ 删除存档
   */
  deleteSave(saveId: string): boolean {
    const key = `${this.prefix}save_${saveId}`
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key)
      return true
    }
    return false
  }

  // ============================================================================
  // ⚙️ 设置
  // ============================================================================

  /**
   * ⭐ 保存设置
   */
  setSettings(settings: Record<string, any>): void {
    const key = `${this.prefix}settings`
    localStorage.setItem(key, JSON.stringify(settings))
  }

  /**
   * ⭐ 加载设置
   */
  getSettings<T = Record<string, any>>(): T | null {
    const key = `${this.prefix}settings`
    const json = localStorage.getItem(key)
    if (!json) return null

    try {
      return JSON.parse(json) as T
    } catch {
      return null
    }
  }

  /**
   * ⭐ 更新单个设置
   */
  updateSetting(key: string, value: any): void {
    const settings = this.getSettings() || {}
    settings[key] = value
    this.setSettings(settings)
  }

  // ============================================================================
  // 📊 历史记录
  // ============================================================================

  /**
   * ⭐ 保存最高分
   */
  saveHighScore(score: number): void {
    const key = `${this.prefix}highscore`
    const current = this.getHighScore()
    if (score > current) {
      localStorage.setItem(key, JSON.stringify({
        score,
        achievedAt: Date.now()
      }))
    }
  }

  /**
   * ⭐ 获取最高分
   */
  getHighScore(): number {
    const key = `${this.prefix}highscore`
    const json = localStorage.getItem(key)
    if (!json) return 0

    try {
      const data = JSON.parse(json)
      return data.score || 0
    } catch {
      return 0
    }
  }

  /**
   * ⭐ 保存游戏统计
   */
  saveStats(stats: {
    totalPlays: number
    totalPlayTime: number
    totalScore: number
  }): void {
    const key = `${this.prefix}stats`
    localStorage.setItem(key, JSON.stringify({
      ...stats,
      lastPlayedAt: Date.now()
    }))
  }

  /**
   * ⭐ 获取游戏统计
   */
  getStats(): {
    totalPlays: number
    totalPlayTime: number
    totalScore: number
    lastPlayedAt: number
  } | null {
    const key = `${this.prefix}stats`
    const json = localStorage.getItem(key)
    if (!json) return null

    try {
      return JSON.parse(json)
    } catch {
      return null
    }
  }

  // ============================================================================
  // 🧹 清理
  // ============================================================================

  /**
   * ⭐ 清除所有存档
   */
  clearAll(): void {
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
