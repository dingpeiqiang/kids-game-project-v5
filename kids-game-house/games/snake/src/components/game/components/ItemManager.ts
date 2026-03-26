// ============================================================================
// 🎮【游戏特定层】道具管理组件 - 贪吃蛇游戏示例
// ============================================================================
// 📌 说明：封装道具生成、渲染、效果应用等逻辑
// ⚠️ 注意：这是游戏特定的道具管理组件，其他游戏需要实现自己的管理器
// ============================================================================

/**
 * ⭐ 道具类型枚举
 */
export type ItemType = 
  | 'speed_boost'      // 加速道具
  | 'slow_down'        // 减速道具
  | 'length_reduce'    // 缩短蛇身
  | 'shield'           // 护盾道具
  | 'magnet'           // 磁铁道具 (自动吸引食物)
  | 'double_score'     // 双倍分数

/**
 * ⭐ 道具对象接口
 */
export interface GameItem {
  type: ItemType
  position: {
    x: number
    y: number
  }
  duration?: number    // 持续时间 (毫秒),0 表示一次性道具
  createdAt?: number   // 创建时间戳
  active: boolean      // 是否激活
}

/**
 * ⭐ 道具效果配置
 */
export interface ItemEffect {
  type: ItemType
  duration: number
  effect: (snake: any, gameData: any) => void
  cleanup?: (snake: any, gameData: any) => void
}

/**
 * ⭐ 道具管理组件
 * 
 * 📌 说明：封装道具生成、渲染、效果应用等逻辑
 * 
 * 使用方式:
 * ```typescript
 * const itemManager = new ItemManager(adaptParams)
 * itemManager.spawnItem('speed_boost')
 * itemManager.applyItemEffect(snake, gameData)
 * ```
 */
export class ItemManager {
  private adaptParams: any
  private gridCols: number
  private gridRows: number
  private activeItems: GameItem[] = []
  private itemEffects: Map<ItemType, ItemEffect> = new Map()
  private onItemCollected?: (item: GameItem) => void
  
  // 道具生成概率配置
  private spawnRates: Map<ItemType, number> = new Map([
    ['speed_boost', 0.3],      // 30% 概率
    ['slow_down', 0.2],        // 20% 概率
    ['length_reduce', 0.15],   // 15% 概率
    ['shield', 0.1],           // 10% 概率
    ['magnet', 0.15],          // 15% 概率
    ['double_score', 0.1]      // 10% 概率
  ])

  /**
   * 构造函数
   * @param adaptParams 适配参数 (包含 cellSize 等)
   * @param gridCols 网格列数，默认 32
   * @param gridRows 网格行数，默认 18
   */
  constructor(
    adaptParams: any,
    gridCols: number = 32,
    gridRows: number = 18
  ) {
    this.adaptParams = adaptParams
    this.gridCols = gridCols
    this.gridRows = gridRows
    
    // 初始化道具效果
    this.initItemEffects()
  }

  /**
   * ⭐ 初始化所有道具效果 (保持原有逻辑)
   */
  private initItemEffects(): void {
    // 加速道具
    this.itemEffects.set('speed_boost', {
      type: 'speed_boost',
      duration: 5000,  // 5 秒
      effect: (snake, gameData) => {
        gameData.speedMultiplier = 1.5  // 速度提升 50%
        console.log('⚡ 加速道具生效!')
      },
      cleanup: (snake, gameData) => {
        gameData.speedMultiplier = 1.0  // 恢复原速
        console.log('⚡ 加速道具效果结束')
      }
    })

    // 减速道具
    this.itemEffects.set('slow_down', {
      type: 'slow_down',
      duration: 5000,
      effect: (snake, gameData) => {
        gameData.speedMultiplier = 0.5  // 速度降低 50%
        console.log('🐢 减速道具生效!')
      },
      cleanup: (snake, gameData) => {
        gameData.speedMultiplier = 1.0
        console.log('🐢 减速道具效果结束')
      }
    })

    // 缩短蛇身
    this.itemEffects.set('length_reduce', {
      type: 'length_reduce',
      duration: 0,  // 一次性效果
      effect: (snake, gameData) => {
        if (snake.length > 3) {
          const removeCount = Math.min(3, snake.length - 3)
          for (let i = 0; i < removeCount; i++) {
            snake.pop()
          }
          console.log('✂️ 蛇身缩短!')
        }
      }
    })

    // 护盾道具
    this.itemEffects.set('shield', {
      type: 'shield',
      duration: 10000,  // 10 秒
      effect: (snake, gameData) => {
        gameData.hasShield = true
        console.log('🛡️ 护盾道具生效!')
      },
      cleanup: (snake, gameData) => {
        gameData.hasShield = false
        console.log('🛡️ 护盾道具效果结束')
      }
    })

    // 磁铁道具
    this.itemEffects.set('magnet', {
      type: 'magnet',
      duration: 8000,  // 8 秒
      effect: (snake, gameData) => {
        gameData.hasMagnet = true
        console.log('🧲 磁铁道具生效!')
      },
      cleanup: (snake, gameData) => {
        gameData.hasMagnet = false
        console.log('🧲 磁铁道具效果结束')
      }
    })

    // 双倍分数
    this.itemEffects.set('double_score', {
      type: 'double_score',
      duration: 10000,  // 10 秒
      effect: (snake, gameData) => {
        gameData.scoreMultiplier = 2.0
        console.log('✨ 双倍分数生效!')
      },
      cleanup: (snake, gameData) => {
        gameData.scoreMultiplier = 1.0
        console.log('✨ 双倍分数效果结束')
      }
    })
  }

