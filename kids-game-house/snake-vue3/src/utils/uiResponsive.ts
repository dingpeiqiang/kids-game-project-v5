/**
 * UI 自适应工具 - 基于屏幕尺寸独立计算最优 UI 参数
 * 商业级方案：UI 与游戏画面各自保持最佳显示，非简单等比缩放
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
  // 保证 UI 在不同屏幕上都是最优显示
  uiScale = Math.min(
    screenW / UI_DESIGN_WIDTH,
    screenH / UI_DESIGN_HEIGHT,
    1.2  // 最大放大到 1.2 倍，避免过大
  )
  
  // 应用全局字体大小到 root
  applyGlobalFontSize()
  
  console.log('🎨 UI 参数初始化:', {
    screen: `${screenW} × ${screenH}`,
    uiScale: uiScale.toFixed(3)
  })
}

/**
 * 更新 UI 参数（resize 时重新计算）
 */
export function updateUIParams(screenW: number, screenH: number): void {
  initUIParams(screenW, screenH)
}

/**
 * 获取动态字体大小
 * @param baseSize - 基础字体大小（px）
 * @returns 缩放后的字体大小
 */
export function getFontSize(baseSize: number = 16): string {
  return `${baseSize * uiScale}px`
}

/**
 * 获取动态内边距
 * @param basePadding - 基础内边距（px）
 * @returns 缩放后的内边距
 */
export function getPadding(basePadding: number = 16): string {
  return `${basePadding * uiScale}px`
}

/**
 * 获取动态间距
 * @param baseGap - 基础间距（px）
 * @returns 缩放后的间距
 */
export function getGap(baseGap: number = 12): string {
  return `${baseGap * uiScale}px`
}

/**
 * 获取动态宽度
 * @param baseWidth - 基础宽度（px）
 * @returns 缩放后的宽度
 */
export function getWidth(baseWidth: number): string {
  return `${baseWidth * uiScale}px`
}

/**
 * 获取动态高度
 * @param baseHeight - 基础高度（px）
 * @returns 缩放后的高度
 */
export function getHeight(baseHeight: number): string {
  return `${baseHeight * uiScale}px`
}

/**
 * 获取动态圆角
 * @param baseRadius - 基础圆角（px）
 * @returns 缩放后的圆角
 */
export function getBorderRadius(baseRadius: number = 8): string {
  return `${baseRadius * uiScale}px`
}

/**
 * 获取响应式图标大小
 * @param baseIconSize - 基础图标大小（px）
 * @returns 缩放后的图标大小
 */
export function getIconSize(baseIconSize: number = 24): string {
  return `${baseIconSize * uiScale}px`
}

/**
 * 获取响应式按钮尺寸
 * @param minWidth - 最小宽度
 * @param minHeight - 最小高度
 * @returns 缩放后的按钮样式
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
 * 应用全局字体大小到 root 元素
 */
function applyGlobalFontSize(): void {
  const root = document.documentElement
  const baseFontSize = 16 // Tailwind 默认根字体大小
  root.style.fontSize = getFontSize(baseFontSize)
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
