// RPG塔防射击 - 输入处理模块（重构版）
// 负责所有输入事件：鼠标、触摸（摇杆+点击）、键盘
//
// ⚠️ 这是唯一的输入文件。init.ts 不再包含任何输入逻辑。

import type { GameState } from './types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, TURRET_CONFIGS, WALL_CONFIGS } from './config'
import { placeTurret, placeWall, upgradeTurret, sellTurret, canPlaceWall } from './turrets'
import type { JoystickState, MobileButtons } from './renderer'
import { applyCanvasMobileStyles } from '@shell/utils/canvasMobileUtils'
import {
  bindGameCanvasControls,
  type MobileControlRuntime,
} from '@shell/platform/mobileControls'

// ==================== 类型定义 ====================

export type PlaySoundFn = (type: 'select' | 'build' | 'upgrade' | 'sell' | 'shoot' | 'explosion' | 'hit') => void

/** 输入系统初始化参数 */
export interface InputInitParams {
  canvas: HTMLCanvasElement
  state: GameState
  joystick: JoystickState
  mousePos: { x: number; y: number }
  playSound: PlaySoundFn
  selectedTurretForUpgradeRef: { current: any }
  upgradeDialogPosRef: { current: { x: number; y: number } }
  mobileButtonsRef: { current: MobileButtons | null }
}

// ==================== 常量 ====================
const TOUCH_CLICK_DELAY = 200 // ms — 防止 touch/click 双重触发
const PLACE_DEBOUNCE_MS = 350 // ms — 防止快速连放/双击误放

// ==================== 内部：地图点击处理 ====================

/**
 * 处理游戏内点击事件（PC端 + 触摸端通用）
 * 逻辑：升级/出售按钮 → 选中炮台 → 炮台选择按钮 → 放置炮台
 */
function handleMapClick(
  state: GameState,
  x: number, y: number,
  mousePos: { x: number; y: number },
  playSound: PlaySoundFn,
  selectedTurretForUpgradeRef: { current: any },
  mobileButtonsRef: { current: MobileButtons | null },
  canvas?: HTMLCanvasElement,
  e?: MouseEvent
): void {
  const isFromMouseEvent = !!e

  // ====== 1. 检查升级/出售按钮（仅非建造模式下） ======
  if (!state.buildMode.selectedTurret && state.gameStarted && !state.gameEnded) {
    if (mobileButtonsRef.current) {
      // 升级按钮
      if (mobileButtonsRef.current.upgradeButton) {
        const btn = mobileButtonsRef.current.upgradeButton
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          const success = upgradeTurret(state, btn.turret)
          if (success) {
            playSound('upgrade')
            selectedTurretForUpgradeRef.current = null  // 升级后关闭弹窗
          }
          return
        }
      }

      // 出售按钮
      if (mobileButtonsRef.current.sellButton) {
        const btn = mobileButtonsRef.current.sellButton
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          sellTurret(state, btn.turret)
          selectedTurretForUpgradeRef.current = null
          playSound('sell')
          return
        }
      }
    }

    // ====== 2. 点击已放置的炮台 → 显示升级弹窗（PC端+手机端通用） ======
    if (!state.buildMode.selectedTurret) {
      const clickedTurret = state.turrets.find(t => {
        const dist = Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2)
        return dist < 25
      })

      if (clickedTurret) {
        if (selectedTurretForUpgradeRef.current === clickedTurret) {
        } else {
          selectedTurretForUpgradeRef.current = clickedTurret
          playSound('select')
        }
        return
      } else {
        // 点击空白处取消选中
        selectedTurretForUpgradeRef.current = null
      }
    }

    // ====== 3. PC端标签页切换（MouseEvent 时检查） ======
    if (isFromMouseEvent && canvas && mobileButtonsRef.current?.tabButtons) {
      const rect = canvas.getBoundingClientRect()
      const clickX = (e!.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
      const clickY = (e!.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)

      for (const btn of mobileButtonsRef.current.tabButtons) {
        if (clickX >= btn.x && clickX <= btn.x + btn.w && clickY >= btn.y && clickY <= btn.y + btn.h) {
          if (btn.type === 'turret-tab') {
            state.buildMode.buildTab = 'turret'
            state.buildMode.selectedTurret = null
          } else if (btn.type === 'wall-tab') {
            state.buildMode.buildTab = 'wall'
            state.buildMode.selectedTurret = null
          }
          playSound('select')
          return
        }
      }
    }

    // ====== 4. PC端炮台/城墙选择按钮（MouseEvent 时检查） ======
    if (isFromMouseEvent && canvas && mobileButtonsRef.current) {
      const rect = canvas.getBoundingClientRect()
      const clickX = (e!.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
      const clickY = (e!.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)

      for (const btn of mobileButtonsRef.current.turretButtons) {
        if (clickX >= btn.x && clickX <= btn.x + btn.w && clickY >= btn.y && clickY <= btn.y + btn.h) {
          if (state.buildMode.selectedTurret === btn.type) {
            state.buildMode.selectedTurret = null
          } else {
            state.buildMode.selectedTurret = btn.type
            state.buildMode.selectedTrap = null
          }
          playSound('select')
          return
        }
      }
    }
  }

  // ====== 5. 放置（有选中类型时） ======
  if (state.buildMode.selectedTurret) {
    if (state.buildMode.buildTab === 'wall') {
      tryPlaceWall(state, mousePos, playSound)
    } else {
      tryPlaceTurret(state, mousePos, playSound)
    }
  }
}

