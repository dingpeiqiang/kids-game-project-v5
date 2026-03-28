// ============================================================================
// 🎮 游戏状态管理组件
// ============================================================================
// 
// 📌 说明:
//   负责管理游戏的整体状态（初始、加载、就绪、游戏中、暂停、结束等）
//   通过事件通知其他组件状态变化
//   实现状态机模式，确保状态流转的正确性
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import { GameState, GameStateInfo, GameOverReason, GameResult } from '../types/game-state'
import type Phaser from 'phaser'

/**
 * 游戏状态组件参数
 */
interface GameStateComponentParams {
  /** 初始状态（可选，默认 INITIAL） */
  initialState?: GameState
}

/**
 * ⭐ 游戏状态管理组件类
 * 
 * @remarks
 * 职责：
 * - 维护当前游戏状态
 * - 响应状态切换请求
 * - 发布状态改变事件
 * - 记录状态历史
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
 * gameState.gameOver(GameOverReason.COLLISION_WALL)
 * ```
 */
export class GameStateComponent extends ComponentBase {
  /** 当前游戏状态 */
  private state: GameState = GameState.INITIAL
  
  /** 上一状态 */
  private previousState?: GameState
  
  /** 进入当前状态的时间戳 */
  private stateEnteredAt: number = Date.now()
  
