/**
 * UI 自适应工具 - 基于屏幕尺寸独立计算最优 UI 参数
 * 统一缩放系统
 * 设计基准：720×1280
 */

// UI 设计基准（对应设计稿标准）
const UI_DESIGN_WIDTH = 720    // UI 设计宽度
const UI_DESIGN_HEIGHT = 1280  // UI 设计高度

// 当前屏幕参数
let screenWidth = 0
let screenHeight = 0
let uiScale = 1

/**
 * 初始化 UI 参数（基于屏幕尺寸独立计算）
 * @param screenW - 屏幕宽度
 * @param screenH - 屏幕高度
 */
export function initUIParams(screenW: number, screenH: number): void {
  screenWidth = screenW
  screenHeight = screenH
  
  // 计算 UI 缩放比（基于屏幕尺寸，而非 cellSize）
  const rawScale = Math.min(
    screenW / UI_DESIGN_WIDTH,
    screenH / UI_DESIGN_HEIGHT
  )
  
  // 增加最小/最大阈值保护
  uiScale = Math.max(0.65, Math.min(rawScale, 1.5))
  
  // 应用全局字体大小到 root
  applyGlobalFontSize()
  
  console.log('🎨 UI 参数初始化:', {
    screen: `${screenW} × ${screenH}`,
    uiScale: uiScale.toFixed(3)
  })
}

/**
 * 获取动态字体大小
 */
export function getFontSize(baseSize: number = 16): string {
  return `${baseSize * uiScale}px`
}

/**
 * 获取动态内边距
 */
export function getPadding(basePadding: number = 16): string {
  return `${basePadding * uiScale}px`
}

/**
 * 获取动态间距
 */
export function getGap(baseGap: number = 12): string {
  return `${baseGap * uiScale}px`
}

/**
 * 获取动态宽度
 */
export function getWidth(baseWidth: number): string {
  return `${baseWidth * uiScale}px`
}

/**
 * 获取动态高度
 */
export function getHeight(baseHeight: number): string {
  return `${baseHeight * uiScale}px`
}

/**
 * 获取动态圆角
 */
export function getBorderRadius(baseRadius: number = 8): string {
  return `${baseRadius * uiScale}px`
}

/**
 * 获取响应式图标大小
 */
export function getIconSize(baseIconSize: number = 24): string {
  return `${baseIconSize * uiScale}px`
}

/**
 * 获取响应式按钮尺寸
 */
export function getButtonStyle(minWidth: number = 120, minHeight: number = 44) {
  return {
    fontSize: getFontSize(16),
    paddingLeft: getPadding(24),
    paddingRight: getPadding(24),
    paddingTop: getPadding(12),
    paddingBottom: getPadding(12),
    minWidth: getWidth(minWidth),
    minHeight: getHeight(minHeight)
  }
}

/**
 * 应用全局字体大小到 root 元素，同时注入 --ui-scale CSS 变量
 * --ui-scale 供框架组件（GameButton 等）使用 CSS calc() 缩放
 */
function applyGlobalFontSize(): void {
  const root = document.documentElement
  const baseFontSize = 16
  root.style.fontSize = getFontSize(baseFontSize)
  // 注入 CSS 变量，供框架组件使用（避免框架内直接导入 useResponsiveUI）
  root.style.setProperty('--ui-scale', String(uiScale))
}

/**
 * Vue 组合式 API：响应式 UI 尺寸
 */
export function useResponsiveUI() {
  const getFontClass = (baseSize: number) => {
    return { fontSize: getFontSize(baseSize) }
  }
  
  const getPaddingClass = (basePadding: number) => {
    return {
      paddingTop: getPadding(basePadding),
      paddingRight: getPadding(basePadding),
      paddingBottom: getPadding(basePadding),
      paddingLeft: getPadding(basePadding)
    }
  }
  
  return {
    uiScale,
    screenWidth,
    screenHeight,
    getFontClass,
    getPaddingClass,
    getFontSize,
    getPadding,
    getGap,
    getWidth,
    getHeight,
    getBorderRadius,
    getIconSize,
    getButtonStyle
  }
}
