// ============================================================================
// 🎮 游戏场景模板
// ============================================================================
// 
// 📌 说明:
//   这是游戏主场景的模板
//   ⭐ 需要根据具体游戏重写此文件
// 
// 框架提供的组件（可直接使用）：
// - BackgroundRenderer - 背景渲染
// - GridRenderer - 网格渲染
// - ParticleRenderer - 粒子效果
// - CollisionDetectionComponent - 碰撞检测
// - ScoreManagerComponent - 分数管理
// - PauseManagerComponent - 暂停管理
// - InputHandlerComponent - 输入处理
// ============================================================================

import { ComponentContainer } from '@/frame-factory/core/ComponentContainer'
import { EventBus, GameEventType } from '@/frame-factory/core/GameEvent'
import { BackgroundRenderer } from '@/frame-factory/components/rendering/BackgroundRenderer'
import { GridRenderer } from '@/frame-factory/components/rendering/GridRenderer'
import { ParticleRenderer } from '@/frame-factory/components/rendering/ParticleRenderer'
import { CollisionDetectionComponent } from '@/frame-factory/components/logic/CollisionDetectionComponent'
import { ScoreManagerComponent } from '@/frame-factory/components/logic/ScoreManagerComponent'
import { PauseManagerComponent } from '@/frame-factory/components/logic/PauseManagerComponent'
import { InputHandlerComponent } from '@/frame-factory/components/control/InputHandlerComponent'
import { useGameStore } from '@/stores/game'

/**
 * 游戏场景配置
 */
export interface GameSceneConfig {
  gridCols?: number
  gridRows?: number
  cellSize?: number
}

/**
 * 游戏场景类
 * 
 * @remarks
 * 这是游戏主场景的基类模板
 * 开发者需要：
 * 1. 继承此类或直接实现
 * 2. 重写 createGameObjects() 实现游戏特定的对象创建
 * 3. 重写 updateGame() 实现游戏特定的更新逻辑
 * 4. 重写 renderGame() 实现游戏特定的渲染逻辑
 * 
 * @example
 * ```typescript
 * class MyGameScene extends GameScene {
 *   protected createGameObjects(): void {
 *     // 创建玩家飞机
 *     this.player = new Player(this.scene)
 *   }
 *   
 *   protected updateGame(deltaTime: number): void {
 *     // 更新玩家位置
 *     this.player.update(deltaTime)
 *   }
 * }
 * ```
 */
export class GameScene {
  /** 组件容器 */
  protected container: ComponentContainer
  
  /** 事件总线 */
  protected eventBus: EventBus
  
  /** Phaser 场景 */
  protected scene: Phaser.Scene | null = null
  
  /** 游戏配置 */
  protected config: GameSceneConfig
  
  /** 适配参数 */
  protected adapt = {
    screenW: 0,
    screenH: 0,
    cellSize: 40,
    offsetX: 0,
    offsetY: 0
  }
  
  /** 游戏状态 */
  protected isInitialized: boolean = false
  protected isPaused: boolean = false
  
  /**
   * 构造函数
   */
  constructor(config: GameSceneConfig = {}) {
    this.container = new ComponentContainer()
    this.eventBus = EventBus.getInstance()
    this.config = {
      gridCols: 24,
      gridRows: 18,
      cellSize: 40,
      ...config
    }
  }
  
  /**
   * 启动游戏
   */
  public async start(containerElement: HTMLElement): Promise<void> {
    if (this.isInitialized) return
    
    // 获取游戏配置
    const gameStore = useGameStore()
    const mergedConfig = gameStore.mergedConfig
    
    // 创建 Phaser 场景
    this.createPhaserScene(containerElement, mergedConfig)
    
    // 等待 Phaser 创建完成
    await this.waitForScene()
    
    // 初始化组件
    this.initComponents(mergedConfig)
    
    // 创建游戏特定对象
    this.createGameObjects()
    
    this.isInitialized = true
    gameStore.startGame()
    
    console.log('[GameScene] 游戏已启动')
  }
  
  /**
   * 创建 Phaser 场景
   */
  private createPhaserScene(element: HTMLElement, config: { gridCols: number; gridRows: number }): void {
    const self = this
    
    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: element,
      width: '100%',
      height: '100%',
      transparent: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: {
        preload() { self.preload.call(self, this) },
        create() { self.onCreate.call(self, this) },
        update(time: number, delta: number) { self.update.call(self, time, delta) }
      }
    }
    
