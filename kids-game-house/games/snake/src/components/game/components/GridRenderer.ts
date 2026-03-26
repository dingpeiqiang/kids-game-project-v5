// ============================================================================
// 🎨【框架层】网格渲染组件 - 通用游戏引擎
// ============================================================================
// 📌 说明：封装原有的 createGrid() 方法，保持逻辑不变
// ⚠️ 注意：这是框架层组件，所有游戏通用
// ============================================================================

/**
 * ⭐ 网格渲染组件
 * 
 * 📌 说明：封装原有的 createGrid() 方法
 * 
 * 使用方式:
 * ```typescript
 * const renderer = new GridRenderer(scene, adaptParams)
 * renderer.renderGrid()
 * ```
 */
export class GridRenderer {
  private scene: Phaser.Scene | null = null
  private adaptParams: any
  private gridCols: number
  private gridRows: number

  /**
   * 构造函数
   * @param scene Phaser 场景对象
   * @param adaptParams 适配参数 (包含 screenW, screenH, cellSize, safeTop, safeBottom 等)
   * @param gridCols 网格列数，默认 32
   * @param gridRows 网格行数，默认 18
   */
  constructor(
    scene: Phaser.Scene | null,
    adaptParams: any,
    gridCols: number = 32,
    gridRows: number = 18
  ) {
    this.scene = scene
    this.adaptParams = adaptParams
    this.gridCols = gridCols
    this.gridRows = gridRows
  }

  /**
   * ⭐ 渲染网格线 - 通用游戏引擎核心渲染方法 (保持原有逻辑不变)
   */
  renderGrid(): void {
    if (!this.scene) return

    const scene = this.scene
    const graphics = scene.add.graphics()
    
    // 网格线粗细 = cellSize 的 3%，最小 1px (保持原有计算逻辑)
    const lineWidth = Math.max(1, this.adaptParams.cellSize * 0.03)
    graphics.lineStyle(lineWidth, 0xffffff, 0.05)

    // 计算游戏区域位置和尺寸 (保持原有计算逻辑)
    const gameWidth = this.gridCols * this.adaptParams.cellSize
    const gameHeight = this.gridRows * this.adaptParams.cellSize
    const offsetX = (this.adaptParams.screenW - gameWidth) / 2
    const offsetY = this.adaptParams.safeTop + (this.adaptParams.screenH - this.adaptParams.safeTop - this.adaptParams.safeBottom - gameHeight) / 2

    // 绘制内部网格线（不画最外圈）(保持原有遍历逻辑)
    for (let i = 1; i < this.gridCols; i++) {
      const pos = i * this.adaptParams.cellSize
      graphics.moveTo(offsetX + pos, offsetY)
      graphics.lineTo(offsetX + pos, offsetY + gameHeight)
    }

    for (let j = 1; j < this.gridRows; j++) {
      const pos = j * this.adaptParams.cellSize
      graphics.moveTo(offsetX, offsetY + pos)
      graphics.lineTo(offsetX + gameWidth, offsetY + pos)
    }

    graphics.strokePath()
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
   * ⭐ 获取网格宽度 (辅助方法，保持原有实现)
   */
  getGridLineWidth(): number {
    return Math.max(1, this.adaptParams.cellSize * 0.03)
  }
}
