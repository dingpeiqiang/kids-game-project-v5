export function startContraRpgLifecycle(lifecycleCtx: import('../../platform/GameLifecycle').GameLifecycleContext): GameLifecycle {
  return hostCanvas2D(lifecycleCtx, {
    onInit() {
      applyCanvasMobileStyles(lifecycleCtx.canvas!)
    },
    onUpdate(_dt) {},
    onRender() {},
    onDestroy() {},
  })
}

export function initContraRpg(engine: GameEngine, onEnd: () => void) {
  destroyContraRpg()
  const lifecycleCtx = createLifecycleContext('contraRpg', engine, onEnd)
  if (!lifecycleCtx?.canvas) {
    onEnd()
    return
  }
  try {
    const game = new ContraRpgGame(engine, lifecycleCtx.canvas)
    activeGame = game
    activeHost = hostCanvas2D(lifecycleCtx, {
      onInit() {
        applyCanvasMobileStyles(lifecycleCtx.canvas!)
        game.beginPlay()
      },
      onUpdate(_dt) {
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
  } catch (error) {
    console.error('Failed to initialize ContraRpgGame:', error)
    onEnd()
  }
}