/**
 * 尝试放置炮台或城墙（根据 selectedTurret 类型判断）
 */
function tryPlaceTurret(
  state: GameState,
  mousePos: { x: number; y: number },
  playSound: PlaySoundFn
): void {
  const selectedType = state.buildMode.selectedTurret!
  const turretConfig = TURRET_CONFIGS[selectedType]
  const wallConfig = WALL_CONFIGS[selectedType]

  if (turretConfig) {
    // 放置炮台
    const success = placeTurret(state, mousePos.x, mousePos.y, selectedType, 1)
    if (success) {
      playSound('build')
      state.floatTexts.push({
        text: `💎 -${turretConfig.cost}`,
        x: mousePos.x,
        y: mousePos.y - 20,
        life: 1.0,
        color: '#FBBF24',
        size: 12,
        vy: -0.8
      })
      state.buildMode.selectedTurret = null
    } else {
    }
  } else if (wallConfig) {
    // 放置城墙
    const wall = placeWall(state, mousePos.x, mousePos.y, selectedType as any)
    if (wall) {
      playSound('build')
      state.floatTexts.push({
        text: `💎 -${wallConfig.cost}`,
        x: mousePos.x,
        y: mousePos.y - 20,
        life: 1.0,
        color: '#FBBF24',
        size: 12,
        vy: -0.8
      })
      state.buildMode.selectedTurret = null
    } else {
    }
  } else {
    console.error(`❌ 配置不存在: ${selectedType}`)
  }
}

/**
 * 尝试放置城墙
 */
function tryPlaceWall(
  state: GameState,
  mousePos: { x: number; y: number },
  playSound: PlaySoundFn
): void {
  const config = WALL_CONFIGS[state.buildMode.selectedTurret!]
  if (!config) {
    console.error('城墙配置不存在')
    return
  }

  const wall = placeWall(state, mousePos.x, mousePos.y, state.buildMode.selectedTurret! as any)

  if (wall) {
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
  } else {
    const reason = canPlaceWall(state, mousePos.x, mousePos.y, state.buildMode.selectedTurret! as any).reason
  }
}

// ==================== 主入口 ====================

/**
 * 初始化输入系统，注册所有事件监听器
 *
 * @returns cleanup 函数 — 调用后移除所有监听器
 */
