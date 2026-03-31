// ============================================================================
// 🎨 背景渲染组件
// ============================================================================
// 
// 📌 说明:
//   负责渲染游戏背景（包括全屏背景和游戏区域背景）
//   支持图片平铺模式和纯色模式
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'

/**
 * 背景渲染组件参数
 */
interface BackgroundRendererParams {
  /** GTRS 主题对象 */
  theme: any
  /** 屏幕宽度 */
  screenWidth: number
  /** 屏幕高度 */
  screenHeight: number
  /** 安全区域顶部 */
  safeTop: number
  /** 安全区域底部 */
  safeBottom: number
  /** 单元格大小 */
  cellSize: number
  /** 网格列数 */
  gridCols: number
  /** 网格行数 */
  gridRows: number
}

/**
 * 背景渲染组件类
 * 
 * @remarks
 * 职责：
 * - 渲染全屏背景（图片或渐变色）
 * - 渲染游戏区域背景（网格平铺或边框）
 * - 响应主题切换事件重新渲染
 * 
 * @example
 * ```typescript
 * const bgRenderer = new BackgroundRenderer(scene)
 * container.add(bgRenderer)
 * 
 * // 初始化
 * bgRenderer.init({
 *   theme: gtrsTheme,
 *   screenWidth: 720,
 *   screenHeight: 1280,
 *   cellSize: 40,
 *   gridCols: 32,
 *   gridRows: 18
 * })
 * ```
 */
export class BackgroundRenderer extends ComponentBase {
  /** 全屏背景容器 */
  private fullscreenBackground: Phaser.GameObjects.Container | null = null
  
  /** 游戏区域背景容器 */
  private gameAreaBackground: Phaser.GameObjects.Container | null = null
  
  /** 当前背景配置 */
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
   * 初始化背景渲染器
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as BackgroundRendererParams
    this.renderBackground()
    
