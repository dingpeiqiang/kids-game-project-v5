import type { GameEngine } from '@shell/services/gameEngine'
import type { GameLifecycle } from '@shell/platform/GameLifecycle'
import { createLifecycleContext } from '@shell/platform/frameworkSession'
import { hostCanvas2D } from '@shell/platform/hostCanvas2D'
import { BubbleShooterGame } from './BubbleShooterGame'

let activeHost: GameLifecycle | null = null
let activeGame: BubbleShooterGame | null = null

export function destroyBubbleShooter(): void {
  activeGame?.destroy()
  activeGame = null
  activeHost?.destroy()
  activeHost = null
}

export function initBubbleShooter(engine: GameEngine, onEnd: () => void) {
  destroyBubbleShooter()
  const lifecycleCtx = createLifecycleContext('bubbleShooter', engine, onEnd)
  if (!lifecycleCtx?.canvas) {
    onEnd()
    return
  }

  const canvas = lifecycleCtx.canvas
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    onEnd()
    return
  }
  ctx.imageSmoothingEnabled = false

  const game = new BubbleShooterGame(canvas, ctx, engine, onEnd)
  activeGame = game

  activeHost = hostCanvas2D(lifecycleCtx, {
    onInit() {
      game.init()
    },
    onUpdate(_dt) {
      game.update()
    },
    onRender() {
      game.render()
    },
    onDestroy() {
      game.destroy()
      activeGame = null
    },
  })
}