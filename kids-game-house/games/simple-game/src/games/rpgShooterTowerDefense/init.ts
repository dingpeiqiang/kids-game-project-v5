// RPG Shooter 塔防融合版 - Canvas初始化入口
// 将React组件转换为纯Canvas实现

import type { GameEngine } from '../../services/gameEngine'
import { createInitialState, resetCombo } from './state'
import { updateTurrets, drawTurret, canPlaceTurret, placeTurret, upgradeTurret, sellTurret } from './turrets'
import { spendCrystals } from './state'

// 炮台类型列表
const turretTypes = ['laser', 'missile', 'frost', 'lightning']
import { updateEnemies, drawEnemy } from './enemies'
import { updateEnemyBullets, drawEnemyBullets } from './enemyBullets'
import { updateWaveSystem } from './waves'
import { updateProjectiles, playerShoot, updatePlayer, drawPlayer, drawProjectiles } from './combat'
import { updateTraps, drawTrap, placeTrap } from './traps'
import { CANVAS_WIDTH, CANVAS_HEIGHT, TRAP_CONFIGS, TURRET_CONFIGS, initCanvasSize } from './config'

export function initRpgShooterTD(engine: GameEngine, onEnd: () => void) {
  console.log('🏰 启动RPG塔防射击游戏...')
  console.log('GameEngine:', engine)
  
  // 初始化Canvas尺寸（响应式适配）
  initCanvasSize()
  
  // ==================== 音效系统 ====================
  const playSound = (type: 'select' | 'build' | 'upgrade' | 'shoot' | 'explosion' | 'hit') => {
    // 简单的音效模拟（使用Web Audio API）
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // 根据类型设置不同的音效
      switch (type) {
        case 'select':
          oscillator.frequency.value = 800
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.1)
          break
        case 'build':
          oscillator.frequency.value = 600
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.15)
          break
        case 'upgrade':
          oscillator.frequency.value = 1000
          gainNode.gain.setValueAtTime(0.12, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.2)
          break
        case 'shoot':
          oscillator.frequency.value = 400
          gainNode.gain.setValueAtTime(0.08, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.05)
          break
        case 'explosion':
          oscillator.type = 'sawtooth'
          oscillator.frequency.value = 150
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
          break
        case 'hit':
          oscillator.frequency.value = 300
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.08)
          break
      }
    } catch (e) {
      // 如果音频上下文创建失败，静默忽略
    }
  }
  
  // 获取Canvas - 使用正确的ID
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  console.log('Canvas元素:', canvas)
  
  if (!canvas) {
    console.error('❌ 未找到Canvas元素 (mainGameCanvas)')
    console.log('尝试查找所有canvas元素:')
    const allCanvases = document.querySelectorAll('canvas')
    console.log('找到的Canvas数量:', allCanvases.length)
    allCanvases.forEach((c, i) => {
      console.log(`Canvas ${i}:`, c.id, c.width, 'x', c.height)
    })
    return
  }
  
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.error('无法获取Canvas上下文')
    return
  }
  
  // 设置Canvas尺寸
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  console.log(`Canvas 尺寸: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`)
  
  // 创建游戏状态
  const state = createInitialState()
  console.log('游戏状态已创建', state)
  let animationId: number
  let mobileButtons: any = null
  let lastTime = performance.now()
  
  // 鼠标位置
  const mousePos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
  
  // 虚拟摇杆状态（手机端）
  const joystick = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    radius: 60,  // 摇杆半径
    knobRadius: 25  // 摇杆钮半径
  }
  
  // 建造模式状态扩展
  state.buildMode.active = false
  state.buildMode.selectedTurret = null
  state.buildMode.buildTab = 'turret' as 'turret' | 'trap'
  
  // 拖拽状态
  let isDragging = false
  let draggedTurretType: string | null = null
  
  // 事件监听
  const handleMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    // 计算缩放比例（CSS尺寸 / Canvas逻辑尺寸）
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    mousePos.x = (e.clientX - rect.left) * scaleX
    mousePos.y = (e.clientY - rect.top) * scaleY
    state.buildMode.previewX = mousePos.x
    state.buildMode.previewY = mousePos.y
    
    // 如果正在拖拽炮台，更新预览位置
    if (isDragging && draggedTurretType) {
      state.buildMode.selectedTurret = draggedTurretType
    }
  }
  
  // 鼠标按下事件（用于拖拽炮台）
  const handleMouseDown = (e: MouseEvent) => {
    if (!state.gameStarted || state.gameEnded) return
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    
    // 检查是否点击了炮台按钮
    if (mobileButtons) {
      for (const btn of mobileButtons.turretButtons) {
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
          const config = TURRET_CONFIGS[btn.type]
          if (config && state.resources.crystals >= config.cost) {
            isDragging = true
            draggedTurretType = btn.type
            state.buildMode.selectedTurret = btn.type
            playSound('select')
            return
          }
        }
      }
    }
  }
  
  // 鼠标松开事件（用于放置炮台）
  const handleMouseUp = (e: MouseEvent) => {
    if (isDragging && draggedTurretType) {
      const rect = canvas.getBoundingClientRect()
      const scaleX = CANVAS_WIDTH / rect.width
      const scaleY = CANVAS_HEIGHT / rect.height
      const mx = (e.clientX - rect.left) * scaleX
      const my = (e.clientY - rect.top) * scaleY
      
      // 检查是否在按钮区域外（避免误触）
      const btnPanelY = CANVAS_HEIGHT - 65 // 按钮面板顶部位置
      if (my < btnPanelY) {
        // 尝试放置炮台
        const config = TURRET_CONFIGS[draggedTurretType]
        if (config && state.resources.crystals >= config.cost) {
          let targetLevel = 1
          let totalCost = config.cost
          for (const upg of config.upgradePath) {
            if (state.resources.crystals >= totalCost + upg.cost) {
              targetLevel = upg.level
              totalCost += upg.cost
            } else {
              break
            }
          }
          
          if (spendCrystals(state, totalCost)) {
            placeTurret(state, mx, my, draggedTurretType, targetLevel)
            if (targetLevel > 1) {
              state.floatTexts.push({
                text: `🏆 Lv${targetLevel}`,
                x: mx,
                y: my - 30,
                life: 1.5,
                color: '#FBBF24',
                size: 14,
                vy: -1
              })
            }
            playSound('build')
          }
        }
      }
      
      isDragging = false
      draggedTurretType = null
    }
  }
  
  // 触摸事件处理（手机端支持）
  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault()  // 防止滚动
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    
    // 如果摇杆激活，更新摇杆位置
    if (joystick.active) {
      joystick.currentX = touch.clientX - rect.left
      joystick.currentY = touch.clientY - rect.top
      
      // 计算摇杆偏移量
      const dx = joystick.currentX - joystick.startX
      const dy = joystick.currentY - joystick.startY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // 限制在摇杆半径内
      if (distance > joystick.radius) {
        const ratio = joystick.radius / distance
        joystick.currentX = joystick.startX + dx * ratio
        joystick.currentY = joystick.startY + dy * ratio
      }
      
      // 计算缩放比例
      const scaleX = CANVAS_WIDTH / rect.width
      const scaleY = CANVAS_HEIGHT / rect.height
      
      // 更新鼠标位置（用于瞄准）
      mousePos.x = joystick.currentX * scaleX
      mousePos.y = joystick.currentY * scaleY
      state.buildMode.previewX = mousePos.x
      state.buildMode.previewY = mousePos.y
    } else {
      // 非摇杆模式，正常更新
      const scaleX = CANVAS_WIDTH / rect.width
      const scaleY = CANVAS_HEIGHT / rect.height
      mousePos.x = (touch.clientX - rect.left) * scaleX
      mousePos.y = (touch.clientY - rect.top) * scaleY
      state.buildMode.previewX = mousePos.x
      state.buildMode.previewY = mousePos.y
    }
  }
  
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    
    // 检测双指点击（切换建造模式）
    if (e.touches.length === 2) {
      state.buildMode.active = !state.buildMode.active
      if (state.buildMode.active) {
        state.buildMode.selectedTurret = 'laser'
        state.buildMode.buildTab = 'turret'
      } else {
        state.buildMode.selectedTurret = null
        state.buildMode.selectedTrap = null
      }
      playSound('select')
      console.log(`双指切换 - 建造模式: ${state.buildMode.active ? '开启' : '关闭'}`)
      return
    }
    
    const touch = e.touches[0]
    const touchX = touch.clientX - rect.left
    const touchY = touch.clientY - rect.top
    
    // 先检查是否点击了手机按钮区域（炮台选择、建造按钮）
    if (mobileButtons) {
      const scaleX = CANVAS_WIDTH / rect.width
      const scaleY = CANVAS_HEIGHT / rect.height
      const btnX = touchX * scaleX
      const btnY = touchY * scaleY
      
      // 检查炮台按钮
      for (const btn of mobileButtons.turretButtons) {
        if (btnX >= btn.x && btnX <= btn.x + btn.w && btnY >= btn.y && btnY <= btn.y + btn.h) {
          state.buildMode.selectedTurret = btn.type
          state.buildMode.selectedTrap = null
          playSound('select')
          console.log(`选择炮台: ${btn.type}`)
          return
        }
      }
      
      // 检查建造/退出按钮
      const bBtn = mobileButtons.buildButton
      if (btnX >= bBtn.x && btnX <= bBtn.x + bBtn.w && btnY >= bBtn.y && btnY <= bBtn.y + bBtn.h) {
        state.buildMode.active = !state.buildMode.active
        if (!state.buildMode.active) {
          state.buildMode.selectedTurret = null
          state.buildMode.selectedTrap = null
        }
        playSound('select')
        console.log(`建造模式: ${state.buildMode.active}`)
        return
      }
    }
    
    // 检查是否点击了左下角区域（启动虚拟摇杆）
    if (touchX < CANVAS_WIDTH * 0.4 && touchY > CANVAS_HEIGHT * 0.6) {
      // 启动虚拟摇杆
      joystick.active = true
      joystick.startX = touchX
      joystick.startY = touchY
      joystick.currentX = touchX
      joystick.currentY = touchY
      console.log('虚拟摇杆已激活')
      return
    }
    
    // 其他区域的触摸视为点击
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    mousePos.x = touchX * scaleX
    mousePos.y = touchY * scaleY
    
    // 模拟点击事件
    const clickEvent = new MouseEvent('click', {
      clientX: touch.clientX,
      clientY: touch.clientY
    })
    handleClick(clickEvent)
  }
  
  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault()
    
    // 停止虚拟摇杆
    if (joystick.active) {
      joystick.active = false
    }
    
    // 检测手机按钮点击或拖拽放置
    if (mobileButtons) {
      const touch = e.changedTouches[0]
      const rect = canvas.getBoundingClientRect()
      const tx = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
      const ty = (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
      
      // 检查是否点击了炮台按钮（选中炮台）
      let clickedBtn = false
      for (const btn of mobileButtons.turretButtons) {
        if (tx >= btn.x && tx <= btn.x + btn.w && ty >= btn.y && ty <= btn.y + btn.h) {
          state.buildMode.selectedTurret = btn.type
          playSound('select')
          clickedBtn = true
          break
        }
      }
      
      // 如果没有点击按钮，且已经选中了炮台，尝试放置炮台
      if (!clickedBtn && state.buildMode.selectedTurret) {
        // 检查是否在按钮区域外（避免误触）
        const btnPanelY = CANVAS_HEIGHT - 95 // 按钮面板顶部位置
        if (ty < btnPanelY) {
          // 尝试放置炮台
          const config = TURRET_CONFIGS[state.buildMode.selectedTurret]
          if (config && state.resources.crystals >= config.cost) {
            // 找到最高可用等级
            let targetLevel = 1
            let totalCost = config.cost
            for (const upg of config.upgradePath) {
              if (state.resources.crystals >= totalCost + upg.cost) {
                targetLevel = upg.level
                totalCost += upg.cost
              } else {
                break
              }
            }
            
            if (spendCrystals(state, totalCost)) {
              placeTurret(state, tx, ty, state.buildMode.selectedTurret, targetLevel)
              if (targetLevel > 1) {
                state.floatTexts.push({
                  text: `🏆 Lv${targetLevel}`,
                  x: tx,
                  y: ty - 30,
                  life: 1.5,
                  color: '#FBBF24',
                  size: 14,
                  vy: -1
                })
              }
              playSound('build')
            }
          }
        }
      }
    }
  }
  
  const handleClick = (e: MouseEvent) => {
    // 如果正在显示升级弹窗，处理升级/出售

    
    // 直接放置炮台（选中炮台后点击地图即可放置）
    if (state.buildMode.selectedTurret) {
      const config = TURRET_CONFIGS[state.buildMode.selectedTurret]
      if (!config) return
      
      // 找到最高可用等级
      let targetLevel = 1
      let totalCost = config.cost
      for (const upg of config.upgradePath) {
        if (state.resources.crystals >= totalCost + upg.cost) {
          targetLevel = upg.level
          totalCost += upg.cost
        } else {
          break
        }
      }
      
      if (spendCrystals(state, totalCost)) {
        placeTurret(state, mousePos.x, mousePos.y, state.buildMode.selectedTurret, targetLevel)
        if (targetLevel > 1) {
          state.floatTexts.push({
            text: `🏆 Lv${targetLevel}`,
            x: mousePos.x,
            y: mousePos.y - 30,
            life: 1.5,
            color: '#FBBF24',
            size: 14,
            vy: -1
          })
        }
        playSound('build')
      }
    } else if (state.buildMode.selectedTrap) {
      placeTrap(state, mousePos.x, mousePos.y, state.buildMode.selectedTrap)
      playSound('build')
    }
  }
  
  const handleRightClick = (e: MouseEvent) => {
    e.preventDefault()
    state.buildMode.active = false
    state.buildMode.selectedTurret = null
  }
  
  canvas.addEventListener('mousemove', handleMouseMove)
  canvas.addEventListener('click', handleClick)
  canvas.addEventListener('contextmenu', handleRightClick)
  
  // 添加触摸事件支持（手机端）
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
  
  // 游戏循环
  const gameLoop = (currentTime: number) => {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1)
    lastTime = currentTime
    
    // 检查引擎是否已启动，如果已启动则开始游戏
    if (!state.gameStarted && engine.isRunning()) {
      state.gameStarted = true
      console.log('🎮 RPG塔防射击游戏开始！')
    }
    
    // 更新逻辑
    if (state.gameStarted && !state.gameEnded) {
      updateGame(state, dt, currentTime)
    }
    
    // 渲染
    render(ctx, state)
    
    animationId = requestAnimationFrame(gameLoop)
  }
  
  // 更新游戏逻辑
  const updateGame = (state: any, dt: number, now: number) => {
    updateWaveSystem(state, dt)
    updatePlayer(state, dt)
    
    // 更新连击计时器
    if (state.combo.timer > 0) {
      state.combo.timer -= dt
      if (state.combo.timer <= 0) {
        resetCombo(state)
      }
    }
    
    // 更新屏幕震动
    if (state.shakeAmt > 0) {
      state.shakeAmt *= 0.9  // 衰减
      if (state.shakeAmt < 0.5) state.shakeAmt = 0
    }
    
    // 更新屏幕闪胨
    if (state.screenFlash > 0) {
      state.screenFlash -= dt * 2
      if (state.screenFlash < 0) state.screenFlash = 0
    }
    
    // 记录射击前的投射物数量
    const projectileCountBefore = state.projectiles.length
    
    // 玩家自动攻击（始终启用，除非游戏暂停）
    playerShoot(state, now)
    
    // 如果产生了新的投射物，播放射击音效
    if (state.projectiles.length > projectileCountBefore) {
      playSound('shoot')
    }
    
    updateTurrets(state, now)
    updateEnemies(state, dt)
    updateEnemyBullets(state, dt)  // 更新敌人子弹
    updateProjectiles(state, dt)
    updateTraps(state, dt)
    
    // 更新粒子
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i]
      p.x += p.vx * 60 * dt
      p.y += p.vy * 60 * dt
      p.life -= dt
      if (p.life <= 0) state.particles.splice(i, 1)
    }
    
    // 更新浮动文字
    for (let i = state.floatTexts.length - 1; i >= 0; i--) {
      const text = state.floatTexts[i]
      text.y += text.vy * 60 * dt
      text.life -= dt
      if (text.life <= 0) state.floatTexts.splice(i, 1)
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
    
    // 检查游戏结束
    if (state.gameEnded && !state.gameEndProcessed) {
      state.gameEndProcessed = true
      
      // 设置游戏统计数据
      const gameStats = {
        score: state.resources.score,
        maxCombo: state.combo.maxCombo,
        totalKills: state.resources.kills,
        gameTime: Math.floor(state.elapsed),
        won: state.wave >= 8,
        level: state.player.level
      }
      engine.setGameStats(gameStats)
      
      // 设置胜利状态
      engine.setVictory(state.wave >= 8)
      
      cleanup()
      onEnd()
    }
  }
  
  // 渲染函数
  const render = (ctx: CanvasRenderingContext2D, state: any) => {
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
      drawTurret(ctx, turret, false)
    }
    
    // 绘制敌人
    for (const enemy of state.enemies) {
      drawEnemy(ctx, enemy)
    }
    
    // 绘制敌人子弹
    drawEnemyBullets(ctx, state)
    
    // 绘制投射物
    drawProjectiles(ctx, state)
    
    // 绘制玩家
    drawPlayer(ctx, state)
    
    // 绘制建造预览（选中炮台后显示）
    drawBuildPreview(ctx, state)
    
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
      ctx.fillStyle = `rgba(255, 255, 255, ${state.screenFlash * 0.3})`
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }
    
    // 绘制UI
    drawUI(ctx, state)
    
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
        // 可以放置 - 绿色
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
        
        // 显示炮台图标
        ctx.fillStyle = '#fff'
        ctx.font = '20px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const icons: Record<string, string> = {
          laser: '🔫',
          missile: '🚀',
          frost: '❄️',
          lightning: '⚡'
        }
        ctx.fillText(icons[selectedTurret] || '🏰', 0, 0)
      } else {
        // 不能放置 - 红色
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
        
        // 显示原因
        ctx.fillStyle = '#FF4757'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(check.reason || '不可放置', 0, -25)
      }
    
    ctx.restore()
  }
  
  // 绘制UI
  const drawUI = (ctx: CanvasRenderingContext2D, state: any) => {
    // ========== 辅助函数 ==========
    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
    }
    
    const drawPanel = (x: number, y: number, w: number, h: number, color: string = 'rgba(15, 25, 45, 0.85)') => {
      ctx.save()
      ctx.fillStyle = color
      drawRoundedRect(x, y, w, h, 8)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()
    }
    
    const drawHPBar = (x: number, y: number, w: number, h: number, current: number, max: number) => {
      const ratio = Math.max(0, current / max)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      drawRoundedRect(x, y, w, h, h / 2)
      ctx.fill()
      const hpColor = ratio > 0.5 ? '#4ADE80' : ratio > 0.25 ? '#FBBF24' : '#EF4444'
      ctx.fillStyle = hpColor
      drawRoundedRect(x, y, w * ratio, h, h / 2)
      ctx.fill()
      if (ratio > 0) {
        ctx.save()
        ctx.shadowColor = hpColor
        ctx.shadowBlur = 6
        ctx.fillStyle = 'rgba(255,255,255,0.25)'
        drawRoundedRect(x, y, w * ratio, h / 2, h / 2)
        ctx.fill()
        ctx.restore()
      }
    }
    
    // ========== 统一布局参数 ==========
    const PADDING = 12  // 面板内边距
    const GAP = 8       // 面板间距
    const TOP_Y = 12    // 顶部起始Y
    
    // ========== 左上面板：资源 + 击杀 ==========
    const resPanelW = 120
    drawPanel(12, TOP_Y, resPanelW, 75)
    
    // 图标行
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#E0F2FE'
    ctx.fillText('💎', 22, TOP_Y + 22)
    ctx.fillText(`${state.resources.crystals}`, 40, TOP_Y + 22)
    
    ctx.fillStyle = '#FDE68A'
    ctx.fillText('⚡', 22 + 65, TOP_Y + 22)
    ctx.fillText(`${state.resources.energy}`, 40 + 65, TOP_Y + 22)
    
    // 第二行
    ctx.fillStyle = '#F472B6'
    ctx.fillText('🔪', 22, TOP_Y + 42)
    ctx.fillText(`${state.resources.kills}`, 40, TOP_Y + 42)
    
    ctx.fillStyle = '#A78BFA'
    ctx.fillText('🏆', 22 + 65, TOP_Y + 42)
    ctx.fillText(`${state.resources.score}`, 40 + 65, TOP_Y + 42)
    
    // 第三行：EXP进度
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '9px sans-serif'
    ctx.fillText(`经验 ${state.player.exp}/${state.player.expToLevel}`, 22, TOP_Y + 62)
    
    // ========== 中上面板：波次 + 时间 ==========
    const wavePanelW = 130
    const wavePanelX = (CANVAS_WIDTH - wavePanelW) / 2
    drawPanel(wavePanelX, TOP_Y, wavePanelW, 60)
    
    ctx.fillStyle = '#A78BFA'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`第 ${state.wave} / 8 波`, CANVAS_WIDTH / 2, TOP_Y + 24)
    
    ctx.font = '10px sans-serif'
    ctx.fillStyle = '#9CA3AF'
    if (!state.buildMode.active && state.breakTime > 0) {
      ctx.fillStyle = '#FBBF24'
      ctx.fillText(`⏱ ${Math.ceil(state.breakTime)}秒后开始`, CANVAS_WIDTH / 2, TOP_Y + 44)
    } else if (state.waveInProgress) {
      ctx.fillStyle = '#4ADE80'
      ctx.fillText(`⚔ ${Math.ceil(state.timeLeft)}s`, CANVAS_WIDTH / 2, TOP_Y + 44)
    } else {
      ctx.fillText('等待中...', CANVAS_WIDTH / 2, TOP_Y + 44)
    }
    
    // ========== 右上方面板：玩家状态 ==========
    const playerPanelW = 130
    const playerPanelX = CANVAS_WIDTH - playerPanelW - 12
    drawPanel(playerPanelX, TOP_Y, playerPanelW, 75)
    
    // 玩家标识
    ctx.fillStyle = '#F472B6'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('⚔️ 玩家', playerPanelX + PADDING, TOP_Y + 18)
    
    // HP条（加宽）
    drawHPBar(playerPanelX + PADDING, TOP_Y + 24, playerPanelW - PADDING * 2, 10, state.player.hp, state.player.maxHp)
    ctx.fillStyle = '#E0F2FE'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${state.player.hp}/${state.player.maxHp}`, playerPanelX + playerPanelW - PADDING, TOP_Y + 33)
    
    // 等级 + 攻击力
    ctx.textAlign = 'left'
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '10px sans-serif'
    ctx.fillText('等级', playerPanelX + PADDING, TOP_Y + 50)
    ctx.fillText('攻击', playerPanelX + PADDING + 55, TOP_Y + 50)
    
    ctx.fillStyle = '#FBBF24'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(`${state.player.level}`, playerPanelX + PADDING + 28, TOP_Y + 50)
    ctx.fillStyle = '#EF4444'
    ctx.fillText(`${state.player.atk}`, playerPanelX + PADDING + 55 + 28, TOP_Y + 50)
    
    // ========== 右侧连击显示 ==========
    if (state.combo.count > 1) {
      const comboSize = Math.min(16 + state.combo.count, 28)
      const comboColor = state.combo.count >= 10 ? '#FFD700' : 
                        state.combo.count >= 5 ? '#FF6B6B' : '#4ECDC4'
      
      ctx.save()
      ctx.shadowColor = comboColor
      ctx.shadowBlur = 12
      ctx.fillStyle = comboColor
      ctx.font = `bold ${comboSize}px sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText(`${state.combo.count}x`, CANVAS_WIDTH - 15, 65)
      
      ctx.shadowBlur = 0
      ctx.font = '10px sans-serif'
      ctx.fillText('COMBO', CANVAS_WIDTH - 15, 80)
      
      // 计时条
      const barW = 60
      const timerRatio = state.combo.timer / 2.0
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
      drawRoundedRect(CANVAS_WIDTH - 15 - barW, 85, barW, 3, 2)
      ctx.fill()
      ctx.fillStyle = comboColor
      drawRoundedRect(CANVAS_WIDTH - 15 - barW, 85, barW * timerRatio, 3, 2)
      ctx.fill()
      ctx.restore()
    }
    
    // ========== 炮台选择面板（支持拖拽放置）==========
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window)
    const turretTypes = ['laser', 'missile', 'frost', 'lightning']
    const btnW = 58, btnH = 38, btnGap = 6
    
    if (state.gameStarted && !state.gameEnded) {
      if (isMobile) {
        // 手机端：底部炮台选择面板
        const btnPanelW = 300
        const btnPanelH = 60
        const btnPanelX = (CANVAS_WIDTH - btnPanelW) / 2
        const btnPanelY = CANVAS_HEIGHT - btnPanelH - 35
        
        drawPanel(btnPanelX, btnPanelY, btnPanelW, btnPanelH, 'rgba(10, 20, 35, 0.92)')
        
        const turretIcons: Record<string, string> = { laser: '⚡', missile: '🚀', frost: '❄️', lightning: '⚡' }
        const turretNames: Record<string, string> = { laser: '激光', missile: '导弹', frost: '冰冻', lightning: '闪电' }
        
        const startX = btnPanelX + 8
        const btnY = btnPanelY + (btnPanelH - btnH) / 2
        
        turretTypes.forEach((type, i) => {
          const bx = startX + i * (btnW + btnGap)
          const config = TURRET_CONFIGS[type]
          const canAfford = state.resources.crystals >= config.cost
          const isSelected = state.buildMode.selectedTurret === type
          
          ctx.fillStyle = canAfford ? (isSelected ? 'rgba(74, 222, 128, 0.85)' : 'rgba(255, 255, 255, 0.08)') : 'rgba(50, 50, 50, 0.5)'
          ctx.beginPath()
          ctx.roundRect(bx, btnY, btnW, btnH, 8)
          ctx.fill()
          
          ctx.strokeStyle = canAfford ? (isSelected ? '#4ADE80' : 'rgba(255,255,255,0.2)') : 'rgba(100, 100, 100, 0.3)'
          ctx.lineWidth = isSelected ? 2 : 1
          ctx.stroke()
          
          // 图标
          ctx.fillStyle = canAfford ? (isSelected ? '#fff' : '#9CA3AF') : '#666'
          ctx.font = '12px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(turretIcons[type], bx + btnW / 2, btnY + 12)
          
          // 名称
          ctx.font = '7px sans-serif'
          ctx.fillText(turretNames[type], bx + btnW / 2, btnY + 24)
          
          // 消耗钻石数量
          ctx.font = 'bold 8px sans-serif'
          const crystalColor = canAfford ? '#00D4FF' : '#666'
          ctx.fillStyle = crystalColor
          ctx.fillText(`${config.cost} 💎`, bx + btnW / 2, btnY + 35)
        })
        
        // 保存按钮区域用于触摸检测（移除建造按钮）
        mobileButtons = {
          turretButtons: turretTypes.map((type, i) => ({
            type,
            x: startX + i * (btnW + btnGap),
            y: btnY,
            w: btnW,
            h: btnH
          })),
          buildButton: null
        }
      } else {
        // PC端：显示炮台选择面板
        const pcPanelW = turretTypes.length * (btnW + btnGap) + btnGap + 20
        const pcPanelX = (CANVAS_WIDTH - pcPanelW) / 2
        const pcPanelY = CANVAS_HEIGHT - btnH - 25
        
        // PC端面板（始终显示，让PC用户也能点击选择）
        drawPanel(pcPanelX, pcPanelY, pcPanelW, btnH + 16, 'rgba(15, 25, 45, 0.85)')
        
        // 炮台选择按钮
        turretTypes.forEach((type, i) => {
          const bx = pcPanelX + btnGap + i * (btnW + btnGap)
          const config = TURRET_CONFIGS[type]
          const canAfford = state.resources.crystals >= config.cost
          const selected = state.buildMode.selectedTurret === type
          const colors: Record<string, string> = { laser: '#60A5FA', missile: '#F97316', frost: '#22D3EE', lightning: '#A78BFA' }
          const icons: Record<string, string> = { laser: '⚡', missile: '🚀', frost: '❄️', lightning: '⚡' }
          
          // 按钮背景（根据是否能负担改变颜色）
          const bgColor = canAfford ? (selected ? colors[type] : 'rgba(255,255,255,0.1)') : 'rgba(50, 50, 50, 0.5)'
          ctx.fillStyle = bgColor
          drawRoundedRect(bx, pcPanelY + 8, btnW, btnH, 6)
          ctx.fill()
          if (selected) {
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.stroke()
          }
          
          // 按钮内容
          const textColor = canAfford ? (selected ? '#fff' : '#9CA3AF') : '#666'
          ctx.fillStyle = textColor
          ctx.font = '10px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(icons[type], bx + btnW / 2, pcPanelY + 22)
          ctx.font = '8px sans-serif'
          const names: Record<string, string> = { laser: '激光', missile: '导弹', frost: '冰冻', lightning: '闪电' }
          ctx.fillText(names[type], bx + btnW / 2, pcPanelY + 32)
          
          // 消耗钻石数量
          const crystalColor = canAfford ? '#00D4FF' : '#666'
          ctx.fillStyle = crystalColor
          ctx.font = 'bold 7px sans-serif'
          ctx.fillText(`${config.cost} 💎`, bx + btnW / 2, pcPanelY + 44)
          
          // 保存PC按钮区域
          if (!mobileButtons) mobileButtons = { turretButtons: [], buildButton: null }
          mobileButtons.turretButtons.push({ type, x: bx, y: pcPanelY + 8, w: btnW, h: btnH })
        })
        
        // PC端提示（选择炮台后显示）
        if (state.buildMode.selectedTurret) {
          ctx.fillStyle = '#4ECDC4'
          ctx.font = '9px sans-serif'
          ctx.textAlign = 'center'
          const sel = TURRET_DISPLAY[state.buildMode.selectedTurret]?.name || '激光炮台'
          ctx.fillText(`已选: ${sel} | 点击地图放置 | ESC取消`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8)
        }
      }
    }
    
    // 游戏未开始时显示等待画面
    if (!state.gameStarted) {
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🏰 RPG塔防射击', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
      
      ctx.font = '14px sans-serif'
      ctx.fillStyle = '#9CA3AF'
      ctx.fillText('准备开始...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15)
    }
    
    // 虚拟摇杆（仅在游戏进行中显示）
    if (state.gameStarted && !state.gameEnded) {
      // 根据屏幕尺寸调整
      import('./config').then(({ SCALE_RATIO }) => {
        if (joystick.active) {
          // 摇杆底座
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(joystick.startX, joystick.startY, joystick.radius, 0, Math.PI * 2)
          ctx.stroke()
          
          // 摇杆钮
          ctx.fillStyle = 'rgba(78, 205, 196, 0.6)'
          ctx.beginPath()
          ctx.arc(joystick.currentX, joystick.currentY, joystick.knobRadius, 0, Math.PI * 2)
          ctx.fill()
          
          // 摇杆提示文字
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
          ctx.font = `${10 * SCALE_RATIO}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText('移动', joystick.startX, joystick.startY + joystick.radius + 15)
        } else {
          // 未激活时显示提示
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
          ctx.font = `${10 * SCALE_RATIO}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText('👆 触摸此处移动', CANVAS_WIDTH * 0.2, CANVAS_HEIGHT * 0.85)
        }
      })
    }
  }
  
  // 清理函数
  const cleanup = () => {
    cancelAnimationFrame(animationId)
    canvas.removeEventListener('mousemove', handleMouseMove)
    canvas.removeEventListener('click', handleClick)
    canvas.removeEventListener('contextmenu', handleRightClick)
    canvas.removeEventListener('touchmove', handleTouchMove)
    canvas.removeEventListener('touchstart', handleTouchStart)
    canvas.removeEventListener('touchend', handleTouchEnd)
  }
  
  // 键盘事件 - 游戏控制
  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    
    // 保存按键状态（支持WASD移动）
    state.keys[key] = true
    
    if (e.key === 'Escape') {
      state.buildMode.selectedTurret = null
      state.buildMode.selectedTrap = null
    }
  }
  
  const handleKeyUp = (e: KeyboardEvent) => {
    state.keys[e.key.toLowerCase()] = false
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  
  // 等待引导界面开始（由统一模板控制游戏流程）
  state.gameStarted = false
  state.gameEndProcessed = false
  
  // 初始渲染 - 显示等待画面
  render(ctx, state)
  console.log('初始渲染完成')
  
  // 启动游戏循环
  lastTime = performance.now()
  animationId = requestAnimationFrame(gameLoop)
  
  console.log('✅ RPG塔防射击游戏已启动！')
  console.log('📝 操作说明：')
  console.log('  - 鼠标移动：控制角色')
  console.log('  - 点击底部炮台按钮：选择炮台')
  console.log('  - 点击地图：放置已选炮台')
  console.log('  - ESC键：取消选中')
}