// RPG Shooter 塔防融合版 - 初始化入口（重构版）
//
// ⚠️ 本文件只负责：Canvas初始化 → 状态创建 → 模块组装 → 游戏循环
// 所有具体逻辑已迁移到对应模块文件：
//   - 渲染 → renderer.ts
//   - 输入 → input.ts
//   - 逻辑更新 → gameLoop.ts
//   - 音效 → sounds.ts

import type { GameEngine } from '@shell/services/gameEngine'
import { gameActions } from '@shell/platform/gameBridge'
import type { GameLifecycle } from '@shell/platform/GameLifecycle'
import { createLifecycleContext } from '@shell/platform/frameworkSession'
import { hostCanvas2D } from '@shell/platform/hostCanvas2D'
import { createInitialState, resetCombo } from './state'
import { CANVAS_WIDTH, CANVAS_HEIGHT, TURRET_CONFIGS, initCanvasSize } from './config'
import { apiSubmitGameResult, apiStartGameSession } from '@shell/services/apiClient'
import { userService } from '@shell/services/userService'

// 重构后的模块
import { render } from './renderer'
import { updateGame } from './gameLoop'
import { initInput, initKeyboard, type PlaySoundFn } from './input'
import type { JoystickState, MobileButtons } from './renderer'

let activeHost: GameLifecycle | null = null

export function destroyRpgShooterTD(): void {
  activeHost?.destroy()
  activeHost = null
}

