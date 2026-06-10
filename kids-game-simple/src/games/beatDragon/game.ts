import type { GameEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { updateSimulation, pickBuff, startBuffPick } from './logic/gameLoop'
import { createInitialState } from './logic/state'
import { applyPlayerMove, bindBeatDragonInput, createInputState } from './input'
import { loadBeatDragonAssets } from './render/assets'
import { drawFrame, hitBuffCard, isResultTap } from './render/draw'
import type { GameState } from './types'

let activeDispose: (() => void) | null = null

export function destroyBeatDragon(): void {
  activeDispose?.()
  activeDispose = null
}

export async function initBeatDragon(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyBeatDragon()
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

  const assets = await loadBeatDragonAssets()
  let state: GameState = createInitialState()
  if (!state.showedWave1Guide) {
    state.showedWave1Guide = true
    startBuffPick(state)
  }
  const input = createInputState()
  let ended = false
  let lastScore = 0
  let raf = 0
  let lastTs = performance.now()

  const finish = () => {
    if (ended) return
    ended = true
    engine.setScore(state.score)
    engine.setGameStats({
      grade: state.phase === 'victory' ? 'win' : 'lose',
      stars: state.stars,
      wave: state.waveIndex + 1,
      score: state.score,
    })
    cancelAnimationFrame(raf)
    onEnd()
  }

  const unbind = bindBeatDragonInput(canvas, input, (x, y) => {
    if (ended) return
    if (isResultTap(state)) {
      finish()
      return
    }
    const buff = hitBuffCard(state, x, y)
    if (buff) {
      pickBuff(state, buff)
      audioService.collect()
    }
  })

  const loop = (ts: number) => {
    if (ended) return
    const dt = Math.min(0.05, (ts - lastTs) / 1000)
    lastTs = ts

    applyPlayerMove(state, input)
    updateSimulation(state, dt)

    if (state.score > lastScore) {
      const delta = state.score - lastScore
      engine.addScore(delta, state.player.x, state.player.y - 40)
      lastScore = state.score
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawFrame(ctx, state, assets)

    raf = requestAnimationFrame(loop)
  }

  raf = requestAnimationFrame(loop)

  activeDispose = () => {
    cancelAnimationFrame(raf)
    unbind()
  }
}