import type { GameEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { BASE_H, BASE_W } from './config'
import { castSkill1, castUlt, toggleAutoFight, updateSimulation } from './logic/gameLoop'
import { createInitialState } from './logic/state'
import { applyHeroMove, bindKingBabyInput, createInputState } from './input'
import { loadKingBabyAssets } from './render/assets'
import { drawFrame } from './render/draw'
import type { GameState } from './types'

let activeDispose: (() => void) | null = null

function tryVibrate(ms: number) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* ignore */
  }
}

export function destroyKingBaby(): void {
  activeDispose?.()
  activeDispose = null
}

export async function initKingBaby(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyKingBaby()
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

  if (canvas.width < BASE_W) {
    canvas.width = BASE_W
    canvas.height = BASE_H
  }

  const assets = await loadKingBabyAssets()
  let state: GameState = createInitialState(0)
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
      level: state.levelIndex + 1,
      score: state.score,
      kills: state.kills,
    })
    activeDispose?.()
    activeDispose = null
    onEnd()
  }

  const unbind = bindKingBabyInput(canvas, input, state, (_x, _y, ui) => {
    if (ended) return
    if (ui?.kind === 'result' || state.phase === 'victory' || state.phase === 'defeat') {
      finish()
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

  const loop = (ts: number) => {
    if (ended) return
    const dt = Math.min(0.05, (ts - lastTs) / 1000)
    lastTs = ts

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
    updateSimulation(state, dt)

    if (state.phase === 'victory') {
      audioService.win()
      tryVibrate(120)
    } else if (state.phase === 'defeat') {
      audioService.lose()
    }

    if (state.score > lastScore) {
      const delta = state.score - lastScore
      engine.addScore(delta, state.hero.x, state.hero.y - 40)
      lastScore = state.score
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawFrame(ctx, state, assets, canvas.width, canvas.height)

    raf = requestAnimationFrame(loop)
  }

  raf = requestAnimationFrame(loop)

  activeDispose = () => {
    cancelAnimationFrame(raf)
    unbind()
  }
}