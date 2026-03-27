/**
 * 🎮【核心引擎】GameEngine
 * 
 * 所有游戏通用的 Phaser 游戏引擎封装。
 * 提供：GTRS 主题加载、Phaser 初始化、屏幕自适应、音频管理、资源加载。
 * 
 * 使用方式（继承扩展）：
 * ```typescript
 * export class MyGame extends GameEngine {
 *   protected override create(scene: any): void {
 *     super.create(scene)
 *     // 创建游戏对象...
 *   }
 *   protected override update(time: number, delta: number): void {
 *     super.update(time, delta)
 *     // 游戏逻辑...
 *   }
 * }
 * ```
 * 
 * ⚠️ 注意：不要在 GameEngine 或其子类内部调用 useGameStore() 或 useThemeStore()，
 *    因为 Pinia 必须在 Vue 组件 setup 上下文中使用。
 *    正确做法：在 Vue 组件中创建 store，然后通过回调注入到引擎。
 */

import { GTRSLoader } from '../components/GTRSLoader'
import { ScreenAdapter } from '../components/ScreenAdapter'
import { AudioManager } from '../components/AudioManager'
import { validateGTRSTheme } from '../utils/gtrs-validator'
import type { GameEngineConfig, AdaptParams, Difficulty } from '../types/game.types'
import type { GTRSTheme } from '../types/gtrs.types'

// 声明全局 Phaser 变量（解决 TypeScript 编译问题）
declare const Phaser: any

export type { GameEngineConfig }

/**
 * ⭐ 游戏引擎核心类
 */
export class GameEngine {

  // ============================================================================
  // 🔧 配置与实例
  // ============================================================================

  protected config!: any // Phaser.Types.Core.GameConfig
  protected game: any    = null // Phaser.Game
  protected scene: any   = null // Phaser.Scene
  protected engineConfig: GameEngineConfig

  // 设计基准（美术基准，不代表画布尺寸）
  protected readonly DESIGN_WIDTH:  number
  protected readonly DESIGN_HEIGHT: number
  protected readonly GRID_COLS:     number
  protected readonly GRID_ROWS:     number
  protected readonly BASE_CELL_SIZE: number

  // 适配参数（动态计算）
  protected Adapt: AdaptParams = {
    screenW:    0,
    screenH:    0,
    scale:      1,
    safeTop:    0,
    safeBottom: 0,
    cellSize:   0,
    gameAreaX:  0,
    gameAreaY:  0
  }

  // 组件实例
  protected gtrsLoader:    GTRSLoader
  protected screenAdapter: ScreenAdapter
  protected audioManager:  AudioManager

  // 回调
  protected onGameComplete?: () => void
  protected onProgress?:     (progress: number) => void
  protected containerElement: HTMLElement | null = null
  protected soundEnabled: boolean = true

  // ⭐ 道具效果回调（由 Vue 组件注入，避免在 Phaser 内调用 Pinia）
  protected onItemEffect?: (type: string) => void

  // GTRS 主题（运行时）
  private _GTRS: GTRSTheme | null = null

  // ============================================================================
  // 🚀 构造函数
  // ============================================================================

  constructor(
    element: HTMLElement,
    onGameComplete?: () => void,
    config: GameEngineConfig = {}
  ) {
    this.onGameComplete   = onGameComplete
    this.containerElement = element
    this.engineConfig     = config

    this.DESIGN_WIDTH   = config.designWidth   ?? 720
    this.DESIGN_HEIGHT  = config.designHeight  ?? 1280
    this.GRID_COLS      = config.gridCols      ?? 32
    this.GRID_ROWS      = config.gridRows      ?? 18
    this.BASE_CELL_SIZE = config.baseCellSize  ?? 50

    this.gtrsLoader    = new GTRSLoader()
    this.screenAdapter = new ScreenAdapter(
      this.DESIGN_WIDTH, this.DESIGN_HEIGHT,
      this.GRID_COLS, this.GRID_ROWS, this.BASE_CELL_SIZE
    )
    this.audioManager = new AudioManager()

    console.log('[GameEngine] 📐 初始化:', {
      designSize: `${this.DESIGN_WIDTH} × ${this.DESIGN_HEIGHT}`,
      grid:       `${this.GRID_COLS} × ${this.GRID_ROWS}`,
      cellSize:   this.BASE_CELL_SIZE
    })

    this.initPhaserConfig()
  }

  // ============================================================================
  // 🌐 公共 API
  // ============================================================================

