import * as THREE from 'three'
import type { GameEngine as ExternalEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { Block, type BlockShape } from './objects/Block'
import { Background } from './objects/Background'
import { ParticleSystem } from './effects/ParticleSystem'
import { GAME_CONFIG, COLORS } from './config'

const SHAPES: BlockShape[] = ['cube', 'cylinder', 'pyramid', 'octahedron', 'sphere', 'torus', 'cone', 'dodecahedron']
const SHAPE_STABILITY_FACTORS: Record<BlockShape, number> = {
  cube: 1.0,
  cylinder: 0.85,
  pyramid: 0.7,
  octahedron: 0.65,
  sphere: 0.5,
  torus: 0.75,
  cone: 0.6,
  dodecahedron: 0.7
}

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
  private base: THREE.Mesh
  private edge: THREE.Mesh
  private gameOver = false
  private score = 0
  private colorIdx = 0
  private totalHeight = 0
  private cameraShake = 0
  private animationId: number = 0
  private currentDir = 1
  private moveSpeed = 0.02
  private isMobile = false
  private prevBlockWidth = GAME_CONFIG.blockSize.width
  private fallingBlock: Block | null = null
  private fallbackProgress = 0
  private fallingDebris: THREE.Mesh[] = []
  private debrisAudioPlayed: Set<THREE.Mesh> = new Set()
  private instabilityWarning = 0
  private scorePanel: HTMLDivElement | null = null
  private lastFrameTime = 0
  private frameCount = 0
  private fps = 60

  constructor(private config: GameConfig) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(COLORS.background)
    this.scene.fog = new THREE.FogExp2(COLORS.background, 0.03)
    
    // 检测是否为移动设备
    this.isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      || (window.visualViewport ? window.visualViewport.width < 768 : window.innerWidth < 768)
    
    // 移动端使用更快的移动速度
    if (this.isMobile) {
      this.moveSpeed = GAME_CONFIG.moveSpeed * 5  // 移动端速度提升5倍
    }
    
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.set(0, 8, 12)
    this.camera.lookAt(0, 3, 0)
    
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.shadowMap.autoUpdate = false
    this.renderer.setClearColor(COLORS.background)
    this.renderer.toneMapping = THREE.NoToneMapping
    
    this.background = new Background(this.scene)
    this.particleSystem = new ParticleSystem(this.scene)
    
    this.setupLighting()
    this.setupBase()
    this.setupEventListeners()
    
    const container = document.getElementById(config.containerId)
    if (container) {
      container.appendChild(this.renderer.domElement)
      this.createScorePanel(container)
    }
    
    this.spawnFirstBlock()
    this.animate()
    
    window.addEventListener('resize', this.onWindowResize.bind(this))
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x555566, 0.6)
    this.scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8)
    mainLight.position.set(12, 30, 15)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.set(1024, 1024)
    mainLight.shadow.camera.near = 0.1
    mainLight.shadow.camera.far = 80
    mainLight.shadow.camera.left = -20
    mainLight.shadow.camera.right = 20
    mainLight.shadow.camera.top = 20
    mainLight.shadow.camera.bottom = -20
    mainLight.shadow.bias = -0.001
    mainLight.shadow.radius = 1
    this.scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x66CCFF, 0.3)
    fillLight.position.set(-15, 20, -18)
    fillLight.castShadow = false
    this.scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xFF9966, 0.6)
    rimLight.position.set(-12, 30, 20)
    this.scene.add(rimLight)

    const bottomLight = new THREE.DirectionalLight(0x4488FF, 0.4)
    bottomLight.position.set(0, -8, 5)
    this.scene.add(bottomLight)

    const pointLight1 = new THREE.PointLight(0x88DDFF, 1.5, 30)
    pointLight1.position.set(-10, 12, 12)
    pointLight1.castShadow = false
    this.scene.add(pointLight1)
    
    const pointLight2 = new THREE.PointLight(0xFFAA88, 1.5, 30)
    pointLight2.position.set(10, 12, -12)
    pointLight2.castShadow = false
    this.scene.add(pointLight2)

    const hemisphereLight = new THREE.HemisphereLight(0x7799CC, 0x334466, 0.5)
    this.scene.add(hemisphereLight)
  }

  private setupBase() {
    const baseGeometry = new THREE.BoxGeometry(10, 0.3, 6)
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.2,
      metalness: 0.85
    })
    this.base = new THREE.Mesh(baseGeometry, baseMaterial)
    this.base.position.y = 0.15
    this.base.receiveShadow = true
    this.scene.add(this.base)
    
    const edgeGeometry = new THREE.BoxGeometry(10.2, 0.4, 6.2)
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x4ECDC4,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x2ECDC4,
      emissiveIntensity: 0.5
    })
    this.edge = new THREE.Mesh(edgeGeometry, edgeMaterial)
    this.edge.position.y = 0.2
    this.edge.castShadow = true
    this.scene.add(this.edge)
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
    const block = new Block(this.colorIdx, baseY, GAME_CONFIG.blockSize.width, 'cube')
    block.mesh.position.x = 0
    block.mesh.position.y = baseY + GAME_CONFIG.fallHeight
    this.scene.add(block.mesh)
    this.currentBlock = block
    this.colorIdx++
  }

  private spawnNextBlock() {
    if (this.gameOver) return
    
    // 检查是否达到最大堆叠高度
    if (this.blocks.length >= GAME_CONFIG.maxStackHeight) {
      this.gameOver = true
      audioService.win()
      setTimeout(() => {
        this.config.externalEngine.endGame()
        this.config.onEnd()
      }, 1000)
      return
    }
    
    const lastBlock = this.blocks[this.blocks.length - 1]
    const baseY = lastBlock.mesh.position.y + GAME_CONFIG.blockSize.height / 2 + GAME_CONFIG.blockSize.height / 2
    
    const shape = this.getRandomShape()
    const block = new Block(this.colorIdx, baseY, this.prevBlockWidth, shape)
    block.mesh.position.x = this.currentDir > 0 ? -4 : 4
    block.mesh.position.y = baseY + GAME_CONFIG.fallHeight
    this.scene.add(block.mesh)
    this.currentBlock = block
    this.colorIdx++
    
    const baseSpeed = GAME_CONFIG.moveSpeed * (this.isMobile ? 5 : 1)
    const heightFactor = Math.min(this.blocks.length * 0.08, 0.8) // 移动端最多增加80%速度，更快的难度递增
    this.moveSpeed = baseSpeed * (1 + heightFactor)
  }

  private getRandomShape(): BlockShape {
    const weights = [30, 15, 12, 10, 8, 12, 10, 3]
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < SHAPES.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return SHAPES[i]
      }
    }
    
    return 'cube'
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
          15
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
        this.fallingBlock = block
        this.fallbackProgress = 0
        
        setTimeout(() => {
          this.config.externalEngine.endGame()
          this.config.onEnd()
        }, 2000)
        return
      }
      
      const stability = this.calculateStability(block, lastBlock, overlapWidth, currentWidth)
      
      // 使用配置的稳定性阈值
      if (stability <= GAME_CONFIG.stabilityThreshold) {
        this.triggerCollapse(block)
        return
      }
      
      this.instabilityWarning = 1 - stability
      
      block.mesh.position.x = currentX
      this.prevBlockWidth = currentWidth
      
      this.blocks.push(block)
      this.currentBlock = null
      
      this.totalHeight = block.mesh.position.y + GAME_CONFIG.blockSize.height / 2
      
      audioService.click()
      this.addScore(10 * this.blocks.length)
      
      this.particleSystem.createMagicParticles(
        block.mesh.position.clone(),
        this.getBlockColor(this.colorIdx - 2),
        15
      )
      
      if (this.totalHeight > 3) {
        this.animateCameraShake(0.12)
      }
      
      this.currentDir *= -1
      this.spawnNextBlock()
    }, 600)
  }

  private calculateStability(block: Block, lastBlock: Block, overlapWidth: number, currentWidth: number): number {
    const lastBlockWidth = (lastBlock.mesh.geometry as THREE.BoxGeometry).parameters?.width || GAME_CONFIG.blockSize.width
    
    // 1. 基础支撑比例（重叠面积占比）
    const supportRatio = overlapWidth / Math.max(currentWidth, lastBlockWidth)
    
    // 2. 重心偏移检测 - 更真实的物理模拟
    const centerOffset = Math.abs(block.mesh.position.x - lastBlock.mesh.position.x)
    const maxAllowedOffset = lastBlockWidth * 0.5 // 最大允许偏移为宽度的一半
    const offsetRatio = centerOffset / maxAllowedOffset
    
    // 如果重心超出支撑面，立即倒塌
    if (offsetRatio > 1) {
      return 0
    }
    
    // 3. 力矩计算 - 考虑杠杆效应
    // 偏移越大，力矩越大，越不稳定
    const torqueFactor = Math.pow(offsetRatio, 2) // 平方关系，非线性增长
    
    // 4. 高度惩罚 - 越高越不稳定
    const heightPenalty = Math.min(this.blocks.length * 0.02, 0.3) // 每层增加2%不稳定性，最多30%
    
    // 5. 累积倾斜检测 - 检查整体塔的倾斜程度
    const tiltPenalty = this.calculateTiltPenalty()
    
    // 6. 形状稳定性因子
    const shapeStability = this.getShapeStabilityFactor(block)
    
    // 综合稳定性计算
    let stability = supportRatio * (1 - torqueFactor * 0.6) * shapeStability
    stability -= heightPenalty
    stability -= tiltPenalty
    
    // 确保稳定性在0-1之间
    return Math.max(0, Math.min(1, stability))
  }
  
  private calculateTiltPenalty(): number {
    if (this.blocks.length < 3) return 0
    
    // 计算最近5层的平均偏移
    const recentBlocks = this.blocks.slice(-5)
    let totalOffset = 0
    
    for (let i = 1; i < recentBlocks.length; i++) {
      const offset = Math.abs(recentBlocks[i].mesh.position.x - recentBlocks[i-1].mesh.position.x)
      totalOffset += offset
    }
    
    const avgOffset = totalOffset / (recentBlocks.length - 1)
    const tiltPenalty = avgOffset * GAME_CONFIG.tiltSensitivity
    
    return Math.min(tiltPenalty, 0.25) // 最大25%的倾斜惩罚
  }
  
  private getShapeStabilityFactor(block: Block): number {
    // 不同形状的稳定性系数
    const shapeFactors: Record<string, number> = {
      'cube': 1.0,
      'cylinder': 0.9,
      'pyramid': 0.75,
      'octahedron': 0.7,
      'sphere': 0.5,
      'torus': 0.8,
      'cone': 0.65,
      'dodecahedron': 0.75
    }
    
    return shapeFactors[block.shape] || 0.85
  }

  private triggerCollapse(block: Block) {
    this.gameOver = true
    this.fallingBlock = block
    
    this.blocks.forEach((b, index) => {
      if (index < this.blocks.length - 1) {
        const delay = index * 0.08
        setTimeout(() => {
          this.createFallingDebris(b)
        }, delay * 1000)
      }
    })
    
    setTimeout(() => {
      this.createFallingDebris(block)
      audioService.lose()
    }, 200)
    
    setTimeout(() => {
      this.config.externalEngine.endGame()
      this.config.onEnd()
    }, 2000)
  }

  private createFallingDebris(block: Block) {
    const geo = block.mesh.geometry as THREE.BoxGeometry
    const width = geo.parameters.width
    const height = geo.parameters.height
    const depth = geo.parameters.depth
    
    const pieceCount = Math.floor(width * 2) + 2
    
    for (let i = 0; i < pieceCount; i++) {
      const pieceWidth = (width / pieceCount) * (0.8 + Math.random() * 0.4)
      const pieceHeight = height * (0.6 + Math.random() * 0.6)
      const pieceDepth = depth * (0.5 + Math.random() * 0.7)
      
      const debrisGeo = new THREE.BoxGeometry(pieceWidth, pieceHeight, pieceDepth)
      const debrisMat = new THREE.MeshBasicMaterial({
        color: this.getBlockColor(this.colorIdx - 2) + Math.floor((Math.random() - 0.5) * 0x333333),
        transparent: true,
        opacity: 0.8
      })
      const debris = new THREE.Mesh(debrisGeo, debrisMat)
      
      const offsetX = (i / pieceCount - 0.5) * width * 0.8
      debris.position.set(
        block.mesh.position.x + offsetX,
        block.mesh.position.y + (Math.random() - 0.5) * height,
        block.mesh.position.z + (Math.random() - 0.5) * depth
      )
      debris.castShadow = true
      this.scene.add(debris)
      
      const velocity = 0.2 + Math.random() * 0.3
      const angle = Math.PI * (0.25 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1)
      
      debris.userData = {
        velocity: new THREE.Vector3(
          Math.cos(angle) * velocity,
          Math.random() * 0.2 + 0.1,
          Math.sin(angle) * velocity * 0.8
        ),
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.8
        ),
        life: 1,
        gravity: 0.03 + Math.random() * 0.02,
        friction: 0.985 + Math.random() * 0.01,
        restitution: 0.2 + Math.random() * 0.2,
        isDebris: true
      }
      
      this.fallingDebris.push(debris)
    }
    
    this.scene.remove(block.mesh)
  }

  private noise(x: number): number {
    return Math.sin(x * 2.1) * 0.4 + Math.sin(x * 3.7) * 0.3 + Math.sin(x * 5.3) * 0.2 + Math.sin(x * 7.9) * 0.1
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
    this.updateScorePanel()
  }

  private createScorePanel(container: HTMLElement) {
    this.scorePanel = document.createElement('div')
    this.scorePanel.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 40px;
      z-index: 100;
      padding: 12px 30px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `
    
    const scoreDiv = document.createElement('div')
    scoreDiv.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
    `
    
    const scoreLabel = document.createElement('span')
    scoreLabel.textContent = '分数'
    scoreLabel.style.cssText = `
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 4px;
    `
    
    const scoreValue = document.createElement('span')
    scoreValue.id = 'stack3d-score'
    scoreValue.textContent = '0'
    scoreValue.style.cssText = `
      font-size: 28px;
      font-weight: bold;
      color: #4ECDC4;
      text-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
    `
    
    scoreDiv.appendChild(scoreLabel)
    scoreDiv.appendChild(scoreValue)
    
    const heightDiv = document.createElement('div')
    heightDiv.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
    `
    
    const heightLabel = document.createElement('span')
    heightLabel.textContent = '高度'
    heightLabel.style.cssText = `
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 4px;
    `
    
    const heightValue = document.createElement('span')
    heightValue.id = 'stack3d-height'
    heightValue.textContent = '0'
    heightValue.style.cssText = `
      font-size: 28px;
      font-weight: bold;
      color: #FFD93D;
      text-shadow: 0 0 10px rgba(255, 217, 61, 0.5);
    `
    
    heightDiv.appendChild(heightLabel)
    heightDiv.appendChild(heightValue)
    
    // 添加进度条显示剩余层数
    const progressDiv = document.createElement('div')
    progressDiv.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
    `
    
    const progressLabel = document.createElement('span')
    progressLabel.textContent = '进度'
    progressLabel.style.cssText = `
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 4px;
    `
    
    const progressBar = document.createElement('div')
    progressBar.style.cssText = `
      width: 80px;
      height: 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      overflow: hidden;
    `
    
    const progressFill = document.createElement('div')
    progressFill.id = 'stack3d-progress-fill'
    progressFill.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #4ECDC4, #FFD93D);
      border-radius: 6px;
      transition: width 0.3s ease;
      width: 0%;
    `
    
    progressBar.appendChild(progressFill)
    progressDiv.appendChild(progressLabel)
    progressDiv.appendChild(progressBar)
    
    const stabilityDiv = document.createElement('div')
    stabilityDiv.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
    `
    
    const stabilityLabel = document.createElement('span')
    stabilityLabel.textContent = '稳定性'
    stabilityLabel.style.cssText = `
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 4px;
    `
    
    const stabilityBar = document.createElement('div')
    stabilityBar.id = 'stack3d-stability-bar'
    stabilityBar.style.cssText = `
      width: 80px;
      height: 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      overflow: hidden;
    `
    
    const stabilityFill = document.createElement('div')
    stabilityFill.id = 'stack3d-stability-fill'
    stabilityFill.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #2ED573, #FFD93D, #FF4757);
      border-radius: 6px;
      transition: width 0.3s ease, background 0.3s ease;
      width: 100%;
    `
    
    stabilityBar.appendChild(stabilityFill)
    stabilityDiv.appendChild(stabilityLabel)
    stabilityDiv.appendChild(stabilityBar)
    
    this.scorePanel.appendChild(scoreDiv)
    this.scorePanel.appendChild(heightDiv)
    this.scorePanel.appendChild(progressDiv)
    this.scorePanel.appendChild(stabilityDiv)
    
    container.appendChild(this.scorePanel)
  }

  private updateScorePanel() {
    if (!this.scorePanel) return
    
    const scoreEl = document.getElementById('stack3d-score')
    const heightEl = document.getElementById('stack3d-height')
    const stabilityFill = document.getElementById('stack3d-stability-fill')
    const progressFill = document.getElementById('stack3d-progress-fill')
    
    if (scoreEl) {
      scoreEl.textContent = this.score.toString()
    }
    
    if (heightEl) {
      heightEl.textContent = this.blocks.length.toString()
    }
    
    if (progressFill) {
      const progress = (this.blocks.length / GAME_CONFIG.maxStackHeight) * 100
      progressFill.style.width = `${Math.min(progress, 100)}%`
    }
    
    if (stabilityFill) {
      const stability = this.blocks.length >= 2 ? this.calculateCurrentStability() : 1
      stabilityFill.style.width = `${stability * 100}%`
    }
  }

  private calculateCurrentStability(): number {
    if (this.blocks.length < 2) return 1
    
    const block = this.blocks[this.blocks.length - 1]
    const lastBlock = this.blocks[this.blocks.length - 2]
    
    const blockWidth = block.mesh.geometry.parameters?.width || GAME_CONFIG.blockSize.width
    const lastBlockWidth = lastBlock.mesh.geometry.parameters?.width || GAME_CONFIG.blockSize.width
    
    const blockLeft = block.mesh.position.x - blockWidth / 2
    const blockRight = block.mesh.position.x + blockWidth / 2
    const lastLeft = lastBlock.mesh.position.x - lastBlockWidth / 2
    const lastRight = lastBlock.mesh.position.x + lastBlockWidth / 2
    
    const overlapLeft = Math.max(blockLeft, lastLeft)
    const overlapRight = Math.min(blockRight, lastRight)
    const overlapWidth = Math.max(0, overlapRight - overlapLeft)
    
    return this.calculateStability(block, lastBlock, overlapWidth, blockWidth)
  }

  private animateCameraShake(intensity: number) {
    this.cameraShake = intensity
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate())
    
    const currentTime = performance.now()
    this.frameCount++
    
    if (currentTime - this.lastFrameTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFrameTime))
      this.frameCount = 0
      this.lastFrameTime = currentTime
      
      if (this.renderer.shadowMap.autoUpdate === false) {
        this.renderer.shadowMap.needsUpdate = true
      }
    }
    
    const time = Date.now() * 0.001

    if (this.currentBlock && !this.currentBlock.state.isFalling) {
      this.currentBlock.mesh.position.x += this.currentDir * this.moveSpeed
      
      if (this.currentBlock.mesh.position.x > 4 || this.currentBlock.mesh.position.x < -4) {
        this.currentDir *= -1
      }
    }

    this.blocks.forEach(block => block.update(time))
    if (this.currentBlock) {
      this.currentBlock.update(time)
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

    const baseDropSpeed = 0.08
    const maxBaseDrop = this.blocks.length * GAME_CONFIG.blockSize.height * 0.5
    const targetBaseY = 0.15 - maxBaseDrop
    if (this.base && this.edge) {
      this.base.position.y += (targetBaseY - this.base.position.y) * baseDropSpeed
      this.edge.position.y += ((targetBaseY + 0.05) - this.edge.position.y) * baseDropSpeed
    }

    if (this.instabilityWarning > 0) {
      const warningIntensity = this.instabilityWarning
      this.blocks.forEach((block, index) => {
        const wobbleAmount = warningIntensity * 0.3 * (1 - index / this.blocks.length)
        const wobbleSpeed = 15
        block.mesh.position.x += Math.sin(time * wobbleSpeed + index) * wobbleAmount * 0.1
        block.mesh.position.y += Math.sin(time * wobbleSpeed * 1.5 + index * 2) * wobbleAmount * 0.05
        
        const mat = block.mesh.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0.15 + warningIntensity * 0.3
      })
      this.instabilityWarning *= 0.95
    }

    if (this.fallingBlock && this.gameOver) {
      this.fallbackProgress += 0.02
      
      const eased = 1 - Math.pow(1 - this.fallbackProgress, 3)
      
      this.fallingBlock.mesh.position.y -= eased * 0.8
      
      this.fallingBlock.mesh.rotation.x += 0.08
      this.fallingBlock.mesh.rotation.z += 0.05
      
      this.fallingBlock.mesh.position.x += Math.sin(this.fallbackProgress * Math.PI) * 0.1
      
      const scale = 1 - eased * 0.3
      this.fallingBlock.mesh.scale.set(scale, scale * 0.7, scale)
    }

    this.fallingDebris = this.fallingDebris.filter(debris => {
      const velocity = debris.userData.velocity as THREE.Vector3
      const rotationSpeed = debris.userData.rotationSpeed as THREE.Vector3
      const friction = debris.userData.friction as number || 0.98
      const gravity = debris.userData.gravity as number || 0.03
      const restitution = debris.userData.restitution as number || 0.35
      const groundLevel = -0.5
      
      debris.userData.life -= 0.006
      if (debris.userData.life <= 0 || debris.position.y < -30) {
        this.scene.remove(debris)
        debris.geometry.dispose()
        ;(debris.material as THREE.Material).dispose()
        this.debrisAudioPlayed.delete(debris)
        return false
      }
      
      if (velocity) {
        velocity.y -= gravity
        
        const halfHeight = (debris.geometry as THREE.BoxGeometry).parameters.height / 2
        const groundY = groundLevel + halfHeight
        
        if (debris.position.y <= groundY && velocity.y < 0) {
          debris.position.y = groundY
          velocity.y = -velocity.y * restitution
          
          if (!this.debrisAudioPlayed.has(debris)) {
            this.debrisAudioPlayed.add(debris)
            audioService.click()
          }
          
          if (Math.abs(velocity.y) < 0.05) {
            velocity.y = 0
            velocity.x *= 0.95
            velocity.z *= 0.95
          }
        }
        
        debris.position.add(velocity)
        velocity.x *= friction
        velocity.z *= friction
      }
      
      if (rotationSpeed) {
        debris.rotation.x += rotationSpeed.x
        debris.rotation.y += rotationSpeed.y
        debris.rotation.z += rotationSpeed.z
      }
      
      const mat = debris.material as THREE.MeshStandardMaterial
      mat.opacity = debris.userData.life
      
      return true
    })

    this.background.update()
    this.particleSystem.update()
    
    if (this.fps < 30) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
    } else if (this.fps > 50) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    }
    
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