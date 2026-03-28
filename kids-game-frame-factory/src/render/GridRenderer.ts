// ============================================================================
// 🔲 网格渲染组件
// ============================================================================
// 
// 📌 说明:
//   负责渲染游戏网格系统
//   支持自定义颜色、线宽、透明度
//   提供高亮、动画等视觉效果
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import type Phaser from 'phaser'
import type { GridPosition } from '../types/common'

/**
 * ⭐ 单元格状态接口
 */
interface CellState {
  /** 网格坐标 */
  gridPos: GridPosition
  /** 是否高亮 */
  highlighted: boolean
  /** 高亮颜色 */
  highlightColor?: number
  /** 是否禁用 */
  disabled: boolean
  /** 自定义颜色 */
  customColor?: number
  /** 透明度 */
  alpha: number
}

/**
 * ⭐ 网格渲染配置接口
 */
interface GridRendererConfig {
  /** 网格列数 */
  cols: number
  /** 网格行数 */
  rows: number
  /** 单元格大小（像素） */
  cellSize: number
  /** 网格线颜色 */
  lineColor: number
  /** 网格线宽度 */
  lineWidth: number
  /** 背景颜色 */
  backgroundColor: number
  /** 背景透明度 */
  backgroundAlpha: number
  /** 是否显示坐标（可选，默认 false） */
  showCoordinates?: boolean
  /** 坐标文本样式（可选） */
  coordinateStyle?: Phaser.Types.GameObjects.Text.TextStyle
  /** 高亮颜色（可选） */
  highlightColor?: number
  /** 禁用颜色（可选） */
  disableColor?: number
}

/**
 * ⭐ 网格渲染组件参数
 */
interface GridRendererParams {
  /** 网格配置（必须） */
  grid: GridRendererConfig
  /** 是否自动渲染（可选，默认 true） */
  autoRender?: boolean
  /** 是否启用高亮（可选，默认 true） */
  enableHighlight?: boolean
  /** 是否启用动画（可选，默认 true） */
  enableAnimation?: boolean
}

/**
 * ⭐ 网格渲染组件类
 * 
 * @remarks
 * 职责：
 * - 渲染游戏网格
 * - 管理单元格状态
 * - 高亮效果
 * - 坐标显示
 * 
 * @example
 * ```typescript
 * const gridRenderer = new GridRenderer(scene)
 * gridRenderer.init({
 *   grid: {
 *     cols: 32,
 *     rows: 18,
 *     cellSize: 40,
 *     lineColor: 0x444444,
 *     lineWidth: 1,
 *     backgroundColor: 0x1a1a1a,
 *     backgroundAlpha: 0.8
 *   },
 *   enableHighlight: true,
 *   enableAnimation: true
 * })
 * 
 * // 高亮单元格
 * gridRenderer.highlightCell({ x: 5, y: 3 }, 0x00ff00)
 * 
 * // 清除高亮
 * gridRenderer.clearHighlight()
 * ```
 */
export class GridRenderer extends ComponentBase {
  /** 当前配置 */
  private config: GridRendererConfig | null = null
  
  /** 单元格状态映射表 */
  private cellStates: Map<string, CellState> = new Map()
  
  /** 网格图形对象 */
  private gridGraphics: Phaser.GameObjects.Graphics | null = null
  
  /** 高亮图形对象 */
  private highlightGraphics: Phaser.GameObjects.Graphics | null = null
  
  /** 坐标文本组 */
  private coordinateTexts: Phaser.GameObjects.Text[] = []
  
  /** 当前参数 */
  private params: GridRendererParams | null = null
  
