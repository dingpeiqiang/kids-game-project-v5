import {
  ArcRotateCamera,
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core'
import { ENEMY_DEFS, GAME_CONFIG, TOWER_DEFS, cellKindAt, gridToWorld } from '../config'

function hexToColor3(hex: string): Color3 {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  return new Color3(r, g, b)
}
import { enemyWorldPos } from '../logic/gameLoop'
import type { EnemyState, GameState, TowerState } from '../types'

export class HappyDefenseScene {
  private groundTiles: Mesh[] = []
  private towerMeshes = new Map<number, Mesh>()
  private enemyMeshes = new Map<number, Mesh>()
  private highlight: Mesh | null = null
  private baseMesh: Mesh | null = null

  constructor(
    private scene: Scene,
    public camera: ArcRotateCamera,
  ) {
    this.buildMap()
  }

  private cellColor(gx: number, gz: number): Color3 {
    const k = cellKindAt(gx, gz)
    if (k === 'path') return new Color3(0.72, 0.58, 0.42)
    if (k === 'block') return new Color3(0.45, 0.5, 0.42)
    if (k === 'base') return new Color3(0.95, 0.45, 0.5)
    return new Color3(0.55, 0.82, 0.45)
  }

  private buildMap(): void {
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
        const mat = new StandardMaterial(`tm_${gx}_${gz}`, this.scene)
        mat.diffuseColor = this.cellColor(gx, gz)
        mat.specularColor = new Color3(0.1, 0.1, 0.1)
        tile.material = mat
        tile.isPickable = true
        tile.metadata = { gx, gz }
        this.groundTiles.push(tile)
        if (cellKindAt(gx, gz) === 'base') {
          const core = MeshBuilder.CreateCylinder(
            'baseCore',
            { height: 0.8, diameter: cs * 0.7 },
            this.scene,
          )
          core.position = new Vector3(w.x, 0.5, w.z)
          const cm = new StandardMaterial('baseMat', this.scene)
          cm.diffuseColor = new Color3(1, 0.35, 0.45)
          cm.emissiveColor = new Color3(0.25, 0.05, 0.1)
          core.material = cm
          this.baseMesh = core
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

  private towerMesh(tower: TowerState): Mesh {
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
    return mesh
  }

  syncTowers(towers: TowerState[]): void {
    const alive = new Set(towers.map(t => t.id))
    for (const [id, mesh] of this.towerMeshes) {
      if (!alive.has(id)) {
        mesh.dispose()
        this.towerMeshes.delete(id)
      }
    }
    for (const t of towers) {
      let mesh = this.towerMeshes.get(t.id)
      if (!mesh) {
        mesh = this.towerMesh(t)
        this.towerMeshes.set(t.id, mesh)
      } else {
        const w = gridToWorld(t.gx, t.gz)
        const h = 0.5 + t.level * 0.22
        mesh.position = new Vector3(w.x, h / 2 + 0.2, w.z)
        mesh.scaling.y = 0.8 + t.level * 0.15
      }
      const sel = mesh.material as StandardMaterial
      if (sel) {
        const def = TOWER_DEFS[t.kind]
        const c = Color3.FromHexString(def.color)
        sel.emissiveColor = c.scale(0.35)
      }
    }
  }

  syncEnemies(enemies: EnemyState[]): void {
    const alive = new Set(enemies.filter(e => e.alive).map(e => e.id))
    for (const [id, mesh] of this.enemyMeshes) {
      if (!alive.has(id)) {
        mesh.dispose()
        this.enemyMeshes.delete(id)
      }
    }
    for (const e of enemies) {
      if (!e.alive) continue
      let mesh = this.enemyMeshes.get(e.id)
      const pos = enemyWorldPos(e)
      const def = ENEMY_DEFS[e.kind]
      const scale = e.kind === 'boss' ? 1.4 : e.kind === 'tank' ? 1.1 : 0.75
      if (!mesh) {
        mesh = MeshBuilder.CreateSphere(`enemy_${e.id}`, { diameter: 0.55 * scale }, this.scene)
        const m = new StandardMaterial(`emat_${e.id}`, this.scene)
        if (e.kind === 'grunt') m.diffuseColor = new Color3(0.65, 0.85, 0.95)
        else if (e.kind === 'flyer') m.diffuseColor = new Color3(0.95, 0.75, 1)
        else if (e.kind === 'tank') m.diffuseColor = new Color3(0.55, 0.45, 0.9)
        else m.diffuseColor = new Color3(1, 0.5, 0.35)
        mesh.material = m
        this.enemyMeshes.set(e.id, mesh)
      }
      mesh.position = new Vector3(pos.x, pos.y + 0.35 * scale, pos.z)
      if (e.freezeTimer > 0) {
        mesh.scaling.setAll(scale * 0.95)
      } else {
        mesh.scaling.setAll(scale)
      }
      void def
    }
  }

  syncSelection(state: GameState): void {
    for (const [id, mesh] of this.towerMeshes) {
      const mat = mesh.material as StandardMaterial
      if (!mat) continue
      const t = state.towers.find(x => x.id === id)
      if (!t) continue
      const def = TOWER_DEFS[t.kind]
      const c = Color3.FromHexString(def.color)
      mat.emissiveColor =
        state.selectedTowerId === id ? new Color3(0.9, 0.9, 0.2) : c.scale(0.25)
    }
  }

  dispose(): void {
    this.highlight?.dispose()
    this.baseMesh?.dispose()
    for (const m of this.groundTiles) m.dispose()
    for (const m of this.towerMeshes.values()) m.dispose()
    for (const m of this.enemyMeshes.values()) m.dispose()
    this.groundTiles = []
    this.towerMeshes.clear()
    this.enemyMeshes.clear()
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