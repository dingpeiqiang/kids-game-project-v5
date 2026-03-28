// ============================================================================
// 📊 分数管理组件
// ============================================================================
// 
// 📌 说明:
//   负责管理游戏的分数系统
//   支持分数增减、连击系统、最高分记录
//   通过事件通知 UI 更新
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import type Phaser from 'phaser'
import { SCORE } from '../utils/constants'

/**
 * ⭐ 分数管理组件参数
 */
interface ScoreManagerParams {
  /** 初始分数（可选，默认 0） */
  initialScore?: number
  /** 是否启用连击系统（可选，默认 true） */
  enableCombo?: boolean
  /** 连击持续时间（毫秒，可选，默认 3000） */
  comboDuration?: number
}

/**
 * ⭐ 分数管理组件类
 * 
 * @remarks
 * 职责：
 * - 管理当前分数和最高分
 * - 处理分数增减
 * - 连击系统管理
 * - 发送分数变化事件
 * - 持久化最高分记录
 * 
 * @example
 * ```typescript
 * const scoreManager = new ScoreManagerComponent(scene)
 * scoreManager.init({ initialScore: 0, enableCombo: true })
 * 
 * // 增加分数
 * scoreManager.addScore(10)
 * 
 * // 连击加分
 * scoreManager.addScoreWithCombo(10)
 * 
 * // 获取当前分数
 * const currentScore = scoreManager.getCurrentScore()
 * ```
 */
export class ScoreManagerComponent extends ComponentBase {
  /** 当前分数 */
  private score: number = 0
  
  /** 最高分 */
  private highScore: number = 0
  
  /** 连击计数器 */
  private comboCount: number = 0
  
  /** 连击计时器（毫秒） */
  private comboTimer: number = 0
  
  /** 是否启用连击系统 */
  private comboEnabled: boolean = true
  
  /** 连击持续时间（毫秒） */
  private comboDuration: number = 3000
  
