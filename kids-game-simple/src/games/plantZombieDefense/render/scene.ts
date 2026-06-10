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
import { GAME_CONFIG, PLANT_DEFS, ZOMBIE_DEFS, cellTypeAt, gridToWorld } from '../config'
import { GridCellType, PlantKind } from '../types'
import { zombieWorldPos } from '../logic/gameLoop'
import type { GameState, PeaProjectile, PlantState, SunPickup, ZombieState } from '../types'
import type { PlantZombieAssets } from './assets'
import {
  addShadowCasters,
  cloneHouseModel,
  clonePlantModel,
  cloneZombieModel,
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

type EntityVisual = Mesh | TransformNode

export class PlantZombieScene {
  private groundTiles: Mesh[] = []
  private plantVisuals = new Map<number, EntityVisual>()
  private zombieVisuals = new Map<number, EntityVisual>()
  private peaMeshes = new Map<number, Mesh>()
  private sunMeshes = new Map<number, Mesh>()
  private highlight: Mesh | null = null
  private houseVisual: EntityVisual | null = null
  private tileMats = new Map<string, StandardMaterial>()
  private shadowGen: ShadowGenerator | null = null

  constructor(
    private scene: Scene,
    public camera: ArcRotateCamera,
    assets: PlantZombieAssets,
    private models: ModelTemplates,
    enableShadows: boolean,
  ) {
    if (enableShadows) this.setupShadows()
    this.buildMap(assets)
  }

  private setupShadows(): void {
    const sun = new DirectionalLight('pzdSun', new Vector3(-0.35, -1, -0.25), this.scene)
    sun.position = new Vector3(6, 12, 4)
    sun.intensity = 0.5
    this.shadowGen = new ShadowGenerator(512, sun)
    this.shadowGen.useBlurExponentialShadowMap = true
    this.shadowGen.blurKernel = 14
  }

  private cellColor(gx: number, gz: number): Color3 {
    const t = cellTypeAt(gx, gz)
    if (t === GridCellType.path) return new Color3(0.76, 0.68, 0.52)
    if (t === GridCellType.base) return new Color3(0.91, 0.56, 0.42)
    if (t === GridCellType.forbid) return new Color3(0.5, 0.5, 0.5)
    return new Color3(0.76, 0.91, 0.73)
  }

  private getTileMaterial(assets: PlantZombieAssets, gx: number, gz: number): StandardMaterial {
    const t = cellTypeAt(gx, gz)
    const useLawn = t === GridCellType.empty && assets.lawn
    const cacheKey = useLawn ? 'tex_lawn' : `solid_${t}`
    let mat = this.tileMats.get(cacheKey)
    if (mat) return mat

    mat = new StandardMaterial(`pzd_tile_${cacheKey}`, this.scene)
    mat.specularColor = new Color3(0.06, 0.06, 0.06)
    if (useLawn && assets.lawn) {
      mat.diffuseTexture = assets.lawn
      mat.diffuseColor = new Color3(1, 1, 1)
    } else {
      mat.diffuseColor = this.cellColor(gx, gz)
    }
    this.tileMats.set(cacheKey, mat)
    return mat
  }

  private placeHouse(gx: number, gz: number): void {
    const w = gridToWorld(gx, gz)
    const glb = cloneHouseModel(this.models, 'house_base')
    if (glb) {
      glb.position = new Vector3(w.x, 0, w.z)
      if (this.shadowGen) addShadowCasters(glb, this.shadowGen)
      this.houseVisual = glb
      return
    }
    const cs = GAME_CONFIG.cellSize
    const box = MeshBuilder.CreateBox('house', { width: cs * 0.9, height: 1.2, depth: cs * 0.9 }, this.scene)
    box.position = new Vector3(w.x, 0.7, w.z)
    const m = new StandardMaterial('houseMat', this.scene)
    m.diffuseColor = hexToColor3('#E88F6B')
    box.material = m
    if (this.shadowGen) this.shadowGen.addShadowCaster(box)
    this.houseVisual = box
  }

  private buildMap(assets: PlantZombieAssets): void {
    const cs = GAME_CONFIG.cellSize
    for (let gz = 0; gz < GAME_CONFIG.gridH; gz++) {
      for (let gx = 0; gx < GAME_CONFIG.gridW; gx++) {
        const w = gridToWorld(gx, gz)
        const tile = MeshBuilder.CreateBox(
          `pzd_tile_${gx}_${gz}`,
          { width: cs * 0.96, height: 0.2, depth: cs * 0.96 },
          this.scene,
        )
        tile.position = new Vector3(w.x, 0.1, w.z)
        tile.material = this.getTileMaterial(assets, gx, gz)
        tile.isPickable = true
        tile.metadata = { gx, gz }
        tile.receiveShadows = !!this.shadowGen
        this.groundTiles.push(tile)
        if (cellTypeAt(gx, gz) === GridCellType.base) this.placeHouse(gx, gz)
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
    if (!canPlaceHighlight(gx, gz)) return
    const w = gridToWorld(gx, gz)
    const cs = GAME_CONFIG.cellSize
    const ring = MeshBuilder.CreateBox(
      'hl',
      { width: cs * 0.98, height: 0.04, depth: cs * 0.98 },
      this.scene,
    )
    ring.position = new Vector3(w.x, 0.26, w.z)
    const m = new StandardMaterial('hlm', this.scene)
    m.diffuseColor = new Color3(0.45, 0.9, 0.4)
    m.alpha = 0.5
    ring.material = m
    this.highlight = ring
  }

  private fallbackPlant(p: PlantState): Mesh {
    const def = PLANT_DEFS[p.kind]
    const w = gridToWorld(p.gx, p.gz)
    const h = p.kind === PlantKind.wallnut ? 0.55 : 0.75
    const mesh = MeshBuilder.CreateCylinder(`plant_${p.id}`, { height: h, diameter: 0.5 }, this.scene)
    mesh.position = new Vector3(w.x, h / 2 + 0.15, w.z)
    const mat = new StandardMaterial(`pm_${p.id}`, this.scene)
    const c = hexToColor3(def.color)
    mat.diffuseColor = c
    mat.emissiveColor = c.scale(0.2)
    mesh.material = mat
    if (this.shadowGen) this.shadowGen.addShadowCaster(mesh)
    return mesh
  }

  syncPlants(plants: PlantState[]): void {
    const alive = new Set(plants.map(p => p.id))
    for (const [id, v] of this.plantVisuals) {
      if (!alive.has(id)) {
        disposeVisual(v)
        this.plantVisuals.delete(id)
      }
    }
    for (const p of plants) {
      if (!p.alive) continue
      let v = this.plantVisuals.get(p.id)
      if (!v) {
        const glb = clonePlantModel(this.models, p.kind, `plant_${p.id}`)
        if (glb) {
          const w = gridToWorld(p.gx, p.gz)
          glb.position = new Vector3(w.x, 0.15, w.z)
          if (this.shadowGen) addShadowCasters(glb, this.shadowGen)
          v = glb
        } else {
          v = this.fallbackPlant(p)
        }
        this.plantVisuals.set(p.id, v)
      }
    }
  }

  syncZombies(zombies: ZombieState[]): void {
    const alive = new Set(zombies.filter(z => z.alive).map(z => z.id))
    for (const [id, v] of this.zombieVisuals) {
      if (!alive.has(id)) {
        disposeVisual(v)
        this.zombieVisuals.delete(id)
      }
    }
    for (const z of zombies) {
      if (!z.alive) continue
      let v = this.zombieVisuals.get(z.id)
      const pos = zombieWorldPos(z)
      if (!v) {
        const glb = cloneZombieModel(this.models, z.kind, `zombie_${z.id}`)
        if (glb) {
          if (this.shadowGen) addShadowCasters(glb, this.shadowGen)
          v = glb
        } else {
          const mesh = MeshBuilder.CreateSphere(`zombie_${z.id}`, { diameter: 0.55 }, this.scene)
          const mat = new StandardMaterial(`zm_${z.id}`, this.scene)
          mat.diffuseColor = hexToColor3(ZOMBIE_DEFS[z.kind].color)
          mesh.material = mat
          if (this.shadowGen) this.shadowGen.addShadowCaster(mesh)
          v = mesh
        }
        this.zombieVisuals.set(z.id, v)
      }
      v.position = new Vector3(pos.x, pos.y, pos.z)
    }
  }

  syncPeas(peas: PeaProjectile[]): void {
    const alive = new Set(peas.filter(p => p.alive).map(p => p.id))
    for (const [id, m] of this.peaMeshes) {
      if (!alive.has(id)) {
        m.dispose()
        this.peaMeshes.delete(id)
      }
    }
    for (const pea of peas) {
      if (!pea.alive) continue
      let m = this.peaMeshes.get(pea.id)
      if (!m) {
        m = MeshBuilder.CreateSphere(`pea_${pea.id}`, { diameter: 0.18 }, this.scene)
        const mat = new StandardMaterial(`peaMat_${pea.id}`, this.scene)
        mat.diffuseColor = pea.slowMul < 1 ? hexToColor3('#87CFF0') : hexToColor3('#72D566')
        m.material = mat
        this.peaMeshes.set(pea.id, m)
      }
      m.position = new Vector3(pea.x, 0.45, pea.z)
    }
  }

  syncSuns(suns: SunPickup[]): void {
    const alive = new Set(suns.filter(s => s.alive).map(s => s.id))
    for (const [id, m] of this.sunMeshes) {
      if (!alive.has(id)) {
        m.dispose()
        this.sunMeshes.delete(id)
      }
    }
    for (const s of suns) {
      if (!s.alive) continue
      let m = this.sunMeshes.get(s.id)
      if (!m) {
        m = MeshBuilder.CreateSphere(`sun_${s.id}`, { diameter: 0.35 }, this.scene)
        const mat = new StandardMaterial(`sunMat_${s.id}`, this.scene)
        mat.diffuseColor = hexToColor3('#FFD23F')
        mat.emissiveColor = hexToColor3('#FFD23F').scale(0.35)
        m.material = mat
        m.metadata = { sunId: s.id }
        m.isPickable = true
        this.sunMeshes.set(s.id, m)
      }
      m.position = new Vector3(s.x, 0.55, s.z)
    }
  }

  syncSelection(state: GameState): void {
    for (const [id, visual] of this.plantVisuals) {
      if (!(visual instanceof Mesh)) continue
      const mat = visual.material as StandardMaterial
      if (!mat) continue
      const p = state.plants.find(x => x.id === id)
      if (!p) continue
      const c = hexToColor3(PLANT_DEFS[p.kind].color)
      mat.emissiveColor = state.selectedPlantId === id ? new Color3(0.85, 0.85, 0.2) : c.scale(0.15)
    }
  }

  dispose(): void {
    this.highlight?.dispose()
    if (this.houseVisual) disposeVisual(this.houseVisual)
    this.shadowGen?.dispose()
    for (const m of this.groundTiles) m.dispose()
    for (const v of this.plantVisuals.values()) disposeVisual(v)
    for (const v of this.zombieVisuals.values()) disposeVisual(v)
    for (const m of this.peaMeshes.values()) m.dispose()
    for (const m of this.sunMeshes.values()) m.dispose()
    for (const m of this.tileMats.values()) m.dispose()
    this.groundTiles = []
    this.plantVisuals.clear()
    this.zombieVisuals.clear()
    this.peaMeshes.clear()
    this.sunMeshes.clear()
    this.tileMats.clear()
  }
}

function canPlaceHighlight(gx: number, gz: number): boolean {
  return cellTypeAt(gx, gz) === GridCellType.empty
}

export function setupSideCamera(scene: Scene, canvas: HTMLCanvasElement): ArcRotateCamera {
  const cam = new ArcRotateCamera(
    'pzdCam',
    -Math.PI / 2.1,
    Math.PI / 3.4,
    18,
    new Vector3(0, 0, 0),
    scene,
  )
  cam.attachControl(canvas, true)
  cam.lowerRadiusLimit = 12
  cam.upperRadiusLimit = 28
  cam.wheelPrecision = 20
  cam.panningSensibility = 0
  return cam
}