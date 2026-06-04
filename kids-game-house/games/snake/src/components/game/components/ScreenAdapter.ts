// ============================================================================
// 🔧【可复用框架层】屏幕适配组件 - 保持原有逻辑不变
// ============================================================================
// 📌 说明：封装原有的屏幕适配计算逻辑，不做任何修改
// ============================================================================

/**
 * ⭐ 适配参数接口（保持原有定义）
 */
export interface AdaptParams {
  screenW: number       // 设备真实宽度
  screenH: number       // 设备真实高度
  scale: number         // 全局动态缩放比
  safeTop: number       // 顶部安全区（避开刘海）
  safeBottom: number    // 底部安全区（避开手势条）
  cellSize: number      // 动态单元格大小
}

/**
 * ⭐ 屏幕适配组件
 * 
 * 📌 说明：封装原有的 preload() 和 handleResize() 中的适配逻辑
 * 
 * 使用方式:
 * ```typescript
 * const adapter = new ScreenAdapter(720, 1280, 32, 18, 50)
 * adapter.calculateParams(containerWidth, containerHeight)
 * console.log(adapter.adapt.cellSize)
 * ```
 */
export class ScreenAdapter {
  private readonly DESIGN_WIDTH: number
  private readonly DESIGN_HEIGHT: number
  private readonly GRID_COLS: number
  private readonly GRID_ROWS: number
  private readonly BASE_CELL_SIZE: number
  
  public readonly adapt: AdaptParams = {
    screenW: 0,
    screenH: 0,
    scale: 1,
    safeTop: 0,
    safeBottom: 0,
    cellSize: 0
  }

  /**
   * 构造函数
   * @param designWidth 设计宽度（默认 720）
   * @param designHeight 设计高度（默认 1280）
   * @param gridCols 网格列数（默认 32）
   * @param gridRows 网格行数（默认 18）
   * @param baseCellSize 基础单元格大小（默认 50px）
   */
  constructor(
    designWidth: number = 720,
    designHeight: number = 1280,
    gridCols: number = 32,
    gridRows: number = 18,
    baseCellSize: number = 50
  ) {
    this.DESIGN_WIDTH = designWidth
    this.DESIGN_HEIGHT = designHeight
    this.GRID_COLS = gridCols
    this.GRID_ROWS = gridRows
    this.BASE_CELL_SIZE = baseCellSize
  }

  /**
   * ⭐ 计算适配参数（保持原有 preload() 中的计算逻辑）
   */
  calculateParams(containerWidth: number, containerHeight: number): void {
    console.log('🔍 [ScreenAdapter] 开始计算适配参数...')
    
    // 1. 从 DOM 元素获取真实屏幕尺寸
    this.adapt.screenW = containerWidth
    this.adapt.screenH = containerHeight

    console.log('📏 [ScreenAdapter] 设备真实尺寸:', `${this.adapt.screenW} × ${this.adapt.screenH}`)

    // 2. 计算最佳缩放比（自动匹配屏幕，不变形）
    this.adapt.scale = Math.min(
      this.adapt.screenW / this.DESIGN_WIDTH,
      this.adapt.screenH / this.DESIGN_HEIGHT
    )

    // 3. 计算安全区域（手机刘海/底部手势条）
    this.adapt.safeTop = Math.max(44, this.adapt.screenH * 0.05)
    this.adapt.safeBottom = Math.max(34, this.adapt.screenH * 0.08)

    // 4. 计算动态单元格大小（保证游戏区域完全显示）
    const gameAreaWidth = this.GRID_COLS * this.BASE_CELL_SIZE
    const gameAreaHeight = this.GRID_ROWS * this.BASE_CELL_SIZE
    
    // 可用空间（减去安全区域和边距）
    const availableWidth = (this.adapt.screenW - 20) * 0.95  // 留 5% 边距
    const availableHeight = (this.adapt.screenH - this.adapt.safeTop - this.adapt.safeBottom) * 0.9
    
    console.log('📐 [ScreenAdapter] 可用空间:', {
      width: availableWidth.toFixed(0),
      height: availableHeight.toFixed(0)
    })
    
    const scaleByWidth = availableWidth / gameAreaWidth
    const scaleByHeight = availableHeight / gameAreaHeight
    
    console.log('🔢 [ScreenAdapter] 缩放系数:', {
      byWidth: scaleByWidth.toFixed(3),
      byHeight: scaleByHeight.toFixed(3)
    })
    
    const finalScale = Math.min(scaleByWidth, scaleByHeight, 1.5)
    this.adapt.cellSize = this.BASE_CELL_SIZE * finalScale
    
    const actualGameWidth = this.GRID_COLS * this.adapt.cellSize
    const actualGameHeight = this.GRID_ROWS * this.adapt.cellSize
    
    console.log('🎯 [ScreenAdapter] 最终游戏区域:', {
      cellSize: this.adapt.cellSize.toFixed(2),
      size: `${actualGameWidth.toFixed(0)} × ${actualGameHeight.toFixed(0)}`,
      fitsInScreen: actualGameWidth <= this.adapt.screenW && 
                    actualGameHeight <= (this.adapt.screenH - this.adapt.safeTop - this.adapt.safeBottom)
    })

    console.log('✅ [ScreenAdapter] 自动计算适配参数完成', {
      screen: `${this.adapt.screenW} × ${this.adapt.screenH}`,
      scale: this.adapt.scale.toFixed(3),
      safeArea: `top=${this.adapt.safeTop.toFixed(0)}, bottom=${this.adapt.safeBottom.toFixed(0)}`,
      cellSize: this.adapt.cellSize.toFixed(2),
      gameArea: `${actualGameWidth.toFixed(0)} × ${actualGameHeight.toFixed(0)}`
    })
  }

