// ============================================================================
// 🎨 背景渲染组件
// ============================================================================
// 
// 📌 说明:
//   负责渲染游戏背景
//   支持纯色、渐变、图片等多种背景类型
//   提供视差滚动和动态效果支持
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import type Phaser from 'phaser'

/**
 * ⭐ 背景类型枚举
 */
export enum BackgroundType {
  /** 纯色背景 */
  SOLID_COLOR = 'solid_color',
  /** 渐变背景 */
  GRADIENT = 'gradient',
  /** 图片背景 */
  IMAGE = 'image',
  /** 平铺背景 */
  TILE = 'tile',
  /** 网格背景 */
  GRID = 'grid'
}

/**
 * ⭐ 背景配置接口
 */
interface BackgroundConfig {
  /** 背景类型 */
  type: BackgroundType
  /** 主颜色 */
  color?: number
  /** 渐变起始颜色 */
  gradientStart?: number
  /** 渐变结束颜色 */
  gradientEnd?: number
  /** 渐变方向（'vertical' | 'horizontal'） */
  gradientDirection?: 'vertical' | 'horizontal'
  /** 图片纹理键名 */
  textureKey?: string
  /** 是否平铺 */
  tile?: boolean
  /** 平铺偏移量（用于滚动） */
  tilePosition?: { x: number; y: number }
  /** 网格线颜色 */
  gridColor?: number
  /** 网格线宽度 */
  gridLineWidth?: number
  /** 网格单元大小 */
  gridSize?: number
  /** 背景透明度 */
  alpha?: number
  /** 滚动速度 X 轴 */
  scrollSpeedX?: number
  /** 滚动速度 Y 轴 */
  scrollSpeedY?: number
}

/**
 * ⭐ 背景渲染组件参数
 */
interface BackgroundRendererParams {
  /** 背景配置（可选，默认纯色背景） */
  background?: BackgroundConfig
  /** 是否启用视差滚动（可选，默认 false） */
  enableParallax?: boolean
  /** 视差因子（可选，默认 0.5） */
  parallaxFactor?: number
  /** 是否自动渲染（可选，默认 true） */
  autoRender?: boolean
}

/**
 * ⭐ 背景渲染组件类
 * 
 * @remarks
 * 职责：
 * - 渲染游戏背景
 * - 支持多种背景类型
 * - 视差滚动效果
 * - 动态背景切换
 * 
 * @example
 * ```typescript
 * const bgRenderer = new BackgroundRenderer(scene)
 * bgRenderer.init({
 *   background: {
 *     type: BackgroundType.GRADIENT,
 *     gradientStart: 0x1a237e,
 *     gradientEnd: 0x0d47a1,
 *     gradientDirection: 'vertical'
 *   },
 *   enableParallax: true,
 *   parallaxFactor: 0.3
 * })
 * 
 * // 切换背景
 * bgRenderer.setBackground({
 *   type: BackgroundType.IMAGE,
 *   textureKey: 'space_background'
 * })
 * ```
 */
export class BackgroundRenderer extends ComponentBase {
  /** 当前背景配置 */
  private config: BackgroundConfig | null = null
  
  /** 背景图形对象 */
  private backgroundGraphics: Phaser.GameObjects.Graphics | null = null
  
  /** 背景精灵（用于图片背景） */
  private backgroundSprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | null = null
  
  /** 平铺背景精灵 */
  private tileSprite: Phaser.GameObjects.TileSprite | null = null
  
