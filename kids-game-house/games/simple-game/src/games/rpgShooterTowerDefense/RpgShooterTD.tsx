// RPG Shooter 塔防融合版 - React组件

import React, { useEffect, useRef, useState } from 'react'
import { createInitialState } from './state'
import { updateTurrets, drawTurret, selectBuildType, canPlaceTurret, placeTurret, sellTurret } from './turrets'
import { updateEnemies, drawEnemy } from './enemies'
import { updateWaveSystem } from './waves'
import { updateProjectiles, playerShoot, updatePlayer, drawPlayer, drawProjectiles } from './combat'
import { updateTraps, drawTrap } from './traps'
import { CANVAS_WIDTH, CANVAS_HEIGHT, TURRET_CONFIGS, TURRET_DISPLAY } from './config'
import { TurretType } from './types'
import { soundManager, bgmManager, playSound } from './sounds'

const RpgShooterTowerDefense: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef(createInitialState())
  const animationFrameRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // 音效开关
  const toggleSound = () => {
    const newState = !soundEnabled
    setSoundEnabled(newState)
    soundManager.setEnabled(newState)
    bgmManager.setEnabled(newState)
    if (!newState) {
      bgmManager.stop()
    } else if (gameStateRef.current.gameStarted && !gameStateRef.current.gameEnded) {
      bgmManager.startSimpleBgm()
    }
  }

  // UI状态
  const [uiState, setUiState] = useState({
    wave: 0,
    crystals: 150,
    energy: 50,
    score: 0,
    combo: 0,
    hp: 100,
    maxHp: 100,
    level: 1,
    exp: 0,
    expToLevel: 20,
    buildMode: false,
    selectedTurret: null as string | null,
    breakTime: 10,
    gameStarted: false,
    gameEnded: false
  })

  // 鼠标/触摸位置
  const mousePos = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 })

  // 初始化游戏
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = gameStateRef.current

    // === 鼠标事件 ===
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      state.buildMode.previewX = mousePos.current.x
      state.buildMode.previewY = mousePos.current.y
    }

    const handleClick = (e: MouseEvent) => {
      const s = gameStateRef.current

      // 建造模式放置
      if (s.buildMode.active && s.buildMode.selectedTurret) {
        placeTurret(s, mousePos.current.x, mousePos.current.y, s.buildMode.selectedTurret)
        return
      }


      // 点击已有炮台 → 出售（调用统一函数，退款含升级费用）
      const clicked = s.turrets.find(t => {
        const d = Math.sqrt((t.x - mousePos.current.x) ** 2 + (t.y - mousePos.current.y) ** 2)
        return d < 20
      })
      if (clicked && !s.buildMode.active) {
        sellTurret(s, clicked)
        return
      }

      // 点击空地关闭建造模式
      if (s.buildMode.active && !s.buildMode.selectedTurret) {
        s.buildMode.active = false
      }
    }

    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault()
      const s = gameStateRef.current
      s.buildMode.active = false
      s.buildMode.selectedTurret = null
      setUiState(prev => ({ ...prev, buildMode: false, selectedTurret: null }))
    }

    // === 键盘事件（WASD移动） ===
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      state.keys[key] = true

      // B键切换建造模式
      if (key === 'b') {
        const s = gameStateRef.current
        s.buildMode.active = !s.buildMode.active
        if (s.buildMode.active) s.buildMode.selectedTurret = null
        setUiState(prev => ({
          ...prev,
          buildMode: s.buildMode.active,
          selectedTurret: s.buildMode.selectedTurret
        }))
      }

      // 数字键1-4选择炮台
      if (s.buildMode.active) {
        const turretMap: Record<string, TurretType> = { '1': 'laser', '2': 'missile', '3': 'frost', '4': 'lightning' }
        if (turretMap[key]) {
          selectBuildType(s, turretMap[key])
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      state.keys[e.key.toLowerCase()] = false
    }

    // === 触摸事件（虚拟摇杆 + 简化操作） ===
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const s = gameStateRef.current

      for (const touch of Array.from(e.changedTouches)) {
        const rect = canvas.getBoundingClientRect()
        const x = touch.clientX - rect.left
        const y = touch.clientY - rect.top
        const w = rect.width
        const h = rect.height

        // 左下角区域40%×40% → 虚拟摇杆
        if (x < w * 0.4 && y > h * 0.6) {
          s.joystick.active = true
          s.joystick.baseX = x
          s.joystick.baseY = y
          s.joystick.dx = 0
          s.joystick.dy = 0
          s.joystick.touchId = touch.identifier
        }
        // 右上角区域 → 切换建造模式
        else if (x > w * 0.7 && y < h * 0.25) {
          s.buildMode.active = !s.buildMode.active
          if (s.buildMode.active) s.buildMode.selectedTurret = null
          setUiState(prev => ({
            ...prev,
            buildMode: s.buildMode.active,
            selectedTurret: s.buildMode.selectedTurret
          }))
        }
        // 建造模式：点击地图放置
        else if (s.buildMode.active && s.buildMode.selectedTurret) {
          placeTurret(s, x, y, s.buildMode.selectedTurret)
        }
        // 普通区域 → 自由移动玩家
        else {
          s.player.moveTouchId = touch.identifier
          s.player.moveTargetX = x
          s.player.moveTargetY = y
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const s = gameStateRef.current

      for (const touch of Array.from(e.changedTouches)) {
        if (s.joystick.touchId === touch.identifier) {
          const rect = canvas.getBoundingClientRect()
          const x = touch.clientX - rect.left
          const y = touch.clientY - rect.top

          const dx = x - s.joystick.baseX
          const dy = y - s.joystick.baseY
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = 50  // 摇杆最大拖拽距离

          if (dist > 0) {
            const ratio = Math.min(dist / maxDist, 1)
            s.joystick.dx = (dx / dist) * ratio
            s.joystick.dy = (dy / dist) * ratio
          }
        }
        // 移动触摸：更新目标位置
        if (s.player.moveTouchId === touch.identifier) {
          const rect = canvas.getBoundingClientRect()
          s.player.moveTargetX = touch.clientX - rect.left
          s.player.moveTargetY = touch.clientY - rect.top
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        if (gameStateRef.current.joystick.touchId === touch.identifier) {
          gameStateRef.current.joystick.active = false
          gameStateRef.current.joystick.dx = 0
          gameStateRef.current.joystick.dy = 0
          gameStateRef.current.joystick.touchId = null
        }
        // 清除移动触摸
        if (gameStateRef.current.player.moveTouchId === touch.identifier) {
          gameStateRef.current.player.moveTouchId = null
        }
      }
    }

    // 事件绑定
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('contextmenu', handleRightClick)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)

    // 开始游戏循环
    lastTimeRef.current = performance.now()
    gameLoop(performance.now())

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('contextmenu', handleRightClick)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])
  
  // 游戏主循环
  const gameLoop = (currentTime: number) => {
    const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1)
    lastTimeRef.current = currentTime
    
    const state = gameStateRef.current
    
    // 更新逻辑
    if (state.gameStarted && !state.gameEnded) {
      updateGame(state, dt, currentTime)
    }
    
    // 渲染
    render(state)
    
    // 更新UI
    updateUI()
    
    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }
  
  // 更新游戏逻辑
  const updateGame = (
    state: any,
    dt: number,
    now: number
  ) => {
    // 更新波次系统
    updateWaveSystem(state, dt)
    
    // 更新玩家
    updatePlayer(state, dt)
    
    // 自动射击
    if (!state.buildMode.active || !state.buildMode.selectedTurret) {
      playerShoot(state, now)
    }
    
    // 更新炮台
    updateTurrets(state, now)
    
    // 更新敌人
    updateEnemies(state, dt)
    
    // 更新投射物
    updateProjectiles(state, dt)
    
    // 更新陷阱
    updateTraps(state, dt)
    
    // 更新粒子
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i]
      p.x += p.vx * 60 * dt
      p.y += p.vy * 60 * dt
      p.life -= dt
      
      if (p.life <= 0) {
        state.particles.splice(i, 1)
      }
    }
    
    // 更新浮动文字
    for (let i = state.floatTexts.length - 1; i >= 0; i--) {
      const text = state.floatTexts[i]
      text.y += text.vy * 60 * dt
      text.life -= dt
      
      if (text.life <= 0) {
        state.floatTexts.splice(i, 1)
      }
    }
    
    // 屏幕震动衰减
    if (state.shakeAmt > 0) {
      state.shakeAmt *= 0.9
      if (state.shakeAmt < 0.5) state.shakeAmt = 0
    }
    
    // 屏幕闪光衰减
    if (state.screenFlash > 0) {
      state.screenFlash -= dt * 2
      if (state.screenFlash < 0) state.screenFlash = 0
    }
  }
  
  // 渲染函数
  const render = (state: any) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // 清空画布
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // 应用屏幕震动
    ctx.save()
    if (state.shakeAmt > 0) {
      const shakeX = (Math.random() - 0.5) * state.shakeAmt
      const shakeY = (Math.random() - 0.5) * state.shakeAmt
      ctx.translate(shakeX, shakeY)
    }
    
    // 绘制背景网格
    drawGrid(ctx)
    
    // 绘制陷阱
    for (const trap of state.traps) {
      drawTrap(ctx, trap)
    }
    
    // 绘制炮台
    for (const turret of state.turrets) {
      drawTurret(ctx, turret)
    }
    
    // 绘制敌人
    for (const enemy of state.enemies) {
      drawEnemy(ctx, enemy)
    }
    
    // 绘制投射物
    drawProjectiles(ctx, state)
    
    // 绘制玩家
    drawPlayer(ctx, state)

    // 绘制虚拟摇杆（触摸控制指示器）
    if (state.joystick.active) {
      const jx = state.joystick.baseX + state.joystick.dx * 50
      const jy = state.joystick.baseY + state.joystick.dy * 50
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(state.joystick.baseX, state.joystick.baseY, 40, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = 'rgba(69, 183, 209, 0.5)'
      ctx.beginPath()
      ctx.arc(jx, jy, 20, 0, Math.PI * 2)
      ctx.fill()
    }

    // 绘制建造预览
    if (state.buildMode.active && state.buildMode.selectedTurret) {
      drawBuildPreview(ctx, state)
    }
    
    // 绘制粒子
    for (const particle of state.particles) {
      const alpha = particle.life / particle.maxLife
      ctx.globalAlpha = alpha
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    
    // 绘制浮动文字
    for (const text of state.floatTexts) {
      const alpha = text.life
      ctx.globalAlpha = alpha
      ctx.fillStyle = text.color
      ctx.font = `bold ${text.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(text.text, text.x, text.y)
    }
    ctx.globalAlpha = 1
    
    // 屏幕闪光效果
    if (state.screenFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${state.screenFlash})`
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }
    
    ctx.restore()
  }
  
  // 绘制网格
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    
    for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()
    }
    
    for (let y = 0; y <= CANVAS_HEIGHT; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()
    }
  }
  
  // 绘制建造预览
  const drawBuildPreview = (ctx: CanvasRenderingContext2D, state: any) => {
    const { previewX, previewY, selectedTurret } = state.buildMode
    
    if (!selectedTurret) return
    
    const gridX = Math.round(previewX / 20) * 20
    const gridY = Math.round(previewY / 20) * 20
    
    ctx.save()
    ctx.translate(gridX, gridY)
    
    // 检查是否可以放置
    const check = canPlaceTurret(state, gridX, gridY, selectedTurret)
    
    if (check.canPlace) {
      ctx.strokeStyle = '#00E676'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(0, 0, 20, 0, Math.PI * 2)
      ctx.stroke()
      
      ctx.fillStyle = 'rgba(0, 230, 118, 0.3)'
      ctx.beginPath()
      ctx.arc(0, 0, 20, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.strokeStyle = '#FF4757'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(0, 0, 20, 0, Math.PI * 2)
      ctx.stroke()
      
      ctx.fillStyle = 'rgba(255, 71, 87, 0.3)'
      ctx.beginPath()
      ctx.arc(0, 0, 20, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.restore()
  }
  
  // 更新UI状态
  const updateUI = () => {
    const state = gameStateRef.current
    
    setUiState(prev => ({
      ...prev,
      wave: state.wave,
      crystals: state.resources.crystals,
      energy: state.resources.energy,
      score: state.resources.score,
      combo: state.combo.count,  // 使用连击计数
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      level: state.player.level,
      exp: state.player.exp,
      expToLevel: state.player.expToLevel,
      buildMode: state.buildMode.active,
      selectedTurret: state.buildMode.selectedTurret,
      breakTime: state.breakTime,
      gameStarted: state.gameStarted,
      gameEnded: state.gameEnded
    }))
  }
  
  // 选择炮台类型
  const handleSelectTurret = (type: string) => {
    const state = gameStateRef.current
    selectBuildType(state, type as any)
  }
  
  // 开始游戏
  const handleStartGame = () => {
    // 初始化音效系统
    soundManager.init()
    bgmManager.init()

    const state = gameStateRef.current
    state.gameStarted = true

    // 播放BGM
    bgmManager.startSimpleBgm()

    // 播放开始音效
    playSound('waveStart')
  }
  
  // 重新开始
  const handleRestart = () => {
    // 停止BGM
    bgmManager.stop()

    gameStateRef.current = createInitialState()
    setUiState({
      wave: 0,
      crystals: 200,
      energy: 60,
      score: 0,
      combo: 0,
      hp: 100,
      maxHp: 100,
      level: 1,
      exp: 0,
      expToLevel: 20,
      buildMode: false,
      selectedTurret: null,
      breakTime: 10,
      gameStarted: false,
      gameEnded: false
    })

    // 重新开始BGM
    bgmManager.startSimpleBgm()
    playSound('waveStart')
  }
  
  return (
    <div className="relative w-full h-full">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-gray-700 rounded-lg"
      />
      
      {/* UI层 */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {/* 顶部信息栏 */}
        <div className="flex justify-between items-start p-4">
          {/* 左侧：资源显示 */}
          <div className="bg-black bg-opacity-70 rounded-lg p-3 text-white">
            <div className="text-sm font-bold mb-2">资源</div>
            <div className="space-y-1">
              <div>💎 {uiState.crystals}</div>
              <div>⚡ {uiState.energy}</div>
              <div>🏆 {uiState.score}</div>
            </div>
          </div>

          {/* 中间：波次信息 */}
          <div className="bg-black bg-opacity-70 rounded-lg p-3 text-white text-center">
            <div className="text-lg font-bold">第 {uiState.wave}/8 波</div>
            {!uiState.buildMode && uiState.breakTime > 0 && (
              <div className="text-sm text-yellow-400">
                准备时间: {Math.ceil(uiState.breakTime)}秒
              </div>
            )}
          </div>

          {/* 右侧：玩家状态 + 建造按钮 */}
          <div className="flex flex-col items-end gap-2">
            {/* 音效开关 */}
            <button
              onClick={toggleSound}
              className={`px-3 py-2 rounded-lg font-bold text-white pointer-events-auto transition-colors text-sm ${
                soundEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              {soundEnabled ? '🔊 音效' : '🔇 静音'}
            </button>

            {/* 建造模式切换按钮（桌面端B键 / 手机端点击） */}
            <button
              onClick={() => {
                const s = gameStateRef.current
                s.buildMode.active = !s.buildMode.active
                if (s.buildMode.active) s.buildMode.selectedTurret = null
                // 立即同步 uiState，不等下一帧 gameLoop
                setUiState(prev => ({
                  ...prev,
                  buildMode: s.buildMode.active,
                  selectedTurret: s.buildMode.selectedTurret
                }))
              }}
              className={`px-4 py-2 rounded-lg font-bold text-white pointer-events-auto transition-colors ${
                uiState.buildMode ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {uiState.buildMode ? '🔫 退出建造' : '🔨 建造 (B)'}
            </button>

            <div className="bg-black bg-opacity-70 rounded-lg p-3 text-white">
              <div className="text-sm font-bold mb-2">角色</div>
              <div className="space-y-1">
                <div>❤️ {uiState.hp}/{uiState.maxHp}</div>
                <div>⭐ Lv.{uiState.level}</div>
                <div>📊 {uiState.exp}/{uiState.expToLevel} XP</div>
                {uiState.combo > 0 && (
                  <div className="text-orange-400 font-bold">
                    🔥 {uiState.combo} 连击!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 底部：建造菜单（动态读取 TURRET_CONFIGS，费用与配置保持同步） */}
        {uiState.buildMode && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <div className="bg-black bg-opacity-85 rounded-xl p-3 shadow-xl">
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(TURRET_CONFIGS) as TurretType[]).map((type, idx) => {
                  const cfg = TURRET_CONFIGS[type]
                  const disp = TURRET_DISPLAY[type]
                  const canAfford = uiState.crystals >= cfg.cost
                  // 每种炮台对应的高亮色
                  const activeColors: Record<string, string> = {
                    laser: 'bg-cyan-500',
                    missile: 'bg-red-500',
                    frost: 'bg-blue-400',
                    lightning: 'bg-yellow-500'
                  }
                  const isSelected = uiState.selectedTurret === type
                  return (
                    <button
                      key={type}
                      onClick={() => handleSelectTurret(type)}
                      className={`px-2 py-2 rounded-lg flex flex-col items-center transition-all
                        ${isSelected
                          ? `${activeColors[type] ?? 'bg-gray-500'} ring-2 ring-white`
                          : canAfford ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 opacity-50 cursor-not-allowed'}
                        text-white text-xs`}
                    >
                      <span className="text-lg">{disp.icon}</span>
                      <span className="mt-1 font-bold">{disp.name}</span>
                      <span className="text-[9px] opacity-40 mt-0.5">[{idx + 1}]</span>
                    </button>
                  )
                })}
              </div>
              {/* 快捷键提示 */}
              <div className="text-center text-white text-xs mt-2 opacity-50">数字键 1-4 快速选择 | 点击炮台出售</div>
            </div>
          </div>
        )}
        
        {/* 开始界面 */}
        {!uiState.gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 pointer-events-auto">
            <div className="bg-gray-800 rounded-xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <h1 className="text-3xl font-bold text-white mb-3">
                🏰 RPG塔防射击
              </h1>
              <p className="text-gray-300 mb-4 text-sm">
                建造炮台防御敌人，同时控制角色自动射击！
              </p>
              {/* 操作说明 */}
              <div className="bg-gray-700 rounded-lg p-3 mb-5 text-left text-xs text-gray-200">
                <div className="mb-2 font-bold text-yellow-400">🎮 操作指南</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>🖥️ WASD / 方向键移动</div>
                  <div>🖱️ 自动瞄准射击</div>
                  <div>🔨 B键 / 右上按钮建造</div>
                  <div>📱 左下角虚拟摇杆</div>
                  <div>🔢 1-4键快速选炮台</div>
                  <div>🗑️ 点击炮台出售(50%)</div>
                </div>
              </div>
              <button
                onClick={handleStartGame}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg transition-transform active:scale-95"
              >
                开始游戏
              </button>
            </div>
          </div>
        )}
        
        {uiState.gameEnded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 pointer-events-auto">
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                游戏结束
              </h2>
              <p className="text-gray-300 mb-2">
                到达波次: {uiState.wave}/8
              </p>
              <p className="text-gray-300 mb-6">
                最终得分: {uiState.score}
              </p>
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg"
              >
                重新开始
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RpgShooterTowerDefense
