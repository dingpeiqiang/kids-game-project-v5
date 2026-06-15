import { Vector3 } from '@babylonjs/core'
import type { GameLifecycle, GameLifecycleContext } from '../../platform/GameLifecycle'
import { gameActions } from '../../platform/gameBridge'
import { hostCanvas2D } from '../../platform/hostCanvas2D'
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

    const onUpdate = (dt: number) => {
      if (this.ended || engine.isPaused()) return
      resizeCanvasToDisplay(canvas)
      updateSimulation(this.state, Math.min(0.05, dt))
      drainSfxQueue(this.state.pendingSfx)
    }

    const onRender = () => {
      if (!this.canvasCtx || !this.assets) return
      drawFrame(this.canvasCtx, canvas.width, canvas.height, this.state, this.assets)
    }

    this.ctx.onUpdate = onUpdate
    this.ctx.onRender = onRender

    activeDispose = () => {
      window.removeEventListener('resize', onResize)
      this.unbind?.()
      this.unbind = null
      this.assets = null
    }
  }

  onUpdate() {}
  onRender() {}
  onDestroy() {
    activeDispose?.()
    activeDispose = null
  }
}

export function startPlantZombieDefense2dLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  return new PlantZombieDefense2dLifecycle(lifecycleCtx)
}
