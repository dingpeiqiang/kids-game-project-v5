import type { GameEngine } from '../../services/gameEngine'
import { createEngine3d } from '../../engine3d/createEngine3d'
import { getLevelDef, levelCount } from './logic/levelRuntime'
import { tickGame } from './logic/gameLoop'
import { createInitialState, resetLevel, respawnAfterFall } from './logic/state'
import { loadRunStats, mergeAfterLevel } from './logic/storage'
import { createInputController, consumeFrameFlags } from './input'
import { createCloudBallAudio } from './render/audio'
import { CloudBallSceneView } from './render/scene'
import { createCloudBallHud } from './render/ui'
import type { GameState } from './types'

let activeDispose: (() => void) | null = null

export function destroyCloudBallRush3d(): void {
  activeDispose?.()
  activeDispose = null
}

async function runSession(
  engine: GameEngine,
  onEnd: () => void,
  parent: HTMLElement,
): Promise<void> {
  const isMobile =
    window.innerWidth < 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const ctx3d = createEngine3d({
    parent,
    antialias: !isMobile,
    hardwareScalingLevel: isMobile ? 1.25 : 1,
  })

  const hud = createCloudBallHud(parent)
  const input = createInputController(ctx3d.canvas)
  const view = new CloudBallSceneView(ctx3d)
  const audio = await createCloudBallAudio()

  let runStats = loadRunStats()
  const start = await hud.openStartMenu()
  let state: GameState = createInitialState(start.mode, start.levelIndex)
  view.rebuildLevel(state)
  view.setSkin(runStats.unlockedSkin)

  audio.playBgm(start.mode === 'compete' ? 'bgm_compete' : 'bgm_casual')
  audio.playBgm('ambience_wind', 0.25)

  let ended = false
  let paused = false
  let timeSec = 0
  let resolvingLevel = false
  let prevStarsCollected = 0
  let prevPowerCollected = 0
  let rollSfxCooldown = 0
  let hadShield = false
  let wasFallen = false

  const finishToLobby = (finalScore: number) => {
    if (ended) return
    ended = true
    engine.setScore(finalScore)
    engine.setGameStats({
      bestScore: finalScore,
      bestTotalStars: runStats.bestTotalStars,
      perfectClears: runStats.perfectClears,
      totalClears: runStats.totalClears,
    })
    engine.endGame()
    onEnd()
  }

  const openLevelSelect = async (): Promise<void> => {
    audio.playSfx('ui_click')
    const next = await hud.openStartMenu()
    state.mode = next.mode
    resetLevel(state, next.levelIndex)
    view.rebuildLevel(state)
    view.setSkin(runStats.unlockedSkin)
    paused = false
    state.phase = 'playing'
    hud.showPause(false)
    prevStarsCollected = 0
    prevPowerCollected = 0
    audio.playBgm(next.mode === 'compete' ? 'bgm_compete' : 'bgm_casual')
  }

  hud.onToolbar(action => {
    if (ended) return
    if (action === 'pause') {
      paused = !paused
      state.phase = paused ? 'paused' : 'playing'
      hud.showPause(paused)
      audio.playSfx('ui_click')
    }
    if (action === 'reset') {
      audio.playSfx('level_reset')
      resetLevel(state)
      view.rebuildLevel(state)
      paused = false
      state.phase = 'playing'
      hud.showPause(false)
      prevStarsCollected = 0
      prevPowerCollected = 0
    }
    if (action === 'jump') input.snapshot.jump = true
    if (action === 'exit') {
      void openLevelSelect()
    }
  })

  const handleLevelComplete = async (stars: 0 | 1 | 2 | 3) => {
    if (resolvingLevel) return
    resolvingLevel = true
    state.phase = 'levelComplete'
    const levelId = getLevelDef(state.levelIndex).id
    runStats = mergeAfterLevel(runStats, {
      levelId,
      clearMs: state.elapsedMs,
      starsCollected: state.levelStarsCollected,
      starRating: stars,
      flawless: state.flawlessRun && state.falls === 0,
    })
    const skinBefore = view.getSkinId()
    view.setSkin(runStats.unlockedSkin)
    if (runStats.unlockedSkin > skinBefore) {
      audio.playSfx('skin_switch')
    }
    audio.playSfx('level_clear')
    audio.playSfx('star_rating')
    const bestMs = runStats.levelBestMs[levelId] ?? null
    const choice = await hud.showLevelResult({ state, stats: runStats, stars, bestMs })
    if (choice === 'next' && state.levelIndex < levelCount() - 1) {
      resetLevel(state, state.levelIndex + 1, { keepSessionScore: true })
      view.rebuildLevel(state)
      state.phase = 'playing'
    } else if (choice === 'retry') {
      resetLevel(state, undefined, { keepSessionScore: true })
      view.rebuildLevel(state)
      state.phase = 'playing'
    } else if (choice === 'levels') {
      await openLevelSelect()
    } else {
      finishToLobby(state.sessionScore)
    }
    resolvingLevel = false
  }

  const observer = ctx3d.scene.onBeforeRenderObservable.add(() => {
    if (ended) return
    if (engine.isPaused()) return
    const dt = Math.min(0.033, ctx3d.engine.getDeltaTime() / 1000)
    timeSec += dt

    const flags = consumeFrameFlags(input.snapshot)
    if (flags.pause) {
      paused = !paused
      state.phase = paused ? 'paused' : 'playing'
      hud.showPause(paused)
    }
    if (flags.reset) {
      audio.playSfx('level_reset')
      resetLevel(state)
      view.rebuildLevel(state)
      paused = false
      state.phase = 'playing'
      hud.showPause(false)
      prevStarsCollected = 0
      prevPowerCollected = 0
    }
    if (flags.jump) input.snapshot.jump = true

    if (state.phase === 'playing') {
      const basis = view.getMoveBasis()
      const result = tickGame(state, input.snapshot, dt, timeSec, {
        x: basis.forwardX,
        z: basis.forwardZ,
      })
      if (result?.completed) {
        void handleLevelComplete(result.stars)
      }

      const starsNow = state.levelStarsCollected
      if (starsNow > prevStarsCollected) {
        audio.playSfx('star_collect')
        prevStarsCollected = starsNow
      }
      const puNow = state.level.powerUps.filter(p => p.collected).length
      if (puNow > prevPowerCollected) {
        audio.playSfx('pickup_buff')
        prevPowerCollected = puNow
      }
    }

    if (state.phase === 'fallen' && !wasFallen) {
      audio.playSfx('fall_void')
      hud.showFallToast()
      respawnAfterFall(state)
    }
    wasFallen = state.phase === 'fallen'

    const motion = view.sync(state, timeSec)
    if (motion.jumped) audio.playSfx('ball_jump_land')
    if (motion.onIce && motion.rolling) {
      rollSfxCooldown -= dt
      if (rollSfxCooldown <= 0) {
        audio.playSfx('ball_ice_slide', { volume: 0.35 })
        rollSfxCooldown = 0.35
      }
    } else if (motion.rolling) {
      rollSfxCooldown -= dt
      if (rollSfxCooldown <= 0) {
        audio.playSfx('ball_roll', { volume: 0.28 })
        rollSfxCooldown = 0.45
      }
    }

    const shieldOn = state.ball.shieldT > 0
    if (shieldOn && !hadShield) {
      audio.playSfx('shield_loop', { loop: true, volume: 0.22 })
    }
    if (!shieldOn && hadShield) {
      audio.stopSfx('shield_loop')
    }
    hadShield = shieldOn

    hud.setPlaying(state, runStats)
  })

  activeDispose = () => {
    ctx3d.scene.onBeforeRenderObservable.remove(observer)
    audio.stopSfx('shield_loop')
    audio.dispose()
    input.dispose()
    view.dispose()
    hud.dispose()
    ctx3d.dispose()
  }
}

export async function initCloudBallRush3d(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyCloudBallRush3d()
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

  try {
    await runSession(engine, onEnd, parent)
  } catch (e) {
    console.error('cloudBallRush3d init failed', e)
    destroyCloudBallRush3d()
    onEnd()
  }
}