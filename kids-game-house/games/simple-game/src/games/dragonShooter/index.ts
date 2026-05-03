// ============================================
// dragonShooter - 打龙小游戏（祖玛风格）
// 模块化版本 - 主入口
// ============================================

import type { GameEngine } from '../../services/gameEngine'
import { routeLoader } from './routeLoader'
import type { GameState, CustomRoute } from './types'
import { performanceMonitor } from './performance'

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
  checkLevelUp, startNextLevel,
  setGameOverCallback
} from './gameState'
import { createRenderer } from './renderer'
import { createInputHandler } from './input'
import { RouteEditor as RouteEditorImpl, addCustomRoute, clearCustomRoutes, loadCustomRoutes, customRoutes, getCustomRoutes, optimizeRoute } from './routes'

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
    // 🎯 全屏覆盖，无留白 - 使用 viewport 单位确保完全填满
    wrapper.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 1000;
      background: #000;
      overflow: hidden;
      touch-action: none;
      margin: 0;
      padding: 0;
    `
    
    // 🎯 关键修复：Canvas通过CSS缩放实现最大化显示（保持宽高比）
    canvas.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      max-width: 100vw;
      max-height: 100vh;
      width: auto;
      height: auto;
    `
    
    wrapper.appendChild(canvas)
    document.body.appendChild(wrapper)
    
    // 🎯 防止移动端滚动和缩放
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
  } else {
    canvas.style.cssText = `display: block; width: ${CANVAS_W}px; height: ${CANVAS_H}px;`
    container.appendChild(canvas)
  }

  const ctx = canvas.getContext('2d')!

  // 创建游戏状态
  const state = createInitialState()

  // 注册游戏结束回调（3秒后返回主界面）
  setGameOverCallback(() => {
    // 🎯 清理移动端样式
    if (isMobile) {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
      
      // 移除 wrapper
      const wrapper = document.getElementById('dragon-shooter-wrapper')
      if (wrapper) wrapper.remove()
    }
    onEnd()
  })

  // 路线编辑器实例（包装成 ref，输入处理器始终用最新的）
  const routeEditorRef = { current: new RouteEditorImpl(canvas, ctx) }

  // 创建渲染器
  const { render } = createRenderer(ctx, state, routeEditorRef.current)

  // 创建输入处理器
  const inputCallbacks = {
    onRouteEditorNew: () => {
      // 新建一条空路线并开始编辑
      routeEditorRef.current.newRoute()
      state.floatTexts.push({ 
        x: CANVAS_W / 2, 
        y: CANVAS_H / 2, 
        text: '➕ 已新建路线，请开始绘制', 
        color: '#9C27B0', 
        life: 1.5, 
        vy: -0.5, 
        size: 24 
      })
    },
    onRouteEditorClear: () => {
      routeEditorRef.current.clear()
      routeEditorRef.current.clearPlayerStartPoint()
      state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '🗑️ 已清除路线和玩家起点', color: '#FF6B6B', life: 1, vy: -0.5, size: 24 })
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
        // 路线编辑器存画布坐标，需要转换为游戏坐标（减去偏移量）
        const gameCoordsPoints = pts.map(p => ({
          x: p.x - CANVAS_OFFSET_X,
          y: p.y - CANVAS_OFFSET_Y
        }))
        const points = optimizeRoute(gameCoordsPoints)
        
        // 获取玩家初始位置（如果有）
        const playerStartGame = routeEditorRef.current.getPlayerStartGamePoint()
        
        addCustomRoute({
          id: `custom_${Date.now()}_${saved}`,
          name: `路线 ${customRoutes.length + 1}`,
          points,
          playerStartX: playerStartGame?.x,
          playerStartY: playerStartGame?.y
        })
        saved++
      }
      if (saved > 0) {
        const playerInfo = routeEditorRef.current.getPlayerStartGamePoint() 
          ? ` (玩家起点: ${routeEditorRef.current.getPlayerStartGamePoint()?.x.toFixed(0)}, ${routeEditorRef.current.getPlayerStartGamePoint()?.y.toFixed(0)})`
          : ''
        state.floatTexts.push({ 
          x: CANVAS_W / 2, 
          y: CANVAS_H / 2, 
          text: `✅ 已保存 ${saved} 条路线！${playerInfo}`, 
          color: '#4CAF50', 
          life: 2.5, 
          vy: -0.5, 
          size: 28 
        })
      } else {
        state.floatTexts.push({ 
          x: CANVAS_W / 2, 
          y: CANVAS_H / 2, 
          text: '⚠️ 每条路线至少3个点!', 
          color: '#FF6B6B', 
          life: 2, 
          vy: -0.5, 
          size: 24 
        })
      }
    },
    onRouteEditorOptimize: () => {
      const canvasPoints = routeEditorRef.current.getCurrentPoints()
      if (canvasPoints.length < 3) {
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '⚠️ 点太少，无法优化!', color: '#FF6B6B', life: 1.5, vy: -0.5, size: 24 })
        return
      }
      // optimizeRoute 接收画布坐标，优化后直接加载预览
      const optimized = optimizeRoute(canvasPoints)
      routeEditorRef.current.loadPreviewPoints(optimized)
      state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: `✨ ${canvasPoints.length}→${optimized.length}点 圆滑完成`, color: '#FF9800', life: 2, vy: -0.5, size: 22 })
    },
    onRouteEditorPreview: () => {
      // 切换预览状态
      routeEditorRef.current.showPreview = !routeEditorRef.current.showPreview
      const status = routeEditorRef.current.showPreview ? '已开启' : '已关闭'
      state.floatTexts.push({ 
        x: CANVAS_W / 2, 
        y: CANVAS_H / 2, 
        text: `👁️ 游戏预览 ${status}`, 
        color: '#00BCD4', 
        life: 1.5, 
        vy: -0.5, 
        size: 24 
      })
    },
    onSetPlayerStart: () => {
      // 切换设置玩家起点模式
      if (routeEditorRef.current.activeMode === 'playerStart') {
        routeEditorRef.current.exitPlayerStartMode()
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '❌ 已取消设置玩家起点', color: '#9E9E9E', life: 1.5, vy: -0.5, size: 24 })
      } else {
        routeEditorRef.current.startSettingPlayerStart()
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '🎯 点击画布设置玩家初始位置', color: '#00FF88', life: 2.5, vy: -0.5, size: 24 })
      }
    },
    onClearPlayerStart: () => {
      routeEditorRef.current.clearPlayerStartPoint()
      state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '🗑️ 已清除玩家起点', color: '#FF6B6B', life: 1.5, vy: -0.5, size: 24 })
    },
    onRouteEditorExport: () => {
      const allRoutes = routeEditorRef.current.getAllPoints()
      if (allRoutes.length === 0) {
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '⚠️ 没有路线可导出!', color: '#FF6B6B', life: 1.5, vy: -0.5, size: 24 })
        return
      }
      // 路线编辑器存画布坐标，导出时需要转换为游戏坐标
      const playerStartGame = routeEditorRef.current.getPlayerStartGamePoint()
      const routesData = allRoutes.map((pts, i) => ({
        id: `route_${Date.now()}_${i}`,
        name: `路线${i + 1}`,
        points: pts.map(p => ({
          x: p.x - CANVAS_OFFSET_X,
          y: p.y - CANVAS_OFFSET_Y
        })),
        playerStartX: playerStartGame?.x,
        playerStartY: playerStartGame?.y
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
      routeEditorRef.current.activeMode = null
    },
    onStartChallenge: () => {
      console.log('🎯 开始闯关模式')
      state.mode = 'challenge'
      state.phase = 'playing'
      state.level = 1
      state.score = 0
      state.coins = 0
      state.playerHP = state.playerMaxHP
      state.dragons = []
      state.bullets = []
      state.particles = []
      state.powerUps = []
      state.coinDrops = []
      state.floatTexts = []
      state.levelProgress = 0
      state.dragonsSpawnedInLevel = 0
      state.isPaused = false
      
      initClouds(state)
      
      // 初始化关卡：根据第1关的路线数量设置目标
      const routes = routeLoader.getRoutesForLevel(state.level)
      console.log('🛤️ 路线数据:', routes.length, routes.map(r => ({ name: r.name, points: r.points.length })))
      if (routes.length === 0) {
        console.error('❌ 警告：没有可用路线！使用备用路线')
        // 备用路线
        routes.push({
          id: 'fallback',
          name: '备用波浪路线',
          points: Array.from({ length: 100 }, (_, i) => ({
            x: 180 + Math.sin(i * 0.1) * 40,
            y: -50 + i * 7
          }))
        })
      }
      state.levelTarget = routes.length
      state.maxDragons = Math.max(1, routes.length)
      
      // 🎯 设置玩家初始位置（优先从自定义路线中读取）
      const customRoutesList = routeLoader.getCustomRoutes()
      let playerStartPosition: { x: number; y: number } | null = null
      
      // 1. 尝试从自定义路线中获取玩家起点
      if (customRoutesList.length > 0) {
        for (const route of customRoutesList) {
          if (route.playerStartX !== undefined && route.playerStartY !== undefined) {
            playerStartPosition = { x: route.playerStartX, y: route.playerStartY }
            console.log(`🎯 从自定义路线获取玩家起点: (${route.playerStartX}, ${route.playerStartY})`)
            break
          }
        }
      }
      
      // 2. 如果自定义路线中没有，尝试从关卡路线中获取
      if (!playerStartPosition) {
        const firstRoute = routes[0]
        if (firstRoute.playerStartX !== undefined && firstRoute.playerStartY !== undefined) {
          playerStartPosition = { x: firstRoute.playerStartX, y: firstRoute.playerStartY }
          console.log(`🎯 从关卡路线获取玩家起点: (${firstRoute.playerStartX}, ${firstRoute.playerStartY})`)
        }
      }
      
      // 3. 设置玩家位置
      if (playerStartPosition) {
        state.playerX = playerStartPosition.x
        state.playerY = playerStartPosition.y
        state.playerStartX = playerStartPosition.x
        state.playerStartY = playerStartPosition.y
        console.log(`✅ 玩家初始位置: (${playerStartPosition.x}, ${playerStartPosition.y})`)
      } else {
        // 默认位置（底部中央）
        state.playerX = BASE_W / 2
        state.playerY = BASE_H - 55
        state.playerStartX = BASE_W / 2
        state.playerStartY = BASE_H - 55
        console.log(`ℹ️ 使用默认玩家位置: (${BASE_W / 2}, ${BASE_H - 55})`)
      }
      
      console.log(`🎮 开始第${state.level}关, levelTarget=${state.levelTarget}, maxDragons=${state.maxDragons}`)
      console.log(`🎮 开始第${state.level}关，共${state.levelTarget}条路线, 路线数:`, routes.length)
      if (routes.length > 0) {
        console.log('🛤️ 路线信息:', routes[0].name, '点数:', routes[0].points.length)
      }
    },

    onDrawRoute: () => {
      console.log('✏️ onDrawRoute called, phase:', state.phase)
      // 首页：跳转到编辑页面
      if (state.phase === 'start') {
        state.phase = 'routeEdit'
        state.isRouteEditMode = true
        routeEditorRef.current.clear()
        return
      }
      // 编辑页：切换画路线模式
      if (routeEditorRef.current.activeMode === 'route') {
        routeEditorRef.current.activeMode = null
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '❌ 已退出画路线模式', color: '#9E9E9E', life: 1.5, vy: -0.5, size: 22 })
      } else {
        routeEditorRef.current.activeMode = 'route'
        state.floatTexts.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, text: '✏️ 点击画布绘制路线', color: '#E040FB', life: 2.5, vy: -0.5, size: 22 })
      }
    },
    onPauseToggle: () => togglePause(state),
    onNextLevel: () => startNextLevel(state)
  }

  createInputHandler(canvas, ctx, state, routeEditorRef, customRoutes, inputCallbacks)

  // ===== 游戏主循环 =====
  let lastTime = performance.now()

  function gameLoop(timestamp: number) {
    const dt = Math.min(0.033, (timestamp - lastTime) / 1000)
    lastTime = timestamp

    // 🎯 调试：监控 phase 变化
    if (state.phase === 'levelComplete' || state.phase === 'playing') {
      console.log(`🔄 gameLoop: phase=${state.phase}, isPaused=${state.isPaused}, levelTransition=${state.levelTransition}, dragons=${state.dragons.length}`)
    }

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

      // 玩家移动和射击角度控制
      if (state.touch.active) {
        const touchX = state.touch.currentX
        const touchY = state.touch.currentY  // 🎯 修复：使用当前Y坐标，实时跟随鼠标位置
        const isOnPlayer = (state.touch as any).isOnPlayer === true  // 是否选中玩家
        
        // 🎯 判断玩家是否在边框区域（可以移动）
        // 边框区域：底部（Y > BASE_H * 0.75）或顶部（Y < BASE_H * 0.25）
        // 中间区域：只能转动射击方向
        const isAtBorder = state.playerY > BASE_H * 0.75 || state.playerY < BASE_H * 0.25
        
        if (isAtBorder && isOnPlayer) {
          // === 边框模式 + 选中玩家：可以水平移动 ===
          state.canMove = true
          
          // 水平移动
          const diff = touchX - state.playerX
          const moveSpeed = Math.abs(diff) > 80 ? 0.35 : Math.abs(diff) > 40 ? 0.25 : 0.18
          state.playerX += diff * moveSpeed
          state.playerX = Math.max(30, Math.min(BASE_W - 30, state.playerX))
          
          // 上下移动（有限范围，保持在边框区域内）
          const diffY = touchY - state.playerY
          if (Math.abs(diffY) > 20) {  // 只有超过阈值才移动
            const moveSpeedY = Math.abs(diffY) > 50 ? 0.15 : 0.1
            state.playerY += diffY * moveSpeedY
            // 限制在边框区域内
            if (state.playerY > BASE_H * 0.75) {
              state.playerY = Math.max(BASE_H * 0.6, state.playerY)  // 底部限制
            } else if (state.playerY < BASE_H * 0.25) {
              state.playerY = Math.min(BASE_H * 0.35, state.playerY)  // 顶部限制
            }
            state.playerY = Math.max(30, Math.min(BASE_H - 30, state.playerY))
          }
          
          // 同时更新射击角度（跟随触摸方向）
          const dx = touchX - state.playerX
          const dy = touchY - state.playerY
          state.shootAngle = Math.atan2(dy, dx)
        } else {
          // === 中间模式 OR 未选中玩家：只调整射击方向 ===
          state.canMove = false
          
          // 只更新射击角度
          const dx = touchX - state.playerX
          const dy = touchY - state.playerY
          state.shootAngle = Math.atan2(dy, dx)
        }
      }

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
    }

    // ===== 关卡完成阶段（只更新浮动文字和粒子） =====
    if (state.phase === 'levelComplete') {
      updateFloatTexts(state, dt)
      updateParticles(state, dt)
    }

    // 🎯 关键修复：在任何阶段都更新关卡过渡计时器
    if (state.levelTransition && state.levelTransitionTimer > 0) {
      state.levelTransitionTimer -= dt
      if (state.levelTransitionTimer <= 0) {
        state.levelTransition = false
        state.levelTransitionTimer = 0
      }
    }

    // ===== 道具选择弹窗（全时更新） =====
    if ((state as any).phase === 'powerup_select' || state.powerupSelect) {
      updatePowerUpSelect(state, Math.min(dt, 0.05))
    }

    // 更新性能监控
    performanceMonitor.update({
      dragons: state.dragons.length,
      bullets: state.bullets.length,
      particles: state.particles.length,
      floatTexts: state.floatTexts.length,
      coinDrops: state.coinDrops.length
    })

    render()
    
    // 渲染性能监控覆盖层
    performanceMonitor.render()
    
    requestAnimationFrame(gameLoop)
  }

  // 启动游戏
  initClouds(state)
  loadCustomRoutes()
  
  // 🎯 关键修复：将 routes.ts 加载的自定义路线同步到 routeLoader
  const loadedRoutes = getCustomRoutes()
  if (loadedRoutes.length > 0) {
    console.log(`🔄 同步 ${loadedRoutes.length} 条自定义路线到 routeLoader...`)
    loadedRoutes.forEach((route: CustomRoute) => {
      routeLoader.addCustomRoute(route)
    })
    console.log(`✅ 已同步 ${loadedRoutes.length} 条自定义路线`)
  }
  
  console.log('🚀 启动 gameLoop, phase:', state.phase)
  requestAnimationFrame(gameLoop)
}
