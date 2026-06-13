/**
 * 切饼干游戏 - 主入口
 * 
 * 模块化架构：
 * - types.ts: 类型定义
 * - config.ts: 游戏配置
 * - levels.ts: 关卡配置
 * - cookie.ts: 饼干逻辑
 * - particles.ts: 粒子效果
 * - renderer.ts: 渲染逻辑
 * - input.ts: 输入处理
 * - gameState.ts: 游戏状态管理
 */

import type { GameEngine } from '../../services/gameEngine'
import { spawnCookie, updateCookies, checkSlice } from './cookie'
import { createCookieParticles, updateParticles } from './particles'
import { drawBackground, drawSlices, drawCookies, drawParticles, drawUI, drawShockwaves, drawScorePopups, drawLevelTransition } from './renderer'
import { setupInputListeners, InputState } from './input'
import { createInitialState, GameState, updateHTMLPowerupBar, handleCookieSlice } from './gameState'
import { getLevelConfig, LEVELS } from './levels'
import type { Slice, LevelConfig } from './types'

export function initCookieCut(engine: GameEngine, onEnd: () => void, startLevel: number = 1) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  // 获取关卡配置
  let currentLevel = Math.max(1, Math.min(startLevel, LEVELS.length))
  let levelConfig = getLevelConfig(currentLevel)
  
  console.log(`[关卡系统] 开始第 ${currentLevel} 关: ${levelConfig.name}`)

  // 游戏状态
  const state = createInitialState()
  const inputState: InputState = {
    isSlicing: false,
    lastX: 0,
    lastY: 0
  }

  // 初始化道具栏
  updateHTMLPowerupBar(state.inventory)

  const unbindInput = setupInputListeners(canvas, inputState, (x1, y1, x2, y2) => {
    // 添加切割轨迹
    state.slices.push({ x1, y1, x2, y2, life: 1 })
    
    // 检查切割碰撞
    checkSlice(state.cookies, x1, y1, x2, y2, (cookie, combo) => {
      handleCookieSlice(engine, state, cookie.x, cookie.y, createCookieParticles)
    })
  })

  // 游戏主循环
  function loop() {
    if (!document.getElementById('mainGameCanvas')) {
      unbindInput()
      return
    }
    
    // 更新过渡动画
    if (state.transition.active) {
      updateTransition()
    }
    
    // 检查游戏结束
    const isTimeUp = Date.now() - state.gameStartTime > levelConfig.duration
    
    if (!state.gameEnded && !isTimeUp && !state.transition.active) {
      // 更新逻辑
      update()
    }
    
    // 渲染
    draw()
    
    // 检查游戏结束处理（只有在没有过渡动画时）
    if (isTimeUp && !state.gameEnded && !state.transition.active) {
      state.gameEnded = true
      
      const score = engine.getScore()
      if (score >= levelConfig.targetScore && currentLevel < LEVELS.length) {
        // 通关，开始过渡动画
        startLevelTransition(currentLevel + 1)
      } else {
        setTimeout(() => {
          engine.endGame()
          onEnd()
        }, 1000)
        return
      }
    }
    
    requestAnimationFrame(loop)
  }
  
  // 开始关卡过渡动画
  function startLevelTransition(nextLevelNum: number) {
    const nextConfig = getLevelConfig(nextLevelNum)
    state.transition = {
      active: true,
      level: nextLevelNum,
      name: nextConfig.name,
      progress: 0,
      direction: 'out'
    }
    audioService.levelUp()
  }
  
  // 更新过渡动画
  function updateTransition() {
    const speed = 0.025
    
    if (state.transition.direction === 'out') {
      state.transition.progress += speed
      if (state.transition.progress >= 1) {
        state.transition.progress = 1
        state.transition.direction = 'show'
        // 切换到下一关
        switchToNextLevel()
      }
    } else if (state.transition.direction === 'show') {
      state.transition.progress += speed
      if (state.transition.progress >= 2) {
        state.transition.direction = 'in'
      }
    } else if (state.transition.direction === 'in') {
      state.transition.progress -= speed
      if (state.transition.progress <= 0) {
        state.transition.progress = 0
        state.transition.active = false
      }
    }
  }
  
  // 切换到下一关（在过渡动画中间）
  function switchToNextLevel() {
    currentLevel = state.transition.level
    levelConfig = getLevelConfig(currentLevel)
    state.gameStartTime = Date.now()
    state.gameEnded = false
    state.cookies = []
    state.combo = 0
    state.particles = []
    state.shockwaves = []
    state.scorePopups = []
    
    console.log(`[关卡系统] 进入第 ${currentLevel} 关: ${levelConfig.name}`)
  }
  
  // 进入下一关（备用方法）
  function nextLevel() {
    currentLevel++
    levelConfig = getLevelConfig(currentLevel)
    state.gameStartTime = Date.now()
    state.gameEnded = false
    state.cookies = []
    state.combo = 0
    state.particles = []
    state.shockwaves = []
    state.scorePopups = []
    
    console.log(`[关卡系统] 进入第 ${currentLevel} 关: ${levelConfig.name}`)
    
    state.cookies.push(spawnCookie(levelConfig))
    setTimeout(() => state.cookies.push(spawnCookie(levelConfig)), 500)
  }

  // 更新函数
  function update() {
    // 更新饼干（使用关卡配置）
    updateCookies(state.cookies, levelConfig)
    
    // 更新粒子
    updateParticles(state.particles)
    
    // 衰减屏幕震动
    if (state.shakeIntensity > 0) {
      state.shakeIntensity *= 0.9
      if (state.shakeIntensity < 0.5) {
        state.shakeIntensity = 0
      }
    }
    
    // 生成新饼干（使用关卡配置）
    const now = Date.now()
    if (now - state.lastSpawn > levelConfig.spawnInterval && state.cookies.length < levelConfig.maxCookies) {
      state.cookies.push(spawnCookie(levelConfig))
      state.lastSpawn = now
    }
  }

  // 渲染函数
  function draw() {
    // 清空画布并绘制背景（带震动效果）
    drawBackground(ctx, state.shakeIntensity)
    
    // 绘制冲击波
    drawShockwaves(ctx, state.shockwaves)
    
    // 绘制切割轨迹
    drawSlices(ctx, state.slices)
    
    // 绘制饼干
    drawCookies(ctx, state.cookies)
    
    // 绘制粒子
    drawParticles(ctx, state.particles)
    
    // 绘制分数飘字
    drawScorePopups(ctx, state.scorePopups)
    
    // 绘制UI（包含关卡信息）
    drawUI(ctx, engine.getScore(), state.combo, state.gameStartTime, levelConfig)
    
    // 绘制关卡过渡动画（在最顶层）
    drawLevelTransition(ctx, state.transition)
  }

  // 启动游戏
  engine.start()
  state.cookies.push(spawnCookie(levelConfig))
  setTimeout(() => state.cookies.push(spawnCookie(levelConfig)), 500)
  
  loop()
}