  /**
   * ⭐ 启动游戏（先加载主题，再初始化 Phaser）
   * @param difficulty  游戏难度
   * @param themeId     必填：主题 ID
   * @param gtrsRawJson 可选：themeStore 缓存的 GTRS JSON（优先复用）
   */
  async start(difficulty: Difficulty, themeId: string, gtrsRawJson?: string): Promise<void> {
    if (this.game) {
      this.game.destroy(true)
      this.game = null
    }

    if (!themeId) {
      throw new Error('[GameEngine] 必须提供 themeId 才能启动游戏。')
    }

    console.log('[GameEngine] 🚀 开始加载主题...')
    await this.loadTheme(themeId, gtrsRawJson)
    console.log('[GameEngine] ✅ 主题加载完成，启动 Phaser')

    this.game = new Phaser.Game(this.config)
  }

  /** 获取当前 cellSize */
  getCellSize(): number {
    return this.Adapt.cellSize
  }

  /** 获取 GTRS 主题对象（未加载则 throw） */
  getGTRS(): GTRSTheme {
    if (!this._GTRS) throw new Error('[GameEngine] 主题未加载！请先调用 start()。')
    return this._GTRS
  }

  /** 设置资源加载进度回调 */
  setProgressCallback(callback: (progress: number) => void): void {
    this.onProgress = callback
  }

