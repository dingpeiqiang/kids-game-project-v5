/**
 * 📖【可复用组件】教学系统
 *
 * 封装新手引导功能，支持：
 * - 步骤式引导
 * - 高亮提示
 * - 动画演示
 * - 进度保存
 */

/**
 * 教学步骤
 */
export interface TutorialStep {
  /** 步骤 ID */
  id: string
  /** 显示文本 */
  text: string
  /** 目标元素选择器 */
  target?: string
  /** 位置（top/bottom/left/right） */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** 触发条件（点击/等待/自定义） */
  trigger?: 'click' | 'wait' | 'custom'
  /** 等待时间（毫秒） */
  waitTime?: number
  /** 是否显示跳过按钮 */
  showSkip?: boolean
}

/**
 * 教学配置
 */
export interface TutorialConfig {
  /** 教学 ID */
  id: string
  /** 教学名称 */
  name: string
  /** 步骤列表 */
  steps: TutorialStep[]
  /** 是否可以跳过 */
  skippable?: boolean
  /** 完成后回调 */
  onComplete?: () => void
  /** 跳过回调 */
  onSkip?: () => void
}

/**
 * ⭐ 教学系统
 *
 * @example
 * const tutorial = new TutorialSystem('my-game')
 *
 * // 定义教学
 * tutorial.define({
 *   id: 'basic',
 *   name: '基础操作',
 *   steps: [
 *     { id: '1', text: '欢迎！点击开始游戏', trigger: 'click' },
 *     { id: '2', text: '使用方向键控制移动', trigger: 'wait', waitTime: 3000 },
 *     { id: '3', text: '吃到食物得分', trigger: 'click' }
 *   ]
 * })
 *
 * // 开始教学
 * tutorial.start('basic')
 *
 * // 触发下一步
 * tutorial.next()
 */
export class TutorialSystem {
  private gameCode: string
  private tutorials: Map<string, TutorialConfig> = new Map()
  private currentTutorial: TutorialConfig | null = null
  private currentStepIndex: number = 0
  private prefix: string
  private onStepChange?: (step: TutorialStep, index: number) => void
  private waitTimer: ReturnType<typeof setTimeout> | null = null

  constructor(gameCode: string) {
    this.gameCode = gameCode
    this.prefix = `kidsgame_${gameCode}_tutorial_`
  }

  // ============================================================================
  // 📖 教学定义
  // ============================================================================

  /**
   * ⭐ 定义教学
   */
  define(config: TutorialConfig): void {
    this.tutorials.set(config.id, config)
  }

  /**
   * ⭐ 开始教学
   */
  start(tutorialId: string, onStepChange?: (step: TutorialStep, index: number) => void): boolean {
    const tutorial = this.tutorials.get(tutorialId)
    if (!tutorial) {
      console.warn(`[Tutorial] 教学不存在: ${tutorialId}`)
      return false
    }

    // 检查是否已完成
    if (this.isCompleted(tutorialId)) {
      console.log(`[Tutorial] 教学已完成: ${tutorialId}`)
      return false
    }

    this.currentTutorial = tutorial
    this.currentStepIndex = 0
    this.onStepChange = onStepChange

    // 显示第一步
    this.showCurrentStep()

    return true
  }

  /**
   * ⭐ 手动进入下一步
   */
  next(): void {
    if (!this.currentTutorial) return

    this.currentStepIndex++

    if (this.currentStepIndex >= this.currentTutorial.steps.length) {
      this.complete()
    } else {
      this.showCurrentStep()
    }
  }

  /**
   * ⭐ 跳过教学
   */
  skip(): void {
    if (!this.currentTutorial) return

    // 保存跳过状态
    this.saveProgress(this.currentTutorial.id, 'skipped')

    const tutorial = this.currentTutorial
    this.currentTutorial = null
    this.currentStepIndex = 0

    tutorial.onSkip?.()
  }

  /**
   * ⭐ 完成教学
   */
  complete(): void {
    if (!this.currentTutorial) return

    // 保存完成状态
    this.saveProgress(this.currentTutorial.id, 'completed')

    const tutorial = this.currentTutorial
    this.currentTutorial = null
    this.currentStepIndex = 0

    tutorial.onComplete?.()
  }

  // ============================================================================
  // 📋 步骤控制
  // ============================================================================

  private showCurrentStep(): void {
    if (!this.currentTutorial) return

    const step = this.currentTutorial.steps[this.currentStepIndex]
    if (!step) return

    // 触发回调
    this.onStepChange?.(step, this.currentStepIndex)

    // 处理自动触发
    if (step.trigger === 'wait' && step.waitTime) {
      this.waitTimer = setTimeout(() => {
        this.next()
      }, step.waitTime)
    }
  }

  /**
   * ⭐ 获取当前步骤
   */
  getCurrentStep(): TutorialStep | null {
    if (!this.currentTutorial) return null
    return this.currentTutorial.steps[this.currentStepIndex] || null
  }

  /**
   * ⭐ 获取教学进度
   */
  getProgress(): { total: number; current: number } | null {
    if (!this.currentTutorial) return null
    return {
      total: this.currentTutorial.steps.length,
      current: this.currentStepIndex + 1
    }
  }

  /**
   * ⭐ 是否正在进行教学
   */
  isActive(): boolean {
    return this.currentTutorial !== null
  }

  // ============================================================================
  // 💾 进度保存
  // ============================================================================

  /**
   * ⭐ 检查教学是否完成
   */
  isCompleted(tutorialId: string): boolean {
    const key = `${this.prefix}${tutorialId}`
    const status = localStorage.getItem(key)
    return status === 'completed'
  }

  /**
   * ⭐ 检查教学是否跳过
   */
  isSkipped(tutorialId: string): boolean {
    const key = `${this.prefix}${tutorialId}`
    const status = localStorage.getItem(key)
    return status === 'skipped'
  }

  /**
   * ⭐ 重置教学进度
   */
  reset(tutorialId?: string): void {
    if (tutorialId) {
      localStorage.removeItem(`${this.prefix}${tutorialId}`)
    } else {
      // 重置所有
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

  private saveProgress(tutorialId: string, status: 'completed' | 'skipped'): void {
    const key = `${this.prefix}${tutorialId}`
    localStorage.setItem(key, status)
  }

  // ============================================================================
  // 🔧 工具方法
  // ============================================================================

  /**
   * ⭐ 触发自定义步骤
   */
  triggerCustom(): void {
    const step = this.getCurrentStep()
    if (step?.trigger === 'custom') {
      this.next()
    }
  }

  /**
   * ⭐ 清理
   */
  destroy(): void {
    if (this.waitTimer) {
      clearTimeout(this.waitTimer)
      this.waitTimer = null
    }
    this.currentTutorial = null
    this.onStepChange = undefined
  }
}
