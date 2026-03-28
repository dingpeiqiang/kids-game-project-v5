/**
 * UI 自适应工具 - 基于屏幕尺寸独立计算最优 UI 参数
 *
 * ✅ 响应式方案：uiScale 使用 Vue ref，所有依赖它的 computed 会在 resize 后自动更新。
 * ✅ 全局单例：模块级 ref，所有组件共享同一份响应式状态。
 * ✅ 统一 resize 监听：useResponsiveUI() 首次调用时注册 window.resize 监听，无需在每个视图手动处理。
 */

import { ref, computed, onUnmounted } from 'vue'

// ── 设计基准 ──────────────────────────────────────────────────────────────────
const UI_DESIGN_WIDTH  = 720   // 设计稿宽度（px）
const UI_DESIGN_HEIGHT = 1280  // 设计稿高度（px）

// ── 全局响应式状态（模块级单例，所有组件共享） ────────────────────────────────
const _screenW = ref(typeof window !== 'undefined' ? window.innerWidth  : UI_DESIGN_WIDTH)
const _screenH = ref(typeof window !== 'undefined' ? window.innerHeight : UI_DESIGN_HEIGHT)

/** 当前 UI 缩放比（响应式），其他 computed 依赖此值即可自动更新 */
export const uiScaleRef = computed(() => {
  const raw = Math.min(_screenW.value / UI_DESIGN_WIDTH, _screenH.value / UI_DESIGN_HEIGHT)
  return Math.max(0.65, Math.min(raw, 1.5))
})

// ── 全局 resize 监听（只注册一次） ───────────────────────────────────────────
let _resizeRegistered = false

function _ensureResizeListener() {
  if (_resizeRegistered || typeof window === 'undefined') return
  _resizeRegistered = true
  window.addEventListener('resize', _handleResize, { passive: true })
}

function _handleResize() {
  _screenW.value = window.innerWidth
  _screenH.value = window.innerHeight
  _applyGlobalFontSize()
  console.log('🔄 屏幕 resize:', `${_screenW.value} × ${_screenH.value}`, '→ uiScale:', uiScaleRef.value.toFixed(3))
}

// ── 全局字体大小同步 ──────────────────────────────────────────────────────────
function _applyGlobalFontSize() {
  if (typeof document === 'undefined') return
  document.documentElement.style.fontSize = `${16 * uiScaleRef.value}px`
}

// ── 公开初始化函数（兼容旧调用，仍可手动触发） ───────────────────────────────
/**
 * 初始化 / 手动刷新 UI 参数。
 * 直接调用即可，内部自动更新响应式 ref，所有依赖 computed 会重新计算。
 */
export function initUIParams(screenW?: number, screenH?: number): void {
  if (screenW !== undefined) _screenW.value = screenW
  if (screenH !== undefined) _screenH.value = screenH
  _applyGlobalFontSize()
  _ensureResizeListener()
  console.log('🎨 UI 参数初始化:', {
    screen: `${_screenW.value} × ${_screenH.value}`,
    uiScale: uiScaleRef.value.toFixed(3)
  })
}

/** @deprecated 同 initUIParams，保留兼容 */
export function updateUIParams(screenW: number, screenH: number): void {
  initUIParams(screenW, screenH)
}

// ── 纯函数工具（基于当前 uiScale 计算，供模板外调用） ─────────────────────────
// 注意：在 Vue computed 内部调用这些函数时，因为它们读取了 uiScaleRef.value，
// computed 会自动建立响应式依赖，resize 后自动重新计算。

export function getFontSize(base = 16)      : string { return `${base * uiScaleRef.value}px` }
export function getPadding(base = 16)       : string { return `${base * uiScaleRef.value}px` }
export function getGap(base = 12)           : string { return `${base * uiScaleRef.value}px` }
export function getWidth(base: number)      : string { return `${base * uiScaleRef.value}px` }
export function getHeight(base: number)     : string { return `${base * uiScaleRef.value}px` }
export function getBorderRadius(base = 8)   : string { return `${base * uiScaleRef.value}px` }
export function getIconSize(base = 24)      : string { return `${base * uiScaleRef.value}px` }

export function getButtonStyle(minW = 120, minH = 44) {
  return {
    fontSize      : getFontSize(16),
    paddingLeft   : getPadding(24),
    paddingRight  : getPadding(24),
    paddingTop    : getPadding(12),
    paddingBottom : getPadding(12),
    minWidth      : getWidth(minW),
    minHeight     : getHeight(minH),
  }
}

// ── Vue Composable ────────────────────────────────────────────────────────────
/**
 * useResponsiveUI()
 *
 * 使用方法：
 * ```ts
 * const ui = useResponsiveUI()
 *
 * // 在 computed 内读取，resize 后自动重算：
 * const titleStyle = computed(() => ({ fontSize: ui.getFontSize(48) }))
 *
 * // 直接读取当前缩放比：
 * console.log(ui.uiScale.value)
 * ```
 */
export function useResponsiveUI() {
  // 确保全局 resize 监听已注册
  _ensureResizeListener()

  return {
    /** 响应式 uiScale（computed ref），可在模板/computed 中直接使用 */
    uiScale       : uiScaleRef,
    screenWidth   : _screenW,
    screenHeight  : _screenH,

    // 工具函数（在 computed 内调用会自动建立响应式依赖）
    getFontSize,
    getPadding,
    getGap,
    getWidth,
    getHeight,
    getBorderRadius,
    getIconSize,
    getButtonStyle,

    // 兼容旧式 class helpers
    getFontClass    : (base: number) => ({ fontSize: getFontSize(base) }),
    getPaddingClass : (base: number) => ({
      paddingTop    : getPadding(base),
      paddingRight  : getPadding(base),
      paddingBottom : getPadding(base),
      paddingLeft   : getPadding(base),
    }),
  }
}