  /** 设置全局声音状态 */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled
    this.audioManager.setSoundEnabled(enabled)
    if (!enabled && this.scene) {
      try { this.scene.sound?.stopAll() } catch { /* ignore */ }
    }
  }

  /**
   * ⭐ 注入道具效果回调
   * 在 Vue 组件中调用，将 gameStore.applyItemEffect 传入
   */
  setItemEffectCallback(callback: (type: string) => void): void {
    this.onItemEffect = callback
  }

  /** 销毁游戏实例 */
  destroy(): void {
    this.audioManager.destroy()
    if (this.game) {
      this.game.destroy(true)
      this.game = null
    }
  }

  // ============================================================================
  // 🔧 Protected 方法（子类可重写）
  // ============================================================================

  /**
   * ⭐ 预加载资源（子类重写时必须调用 super.preload()）
   */
  protected preload(scene: any): void {
    this.scene = scene

    if (!this.containerElement) {
      console.warn('[GameEngine] ⚠️ 容器元素未设置')
      return
    }

    // 计算屏幕适配参数
    this.screenAdapter.calculateParams(
      this.containerElement.clientWidth,
      this.containerElement.clientHeight
    )
    this.syncAdaptParams()

    // 加载进度事件
    scene.load?.on('progress', (value: number) => {
      this.onProgress?.(value)
    })

    // 加载 GTRS 图片资源
    this.loadGTRSImages(scene)
  }

  /**
   * ⭐ 创建场景（子类重写时必须调用 super.create()）
   */
  protected create(scene: any): void {
    this.scene = scene
    console.log('[GameEngine] 📐 画布尺寸:', {
      width:  scene.scale?.width,
      height: scene.scale?.height
    })
  }

  /**
   * ⭐ 游戏循环（子类重写时必须调用 super.update()）
   */
  protected update(_time: number, _delta: number): void {
    if (!this.scene) return
  }

  // ============================================================================
  // 🔒 私有方法
  // ============================================================================

  /**
   * 加载主题
   */
  protected async loadTheme(themeId: string, gtrsRawJson?: string): Promise<void> {
    let configJsonStr: string

    if (gtrsRawJson) {
      console.log('[GameEngine] ♻️ 复用缓存的 GTRS 主题')
      configJsonStr = gtrsRawJson
    } else {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('[GameEngine] 用户未登录，无法加载主题。')

      const baseUrl  = localStorage.getItem('platformUrl') ?? 'http://localhost:8080'
      const response = await fetch(`${baseUrl}/api/theme/download?id=${themeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error(`[GameEngine] 主题加载失败：HTTP ${response.status}`)

      const result = await response.json()
      if (result.code !== 200 || !result.data) {
        throw new Error(`[GameEngine] 主题加载失败：code=${result.code}`)
      }

      const raw = result.data
      if (typeof raw === 'string') {
        configJsonStr = raw
      } else if (raw.config !== undefined) {
        configJsonStr = typeof raw.config === 'string' ? raw.config : JSON.stringify(raw.config)
      } else if (raw.configJson !== undefined) {
        configJsonStr = typeof raw.configJson === 'string' ? raw.configJson : JSON.stringify(raw.configJson)
      } else {
        configJsonStr = JSON.stringify(raw)
      }
    }

    // GTRS 校验
    const validation = validateGTRSTheme(configJsonStr)
    if (!validation.valid) {
      throw new Error(`[GameEngine] 主题 ${themeId} GTRS 校验失败：\n${validation.message}`)
    }

    this._GTRS = JSON.parse(configJsonStr)
    // 路径归一化
    this._GTRS = this.normalizeSrcPaths(this._GTRS) as GTRSTheme
    console.log(`[GameEngine] ✅ GTRS 主题已加载：${this._GTRS?.themeInfo?.themeName ?? '未命名'}`)
  }

  /**
   * 从 GTRS 加载场景图片资源到 Phaser
   */
  protected loadGTRSImages(scene: any): void {
    const gtrs = this._GTRS
    if (!gtrs?.resources?.images?.scene) return

    for (const [key, resource] of Object.entries(gtrs.resources.images.scene)) {
      if (resource.src) {
        scene.load?.image(key, resource.src)
        console.log(`[GameEngine] 📷 加载图片: ${key} → ${resource.src}`)
      }
    }
  }

  /**
   * 初始化 Phaser 配置
   */
  private initPhaserConfig(): void {
    const self = this

    // 缩放配置（从 GameEngineConfig 读取，有合理默认值）
    const scaleMode   = this.resolveScaleMode()
    const autoCenter  = this.resolveAutoCenter()
    const canvasWidth  = this.engineConfig.canvasWidth ?? '100%'
    const canvasHeight = this.engineConfig.canvasHeight ?? '100%'
    const bgColor      = this.engineConfig.backgroundColor ?? '#1a1a2e'

    this.config = {
      type:   typeof Phaser !== 'undefined' ? Phaser.AUTO : 'auto',
      scale:  { mode: scaleMode, autoCenter, width: canvasWidth, height: canvasHeight },
      parent:          this.containerElement!,
      backgroundColor: bgColor,
      scene: {
        preload(this: any) { self.preload.call(self, this) },
        create(this: any)  { self.create.call(self, this)  },
        update(this: any, time: number, delta: number) { self.update.call(self, time, delta) }
      },
      physics: {
        default: 'arcade',
        arcade: { debug: false }
      }
    }
  }

  /** 解析缩放模式为 Phaser 常量 */
  private resolveScaleMode(): any {
    if (typeof Phaser === 'undefined') return 'RESIZE'
    const modeName = this.engineConfig.scaleMode ?? 'RESIZE'
    const modes: Record<string, number> = {
      FIT:     Phaser.Scale.FIT,
      ENVELOP: Phaser.Scale.ENVELOP,
      RESIZE:  Phaser.Scale.RESIZE,
      EXPAND:  Phaser.Scale.EXPAND,
      NONE:    Phaser.Scale.NONE
    }
    return modes[modeName] ?? Phaser.Scale.RESIZE
  }

  /** 解析居中方式为 Phaser 常量 */
  private resolveAutoCenter(): any {
    if (typeof Phaser === 'undefined') return 'CENTER_BOTH'
    const centerName = this.engineConfig.autoCenter ?? 'CENTER_BOTH'
    const centers: Record<string, number> = {
      CENTER_BOTH:           Phaser.Scale.CENTER_BOTH,
      CENTER_HORIZONTALLY:  Phaser.Scale.CENTER_HORIZONTALLY,
      CENTER_VERTICALLY:    Phaser.Scale.CENTER_VERTICALLY,
      NO_CENTER:            Phaser.Scale.NO_CENTER
    }
    return centers[centerName] ?? Phaser.Scale.CENTER_BOTH
  }

  /**
   * 将 screenAdapter 的计算结果同步到 this.Adapt
   */
  protected syncAdaptParams(): void {
    Object.assign(this.Adapt, this.screenAdapter.adapt)
  }

  /**
   * 路径归一化
   */
  private normalizeSrcPaths(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(i => this.normalizeSrcPaths(i))
    const result: any = {}
    for (const key of Object.keys(obj)) {
      const value = obj[key]
      if (key === 'src' && typeof value === 'string') {
        result[key] = value.startsWith('/public/') ? value.replace('/public/', '/') : value
      } else if (typeof value === 'object') {
        result[key] = this.normalizeSrcPaths(value)
      } else {
        result[key] = value
      }
    }
    return result
  }
}
