// ============================================================================
// 🎮 ComponentGameSceneV2 - 新架构游戏场景
// ============================================================================
//
// 📌 职责：
//   - 组织并启动所有 components/logic/ 下的逻辑组件
//   - 委托 SnakePhaserGame 负责渲染（复用已有成熟渲染层）
//   - 将 EventBus 事件桥接到渲染侧
//   - 暴露 pause/resume/stop 给 Vue 层调用
//
// 📌 与旧 ComponentGameScene 的区别：
//   - 旧版：自己创建一个空的 Phaser.Game 用于渲染，使用 components/rendering/ 下的基础渲染器（无 GTRS 皮肤）
//   - 新版：委托 SnakePhaserGame（PhaserGame.ts）负责渲染，完整支持 GTRS 主题皮肤
//
// ============================================================================

import { ComponentContainer } from '@/components/core/ComponentContainer'
import { EventBus } from '@/components/core/EventBus'
import { GameEventType } from '@/components/core/GameEvent'
import type { GameEvent } from '@/components/core/GameEvent'

// 逻辑组件
import { GameStateComponent } from '@/components/logic/GameStateComponent'
import { SnakeMovementComponent } from '@/components/logic/SnakeMovementComponent'
import type { Direction } from '@/components/logic/SnakeMovementComponent'
import { CollisionDetectionComponent } from '@/components/logic/CollisionDetectionComponent'
import { FoodSpawnerComponent } from '@/components/logic/FoodSpawnerComponent'
import { ScoreManagerComponent } from '@/components/logic/ScoreManagerComponent'
import { GameConfigComponent } from '@/components/logic/GameConfigComponent'
import type { DifficultyLevel } from '@/components/logic/GameConfigComponent'

// ⭐ 新增：食物类型和效果导入
import { getFoodConfig, applyFoodEffect, type FoodType } from '../types/FoodTypes'
import { PauseManagerComponent } from '@/components/logic/PauseManagerComponent'

// 控制组件
import { InputHandlerComponent } from '@/components/control/InputHandlerComponent'

// 渲染层（成熟的 PhaserGame，支持 GTRS 皮肤）
import { SnakePhaserGame } from '@/components/game/PhaserGame'

// ============================================================================
// 类型定义
// ============================================================================

export interface SceneV2Config {
  difficulty?: DifficultyLevel
  themeId?: string
  enableDynamicDifficulty?: boolean
  gridCols?: number
  gridRows?: number
  cellSize?: number
}

// ============================================================================
// ComponentGameSceneV2
// ============================================================================

export class ComponentGameSceneV2 {
  // ─── 核心对象 ───
  private container: ComponentContainer
  private eventBus: EventBus
  private phaserGame: SnakePhaserGame | null = null

  // ─── 配置 ───
  private config: SceneV2Config

  // ─── 状态 ───
  private isInitialized = false
  private isGameOver = false  // 防止碰撞事件重复触发 GAME_OVER
  private currentFoodPosition: { x: number; y: number } | null = null  // 当前食物位置（用于吃食物检测）

  // ─── EventBus 订阅 ID（生命周期内清理） ───
  private subscriptionIds: string[] = []

  // ─── 游戏循环（requestAnimationFrame） ───
  private rafId: number | null = null
  private lastRafTime = 0

  constructor(
    private containerElement: HTMLElement,
    config: SceneV2Config = {}
  ) {
    this.config = {
      difficulty: 'normal',
      enableDynamicDifficulty: true,
      ...config,
    }
    this.container = new ComponentContainer()
    this.eventBus = EventBus.getInstance()
    console.log('🎮 [ComponentGameSceneV2] 实例已创建')
  }

  // ============================================================
  // 公开 API
  // ============================================================

