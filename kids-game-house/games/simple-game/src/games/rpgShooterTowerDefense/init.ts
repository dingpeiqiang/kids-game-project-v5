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
  const playSound = (type: 'select' | 'build' | 'upgrade' | 'sell' | 'shoot' | 'explosion' | 'hit') => {
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
        case 'sell':
          oscillator.frequency.value = 500
          oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.15)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.15)
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
  
  // ✅ 移动端全屏适配（参考 dragonShooter）
  const isMobile = window.innerWidth < 768 || 'ontouchstart' in window
  
  if (isMobile) {
    // 创建 wrapper 容器
    const wrapper = document.createElement('div')
    wrapper.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      touch-action: none;
      margin: 0;
      padding: 0;
      z-index: 1;
    `
    
    // Canvas 绝对定位，通过 transform scale 实现 FIT 模式
    canvas.style.position = 'absolute'
    canvas.style.top = '0px'
    canvas.style.left = '0px'
    
    const updateCanvasScale = () => {
      const windowWidth = window.visualViewport?.width ?? window.innerWidth
      const windowHeight = window.visualViewport?.height ?? window.innerHeight
      
      // 以游戏内容区为基准计算缩放（类似 Phaser Scale.FIT）
      const scaleX = windowWidth / CANVAS_WIDTH
      const scaleY = windowHeight / CANVAS_HEIGHT
      const scale = Math.min(scaleX, scaleY)
      
      const scaledW = CANVAS_WIDTH * scale
      const scaledH = CANVAS_HEIGHT * scale
      
      // 居中显示
      canvas.style.left = ((windowWidth - scaledW) / 2) + 'px'
      canvas.style.top = ((windowHeight - scaledH) / 2) + 'px'
      canvas.style.transform = `scale(${scale})`
      canvas.style.transformOrigin = '0 0'
    }
    
    updateCanvasScale()
    window.visualViewport?.addEventListener('resize', updateCanvasScale)
    window.addEventListener('resize', updateCanvasScale)
    
    // 将 Canvas 移动到 wrapper 中
    const parent = canvas.parentNode
    if (parent) {
      parent.removeChild(canvas)
      wrapper.appendChild(canvas)
      parent.appendChild(wrapper)
    }
    
    // 防止移动端滚动和缩放
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    
    // 保存清理函数
    ;(window as any)._rpgTowerDefenseResizeHandler = () => {
      window.visualViewport?.removeEventListener('resize', updateCanvasScale)
      window.removeEventListener('resize', updateCanvasScale)
    }
  } else {
    // 桌面端：设置Canvas的CSS样式，确保显示尺寸与逻辑尺寸一致
    canvas.style.width = `${CANVAS_WIDTH}px`
    canvas.style.height = `${CANVAS_HEIGHT}px`
    canvas.style.display = 'block'
    canvas.style.margin = '0 auto'  // 居中显示
  }
  
  console.log(`Canvas 尺寸: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`)
  
  // 创建游戏状态
  const state = createInitialState()
  console.log('游戏状态已创建', state)
  let animationId: number
  let mobileButtons: any = null
  let lastTime = performance.now()
  
  // 鼠标位置
  const mousePos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
  
  // ✅ 防止手机端 touch 和 click 事件重复触发
  let lastTouchTime = 0
  const TOUCH_CLICK_DELAY = 500  // 500ms 内的 click 视为重复
  
  // ✅ 选中的炮台（用于显示选中效果和升级弹窗）
  let selectedTurretForUpgrade: any = null
  let upgradeDialogPos = { x: 0, y: 0 }  // 升级弹窗位置
  
  // ✅ 手机端虚拟摇杆（固定位置）
  const joystick = {
    active: false,
    baseX: CANVAS_WIDTH * 0.15,  // ✅ 固定在左侧15%位置
    baseY: CANVAS_HEIGHT * 0.85, // ✅ 固定在底部85%位置
    currentX: CANVAS_WIDTH * 0.15,
    currentY: CANVAS_HEIGHT * 0.85,
    radius: 50,   // 摇杆半径
    knobRadius: 22, // 摇杆钮半径
    touchId: null as number | null  // 跟踪触摸ID
  }
  
  // 建造模式状态扩展
  state.buildMode.active = false
  state.buildMode.selectedTurret = null
  state.buildMode.buildTab = 'turret' as 'turret' | 'trap'
  
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
      
      // ✅ 计算摇杆偏移量（相对于固定基点）
      const dx = joystick.currentX - joystick.baseX
      const dy = joystick.currentY - joystick.baseY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // 限制在摇杆半径内
      if (distance > joystick.radius) {
        const ratio = joystick.radius / distance
        joystick.currentX = joystick.baseX + dx * ratio
        joystick.currentY = joystick.baseY + dy * ratio
      }
      
      // ✅ 计算归一化的方向向量（-1 到 1）
      const normalizedDx = (joystick.currentX - joystick.baseX) / joystick.radius
      const normalizedDy = (joystick.currentY - joystick.baseY) / joystick.radius
      
      // ✅ 更新 state.joystick，用于玩家移动
      state.joystick = {
        active: true,
        dx: normalizedDx,
        dy: normalizedDy,
        baseX: joystick.baseX,
        baseY: joystick.baseY,
        touchId: joystick.touchId
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
      
      // ✅ 清除摇杆状态
      state.joystick = { active: false, dx: 0, dy: 0, baseX: 0, baseY: 0, touchId: null }
    }
  }
  
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    
    // ✅ 记录触摸时间，用于防止 click 重复触发
    lastTouchTime = Date.now()
    
    // ✅ 游戏未开始时，触摸任意位置开始游戏
    if (!state.gameStarted) {
      state.gameStarted = true
      console.log('🎮 游戏开始！')
      return
    }
    
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
    
    // ✅ 更新 mousePos（用于放置炮台等逻辑）
    // ⚠️ 重要：全屏模式下，Canvas 通过 transform scale 缩放并居中
    // rect.left/top 包含了偏移量，必须减去
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    mousePos.x = touchX * scaleX
    mousePos.y = touchY * scaleY
    
    console.log(`📱 触摸调试: client=(${touch.clientX.toFixed(0)}, ${touch.clientY.toFixed(0)}), rect=(${rect.left.toFixed(0)}, ${rect.top.toFixed(0)}, ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}), canvas=(${mousePos.x.toFixed(0)}, ${mousePos.y.toFixed(0)})`)
    
    // 先检查是否点击了手机按钮区域（炮台选择、建造按钮）
    if (mobileButtons) {
      const scaleX = CANVAS_WIDTH / rect.width
      const scaleY = CANVAS_HEIGHT / rect.height
      const btnX = touchX * scaleX
      const btnY = touchY * scaleY
      
      // 检查炮台按钮
      for (const btn of mobileButtons.turretButtons) {
        if (btnX >= btn.x && btnX <= btn.x + btn.w && btnY >= btn.y && btnY <= btn.y + btn.h) {
          // ✅ 如果点击的是已选中的炮台，取消选择；否则选择该炮台
          if (state.buildMode.selectedTurret === btn.type) {
            state.buildMode.selectedTurret = null
            playSound('select')
            console.log(`❌ 取消选择炮台: ${btn.type}`)
          } else {
            state.buildMode.selectedTurret = btn.type
            state.buildMode.selectedTrap = null
            playSound('select')
            console.log(`✅ 选择炮台: ${btn.type}`)
          }
          return
        }
      }
      
      // 检查建造/退出按钮（已移除，不再需要）
      // const bBtn = mobileButtons.buildButton
      // if (bBtn && btnX >= bBtn.x && btnX <= bBtn.x + bBtn.w && btnY >= bBtn.y && btnY <= bBtn.y + bBtn.h) {
      //   state.buildMode.active = !state.buildMode.active
      //   if (!state.buildMode.active) {
      //     state.buildMode.selectedTurret = null
      //     state.buildMode.selectedTrap = null
      //   }
      //   playSound('select')
      //   console.log(`建造模式: ${state.buildMode.active}`)
      //   return
      // }
    }
    
    // ✅ 检查是否点击了虚拟摇杆区域（以固定位置为中心）
    // 只有在非建造模式下才启用摇杆，避免与放置炮台冲突
    if (!state.buildMode.selectedTurret) {
      const dx = touchX - joystick.baseX
      const dy = touchY - joystick.baseY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // ✅ 如果触摸点在摇杆范围内（半径+20px容差），激活摇杆
      if (distance < joystick.radius + 20) {
        joystick.active = true
        joystick.touchId = touch.identifier
        joystick.currentX = touchX
        joystick.currentY = touchY
        console.log('🕹️ 虚拟摇杆已激活')
        return
      }
    }
    
    // 其他区域的触摸视为点击
    // mousePos 已经在前面更新过了
    console.log(`📱 触摸位置: (${touchX.toFixed(0)}, ${touchY.toFixed(0)}) -> Canvas: (${mousePos.x.toFixed(0)}, ${mousePos.y.toFixed(0)})`)
    
    // ✅ 直接执行 handleClick 的逻辑（不创建 MouseEvent）
    // 注意：由于 handleTouchStart 已经记录了 lastTouchTime
    // handleClick 中的防抖检查会跳过，所以我们需要在这里直接处理
  }
  
  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault()
    
    // 停止虚拟摇杆
    if (joystick.active) {
      joystick.active = false
      // ✅ 清除 state.joystick 状态
      state.joystick = { active: false, dx: 0, dy: 0, baseX: 0, baseY: 0, touchId: null }
    }
    
    // 检测手机按钮点击
    if (mobileButtons) {
      const touch = e.changedTouches[0]
      const rect = canvas.getBoundingClientRect()
      const tx = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
      const ty = (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
      
      // 检查炮台按钮
      for (const btn of mobileButtons.turretButtons) {
        if (tx >= btn.x && tx <= btn.x + btn.w && ty >= btn.y && ty <= btn.y + btn.h) {
          state.buildMode.selectedTurret = btn.type
          playSound('select')
          console.log(`选择炮台: ${btn.type}`)
          return
        }
      }
      
      // 检查建造/退出按钮（已移除，不再需要）
      // const buildBtn = mobileButtons.buildButton
      // if (buildBtn && tx >= buildBtn.x && tx <= buildBtn.x + buildBtn.w && ty >= buildBtn.y && ty <= buildBtn.y + buildBtn.h) {
      //   state.buildMode.active = !state.buildMode.active
      //   if (state.buildMode.active) {
      //     state.buildMode.selectedTurret = state.buildMode.selectedTurret || 'laser'
      //   }
      //   return
      // }
    }
    
    // ✅ 如果选择了炮台类型，点击地图放置炮台
    if (state.buildMode.selectedTurret && state.gameStarted && !state.gameEnded) {
      const config = TURRET_CONFIGS[state.buildMode.selectedTurret]
      if (!config) {
        console.error('炮台配置不存在')
        return
      }
      
      // 使用 mousePos（在 handleTouchStart 中已更新）
      const success = placeTurret(state, mousePos.x, mousePos.y, state.buildMode.selectedTurret, 1)
      
      if (success) {
        playSound('build')
        
        // 显示消耗提示
        state.floatTexts.push({
          text: `💎 -${config.cost}`,
          x: mousePos.x,
          y: mousePos.y - 20,
          life: 1.0,
          color: '#FBBF24',
          size: 12,
          vy: -0.8
        })
        
        // ✅ 放置后清除选中状态
        state.buildMode.selectedTurret = null
        console.log(`📱 炮台放置成功，消耗 ${config.cost} 水晶`)
      } else {
        console.log('📱 炮台放置失败')
      }
    }
  }
  
  const handleClick = (e: MouseEvent) => {
    // ✅ 防止手机端 touch 和 click 重复触发
    const now = Date.now()
    if (now - lastTouchTime < TOUCH_CLICK_DELAY) {
      console.log('⚠️ 忽略重复的 click 事件（由 touch 触发）')
      return
    }
    
    // ✅ 游戏未开始时，点击任意位置开始游戏
    if (!state.gameStarted) {
      state.gameStarted = true
      console.log('游戏开始！')
      return
    }
    
    // ✅ 检测是否点击了已放置的炮台（非建造模式下）
    if (!state.buildMode.selectedTurret && state.gameStarted && !state.gameEnded) {
      // ✅ 先检查是否点击了升级/出售按钮
      if (mobileButtons) {
        // 检查升级按钮
        if (mobileButtons.upgradeButton) {
          const btn = mobileButtons.upgradeButton
          if (mousePos.x >= btn.x && mousePos.x <= btn.x + btn.w && 
              mousePos.y >= btn.y && mousePos.y <= btn.y + btn.h) {
            // ✅ 点击了升级按钮 - 执行升级
            const success = upgradeTurret(state, btn.turret)
            if (success) {
              playSound('upgrade')
              console.log(`✅ 炮台升级到 Lv.${btn.turret.level}`)
              // ✅ 升级成功后关闭弹窗
              selectedTurretForUpgrade = null
            }
            return  // ✅ 重要：升级后直接返回，不再执行后续逻辑
          }
        }
        
        // 检查出售按钮
        if (mobileButtons.sellButton) {
          const btn = mobileButtons.sellButton
          if (mousePos.x >= btn.x && mousePos.x <= btn.x + btn.w && 
              mousePos.y >= btn.y && mousePos.y <= btn.y + btn.h) {
            // ✅ 点击了出售按钮 - 执行出售
            sellTurret(state, btn.turret)
            selectedTurretForUpgrade = null  // 出售后取消选中
            playSound('sell')
            console.log(`✅ 炮台已出售，获得 💎${btn.value}`)
            return  // ✅ 重要：出售后直接返回
          }
        }
      }
      
      // ✅ 检查是否点击了炮台（只有在没有点击按钮时才执行）
      const clickedTurret = state.turrets.find(t => {
        const dist = Math.sqrt((t.x - mousePos.x) ** 2 + (t.y - mousePos.y) ** 2)
        return dist < 20  // 点击半径20像素
      })
      
      if (clickedTurret) {
        // ✅ 如果点击的是已选中的炮台，保持弹窗打开（不关闭）
        // 用户可以通过点击空白处、按ESC或点击其他炮台来关闭弹窗
        if (selectedTurretForUpgrade === clickedTurret) {
          // 点击同一个炮台，保持选中状态，不执行任何操作
          console.log(`ℹ️ 炮台已选中，弹窗保持打开`)
        } else {
          // 点击新炮台，显示新弹窗
          selectedTurretForUpgrade = clickedTurret
          playSound('select')
          console.log(`🔍 选中新炮台，显示升级弹窗`)
        }
        return
      } else {
        // 点击空白处，取消选中
        selectedTurretForUpgrade = null
        console.log(`❌ 点击空白处，取消选中`)
      }
    }
    
    // 检测PC端底部炮台按钮点击（与手机端相同逻辑）
    if (mobileButtons && state.gameStarted && !state.gameEnded) {
      const rect = canvas.getBoundingClientRect()
      const clickX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
      const clickY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
      
      // 检查炮台按钮
      for (const btn of mobileButtons.turretButtons) {
        if (clickX >= btn.x && clickX <= btn.x + btn.w && clickY >= btn.y && clickY <= btn.y + btn.h) {
          // ✅ 如果点击的是已选中的炮台，取消选择；否则选择该炮台
          if (state.buildMode.selectedTurret === btn.type) {
            state.buildMode.selectedTurret = null
            playSound('select')
            console.log(`❌ 取消选择炮台: ${btn.type}`)
          } else {
            state.buildMode.selectedTurret = btn.type
            playSound('select')
            console.log(`✅ 选择炮台: ${btn.type}`)
          }
          return
        }
      }
    }
    
    // 直接放置炮台（不需要建造模式，只要有选中的炮台类型且有足够水晶）
    if (state.buildMode.selectedTurret) {
      const config = TURRET_CONFIGS[state.buildMode.selectedTurret]
      if (!config) {
        console.error('炮台配置不存在')
        return
      }
      
      // ✅ 调用 placeTurret 函数，它会自动处理扣费和放置
      const success = placeTurret(state, mousePos.x, mousePos.y, state.buildMode.selectedTurret, 1)
      
      if (success) {
        playSound('build')
        
        // 显示消耗提示
        state.floatTexts.push({
          text: `💎 -${config.cost}`,
          x: mousePos.x,
          y: mousePos.y - 20,
          life: 1.0,
          color: '#FBBF24',
          size: 12,
          vy: -0.8
        })
        
        // ✅ 放置后清除选中状态
        state.buildMode.selectedTurret = null
        console.log(`炮台放置成功，消耗 ${config.cost} 水晶`)
      } else {
        // placeTurret 已经显示了错误提示（如水晶不足、位置无效等）
        console.log('炮台放置失败')
      }
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
    // 清空画布
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // ✅ 设置裁剪区域，防止游戏元素绘制到边界外留下残影
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.clip()
    
    // 应用屏幕震动
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
      // ✅ 检查是否是选中的炮台
      const isSelected = selectedTurretForUpgrade === turret
      drawTurret(ctx, turret, isSelected)
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
    
    // ✅ 恢复裁剪和震动状态
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
    
    // 只在游戏进行中显示UI面板
    if (!state.gameStarted || state.gameEnded) {
      return
    }
    
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
    
    // ========== 升级弹窗 ==========
    if (selectedTurretForUpgrade && state.gameStarted && !state.gameEnded) {
      const turret = selectedTurretForUpgrade
      const config = TURRET_CONFIGS[turret.type]
      const nextUpgrade = config.upgradePath.find(u => u.level === turret.level + 1)
      
      // ✅ 计算弹窗位置（确保不超出屏幕，且不遮挡炮台）
      const dialogW = 160
      const dialogH = nextUpgrade ? 75 : 50
      
      // ✅ 智能定位：优先显示在炮台右上方，如果空间不够则显示在左上方
      let dialogX = turret.x + 30  // 默认右侧偏移30像素
      let dialogY = turret.y - dialogH - 20  // 炮台上方20像素
      
      // 如果右侧空间不够，切换到左侧
      if (dialogX + dialogW > CANVAS_WIDTH - 10) {
        dialogX = turret.x - dialogW - 30  // 左侧偏移30像素
      }
      
      // 如果上方空间不够，显示在下方
      if (dialogY < 10) {
        dialogY = turret.y + 40  // 炮台下方40像素
      }
      
      // 边界检查（确保完全在屏幕内）
      if (dialogX < 10) dialogX = 10
      if (dialogX + dialogW > CANVAS_WIDTH - 10) dialogX = CANVAS_WIDTH - dialogW - 10
      if (dialogY < 10) dialogY = 10
      if (dialogY + dialogH > CANVAS_HEIGHT - 10) dialogY = CANVAS_HEIGHT - dialogH - 10
      
      // 弹窗背景
      ctx.fillStyle = 'rgba(15, 25, 45, 0.98)'
      drawRoundedRect(dialogX, dialogY, dialogW, dialogH, 8)  // 圆角从 12 改为 8
      ctx.fill()
      ctx.strokeStyle = '#4ECDC4'
      ctx.lineWidth = 2
      ctx.stroke()
      
      // 炮台信息
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px sans-serif'  // 字体从 13 改为 11
      ctx.textAlign = 'center'
      const typeNames: Record<string, string> = { laser: '激光', missile: '导弹', frost: '冰冻', lightning: '闪电' }
      ctx.fillText(`${typeNames[turret.type]} Lv.${turret.level}`, dialogX + dialogW / 2, dialogY + 18)
      
      if (nextUpgrade) {
        // 升级信息
        ctx.fillStyle = '#FBBF24'
        ctx.font = '10px sans-serif'  // 字体从 11 改为 10
        ctx.fillText(`💎 ${nextUpgrade.cost}`, dialogX + dialogW / 2, dialogY + 35)
        
        // ✅ 升级按钮 - 缩小
        const btnW = 60  // 从 70 改为 60
        const btnH = 24  // 从 28 改为 24
        const btnX = dialogX + 12
        const btnY = dialogY + 45
        
        const canAfford = state.resources.crystals >= nextUpgrade.cost
        ctx.fillStyle = canAfford ? '#4ECDC4' : '#6B7280'
        drawRoundedRect(btnX, btnY, btnW, btnH, 5)
        ctx.fill()
        
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 10px sans-serif'  // 字体从 11 改为 10
        ctx.fillText('⬆️升级', btnX + btnW / 2, btnY + 16)
        
        // ✅ 出售按钮 - 缩小
        const sellBtnX = dialogX + dialogW - 72  // 调整位置
        const sellValue = Math.floor(config.cost * 0.5)
        ctx.fillStyle = '#EF4444'
        drawRoundedRect(sellBtnX, btnY, btnW, btnH, 5)
        ctx.fill()
        
        ctx.fillStyle = '#fff'
        ctx.fillText('💰出售', sellBtnX + btnW / 2, btnY + 16)
        
        // 保存按钮区域用于点击检测
        if (!mobileButtons) mobileButtons = { turretButtons: [], buildButton: null }
        mobileButtons.upgradeButton = { x: btnX, y: btnY, w: btnW, h: btnH, turret, type: 'upgrade' }
        mobileButtons.sellButton = { x: sellBtnX, y: btnY, w: btnW, h: btnH, turret, type: 'sell', value: sellValue }
      } else {
        // 已满级提示
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('⭐ 已满级', dialogX + dialogW / 2, dialogY + 30)
        
        // 只显示出售按钮
        const btnW = 60
        const btnH = 24
        const btnX = dialogX + (dialogW - btnW) / 2
        const btnY = dialogY + 36
        const sellValue = Math.floor(config.cost * 0.5)
        
        ctx.fillStyle = '#EF4444'
        drawRoundedRect(btnX, btnY, btnW, btnH, 5)
        ctx.fill()
        
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 10px sans-serif'
        ctx.fillText('💰出售', btnX + btnW / 2, btnY + 16)
        
        // 保存按钮区域
        if (!mobileButtons) mobileButtons = { turretButtons: [], buildButton: null }
        mobileButtons.sellButton = { x: btnX, y: btnY, w: btnW, h: btnH, turret, type: 'sell', value: sellValue }
      }
    }
    
    // ========== 手机端建造按钮面板 ==========
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window)
    
    if (state.gameStarted && !state.gameEnded) {
      // 炮台类型和按钮配置（手机端和PC端共用）
      const turretTypes = ['laser', 'missile', 'frost', 'lightning']
      // ✅ 使用更独特的图标
      const turretIcons: Record<string, string> = { 
        laser: '🔵',      // 蓝色圆圈 - 激光
        missile: '🚀',    // 火箭 - 导弹
        frost: '❄️',      // 雪花 - 冰冻
        lightning: '⚡'   // 闪电 - 闪电
      }
      const turretNames: Record<string, string> = { laser: '激光', missile: '导弹', frost: '冰冻', lightning: '闪电' }
      // ✅ 每种炮台的按钮颜色
      const turretColors: Record<string, string> = {
        laser: '#00D9FF',
        missile: '#FF6B6B',
        frost: '#7FDBFF',
        lightning: '#FFD700'
      }
      const btnW = 58, btnH = 38, btnGap = 6
      
      if (isMobile) {
        // ✅ 手机端：底部炮台选择面板（上移，避免与摇杆冲突）
        const btnPanelW = 340
        const btnPanelH = 55
        const btnPanelX = (CANVAS_WIDTH - btnPanelW) / 2
        const btnPanelY = CANVAS_HEIGHT - btnPanelH - 80  // ✅ 从40改为80，上移40像素
        
        // ✅ 增加不透明度，避免底部出现颜色痕迹
        drawPanel(btnPanelX, btnPanelY, btnPanelW, btnPanelH, 'rgba(10, 20, 35, 0.98)')
        
        const startX = btnPanelX + 8
        const btnY = btnPanelY + (btnPanelH - btnH) / 2
        
        turretTypes.forEach((type, i) => {
          const bx = startX + i * (btnW + btnGap)
          const isSelected = state.buildMode.selectedTurret === type
          
          // ✅ 使用炮台对应的颜色
          const baseColor = turretColors[type]
          ctx.fillStyle = isSelected ? `${baseColor}CC` : 'rgba(255, 255, 255, 0.08)'  // CC = 80% 透明度
          ctx.beginPath()
          ctx.roundRect(bx, btnY, btnW, btnH, 8)
          ctx.fill()
          
          ctx.strokeStyle = isSelected ? baseColor : 'rgba(255,255,255,0.2)'
          ctx.lineWidth = isSelected ? 3 : 1
          ctx.stroke()
          
          // ✅ 图标使用对应颜色
          ctx.fillStyle = isSelected ? '#fff' : baseColor
          ctx.font = '14px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(turretIcons[type], bx + btnW / 2, btnY + 15)
          
          ctx.fillStyle = isSelected ? '#fff' : '#9CA3AF'
          ctx.font = '8px sans-serif'
          ctx.fillText(turretNames[type], bx + btnW / 2, btnY + 28)
          
          // 显示水晶消耗
          const costs: Record<string, number> = { laser: 40, missile: 80, frost: 50, lightning: 120 }
          ctx.fillStyle = isSelected ? '#fff' : '#FBBF24'
          ctx.font = 'bold 7px sans-serif'
          ctx.fillText(`💎${costs[type]}`, bx + btnW / 2, btnY + 38)
        })
        
        // 保存按钮区域用于触摸检测
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
        const pcPanelW = turretTypes.length * (btnW + btnGap) + btnGap * 2 + 20
        const pcPanelX = (CANVAS_WIDTH - pcPanelW) / 2
        const pcPanelY = CANVAS_HEIGHT - btnH - 20
        
        // PC端面板（始终显示，让PC用户也能点击选择）
        // ✅ 增加不透明度，避免底部出现颜色痕迹
        drawPanel(pcPanelX, pcPanelY, pcPanelW, btnH + 16, 'rgba(15, 25, 45, 0.95)')
        
        // 炮台选择按钮
        turretTypes.forEach((type, i) => {
          const bx = pcPanelX + btnGap + i * (btnW + btnGap)
          const selected = state.buildMode.selectedTurret === type
          
          // ✅ 使用统一的炮台颜色
          const baseColor = turretColors[type]
          const icons: Record<string, string> = { laser: '🔵', missile: '🚀', frost: '❄️', lightning: '⚡' }
          
          // 按钮背景
          ctx.fillStyle = selected ? `${baseColor}CC` : 'rgba(255,255,255,0.1)'
          drawRoundedRect(bx, pcPanelY + 8, btnW, btnH, 6)
          ctx.fill()
          if (selected) {
            ctx.strokeStyle = baseColor
            ctx.lineWidth = 3
            ctx.stroke()
          }
          
          // 按钮内容 - 图标使用对应颜色
          ctx.fillStyle = selected ? '#fff' : baseColor
          ctx.font = '11px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(icons[type], bx + btnW / 2, pcPanelY + 22)
          
          ctx.fillStyle = selected ? '#fff' : '#9CA3AF'
          ctx.font = '8px sans-serif'
          const names: Record<string, string> = { laser: '激光', missile: '导弹', frost: '冰冻', lightning: '闪电' }
          ctx.fillText(names[type], bx + btnW / 2, pcPanelY + 36)
          
          // 显示水晶消耗
          const costs: Record<string, number> = { laser: 40, missile: 80, frost: 50, lightning: 120 }
          ctx.fillStyle = selected ? '#fff' : '#FBBF24'
          ctx.font = 'bold 7px sans-serif'
          ctx.fillText(`💎${costs[type]}`, bx + btnW / 2, pcPanelY + 48)
          
          // 保存PC按钮区域
          if (!mobileButtons) mobileButtons = { turretButtons: [], buildButton: null }
          mobileButtons.turretButtons.push({ type, x: bx, y: pcPanelY + 8, w: btnW, h: btnH })
        })
        
        // PC端提示
        if (state.buildMode.selectedTurret) {
          ctx.fillStyle = '#4ECDC4'
          ctx.font = '9px sans-serif'
          ctx.textAlign = 'center'
          const sel = state.buildMode.selectedTurret || '激光'
          ctx.fillText(`已选: ${sel} | 点击地图放置 | ESC取消`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8)
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.5)'
          ctx.font = '9px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('点击底部按钮选择炮台类型', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8)
        }
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
          // ✅ 摇杆底座（固定位置）
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(joystick.baseX, joystick.baseY, joystick.radius, 0, Math.PI * 2)
          ctx.stroke()
          
          // ✅ 摇杆钮
          ctx.fillStyle = 'rgba(78, 205, 196, 0.6)'
          ctx.beginPath()
          ctx.arc(joystick.currentX, joystick.currentY, joystick.knobRadius, 0, Math.PI * 2)
          ctx.fill()
          
          // ✅ 摇杆提示文字
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
          ctx.font = `${10 * SCALE_RATIO}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText('移动', joystick.baseX, joystick.baseY + joystick.radius + 15)
        } else {
          // ✅ 未激活时显示提示（固定位置）
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
          ctx.font = `${10 * SCALE_RATIO}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText('👆 触摸此处移动', joystick.baseX, joystick.baseY + joystick.radius + 15)
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
    
    // ✅ 移动端：恢复 body 样式和移除 resize 监听器
    if (isMobile) {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
      
      const resizeHandler = (window as any)._rpgTowerDefenseResizeHandler
      if (resizeHandler) {
        window.visualViewport?.removeEventListener('resize', resizeHandler)
        window.removeEventListener('resize', resizeHandler)
        delete (window as any)._rpgTowerDefenseResizeHandler
      }
    }
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
    
    // ✅ ESC键：取消选中（包括建造模式和升级弹窗）
    if (e.key === 'Escape') {
      state.buildMode.selectedTurret = null
      state.buildMode.selectedTrap = null
      selectedTurretForUpgrade = null  // ✅ 关闭升级弹窗
      console.log('已取消选中')
    }
    
    // 注意：PC端现在通过点击底部按钮选择炮台类型，不再使用数字键
  }
  
  const handleKeyUp = (e: KeyboardEvent) => {
    state.keys[e.key.toLowerCase()] = false
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  
  // ✅ 点击事件已整合到 handleClick 中，无需单独的 handleStartClick
  
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