/**
 * 🔧【可复用组件】屏幕适配器
 * 
 * 封装屏幕适配计算逻辑，自动计算 cellSize 和游戏区域位置。
 * 支持横屏/竖屏/正方形多种游戏布局。
 */

import type { AdaptParams } from '../types/game.types'

export { AdaptParams }

/**
 * ⭐ 屏幕适配器
 * 
 * @example
 * const adapter = new ScreenAdapter(720, 1280, 32, 18, 50)
 * adapter.calculateParams(containerWidth, containerHeight)
 * console.log(adapter.adapt.cellSize)
 */
export class ScreenAdapter {
  private readonly DESIGN_WIDTH: number
  private readonly DESIGN_HEIGHT: number
  private readonly GRID_COLS: number
  private readonly GRID_ROWS: number
  private readonly BASE_CELL_SIZE: number

  public readonly adapt: AdaptParams = {
    screenW:   0,
    screenH:   0,
    scale:     1,
    safeTop:   0,
    safeBottom: 0,
    cellSize:  0,
    gameAreaX: 0,
    gameAreaY: 0
  }

  /**
   * @param designWidth  设计宽度（美术基准，默认 720）
   * @param designHeight 设计高度（美术基准，默认 1280）
   * @param gridCols     网格列数（默认 32）
   * @param gridRows     网格行数（默认 18）
   * @param baseCellSize 基础单元格大小（像素，默认 50）
   */
  constructor(
    designWidth:  number = 720,
    designHeight: number = 1280,
    gridCols:     number = 32,
    gridRows:     number = 18,
    baseCellSize: number = 50
  ) {
    this.DESIGN_WIDTH  = designWidth
    this.DESIGN_HEIGHT = designHeight
    this.GRID_COLS     = gridCols
    this.GRID_ROWS     = gridRows
    this.BASE_CELL_SIZE = baseCellSize
  }

  /**
   * ⭐ 计算适配参数（在 Phaser preload() 或容器 resize 时调用）
   */
  calculateParams(containerWidth: number, containerHeight: number): void {
    this.adapt.screenW = containerWidth
    this.adapt.screenH = containerHeight

    // 缩放比
    this.adapt.scale = Math.min(
      this.adapt.screenW / this.DESIGN_WIDTH,
      this.adapt.screenH / this.DESIGN_HEIGHT
    )

    // 安全区域（手机刘海/手势条）
    this.adapt.safeTop    = Math.max(44, this.adapt.screenH * 0.05)
    this.adapt.safeBottom = Math.max(34, this.adapt.screenH * 0.08)

    // 计算动态 cellSize（确保游戏区域完全可见）
    const gameAreaWidth  = this.GRID_COLS * this.BASE_CELL_SIZE
    const gameAreaHeight = this.GRID_ROWS * this.BASE_CELL_SIZE

    const availableWidth  = (this.adapt.screenW - 20) * 0.95
    const availableHeight = (this.adapt.screenH - this.adapt.safeTop - this.adapt.safeBottom) * 0.9

    const scaleByWidth  = availableWidth  / gameAreaWidth
    const scaleByHeight = availableHeight / gameAreaHeight

    const finalScale        = Math.min(scaleByWidth, scaleByHeight, 1.5)
    this.adapt.cellSize     = this.BASE_CELL_SIZE * finalScale

    // 游戏区域居中偏移
    const actualGameWidth  = this.GRID_COLS * this.adapt.cellSize
    const actualGameHeight = this.GRID_ROWS * this.adapt.cellSize
    this.adapt.gameAreaX   = (this.adapt.screenW - actualGameWidth) / 2
    this.adapt.gameAreaY   = this.adapt.safeTop + (
      this.adapt.screenH - this.adapt.safeTop - this.adapt.safeBottom - actualGameHeight
    ) / 2

    console.log('[ScreenAdapter] ✅ 适配参数计算完成:', {
      screen:   `${this.adapt.screenW} × ${this.adapt.screenH}`,
      cellSize: this.adapt.cellSize.toFixed(2),
      gameArea: `${actualGameWidth.toFixed(0)} × ${actualGameHeight.toFixed(0)}`,
      offset:   `(${this.adapt.gameAreaX.toFixed(0)}, ${this.adapt.gameAreaY.toFixed(0)})`
    })
  }

  /**
   * ⭐ 重新计算（容器尺寸变化时调用）
   */
  recalculateParams(newWidth: number, newHeight: number): void {
    this.calculateParams(newWidth, newHeight)
  }

  /**
   * 获取游戏区域左上角坐标
   */
  getGameAreaOffset(): { x: number; y: number } {
    return { x: this.adapt.gameAreaX ?? 0, y: this.adapt.gameAreaY ?? 0 }
  }

  /** 获取网格线宽度 */
  getGridLineWidth(): number {
    return Math.max(1, this.adapt.cellSize * 0.03)
  }

  /** 获取边框宽度 */
  getBorderWidth(): number {
    return Math.max(2, this.adapt.cellSize * 0.06)
  }

  /** 获取粒子缩放系数 */
  getParticleScale(): number {
    return this.adapt.cellSize / 50
  }
}
