import type { GameEngine } from '../../services/gameEngine'
import { gameActions } from '../../platform/gameBridge'
import type { GameLifecycle } from '../../platform/GameLifecycle'
import { createLifecycleContext } from '../../platform/frameworkSession'
import { hostCanvas2D } from '../../platform/hostCanvas2D'
import { audioService } from '../../services/audio'
import { BASE_H, BASE_W } from './config'
import { castSkill1, castUlt, toggleAutoFight, updateSimulation } from './logic/gameLoop'
import { createInitialState } from './logic/state'
import { applyHeroMove, bindKingBabyInput, createInputState } from './input'
import { loadKingBabyAssets } from './render/assets'
import type { KingBabyImages } from './render/assets'
import { drawFrame } from './render/draw'
import type { GameState } from './types'

let activeHost: GameLifecycle | null = null

function tryVibrate(ms: number) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* ignore */
  }
}

export function destroyKingBaby(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initKingBaby(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyKingBaby()
  engine.setOrientation('landscape')

  const lifecycleCtx = createLifecycleContext('kingBaby', engine, onEnd)
  if (!lifecycleCtx?.canvas) {
    onEnd()
    return
  }

  const canvas = lifecycleCtx.canvas
  if (canvas.width < BASE_W) {
    canvas.width = BASE_W
    canvas.height = BASE_H
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    onEnd()
    return
  }

  const assets = await loadKingBabyAssets()
  activeHost = startKingBabyLifecycle(lifecycleCtx, assets)
}

function startKingBabyLifecycle(
  lifecycleCtx: import('../../platform/GameLifecycle').GameLifecycleContext,
  assets: KingBabyImages,
): GameLifecycle {
  const canvas = lifecycleCtx.canvas!
  const engine = lifecycleCtx.engine
  const ctx = canvas.getContext('2d')!

  let state: GameState = createInitialState(0)
  const input = createInputState()
  let ended = false
  let lastScore = 0
  let victorySoundPlayed = false
  let defeatSoundPlayed = false
  let unbind: (() => void) | null = null

  const finishFromResult = () => {
    if (ended) return
    ended = true
    gameActions.gameOver({
      victory: state.phase === 'victory',
      score: state.score,
      stats: {
        stars: state.stars,
        level: state.levelIndex + 1,
        kills: state.kills,
      },
    })
  }

  return hostCanvas2D(lifecycleCtx, {
    onInit() {
      unbind = bindKingBabyInput(canvas, input, state, (_x, _y, ui) => {
        if (ended) return
        if (ui?.kind === 'result' || state.phase === 'victory' || state.phase === 'defeat') {
          finishFromResult()
          return
        }
        if (!ui) return
        if (ui.kind === 'skill1') {
          if (castSkill1(state)) audioService.collect()
        } else if (ui.kind === 'ult') {
          if (castUlt(state)) {
            audioService.collect()
            tryVibrate(80)
          }
        } else if (ui.kind === 'auto') {
          toggleAutoFight(state)
        }
      })
    },
    onUpdate(dt) {
      if (ended) return
      const capped = Math.min(0.05, dt)

      if (state.autoFight && state.phase === 'playing' && !state.hero.dead) {
        let tx = state.enemyCrystal.hp > 0 ? BASE_W - 120 : state.hero.x
        let ty = state.hero.y
        let best = 99999
        for (const m of state.minions) {
          if (m.friendly) continue
          const d = (m.x - state.hero.x) ** 2 + (m.y - state.hero.y) ** 2
          if (d < best) {
            best = d
            tx = m.x
            ty = m.y
          }
        }
        if (state.enemyHero.active && state.enemyHero.hp > 0) {
          const d =
            (state.enemyHero.x - state.hero.x) ** 2 + (state.enemyHero.y - state.hero.y) ** 2
          if (d < best) {
            tx = state.enemyHero.x
            ty = state.enemyHero.y
          }
        }
        input.moveX = (tx / BASE_W) * canvas.width
        input.moveY = (ty / BASE_H) * canvas.height
        input.pointerDown = true
      }

      applyHeroMove(state, input, canvas.width, canvas.height)
      updateSimulation(state, capped)

      if (state.phase === 'victory' && !victorySoundPlayed) {
        victorySoundPlayed = true
        audioService.win()
        tryVibrate(120)
      } else if (state.phase === 'defeat' && !defeatSoundPlayed) {
        defeatSoundPlayed = true
        audioService.lose()
      }

      if (state.score > lastScore) {
        const delta = state.score - lastScore
        gameActions.addScore(delta, state.hero.x, state.hero.y - 40, 'kingBaby')
        lastScore = state.score
      }
    },
    onRender() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawFrame(ctx, state, assets, canvas.width, canvas.height)
    },
    onDestroy() {
      unbind?.()
      unbind = null
    },
  })
}