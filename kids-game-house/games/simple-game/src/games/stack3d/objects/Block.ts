import * as THREE from 'three'
import { GAME_CONFIG, STACK_COLORS } from '../config'

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

  constructor(colorIndex: number, startY: number, blockWidth: number = GAME_CONFIG.blockSize.width) {
    this.originalColor = STACK_COLORS[colorIndex % STACK_COLORS.length]
    this.width = blockWidth
    
    const geometry = new THREE.BoxGeometry(
      this.width, 
      GAME_CONFIG.blockSize.height, 
      GAME_CONFIG.blockSize.depth
    )
    
    const material = new THREE.MeshStandardMaterial({
      color: this.originalColor,
      emissive: this.originalColor,
      emissiveIntensity: 0.4,
      roughness: 0.35,
      metalness: 0.65,
      transparent: true,
      opacity: 0.95,
      envMapIntensity: 1.3
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

  update(time: number) {
    if (!this.state.isFalling && !this.state.settled) {
      this.mesh.rotation.y += 0.015
      const floatOffset = Math.sin(time * 3) * 0.03
      this.mesh.position.y = this.state.targetY + GAME_CONFIG.fallHeight + floatOffset
    } else if (this.state.isFalling) {
      this.state.fallProgress += 0.25
      
      if (this.state.fallProgress < 1) {
        const eased = 1 - Math.pow(1 - this.state.fallProgress, 4)
        const currentY = this.mesh.position.y
        const delta = currentY - this.state.targetY
        
        this.mesh.position.y = currentY - delta * eased
        
        const compression = Math.min(eased * 1.5, 1)
        const scaleY = 0.9 - compression * 0.1
        const scaleXZ = 0.95 + compression * 0.05
        this.mesh.scale.set(scaleXZ, scaleY, scaleXZ)
      } else {
        this.state.bounceProgress += 0.5
        if (this.state.bounceProgress < 1) {
          const bounce = Math.sin(this.state.bounceProgress * Math.PI) * 0.04
          this.mesh.position.y = this.state.targetY + bounce
          const scaleY = 1 + bounce * 0.3
          this.mesh.scale.set(1, scaleY, 1)
        } else {
          this.mesh.position.y = this.state.targetY
          this.mesh.scale.set(1, 1, 1)
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

  getTopY(): number {
    return this.mesh.position.y + GAME_CONFIG.blockSize.height / 2
  }

  dispose() {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
  }
}