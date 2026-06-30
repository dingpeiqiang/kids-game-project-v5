import { Vector3 } from '@babylonjs/core'
import { GameLifecycle, type GameLifecycleContext } from '@shell/platform/GameLifecycle'
import { gameActions } from '@shell/platform/gameBridge'
import { createEngine3d } from '@shell/engine3d/createEngine3d'
import { resolveGame3dMountHost } from '@shell/platform/game3dHost'
import { showGame3dMobileTouchHint } from '@shell/utils/game3dMobileShell'
import { shouldEnable3dSceneShadows } from '@shell/engine3d/sceneQuality'
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
import { resolveGtrsCanvasStyle } from '@shell/utils/gtrsCanvasTheme'

let activeDispose: (() => void) | null = null

export function destroyPlantZombieDefense(): void {
  activeDispose?.()
  activeDispose = null
}

class PlantZombieDefenseLifecycle extends GameLifecycle {
  private state: GameState = createInitialState(1)
  private ended = false
  private hoverGx: number | null = null
  private hoverGz: number | null = null
  private ctx3d: ReturnType<typeof createEngine3d> | null = null
  private hud: ReturnType<typeof createPlantZombieHud> | null = null
  private view: PlantZombieScene | null = null
  private unbindInput: (() => void) | null = null
  private onMove: ((ev: PointerEvent) => void) | null = null

  async onInit() {
    const engine = this.ctx.engine
    engine.setOrientation('landscape')

    const parent = resolveGame3dMountHost(this.ctx.canvas)
    if (!parent) {
      this.ctx.onEnd()
      return
    }

    parent.innerHTML = ''

    const ctx3d = createEngine3d({
      parent,
      skipDefaultCameraControls: true,
    })
    this.ctx3d = ctx3d

    ctx3d.camera.detachControl()
    const camera = setupSideCamera(ctx3d.scene, ctx3d.canvas)
    ctx3d.scene.activeCamera = camera

    const [assets, models] = await Promise.all([
      loadPlantZombieAssets(ctx3d.scene),
      loadPlantZombieModels(ctx3d.scene),
    ])

    const enableShadows = shouldEnable3dSceneShadows()
    const gtrs = resolveGtrsCanvasStyle('plantZombieDefense', {
      primary: '#7ED957',
      background: '#102018',
      backgroundDark: '#0A120D',
      text: '#FFFFFF',
      accent: '#FFD166',
      hudBg: 'rgba(0,0,0,0.45)',
      danger: '#FF6B6B',
      muted: '#6B8F71',
      palette: ['#7ED957', '#FFD166', '#FF6B6B', '#9B5DE5'],
    })

    const hud = createPlantZombieHud(parent)
    const view = new PlantZombieScene(ctx3d.scene, camera, assets, models, enableShadows)
    this.hud = hud
    this.view = view
    const hideTouchHint = showGame3dMobileTouchHint(parent, 'plantDefense')

    const finish = (finalScore: number) => {
      if (this.ended) return
      this.ended = true
      persistRecords(this.state)
      const victory = this.state.phase === 'victory'
      const stars = victory ? computeStars(this.state) : 0
      gameActions.gameOver({
        victory,
        score: finalScore,
        stats: {
          level: this.state.levelIndex,
          waves: this.state.waveIndex,
          houseHp: this.state.houseHp,
          stars,
          bestScore: this.state.records.bestScore,
        },
      })
      activeDispose?.()
      activeDispose = null
    }

    const handleTap = (pick: { gx: number; gz: number } | null, sunId: number | null) => {
      if (this.ended) return
      if (this.state.phase === 'victory' || this.state.phase === 'defeat') return

      if (sunId != null) {
        tryCollectSun(this.state, sunId)
        return
      }

      if (!pick) return

      const existing = this.state.plants.find(p => p.gx === pick.gx && p.gz === pick.gz)
      if (existing) {
        tryRemovePlant(this.state, existing.id)
        return
      }

      if (canPlacePlantAt(pick.gx, pick.gz)) {
        tryPlacePlant(this.state, this.state.selectedPlant, pick.gx, pick.gz)
      }
    }

    this.unbindInput = bindCanvasInput(ctx3d.canvas, ctx3d.scene, { onTap: handleTap })

    hud.onAction(action => {
      if (this.ended) return
      switch (action.type) {
        case 'selectPlant':
          this.state.selectedPlant = action.kind
          break
        case 'nextWave':
          startNextWave(this.state)
          break
        case 'reset':
          resetRun(this.state, this.state.levelIndex)
          break
        case 'remove':
          if (this.state.selectedPlantId != null) tryRemovePlant(this.state, this.state.selectedPlantId)
          break
        case 'level':
          resetRun(this.state, action.level)
          break
        case 'endAfterResult':
          finish(this.state.score)
          break
      }
    })

    this.onMove = ev => {
      const { x, y } = clientToPickCoords(ctx3d.canvas, ev.clientX, ev.clientY)
      const pick = ctx3d.scene.pick(x, y)
      const meta = pick?.pickedMesh?.metadata as { gx?: number; gz?: number } | undefined
      if (meta?.gx != null && meta?.gz != null) {
        this.hoverGx = meta.gx
        this.hoverGz = meta.gz
      }
    }
    ctx3d.canvas.addEventListener('pointermove', this.onMove, { passive: true })

    const onUpdate = () => {
      if (this.ended || engine.isPaused()) return
      const dt = Math.min(0.05, ctx3d.engine.getDeltaTime() / 1000)
      const prevScore = this.state.score
      updateSimulation(this.state, dt)
      const scoreDelta = this.state.score - prevScore
      if (scoreDelta > 0) {
        engine.addScore(scoreDelta, window.innerWidth * 0.5, window.innerHeight * 0.35)
      }

      if (this.hoverGx != null && this.hoverGz != null && canPlacePlantAt(this.hoverGx, this.hoverGz)) {
        view.setHighlight(this.hoverGx, this.hoverGz)
      } else {
        view.setHighlight(null, null)
      }

      view.syncPlants(this.state.plants)
      view.syncZombies(this.state.zombies)
      view.syncPeas(this.state.peas)
      view.syncSuns(this.state.suns)
      view.syncSelection(this.state)
      hud.sync(this.state)

      camera.setTarget(new Vector3(0, 0, 0))
    }

    ctx3d.scene.onBeforeRenderObservable.add(onUpdate)
    hud.sync(this.state)

    activeDispose = () => {
      hideTouchHint()
      ctx3d.scene.onBeforeRenderObservable.removeCallback(onUpdate)
      this.unbindInput?.()
      if (this.onMove) ctx3d.canvas.removeEventListener('pointermove', this.onMove)
      hud.dispose()
      view.dispose()
      disposePlantZombieAssets(assets)
      disposeModelTemplates(models)
      ctx3d.dispose()
    }
  }

  onUpdate() {}
  onRender() {}
  onDestroy() {
    activeDispose?.()
    activeDispose = null
  }
}

export function startPlantZombieDefenseLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const host = new PlantZombieDefenseLifecycle(lifecycleCtx)
  void host.start()
  return host
}
