import {
  ArcRotateCamera,
  Color3,
  DirectionalLight,
  Mesh,
  MeshBuilder,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core'
import { GAME_CONFIG, TOWER_DEFS, cellKindAt, gridToWorld } from '../config'
import { enemyWorldPos } from '../logic/gameLoop'
import type { EnemyState, GameState, TowerState } from '../types'
import type { HappyDefenseAssets } from './assets'
import { tileKeyForCell } from './assets'
import {
  addShadowCasters,
  cloneBaseModel,
  cloneEnemyModel,
  cloneTowerModel,
  disposeVisual,
  type ModelTemplates,
} from './models'

function hexToColor3(hex: string): Color3 {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  return new Color3(r, g, b)
}

const ENEMY_COLORS: Record<string, Color3> = {
  grunt: new Color3(0.65, 0.85, 0.95),
  flyer: new Color3(0.95, 0.75, 1),
  tank: new Color3(0.55, 0.45, 0.9),
  boss: new Color3(1, 0.5, 0.35),
}

type TowerVisual = Mesh | TransformNode
type EnemyVisual = Mesh | TransformNode

export class HappyDefenseScene {
  private groundTiles: Mesh[] = []
  private towerVisuals = new Map<number, TowerVisual>()
  private enemyVisuals = new Map<number, EnemyVisual>()
  private highlight: Mesh | null = null
  private baseVisual: TowerVisual | null = null
  private tileMats = new Map<string, StandardMaterial>()
  private shadowGen: ShadowGenerator | null = null
  private enemyMats: Record<string, StandardMaterial> = {}

  constructor(
    private scene: Scene,
    public camera: ArcRotateCamera,
    assets: HappyDefenseAssets,
    private models: ModelTemplates,
    enableShadows: boolean,
  ) {
    for (const kind of Object.keys(ENEMY_COLORS)) {
      const m = new StandardMaterial(`hd_enemy_${kind}`, this.scene)
      m.diffuseColor = ENEMY_COLORS[kind]!.clone()
      m.specularColor = new Color3(0.15, 0.15, 0.15)
      this.enemyMats[kind] = m
    }
    if (enableShadows) this.setupShadows()
    this.buildMap(assets)
  }

  private setupShadows(): void {
    const sun = new DirectionalLight('hdSun', new Vector3(-0.4, -1, -0.3), this.scene)
    sun.position = new Vector3(8, 14, 6)
    sun.intensity = 0.55
    this.shadowGen = new ShadowGenerator(512, sun)
    this.shadowGen.useBlurExponentialShadowMap = true
    this.shadowGen.blurKernel = 16
  }

  private cellColor(gx: number, gz: number): Color3 {
    const k = cellKindAt(gx, gz)
    if (k === 'path') return new Color3(0.72, 0.58, 0.42)
    if (k === 'block') return new Color3(0.45, 0.5, 0.42)
    if (k === 'base') return new Color3(0.95, 0.45, 0.5)
    return new Color3(0.55, 0.82, 0.45)
  }

  private getTileMaterial(assets: HappyDefenseAssets, gx: number, gz: number): StandardMaterial {
    const kind = cellKindAt(gx, gz)
    const texKey = tileKeyForCell(kind)
    const cacheKey = texKey && assets.tiles[texKey] ? `tex_${texKey}` : `solid_${kind}`
    let mat = this.tileMats.get(cacheKey)
    if (mat) return mat

    mat = new StandardMaterial(`hd_tile_${cacheKey}`, this.scene)
    mat.specularColor = new Color3(0.08, 0.08, 0.08)
    if (texKey && assets.tiles[texKey]) {
      mat.diffuseTexture = assets.tiles[texKey]
      mat.diffuseColor = new Color3(1, 1, 1)
    } else {
      mat.diffuseColor = this.cellColor(gx, gz)
    }
    this.tileMats.set(cacheKey, mat)
    return mat
  }

  private placeBaseAt(gx: number, gz: number): void {
    const w = gridToWorld(gx, gz)
    const cs = GAME_CONFIG.cellSize
    const glb = cloneBaseModel(this.models, 'base_live')
    if (glb) {
      glb.position = new Vector3(w.x, 0, w.z)
      if (this.shadowGen) addShadowCasters(glb, this.shadowGen)
      this.baseVisual = glb
      return
    }
    const core = MeshBuilder.CreateCylinder('baseCore', { height: 0.8, diameter: cs * 0.7 }, this.scene)
    core.position = new Vector3(w.x, 0.5, w.z)
    const cm = new StandardMaterial('baseMat', this.scene)
    cm.diffuseColor = new Color3(1, 0.35, 0.45)
    cm.emissiveColor = new Color3(0.25, 0.05, 0.1)
    core.material = cm
    if (this.shadowGen) {
      this.shadowGen.addShadowCaster(core)
      core.receiveShadows = true
    }
    this.baseVisual = core
  }

  private buildMap(assets: HappyDefenseAssets): void {
    const cs = GAME_CONFIG.cellSize
    for (let gz = 0; gz < GAME_CONFIG.gridH; gz++) {
      for (let gx = 0; gx < GAME_CONFIG.gridW; gx++) {
        const w = gridToWorld(gx, gz)
        const tile = MeshBuilder.CreateBox(
          `tile_${gx}_${gz}`,
          { width: cs * 0.96, height: 0.22, depth: cs * 0.96 },
          this.scene,
        )
        tile.position = new Vector3(w.x, 0.11, w.z)
        tile.material = this.getTileMaterial(assets, gx, gz)
        tile.isPickable = true
        tile.metadata = { gx, gz }
        tile.receiveShadows = !!this.shadowGen
        this.groundTiles.push(tile)
        if (cellKindAt(gx, gz) === 'base') {
          this.placeBaseAt(gx, gz)
        }
      }
    }
    this.scene.clearColor.r = 0.55
    this.scene.clearColor.g = 0.78
    this.scene.clearColor.b = 0.95
  }

  setHighlight(gx: number | null, gz: number | null): void {
    this.highlight?.dispose()
    this.highlight = null
    if (gx == null || gz == null) return
    if (cellKindAt(gx, gz) !== 'build') return
    const w = gridToWorld(gx, gz)
    const cs = GAME_CONFIG.cellSize
    const ring = MeshBuilder.CreateBox(
      'hl',
      { width: cs * 0.98, height: 0.05, depth: cs * 0.98 },
      this.scene,
    )
    ring.position = new Vector3(w.x, 0.28, w.z)
    const m = new StandardMaterial('hlm', this.scene)
    m.diffuseColor = new Color3(1, 0.95, 0.4)
    m.alpha = 0.55
    ring.material = m
    this.highlight = ring
  }

  private fallbackTowerMesh(tower: TowerState): Mesh {
    const def = TOWER_DEFS[tower.kind]
    const w = gridToWorld(tower.gx, tower.gz)
    const h = 0.5 + tower.level * 0.22
    const mesh = MeshBuilder.CreateCylinder(
      `tower_${tower.id}`,
      { height: h, diameter: 0.55 + tower.level * 0.08 },
      this.scene,
    )
    mesh.position = new Vector3(w.x, h / 2 + 0.2, w.z)
    const mat = new StandardMaterial(`tmat_${tower.id}`, this.scene)
    const c = hexToColor3(def.color)
    mat.diffuseColor = c
    mat.emissiveColor = c.scale(0.25)
    mesh.material = mat
    mesh.metadata = { towerId: tower.id }
    if (this.shadowGen) this.shadowGen.addShadowCaster(mesh)
    return mesh
  }

  private createTowerVisual(tower: TowerState): TowerVisual {
    const glb = cloneTowerModel(this.models, tower.kind, `tower_${tower.id}`)
    if (glb) {
      const w = gridToWorld(tower.gx, tower.gz)
      glb.position = new Vector3(w.x, 0.2, w.z)
      glb.scaling.y = 0.85 + tower.level * 0.12
      if (this.shadowGen) addShadowCasters(glb, this.shadowGen)
      return glb
    }
    return this.fallbackTowerMesh(tower)
  }

  private updateTowerTransform(tower: TowerState, visual: TowerVisual): void {
    const w = gridToWorld(tower.gx, tower.gz)
    if (visual instanceof Mesh && visual.name.startsWith('tower_')) {
      const h = 0.5 + tower.level * 0.22
      visual.position = new Vector3(w.x, h / 2 + 0.2, w.z)
      visual.scaling.y = 0.8 + tower.level * 0.15
    } else {
      visual.position = new Vector3(w.x, 0.2, w.z)
      visual.scaling.y = 0.85 + tower.level * 0.12
    }
  }

  syncTowers(towers: TowerState[]): void {
    const alive = new Set(towers.map(t => t.id))
    for (const [id, visual] of this.towerVisuals) {
      if (!alive.has(id)) {
        disposeVisual(visual)
        this.towerVisuals.delete(id)
      }
    }
    for (const t of towers) {
      let visual = this.towerVisuals.get(t.id)
      if (!visual) {
        visual = this.createTowerVisual(t)
        this.towerVisuals.set(t.id, visual)
      } else {
        this.updateTowerTransform(t, visual)
      }
    }
  }

  private createEnemyVisual(e: EnemyState): EnemyVisual {
    const scale = e.kind === 'boss' ? 1.4 : e.kind === 'tank' ? 1.1 : 0.75
    const glb = cloneEnemyModel(this.models, e.kind, `enemy_${e.id}`)
    if (glb) {
      if (this.shadowGen) addShadowCasters(glb, this.shadowGen)
      return glb
    }
    const mesh = MeshBuilder.CreateSphere(`enemy_${e.id}`, { diameter: 0.55 * scale }, this.scene)
    mesh.material = this.enemyMats[e.kind] ?? this.enemyMats.grunt!
    if (this.shadowGen) this.shadowGen.addShadowCaster(mesh)
    return mesh
  }

  syncEnemies(enemies: EnemyState[]): void {
    const alive = new Set(enemies.filter(e => e.alive).map(e => e.id))
    for (const [id, visual] of this.enemyVisuals) {
      if (!alive.has(id)) {
        disposeVisual(visual)
        this.enemyVisuals.delete(id)
      }
    }
    for (const e of enemies) {
      if (!e.alive) continue
      let visual = this.enemyVisuals.get(e.id)
      const pos = enemyWorldPos(e)
      const scale = e.kind === 'boss' ? 1.4 : e.kind === 'tank' ? 1.1 : 0.75
      if (!visual) {
        visual = this.createEnemyVisual(e)
        this.enemyVisuals.set(e.id, visual)
      }
      const isFallback = visual instanceof Mesh
      const yLift = isFallback ? 0.35 * scale : 0.15
      visual.position = new Vector3(pos.x, pos.y + yLift, pos.z)
      if (isFallback) {
        visual.scaling.setAll(e.freezeTimer > 0 ? scale * 0.95 : scale)
      }
    }
  }

  syncSelection(state: GameState): void {
    for (const [id, visual] of this.towerVisuals) {
      if (!(visual instanceof Mesh)) continue
      const mat = visual.material as StandardMaterial
      if (!mat) continue
      const t = state.towers.find(x => x.id === id)
      if (!t) continue
      const c = hexToColor3(TOWER_DEFS[t.kind].color)
      mat.emissiveColor =
        state.selectedTowerId === id ? new Color3(0.9, 0.9, 0.2) : c.scale(0.25)
    }
  }

  dispose(): void {
    this.highlight?.dispose()
    if (this.baseVisual) disposeVisual(this.baseVisual)
    this.shadowGen?.dispose()
    for (const m of this.groundTiles) m.dispose()
    for (const v of this.towerVisuals.values()) disposeVisual(v)
    for (const v of this.enemyVisuals.values()) disposeVisual(v)
    for (const m of this.tileMats.values()) m.dispose()
    for (const m of Object.values(this.enemyMats)) m.dispose()
    this.groundTiles = []
    this.towerVisuals.clear()
    this.enemyVisuals.clear()
    this.tileMats.clear()
  }
}

export function setupTopDownCamera(scene: Scene, canvas: HTMLCanvasElement): ArcRotateCamera {
  const cam = new ArcRotateCamera(
    'tdCam',
    -Math.PI / 2,
    Math.PI / 3.2,
    22,
    new Vector3(0, 0, 0),
    scene,
  )
  cam.attachControl(canvas, true)
  cam.lowerRadiusLimit = 14
  cam.upperRadiusLimit = 32
  cam.wheelPrecision = 18
  cam.panningSensibility = 0
  return cam
}