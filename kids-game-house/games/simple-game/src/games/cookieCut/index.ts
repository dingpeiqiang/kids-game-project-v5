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
import { drawBackground, drawSlices, drawCookies, drawParticles, drawUI } from './renderer'
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

  // 设置输入监听
  setupInputListeners(canvas, inputState, (x1, y1, x2, y2) => {
    // 添加切割轨迹
    state.slices.push({ x1, y1, x2, y2, life: 1 })
    
    // 检查切割碰撞
    checkSlice(state.cookies, x1, y1, x2, y2, (cookie, combo) => {
      handleCookieSlice(engine, state, cookie.x, cookie.y, createCookieParticles)
    })
  })

  // 游戏主循环
  function loop() {
    if (!document.getElementById('mainGameCanvas') || state.gameEnded) return
    
    // 检查游戏结束
    if (Date.now() - state.gameStartTime > levelConfig.duration) {
      state.gameEnded = true
      
      // 检查是否通关
      const score = engine.getScore()
      if (score >= levelConfig.targetScore && currentLevel < LEVELS.length) {
        // 通关，进入下一关
        console.log(`[关卡系统] 通关！分数: ${score}, 目标: ${levelConfig.targetScore}`)
        setTimeout(() => {
          nextLevel()
        }, 2000)
      } else {
        // 游戏结束
        engine.endGame()
        onEnd()
      }
      return
    }
    
    // 更新逻辑
    update()
    
    // 渲染
    draw()
    
    requestAnimationFrame(loop)
  }
  
  // 进入下一关
  function nextLevel() {
    currentLevel++
    levelConfig = getLevelConfig(currentLevel)
    state.gameStartTime = Date.now()
    state.gameEnded = false
    state.cookies = []
    state.combo = 0
    
    console.log(`[关卡系统] 进入第 ${currentLevel} 关: ${levelConfig.name}`)
    
    // 初始生成饼干
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
    
    // 绘制切割轨迹
    drawSlices(ctx, state.slices)
    
    // 绘制饼干
    drawCookies(ctx, state.cookies)
    
    // 绘制粒子
    drawParticles(ctx, state.particles)
    
    // 绘制UI（包含关卡信息）
    drawUI(ctx, engine.getScore(), state.combo, state.gameStartTime, levelConfig)
  }

  // 启动游戏
  engine.start()
  state.cookies.push(spawnCookie(levelConfig))
  setTimeout(() => state.cookies.push(spawnCookie(levelConfig)), 500)
  
  loop()
}
