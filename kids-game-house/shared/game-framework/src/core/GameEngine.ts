// ============================================================================
// 🎮【核心框架】Phaser 游戏引擎封装 - shared/game-framework/src/core/GameEngine.ts
// ============================================================================
// 
// 📌 使用说明:
//   ✅ 这是所有游戏通用的核心框架
//   ✅ 包含：GTRS 主题系统、Phaser 初始化、屏幕适配、音频管理、资源加载
//   ✅ 无需修改，直接复用到其他游戏项目
//
// ============================================================================

import type { Difficulty } from '../../types/game.types'
import { GTRSLoader } from '../components/GTRSLoader'
import { ScreenAdapter } from '../components/ScreenAdapter'
import { AudioManager } from '../components/AudioManager'
import { validateGTRSTheme, type GTRSTheme as BaseGTRSTheme } from '../utils/gtrs-validator'
import { useThemeStore } from '../stores/theme.store'

// 👉 声明全局 Phaser 变量（解决 TypeScript 编译问题）
declare const Phaser: any

// ============================================================================
// 📦【类型定义】
// ============================================================================

/**
 * ⭐ GTRSTheme 扩展类型
 */
export interface GTRSTheme extends BaseGTRSTheme {
  themeInfo?: {
    themeId: string
    themeName: string
    isDefault: boolean
    author?: string
    description?: string
  }
}

// ⭐ 运行时主题对象
let GTRS: GTRSTheme | null = null

// ⭐ 全局图片资源缓存 Map
const imageCache = new Map<string, HTMLImageElement | HTMLCanvasElement>()

// ============================================================================
// 🛠️【工具函数】
// ============================================================================

/**
 * Hex 颜色字符串转数字
 */
function hexToNumber(hex: string): number {
  if (!hex) return 0x000000
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return 0x000000
  const num = parseInt(clean, 16)
  return isNaN(num) ? 0x000000 : num
}

/**
 * ⭐ 断言 GTRS 已加载
 */
function assertGTRS(): GTRSTheme {
  if (!GTRS) {
    throw new Error('[GTRS] 主题未加载！请先调用 loadTheme() 获取主题后再启动游戏。')
  }
  return GTRS
}

// ============================================================================
// 🎮【GameEngine 主类】
// ============================================================================

export interface GameEngineConfig {
  designWidth?: number
  designHeight?: number
  gridCols?: number
  gridRows?: number
  baseCellSize?: number
}

export class GameEngine {
  // ============================================================================
  // 🔧【游戏配置】
  // ============================================================================
  
  protected config: Phaser.Types.Core.GameConfig
  protected game: Phaser.Game | null = null
  protected scene: Phaser.Scene | null = null
  
  // 👉 设计基准（美术作图标准，不代表画布大小）
  protected readonly DESIGN_WIDTH: number
  protected readonly DESIGN_HEIGHT: number
  
  // 👉 游戏网格配置（⚠️ 根据具体游戏玩法修改）
  protected readonly GRID_COLS: number
  protected readonly GRID_ROWS: number
  
  // 👉 基础单元格大小（像素）
  protected readonly BASE_CELL_SIZE: number
  
  // ============================================================================
  // 🔧【全局适配参数】
  // ============================================================================
  
  protected Adapt = {
    screenW: 0,    // 设备真实宽度
    screenH: 0,    // 设备真实高度
    scale: 1,      // 全局动态缩放比（核心）
    safeTop: 0,    // 顶部安全区（避开刘海）
    safeBottom: 0, // 底部安全区（避开手势条）
    cellSize: 0,   // 动态单元格大小（自动计算）
    gameAreaX: 0,  // 游戏区域左上角 X 坐标
    gameAreaY: 0   // 游戏区域左上角 Y 坐标
  }
  
  // ============================================================================
  // 🔧【组件实例】
  // ============================================================================
  
  protected gtrsLoader: GTRSLoader
  protected screenAdapter: ScreenAdapter
  protected audioManager: AudioManager
  
  // ============================================================================
  // 🔧【回调与状态】
  // ============================================================================
  
  protected onGameComplete?: () => void
  protected onProgress?: (progress: number) => void
  protected containerElement: HTMLElement | null = null
  protected soundEnabled: boolean = true
  
  // ============================================================================
  // 🔧【构造函数】
  // ============================================================================
  
