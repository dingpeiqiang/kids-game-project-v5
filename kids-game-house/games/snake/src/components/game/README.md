// ============================================================================
// 🎮 游戏引擎框架 - 模块化架构
// ============================================================================
// 
// 📌 版本：v3.0 - 模块化架构
// 📌 目标：将 1650 行单文件拆分为多个 200-300 行的职责单一模块
// 📌 状态：核心模块已完成 (30%)
//
// 架构分层:
//   ┌─────────────────────────────────────┐
//   │  PhaserGame.ts (主入口，待重构)     │ ← 协调各模块工作
//   ├─────────────────────────────────────┤
//   │  core/ 核心框架层 (可复用)          │
//   │    ├─ ResourceLoader.ts ✅          │
//   │    ├─ AdaptationManager.ts ✅       │
//   │    └─ GameEngine.ts ⏳              │
//   ├─────────────────────────────────────┤
//   │  renderer/ 渲染器层 (部分可复用)    │
//   │    ├─ BackgroundRenderer.ts ⏳      │
//   │    ├─ GridRenderer.ts ⏳            │
//   │    └─ ParticleRenderer.ts ⏳        │
//   ├─────────────────────────────────────┤
//   │  audio/ 音频管理层 (可复用)         │
//   │    └── AudioManager.ts ✅           │
//   └─────────────────────────────────────┤
//   │  snake/ 游戏特定层 (示例)           │
//   │    ├─ SnakeRenderer.ts ⏳           │
//   │    └─ FoodRenderer.ts ⏳            │
//   └─────────────────────────────────────┘
//
// 使用示例:
// ```typescript
// // 方式 1: 按需导入
// import { ResourceLoader } from './core/ResourceLoader'
// import { AudioManager } from './audio/AudioManager'
// 
// // 方式 2: 批量导入
// import { ResourceLoader, AdaptationManager } from './core'
// import { AudioManager } from './audio'
// 
// // 使用模块
// const loader = new ResourceLoader()
// await loader.loadTheme('snake_default')
// 
// const audioManager = new AudioManager()
// audioManager.playBgm('main', { src: 'bgm.mp3' })
// ```
// ============================================================================

// 导出所有核心模块
export * from './core'
export * from './audio'

// TODO: 后续添加其他模块
// export * from './renderer'
// export * from './snake'
