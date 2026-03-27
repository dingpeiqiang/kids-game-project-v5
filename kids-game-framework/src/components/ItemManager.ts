/**
 * 🎁【可复用组件】道具管理器
 * 
 * 封装道具生成、碰撞检测、效果应用等逻辑。
 * 适用于贪吃蛇等有道具系统的游戏。
 * 
 * 使用方式：
 * ```typescript
 * const itemManager = new ItemManager(adaptParams)
 * itemManager.spawnItem()            // 生成随机道具
 * const collected = itemManager.checkItemCollision(snake)   // 碰撞检测
 * collected.forEach(item => itemManager.applyItemEffect(item, snake, gameData))
 * ```
 */

import type { ItemType, GameItem, ItemEffect, AdaptParams } from '../types/game.types'

export type { ItemType, GameItem, ItemEffect }

/**
 * ⭐ 道具管理器
 */
export class ItemManager {
  private adaptParams: AdaptParams
  private gridCols: number
  private gridRows: number
  private activeItems: GameItem[] = []
  private itemEffects: Map<ItemType, ItemEffect> = new Map()
  private onItemCollected?: (item: GameItem) => void

  /** 道具生成概率（示例，可根据游戏自定义） */
  private spawnRates: Map<ItemType, number> = new Map([
    ['speed_boost',  0.30],
    ['slow_down',    0.20],
    ['shield',       0.20],
    ['magnet',       0.15],
    ['double_score', 0.15]
  ])

  constructor(
    adaptParams: AdaptParams,
    gridCols: number = 32,
    gridRows: number = 18
  ) {
    this.adaptParams = adaptParams
    this.gridCols    = gridCols
    this.gridRows    = gridRows
    this.initItemEffects()
  }

  // ============================================================================
  // 🎲 道具生成
  // ============================================================================

  /**
   * ⭐ 生成随机道具（按概率分布）
   */
  spawnItem(): GameItem | null {
    const random = Math.random()
    let cumulative = 0
    let selectedType: ItemType = 'speed_boost'

    for (const [type, rate] of this.spawnRates.entries()) {
      cumulative += rate
      if (random <= cumulative) {
        selectedType = type
        break
      }
    }

    const cellSize = this.adaptParams.cellSize
    const col      = Math.floor(Math.random() * this.gridCols)
    const row      = Math.floor(Math.random() * this.gridRows)

    const item: GameItem = {
      type: selectedType,
      position: {
        x: col * cellSize + cellSize / 2,
        y: row * cellSize + cellSize / 2
      },
      duration:  this.getItemDuration(selectedType),
      createdAt: Date.now(),
      active:    true
    }

    this.activeItems.push(item)
    console.log(`[ItemManager] 🎁 生成道具：${selectedType}`, item.position)
    return item
  }

  // ============================================================================
  // 💥 碰撞检测
  // ============================================================================

  /**
   * ⭐ 检测蛇头与道具的碰撞
   * @param snake 蛇身数组（[0] 为蛇头，坐标为像素中心点）
   * @returns 已收集的道具列表
   */
  checkItemCollision(snake: Array<{ x: number; y: number }>): GameItem[] {
    if (!snake || snake.length === 0) return []
    const head = snake[0]
    if (!head) return []

    const cellSize          = this.adaptParams.cellSize
    const collisionThreshold = cellSize * 0.6
    const collected: GameItem[] = []

    for (const item of this.activeItems) {
      if (!item.active) continue
      const dist = Math.hypot(head.x - item.position.x, head.y - item.position.y)
      if (dist < collisionThreshold) {
        item.active = false
        collected.push(item)
      }
    }

    if (collected.length > 0) this.removeInactiveItems()
    return collected
  }

  // ============================================================================
  // ✨ 道具效果
  // ============================================================================

