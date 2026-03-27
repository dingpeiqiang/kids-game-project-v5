/**
 * 🎁 道具系统类型定义
 */

// ============================================================================
// 🎁 道具类型枚举
// ============================================================================

export type ItemType = 
  | 'speed_boost'      // 加速道具
  | 'slow_down'        // 减速道具
  | 'length_bonus'     // 长度奖励
  | 'shield'           // 护盾道具
  | 'magnet'           // 磁铁道具
  | 'double_score'     // 双倍分数
  | 'time_freeze'      // 时间冻结
  | 'ghost_mode'       // 幽灵模式（穿墙）
  | string             // 支持自定义道具类型

// ============================================================================
// 🎁 道具接口定义
// ============================================================================

export interface GameItem {
  /** 道具唯一标识 */
  id: string
  
  /** 道具类型 */
  type: ItemType
  
  /** 道具名称 */
  name: string
  
  /** 道具描述 */
  description?: string
  
  /** 道具图标（emoji 或图片 URL） */
  icon?: string
  
  /** 道具位置（网格坐标） */
  gridPosition: {
    x: number
    y: number
  }
  
  /** 生成时间戳 */
  spawnTime: number
  
  /** 过期时间戳 */
  expireTime: number
  
  /** 是否已被收集 */
  collected: boolean
  
  /** 道具效果持续时间（毫秒） */
  effectDuration?: number
  
  /** 道具稀有度 */
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
}

// ============================================================================
// 🎁 道具效果接口
// ============================================================================

export interface ItemEffect {
  /** 效果类型 */
  type: ItemType
  
  /** 效果名称 */
  name: string
  
  /** 效果描述 */
  description: string
  
  /** 效果图标 */
  icon: string
  
  /** 开始时间戳 */
  startTime: number
  
  /** 结束时间戳 */
  endTime: number
  
  /** 是否已激活 */
  isActive: boolean
  
  /** 剩余时间（毫秒，运行时计算） */
  remainingTime?: number
}

// ============================================================================
// 🎁 道具系统配置
// ============================================================================

export interface ItemSystemConfig {
  /** 是否启用道具系统 */
  enabled: boolean
  
  /** 生成间隔（毫秒） */
  spawnInterval: number
  
  /** 最大活跃道具数 */
  maxActiveItems: number
  
  /** 道具存活时间（毫秒） */
  itemLifetime: number
  
  /** 调试模式（输出详细日志） */
  debugMode: boolean
  
  /** 道具生成概率配置 */
  spawnRates?: {
    [key: string]: number
  }
}

// ============================================================================
// 🎁 道具收集事件
// ============================================================================

export interface ItemCollectEvent {
  /** 收集的道具 */
  item: GameItem
  
  /** 收集者（玩家或其他实体） */
  collector: any
  
  /** 收集时间戳 */
  timestamp: number
  
  /** 道具效果 */
  effect?: ItemEffect
}

// ============================================================================
// 🎁 道具管理器状态
// ============================================================================

export interface ItemManagerState {
  /** 所有道具列表 */
  items: GameItem[]
  
  /** 已收集的道具列表 */
  collectedItems: GameItem[]
  
  /** 当前激活的效果列表 */
  activeEffects: ItemEffect[]
  
  /** 道具系统是否已初始化 */
  isInitialized: boolean
  
  /** 上次生成时间 */
  lastSpawnTime: number
}
