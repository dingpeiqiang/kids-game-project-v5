// 使用全局 Phaser 对象（通过 CDN 加载），避免 Vite HMR 影响
// @ts-ignore
const Phaser = window.Phaser || (await import('phaser')).default

import type { 
  Plant, 
  Zombie, 
  Projectile, 
  Sun, 
  Particle,
  PlantType,
  ZombieType
} from '@/types/game'
import { GAME_CONFIG, PLANT_CONFIGS, ZOMBIE_CONFIGS } from '@/types/game'
import { initUIParams, updateUIParams } from '@/utils/uiResponsive'
import { AssetLoader } from '@/utils/AssetLoader'
import { useFallback, getAssetPath, PLANT_ASSETS, ZOMBIE_ASSETS, PROJECTILE_ASSETS, SUN_ASSETS } from '@/config/game-assets.config'
import type { ThemeConfig } from '@/config/theme.config'

export class PvzPhaserGame {
  private config: Phaser.Types.Core.GameConfig
  private game: Phaser.Game | null = null
  private scene: Phaser.Scene | null = null

  private readonly DESIGN_WIDTH = 720
  private readonly DESIGN_HEIGHT = 1280
  
  private readonly GRID_ROWS = GAME_CONFIG.gridRows
  private readonly GRID_COLS = GAME_CONFIG.gridCols
  
  private Adapt = {
    screenW: 0,
    screenH: 0,
    scale: 1,
    safeTop: 0,
    safeBottom: 0,
    cellSize: 0,
    gameAreaX: 0,
    gameAreaY: 0
  }

  private plantGroup: Phaser.GameObjects.Group | null = null
  private zombieGroup: Phaser.GameObjects.Group | null = null
  private projectileGroup: Phaser.GameObjects.Group | null = null
  private sunGroup: Phaser.GameObjects.Group | null = null
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null
  
  private plantTextures: Map<string, Phaser.Textures.Texture> = new Map()
  private zombieTextures: Map<string, Phaser.Textures.Texture> = new Map()
  private projectileTextures: Map<string, Phaser.Textures.Texture> = new Map()
  private sunTexture: Phaser.Textures.Texture | null = null
  private assetLoader: AssetLoader | null = null
  
  // 主题配置
  private currentTheme: ThemeConfig | null = null
  private themePlantEmojis: Record<string, string> = {}
  private themeZombieEmojis: Record<string, string> = {}
  private themeProjectileEmojis: Record<string, string> = {}
  private themeSunEmoji: string = '☀️'
  private themeBackgroundColor: string = '#1a472a'

  private containerElement: HTMLElement | null = null

