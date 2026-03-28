// ============================================================================
// 🎁 物品生成器组件
// ============================================================================
// 
// 📌 说明:
//   负责在游戏区域中随机生成物品
//   支持多种物品类型和概率配置
//   避免与现有对象重叠
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import type Phaser from 'phaser'
import type { Position } from '../types/common'
import { randomFloat } from '../utils/helpers'

/**
 * ⭐ 物品类型
 */
type ItemType = 'normal' | 'bonus' | 'special' | 'powerup'

/**
 * ⭐ 物品接口
 */
interface GameItem {
  /** 物品 ID */
  id: string
  /** X 坐标（像素） */
  x: number
  /** Y 坐标（像素） */
  y: number
  /** 物品类型 */
  type: ItemType
  /** 分值 */
  points: number
  /** 是否已被收集 */
  collected: boolean
  /** 生成时间戳 */
  spawnedAt: number
  /** 存在时长（毫秒） */
  lifetime?: number
}

/**
 * ⭐ 障碍物接口
 */
interface Obstacle {
  x: number
  y: number
  width: number
  height: number
}

/**
 * ⭐ 物品生成器组件参数
 */
interface ItemSpawnerParams {
  /** 可用的物品类型 */
  availableTypes?: ItemType[]
  /** 网格列数 */
  gridCols: number
  /** 网格行数 */
  gridRows: number
  /** 单元格大小（像素） */
  cellSize: number
  /** 生成概率配置 */
  typeProbabilities?: {
    normal: number   // 普通物品概率（默认 0.7）
    bonus: number    // 奖励物品概率（默认 0.2）
    special: number  // 特殊物品概率（默认 0.08）
    powerup: number  // 增益物品概率（默认 0.02）
  }
  /** 物品分值配置 */
  itemPoints?: {
    normal: number   // 普通物品分值（默认 10）
    bonus: number    // 奖励物品分值（默认 50）
    special: number  // 特殊物品分值（默认 100）
    powerup: number  // 增益物品分值（默认 200）
  }
  /** 最大同时存在物品数（可选，默认 5） */
  maxItems?: number
  /** 物品存在时长（毫秒，可选，永不消失） */
  itemLifetime?: number
  /** 是否调试模式（可选，默认 false） */
  debugMode?: boolean
}

/**
 * ⭐ 物品生成器组件类
 * 
 * @remarks
 * 职责：
 * - 随机生成物品位置
 * - 避免与其他对象重叠
 * - 按概率分布生成不同类型物品
 * - 管理物品生命周期
 * - 发射物品生成事件
 * 
 * @example
 * ```typescript
 * const itemSpawner = new ItemSpawnerComponent(scene)
 * itemSpawner.init({
 *   availableTypes: ['normal', 'bonus', 'special'],
 *   gridCols: 32,
 *   gridRows: 18,
 *   cellSize: 40,
 *   typeProbabilities: {
 *     normal: 0.7,
 *     bonus: 0.2,
 *     special: 0.1
 *   }
 * })
 * 
 * // 生成物品
 * const item = itemSpawner.spawnItem(obstacles)
 * ```
 */
export class ItemSpawnerComponent extends ComponentBase {
  /** 当前所有物品列表 */
  private items: GameItem[] = []
  
  /** 当前参数 */
  private params: ItemSpawnerParams | null = null
  
  /** 最大尝试次数（防止死循环） */
  private readonly MAX_SPAWN_ATTEMPTS = 100
  
