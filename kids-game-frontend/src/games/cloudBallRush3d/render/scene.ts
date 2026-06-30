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
import { BALL_SKINS, GAME_CONFIG, themeSky } from '../config'
import type { GameState } from '../types'
import {
  type CloudBallAssets,
  loadCloudBallAssets,
  disposeCloudBallAssets,
  trackTextureKeyForTheme,
} from './assets'
import { ART_STYLE, applySoftMatte, themePalette } from './style'

export class CloudBallSceneView {
  private readonly scene: Scene
  private readonly camera: ArcRotateCamera
  private readonly ball: Mesh
  private readonly ballMat: StandardMaterial
  private readonly segmentMeshes: Mesh[] = []
  private readonly starMeshes = new Map<number, Mesh>()
  private readonly puMeshes = new Map<number, Mesh>()
  private readonly barrierMeshes = new Map<number, Mesh>()
  private readonly slowMeshes: Mesh[] = []
  private readonly bounceMeshes: Mesh[] = []
  private finishMesh: Mesh | null = null
  private finishFlag: Mesh | null = null
  private guideMeshes: Mesh[] = []
  private skinId = 0
  private assets: CloudBallAssets | null = null
  private wasOnGround = true
  private rollPhase = 0

  constructor(ctx: Engine3dContext) {
    this.scene = ctx.scene
    ctx.camera.detachControl()
    ctx.camera.dispose()

    this.camera = new ArcRotateCamera(
      'ballCam',
      -Math.PI / 2,
      1.15,
      22,
      new Vector3(0, 0, 8),
      this.scene,
    )
    this.camera.lowerRadiusLimit = 14
    this.camera.upperRadiusLimit = 32
    attachGameArcRotateCamera(this.camera, ctx.canvas)
    this.camera.panningSensibility = 0
    this.camera.wheelPrecision = 80

    const ball = MeshBuilder.CreateSphere(
      'ball',
      { diameter: GAME_CONFIG.ballRadius * 2, segments: ART_STYLE.ballSegments },
      this.scene,
    )
    this.ballMat = new StandardMaterial('ballMat', this.scene)
    this.ball = ball
    ball.material = this.ballMat
    this.applySkin(0)

    void loadCloudBallAssets(this.scene).then(a => {
      this.assets = a
    })
  }

  getSkinId(): number {
    return this.skinId
  }

  setSkin(id: number): void {
    this.skinId = id
    this.applySkin(id)
  }

  private applySkin(id: number): void {
    const skin = BALL_SKINS.find(s => s.id === id) ?? BALL_SKINS[0]!
    const matte = applySoftMatte(new Color3(skin.color[0], skin.color[1], skin.color[2]))
    this.ballMat.diffuseColor = matte.diffuse
    this.ballMat.specularColor = matte.specular
    const nebula = 'nebula' in skin && skin.nebula
    this.ballMat.emissiveColor = nebula
      ? matte.emissive.scale(1.8)
      : matte.emissive
  }

