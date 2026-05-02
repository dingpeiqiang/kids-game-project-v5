// ============================================
// dragonShooter - 打龙小游戏（祖玛风格）
// 模块化版本 - 主入口
// ============================================

import type { GameEngine } from '../../services/gameEngine'
import { routeLoader } from './routeLoader'
import type { GameState, CustomRoute } from './types'

// 常量
import {
  BASE_W, BASE_H, CANVAS_W, CANVAS_H, CANVAS_OFFSET_X, CANVAS_OFFSET_Y
} from './constants'

// 模块
import { createInitialState, initClouds, updateClouds } from './gameState'
import {
  spawnDragons, updateDragons, shoot, updateBullets,
  updatePowerUps, updateParticles, updateCoinDrops,
  updateFloatTexts, updateTimer, togglePause,
  loadCustomRoutes, saveCustomRoutes, checkLevelUp,
  setGameOverCallback
} from './gameState'
import { createRenderer } from './renderer'
import { createInputHandler } from './input'
import { RouteEditor as RouteEditorImpl } from './routes'

/**
 * 初始化打龙游戏主入口
 */
export async function initDragonShooter(engine: GameEngine, onEnd: () => void) {
  // 加载路线配置
  console.log('🔄 加载路线配置...')
  await routeLoader.loadRoutes()
  const stats = routeLoader.getStats()
  console.log(`✅ 路线加载完成: ${stats.levelCount} 个关卡, ${stats.customCount} 条自定义路线`)

  // 创建画布
  const container = document.getElementById('gameCanvas')!
  container.innerHTML = ''

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || (window.visualViewport ? window.visualViewport.width < 768 : window.innerWidth < 768)

  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H

  if (isMobile) {
    const wrapper = document.createElement('div')
    wrapper.id = 'dragon-shooter-wrapper'
    wrapper.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 100vw; height: 100vh; z-index: 1000;
      background: linear-gradient(to bottom, #87CEEB 0%, #E0F7FA 50%, #B2EBF2 100%);
      overflow: hidden;
    `
    canvas.style.cssText = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; object-fit: contain;`
    wrapper.appendChild(canvas)
    document.body.appendChild(wrapper)
  } else {
    canvas.style.cssText = `display: block; width: ${CANVAS_W}px; height: ${CANVAS_H}px;`
    container.appendChild(canvas)
  }

  const ctx = canvas.getContext('2d')!

  // 创建游戏状态
  const state = createInitialState()

  // 注册游戏结束回调（3秒后返回主界面）
  setGameOverCallback(() => {
    onEnd()
  })

  // 自定义路线存储
  const customRoutes: CustomRoute[] = []
  let isDrawingMode = false

  // 路线编辑器实例
  let routeEditor = new RouteEditorImpl(canvas, ctx)

  function initRouteEditor() {
    routeEditor = new RouteEditorImpl(canvas, ctx)
  }

  // 创建渲染器
  const { render } = createRenderer(ctx, state, routeEditor, customRoutes)

  // 创建输入处理器
  const inputCallbacks = {
    onRouteEditorClear: () => {
      routeEditor.clear()
      state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '🗑️ 已清除', color: '#FF6B6B', life: 1, vy: -0.5, size: 24 })
    },
    onRouteEditorSave: () => {
      const canvasPoints = routeEditor.getCurrentPoints()
      if (canvasPoints.length >= 3) {
        const points = canvasPoints.map((p: any) => ({
          x: p.x - CANVAS_OFFSET_X,
          y: p.y - CANVAS_OFFSET_Y
        }))
        customRoutes.push({
          id: `custom_${Date.now()}`,
          name: `自定义路线 ${customRoutes.length + 1}`,
          points
        })
        saveCustomRoutes(customRoutes)
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '✅ 路线已保存!', color: '#4CAF50', life: 2, vy: -0.5, size: 28 })
      } else {
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '⚠️ 需要至少3个点!', color: '#FF6B6B', life: 2, vy: -0.5, size: 24 })
      }
    },
    onRouteEditorExport: () => {
      const canvasPoints = routeEditor.getCurrentPoints()
      if (canvasPoints.length < 3) {
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '⚠️ 请先绘制路线!', color: '#FF6B6B', life: 1.5, vy: -0.5, size: 24 })
        return
      }
      const points = canvasPoints.map((p: any) => ({ x: p.x - CANVAS_OFFSET_X, y: p.y - CANVAS_OFFSET_Y }))
      const jsonData = { version: '1.0', lastModified: new Date().toISOString(), route: { id: `route_${Date.now()}`, points } }
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `route_${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '✅ JSON 已导出!', color: '#4CAF50', life: 2, vy: -0.5, size: 28 })
    },
    onRouteEditorReturn: () => {
      state.phase = 'start'
      state.isRouteEditMode = false
    },
    onStartChallenge: () => {
      state.mode = 'challenge'
      state.phase = 'playing'
      initClouds(state)
      initRouteEditor()
    },
    onStartEndless: () => {
      state.mode = 'endless'
      state.timeLeft = 99999
      state.phase = 'playing'
      initClouds(state)
      initRouteEditor()
    },
    onDrawRoute: () => {
      state.phase = 'routeEdit'
      state.isRouteEditMode = true
      initRouteEditor()
    },
    onPauseToggle: () => togglePause(state)
  }

  createInputHandler(canvas, ctx, state, routeEditor, customRoutes, inputCallbacks, { value: isDrawingMode })

  // ===== 游戏主循环 =====
  let lastTime = performance.now()

  function gameLoop(timestamp: number) {
    const dt = Math.min(0.033, (timestamp - lastTime) / 1000)
    lastTime = timestamp

    if (state.phase === 'playing' && !state.isPaused) {
      // 计时器更新
      if (state.invincibleTimer > 0) state.invincibleTimer -= dt
      if (state.comboTimer > 0) {
        state.comboTimer -= dt
        if (state.comboTimer <= 0) state.combo = 0
      }

      // 玩家移动
      if (state.touch.active) {
        const diff = state.touch.currentX - state.playerX
        const moveSpeed = Math.abs(diff) > 80 ? 0.35 : Math.abs(diff) > 40 ? 0.25 : 0.18
        state.playerX += diff * moveSpeed
      }
      state.playerX = Math.max(30, Math.min(BASE_W - 30, state.playerX))

      // 游戏逻辑更新
      spawnDragons(state)
      updateDragons(state, dt)
      shoot(state)
      updateBullets(state, dt)
      updatePowerUps(state, dt)
      updateParticles(state, dt)
      updateCoinDrops(state, dt)
      updateFloatTexts(state, dt)
      updateClouds(state)
      updateTimer(state, dt)
      
      // 关卡检查
      checkLevelUp(state)
    }

    render()
    requestAnimationFrame(gameLoop)
  }

  // 启动游戏
  initClouds(state)
  loadCustomRoutes(customRoutes)
  console.log('🚀 启动 gameLoop, phase:', state.phase)
  requestAnimationFrame(gameLoop)
}
