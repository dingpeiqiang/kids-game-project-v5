// ============================================================================
// ⚙️ 游戏配置组件
// ============================================================================
// 
// 📌 说明:
//   负责管理游戏的所有配置参数
//   支持难度级别、游戏速度等设置
//   ⭐ 支持自定义配置（从 gameStore 传入）
//   ⭐ 未来可对接后端配置接口
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import type { CustomGameConfig } from '@/stores/game'

/**
 * 难度级别
 */
export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'extreme'

/**
 * 难度配置
 */
interface DifficultyConfig {
  /** 移动速度（像素/秒） */
  speed: number
  /** 初始长度 */
  initialLength: number
  /** 普通食物分数 */
  normalScore: number
  /** 奖励食物分数 */
  bonusScore: number
  /** 特殊食物分数 */
  specialScore: number
}

/**
 * 游戏配置组件参数
 */
interface GameConfigParams {
  /** 默认难度（可选） */
  defaultDifficulty?: DifficultyLevel
  /** 是否允许动态难度（可选） */
  enableDynamicDifficulty?: boolean
}

/**
 * 游戏配置组件类
 * 
 * @remarks
 * 职责：
 * - 管理游戏配置参数
 * - 支持多难度级别
 * - 动态难度调整
 * - 配置持久化
 * - ⭐ 支持自定义配置覆盖
 * 
 * @example
 * ```typescript
 * const gameConfig = new GameConfigComponent(scene)
 * container.add(gameConfig)
 * 
 * gameConfig.init({
 *   defaultDifficulty: 'normal',
 *   customConfig: { speed: 300, initialLength: 6 }
 * })
 * 
 * // 获取当前难度配置（已应用自定义）
 * const config = gameConfig.getCurrentConfig()
 * ```
 */
export class GameConfigComponent extends ComponentBase {
  /** 难度配置映射表 */
  private readonly difficultyConfigs: Map<DifficultyLevel, DifficultyConfig> = new Map([
    ['easy', {
      speed: 150,
      initialLength: 3,
      normalScore: 10,
      bonusScore: 50,
      specialScore: 100
    }],
    ['normal', {
      speed: 200,
      initialLength: 4,
      normalScore: 10,
      bonusScore: 50,
      specialScore: 100
    }],
    ['hard', {
      speed: 300,
      initialLength: 5,
      normalScore: 15,
      bonusScore: 75,
      specialScore: 150
    }],
    ['extreme', {
      speed: 400,
      initialLength: 6,
      normalScore: 20,
      bonusScore: 100,
      specialScore: 200
    }]
  ])
  
  /** 当前难度 */
  private currentDifficulty: DifficultyLevel = 'normal'
  
  /** 是否启用动态难度 */
  private enableDynamicDifficulty: boolean = true
  
  /** ⭐ 自定义配置（从 gameStore 传入，覆盖默认配置） */
  private customConfig: CustomGameConfig | null = null
  
