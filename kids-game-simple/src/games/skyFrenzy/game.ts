import { Vector3 } from '@babylonjs/core'
import type { GameEngine } from '../../services/gameEngine'
import { createEngine3d } from '../../engine3d/createEngine3d'
import { createInputController } from './input'
import {
  createInitialState,
  persistRecords,
  resetRun,
  setPlayMode,
  togglePause,
  tryClearScreen,
  updateSimulation,
} from './logic/gameLoop'
import { setupTopDownCamera, SkyFrenzyScene } from './render/scene'
import { createSkyFrenzyHud } from './render/ui'
import type { GameState } from './types'

let activeDispose: (() => void) | null = null

export function destroySkyFrenzy(): void {
  activeDispose?.()
  activeDispose = null
}

export async function initSkyFrenzy(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroySkyFrenzy()
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

  const isMobile =
    window.innerWidth < 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const ctx3d = createEngine3d({
    parent,
    antialias: !isMobile,
    hardwareScalingLevel: isMobile ? 1.25 : 1,
  })

  ctx3d.camera.detachControl()
  const camera = setupTopDownCamera(ctx3d.scene, ctx3d.canvas)
  camera.detachControl()
  ctx3d.scene.activeCamera = camera

  const hud = createSkyFrenzyHud(parent)
  const view = new SkyFrenzyScene(ctx3d.scene)
  const input = createInputController(ctx3d.canvas)

  const mode = await hud.openModeMenu()
  let state: GameState = createInitialState(mode)
  let ended = false
  let lastModalPhase: GameState['phase'] | null = null

  const finish = (finalScore: number) => {
    if (ended) return
    ended = true
    persistRecords(state)
    engine.setScore(finalScore)
    engine.setGameStats({
      grade: state.phase === 'victory' ? gradeFromState(state) : 'lose',
      waves: state.waveIndex + 1,
      flawless: state.flawless,
      elapsedSec: state.elapsedSec,
      bestScore: state.records.bestScore,
      fastestClearSec: state.records.fastestClearSec,
    })
    onEnd()
  }

  function gradeFromState(s: GameState): string {
    if (s.flawless) return 'S'
    if (s.elapsedSec < 90) return 'A'
    return 'B'
  }

  hud.onAction(action => {
    if (ended) return
    switch (action.type) {
      case 'mode':
        setPlayMode(state, action.mode)
        lastModalPhase = null
        break
      case 'clearScreen':
        tryClearScreen(state)
        break
      case 'reset':
        resetRun(state)
        hud.resetOverlays()
        lastModalPhase = null
        break
      case 'pause':
        togglePause(state)
        break
      case 'endAfterResult':
        finish(state.score)
        break
      default:
        break
    }
  })

  const onUpdate = () => {
    if (ended) return
    if (engine.isPaused()) return
    const dt = Math.min(0.033, ctx3d.engine.getDeltaTime() / 1000)
    const prevScore = state.score
    const snap = input.getSnapshot()
    updateSimulation(state, snap, dt)
    const scoreDelta = state.score - prevScore
    if (scoreDelta > 0) {
      engine.addScore(scoreDelta, window.innerWidth * 0.5, window.innerHeight * 0.32)
    }

    view.sync(state)
    if (state.phase !== lastModalPhase) {
      lastModalPhase = state.phase
      hud.sync(state)
    } else if (state.phase === 'playing') {
      hud.sync(state)
    } else if (state.phase === 'paused' || state.phase === 'victory' || state.phase === 'defeat') {
      hud.sync(state)
    }

    camera.setTarget(new Vector3(state.player.x * 0.35, 0, state.player.z * 0.2))
  }

  ctx3d.scene.onBeforeRenderObservable.add(onUpdate)
  hud.sync(state)

  activeDispose = () => {
    ctx3d.scene.onBeforeRenderObservable.removeCallback(onUpdate)
    input.dispose()
    hud.dispose()
    view.dispose()
    ctx3d.dispose()
  }
}