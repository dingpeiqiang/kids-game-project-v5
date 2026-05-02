// ============================================
// dragonShooter 输入处理系统
// ============================================

import type { CustomRoute } from './types'
import type { RouteEditor as RouteEditorType } from './routes'
import type { GameState } from './types'
import {
  BASE_W, BASE_H, CANVAS_W, CANVAS_H, CANVAS_OFFSET_X, CANVAS_OFFSET_Y,
  STORAGE_KEY
} from './constants'

export interface InputCallbacks {
  onRouteEditorClear: () => void
  onRouteEditorSave: () => void
  onRouteEditorExport: () => void
  onRouteEditorReturn: () => void
  onStartChallenge: () => void
  onStartEndless: () => void
  onDrawRoute: () => void
  onPauseToggle: () => void
}

/**
 * 创建输入处理器
 */
export function createInputHandler(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  state: GameState,
  routeEditor: RouteEditorType,
  customRoutes: CustomRoute[],
  callbacks: InputCallbacks,
  isDrawingModeRef: { value: boolean }
) {

  // 坐标转换：画布坐标 → 游戏区域坐标
  function getPos(e: MouseEvent | Touch) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY
    return {
      x: canvasX - CANVAS_OFFSET_X,
      y: canvasY - CANVAS_OFFSET_Y
    }
  }

  // 原始画布坐标（路线编辑用）
  function getCanvasPos(e: MouseEvent | Touch) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height)
    }
  }

  // 触摸/点击按下
  function handleDown(x: number, y: number) {
    console.log('🖱️ handleDown:', { x: Math.round(x), y: Math.round(y), phase: state.phase })

    // 路线编辑模式
    if (state.phase === 'routeEdit') {
      handleRouteEditMode(x, y)
      return
    }

    if (state.phase === 'start') {
      handleStartScreen(x, y)
      return
    }

    if (state.phase === 'gameOver') return

    if (state.phase === 'playing' && state.isPaused) {
      state.isPaused = false
      return
    }

    if (state.phase === 'playing' && !state.isPaused) {
      if (x > BASE_W - 40 && y > 35 && y < 60) {
        callbacks.onPauseToggle()
        return
      }
      state.touch.active = true
      state.touch.startX = x
      state.touch.startY = y
      state.touch.currentX = x
      state.touch.startTime = Date.now()
    }
  }

  function handleRouteEditMode(x: number, y: number) {
    const btnY = CANVAS_H - 80
    const btnH = 50
    const btnW = 85
    const btnGap = 5
    const btnStartX = (CANVAS_W - (btnW * 4 + btnGap * 3)) / 2

    if (y >= btnY && y <= btnY + btnH) {
      if (x >= btnStartX && x < btnStartX + btnW) {
        callbacks.onRouteEditorClear()
        return
      }
      else if (x >= btnStartX + btnW + btnGap && x < btnStartX + (btnW + btnGap) * 2) {
        callbacks.onRouteEditorSave()
        return
      }
      else if (x >= btnStartX + (btnW + btnGap) * 2 && x < btnStartX + (btnW + btnGap) * 3) {
        callbacks.onRouteEditorExport()
        return
      }
      else if (x >= btnStartX + (btnW + btnGap) * 3 && x < btnStartX + (btnW + btnGap) * 4) {
        callbacks.onRouteEditorReturn()
        return
      }
    }

    routeEditor.startDrawing()
  }

  function handleStartScreen(x: number, y: number) {
    const btnY = BASE_H / 2 + 10
    const btnHeight = 30

    if (y > btnY - 10 && y < btnY + btnHeight && x > BASE_W / 2 - 150 && x < BASE_W / 2) {
      callbacks.onStartChallenge()
      return
    }

    if (y > btnY - 10 && y < btnY + btnHeight && x > BASE_W / 2 && x < BASE_W / 2 + 150) {
      callbacks.onStartEndless()
      return
    }

    if (y > BASE_H / 2 + 35 && y < BASE_H / 2 + 65) {
      callbacks.onDrawRoute()
      return
    }
  }

  // 移动
  function handleMove(x: number, y: number) {
    if (state.phase === 'routeEdit') {
      if (!isDrawingModeRef.value && state.touch.active) {
        routeEditor.startDrawing()
        routeEditor.addPoint(state.touch.startX, state.touch.startY)
      }
      if (isDrawingModeRef.value) {
        routeEditor.addPoint(x, y)
      }
      return
    }

    if (!state.touch.active) return
    state.touch.currentX = x
  }

  // 抬起
  function handleUp() {
    state.touch.active = false
    if (state.phase === 'routeEdit') {
      routeEditor.stopDrawing()
    }
  }

  // 绑定事件
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault()
    const useCanvas = state.phase === 'routeEdit'
    const pos = useCanvas ? getCanvasPos(e.touches[0]) : getPos(e.touches[0])
    handleDown(pos.x, pos.y)
  }, { passive: false })

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault()
    const useCanvas = state.phase === 'routeEdit'
    const pos = useCanvas ? getCanvasPos(e.touches[0]) : getPos(e.touches[0])
    handleMove(pos.x, pos.y)
  }, { passive: false })

  canvas.addEventListener('touchend', handleUp)

  canvas.addEventListener('mousedown', (e) => {
    const useCanvas = state.phase === 'routeEdit'
    const pos = useCanvas ? getCanvasPos(e) : getPos(e)
    handleDown(pos.x, pos.y)
  })

  canvas.addEventListener('mousemove', (e) => {
    const useCanvas = state.phase === 'routeEdit'
    const pos = useCanvas ? getCanvasPos(e) : getPos(e)
    handleMove(pos.x, pos.y)
  })

  canvas.addEventListener('mouseup', handleUp)
  canvas.addEventListener('mouseleave', handleUp)

  return { getPos, getCanvasPos, handleDown, handleMove, handleUp }
}
