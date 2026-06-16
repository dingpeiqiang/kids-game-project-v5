import { GameLifecycle, type GameLifecycleContext } from '../../platform/GameLifecycle'
import { gameActions } from '../../platform/gameBridge'
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

class PlantZombieDefense2dLifecycle extends GameLifecycle {
  private state: GameState = createInitialState(1)
  private ended = false
  private assets: Awaited<ReturnType<typeof loadPzd2dAssets>> | null = null
  private canvasCtx: CanvasRenderingContext2D | null = null
  private unbind: (() => void) | null = null

  async onInit() {
    const engine = this.ctx.engine
    engine.setOrientation('landscape')

    const canvas = this.ctx.canvas
    if (!canvas) {
      this.ctx.onEnd()
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      this.ctx.onEnd()
      return
    }
    this.canvasCtx = ctx

    const assets = await loadPzd2dAssets()
    this.assets = assets

    const exitToLobby = () => {
      if (this.ended) return
      this.ended = true
      persistRecords(this.state)
      gameActions.gameOver({
        victory: this.state.phase === 'victory',
        score: this.state.score,
        stats: {
          stars: computeStars(this.state),
          wave: this.state.waveIndex + 1,
          level: this.state.levelIndex,
        },
      })
      activeDispose?.()
      activeDispose = null
    }

    const getVp = () => computeViewport(canvas.width, canvas.height)
    const onResize = () => resizeCanvasToDisplay(canvas)

    this.unbind = bindPzd2dInput(canvas, getVp, () => this.state, result => {
      if (this.ended) return
      if (result.invalidSun) {
        playPzd2dSfx('ui_invalid')
        return
      }
      if (result.resultAction === 'menu') {
        exitToLobby()
        return
      }
      if (result.resultAction === 'levels') {
        returnToLevelSelect(this.state)
        return
      }
      if (result.resultAction === 'retry') {
        resetRun(this.state, this.state.levelIndex)
        return
      }
      if (result.resultAction === 'next' && this.state.phase === 'victory') {
        const next = Math.min(this.state.levelIndex + 1, GAME_CONFIG.totalLevels)
        if (next <= this.state.records.unlockedLevel) {
          resetRun(this.state, next)
        }
      }
    })

    window.addEventListener('resize', onResize)
    onResize()

    this._tick = (dt: number) => {
      if (this.ended || engine.isPaused()) return
      resizeCanvasToDisplay(canvas)
      updateSimulation(this.state, Math.min(0.05, dt))
      drainSfxQueue(this.state.pendingSfx)
    }

    this._draw = () => {
      if (!this.canvasCtx || !this.assets) return
      drawFrame(this.canvasCtx, canvas.width, canvas.height, this.state, this.assets)
    }

    activeDispose = () => {
      window.removeEventListener('resize', onResize)
      this.unbind?.()
      this.unbind = null
      this.assets = null
      this._tick = null
      this._draw = null
    }
  }

  private _tick: ((dt: number) => void) | null = null
  private _draw: (() => void) | null = null

  onUpdate(dt: number) {
    this._tick?.(dt)
  }
  onRender() {
    this._draw?.()
  }
  onDestroy() {
    activeDispose?.()
    activeDispose = null
  }
}

export function startPlantZombieDefense2dLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const host = new PlantZombieDefense2dLifecycle(lifecycleCtx)
  void host.start()
  return host
}
