// ============================================================================
// 🎁【框架层】道具引擎系统 - 通用游戏引擎
// ============================================================================
// 📌 说明：整合所有道具相关组件，提供统一的道具系统接口
// ⚠️ 注意：这是框架层组件，所有游戏通用
// ============================================================================

import { ItemManager, ItemType, GameItem } from './ItemManager'
import type { FoodRenderer } from './FoodRenderer'
import type { SnakeRenderer } from './SnakeRenderer'

/**
 * ⭐ 道具系统配置
 */
export interface ItemSystemConfig {
  enabled: boolean              // 是否启用道具系统
  spawnInterval: number         // 生成间隔 (毫秒)
  maxActiveItems: number        // 最大活跃道具数
  itemLifetime: number          // 道具存活时间 (毫秒)
  debugMode: boolean           // 调试模式
}

/**
 * ⭐ 道具收集事件数据
 */
export interface ItemCollectEvent {
  item: GameItem
  snake: any[]
  timestamp: number
}

/**
 * ⭐ 道具引擎系统
 * 
 * 📌 说明：整合 ItemManager、渲染器、碰撞检测等，提供统一的道具系统
 * 
 * 使用方式:
 * ```typescript
 * const itemSystem = new ItemSystem(config)
 * itemSystem.initialize()
 * itemSystem.update(snake, food)
 * ```
 */
export class ItemSystem {
  private config: ItemSystemConfig
  private itemManager: ItemManager | null = null
  private spawnTimer: any = null
  private onItemCollected?: (event: ItemCollectEvent) => void
  private isInitialized: boolean = false
  
  // 🎁 渲染相关
  private scene: any = null
  private graphics: any = null
  private itemTexts: Map<string, any> = new Map()  // 存储道具文本对象
  
  // 道具渲染缓存
  private itemTextures: Map<ItemType, string> = new Map()

  /**
   * 构造函数
   * @param config 道具系统配置
   */
  constructor(config?: Partial<ItemSystemConfig>) {
    this.config = {
      enabled: true,
      spawnInterval: 10000,      // 默认 10 秒生成一个
      maxActiveItems: 3,         // 最多同时存在 3 个道具
      itemLifetime: 10000,       // 道具存活 10 秒
      debugMode: false,
      ...config
    }
  }

  /**
   * ⭐ 初始化道具系统
   * 
   * @param adaptParams 适配参数
   * @param gridCols 网格列数
   * @param gridRows 网格行数
   */
  initialize(
    adaptParams: any,
    gridCols: number = 32,
    gridRows: number = 18
  ): void {
    if (!this.config.enabled) {
      console.log('🎁 道具系统已禁用')
      return
    }

    console.log('🎁 初始化道具系统...')
    
    // 创建道具管理器
    this.itemManager = new ItemManager(adaptParams, gridCols, gridRows)
    
    // 设置道具收集回调
    this.itemManager.setItemCollectedCallback((item) => {
      this.handleItemCollected(item)
    })
    
    // 初始化道具纹理
    this.initItemTextures()
    
    // 启动定时生成
    this.startSpawnTimer()
    
    this.isInitialized = true
    console.log('✅ 道具系统初始化完成')
  }

