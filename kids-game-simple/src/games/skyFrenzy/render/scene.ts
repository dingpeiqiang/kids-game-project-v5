import {
  ArcRotateCamera,
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core'
import { ENEMY_DEFS, GAME_CONFIG } from '../config'
import type { GameState } from '../types'

function hexToColor3(hex: string): Color3 {
  const h = hex.replace('#', '')
  return new Color3(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  )
}

export class SkyFrenzyScene {
  private cloudMeshes: Mesh[] = []
  private playerMesh: Mesh | null = null
  private enemyMeshes = new Map<number, Mesh>()
  private playerBulletMeshes = new Map<number, Mesh>()
  private enemyBulletMeshes = new Map<number, Mesh>()
  private pickupMeshes = new Map<number, Mesh>()
  private flashPlane: Mesh | null = null

  constructor(private scene: Scene) {
    this.buildArena()
    this.buildClouds()
    scene.clearColor.r = 0.45
    scene.clearColor.g = 0.72
    scene.clearColor.b = 0.98
  }

  private buildArena(): void {
    const w = GAME_CONFIG.arenaHalfW * 2 + 4
    const d = GAME_CONFIG.arenaHalfD * 2 + 6
    const ground = MeshBuilder.CreateGround('skyGround', { width: w, height: d }, this.scene)
    ground.position.y = -0.05
    const gm = new StandardMaterial('skyGroundMat', this.scene)
    gm.diffuseColor = new Color3(0.55, 0.82, 0.95)
    gm.specularColor = new Color3(0.05, 0.05, 0.08)
    ground.material = gm

    const player = MeshBuilder.CreateBox('playerPlane', { width: 1.1, height: 0.25, depth: 1.4 }, this.scene)
    const pm = new StandardMaterial('playerMat', this.scene)
    pm.diffuseColor = new Color3(0.35, 0.65, 1)
    pm.emissiveColor = new Color3(0.1, 0.2, 0.35)
    player.material = pm
    this.playerMesh = player
  }

  private buildClouds(): void {
    for (let i = 0; i < 12; i++) {
      const c = MeshBuilder.CreateSphere(`cloud_${i}`, { diameter: 2 + Math.random() * 2.5 }, this.scene)
      c.position = new Vector3(
        (Math.random() - 0.5) * GAME_CONFIG.arenaHalfW * 1.8,
        -1.2 - Math.random() * 0.8,
        (Math.random() - 0.5) * GAME_CONFIG.arenaHalfD * 1.6,
      )
      c.scaling.y = 0.35
      const m = new StandardMaterial(`cm_${i}`, this.scene)
      m.diffuseColor = new Color3(1, 1, 1)
      m.alpha = 0.35
      c.material = m
      this.cloudMeshes.push(c)
    }
  }

  sync(state: GameState): void {
    if (this.playerMesh) {
      this.playerMesh.position = new Vector3(state.player.x, 0.35, state.player.z)
      const inv = state.player.invuln > 0 && Math.floor(state.player.invuln * 10) % 2 === 0
      this.playerMesh.isVisible = !inv
    }

    this.syncEntities(
      state.enemies.filter(e => e.alive),
      this.enemyMeshes,
      e => {
        const def = ENEMY_DEFS[e.kind]
        const mesh = MeshBuilder.CreateBox(`en_${e.id}`, {
          width: 0.9 * def.scale,
          height: 0.35 * def.scale,
          depth: 1 * def.scale,
        }, this.scene)
        const m = new StandardMaterial(`enm_${e.id}`, this.scene)
        m.diffuseColor = hexToColor3(def.color)
        m.emissiveColor = hexToColor3(def.color).scale(0.2)
        mesh.material = m
        return mesh
      },
      (mesh, e) => {
        mesh.position = new Vector3(e.x, 0.4 * ENEMY_DEFS[e.kind].scale, e.z)
      },
    )

    this.syncEntities(
      state.playerBullets.filter(b => b.alive),
      this.playerBulletMeshes,
      b => {
        const mesh = MeshBuilder.CreateSphere(`pb_${b.id}`, { diameter: 0.22 }, this.scene)
        const m = new StandardMaterial(`pbm_${b.id}`, this.scene)
        m.diffuseColor = new Color3(1, 0.95, 0.4)
        m.emissiveColor = new Color3(0.4, 0.35, 0.1)
        mesh.material = m
        return mesh
      },
      (mesh, b) => {
        mesh.position = new Vector3(b.x, 0.45, b.z)
      },
    )

    this.syncEntities(
      state.enemyBullets.filter(b => b.alive),
      this.enemyBulletMeshes,
      b => {
        const mesh = MeshBuilder.CreateSphere(`eb_${b.id}`, { diameter: 0.28 }, this.scene)
        const m = new StandardMaterial(`ebm_${b.id}`, this.scene)
        m.diffuseColor = new Color3(1, 0.45, 0.55)
        mesh.material = m
        return mesh
      },
      (mesh, b) => {
        mesh.position = new Vector3(b.x, 0.4, b.z)
      },
    )

    this.syncEntities(
      state.pickups.filter(p => p.alive),
      this.pickupMeshes,
      p => {
        const mesh = MeshBuilder.CreateCylinder(`pk_${p.id}`, { height: 0.35, diameter: 0.55 }, this.scene)
        const m = new StandardMaterial(`pkm_${p.id}`, this.scene)
        m.diffuseColor = hexToColor3(
          p.kind === 'fireUp' ? '#FFD93D' : p.kind === 'shield' ? '#4ECDC4' : p.kind === 'heal' ? '#6BCB77' : '#9B59B6',
        )
        m.emissiveColor = new Color3(0.15, 0.15, 0.1)
        mesh.material = m
        return mesh
      },
      (mesh, p) => {
        mesh.position = new Vector3(p.x, 0.5, p.z)
        mesh.rotation.y += 0.02
      },
    )

    if (state.clearScreenFlash > 0) {
      if (!this.flashPlane) {
        this.flashPlane = MeshBuilder.CreatePlane('flash', { width: 40, height: 40 }, this.scene)
        this.flashPlane.rotation.x = Math.PI / 2
        this.flashPlane.position.y = 0.5
        const fm = new StandardMaterial('flashMat', this.scene)
        fm.diffuseColor = new Color3(1, 0.9, 0.5)
        fm.emissiveColor = new Color3(1, 0.85, 0.4)
        fm.alpha = 0.35
        this.flashPlane.material = fm
      }
      this.flashPlane.isVisible = true
      const mat = this.flashPlane.material as StandardMaterial
      mat.alpha = 0.15 + state.clearScreenFlash * 0.5
    } else if (this.flashPlane) {
      this.flashPlane.isVisible = false
    }
  }

  private syncEntities<T extends { id: number }>(
    items: T[],
    map: Map<number, Mesh>,
    create: (item: T) => Mesh,
    update: (mesh: Mesh, item: T) => void,
  ): void {
    const alive = new Set(items.map(i => i.id))
    for (const [id, mesh] of map) {
      if (!alive.has(id)) {
        mesh.dispose()
        map.delete(id)
      }
    }
    for (const item of items) {
      let mesh = map.get(item.id)
      if (!mesh) {
        mesh = create(item)
        map.set(item.id, mesh)
      }
      update(mesh, item)
    }
  }

  dispose(): void {
    this.playerMesh?.dispose()
    this.flashPlane?.dispose()
    for (const m of this.cloudMeshes) m.dispose()
    for (const m of this.enemyMeshes.values()) m.dispose()
    for (const m of this.playerBulletMeshes.values()) m.dispose()
    for (const m of this.enemyBulletMeshes.values()) m.dispose()
    for (const m of this.pickupMeshes.values()) m.dispose()
    this.cloudMeshes = []
    this.enemyMeshes.clear()
    this.playerBulletMeshes.clear()
    this.enemyBulletMeshes.clear()
    this.pickupMeshes.clear()
  }
}

export function setupTopDownCamera(scene: Scene, canvas: HTMLCanvasElement): ArcRotateCamera {
  const cam = new ArcRotateCamera(
    'skyFrenzyCam',
    -Math.PI / 2,
    Math.PI / 2.35,
    26,
    new Vector3(0, 0, 0),
    scene,
  )
  cam.attachControl(canvas, true)
  cam.lowerRadiusLimit = 18
  cam.upperRadiusLimit = 34
  cam.lowerBetaLimit = 0.35
  cam.upperBetaLimit = 1.35
  cam.panningSensibility = 0
  cam.wheelPrecision = 80
  return cam
}