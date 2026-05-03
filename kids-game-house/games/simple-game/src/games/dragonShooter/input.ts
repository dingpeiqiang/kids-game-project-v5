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
import { audioService } from '../../services/audio'

export interface InputCallbacks {
  onRouteEditorClear: () => void
  onRouteEditorSave: () => void
  onRouteEditorExport: () => void
  onRouteEditorReturn: () => void
  onRouteEditorNew?: () => void  // 可选：新建路线
  onRouteEditorOptimize?: () => void  // 可选：优化路线
  onRouteEditorPreview?: () => void  // 可选：预览游戏效果
  onSetPlayerStart?: () => void  // 可选：设置玩家起点
  onClearPlayerStart?: () => void  // 可选：清除玩家起点
  onStartChallenge: () => void
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
  routeEditorRef: { current: RouteEditorType },
  customRoutes: CustomRoute[],
  callbacks: InputCallbacks
) {
  // 缓存画布尺寸，避免重复获取
  let cachedRect: DOMRect | null = null
  let lastResizeTime = 0
  
  // 获取画布矩形信息（带缓存）
  function getCanvasRect(): DOMRect {
    const now = Date.now()
    // 每100ms更新一次缓存，或者在resize时更新
    if (!cachedRect || now - lastResizeTime > 100) {
      cachedRect = canvas.getBoundingClientRect()
      lastResizeTime = now
    }
    return cachedRect
  }

  // 坐标转换：画布坐标 → 游戏区域坐标
  function getPos(e: MouseEvent | Touch) {
    const rect = getCanvasRect()
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
    const rect = getCanvasRect()
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height)
    }
  }

  // 触摸/点击按下（统一使用游戏坐标，与渲染坐标一致）
  function handleDown(x: number, y: number) {
    console.log('🖱️ handleDown:', { x: Math.round(x), y: Math.round(y), phase: state.phase })

    // 路线编辑模式
    if (state.phase === 'routeEdit') {
      // x,y 已经是画布坐标（直接来自 getCanvasPos）
      const btnClicked = handleRouteEditMode(x, y)

      // 点击了按钮区域，直接返回
      if (btnClicked) return

      // 整个画布任意位置都可以开始绘制
      routeEditorRef.current.newRoute()
      routeEditorRef.current.addPoint(x, y)
      state.touch.active = true
      state.touch.startX = x
      state.touch.startY = y
      state.touch.currentX = x
      state.touch.currentY = y  // 🎯 新增：初始化当前Y坐标
      return
    }

    if (state.phase === 'start') {
      handleStartScreen(x, y)
      return
    }

    if (state.phase === 'gameOver') return

    // 道具选择弹窗：检测点击了哪张卡（game 坐标，与渲染器一致）
    if (state.phase === 'powerup_select' && state.powerupSelect) {
      const ps = state.powerupSelect
      if (ps.revealedIdx === null && !ps.closing) {
        const cardW = 90, cardH = 120, cardGap = 20
        const totalW = cardW * 3 + cardGap * 2
        const startX = (BASE_W - totalW) / 2
        const cardY = BASE_H / 2 - cardH / 2

        if (y >= cardY && y <= cardY + cardH) {
          if (x >= startX && x <= startX + cardW) {
            ps.revealedIdx = 0; audioService.click()
          } else if (x >= startX + cardW + cardGap && x <= startX + cardW * 2 + cardGap) {
            ps.revealedIdx = 1; audioService.click()
          } else if (x >= startX + (cardW + cardGap) * 2 && x <= startX + totalW) {
            ps.revealedIdx = 2; audioService.click()
          }
        }
      }
      return
    }

    if (state.phase === 'playing' && state.isPaused) {
      state.isPaused = false
      return
    }

    if (state.phase === 'playing' && !state.isPaused) {
      // 检查是否点击了位置切换按钮
      const btnX = BASE_W - 50
      const btnY = 65
      const btnSize = 30
      if (x >= btnX - btnSize/2 && x <= btnX + btnSize/2 && 
          y >= btnY - btnSize/2 && y <= btnY + btnSize/2) {
        // 切换玩家位置：底部 <-> 中间
        if (state.playerY > BASE_H * 0.7) {
          // 从底部切换到中间
          state.playerY = BASE_H / 2
          state.shootAngle = -Math.PI / 2  // 重置为向上
          console.log('🎯 切换到中间模式（只能调整射击方向）')
        } else {
          // 从中间切换到底部
          state.playerY = BASE_H - 55
          state.shootAngle = -Math.PI / 2  // 重置为向上
          console.log('🏃 切换到底部模式（可以移动+射击）')
        }
        audioService.click()
        return
      }
      
      if (x > BASE_W - 40 && y > 35 && y < 60) {
        callbacks.onPauseToggle()
        return
      }
      
      // 判断触摸点是否在玩家身上（玩家半径约30px）
      const playerRadius = 30
      const distToPlayer = Math.sqrt(
        Math.pow(x - state.playerX, 2) +
        Math.pow(y - state.playerY, 2)
      )

      // 点击玩家本体：切换选中态
      if (distToPlayer <= playerRadius + 5) {
        state.isSelected = !state.isSelected
        state.canMove = state.isSelected
        audioService.click()
        console.log(state.isSelected ? '✅ 玩家已选中（可移动）' : '❌ 玩家未选中（只能调整射击方向）')
        return
      }

      state.touch.active = true
      state.touch.startX = x
      state.touch.startY = y
      state.touch.currentX = x
      state.touch.currentY = y  // 🎯 新增：初始化当前Y坐标
      state.touch.startTime = Date.now()

      // 标记是否选中玩家（用于后续移动逻辑）
      ;(state.touch as any).isOnPlayer = distToPlayer <= playerRadius

      // 未选中时禁止移动（只能调射击方向）
      if (!state.isSelected) {
        state.canMove = false
      } else {
        state.canMove = true
      }
    }
  }

  function handleRouteEditMode(x: number, y: number): boolean {
    const btnY = CANVAS_H - 80
    const btnH = 50
    const btnW = 58
    const btnGap = 3
    // 8个按钮：新建 清除 保存 优化 预览 玩家起点 导出 返回
    const totalBtns = 8
    const btnStartX = (CANVAS_W - (btnW * totalBtns + btnGap * (totalBtns - 1))) / 2

    // 点击按钮区域：阻止后续 active 设置，清除按钮状态
    if (y >= btnY && y <= btnY + btnH) {
      state.touch.active = false
      if (x >= btnStartX && x < btnStartX + btnW) {
        callbacks.onRouteEditorNew?.()
        return true
      }
      if (x >= btnStartX + btnW + btnGap && x < btnStartX + (btnW + btnGap) * 2) {
        callbacks.onRouteEditorClear?.()
        return true
      }
      if (x >= btnStartX + (btnW + btnGap) * 2 && x < btnStartX + (btnW + btnGap) * 3) {
        callbacks.onRouteEditorSave?.()
        return true
      }
      if (x >= btnStartX + (btnW + btnGap) * 3 && x < btnStartX + (btnW + btnGap) * 4) {
        callbacks.onRouteEditorOptimize?.()
        return true
      }
      if (x >= btnStartX + (btnW + btnGap) * 4 && x < btnStartX + (btnW + btnGap) * 5) {
        callbacks.onRouteEditorPreview?.()
        return true
      }
      if (x >= btnStartX + (btnW + btnGap) * 5 && x < btnStartX + (btnW + btnGap) * 6) {
        callbacks.onSetPlayerStart?.()
        return true
      }
      if (x >= btnStartX + (btnW + btnGap) * 6 && x < btnStartX + (btnW + btnGap) * 7) {
        callbacks.onRouteEditorExport?.()
        return true
      }
      if (x >= btnStartX + (btnW + btnGap) * 7 && x < btnStartX + (btnW + btnGap) * 8) {
        callbacks.onRouteEditorReturn?.()
        return true
      }
    }

    // 如果正在设置玩家起点，且点击在游戏区域内
    if (routeEditorRef.current.isSettingPlayerStart) {
      // 点击在游戏区域
      if (x >= CANVAS_OFFSET_X && x <= CANVAS_OFFSET_X + BASE_W &&
          y >= CANVAS_OFFSET_Y && y <= CANVAS_OFFSET_Y + BASE_H) {
        routeEditorRef.current.setPlayerStartPoint(x, y)
        state.touch.active = false
        return true
      }
    }

    return false
  }

  function handleStartScreen(x: number, y: number) {
    // 防御：callbacks 为空时直接返回
    if (!callbacks) return

    const btnY = BASE_H / 2 + 10
    const btnHeight = 30

    if (y > btnY - 10 && y < btnY + btnHeight && x > BASE_W / 2 - 150 && x < BASE_W / 2 + 150) {
      callbacks.onStartChallenge?.()
      return
    }

    if (y > BASE_H / 2 + 35 && y < BASE_H / 2 + 65) {
      callbacks.onDrawRoute?.()
      return
    }
  }

  // 移动
  function handleMove(x: number, y: number) {
    if (state.phase === 'routeEdit') {
      if (state.touch.active) {
        routeEditorRef.current.addPoint(x, y)
      }
      return
    }

    if (!state.touch.active) return
    state.touch.currentX = x
    state.touch.currentY = y  // 🎯 新增：实时更新当前Y坐标
  }

  // 抬起
  function handleUp() {
    state.touch.active = false
    if (state.phase === 'routeEdit') {
      routeEditorRef.current.stopDrawing()
    }
  }

  // 绑定事件
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault()
    const pos = state.phase === 'routeEdit' ? getCanvasPos(e.touches[0]) : getPos(e.touches[0])
    handleDown(pos.x, pos.y)
  }, { passive: false })

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault()
    const pos = state.phase === 'routeEdit' ? getCanvasPos(e.touches[0]) : getPos(e.touches[0])
    handleMove(pos.x, pos.y)
  }, { passive: false })

  canvas.addEventListener('touchend', handleUp)

  canvas.addEventListener('mousedown', (e) => {
    // 路线编辑模式用画布坐标（任意位置绘制），其他模式用游戏坐标
    const pos = state.phase === 'routeEdit' ? getCanvasPos(e) : getPos(e)
    handleDown(pos.x, pos.y)
  })

  canvas.addEventListener('mousemove', (e) => {
    const pos = state.phase === 'routeEdit' ? getCanvasPos(e) : getPos(e)
    handleMove(pos.x, pos.y)
  })

  canvas.addEventListener('mouseup', handleUp)
  canvas.addEventListener('mouseleave', handleUp)

  // 监听窗口大小变化，更新缓存
  const handleResize = () => {
    cachedRect = null
    lastResizeTime = Date.now()
  }
  window.addEventListener('resize', handleResize)

  return { getPos, getCanvasPos, handleDown, handleMove, handleUp }
}
