// ============================================================================
// 🧠 逻辑组件统一导出
// ============================================================================
// 
// 📌 说明:
//   导出所有逻辑类组件，便于外部引用
// ============================================================================

export { GameStateComponent } from './GameStateComponent'
export type { GameState } from './GameStateComponent'
export { SnakeMovementComponent } from './SnakeMovementComponent'
export type { Direction, Position, SnakeSegment } from './SnakeMovementComponent'
export { CollisionDetectionComponent } from './CollisionDetectionComponent'
export { FoodSpawnerComponent } from './FoodSpawnerComponent'
export { ScoreManagerComponent } from './ScoreManagerComponent'
export { GameConfigComponent } from './GameConfigComponent'
export { PauseManagerComponent } from './PauseManagerComponent'
export type { DifficultyLevel } from './GameConfigComponent'
