// ============================================================================
// 🎮 kids-game-frame-factory 统一导出
// ============================================================================

// 类型定义
export * from './types/level-types'
export * from './types/level-phase'

// 核心组件
export * from './core/LevelOrchestrator'

// 工具类
export * from './utils/LevelResourceLoader'

// 游戏机制模块类型（AI 开发者可直接 import 使用）
export type {
  GameObjectPoolConfig,
  PoolSpawnOptions,
} from '../templates/game-template/src/utils/GameObjectPool'
export type {
  InputManagerConfig,
  KeyBinding,
  Direction4,
} from '../templates/game-template/src/utils/InputManager'
export type {
  CollisionPairConfig,
} from '../templates/game-template/src/utils/CollisionRegistry'
export type {
  PropEffect,
  ActiveEffect,
  PropSystemConfig,
} from '../templates/game-template/src/utils/PropSystem'