  /** 状态历史（用于调试和统计） */
  private stateHistory: GameStateInfo[] = []
  
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
      this.changeState(typedParams.initialState, '初始化')
    }
    
    console.log(`✅ [GameStateComponent] 初始化完成，初始状态：${this.state}`)
  }
  
  /**
   * 获取当前游戏状态
   * 
   * @returns 当前状态
   */
  public getState(): GameState {
    return this.state
  }
  
  /**
   * 获取状态信息
   * 
   * @returns 状态详细信息
   */
  public getStateInfo(): GameStateInfo {
    return {
      currentState: this.state,
      previousState: this.previousState,
      stateDuration: Date.now() - this.stateEnteredAt,
      enteredAt: this.stateEnteredAt
    }
  }
  
  /**
   * 检查是否处于指定状态
   * 
   * @param state - 要检查的状态
   * @returns true 如果处于该状态
   */
  public isState(state: GameState): boolean {
    return this.state === state
  }
  
  /**
   * 检查是否可以开始游戏
   * 
   * @returns true 如果可以开始
   */
  public canStartGame(): boolean {
    return this.state === GameState.INITIAL || this.state === GameState.READY || this.state === GameState.GAME_OVER
  }
  
  /**
   * 开始游戏
   * 
   * @returns 是否成功开始
   * 
   * @remarks
   * 只有在 INITIAL、READY 或 GAME_OVER 状态下才能开始游戏
   */
  public startGame(): boolean {
    if (!this.canStartGame()) {
      console.warn(`⚠️ [GameStateComponent] 无法开始游戏：当前状态 ${this.state}`)
      return false
    }
    
    this.changeState(GameState.PLAYING, '开始游戏')
    
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
   * @returns 是否成功暂停
   * 
   * @remarks
   * 只有在 PLAYING 状态下才能暂停
   */
  public pauseGame(): boolean {
    if (this.state !== GameState.PLAYING) {
      console.warn(`⚠️ [GameStateComponent] 无法暂停游戏：当前状态 ${this.state}`)
      return false
    }
    
    this.changeState(GameState.PAUSED, '暂停游戏')
    
    this.emit({
      type: GameEventType.PAUSE,
      payload: {
        pausedAt: Date.now()
      },
      timestamp: Date.now()
    })
    
    console.log(`⏸️ [GameStateComponent] 游戏已暂停`)
    return true
  }
  
  /**
   * 恢复游戏
   * 
   * @returns 是否成功恢复
   * 
   * @remarks
   * 只有在 PAUSED 状态下才能恢复
   */
  public resumeGame(): boolean {
    if (this.state !== GameState.PAUSED) {
      console.warn(`⚠️ [GameStateComponent] 无法恢复游戏：当前状态 ${this.state}`)
      return false
    }
    
    this.changeState(GameState.PLAYING, '恢复游戏')
    
    this.emit({
      type: GameEventType.RESUME,
      payload: {
        resumedAt: Date.now()
      },
      timestamp: Date.now()
    })
    
    console.log(`▶️ [GameStateComponent] 游戏已恢复`)
    return true
  }
  
  /**
   * 游戏结束
   * 
   * @param reason - 游戏结束原因
   * @param result - 游戏结果数据
   * @returns 是否成功结束
   * 
   * @remarks
   * 只有在 PLAYING 状态下才能结束游戏
   */
  public gameOver(reason: GameOverReason, result?: GameResult): boolean {
    if (this.state !== GameState.PLAYING) {
      console.warn(`⚠️ [GameStateComponent] 无法结束游戏：当前状态 ${this.state}`)
      return false
    }
    
    this.changeState(GameState.GAME_OVER, `游戏结束：${reason}`)
    
    this.emit({
      type: GameEventType.GAME_OVER,
      payload: {
        reason,
        ...result
      },
      timestamp: Date.now()
    })
    
    console.log(`💀 [GameStateComponent] 游戏结束：${reason}`)
    return true
  }
  
  /**
   * 设置游戏准备就绪
   * 
   * @returns 是否成功设置
   */
  public setReady(): boolean {
    if (this.state !== GameState.INITIAL && this.state !== GameState.LOADING) {
      console.warn(`⚠️ [GameStateComponent] 无法设置就绪：当前状态 ${this.state}`)
      return false
    }
    
    this.changeState(GameState.READY, '资源加载完成')
    console.log(`✅ [GameStateComponent] 游戏就绪`)
    return true
  }
  
  /**
   * 设置加载中
   * 
   * @returns 是否成功设置
   */
  public setLoading(): boolean {
    if (this.state !== GameState.INITIAL) {
      console.warn(`⚠️ [GameStateComponent] 无法设置加载中：当前状态 ${this.state}`)
      return false
    }
    
    this.changeState(GameState.LOADING, '开始加载资源')
    console.log(`⏳ [GameStateComponent] 开始加载`)
    return true
  }
  
  /**
   * 切换到结算界面
   * 
   * @returns 是否成功切换
   */
  public showSettlement(): boolean {
    if (this.state !== GameState.GAME_OVER) {
      console.warn(`⚠️ [GameStateComponent] 无法显示结算：当前状态 ${this.state}`)
      return false
    }
    
    this.changeState(GameState.SETTLEMENT, '显示结算界面')
    console.log(`📊 [GameStateComponent] 显示结算`)
    return true
  }
  
  /**
   * 内部方法：切换状态
   * 
   * @param newState - 新状态
   * @param reason - 切换原因
   * 
   * @protected
   */
  protected changeState(newState: GameState, reason?: string): void {
    if (this.state === newState) {
      return // 状态未改变
    }
    
    // 记录旧状态信息
    const oldStateInfo: GameStateInfo = {
      currentState: this.state,
      previousState: this.previousState,
      stateDuration: Date.now() - this.stateEnteredAt,
      enteredAt: this.stateEnteredAt,
      reason
    }
    
    // 添加到历史记录
    this.stateHistory.push(oldStateInfo)
    
    // 更新状态
    this.previousState = this.state
    this.state = newState
    this.stateEnteredAt = Date.now()
    
    console.log(`🔄 [GameStateComponent] 状态切换：${this.previousState} → ${this.state}`)
  }
  
  /**
   * 获取状态历史
   * 
   * @returns 状态历史数组
   */
  public getStateHistory(): GameStateInfo[] {
    return [...this.stateHistory]
  }
  
  /**
   * 清除状态历史
   */
  public clearHistory(): void {
    this.stateHistory = []
    console.log(`🗑️ [GameStateComponent] 清除状态历史`)
  }
  
  /**
   * 处理事件（实现基类的抽象方法）
   * 
   * @param event - 游戏事件
   * 
   * @protected
   */
  protected handleEvent(_event: GameEvent): void {
    // GameStateComponent 主要响应外部事件来改变状态
    // 目前不需要处理特定事件
  }
}