  /**
   * 🎁 清理道具系统 (游戏结束时调用)
   */
  cleanup(): void {
    console.log('🎁 清理道具系统...')
    
    // 停止生成定时器
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer)
      this.spawnTimer = null
      console.log('⏰ 道具生成定时器已停止')
    }
    
    // 清理所有道具
    if (this.itemManager) {
      this.itemManager.clearAllItems()
      console.log('🎁 所有道具已清理')
    }
    
    // 清理渲染对象
    if (this.graphics) {
      this.graphics.destroy()
      this.graphics = null
      console.log('🎨 Graphics 对象已清理')
    }
    
    // 清理文本对象
    this.itemTexts.forEach(text => text.destroy())
    this.itemTexts.clear()
    console.log('📝 文本对象已清理')
    
    this.scene = null
    this.isInitialized = false
    console.log('✅ 道具系统清理完成')
  }

  /**
   * 🎁 设置渲染场景 (在 Phaser 场景中调用)
   */
  setScene(scene: any): void {
    this.scene = scene
    // 创建一个持久的 graphics 对象
    if (scene && !this.graphics) {
      this.graphics = scene.add.graphics()
    }
  }

  /**
   * ⭐ 初始化道具纹理映射
   */
  private initItemTextures(): void {
    // 定义道具类型到 GTRS key 的映射
    this.itemTextures.set('speed_boost', 'item_speed')
    this.itemTextures.set('slow_down', 'item_slow')
    this.itemTextures.set('length_reduce', 'item_reduce')
    this.itemTextures.set('shield', 'item_shield')
    this.itemTextures.set('magnet', 'item_magnet')
    this.itemTextures.set('double_score', 'item_double')
    
    console.log('🎨 道具纹理映射已初始化')
  }

  /**
   * ⭐ 启动定时生成器
   */
  private startSpawnTimer(): void {
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer)
    }

    this.spawnTimer = setInterval(() => {
      this.trySpawnItem()
    }, this.config.spawnInterval)

    console.log(`⏰ 道具生成定时器已启动，间隔：${this.config.spawnInterval}ms`)
  }

  /**
   * ⭐ 尝试生成道具
   */
  private trySpawnItem(): void {
    if (!this.itemManager) return

    const activeItems = this.itemManager.getActiveItems()
    
    // 检查是否超过最大数量限制
    if (activeItems.length >= this.config.maxActiveItems) {
      if (this.config.debugMode) {
        console.log('🎁 当前道具数量已达上限:', activeItems.length)
      }
      return
    }

    // 生成新道具
    const item = this.itemManager.spawnItem()
    
    if (item && this.config.debugMode) {
      console.log(`🎁 生成新道具：${item.type}`, item.position)
    }
  }

  /**
   * ⭐ 更新道具系统状态
   * 
   * @param snake 蛇身数组
   * @param foodRenderer 食物渲染器 (可选，用于磁铁效果)
   */
  update(snake: any[], foodRenderer?: FoodRenderer): void {
    if (!this.isInitialized || !this.itemManager) return

    // 更新道具管理器状态（处理超时道具）
    this.itemManager.update()

    // ✅ 修复：checkItemCollision 已在内部标记 active=false 并 removeInactiveItems
    // 只需处理收集事件，不再重复调用 applyItemEffect
    const collectedItems = this.itemManager.checkItemCollision(snake)

    // 处理收集的道具
    for (const item of collectedItems) {
      // 触发收集事件（效果由 PhaserGame.handleItemCollected 负责应用）
      if (this.onItemCollected) {
        this.onItemCollected({
          item,
          snake,
          timestamp: Date.now()
        })
      }
      
      if (this.config.debugMode) {
        console.log(`🎁 道具已收集并从场景移除：${item.type}`)
      }
    }

    // 处理磁铁效果
    if ((snake as any).gameData?.hasMagnet && foodRenderer) {
      this.applyMagnetEffect(snake, foodRenderer)
    }
  }

  /**
   * ⭐ 应用磁铁效果
   */
  private applyMagnetEffect(snake: any[], foodRenderer: FoodRenderer): void {
    if (!snake || snake.length === 0) return

    const head = snake[0]
    const magnetRange = 200  // 吸引范围
    
    // TODO: 获取食物位置并吸引
    // 这里需要与 FoodRenderer 集成
    if (this.config.debugMode) {
      console.log('🧲 磁铁效果生效中...')
    }
  }

  /**
   * ⭐ 处理道具收集
   */
  private handleItemCollected(item: GameItem): void {
    if (this.config.debugMode) {
      console.log(`🎁 收集到道具：${item.type}`)
    }

    // 触发自定义回调
    if (this.onItemCollected) {
      this.onItemCollected({
        item,
        snake: [],
        timestamp: Date.now()
      })
    }
  }

  /**
   * ⭐ 渲染道具
   * 
   * @param scene Phaser 场景
   * @param graphics Phaser 图形对象
   * @param adaptParams 适配参数（含 screenW/screenH/safeTop/safeBottom/cellSize）
   */
  render(scene: any, graphics: any, adaptParams?: any): void {
    if (!this.isInitialized || !this.itemManager) return

    const activeItems = this.itemManager.getActiveItems()
    const cellSize = this.itemManager['adaptParams'].cellSize
    const gridCols = this.itemManager['gridCols']
    const gridRows = this.itemManager['gridRows']
    
    // ✅ 修复：与 renderSnake/renderFood 保持完全一致的偏移计算方式
    // 必须考虑 safeTop，否则道具位置与蛇位置不对应
    let offsetX: number
    let offsetY: number
    
    if (adaptParams && adaptParams.safeTop !== undefined) {
      // 使用与 PhaserGame 相同的偏移计算逻辑
      const gameWidth = gridCols * cellSize
      const gameHeight = gridRows * cellSize
      offsetX = (adaptParams.screenW - gameWidth) / 2
      offsetY = adaptParams.safeTop + (adaptParams.screenH - adaptParams.safeTop - adaptParams.safeBottom - gameHeight) / 2
    } else {
      // 兜底：只用 scene 尺寸（不含 safeTop）
      const gameWidth = gridCols * cellSize
      const gameHeight = gridRows * cellSize
      offsetX = (scene.scale.width - gameWidth) / 2
      offsetY = (scene.scale.height - gameHeight) / 2
    }

    // 🎁 清理旧的文本对象
    this.itemTexts.forEach(text => text.destroy())
    this.itemTexts.clear()

    for (const item of activeItems) {
      // ✅ 修复：道具坐标已经是游戏区域内的中心点坐标，直接加 offset 即可
      // item.position.x/y 与蛇坐标系相同（gridX * cellSize + cellSize/2）
      const x = offsetX + item.position.x
      const y = offsetY + item.position.y
      
      // 根据道具类型绘制不同颜色
      const color = this.getItemColor(item.type)
      
      // 🎁 设置道具图层的深度 (与蛇同一层)
      graphics.setDepth(5)  // 蛇在默认层 (0-10),道具设为 5
      
      // 绘制道具外框
      graphics.lineStyle(2, color, 1)
      graphics.strokeCircle(x, y, cellSize * 0.4)
      
      // 绘制道具内部 (闪烁效果)
      const alpha = 0.5 + Math.sin(Date.now() / 200) * 0.3
      graphics.fillStyle(color, alpha)
      graphics.fillCircle(x, y, cellSize * 0.35)
      
      // 🎁 创建新的文本对象并保存引用
      const icon = this.getItemIcon(item.type)
      const text = scene.add.text(x, y, icon, {
        fontSize: `${cellSize * 0.6}px`,
        color: '#ffffff'
      }).setOrigin(0.5)
      text.setDepth(15)  // ✅ 文字在最上层，高于蛇和道具
      
      // 存储文本对象，下次渲染时清理
      const key = `${item.type}_${item.position.x}_${item.position.y}`
      this.itemTexts.set(key, text)
    }
  }

  /**
   * ⭐ 获取道具颜色
   */
  private getItemColor(type: ItemType): number {
    const colors: Record<ItemType, number> = {
      'speed_boost': 0xffeb3b,      // 黄色
      'slow_down': 0x9e9e9e,        // 灰色
      'length_reduce': 0xff9800,    // 橙色
      'shield': 0x2196f3,           // 蓝色
      'magnet': 0xe91e63,           // 粉色
      'double_score': 0x4caf50      // 绿色
    }
    return colors[type] || 0xffffff
  }

  /**
   * ⭐ 获取道具图标字符
   */
  private getItemIcon(type: ItemType): string {
    const icons: Record<ItemType, string> = {
      'speed_boost': '⚡',
      'slow_down': '🐢',
      'length_reduce': '✂️',
      'shield': '🛡️',
      'magnet': '🧲',
      'double_score': '✨'
    }
    return icons[type] || '?'
  }

  /**
   * ⭐ 设置道具收集回调
   */
  setOnItemCollected(callback: (event: ItemCollectEvent) => void): void {
    this.onItemCollected = callback
  }

  /**
   * ⭐ 修改道具生成间隔
   */
  setSpawnInterval(interval: number): void {
    this.config.spawnInterval = interval
    
    // 重启定时器
    if (this.isInitialized) {
      this.startSpawnTimer()
    }
  }

  /**
   * ⭐ 修改最大活跃道具数
   */
  setMaxActiveItems(max: number): void {
    this.config.maxActiveItems = max
  }

  /**
   * ⭐ 清空所有道具
   */
  clearAllItems(): void {
    this.itemManager?.clearAllItems()
  }

  /**
   * ⭐ 销毁道具系统
   */
  destroy(): void {
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer)
      this.spawnTimer = null
    }
    
    this.clearAllItems()
    this.itemManager = null
    this.isInitialized = false
    
    console.log('🎁 道具系统已销毁')
  }

  /**
   * ⭐ 获取道具管理器实例
   */
  getItemManager(): ItemManager | null {
    return this.itemManager
  }

  /**
   * ⭐ 检查是否已初始化
   */
  getIsInitialized(): boolean {
    return this.isInitialized
  }
}
