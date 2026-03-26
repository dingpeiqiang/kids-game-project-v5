/**
 * UI 自适应工具 - 基于屏幕尺寸独立计算最优 UI 参数
 */

const UI_DESIGN_WIDTH = 720
const UI_DESIGN_HEIGHT = 1280

let screenWidth = 0
let screenHeight = 0
let uiScale = 1

export function initUIParams(screenW: number, screenH: number): void {
  screenWidth = screenW
  screenHeight = screenH
  
  uiScale = Math.min(
    screenW / UI_DESIGN_WIDTH,
    screenH / UI_DESIGN_HEIGHT,
    1.2
  )
  
  applyGlobalFontSize()
  
  console.log('🎨 UI 参数初始化:', {
    screen: `${screenW} × ${screenH}`,
    uiScale: uiScale.toFixed(3)
  })
}

export function updateUIParams(screenW: number, screenH: number): void {
  initUIParams(screenW, screenH)
}

export function getFontSize(baseSize: number = 16): string {
  return `${baseSize * uiScale}px`
}

export function getPadding(basePadding: number = 16): string {
  return `${basePadding * uiScale}px`
}

export function getGap(baseGap: number = 12): string {
  return `${baseGap * uiScale}px`
}

export function getWidth(baseWidth: number): string {
  return `${baseWidth * uiScale}px`
}

export function getHeight(baseHeight: number): string {
  return `${baseHeight * uiScale}px`
}

export function getBorderRadius(baseRadius: number = 8): string {
  return `${baseRadius * uiScale}px`
}

export function getIconSize(baseIconSize: number = 24): string {
  return `${baseIconSize * uiScale}px`
}

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

function applyGlobalFontSize(): void {
  const root = document.documentElement
  const baseFontSize = 16
  root.style.fontSize = getFontSize(baseFontSize)
}

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
