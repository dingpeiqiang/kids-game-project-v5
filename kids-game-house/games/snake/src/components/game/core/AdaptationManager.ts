// ============================================================================
// 🔧【可复用框架层】屏幕适配管理器 - 所有游戏通用
// ============================================================================
// 📌 说明：负责屏幕适配计算、安全区域管理、动态单元格大小计算
// ============================================================================

/**
 * ⭐ 适配参数接口
 * 📌 说明：所有游戏通用，直接复制
 */
export interface AdaptParams {
  screenW: number       // 设备真实宽度
  screenH: number       // 设备真实高度
  scale: number         // 全局动态缩放比
  safeTop: number       // 顶部安全区（避开刘海）
  safeBottom: number    // 底部安全区（避开手势条）
  cellSize: number      // 动态单元格大小
  gameAreaX: number     // 游戏区域左上角 X 坐标
  gameAreaY: number     // 游戏区域左上角 Y 坐标
}

/**
 * ⭐ 游戏网格配置接口
 * 📌 说明：根据具体游戏修改
 */
export interface GridConfig {
  cols: number      // 列数
  rows: number      // 行数
}

/**
 * ⭐ 设计基准配置接口
 * 📌 说明：所有游戏通用
 */
export interface DesignConfig {
  width: number     // 设计宽度
  height: number    // 设计高度
}

/**
 * ⭐ 屏幕适配管理器
 * 
 * 📌 说明：所有游戏通用，直接复制
 * 
 * 职责:
 *   1. 计算屏幕适配参数
 *   2. 管理安全区域（刘海屏、手势条）
 *   3. 动态计算单元格大小
 *   4. 响应屏幕尺寸变化
 */
export class AdaptationManager {
  private readonly _design: DesignConfig
  private readonly _grid: GridConfig
  private readonly _baseCellSize: number
  private readonly _maxScale: number
  
  private _adapt: AdaptParams

  /**
   * 构造函数
   * @param design 设计基准配置
   * @param grid 游戏网格配置
   * @param baseCellSize 基础单元格大小（像素）
   * @param maxScale 最大缩放倍数（默认 1.5）
   */
  constructor(
    design: DesignConfig = { width: 720, height: 1280 },
    grid: GridConfig = { cols: 32, rows: 18 },
    baseCellSize: number = 50,
    maxScale: number = 1.5
  ) {
    this._design = design
    this._grid = grid
    this._baseCellSize = baseCellSize
    this._maxScale = maxScale
    
    this._adapt = {
      screenW: 0,
      screenH: 0,
      scale: 1,
      safeTop: 0,
      safeBottom: 0,
      cellSize: 0,
      gameAreaX: 0,
      gameAreaY: 0
    }
  }

  /**
   * ⭐ 获取适配参数
   */
  get adapt(): AdaptParams {
    return this._adapt
  }

  /**
   * ⭐ 获取设计宽度
   */
  get designWidth(): number {
    return this._design.width
  }

  /**
   * ⭐ 获取设计高度
   */
  get designHeight(): number {
    return this._design.height
  }

  /**
   * ⭐ 获取网格列数
   */
  get gridCols(): number {
    return this._grid.cols
  }

  /**
   * ⭐ 获取网格行数
   */
  get gridRows(): number {
    return this._grid.rows
  }

  /**
   * ⭐ 获取当前单元格大小
   */
  get cellSize(): number {
    return this._adapt.cellSize
  }

  /**
   * ⭐ 计算适配参数（preload 阶段调用）
   * 
   * @param containerWidth 容器宽度
   * @param containerHeight 容器高度
   */
  calculateParams(containerWidth: number, containerHeight: number): void {
    console.log('🔍 [AdaptationManager] 开始计算适配参数...')
    
    // 1. 从 DOM 元素获取真实屏幕尺寸
    this._adapt.screenW = containerWidth
    this._adapt.screenH = containerHeight

    console.log('📏 [AdaptationManager] 设备真实尺寸:', `${this._adapt.screenW} × ${this._adapt.screenH}`)

    // 2. 计算最佳缩放比（自动匹配屏幕，不变形）
    this._adapt.scale = Math.min(
      this._adapt.screenW / this._design.width,
      this._adapt.screenH / this._design.height
    )

    // 3. 计算安全区域（手机刘海/底部手势条）
    this._adapt.safeTop = Math.max(44, this._adapt.screenH * 0.05)
    this._adapt.safeBottom = Math.max(34, this._adapt.screenH * 0.08)

    // 4. 计算动态单元格大小（保证游戏区域完全显示）
    const gameAreaWidth = this._grid.cols * this._baseCellSize
    const gameAreaHeight = this._grid.rows * this._baseCellSize
    
    // 可用空间（减去安全区域和边距）
    const availableWidth = (this._adapt.screenW - 20) * 0.95  // 留 5% 边距
    const availableHeight = (this._adapt.screenH - this._adapt.safeTop - this._adapt.safeBottom) * 0.9
    
    console.log('📐 [AdaptationManager] 可用空间:', {
      width: availableWidth.toFixed(0),
      height: availableHeight.toFixed(0)
    })
    
    const scaleByWidth = availableWidth / gameAreaWidth
    const scaleByHeight = availableHeight / gameAreaHeight
    
    console.log('🔢 [AdaptationManager] 缩放系数:', {
      byWidth: scaleByWidth.toFixed(3),
      byHeight: scaleByHeight.toFixed(3)
    })
    
    const finalScale = Math.min(scaleByWidth, scaleByHeight, this._maxScale)
    this._adapt.cellSize = this._baseCellSize * finalScale
    
    const actualGameWidth = this._grid.cols * this._adapt.cellSize
    const actualGameHeight = this._grid.rows * this._adapt.cellSize
    
    console.log('🎯 [AdaptationManager] 最终游戏区域:', {
      cellSize: this._adapt.cellSize.toFixed(2),
      size: `${actualGameWidth.toFixed(0)} × ${actualGameHeight.toFixed(0)}`,
      fitsInScreen: actualGameWidth <= this._adapt.screenW && 
                    actualGameHeight <= (this._adapt.screenH - this._adapt.safeTop - this._adapt.safeBottom)
    })

    console.log('✅ [AdaptationManager] 自动计算适配参数完成', {
      screen: `${this._adapt.screenW} × ${this._adapt.screenH}`,
      scale: this._adapt.scale.toFixed(3),
      safeArea: `top=${this._adapt.safeTop.toFixed(0)}, bottom=${this._adapt.safeBottom.toFixed(0)}`,
      cellSize: this._adapt.cellSize.toFixed(2),
      gameArea: `${actualGameWidth.toFixed(0)} × ${actualGameHeight.toFixed(0)}`
    })
  }