  /** 当前高亮的单元格 */
  private currentHighlight: GridPosition | null = null
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'grid_renderer', '网格渲染器')
  }
  
  /**
   * ⭐ 初始化网格渲染组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as GridRendererParams
    
    // 设置默认值
    if (this.params.autoRender === undefined) {
      this.params.autoRender = true
    }
    if (this.params.enableHighlight === undefined) {
      this.params.enableHighlight = true
    }
    if (this.params.enableAnimation === undefined) {
      this.params.enableAnimation = true
    }
    
    this.config = this.params.grid
    
    // 自动渲染网格
    if (this.params.autoRender) {
      this.renderGrid()
    }
    
    console.log(`✅ [GridRenderer] 网格渲染器初始化完成`)
    console.log(`   网格大小：${this.config.cols}x${this.config.rows}`)
    console.log(`   单元格：${this.config.cellSize}px`)
  }
  
  /**
   * ⭐ 每帧更新（处理动画）
   * 
   * @param deltaTime - 距离上一帧的时间间隔（毫秒）
   */
  public update(_deltaTime: number): void {
    if (!this.enabled) return
    
    // 可以在这里处理高亮动画
    if (this.params?.enableAnimation && this.currentHighlight) {
      // 闪烁动画等
    }
  }
  
  /**
   * ⭐ 渲染网格
   */
  public renderGrid(): void {
    if (!this.config) return
    
    const width = this.config.cols * this.config.cellSize
    const height = this.config.rows * this.config.cellSize
    
    // 清除旧的图形
    this.clearAll()
    
    // 创建背景
    this.gridGraphics = this.scene.add.graphics()
    this.gridGraphics.fillStyle(this.config.backgroundColor, this.config.backgroundAlpha)
    this.gridGraphics.fillRect(0, 0, width, height)
    this.gridGraphics.setDepth(-999)
    
    // 绘制网格线
    this.drawGridLines(width, height)
    
    // 显示坐标（如果需要）
    if (this.config.showCoordinates) {
      this.drawCoordinates()
    }
    
    console.log(`🔲 [GridRenderer] 网格渲染完成`)
  }
  
  /**
   * ⭐ 高亮指定单元格
   * 
   * @param gridPos - 网格坐标
   * @param color - 高亮颜色（可选，使用默认高亮色）
   * @param alpha - 透明度（可选，默认 0.5）
   */
  public highlightCell(gridPos: GridPosition, color?: number, alpha: number = 0.5): void {
    if (!this.params?.enableHighlight || !this.config) return
    
    // 清除之前的高亮
    this.clearHighlight()
    
    // 保存当前高亮位置
    this.currentHighlight = { ...gridPos }
    
    // 创建或获取高亮图形
    if (!this.highlightGraphics) {
      this.highlightGraphics = this.scene.add.graphics()
      this.highlightGraphics.setDepth(-998)
    }
    
    const highlightColor = color ?? this.config.highlightColor ?? 0x00ff00
    const x = gridPos.col * this.config.cellSize
    const y = gridPos.row * this.config.cellSize
    
    this.highlightGraphics.fillStyle(highlightColor, alpha)
    this.highlightGraphics.fillRect(x, y, this.config.cellSize, this.config.cellSize)
    
    // 更新单元格状态
    this.updateCellState(gridPos, { highlighted: true, highlightColor: color })
  }
  
  /**
   * ⭐ 清除高亮
   */
  public clearHighlight(): void {
    if (this.highlightGraphics) {
      this.highlightGraphics.clear()
    }
    
    this.currentHighlight = null
    
    // 清除所有单元格的高亮状态
    this.cellStates.forEach(state => {
      state.highlighted = false
      state.highlightColor = undefined
    })
  }
  
  /**
   * ⭐ 设置单元格颜色
   * 
   * @param gridPos - 网格坐标
   * @param color - 颜色
   * @param alpha - 透明度（可选，默认 1）
   */
  public setCellColor(gridPos: GridPosition, color: number, alpha: number = 1): void {
    if (!this.config) return
    
    this.updateCellState(gridPos, { customColor: color, alpha })
    
    // 立即重绘该单元格
    this.redrawCell(gridPos)
  }
  
  /**
   * ⭐ 重置单元格颜色
   * 
   * @param gridPos - 网格坐标
   */
  public resetCellColor(gridPos: GridPosition): void {
    this.updateCellState(gridPos, { customColor: undefined, alpha: 1 })
    this.redrawCell(gridPos)
  }
  
  /**
   * ⭐ 禁用单元格
   * 
   * @param gridPos - 网格坐标
   */
  public disableCell(gridPos: GridPosition): void {
    this.updateCellState(gridPos, { disabled: true })
    this.redrawCell(gridPos)
  }
  
  /**
   * ⭐ 启用单元格
   * 
   * @param gridPos - 网格坐标
   */
  public enableCell(gridPos: GridPosition): void {
    this.updateCellState(gridPos, { disabled: false })
    this.redrawCell(gridPos)
  }
  
  /**
   * ⭐ 获取单元格状态
   * 
   * @param gridPos - 网格坐标
   * @returns 单元格状态
   */
  public getCellState(gridPos: GridPosition): CellState | undefined {
    const key = this.getCellKey(gridPos)
    return this.cellStates.get(key)
  }
  
  /**
   * ⭐ 清除所有单元格状态
   */
  public clearAllCellStates(): void {
    this.cellStates.clear()
    this.renderGrid()  // 重新渲染网格
  }
  
  /**
   * ⭐ 销毁组件
   */
  public destroy(): void {
    this.clearAll()
    super.destroy()
  }
  
  /**
   * ⭐ 重新渲染网格
   */
  public rerender(): void {
    this.renderGrid()
  }
  
  /**
   * ⭐ 清除所有图形和文本
   * 
   * @protected
   */
  protected clearAll(): void {
    if (this.gridGraphics) {
      this.gridGraphics.destroy()
      this.gridGraphics = null
    }
    
    if (this.highlightGraphics) {
      this.highlightGraphics.destroy()
      this.highlightGraphics = null
    }
    
    this.coordinateTexts.forEach(text => text.destroy())
    this.coordinateTexts = []
  }
  
  /**
   * ⭐ 绘制网格线
   * 
   * @param width - 网格总宽度
   * @param height - 网格总高度
   * @protected
   */
  protected drawGridLines(width: number, height: number): void {
    if (!this.config || !this.gridGraphics) return
    
    const lineColor = this.config.lineColor
    const lineWidth = this.config.lineWidth
    
    this.gridGraphics.lineStyle(lineWidth, lineColor, 1)
    
    // 绘制垂直线
    for (let x = 0; x <= width; x += this.config.cellSize) {
      this.gridGraphics.lineBetween(x, 0, x, height)
    }
    
    // 绘制水平线
    for (let y = 0; y <= height; y += this.config.cellSize) {
      this.gridGraphics.lineBetween(0, y, width, y)
    }
  }
  
  /**
   * ⭐ 绘制坐标文本
   * 
   * @protected
   */
  protected drawCoordinates(): void {
    if (!this.config || !this.gridGraphics) return
    
    const defaultStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '10px',
      color: '#888888',
      fontStyle: 'italic'
    }
    
    const style = this.config.coordinateStyle ?? defaultStyle
    
    // 在每个单元格中心显示坐标
    for (let col = 0; col < this.config.cols; col++) {
      for (let row = 0; row < this.config.rows; row++) {
        const x = col * this.config.cellSize + this.config.cellSize / 2
        const y = row * this.config.cellSize + this.config.cellSize / 2
        
        const text = this.scene.add.text(x, y, `(${col},${row})`, style)
        text.setOrigin(0.5)
        text.setDepth(-997)
        
        this.coordinateTexts.push(text)
      }
    }
  }
  
  /**
   * ⭐ 重绘单个单元格
   * 
   * @param gridPos - 网格坐标
   * @protected
   */
  protected redrawCell(gridPos: GridPosition): void {
    if (!this.config || !this.gridGraphics) return
    
    const state = this.getCellState(gridPos)
    if (!state) return
    
    // 清除旧的高亮（如果有）
    if (this.highlightGraphics && this.currentHighlight) {
      this.highlightGraphics.clear()
      
      // 如果还有高亮，重新绘制
      if (state.highlighted && this.currentHighlight) {
        const highlightColor = state.highlightColor ?? this.config.highlightColor ?? 0x00ff00
        this.highlightGraphics.fillStyle(highlightColor, state.alpha)
        this.highlightGraphics.fillRect(
          this.currentHighlight.col * this.config.cellSize,
          this.currentHighlight.row * this.config.cellSize,
          this.config.cellSize,
          this.config.cellSize
        )
      }
    }
  }
  
  /**
   * ⭐ 更新单元格状态
   * 
   * @param gridPos - 网格坐标
   * @param updates - 状态更新
   * @protected
   */
  protected updateCellState(gridPos: GridPosition, updates: Partial<CellState>): void {
    const key = this.getCellKey(gridPos)
    let state = this.cellStates.get(key)
    
    if (!state) {
      // 创建新状态
      state = {
        gridPos: { ...gridPos },
        highlighted: false,
        disabled: false,
        alpha: 1
      }
      this.cellStates.set(key, state)
    }
    
    // 应用更新
    Object.assign(state, updates)
  }
  
  /**
   * ⭐ 生成单元格键名
   * 
   * @param gridPos - 网格坐标
   * @returns 键名字符串
   * @protected
   */
  protected getCellKey(gridPos: GridPosition): string {
    return `${gridPos.col}_${gridPos.row}`
  }
  
  /**
   * ⭐ 处理事件（实现基类的抽象方法）
   * 
   * @param event - 游戏事件
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    // 可以响应游戏事件来改变网格显示
    switch (event.type) {
      case GameEventType.GAME_START:
        // 游戏开始时恢复正常显示
        this.clearHighlight()
        break
        
      case GameEventType.PAUSE:
        // 暂停时变暗网格
        if (this.gridGraphics) {
          this.scene.tweens.add({
            targets: this.gridGraphics,
            alpha: 0.3,
            duration: 300,
            ease: 'Power2'
          })
        }
        break
        
      case GameEventType.RESUME:
        // 恢复时恢复正常
        if (this.gridGraphics) {
          this.scene.tweens.add({
            targets: this.gridGraphics,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
          })
        }
        break
    }
  }
}
