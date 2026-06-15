import type { GameEngine } from '../../services/gameEngine'
import { gameActions } from '../../platform/gameBridge'
import type { GameLifecycle } from '../../platform/GameLifecycle'
import { createLifecycleContext } from '../../platform/frameworkSession'
import { hostCanvas2D } from '../../platform/hostCanvas2D'
import { audioService } from '../../services/audio'
import { DESIGN_H, DESIGN_W, GRID_COLS, GRID_ROWS } from './config'
import { loadGameAssets } from './assets'
import { createInputController, tryVibrate } from './input'
import {
  advanceAfterLevelClear,
  createInitialState,
  createLayout,
  getResultStars,
  startLevel,
  updateSimulation,
} from './logic'
import { renderFrame } from './render'
import type { GameState } from './types'

let activeHost: GameLifecycle | null = null

export function destroyCuteTankBattle(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initCuteTankBattle(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyCuteTankBattle()
  engine.setOrientation('portrait')

  const lifecycleCtx = createLifecycleContext('cuteTankBattle', engine, onEnd)
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

  ctx.imageSmoothingEnabled = true

  const W = canvas.width || DESIGN_W
  const H = canvas.height || DESIGN_H
  const hudTop = 24
  const mapPadX = 16
  const mapPadY = hudTop + 88
  const cellSize = Math.floor(Math.min((W - mapPadX * 2) / GRID_COLS, (H - mapPadY - 48) / GRID_ROWS))
  const mapW = cellSize * GRID_COLS
  const mapH = cellSize * GRID_ROWS
  const mapOffsetX = (W - mapW) / 2
  const mapOffsetY = mapPadY

  const layout = createLayout(cellSize, mapOffsetX, mapOffsetY)
  const assets = await loadGameAssets()
  const input = createInputController(canvas)

  let state: GameState = createInitialState(layout)
  startLevel(state, 0)

  let ended = false
  let onPointerTap: (() => void) | null = null

  const finish = (victory: boolean) => {
    if (ended) return
    ended = true
    if (victory) {
      audioService.win()
      tryVibrate(120)
    } else {
      audioService.lose()
      tryVibrate(150)
    }
    gameActions.gameOver({
      victory,
      score: state.score,
      stats: {
        stars: getResultStars(state),
        level: state.levelIndex + 1,
        baseHp: state.baseHp,
      },
    })
  }

  activeHost = hostCanvas2D(lifecycleCtx, {
    onInit() {
      onPointerTap = () => {
        if (state.phase === 'levelClear') {
          advanceAfterLevelClear(state)
          return
        }
        if (state.phase === 'victory') {
          finish(true)
          return
        }
        if (state.phase === 'defeat') {
          finish(false)
        }
      }
      canvas.addEventListener('click', onPointerTap)
    },
    onUpdate(dt) {
      if (ended) return
      const capped = Math.min(0.033, dt)
      const snap = input.getSnapshot()
      if (snap.firePressed) {
        tryVibrate(40)
        audioService.shoot()
      }
      updateSimulation(
        state,
        { moveDir: snap.moveDir, firePressed: snap.firePressed },
        capped,
        (n, x, y) => {
          gameActions.addScore(n, x, y, 'cuteTankBattle')
        },
      )
      state.score = engine.getScore()
    },
    onRender() {
      renderFrame(ctx, W, H, state, assets, hudTop)
    },
    onDestroy() {
      if (onPointerTap) {
        canvas.removeEventListener('click', onPointerTap)
        onPointerTap = null
      }
      input.dispose()
    },
  })
}