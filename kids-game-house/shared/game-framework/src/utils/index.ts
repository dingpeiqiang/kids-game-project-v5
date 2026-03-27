/**
 * 🛠️ 工具函数统一导出
 */

// ============================================================================
// ✅ GTRS 校验工具
// ============================================================================

export { 
  validateGTRSTheme
} from './gtrs-validator'

export type { 
  GTRSTheme,
  ValidationResult
} from './gtrs-validator'

// ============================================================================
// 🎨 颜色工具
// ============================================================================

export {
  hexToNumber,
  numberToHex,
  rgbToNumber,
  numberToRgb,
  lerpColor,
  adjustBrightness
} from './color-utils'

// ============================================================================
// 📐 数学工具
// ============================================================================

export {
  lerp,
  mapRange,
  clamp,
  inRange,
  randomInt,
  randomFloat,
  randomChoice,
  distance,
  distanceSquared,
  radiansToDegrees,
  degreesToRadians
} from './math-utils'
