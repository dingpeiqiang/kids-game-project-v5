// ============================================================================
// 🎮 基于组件化架构的游戏场景
// ============================================================================
// 
// 📌 说明:
//   这是完全使用组件化架构的贪吃蛇游戏场景
//   使用 18 个独立组件实现完整的游戏功能
// ============================================================================

import { ComponentContainer } from '@/components/core/ComponentContainer'
import { EventBus } from '@/components/core/EventBus'
import { GameEventType } from '@/components/core/GameEvent'

// 渲染组件
import { BackgroundRenderer } from '@/components/rendering/BackgroundRenderer'
import { GridRenderer } from '@/components/rendering/GridRenderer'
import { SnakeRenderer } from '@/components/rendering/SnakeRenderer'
import { FoodRenderer } from '@/components/rendering/FoodRenderer'
import { ParticleRenderer } from '@/components/rendering/ParticleRenderer'

// 逻辑组件
import { GameStateComponent } from '@/components/logic/GameStateComponent'
import { SnakeMovementComponent, type Direction } from '@/components/logic/SnakeMovementComponent'
import { CollisionDetectionComponent } from '@/components/logic/CollisionDetectionComponent'
import { FoodSpawnerComponent } from '@/components/logic/FoodSpawnerComponent'
import { ScoreManagerComponent } from '@/components/logic/ScoreManagerComponent'
import { GameConfigComponent, type DifficultyLevel } from '@/components/logic/GameConfigComponent'
import { PauseManagerComponent } from '@/components/logic/PauseManagerComponent'

// 控制组件
import { InputHandlerComponent } from '@/components/control/InputHandlerComponent'

// ⭐ Store（用于获取 customConfig）
import { useGameStore } from '@/stores/game'

/**
 * ⭐ 游戏场景配置（优化版：支持自定义网格和单元格大小）
 */
interface GameSceneConfig {
  /** 难度级别 */
  difficulty?: DifficultyLevel
  /** 主题 ID */
  themeId?: string
  /** 是否启用动态难度 */
  enableDynamicDifficulty?: boolean
  /** ⭐ 网格列数（可配置，默认 32） */
  gridCols?: number
  /** ⭐ 网格行数（可配置，默认 18） */
  gridRows?: number
  /** ⭐ 单元格大小像素（可配置，默认 40） */
  cellSize?: number
}

/**
 * 基于组件化架构的游戏场景类
 * 
 * @remarks
 * 职责：
 * - 初始化所有组件
 * - 管理组件生命周期
 * - 处理游戏循环
 * - 提供外部调用接口
 * 
 * @example
 * ```typescript
 * const scene = new ComponentGameScene(containerElement)
 * await scene.start({ difficulty: 'normal', themeId: 'theme-123' })
 * ```
 */
export class ComponentGameScene {
  /** 组件容器 */
  private container: ComponentContainer
  
  /** Phaser 场景对象 */
  private scene: Phaser.Scene | null = null
  
  /** 游戏配置 */
  private config: GameSceneConfig
  
  /** 事件总线 */
  private eventBus: EventBus
  
  /** 是否已初始化 */
  private isInitialized: boolean = false
  
  /** Phaser 场景是否已创建完成 */
  private isSceneCreated: boolean = false
  
  /** ⭐ 游戏区域偏移（像素）- 从配置读取或默认值 */
  private offsetX: number = 0
  private offsetY: number = 0
  
  /** ⭐ 单元格大小（像素）- 从配置读取或默认值 */
  private cellSize: number = 40
  
  /** ⭐ 网格配置 - 支持动态配置（不再硬编码） */
  private readonly DEFAULT_GRID_COLS = 32
  private readonly DEFAULT_GRID_ROWS = 18
  
  /** ⭐ 当前使用的网格配置（运行时可动态调整） */
  private gridCols: number = 32
  private gridRows: number = 18
  
  /** Promise 解析函数 */
  private resolveReady!: () => void
  private sceneReadyPromise: Promise<void>
  
