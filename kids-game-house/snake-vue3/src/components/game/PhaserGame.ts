// Phaser 游戏引擎封装
// 注意：Phaser 通过 CDN 引入，使用全局变量
import type { SnakeSegment, Food, Difficulty } from '@/types/game'
import { FOOD_TYPES } from '@/types/game'
import { initUIParams, updateUIParams } from '@/utils/uiResponsive'
import { validateGTRSTheme, type GTRSTheme } from '@/utils/gtrs-validator'

// ⭐ 运行时主题对象：null 表示尚未加载，游戏启动前必须通过 loadTheme 赋值
// 可用 key 集合参见 src/config/GTRS.json（纯占位符，不可直接作为运行主题）
let GTRS: GTRSTheme | null = null

// Hex 颜色字符串转数字
function hexToNumber(hex: string): number {
  if (!hex) return 0x000000
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return 0x000000
  const num = parseInt(clean, 16)
  return isNaN(num) ? 0x000000 : num
}

/**
 * ⭐ 修复 GTRS 资源 src 路径
 * 规则：/public/xxx → /xxx（兼容旧格式），其余保持不变
 */
function normalizeSrcPaths(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(normalizeSrcPaths)
  const result: any = {}
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    if (key === 'src' && typeof value === 'string') {
      result[key] = value.startsWith('/public/') ? value.replace('/public/', '/') : value
    } else if (typeof value === 'object') {
      result[key] = normalizeSrcPaths(value)
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * ⭐ 将后端主题 JSON 赋值给 GTRS（直接替换，不兜底合并）
 * 必须在 Phaser 启动前完成调用，否则游戏将无法渲染
 */
function applyGTRS(theme: GTRSTheme): void {
  GTRS = normalizeSrcPaths(theme) as GTRSTheme
  console.log('[GTRS] ✅ 主题已加载:', GTRS.themeInfo?.themeName)
}

/**
 * ⭐ 断言 GTRS 已加载，否则抛出错误（开发期快速定位问题）
 */
function assertGTRS(): GTRSTheme {
  if (!GTRS) {
    throw new Error('[GTRS] 主题未加载！请先调用 loadTheme() 获取主题后再启动游戏。')
  }
  return GTRS
}

/**
 * 使用 Phaser Scale Manager FIT 模式实现通用屏幕适配
 * 等比缩放，无拉伸、不变形，自动居中
 */
export class SnakePhaserGame {
  private config: Phaser.Types.Core.GameConfig
  private game: Phaser.Game | null = null
  private scene: Phaser.Scene | null = null

  // 👉 唯一设计基准（美术作图标准，不代表画布大小）
  private readonly DESIGN_WIDTH = 720   // 设计宽度
  private readonly DESIGN_HEIGHT = 1280 // 设计高度（竖屏基准）
  
  // 👉 游戏网格配置（32 列 × 18 行，横屏玩法）
  private readonly GRID_COLS = 32
  private readonly GRID_ROWS = 18
  
  // 👉 全局适配参数（游戏加载时自动计算）
  private Adapt = {
    screenW: 0,    // 设备真实宽度
    screenH: 0,    // 设备真实高度
    scale: 1,      // 全局动态缩放比（核心）
    safeTop: 0,    // 顶部安全区（避开刘海）
    safeBottom: 0, // 底部安全区（避开手势条）
    cellSize: 0,   // 动态单元格大小（自动计算）
    gameAreaX: 0,  // 游戏区域左上角 X 坐标
    gameAreaY: 0   // 游戏区域左上角 Y 坐标
  }

  // 游戏对象
  private snakeGroup: Phaser.GameObjects.Group | null = null
  private foodSprite: Phaser.GameObjects.Graphics | null = null
  private obstacleGroup: Phaser.GameObjects.Group | null = null  // 障碍物群组
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null

  // 音频对象（使用 HTML5 Audio，更可靠）
  private bgmMainAudio: HTMLAudioElement | null = null
  private bgmGameplayAudio: HTMLAudioElement | null = null
  private bgmGameoverAudio: HTMLAudioElement | null = null
  private soundEnabled: boolean = true

  // 回调
  private onGameComplete?: () => void

  // 容器元素引用
  private containerElement: HTMLElement | null = null

  constructor(element: HTMLElement, onGameComplete?: () => void) {
    this.onGameComplete = onGameComplete
    this.containerElement = element

    console.log('📐 游戏设计基准:', {
      designSize: `${this.DESIGN_WIDTH} × ${this.DESIGN_HEIGHT}`,
      gridConfig: `${this.GRID_COLS}列 × ${this.GRID_ROWS}行`
    })

    // 👉 RESIZE 模式：响应式画布，自动适配所有设备
    // 使用闭包保存 self 引用，以便在场景方法中访问 SnakePhaserGame 实例
    const self = this
    
    this.config = {
      type: Phaser.AUTO,
      scale: {
        mode: Phaser.Scale.RESIZE,        // 🔥 响应式（商业项目标准）
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
      },
      parent: element,
      backgroundColor: '#1a1a2e',
      scene: {
        preload() {
          // ⭐ 这里的 this 是 Phaser.Scene，self 是 SnakePhaserGame 实例
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

  /**
   * 启动游戏
   * @throws Error 未提供 themeId 或主题加载失败时
   */
  async start(difficulty: Difficulty, themeId?: string): Promise<void> {
    if (this.game) {
      this.game.destroy(true)
    }

    if (!themeId) {
      throw new Error('[PhaserGame] 必须提供 themeId 才能启动游戏。请先从主题列表选择一个主题。')
    }

    const url = new URL(window.location.href)
    url.searchParams.set('theme_id', themeId)
    window.history.replaceState({}, '', url.toString())

    // 主题加载失败时直接向上抛出，由调用方（Vue 组件）处理 UI 提示
    await this.loadTheme(themeId)

    this.game = new Phaser.Game(this.config)
  }

  /**
   * ⭐ 从后端加载主题并赋值 GTRS（含严格 GTRS 校验）
   *
   * 流程：
   *   1. 请求 /api/theme/download?id=xxx
   *   2. 从响应中提取 configJson（支持多种格式）
   *   3. validateGTRSTheme() 严格校验
   *   4. 校验通过 → applyGTRS 直接赋值
   *   5. 任何环节失败 → 直接 throw（不静默降级）
   *
   * @throws Error 主题未登录 / 加载失败 / GTRS 校验不通过时
   */
  private async loadTheme(themeId: string): Promise<void> {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('[PhaserGame] 用户未登录，无法加载主题。请先登录后再启动游戏。')
    }

    const response = await fetch(`http://localhost:8080/api/theme/download?id=${themeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) {
      throw new Error(`[PhaserGame] 主题加载失败：HTTP ${response.status}`)
    }

    const result = await response.json()
    if (result.code !== 200 || !result.data) {
      throw new Error(`[PhaserGame] 主题加载失败：服务端 code=${result.code}, message=${result.message}`)
    }

    // ⭐ 提取 configJson（支持后端多种包装格式）
    const raw = result.data
    let configJsonStr: string

    if (typeof raw === 'string') {
      configJsonStr = raw
    } else if (raw.configJson !== undefined) {
      configJsonStr = typeof raw.configJson === 'string'
        ? raw.configJson
        : JSON.stringify(raw.configJson)
    } else {
      configJsonStr = JSON.stringify(raw)
    }

    // ⭐ GTRS 严格校验
    const validationResult = validateGTRSTheme(configJsonStr)
    if (!validationResult.valid) {
      throw new Error(
        `[PhaserGame] 主题 ${themeId} GTRS 校验失败，游戏无法启动：\n${validationResult.message}`
      )
    }

    // 校验通过，直接赋值（不兜底合并）
    const themeConfig: GTRSTheme = JSON.parse(configJsonStr)
    applyGTRS(themeConfig)
    console.log(`[PhaserGame] ✅ GTRS 主题已加载: ${GTRS!.themeInfo.themeName} (id=${themeId})`)
  }

  /**
   * 预加载阶段 - ⭐ 核心：自动计算最佳适配参数
   */
  private preload(scene: Phaser.Scene): void {
    // 保存场景引用
    this.scene = scene

    if (!this.containerElement) {
      console.warn('⚠️ 容器元素未设置')
      return
    }

    console.log('🔍 开始计算适配参数...')
    console.log('📦 容器元素尺寸:', {
      clientWidth: this.containerElement.clientWidth,
      clientHeight: this.containerElement.clientHeight,
      offsetWidth: this.containerElement.offsetWidth,
      offsetHeight: this.containerElement.offsetHeight
    })

    // 1. 从 DOM 元素获取真实屏幕尺寸（更可靠）
    this.Adapt.screenW = this.containerElement.clientWidth
    this.Adapt.screenH = this.containerElement.clientHeight

    console.log('📏 设备真实尺寸:', `${this.Adapt.screenW} × ${this.Adapt.screenH}`)
    console.log('🎨 当前主题:', assertGTRS().themeInfo.themeName)

    // ⭐ 添加资源加载进度监听
    const totalResourcesToLoad = this.countResourcesToLoad()
    let loadedResources = 0

    scene.load.on('filecomplete', () => {
      loadedResources++
      const progress = (loadedResources / totalResourcesToLoad) * 100
      console.log(`📥 资源加载进度：${loadedResources}/${totalResourcesToLoad} (${progress.toFixed(1)}%)`)
    })

    scene.load.on('complete', () => {
      console.log('✅ 所有资源加载完成')
    })

    scene.load.on('error', (key: string, type: string, message: string) => {
      console.warn(`⚠️ 资源加载失败：${key} (${type}) - ${message}`)
    })

    // 2. 加载 GTRS 中配置的所有图片资源
    this.loadGTRSImages(scene)

    // 3. 计算最佳缩放比（自动匹配屏幕，不变形）
    this.Adapt.scale = Math.min(
      this.Adapt.screenW / this.DESIGN_WIDTH,
      this.Adapt.screenH / this.DESIGN_HEIGHT
    )

    // 3. 计算安全区域（手机刘海/底部手势条）
    this.Adapt.safeTop = Math.max(44, this.Adapt.screenH * 0.05)
    this.Adapt.safeBottom = Math.max(34, this.Adapt.screenH * 0.08)

    // 4. 计算动态单元格大小（保证游戏区域完全显示）
    const baseCellSize = 50  // 基础单元格大小
    const gameAreaWidth = this.GRID_COLS * baseCellSize  // 1600
    const gameAreaHeight = this.GRID_ROWS * baseCellSize // 900
    
    // 可用空间（减去安全区域和边距）
    const availableWidth = (this.Adapt.screenW - 20) * 0.95  // 留 5% 边距
    const availableHeight = (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom) * 0.9
    
    console.log('📐 可用空间:', {
      width: availableWidth.toFixed(0),
      height: availableHeight.toFixed(0)
    })
    
    const scaleByWidth = availableWidth / gameAreaWidth
    const scaleByHeight = availableHeight / gameAreaHeight
    
    console.log('🔢 缩放系数:', {
      byWidth: scaleByWidth.toFixed(3),
      byHeight: scaleByHeight.toFixed(3)
    })
    
    const finalScale = Math.min(scaleByWidth, scaleByHeight, 1.5)  // 最大放大 1.5 倍
    this.Adapt.cellSize = baseCellSize * finalScale
    
    const actualGameWidth = this.GRID_COLS * this.Adapt.cellSize
    const actualGameHeight = this.GRID_ROWS * this.Adapt.cellSize
    
    console.log('🎯 最终游戏区域:', {
      cellSize: this.Adapt.cellSize.toFixed(2),
      size: `${actualGameWidth.toFixed(0)} × ${actualGameHeight.toFixed(0)}`,
      fitsInScreen: actualGameWidth <= this.Adapt.screenW && actualGameHeight <= (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom)
    })

    console.log('✅ 自动计算适配参数完成', {
      screen: `${this.Adapt.screenW} × ${this.Adapt.screenH}`,
      scale: this.Adapt.scale.toFixed(3),
      safeArea: `top=${this.Adapt.safeTop.toFixed(0)}, bottom=${this.Adapt.safeBottom.toFixed(0)}`,
      cellSize: this.Adapt.cellSize.toFixed(2),
      gameArea: `${actualGameWidth.toFixed(0)} × ${actualGameHeight.toFixed(0)}`
    })
    
    // ⭐ 初始化 UI 参数（基于屏幕尺寸独立计算，不依赖 cellSize）
    initUIParams(this.Adapt.screenW, this.Adapt.screenH)
    
    // 输出详细的游戏参数（用于调试）
    console.log('🎮 游戏显示参数:', {
      gridCols: this.GRID_COLS,
      gridRows: this.GRID_ROWS,
      cellSize: this.Adapt.cellSize.toFixed(2),
      gameAreaSize: `${actualGameWidth.toFixed(0)} × ${actualGameHeight.toFixed(0)}`,
      offset: `x=${((this.Adapt.screenW - actualGameWidth) / 2).toFixed(1)}, y=${(this.Adapt.safeTop + (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom - actualGameHeight) / 2).toFixed(1)}`
    })
  }

  /**
   * 创建游戏场景 - ⭐ 监听屏幕尺寸变化，自动重绘适配
   */
  private create(scene: Phaser.Scene): void {
    // 保存场景引用
    this.scene = scene

    console.log('📏 画布初始尺寸:', {
      width: scene.scale.width,
      height: scene.scale.height
    })
    
    // ⭐ 重要：使用 Phaser 画布的实际尺寸更新 Adapt，确保后续绘制正确
    this.Adapt.screenW = scene.scale.width
    this.Adapt.screenH = scene.scale.height
    
    console.log('🔄 更新适配尺寸:', {
      screenW: this.Adapt.screenW.toFixed(2),
      screenH: this.Adapt.screenH.toFixed(2)
    })

    // ⭐ 核心：监听屏幕尺寸变化（窗口调整、旋转等）
    scene.scale.on('resize', this.handleResize, this)

    // ⭐ 统一创建所有游戏元素（商业方案：方便 resize 时重建）
    this.createAllGameElements(scene)
  }

  /**
   * ⭐ 屏幕尺寸变化回调 - 商业级核心适配函数
   * 屏幕变化 → 重新计算 → 重建所有元素
   */
  private handleResize(gameSize: Phaser.Structs.Size): void {
    console.log('🔄 屏幕尺寸变化:', {
      oldSize: `${this.Adapt.screenW.toFixed(0)} × ${this.Adapt.screenH.toFixed(0)}`,
      newSize: `${gameSize.width.toFixed(0)} × ${gameSize.height.toFixed(0)}`
    })

    // 1. 更新屏幕尺寸
    this.Adapt.screenW = gameSize.width
    this.Adapt.screenH = gameSize.height

    // 3. 计算安全区域（复用 preload 中的逻辑）
    this.Adapt.safeTop = Math.max(44, this.Adapt.screenH * 0.05)  // 保持与 preload 一致
    this.Adapt.safeBottom = Math.max(34, this.Adapt.screenH * 0.08)
    this.recalculateAdaptParams()

    // 3. 重建所有游戏元素
    if (this.scene) {
      this.createAllGameElements(this.scene)
    }
    
    console.log('✅ 屏幕适配完成')
  }

  /**
   * ⭐ 统一创建所有游戏元素（商业方案：方便 resize 时重建）
   */
  private createAllGameElements(scene: Phaser.Scene): void {
    // 清空旧元素（防止 resize 时重叠）
    if (this.snakeGroup) {
      this.snakeGroup.clear(true, true)
    }
    if (this.foodSprite) {
      this.foodSprite.destroy()
    }
    if (this.obstacleGroup) {
      this.obstacleGroup.clear(true, true)
    }
    if (this.particles) {
      this.particles.destroy()
    }

    // 1. 创建渐变背景和网格
    this.createBackground(scene)
    this.createGrid(scene)

    // 2. 创建蛇群组
    this.snakeGroup = scene.add.group()

    // 2.5 创建障碍物群组
    this.obstacleGroup = scene.add.group()

    // 3. 创建粒子管理器（带动态缩放）
    const particleScale = this.Adapt.cellSize / 50
    this.particles = scene.add.particles(0, 0, 'particle', {
      speed: { min: 50 * particleScale, max: 150 * particleScale },
      scale: { start: 0.5 * particleScale, end: 0 },
      lifespan: 500,
      blendMode: 'ADD',
      emitting: false
    })

    // 4. 创建粒子纹理
    this.createParticleTexture(scene)
  }

  /**
   * ⭐ 重新计算适配参数（resize 时调用）
   */
  private recalculateAdaptParams(): void {
    // 使用当前画布尺寸重新计算
    const baseCellSize = 50
    const gameAreaWidth = this.GRID_COLS * baseCellSize
    const gameAreaHeight = this.GRID_ROWS * baseCellSize
    
    // 可用空间（减去安全区域和边距）
    const availableWidth = (this.Adapt.screenW - 20) * 0.95
    const availableHeight = (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom) * 0.9
    
    const scaleByWidth = availableWidth / gameAreaWidth
    const scaleByHeight = availableHeight / gameAreaHeight
    
    const finalScale = Math.min(scaleByWidth, scaleByHeight, 1.5)
    this.Adapt.cellSize = baseCellSize * finalScale
    
    // ⭐ 更新 UI 参数（resize 时基于新屏幕尺寸重新计算）
    updateUIParams(this.Adapt.screenW, this.Adapt.screenH)
    
    console.log('🔢 重新计算适配参数:', {
      cellSize: this.Adapt.cellSize.toFixed(2),
      gameArea: `${(this.GRID_COLS * this.Adapt.cellSize).toFixed(0)} × ${(this.GRID_ROWS * this.Adapt.cellSize).toFixed(0)}`
    })
  }
  private createBackground(scene: Phaser.Scene): void {
    const graphics = scene.add.graphics()

    // ⭐ 直接使用 GTRS 规范 key：scene_bg_main / scene_bg_grid
    const bgKey = this.getThemeAssetKey('scene_bg_main')
    if (bgKey) {
      // 使用 GTRS 背景图片
      const bgImage = scene.add.image(
        this.Adapt.screenW / 2,
        this.Adapt.screenH / 2,
        bgKey
      )
      bgImage.setDisplaySize(this.Adapt.screenW, this.Adapt.screenH)
      bgImage.setDepth(-1)
    } else {
      // 默认全屏渐变背景 - 使用 GTRS 背景色
      const bgColor = assertGTRS().globalStyle.bgColor || '#1a1a2e'
      const baseColor = hexToNumber(bgColor)
      graphics.fillStyle(baseColor, 1)
      graphics.fillRect(0, 0, this.Adapt.screenW, this.Adapt.screenH)
    }

    // 计算游戏区域尺寸和偏移（居中显示）
    const gameWidth = this.GRID_COLS * this.Adapt.cellSize
    const gameHeight = this.GRID_ROWS * this.Adapt.cellSize
    const offsetX = (this.Adapt.screenW - gameWidth) / 2
    const offsetY = this.Adapt.safeTop + (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom - gameHeight) / 2

    console.log('🖼️ 游戏区域:', {
      offset: `(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`,
      size: `${gameWidth.toFixed(0)} × ${gameHeight.toFixed(0)}`,
      cellSize: this.Adapt.cellSize.toFixed(2)
    })

    // ⭐ 直接使用 GTRS 规范 key：scene_bg_grid
    const gridBgKey = this.getThemeAssetKey('scene_bg_grid')
    if (gridBgKey) {
      // 使用网格背景图片
      const gridBg = scene.add.image(
        offsetX + gameWidth / 2,
        offsetY + gameHeight / 2,
        gridBgKey
      )
      gridBg.setDisplaySize(gameWidth, gameHeight)
      gridBg.setDepth(0)
    } else {
      // 绘制游戏区域边框 - 线条粗细按 cellSize 比例
      const borderWidth = Math.max(2, this.Adapt.cellSize * 0.06)
      graphics.lineStyle(borderWidth, 0x4ade80, 0.8)
      graphics.strokeRect(offsetX + borderWidth / 2, offsetY + borderWidth / 2, gameWidth - borderWidth, gameHeight - borderWidth)

      // 填充游戏区域背景
      const bgColor = this.themeColors.bg
      graphics.fillStyle(bgColor, 0.8)
      graphics.fillRect(offsetX, offsetY, gameWidth, gameHeight)
    }
  }

  /**
   * 创建网格线 - ⭐ 线条粗细按 cellSize 比例
   */
  private createGrid(scene: Phaser.Scene): void {
    const graphics = scene.add.graphics()
    // 网格线粗细 = cellSize 的 3%，最小 1px
    const lineWidth = Math.max(1, this.Adapt.cellSize * 0.03)
    graphics.lineStyle(lineWidth, 0xffffff, 0.05)

    // 计算游戏区域位置和尺寸
    const gameWidth = this.GRID_COLS * this.Adapt.cellSize
    const gameHeight = this.GRID_ROWS * this.Adapt.cellSize
    const offsetX = (this.Adapt.screenW - gameWidth) / 2
    const offsetY = this.Adapt.safeTop + (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom - gameHeight) / 2

    // 绘制内部网格线（不画最外圈）
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

  /**
   * 创建粒子纹理 - ⭐ 根据 cellSize 动态生成
   */
  private createParticleTexture(scene: Phaser.Scene): void {
    // 根据 cellSize 动态计算粒子大小
    const particleSize = Math.max(4, this.Adapt.cellSize * 0.15)
    const textureSize = particleSize * 2
    
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false })
    graphics.fillStyle(0xffffff, 1)
    graphics.fillCircle(particleSize, particleSize, particleSize)
    graphics.generateTexture('particle', textureSize, textureSize)
    
    console.log('✨ 粒子纹理:', {
      size: textureSize.toFixed(1),
      cellSize: this.Adapt.cellSize.toFixed(2)
    })
  }

  /**
   * 更新游戏画面
   */
  update(time: number, delta: number): void {
    // Phaser 的 update 循环，用于动画等
  }

  /**
   * 渲染蛇
   */
  renderSnake(snake: SnakeSegment[]): void {
    if (!this.scene || !this.snakeGroup) return

    const scene = this.scene
    const group = this.snakeGroup
    const cellSize = this.Adapt.cellSize

    // 计算游戏区域偏移
    const gameWidth = this.GRID_COLS * cellSize
    const gameHeight = this.GRID_ROWS * cellSize
    const offsetX = (this.Adapt.screenW - gameWidth) / 2
    const offsetY = this.Adapt.safeTop + (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom - gameHeight) / 2

    // 清除旧的蛇
    group.clear(true, true)

    // 绘制蛇身
    snake.forEach((segment, index) => {
      const x = offsetX + segment.x * cellSize + cellSize / 2
      const y = offsetY + segment.y * cellSize + cellSize / 2
      // 蛇身大小 = cellSize 的 90%，留出间隙
      const size = cellSize * 0.9

      if (index === 0) {
        // 蛇头 - 直接使用 GTRS key "snake_head"
        const headKey = this.getThemeAssetKey('snake_head')
        if (headKey) {
          const sprite = scene.add.image(x, y, headKey)
          const displaySize = Math.max(size, 16)
          sprite.setDisplaySize(displaySize, displaySize)
          group.add(sprite)
        } else {
          this.createSnakeHead(scene, x, y, size)
        }
      } else if (index === snake.length - 1) {
        // 蛇尾 - 直接使用 GTRS key "snake_tail"
        const tailKey = this.getThemeAssetKey('snake_tail')
        if (tailKey) {
          const sprite = scene.add.image(x, y, tailKey)
          const displaySize = Math.max(size * 0.8, 16)
          sprite.setDisplaySize(displaySize, displaySize)
          group.add(sprite)
        } else {
          // 蛇尾 - 渐变透明效果
          const alpha = 1 - (index / snake.length) * 0.5
          const color = this.themeColors.snakeBody
          const circle = scene.add.circle(x, y, size / 2 * 0.9, color, alpha)
          group.add(circle)
        }
      } else {
        // 蛇身 - 直接使用 GTRS key "snake_body"
        const bodyKey = this.getThemeAssetKey('snake_body')
        if (bodyKey) {
          const sprite = scene.add.image(x, y, bodyKey)
          const displaySize = Math.max(size * 0.9, 16)
          sprite.setDisplaySize(displaySize, displaySize)
          group.add(sprite)
        } else {
          // 蛇身 - 渐变透明效果
          const alpha = 1 - (index / snake.length) * 0.5
          const color = this.themeColors.snakeBody
          const circle = scene.add.circle(x, y, size / 2, color, alpha)
          group.add(circle)
        }
      }
    })
  }

  /**
   * 创建蛇头 - ⭐ 所有元素按比例缩放
   */
  private createSnakeHead(scene: Phaser.Scene, x: number, y: number, size: number): void {
    const graphics = scene.add.graphics()
    
    // 头部圆形
    graphics.fillStyle(0x22c55e, 1)
    graphics.fillCircle(x, y, size / 2)
    
    // 眼睛 - 按头部大小比例
    const eyeSize = size * 0.18  // 眼睛占头部 18%
    const eyeOffset = size * 0.25  // 眼睛间距 25%
    graphics.fillStyle(0xffffff, 1)
    graphics.fillCircle(x - eyeOffset, y - eyeOffset * 0.3, eyeSize)
    graphics.fillCircle(x + eyeOffset, y - eyeOffset * 0.3, eyeSize)
    
    // 瞳孔 - 按眼睛比例
    graphics.fillStyle(0x000000, 1)
    graphics.fillCircle(x - eyeOffset, y - eyeOffset * 0.3, eyeSize * 0.5)
    graphics.fillCircle(x + eyeOffset, y - eyeOffset * 0.3, eyeSize * 0.5)
    
    // 舌头 - 按头部比例
    const tongueWidth = size * 0.3
    graphics.lineStyle(size * 0.08, 0xef4444, 1)
    graphics.moveTo(x + size * 0.3, y)
    graphics.lineTo(x + size * 0.5, y)
    
    // 将图形添加到群组并保存引用以便后续清理
    this.snakeGroup?.add(graphics)
  }

  /**
   * 渲染食物 - ⭐ 所有元素按比例缩放
   */
  renderFood(food: Food | null): void {
    if (!this.scene || !food) {
      this.foodSprite?.destroy()
      this.foodSprite = null
      return
    }

    const scene = this.scene
    const cellSize = this.Adapt.cellSize

    // 计算游戏区域偏移
    const gameWidth = this.GRID_COLS * cellSize
    const gameHeight = this.GRID_ROWS * cellSize
    const offsetX = (this.Adapt.screenW - gameWidth) / 2
    const offsetY = this.Adapt.safeTop + (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom - gameHeight) / 2

    const x = offsetX + food.position.x * cellSize + cellSize / 2
    const y = offsetY + food.position.y * cellSize + cellSize / 2
    // 食物主体大小 = cellSize 的 70%
    const baseSize = cellSize * 0.7

    if (this.foodSprite) {
      this.foodSprite.destroy()
    }

    // ⭐ 直接使用 GTRS 食物类型 key：food.type → GTRS key
    const foodKey = this.getThemeAssetKey('food', food.type)
    if (foodKey) {
      // 使用主题食物资源
      const sprite = scene.add.image(x, y, foodKey)
      const displaySize = Math.max(baseSize, 16)
      sprite.setDisplaySize(displaySize, displaySize)

      // 添加动画效果（轻微缩放）
      scene.tweens.add({
        targets: sprite,
        scaleX: displaySize * 1.1 / displaySize,
        scaleY: displaySize * 1.1 / displaySize,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      this.foodSprite = sprite
      return
    }

    // 默认绘制（程序化生成，仅当主题未提供食物图片时）
    const config = FOOD_TYPES[food.type]
    const color = this.themeColors.food

    // 创建食物图形
    const graphics = scene.add.graphics()

    // 发光效果 - 按 baseSize 比例
    graphics.fillStyle(color, 0.3)
    graphics.fillCircle(x, y, baseSize)

    // 主体
    graphics.fillStyle(color, 1)

    if (food.type === 'apple') {
      // 苹果
      graphics.fillCircle(x, y, baseSize * 0.5)
      // 梗 - 按比例缩放
      const stemLength = baseSize * 0.3
      graphics.lineStyle(baseSize * 0.12, 0x8b4513, 1)
      graphics.moveTo(x, y - baseSize * 0.5)
      graphics.lineTo(x, y - baseSize * 0.5 - stemLength)
    } else if (food.type === 'banana') {
      // 香蕉 - 简单表示为椭圆形
      graphics.fillStyle(0xfbbf24, 1)
      graphics.fillEllipse(x, y, baseSize * 0.8, baseSize * 0.5)
    } else if (food.type === 'cherry') {
      // 樱桃 - 两个圆形
      graphics.fillStyle(0xef4444, 1)
      graphics.fillCircle(x - baseSize * 0.2, y, baseSize * 0.3)
      graphics.fillCircle(x + baseSize * 0.2, y, baseSize * 0.3)
      // 梗
      graphics.lineStyle(baseSize * 0.08, 0x22c55e, 1)
      graphics.moveTo(x, y - baseSize * 0.3)
      graphics.lineTo(x, y - baseSize * 0.6)
    } else {
      // 金币
      graphics.fillCircle(x, y, baseSize * 0.5)
      // 外圈 - 按比例
      graphics.lineStyle(baseSize * 0.1, 0xffffff, 0.5)
      graphics.strokeCircle(x, y, baseSize * 0.5 - baseSize * 0.08)
      // 金色中心点
      graphics.fillStyle(0xffffff, 0.8)
      graphics.fillCircle(x, y, baseSize * 0.2)
    }

    this.foodSprite = graphics
  }

  /**
   * 渲染障碍物 - ⭐ 使用 GTRS 资源或默认绘制
   */
  renderObstacles(obstacles: Position[]): void {
    if (!this.scene || !this.obstacleGroup) return

    const scene = this.scene
    const group = this.obstacleGroup
    const cellSize = this.Adapt.cellSize

    // 计算游戏区域偏移
    const gameWidth = this.GRID_COLS * cellSize
    const gameHeight = this.GRID_ROWS * cellSize
    const offsetX = (this.Adapt.screenW - gameWidth) / 2
    const offsetY = this.Adapt.safeTop + (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom - gameHeight) / 2

    // 清除旧的障碍物
    group.clear(true, true)

    // 渲染每个障碍物
    obstacles.forEach((obstacle) => {
      const x = offsetX + obstacle.x * cellSize + cellSize / 2
      const y = offsetY + obstacle.y * cellSize + cellSize / 2
      // 障碍物大小 = cellSize 的 95%，几乎填满格子
      const size = cellSize * 0.95

      // ⭐ 直接使用 GTRS 规范 key：obstacle_rock / obstacle_wall
      const rockKey = this.getThemeAssetKey('obstacle_rock')
      const wallKey = this.getThemeAssetKey('obstacle_wall')

      if (rockKey) {
        // 使用石头资源
        const sprite = scene.add.image(x, y, rockKey)
        const displaySize = Math.max(size, 16)
        sprite.setDisplaySize(displaySize, displaySize)
        group.add(sprite)
      } else if (wallKey) {
        // 使用墙壁资源
        const sprite = scene.add.image(x, y, wallKey)
        const displaySize = Math.max(size, 16)
        sprite.setDisplaySize(displaySize, displaySize)
        group.add(sprite)
      } else {
        // 默认绘制：灰色石块
        const graphics = scene.add.graphics()
        graphics.fillStyle(0x6b7280, 1)  // 灰色
        graphics.fillRect(
          x - size / 2,
          y - size / 2,
          size,
          size
        )
        // 添加边框
        graphics.lineStyle(Math.max(1, cellSize * 0.04), 0x4b5563, 1)
        graphics.strokeRect(
          x - size / 2,
          y - size / 2,
          size,
          size
        )
        group.add(graphics)
      }
    })
  }

  /**
   * 创建粒子爆炸效果 - ⭐ 精简粒子，避免视觉干扰
   */
  createExplosion(x: number, y: number, color: string): void {
    if (!this.scene || !this.particles) return
    
    const colorNum = this.hexStringToNumber(color)
    const cellSize = this.Adapt.cellSize
    
    // 计算游戏区域偏移
    const gameWidth = this.GRID_COLS * cellSize
    const gameHeight = this.GRID_ROWS * cellSize
    const offsetX = (this.Adapt.screenW - gameWidth) / 2
    const offsetY = this.Adapt.safeTop + (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom - gameHeight) / 2
    
    // 极少量粒子，仅作提示
    const particleCount = 5  // 固定 5 个粒子，不再动态计算
    
    this.particles.setPosition(
      offsetX + x * cellSize + cellSize / 2,
      offsetY + y * cellSize + cellSize / 2
    )
    this.particles.setParticleTint(colorNum)
    this.particles.explode(particleCount)
  }

  /**
   * 屏幕震动效果 - ⭐ 仅使用闪屏，不用相机震动
   */
  shakeScreen(): void {
    if (!this.scene) return
    
    // 只使用闪屏效果（避免任何可能的重影或画面问题）
    const flash = this.scene.add.rectangle(
      0, 0, 
      this.Adapt.screenW, 
      this.Adapt.screenH, 
      0xff0000,     // 红色闪光，更符合撞墙受伤的感觉
      0.15          // 15% 透明度，更柔和
    ).setOrigin(0)
    
    // 快速淡出
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 80,   // 0.08 秒，非常快
      ease: 'Power2',
      onComplete: () => flash.destroy()
    })
  }

  /**
   * 清理资源
   */
  destroy(): void {
    // 停止所有音频
    this.stopAllBgm()
    
    if (this.game) {
      this.game.destroy(true)
      this.game = null
    }
    this.scene = null
    this.snakeGroup = null
    this.foodSprite = null
    this.particles = null
    this.containerElement = null
    this.bgmMainAudio = null
    this.bgmGameplayAudio = null
    this.bgmGameoverAudio = null
  }

  /**
   * 工具函数：颜色插值
   */
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

  /**
   * 工具函数：十六进制字符串转数字
   */
  private hexStringToNumber = hexToNumber

  // ========== GTRS 资源加载 ==========

  /**
   * 统计需要加载的资源数量
   */
  private countResourcesToLoad(): number {
    let count = 0
    const gtrs = assertGTRS()
    const images = gtrs.resources?.images
    const audio = gtrs.resources?.audio

    // 统计 scene 图片
    if (images?.scene) {
      count += Object.keys(images.scene).length
    }

    // 统计音频（仅计 bgm + effect，不计 voice）
    if (audio?.bgm) {
      count += Object.keys(audio.bgm).length
    }
    if (audio?.effect) {
      count += Object.keys(audio.effect).length
    }

    console.log(`📊 待加载资源总数：${count}`)
    return count
  }

  /**
   * ⭐ 加载 GTRS resources.images.scene 中的全部图片
   *
   * Phaser key = GTRS scene key（例如 "snake_head"、"food_apple"）
   * 确保 key 与 GTRS JSON 完全一致，游戏渲染时直接通过 GTRS key 取图
   */
  private loadGTRSImages(scene: Phaser.Scene): void {
    const sceneImages = assertGTRS().resources?.images?.scene
    if (!sceneImages) {
      console.warn('[GTRS] ⚠️ resources.images.scene 不存在，跳过图片加载')
      return
    }

    for (const [key, resource] of Object.entries(sceneImages)) {
      if (resource?.src) {
        scene.load.image(key, resource.src)
        console.log(`[GTRS] 📷 加载场景图片: ${key} (${resource.alias}) -> ${resource.src}`)
      } else {
        console.warn(`[GTRS] ⚠️ 场景图片 ${key} 无效（src 为空），跳过`)
      }
    }
  }

  /**
   * ⭐ 获取 GTRS resources.images.scene 中指定 key 的资源 key
   *
   * 规则（优先级从高到低）：
   *   1. 直接 key 命中（GTRS 标准 key，如 "snake_head"）
   *   2. 食物类型 -> GTRS key 映射（处理 food.type 差异）
   *   3. 语义别名 -> GTRS key 映射（向后兼容）
   *
   * @param gtrsKey  GTRS 规范 key 或语义别名
   * @param foodType 可选，食物类型（"apple" / "banana" / "cherry" / "coin"）
   * @returns Phaser 加载时使用的 key，若资源不存在则返回 undefined
   */
  private getThemeAssetKey(gtrsKey: string, foodType?: string): string | undefined {
    const sceneImages = assertGTRS().resources?.images?.scene
    if (!sceneImages) return undefined

    // ── 1. 食物类型映射（根据 food.type 找对应的 GTRS key）
    if (gtrsKey === 'food' && foodType) {
      const foodTypeToGTRSKey: Record<string, string> = {
        apple:      'food_apple',
        banana:     'food_banana',
        cherry:     'food_cherry',
        strawberry: 'food_cherry',  // strawberry 复用 cherry
        coin:       'food_apple'    // coin 复用 apple
      }
      const mapped = foodTypeToGTRSKey[foodType]
      if (mapped && sceneImages[mapped]?.src) {
        return mapped
      }
    }

    // ── 2. 直接命中 GTRS key（最优路径，推荐全部使用此方式）
    if (sceneImages[gtrsKey]?.src) {
      return gtrsKey
    }

    // ── 3. 向后兼容：语义别名 -> GTRS key 映射
    //    （仅保留必要的兼容项，新代码应直接传入 GTRS key）
    const legacyAliasMap: Record<string, string> = {
      snakeHead:    'snake_head',
      snakeBody:    'snake_body',
      snakeTail:    'snake_tail',
      foodApple:    'food_apple',
      foodBanana:   'food_banana',
      foodCherry:   'food_cherry',
      background:   'scene_bg_main',
      gameBg:       'scene_bg_main',
      gridBg:       'scene_bg_grid',
      obstacleRock: 'obstacle_rock',
      obstacleWall: 'obstacle_wall'
    }
    const legacyKey = legacyAliasMap[gtrsKey]
    if (legacyKey && sceneImages[legacyKey]?.src) {
      return legacyKey
    }

    // ── 4. 未命中：返回 undefined（由调用方决定是否使用程序化绘制）
    return undefined
  }

  /**
   * 检查 GTRS 中是否有指定资源
   */
  private hasThemeAsset(gtrsKey: string): boolean {
    return !!this.getThemeAssetKey(gtrsKey)
  }

  // ========== 音频控制 ==========

  /**
   * ⭐ 播放背景音乐（主菜单）- 直接从 GTRS resources.audio.bgm.bgm_main 读取
   */
  playBgmMain(): void {
    if (!this.soundEnabled) return
    this.stopAllBgm()
    
    const config = assertGTRS().resources?.audio?.bgm?.bgm_main
    if (config?.src) {
      this.bgmMainAudio = this.createAudio(config.src, true, config.volume ?? 0.6)
      console.log('[GTRS] 🎵 播放主菜单 BGM:', config.src)
    } else {
      console.warn('[GTRS] ⚠️ resources.audio.bgm.bgm_main 未配置，跳过')
    }
  }

  /**
   * ⭐ 播放背景音乐（游戏中）- 直接从 GTRS resources.audio.bgm.bgm_gameplay 读取
   */
  playBgmGameplay(): void {
    if (!this.soundEnabled) return
    this.stopAllBgm()
    
    const config = assertGTRS().resources?.audio?.bgm?.bgm_gameplay
    if (config?.src) {
      this.bgmGameplayAudio = this.createAudio(config.src, true, config.volume ?? 0.7)
      console.log('[GTRS] 🎵 播放游戏中 BGM:', config.src)
    } else {
      console.warn('[GTRS] ⚠️ resources.audio.bgm.bgm_gameplay 未配置，跳过')
    }
  }

  /**
   * ⭐ 播放背景音乐（游戏结束）- 直接从 GTRS resources.audio.bgm.bgm_gameover 读取
   */
  playBgmGameover(): void {
    if (!this.soundEnabled) return
    this.stopAllBgm()
    
    const config = assertGTRS().resources?.audio?.bgm?.bgm_gameover
    if (config?.src) {
      this.bgmGameoverAudio = this.createAudio(config.src, false, config.volume ?? 0.5)
      console.log('[GTRS] 🎵 播放结束 BGM:', config.src)
    } else {
      console.warn('[GTRS] ⚠️ resources.audio.bgm.bgm_gameover 未配置，跳过')
    }
  }

  /**
   * 创建 HTML5 Audio 对象并播放
   */
  private createAudio(src: string, loop: boolean, volume: number): HTMLAudioElement | null {
    try {
      const audio = new Audio(src)
      audio.loop = loop
      audio.volume = Math.max(0, Math.min(1, volume))
      audio.play().catch(err => {
        console.warn('[GTRS] ⚠️ 音频播放失败:', err, 'src:', src)
      })
      return audio
    } catch (err) {
      console.error('[GTRS] ❌ 创建音频对象失败:', err)
      return null
    }
  }

  /**
   * 停止所有背景音乐
   */
  stopAllBgm(): void {
    try {
      if (this.bgmMainAudio) {
        this.bgmMainAudio.pause()
        this.bgmMainAudio.currentTime = 0
        this.bgmMainAudio = null
      }
      if (this.bgmGameplayAudio) {
        this.bgmGameplayAudio.pause()
        this.bgmGameplayAudio.currentTime = 0
        this.bgmGameplayAudio = null
      }
      if (this.bgmGameoverAudio) {
        this.bgmGameoverAudio.pause()
        this.bgmGameoverAudio.currentTime = 0
        this.bgmGameoverAudio = null
      }
    } catch (err) {
      console.warn('[GTRS] ⚠️ 停止音频时出错:', err)
    }
  }

  /**
   * ⭐ 播放音效 - 直接从 GTRS resources.audio.effect 读取
   *
   * soundKey 优先匹配 GTRS effect key（如 "effect_eat"），
   * 若传入简短语义名（"eat"），则自动补全为 "effect_eat"。
   */
  playSound(soundKey: string): void {
    if (!this.soundEnabled) return
    
    const effectAudio = assertGTRS().resources?.audio?.effect
    if (!effectAudio) {
      console.warn('[GTRS] ⚠️ resources.audio.effect 不存在')
      return
    }

    // 优先直接命中（GTRS 规范 key，如 "effect_eat"）
    let actualKey = soundKey
    if (!effectAudio[actualKey as keyof typeof effectAudio]) {
      // 尝试自动补全 "effect_" 前缀
      const withPrefix = `effect_${soundKey}`
      if (effectAudio[withPrefix as keyof typeof effectAudio]) {
        actualKey = withPrefix
      } else {
        // 向后兼容：语义 key 映射
        const legacySoundMap: Record<string, string> = {
          eat:          'effect_eat',
          crash:        'effect_crash',
          gameover:     'effect_gameover',
          levelup:      'effect_levelup',
          button_click: 'effect_button_click'
        }
        actualKey = legacySoundMap[soundKey] || soundKey
      }
    }
    
    const effectConfig = effectAudio[actualKey as keyof typeof effectAudio]
    
    if (effectConfig?.src) {
      this.createAudio(effectConfig.src, false, effectConfig.volume ?? 0.5)
      console.log(`[GTRS] 🔊 播放音效: ${actualKey} -> ${effectConfig.src}`)
    } else {
      console.warn(`[GTRS] ⚠️ 音效 ${actualKey} 未找到或 src 为空`)
    }
  }

  /**
   * 切换声音开关
   */
  toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled
    
    if (!this.soundEnabled) {
      this.stopAllBgm()
      if (this.scene) {
        this.scene.sound.stopAll()
      }
    }
    
    console.log(`[GTRS] 🔊 声音开关: ${this.soundEnabled ? '开启' : '关闭'}`)
    return this.soundEnabled
  }

  /**
   * 获取声音状态
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled
  }

  /**
   * 设置声音状态
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled
    if (!enabled) {
      this.stopAllBgm()
      if (this.scene) {
        this.scene.sound.stopAll()
      }
    }
  }

  // ========== 主题颜色 ==========

  /**
   * ⭐ 主题颜色（数字色值，Phaser / Canvas 直接使用）
   * 完全从 GTRS.globalStyle 读取，无硬编码
   */
  private get themeColors() {
    const style = assertGTRS().globalStyle
    return {
      snakeHead: hexToNumber(style?.primaryColor   || '#4ade80'),
      snakeBody: hexToNumber(style?.primaryColor   || '#4ade80'),
      food:      hexToNumber(style?.secondaryColor || '#22c55e'),
      bg:        hexToNumber(style?.bgColor        || '#1a1a2e')
    }
  }
}