  /**
   * ⭐ 重新计算适配参数（resize 时调用）
   * 
   * @param newWidth 新的宽度
   * @param newHeight 新的高度
   */
  recalculateParams(newWidth: number, newHeight: number): void {
    console.log('🔄 [AdaptationManager] 屏幕尺寸变化，重新计算适配参数...')
    
    // 1. 更新屏幕尺寸
    this._adapt.screenW = newWidth
    this._adapt.screenH = newHeight

    // 2. 重新计算安全区域（保持与 calculateParams 一致）
    this._adapt.safeTop = Math.max(44, this._adapt.screenH * 0.05)
    this._adapt.safeBottom = Math.max(34, this._adapt.screenH * 0.08)

    // 3. 重新计算单元格大小
    const gameAreaWidth = this._grid.cols * this._baseCellSize
    const gameAreaHeight = this._grid.rows * this._baseCellSize
    
    const availableWidth = (this._adapt.screenW - 20) * 0.95
    const availableHeight = (this._adapt.screenH - this._adapt.safeTop - this._adapt.safeBottom) * 0.9
    
    const scaleByWidth = availableWidth / gameAreaWidth
    const scaleByHeight = availableHeight / gameAreaHeight
    
    const finalScale = Math.min(scaleByWidth, scaleByHeight, this._maxScale)
    this._adapt.cellSize = this._baseCellSize * finalScale
    
    console.log('🔢 [AdaptationManager] 重新计算适配参数:', {
      cellSize: this._adapt.cellSize.toFixed(2),
      gameArea: `${(this._grid.cols * this._adapt.cellSize).toFixed(0)} × ${(this._grid.rows * this._adapt.cellSize).toFixed(0)}`
    })
  }

  /**
   * ⭐ 获取游戏区域位置和尺寸
   * 
   * @returns 游戏区域信息
   */
  getGameArea(): { x: number, y: number, width: number, height: number } {
    const gameWidth = this._grid.cols * this._adapt.cellSize
    const gameHeight = this._grid.rows * this._adapt.cellSize
    const offsetX = (this._adapt.screenW - gameWidth) / 2
    const offsetY = this._adapt.safeTop + (this._adapt.screenH - this._adapt.safeTop - this._adapt.safeBottom - gameHeight) / 2
    
    return {
      x: offsetX,
      y: offsetY,
      width: gameWidth,
      height: gameHeight
    }
  }

  /**
   * ⭐ 获取网格线样式参数
   * 
   * @returns 网格线宽度
   */
  getGridLineWidth(): number {
    // 网格线粗细 = cellSize 的 3%，最小 1px
    return Math.max(1, this._adapt.cellSize * 0.03)
  }

  /**
   * ⭐ 获取边框样式参数
   * 
   * @returns 边框宽度
   */
  getBorderWidth(): number {
    // 边框粗细 = cellSize 的 6%，最小 2px
    return Math.max(2, this._adapt.cellSize * 0.06)
  }

  /**
   * ⭐ 获取粒子缩放系数
   * 
   * @returns 粒子缩放比例
   */
  getParticleScale(): number {
    return this._adapt.cellSize / 50
  }

  /**
   * ⭐ 打印调试信息
   */
  printDebugInfo(): void {
    console.log('🎮 [AdaptationManager] 游戏显示参数:', {
      gridCols: this._grid.cols,
      gridRows: this._grid.rows,
      cellSize: this._adapt.cellSize.toFixed(2),
      gameAreaSize: `${(this._grid.cols * this._adapt.cellSize).toFixed(0)} × ${(this._grid.rows * this._adapt.cellSize).toFixed(0)}`,
      offset: `x=${((this._adapt.screenW - this._grid.cols * this._adapt.cellSize) / 2).toFixed(1)}, y=${this._adapt.safeTop.toFixed(1)}`
    })
  }
}