  /**
   * ⭐ 生成随机道具 (核心方法)
   * 
   * @returns 生成的道具，如果生成失败返回 null
   */
  spawnItem(): GameItem | null {
    // 随机决定道具类型
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

    // 随机位置生成道具
    const cellSize = this.adaptParams.cellSize
    const col = Math.floor(Math.random() * this.gridCols)
    const row = Math.floor(Math.random() * this.gridRows)
    
    const item: GameItem = {
      type: selectedType,
      position: {
        x: col * cellSize,
        y: row * cellSize
      },
      duration: this.getItemDuration(selectedType),
      createdAt: Date.now(),
      active: true
    }

    this.activeItems.push(item)
    console.log(`🎁 生成道具：${selectedType}`, item.position)
    
    return item
  }

  /**
   * ⭐ 获取道具持续时间
   */
  private getItemDuration(type: ItemType): number {
    const effect = this.itemEffects.get(type)
    return effect?.duration ?? 0
  }

  /**
   * ⭐ 应用道具效果
   * 
   * @param item 道具对象
   * @param snake 蛇身数组
   * @param gameData 游戏数据对象
   */
  applyItemEffect(item: GameItem, snake: any[], gameData: any): void {
    const effect = this.itemEffects.get(item.type)
    if (!effect) {
      console.warn(`⚠️ 未找到道具效果：${item.type}`)
      return
    }

    // 应用效果
    effect.effect(snake, gameData)

    // 如果是一次性道具，立即移除
    if (effect.duration === 0) {
      item.active = false
      this.removeInactiveItems()
    } else {
      // 定时效果结束后清理
      setTimeout(() => {
        if (effect.cleanup) {
          effect.cleanup(snake, gameData)
        }
        item.active = false
        this.removeInactiveItems()
      }, effect.duration)
    }

    // 通知收集事件
    this.onItemCollected?.(item)
  }

  /**
   * ⭐ 检测蛇与道具的碰撞
   * 
   * @param snake 蛇身数组
   * @returns 收集到的道具列表
   */
  checkItemCollision(snake: any[]): GameItem[] {
    if (!snake || snake.length === 0) return []
    
    const head = snake[0]
    const cellSize = this.adaptParams.cellSize
    const collisionThreshold = cellSize * 0.5
    
    const collectedItems: GameItem[] = []
    
    for (const item of this.activeItems) {
      if (!item.active) continue
      
      const distance = Math.hypot(
        head.x - item.position.x,
        head.y - item.position.y
      )
      
      if (distance < collisionThreshold) {
        collectedItems.push(item)
      }
    }
    
    return collectedItems
  }

  /**
   * ⭐ 更新所有道具状态 (检查超时)
   */
  update(): void {
    const now = Date.now()
    
    for (const item of this.activeItems) {
      if (!item.active) continue
      
      // 检查道具是否超时 (存在 10 秒后自动消失)
      if (item.createdAt && now - item.createdAt > 10000) {
        item.active = false
      }
    }
    
    this.removeInactiveItems()
  }

  /**
   * ⭐ 移除不活跃的道具
   */
  private removeInactiveItems(): void {
    this.activeItems = this.activeItems.filter(item => item.active)
  }

  /**
   * ⭐ 获取所有活跃道具
   */
  getActiveItems(): GameItem[] {
    return this.activeItems.filter(item => item.active)
  }

  /**
   * ⭐ 清除所有道具
   */
  clearAllItems(): void {
    this.activeItems = []
  }

  /**
   * ⭐ 设置道具收集回调
   */
  setItemCollectedCallback(callback: (item: GameItem) => void): void {
    this.onItemCollected = callback
  }

  /**
   * ⭐ 更新适配参数 (用于 resize 后重新计算)
   */
  setAdaptParams(adaptParams: any): void {
    this.adaptParams = adaptParams
  }

  /**
   * ⭐ 修改道具生成概率
   */
  setSpawnRate(type: ItemType, rate: number): void {
    this.spawnRates.set(type, rate)
  }

  /**
   * ⭐ 获取道具生成概率配置
   */
  getSpawnRates(): Map<ItemType, number> {
    return new Map(this.spawnRates)
  }
}
