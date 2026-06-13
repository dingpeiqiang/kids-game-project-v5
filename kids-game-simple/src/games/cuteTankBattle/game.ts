import type { GameEngine } from '../../services/gameEngine'
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

let activeDispose: (() => void) | null = null

export function destroyCuteTankBattle(): void {
  activeDispose?.()
  activeDispose = null
}

export async function initCuteTankBattle(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyCuteTankBattle()
  engine.start()
  engine.setOrientation('portrait')

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
  let raf = 0
  let lastTs = performance.now()

  const finish = (victory: boolean) => {
    if (ended) return
    ended = true
    engine.setVictory(victory)
    engine.setScore(state.score)
    engine.setGameStats({
      stars: getResultStars(state),
      level: state.levelIndex + 1,
      baseHp: state.baseHp,
      victory,
    })
    if (victory) {
      audioService.win()
      tryVibrate(120)
    } else {
      audioService.lose()
      tryVibrate(150)
    }
    cancelAnimationFrame(raf)
    input.dispose()
    activeDispose = null
    onEnd()
  }

  const onPointerTap = () => {
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

  const loop = (ts: number) => {
    if (!document.getElementById('mainGameCanvas')) {
      ended = true
      cancelAnimationFrame(raf)
      canvas.removeEventListener('click', onPointerTap)
      input.dispose()
      return
    }
    if (ended) return

    const dt = Math.min(0.033, (ts - lastTs) / 1000)
    lastTs = ts

    const snap = input.getSnapshot()

    if (snap.firePressed) {
      tryVibrate(40)
      audioService.shoot()
    }

    updateSimulation(
      state,
      { moveDir: snap.moveDir, firePressed: snap.firePressed },
      dt,
      (n, x, y) => {
        engine.addScore(n, x, y)
      },
    )
    state.score = engine.getScore()

    renderFrame(ctx, W, H, state, assets, hudTop)
    raf = requestAnimationFrame(loop)
  }

  raf = requestAnimationFrame(loop)

  activeDispose = () => {
    ended = true
    cancelAnimationFrame(raf)
    canvas.removeEventListener('click', onPointerTap)
    input.dispose()
  }
}