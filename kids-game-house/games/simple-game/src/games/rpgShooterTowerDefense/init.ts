// RPG Shooter 塔防融合版 - Canvas初始化入口
// 将React组件转换为纯Canvas实现

import type { GameEngine } from '../../services/gameEngine'
import { createInitialState, resetCombo } from './state'
import { updateTurrets, drawTurret, canPlaceTurret, placeTurret } from './turrets'
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
  state.buildMode.buildTab = 'turret' as 'turret' | 'trap'  // 当前标签页
  
  // 选中的炮台（用于升级）
  let selectedTurretForUpgrade: any = null
  
  // 事件监听
  const handleMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    mousePos.x = e.clientX - rect.left
    mousePos.y = e.clientY - rect.top
    state.buildMode.previewX = mousePos.x
    state.buildMode.previewY = mousePos.y
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
      
      // 更新鼠标位置（用于瞄准）
      mousePos.x = joystick.currentX
      mousePos.y = joystick.currentY
      state.buildMode.previewX = mousePos.x
      state.buildMode.previewY = mousePos.y
    } else {
      // 非摇杆模式，正常更新
      mousePos.x = touch.clientX - rect.left
      mousePos.y = touch.clientY - rect.top
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
    mousePos.x = touchX
    mousePos.y = touchY
    
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
      console.log('虚拟摇杆已停止')
    }
  }
  
  const handleClick = (e: MouseEvent) => {
    // 如果正在显示升级弹窗，处理升级/出售
    if (selectedTurretForUpgrade) {
      import('./turrets').then(({ upgradeTurret, sellTurret }) => {
        const turret = selectedTurretForUpgrade
        const config = TURRET_CONFIGS[turret.type]
        
        // 检查config是否存在
        if (!config) {
          console.error('炮台配置不存在:', turret.type)
          selectedTurretForUpgrade = null
          return
        }
        
        const upgradeInfo = config.upgradePath.find((u: any) => u.level === turret.level + 1)
        
        if (upgradeInfo && state.resources.crystals >= upgradeInfo.cost) {
          upgradeTurret(state, turret)  // 传递turret对象
          playSound('upgrade')
          console.log(`炮台升级到 Lv${turret.level + 1}`)
        } else if (state.turrets.length > 1) {
          sellTurret(state, turret)  // 传递turret对象，而不是turret.id
          playSound('select')
          console.log('炮台已出售')
        }
        
        selectedTurretForUpgrade = null
      })
      return
    }
    
    // 检查是否点击了已有炮台（升级/出售）- 增大点击热区
    if (!state.buildMode.active || (!state.buildMode.selectedTurret && !state.buildMode.selectedTrap)) {
      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      
      for (const turret of state.turrets) {
        const dist = Math.sqrt((turret.x - clickX) ** 2 + (turret.y - clickY) ** 2)
        if (dist < 30) {  // 从20增加到30，更容易点击
          handleTurretClick(turret)
          playSound('upgrade')
          return
        }
      }
    }
    
    // 放置炮台或陷阱
    if (state.buildMode.active) {
      if (state.buildMode.selectedTurret) {
        if (placeTurret(state, mousePos.x, mousePos.y, state.buildMode.selectedTurret!)) {
          playSound('build')
        }
      } else if (state.buildMode.selectedTrap) {
        if (placeTrap(state, mousePos.x, mousePos.y, state.buildMode.selectedTrap!)) {
          playSound('build')
        }
      }
    }
  }
  
  // 处理炮台点击（升级/出售）
  const handleTurretClick = (turret: any) => {
    selectedTurretForUpgrade = turret
    console.log('选中炮台，显示升级/出售选项')
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
    if (state.gameEnded) {
      cleanup()
      setTimeout(onEnd, 2000)
    }
  }
  
  // 渲染函数
  const render = (ctx: CanvasRenderingContext2D, state: any) => {
    console.log('渲染帧 - gameStarted:', state.gameStarted, 'gameEnded:', state.gameEnded)
    
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
    
    // 绘制敌人子弹
    drawEnemyBullets(ctx, state)
    
    // 绘制投射物
    drawProjectiles(ctx, state)
    
    // 绘制玩家
    drawPlayer(ctx, state)
    
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
    
    // 屏幕闪胨效果
    if (state.screenFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${state.screenFlash * 0.3})`
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }
    
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
    // 资源显示
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(10, 10, 120, 80)
    
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('资源', 20, 30)
    
    ctx.font = '12px sans-serif'
    ctx.fillText(`💎 ${state.resources.crystals}`, 20, 50)
    ctx.fillText(`⚡ ${state.resources.energy}`, 20, 65)
    ctx.fillText(`🏆 ${state.resources.score}`, 20, 80)
    
    // 连击显示（右上角）
    if (state.combo.count > 1) {
      const comboSize = Math.min(20 + state.combo.count * 2, 36)
      const comboColor = state.combo.count >= 10 ? '#FFD700' : 
                        state.combo.count >= 5 ? '#FF6B6B' : '#4ECDC4'
      
      ctx.save()
      ctx.shadowColor = comboColor
      ctx.shadowBlur = 10
      ctx.fillStyle = comboColor
      ctx.font = `bold ${comboSize}px sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText(`${state.combo.count} COMBO`, CANVAS_WIDTH - 20, 40)
      
      // 连击计时器条
      const barWidth = 100
      const barHeight = 4
      const timerRatio = state.combo.timer / 2.0
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(CANVAS_WIDTH - 20 - barWidth, 50, barWidth, barHeight)
      ctx.fillStyle = comboColor
      ctx.fillRect(CANVAS_WIDTH - 20 - barWidth, 50, barWidth * timerRatio, barHeight)
      ctx.restore()
    }
    
    // 波次显示
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(CANVAS_WIDTH / 2 - 60, 10, 120, 50)
    
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`第 ${state.wave}/8 波`, CANVAS_WIDTH / 2, 35)
    
    if (!state.buildMode.active && state.breakTime > 0) {
      ctx.fillStyle = '#FFD700'
      ctx.font = '12px sans-serif'
      ctx.fillText(`准备: ${Math.ceil(state.breakTime)}秒`, CANVAS_WIDTH / 2, 50)
    }
    
    // 玩家状态
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(CANVAS_WIDTH - 130, 10, 120, 80)
    
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('角色', CANVAS_WIDTH - 120, 30)
    
    ctx.font = '12px sans-serif'
    ctx.fillText(`❤️ ${state.player.hp}/${state.player.maxHp}`, CANVAS_WIDTH - 120, 50)
    ctx.fillText(`⭐ Lv.${state.player.level}`, CANVAS_WIDTH - 120, 65)
    
    // 连击提示（已合并到上面的连击显示中）
    // if (state.combo.count > 0) {
    //   ctx.fillStyle = '#FF6B6B'
    //   ctx.font = 'bold 12px sans-serif'
    //   ctx.fillText(`🔥 ${state.combo.count} 连击!`, CANVAS_WIDTH - 120, 80)
    // }
    
    // 建造模式：仅显示预览和提示，不遮挡游戏画面
    if (state.buildMode.active) {
      // 右上角建造状态提示
      ctx.fillStyle = 'rgba(78, 205, 196, 0.8)'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'right'
      const selectedName = state.buildMode.selectedTurret || state.buildMode.selectedTrap || '未选择'
      ctx.fillText(`🔨 建造中: ${selectedName} | B退出 | 1-4选炮台`, CANVAS_WIDTH - 15, 30)
      ctx.textAlign = 'left'
      
      // 绘制建造预览
      drawBuildPreview(ctx, state)
    } else {
      // 非建造模式提示
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT - 60, 300, 50)
      
      ctx.fillStyle = '#4ECDC4'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('按 B 键进入建造模式', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30)
    }
    
    // 炮台升级弹窗
    if (selectedTurretForUpgrade) {
      const turret = selectedTurretForUpgrade
      const config = TURRET_CONFIGS[turret.type]
      const upgradeInfo = config.upgradePath.find((u: any) => u.level === turret.level + 1)
        
        if (upgradeInfo) {
          // 显示升级信息
          const boxWidth = 200
          const boxHeight = 120
          const boxX = CANVAS_WIDTH / 2 - boxWidth / 2
          const boxY = CANVAS_HEIGHT / 2 - boxHeight / 2
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
          ctx.fillRect(boxX, boxY, boxWidth, boxHeight)
          ctx.strokeStyle = '#4ECDC4'
          ctx.lineWidth = 2
          ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)
          
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 16px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('🔧 炮台升级', CANVAS_WIDTH / 2, boxY + 30)
          
          ctx.font = '12px sans-serif'
          const turretNames: Record<string, string> = {
            laser: '激光炮台',
            missile: '导弹炮台',
            frost: '冰冻炮台',
            lightning: '闪电炮台'
          }
          ctx.fillText(`${turretNames[turret.type] || '炮台'} Lv${turret.level} → Lv${turret.level + 1}`, CANVAS_WIDTH / 2, boxY + 55)
          
          ctx.fillStyle = upgradeInfo.cost <= state.resources.crystals ? '#FFD700' : '#FF4757'
          ctx.fillText(`费用: ${upgradeInfo.cost}💎`, CANVAS_WIDTH / 2, boxY + 80)
          
          ctx.fillStyle = '#00E676'
          ctx.font = '11px sans-serif'
          ctx.fillText('点击确认升级 | ESC取消', CANVAS_WIDTH / 2, boxY + 105)
        } else {
          // 已满级，显示出售选项
          const boxWidth = 180
          const boxHeight = 100
          const boxX = CANVAS_WIDTH / 2 - boxWidth / 2
          const boxY = CANVAS_HEIGHT / 2 - boxHeight / 2
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
          ctx.fillRect(boxX, boxY, boxWidth, boxHeight)
          ctx.strokeStyle = '#FF6B6B'
          ctx.lineWidth = 2
          ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)
          
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 16px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('🗑️ 出售炮台', CANVAS_WIDTH / 2, boxY + 30)
          
          const sellPrice = Math.floor(config.cost * 0.5)
          ctx.fillStyle = '#FFD700'
          ctx.font = '12px sans-serif'
          ctx.fillText(`回收价格: ${sellPrice}💎`, CANVAS_WIDTH / 2, boxY + 60)
          
          ctx.fillStyle = '#00E676'
          ctx.font = '11px sans-serif'
          ctx.fillText('点击确认出售 | ESC取消', CANVAS_WIDTH / 2, boxY + 85)
        }
    }
    
    // 开始/结束界面
    if (!state.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🏰 RPG塔防射击', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
      
      ctx.font = '16px sans-serif'
      ctx.fillText('建造炮台防御敌人，同时控制角色射击！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
      
      ctx.fillStyle = '#00E676'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText('点击屏幕开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
    }
    
    if (state.gameEnded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
      
      ctx.font = '18px sans-serif'
      ctx.fillText(`到达波次: ${state.wave}/8`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.fillText(`最终得分: ${state.resources.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
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
  
  // 键盘事件 - 开始游戏和建造模式
  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    
    // 保存按键状态（支持WASD移动）
    state.keys[key] = true
    
    if (e.key === ' ' || e.key === 'Enter') {
      if (!state.gameStarted) {
        state.gameStarted = true
        console.log('游戏开始！')
      }
    }
    
    if (key === 'b') {
      if (state.gameStarted && !state.gameEnded) {
        state.buildMode.active = !state.buildMode.active
        if (state.buildMode.active) {
          state.buildMode.selectedTurret = 'laser'  // 默认选择激光炮台
          console.log('进入建造模式 - 激光炮台')
        } else {
          console.log('退出建造模式')
        }
      }
    }
    
    if (e.key === 'Escape') {
      if (selectedTurretForUpgrade) {
        selectedTurretForUpgrade = null
        console.log('取消升级/出售')
      } else {
        state.buildMode.active = false
        state.buildMode.selectedTurret = null
        state.buildMode.selectedTrap = null
        console.log('取消建造')
      }
    }
    
    // 数字键快速切换炮台类型
    if (state.buildMode.active) {
      if (e.key === '1') {
        state.buildMode.selectedTurret = 'laser'
        console.log('切换到激光炮台')
      } else if (e.key === '2') {
        state.buildMode.selectedTurret = 'missile'
        console.log('切换到导弹炮台')
      } else if (e.key === '3') {
        state.buildMode.selectedTurret = 'frost'
        console.log('切换到冰冻炮台')
      } else if (e.key === '4') {
        state.buildMode.selectedTurret = 'lightning'
        console.log('切换到闪电炮台')
      }
    }
  }
  
  const handleKeyUp = (e: KeyboardEvent) => {
    state.keys[e.key.toLowerCase()] = false
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  
  // 点击开始游戏
  const handleStartClick = () => {
    if (!state.gameStarted) {
      state.gameStarted = true
      canvas.removeEventListener('click', handleStartClick)
    }
  }
  
  canvas.addEventListener('click', handleStartClick)
  
  // 初始渲染 - 立即显示开始界面
  render(ctx, state)
  console.log('初始渲染完成')
  
  // 启动游戏循环
  lastTime = performance.now()
  animationId = requestAnimationFrame(gameLoop)
  
  console.log('✅ RPG塔防射击游戏已启动！')
  console.log('📝 操作说明：')
  console.log('  - 鼠标移动：控制角色')
  console.log('  - 按B键：进入/退出建造模式')
  console.log('  - 建造模式下点击：放置炮台')
  console.log('  - ESC键：取消建造')
  console.log('  - 空格/回车：开始游戏')
}
