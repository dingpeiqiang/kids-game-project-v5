// ============================================================================
// 🎮 Kids Game Frame Factory - 主入口文件
// ============================================================================
// 
// 📌 说明:
//   通用儿童游戏开发框架
//   基于组件化架构的可复用游戏框架
//   从成熟的贪吃蛇游戏中抽象而来
// ============================================================================

// ========== 核心层 (Core) ==========
export { ComponentBase } from './core/ComponentBase'
export type { IComponent } from './core/IComponent'
export { ComponentContainer } from './core/ComponentContainer'
export { EventBus } from './core/EventBus'
export { GameEventType } from './core/GameEvent'
export type { GameEvent, GameEventPayload } from './core/GameEvent'

// ========== 类型定义 (Types) ==========
export type { Direction, Position, GridPosition, Size, Rectangle, Color, RGBColor, Speed } from './types/common'
export type { DifficultyLevel, DifficultyConfig, DynamicDifficultyConfig, PlayerPerformance, DifficultyAdjustmentResult } from './types/difficulty'
export type { GameState, GameStateInfo, GameOverReason, GameResult, PauseConfig, StateChangeEvent } from './types/game-state'

// ========== 接口定义 (Interfaces) ==========
export type { IMovableObject, IGridMovableObject, ColliderType, ICollider, IMovableWithCollider } from './interfaces/movable-object'
export type { IGameConfig, CustomGameConfig, MergedGameConfig, ConfigChangeEvent } from './interfaces/game-config'

// ========== 逻辑组件 (Logic Components) ==========
export { GameStateComponent } from './logic/GameStateComponent'
export { GridMovementComponent } from './logic/GridMovementComponent'
export { ScoreManagerComponent } from './logic/ScoreManagerComponent'
export { CollisionDetectionComponent } from './logic/CollisionDetectionComponent'
export { ItemSpawnerComponent } from './logic/ItemSpawnerComponent'
export { PauseManagerComponent } from './logic/PauseManagerComponent'
export { GameConfigManager } from './logic/GameConfigManager'

// ========== 控制组件 (Control Components) ==========
export { InputHandlerComponent } from './control/InputHandlerComponent'

// ========== 渲染组件 (Render Components) ==========
export { BackgroundRenderer } from './render/BackgroundRenderer'
export { GridRenderer } from './render/GridRenderer'
export { GameObjectRenderer } from './render/GameObjectRenderer'
export { ParticleRenderer } from './render/ParticleRenderer'

// ========== 游戏场景 (Game Scenes) ==========
export { ComponentGameScene } from './scene/ComponentGameScene'

// ========== 工具函数 (Utils) ==========
export * from './utils/helpers'
export * from './utils/constants'

// ========== 版本信息 ==========
export const VERSION = '3.0.0'
export const FRAMEWORK_NAME = 'Kids Game Frame Factory'

console.log(`🎮 ${FRAMEWORK_NAME} v${VERSION} 已加载`)
