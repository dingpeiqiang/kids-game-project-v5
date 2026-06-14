import type { GameEngine } from '../../services/gameEngine'
import {
  computeStars,
  createInitialState,
  persistRecords,
  resetRun,
  returnToLevelSelect,
  updateSimulation,
} from './logic/gameLoop'
import { drainSfxQueue, playPzd2dSfx } from './logic/events'
import { bindPzd2dInput, resizeCanvasToDisplay } from './input'
import { loadPzd2dAssets } from './render/assets'
import { drawFrame } from './render/draw'
import { computeViewport } from './render/layout'
import { GAME_CONFIG } from './config'
import type { GameState } from './types'

let activeDispose: (() => void) | null = null

export function destroyPlantZombieDefense2d(): void {
  activeDispose?.()
  activeDispose = null
}

export async function initPlantZombieDefense2d(
  engine: GameEngine,
  onEnd: () => void,
): Promise<void> {
  destroyPlantZombieDefense2d()
  engine.start()
  engine.setOrientation('landscape')

  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement | null
  if (!canvas) {
    onEnd()
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    onEnd()
    return
  }

  const assets = await loadPzd2dAssets()
  let state: GameState = createInitialState(1)
  let ended = false
  let raf = 0
  let lastTs = performance.now()

  const finish = () => {
    if (ended) return
    ended = true
    persistRecords(state)
    engine.setScore(state.score)
    engine.setGameStats({
      grade: state.phase === 'victory' ? 'win' : 'lose',
      stars: computeStars(state),
      wave: state.waveIndex + 1,
      score: state.score,
    })
    cancelAnimationFrame(raf)
    unbind()
    window.removeEventListener('resize', onResize)
    onEnd()
  }

  const getVp = () => computeViewport(canvas.width, canvas.height)

  const unbind = bindPzd2dInput(
    canvas,
    getVp,
    () => state,
    result => {
      if (ended) return
      if (result.invalidSun) {
        playPzd2dSfx('ui_invalid')
        return
      }
      if (result.resultAction === 'menu') {
        finish()
        return
      }
      if (result.resultAction === 'levels') {
        returnToLevelSelect(state)
        return
      }
      if (result.resultAction === 'retry') {
        resetRun(state, state.levelIndex)
        return
      }
      if (result.resultAction === 'next' && state.phase === 'victory') {
        const next = Math.min(state.levelIndex + 1, GAME_CONFIG.totalLevels)
        if (next <= state.records.unlockedLevel) {
          resetRun(state, next)
        }
        return
      }
      if (
        (state.phase === 'victory' || state.phase === 'defeat') &&
        state.resultReady &&
        !result.resultAction
      ) {
        /* wait for button */
      }
    },
  )

  const onResize = () => resizeCanvasToDisplay(canvas)
  onResize()
  window.addEventListener('resize', onResize)

  const loop = (ts: number) => {
    if (ended) return
    resizeCanvasToDisplay(canvas)
    if (!engine.canTick()) {
      drawFrame(ctx, canvas.width, canvas.height, state, assets)
      raf = requestAnimationFrame(loop)
      return
    }
    const dt = Math.min(0.05, (ts - lastTs) / 1000)
    lastTs = ts
    updateSimulation(state, dt)
    drainSfxQueue(state.pendingSfx)
    drawFrame(ctx, canvas.width, canvas.height, state, assets)
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  activeDispose = () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', onResize)
    unbind()
  }
}