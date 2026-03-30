// ============================================================================
// 🎮 贪吃蛇游戏场景 - 使用 SnakeGameLogic
// ============================================================================
// 
// 📌 说明:
//   这是一个完整的游戏场景实现，展示了如何使用 SnakeGameLogic
//   可以直接运行或作为参考模板
// ============================================================================

import { ComponentGameScene } from './ComponentGameScene'
import { SnakeGameLogic } from './SnakeGameLogic'
import { EventBus } from '../components/core/EventBus'
import { GameEventType } from '../components/core/GameEvent'

/**
 * 🐍 使用 SnakeGameLogic 的游戏场景
 * 
 * @remarks
 * 这个场景展示了如何：
 * - 创建和使用 SnakeGameLogic
 * - 监听和响应游戏事件
 * - 集成现有的组件系统
 * - 处理游戏循环
 */
export class SimpleSnakeGameScene extends ComponentGameScene {
  /** 游戏逻辑实例 */
  private gameLogic: SnakeGameLogic | null = null
  
  /** 事件总线实例 */
  private eventBus: EventBus
  
  /** 游戏是否已启动 */
  private isGameRunning: boolean = false
  
  /**
   * 构造函数
   */
  constructor(containerElement: HTMLElement) {
    super(containerElement, {
      difficulty: 'easy',
      enableDynamicDifficulty: false
    })
    
    this.eventBus = EventBus.getInstance()
    
    console.log('🎮 [SimpleSnakeGameScene] 简单游戏场景已创建')
  }
  
  /**
   * ⭐ 启动游戏（重写父类方法）
   */
  public async start(config: any = {}): Promise<void> {
    if (this.isGameRunning) {
      console.warn('[SimpleSnakeGameScene] 游戏已在运行中')
      return
    }
    
    console.log('🚀 [SimpleSnakeGameScene] 开始启动简单游戏...')
    
    try {
      // 1. 调用父类启动基础游戏
      await super.start({
        difficulty: 'easy',
        gridCols: 32,
        gridRows: 18,
        cellSize: 40
      })
      
      // 2. 创建游戏逻辑
      this.createGameLogic()
      
      // 3. 设置事件监听
      this.setupEventListeners()
      
      // 4. 标记游戏运行中
      this.isGameRunning = true
      
      console.log('✅ [SimpleSnakeGameScene] 简单游戏启动完成！')
      
    } catch (error) {
      console.error('❌ [SimpleSnakeGameScene] 游戏启动失败:', error)
      throw error
    }
  }
  
  /**
   * ⭐ 创建游戏逻辑
   */
  private createGameLogic(): void {
    const phaserScene = this.getPhaserScene()
    
    if (!phaserScene) {
      console.error('❌ [SimpleSnakeGameScene] Phaser 场景未就绪')
      return
    }
    
    // 创建游戏逻辑实例
    this.gameLogic = new SnakeGameLogic(phaserScene)
    
    console.log('🐍 [SimpleSnakeGameScene] 游戏逻辑已创建')
    
    // 初始化网格
    this.gameLogic.createGrid(40, 32, 18)
    
    // 初始化蛇
    this.gameLogic.createSnake(4, { x: 16, y: 9 })
    
    // 生成食物
    this.gameLogic.spawnFood()
    
    console.log('✅ [SimpleSnakeGameScene] 游戏初始化完成')
  }
  
  /**
   * ⭐ 设置事件监听
   */
  private setupEventListeners(): void {
    // 监听蛇移动事件
    this.eventBus.on(GameEventType.SNAKE_MOVE, (event) => {
      console.log('🐍 [Event] 蛇移动了:', event.payload)
      // TODO: 更新渲染
    })
    
    // 监听食物生成事件
    this.eventBus.on(GameEventType.FOOD_SPAWN, (event) => {
      console.log('🍎 [Event] 食物生成了:', event.payload.position)
      // TODO: 渲染食物
    })
    
    // 监听分数变化事件
    this.eventBus.on(GameEventType.SCORE_CHANGED, (event) => {
      console.log('💯 [Event] 分数变化:', event.payload.score)
      // TODO: 更新分数显示
    })
    
    // 监听游戏结束事件
    this.eventBus.on(GameEventType.GAME_OVER, (event) => {
      console.log('😢 [Event] 游戏结束:', event.payload.score)
      this.handleGameOver(event.payload.score)
    })
    
    console.log('✅ [SimpleSnakeGameScene] 事件监听已设置')
  }
  
  /**
   * ⭐ Phaser update 生命周期（重写）
   */
  protected update(time: number, delta: number): void {
    if (!this.isGameRunning || !this.gameLogic) {
      return
    }
    
    // 检查是否暂停
    const pauseManager = this.container.get<any>('pause_manager')
    if (pauseManager?.getIsPaused()) {
      return
    }
    
    // 更新游戏逻辑
    this.gameLogic.updateSnake(delta)
    
    // 调用父类的 update（更新组件）
    super.update(time, delta)
  }
  
  /**
   * ⭐ 处理游戏结束
   */
  private handleGameOver(finalScore: number): void {
    console.log('🎮 [GameOver] 游戏结束！最终分数:', finalScore)
    
    // TODO: 显示游戏结束界面
    // TODO: 提供重试选项
    
    this.isGameRunning = false
  }
  
  /**
   * ⭐ 重新开始游戏
   */
  public restart(): void {
    if (!this.gameLogic) {
      console.error('❌ [SimpleSnakeGameScene] 游戏逻辑未创建')
      return
    }
    
    console.log('🔄 [SimpleSnakeGameScene] 重新开始游戏')
    
    // 重置游戏状态
    this.gameLogic.restart(4, { x: 16, y: 9 })
    
    // 标记游戏运行中
    this.isGameRunning = true
    
    console.log('✅ [SimpleSnakeGameScene] 游戏已重启')
  }
  
  /**
   * ⭐ 停止游戏
   */
  public stop(): void {
    console.log('🛑 [SimpleSnakeGameScene] 停止游戏')
    
    this.isGameRunning = false
    
    // 调用父类停止
    super.stop()
  }
  
  /**
   * ⭐ 获取游戏逻辑实例
   */
  public getGameLogic(): SnakeGameLogic | null {
    return this.gameLogic
  }
}
