/**
 * 📝 类型定义统一导出
 */

// ============================================================================
// 🎮 游戏核心类型
// ============================================================================

export type { 
  Difficulty,
  DifficultyConfig,
  GameState,
  Position,
  Food,
  Particle
} from './game.types'

export { 
  DIFFICULTY_CONFIGS, 
  FOOD_TYPES 
} from './game.types'

// ============================================================================
// 🎨 GTRS 主题类型
// ============================================================================

export type {
  GTRSTheme,
  ValidationResult,
  GTRSLoaderConfig
} from './gtrs.types'

// ============================================================================
// 🎁 道具系统类型
// ============================================================================

export type {
  ItemType,
  GameItem,
  ItemEffect,
  ItemSystemConfig,
  ItemCollectEvent,
  ItemManagerState
} from './item.types'

// ============================================================================
// 🎮 框架扩展类型（新增）
// ============================================================================

export type {
  // 游戏实体
  SpriteConfig,
  PhysicsBodyConfig,
  
  // 粒子系统
  ParticleEmitterConfig,
  ParticlePreset,
  
  // 状态管理
  GamePhase,
  GameEventType,
  GameEventHandler,
  
  // 输入控制
  InputDirection,
  VirtualJoystickConfig,
  ButtonMapping,
  
  // 数据持久化
  SaveData,
  GameProgress,
  PlayerData,
  InventoryItem,
  EquipmentSlot,
  GameSettings,
  GameStatistics,
  AchievementData,
  
  // 动画系统
  AnimationClipConfig,
  TweenConfig,
  
  // 随机工具
  SeededRandomGenerator,
  
  // 通知系统
  NotificationType,
  NotificationConfig
} from './framework.types'