  /**
   * 构造函数
   * 
   * @param containerElement - 游戏容器 DOM 元素
   * @param config - 游戏配置
   */
  constructor(
    private containerElement: HTMLElement,
    config: GameSceneConfig = {}
  ) {
    this.config = {
      difficulty: 'normal',
      enableDynamicDifficulty: true,
      ...config
    }
    
    // 初始化组件容器和事件总线
    this.container = new ComponentContainer()
    this.eventBus = EventBus.getInstance()
    
    // 创建 Promise 用于等待场景就绪
    this.sceneReadyPromise = new Promise((resolve) => {
      this.resolveReady = resolve
    })
    
    console.log('🎮 [ComponentGameScene] 游戏场景已创建')
  }
  
  /**
   * 启动游戏
   * 
   * @param config - 覆盖配置
   * @returns Promise
   * 
   * @public
   */
  public async start(config: Partial<GameSceneConfig> = {}): Promise<void> {
    if (this.isInitialized) {
      console.warn('[ComponentGameScene] 游戏已启动，忽略重复调用')
      return
    }
    
    // ⭐ 从 sessionStorage 读取保存的配置（仅本次会话有效）
    const savedConfigStr = sessionStorage.getItem('game-config')
    if (savedConfigStr) {
      try {
        const savedConfig = JSON.parse(savedConfigStr)
        console.log('📖 [ComponentGameScene] 读取到保存的配置:', savedConfig)
        
        // 合并配置：优先级：传入参数 > sessionStorage > 默认配置
        this.config = { 
          ...this.config, 
          ...savedConfig,
          ...config 
        }
            
        console.log('⚙️ [ComponentGameScene] 已应用自定义配置')
            
        // ⭐ 应用网格和单元格配置（支持动态调整）
        this.gridCols = this.config.gridCols ?? this.DEFAULT_GRID_COLS
        this.gridRows = this.config.gridRows ?? this.DEFAULT_GRID_ROWS
        this.cellSize = this.config.cellSize ?? 40
            
        console.log(`⚙️ [ComponentGameScene] 网格配置：${this.gridCols}x${this.gridRows}, cellSize=${this.cellSize}px`)
      } catch (error) {
        console.error('❌ [ComponentGameScene] 解析配置失败:', error)
        // 解析失败时使用默认配置
        this.config = { ...this.config, ...config }
      }
    } else {
      // 没有保存的配置，使用传入参数
      this.config = { ...this.config, ...config }
    }
    
    console.log('🚀 [ComponentGameScene] 开始启动游戏...')
    
    try {
      // 1. 创建隐藏的 Phaser 场景用于渲染
      this.createPhaserScene()
      
      // 2. 等待 Phaser 场景创建完成
      await this.sceneReadyPromise
      
      // ⭐ 检查场景是否仍然有效（防止热更新期间 scene 被清理）
      if (!this.scene) {
        console.warn('[ComponentGameScene] 场景在等待期间被清理，跳过启动')
        return
      }
      
      // 3. 注册所有组件
      this.registerComponents()
      
      // 4. 初始化所有组件
      this.initializeComponents()
      
      // 5. 启动游戏
      this.launchGame()
      
      // ⭐ 清理配置（避免重复使用）
      sessionStorage.removeItem('game-config')
      console.log('🗑️ [ComponentGameScene] 已清理临时配置')
      
      this.isInitialized = true
      console.log('✅ [ComponentGameScene] 游戏启动完成！')
    } catch (error) {
      console.error('❌ [ComponentGameScene] 游戏启动失败:', error)
      throw error
    }
  }
  
  /**
   * 暂停游戏
   * 
   * @public
   */
  public pause(): void {
    const pauseManager = this.container.get<PauseManagerComponent>('pause_manager')
    pauseManager?.pauseGame()
  }
  
  /**
   * 恢复游戏
   * 
   * @public
   */
  public resume(): void {
    const pauseManager = this.container.get<PauseManagerComponent>('pause_manager')
    pauseManager?.resumeGame()
  }
  
