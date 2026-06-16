import type { GameLifecycle, GameLifecycleContext } from '../../platform/GameLifecycle'
import { hostCanvas2D } from '../../platform/hostCanvas2D'
import { applyCanvasMobileStyles } from '../../utils/canvasMobileUtils'
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

  function handleKey(e: KeyboardEvent, pressed: boolean) {
    state.keys[e.key.toLowerCase()] = pressed
    if (!state.gameStarted && pressed) {
      state.gameStarted = true
    }
  }

  function handleMouse(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect()
    state.targetX = (e.clientX - rect.left) * (W / rect.width)
    state.targetY = (e.clientY - rect.top) * (H / rect.height)
    if (!state.gameStarted) {
      state.gameStarted = true
    }
  }

  return hostCanvas2D(lifecycleCtx, {
    onInit() {
      applyCanvasMobileStyles(canvas)
      state = createInitialState()
      document.addEventListener('keydown', (e) => handleKey(e, true))
      document.addEventListener('keyup', (e) => handleKey(e, false))
      canvas.addEventListener('mousemove', handleMouse)
      canvas.addEventListener('click', () => { if (!state.gameStarted) state.gameStarted = true })
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

      // 游戏结束
      if (state.playerHP <= 0) {
        state.gameEnded = true
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
    },
    onDestroy() {
      resetState(state)
    },
  })
}

export { initRpgShooter, destroyRpgShooter } from './rpgShooter.lifecycle'