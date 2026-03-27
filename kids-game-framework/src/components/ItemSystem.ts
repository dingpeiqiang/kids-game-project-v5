/**
 * 🎁【可复用组件】道具系统（高层封装）
 * 
 * 在 ItemManager 基础上增加：
 * - 自动定时生成道具
 * - 最大道具数量限制
 * - 道具生命周期管理
 * - Phaser 场景集成（渲染）
 * 
 * 适用于需要自动生成道具的游戏。
 */

import { ItemManager } from './ItemManager'
import type { GameItem, ItemType, AdaptParams } from '../types/game.types'

/**
 * 道具系统配置
 */
export interface ItemSystemConfig {
  /** 是否启用道具系统 */
  enabled?: boolean
  /** 道具生成间隔（毫秒，默认 10000） */
  spawnInterval?: number
  /** 最大活跃道具数（默认 3） */
  maxActiveItems?: number
  /** 道具存活时间（毫秒，默认 10000） */
  itemLifetime?: number
  /** 是否开启调试模式 */
  debugMode?: boolean
}

/**
 * ⭐ 道具系统
 * 
 * @example
 * const itemSystem = new ItemSystem({ enabled: true, spawnInterval: 10000, maxActiveItems: 3 })
 * itemSystem.initialize(adaptParams, 32, 18)
 * 
 * // 在 Phaser update() 中调用
 * itemSystem.update(snake)
 * 
 * // 获取收集到的道具
 * const collected = itemSystem.getCollectedItems()
 */
export class ItemSystem {
  private config: Required<ItemSystemConfig>
  private manager: ItemManager | null = null
  private spawnTimer: ReturnType<typeof setInterval> | null = null
  private pendingCollected: GameItem[] = []
  private isRunning = false

  constructor(config: ItemSystemConfig = {}) {
    this.config = {
      enabled:       config.enabled       ?? true,
      spawnInterval: config.spawnInterval ?? 10000,
      maxActiveItems: config.maxActiveItems ?? 3,
      itemLifetime:  config.itemLifetime  ?? 10000,
      debugMode:     config.debugMode     ?? false
    }
  }

  // ============================================================================
  // 🚀 初始化与控制
  // ============================================================================

  /**
   * ⭐ 初始化道具系统
   */
  initialize(adaptParams: AdaptParams, gridCols: number = 32, gridRows: number = 18): void {
    if (!this.config.enabled) return
    this.manager = new ItemManager(adaptParams, gridCols, gridRows)
    this.manager.setItemCollectedCallback(item => {
      this.pendingCollected.push(item)
    })
    console.log('[ItemSystem] ✅ 道具系统初始化完成')
  }

  /**
   * ⭐ 启动自动生成计时器
   */
  start(): void {
    if (!this.config.enabled || this.isRunning) return
    this.isRunning = true
    this.spawnTimer = setInterval(() => {
      this.trySpawnItem()
    }, this.config.spawnInterval)
    console.log(`[ItemSystem] ▶️ 道具自动生成已启动（间隔 ${this.config.spawnInterval}ms）`)
  }

  /**
   * ⭐ 停止自动生成，清空道具
   */
  stop(): void {
    this.isRunning = false
    if (this.spawnTimer !== null) {
      clearInterval(this.spawnTimer)
      this.spawnTimer = null
    }
    this.manager?.clearAllItems()
    this.pendingCollected = []
    console.log('[ItemSystem] ⏹️ 道具系统已停止')
  }

  /**
   * 更新适配参数（resize 后调用）
   */
  setAdaptParams(adaptParams: AdaptParams): void {
    this.manager?.setAdaptParams(adaptParams)
  }

  // ============================================================================
  // 🔄 帧更新
  // ============================================================================

  /**
   * ⭐ 每帧更新（在 Phaser update() 中调用）
   * @param snake 蛇身数组，用于碰撞检测
   * @returns 本帧收集到的道具列表
   */
  update(snake: Array<{ x: number; y: number }>): GameItem[] {
    if (!this.config.enabled || !this.manager) return []

    this.manager.update()
    const collected = this.manager.checkItemCollision(snake)
    return collected
  }

  /**
   * 获取并清空待处理的收集事件
   */
  getCollectedItems(): GameItem[] {
    const items = [...this.pendingCollected]
    this.pendingCollected = []
    return items
  }

  /** 获取当前所有活跃道具（供 Phaser 渲染使用） */
  getActiveItems(): GameItem[] {
    return this.manager?.getActiveItems() ?? []
  }

  // ============================================================================
  // 🔒 私有方法
  // ============================================================================

  private trySpawnItem(): void {
    if (!this.manager) return
    const active = this.manager.getActiveItems()
    if (active.length >= this.config.maxActiveItems) {
      if (this.config.debugMode) {
        console.log(`[ItemSystem] ⏸ 道具数量已达上限 ${this.config.maxActiveItems}，跳过本次生成`)
      }
      return
    }
    this.manager.spawnItem()
  }
}
