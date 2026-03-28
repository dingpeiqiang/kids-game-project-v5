// ============================================================================
// 🎭 游戏对象渲染组件
// ============================================================================
// 
// 📌 说明:
//   负责渲染各种游戏对象（蛇、食物、障碍物等）
//   支持精灵、图形、动画等多种渲染方式
//   提供对象池优化性能
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import Phaser from 'phaser'
import type { Position } from '../types/common'

/**
 * ⭐ 游戏对象类型
 */
export type GameObjectType = 'snake' | 'food' | 'obstacle' | 'player' | 'enemy' | 'item' | 'projectile'

/**
 * ⭐ 游戏对象配置接口
 */
interface GameObjectConfig {
  /** 对象 ID */
  id: string
  /** 对象类型 */
  type: GameObjectType
  /** X 坐标（像素） */
  x: number
  /** Y 坐标（像素） */
  y: number
  /** 宽度（像素） */
  width?: number
  /** 高度（像素） */
  height?: number
  /** 半径（圆形对象） */
  radius?: number
  /** 纹理键名（可选） */
  textureKey?: string
  /** 帧索引（可选，用于动画） */
  frameIndex?: number
  /** 颜色（可选，用于图形渲染） */
  color?: number
  /** 透明度 */
  alpha?: number
  /** 旋转角度（弧度） */
  rotation?: number
  /** 缩放比例 */
  scale?: number
  /** 是否可见 */
  visible?: boolean
  /** 渲染深度 */
  depth?: number
  /** 自定义数据 */
  data?: any
}

/**
 * ⭐ 游戏对象渲染组件参数
 */
interface GameObjectRendererParams {
  /** 是否启用对象池（可选，默认 true） */
  enableObjectPool?: boolean
  /** 对象池容量（可选，默认 100） */
  poolSize?: number
  /** 是否启用动画（可选，默认 true） */
  enableAnimation?: boolean
  /** 是否自动管理深度（可选，默认 true） */
  autoManageDepth?: boolean
}

/**
 * ⭐ 游戏对象渲染组件类
 * 
 * @remarks
 * 职责：
 * - 渲染游戏对象
 * - 管理对象生命周期
 * - 对象池优化
 * - 动画播放
 * 
 * @example
 * ```typescript
 * const gameObjectRenderer = new GameObjectRenderer(scene)
 * gameObjectRenderer.init({
 *   enableObjectPool: true,
 *   poolSize: 100,
 *   enableAnimation: true
 * })
 * 
 * // 创建游戏对象
 * gameObjectRenderer.createObject({
 *   id: 'snake_head',
 *   type: 'snake',
 *   x: 200,
 *   y: 150,
 *   width: 40,
 *   height: 40,
 *   color: 0x00ff00
 * })
 * 
 * // 更新位置
 * gameObjectRenderer.updatePosition('snake_head', { x: 240, y: 150 })
 * 
 * // 销毁对象
 * gameObjectRenderer.destroyObject('snake_head')
 * ```
 */
export class GameObjectRenderer extends ComponentBase {
  /** 游戏对象映射表 */
  private gameObjects: Map<string, Phaser.GameObjects.GameObject> = new Map()
  
  /** 对象配置映射表 */
  private objectConfigs: Map<string, GameObjectConfig> = new Map()
  
  /** 对象池（按类型分组） */
  private objectPools: Map<GameObjectType, Phaser.GameObjects.Group> = new Map()
  
