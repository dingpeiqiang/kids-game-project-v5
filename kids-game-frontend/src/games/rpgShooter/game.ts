import type { GameLifecycle, GameLifecycleContext } from '@shell/platform/GameLifecycle'
import { gameActions } from '@shell/platform/gameBridge'
import { hostCanvas2D } from '@shell/platform/hostCanvas2D'
import { GAME_CONFIG } from './config'
import { clientToCanvas } from '@shell/utils/canvasMobileUtils'
import {
  bindGameCanvasControls,
  drawMobileControlOverlay,
  type MobileControlRuntime,
} from '@shell/platform/mobileControls'
import type { GameState } from './types'
import { createInitialState, resetState } from './state'
import { updatePlayer } from './player'
import { shoot, updatePlayerBullets, updateEnemyBullets } from './bullets'
import { spawnEnemy, updateEnemies } from './enemies'
import { checkBulletEnemyCollisions, checkPlayerEnemyCollisions, checkPlayerDropCollisions } from './collision'
import { updateDrops } from './powerups'
import { updateParticles, drawParticles } from './particles'
import { drawBackground, drawPlayer, drawBullets, drawDrops, drawFloatTexts, drawHUD, drawStartScreen, drawGameOver } from './rendering'

export function startRpgShooterLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const canvas = lifecycleCtx.canvas!
  const ctx = canvas.getContext('2d')!
  const W = canvas.width
  const H = canvas.height

  let state: GameState = createInitialState()
  let controls: MobileControlRuntime | null = null
  let platformEnded = false

  const tryStart = () => {
    if (!state.gameStarted) state.gameStarted = true
  }

  const finishSession = (victory: boolean) => {
    if (platformEnded) return
    platformEnded = true
    state.gameEnded = true
    gameActions.setScore(state.score)
    gameActions.gameOver({
      victory,
      score: state.score,
      stats: {
        level: state.playerLevel,
        combo: state.combo,
        elapsed: state.elapsed,
      },
    })
  }

  const onKeyDown = (e: KeyboardEvent) => {
    state.keys[e.key.toLowerCase()] = true
    if (e.key.length === 1) tryStart()
  }
  const onKeyUp = (e: KeyboardEvent) => {
    state.keys[e.key.toLowerCase()] = false
  }

  const onMouseMove = (e: MouseEvent) => {
    const p = clientToCanvas(canvas, e.clientX, e.clientY)
    state.targetX = p.x
    state.targetY = p.y
    tryStart()
  }

  return hostCanvas2D(lifecycleCtx, {
    onInit() {
      state = createInitialState()

      controls = bindGameCanvasControls(canvas, {
        gameId: 'rpgShooter',
        viewWidth: W,
        viewHeight: H,
        onAction: (action, payload) => {
          if (action === 'move' && payload.source !== 'keyboard') {
            state.mobileStickX = payload.stickX ?? 0
            state.mobileStickY = payload.stickY ?? 0
            tryStart()
          }
          if (action === 'tap') {
            state.targetX = payload.x ?? state.targetX
            state.targetY = payload.y ?? state.targetY
            tryStart()
          }
        },
      })

      document.addEventListener('keydown', onKeyDown)
      document.addEventListener('keyup', onKeyUp)
      canvas.addEventListener('mousemove', onMouseMove)
    },
    onUpdate(dt: number) {
      if (!state.gameStarted || state.gameEnded) return

      state.elapsed += dt

      // 玩家移动（内部处理键盘+鼠标综合输入）
      updatePlayer(state, dt)

      // 射击
      shoot(state)

      // 敌人
      if (Math.random() < 0.02 + state.difficulty * 0.005) {
        spawnEnemy(state)
      }
      updateEnemies(state, dt)

      // 子弹
      updatePlayerBullets(state, dt)
      updateEnemyBullets(state, dt)

      // 掉落
      updateDrops(state, dt)

      // 碰撞
      checkBulletEnemyCollisions(state)
      checkPlayerEnemyCollisions(state)
      checkPlayerDropCollisions(state)

      // 粒子
      updateParticles(state, dt)

      // 难度递增
      if (state.elapsed > 30 && state.difficulty < 5) state.difficulty = 2
      if (state.elapsed > 60 && state.difficulty < 5) state.difficulty = 3
      if (state.elapsed > 90 && state.difficulty < 5) state.difficulty = 4

      if (state.elapsed >= GAME_CONFIG.GAME_DURATION) {
        finishSession(true)
        return
      }
      if (state.playerHP <= 0) {
        finishSession(false)
      }
    },
    onRender() {
      ctx.imageSmoothingEnabled = false
      drawBackground(ctx, state)
      drawBullets(ctx, state)
      drawDrops(ctx, state)
      drawFloatTexts(ctx, state)
      drawPlayer(ctx, state)
      drawHUD(ctx, state)

      if (!state.gameStarted) {
        drawStartScreen(ctx)
      }
      if (state.gameEnded) {
        drawGameOver(ctx, state)
      }
      drawParticles(ctx, state)
      if (controls?.shouldDrawOverlay()) {
        drawMobileControlOverlay(ctx, controls.getSnapshot(), controls.getJoystick())
      }
    },
    onDestroy() {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('mousemove', onMouseMove)
      controls?.dispose()
      controls = null
      resetState(state)
    },
  })
}

export { initRpgShooter, destroyRpgShooter } from './rpgShooter.lifecycle'