export function initInput(params: InputInitParams): () => void {
  const {
    canvas, state, joystick, mousePos, playSound,
    selectedTurretForUpgradeRef, upgradeDialogPosRef, mobileButtonsRef
  } = params

  applyCanvasMobileStyles(canvas)

  let platformControls: MobileControlRuntime | null = bindGameCanvasControls(canvas, {
    gameId: 'rpgShooterTD',
    viewWidth: CANVAS_WIDTH,
    viewHeight: CANVAS_HEIGHT,
    layout: {
      viewWidth: CANVAS_WIDTH,
      viewHeight: CANVAS_HEIGHT,
      buttons: [],
      joystick: {
        x: joystick.baseX,
        y: joystick.baseY,
        radius: joystick.radius,
        knobRadius: joystick.knobRadius,
        deadZone: 0.12,
      },
    },
    onAction: (action, payload) => {
      if (action !== 'move' || payload.source !== 'touch') return
      const dx = payload.stickX ?? 0
      const dy = payload.stickY ?? 0
      const mag = payload.stickMagnitude ?? Math.hypot(dx, dy)
      const active = mag > 0.12
      state.joystick = {
        active,
        dx: active ? dx : 0,
        dy: active ? dy : 0,
        baseX: joystick.baseX,
        baseY: joystick.baseY,
        touchId: null,
      }
      joystick.active = active
      if (active) {
        joystick.currentX = joystick.baseX + dx * joystick.radius
        joystick.currentY = joystick.baseY + dy * joystick.radius
      } else {
        joystick.currentX = joystick.baseX
        joystick.currentY = joystick.baseY
      }
    },
  })

  let lastTouchTime = 0
  let lastPlaceTime = 0           // 上次放置炮台的时间戳
  let touchStartedOnButton = false // 本次触摸是否始于按钮区域
  let touchStartTime = 0          // 本次触摸开始时间（检测快速双击）

  // ---------- 鼠标移动 ----------
  const handleMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    mousePos.x = (e.clientX - rect.left) * scaleX
    mousePos.y = (e.clientY - rect.top) * scaleY
    state.buildMode.previewX = mousePos.x
    state.buildMode.previewY = mousePos.y
  }

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault()
  }

  // ---------- 触摸开始 ----------
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    lastTouchTime = Date.now()
    touchStartedOnButton = false
    touchStartTime = Date.now()

    // 游戏未开始 → 触摸开始游戏
    if (!state.gameStarted) {
      state.gameStarted = true
      return
    }

    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const touchX = touch.clientX - rect.left
    const touchY = touch.clientY - rect.top

    // 更新 mousePos
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    mousePos.x = touchX * scaleX
    mousePos.y = touchY * scaleY

    // 双指 → 切换建造模式
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
      return
    }

    // 1. 炮台按钮区域检测
    // 统一坐标转换（炮台和摇杆共用）
    const btnX = touchX * scaleX
    const btnY = touchY * scaleY

    if (mobileButtonsRef.current) {
      for (const btn of mobileButtonsRef.current.turretButtons) {
        if (btnX >= btn.x && btnX <= btn.x + btn.w && btnY >= btn.y && btnY <= btn.y + btn.h) {
          touchStartedOnButton = true // ✅ 标记：本次触摸始于按钮
          if (state.buildMode.selectedTurret === btn.type) {
            state.buildMode.selectedTurret = null
          } else {
            state.buildMode.selectedTurret = btn.type
            state.buildMode.selectedTrap = null
          }
          playSound('select')
          return
        }
      }
    }

    // 2. 左下摇杆区（platform 处理移动；此处仅避免 touchend 误放塔）
    if (!state.buildMode.selectedTurret) {
      const dx = btnX - joystick.baseX
      const dy = btnY - joystick.baseY
      if (Math.hypot(dx, dy) <= joystick.radius * 1.08) {
        touchStartedOnButton = true
        return
      }
    }

    // 3. 其他触摸 → 地图点击（触摸结束时才执行放置）
  }

  // ---------- 触摸结束 ----------
  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault()

    // 摇杆/按钮区域开始的触摸 → 不做地图放置
    if (touchStartedOnButton) return

    // ✅ 防抖：距上次操作太近则跳过
    if (Date.now() - lastPlaceTime < PLACE_DEBOUNCE_MS) return

    // ✅ 获取触摸释放位置（用于炮台选择/升级检测）
    let releaseX = mousePos.x
    let releaseY = mousePos.y

    if (e.changedTouches.length > 0) {
      const t = e.changedTouches[0]
      const rect = canvas.getBoundingClientRect()
      const sx = CANVAS_WIDTH / rect.width
      const sy = CANVAS_HEIGHT / rect.height
      releaseX = (t.clientX - rect.left) * sx
      releaseY = (t.clientY - rect.top) * sy
    }

    // ====== 手机端触摸结束的统一处理 ======

    // ✅ 智能防抖：已选中炮台→100ms（允许快速连放）；未选中→200ms（防止误触发）
    const placeDebounce = state.buildMode.selectedTurret ? 100 : 200
    if (Date.now() - lastPlaceTime < placeDebounce) return

    // 🔝 最高优先级：直接检测升级/出售按钮（手机端独立处理，绕过 handleMapClick 的复杂逻辑）
    if (mobileButtonsRef.current && !state.buildMode.selectedTurret) {
      const upgBtn = mobileButtonsRef.current.upgradeButton
      if (upgBtn && releaseX >= upgBtn.x && releaseX <= upgBtn.x + upgBtn.w &&
          releaseY >= upgBtn.y && releaseY <= upgBtn.y + upgBtn.h) {
        // 点击了升级按钮
        upgradeTurret(state, upgBtn.turret)
        selectedTurretForUpgradeRef.current = null
        playSound('turretPlace')
        lastPlaceTime = Date.now()
        return
      }

      const sellBtn = mobileButtonsRef.current.sellButton
      if (sellBtn && releaseX >= sellBtn.x && releaseX <= sellBtn.x + sellBtn.w &&
          releaseY >= sellBtn.y && releaseY <= sellBtn.y + sellBtn.h) {
        // 点击了出售按钮
        sellTurret(state, sellBtn.turret)
        selectedTurretForUpgradeRef.current = null
        playSound('sell')
        lastPlaceTime = Date.now()
        return
      }
    }

    // 1️⃣ 未选炮台类型 → 尝试选中已放置的炮台（显示升级弹窗）
    if (!state.buildMode.selectedTurret && state.gameStarted && !state.gameEnded) {
      // 先检查升级/出售按钮
      handleMapClick(state, releaseX, releaseY, mousePos,
        playSound, selectedTurretForUpgradeRef, mobileButtonsRef, canvas)

      // 如果已经通过 handleMapClick 处理了升级按钮或选中了炮台，直接返回
      if (selectedTurretForUpgradeRef.current || state.turrets.some(t => {
        return Math.sqrt((t.x - releaseX)**2 + (t.y - releaseY)**2) < 20
      })) {
        lastPlaceTime = Date.now()
        return
      }

      // 点击空白处 → 取消选中（已在 handleMapClick 内处理）
      return
    }

    // 2️⃣ 已选炮台类型 → 放置新炮台
    if (state.buildMode.selectedTurret && state.gameStarted && !state.gameEnded) {
      tryPlaceTurret(state, mousePos, playSound)
      lastPlaceTime = Date.now()
    }
  }

  // ---------- 鼠标点击 ----------
  const handleClick = (e: MouseEvent) => {
    // 防抖
    if (Date.now() - lastTouchTime < TOUCH_CLICK_DELAY) return

    if (!state.gameStarted) {
      state.gameStarted = true
      return
    }

    const rect = canvas.getBoundingClientRect()
    mousePos.x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
    mousePos.y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)

    // 委托给统一点击处理器（传入 MouseEvent 以支持按钮坐标重算）
    handleMapClick(
      state, mousePos.x, mousePos.y, mousePos,
      playSound, selectedTurretForUpgradeRef, mobileButtonsRef,
      canvas, e
    )
  }

  // ---------- 右键取消 ----------
  const handleRightClick = (e: MouseEvent) => {
    e.preventDefault()
    state.buildMode.active = false
    state.buildMode.selectedTurret = null
  }

  // ========== 注册事件 ==========
  canvas.addEventListener('mousemove', handleMouseMove)
  canvas.addEventListener('click', handleClick)
  canvas.addEventListener('contextmenu', handleRightClick)
  const handleTouchCancel = (e: TouchEvent) => {
    e.preventDefault()
    touchStartedOnButton = false
  }

  canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
  canvas.addEventListener('touchcancel', handleTouchCancel, { passive: false })

  // ========== 清理函数 ==========
  return () => {
    platformControls?.dispose()
    platformControls = null
    canvas.removeEventListener('mousemove', handleMouseMove)
    canvas.removeEventListener('click', handleClick)
    canvas.removeEventListener('contextmenu', handleRightClick)
    canvas.removeEventListener('touchmove', handleTouchMove)
    canvas.removeEventListener('touchstart', handleTouchStart)
    canvas.removeEventListener('touchend', handleTouchEnd)
    canvas.removeEventListener('touchcancel', handleTouchCancel)
  }
}

// ==================== 键盘输入 ====================

/**
 * 初始化键盘输入
 * @returns cleanup 函数
 */
export function initKeyboard(
  state: GameState,
  selectedTurretForUpgradeRef: { current: any }
): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    state.keys[key] = true

    if (e.key === ' ' || e.key === 'Enter') {
      if (!state.gameStarted) {
        state.gameStarted = true
      }
    }

    if (e.key === 'Escape') {
      state.buildMode.selectedTurret = null
      state.buildMode.selectedTrap = null
      selectedTurretForUpgradeRef.current = null
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
