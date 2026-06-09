import {
  Mesh,
  VertexData,
  StandardMaterial,
  Color3,
  MeshBuilder,
  Vector3,
  Scene,
} from '@babylonjs/core'
import type { CreatureState } from '../types'
import { BLOCK_COLORS } from '../config'
import { buildExposedMesh } from '../logic/meshData'
import type { VoxelGrid } from '../logic/voxelGrid'

export class VoxelSceneView {
  private terrainMesh: Mesh | null = null
  private creatureMeshes = new Map<number, Mesh>()

  constructor(private scene: Scene) {}

  rebuildTerrain(grid: VoxelGrid): void {
    this.terrainMesh?.dispose()
    const data = buildExposedMesh(grid)
    if (data.positions.length === 0) return

    const mesh = new Mesh('voxelTerrain', this.scene)
    const vd = new VertexData()
    vd.positions = data.positions
    vd.indices = data.indices
    vd.colors = data.colors
    vd.applyToMesh(mesh)

    const mat = new StandardMaterial('voxelMat', this.scene)
    mat.backFaceCulling = true
    mat.diffuseColor = new Color3(1, 1, 1)
    mat.emissiveColor = new Color3(0.05, 0.05, 0.05)
    mesh.material = mat
    mesh.isPickable = true
    this.terrainMesh = mesh
  }

  syncCreatures(creatures: CreatureState[]): void {
    const alive = new Set(creatures.map(c => c.id))
    for (const [id, mesh] of this.creatureMeshes) {
      if (!alive.has(id)) {
        mesh.dispose()
        this.creatureMeshes.delete(id)
      }
    }
    for (const c of creatures) {
      let mesh = this.creatureMeshes.get(c.id)
      if (!mesh) {
        const size = c.kind === 'deer' ? 1.2 : c.kind === 'bird' ? 0.5 : 0.7
        mesh = MeshBuilder.CreateBox(`critter_${c.id}`, { size }, this.scene)
        const m = new StandardMaterial(`cm_${c.id}`, this.scene)
        if (c.kind === 'deer') m.diffuseColor = new Color3(0.65, 0.45, 0.3)
        else if (c.kind === 'bunny') m.diffuseColor = new Color3(0.95, 0.9, 0.95)
        else if (c.kind === 'bird') m.diffuseColor = new Color3(0.4, 0.6, 0.95)
        else m.diffuseColor = new Color3(0.9, 0.5, 0.2)
        mesh.material = m
        this.creatureMeshes.set(c.id, mesh)
      }
      mesh.position = new Vector3(c.x + 0.5, c.y, c.z + 0.5)
    }
  }

  setDayNight(phase: number, isNight: boolean): void {
    const t = phase
    const sky = isNight ? 0.15 + t * 0.1 : 0.55 + t * 0.25
    this.scene.clearColor.r = sky * 0.6
    this.scene.clearColor.g = sky * 0.85
    this.scene.clearColor.b = 0.95
    const hemi = this.scene.lights.find(l => l.name === 'hemiLight')
    if (hemi && 'intensity' in hemi) {
      ;(hemi as { intensity: number }).intensity = isNight ? 0.35 : 0.95
    }
  }

  highlightBlockEmissive(grid: VoxelGrid, x: number, y: number, z: number): void {
    void grid
    void x
    void y
    void z
    void BLOCK_COLORS
  }

  dispose(): void {
    this.terrainMesh?.dispose()
    for (const m of this.creatureMeshes.values()) m.dispose()
    this.creatureMeshes.clear()
  }
}