  /** 物品计数器（用于生成唯一 ID） */
  private itemCounter: number = 0
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'item_spawner', '物品生成器')
  }
  
  /**
   * ⭐ 初始化物品生成器组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as ItemSpawnerParams
    
    // 设置默认概率
    if (!this.params.typeProbabilities) {
      this.params.typeProbabilities = {
        normal: 0.7,
        bonus: 0.2,
        special: 0.08,
        powerup: 0.02
      }
    }
    
    // 设置默认分值
    if (!this.params.itemPoints) {
      this.params.itemPoints = {
        normal: 10,
        bonus: 50,
        special: 100,
        powerup: 200
      }
    }
    
    // 设置默认最大物品数
    if (!this.params.maxItems) {
      this.params.maxItems = 5
    }
    
    console.log(`✅ [ItemSpawner] 物品生成器初始化完成`)
    console.log(`   最大物品数：${this.params.maxItems}`)
    console.log(`   物品存在时长：${this.params.itemLifetime ?? '永久'}`)
  }
  
  /**
   * ⭐ 每帧更新（检查物品生命周期）
   * 
   * @param deltaTime - 距离上一帧的时间间隔（毫秒）
   */
  public update(_deltaTime: number): void {
    if (!this.enabled || !this.params) return
    
    const now = Date.now()
    
    // 清理过期物品
    if (this.params.itemLifetime) {
      this.items.forEach(item => {
        const age = now - item.spawnedAt
        if (age > this.params!.itemLifetime! && !item.collected) {
          item.collected = true
          this.emitItemExpired(item)
        }
      })
      
      // 从数组中移除已收集的物品
      this.items = this.items.filter(item => !item.collected)
    }
  }
  
  /**
   * ⭐ 生成新物品
   * 
   * @param obstacles - 障碍物数组（可选）
   * @param excludePositions - 需要排除的位置数组（可选）
   * @returns 生成的物品对象
   */
  public spawnItem(obstacles: Obstacle[] = [], excludePositions: Position[] = []): GameItem {
    if (!this.params) {
      throw new Error('[ItemSpawner] 组件未初始化')
    }
    
    // 检查是否超过最大物品数
    if (this.items.length >= (this.params.maxItems ?? 5)) {
      console.warn(`⚠️ [ItemSpawner] 已达到最大物品数限制：${this.items.length}`)
      // 返回一个虚拟物品或 null
      return this.createVirtualItem()
    }
    
    let position: Position | null = null
    let attempts = 0
    
    // 寻找有效位置
    while (attempts < this.MAX_SPAWN_ATTEMPTS) {
      const candidatePosition = this.randomPosition()
      
      // 检查是否与障碍物重叠
      if (obstacles.length > 0 && this.overlapsWithObstacles(candidatePosition, obstacles)) {
        attempts++
        continue
      }
      
      // 检查是否在排除位置列表中
      if (this.isInExcludeList(candidatePosition, excludePositions)) {
        attempts++
        continue
      }
      
      // 检查是否与现有物品重叠
      if (this.overlapsWithItems(candidatePosition)) {
        attempts++
        continue
      }
      
      // 找到有效位置
      position = candidatePosition
      break
    }
    
    if (!position) {
      console.error('❌ [ItemSpawner] 无法找到有效的物品生成位置！')
      // 返回虚拟物品
      return this.createVirtualItem()
    }
    
    // 生成物品类型
    const type = this.randomItemType()
    
    // 获取对应分值
    const points = this.params.itemPoints?.[type] ?? 10
    
    // 创建物品对象
    const item: GameItem = {
      id: `item_${++this.itemCounter}`,
      x: position.x,
      y: position.y,
      type: type,
      points: points,
      collected: false,
      spawnedAt: Date.now(),
      lifetime: this.params.itemLifetime
    }
    
    // 添加到物品列表
    this.items.push(item)
    
    // 发送物品生成事件
    this.emit({
      type: GameEventType.ITEM_SPAWN,
      payload: {
        itemId: item.id,
        itemType: type,
        position: { x: item.x, y: item.y },
        points: points,
        lifetime: item.lifetime
      },
      timestamp: Date.now()
    })
    
    console.log(`🎁 [ItemSpawner] 生成新物品：类型=${type}, 分值=${points}, 位置=(${position.x}, ${position.y})`)
    
    return item
  }
  
  /**
   * ⭐ 标记物品为已收集
   * 
   * @param itemId - 物品 ID
   * @returns 是否成功标记
   */
  public collectItem(itemId: string): boolean {
    const item = this.items.find(i => i.id === itemId)
    
    if (item && !item.collected) {
      item.collected = true
      
      // 发送物品收集事件
      this.emit({
        type: GameEventType.ITEM_COLLECTED,
        payload: {
          itemId: item.id,
          itemType: item.type,
          points: item.points,
          position: { x: item.x, y: item.y }
        },
        timestamp: Date.now()
      })
      
      console.log(`✨ [ItemSpawner] 物品被收集：${itemId}, 类型=${item.type}, 分值=${item.points}`)
      
      return true
    }
    
    return false
  }
  
  /**
   * ⭐ 获取所有未收集的物品
   * 
   * @returns 物品数组
   */
  public getActiveItems(): GameItem[] {
    return this.items.filter(item => !item.collected)
  }
  
  /**
   * ⭐ 获取指定 ID 的物品
   * 
   * @param itemId - 物品 ID
   * @returns 物品对象或 undefined
   */
  public getItemById(itemId: string): GameItem | undefined {
    return this.items.find(item => item.id === itemId)
  }
  
  /**
   * ⭐ 清除所有物品
   */
  public clearAllItems(): void {
    const count = this.items.length
    this.items = []
    console.log(`🗑️ [ItemSpawner] 已清除所有物品（共${count}个）`)
  }
  
  /**
   * ⭐ 获取统计信息
   * 
   * @returns 统计信息对象
   */
  public getStats(): {
    totalItemsSpawned: number
    activeItems: number
    collectedItems: number
    expiredItems: number
  } {
    const collected = this.items.filter(i => i.collected).length
    const expired = this.items.filter(i => i.collected && i.lifetime !== undefined).length
    
    return {
      totalItemsSpawned: this.itemCounter,
      activeItems: this.items.filter(i => !i.collected).length,
      collectedItems: collected,
      expiredItems: expired
    }
  }
  
  /**
   * ⭐ 生成随机位置
   * 
   * @returns 随机位置对象
   * @protected
   */
  protected randomPosition(): Position {
    if (!this.params) {
      throw new Error('[ItemSpawner] 组件未初始化')
    }
    
    // 在网格范围内随机选择位置
    const col = Math.floor(Math.random() * this.params.gridCols)
    const row = Math.floor(Math.random() * this.params.gridRows)
    
    return {
      x: col * this.params.cellSize,
      y: row * this.params.cellSize
    }
  }
  
  /**
   * ⭐ 随机物品类型
   * 
   * @returns 物品类型
   * @protected
   */
  protected randomItemType(): ItemType {
    if (!this.params?.typeProbabilities) {
      return 'normal'
    }
    
    const rand = randomFloat(0, 1)
    const probs = this.params.typeProbabilities
    
    let cumulative = 0
    
    cumulative += probs.normal ?? 0
    if (rand < cumulative) return 'normal'
    
    cumulative += probs.bonus ?? 0
    if (rand < cumulative) return 'bonus'
    
    cumulative += probs.special ?? 0
    if (rand < cumulative) return 'special'
    
    return 'powerup'
  }
  
  /**
   * ⭐ 检查位置是否与障碍物重叠
   * 
   * @param position - 要检查的位置
   * @param obstacles - 障碍物数组
   * @returns true 如果重叠
   * @protected
   */
  protected overlapsWithObstacles(position: Position, obstacles: Obstacle[]): boolean {
    const itemSize = this.params?.cellSize ?? 40
    
    for (const obstacle of obstacles) {
      if (
        position.x < obstacle.x + obstacle.width &&
        position.x + itemSize > obstacle.x &&
        position.y < obstacle.y + obstacle.height &&
        position.y + itemSize > obstacle.y
      ) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * ⭐ 检查位置是否在排除列表中
   * 
   * @param position - 要检查的位置
   * @param excludePositions - 排除位置数组
   * @returns true 如果在排除列表中
   * @protected
   */
  protected isInExcludeList(position: Position, excludePositions: Position[]): boolean {
    return excludePositions.some(
      pos => Math.abs(pos.x - position.x) < 1 && Math.abs(pos.y - position.y) < 1
    )
  }
  
  /**
   * ⭐ 检查位置是否与现有物品重叠
   * 
   * @param position - 要检查的位置
   * @returns true 如果重叠
   * @protected
   */
  protected overlapsWithItems(position: Position): boolean {
    const minDistance = this.params?.cellSize ?? 40
    
    for (const item of this.items) {
      if (!item.collected) {
        const dx = Math.abs(item.x - position.x)
        const dy = Math.abs(item.y - position.y)
        
        if (dx < minDistance && dy < minDistance) {
          return true
        }
      }
    }
    
    return false
  }
  
  /**
   * ⭐ 创建虚拟物品（当无法生成真实物品时）
   * 
   * @returns 虚拟物品对象
   * @protected
   */
  protected createVirtualItem(): GameItem {
    return {
      id: `virtual_${++this.itemCounter}`,
      x: 0,
      y: 0,
      type: 'normal',
      points: 0,
      collected: true,  // 直接标记为已收集，避免处理
      spawnedAt: Date.now(),
      lifetime: undefined
    }
  }
  
  /**
   * ⭐ 发送物品过期事件
   * 
   * @param item - 过期的物品
   * @protected
   */
  protected emitItemExpired(item: GameItem): void {
    this.emit({
      type: GameEventType.ITEM_EFFECT_EXPIRED,
      payload: {
        itemId: item.id,
        itemType: item.type,
        reason: 'lifetime_exceeded'
      },
      timestamp: Date.now()
    })
    
    if (this.params?.debugMode) {
      console.log(`⏰ [ItemSpawner] 物品已过期：${item.id}`)
    }
  }
  
  /**
   * ⭐ 处理事件（实现基类的抽象方法）
   * 
   * @param event - 游戏事件
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    // 可以响应游戏事件来管理物品
    switch (event.type) {
      case GameEventType.GAME_OVER:
        // 游戏结束时清除所有物品
        this.clearAllItems()
        break
        
      case GameEventType.PAUSE:
        // 暂停时禁用生成器
        this.enabled = false
        break
        
      case GameEventType.RESUME:
        // 恢复时启用生成器
        this.enabled = true
        break
    }
  }
}