  /** 最后得分时间戳 */
  private lastScoreTime: number = 0
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'score_manager', '分数管理器')
  }
  
  /**
   * ⭐ 初始化分数管理组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    const typedParams = params as ScoreManagerParams
    
    // 设置初始分数
    this.score = typedParams.initialScore ?? 0
    
    // 设置连击系统
    this.comboEnabled = typedParams.enableCombo ?? true
    this.comboDuration = typedParams.comboDuration ?? 3000
    
    // 加载最高分
    this.loadHighScore()
    
    console.log(`✅ [ScoreManager] 分数管理器初始化完成`)
    console.log(`   当前分数：${this.score}`)
    console.log(`   最高分：${this.highScore}`)
    console.log(`   连击系统：${this.comboEnabled ? '启用' : '禁用'}`)
  }
  
  /**
   * ⭐ 增加分数
   * 
   * @param points - 要增加的分数
   * @param isBonus - 是否为奖励分数（可选，默认 false）
   * @returns 实际增加的分数
   */
  public addScore(points: number, isBonus: boolean = false): number {
    const previousScore = this.score
    
    // 计算实际增加的分数（考虑连击倍率）
    let actualPoints = points
    let comboMultiplier = 1.0
    
    if (this.comboEnabled && !isBonus) {
      this.updateCombo()
      comboMultiplier = this.getComboMultiplier()
      actualPoints = Math.floor(points * comboMultiplier)
    }
    
    // 更新分数
    this.score += actualPoints
    
    // 检查是否刷新最高分
    const isNewHighScore = this.checkHighScore()
    
    // 发送分数变化事件
    this.emitScoreChanged(previousScore, actualPoints, isBonus, comboMultiplier)
    
    // 如果刷新最高分，发送事件
    if (isNewHighScore) {
      this.emitHighScoreUpdated()
    }
    
    console.log(`➕ [ScoreManager] 分数 +${actualPoints}${comboMultiplier > 1 ? ` (x${comboMultiplier.toFixed(1)})` : ''}, 总分：${this.score}`)
    
    return actualPoints
  }
  
  /**
   * ⭐ 减少分数
   * 
   * @param points - 要减少的分数
   * @returns 实际减少的分数
   */
  public removeScore(points: number): number {
    const previousScore = this.score
    const actualPoints = Math.min(points, this.score) // 不能减到负数
    
    this.score -= actualPoints
    
    this.emitScoreChanged(previousScore, -actualPoints, false)
    
    console.log(`➖ [ScoreManager] 分数 -${actualPoints}, 剩余：${this.score}`)
    
    return actualPoints
  }
  
  /**
   * ⭐ 获取当前分数
   * 
   * @returns 当前分数值
   */
  public getCurrentScore(): number {
    return this.score
  }
  
  /**
   * ⭐ 获取最高分
   * 
   * @returns 最高分
   */
  public getHighScore(): number {
    return this.highScore
  }
  
  /**
   * ⭐ 设置当前分数
   * 
   * @param value - 新的分数值
   */
  public setScore(value: number): void {
    const previousScore = this.score
    this.score = Math.max(0, value) // 分数不能为负
    
    if (previousScore !== this.score) {
      this.emitScoreChanged(previousScore, this.score - previousScore, false)
    }
  }
  
  /**
   * ⭐ 重置分数
   */
  public reset(): void {
    const previousScore = this.score
    this.score = 0
    this.comboCount = 0
    this.comboTimer = 0
    
    this.emitScoreChanged(previousScore, 0, false)
    
    console.log(`🔄 [ScoreManager] 分数已重置`)
  }
  
  /**
   * ⭐ 增加连击计数
   */
  public incrementCombo(): void {
    if (!this.comboEnabled) return
    
    this.comboCount++
    this.lastScoreTime = Date.now()
    
    console.log(`🔥 [ScoreManager] 连击 x${this.comboCount}`)
  }
  
  /**
   * ⭐ 重置连击
   */
  public resetCombo(): void {
    if (this.comboCount > 0) {
      console.log(`💔 [ScoreManager] 连击中断 (${this.comboCount})`)
    }
    this.comboCount = 0
    this.comboTimer = 0
  }
  
  /**
   * ⭐ 获取当前连击数
   * 
   * @returns 连击计数
   */
  public getComboCount(): number {
    return this.comboCount
  }
  
  /**
   * ⭐ 获取连击倍率
   * 
   * @returns 连击倍率（1.0 - 最大倍率）
   */
  public getComboMultiplier(): number {
    if (!this.comboEnabled || this.comboCount === 0) {
      return 1.0
    }
    
    // 基础倍率 + 连击增量，不超过最大倍率
    const multiplier = SCORE.COMBO_MULTIPLIER_BASE + 
                      (this.comboCount - 1) * SCORE.COMBO_MULTIPLIER_INCREMENT
    
    return Math.min(multiplier, SCORE.MAX_COMBO_MULTIPLIER)
  }
  
  /**
   * ⭐ 每帧更新（处理连击计时）
   * 
   * @param deltaTime - 距离上一帧的时间间隔（毫秒）
   */
  public update(deltaTime: number): void {
    if (!this.comboEnabled || this.comboCount === 0) return
    
    // 更新连击计时器
    this.comboTimer += deltaTime
    
    // 检查连击是否超时
    if (this.comboTimer >= this.comboDuration) {
      this.resetCombo()
    }
  }
  
  /**
   * ⭐ 检查是否刷新最高分
   * 
   * @returns true 如果刷新了最高分
   */
  protected checkHighScore(): boolean {
    if (this.score > this.highScore) {
      this.highScore = this.score
      this.saveHighScore()
      return true
    }
    return false
  }
  
  /**
   * ⭐ 更新连击状态
   * 
   * @protected
   */
  protected updateCombo(): void {
    const now = Date.now()
    const timeSinceLastScore = now - this.lastScoreTime
    
    // 如果超过连击持续时间，重置连击
    if (timeSinceLastScore > this.comboDuration && this.lastScoreTime > 0) {
      this.comboCount = 0
    }
    
    this.incrementCombo()
  }
  
  /**
   * ⭐ 发送分数变化事件
   * 
   * @param previousScore - 原分数
   * @param changedPoints - 变化分数
   * @param isBonus - 是否奖励分数
   * @param comboMultiplier - 连击倍率
   * @protected
   */
  protected emitScoreChanged(
    previousScore: number,
    changedPoints: number,
    isBonus: boolean,
    comboMultiplier?: number
  ): void {
    this.emit({
      type: GameEventType.SCORE_CHANGED,
      payload: {
        previousScore,
        newScore: this.score,
        pointsChanged: changedPoints,
        isBonus,
        comboMultiplier
      },
      timestamp: Date.now()
    })
  }
  
  /**
   * ⭐ 发送最高分更新事件
   * 
   * @protected
   */
  protected emitHighScoreUpdated(): void {
    this.emit({
      type: GameEventType.HIGH_SCORE_UPDATED,
      payload: {
        highScore: this.highScore
      },
      timestamp: Date.now()
    })
    
    console.log(`🏆 [ScoreManager] 新纪录！${this.highScore}`)
  }
  
  /**
   * ⭐ 保存最高分到本地存储
   * 
   * @protected
   */
  protected saveHighScore(): void {
    try {
      localStorage.setItem('kgf_high_score', this.highScore.toString())
      console.log(`💾 [ScoreManager] 最高分已保存：${this.highScore}`)
    } catch (error) {
      console.warn(`⚠️ [ScoreManager] 保存最高分失败:`, error)
    }
  }
  
  /**
   * ⭐ 从本地存储加载最高分
   * 
   * @protected
   */
  protected loadHighScore(): void {
    try {
      const saved = localStorage.getItem('kgf_high_score')
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0
        console.log(`💾 [ScoreManager] 已加载最高分：${this.highScore}`)
      }
    } catch (error) {
      console.warn(`⚠️ [ScoreManager] 加载最高分失败:`, error)
    }
  }
  
  /**
   * ⭐ 获取统计信息
   * 
   * @returns 统计信息对象
   */
  public getStats(): {
    currentScore: number
    highScore: number
    comboCount: number
    comboMultiplier: number
    comboEnabled: boolean
  } {
    return {
      currentScore: this.score,
      highScore: this.highScore,
      comboCount: this.comboCount,
      comboMultiplier: this.getComboMultiplier(),
      comboEnabled: this.comboEnabled
    }
  }
  
  /**
   * ⭐ 处理事件（实现基类的抽象方法）
   * 
   * @param event - 游戏事件
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    // 可以根据事件类型响应
    switch (event.type) {
      case GameEventType.GAME_OVER:
        // 游戏结束时可以做一些处理
        break
        
      case GameEventType.ITEM_COLLECTED:
        // 收集物品时自动加分
        if (event.payload?.points) {
          this.addScore(event.payload.points)
        }
        break
    }
  }
}
