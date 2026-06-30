import type { GameEngine } from '@shell/services/gameEngine'
import { gameActions } from '@shell/platform/gameBridge'
import type { GameLifecycle } from '@shell/platform/GameLifecycle'
import { createLifecycleContext } from '@shell/platform/frameworkSession'
import { hostCanvas2D } from '@shell/platform/hostCanvas2D'
import { audioService } from '@shell/services/audio'
import { updateSimulation, pickBuff, startBuffPick } from './logic/gameLoop'
import { createInitialState } from './logic/state'
import { applyPlayerMove, bindBeatDragonInput, createInputState } from './input'
import { loadBeatDragonAssets } from './render/assets'
import { drawFrame, hitBuffCard, isResultTap } from './render/draw'
import type { GameState } from './types'
import type { BeatDragonImages } from './render/assets'

let activeHost: GameLifecycle | null = null

export function destroyBeatDragon(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initBeatDragon(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyBeatDragon()
  engine.setOrientation('portrait')

  const lifecycleCtx = createLifecycleContext('beatDragon', engine, onEnd)
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

  const assets = await loadBeatDragonAssets()
  activeHost = startBeatDragonLifecycle(lifecycleCtx, assets)
}

function startBeatDragonLifecycle(
  lifecycleCtx: import('@shell/platform/GameLifecycle').GameLifecycleContext,
  assets: BeatDragonImages,
): GameLifecycle {
  const canvas = lifecycleCtx.canvas!
  const engine = lifecycleCtx.engine
  const ctx = canvas.getContext('2d')!

  let state: GameState = createInitialState()
  if (!state.showedWave1Guide) {
    state.showedWave1Guide = true
    startBuffPick(state)
  }
  const input = createInputState()
  let ended = false
  let lastScore = 0
  let unbind: (() => void) | null = null

  const finishFromOverlay = () => {
    if (ended) return
    ended = true
    engine.setScore(state.score)
    const victory = state.phase === 'victory'
    gameActions.gameOver({
      victory,
      score: state.score,
      stats: {
        grade: victory ? 'win' : 'lose',
        stars: state.stars,
        wave: state.waveIndex + 1,
      },
    })
  }

  return hostCanvas2D(lifecycleCtx, {
    onInit() {
      unbind = bindBeatDragonInput(canvas, input, (x, y) => {
        if (ended) return
        if (isResultTap(state)) {
          finishFromOverlay()
          return
        }
        const buff = hitBuffCard(state, x, y)
        if (buff) {
          pickBuff(state, buff)
          audioService.collect()
        }
      })
    },
    onUpdate(dt) {
      if (ended) return
      const capped = Math.min(0.05, dt)
      applyPlayerMove(state, input)
      updateSimulation(state, capped)

      if (state.score > lastScore) {
        const delta = state.score - lastScore
        gameActions.addScore(delta, state.player.x, state.player.y - 40, 'beatDragon')
        lastScore = state.score
      }
    },
    onRender() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawFrame(ctx, state, assets)
    },
    onDestroy() {
      unbind?.()
      unbind = null
    },
  })
}