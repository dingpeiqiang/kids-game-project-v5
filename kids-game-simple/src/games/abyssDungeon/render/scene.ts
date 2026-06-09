import * as THREE from 'three'
import type { DungeonLevel, Player, Enemy, DungeonTile } from '../types'
import { GAME_CONFIG, COLORS } from '../config'

export class SceneRenderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private tileGroup: THREE.Group
  private playerMesh: THREE.Mesh | null = null
  private enemyMeshes: Map<string, THREE.Mesh> = new Map()
  private trapMeshes: Map<string, THREE.Mesh> = new Map()
  private chestMeshes: Map<string, THREE.Mesh> = new Map()
  private switchMeshes: Map<string, THREE.Mesh> = new Map()
  private doorMeshes: Map<string, THREE.Mesh> = new Map()
  private stairsMesh: THREE.Mesh | null = null
  private fog: THREE.Fog
  private ambientLight: THREE.AmbientLight
  private directionalLight: THREE.DirectionalLight

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene()
    
    const fov = 60
    const aspect = canvas.clientWidth / canvas.clientHeight
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000)
    
    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      alpha: true 
    })
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.tileGroup = new THREE.Group()
    this.scene.add(this.tileGroup)

    this.fog = new THREE.Fog(0x1a1a2e, 15, 30)
    this.scene.fog = this.fog

    this.ambientLight = new THREE.AmbientLight(0x404040, 0.5)
    this.scene.add(this.ambientLight)

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    this.directionalLight.position.set(10, 20, 10)
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.mapSize.width = 1024
    this.directionalLight.shadow.mapSize.height = 1024
    this.directionalLight.shadow.camera.near = 0.5
    this.directionalLight.shadow.camera.far = 50
    this.directionalLight.shadow.camera.left = -20
    this.directionalLight.shadow.camera.right = 20
    this.directionalLight.shadow.camera.top = 20
    this.directionalLight.shadow.camera.bottom = -20
    this.scene.add(this.directionalLight)

    this.setupCamera()
  }

  private setupCamera(): void {
    this.camera.position.set(
      GAME_CONFIG.CAMERA_DISTANCE,
      GAME_CONFIG.CAMERA_HEIGHT,
      GAME_CONFIG.CAMERA_DISTANCE
    )
    this.camera.lookAt(0, 0, 0)
  }

  updateCamera(targetX: number, targetY: number, zoom: number): void {
    const lerpFactor = 0.1
    const targetZ = GAME_CONFIG.CAMERA_DISTANCE * (GAME_CONFIG.CAMERA_MAX_ZOOM / zoom)
    
    this.camera.position.x += (targetX + GAME_CONFIG.CAMERA_DISTANCE - this.camera.position.x) * lerpFactor
    this.camera.position.y = GAME_CONFIG.CAMERA_HEIGHT * (zoom / GAME_CONFIG.CAMERA_MIN_ZOOM)
    this.camera.position.z += (targetY + GAME_CONFIG.CAMERA_DISTANCE - this.camera.position.z) * lerpFactor
    
    this.camera.lookAt(targetX, 0, targetY)
  }

  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  clear(): void {
    this.tileGroup.clear()
    this.enemyMeshes.clear()
    this.trapMeshes.clear()
    this.chestMeshes.clear()
    this.switchMeshes.clear()
    this.doorMeshes.clear()
    
    if (this.playerMesh) {
      this.scene.remove(this.playerMesh)
      this.playerMesh = null
    }
    
    if (this.stairsMesh) {
      this.scene.remove(this.stairsMesh)
      this.stairsMesh = null
    }
  }

  renderDungeon(dungeon: DungeonLevel): void {
    this.clear()
    
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const tile = dungeon.tiles[y][x]
        if (!tile.explored) continue
        
        if (tile.type === 'wall') {
          this.createWall(x, y)
        } else if (tile.type === 'floor') {
          this.createFloor(x, y, tile.visible)
        }
      }
    }

    for (const trap of dungeon.traps) {
      this.createTrap(trap)
    }

    for (const chest of dungeon.chests) {
      this.createChest(chest)
    }

    for (const sw of dungeon.switches) {
      this.createSwitch(sw)
    }

    for (const door of dungeon.doors) {
      this.createDoor(door)
    }

    this.createStairs(dungeon.stairsPosition)
  }

  private createWall(x: number, y: number): void {
    const geometry = new THREE.BoxGeometry(1, 2, 1)
    const material = new THREE.MeshStandardMaterial({ 
      color: COLORS.wall,
      roughness: 0.8,
      metalness: 0.2
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x + 0.5, 1, y + 0.5)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.tileGroup.add(mesh)
  }

  private createFloor(x: number, y: number, visible: boolean): void {
    const geometry = new THREE.BoxGeometry(1, 0.1, 1)
    const material = new THREE.MeshStandardMaterial({ 
      color: visible ? COLORS.floor : 0x2a2a2a,
      roughness: 0.9,
      metalness: 0.1
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x + 0.5, 0.05, y + 0.5)
    mesh.receiveShadow = true
    this.tileGroup.add(mesh)
  }

  private createTrap(trap: DungeonLevel['traps'][0]): void {
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8)
    const colors: Record<string, number> = {
      spike: 0x8b0000,
      fire: 0xff4500,
      ice: 0x00bfff,
      poison: 0x32cd32,
    }
    const material = new THREE.MeshStandardMaterial({ 
      color: colors[trap.type],
      emissive: colors[trap.type],
      emissiveIntensity: 0.5,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(trap.position.x, 0.1, trap.position.y)
    this.tileGroup.add(mesh)
    this.trapMeshes.set(trap.id, mesh)
  }

  private createChest(chest: DungeonLevel['chests'][0]): void {
    const group = new THREE.Group()
    
    const baseGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8)
    const lidGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8)
    
    const colors: Record<string, number> = {
      common: COLORS.chest,
      rare: COLORS.chestRare,
    }
    
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: colors[chest.rarity],
      roughness: 0.5,
      metalness: 0.8
    })
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = 0.3
    
    const lid = new THREE.Mesh(lidGeometry, baseMaterial)
    lid.position.y = 0.75
    
    group.add(base)
    group.add(lid)
    group.position.set(chest.position.x, 0, chest.position.y)
    
    this.tileGroup.add(group)
    this.chestMeshes.set(chest.id, group as unknown as THREE.Mesh)
  }

  private createSwitch(sw: DungeonLevel['switches'][0]): void {
    const geometry = new THREE.BoxGeometry(0.4, 0.8, 0.4)
    const material = new THREE.MeshStandardMaterial({ 
      color: sw.activated ? 0x00ff00 : 0x8b4513,
      emissive: sw.activated ? 0x00ff00 : 0x000000,
      emissiveIntensity: sw.activated ? 0.5 : 0,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(sw.position.x, 0.4, sw.position.y)
    this.tileGroup.add(mesh)
    this.switchMeshes.set(sw.id, mesh)
  }

  private createDoor(door: DungeonLevel['doors'][0]): void {
    const geometry = new THREE.BoxGeometry(0.3, 1.5, 1)
    const material = new THREE.MeshStandardMaterial({ 
      color: door.locked ? 0x4a4a4a : COLORS.door,
      roughness: 0.7,
      metalness: 0.3
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(door.position.x, 0.75, door.position.y)
    this.tileGroup.add(mesh)
    this.doorMeshes.set(door.id, mesh)
  }

  private createStairs(pos: { x: number; y: number; z: number }): void {
    const geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16)
    const material = new THREE.MeshStandardMaterial({ 
      color: COLORS.stairs,
      emissive: COLORS.stairs,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.7
    })
    this.stairsMesh = new THREE.Mesh(geometry, material)
    this.stairsMesh.position.set(pos.x, 0.05, pos.y)
    this.stairsMesh.rotation.x = Math.PI / 2
    this.scene.add(this.stairsMesh)
  }

  renderPlayer(player: Player): void {
    if (!this.playerMesh) {
      const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.6)
      const headGeometry = new THREE.SphereGeometry(0.3, 16, 16)
      
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS.player })
      const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac })
      
      const group = new THREE.Group()
      
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
      body.position.y = 0.6
      body.castShadow = true
      body.receiveShadow = true
      
      const head = new THREE.Mesh(headGeometry, headMaterial)
      head.position.y = 1.5
      head.castShadow = true
      head.receiveShadow = true
      
      group.add(body)
      group.add(head)
      
      this.playerMesh = group as unknown as THREE.Mesh
      this.scene.add(this.playerMesh)
    }
    
    this.playerMesh.position.x = player.position.x
    this.playerMesh.position.z = player.position.y
    this.playerMesh.rotation.y = player.rotation
    
    if (player.invincibleTime > Date.now()) {
      const flash = Math.sin(Date.now() * 0.01) > 0
      ;(this.playerMesh as THREE.Group).children.forEach((child) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
        mat.opacity = flash ? 0.5 : 1
        mat.transparent = true
      })
    } else {
      ;(this.playerMesh as THREE.Group).children.forEach((child) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
        mat.opacity = 1
        mat.transparent = false
      })
    }
  }

  renderEnemy(enemy: Enemy): void {
    let mesh = this.enemyMeshes.get(enemy.id)
    
    if (!mesh) {
      const geometry = new THREE.BoxGeometry(
        enemy.size.width * 0.8,
        enemy.size.height,
        enemy.size.depth * 0.8
      )
      
      const colors: Record<string, number> = {
        normal: COLORS.enemy,
        elite: COLORS.enemyElite,
        boss: COLORS.enemyBoss,
      }
      
      const material = new THREE.MeshStandardMaterial({ 
        color: colors[enemy.type],
        emissive: enemy.isBoss ? colors[enemy.type] : 0x000000,
        emissiveIntensity: enemy.isBoss ? 0.3 : 0,
      })
      
      mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.scene.add(mesh)
      this.enemyMeshes.set(enemy.id, mesh)
    }
    
    if (!enemy.isDead) {
      mesh.position.x = enemy.position.x
      mesh.position.y = enemy.size.height / 2
      mesh.position.z = enemy.position.y
      mesh.rotation.y = enemy.rotation
      mesh.visible = true
    } else {
      mesh.visible = false
    }
  }

  updateVisibility(dungeon: DungeonLevel): void {
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const tile = dungeon.tiles[y][x]
        if (!tile.explored) continue
        
        const children = this.tileGroup.children
        const tileIndex = y * dungeon.width + x
        
        if (children[tileIndex] instanceof THREE.Mesh) {
          const mesh = children[tileIndex] as THREE.Mesh
          const material = mesh.material as THREE.MeshStandardMaterial
          material.color.setHex(tile.visible ? COLORS.floor : 0x2a2a2a)
        }
      }
    }
  }

  dispose(): void {
    this.renderer.dispose()
    this.enemyMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) mesh.material.dispose()
    })
    this.trapMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) mesh.material.dispose()
    })
    this.chestMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) mesh.material.dispose()
    })
    this.switchMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) mesh.material.dispose()
    })
    this.doorMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) mesh.material.dispose()
    })
    if (this.playerMesh) {
      if (this.playerMesh.geometry) this.playerMesh.geometry.dispose()
      if (this.playerMesh.material instanceof THREE.Material) this.playerMesh.material.dispose()
    }
    if (this.stairsMesh) {
      if (this.stairsMesh.geometry) this.stairsMesh.geometry.dispose()
      if (this.stairsMesh.material instanceof THREE.Material) this.stairsMesh.material.dispose()
    }
  }
}