  /** 启动游戏（异步：等待 Phaser 资源加载） */
  public async start(config: Partial<SceneV2Config> = {}): Promise<void> {
    if (this.isInitialized) {
      console.warn('[ComponentGameSceneV2] 已启动，忽略重复调用')
      return
    }

    this.config = { ...this.config, ...config }

    // 1. 读取会话自定义配置（如难度页传入的 cellSize 等）
    this.applySessionConfig()

    console.log('🚀 [ComponentGameSceneV2] 开始启动...')

    try {
      // 2. 启动 PhaserGame（负责 GTRS 加载 + 渲染）
      await this.startPhaserGame()

      // 3. 注册并初始化逻辑组件
      this.registerComponents()
      this.initializeComponents()

      // 4. 桥接 EventBus → ComponentContainer（让逻辑组件的 handleEvent 被触发）
    this.bridgeEventBusToComponents()

    // 5. 桥接 EventBus → PhaserGame 渲染
      this.bridgeEventBusToRenderer()

      // 5. 启动游戏状态（触发 GAME_START 事件）
      this.launchGame()

      // 6. 启动 JS 游戏逻辑循环
      this.startLogicLoop()

      this.isInitialized = true
      console.log('✅ [ComponentGameSceneV2] 启动完成！')
    } catch (err) {
      console.error('[ComponentGameSceneV2] 启动失败:', err)
      throw err
    }
  }

  /** 暂停游戏（逻辑侧） */
  public pause(): void {
    const pauseManager = this.container.get<PauseManagerComponent>('pause_manager')
    pauseManager?.pauseGame()
  }

  /** 恢复游戏（逻辑侧） */
  public resume(): void {
    const pauseManager = this.container.get<PauseManagerComponent>('pause_manager')
    pauseManager?.resumeGame()
  }

  /** 暂停 Phaser 渲染（画面冻结） */
  public pausePhaser(): void {
    this.phaserGame?.stopAllBgm()
    this.phaserGame?.pauseScene()
  }

  /** 恢复 Phaser 渲染 */
  public resumePhaser(): void {
    this.phaserGame?.playBgmGameplay()
    this.phaserGame?.resumeScene()
  }

  /** 停止游戏并清理资源 */
  public stop(): void {
    console.log('🛑 [ComponentGameSceneV2] 停止游戏')

    // 停止逻辑循环
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    // 取消 EventBus 订阅
    this.subscriptionIds.forEach(id => this.eventBus.off(id))
    this.subscriptionIds = []

    // 销毁逻辑组件
    this.container.destroyAll()

    // 销毁 Phaser 渲染层
    this.phaserGame?.destroy()
    this.phaserGame = null

    this.isInitialized = false
  }

  // ============================================================
  // 私有：PhaserGame 启动
  // ============================================================

  private async startPhaserGame(): Promise<void> {
    this.phaserGame = new SnakePhaserGame(this.containerElement)

    const themeId = this.config.themeId || ''
    const difficulty = this.config.difficulty as any || 'normal'

    await this.phaserGame.start(difficulty, themeId)
    await this.phaserGame.waitForReady(10000)

    console.log('[ComponentGameSceneV2] ✅ PhaserGame 已就绪，cellSize =', this.phaserGame.getCellSize().toFixed(2))
  }

  // ============================================================
  // 私有：组件注册 & 初始化
  // ============================================================

  private registerComponents(): void {
    this.container.add(new GameStateComponent(null as any))
    this.container.add(new SnakeMovementComponent(null as any))
    this.container.add(new CollisionDetectionComponent(null as any))
    this.container.add(new FoodSpawnerComponent(null as any))
    this.container.add(new ScoreManagerComponent(null as any))
    this.container.add(new GameConfigComponent(null as any))
    this.container.add(new PauseManagerComponent(null as any))
    this.container.add(new InputHandlerComponent(null as any))

    console.log(`📦 [ComponentGameSceneV2] 已注册 ${this.container.getStats().total} 个逻辑组件`)
  }