  rebuildLevel(state: GameState): void {
    for (const m of this.segmentMeshes) m.dispose()
    this.segmentMeshes.length = 0
    for (const [, m] of this.starMeshes) m.dispose()
    this.starMeshes.clear()
    for (const [, m] of this.puMeshes) m.dispose()
    this.puMeshes.clear()
    for (const [, m] of this.barrierMeshes) m.dispose()
    this.barrierMeshes.clear()
    for (const m of this.slowMeshes) m.dispose()
    this.slowMeshes.length = 0
    for (const m of this.bounceMeshes) m.dispose()
    this.bounceMeshes.length = 0
    this.finishMesh?.dispose()
    this.finishFlag?.dispose()
    this.finishMesh = null
    this.finishFlag = null
    for (const g of this.guideMeshes) g.dispose()
    this.guideMeshes = []

    const sky = themeSky(state.level.theme)
    this.scene.clearColor = new Color4(sky.clear[0], sky.clear[1], sky.clear[2], sky.clear[3])
    const pal = themePalette(state.level.theme)
    const texKey = trackTextureKeyForTheme(state.level.theme)
    const trackTex = texKey && this.assets?.track[texKey] ? this.assets.track[texKey] : null

    for (let i = 0; i < state.level.segments.length; i++) {
      const s = state.level.segments[i]!
      const box = MeshBuilder.CreateBox(
        `seg${i}`,
        { width: s.halfW * 2, height: 0.55, depth: s.halfD * 2 },
        this.scene,
      )
      const mat = new StandardMaterial(`segMat${i}`, this.scene)
      const base = s.ice ? pal.groundIce : pal.ground
      const m = applySoftMatte(base)
      mat.diffuseColor = m.diffuse
      mat.specularColor = m.specular
      mat.emissiveColor = m.emissive
      if (trackTex && !s.ice) {
        mat.diffuseTexture = trackTex
        mat.diffuseColor = Color3.White()
      }
      box.material = mat
      box.position.set(s.x, s.y - 0.28, s.z)
      this.segmentMeshes.push(box)
    }

    for (const z of state.level.slowZones) {
      const pad = MeshBuilder.CreateBox(
        `slow${z.id}`,
        { width: z.halfW * 2, height: 0.08, depth: z.halfD * 2 },
        this.scene,
      )
      const mat = new StandardMaterial(`slowMat${z.id}`, this.scene)
      const slowTex = this.assets?.track.slow_zone
      const m = applySoftMatte(pal.slow, 0.15)
      mat.diffuseColor = m.diffuse
      mat.emissiveColor = m.emissive
      if (slowTex) {
        mat.diffuseTexture = slowTex
        mat.diffuseColor = Color3.White()
      }
      pad.material = mat
      pad.position.set(z.x, 0.12, z.z)
      this.slowMeshes.push(pad)
    }

    for (const pad of state.level.bouncePads) {
      const bounce = MeshBuilder.CreateCylinder(
        `bounce${pad.id}`,
        { height: 0.35, diameter: Math.min(pad.halfW, pad.halfD) * 2, tessellation: ART_STYLE.propSegments },
        this.scene,
      )
      const mat = new StandardMaterial(`bounceMat${pad.id}`, this.scene)
      const m = applySoftMatte(pal.bounce, 0.35)
      mat.diffuseColor = m.diffuse
      mat.emissiveColor = m.emissive.scale(1.2)
      bounce.material = mat
      bounce.position.set(pad.x, 0.2, pad.z)
      this.bounceMeshes.push(bounce)
    }

    for (const star of state.level.stars) {
      const sm = MeshBuilder.CreateSphere(
        `star${star.id}`,
        { diameter: star.hidden ? 0.32 : 0.5, segments: ART_STYLE.propSegments },
        this.scene,
      )
      const m = new StandardMaterial(`starMat${star.id}`, this.scene)
      const st = applySoftMatte(pal.star, 0.5)
      m.diffuseColor = st.diffuse
      m.emissiveColor = st.emissive.scale(2)
      sm.material = m
      sm.position.set(star.x, 1.15, star.z)
      this.starMeshes.set(star.id, sm)
    }

    for (const pu of state.level.powerUps) {
      const pm = MeshBuilder.CreateTorus(
        `pu${pu.id}`,
        { diameter: 0.85, thickness: 0.14, tessellation: ART_STYLE.propSegments },
        this.scene,
      )
      const m = new StandardMaterial(`puMat${pu.id}`, this.scene)
      const c =
        pu.kind === 'shield'
          ? new Color3(0.45, 0.88, 1)
          : pu.kind === 'speed'
            ? new Color3(1, 0.68, 0.45)
            : new Color3(0.55, 0.98, 0.72)
      const soft = applySoftMatte(c, 0.4)
      m.diffuseColor = soft.diffuse
      m.emissiveColor = soft.emissive.scale(1.5)
      pm.material = m
      pm.position.set(pu.x, 0.85, pu.z)
      this.puMeshes.set(pu.id, pm)
    }

    for (const b of state.level.barriers) {
      const bm = MeshBuilder.CreateBox(
        `bar${b.id}`,
        { width: b.halfW * 2, height: 0.75, depth: b.halfD * 2 },
        this.scene,
      )
      const m = new StandardMaterial(`barMat${b.id}`, this.scene)
      const soft = applySoftMatte(pal.barrier)
      m.diffuseColor = soft.diffuse
      m.emissiveColor = soft.emissive
      bm.material = m
      bm.position.set(b.x, 0.38, b.z)
      this.barrierMeshes.set(b.id, bm)
    }

    const f = state.level.finish
    this.finishMesh = MeshBuilder.CreateBox(
      'finish',
      { width: f.halfW * 2, height: 0.12, depth: f.halfD * 2 },
      this.scene,
    )
    const fm = new StandardMaterial('finMat', this.scene)
    const fin = applySoftMatte(pal.finish, 0.35)
    fm.diffuseColor = fin.diffuse
    fm.emissiveColor = fin.emissive.scale(1.3)
    this.finishMesh.material = fm
    this.finishMesh.position.set(f.x, 0.48, f.z)

    this.finishFlag = MeshBuilder.CreateBox(
      'finishFlag',
      { width: 0.08, height: 1.4, depth: 0.08 },
      this.scene,
    )
    const flagMat = new StandardMaterial('flagMat', this.scene)
    const flagCol = applySoftMatte(macaronAccent(pal.finish), 0.4)
    flagMat.diffuseColor = flagCol.diffuse
    flagMat.emissiveColor = flagCol.emissive
    this.finishFlag.material = flagMat
    this.finishFlag.position.set(f.x, 1.1, f.z - f.halfD * 0.6)

    this.spawnThemeDeco(state)
  }