    new Phaser.Game(phaserConfig)
  }
  
  /**
   * 等待场景创建
   */
  private waitForScene(): Promise<void> {
    return new Promise(resolve => {
      const check = () => {
        if (this.scene) {
          resolve()
        } else {
          setTimeout(check, 50)
        }
      }
      check()
    })
  }
  
  /**
   * 初始化组件
   */
  protected initComponents(config: { gridCols: number; gridRows: number; speed: number }): void {
    // 计算适配参数
    this.adapt.screenW = this.scene?.scale.width || window.innerWidth
    this.adapt.screenH = this.scene?.scale.height || window.innerHeight
    this.adapt.cellSize = Math.min(
      (this.adapt.screenW * 0.9) / config.gridCols,
      (this.adapt.screenH * 0.8) / config.gridRows
    )
    
    const gameWidth = config.gridCols * this.adapt.cellSize
    const gameHeight = config.gridRows * this.adapt.cellSize
    this.adapt.offsetX = (this.adapt.screenW - gameWidth) / 2
    this.adapt.offsetY = (this.adapt.screenH - gameHeight) / 2
    
    // 初始化通用组件
    const params = {
      screenWidth: this.adapt.screenW,
      screenHeight: this.adapt.screenH,
      gridCols: config.gridCols,
      gridRows: config.gridRows,
      cellSize: this.adapt.cellSize,
      offsetX: this.adapt.offsetX,
      offsetY: this.adapt.offsetY,
      bgColor: '#1a1a2e',
      enableEscKey: true,
      enableSpaceKey: true,
      autoPauseOnBlur: true
    }
    
    // 添加通用组件
    this.container.add(new BackgroundRenderer(this.scene!))
    this.container.add(new GridRenderer(this.scene!))
    this.container.add(new ParticleRenderer(this.scene!))
    this.container.add(new CollisionDetectionComponent(this.scene!))
    this.container.add(new ScoreManagerComponent(this.scene!))
    this.container.add(new PauseManagerComponent(this.scene!))
    this.container.add(new InputHandlerComponent(this.scene!))
    
    // 初始化所有组件
    this.container.initAll(params)
    
    console.log('[GameScene] 组件初始化完成')
  }
  
  /**
   * ⭐ 创建游戏对象（子类重写）
   */
  protected createGameObjects(): void {
    // TODO: 在子类中重写此方法
    // 创建游戏特定的对象，如玩家、敌人、道具等
    console.log('[GameScene] 创建游戏对象 - 请重写 createGameObjects()')
  }
  
  /**
   * Phaser preload
   */
  protected preload(_scene: Phaser.Scene): void {
    // TODO: 加载游戏资源
  }
  
  /**
   * Phaser create
   */
  protected onCreate(scene: Phaser.Scene): void {
    this.scene = scene
    
    // 监听场景尺寸变化
    scene.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.adapt.screenW = gameSize.width
      this.adapt.screenH = gameSize.height
    })
  }
  
  /**
   * Phaser update
   */
  protected update(_time: number, delta: number): void {
    if (!this.isInitialized) return
    if (this.isPaused) return
    
    // 更新所有组件
    this.container.updateAll(delta)
    
    // 更新游戏逻辑
    this.updateGame(delta)
  }
  
  /**
   * ⭐ 更新游戏逻辑（子类重写）
   */
  protected updateGame(_deltaTime: number): void {
    // TODO: 在子类中重写此方法
    // 实现具体的游戏逻辑
  }
  
  /**
   * ⭐ 渲染游戏对象（子类重写）
   */
  protected renderGame(): void {
    // TODO: 在子类中重写此方法
    // 渲染游戏特定的对象
  }
  
  /**
   * 暂停游戏
   */
  public pause(): void {
    this.isPaused = true
    this.container.disable('pause_manager')
  }
  
  /**
   * 恢复游戏
   */
  public resume(): void {
    this.isPaused = false
    this.container.enable('pause_manager')
  }
  
  /**
   * 停止游戏
   */
  public stop(): void {
    this.container.destroyAll()
    this.eventBus.clearAll()
    if (this.scene) {
      this.scene.scene.stop()
      this.scene = null
    }
    this.isInitialized = false
  }
  
  /**
   * 获取分数
   */
  public getScore(): number {
    return this.container.get<ScoreManagerComponent>('score_manager')?.getScore() ?? 0
  }
  
  /**
   * 添加分数
   */
  public addScore(points: number): void {
    this.container.get<ScoreManagerComponent>('score_manager')?.addScore(points)
  }
}