  private initializeComponents(): void {
    const cellSize = this.phaserGame?.getCellSize() ?? (this.config.cellSize ?? 40)
    const gameConfig = this.container.get<GameConfigComponent>('game_config')
    const difficultyConfig = gameConfig?.getCurrentConfig()

    // 从 PhaserGame 获取网格参数（与渲染层保持一致）
    const gridCols = (this.phaserGame as any)?.GRID_COLS ?? this.config.gridCols ?? 32
    const gridRows = (this.phaserGame as any)?.GRID_ROWS ?? this.config.gridRows ?? 18

    const params = {
      // 网格参数（与渲染层对齐）
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      cellSize,
      gridCols,
      gridRows,
      offsetX: 0,
      offsetY: 0,

      // 蛇配置
      initialLength: difficultyConfig?.initialLength ?? 4,
      speed: difficultyConfig?.speed ?? 200,

      // 食物配置
      availableTypes: ['normal', 'bonus', 'special'] as const,
      typeProbabilities: { normal: 0.8, bonus: 0.15, special: 0.05 },
      normalFoodScore:   difficultyConfig?.normalScore   ?? 10,
      bonusFoodScore:    difficultyConfig?.bonusScore    ?? 50,
      specialFoodScore:  100,  // DifficultyConfig 无 specialScore 字段，使用固定值

      // 难度配置
      defaultDifficulty: this.config.difficulty || 'normal',
      enableDynamicDifficulty: this.config.enableDynamicDifficulty ?? true,

      // 暂停 & 输入
      enableEscKey:      true,
      enableSpaceKey:    true,
      autoPauseOnBlur:   true,
      enableArrowKeys:   true,
      enableWASDKeys:    true,
    }

    this.container.initAll(params)
    console.log('⚙️ [ComponentGameSceneV2] 组件初始化完成，cellSize =', cellSize.toFixed(2), `gridCols=${gridCols} gridRows=${gridRows}`)
  }

  private launchGame(): void {
    const gameState = this.container.get<GameStateComponent>('game_state')
    gameState?.startGame()
    this.phaserGame?.playBgmGameplay()
    console.log('▶️ [ComponentGameSceneV2] 游戏已开始')
  }

  // ============================================================
  // 私有：EventBus → ComponentContainer（逻辑组件事件路由）
  // ============================================================

  /**
   * 将 EventBus 上的所有游戏事件广播到 ComponentContainer
   * 这样各逻辑组件的 handleEvent 就能收到事件
   */
  private bridgeEventBusToComponents(): void {
    const ALL_EVENTS = Object.values(GameEventType)
    ALL_EVENTS.forEach(eventType => {
      this.subscriptionIds.push(
        this.eventBus.on(eventType, (event) => {
          this.container.broadcast(event)
        })
      )
    })
    console.log(`🔗 [ComponentGameSceneV2] EventBus → ComponentContainer 桥接完成（${ALL_EVENTS.length} 个事件类型）`)
  }

  // ============================================================
  // 私有：EventBus → PhaserGame 渲染桥接
  // ============================================================

