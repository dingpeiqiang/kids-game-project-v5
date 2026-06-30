import { gameActions } from '@shell/platform/gameBridge'
import type { GameLifecycle } from '@shell/platform/GameLifecycle'
import type { GameLifecycleContext } from '@shell/platform/GameLifecycle'
import { createCanvasGameLifecycle } from '@shell/platform/createCanvasGameLifecycle'
import { hostCanvas2D } from '@shell/platform/hostCanvas2D'
import { shouldDrawOnScreenControls } from '@shell/platform/mobileControls'
import { TetrisGame } from './TetrisGame'

function startTetrisLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const canvas = lifecycleCtx.canvas!
  const engine = lifecycleCtx.engine
  const handheld = shouldDrawOnScreenControls()

  const W = handheld ? Math.min(window.innerWidth, 480) : 400
  const H = handheld ? window.innerHeight : 600

  canvas.width = W
  canvas.height = H

  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  let game: TetrisGame | null = null

  return hostCanvas2D(lifecycleCtx, {
    onInit() {
      game = new TetrisGame(canvas, ctx, engine, () => {
        gameActions.gameOver({
          victory: false,
          score: engine.getScore(),
          stats: {},
        })
      })
      game.init()
    },
    onUpdate(dt) {
      game?.update(dt)
    },
    onRender() {
      game?.render()
    },
    onDestroy() {
      game = null
    },
  })
}

const lifecycle = createCanvasGameLifecycle('tetris', startTetrisLifecycle)

export const initTetris = lifecycle.init
export const destroyTetris = lifecycle.destroy