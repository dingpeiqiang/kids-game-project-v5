import { Vector3 } from '@babylonjs/core'
import type { GameEngine } from '../../services/gameEngine'
import { createEngine3d } from '../../engine3d/createEngine3d'
import { cellKindAt } from './config'
import { bindCanvasInput } from './input'
import {
  applyBuffChoice,
  canBuildAt,
  createInitialState,
  persistRecords,
  resetRun,
  skipBuffPick,
  startNextWave,
  tryPlaceTower,
  trySellTower,
  tryUpgradeTower,
  updateSimulation,
} from './logic/gameLoop'
import { HappyDefenseScene, setupTopDownCamera } from './render/scene'
import { createHappyDefenseHud } from './render/ui'
import type { GameState } from './types'

let activeDispose: (() => void) | null = null

export function destroyHappyDefense(): void {
  activeDispose?.()
  activeDispose = null
}

export async function initHappyDefense(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyHappyDefense()
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
    hardwareScalingLevel: isMobile ? 1.25 : 1,
  })

  ctx3d.camera.detachControl()
  const camera = setupTopDownCamera(ctx3d.scene, ctx3d.canvas)
  ctx3d.scene.activeCamera = camera

  const hud = createHappyDefenseHud(parent)
  const view = new HappyDefenseScene(ctx3d.scene, camera)
  let state: GameState = createInitialState()
  let ended = false
  let hoverGx: number | null = null
  let hoverGz: number | null = null

  const finish = (finalScore: number) => {
    if (ended) return
    ended = true
    persistRecords(state)
    engine.setScore(finalScore)
    engine.setGameStats({
      grade: state.phase === 'victory' ? 'win' : 'lose',
      waves: state.waveIndex,
      baseHp: state.baseHp,
      towersBuilt: state.towersBuilt,
      bestScore: state.records.bestScore,
      fastestClearSec: state.records.fastestClearSec,
    })
    onEnd()
  }

  const handleTap = (pick: { gx: number; gz: number } | null) => {
    if (ended || !pick) return
    if (state.phase === 'buffPick' || state.phase === 'victory' || state.phase === 'defeat') return

    const existing = state.towers.find(t => t.gx === pick.gx && t.gz === pick.gz)
    if (existing) {
      state.selectedTowerId = existing.id
      state.selectedTower = existing.kind
      return
    }

    if (canBuildAt(state, pick.gx, pick.gz)) {
      tryPlaceTower(state, state.selectedTower, pick.gx, pick.gz)
    }
  }

  const unbindInput = bindCanvasInput(ctx3d.canvas, ctx3d.scene, camera, { onTap: handleTap })

  hud.onAction(action => {
    if (ended) return
    switch (action.type) {
      case 'selectTower':
        state.selectedTower = action.kind
        break
      case 'nextWave':
        if (state.phase === 'buffPick') skipBuffPick(state)
        startNextWave(state)
        break
      case 'reset':
        resetRun(state)
        break
      case 'upgrade':
        if (state.selectedTowerId != null) tryUpgradeTower(state, state.selectedTowerId)
        break
      case 'sell':
        if (state.selectedTowerId != null) trySellTower(state, state.selectedTowerId)
        break
      case 'buff':
        applyBuffChoice(state, action.kind)
        break
      case 'skipBuff':
        skipBuffPick(state)
        break
      case 'endAfterResult':
        finish(state.score)
        break
      default:
        break
    }
  })

  const onMove = (ev: PointerEvent) => {
    const rect = ctx3d.canvas.getBoundingClientRect()
    const pick = ctx3d.scene.pick(ev.clientX - rect.left, ev.clientY - rect.top)
    const meta = pick?.pickedMesh?.metadata as { gx?: number; gz?: number } | undefined
    if (meta?.gx != null && meta?.gz != null) {
      hoverGx = meta.gx
      hoverGz = meta.gz
    }
  }
  ctx3d.canvas.addEventListener('pointermove', onMove, { passive: true })

  const onUpdate = function onHappyDefenseUpdate() {
    if (ended) return
    const dt = Math.min(0.05, ctx3d.engine.getDeltaTime() / 1000)
    const prevScore = state.score
    updateSimulation(state, dt)
    const scoreDelta = state.score - prevScore
    if (scoreDelta > 0) {
      engine.addScore(scoreDelta, window.innerWidth * 0.5, window.innerHeight * 0.35, false, state.combo >= 3)
    }

    if (hoverGx != null && hoverGz != null && cellKindAt(hoverGx, hoverGz) === 'build') {
      view.setHighlight(hoverGx, hoverGz)
    } else {
      view.setHighlight(null, null)
    }

    view.syncTowers(state.towers)
    view.syncEnemies(state.enemies)
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
    ctx3d.dispose()
  }
}