export function initRpgShooterTD(engine: GameEngine, onEnd: () => void) {
  destroyRpgShooterTD()
  const lifecycleCtx = createLifecycleContext('rpgShooterTD', engine, onEnd)
  if (!lifecycleCtx?.canvas) {
    onEnd()
    return
  }


  // 🎯 游戏会话管理
  let sessionId: number | null = null
  let sessionToken: string | null = null
  let gameStartTime = Date.now()

  // ==================== Canvas 初始化 ====================
  initCanvasSize()

  const canvas = lifecycleCtx.canvas!
  if (!canvas) {
    onEnd()
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.error('无法获取Canvas上下文')
    onEnd()
    return
  }


  // ==================== 移动端全屏适配 ====================
  const isMobile = window.innerWidth < 768 || 'ontouchstart' in window

  // 设置 Canvas 内部分辨率
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT

  if (isMobile) {
    const wrapper = document.createElement('div')
    wrapper.id = 'rpg-game-wrapper'
    wrapper.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      touch-action: none;
      margin: 0; padding: 0;
      z-index: 1;
      background: #0a0f1a;
      display: flex;
      align-items: center;
      justify-content: center;
    `

    canvas.style.cssText = `
      display: block;
      max-width: none;
      max-height: none;
      image-rendering: pixelated;
    `

    const updateCanvasScale = () => {
      const vw = window.visualViewport?.width ?? window.innerWidth
      const vh = window.visualViewport?.height ?? window.innerHeight
      const scale = Math.min(vw / CANVAS_WIDTH, vh / CANVAS_HEIGHT)
      const scaledW = Math.floor(CANVAS_WIDTH * scale)
      const scaledH = Math.floor(CANVAS_HEIGHT * scale)
      canvas.style.width = scaledW + 'px'
      canvas.style.height = scaledH + 'px'
      canvas.style.transform = ''
      canvas.style.position = ''
    }

    updateCanvasScale()
    window.visualViewport?.addEventListener('resize', updateCanvasScale)
    window.addEventListener('resize', updateCanvasScale)
    window.addEventListener('orientationchange', () => setTimeout(updateCanvasScale, 200))

    const host = document.getElementById('gameCanvas')
    const parent = canvas.parentNode
    if (parent && host) {
      parent.removeChild(canvas)
      wrapper.appendChild(canvas)
      host.appendChild(wrapper)
    }

    ;(window as any)._rpgTowerDefenseResizeHandler = () => {
      window.visualViewport?.removeEventListener('resize', updateCanvasScale)
      window.removeEventListener('resize', updateCanvasScale)
      const w = document.getElementById('rpg-game-wrapper')
      if (w) w.remove()
      host?.appendChild(canvas)
    }
  } else {
    canvas.style.width = `${CANVAS_WIDTH}px`
    canvas.style.height = `${CANVAS_HEIGHT}px`
    canvas.style.display = 'block'
    canvas.style.margin = '0 auto'
  }

  // ==================== 状态创建 ====================
  const state = createInitialState()
  state.buildMode.active = false
  state.buildMode.selectedTurret = null
  state.buildMode.buildTab = 'turret'

  let lastTime = performance.now()

  // 鼠标位置（用于 PC 端瞄准和炮台放置）
  const mousePos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }

  // 虚拟摇杆状态（手机端）— 左下角区域，大半径高灵敏度
  const joystick: JoystickState = {
    active: false,
    baseX: CANVAS_WIDTH * 0.16,
    baseY: CANVAS_HEIGHT * 0.80,  // 调整到 80% 避免与底部UI重叠
    currentX: CANVAS_WIDTH * 0.16,
    currentY: CANVAS_HEIGHT * 0.80,
    radius: 65,        // ↑ 50→65：更大拖拽范围
    knobRadius: 30,    // ↑ 22→30：更大的触摸目标
    touchId: null
  }

  // 选中的炮台引用 + 弹窗位置
  const selectedTurretForUpgradeRef = { current: null as any }
  const upgradeDialogPosRef = { current: { x: 0, y: 0 } }
  const mobileButtonsRef = { current: null as MobileButtons | null }

  // ==================== 简易音效函数 ====================
  const playSound: PlaySoundFn = (type) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      const cfg: Record<string, [number, number, number]> = {
        select: [800, 0.1, 0.1], build: [600, 0.15, 0.15],
        upgrade: [1000, 0.12, 0.2], sell: [500, 0.1, 0.15],
        shoot: [400, 0.08, 0.05], explosion: [150, 0.2, 0.3], hit: [300, 0.1, 0.08]
      }
      const [freq, vol, dur] = cfg[type] || [440, 0.05, 0.05]

      oscillator.frequency.value = freq
      gainNode.gain.setValueAtTime(vol, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + dur)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + dur)
    } catch (_e) { /* 音频不可用则静默 */ }
  }

  // ==================== 输入系统初始化 ====================
  const cleanupInput = initInput({
    canvas, state, joystick, mousePos, playSound,
    selectedTurretForUpgradeRef, upgradeDialogPosRef, mobileButtonsRef
  })

  const cleanupKeyboard = initKeyboard(state, selectedTurretForUpgradeRef)

  const teardownResources = () => {
    cleanupInput()
    cleanupKeyboard()
    if (isMobile) {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
      const handler = (window as { _rpgTowerDefenseResizeHandler?: () => void })._rpgTowerDefenseResizeHandler
      if (handler) handler()
    }
  }

  const handleGameOver = async () => {

    if (userService.isLoggedIn && userService.current && sessionId && sessionToken) {
      try {
        const duration = Math.floor((Date.now() - gameStartTime) / 1000)
        const result = await apiSubmitGameResult({
          sessionId,
          sessionToken,
          score: state.resources.score,
          duration,
          level: state.wave,
          isWin: state.wave >= 8,
          details: {
            kills: state.resources.kills,
            maxCombo: state.combo.maxCombo,
            crystals: state.resources.crystals,
            playerLevel: state.player.level,
          },
        })
        if (!result.ok) {
          console.warn('[RPG塔防] 分数提交失败:', result.msg)
        }
      } catch (error) {
        console.error('[RPG塔防] 提交分数异常:', error)
      }
    }

    gameActions.gameOver({
      victory: state.wave >= 8,
      score: state.resources.score,
      stats: {
        wave: state.wave,
        kills: state.resources.kills,
        maxCombo: state.combo.maxCombo,
        playerLevel: state.player.level,
      },
    })
  }

  const initGameSession = async () => {
    if (userService.isLoggedIn && userService.current) {
      try {
        const GAME_ID = 1
        const result = await apiStartGameSession(GAME_ID)
        if (result.ok && result.data) {
          sessionId = result.data.sessionId
          sessionToken = result.data.sessionToken
        }
      } catch (error) {
        console.error('[RPG塔防] 创建游戏会话异常:', error)
      }
    }
  }

  activeHost = hostCanvas2D(lifecycleCtx, {
    onInit() {
      void initGameSession()
      lastTime = performance.now()
    },
    onUpdate(dt) {
      const currentTime = performance.now()
      const step = Math.min(dt, 0.1)
      lastTime = currentTime
      if (state.gameStarted && !state.gameEnded && engine.canTick()) {
        updateGame(state, step, currentTime, playSound, handleGameOver)
      }
    },
    onRender() {
      render(ctx, {
        state,
        joystick,
        selectedTurretForUpgrade: selectedTurretForUpgradeRef.current,
        upgradeDialogPos: upgradeDialogPosRef.current,
        mobileButtonsRef,
      })
    },
    onDestroy() {
      teardownResources()
    },
  })

}