  /** 游戏得分统计（用于动态难度） */
  private scoreStats: {
    totalGames: number
    highestScore: number
    averageScore: number
  } = {
    totalGames: 0,
    highestScore: 0,
    averageScore: 0
  }
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'game_config', '游戏配置管理器')
  }
  
  /**
   * 初始化游戏配置组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    const typedParams = params as GameConfigParams & { customConfig?: CustomGameConfig | null }
    
    if (typedParams.defaultDifficulty) {
      this.currentDifficulty = typedParams.defaultDifficulty
    }
    
    if (typedParams.enableDynamicDifficulty !== undefined) {
      this.enableDynamicDifficulty = typedParams.enableDynamicDifficulty
    }
    
    // ⭐ 应用自定义配置（从 gameStore 传入）
    if (typedParams.customConfig) {
      this.applyCustomConfig(typedParams.customConfig)
    }
    
    // 加载保存的配置
    this.loadConfig()
    
    console.log(`✅ [GameConfig] 游戏配置组件初始化完成，当前难度：${this.currentDifficulty}`)
    if (this.customConfig) {
      console.log('⚙️ [GameConfig] 已应用自定义配置:', this.customConfig)
    }
  }
  
  /**
   * ⭐ 应用自定义配置（覆盖默认配置）
   * 
   * @param config - 自定义配置对象
   * 
   * @public
   */
  public applyCustomConfig(config: CustomGameConfig | null): void {
    this.customConfig = config
    console.log('⚙️ [GameConfig] 自定义配置已应用:', config ? '有自定义值' : '使用默认值')
  }
  
  /**
   * 获取当前难度配置（⭐ 已应用自定义配置）
   * 
   * @returns 难度配置对象
   * 
   * @public
   */
  public getCurrentConfig(): DifficultyConfig {
    const baseConfig = this.difficultyConfigs.get(this.currentDifficulty)!
    
    // ⭐ 如果有自定义配置，合并配置（自定义配置优先）
    if (this.customConfig) {
      return {
        speed: this.customConfig.speed ?? baseConfig.speed,
        initialLength: this.customConfig.initialLength ?? baseConfig.initialLength,
        normalScore: this.customConfig.normalFoodScore ?? baseConfig.normalScore,
        bonusScore: this.customConfig.bonusFoodScore ?? baseConfig.bonusScore,
        specialScore: this.customConfig.specialFoodScore ?? baseConfig.specialScore
      }
    }
    
    return baseConfig
  }
  
  /**
   * 获取指定难度的配置
   * 
   * @param difficulty - 难度级别
   * @returns 难度配置对象
   * 
   * @public
   */
  public getDifficultyConfig(difficulty: DifficultyLevel): DifficultyConfig {
    return this.difficultyConfigs.get(difficulty)!
  }
  
  /**
   * 设置难度级别
   * 
   * @param difficulty - 难度级别
   * @returns 是否成功设置
   * 
   * @public
   */
  public setDifficulty(difficulty: DifficultyLevel): boolean {
    if (!this.difficultyConfigs.has(difficulty)) {
      console.warn(`⚠️ [GameConfig] 无效的难度级别：${difficulty}`)
      return false
    }
    
    const oldDifficulty = this.currentDifficulty
    this.currentDifficulty = difficulty
    
    // 保存配置
    this.saveConfig()
    
    console.log(`🔧 [GameConfig] 难度调整：${oldDifficulty} → ${difficulty}`)
    
    // 发射难度改变事件
    this.emit({
      type: GameEventType.UI_REFRESH,
      payload: {
        difficulty,
        config: this.getCurrentConfig()
      },
      timestamp: Date.now()
    })
    
    return true
  }
  
  /**
   * 获取当前难度
   * 
   * @returns 当前难度级别
   * 
   * @public
   */
  public getCurrentDifficulty(): DifficultyLevel {
    return this.currentDifficulty
  }
  
  /**
   * 获取所有难度级别
   * 
   * @returns 难度级别数组
   * 
   * @public
   */
  public getAllDifficulties(): DifficultyLevel[] {
    return Array.from(this.difficultyConfigs.keys())
  }
  
  /**
   * 根据得分动态调整难度
   * 
   * @param score - 当前得分
   * 
   * @public
   */
  public adjustDifficultyByScore(score: number): void {
    if (!this.enableDynamicDifficulty) return
    
    const difficulties: DifficultyLevel[] = ['easy', 'normal', 'hard', 'extreme']
    
    // 根据得分自动调整难度
    let targetDifficulty: DifficultyLevel = 'easy'
    
    if (score >= 500) targetDifficulty = 'extreme'
    else if (score >= 300) targetDifficulty = 'hard'
    else if (score >= 100) targetDifficulty = 'normal'
    
    if (targetDifficulty !== this.currentDifficulty) {
      console.log(`📈 [GameConfig] 动态难度调整：${this.currentDifficulty} → ${targetDifficulty}`)
      this.setDifficulty(targetDifficulty)
    }
  }
  
  /**
   * 更新游戏统计
   * 
   * @param finalScore - 最终得分
   * 
   * @public
   */
  public updateStats(finalScore: number): void {
    this.scoreStats.totalGames++
    this.scoreStats.highestScore = Math.max(this.scoreStats.highestScore, finalScore)
    this.scoreStats.averageScore = (
      (this.scoreStats.averageScore * (this.scoreStats.totalGames - 1) + finalScore) 
      / this.scoreStats.totalGames
    )
    
    console.log(`📊 [GameConfig] 统计更新：场次=${this.scoreStats.totalGames}, 最高分=${this.scoreStats.highestScore}`)
  }
  
  /**
   * 获取统计信息
   * 
   * @returns 统计信息对象
   * 
   * @public
   */
  public getStats(): typeof this.scoreStats {
    return { ...this.scoreStats }
  }
  
  /**
   * 保存配置到本地存储
   * 
   * @private
   */
  private saveConfig(): void {
    try {
      const config = {
        difficulty: this.currentDifficulty,
        enableDynamicDifficulty: this.enableDynamicDifficulty
      }
      localStorage.setItem('snake_game_config', JSON.stringify(config))
      console.log(`💾 [GameConfig] 配置已保存`)
    } catch (error) {
      console.warn('⚠️ [GameConfig] 保存配置失败:', error)
    }
  }
  
  /**
   * 从本地存储加载配置
   * 
   * @private
   */
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('snake_game_config')
      if (saved) {
        const config = JSON.parse(saved)
        if (config.difficulty && this.difficultyConfigs.has(config.difficulty)) {
          this.currentDifficulty = config.difficulty
        }
        if (typeof config.enableDynamicDifficulty === 'boolean') {
          this.enableDynamicDifficulty = config.enableDynamicDifficulty
        }
        console.log(`📂 [GameConfig] 配置已加载：难度=${this.currentDifficulty}`)
      }
    } catch (error) {
      console.warn('⚠️ [GameConfig] 加载配置失败:', error)
    }
  }
  
  /**
   * 重置配置为默认值
   * 
   * @public
   */
  public resetToDefaults(): void {
    this.currentDifficulty = 'normal'
    this.enableDynamicDifficulty = true
    this.saveConfig()
    console.log(`🔄 [GameConfig] 配置已重置为默认值`)
  }
  
  /**
   * 处理组件事件
   * 
   * @param event - 游戏事件对象
   * 
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    switch (event.type) {
      case GameEventType.GAME_OVER:
        // 游戏结束，更新统计
        const score = event.payload?.score ?? 0
        this.updateStats(score)
        break
        
      case GameEventType.SCORE_CHANGED:
        // 分数改变，检查是否需要动态调整难度
        if (this.enableDynamicDifficulty) {
          this.adjustDifficultyByScore(event.payload.score)
        }
        break
        
      default:
        // 忽略其他事件
        break
    }
  }
}