  constructor(element: HTMLElement) {
    this.containerElement = element

    // 使用闭包保存 self 引用，以便在场景方法中访问 PvzPhaserGame 实例
    const self = this

    this.config = {
      type: Phaser.AUTO,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
      },
      parent: element,
      backgroundColor: '#1a472a',
      audio: {
        disableWebAudio: true  // 禁用Phaser自己的音频系统，使用我们自己的
      },
      scene: {
        preload() {
          // 这里的 this 是 Phaser.Scene，self 是 PvzPhaserGame 实例
          self.preload.call(self, this)
        },
        create() {
          self.create.call(self, this)
        },
        update(time: number, delta: number) {
          // Phaser 自动传递 time 和 delta 参数
          self.update.call(self, time, delta)
        }
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      }
    }
  }

  start(): void {
    if (this.game) {
      this.game.destroy(true)
    }
    this.game = new Phaser.Game(this.config)

    // 等待场景准备好后设置回调
    this.game.events.once('ready', () => {
      this.scene = this.game?.scene.getScene('default') as Phaser.Scene
      if (this.pvzCallbacks) {
        (this.scene as any).pvzGame = this.pvzCallbacks
      }
    })
  }

  private pvzCallbacks: any = null

  setPvzCallbacks(callbacks: { collectSun: (sunId: string) => void }): void {
    this.pvzCallbacks = callbacks
    // 如果场景已经准备好，直接设置
    if (this.scene) {
      (this.scene as any).pvzGame = callbacks
    }
  }

  private preload(scene: Phaser.Scene): void {
    // 保存场景引用
    this.scene = scene
    
    if (!this.containerElement) return
    
    this.Adapt.screenW = this.containerElement.clientWidth
    this.Adapt.screenH = this.containerElement.clientHeight
    
    this.Adapt.scale = Math.min(
      this.Adapt.screenW / this.DESIGN_WIDTH,
      this.Adapt.screenH / this.DESIGN_HEIGHT
    )

    this.Adapt.safeTop = Math.max(44, this.Adapt.screenH * 0.05)
    this.Adapt.safeBottom = Math.max(34, this.Adapt.screenH * 0.08)

    const baseCellSize = 80
    const gameAreaWidth = this.GRID_COLS * baseCellSize
    const gameAreaHeight = this.GRID_ROWS * baseCellSize
    
    const availableWidth = (this.Adapt.screenW - 20) * 0.95
    const availableHeight = (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom) * 0.85
    
    const scaleByWidth = availableWidth / gameAreaWidth
    const scaleByHeight = availableHeight / gameAreaHeight
    
    const finalScale = Math.min(scaleByWidth, scaleByHeight, 1.2)
    this.Adapt.cellSize = baseCellSize * finalScale
    
    initUIParams(this.Adapt.screenW, this.Adapt.screenH)
  }

  private create(scene: Phaser.Scene): void {
    // 保存场景引用
    this.scene = scene

    // 初始化资源加载器
    this.assetLoader = new AssetLoader(scene)

    this.Adapt.screenW = scene.scale.width
    this.Adapt.screenH = scene.scale.height
    
    scene.scale.on('resize', this.handleResize, this)

    this.createAllGameElements(scene)
    
    // 应用背景色
    if (this.scene) {
      const bgColor = this.themeBackgroundColor || '#1a472a'
      this.scene.cameras.main.setBackgroundColor(bgColor)
    }
  }

  /**
   * 设置游戏主题
   * @param theme 主题配置
   */
  setTheme(theme: ThemeConfig): void {
    this.currentTheme = theme
    
    // 更新植物 Emoji
    const pvzAssets = (theme.gameSpecific as any)?.pvz
    if (pvzAssets?.plants) {
      Object.entries(pvzAssets.plants).forEach(([key, asset]: [string, any]) => {
        this.themePlantEmojis[key] = asset?.value || this.plantEmojis[key as PlantType] || '🌱'
      })
    }
    
    // 更新僵尸 Emoji
    if (pvzAssets?.zombies) {
      Object.entries(pvzAssets.zombies).forEach(([key, asset]: [string, any]) => {
        this.themeZombieEmojis[key] = asset?.value || this.zombieEmojis[key as ZombieType] || '🧟'
      })
    }
    
    // 更新子弹 Emoji
    if (pvzAssets?.projectile) {
      this.themeProjectileEmojis['pea'] = pvzAssets.projectile?.value || '🟢'
      this.themeProjectileEmojis['snowpea'] = '❄️'
    }
    
    // 更新阳光 Emoji
    if (pvzAssets?.sun) {
      this.themeSunEmoji = pvzAssets.sun?.value || '☀️'
    }
    
    // 更新背景色
    if (pvzAssets?.background) {
      this.themeBackgroundColor = pvzAssets.background?.value || theme.colors.background || '#1a472a'
    } else {
      this.themeBackgroundColor = theme.colors.background || '#1a472a'
    }
    
    // 应用背景色到场景
    if (this.scene) {
      const bgColor = this.themeBackgroundColor
      this.scene.cameras.main.setBackgroundColor(bgColor)
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.Adapt.screenW = gameSize.width
    this.Adapt.screenH = gameSize.height

    this.Adapt.safeTop = Math.max(44, this.Adapt.screenH * 0.05)
    this.Adapt.safeBottom = Math.max(34, this.Adapt.screenH * 0.08)
    this.recalculateAdaptParams()

    if (this.scene) {
      this.createAllGameElements(this.scene)
    }
  }

  private recalculateAdaptParams(): void {
    const baseCellSize = 80
    const gameAreaWidth = this.GRID_COLS * baseCellSize
    const gameAreaHeight = this.GRID_ROWS * baseCellSize
    
    const availableWidth = (this.Adapt.screenW - 20) * 0.95
    const availableHeight = (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom) * 0.85
    
    const scaleByWidth = availableWidth / gameAreaWidth
    const scaleByHeight = availableHeight / gameAreaHeight
    
    const finalScale = Math.min(scaleByWidth, scaleByHeight, 1.2)
    this.Adapt.cellSize = baseCellSize * finalScale
    
    updateUIParams(this.Adapt.screenW, this.Adapt.screenH)
  }

  private createAllGameElements(scene: Phaser.Scene): void {
    if (this.plantGroup) {
      this.plantGroup.clear(true, true)
    }
    if (this.zombieGroup) {
      this.zombieGroup.clear(true, true)
    }
    if (this.projectileGroup) {
      this.projectileGroup.clear(true, true)
    }
    if (this.sunGroup) {
      this.sunGroup.clear(true, true)
    }
    if (this.particles) {
      this.particles.destroy()
    }

    // 只在纹理不存在时才创建
    if (this.plantTextures.size === 0) {
      this.createPlantTextures(scene)
    }
    if (this.zombieTextures.size === 0) {
      this.createZombieTextures(scene)
    }

    this.createBackground(scene)
    this.createGrid(scene)

    this.plantGroup = scene.add.group()
    this.zombieGroup = scene.add.group()
    this.projectileGroup = scene.add.group()
    this.sunGroup = scene.add.group()

    const particleScale = this.Adapt.cellSize / 80
    this.particles = scene.add.particles(0, 0, 'particle', {
      speed: { min: 50 * particleScale, max: 150 * particleScale },
      scale: { start: 0.5 * particleScale, end: 0 },
      lifespan: 500,
      blendMode: 'ADD',
      emitting: false
    })

    this.createParticleTexture(scene)
  }

  private createBackground(scene: Phaser.Scene): void {
    const graphics = scene.add.graphics()

    const colors = [0x1a472a, 0x2d5a3d, 0x3d6b4f]
    for (let y = 0; y < this.Adapt.screenH; y += 8) {
      const ratio = y / this.Adapt.screenH
      const color = this.interpolateColor(colors[0], colors[2], ratio)
      graphics.fillStyle(color, 1)
      graphics.fillRect(0, y, this.Adapt.screenW, 8)
    }

    const gameWidth = this.GRID_COLS * this.Adapt.cellSize
    const gameHeight = this.GRID_ROWS * this.Adapt.cellSize
    const offsetX = (this.Adapt.screenW - gameWidth) / 2
    const offsetY = this.Adapt.safeTop + (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom - gameHeight) / 2

    this.Adapt.gameAreaX = offsetX
    this.Adapt.gameAreaY = offsetY

    const borderWidth = Math.max(3, this.Adapt.cellSize * 0.05)
    graphics.lineStyle(borderWidth, 0x4ade80, 0.8)
    graphics.strokeRect(offsetX, offsetY, gameWidth, gameHeight)

    graphics.fillStyle(0x2d5a3d, 0.9)
    graphics.fillRect(offsetX, offsetY, gameWidth, gameHeight)
  }

  private createGrid(scene: Phaser.Scene): void {
    const graphics = scene.add.graphics()
    const lineWidth = Math.max(1, this.Adapt.cellSize * 0.02)
    graphics.lineStyle(lineWidth, 0xffffff, 0.15)

    const gameWidth = this.GRID_COLS * this.Adapt.cellSize
    const gameHeight = this.GRID_ROWS * this.Adapt.cellSize
    const offsetX = this.Adapt.gameAreaX
    const offsetY = this.Adapt.gameAreaY

    for (let i = 1; i < this.GRID_COLS; i++) {
      const pos = i * this.Adapt.cellSize
      graphics.moveTo(offsetX + pos, offsetY)
      graphics.lineTo(offsetX + pos, offsetY + gameHeight)
    }

    for (let j = 1; j < this.GRID_ROWS; j++) {
      const pos = j * this.Adapt.cellSize
      graphics.moveTo(offsetX, offsetY + pos)
      graphics.lineTo(offsetX + gameWidth, offsetY + pos)
    }

    graphics.strokePath()
  }

  private createParticleTexture(scene: Phaser.Scene): void {
    const particleSize = Math.max(8, this.Adapt.cellSize * 0.1)
    const textureSize = Math.max(16, particleSize * 2)
    
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false })
    graphics.fillStyle(0xffffff, 1)
    graphics.fillCircle(particleSize, particleSize, particleSize)
    graphics.generateTexture('particle', textureSize, textureSize)
  }

  // 辅助函数：将字符串颜色转换为数字颜色
  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16)
  }

  private createPlantTextures(scene: Phaser.Scene): void {
    const plantTypes: PlantType[] = ['sunflower', 'peashooter', 'wallnut', 'cherrybomb', 'snowpea']

    plantTypes.forEach(type => {
      const size = Math.max(40, this.Adapt.cellSize * 0.8)
      const textureSize = Math.max(80, size * 2)

      const centerX = textureSize / 2
      const centerY = textureSize / 2
      const radius = size / 2

      const g = scene.make.graphics({ x: 0, y: 0, add: false })

      // 向日葵 - 黄色花瓣 + 棕色花心 + 绿色叶子
      if (type === 'sunflower') {
        // 绿色茎
        g.fillStyle(0x22c55e, 1)
        g.fillRoundedRect(centerX - radius * 0.1, centerY + radius * 0.3, radius * 0.2, radius * 0.7, 5)
        // 叶子
        g.fillEllipse(centerX - radius * 0.4, centerY + radius * 0.5, radius * 0.4, radius * 0.2)
        g.fillEllipse(centerX + radius * 0.3, centerY + radius * 0.6, radius * 0.3, radius * 0.15)
        // 黄色花瓣
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
          const px = centerX + Math.cos(angle) * radius * 0.5
          const py = centerY + Math.sin(angle) * radius * 0.5
          g.fillStyle(0xfbbf24, 1)
          g.fillEllipse(px, py, radius * 0.4, radius * 0.25, 8)
        }
        // 棕色花心
        g.fillStyle(0x78350f, 1)
        g.fillCircle(centerX, centerY, radius * 0.4)
        // 花心斑点
        g.fillStyle(0x5d3a1a, 1)
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2
          g.fillCircle(centerX + Math.cos(angle) * radius * 0.2, centerY + Math.sin(angle) * radius * 0.2, radius * 0.08)
        }
      }
      // 豌豆射手 - 绿色头部 + 嘴巴 + 眼睛
      else if (type === 'peashooter') {
        // 绿色茎
        g.fillStyle(0x166534, 1)
        g.fillRoundedRect(centerX - radius * 0.15, centerY + radius * 0.3, radius * 0.3, radius * 0.8, 8)
        // 叶子
        g.fillStyle(0x22c55e, 1)
        g.fillEllipse(centerX - radius * 0.4, centerY + radius * 0.5, radius * 0.4, radius * 0.2)
        g.fillEllipse(centerX + radius * 0.35, centerY + radius * 0.4, radius * 0.35, radius * 0.18)
        // 头部
        g.fillStyle(0x22c55e, 1)
        g.fillCircle(centerX, centerY - radius * 0.1, radius * 0.6)
        // 嘴巴
        g.fillStyle(0x166534, 1)
        g.fillEllipse(centerX + radius * 0.35, centerY - radius * 0.1, radius * 0.35, radius * 0.25)
        g.fillStyle(0x000000, 1)
        g.fillCircle(centerX + radius * 0.4, centerY - radius * 0.15, radius * 0.08)
        // 眼睛
        g.fillStyle(0xffffff, 1)
        g.fillCircle(centerX - radius * 0.1, centerY - radius * 0.2, radius * 0.18)
        g.fillCircle(centerX + radius * 0.15, centerY - radius * 0.2, radius * 0.18)
        g.fillStyle(0x000000, 1)
        g.fillCircle(centerX - radius * 0.08, centerY - radius * 0.2, radius * 0.1)
        g.fillCircle(centerX + radius * 0.17, centerY - radius * 0.2, radius * 0.1)
        // 腮红
        g.fillStyle(0x86efac, 0.5)
        g.fillCircle(centerX - radius * 0.3, centerY - radius * 0.05, radius * 0.12)
      }
      // 坚果墙 - 棕色外壳 + 脸部
      else if (type === 'wallnut') {
        // 身体
        g.fillStyle(0xa8763e, 1)
        g.fillRoundedRect(centerX - radius * 0.6, centerY - radius * 0.5, radius * 1.2, radius * 1.1, 20)
        // 高光
        g.fillStyle(0xc9975a, 1)
        g.fillEllipse(centerX - radius * 0.2, centerY - radius * 0.3, radius * 0.3, radius * 0.2)
        // 脸部
        g.fillStyle(0x78350f, 1)
        g.fillCircle(centerX - radius * 0.25, centerY - radius * 0.15, radius * 0.15)
        g.fillCircle(centerX + radius * 0.25, centerY - radius * 0.15, radius * 0.15)
        g.fillEllipse(centerX, centerY + radius * 0.15, radius * 0.4, radius * 0.15)
        // 牙齿
        g.fillStyle(0xfef3c7, 1)
        g.fillRect(centerX - radius * 0.2, centerY + radius * 0.2, radius * 0.12, radius * 0.15)
        g.fillRect(centerX + radius * 0.08, centerY + radius * 0.2, radius * 0.12, radius * 0.15)
      }
      // 樱桃炸弹 - 两个红色樱桃 + 笑脸
      else if (type === 'cherrybomb') {
        // 茎
        g.fillStyle(0x22c55e, 1)
        g.fillRoundedRect(centerX - radius * 0.08, centerY - radius * 0.7, radius * 0.15, radius * 0.4, 4)
        g.fillCircle(centerX, centerY - radius * 0.7, radius * 0.12)
        // 左边樱桃
        g.fillStyle(0xdc2626, 1)
        g.fillCircle(centerX - radius * 0.35, centerY, radius * 0.45)
        g.fillStyle(0xef4444, 1)
        g.fillCircle(centerX - radius * 0.38, centerY - radius * 0.08, radius * 0.25)
        // 右边樱桃
        g.fillStyle(0xdc2626, 1)
        g.fillCircle(centerX + radius * 0.35, centerY, radius * 0.45)
        g.fillStyle(0xef4444, 1)
        g.fillCircle(centerX + radius * 0.32, centerY - radius * 0.08, radius * 0.25)
        // 左边脸
        g.fillStyle(0x000000, 1)
        g.fillCircle(centerX - radius * 0.45, centerY - radius * 0.05, radius * 0.08)
        g.fillCircle(centerX - radius * 0.25, centerY - radius * 0.05, radius * 0.08)
        g.fillEllipse(centerX - radius * 0.35, centerY + radius * 0.12, radius * 0.15, radius * 0.08)
        // 右边脸
        g.fillCircle(centerX + radius * 0.25, centerY - radius * 0.05, radius * 0.08)
        g.fillCircle(centerX + radius * 0.45, centerY - radius * 0.05, radius * 0.08)
        g.fillEllipse(centerX + radius * 0.35, centerY + radius * 0.12, radius * 0.15, radius * 0.08)
      }
      // 寒冰射手 - 浅蓝色头部 + 冰晶装饰
      else if (type === 'snowpea') {
        // 茎
        g.fillStyle(0x0ea5e9, 1)
        g.fillRoundedRect(centerX - radius * 0.12, centerY + radius * 0.3, radius * 0.25, radius * 0.7, 6)
        // 叶子
        g.fillStyle(0x38bdf8, 1)
        g.fillEllipse(centerX - radius * 0.4, centerY + radius * 0.5, radius * 0.4, radius * 0.2)
        g.fillEllipse(centerX + radius * 0.35, centerY + radius * 0.4, radius * 0.35, radius * 0.18)
        // 头部
        g.fillStyle(0x60a5fa, 1)
        g.fillCircle(centerX, centerY - radius * 0.1, radius * 0.6)
        // 冰晶装饰
        g.fillStyle(0xffffff, 0.9)
        g.fillCircle(centerX - radius * 0.3, centerY - radius * 0.35, radius * 0.12)
        g.fillCircle(centerX + radius * 0.25, centerY - radius * 0.35, radius * 0.1)
        g.fillCircle(centerX, centerY - radius * 0.5, radius * 0.08)
        // 嘴巴（吸管）
        g.fillStyle(0x3b82f6, 1)
        g.fillRoundedRect(centerX + radius * 0.2, centerY - radius * 0.2, radius * 0.4, radius * 0.15, 5)
        g.fillStyle(0xfcd34d, 1)
        g.fillCircle(centerX + radius * 0.55, centerY - radius * 0.15, radius * 0.1)
        // 眼睛
        g.fillStyle(0xffffff, 1)
        g.fillCircle(centerX - radius * 0.1, centerY - radius * 0.2, radius * 0.17)
        g.fillCircle(centerX + radius * 0.15, centerY - radius * 0.2, radius * 0.17)
        g.fillStyle(0x000000, 1)
        g.fillCircle(centerX - radius * 0.08, centerY - radius * 0.2, radius * 0.09)
        g.fillCircle(centerX + radius * 0.17, centerY - radius * 0.2, radius * 0.09)
        // 腮红
        g.fillStyle(0xbfdbfe, 0.6)
        g.fillCircle(centerX - radius * 0.32, centerY - radius * 0.05, radius * 0.1)
      }

      const textureKey = `plant_${type}`
      if (scene.textures.exists(textureKey)) {
        scene.textures.remove(textureKey)
      }

      g.generateTexture(textureKey, textureSize, textureSize)

      const texture = scene.textures.get(textureKey)
      if (texture) {
        this.plantTextures.set(type, texture)
      }

      setTimeout(() => {
        g.destroy()
      }, 100)
    })
  }

  private createZombieTextures(scene: Phaser.Scene): void {
    const zombieTypes: ZombieType[] = ['normal', 'cone', 'bucket', 'imp']

    zombieTypes.forEach(type => {
      const size = Math.max(40, this.Adapt.cellSize * 0.8)
      const textureSize = Math.max(80, size * 2)

      const centerX = textureSize / 2
      const centerY = textureSize / 2
      const radius = size / 2

      const g = scene.make.graphics({ x: 0, y: 0, add: false })

      // 普通僵尸 - 绿色身体 + 棕色西装裤
      if (type === 'normal') {
        // 腿
        g.fillStyle(0x3f3f46, 1)
        g.fillRoundedRect(centerX - radius * 0.35, centerY + radius * 0.2, radius * 0.25, radius * 0.7, 6)
        g.fillRoundedRect(centerX + radius * 0.1, centerY + radius * 0.2, radius * 0.25, radius * 0.7, 6)
        // 身体（西装外套）
        g.fillStyle(0x4b5563, 1)
        g.fillRoundedRect(centerX - radius * 0.5, centerY - radius * 0.3, radius * 1, radius * 0.7, 12)
        // 衬衫
        g.fillStyle(0xf8fafc, 1)
        g.fillRoundedRect(centerX - radius * 0.15, centerY - radius * 0.25, radius * 0.3, radius * 0.5, 4)
        // 领带
        g.fillStyle(0xdc2626, 1)
        g.fillRoundedRect(centerX - radius * 0.08, centerY - radius * 0.2, radius * 0.16, radius * 0.4, 3)
        // 头
        g.fillStyle(0x84cc16, 1)
        g.fillCircle(centerX, centerY - radius * 0.45, radius * 0.5)
        // 头发
        g.fillStyle(0x1f2937, 1)
        g.fillEllipse(centerX, centerY - radius * 0.7, radius * 0.6, radius * 0.2)
        // 眼睛
        g.fillStyle(0xffffff, 1)
        g.fillCircle(centerX - radius * 0.15, centerY - radius * 0.5, radius * 0.12)
        g.fillCircle(centerX + radius * 0.15, centerY - radius * 0.5, radius * 0.12)
        g.fillStyle(0x000000, 1)
        g.fillCircle(centerX - radius * 0.13, centerY - radius * 0.5, radius * 0.06)
        g.fillCircle(centerX + radius * 0.17, centerY - radius * 0.5, radius * 0.06)
        // 嘴巴（吐舌头）
        g.fillStyle(0x7f1d1d, 1)
        g.fillEllipse(centerX, centerY - radius * 0.32, radius * 0.2, radius * 0.1)
        g.fillStyle(0xf87171, 1)
        g.fillEllipse(centerX, centerY - radius * 0.28, radius * 0.12, radius * 0.08)
      }
      // 路障僵尸 - 橙色锥形帽子
      else if (type === 'cone') {
        // 腿
        g.fillStyle(0x3f3f46, 1)
        g.fillRoundedRect(centerX - radius * 0.35, centerY + radius * 0.2, radius * 0.25, radius * 0.7, 6)
        g.fillRoundedRect(centerX + radius * 0.1, centerY + radius * 0.2, radius * 0.25, radius * 0.7, 6)
        // 身体
        g.fillStyle(0x4b5563, 1)
        g.fillRoundedRect(centerX - radius * 0.5, centerY - radius * 0.3, radius * 1, radius * 0.7, 12)
        g.fillStyle(0xf8fafc, 1)
        g.fillRoundedRect(centerX - radius * 0.15, centerY - radius * 0.25, radius * 0.3, radius * 0.5, 4)
        g.fillStyle(0xdc2626, 1)
        g.fillRoundedRect(centerX - radius * 0.08, centerY - radius * 0.2, radius * 0.16, radius * 0.4, 3)
        // 头
        g.fillStyle(0x84cc16, 1)
        g.fillCircle(centerX, centerY - radius * 0.45, radius * 0.5)
        // 橙色锥形帽子
        g.fillStyle(0xf97316, 1)
        g.fillTriangle(
          centerX - radius * 0.45, centerY - radius * 0.55,
          centerX + radius * 0.45, centerY - radius * 0.55,
          centerX, centerY - radius * 1.1
        )
        // 帽子条纹
        g.fillStyle(0x000000, 1)
        g.fillRect(centerX - radius * 0.35, centerY - radius * 0.65, radius * 0.7, radius * 0.08)
        g.fillRect(centerX - radius * 0.25, centerY - radius * 0.8, radius * 0.5, radius * 0.06)
        // 眼睛
        g.fillStyle(0xffffff, 1)
        g.fillCircle(centerX - radius * 0.15, centerY - radius * 0.5, radius * 0.12)
        g.fillCircle(centerX + radius * 0.15, centerY - radius * 0.5, radius * 0.12)
        g.fillStyle(0x000000, 1)
        g.fillCircle(centerX - radius * 0.13, centerY - radius * 0.5, radius * 0.06)
        g.fillCircle(centerX + radius * 0.17, centerY - radius * 0.5, radius * 0.06)
        // 嘴巴
        g.fillStyle(0x000000, 1)
        g.fillEllipse(centerX, centerY - radius * 0.32, radius * 0.15, radius * 0.08)
      }
      // 铁桶僵尸 - 灰色铁桶
      else if (type === 'bucket') {
        // 腿
        g.fillStyle(0x3f3f46, 1)
        g.fillRoundedRect(centerX - radius * 0.35, centerY + radius * 0.2, radius * 0.25, radius * 0.7, 6)
        g.fillRoundedRect(centerX + radius * 0.1, centerY + radius * 0.2, radius * 0.25, radius * 0.7, 6)
        // 身体
        g.fillStyle(0x4b5563, 1)
        g.fillRoundedRect(centerX - radius * 0.5, centerY - radius * 0.3, radius * 1, radius * 0.7, 12)
        g.fillStyle(0xf8fafc, 1)
        g.fillRoundedRect(centerX - radius * 0.15, centerY - radius * 0.25, radius * 0.3, radius * 0.5, 4)
        g.fillStyle(0xdc2626, 1)
        g.fillRoundedRect(centerX - radius * 0.08, centerY - radius * 0.2, radius * 0.16, radius * 0.4, 3)
        // 头
        g.fillStyle(0x84cc16, 1)
        g.fillCircle(centerX, centerY - radius * 0.45, radius * 0.5)
        // 铁桶帽子
        g.fillStyle(0x64748b, 1)
        g.fillRoundedRect(centerX - radius * 0.5, centerY - radius * 0.95, radius * 1, radius * 0.7, 8)
        g.fillStyle(0x475569, 1)
        g.fillRect(centerX - radius * 0.4, centerY - radius * 0.85, radius * 0.8, radius * 0.12)
        g.fillEllipse(centerX, centerY - radius * 0.6, radius * 0.7, radius * 0.15)
        // 眼睛
        g.fillStyle(0xffffff, 1)
        g.fillCircle(centerX - radius * 0.15, centerY - radius * 0.5, radius * 0.12)
        g.fillCircle(centerX + radius * 0.15, centerY - radius * 0.5, radius * 0.12)
        g.fillStyle(0x000000, 1)
        g.fillCircle(centerX - radius * 0.13, centerY - radius * 0.5, radius * 0.06)
        g.fillCircle(centerX + radius * 0.17, centerY - radius * 0.5, radius * 0.06)
        // 嘴巴
        g.fillStyle(0x000000, 1)
        g.fillEllipse(centerX, centerY - radius * 0.32, radius * 0.15, radius * 0.08)
      }
      // 小鬼僵尸 - 矮小可爱
      else if (type === 'imp') {
        // 腿（短）
        g.fillStyle(0x3f3f46, 1)
        g.fillRoundedRect(centerX - radius * 0.25, centerY + radius * 0.3, radius * 0.2, radius * 0.5, 4)
        g.fillRoundedRect(centerX + radius * 0.05, centerY + radius * 0.3, radius * 0.2, radius * 0.5, 4)
        // 身体
        g.fillStyle(0x4b5563, 1)
        g.fillRoundedRect(centerX - radius * 0.4, centerY - radius * 0.1, radius * 0.8, radius * 0.6, 10)
        // 头
        g.fillStyle(0xa3e635, 1)
        g.fillCircle(centerX, centerY - radius * 0.35, radius * 0.5)
        // 头发（几根）
        g.fillStyle(0x1f2937, 1)
        g.fillEllipse(centerX - radius * 0.1, centerY - radius * 0.7, radius * 0.15, radius * 0.08)
        g.fillEllipse(centerX + radius * 0.15, centerY - radius * 0.65, radius * 0.12, radius * 0.06)
        // 眼睛（更大更萌）
        g.fillStyle(0xffffff, 1)
        g.fillCircle(centerX - radius * 0.12, centerY - radius * 0.4, radius * 0.14)
        g.fillCircle(centerX + radius * 0.18, centerY - radius * 0.4, radius * 0.14)
        g.fillStyle(0x000000, 1)
        g.fillCircle(centerX - radius * 0.1, centerY - radius * 0.4, radius * 0.08)
        g.fillCircle(centerX + radius * 0.2, centerY - radius * 0.4, radius * 0.08)
        // 嘴巴
        g.fillStyle(0x7f1d1d, 1)
        g.fillEllipse(centerX, centerY - radius * 0.22, radius * 0.12, radius * 0.1)
      }

      const textureKey = `zombie_${type}`
      if (scene.textures.exists(textureKey)) {
        scene.textures.remove(textureKey)
      }

      g.generateTexture(textureKey, textureSize, textureSize)

      const texture = scene.textures.get(textureKey)
      if (texture) {
        this.zombieTextures.set(type, texture)
      }

      g.destroy()
    })
  }

  private update(time: number, delta: number): void {
    // Phaser 的 update 循环，用于动画等
  }

  // Emoji 映射 - 与游戏配置保持一致
  private plantEmojis: Record<PlantType, string> = {
    sunflower: '🌻',
    peashooter: '🌱',
    wallnut: '🥔',
    cherrybomb: '🍒',
    snowpea: '❄️'
  }

  private zombieEmojis: Record<ZombieType, string> = {
    normal: '🧟',
    cone: '🧟',
    bucket: '🧟',
    imp: '👶'
  }

  renderPlants(plants: Plant[]): void {
    if (!this.scene || !this.plantGroup) return

    this.plantGroup.clear(true, true)
    const offsetX = this.Adapt.gameAreaX
    const offsetY = this.Adapt.gameAreaY
    const cellSize = this.Adapt.cellSize

    plants.forEach(plant => {
      const x = offsetX + plant.col * cellSize + cellSize / 2
      const y = offsetY + plant.row * cellSize + cellSize / 2

      // 优先使用主题 Emoji，其次使用配置 Emoji，最后使用默认
      const emoji = this.themePlantEmojis[plant.type] || 
                    PLANT_ASSETS[plant.type as keyof typeof PLANT_ASSETS]?.emoji || 
                    this.plantEmojis[plant.type] || '🌱'
      const fontSize = Math.floor(cellSize * 0.7)

      const text = this.scene!.add.text(x, y, emoji, {
        fontSize: `${fontSize}px`,
        fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji'
      })
      text.setOrigin(0.5)
      text.setDepth(10)

      if (plant.health < plant.maxHealth * 0.5) {
        text.setAlpha(0.7)
      }

      this.plantGroup?.add(text)
    })
  }

  renderZombies(zombies: Zombie[]): void {
    if (!this.scene || !this.zombieGroup) return

    this.zombieGroup.clear(true, true)
    const offsetX = this.Adapt.gameAreaX
    const cellSize = this.Adapt.cellSize
    const offsetY = this.Adapt.gameAreaY

    zombies.forEach(zombie => {
      const x = offsetX + zombie.x + cellSize / 2
      const y = offsetY + zombie.row * cellSize + cellSize / 2

      // 优先使用主题 Emoji
      const emoji = this.themeZombieEmojis[zombie.type] || 
                    ZOMBIE_ASSETS[zombie.type as keyof typeof ZOMBIE_ASSETS]?.emoji || 
                    this.zombieEmojis[zombie.type] || '🧟'
      const fontSize = Math.floor(cellSize * 0.7)

      const text = this.scene!.add.text(x, y, emoji, {
        fontSize: `${fontSize}px`,
        fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji'
      })
      text.setOrigin(0.5)
      text.setFlipX(true)
      text.setDepth(10)

      if (zombie.isFrozen) {
        text.setTint(0x60a5fa)
      }

      if (zombie.health < zombie.maxHealth * 0.5) {
        text.setAlpha(0.7)
      }

      this.zombieGroup?.add(text)
    })
  }

  renderProjectiles(projectiles: Projectile[]): void {
    if (!this.scene || !this.projectileGroup) return

    this.projectileGroup.clear(true, true)
    const offsetX = this.Adapt.gameAreaX
    const cellSize = this.Adapt.cellSize
    const offsetY = this.Adapt.gameAreaY

    projectiles.forEach(proj => {
      const x = offsetX + proj.x
      const y = offsetY + proj.row * cellSize + cellSize / 2

      // 优先使用主题 Emoji
      const emoji = this.themeProjectileEmojis[proj.type] || 
                    PROJECTILE_ASSETS[proj.type as keyof typeof PROJECTILE_ASSETS]?.emoji || 
                    (proj.type === 'snowpea' ? '❄️' : '🟢')
      const text = this.scene!.add.text(x, y, emoji, {
        fontSize: `${cellSize * 0.4}px`
      }).setOrigin(0.5)

      this.projectileGroup?.add(text)
    })
  }

  renderSuns(suns: Sun[]): void {
    if (!this.scene || !this.sunGroup) return

    this.sunGroup.clear(true, true)
    const cellSize = this.Adapt.cellSize

    // 优先使用主题 Emoji
    const sunEmoji = this.themeSunEmoji || SUN_ASSETS.sun?.emoji || '☀️'

    suns.forEach(sun => {
      const x = sun.x
      const y = sun.y
      const size = cellSize * 0.6

      // 使用 Emoji 渲染阳光
      const text = this.scene!.add.text(x, y, sunEmoji, {
        fontSize: `${cellSize * 0.7}px`
      }).setOrigin(0.5)
      text.setDepth(100)

      // 添加点击交互区域
      const hitZone = this.scene!.add.zone(x, y, size * 1.5, size * 1.5)
      hitZone.setDepth(101)
      hitZone.setInteractive({ useHandCursor: true })

      // 绑定点击事件
      hitZone.on('pointerdown', () => {
        const pvzGame = (this.scene as any).pvzGame
        if (pvzGame && typeof pvzGame.collectSun === 'function') {
          pvzGame.collectSun(sun.id)
        }
      })

      this.sunGroup?.add(text)
      this.sunGroup?.add(hitZone)
    })
  }

  renderParticles(particles: Particle[]): void {
    if (!this.scene || !this.particles) return

    particles.forEach(p => {
      this.particles!.setPosition(p.x, p.y)
      this.particles!.setParticleTint(parseInt(p.color.replace('#', ''), 16))
      this.particles!.emitParticleAt(p.x, p.y)
    })
  }

  createExplosion(x: number, y: number, color: string): void {
    if (!this.scene || !this.particles) return
    
    const colorNum = parseInt(color.replace('#', ''), 16)
    
    this.particles.setPosition(x, y)
    this.particles.setParticleTint(colorNum)
    this.particles.explode(15)
  }

  shakeScreen(): void {
    if (!this.scene) return
    
    const flash = this.scene.add.rectangle(
      0, 0, 
      this.Adapt.screenW, 
      this.Adapt.screenH, 
      0xff0000,
      0.15
    ).setOrigin(0)
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 80,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    })
  }

  destroy(): void {
    if (this.game) {
      this.game.destroy(true)
      this.game = null
    }
    this.scene = null
    this.plantGroup = null
    this.zombieGroup = null
    this.projectileGroup = null
    this.sunGroup = null
    this.particles = null
    this.containerElement = null
  }

  private interpolateColor(color1: number, color2: number, ratio: number): number {
    const r1 = (color1 >> 16) & 0xff
    const g1 = (color1 >> 8) & 0xff
    const b1 = color1 & 0xff
    
    const r2 = (color2 >> 16) & 0xff
    const g2 = (color2 >> 8) & 0xff
    const b2 = color2 & 0xff
    
    const r = Math.round(r1 + (r2 - r1) * ratio)
    const g = Math.round(g1 + (g2 - g1) * ratio)
    const b = Math.round(b1 + (b2 - b1) * ratio)
    
    return (r << 16) | (g << 8) | b
  }

  getScene(): Phaser.Scene | null {
    return this.scene
  }

  getGameAreaBounds() {
    return {
      x: this.Adapt.gameAreaX,
      y: this.Adapt.gameAreaY,
      width: this.GRID_COLS * this.Adapt.cellSize,
      height: this.GRID_ROWS * this.Adapt.cellSize
    }
  }

  gridToWorld(row: number, col: number) {
    return {
      x: this.Adapt.gameAreaX + col * this.Adapt.cellSize + this.Adapt.cellSize / 2,
      y: this.Adapt.gameAreaY + row * this.Adapt.cellSize + this.Adapt.cellSize / 2
    }
  }
}
