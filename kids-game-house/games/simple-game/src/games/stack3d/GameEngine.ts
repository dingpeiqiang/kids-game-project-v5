import * as THREE from 'three'
import type { GameEngine as ExternalEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { Block } from './objects/Block'
import { Background } from './objects/Background'
import { ParticleSystem } from './effects/ParticleSystem'
import { GAME_CONFIG, COLORS } from './config'

export interface GameConfig {
  containerId: string
  externalEngine: ExternalEngine
  onEnd: () => void
}

export class GameEngine {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private blocks: Block[] = []
  private currentBlock: Block | null = null
  private background: Background
  private particleSystem: ParticleSystem
  private gameOver = false
  private score = 0
  private colorIdx = 0
  private totalHeight = 0
  private cameraShake = 0
  private animationId: number = 0
  private currentDir = 1
  private moveSpeed = 0.045
  private prevBlockWidth = GAME_CONFIG.blockSize.width

  constructor(private config: GameConfig) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(COLORS.background)
    this.scene.fog = new THREE.FogExp2(COLORS.background, 0.03)
    
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.set(0, 8, 12)
    this.camera.lookAt(0, 3, 0)
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    if (this.renderer.shadowMap.mapSize) {
      this.renderer.shadowMap.mapSize.set(2048, 2048)
    }
    this.renderer.setClearColor(COLORS.background)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    
    this.background = new Background(this.scene)
    this.particleSystem = new ParticleSystem(this.scene)
    
    this.setupLighting()
    this.setupBase()
    this.setupEventListeners()
    
    const container = document.getElementById(config.containerId)
    if (container) {
      container.appendChild(this.renderer.domElement)
    }
    
    this.spawnFirstBlock()
    this.animate()
    
    window.addEventListener('resize', this.onWindowResize.bind(this))
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x2a2a4e, 0.5)
    this.scene.add(ambientLight)
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0)
    mainLight.position.set(10, 25, 12)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.set(2048, 2048)
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 100
    mainLight.shadow.camera.left = -15
    mainLight.shadow.camera.right = 15
    mainLight.shadow.camera.top = 15
    mainLight.shadow.camera.bottom = -15
    mainLight.shadow.bias = -0.001
    this.scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x4ECDC4, 0.5)
    fillLight.position.set(-8, 15, -10)
    this.scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xFF6B6B, 0.35)
    rimLight.position.set(-6, 20, 8)
    this.scene.add(rimLight)

    const pointLight1 = new THREE.PointLight(0x4ECDC4, 1.5, 30)
    pointLight1.position.set(-6, 10, 8)
    pointLight1.castShadow = true
    this.scene.add(pointLight1)
    
    const pointLight2 = new THREE.PointLight(0xFF6B6B, 1.5, 30)
    pointLight2.position.set(6, 10, -8)
    pointLight2.castShadow = true
    this.scene.add(pointLight2)
  }

  private setupBase() {
    const baseGeometry = new THREE.BoxGeometry(10, 0.3, 6)
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.2,
      metalness: 0.85
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = 0.15
    base.receiveShadow = true
    this.scene.add(base)
    
    const edgeGeometry = new THREE.BoxGeometry(10.2, 0.4, 6.2)
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x4ECDC4,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x2ECDC4,
      emissiveIntensity: 0.5
    })
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial)
    edge.position.y = 0.2
    edge.castShadow = true
    this.scene.add(edge)
  }

  private setupEventListeners() {
    const canvas = this.renderer.domElement
    
    canvas.addEventListener('mousedown', () => this.onClick())
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.onClick()
    }, { passive: false })
    
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        this.onClick()
      }
    })
  }

  private onClick() {
    if (this.gameOver || !this.currentBlock || this.currentBlock.state.isFalling) return
    this.placeBlock()
  }

  private spawnFirstBlock() {
    const baseY = GAME_CONFIG.blockSize.height / 2 + 0.3
    const block = new Block(this.colorIdx, baseY, GAME_CONFIG.blockSize.width)
    block.mesh.position.x = 0
    block.mesh.position.y = baseY + GAME_CONFIG.fallHeight
    this.scene.add(block.mesh)
    this.currentBlock = block
    this.colorIdx++
  }

  private spawnNextBlock() {
    if (this.gameOver) return
    
    const lastBlock = this.blocks[this.blocks.length - 1]
    const baseY = lastBlock.mesh.position.y + GAME_CONFIG.blockSize.height / 2 + GAME_CONFIG.blockSize.height / 2
    
    const block = new Block(this.colorIdx, baseY, this.prevBlockWidth)
    block.mesh.position.x = this.currentDir > 0 ? -4 : 4
    block.mesh.position.y = baseY + GAME_CONFIG.fallHeight
    this.scene.add(block.mesh)
    this.currentBlock = block
    this.colorIdx++
  }

  private placeBlock() {
    if (!this.currentBlock) return
    
    const block = this.currentBlock
    let lastBlock: Block
    
    if (this.blocks.length === 0) {
      const baseY = GAME_CONFIG.blockSize.height / 2 + 0.3
      block.setTargetY(baseY)
      block.triggerFall()
      
      setTimeout(() => {
        this.blocks.push(block)
        this.currentBlock = null
        this.totalHeight = block.mesh.position.y + GAME_CONFIG.blockSize.height / 2
        
        audioService.click()
        this.addScore(10)
        
        this.particleSystem.createMagicParticles(
          block.mesh.position.clone(),
          this.getBlockColor(this.colorIdx - 1),
          30
        )
        
        this.currentDir *= -1
        this.spawnNextBlock()
      }, 600)
      return
    }
    
    lastBlock = this.blocks[this.blocks.length - 1]
    
    const lastX = lastBlock.mesh.position.x
    const lastWidth = lastBlock.getWidth()
    const currentX = block.mesh.position.x
    const currentWidth = block.getWidth()
    
    const overlapLeft = Math.max(lastX - lastWidth / 2, currentX - currentWidth / 2)
    const overlapRight = Math.min(lastX + lastWidth / 2, currentX + currentWidth / 2)
    const overlapWidth = overlapRight - overlapLeft
    
    const targetY = lastBlock.mesh.position.y + GAME_CONFIG.blockSize.height / 2 + GAME_CONFIG.blockSize.height / 2
    block.setTargetY(targetY)
    block.triggerFall()
    
    setTimeout(() => {
      if (overlapWidth <= 0.1) {
        this.gameOver = true
        audioService.explosion()
        block.mesh.position.y -= 15
        block.mesh.rotation.x = Math.PI / 4
        
        setTimeout(() => {
          this.config.externalEngine.endGame()
          this.config.onEnd()
        }, 1500)
        return
      }
      
      let finalX = currentX
      if (overlapWidth < currentWidth - 0.1) {
        const cutWidth = currentWidth - overlapWidth
        const cutFromLeft = currentX - currentWidth / 2 < lastX - lastWidth / 2
        
        block.resizeWidth(overlapWidth)
        
        if (cutFromLeft) {
          finalX = lastX - lastWidth / 2 + overlapWidth / 2
        } else {
          finalX = lastX + lastWidth / 2 - overlapWidth / 2
        }
        block.mesh.position.x = finalX
        
        this.particleSystem.createCutParticles(
          cutFromLeft ? currentX - currentWidth / 2 : currentX + currentWidth / 2,
          block.mesh.position.y,
          cutWidth,
          this.getBlockColor(this.colorIdx - 2)
        )
      }
      
      this.prevBlockWidth = overlapWidth
      
      this.blocks.push(block)
      this.currentBlock = null
      
      this.totalHeight = block.mesh.position.y + GAME_CONFIG.blockSize.height / 2
      
      audioService.click()
      this.addScore(10 * this.blocks.length)
      
      this.particleSystem.createMagicParticles(
        block.mesh.position.clone(),
        this.getBlockColor(this.colorIdx - 2),
        30
      )
      
      if (this.totalHeight > 3) {
        this.animateCameraShake(0.12)
      }
      
      this.currentDir *= -1
      this.spawnNextBlock()
    }, 600)
  }

  private getBlockColor(index: number): number {
    const colors = [
      0xFF6B6B, 0x4ECDC4, 0xFFD93D, 0x9B59B6, 
      0xFF8E53, 0x6BCB77, 0x4D96FF, 0xFF69B4, 
      0x87CEEB, 0xF38181, 0xAA96DA, 0xFCBAD3,
      0xFFE66D, 0x95E1D3, 0xF093FB, 0xF5576C
    ]
    return colors[index % colors.length]
  }

  private addScore(points: number) {
    this.score += points
    this.config.externalEngine.addScore(points, window.innerWidth / 2, window.innerHeight / 2)
  }

  private animateCameraShake(intensity: number) {
    this.cameraShake = intensity
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate())
    
    const time = Date.now() * 0.001

    if (this.currentBlock && !this.currentBlock.state.isFalling) {
      this.currentBlock.mesh.position.x += this.currentDir * this.moveSpeed
      
      if (this.currentBlock.mesh.position.x > 4 || this.currentBlock.mesh.position.x < -4) {
        this.currentDir *= -1
      }
      
      const floatOffset = Math.sin(time * 3) * 0.03
      this.currentBlock.mesh.position.y = this.currentBlock.state.targetY + GAME_CONFIG.fallHeight + floatOffset
      
      this.currentBlock.mesh.rotation.y += 0.02
    }

    if (this.cameraShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.cameraShake * 0.5
      const shakeY = (Math.random() - 0.5) * this.cameraShake * 0.4
      const shakeZ = (Math.random() - 0.5) * this.cameraShake * 0.3
      this.camera.position.x += shakeX
      this.camera.position.y += shakeY
      this.camera.position.z += shakeZ
      this.cameraShake *= 0.85
    }

    if (this.totalHeight > 5) {
      const targetY = 6 + (this.totalHeight - 5) * 0.3
      this.camera.position.y += (targetY - this.camera.position.y) * 0.05
    }

    this.background.update()
    this.particleSystem.update()
    this.renderer.render(this.scene, this.camera)
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  public destroy() {
    cancelAnimationFrame(this.animationId)
    window.removeEventListener('resize', this.onWindowResize.bind(this))
    
    this.background.dispose()
    this.particleSystem.dispose()
    
    this.blocks.forEach(block => block.dispose())
    
    this.renderer.dispose()
    const container = document.getElementById(this.config.containerId)
    if (container && this.renderer.domElement.parentElement === container) {
      container.removeChild(this.renderer.domElement)
    }
  }

  public getScore(): number {
    return this.score
  }
}