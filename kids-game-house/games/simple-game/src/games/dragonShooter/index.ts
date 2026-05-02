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
import { createInitialState, initClouds, updateClouds, updatePowerUpSelect, updateActiveBuffs } from './gameState'
import {
  spawnDragons, updateDragons, shoot, updateBullets,
  updatePowerUps, updateParticles, updateCoinDrops,
  updateFloatTexts, updateTimer, togglePause,
  checkLevelUp,
  setGameOverCallback
} from './gameState'
import { createRenderer } from './renderer'
import { createInputHandler } from './input'
import { RouteEditor as RouteEditorImpl, addCustomRoute, clearCustomRoutes, loadCustomRoutes, customRoutes, optimizeRoute } from './routes'

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

  // 路线编辑器实例（包装成 ref，输入处理器始终用最新的）
  const routeEditorRef = { current: new RouteEditorImpl(canvas, ctx) }

  // 创建渲染器
  const { render } = createRenderer(ctx, state, routeEditorRef.current)

  // 创建输入处理器
  const inputCallbacks = {
    onRouteEditorNew: () => {
      // 已有路线时：清空当前路线重新画；没有路线时：新建
      const count = routeEditorRef.current.getRouteCount()
      if (count === 0) routeEditorRef.current.newRoute()
      else routeEditorRef.current.startDrawing()
    },
    onRouteEditorClear: () => {
      routeEditorRef.current.clear()
      state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '🗑️ 已清除', color: '#FF6B6B', life: 1, vy: -0.5, size: 24 })
    },
    onRouteEditorSave: () => {
      const allRoutes = routeEditorRef.current.getAllPoints()
      if (allRoutes.length === 0) {
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '⚠️ 没有路线可保存!', color: '#FF6B6B', life: 1.5, vy: -0.5, size: 24 })
        return
      }
      let saved = 0
      for (const pts of allRoutes) {
        if (pts.length < 3) continue
        const points = optimizeRoute(pts.map((p: any) => ({
          x: p.x - CANVAS_OFFSET_X,
          y: p.y - CANVAS_OFFSET_Y
        })))
        addCustomRoute({
          id: `custom_${Date.now()}_${saved}`,
          name: `路线 ${customRoutes.length + 1}`,
          points
        })
        saved++
      }
      if (saved > 0) {
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: `✅ 已保存 ${saved} 条路线!`, color: '#4CAF50', life: 2, vy: -0.5, size: 28 })
      } else {
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '⚠️ 每条路线至少3个点!', color: '#FF6B6B', life: 2, vy: -0.5, size: 24 })
      }
    },
    onRouteEditorOptimize: () => {
      const canvasPoints = routeEditorRef.current.getCurrentPoints()
      if (canvasPoints.length < 3) {
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '⚠️ 点太少，无法优化!', color: '#FF6B6B', life: 1.5, vy: -0.5, size: 24 })
        return
      }
      const rawPoints = canvasPoints.map((p: any) => ({
        x: p.x - CANVAS_OFFSET_X,
        y: p.y - CANVAS_OFFSET_Y
      }))
      const optimized = optimizeRoute(rawPoints)
      routeEditorRef.current.loadPreviewPoints(optimized.map(p => ({ x: p.x + CANVAS_OFFSET_X, y: p.y + CANVAS_OFFSET_Y })))
      state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: `✨ ${canvasPoints.length}→${optimized.length}点 圆滑完成`, color: '#FF9800', life: 2, vy: -0.5, size: 22 })
    },
    onRouteEditorExport: () => {
      const allRoutes = routeEditorRef.current.getAllPoints()
      if (allRoutes.length === 0) {
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '⚠️ 没有路线可导出!', color: '#FF6B6B', life: 1.5, vy: -0.5, size: 24 })
        return
      }
      const routesData = allRoutes.map((pts, i) => ({
        id: `route_${Date.now()}_${i}`,
        name: `路线${i + 1}`,
        points: pts.map((p: any) => ({ x: p.x - CANVAS_OFFSET_X, y: p.y - CANVAS_OFFSET_Y }))
      })).filter(r => r.points.length >= 3)
      if (routesData.length === 0) {
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '⚠️ 每条路线至少3个点!', color: '#FF6B6B', life: 1.5, vy: -0.5, size: 24 })
        return
      }
      const jsonData = { version: '1.0', lastModified: new Date().toISOString(), routes: routesData }
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `routes_${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: `✅ 已导出 ${routesData.length} 条路线!`, color: '#4CAF50', life: 2, vy: -0.5, size: 28 })
    },
    onRouteEditorReturn: () => {
      state.phase = 'start'
      state.isRouteEditMode = false
    },
    onStartChallenge: () => {
      state.mode = 'challenge'
      state.phase = 'playing'
      initClouds(state)
    },
    onStartEndless: () => {
      state.mode = 'endless'
      state.timeLeft = 99999
      state.phase = 'playing'
      initClouds(state)
    },
    onDrawRoute: () => {
      state.phase = 'routeEdit'
      state.isRouteEditMode = true
      routeEditorRef.current.clear()
    },
    onPauseToggle: () => togglePause(state)
  }

  createInputHandler(canvas, ctx, state, routeEditorRef, customRoutes, inputCallbacks)

  // ===== 游戏主循环 =====
  let lastTime = performance.now()

  function gameLoop(timestamp: number) {
    const dt = Math.min(0.033, (timestamp - lastTime) / 1000)
    lastTime = timestamp

    if (state.phase === 'playing' && !state.isPaused) {
      // 计时器更新
      if (state.invincibleTimer > 0) state.invincibleTimer -= dt
      if (state.freezeTimer > 0)    state.freezeTimer    -= dt
      if (state.shieldTimer > 0)    state.shieldTimer    -= dt
      if (state.slowAllTimer > 0)   state.slowAllTimer   -= dt
      if (state.bigShotTimer > 0)   state.bigShotTimer   -= dt
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
      updateActiveBuffs(state, dt)
      updateParticles(state, dt)
      updateCoinDrops(state, dt)
      updateFloatTexts(state, dt)
      updateClouds(state)
      updateTimer(state, dt)

      // 关卡检查
      checkLevelUp(state)

      // 关卡过渡动画
      if (state.levelTransition) {
        state.levelTransitionTimer -= dt
        if (state.levelTransitionTimer <= 0) {
          state.levelTransition = false
          state.isPaused = false
          state.floatTexts.push({
            x: BASE_W / 2, y: BASE_H / 2,
            text: `🎉 第${state.level}关!`,
            color: '#FFD700', life: 2, vy: -0.5, size: 28
          })
        }
      }
    }

    // ===== 道具选择弹窗（全时更新） =====
    if ((state as any).phase === 'powerup_select' || state.powerupSelect) {
      updatePowerUpSelect(state, Math.min(dt, 0.05))
    }

    render()
    requestAnimationFrame(gameLoop)
  }

  // 启动游戏
  initClouds(state)
  loadCustomRoutes()
  console.log('🚀 启动 gameLoop, phase:', state.phase)
  requestAnimationFrame(gameLoop)
}
