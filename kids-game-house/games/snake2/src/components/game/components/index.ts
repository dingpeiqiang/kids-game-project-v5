// ============================================================================
// 🎮 游戏引擎组件 - 统一导出
// ============================================================================
// 📌 说明：提供一站式导入，简化使用
// ============================================================================

// GTRS 加载组件
export { GTRSLoader } from './GTRSLoader'
export type { GTRSTheme } from './GTRSLoader'

// 屏幕适配组件
export { ScreenAdapter } from './ScreenAdapter'
export type { AdaptParams } from './ScreenAdapter'

// 音频管理组件
export { AudioManager } from './AudioManager'
export type { AudioConfig, BgmType } from './AudioManager'

// 编排器组件
export { GameOrchestrator } from './GameOrchestrator'

// 蛇渲染组件 (贪吃蛇示例)
export { SnakeRenderer } from './SnakeRenderer'
export type { SnakeSegment } from './SnakeRenderer'

// 食物渲染组件 (贪吃蛇示例)
export { FoodRenderer } from './FoodRenderer'
export type { FoodType, Food } from './FoodRenderer'

// 背景渲染组件 (框架层)
export { BackgroundRenderer } from './BackgroundRenderer'

// 网格渲染组件 (框架层)
export { GridRenderer } from './GridRenderer'

// 粒子渲染组件 (框架层)
export { ParticleRenderer } from './ParticleRenderer'

// 碰撞检测组件 (游戏特定层 - 贪吃蛇示例)
export { CollisionDetector } from './CollisionDetector'
export type { Food as CollisionFood, SnakeSegment as CollisionSnakeSegment } from './CollisionDetector'

// 游戏循环组件 (游戏特定层 - 贪吃蛇示例)
export { GameLoop } from './GameLoop'

// 道具管理组件 (游戏特定层 - 贪吃蛇示例)
export { ItemManager } from './ItemManager'
export type { ItemType, GameItem, ItemEffect } from './ItemManager'

// 道具引擎系统 (框架层)
export { ItemSystem } from './ItemSystem'
export type { ItemSystemConfig, ItemCollectEvent } from './ItemSystem'
