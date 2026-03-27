/**
 * 🎮 Kids Game Framework - 类型定义扩展
 * 
 * 为游戏开发添加常用类型定义
 */

import type { Scene } from 'phaser'

// ============================================================================
// 🎯 游戏实体类型
// ============================================================================

/**
 * 游戏精灵配置
 */
export interface SpriteConfig {
  /** 精灵 Key */
  key: string
  /** 纹理帧（可选） */
  frame?: string | number
  /** X 坐标 */
  x: number
  /** Y 坐标 */
  y: number
  /** 锚点（默认 0.5） */
  anchorX?: number
  /** 锚点（默认 0.5） */
  anchorY?: number
  /** 缩放 */
  scale?: number | any
  /** 旋转角度（弧度） */
  rotation?: number
  /** 透明度 */
  alpha?: number
  /** 可见性 */
  visible?: boolean
}

/**
 * 物理身体配置
 */
export interface PhysicsBodyConfig {
  /** 是否启用物理 */
  enable: boolean
  /** 碰撞器大小 */
  size?: { width: number; height: number }
  /** 偏移量 */
  offset?: { x: number; y: number }
  /** 是否免疫移动 */
  setImmovable?: boolean
  /** 反弹系数 */
  bounce?: number
  /** 阻力 */
  drag?: number
  /** 重力影响 */
  allowGravity?: boolean
}

// ============================================================================
// 🎨 粒子系统类型
// ============================================================================

/**
 * 粒子发射器配置
 */
export interface ParticleEmitterConfig {
  /** 粒子纹理 Key */
  texture: string
  /** 发射速率（粒子/秒） */
  frequency?: number
  /** 最大粒子数 */
  maxParticles?: number
  /** 生命周期（毫秒） */
  lifespan?: number
  /** 速度范围 */
  speed?: { min: number; max: number }
  /** 缩放范围 */
  scale?: { start: number; end: number }
  /** 透明度范围 */
  alpha?: { start: number; end: number }
  /** 重力 */
  gravityY?: number
  /** 旋转速度 */
  rotate?: { start: number; end: number }
  /** 混合模式 */
  blendMode?: number
}

/**
 * 粒子效果预设
 */
export type ParticlePreset = 
  | 'explosion'      // 爆炸效果
  | 'sparkle'        // 闪光效果
  | 'smoke'          // 烟雾效果
  | 'fire'           // 火焰效果
  | 'magic'          // 魔法效果
  | 'confetti'       // 彩带效果
  | string           // 自定义效果

// ============================================================================
// 🎮 游戏状态管理类型
// ============================================================================

/**
 * 游戏阶段枚举
 */
export enum GamePhase {
  /** 未开始 */
  NOT_STARTED = 'not_started',
  /** 准备中 */
  READY = 'ready',
  /** 进行中 */
  PLAYING = 'playing',
  /** 暂停 */
  PAUSED = 'paused',
  /** 胜利 */
  VICTORY = 'victory',
  /** 失败 */
  DEFEAT = 'defeat',
  /** 已结束 */
  GAME_OVER = 'game_over'
}

/**
 * 游戏事件类型
 */
export type GameEventType =
  | 'game:start'           // 游戏开始
  | 'game:pause'           // 游戏暂停
  | 'game:resume'          // 游戏继续
  | 'game:restart'         // 游戏重开
  | 'game:over'            // 游戏结束
  | 'score:change'         // 分数变化
  | 'score:update'         // 分数更新
  | 'level:complete'       // 关卡完成
  | 'player:hurt'          // 玩家受伤
  | 'player:die'           // 玩家死亡
  | 'player:powerup'       // 玩家获得强化
  | 'item:collect'         // 道具收集
  | 'item:use'             // 道具使用
  | 'enemy:spawn'          // 敌人生成
  | 'enemy:die'            // 敌人死亡
  | 'boss:spawn'           // BOSS 生成
  | 'boss:die'             // BOSS 死亡
  | 'achievement:unlock'   // 成就解锁
  | string                 // 自定义事件

/**
 * 游戏事件处理器
 */
export interface GameEventHandler {
  (event: any): void
}

// ============================================================================
// 🕹️ 输入控制类型
// ============================================================================

/**
 * 输入方向枚举
 */
export enum InputDirection {
  NONE = 0,
  UP = 1,
  DOWN = 2,
  LEFT = 4,
  RIGHT = 8,
  UP_LEFT = 9,
  UP_RIGHT = 17,
  DOWN_LEFT = 10,
  DOWN_RIGHT = 18
}

/**
 * 虚拟摇杆配置
 */
export interface VirtualJoystickConfig {
  /** 摇杆场景 Key */
  scene: Scene
  /** 摇杆位置 X */
  x: number
  /** 摇杆位置 Y */
  y: number
  /** 摇杆半径 */
  radius?: number
  /** 摇杆颜色 */
  color?: number
  /** 摇杆透明度 */
  alpha?: number
  /** 是否固定位置 */
  fixedToCamera?: boolean
  /** 摇杆 Key */
  key?: string
}

/**
 * 按钮映射配置
 */
export interface ButtonMapping {
  /** 确认按钮 */
  confirm: string[]
  /** 取消按钮 */
  cancel: string[]
  /** 暂停按钮 */
  pause: string[]
  /** 菜单按钮 */
  menu: string[]
  /** 技能 1 */
  skill1?: string[]
  /** 技能 2 */
  skill2?: string[]
  /** 技能 3 */
  skill3?: string[]
}

// ============================================================================
// 📊 数据持久化类型
// ============================================================================

/**
 * 存档数据结构
 */
