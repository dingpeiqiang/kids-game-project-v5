import { gameActions } from '@shell/platform/gameBridge'
import { GameLifecycle, type GameLifecycleContext } from '@shell/platform/GameLifecycle'
import { createEngine3d } from '@shell/engine3d/createEngine3d'
import { resolveGame3dMountHost } from '@shell/platform/game3dHost'
import { showGame3dMobileTouchHint } from '@shell/utils/game3dMobileShell'
import { createInputController, consumeFrameFlags } from './input'
import { createInitialState, resetForNewRun } from './logic/state'
import { resetLoopTimers, tickGame } from './logic/gameLoop'
import { loadRunStats, mergeRunStats } from './logic/storage'
import { SkyRushSceneView } from './render/scene'
import { createSkyRushHud } from './render/ui'
import type { GameState } from './types'

let activeDispose: (() => void) | null = null

export function destroySkyRush3d(): void {
  activeDispose?.()
  activeDispose = null
}

class SkyRush3dLifecycle extends GameLifecycle {
  private state: GameState | null = null
  private runStats = loadRunStats()
  private ended = false
  private paused = false
  private ctx3d: ReturnType<typeof createEngine3d> | null = null
  private hud: ReturnType<typeof createSkyRushHud> | null = null
  private input: ReturnType<typeof createInputController> | null = null
  private view: SkyRushSceneView | null = null

  async onInit() {
    const engine = this.ctx.engine
    engine.start()
    engine.setOrientation('landscape')

    const parent = resolveGame3dMountHost(this.ctx.canvas)
    if (!parent) {
      this.ctx.onEnd()
      return
    }

    parent.innerHTML = ''

    const ctx3d = createEngine3d({
      parent,
      skipDefaultCameraControls: true,
    })
    this.ctx3d = ctx3d

    const hud = createSkyRushHud(parent)
    const input = createInputController(ctx3d.canvas)
    const view = new SkyRushSceneView(ctx3d)
    this.hud = hud
    this.input = input
    this.view = view

    const mode = await hud.openModeMenu()
    const state = createInitialState(mode)
    resetForNewRun(state, mode)
    resetLoopTimers()
    this.state = state
    const hideTouchHint = showGame3dMobileTouchHint(parent, 'skyRush')

    const finishToLobby = (finalScore: number) => {
      if (this.ended) return
      this.ended = true
      gameActions.gameOver({
        victory: false,
        score: finalScore,
        stats: {
          bestScore: this.runStats.bestScore,
          bestClearMs: this.runStats.bestClearMs,
          maxCombo: this.runStats.maxCombo,
          flawlessClears: this.runStats.flawlessClears,
          bossKills: this.runStats.bossKills,
        },
      })
      this.ctx.onEnd()
    }

    hud.onToolbar(action => {
      if (this.ended || !this.state) return
      if (action === 'pause') {
        this.paused = !this.paused
        this.state.phase = this.paused ? 'paused' : 'playing'
        hud.showPause(this.paused)
      }
      if (action === 'clearScreen') input.snapshot.clearScreen = true
      if (action === 'reset') {
        resetForNewRun(this.state, this.state.mode)
        resetLoopTimers()
        this.paused = false
        this.state.phase = 'playing'
        hud.showPause(false)
      }
    })

    const onBeforeRender = () => {
      if (this.ended || !this.state) return
      const dt = Math.min(0.033, ctx3d.engine.getDeltaTime() / 1000)
      const flags = consumeFrameFlags(input.snapshot)
      if (flags.pause) {
        this.paused = !this.paused
        this.state.phase = this.paused ? 'paused' : 'playing'
        hud.showPause(this.paused)
      }
      if (flags.reset) {
        resetForNewRun(this.state, this.state.mode)
        resetLoopTimers()
        this.paused = false
        this.state.phase = 'playing'
        hud.showPause(false)
      }

      if (this.state.phase === 'playing') {
        tickGame(this.state, input.snapshot, dt, {
          onWave: (wave, label) => hud.showWaveToast(wave, label),
          onGameOver: () => {},
        })
      }

      view.sync(this.state, dt)
      hud.setPlaying(this.state, this.runStats)

      if (this.state.phase === 'ended') {
        const flawless = this.state.won && this.state.damageTaken === 0
        this.runStats = mergeRunStats(this.runStats, {
          score: this.state.score,
          clearMs: this.state.won ? this.state.elapsedMs : 0,
          maxCombo: this.state.maxCombo,
          flawless,
          bossKill: this.state.bossDefeated,
        })
        ctx3d.scene.onBeforeRenderObservable.removeCallback(onBeforeRender)
        void hud
          .showResult({
            won: this.state.won,
            score: this.state.score,
            stats: this.runStats,
            elapsedMs: this.state.elapsedMs,
            maxCombo: this.state.maxCombo,
            flawless,
          })
          .then(choice => {
            if (choice === 'retry') {
              this.ended = false
              resetForNewRun(this.state!, this.state!.mode)
              resetLoopTimers()
              ctx3d.scene.onBeforeRenderObservable.add(onBeforeRender)
            } else {
              finishToLobby(this.state!.score)
            }
          })
      }
    }

    ctx3d.scene.onBeforeRenderObservable.add(onBeforeRender)

    activeDispose = () => {
      hideTouchHint()
      ctx3d.scene.onBeforeRenderObservable.removeCallback(onBeforeRender)
      input.dispose()
      view.dispose()
      hud.dispose()
      ctx3d.dispose()
    }
  }

  onUpdate() {}
  onRender() {}
  onDestroy() {
    activeDispose?.()
    activeDispose = null
  }
}

export function startSkyRush3dLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const host = new SkyRush3dLifecycle(lifecycleCtx)
  void host.start()
  return host
}