  private spawnThemeDeco(state: GameState): void {
    const pal = themePalette(state.level.theme)
    const theme = state.level.theme
    const count = theme === 'star' ? 6 : theme === 'meadow' ? 4 : 3
    for (let i = 0; i < count; i++) {
      const seg = state.level.segments[i % state.level.segments.length]
      if (!seg) continue
      const ox = (i - count / 2) * 1.2
      if (theme === 'cloud' || theme === 'meadow') {
        const cloud = MeshBuilder.CreateSphere(
          `deco${i}`,
          { diameter: 0.9 + (i % 3) * 0.2, segments: 6 },
          this.scene,
        )
        const m = new StandardMaterial(`decoMat${i}`, this.scene)
        const c = applySoftMatte(theme === 'meadow' ? pal.accent : Color3.White().scale(0.95), 0.08)
        m.diffuseColor = c.diffuse
        m.alpha = 0.85
        cloud.material = m
        cloud.position.set(seg.x + ox, 2.2 + (i % 2), seg.z + seg.halfD + 1.5)
        this.segmentMeshes.push(cloud)
      } else if (theme === 'star') {
        const rock = MeshBuilder.CreatePolyhedron(
          `rock${i}`,
          { type: 1, size: 0.25 + (i % 3) * 0.08 },
          this.scene,
        )
        const m = new StandardMaterial(`rockMat${i}`, this.scene)
        const c = applySoftMatte(new Color3(0.7, 0.65, 0.95), 0.25)
        m.diffuseColor = c.diffuse
        m.emissiveColor = c.emissive
        rock.material = m
        rock.position.set(seg.x + ox * 0.5, 0.5, seg.z - seg.halfD - 0.8)
        this.segmentMeshes.push(rock)
      }
    }
  }