  /**
   * ⭐ 重新计算适配参数（保持原有 handleResize() 中的计算逻辑）
   */
  recalculateParams(newWidth: number, newHeight: number): void {
    console.log('🔄 [ScreenAdapter] 屏幕尺寸变化，重新计算适配参数...')
    
    // 1. 更新屏幕尺寸
    this.adapt.screenW = newWidth
    this.adapt.screenH = newHeight

    // 2. 重新计算安全区域（保持与 calculateParams 一致）
    this.adapt.safeTop = Math.max(44, this.adapt.screenH * 0.05)
    this.adapt.safeBottom = Math.max(34, this.adapt.screenH * 0.08)

    // 3. 重新计算单元格大小
    const gameAreaWidth = this.GRID_COLS * this.BASE_CELL_SIZE
    const gameAreaHeight = this.GRID_ROWS * this.BASE_CELL_SIZE
    
    const availableWidth = (this.adapt.screenW - 20) * 0.95
    const availableHeight = (this.adapt.screenH - this.adapt.safeTop - this.adapt.safeBottom) * 0.9
    
    const scaleByWidth = availableWidth / gameAreaWidth
    const scaleByHeight = availableHeight / gameAreaHeight
    
    const finalScale = Math.min(scaleByWidth, scaleByHeight, 1.5)
    this.adapt.cellSize = this.BASE_CELL_SIZE * finalScale
    
    console.log('🔢 [ScreenAdapter] 重新计算适配参数:', {
      cellSize: this.adapt.cellSize.toFixed(2),
      gameArea: `${(this.GRID_COLS * this.adapt.cellSize).toFixed(0)} × ${(this.GRID_ROWS * this.adapt.cellSize).toFixed(0)}`
    })
  }

  /**
   * ⭐ 获取游戏区域左上角坐标（保持原有计算逻辑）
   */
  getGameAreaOffset(): { x: number, y: number } {
    const gameWidth = this.GRID_COLS * this.adapt.cellSize
    const gameHeight = this.GRID_ROWS * this.adapt.cellSize
    const offsetX = (this.adapt.screenW - gameWidth) / 2
    const offsetY = this.adapt.safeTop + (this.adapt.screenH - this.adapt.safeTop - this.adapt.safeBottom - gameHeight) / 2
    
    return { x: offsetX, y: offsetY }
  }

  /**
   * ⭐ 获取网格线宽度（保持原有计算逻辑）
   */
  getGridLineWidth(): number {
    return Math.max(1, this.adapt.cellSize * 0.03)
  }

  /**
   * ⭐ 获取边框宽度（保持原有计算逻辑）
   */
  getBorderWidth(): number {
    return Math.max(2, this.adapt.cellSize * 0.06)
  }

  /**
   * ⭐ 获取粒子缩放系数（保持原有计算逻辑）
   */
  getParticleScale(): number {
    return this.adapt.cellSize / 50
  }
}
