import { Vector3 } from '@babylonjs/core'
import type { GameEngine } from '../../services/gameEngine'
import { createEngine3d } from '../../engine3d/createEngine3d'
import { canPlacePlantAt } from './config'
import { bindCanvasInput, clientToPickCoords } from './input'
import {
  createInitialState,
  persistRecords,
  resetRun,
  startNextWave,
  tryCollectSun,
  tryPlacePlant,
  tryRemovePlant,
  updateSimulation,
} from './logic/gameLoop'
import { disposePlantZombieAssets, loadPlantZombieAssets } from './render/assets'
import { disposeModelTemplates, loadPlantZombieModels } from './render/models'
import { PlantZombieScene, setupSideCamera } from './render/scene'
import { createPlantZombieHud } from './render/ui'
import { computeStars } from './logic/gameLoop'
import type { GameState } from './types'

let activeDispose: (() => void) | null = null

export function destroyPlantZombieDefense(): void {
  activeDispose?.()
  activeDispose = null
}

export async function initPlantZombieDefense(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyPlantZombieDefense()
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

  const isMobile =
    window.innerWidth < 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const ctx3d = createEngine3d({
    parent,
    antialias: !isMobile,
    hardwareScalingLevel: isMobile ? 1.35 : 1,
  })

  ctx3d.camera.detachControl()
  const camera = setupSideCamera(ctx3d.scene, ctx3d.canvas)
  ctx3d.scene.activeCamera = camera

  const [assets, models] = await Promise.all([
    loadPlantZombieAssets(ctx3d.scene),
    loadPlantZombieModels(ctx3d.scene),
  ])
  const enableShadows = !isMobile

  const hud = createPlantZombieHud(parent)
  const view = new PlantZombieScene(ctx3d.scene, camera, assets, models, enableShadows)
  let state: GameState = createInitialState(1)
  let ended = false
  let hoverGx: number | null = null
  let hoverGz: number | null = null

  const finish = (finalScore: number) => {
    if (ended) return
    ended = true
    persistRecords(state)
    engine.setScore(finalScore)
    const stars = state.phase === 'victory' ? computeStars(state) : 0
    engine.setGameStats({
      grade: state.phase === 'victory' ? 'win' : 'lose',
      level: state.levelIndex,
      waves: state.waveIndex,
      houseHp: state.houseHp,
      stars,
      bestScore: state.records.bestScore,
    })
    activeDispose?.()
    activeDispose = null
    onEnd()
  }

  const handleTap = (pick: { gx: number; gz: number } | null, sunId: number | null) => {
    if (ended) return
    if (state.phase === 'victory' || state.phase === 'defeat') return

    if (sunId != null) {
      tryCollectSun(state, sunId)
      return
    }

    if (!pick) return

    const existing = state.plants.find(p => p.gx === pick.gx && p.gz === pick.gz)
    if (existing) {
      tryRemovePlant(state, existing.id)
      return
    }

    if (canPlacePlantAt(pick.gx, pick.gz)) {
      tryPlacePlant(state, state.selectedPlant, pick.gx, pick.gz)
    }
  }

  const unbindInput = bindCanvasInput(ctx3d.canvas, ctx3d.scene, { onTap: handleTap })

  hud.onAction(action => {
    if (ended) return
    switch (action.type) {
      case 'selectPlant':
        state.selectedPlant = action.kind
        break
      case 'nextWave':
        startNextWave(state)
        break
      case 'reset':
        resetRun(state, state.levelIndex)
        break
      case 'remove':
        if (state.selectedPlantId != null) tryRemovePlant(state, state.selectedPlantId)
        break
      case 'level':
        resetRun(state, action.level)
        break
      case 'endAfterResult':
        finish(state.score)
        break
      default:
        break
    }
  })

  const onMove = (ev: PointerEvent) => {
    const { x, y } = clientToPickCoords(ctx3d.canvas, ev.clientX, ev.clientY)
    const pick = ctx3d.scene.pick(x, y)
    const meta = pick?.pickedMesh?.metadata as { gx?: number; gz?: number } | undefined
    if (meta?.gx != null && meta?.gz != null) {
      hoverGx = meta.gx
      hoverGz = meta.gz
    }
  }
  ctx3d.canvas.addEventListener('pointermove', onMove, { passive: true })

  const onUpdate = function onPlantZombieUpdate() {
    if (ended) return
    if (engine.isPaused()) return
    const dt = Math.min(0.05, ctx3d.engine.getDeltaTime() / 1000)
    const prevScore = state.score
    updateSimulation(state, dt)
    const scoreDelta = state.score - prevScore
    if (scoreDelta > 0) {
      engine.addScore(scoreDelta, window.innerWidth * 0.5, window.innerHeight * 0.35)
    }

    if (hoverGx != null && hoverGz != null && canPlacePlantAt(hoverGx, hoverGz)) {
      view.setHighlight(hoverGx, hoverGz)
    } else {
      view.setHighlight(null, null)
    }

    view.syncPlants(state.plants)
    view.syncZombies(state.zombies)
    view.syncPeas(state.peas)
    view.syncSuns(state.suns)
    view.syncSelection(state)
    hud.sync(state)

    camera.setTarget(new Vector3(0, 0, 0))
  }

  ctx3d.scene.onBeforeRenderObservable.add(onUpdate)
  hud.sync(state)

  activeDispose = () => {
    ctx3d.scene.onBeforeRenderObservable.removeCallback(onUpdate)
    unbindInput()
    ctx3d.canvas.removeEventListener('pointermove', onMove)
    hud.dispose()
    view.dispose()
    disposePlantZombieAssets(assets)
    disposeModelTemplates(models)
    ctx3d.dispose()
  }
}