  /**
   * 构造函数
   * @param element 游戏容器 DOM 元素
   * @param onGameComplete 游戏完成回调
   * @param config 游戏配置
   */
  constructor(
    element: HTMLElement,
    onGameComplete?: () => void,
    config: GameEngineConfig = {}
  ) {
    this.onGameComplete = onGameComplete
    this.containerElement = element
    
    // 👉 应用配置
    this.DESIGN_WIDTH = config.designWidth ?? 720
    this.DESIGN_HEIGHT = config.designHeight ?? 1280
    this.GRID_COLS = config.gridCols ?? 32
    this.GRID_ROWS = config.gridRows ?? 18
    this.BASE_CELL_SIZE = config.baseCellSize ?? 50
    
    // 👉 初始化组件
    this.gtrsLoader = new GTRSLoader()
    this.screenAdapter = new ScreenAdapter(
      this.DESIGN_WIDTH,
      this.DESIGN_HEIGHT,
      this.GRID_COLS,
      this.GRID_ROWS,
      this.BASE_CELL_SIZE
    )
    this.audioManager = new AudioManager()
    
    console.log('📐 游戏设计基准:', {
      designSize: `${this.DESIGN_WIDTH} × ${this.DESIGN_HEIGHT}`,
      gridConfig: `${this.GRID_COLS}列 × ${this.GRID_ROWS}行`,
      cellSize: `${this.BASE_CELL_SIZE}px`
    })
    
    // 👉 初始化 Phaser 配置
    this.initPhaserConfig()
  }
  
  // ============================================================================
  // 🚀【公共 API】
  // ============================================================================
  
  /**
   * ⭐ 启动游戏
   */
  async start(difficulty: Difficulty, themeId: string): Promise<void> {
    if (this.game) {
      this.game.destroy(true)
    }

    if (!themeId) {
      throw new Error('[GameEngine] 必须提供 themeId 才能启动游戏。')
    }

    // ⭐ 先加载主题
    console.log('[GameEngine] 🚀 开始加载主题...')
    await this.loadTheme(themeId)
    console.log('[GameEngine] ✅ 主题加载完成，准备启动 Phaser')

    // ⭐ 初始化 Phaser 游戏实例
    this.game = new Phaser.Game(this.config)
  }
  
  /**
   * 👉 获取当前 cellSize
   */
  getCellSize(): number {
    return this.Adapt.cellSize
  }
  
  /**
   * 👉 获取 GTRS 主题对象
   */
  getGTRS(): GTRSTheme {
    return assertGTRS()
  }
  
  /**
   * 👉 设置资源加载进度回调
   */
  setProgressCallback(callback: (progress: number) => void): void {
    this.onProgress = callback
  }
  
