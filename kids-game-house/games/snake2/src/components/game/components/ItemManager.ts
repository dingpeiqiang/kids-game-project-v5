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
  
  // 最大激活道具数量（硬编码，默认 3）
  private readonly MAX_ACTIVE_ITEMS = 3

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
    
    // 初始化道具持续时间配置（供 getItemDuration() 使用）
    // 注意：effect/cleanup 回调在此文件中不再被调用
    // 实际效果逻辑由 gameStore.applyItemEffect() 统一处理（通过 PhaserGame.onItemEffect 回调注入）
    this.initItemEffects()
  }

  /**
   * 初始化道具配置（仅 duration 字段有效）
   * 
   * ⚠️ 架构说明：
   * - effect/cleanup 回调定义在此，但不会被本类调用
   * - 实际道具效果执行链：checkItemCollision() → ItemSystem.handleItemCollected()
   *   → PhaserGame.onItemEffect 回调 → gameStore.applyItemEffect()
   * - duration 字段由 getItemDuration() 读取，用于道具生命周期管理
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
    console.log('🎁 [ItemManager] spawnItem 被调用')
    console.log('   当前激活道具数:', this.activeItems.length)
    console.log('   最大允许数量:', this.MAX_ACTIVE_ITEMS)
    
    // 检查是否超过最大数量限制
    if (this.activeItems.length >= this.MAX_ACTIVE_ITEMS) {
      console.warn('⚠️ [ItemManager] 道具数量已达上限，无法生成')
      console.log('   当前道具列表:', this.activeItems.map(i => i.type))
      return null
    }
    
    // 随机决定道具类型
    const random = Math.random()
    let cumulative = 0
    let selectedType: ItemType = 'speed_boost'
    
    console.log('🎲 [ItemManager] 随机数:', random.toFixed(3))
    
    for (const [type, rate] of this.spawnRates.entries()) {
      cumulative += rate
      console.log(`   ${type}: ${cumulative.toFixed(2)} (rate: ${rate})`)
      if (random <= cumulative) {
        selectedType = type
        break
      }
    }
    
    console.log('✅ [ItemManager] 选择的道具类型:', selectedType)

    // 🎁 随机位置生成道具
    // ✅ 修复：使用与蛇相同的坐标系 —— 中心点像素坐标
    // 蛇的坐标：gridX * cellSize + cellSize/2
    // 道具坐标保持一致，确保碰撞检测正确
    const cellSize = this.adaptParams.cellSize
    const col = Math.floor(Math.random() * this.gridCols)
    const row = Math.floor(Math.random() * this.gridRows)
    
    console.log('🔍 道具生成调试:', { 
      col, 
      row, 
      cellSize, 
      gridCols: this.gridCols, 
      gridRows: this.gridRows,
      gridWidth: this.gridCols * cellSize,
      gridHeight: this.gridRows * cellSize
    })
    
    const item: GameItem = {
      type: selectedType,
      position: {
        x: col * cellSize + cellSize / 2,  // ✅ 与蛇坐标系一致（中心点坐标）
        y: row * cellSize + cellSize / 2
      },
      duration: this.getItemDuration(selectedType),
      createdAt: Date.now(),
      active: true
    }

    this.activeItems.push(item)
    console.log(`🎁 生成道具：${selectedType}`, {
      position: item.position,
      duration: item.duration,
      active: item.active
    })
    
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
   * ⭐ 检测蛇与道具的碰撞
   * 
   * @param snake 蛇身数组
   * @returns 收集到的道具列表
   */
  checkItemCollision(snake: any[]): GameItem[] {
    if (!snake || snake.length === 0) {
      console.log('🐍 [CollisionDetection] 蛇为空，跳过碰撞检测')
      return []
    }
    
    const head = snake[0]
    if (!head) {
      console.log('🐍 [CollisionDetection] 蛇头不存在，跳过碰撞检测')
      return []
    }
    
    console.log('🎁 [CollisionDetection] 开始检测道具碰撞')
    console.log('   蛇头位置:', { x: head.x.toFixed(2), y: head.y.toFixed(2) })
    console.log('   活跃道具数:', this.activeItems.length)
    
    const cellSize = this.adaptParams.cellSize
    // ✅ 修复：碰撞阈值调大，确保蛇头（约 0.7*cellSize）能触碰到道具（约 0.4*cellSize）
    const collisionThreshold = cellSize * 0.6
    
    console.log('   碰撞阈值:', collisionThreshold.toFixed(2), `(cellSize: ${cellSize.toFixed(2)})`)
    
    const collectedItems: GameItem[] = []
    
    for (const item of this.activeItems) {
      if (!item.active) continue
      
      const distance = Math.hypot(
        head.x - item.position.x,
        head.y - item.position.y
      )
      
      const isCloseEnough = distance < collisionThreshold
      
      if (isCloseEnough) {
        console.log(`   └─ 道具 ${item.type}:`, {
          position: { x: item.position.x.toFixed(2), y: item.position.y.toFixed(2) },
          distance: distance.toFixed(2),
          threshold: collisionThreshold.toFixed(2),
          collected: isCloseEnough
        })
      }
      
      if (isCloseEnough) {
        console.log(`✅ [CollisionDetection] 检测到道具碰撞！距离=${distance.toFixed(2)}`)
        item.active = false
        collectedItems.push(item)
      }
    }
    
    // 立即移除已收集的道具
    if (collectedItems.length > 0) {
      console.log(`🎁 [CollisionDetection] 收集到 ${collectedItems.length} 个道具:`, 
        collectedItems.map(i => i.type))
      this.removeInactiveItems()
    }
    
    return collectedItems
  }
  
  /**
   * 🎁 检测实体与道具的碰撞（新架构，通过 AABB 碰撞盒）
   * 
   * @param entityBounds 实体碰撞盒 { x, y, width, height }
   * @returns 收集到的道具列表
   */
  checkItemCollisionWithEntity(entityBounds: { x: number, y: number, width: number, height: number }): GameItem[] {
    if (!entityBounds) {
      console.log('🎁 [CollisionDetection] 实体碰撞盒为空，跳过碰撞检测')
      return []
    }
    
    console.log('🎁 [CollisionDetection] 开始检测实体与道具碰撞', {
      entity: entityBounds,
      activeItems: this.activeItems.length
    })
    
    const cellSize = this.adaptParams.cellSize
    // 碰撞阈值 = 实体半径 + 道具半径
    const collisionThreshold = cellSize * 0.6
    
    const collectedItems: GameItem[] = []
    
    for (const item of this.activeItems) {
      if (!item.active) continue
      
      // 计算实体中心到道具中心的距离
      const entityCenterX = entityBounds.x + entityBounds.width / 2
      const entityCenterY = entityBounds.y + entityBounds.height / 2
      
      const distance = Math.hypot(
        entityCenterX - item.position.x,
        entityCenterY - item.position.y
      )
      
      const isCloseEnough = distance < collisionThreshold
      
      if (isCloseEnough) {
        console.log(`   └─ 道具 ${item.type}:`, {
          position: { x: item.position.x.toFixed(2), y: item.position.y.toFixed(2) },
          distance: distance.toFixed(2),
          threshold: collisionThreshold.toFixed(2),
          collected: isCloseEnough
        })
        
        item.active = false
        collectedItems.push(item)
      }
    }
    
    // 立即移除已收集的道具
    if (collectedItems.length > 0) {
      console.log(`🎁 [CollisionDetection] 收集到 ${collectedItems.length} 个道具:`, 
        collectedItems.map(i => i.type))
      this.removeInactiveItems()
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