    console.log(`✅ [BackgroundRenderer] 背景渲染器初始化完成`)
  }
  
  /**
   * 销毁背景渲染器
   */
  public destroy(): void {
    super.destroy()
    
    // 清理全屏背景
    if (this.fullscreenBackground) {
      this.fullscreenBackground.destroy(true)
      this.fullscreenBackground = null
    }
    
    // 清理游戏区域背景
    if (this.gameAreaBackground) {
      this.gameAreaBackground.destroy(true)
      this.gameAreaBackground = null
    }
    
    console.log(`🗑️ [BackgroundRenderer] 背景渲染器已销毁`)
  }
  
  /**
   * 渲染背景（主方法）
   * 
   * @private
   */
  private renderBackground(): void {
    if (!this.params || !this.scene) {
      console.warn('⚠️ [BackgroundRenderer] 无法渲染背景：参数或场景未初始化')
      return
    }
    
    const { theme, screenWidth, screenHeight, safeTop, safeBottom, cellSize, gridCols, gridRows } = this.params
    
    // 清理旧背景
    this.clearBackground()
    
    // 创建全屏背景容器
    this.fullscreenBackground = this.scene.add.container(0, 0)
    this.fullscreenBackground.setDepth(-10)
    
    // 创建游戏区域背景容器
    this.gameAreaBackground = this.scene.add.container(0, 0)
    this.gameAreaBackground.setDepth(-5)
    
    // 渲染全屏背景
    this.renderFullscreenBackground(theme, screenWidth, screenHeight)
    
    // 渲染游戏区域背景
    this.renderGameAreaBackground(
      theme,
      screenWidth,
      screenHeight,
      safeTop,
      safeBottom,
      cellSize,
      gridCols,
      gridRows
    )
    
    // 发布渲染完成事件
    this.emit({
      type: GameEventType.RENDERER_READY,
      payload: { renderer: 'background' },
      timestamp: Date.now()
    })
  }
  
  /**
   * 渲染全屏背景
   * 
   * @param theme - GTRS 主题对象
   * @param width - 屏幕宽度
   * @param height - 屏幕高度
   * 
   * @private
   */
  private renderFullscreenBackground(
    theme: any,
    width: number,
    height: number
  ): void {
    if (!this.fullscreenBackground) return
    
    // 尝试使用 GTRS 背景图片
    const bgImageKey = this.getThemeAssetKey(theme, 'scene_bg_fullscreen')
    
    if (bgImageKey && this.scene.textures.exists(bgImageKey)) {
      // 使用图片背景（拉伸模式）
      const bgImage = this.scene.add.image(width / 2, height / 2, bgImageKey)
      bgImage.setDisplaySize(width, height)
      bgImage.setDepth(0)
      
      this.fullscreenBackground.add(bgImage)
      
      console.log(`🖼️ [BackgroundRenderer] 使用图片背景：${bgImageKey}`)
    } else {
      // 使用纯色背景
      const bgColor = theme.globalStyle?.bgColor || '#1a1a2e'
      const color = this.hexToNumber(bgColor)
      
      const graphics = this.scene.add.graphics()
      graphics.fillStyle(color, 1)
      graphics.fillRect(0, 0, width, height)
      graphics.setDepth(0)
      
      this.fullscreenBackground.add(graphics)
      
      console.log(`🎨 [BackgroundRenderer] 使用纯色背景：${bgColor}`)
    }
  }
  
  /**
   * 渲染游戏区域背景
   * 
   * @param theme - GTRS 主题对象
   * @param screenWidth - 屏幕宽度
   * @param screenHeight - 屏幕高度
   * @param safeTop - 安全区域顶部
   * @param safeBottom - 安全区域底部
   * @param cellSize - 单元格大小
   * @param gridCols - 网格列数
   * @param gridRows - 网格行数
   * 
   * @private
   */
  private renderGameAreaBackground(
    theme: any,
    screenWidth: number,
    screenHeight: number,
    safeTop: number,
    safeBottom: number,
    cellSize: number,
    gridCols: number,
    gridRows: number
  ): void {
    if (!this.gameAreaBackground) return
    
    // 计算游戏区域尺寸和位置
    const gameWidth = gridCols * cellSize
    const gameHeight = gridRows * cellSize
    const offsetX = (screenWidth - gameWidth) / 2
    const offsetY = safeTop + (screenHeight - safeTop - safeBottom - gameHeight) / 2
    
    // 尝试使用 GTRS 网格背景图片
    const gridBgKey = this.getThemeAssetKey(theme, 'scene_bg_grid')
    
    if (gridBgKey && this.scene.textures.exists(gridBgKey)) {
      // 使用图片平铺背景（保持原始比例）
      const gridBg = this.scene.add.tileSprite(
        offsetX + gameWidth / 2,
        offsetY + gameHeight / 2,
        gameWidth,
        gameHeight,
        gridBgKey
      )
      gridBg.setDepth(0)
      
      this.gameAreaBackground.add(gridBg)
      
      console.log(`🔲 [BackgroundRenderer] 使用网格平铺背景：${gridBgKey}`)
    } else {
      // 使用边框 + 纯色填充
      const graphics = this.scene.add.graphics()
      
      // 绘制边框
      const borderWidth = Math.max(2, cellSize * 0.06)
      graphics.lineStyle(borderWidth, 0x4ade80, 0.8)
      graphics.strokeRect(
        offsetX + borderWidth / 2,
        offsetY + borderWidth / 2,
        gameWidth - borderWidth,
        gameHeight - borderWidth
      )
      
      // 填充背景
      const bgColor = theme.colors?.background || '#16213e'
      graphics.fillStyle(this.hexToNumber(bgColor), 0.8)
      graphics.fillRect(offsetX, offsetY, gameWidth, gameHeight)
      
      graphics.setDepth(0)
      this.gameAreaBackground.add(graphics)
      
      console.log(`📦 [BackgroundRenderer] 使用边框 + 纯色背景`)
    }
    
    console.log(`📐 [BackgroundRenderer] 游戏区域：`, {
      offset: `(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`,
      size: `${gameWidth.toFixed(0)} × ${gameHeight.toFixed(0)}`,
      cellSize: cellSize.toFixed(2)
    })
  }
  
  /**
   * 清理背景对象
   * 
   * @private
   */
  private clearBackground(): void {
    if (this.fullscreenBackground) {
      this.fullscreenBackground.destroy(true)
      this.fullscreenBackground = null
    }
    
    if (this.gameAreaBackground) {
      this.gameAreaBackground.destroy(true)
      this.gameAreaBackground = null
    }
  }
  
  /**
   * 从主题获取资源键
   * 
   * @param theme - GTRS 主题对象
   * @param assetType - 资源类型
   * @returns 资源键（不存在则返回 null）
   * 
   * @private
   */
  private getThemeAssetKey(theme: any, assetType: string): string | null {
    const assets = theme.assets ?? []
    const asset = assets.find((a: any) => a.assetType === assetType)
    return asset?.src ?? null
  }
  
  /**
   * Hex 颜色转数字
   * 
   * @param hex - 十六进制颜色字符串
   * @returns 数字格式颜色值
   * 
   * @private
   */
  private hexToNumber(hex: string): number {
    if (!hex) return 0x000000
    const clean = hex.replace('#', '')
    if (clean.length !== 6) return 0x000000
    const num = parseInt(clean, 16)
    return isNaN(num) ? 0x000000 : num
  }
  
  /**
   * 处理组件事件
   * 
   * @param event - 游戏事件对象
   * 
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    switch (event.type) {
      case GameEventType.NEED_RERENDER:
        // 需要重新渲染背景
        if (this.params) {
          this.renderBackground()
        }
        break
        
      default:
        // 忽略其他事件
        break
    }
  }
}
