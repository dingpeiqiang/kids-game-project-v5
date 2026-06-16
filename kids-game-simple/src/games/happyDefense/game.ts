import { Vector3 } from '@babylonjs/core'
import { Color4 } from '@babylonjs/core'
import { GameLifecycle, type GameLifecycleContext } from '../../platform/GameLifecycle'
import { gameActions } from '../../platform/gameBridge'
import { createEngine3d } from '../../engine3d/createEngine3d'
import { cellKindAt } from './config'
import { bindCanvasInput, clientToPickCoords } from './input'
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
import { disposeHappyDefenseAssets, loadHappyDefenseAssets } from './render/assets'
import { disposeModelTemplates, loadHappyDefenseModels } from './render/models'
import { HappyDefenseScene, setupTopDownCamera } from './render/scene'
import { createHappyDefenseHud } from './render/ui'
import type { GameState } from './types'
import { resolveGtrsCanvasStyle } from '../../utils/gtrsCanvasTheme'

let activeDispose: (() => void) | null = null

export function destroyHappyDefense(): void {
  activeDispose?.()
  activeDispose = null
}

class HappyDefenseLifecycle extends GameLifecycle {
  private state: GameState = createInitialState()
  private ended = false
  private hoverGx: number | null = null
  private hoverGz: number | null = null
  private ctx3d: ReturnType<typeof createEngine3d> | null = null
  private hud: ReturnType<typeof createHappyDefenseHud> | null = null
  private view: HappyDefenseScene | null = null
  private unbindInput: (() => void) | null = null
  private onMove: ((ev: PointerEvent) => void) | null = null
  private assets: Awaited<ReturnType<typeof loadHappyDefenseAssets>> | null = null
  private models: Awaited<ReturnType<typeof loadHappyDefenseModels>> | null = null

  async onInit() {
    const engine = this.ctx.engine
    engine.setOrientation('landscape')

    const parent = this.ctx.canvas ?? document.getElementById('gameCanvas')
    if (!parent) {
      this.ctx.onEnd()
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
    this.ctx3d = ctx3d

    ctx3d.camera.detachControl()
    const camera = setupTopDownCamera(ctx3d.scene, ctx3d.canvas)
    ctx3d.scene.activeCamera = camera

    const [assets, models] = await Promise.all([
      loadHappyDefenseAssets(ctx3d.scene),
      loadHappyDefenseModels(ctx3d.scene),
    ])
    this.assets = assets
    this.models = models

    const enableShadows = !isMobile
    const gtrs = resolveGtrsCanvasStyle('happyDefense', {
      primary: '#6BCB77',
      background: '#1a1a2e',
      backgroundDark: '#0f0f1a',
      text: '#FFFFFF',
      accent: '#FFD700',
      hudBg: 'rgba(0,0,0,0.45)',
      danger: '#FF4444',
      muted: '#666666',
      palette: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#9B59B6', '#FF9F43'],
    })

    const hud = createHappyDefenseHud(parent)
    const view = new HappyDefenseScene(ctx3d.scene, camera, assets, models, enableShadows)
    this.hud = hud
    this.view = view

    const finish = (finalScore: number) => {
      if (this.ended) return
      this.ended = true
      persistRecords(this.state)
      gameActions.gameOver({
        victory: this.state.phase === 'victory',
        score: finalScore,
        stats: {
          waves: this.state.waveIndex,
          baseHp: this.state.baseHp,
          towersBuilt: this.state.towersBuilt,
          bestScore: this.state.records.bestScore,
          fastestClearSec: this.state.records.fastestClearSec,
        },
      })
      activeDispose?.()
      activeDispose = null
    }

    this.unbindInput = bindCanvasInput(ctx3d.canvas, ctx3d.scene, camera, {
      onTap: pick => {
        if (this.ended || !pick) return
        if (this.state.phase === 'buffPick' || this.state.phase === 'victory' || this.state.phase === 'defeat') return
        const existing = this.state.towers.find(t => t.gx === pick.gx && t.gz === pick.gz)
        if (existing) {
          this.state.selectedTowerId = existing.id
          this.state.selectedTower = existing.kind
          return
        }
        if (canBuildAt(this.state, pick.gx, pick.gz)) {
          tryPlaceTower(this.state, this.state.selectedTower, pick.gx, pick.gz)
        }
      },
    })

    hud.onAction(action => {
      if (this.ended) return
      switch (action.type) {
        case 'selectTower':
          this.state.selectedTower = action.kind
          break
        case 'nextWave':
          if (this.state.phase === 'buffPick') skipBuffPick(this.state)
          startNextWave(this.state)
          break
        case 'reset':
          resetRun(this.state)
          break
        case 'upgrade':
          if (this.state.selectedTowerId != null) tryUpgradeTower(this.state, this.state.selectedTowerId)
          break
        case 'sell':
          if (this.state.selectedTowerId != null) trySellTower(this.state, this.state.selectedTowerId)
          break
        case 'buff':
          applyBuffChoice(this.state, action.kind)
          break
        case 'skipBuff':
          skipBuffPick(this.state)
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
      if (scoreDelta > 0) engine.addScore(scoreDelta, window.innerWidth * 0.5, window.innerHeight * 0.35)

      if (this.hoverGx != null && this.hoverGz != null && cellKindAt(this.hoverGx, this.hoverGz) === 'build') {
        ctx3d.scene.clearColor = Color4.FromHexString(gtrs.backgroundDark)
        view.setHighlight(this.hoverGx, this.hoverGz)
      } else {
        ctx3d.scene.clearColor = Color4.FromHexString(gtrs.background)
        view.setHighlight(null, null)
      }

      view.syncTowers(this.state.towers)
      view.syncEnemies(this.state.enemies)
      view.syncSelection(this.state)
      hud.sync(this.state)
      camera.setTarget(new Vector3(0, 0, 0))
    }

    ctx3d.scene.onBeforeRenderObservable.add(onUpdate)
    hud.sync(this.state)

    activeDispose = () => {
      ctx3d.scene.onBeforeRenderObservable.removeCallback(onUpdate)
      this.unbindInput?.()
      if (this.onMove) ctx3d.canvas.removeEventListener('pointermove', this.onMove)
      hud.dispose()
      view.dispose()
      disposeHappyDefenseAssets(assets)
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

export function startHappyDefenseLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const host = new HappyDefenseLifecycle(lifecycleCtx)
  void host.start()
  return host
}