export interface SaveData {
  /** 存档 ID */
  saveId: string
  /** 存档名称 */
  saveName: string
  /** 创建时间戳 */
  createdAt: number
  /** 最后修改时间戳 */
  updatedAt: number
  /** 游戏进度数据 */
  progress: GameProgress
  /** 玩家数据 */
  player: PlayerData
  /** 设置数据 */
  settings: GameSettings
  /** 统计数据 */
  statistics: GameStatistics
  /** 成就数据 */
  achievements: AchievementData
  /** 自定义数据 */
  custom?: Record<string, any>
}

/**
 * 游戏进度数据
 */
export interface GameProgress {
  /** 当前关卡 */
  currentLevel: number
  /** 已解锁关卡 */
  unlockedLevels: number
  /** 最高分数 */
  highScore: number
  /** 通关次数 */
  completedCount: number
  /** 游戏时长（秒） */
  totalPlayTime: number
}

/**
 * 玩家数据
 */
export interface PlayerData {
  /** 玩家 ID */
  playerId: string
  /** 玩家名称 */
  playerName: string
  /** 玩家等级 */
  level: number
  /** 经验值 */
  experience: number
  /** 金币数量 */
  coins: number
  /** 钻石数量 */
  diamonds: number
  /** 拥有的道具 */
  items: InventoryItem[]
  /** 装备的物品 */
  equippedItems: EquipmentSlot[]
}

/**
 * 背包物品
 */
export interface InventoryItem {
  /** 物品 ID */
  itemId: string
  /** 物品类型 */
  itemType: string
  /** 物品名称 */
  itemName: string
  /** 数量 */
  quantity: number
  /** 稀有度 */
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  /** 属性加成 */
  stats?: Record<string, number>
}

/**
 * 装备槽位
 */
export type EquipmentSlot = 'head' | 'body' | 'weapon' | 'accessory' | string

/**
 * 游戏设置
 */
export interface GameSettings {
  /** 背景音乐音量 */
  bgmVolume: number
  /** 音效音量 */
  sfxVolume: number
  /** 是否静音 */
  muted: boolean
  /** 难度设置 */
  difficulty: string
  /** 语言设置 */
  language: string
  /** 画质设置 */
  graphicsQuality: 'low' | 'medium' | 'high'
  /** 是否显示 FPS */
  showFPS: boolean
  /** 是否启用物理引擎调试 */
  debugPhysics: boolean
}

/**
 * 游戏统计数据
 */
export interface GameStatistics {
  /** 总游戏次数 */
  totalGames: number
  /** 总胜利次数 */
  totalWins: number
  /** 总失败次数 */
  totalLosses: number
  /** 胜率 */
  winRate: number
  /** 最高连击 */
  highestCombo: number
  /** 总击杀数 */
  totalKills: number
  /** 总伤害量 */
  totalDamage: number
  /** 平均分数 */
  averageScore: number
  /** 总游戏时长（秒） */
  totalPlayTime: number
  /** 各难度胜利次数 */
  winsByDifficulty: Record<string, number>
}

/**
 * 成就数据
 */
export interface AchievementData {
  /** 已解锁的成就 ID 列表 */
  unlockedAchievements: string[]
  /** 成就进度 */
  achievementProgress: Record<string, number>
  /** 成就解锁时间 */
  achievementUnlockTimes: Record<string, number>
}

// ============================================================================
// 🎭 动画类型
// ============================================================================

/**
 * 动画剪辑配置
 */
export interface AnimationClipConfig {
  /** 动画 Key */
  key: string
  /** 纹理 Key */
  texture: string
  /** 帧序列 */
  frames: any[]
  /** 帧率 */
  frameRate: number
  /** 重复次数 */
  repeat: number
  /** 是否循环 */
  loop?: boolean
  /** 是否延迟启动 */
  delay?: number
}

/**
 * 补间动画配置
 */
export interface TweenConfig {
  /** 目标对象 */
  targets: any | any[]
  /** 持续时间（毫秒） */
  duration?: number
  /** 延迟（毫秒） */
  delay?: number
  /** 缓动函数 */
  ease?: string | any
  /** 重复次数 */
  repeat?: number
  /** Yoyo 效果 */
  yoyo?: boolean
  /** 回调函数 */
  onComplete?: () => void
  /** 每帧回调 */
  onUpdate?: (tween: any) => void
}

// ============================================================================
// 🎲 随机工具类型
// ============================================================================

/**
 * 随机种子生成器
 */
export interface SeededRandomGenerator {
  /** 设置种子 */
  setSeed(seed: number): void
  /** 获取下一个随机数（0-1） */
  next(): number
  /** 获取范围内的随机整数 */
  int(min: number, max: number): number
  /** 获取范围内的随机浮点数 */
  float(min: number, max: number): number
  /** 从数组中随机选择 */
  choice<T>(array: T[]): T
  /** 洗牌算法 */
  shuffle<T>(array: T[]): T[]
}

// ============================================================================
// 🔔 通知系统类型
// ============================================================================

/**
 * 通知类型
 */
export type NotificationType = 
  | 'info'       // 信息
  | 'success'    // 成功
  | 'warning'    // 警告
  | 'error'      // 错误
  | 'achievement' // 成就
  | 'reward'     // 奖励

/**
 * 通知配置
 */
export interface NotificationConfig {
  /** 通知类型 */
  type: NotificationType
  /** 通知标题 */
  title: string
  /** 通知内容 */
  message: string
  /** 图标（可选） */
  icon?: string
  /** 持续时间（毫秒） */
  duration?: number
  /** 是否可关闭 */
  closable?: boolean
  /** 点击回调 */
  onClick?: () => void
  /** 关闭回调 */
  onClose?: () => void
}
