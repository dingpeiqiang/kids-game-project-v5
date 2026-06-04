// ============================================================================
// 🎮 核心组件统一导出
// ============================================================================
// 
// 📌 说明:
//   导出所有核心层组件，便于外部引用
// ============================================================================

export type { IComponent } from './IComponent'
export type { GameEvent, EventListener, EventSubscription } from './GameEvent'
export { GameEventType } from './GameEvent'
export { EventBus } from './EventBus'
export { ComponentBase } from './ComponentBase'
export { ComponentContainer } from './ComponentContainer'
