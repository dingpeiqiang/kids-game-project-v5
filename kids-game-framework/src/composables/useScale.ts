/**
 * ⭐ UI 缩放桥接 — provide/inject 模式
 *
 * 问题：框架包（@kids-game/framework）不能用 @/ 别名导入游戏的 uiResponsive，
 *       但框架 UI 组件需要和游戏其他元素完全一致的缩放值。
 *
 * 方案：
 * 1. 游戏项目在 main.ts / App.vue 中调用 provideUIScale(app, scaleFns) 注册缩放函数
 * 2. 框架组件内部调用 useScale() 获取缩放函数
 * 3. 两者返回完全一致的值（因为用的是同一个 uiScale 变量）
 *
 * 使用示例（游戏项目 main.ts）：
 *   import { provideUIScale } from '@kids-game/framework'
 *   import { useResponsiveUI, initUIParams } from '@/utils/uiResponsive'
 *   const ui = useResponsiveUI()
 *   provideUIScale(app, {
 *     getFontSize:  ui.getFontSize.bind(ui),
 *     getPadding:   ui.getPadding.bind(ui),
 *     getGap:       ui.getGap.bind(ui),
 *     getWidth:     ui.getWidth.bind(ui),
 *     getHeight:    ui.getHeight.bind(ui),
 *     getBorderRadius: ui.getBorderRadius.bind(ui),
 *   })
 *
 * 使用示例（框架组件内）：
 *   const { getFontSize, getPadding } = useScale()
 *   const style = { fontSize: getFontSize(20), padding: getPadding(16) }
 */

import { inject } from 'vue'
import type { App } from 'vue'

/** 缩放函数集合（和 uiResponsive.ts 的 useResponsiveUI 返回值对齐） */
export interface ScaleFunctions {
  getFontSize: (baseSize: number) => string
  getPadding: (basePadding: number) => string
  getGap: (baseGap: number) => string
  getWidth: (baseWidth: number) => string
  getHeight: (baseHeight: number) => string
  getBorderRadius: (baseRadius: number) => string
  /** 原始 uiScale 数值 */
  uiScale: number
}

const SCALE_KEY = Symbol('kids-game-ui-scale')

/**
 * ⭐ 在应用根级别注册缩放函数（游戏项目 main.ts 调用）
 */
export function provideUIScale(app: App, scaleFns: ScaleFunctions): void {
  app.provide(SCALE_KEY, scaleFns)
}

/**
 * ⭐ 框架组件内获取缩放函数
 * 如果未注册，返回安全的 fallback（基于固定 uiScale = 1）
 */
export function useScale(): ScaleFunctions {
  const injected = inject<ScaleFunctions | null>(SCALE_KEY, null)

  if (injected) {
    return injected
  }

  // Fallback：未注册时使用原始值（无缩放）
  console.warn(
    '[kids-game/framework] provideUIScale() 未注册，UI 组件将使用原始尺寸。' +
    '请在 main.ts 中调用 provideUIScale(app, scaleFns) 注册缩放函数。'
  )
  return {
    getFontSize:     (n: number) => `${n}px`,
    getPadding:      (n: number) => `${n}px`,
    getGap:          (n: number) => `${n}px`,
    getWidth:        (n: number) => `${n}px`,
    getHeight:       (n: number) => `${n}px`,
    getBorderRadius: (n: number) => `${n}px`,
    uiScale: 1
  }
}