  /**
   * ⭐ 应用道具效果
   */
  applyItemEffect(item: GameItem, snake: any[], gameData: any): void {
    const effect = this.itemEffects.get(item.type)
    if (!effect) {
      console.warn(`[ItemManager] ⚠️ 未找到道具效果：${item.type}`)
      return
    }

    effect.effect(snake, gameData)

    if (effect.duration === 0) {
      item.active = false
      this.removeInactiveItems()
    } else {
      setTimeout(() => {
        effect.cleanup?.(snake, gameData)
        item.active = false
        this.removeInactiveItems()
      }, effect.duration)
    }

    this.onItemCollected?.(item)
  }

  // ============================================================================
  // 🔄 状态更新
  // ============================================================================

  /**
   * ⭐ 每帧更新：清理超时道具
   */
  update(): void {
    const now = Date.now()
    for (const item of this.activeItems) {
      if (item.active && item.createdAt && now - item.createdAt > 10000) {
        item.active = false
      }
    }
    this.removeInactiveItems()
  }

  // ============================================================================
  // 🔧 辅助方法
  // ============================================================================

  /** 获取所有活跃道具 */
  getActiveItems(): GameItem[] {
    return this.activeItems.filter(i => i.active)
  }

  /** 清除所有道具 */
  clearAllItems(): void {
    this.activeItems = []
  }

  /** 设置道具收集回调 */
  setItemCollectedCallback(callback: (item: GameItem) => void): void {
    this.onItemCollected = callback
  }

  /** 更新适配参数（resize 时调用） */
  setAdaptParams(adaptParams: AdaptParams): void {
    this.adaptParams = adaptParams
  }

  /** 修改道具生成概率 */
  setSpawnRate(type: ItemType, rate: number): void {
    this.spawnRates.set(type, rate)
  }

  // ============================================================================
  // 🔒 私有方法
  // ============================================================================

  private removeInactiveItems(): void {
    this.activeItems = this.activeItems.filter(i => i.active)
  }

  private getItemDuration(type: ItemType): number {
    return this.itemEffects.get(type)?.duration ?? 0
  }

  private initItemEffects(): void {
    this.itemEffects.set('speed_boost', {
      type: 'speed_boost', duration: 5000,
      effect:  (_, d) => { d.speedMultiplier = 1.5; console.log('⚡ 加速道具生效') },
      cleanup: (_, d) => { d.speedMultiplier = 1.0; console.log('⚡ 加速效果结束') }
    })
    this.itemEffects.set('slow_down', {
      type: 'slow_down', duration: 5000,
      effect:  (_, d) => { d.speedMultiplier = 0.5; console.log('🐢 减速道具生效') },
      cleanup: (_, d) => { d.speedMultiplier = 1.0; console.log('🐢 减速效果结束') }
    })
    this.itemEffects.set('length_reduce', {
      type: 'length_reduce', duration: 0,
      effect: (snake) => {
        if (snake.length > 3) {
          snake.splice(snake.length - Math.min(3, snake.length - 3), Math.min(3, snake.length - 3))
          console.log('✂️ 蛇身缩短')
        }
      }
    })
    this.itemEffects.set('shield', {
      type: 'shield', duration: 10000,
      effect:  (_, d) => { d.hasShield = true;  console.log('🛡️ 护盾生效') },
      cleanup: (_, d) => { d.hasShield = false; console.log('🛡️ 护盾结束') }
    })
    this.itemEffects.set('magnet', {
      type: 'magnet', duration: 8000,
      effect:  (_, d) => { d.hasMagnet = true;  console.log('🧲 磁铁生效') },
      cleanup: (_, d) => { d.hasMagnet = false; console.log('🧲 磁铁结束') }
    })
    this.itemEffects.set('double_score', {
      type: 'double_score', duration: 10000,
      effect:  (_, d) => { d.scoreMultiplier = 2.0; console.log('✨ 双倍分数生效') },
      cleanup: (_, d) => { d.scoreMultiplier = 1.0; console.log('✨ 双倍分数结束') }
    })
  }
}
