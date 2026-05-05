// RPG塔防射击 - 输入处理模块
// 处理鼠标、触摸、键盘等所有输入事件

import type { GameState } from './types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, TURRET_CONFIGS } from './config'
import { placeTurret, upgradeTurret, sellTurret } from './turrets'

// 虚拟摇杆状态
export interface JoystickState {
  active: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
  radius: number
  knobRadius: number
  dx: number
  dy: number
  touchId: number | null
}

// 按钮区域
export interface ButtonArea {
  x: number
  y: number
  w: number
  h: number
  type?: string
  turret?: any
  value?: number
}

export interface MobileButtons {
  turretButtons: ButtonArea[]
  buildButton: ButtonArea | null
  upgradeButton?: ButtonArea
  sellButton?: ButtonArea
}

// 音效播放函数类型
export type PlaySoundFn = (type: 'select' | 'build' | 'upgrade' | 'sell' | 'shoot' | 'explosion' | 'hit') => void

/**
 * 初始化输入系统
 */
export function initInputSystem(
  canvas: HTMLCanvasElement,
  state: GameState,
  joystick: JoystickState,
  mousePos: { x: number; y: number },
  playSound: PlaySoundFn,
  selectedTurretForUpgradeRef: { current: any },
  upgradeDialogPosRef: { current: { x: number; y: number } },
  mobileButtonsRef: { current: MobileButtons | null }
) {
  // 鼠标移动
  const handleMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    mousePos.x = (e.clientX - rect.left) * scaleX
    mousePos.y = (e.clientY - rect.top) * scaleY
  }

  // 触摸移动
  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    
    if (!joystick.active || joystick.touchId === null) return
    
    const touch = Array.from(e.touches).find(t => t.identifier === joystick.touchId)
    if (!touch) return
    
    const rect = canvas.getBoundingClientRect()
    const touchX = touch.clientX - rect.left
    const touchY = touch.clientY - rect.top
    
    // 计算摇杆偏移
    const maxDist = joystick.radius
    let dx = touchX - joystick.startX
    let dy = touchY - joystick.startY
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist
      dy = (dy / dist) * maxDist
    }
    
    joystick.currentX = joystick.startX + dx
    joystick.currentY = joystick.startY + dy
    joystick.dx = dx / maxDist
    joystick.dy = dy / maxDist
  }

  // 触摸开始
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
    
    // 先检查是否点击了手机按钮区域
    if (mobileButtonsRef.current) {
      const scaleX = CANVAS_WIDTH / rect.width
      const scaleY = CANVAS_HEIGHT / rect.height
      const btnX = touchX * scaleX
      const btnY = touchY * scaleY
      
      // 检查炮台按钮
      for (const btn of mobileButtonsRef.current.turretButtons) {
        if (btnX >= btn.x && btnX <= btn.x + btn.w && btnY >= btn.y && btnY <= btn.y + btn.h) {
          // ✅ 如果点击的是已选中的炮台，取消选择；否则选择该炮台
          if (state.buildMode.selectedTurret === btn.type) {
            state.buildMode.selectedTurret = null
            playSound('select')
            console.log(`❌ 取消选择炮台: ${btn.type}`)
          } else {
            state.buildMode.selectedTurret = btn.type as any
            state.buildMode.selectedTrap = null
            playSound('select')
            console.log(`✅ 选择炮台: ${btn.type}`)
          }
          return
        }
      }
    }
    
    // 检查是否点击了左下角区域（启动虚拟摇杆，排除右下角按钮区域）
    // 摇杆区域：左侧30%宽度 + 底部50%高度（避开右下角炮台按钮）
    const inJoystickZone = touchX < CANVAS_WIDTH * 0.3 && touchY > CANVAS_HEIGHT * 0.5
    // 炮台按钮区域：右下角
    const inTurretZone = touchX > CANVAS_WIDTH * 0.7 && touchY > CANVAS_HEIGHT * 0.5
    if (inJoystickZone && !inTurretZone) {
      // 启动虚拟摇杆
      joystick.active = true
      joystick.startX = touchX
      joystick.startY = touchY
      joystick.currentX = touchX
      joystick.currentY = touchY
      joystick.touchId = touch.identifier
      console.log('虚拟摇杆已激活')
      return
    }
    
    // 其他区域的触摸视为点击
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    mousePos.x = touchX * scaleX
    mousePos.y = touchY * scaleY
    
    // 模拟点击事件
    handleClick({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent)
  }

  // 触摸结束
  const handleTouchEnd = (e: TouchEvent) => {
    if (!joystick.active) return
    
    // 检查是否是摇杆的触摸结束
    const touch = Array.from(e.changedTouches).find(t => t.identifier === joystick.touchId)
    if (touch) {
      joystick.active = false
      joystick.dx = 0
      joystick.dy = 0
      joystick.touchId = null
      console.log('虚拟摇杆已释放')
    }
  }

  // 鼠标点击
  const handleClick = (e: MouseEvent) => {
    // ✅ 游戏未开始时，点击任意位置开始游戏
    if (!state.gameStarted) {
      state.gameStarted = true
      console.log('游戏开始！')
      return
    }
    
    // ✅ 检测是否点击了已放置的炮台（非建造模式下）
    if (!state.buildMode.selectedTurret && state.gameStarted && !state.gameEnded) {
      // ✅ 先检查是否点击了升级/出售按钮
      if (mobileButtonsRef.current) {
        // 检查升级按钮
        if (mobileButtonsRef.current.upgradeButton) {
          const btn = mobileButtonsRef.current.upgradeButton
          if (mousePos.x >= btn.x && mousePos.x <= btn.x + btn.w && 
              mousePos.y >= btn.y && mousePos.y <= btn.y + btn.h) {
            // ✅ 点击了升级按钮 - 执行升级
            const success = upgradeTurret(state, btn.turret)
            if (success) {
              playSound('upgrade')
              console.log(`✅ 炮台升级到 Lv.${btn.turret.level}`)
            }
            return
          }
        }
        
        // 检查出售按钮
        if (mobileButtonsRef.current.sellButton) {
          const btn = mobileButtonsRef.current.sellButton
          if (mousePos.x >= btn.x && mousePos.x <= btn.x + btn.w && 
              mousePos.y >= btn.y && mousePos.y <= btn.y + btn.h) {
            // ✅ 点击了出售按钮 - 执行出售
            sellTurret(state, btn.turret)
            selectedTurretForUpgradeRef.current = null
            playSound('sell')
            console.log(`✅ 炮台已出售，获得 💎${btn.value}`)
            return
          }
        }
      }
      
      // ✅ 检查是否点击了炮台
      const clickedTurret = state.turrets.find((t: any) => {
        const dist = Math.sqrt((t.x - mousePos.x) ** 2 + (t.y - mousePos.y) ** 2)
        return dist < 20
      })
      
      if (clickedTurret) {
        // ✅ 如果点击的是已选中的炮台，关闭弹窗；否则显示新弹窗
        if (selectedTurretForUpgradeRef.current === clickedTurret) {
          selectedTurretForUpgradeRef.current = null
          console.log(`❌ 再次点击同一炮台，关闭弹窗`)
        } else {
          selectedTurretForUpgradeRef.current = clickedTurret
          upgradeDialogPosRef.current = { x: clickedTurret.x, y: clickedTurret.y - 60 }
          playSound('select')
          console.log(`🔍 选中新炮台，显示升级弹窗`)
        }
        return
      } else {
        selectedTurretForUpgradeRef.current = null
        console.log(`❌ 点击空白处，取消选中`)
      }
    }
    
    // 检测PC端底部炮台按钮点击
    if (mobileButtonsRef.current && state.gameStarted && !state.gameEnded) {
      const rect = canvas.getBoundingClientRect()
      const clickX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
      const clickY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
      
      for (const btn of mobileButtonsRef.current.turretButtons) {
        if (clickX >= btn.x && clickX <= btn.x + btn.w && clickY >= btn.y && clickY <= btn.y + btn.h) {
          // ✅ 如果点击的是已选中的炮台，取消选择；否则选择该炮台
          if (state.buildMode.selectedTurret === btn.type) {
            state.buildMode.selectedTurret = null
            playSound('select')
            console.log(`❌ 取消选择炮台: ${btn.type}`)
          } else {
            state.buildMode.selectedTurret = btn.type as any
            playSound('select')
            console.log(`✅ 选择炮台: ${btn.type}`)
          }
          return
        }
      }
    }
    
    // 直接放置炮台
    if (state.buildMode.selectedTurret) {
      const config = TURRET_CONFIGS[state.buildMode.selectedTurret]
      if (!config) {
        console.error('炮台配置不存在')
        return
      }
      
      const success = placeTurret(state, mousePos.x, mousePos.y, state.buildMode.selectedTurret, 1)
      
      if (success) {
        playSound('build')
        
        state.floatTexts.push({
          text: `💎 -${config.cost}`,
          x: mousePos.x,
          y: mousePos.y - 20,
          life: 1.0,
          color: '#FBBF24',
          size: 12,
          vy: -0.8
        })
        
        state.buildMode.selectedTurret = null
        console.log(`炮台放置成功，消耗 ${config.cost} 水晶`)
      } else {
        console.log('水晶不足，无法放置')
        state.floatTexts.push({
          text: '💎 水晶不足',
          x: mousePos.x,
          y: mousePos.y - 20,
          life: 1.5,
          color: '#FF4757',
          size: 14,
          vy: -0.5
        })
      }
    }
  }

  // 右键点击
  const handleRightClick = (e: MouseEvent) => {
    e.preventDefault()
    state.buildMode.active = false
    state.buildMode.selectedTurret = null
  }

  // 注册事件监听器
  canvas.addEventListener('mousemove', handleMouseMove)
  canvas.addEventListener('click', handleClick)
  canvas.addEventListener('contextmenu', handleRightClick)
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

  // 返回清理函数
  return () => {
    canvas.removeEventListener('mousemove', handleMouseMove)
    canvas.removeEventListener('click', handleClick)
    canvas.removeEventListener('contextmenu', handleRightClick)
    canvas.removeEventListener('touchmove', handleTouchMove)
    canvas.removeEventListener('touchstart', handleTouchStart)
    canvas.removeEventListener('touchend', handleTouchEnd)
  }
}

/**
 * 初始化键盘输入
 */
export function initKeyboardInput(
  state: GameState,
  selectedTurretForUpgradeRef: { current: any }
) {
  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    state.keys[key] = true
    
    if (e.key === ' ' || e.key === 'Enter') {
      if (!state.gameStarted) {
        state.gameStarted = true
        console.log('游戏开始！')
      }
    }
    
    // ✅ ESC键：取消选中
    if (e.key === 'Escape') {
      state.buildMode.selectedTurret = null
      state.buildMode.selectedTrap = null
      selectedTurretForUpgradeRef.current = null
      console.log('已取消选中')
    }
  }
  
  const handleKeyUp = (e: KeyboardEvent) => {
    state.keys[e.key.toLowerCase()] = false
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)

  return () => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  }
}