  /**
   * 👉 设置声音状态
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled
    if (!enabled && this.scene) {
      this.scene.sound.stopAll()
    }
  }
  
  // ============================================================================
  // 🔧【Protected 方法 - 子类可重写】
  // ============================================================================
  
  /**
   * ⭐ 加载主题
   */
  protected async loadTheme(themeId: string): Promise<void> {
    const themeStore = useThemeStore()
    let configJsonStr: string

    // ⭐ 优先复用 themeStore 已加载的 GTRS（避免重复请求）
    if (themeStore.gtrsRawJson) {
      console.log('[GameEngine] ♻️ 复用 themeStore 已加载的 GTRS 主题')
      configJsonStr = themeStore.gtrsRawJson
    } else {
      // ⭐ gtrsRawJson 为空，从后端获取
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('[GameEngine] 用户未登录，无法加载主题。')
      }

      console.log('[GameEngine] 🔄 从后端加载 GTRS 主题')
      const response = await fetch(`http://localhost:8080/api/theme/download?id=${themeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(`[GameEngine] 主题加载失败：HTTP ${response.status}`)
      }

      const result = await response.json()
      if (result.code !== 200 || !result.data) {
        throw new Error(`[GameEngine] 主题加载失败：服务端 code=${result.code}`)
      }

      // ⭐ 提取 configJson
      const raw = result.data
      if (typeof raw === 'string') {
        configJsonStr = raw
      } else if (raw.configJson !== undefined) {
        configJsonStr = typeof raw.configJson === 'string'
          ? raw.configJson
          : JSON.stringify(raw.configJson)
      } else {
        configJsonStr = JSON.stringify(raw)
      }
    }

    // ⭐ GTRS 严格校验
    const validationResult = validateGTRSTheme(configJsonStr)
    if (!validationResult.valid) {
      throw new Error(
        `[GameEngine] 主题 ${themeId} GTRS 校验失败：\n${validationResult.message}`
      )
    }

    // 校验通过，赋值 GTRS
    const themeConfig: GTRSTheme = JSON.parse(configJsonStr)
    // TODO: 实现 applyGTRS
    console.log(`[GameEngine] ✅ GTRS 主题已加载：${themeConfig.themeInfo?.themeName || '未命名'}`)
  }
  
  /**
   * ⭐ 预加载资源（子类重写）
   */
  protected preload(scene: Phaser.Scene): void {
    // 保存场景引用
    this.scene = scene
    
    if (!this.containerElement) {
      console.warn('⚠️ 容器元素未设置')
      return
    }

    // 1. 从 DOM 元素获取真实屏幕尺寸
    this.Adapt.screenW = this.containerElement.clientWidth
    this.Adapt.screenH = this.containerElement.clientHeight

    console.log('📏 设备真实尺寸:', `${this.Adapt.screenW} × ${this.Adapt.screenH}`)

    // 2. 计算屏幕适配参数
    this.calculateAdaptParams(this.Adapt.screenW, this.Adapt.screenH)
    
    // TODO: 加载 GTRS 图片资源
    // this.loadGTRSImages(scene)
  }
  
  /**
   * ⭐ 创建场景（子类重写）
   */
  protected create(scene: Phaser.Scene): void {
    this.scene = scene
    
    console.log('📏 画布尺寸:', {
      width: scene.scale.width,
      height: scene.scale.height
    })
    
    // TODO: 创建游戏对象
  }
  
  /**
   * ⭐ 游戏循环（子类重写）
   */
  protected update(time: number, delta: number): void {
    if (!this.scene) return
    // TODO: 实现游戏逻辑
  }
  
  // ============================================================================
  // 🔧【Private 方法】
  // ============================================================================
  
  /**
   * 初始化 Phaser 配置
   */
  private initPhaserConfig(): void {
    const self = this
    
    this.config = {
      type: Phaser.AUTO,
      scale: {
        mode: Phaser.Scale.RESIZE,        // 🔥 响应式（商业项目标准）
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
      },
      parent: this.containerElement!,
      backgroundColor: '#1a1a2e',
      scene: {
        preload() {
          self.preload.call(self, this)
        },
        create() {
          self.create.call(self, this)
        },
        update(time: number, delta: number) {
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
   * 计算屏幕适配参数
   */
  protected calculateAdaptParams(containerWidth: number, containerHeight: number): void {
    this.Adapt.screenW = containerWidth
    this.Adapt.screenH = containerHeight
    
    // 计算安全区域（手机刘海/底部手势条）
    this.Adapt.safeTop = Math.max(44, this.Adapt.screenH * 0.05)
    this.Adapt.safeBottom = Math.max(34, this.Adapt.screenH * 0.08)
    
    // 计算动态单元格大小
    const baseCellSize = this.BASE_CELL_SIZE
    const gameAreaWidth = this.GRID_COLS * baseCellSize
    const gameAreaHeight = this.GRID_ROWS * baseCellSize
    
    const availableWidth = (this.Adapt.screenW - 20) * 0.95
    const availableHeight = (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom) * 0.9
    
    const scaleByWidth = availableWidth / gameAreaWidth
    const scaleByHeight = availableHeight / gameAreaHeight
    
    const finalScale = Math.min(scaleByWidth, scaleByHeight, 1.5)  // 最大放大 1.5 倍
    this.Adapt.cellSize = baseCellSize * finalScale
    
    const actualGameWidth = this.GRID_COLS * this.Adapt.cellSize
    const actualGameHeight = this.GRID_ROWS * this.Adapt.cellSize
    
    console.log('🎯 最终游戏区域:', {
      cellSize: this.Adapt.cellSize.toFixed(2),
      size: `${actualGameWidth.toFixed(0)} × ${actualGameHeight.toFixed(0)}`,
      fitsInScreen: actualGameWidth <= this.Adapt.screenW && 
                    actualGameHeight <= (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom)
    })
  }
}
