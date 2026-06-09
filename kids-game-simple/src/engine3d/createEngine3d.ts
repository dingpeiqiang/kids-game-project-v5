import {
  Engine,
  Scene,
  UniversalCamera,
  HemisphericLight,
  Vector3,
  Color3,
  Color4,
} from '@babylonjs/core'

export interface Engine3dOptions {
  parent: HTMLElement
  antialias?: boolean
  preserveDrawingBuffer?: boolean
  /** 移动端可降分辨率 */
  hardwareScalingLevel?: number
}

export interface Engine3dContext {
  engine: Engine
  scene: Scene
  camera: UniversalCamera
  canvas: HTMLCanvasElement
  dispose: () => void
}

/**
 * 共用 Babylon 生命周期：创建引擎、场景、基础相机与光照。
 * 各 3D 游戏在 scene 上扩展 mesh / 输入，退出时务必调用 dispose。
 */
export function createEngine3d(options: Engine3dOptions): Engine3dContext {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;outline:none;'
  options.parent.appendChild(canvas)

  const engine = new Engine(canvas, !!options.antialias, {
    preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
    stencil: true,
    audioEngine: false,
  })

  if (options.hardwareScalingLevel != null && options.hardwareScalingLevel > 1) {
    engine.setHardwareScalingLevel(options.hardwareScalingLevel)
  }

  const scene = new Scene(engine)
  scene.clearColor = new Color4(0.55, 0.78, 0.95, 1)

  const camera = new UniversalCamera('fpCamera', new Vector3(0, 18, -12), scene)
  camera.attachControl(canvas, true)
  camera.speed = 0.35
  camera.angularSensibility = 2800
  camera.inertia = 0.75
  camera.minZ = 0.05
  camera.applyGravity = false
  camera.checkCollisions = false

  const light = new HemisphericLight('hemiLight', new Vector3(0.2, 1, 0.15), scene)
  light.intensity = 0.95
  light.groundColor = new Color3(0.35, 0.45, 0.35)

  const onResize = () => engine.resize()
  window.addEventListener('resize', onResize)

  engine.runRenderLoop(() => {
    scene.render()
  })

  const dispose = () => {
    window.removeEventListener('resize', onResize)
    engine.stopRenderLoop()
    camera.detachControl()
    scene.dispose()
    engine.dispose()
    canvas.remove()
  }

  return { engine, scene, camera, canvas, dispose }
}