  /**
   * 停止游戏
   * 
   * @public
   */
  public stop(): void {
    console.log('🛑 [ComponentGameScene] 停止游戏')
    
    // 销毁所有组件
    this.container.destroyAll()
    
    // 销毁 Phaser 场景
    if (this.scene) {
      this.scene.scene.stop()
      this.scene = null
    }
    
    this.isInitialized = false
  }
  
  /**
   * 获取当前分数
   * 
   * @returns 当前分数
   * 
   * @public
   */
  public getScore(): number {
    const scoreManager = this.container.get<ScoreManagerComponent>('score_manager')
    return scoreManager?.getScore() ?? 0
  }
  
  /**
   * 获取最高分
   * 
   * @returns 最高分
   * 
   * @public
   */
  public getHighScore(): number {
    const scoreManager = this.container.get<ScoreManagerComponent>('score_manager')
    return scoreManager?.getHighScore() ?? 0
  }
  
  /**
   * 获取游戏统计信息
   * 
   * @returns 统计信息对象
   * 
   * @public
   */
  public getStats(): {
    score: number
    highScore: number
    difficulty: DifficultyLevel
    isPaused: boolean
  } {
    const scoreManager = this.container.get<ScoreManagerComponent>('score_manager')
    const gameConfig = this.container.get<GameConfigComponent>('game_config')
    const pauseManager = this.container.get<PauseManagerComponent>('pause_manager')
    
    return {
      score: scoreManager?.getScore() ?? 0,
      highScore: scoreManager?.getHighScore() ?? 0,
      difficulty: gameConfig?.getCurrentDifficulty() ?? 'normal',
      isPaused: pauseManager?.getIsPaused() ?? false
    }
  }
  
  /**
   * 创建 Phaser 场景
   * 
   * @private
   */
  private createPhaserScene(): void {
    // 创建一个隐藏的 Phaser 场景用于组件渲染
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: this.containerElement,
      width: '100%',
      height: '100%',
      transparent: true,
      scene: {
        preload: () => this.preload(),
        create: () => this.create(),
        update: (time: number, delta: number) => this.update(time, delta)
      }
    }
    
    const game = new Phaser.Game(config)
    this.scene = game.scene.scenes[0]
    
