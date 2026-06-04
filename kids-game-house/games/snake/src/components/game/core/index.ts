// ============================================================================
// 🔧【可复用框架层】游戏引擎核心模块统一导出
// ============================================================================
// 📌 说明：提供一站式导入，简化使用
// ============================================================================

// 资源加载器 - 类型导出
export type { GTRSTheme } from './ResourceLoader'

// 资源加载器 - 值和函数导出
export {
  imageCache,
  hexToNumber,
  normalizeSrcPaths,
  applyGTRS,
  assertGTRS,
  loadTheme,
  countResourcesToLoad,
  loadGTRSImages
} from './ResourceLoader'

// 屏幕适配管理器 - 类型导出
export type { AdaptParams, GridConfig, DesignConfig } from './AdaptationManager'

// 屏幕适配管理器 - 类导出
export { AdaptationManager } from './AdaptationManager'
