/**
 * 🎮 Kids Game Framework
 * 
 * 儿童游戏开发通用框架
 * 基于 Phaser 3 + Vue 3 + Pinia
 * 
 * @version 1.0.0
 * @author Kids Game Platform Team
 */

// ============================================================================
// 🎯 核心引擎
// ============================================================================
export { GameEngine } from './core/GameEngine'
export type { GameEngineConfig } from './core/GameEngine'

// ============================================================================
// 📦 可复用组件
// ============================================================================
export { GTRSLoader } from './components/GTRSLoader'
export { ScreenAdapter } from './components/ScreenAdapter'
export { AudioManager } from './components/AudioManager'
export { ItemSystem } from './components/ItemSystem'
export { ItemManager } from './components/ItemManager'

// ============================================================================
// 📊 Store
// ============================================================================
export { useGameStore } from './stores/game.store'
export { useThemeStore } from './stores/theme.store'

// ============================================================================
// 📝 类型定义
// ============================================================================
export type { 
  Difficulty,
  DifficultyConfig,
  GameState,
  Position,
  Food,
  Particle
} from './types/game.types'
export { DIFFICULTY_CONFIGS, FOOD_TYPES } from './types/game.types'

// ============================================================================
// 🛠️ 工具函数
// ============================================================================
export { validateGTRSTheme } from './utils/gtrs-validator'
export type { GTRSTheme, ValidationResult } from './utils/gtrs-validator'
export * from './utils/color-utils'
export * from './utils/math-utils'

// ============================================================================
// ⚙️ 配置
// ============================================================================
export * from './config/game.config'
export * from './config/default.config'