  sync(state: GameState, timeSec: number): { jumped: boolean; rolling: boolean; onIce: boolean } {
    const { ball } = state
    this.ball.position.set(ball.x, ball.y, ball.z)
    this.ball.rotation.x += ball.vz * 0.08
    this.ball.rotation.z -= ball.vx * 0.08

    const jumped = this.wasOnGround && !ball.onGround && ball.vy > 1
    this.wasOnGround = ball.onGround

    const rolling = ball.onGround && Math.hypot(ball.vx, ball.vz) > 0.8
    this.rollPhase += rolling ? 0.12 : 0

    let onIce = false
    for (const s of state.level.segments) {
      if (s.ice && Math.abs(ball.x - s.x) <= s.halfW && Math.abs(ball.z - s.z) <= s.halfD) {
        onIce = true
        break
      }
    }

    if (ball.shieldT > 0) {
      this.ballMat.emissiveColor = new Color3(0.25, 0.5, 0.7)
      this.ball.scaling.setAll(1.05)
    } else {
      this.applySkin(this.skinId)
      this.ball.scaling.setAll(1)
    }

    if (ball.speedBoostT > 0) {
      this.ballMat.emissiveColor = this.ballMat.emissiveColor.add(new Color3(0.15, 0.08, 0))
    }

    for (const star of state.level.stars) {
      const mesh = this.starMeshes.get(star.id)
      if (!mesh) continue
      mesh.setEnabled(!star.collected)
      if (!star.collected) {
        mesh.position.y = 1.15 + Math.sin(timeSec * 3 + star.id) * 0.1
      }
    }

    for (const pu of state.level.powerUps) {
      const mesh = this.puMeshes.get(pu.id)
      if (!mesh) continue
      mesh.setEnabled(!pu.collected)
      if (!pu.collected) mesh.rotation.y += 0.04
    }

    for (const b of state.level.barriers) {
      const mesh = this.barrierMeshes.get(b.id)
      if (!mesh) continue
      const ox = b.axis === 'x' ? Math.sin(timeSec * b.speed + b.phase) * b.amp : 0
      const oz = b.axis === 'z' ? Math.sin(timeSec * b.speed + b.phase) * b.amp : 0
      mesh.position.set(b.x + ox, 0.38, b.z + oz)
    }

    if (this.finishFlag) {
      this.finishFlag.rotation.y = Math.sin(timeSec * 2) * 0.08
    }

    const showGuide = state.ball.guideT > 0
    if (showGuide && this.guideMeshes.length === 0) {
      for (let i = 0; i < state.guideRoute.length - 1; i++) {
        const a = state.guideRoute[i]!
        const b = state.guideRoute[i + 1]!
        const midX = (a.x + b.x) / 2
        const midZ = (a.z + b.z) / 2
        const len = Math.hypot(b.x - a.x, b.z - a.z)
        const cyl = MeshBuilder.CreateCylinder(`guide${i}`, { height: len, diameter: 0.1 }, this.scene)
        const m = new StandardMaterial(`gm${i}`, this.scene)
        m.diffuseColor = new Color3(0.55, 0.98, 0.78)
        m.alpha = 0.5
        m.emissiveColor = new Color3(0.2, 0.45, 0.35)
        cyl.material = m
        cyl.position.set(midX, 1.45, midZ)
        const ang = Math.atan2(b.x - a.x, b.z - a.z)
        cyl.rotation.x = Math.PI / 2
        cyl.rotation.y = ang
        this.guideMeshes.push(cyl)
      }
    }
    if (!showGuide && this.guideMeshes.length > 0) {
      for (const g of this.guideMeshes) g.dispose()
      this.guideMeshes = []
    }

    const target = new Vector3(ball.x, ball.y + 2, ball.z + 6)
    this.camera.setTarget(Vector3.Lerp(this.camera.getTarget(), target, 0.12))

    return { jumped, rolling, onIce }
  }

  /** 相机在 XZ 上的「往前看」方向（第三人称：从相机指向球），用于相对移动 */
  getMoveBasis(): { forwardX: number; forwardZ: number } {
    const cam = this.camera.position
    const ball = this.ball.position
    let fx = ball.x - cam.x
    let fz = ball.z - cam.z
    const len = Math.hypot(fx, fz)
    if (len < 0.001) {
      const alpha = this.camera.alpha
      fx = Math.sin(alpha)
      fz = Math.cos(alpha)
    } else {
      fx /= len
      fz /= len
    }
    return { forwardX: fx, forwardZ: fz }
  }

  dispose(): void {
    if (this.assets) disposeCloudBallAssets(this.assets)
    for (const m of this.segmentMeshes) m.dispose()
    for (const [, m] of this.starMeshes) m.dispose()
    for (const [, m] of this.puMeshes) m.dispose()
    for (const [, m] of this.barrierMeshes) m.dispose()
    for (const m of this.slowMeshes) m.dispose()
    for (const m of this.bounceMeshes) m.dispose()
    this.finishMesh?.dispose()
    this.finishFlag?.dispose()
    for (const g of this.guideMeshes) g.dispose()
    this.ball.dispose()
    this.ballMat.dispose()
    this.camera.dispose()
  }
}

function macaronAccent(base: Color3): Color3 {
  return new Color3(
    Math.min(1, base.r + 0.15),
    Math.min(1, base.g + 0.1),
    Math.min(1, base.b + 0.12),
  )
}