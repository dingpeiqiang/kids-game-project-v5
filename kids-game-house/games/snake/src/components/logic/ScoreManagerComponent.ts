// ============================================================================
// 📊 分数管理组件
// ============================================================================
// 
// 📌 说明:
//   负责管理游戏分数系统
//   支持普通分数、奖励分数和最高分记录
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'

/**
 * 分数配置
 */
interface ScoreConfig {
  /** 初始分数（可选） */
  initialScore?: number
  /** 普通食物分数（默认 10） */
  normalFoodScore?: number
  /** 奖励食物分数（默认 50） */
  bonusFoodScore?: number
  /** 特殊食物分数（默认 100） */
  specialFoodScore?: number
}

/**
 * 分数管理组件类
 * 
 * @remarks
 * 职责：
 * - 管理当前分数
 * - 管理最高分记录
 * - 计算不同类型的得分
 * - 发射分数改变事件
 * 
 * @example
 * ```typescript
 * const scoreManager = new ScoreManagerComponent(scene)
 * container.add(scoreManager)
 * 
 * scoreManager.init({
 *   initialScore: 0,
 *   normalFoodScore: 10,
 *   bonusFoodScore: 50,
 *   specialFoodScore: 100
 * })
 * 
 * // 添加分数
 * scoreManager.addScore(10)
 * 
 * // 吃到普通食物
 * scoreManager.eatFood('normal')
 * ```
 */
export class ScoreManagerComponent extends ComponentBase {
  /** 当前分数 */
  private score: number = 0
  
  /** 最高分记录 */
  private highScore: number = 0
  
  /** 分数配置 */
  private config: Required<ScoreConfig> = {
    initialScore: 0,
    normalFoodScore: 10,
    bonusFoodScore: 50,
    specialFoodScore: 100
  }
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'score_manager', '分数管理器')
  }
  
  /**
   * 初始化分数管理组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    const typedParams = params as ScoreConfig
    
    // 合并配置
    this.config = {
      ...this.config,
      ...typedParams
    }
    
    // 设置初始分数
    this.score = this.config.initialScore ?? 0
    
    // 加载最高分
    this.loadHighScore()
    
    console.log(`✅ [ScoreManager] 分数管理组件初始化完成，初始分数=${this.score}, 最高分=${this.highScore}`)
  }
  
  /**
   * 添加分数
   * 
   * @param points - 要添加的分数
   * 
   * @public
   */
  public addScore(points: number): void {
    if (points <= 0) return
    
    const previousScore = this.score
    this.score += points
    
    console.log(`📈 [ScoreManager] 分数增加：${previousScore} → ${this.score} (+${points})`)
    
    // 发射分数改变事件
    this.emit({
      type: GameEventType.SCORE_CHANGED,
      payload: {
        score: this.score,
        previousScore,
        points
      },
      timestamp: Date.now()
    })
    
    // 检查是否打破记录
    this.checkHighScore()
  }
  
  /**
   * 设置分数
   * 
   * @param newScore - 新分数
   * 
   * @public
   */
  public setScore(newScore: number): void {
    const previousScore = this.score
    this.score = Math.max(0, newScore) // 不允许负分
    
    console.log(`🔢 [ScoreManager] 分数设置：${previousScore} → ${this.score}`)
    
    this.emit({
      type: GameEventType.SCORE_CHANGED,
      payload: {
        score: this.score,
        previousScore
      },
      timestamp: Date.now()
    })
  }
  
  /**
   * 重置分数
   * 
   * @public
   */
  public resetScore(): void {
    const previousScore = this.score
    this.score = this.config.initialScore ?? 0
    
    console.log(`🔄 [ScoreManager] 分数重置：${previousScore} → ${this.score}`)
    
    this.emit({
      type: GameEventType.SCORE_CHANGED,
      payload: {
        score: this.score,
        previousScore
      },
      timestamp: Date.now()
    })
  }
  
  /**
   * 获取当前分数
   * 
   * @returns 当前分数
   * 
   * @public
   */
  public getScore(): number {
    return this.score
  }
  
  /**
   * 获取最高分
   * 
   * @returns 最高分
   * 
   * @public
   */
  public getHighScore(): number {
    return this.highScore
  }
  
  /**
   * 处理吃食物事件
   * 
   * @param foodType - 食物类型
   * 
   * @public
   */
  public eatFood(foodType: string): void {
    let points = 0
    
    switch (foodType) {
      case 'normal':
        points = this.config.normalFoodScore
        break
      case 'bonus':
        points = this.config.bonusFoodScore
        break
      case 'special':
        points = this.config.specialFoodScore
        break
      default:
        points = this.config.normalFoodScore
    }
    
    this.addScore(points)
    
    console.log(`🍎 [ScoreManager] 吃到${foodType}食物，获得${points}分`)
  }
  
  /**
   * 检查是否打破最高分记录
   * 
   * @private
   */
  private checkHighScore(): void {
    if (this.score > this.highScore) {
      const oldHighScore = this.highScore
      this.highScore = this.score
      
      console.log(`🏆 [ScoreManager] 打破记录！${oldHighScore} → ${this.highScore}`)
      
      // 保存新记录
      this.saveHighScore()
      
      // 发射最高分更新事件
      this.emit({
        type: GameEventType.HIGH_SCORE_UPDATED,
        payload: {
          highScore: this.highScore,
          previousHighScore: oldHighScore
        },
        timestamp: Date.now()
      })
    }
  }
  
  /**
   * 保存最高分到本地存储
   * 
   * @private
   */
  private saveHighScore(): void {
    try {
      localStorage.setItem('snake_high_score', this.highScore.toString())
      console.log(`💾 [ScoreManager] 最高分已保存：${this.highScore}`)
    } catch (error) {
      console.warn('⚠️ [ScoreManager] 保存最高分失败:', error)
    }
  }
  
  /**
   * 从本地存储加载最高分
   * 
   * @private
   */
  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem('snake_high_score')
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0
        console.log(`📂 [ScoreManager] 加载最高分：${this.highScore}`)
      }
    } catch (error) {
      console.warn('⚠️ [ScoreManager] 加载最高分失败:', error)
      this.highScore = 0
    }
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
      case GameEventType.SNAKE_EAT:
        // 蛇吃到食物，根据食物类型加分
        const foodType = event.payload.food?.type || 'normal'
        this.eatFood(foodType)
        break
        
      case GameEventType.GAME_START:
        // 游戏开始，重置分数
        this.resetScore()
        break
        
      case GameEventType.GAME_OVER:
        // 游戏结束，显示最终得分
        console.log(`💀 [ScoreManager] 游戏结束，最终得分：${this.score}`)
        break
        
      default:
        // 忽略其他事件
        break
    }
  }
}