  private bridgeEventBusToRenderer(): void {
    if (!this.phaserGame) return

    // 蛇移动 → 渲染蛇 + 食物碰撞检测
    this.subscriptionIds.push(
      this.eventBus.on(GameEventType.SNAKE_MOVE, (event: GameEvent) => {
        const { snake, direction } = event.payload ?? {}
        if (snake && direction) {
          // renderSnake 第二参数为旋转弧度（与 stores/game.ts 保持一致）
          const radianMap: Record<Direction, number> = {
            right:  0,
            down:   Math.PI / 2,
            left:   Math.PI,
            up:    -Math.PI / 2,
          }
          this.phaserGame?.renderSnake(snake, radianMap[direction as Direction] ?? 0)
          // 同步蛇数据到道具碰撞检测
          this.phaserGame?.updateSnakeData(snake)

          // ✅ 食物碰撞检测：蛇头 vs 当前食物位置
          if (this.currentFoodPosition && snake.length > 0) {
            const head = snake[0]
            const food = this.currentFoodPosition
            const collisionDetector = this.container.get<CollisionDetectionComponent>('collision_detection')
            const hit = collisionDetector?.checkFoodCollision(head, food as any)
            if (hit) {
              // ⭐ 新增：获取食物类型和配置
              const eatenFood = this.currentFoodPosition
              const foodType: FoodType = (eatenFood as any)?.type || 'normal'
              const foodConfig = getFoodConfig(foodType)
              
              // 清除当前食物位置
              this.currentFoodPosition = null
              
              // 发出 FOOD_CONSUMED 事件
              this.eventBus.emit({
                type: GameEventType.FOOD_CONSUMED,
                payload: {
                  position: eatenFood,
                  snake: snake,
                  obstacles: [],
                  foodType: foodType,        // ⭐ 新增
                  foodConfig: foodConfig     // ⭐ 新增
                },
                timestamp: Date.now()
              })
              
              // ⭐ 根据食物类型决定增长长度
              const growth = foodConfig.growsSnake ? (foodConfig.lengthIncrease || 1) : 1
              const snakeMovement = this.container.get<SnakeMovementComponent>('snake_movement')
              snakeMovement?.grow(growth)
              
              // ⭐ 根据食物类型加分
              const score = foodConfig.baseScore || 10
              const scoreManager = this.container.get<ScoreManagerComponent>('score_manager')
              scoreManager?.addScore(score)
              
              // ⭐ 应用食物效果（如果有）
              if (foodConfig.effect) {
                console.log(`✨ [Scene] 应用食物效果：${foodConfig.effect.type}`)
                
                // 构建游戏状态对象
                const gameState = {
                  speed: this.customConfig?.speed || 120,
                  originalSpeed: this.customConfig?.speed || 120,
                  invincible: false,
                  snake: snake,
                  scoreMultiplier: 1
                }
                
                // 应用效果
                applyFoodEffect(foodConfig.effect, gameState)
                
                // ✅ 将效果应用到实际游戏状态
                if (this.customConfig) {
                  this.customConfig.speed = gameState.speed
                }
                
                console.log(`   ├─ 速度：${gameState.originalSpeed} → ${gameState.speed}`)
                console.log(`   ├─ 无敌：${gameState.invincible}`)
                console.log(`   └─ 倍增：${gameState.scoreMultiplier}x`)
              }
              
              console.log(`🍎 [Scene] 吃到食物！类型=${foodType}, 分数=${score}, 增长=${growth}`)
            }
          }
        }
      })
    )

    // 食物生成 / 消耗 → 渲染食物
    this.subscriptionIds.push(
      this.eventBus.on(GameEventType.FOOD_SPAWN, (event: GameEvent) => {
        const food = event.payload?.food
        console.log('📡 [Scene] 收到 FOOD_SPAWN 事件')
        console.log('   ├─ 食物数据:', food)
        console.log('   ├─ 食物类型:', food?.type)
        console.log('   └─ 食物位置:', food?.position)
        
        if (food) {
          // 记录当前食物位置（供 SNAKE_MOVE 事件做吃食物检测）
          this.currentFoodPosition = { x: food.x, y: food.y }
          
          // FoodSpawnerComponent 发出的 food 结构是 { x, y, type, score }，x/y 已是像素坐标
          // renderFood 需要 { position: { x, y }, type }
          const renderData = {
            position: { x: food.x, y: food.y },
            type: food.type ?? 'normal',
            score: food.score ?? 10
          }
          
          console.log('🎨 [Scene] 准备渲染食物:', renderData)
          
          // 调用渲染
          if (this.phaserGame) {
            console.log('✅ [Scene] PhaserGame 实例存在')
            this.phaserGame.renderFood(renderData as any)
            
            // 验证是否渲染成功
            setTimeout(() => {
              console.log('🔍 [Scene] 渲染后检查:')
              console.log('   └─ 食物精灵:', !!this.phaserGame?.foodSprite)
            }, 100)
          } else {
            console.error('❌ [Scene] PhaserGame 实例不存在!')
          }
        }
      })
    )
    this.subscriptionIds.push(
      this.eventBus.on(GameEventType.FOOD_CONSUMED, (event: GameEvent) => {
        // 食物被吃掉时，播放音效 + 粒子
        const pos = event.payload?.position
        if (pos) {
          this.phaserGame?.playSound('eat')
          this.phaserGame?.createExplosion(pos.x, pos.y, '#4ade80')
        }
      })
    )

    // 碰撞（墙/自身/障碍物） → 音效 + 结束游戏
    const handleCollision = () => {
      if (this.isGameOver) return  // 防止重复触发
      this.isGameOver = true
      this.phaserGame?.playSound('crash')
      this.phaserGame?.shakeScreen()
      // ✅ 关键：碰撞后必须触发 GAME_OVER，否则蛇会继续运动反复碰撞
      const gameState = this.container.get<GameStateComponent>('game_state')
      gameState?.gameOver()
    }
    this.subscriptionIds.push(
      this.eventBus.on(GameEventType.SNAKE_COLLIDE_WALL, handleCollision)
    )
    this.subscriptionIds.push(
      this.eventBus.on(GameEventType.SNAKE_COLLIDE_SELF, handleCollision)
    )
    this.subscriptionIds.push(
      this.eventBus.on(GameEventType.SNAKE_COLLIDE_OBSTACLE, handleCollision)
    )

    // 游戏结束 → 音效 + 停止 BGM
    this.subscriptionIds.push(
      this.eventBus.on(GameEventType.GAME_OVER, () => {
        this.phaserGame?.playSound('gameover')
        this.phaserGame?.stopAllBgm()
      })
    )

    // 暂停 → Phaser 冻结
    this.subscriptionIds.push(
      this.eventBus.on(GameEventType.PAUSE, () => {
        this.phaserGame?.stopAllBgm()
        this.phaserGame?.pauseScene()
      })
    )

    // 恢复 → Phaser 解冻
    this.subscriptionIds.push(
      this.eventBus.on(GameEventType.RESUME, () => {
        this.phaserGame?.playBgmGameplay()
        this.phaserGame?.resumeScene()
      })
    )

    // 游戏重新开始 → 重置 isGameOver 标志位
    this.subscriptionIds.push(
      this.eventBus.on(GameEventType.GAME_START, () => {
        this.isGameOver = false
      })
    )

    console.log('🔌 [ComponentGameSceneV2] EventBus → PhaserGame 渲染桥接完成')
  }

  // ============================================================
  // 私有：JS 逻辑循环（驱动 ComponentContainer.updateAll）
  // ============================================================

  private startLogicLoop(): void {
    this.lastRafTime = performance.now()

    const loop = (now: number) => {
      const delta = now - this.lastRafTime
      this.lastRafTime = now

      // 暂停时不更新逻辑
      const pauseManager = this.container.get<PauseManagerComponent>('pause_manager')
      if (!pauseManager?.getIsPaused()) {
        this.container.updateAll(delta)
      }

      this.rafId = requestAnimationFrame(loop)
    }

    this.rafId = requestAnimationFrame(loop)
    console.log('🔄 [ComponentGameSceneV2] 逻辑循环已启动')
  }

  // ============================================================
  // 私有：读取会话自定义配置
  // ============================================================

  private applySessionConfig(): void {
    const savedStr = sessionStorage.getItem('game-config')
    if (!savedStr) return
    try {
      const saved = JSON.parse(savedStr)
      this.config = { ...this.config, ...saved }
      sessionStorage.removeItem('game-config')
      console.log('📖 [ComponentGameSceneV2] 已应用会话自定义配置')
    } catch {
      // 解析失败忽略
    }
  }
}
