import type { GameEngine } from '../../services/gameEngine'
import { createEngine3d } from '../../engine3d/createEngine3d'
import { createInputController, consumeFrameFlags } from './input'
import { createInitialState, resetForNewRun } from './logic/state'
import { resetLoopTimers, tickGame } from './logic/gameLoop'
import { loadRunStats, mergeRunStats } from './logic/storage'
import { SkyRushSceneView } from './render/scene'
import { createSkyRushHud } from './render/ui'
import type { GameState, PlayMode } from './types'

let activeDispose: (() => void) | null = null

export function destroySkyRush3d(): void {
  activeDispose?.()
  activeDispose = null
}

async function runSession(
  engine: GameEngine,
  onEnd: () => void,
  parent: HTMLElement,
): Promise<void> {
  const isMobile =
    window.innerWidth < 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const ctx3d = createEngine3d({
    parent,
    antialias: !isMobile,
    hardwareScalingLevel: isMobile ? 1.25 : 1,
  })

  const hud = createSkyRushHud(parent)
  const input = createInputController(ctx3d.canvas)
  const view = new SkyRushSceneView(ctx3d)

  let runStats = loadRunStats()
  const mode = await hud.openModeMenu()
  let state: GameState = createInitialState(mode)
  resetForNewRun(state, mode)
  resetLoopTimers()

  let ended = false
  let paused = false

  const finishToLobby = (finalScore: number) => {
    if (ended) return
    ended = true
    engine.setScore(finalScore)
    engine.setGameStats({
      bestScore: runStats.bestScore,
      bestClearMs: runStats.bestClearMs,
      maxCombo: runStats.maxCombo,
      flawlessClears: runStats.flawlessClears,
      bossKills: runStats.bossKills,
    })
    engine.endGame()
    onEnd()
  }

  hud.onToolbar(action => {
    if (ended) return
    if (action === 'pause') {
      paused = !paused
      state.phase = paused ? 'paused' : 'playing'
      hud.showPause(paused)
    }
    if (action === 'clearScreen') input.snapshot.clearScreen = true
    if (action === 'reset') {
      resetForNewRun(state, state.mode)
      resetLoopTimers()
      paused = false
      state.phase = 'playing'
      hud.showPause(false)
    }
  })

  const observer = ctx3d.scene.onBeforeRenderObservable.add(() => {
    if (ended) return
    const dt = Math.min(0.033, ctx3d.engine.getDeltaTime() / 1000)
    const flags = consumeFrameFlags(input.snapshot)
    if (flags.pause) {
      paused = !paused
      state.phase = paused ? 'paused' : 'playing'
      hud.showPause(paused)
    }
    if (flags.reset) {
      resetForNewRun(state, state.mode)
      resetLoopTimers()
      paused = false
      state.phase = 'playing'
      hud.showPause(false)
    }

    if (state.phase === 'playing') {
      tickGame(state, input.snapshot, dt, {
        onWave: (wave, label) => hud.showWaveToast(wave, label),
        onGameOver: () => {
          /* handled below */
        },
      })
    }

    view.sync(state, dt)
    hud.setPlaying(state, runStats)

    if (state.phase === 'ended') {
      const flawless = state.won && state.damageTaken === 0
      runStats = mergeRunStats(runStats, {
        score: state.score,
        clearMs: state.won ? state.elapsedMs : 0,
        maxCombo: state.maxCombo,
        flawless,
        bossKill: state.bossDefeated,
      })
      ctx3d.scene.onBeforeRenderObservable.remove(observer)
      void hud
        .showResult({
          won: state.won,
          score: state.score,
          stats: runStats,
          elapsedMs: state.elapsedMs,
          maxCombo: state.maxCombo,
          flawless,
        })
        .then(choice => {
          if (choice === 'retry') {
            ended = false
            resetForNewRun(state, state.mode)
            resetLoopTimers()
            ctx3d.scene.onBeforeRenderObservable.add(observer)
          } else {
            finishToLobby(state.score)
          }
        })
    }
  })

  activeDispose = () => {
    ctx3d.scene.onBeforeRenderObservable.remove(observer)
    input.dispose()
    view.dispose()
    hud.dispose()
    ctx3d.dispose()
  }
}

export async function initSkyRush3d(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroySkyRush3d()
  engine.start()
  engine.setOrientation('landscape')

  const parent = document.getElementById('gameCanvas')
  if (!parent) {
    onEnd()
    return
  }

  parent.innerHTML = ''
  parent.style.width = '100%'
  parent.style.height = '100%'
  parent.style.display = 'block'

  try {
    await runSession(engine, onEnd, parent)
  } catch (e) {
    console.error('skyRush3d init failed', e)
    destroySkyRush3d()
    onEnd()
  }
}