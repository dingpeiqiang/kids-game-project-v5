import * as THREE from 'three'
import { GAME_CONFIG, STACK_COLORS } from '../config'

export type BlockShape = 'cube' | 'cylinder' | 'pyramid' | 'octahedron' | 'sphere' | 'torus' | 'cone' | 'dodecahedron'

export interface BlockState {
  isFalling: boolean
  fallProgress: number
  targetY: number
  bounceProgress: number
  settled: boolean
}

export class Block {
  public mesh: THREE.Mesh
  public state: BlockState
  private originalColor: number
  private width: number
  public shape: BlockShape

  constructor(colorIndex: number, startY: number, blockWidth: number = GAME_CONFIG.blockSize.width, shape: BlockShape = 'cube') {
    this.originalColor = STACK_COLORS[colorIndex % STACK_COLORS.length]
    this.width = blockWidth
    this.shape = shape
    
    const geometry = this.createGeometry(shape, blockWidth)
    
    const material = new THREE.MeshBasicMaterial({
      color: this.originalColor,
      transparent: true,
      opacity: 0.95
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true

    this.state = {
      isFalling: false,
      fallProgress: 0,
      targetY: startY,
      bounceProgress: 0,
      settled: false
    }
    
    this.mesh.position.set(0, startY + GAME_CONFIG.fallHeight, 0)
  }

  private createGeometry(shape: BlockShape, width: number): THREE.BufferGeometry {
    const height = GAME_CONFIG.blockSize.height
    const depth = GAME_CONFIG.blockSize.depth
    const size = Math.min(width, height, depth) * 0.8
    
    switch (shape) {
      case 'cube':
        return new THREE.BoxGeometry(width, height, depth)
      case 'cylinder':
        return new THREE.CylinderGeometry(width * 0.4, width * 0.4, height, 8)
      case 'pyramid':
        return new THREE.ConeGeometry(width * 0.4, height, 4)
      case 'octahedron':
        return new THREE.OctahedronGeometry(size * 0.5, 0)
      case 'sphere':
        return new THREE.SphereGeometry(size * 0.45, 8, 8)
      case 'torus':
        return new THREE.TorusGeometry(size * 0.25, size * 0.12, 6, 12)
      case 'cone':
        return new THREE.ConeGeometry(width * 0.35, height * 0.9, 8)
      case 'dodecahedron':
        return new THREE.DodecahedronGeometry(size * 0.35, 0)
      default:
        return new THREE.BoxGeometry(width, height, depth)
    }
  }

  update(time: number) {
    if (!this.state.isFalling && !this.state.settled) {
      this.mesh.rotation.y += 0.02
      const floatOffset = Math.sin(time * 3) * 0.05
      this.mesh.position.y = this.state.targetY + GAME_CONFIG.fallHeight + floatOffset
    } else if (this.state.isFalling) {
      this.state.fallProgress += 0.15
      
      if (this.state.fallProgress < 1) {
        const eased = 1 - Math.pow(1 - this.state.fallProgress, 3)
        const currentY = this.mesh.position.y
        const delta = currentY - this.state.targetY
        
        this.mesh.position.y = currentY - delta * eased
        
        const compression = Math.min(eased * 2, 1)
        const scaleY = 0.75 - compression * 0.2
        const scaleXZ = 1.1 + compression * 0.15
        this.mesh.scale.set(scaleXZ, scaleY, scaleXZ)
        
        this.mesh.rotation.x += 0.03
        this.mesh.rotation.z += 0.02
      } else {
        this.state.bounceProgress += 0.3
        if (this.state.bounceProgress < 1) {
          const bounce = Math.sin(this.state.bounceProgress * Math.PI) * 0.12
          this.mesh.position.y = this.state.targetY + bounce
          const scaleY = 1 + bounce * 0.8
          const scaleXZ = 1 - bounce * 0.2
          this.mesh.scale.set(scaleXZ, scaleY, scaleXZ)
          
          this.mesh.rotation.x *= 0.95
          this.mesh.rotation.z *= 0.95
        } else {
          this.mesh.position.y = this.state.targetY
          this.mesh.scale.set(1, 1, 1)
          this.mesh.rotation.x = 0
          this.mesh.rotation.z = 0
          this.state.settled = true
        }
      }
    }
  }

  setPosition(x: number, z: number) {
    this.mesh.position.x = x
    this.mesh.position.z = z
  }

  setTargetY(y: number) {
    this.state.targetY = y
  }

  triggerFall() {
    this.state.isFalling = true
    this.state.fallProgress = 0
    this.state.bounceProgress = 0
  }

  isFallComplete(): boolean {
    return this.state.settled
  }

  getWidth(): number {
    return this.width
  }

  resizeWidth(newWidth: number) {
    this.width = newWidth
    const geometry = new THREE.BoxGeometry(
      this.width, 
      GAME_CONFIG.blockSize.height, 
      GAME_CONFIG.blockSize.depth
    )
    
    const oldGeometry = this.mesh.geometry
    this.mesh.geometry = geometry
    oldGeometry.dispose()
  }

  dispose() {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
  }
}