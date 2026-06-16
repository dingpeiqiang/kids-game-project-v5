import type { GameEngine } from '../../services/gameEngine'
import type { GameLifecycle, GameLifecycleContext } from '../../platform/GameLifecycle'
import { hostCanvas2D } from '../../platform/hostCanvas2D'
import { applyCanvasMobileStyles } from '../../utils/canvasMobileUtils'

/** ContraRpg 主循环类待从 legacy 恢复；当前为可编译的生命周期占位 */
class ContraRpgGame {
  constructor(_engine: GameEngine, _canvas: HTMLCanvasElement) {}

  beginPlay(): void {}

  runHostUpdate(): void {}

  runHostRender(): void {
    const ctx = (this as unknown as { _ctx?: CanvasRenderingContext2D })._ctx
    if (ctx) {
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.fillStyle = '#fff'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Contra RPG 加载中…', ctx.canvas.width / 2, ctx.canvas.height / 2)
    }
  }

  destroy(): void {}
}

let activeGame: ContraRpgGame | null = null

export function startContraRpgLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const engine = lifecycleCtx.engine
  const canvas = lifecycleCtx.canvas!
  const game = new ContraRpgGame(engine, canvas)
  activeGame = game
  const ctx = canvas.getContext('2d')
  ;(game as unknown as { _ctx?: CanvasRenderingContext2D })._ctx = ctx ?? undefined

  return hostCanvas2D(lifecycleCtx, {
    onInit() {
      applyCanvasMobileStyles(canvas)
      game.beginPlay()
    },
    onUpdate(_dt: number) {
      if (!engine.canTick()) return
      game.runHostUpdate()
    },
    onRender() {
      game.runHostRender()
    },
    onDestroy() {
      game.destroy()
      activeGame = null
    },
  })
}