  /** 当前参数 */
  private params: BackgroundRendererParams | null = null
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'background_renderer', '背景渲染器')
  }
  
  /**
   * ⭐ 初始化背景渲染组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as BackgroundRendererParams
    
    // 设置默认值
    if (this.params.enableParallax === undefined) {
      this.params.enableParallax = false
    }
    if (this.params.parallaxFactor === undefined) {
      this.params.parallaxFactor = 0.5
    }
    if (this.params.autoRender === undefined) {
      this.params.autoRender = true
    }
    
    // 渲染初始背景
    if (this.params.background && this.params.autoRender) {
      this.renderBackground(this.params.background)
    }
    
    console.log(`✅ [BackgroundRenderer] 背景渲染器初始化完成`)
    console.log(`   视差滚动：${this.params.enableParallax ? '✓' : '✗'}`)
  }
  
  /**
   * ⭐ 每帧更新（处理视差滚动和动画）
   * 
   * @param deltaTime - 距离上一帧的时间间隔（毫秒）
   */
  public update(deltaTime: number): void {
    if (!this.enabled || !this.config) return
    
    // 处理视差滚动
    if (this.params?.enableParallax && this.tileSprite) {
      const seconds = deltaTime / 1000
      
      if (this.config.scrollSpeedX !== undefined) {
        this.tileSprite.tilePositionX += this.config.scrollSpeedX * seconds
      }
      
      if (this.config.scrollSpeedY !== undefined) {
        this.tileSprite.tilePositionY += this.config.scrollSpeedY * seconds
      }
    }
    
    // 处理普通背景的视差偏移
    if (this.params?.enableParallax && this.backgroundSprite) {
      const factor = this.params.parallaxFactor ?? 0.5
      this.backgroundSprite.x = (this.scene.cameras.main.scrollX * factor) % this.scene.scale.width
      this.backgroundSprite.y = (this.scene.cameras.main.scrollY * factor) % this.scene.scale.height
    }
  }
  
  /**
   * ⭐ 渲染背景
   * 
   * @param config - 背景配置
   */
  public renderBackground(config: BackgroundConfig): void {
    // 清除旧背景
    this.clearBackground()
    
    this.config = config
    
    // 根据背景类型选择渲染方式
    switch (config.type) {
      case BackgroundType.SOLID_COLOR:
        this.renderSolidColor(config)
        break
        
      case BackgroundType.GRADIENT:
        this.renderGradient(config)
        break
        
      case BackgroundType.IMAGE:
        this.renderImage(config)
        break
        
      case BackgroundType.TILE:
        this.renderTile(config)
        break
        
      case BackgroundType.GRID:
        this.renderGrid(config)
        break
    }
    
    console.log(`🎨 [BackgroundRenderer] 已渲染背景：${config.type}`)
  }
  
  /**
   * ⭐ 设置新的背景配置
   * 
   * @param config - 新的背景配置
   * @param transitionDuration - 过渡动画时长（毫秒，可选）
   */
  public setBackground(config: BackgroundConfig, transitionDuration: number = 0): void {
    if (transitionDuration > 0) {
      // 带过渡动画
      const newAlpha = config.alpha ?? 1
      
      if (this.backgroundGraphics || this.backgroundSprite || this.tileSprite) {
        this.scene.tweens.add({
          targets: [this.backgroundGraphics, this.backgroundSprite, this.tileSprite].filter(Boolean),
          alpha: 0,
          duration: transitionDuration / 2,
          ease: 'Power2',
          onComplete: () => {
            this.renderBackground(config)
            
            if (this.backgroundGraphics || this.backgroundSprite || this.tileSprite) {
              this.scene.tweens.add({
                targets: [this.backgroundGraphics, this.backgroundSprite, this.tileSprite].filter(Boolean),
                alpha: newAlpha,
                duration: transitionDuration / 2,
                ease: 'Power2'
              })
            }
          }
        })
      } else {
        this.renderBackground(config)
      }
    } else {
      // 立即切换
      this.renderBackground(config)
    }
  }
  
  /**
   * ⭐ 清除背景
   */
  public clearBackground(): void {
    if (this.backgroundGraphics) {
      this.backgroundGraphics.destroy()
      this.backgroundGraphics = null
    }
    
    if (this.backgroundSprite) {
      this.backgroundSprite.destroy()
      this.backgroundSprite = null
    }
    
    if (this.tileSprite) {
      this.tileSprite.destroy()
      this.tileSprite = null
    }
  }
  
  /**
   * ⭐ 设置背景透明度
   * 
   * @param alpha - 透明度（0-1）
   */
  public setAlpha(alpha: number): void {
    if (this.config) {
      this.config.alpha = alpha
      
      const targets = [this.backgroundGraphics, this.backgroundSprite, this.tileSprite].filter(Boolean)
      
      if (targets.length > 0) {
        this.scene.tweens.add({
          targets,
          alpha,
          duration: 300,
          ease: 'Power2'
        })
      }
    }
  }
  
  /**
   * ⭐ 获取当前背景配置
   * 
   * @returns 背景配置对象
   */
  public getConfig(): BackgroundConfig | null {
    return this.config
  }
  
  /**
   * ⭐ 销毁组件
   */
  public destroy(): void {
    this.clearBackground()
    super.destroy()
  }
  
  /**
   * ⭐ 渲染纯色背景
   * 
   * @param config - 背景配置
   * @protected
   */
  protected renderSolidColor(config: BackgroundConfig): void {
    const width = this.scene.scale.width
    const height = this.scene.scale.height
    
    this.backgroundGraphics = this.scene.add.graphics()
    this.backgroundGraphics.fillStyle(config.color ?? 0x000000, config.alpha ?? 1)
    this.backgroundGraphics.fillRect(0, 0, width, height)
    this.backgroundGraphics.setDepth(-1000)
  }
  
  /**
   * ⭐ 渲染渐变背景
   * 
   * @param config - 背景配置
   * @protected
   */
  protected renderGradient(config: BackgroundConfig): void {
    const width = this.scene.scale.width
    const height = this.scene.scale.height
    
    this.backgroundGraphics = this.scene.add.graphics()
    
    const startColor = config.gradientStart ?? 0x000000
    const endColor = config.gradientEnd ?? 0xffffff
    const direction = config.gradientDirection ?? 'vertical'
    
    // 创建渐变纹理
    const graphics = this.scene.make.graphics({ x: 0, y: 0 })
    
    const steps = direction === 'vertical' ? height : width
    
    for (let i = 0; i < steps; i++) {
      const t = i / steps
      const r = Math.round(((startColor >> 16) & 0xFF) * (1 - t) + ((endColor >> 16) & 0xFF) * t)
      const g = Math.round(((startColor >> 8) & 0xFF) * (1 - t) + ((endColor >> 8) & 0xFF) * t)
      const b = Math.round((startColor & 0xFF) * (1 - t) + (endColor & 0xFF) * t)
      const color = (r << 16) | (g << 8) | b
      
      if (direction === 'vertical') {
        graphics.fillStyle(color, config.alpha ?? 1)
        graphics.fillRect(0, i, width, 1)
      } else {
        graphics.fillStyle(color, config.alpha ?? 1)
        graphics.fillRect(i, 0, 1, height)
      }
    }
    
    graphics.generateTexture('gradient_bg', width, height)
    graphics.destroy()
    
    this.backgroundSprite = this.scene.add.sprite(width / 2, height / 2, 'gradient_bg')
    this.backgroundSprite.setOrigin(0.5)
    this.backgroundSprite.setDepth(-1000)
    this.backgroundSprite.setDisplaySize(width, height)
  }
  
  /**
   * ⭐ 渲染图片背景
   * 
   * @param config - 背景配置
   * @protected
   */
  protected renderImage(config: BackgroundConfig): void {
    const width = this.scene.scale.width
    const height = this.scene.scale.height
    
    if (!config.textureKey) {
      console.warn('⚠️ [BackgroundRenderer] 图片背景需要指定 textureKey')
      // 回退到纯色背景
      this.renderSolidColor({ type: BackgroundType.SOLID_COLOR, color: 0x000000 })
      return
    }
    
    this.backgroundSprite = this.scene.add.image(width / 2, height / 2, config.textureKey)
    this.backgroundSprite.setOrigin(0.5)
    this.backgroundSprite.setDepth(-1000)
    this.backgroundSprite.setAlpha(config.alpha ?? 1)
    
    // 缩放图片以适应屏幕
    this.backgroundSprite.setDisplaySize(width, height)
  }
  
  /**
   * ⭐ 渲染平铺背景
   * 
   * @param config - 背景配置
   * @protected
   */
  protected renderTile(config: BackgroundConfig): void {
    const width = this.scene.scale.width
    const height = this.scene.scale.height
    
    if (!config.textureKey) {
      console.warn('⚠️ [BackgroundRenderer] 平铺背景需要指定 textureKey')
      this.renderSolidColor({ type: BackgroundType.SOLID_COLOR, color: 0x000000 })
      return
    }
    
    this.tileSprite = this.scene.add.tileSprite(
      width / 2,
      height / 2,
      width,
      height,
      config.textureKey
    )
    this.tileSprite.setOrigin(0.5)
    this.tileSprite.setDepth(-1000)
    this.tileSprite.setAlpha(config.alpha ?? 1)
    
    // 设置初始偏移
    if (config.tilePosition) {
      this.tileSprite.tilePositionX = config.tilePosition.x
      this.tileSprite.tilePositionY = config.tilePosition.y
    }
  }
  
  /**
   * ⭐ 渲染网格背景
   * 
   * @param config - 背景配置
   * @protected
   */
  protected renderGrid(config: BackgroundConfig): void {
    const width = this.scene.scale.width
    const height = this.scene.scale.height
    
    this.backgroundGraphics = this.scene.add.graphics()
    
    const gridColor = config.gridColor ?? 0x444444
    const gridLineWidth = config.gridLineWidth ?? 1
    const gridSize = config.gridSize ?? 40
    
    // 绘制垂直线
    for (let x = 0; x <= width; x += gridSize) {
      this.backgroundGraphics.lineStyle(gridLineWidth, gridColor, config.alpha ?? 0.5)
      this.backgroundGraphics.lineBetween(x, 0, x, height)
    }
    
    // 绘制水平线
    for (let y = 0; y <= height; y += gridSize) {
      this.backgroundGraphics.lineStyle(gridLineWidth, gridColor, config.alpha ?? 0.5)
      this.backgroundGraphics.lineBetween(0, y, width, y)
    }
    
    this.backgroundGraphics.setDepth(-1000)
  }
  
  /**
   * ⭐ 处理事件（实现基类的抽象方法）
   * 
   * @param event - 游戏事件
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    // 可以响应游戏事件来改变背景
    switch (event.type) {
      case GameEventType.GAME_START:
        // 游戏开始时恢复背景
        if (this.config) {
          this.setAlpha(1)
        }
        break
        
      case GameEventType.PAUSE:
        // 暂停时变暗背景
        this.setAlpha(0.5)
        break
        
      case GameEventType.RESUME:
        // 恢复时恢复正常
        this.setAlpha(1)
        break
        
      case GameEventType.GAME_OVER:
        // 游戏结束时变暗背景
        this.setAlpha(0.3)
        break
    }
  }
}
