// ============================================================================
// 🎮 游戏状态管理组件
// ============================================================================
// 
// 📌 说明:
//   负责管理游戏的整体状态（空闲、游戏中、暂停、结束）
//   通过事件通知其他组件状态变化
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'

/**
 * 游戏状态枚举
 */
export type GameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'

/**
 * 游戏状态组件参数
 */
interface GameStateComponentParams {
  /** 初始状态（可选，默认 IDLE） */
  initialState?: GameState
}

/**
 * 游戏状态管理组件类
 * 
 * @remarks
 * 职责：
 * - 维护当前游戏状态
 * - 响应状态切换请求
 * - 发布状态改变事件
 * 
 * @example
 * ```typescript
 * const gameState = new GameStateComponent(scene)
 * container.add(gameState)
 * 
 * // 开始游戏
 * gameState.startGame()
 * 
 * // 暂停游戏
 * gameState.pauseGame()
 * 
 * // 恢复游戏
 * gameState.resumeGame()
 * 
 * // 游戏结束
 * gameState.gameOver()
 * ```
 */
export class GameStateComponent extends ComponentBase {
  /** 当前游戏状态 */
  private state: GameState = 'IDLE'
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'game_state', '游戏状态管理器')
  }
  
  /**
   * 初始化游戏状态组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    const typedParams = params as GameStateComponentParams
    if (typedParams?.initialState) {
      this.state = typedParams.initialState
    }
    
    console.log(`✅ [GameStateComponent] 初始化完成，初始状态：${this.state}`)
  }
  
  /**
   * 开始游戏
   * 
   * @returns 是否成功开始（true/false）
   * 
   * @remarks
   * 只有在 IDLE 或 GAME_OVER 状态下才能开始游戏
   */
  public startGame(): boolean {
    if (this.state !== 'IDLE' && this.state !== 'GAME_OVER') {
      console.warn(`⚠️ [GameStateComponent] 无法开始游戏：当前状态 ${this.state}`)
      return false
    }
    
    this.state = 'PLAYING'
    
    this.emit({
      type: GameEventType.GAME_START,
      payload: {},
      timestamp: Date.now()
    })
    
    console.log(`🎮 [GameStateComponent] 游戏开始`)
    return true
  }
  
  /**
   * 暂停游戏
   * 
   * @returns 是否成功暂停（true/false）
   * 
   * @remarks
   * 只有在 PLAYING 状态下才能暂停
   */
  public pauseGame(): boolean {
    if (this.state !== 'PLAYING') {
      console.warn(`⚠️ [GameStateComponent] 无法暂停游戏：当前状态 ${this.state}`)
      return false
    }
    
    this.state = 'PAUSED'
    
    this.emit({
      type: GameEventType.PAUSE,
      payload: {},
      timestamp: Date.now()
    })
    
    console.log(`⏸️ [GameStateComponent] 游戏已暂停`)
    return true
  }
  
  /**
   * 恢复游戏
   * 
   * @returns 是否成功恢复（true/false）
   * 
   * @remarks
   * 只有在 PAUSED 状态下才能恢复
   */
  public resumeGame(): boolean {
    if (this.state !== 'PAUSED') {
      console.warn(`⚠️ [GameStateComponent] 无法恢复游戏：当前状态 ${this.state}`)
      return false
    }
    
    this.state = 'PLAYING'
    
    this.emit({
      type: GameEventType.RESUME,
      payload: {},
      timestamp: Date.now()
    })
    
    console.log(`▶️ [GameStateComponent] 游戏已恢复`)
    return true
  }
  
  /**
   * 游戏结束
   * 
   * @returns 是否成功结束游戏
   * 
   * @remarks
   * 只有在 PLAYING 或 PAUSED 状态下才能结束游戏
   */
  public gameOver(): boolean {
    if (this.state !== 'PLAYING' && this.state !== 'PAUSED') {
      console.warn(`⚠️ [GameStateComponent] 无法结束游戏：当前状态 ${this.state}`)
      return false
    }
    
    this.state = 'GAME_OVER'
    
    this.emit({
      type: GameEventType.GAME_OVER,
      payload: {},
      timestamp: Date.now()
    })
    
    console.log(`💀 [GameStateComponent] 游戏结束`)
    return true
  }
  
  /**
   * 获取当前游戏状态
   * 
   * @returns 当前游戏状态
   */
  public getState(): GameState {
    return this.state
  }
  
  /**
   * 检查是否在玩游戏
   * 
   * @returns 是否在玩游戏
   */
  public isPlaying(): boolean {
    return this.state === 'PLAYING'
  }
  
  /**
   * 检查是否暂停
   * 
   * @returns 是否暂停
   */
  public isPaused(): boolean {
    return this.state === 'PAUSED'
  }
  
  /**
   * 检查是否游戏结束
   * 
   * @returns 是否游戏结束
   */
  public isGameOver(): boolean {
    return this.state === 'GAME_OVER'
  }
  
  /**
   * 处理组件事件
   * 
   * @param event - 游戏事件对象
   * 
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    // 游戏状态组件通常不响应其他事件
    // 只负责发布状态改变事件
  }
}