    console.log('🎨 [ComponentGameScene] Phaser 场景已创建')
  }
  
  /**
   * 注册所有组件
   * 
   * @private
   */
  private registerComponents(): void {
    if (!this.scene) {
      throw new Error('[ComponentGameScene] Phaser 场景未创建')
    }
    
    console.log('📦 [ComponentGameScene] 开始注册组件...')
    
    // === 渲染组件（5 个）===
    this.container.add(new BackgroundRenderer(this.scene))
    this.container.add(new GridRenderer(this.scene))
    this.container.add(new SnakeRenderer(this.scene))
    this.container.add(new FoodRenderer(this.scene))
    this.container.add(new ParticleRenderer(this.scene))
    
    // === 逻辑组件（7 个）===
    this.container.add(new GameStateComponent(this.scene))
    this.container.add(new SnakeMovementComponent(this.scene))
    this.container.add(new CollisionDetectionComponent(this.scene))
    this.container.add(new FoodSpawnerComponent(this.scene))
    this.container.add(new ScoreManagerComponent(this.scene))
    this.container.add(new GameConfigComponent(this.scene))
    this.container.add(new PauseManagerComponent(this.scene))
    
    // === 控制组件（1 个）===
    this.container.add(new InputHandlerComponent(this.scene))
    
    console.log(`✅ [ComponentGameScene] 已注册 ${this.container.getStats().total} 个组件`)
  }
  
  /**
   * 初始化所有组件
   * 
   * @private
   */
  private initializeComponents(): void {
    const config = this.config
    
    // ⭐ 获取 gameStore（用于传递 customConfig）
    const gameStore = useGameStore()
    
    // 获取难度配置
    const gameConfig = this.container.get<GameConfigComponent>('game_config')
    
    // ⭐ 先应用自定义配置到 GameConfigComponent
    if (gameStore.customConfig) {
      console.log('⚙️ [ComponentGameScene] 检测到自定义配置，准备应用...')
      gameConfig?.applyCustomConfig(gameStore.customConfig)
    }
    
    // ⭐ 获取合并后的配置（已包含自定义）
    const difficultyConfig = gameConfig?.getCurrentConfig() // ⭐ 使用 getCurrentConfig 而非 getDifficultyConfig
    
    // 初始化参数
    const params = {
      // ⭐ 通用配置（使用动态配置的网格和单元格）
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      cellSize: this.cellSize,
      gridCols: this.gridCols,  // ✅ 使用实例属性
      gridRows: this.gridRows,  // ✅ 使用实例属性
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      
      // ⭐ 蛇配置（使用合并后的配置）
      initialLength: difficultyConfig?.initialLength ?? 4,
      speed: difficultyConfig?.speed ?? 200,
      
      // ⭐ 食物配置（使用合并后的配置）
      availableTypes: ['normal', 'bonus', 'special'] as const,
      typeProbabilities: {
        normal: 0.8,
        bonus: 0.15,
        special: 0.05
      },
      
      // 分数配置
      normalFoodScore: difficultyConfig?.normalScore ?? 10,
      bonusFoodScore: difficultyConfig?.bonusScore ?? 50,
      specialFoodScore: difficultyConfig?.specialScore ?? 100,
      
      // 难度配置
      defaultDifficulty: config.difficulty || 'normal',
      enableDynamicDifficulty: config.enableDynamicDifficulty ?? true,
      
      // 暂停配置
      enableEscKey: true,
      enableSpaceKey: true,
      autoPauseOnBlur: true,
      
      // 输入配置
      enableArrowKeys: true,
      enableWASDKeys: true
    }
    
    console.log('⚙️ [ComponentGameScene] 初始化组件配置:', params)
    
    // 初始化所有组件
    this.container.initAll(params)
  }
  
  /**
   * 启动游戏
   * 
   * @private
   */
  private launchGame(): void {
    const gameState = this.container.get<GameStateComponent>('game_state')
    if (gameState) {
      gameState.startGame()
      console.log('▶️ [ComponentGameScene] 游戏已开始')
    }
  }
  
  /**
   * Phaser preload 生命周期
   * 
   * @private
   */
  private preload(): void {
    console.log('📥 [ComponentGameScene] Preloading resources...')
    
    // 这里可以添加资源加载逻辑
    // 目前由 BackgroundRenderer 等组件自行处理
  }
  
  /**
   * Phaser create 生命周期
   * 
   * @private
   */
  private create(): void {
    console.log('🎨 [ComponentGameScene] Creating scene...')
    
    // ⭐ 计算游戏区域居中偏移（使用动态配置的网格）
    const gameWidth = this.gridCols * this.cellSize
    const gameHeight = this.gridRows * this.cellSize
    this.offsetX = (window.innerWidth - gameWidth) / 2
    this.offsetY = (window.innerHeight - gameHeight) / 2
    
    // 标记场景已创建完成
    this.isSceneCreated = true
    this.resolveReady()
    
    console.log('✅ [ComponentGameScene] Phaser 场景创建完成，准备注册组件')
  }
  
  /**
   * Phaser update 生命周期
   * 
   * @param time - 当前时间（毫秒）
   * @param delta - 距离上一帧的时间间隔（毫秒）
   * 
   * @private
   */
  private update(time: number, delta: number): void {
    if (!this.isInitialized) return
    
    // 检查是否暂停
    const pauseManager = this.container.get<PauseManagerComponent>('pause_manager')
    if (pauseManager?.getIsPaused()) {
      return // 暂停状态下不更新
    }
    
    // 更新所有组件
    this.container.updateAll(delta)
  }
}