  /** 当前参数 */
  private params: GameObjectRendererParams | null = null
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'game_object_renderer', '游戏对象渲染器')
  }
  
  /**
   * ⭐ 初始化游戏对象渲染组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as GameObjectRendererParams
    
    // 设置默认值
    if (this.params.enableObjectPool === undefined) {
      this.params.enableObjectPool = true
    }
    if (this.params.poolSize === undefined) {
      this.params.poolSize = 100
    }
    if (this.params.enableAnimation === undefined) {
      this.params.enableAnimation = true
    }
    if (this.params.autoManageDepth === undefined) {
      this.params.autoManageDepth = true
    }
    
    // 初始化对象池
    if (this.params.enableObjectPool) {
      this.initializeObjectPools()
    }
    
    console.log(`✅ [GameObjectRenderer] 游戏对象渲染器初始化完成`)
    console.log(`   对象池：${this.params.enableObjectPool ? '✓' : '✗'}`)
    console.log(`   池容量：${this.params.poolSize}`)
  }
  
  /**
   * ⭐ 每帧更新（处理动画和插值）
   * 
   * @param deltaTime - 距离上一帧的时间间隔（毫秒）
   */
  public update(_deltaTime: number): void {
    if (!this.enabled) return
    
    // 可以在这里处理平滑移动插值
    if (this.params?.enableAnimation) {
      // 更新动画状态
    }
  }
  
  /**
   * ⭐ 创建游戏对象
   * 
   * @param config - 对象配置
   * @returns 创建的对象
   */
  public createObject(config: GameObjectConfig): Phaser.GameObjects.GameObject {
    // 如果对象已存在，先销毁
    if (this.gameObjects.has(config.id)) {
      this.destroyObject(config.id)
    }
    
    let gameObject: Phaser.GameObjects.GameObject
    
    // 从对象池获取或创建新对象
    if (this.params?.enableObjectPool && this.objectPools.has(config.type)) {
      const pool = this.objectPools.get(config.type)!
      const pooledObject = pool.getFirstDead(false)
      
      if (pooledObject) {
        gameObject = pooledObject
        gameObject.setActive(true)
        ;(gameObject as any).setVisible(config.visible ?? true)
      } else {
        gameObject = this.createGameObject(config)
        pool.add(gameObject)
      }
    } else {
      gameObject = this.createGameObject(config)
    }
    
    // 保存引用
    this.gameObjects.set(config.id, gameObject)
    this.objectConfigs.set(config.id, config)
    
    console.log(`🎭 [GameObjectRenderer] 创建对象：${config.id} (${config.type})`)
    
    return gameObject
  }
  
  /**
   * ⭐ 更新对象位置
   * 
   * @param id - 对象 ID
   * @param position - 新位置
   * @param smooth - 是否平滑移动（可选，默认 false）
   */
  public updatePosition(id: string, position: Position, smooth: boolean = false): void {
    const gameObject = this.gameObjects.get(id)
    const config = this.objectConfigs.get(id)
    
    if (!gameObject || !config) {
      console.warn(`⚠️ [GameObjectRenderer] 对象不存在：${id}`)
      return
    }
    
    if (smooth && this.params?.enableAnimation) {
      // 平滑移动（Tween）
      this.scene.tweens.add({
        targets: gameObject,
        x: position.x,
        y: position.y,
        duration: 100,
        ease: 'Linear'
      })
    } else {
      // 立即移动
      if ('x' in gameObject) {
        ;(gameObject as any).x = position.x
      }
      if ('y' in gameObject) {
        ;(gameObject as any).y = position.y
      }
    }
    
    // 更新配置
    config.x = position.x
    config.y = position.y
    this.objectConfigs.set(id, config)
  }
  
  /**
   * ⭐ 更新对象旋转
   * 
   * @param id - 对象 ID
   * @param rotation - 旋转角度（弧度）
   */
  public updateRotation(id: string, rotation: number): void {
    const gameObject = this.gameObjects.get(id)
    const config = this.objectConfigs.get(id)
    
    if (!gameObject || !config) return
    
    if ('rotation' in gameObject) {
      ;(gameObject as any).rotation = rotation
      config.rotation = rotation
      this.objectConfigs.set(id, config)
    }
  }
  
  /**
   * ⭐ 更新对象缩放
   * 
   * @param id - 对象 ID
   * @param scale - 缩放比例
   */
  public updateScale(id: string, scale: number): void {
    const gameObject = this.gameObjects.get(id)
    const config = this.objectConfigs.get(id)
    
    if (!gameObject || !config) return
    
    if ('scale' in gameObject) {
      ;(gameObject as any).setScale(scale)
      config.scale = scale
      this.objectConfigs.set(id, config)
    }
  }
  
  /**
   * ⭐ 设置对象可见性
   * 
   * @param id - 对象 ID
   * @param visible - 是否可见
   */
  public setVisible(id: string, visible: boolean): void {
    const gameObject = this.gameObjects.get(id)
    
    if (!gameObject) return
    
    ;(gameObject as any).setVisible(visible)
    
    const config = this.objectConfigs.get(id)
    if (config) {
      config.visible = visible
      this.objectConfigs.set(id, config)
    }
  }
  
  /**
   * ⭐ 播放对象动画
   * 
   * @param id - 对象 ID
   * @param key - 动画键名
   * @param repeat - 重复次数（可选，默认 -1 表示无限循环）
   */
  public playAnimation(id: string, key: string, repeat: number = -1): void {
    const gameObject = this.gameObjects.get(id)
    
    if (!gameObject || !this.params?.enableAnimation) return
    
    if ('play' in gameObject && typeof (gameObject as any).play === 'function') {
      ;(gameObject as any).play({ key, repeat })
    }
  }
  
  /**
   * ⭐ 停止对象动画
   * 
   * @param id - 对象 ID
   */
  public stopAnimation(id: string): void {
    const gameObject = this.gameObjects.get(id)
    
    if (!gameObject) return
    
    if ('stopPlayback' in gameObject && typeof (gameObject as any).stopPlayback === 'function') {
      ;(gameObject as any).stopPlayback()
    }
  }
  
  /**
   * ⭐ 获取游戏对象
   * 
   * @param id - 对象 ID
   * @returns 游戏对象或 undefined
   */
  public getObject(id: string): Phaser.GameObjects.GameObject | undefined {
    return this.gameObjects.get(id)
  }
  
  /**
   * ⭐ 获取对象配置
   * 
   * @param id - 对象 ID
   * @returns 对象配置或 undefined
   */
  public getConfig(id: string): GameObjectConfig | undefined {
    return this.objectConfigs.get(id)
  }
  
  /**
   * ⭐ 销毁指定对象
   * 
   * @param id - 对象 ID
   */
  public destroyObject(id: string): void {
    const gameObject = this.gameObjects.get(id)
    const config = this.objectConfigs.get(id)
    
    if (!gameObject) {
      console.warn(`⚠️ [GameObjectRenderer] 要销毁的对象不存在：${id}`)
      return
    }
    
    // 如果使用对象池，回收到池中
    if (this.params?.enableObjectPool && config && this.objectPools.has(config.type)) {
      const pool = this.objectPools.get(config.type)!
      
      if (pool.contains(gameObject)) {
        gameObject.setActive(false)
        ;(gameObject as any).setVisible(false)
      } else {
        gameObject.destroy()
      }
    } else {
      gameObject.destroy()
    }
    
    this.gameObjects.delete(id)
    this.objectConfigs.delete(id)
    
    console.log(`🗑️ [GameObjectRenderer] 销毁对象：${id}`)
  }
  
  /**
   * ⭐ 销毁所有对象
   */
  public destroyAllObjects(): void {
    this.gameObjects.forEach((gameObject) => {
      gameObject.destroy()
    })
    
    this.gameObjects.clear()
    this.objectConfigs.clear()
    
    console.log(`🗑️ [GameObjectRenderer] 已销毁所有对象`)
  }
  
  /**
   * ⭐ 获取所有对象 ID
   * 
   * @returns ID 数组
   */
  public getAllObjectIds(): string[] {
    return Array.from(this.gameObjects.keys())
  }
  
  /**
   * ⭐ 获取指定类型的对象 ID
   * 
   * @param type - 对象类型
   * @returns ID 数组
   */
  public getObjectsByType(type: GameObjectType): string[] {
    const ids: string[] = []
    
    this.objectConfigs.forEach((config, id) => {
      if (config.type === type) {
        ids.push(id)
      }
    })
    
    return ids
  }
  
  /**
   * ⭐ 获取统计信息
   * 
   * @returns 统计信息对象
   */
  public getStats(): {
    totalObjects: number
    activeObjects: number
    pooledObjects: number
    objectTypeCount: Record<GameObjectType, number>
  } {
    const objectTypeCount: Record<GameObjectType, number> = {
      snake: 0,
      food: 0,
      obstacle: 0,
      player: 0,
      enemy: 0,
      item: 0,
      projectile: 0
    }
    
    let activeCount = 0
    
    this.objectConfigs.forEach(config => {
      objectTypeCount[config.type] = (objectTypeCount[config.type] || 0) + 1
      
      const gameObject = this.gameObjects.get(config.id)
      if (gameObject && gameObject.active) {
        activeCount++
      }
    })
    
    return {
      totalObjects: this.gameObjects.size,
      activeObjects: activeCount,
      pooledObjects: this.gameObjects.size - activeCount,
      objectTypeCount
    }
  }
  
  /**
   * ⭐ 销毁组件
   */
  public destroy(): void {
    this.destroyAllObjects()
    super.destroy()
  }
  
  /**
   * ⭐ 初始化对象池
   * 
   * @protected
   */
  protected initializeObjectPools(): void {
    const types: GameObjectType[] = ['snake', 'food', 'obstacle', 'player', 'enemy', 'item', 'projectile']
    
    types.forEach(type => {
      const pool = this.scene.add.group({
        classType: Phaser.GameObjects.Container,
        maxSize: this.params?.poolSize ?? 100,
        runChildUpdate: false
      })
      
      this.objectPools.set(type, pool)
    })
    
    console.log(`♻️ [GameObjectRenderer] 对象池初始化完成`)
  }
  
  /**
   * ⭐ 创建游戏对象（内部方法）
   * 
   * @param config - 对象配置
   * @returns 创建的游戏对象
   * @protected
   */
  protected createGameObject(config: GameObjectConfig): Phaser.GameObjects.GameObject {
    let gameObject: Phaser.GameObjects.GameObject
    
    // 优先使用纹理
    if (config.textureKey) {
      if (config.width && config.height) {
        // 使用 Image
        gameObject = this.scene.add.image(config.x, config.y, config.textureKey, config.frameIndex ?? 0)
        ;(gameObject as Phaser.GameObjects.Image).setDisplaySize(config.width, config.height)
      } else if (config.radius) {
        // 使用 Sprite（圆形）
        gameObject = this.scene.add.sprite(config.x, config.y, config.textureKey, config.frameIndex ?? 0)
        ;(gameObject as Phaser.GameObjects.Sprite).setScale(config.radius / 32)  // 假设基础半径为 32
      } else {
        gameObject = this.scene.add.image(config.x, config.y, config.textureKey, config.frameIndex ?? 0)
      }
    } else if (config.color !== undefined) {
      // 使用图形
      const graphics = this.scene.add.graphics()
      graphics.fillStyle(config.color, config.alpha ?? 1)
      
      if (config.radius) {
        // 圆形
        graphics.fillCircle(config.x, config.y, config.radius)
      } else if (config.width && config.height) {
        // 矩形
        graphics.fillRect(config.x - config.width / 2, config.y - config.height / 2, config.width, config.height)
      } else {
        // 默认点
        graphics.fillRect(config.x - 2, config.y - 2, 4, 4)
      }
      
      gameObject = graphics
    } else {
      // 默认使用矩形
      const width = config.width ?? 32
      const height = config.height ?? 32
      const graphics = this.scene.add.graphics()
      graphics.fillStyle(0xffffff, config.alpha ?? 1)
      graphics.fillRect(config.x - width / 2, config.y - height / 2, width, height)
      gameObject = graphics
    }
    
    // 应用通用属性
    if (config.rotation !== undefined && 'setRotation' in gameObject) {
      ;(gameObject as any).setRotation(config.rotation)
    }
    
    if (config.scale !== undefined && 'setScale' in gameObject) {
      ;(gameObject as any).setScale(config.scale)
    }
    
    if (config.depth !== undefined && 'setDepth' in gameObject) {
      ;(gameObject as any).setDepth(config.depth)
    } else if (this.params?.autoManageDepth) {
      // 自动管理深度
      const depthMap: Record<GameObjectType, number> = {
        obstacle: -100,
        food: 0,
        item: 10,
        projectile: 20,
        snake: 30,
        enemy: 30,
        player: 50
      }
      ;(gameObject as any).setDepth(depthMap[config.type] ?? 0)
    }
    
    if (config.visible !== undefined) {
      ;(gameObject as any).setVisible(config.visible)
    }
    
    return gameObject
  }
  
  /**
   * ⭐ 处理事件（实现基类的抽象方法）
   * 
   * @param event - 游戏事件
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    // 可以响应游戏事件来管理对象
    switch (event.type) {
      case GameEventType.GAME_OVER:
        // 游戏结束时清除所有对象
        this.destroyAllObjects()
        break
        
      case GameEventType.ITEM_COLLECTED:
        // 物品被收集时销毁
        if (event.payload?.itemId) {
          this.destroyObject(event.payload.itemId)
        }
        break
        
      case GameEventType.FOOD_CONSUMED:
        // 食物被消耗时销毁
        if (event.payload?.foodId) {
          this.destroyObject(event.payload.foodId)
        }
        break
    }
  }
}
