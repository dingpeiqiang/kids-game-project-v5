// ============================================================================
// 🎨【框架层】背景渲染组件 - 通用游戏引擎
// ============================================================================
// 📌 说明：封装原有的 createBackground() 方法，保持逻辑不变
// ⚠️ 注意：这是框架层组件，所有游戏通用
// ============================================================================

/**
 * ⭐ 背景渲染组件
 * 
 * 📌 说明：封装原有的 createBackground() 方法
 * 
 * 使用方式:
 * ```typescript
 * const renderer = new BackgroundRenderer(scene, adaptParams)
 * renderer.renderBackground()
 * ```
 */
export class BackgroundRenderer {
  private scene: Phaser.Scene | null = null
  private adaptParams: any
  private gtrs: any = null

  /**
   * 构造函数
   * @param scene Phaser 场景对象
   * @param adaptParams 适配参数 (包含 screenW, screenH, cellSize, safeTop, safeBottom 等)
   * @param gtrs GTRS 主题对象
   */
  constructor(
    scene: Phaser.Scene | null,
    adaptParams: any,
    gtrs?: any
  ) {
    this.scene = scene
    this.adaptParams = adaptParams
    this.gtrs = gtrs
  }

  /**
   * ⭐ 渲染背景 - 通用游戏引擎核心渲染方法 (保持原有逻辑不变)
   */
  renderBackground(): void {
    if (!this.scene) return

    const scene = this.scene
    const graphics = scene.add.graphics()

    // ⭐ 直接使用 GTRS 规范 key：scene_bg_main / scene_bg_grid (保持原有逻辑)
    const bgKey = this.getThemeAssetKey('scene_bg_main')
    if (bgKey) {
      // ⭐ 使用 GTRS 背景图片 - 平铺模式（不拉伸）(保持原有实现)
      const bgImage = scene.add.tileSprite(
        this.adaptParams.screenW / 2,
        this.adaptParams.screenH / 2,
        this.adaptParams.screenW,
        this.adaptParams.screenH,
        bgKey
      )
      bgImage.setDepth(-1)
      
      console.log('🖼️ 背景图片已平铺:', {
        size: `${this.adaptParams.screenW.toFixed(0)} × ${this.adaptParams.screenH.toFixed(0)}`,
        mode: 'tile (repeat)'
      })
    } else {
      // 默认全屏渐变背景 - 使用 GTRS 背景色 (保持原有逻辑)
      const bgColor = this.getGTRSBgColor('#1a1a2e')
      const baseColor = this.hexToNumber(bgColor)
      graphics.fillStyle(baseColor, 1)
      graphics.fillRect(0, 0, this.adaptParams.screenW, this.adaptParams.screenH)
    }

    // 计算游戏区域尺寸和偏移（居中显示）(保持原有计算逻辑)
    const gameWidth = 32 * this.adaptParams.cellSize  // GRID_COLS = 32
    const gameHeight = 18 * this.adaptParams.cellSize // GRID_ROWS = 18
    const offsetX = (this.adaptParams.screenW - gameWidth) / 2
    const offsetY = this.adaptParams.safeTop + (this.adaptParams.screenH - this.adaptParams.safeTop - this.adaptParams.safeBottom - gameHeight) / 2

    console.log('🖼️ 游戏区域:', {
      offset: `(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`,
      size: `${gameWidth.toFixed(0)} × ${gameHeight.toFixed(0)}`,
      cellSize: this.adaptParams.cellSize.toFixed(2)
    })

    // ⭐ 使用 GTRS 网格背景图片 - 平铺模式（不拉伸）(保持原有实现)
    const gridBgKey = this.getThemeAssetKey('scene_bg_grid')
    if (gridBgKey) {
      // 👉 关键：使用 tileSprite 平铺，保持原始比例
      const gridBg = scene.add.tileSprite(
        offsetX + gameWidth / 2,
        offsetY + gameHeight / 2,
        gameWidth,
        gameHeight,
        gridBgKey
      )
      
      gridBg.setDepth(0)
      
      console.log('🔲 网格背景已平铺:', {
        tileSize: `${gameWidth.toFixed(0)} × ${gameHeight.toFixed(0)}`,
        cellSize: this.adaptParams.cellSize.toFixed(2),
        mode: 'tile (repeat, no stretch)'
      })
    } else {
      // 绘制游戏区域边框 - 线条粗细按 cellSize 比例 (保持原有逻辑)
      const borderWidth = Math.max(2, this.adaptParams.cellSize * 0.06)
      graphics.lineStyle(borderWidth, 0x4ade80, 0.8)
      graphics.strokeRect(offsetX + borderWidth / 2, offsetY + borderWidth / 2, gameWidth - borderWidth, gameHeight - borderWidth)

      // 填充游戏区域背景 (保持原有逻辑)
      const bgColor = this.getThemeColor('bg', 0x1a1a2e)
      graphics.fillStyle(bgColor, 0.8)
      graphics.fillRect(offsetX, offsetY, gameWidth, gameHeight)
    }
  }

  /**
   * ⭐ 获取 GTRS 主题资源 Key (辅助方法)
   */
  private getThemeAssetKey(assetType: string): string | null {
    // TODO: 需要从外部传入 GTRS 对象或提供获取方法
    // 这里暂时返回 null，让调用方使用回退方案
    return null
  }

  /**
   * ⭐ 获取 GTRS 背景颜色 (辅助方法)
   */
  private getGTRSBgColor(defaultColor: string): string {
    // TODO: 需要从外部传入 GTRS 对象或提供获取方法
    return defaultColor
  }

  /**
   * ⭐ 获取主题颜色 (辅助方法)
   */
  private getThemeColor(colorType: string, defaultColor: number): number {
    // TODO: 需要从外部传入主题颜色或提供获取方法
    return defaultColor
  }

  /**
   * ⭐ Hex 转 Number (辅助方法，保持原有实现)
   */
  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', '0x'))
  }

  /**
   * ⭐ 更新场景引用 (用于 resize 后重新绑定)
   */
  setScene(scene: Phaser.Scene): void {
    this.scene = scene
  }

  /**
   * ⭐ 更新适配参数 (用于 resize 后重新计算)
   */
  setAdaptParams(adaptParams: any): void {
    this.adaptParams = adaptParams
  }

  /**
   * ⭐ 更新 GTRS 引用 (用于动态切换主题)
   */
  setGTRS(gtrs: any): void {
    this.gtrs = gtrs
  }
}
