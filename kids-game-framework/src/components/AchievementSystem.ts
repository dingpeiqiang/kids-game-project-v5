/**
 * 🏅【可复用组件】成就系统
 *
 * 封装成就功能，支持：
 * - 成就定义
 * - 进度追踪
 * - 解锁检测
 * - 成就展示
 */

/**
 * 成就定义
 */
export interface Achievement {
  /** 成就 ID */
  id: string
  /** 成就名称 */
  name: string
  /** 成就描述 */
  description: string
  /** 图标 key */
  icon?: string
  /** 成就类型 */
  type: 'score' | 'play' | 'time' | 'custom'
  /** 目标值 */
  target: number
  /** 奖励（如有） */
  reward?: {
    points?: number
    badge?: string
  }
}

/**
 * 玩家成就进度
 */
export interface AchievementProgress {
  /** 成就 ID */
  id: string
  /** 当前进度 */
  current: number
  /** 是否已解锁 */
  unlocked: boolean
  /** 解锁时间 */
  unlockedAt?: number
}

/**
 * 成就解锁事件
 */
export interface AchievementUnlockedEvent {
  achievement: Achievement
  progress: AchievementProgress
}

/**
 * ⭐ 成就系统
 *
 * @example
 * const achievements = new AchievementSystem('snake')
 *
 * // 定义成就
 * achievements.define({
 *   id: 'first_play',
 *   name: '初出茅庐',
 *   description: '完成第一局游戏',
 *   type: 'play',
 *   target: 1
 * })
 *
 * achievements.define({
 *   id: 'score_1000',
 *   name: '高分选手',
 *   description: '单局得分达到 1000',
 *   type: 'score',
 *   target: 1000
 * })
 *
 * // 更新进度
 * achievements.updateProgress('play', 1)  // 完成一局
 * achievements.updateProgress('score', 1500)  // 获得 1500 分
 *
 * // 监听解锁
 * achievements.onUnlock((event) => {
 *   showAchievementPopup(event.achievement.name)
 * })
 */
export class AchievementSystem {
  private gameCode: string
  private achievements: Map<string, Achievement> = new Map()
  private progress: Map<string, AchievementProgress> = new Map()
  private prefix: string
  private onUnlockCallbacks: ((event: AchievementUnlockedEvent) => void)[] = []

  constructor(gameCode: string) {
    this.gameCode = gameCode
    this.prefix = `kidsgame_${gameCode}_achievement_`
    this.loadProgress()
  }

  // ============================================================================
  // 🏅 成就定义
  // ============================================================================

  /**
   * ⭐ 定义成就
   */
  define(achievement: Achievement): void {
    this.achievements.set(achievement.id, achievement)

    // 初始化进度（如果不存在）
    if (!this.progress.has(achievement.id)) {
      this.progress.set(achievement.id, {
        id: achievement.id,
        current: 0,
        unlocked: false
      })
    }
  }

  /**
   * ⭐ 批量定义成就
   */
  defineMany(achievements: Achievement[]): void {
    achievements.forEach(a => this.define(a))
  }

  // ============================================================================
  // 📊 进度更新
  // ============================================================================

  /**
   * ⭐ 更新进度
   */
  updateProgress(type: string, value: number): void {
    // 查找该类型的所有成就
    this.achievements.forEach(achievement => {
      if (achievement.type !== type && type !== 'custom') return

      const progress = this.progress.get(achievement.id)
      if (!progress || progress.unlocked) return

      // 更新进度
      const newProgress = Math.min(progress.current + value, achievement.target)
      progress.current = newProgress

      // 检查是否解锁
      if (newProgress >= achievement.target) {
        this.unlock(achievement.id)
      } else {
        this.saveProgress()
      }
    })
  }

  /**
   * ⭐ 直接设置进度（用于某些需要精确控制的场景）
   */
  setProgress(achievementId: string, value: number): void {
    const achievement = this.achievements.get(achievementId)
    if (!achievement) return

    const progress = this.progress.get(achievementId)
    if (!progress || progress.unlocked) return

    progress.current = Math.min(value, achievement.target)

    if (progress.current >= achievement.target) {
      this.unlock(achievementId)
    } else {
      this.saveProgress()
    }
  }

  /**
   * ⭐ 自定义成就检查（游戏逻辑中调用）
   */
  checkCustom(achievementId: string): boolean {
    const achievement = this.achievements.get(achievementId)
    if (!achievement || achievement.type !== 'custom') return false

    return this.unlock(achievementId)
  }

  // ============================================================================
  // 🔓 解锁处理
  // ============================================================================

  private unlock(achievementId: string): boolean {
    const achievement = this.achievements.get(achievementId)
    const progress = this.progress.get(achievementId)

    if (!achievement || !progress || progress.unlocked) return false

    // 解锁成就
    progress.unlocked = true
    progress.unlockedAt = Date.now()
    this.saveProgress()

    // 触发回调
    const event: AchievementUnlockedEvent = { achievement, progress }
    this.onUnlockCallbacks.forEach(cb => cb(event))

    console.log(`[Achievement] 🏅 解锁: ${achievement.name}`)

    return true
  }

  /**
   * ⭐ 监听成就解锁
   */
  onUnlock(callback: (event: AchievementUnlockedEvent) => void): void {
    this.onUnlockCallbacks.push(callback)
  }

  // ============================================================================
  // 📋 查询
  // ============================================================================

  /**
   * ⭐ 获取成就列表（含进度）
   */
  getAchievements(): (Achievement & AchievementProgress)[] {
    return Array.from(this.achievements.values()).map(achievement => {
      const progress = this.progress.get(achievement.id) || {
        id: achievement.id,
        current: 0,
        unlocked: false
      }
      return { ...achievement, ...progress }
    })
  }

  /**
   * ⭐ 获取已解锁成就
   */
  getUnlockedAchievements(): (Achievement & AchievementProgress)[] {
    return this.getAchievements().filter(a => a.unlocked)
  }

  /**
   * ⭐ 获取未解锁成就
   */
  getLockedAchievements(): (Achievement & AchievementProgress)[] {
    return this.getAchievements().filter(a => !a.unlocked)
  }

  /**
   * ⭐ 获取单个成就进度
   */
  getProgress(achievementId: string): AchievementProgress | null {
    return this.progress.get(achievementId) || null
  }

  /**
   * ⭐ 获取解锁数量
   */
  getUnlockedCount(): number {
    return this.getUnlockedAchievements().length
  }

  /**
   * ⭐ 获取总数
   */
  getTotalCount(): number {
    return this.achievements.size
  }

  // ============================================================================
  // 💾 数据存储
  // ============================================================================

  private loadProgress(): void {
    const key = `${this.prefix}progress`
    const json = localStorage.getItem(key)

    if (json) {
      try {
        const data = JSON.parse(json) as Record<string, AchievementProgress>
        Object.entries(data).forEach(([id, progress]) => {
          this.progress.set(id, progress)
        })
      } catch {
        // 忽略解析错误
      }
    }
  }

  private saveProgress(): void {
    const key = `${this.prefix}progress`
    const data: Record<string, AchievementProgress> = {}
    this.progress.forEach((progress, id) => {
      data[id] = progress
    })
    localStorage.setItem(key, JSON.stringify(data))
  }

  // ============================================================================
  // 🧹 清理
  // ============================================================================

  /**
   * ⭐ 重置所有成就
   */
  reset(): void {
    this.progress.clear()
    this.achievements.forEach(achievement => {
      this.progress.set(achievement.id, {
        id: achievement.id,
        current: 0,
        unlocked: false
      })
    })
    this.saveProgress()
  }
}
