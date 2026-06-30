import {
  ArcRotateCamera,
  Color3,
  Color4,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core'
import type { Engine3dContext } from '@shell/engine3d/createEngine3d'
import { attachGameArcRotateCamera } from '@shell/engine3d/sceneCameraMobile'
import { GAME_CONFIG } from '../config'
import type { GameState } from '../types'

const KIND_COLOR: Record<string, Color3> = {
  grunt: new Color3(1, 0.55, 0.65),
  dart: new Color3(0.55, 0.85, 1),
  tank: new Color3(0.75, 0.7, 1),
  boss: new Color3(1, 0.45, 0.35),
  meteor: new Color3(0.65, 0.55, 0.45),
}

export class SkyRushSceneView {
  private readonly scene: Scene
  private readonly camera: ArcRotateCamera
  private readonly playerMesh: Mesh
  private readonly enemyMeshes = new Map<number, Mesh>()
  private readonly bulletMeshes = new Map<number, Mesh>()
  private readonly puMeshes = new Map<number, Mesh>()
  private readonly playerMat: StandardMaterial
  private cloudMeshes: Mesh[] = []

  constructor(ctx: Engine3dContext) {
    this.scene = ctx.scene
    ctx.camera.detachControl()
    ctx.camera.dispose()

    this.camera = new ArcRotateCamera(
      'skyCam',
      -Math.PI / 2,
      Math.PI / 2.4,
      42,
      new Vector3(0, 0, 0),
      this.scene,
    )
    this.camera.lowerRadiusLimit = 38
    this.camera.upperRadiusLimit = 48
    attachGameArcRotateCamera(this.camera, ctx.canvas)
    this.camera.panningSensibility = 0
    this.camera.wheelPrecision = 0

    this.scene.clearColor = new Color4(0.62, 0.82, 0.98, 1)
    this.buildClouds()

    const ground = MeshBuilder.CreateGround('arena', { width: 32, height: 48 }, this.scene)
    const gMat = new StandardMaterial('gMat', this.scene)
    gMat.diffuseColor = new Color3(0.85, 0.92, 1)
    gMat.alpha = 0.35
    ground.material = gMat
    ground.position.y = -0.05

    this.playerMesh = MeshBuilder.CreateBox('player', { width: 1.1, height: 0.35, depth: 1.4 }, this.scene)
    this.playerMat = new StandardMaterial('pMat', this.scene)
    this.playerMat.diffuseColor = new Color3(0.35, 0.75, 1)
    this.playerMat.emissiveColor = new Color3(0.1, 0.25, 0.45)
    this.playerMesh.material = this.playerMat
    this.playerMesh.position.y = GAME_CONFIG.playerY + 0.2
  }

  private buildClouds(): void {
    for (let i = 0; i < 8; i++) {
      const c = MeshBuilder.CreateSphere(`cloud${i}`, { diameter: 3 + Math.random() * 4, segments: 8 }, this.scene)
      const m = new StandardMaterial(`cm${i}`, this.scene)
      m.diffuseColor = new Color3(1, 1, 1)
      m.alpha = 0.55
      c.material = m
      c.position.set((Math.random() - 0.5) * 24, -4 - Math.random() * 3, (Math.random() - 0.5) * 30)
      this.cloudMeshes.push(c)
    }
  }

  sync(state: GameState, dt: number): void {
    const t = state.elapsedMs * 0.001
    for (const c of this.cloudMeshes) {
      c.position.z += dt * 1.2
      if (c.position.z > 28) c.position.z = -28
    }

    this.playerMesh.position.x = state.player.pos.x
    this.playerMesh.position.z = state.player.pos.z
    this.playerMesh.rotation.y = Math.PI
    if (state.player.invuln > 0 && Math.floor(t * 12) % 2 === 0) {
      this.playerMat.alpha = 0.45
    } else {
      this.playerMat.alpha = 1
    }

    const aliveEnemies = new Set(state.enemies.map(e => e.id))
    for (const [id, mesh] of this.enemyMeshes) {
      if (!aliveEnemies.has(id)) {
        mesh.dispose()
        this.enemyMeshes.delete(id)
      }
    }
    for (const e of state.enemies) {
      let mesh = this.enemyMeshes.get(e.id)
      if (!mesh) {
        const scale = e.kind === 'boss' ? 2.2 : e.kind === 'tank' ? 1.4 : e.kind === 'meteor' ? 0.9 : 1
        mesh = MeshBuilder.CreateBox(`e${e.id}`, { width: scale, height: 0.3 * scale, depth: scale }, this.scene)
        const mat = new StandardMaterial(`em${e.id}`, this.scene)
        mat.diffuseColor = KIND_COLOR[e.kind] ?? Color3.White()
        mesh.material = mat
        this.enemyMeshes.set(e.id, mesh)
      }
      mesh.position.x = e.x
      mesh.position.z = e.z
      mesh.position.y = 0.2 + (e.kind === 'dart' ? Math.sin(e.wobble) * 0.15 : 0)
      mesh.rotation.y = e.kind === 'dart' ? Math.sin(e.wobble) * 0.4 : 0
    }

    const aliveBullets = new Set(state.bullets.map(b => b.id))
    for (const [id, mesh] of this.bulletMeshes) {
      if (!aliveBullets.has(id)) {
        mesh.dispose()
        this.bulletMeshes.delete(id)
      }
    }
    for (const b of state.bullets) {
      let mesh = this.bulletMeshes.get(b.id)
      if (!mesh) {
        const s = b.friendly ? (b.radius > 0.15 ? 0.35 : 0.2) : 0.22
        mesh = MeshBuilder.CreateSphere(`b${b.id}`, { diameter: s, segments: 6 }, this.scene)
        const mat = new StandardMaterial(`bm${b.id}`, this.scene)
        mat.diffuseColor = b.friendly ? new Color3(1, 0.95, 0.4) : new Color3(1, 0.35, 0.45)
        mat.emissiveColor = b.friendly ? new Color3(0.4, 0.35, 0.1) : new Color3(0.3, 0.05, 0.1)
        mesh.material = mat
        this.bulletMeshes.set(b.id, mesh)
      }
      mesh.position.set(b.x, 0.35, b.z)
    }

    const alivePu = new Set(state.powerUps.map(p => p.id))
    for (const [id, mesh] of this.puMeshes) {
      if (!alivePu.has(id)) {
        mesh.dispose()
        this.puMeshes.delete(id)
      }
    }
    for (const p of state.powerUps) {
      let mesh = this.puMeshes.get(p.id)
      if (!mesh) {
        mesh = MeshBuilder.CreateTorus(`pu${p.id}`, { diameter: 0.7, thickness: 0.15 }, this.scene)
        const mat = new StandardMaterial(`pum${p.id}`, this.scene)
        const colors: Record<string, Color3> = {
          firepower: new Color3(1, 0.6, 0.2),
          shield: new Color3(0.4, 0.85, 1),
          heal: new Color3(0.5, 1, 0.55),
          slowMo: new Color3(0.85, 0.55, 1),
        }
        mat.diffuseColor = colors[p.kind] ?? Color3.White()
        mat.emissiveColor = mat.diffuseColor.scale(0.35)
        mesh.material = mat
        this.puMeshes.set(p.id, mesh)
      }
      mesh.position.set(p.x, 0.5, p.z)
      mesh.rotation.y += dt * 2
    }
  }

  dispose(): void {
    this.playerMesh.dispose()
    for (const m of this.enemyMeshes.values()) m.dispose()
    for (const m of this.bulletMeshes.values()) m.dispose()
    for (const m of this.puMeshes.values()) m.dispose()
    for (const c of this.cloudMeshes) c.dispose()
    this.enemyMeshes.clear()
    this.bulletMeshes.clear()
    this.puMeshes.clear()
    this.camera.detachControl()
  }
}

export function setupTopDownCamera(ctx: Engine3dContext): ArcRotateCamera {
  ctx.camera.detachControl()
  ctx.camera.dispose()
  const cam = new ArcRotateCamera('skyCam', -Math.PI / 2, Math.PI / 2.4, 42, Vector3.Zero(), ctx.scene)
  attachGameArcRotateCamera(cam, ctx.canvas)
  return cam
}