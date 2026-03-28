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
export { GameEvent, GameEventType } from './core/GameEvent'
export type { GameEventPayload } from './core/GameEvent'

// ========== 类型定义 (Types) ==========
export type { Direction, Position } from './types/common'
export type { DifficultyLevel } from './types/difficulty'
export type { GameState } from './types/game-state'

// ========== 接口定义 (Interfaces) ==========
export type { IMovableObject } from './interfaces/movable-object'
export type { IGameConfig } from './interfaces/game-config'

// ========== 逻辑组件 (Logic Components) ==========
export { GridMovementComponent } from './logic/GridMovementComponent'
export { GameStateComponent } from './logic/GameStateComponent'
export { CollisionDetectionComponent } from './logic/CollisionDetectionComponent'
export { ItemSpawnerComponent } from './logic/ItemSpawnerComponent'
export { ScoreManagerComponent } from './logic/ScoreManagerComponent'
export { GameConfigComponent } from './logic/GameConfigComponent'
export { PauseManagerComponent } from './logic/PauseManagerComponent'

// ========== 渲染组件 (Rendering Components) ==========
export { BackgroundRenderer } from './rendering/BackgroundRenderer'
export { GridRenderer } from './rendering/GridRenderer'
export { GameObjectRenderer } from './rendering/GameObjectRenderer'
export { ParticleRenderer } from './rendering/ParticleRenderer'

// ========== 控制组件 (Control Components) ==========
export { InputHandlerComponent } from './control/InputHandlerComponent'

// ========== 游戏场景 (Game Scene) ==========
export { ComponentGameScene } from './scenes/ComponentGameScene'
export type { GameSceneConfig } from './scenes/ComponentGameScene'

// ========== 工具函数 (Utils) ==========
export * from './utils/helpers'
export * from './utils/constants'

// ========== 版本信息 ==========
export const VERSION = '1.0.0'
export const FRAMEWORK_NAME = 'Kids Game Frame Factory'

console.log(`🎮 ${FRAMEWORK_NAME} v${VERSION} 已加载`)
