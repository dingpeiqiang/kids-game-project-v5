import * as THREE from 'three'
import { GAME_CONFIG, PATH_POINTS, COLORS } from '../config'

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  return scene
}

export function createCamera(container: HTMLElement): THREE.PerspectiveCamera {
  const { CAMERA_DISTANCE, CAMERA_HEIGHT, CAMERA_ANGLE } = GAME_CONFIG
  const aspect = container.clientWidth / container.clientHeight
  const camera = new THREE.PerspectiveCamera(CAMERA_ANGLE, aspect, 0.1, 1000)
  
  const theta = (CAMERA_ANGLE * Math.PI) / 180
  camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE)
  camera.lookAt(0, 0, 0)
  
  return camera
}

export function createRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.appendChild(renderer.domElement)
  return renderer
}

export function createLights(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 50
  directionalLight.shadow.camera.left = -20
  directionalLight.shadow.camera.right = 20
  directionalLight.shadow.camera.top = 20
  directionalLight.shadow.camera.bottom = -20
  scene.add(directionalLight)
}

export function createGround(scene: THREE.Scene): THREE.Mesh {
  const { GRID_SIZE, CELL_SIZE } = GAME_CONFIG
  const size = GRID_SIZE * CELL_SIZE
  const geometry = new THREE.PlaneGeometry(size, size)
  const material = new THREE.MeshStandardMaterial({ color: COLORS.ground })
  const ground = new THREE.Mesh(geometry, material)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
  return ground
}

export function createGrid(scene: THREE.Scene): void {
  const { GRID_SIZE, CELL_SIZE } = GAME_CONFIG
  const size = GRID_SIZE * CELL_SIZE
  const halfSize = size / 2
  
  const gridHelper = new THREE.GridHelper(size, GRID_SIZE, 0x444444, 0x333333)
  gridHelper.position.y = 0.01
  scene.add(gridHelper)
}

export function createPath(scene: THREE.Scene): THREE.Mesh {
  const points: THREE.Vector3[] = []
  
  for (const point of PATH_POINTS) {
    points.push(new THREE.Vector3(point.x, 0.02, point.y))
  }
  
  const curve = new THREE.CatmullRomCurve3(points)
  const geometry = new THREE.TubeGeometry(curve, 100, 0.6, 8, false)
  const material = new THREE.MeshStandardMaterial({ color: COLORS.road })
  const path = new THREE.Mesh(geometry, material)
  path.receiveShadow = true
  scene.add(path)
  return path
}

export function createBase(scene: THREE.Scene): THREE.Mesh {
  const basePos = PATH_POINTS[PATH_POINTS.length - 1]
  const geometry = new THREE.CylinderGeometry(0.7, 0.8, GAME_CONFIG.BASE_HEIGHT, 16)
  const material = new THREE.MeshStandardMaterial({ color: COLORS.base })
  const base = new THREE.Mesh(geometry, material)
  base.position.set(basePos.x, GAME_CONFIG.BASE_HEIGHT / 2, basePos.y)
  base.castShadow = true
  base.receiveShadow = true
  scene.add(base)
  
  const topGeometry = new THREE.CylinderGeometry(0.5, 0.55, 0.1, 16)
  const topMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00 })
  const top = new THREE.Mesh(topGeometry, topMaterial)
  top.position.set(basePos.x, GAME_CONFIG.BASE_HEIGHT + 0.05, basePos.y)
  top.castShadow = true
  scene.add(top)
  
  return base
}

export function handleResize(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera): void {
  const container = renderer.domElement.parentElement
  if (!container) return
  
  const width = container.clientWidth
  const height = container.clientHeight
  
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}