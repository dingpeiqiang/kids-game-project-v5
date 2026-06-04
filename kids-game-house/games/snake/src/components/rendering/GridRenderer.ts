// ============================================================================
// 🎨 网格渲染组件
// ============================================================================
// 
// 📌 说明:
//   负责渲染游戏网格线
//   支持自定义网格密度和线条样式
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'

/**
 * 网格渲染组件参数
 */
interface GridRendererParams {
  /** 单元格大小（像素） */
  cellSize: number
  /** 网格列数 */
  gridCols: number
  /** 网格行数 */
  gridRows: number
  /** 屏幕宽度 */
  screenWidth: number
  /** 屏幕高度 */
  screenHeight: number
  /** 安全区域顶部 */
  safeTop: number
  /** 安全区域底部 */
  safeBottom: number
  /** 网格线颜色（十六进制） */
  lineColor?: number
  /** 网格线透明度（0-1） */
  lineAlpha?: number
}

/**
 * 网格渲染组件类
 * 
 * @remarks
 * 职责：
 * - 绘制游戏区域网格线
 * - 响应主题切换事件重新渲染
 * - 支持动态调整网格密度
 * 
 * @example
 * ```typescript
 * const gridRenderer = new GridRenderer(scene)
 * container.add(gridRenderer)
 * 
 * gridRenderer.init({
 *   cellSize: 40,
 *   gridCols: 32,
 *   gridRows: 18,
 *   screenWidth: 720,
 *   screenHeight: 1280
 * })
 * ```
 */
export class GridRenderer extends ComponentBase {
  /** 网格图形对象 */
  private gridGraphics: Phaser.GameObjects.Graphics | null = null
  
  /** 当前参数 */
  private params: GridRendererParams | null = null
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'grid_renderer', '网格渲染器')
  }
  
  /**
   * 初始化网格渲染器
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as GridRendererParams
    this.renderGrid()
    
    console.log(`✅ [GridRenderer] 网格渲染器初始化完成`)
  }
  
  /**
   * 销毁网格渲染器
   */
  public destroy(): void {
    super.destroy()
    
    if (this.gridGraphics) {
      this.gridGraphics.destroy()
      this.gridGraphics = null
    }
    
    console.log(`🗑️ [GridRenderer] 网格渲染器已销毁`)
  }
  
  /**
   * 重新渲染网格
   * 
   * @public
   */
  public rerender(): void {
    if (this.params) {
      this.renderGrid()
    }
  }
  
  /**
   * 渲染网格（主方法）
   * 
   * @private
   */
  private renderGrid(): void {
    if (!this.params || !this.scene) {
      console.warn('⚠️ [GridRenderer] 无法渲染网格：参数或场景未初始化')
      return
    }
    
    // 清理旧网格
    if (this.gridGraphics) {
      this.gridGraphics.destroy()
    }
    
    const {
      cellSize,
      gridCols,
      gridRows,
      screenWidth,
      screenHeight,
      safeTop,
      safeBottom,
      lineColor = 0xffffff,
      lineAlpha = 0.05
    } = this.params
    
    // 创建新的图形对象
    this.gridGraphics = this.scene.add.graphics()
    
    // 计算游戏区域尺寸和位置
    const gameWidth = gridCols * cellSize
    const gameHeight = gridRows * cellSize
    const offsetX = (screenWidth - gameWidth) / 2
    const offsetY = safeTop + (screenHeight - safeTop - safeBottom - gameHeight) / 2
    
    // 设置线条样式
    const lineWidth = Math.max(1, cellSize * 0.03)
    this.gridGraphics.lineStyle(lineWidth, lineColor, lineAlpha)
    
    // 绘制垂直网格线
    for (let i = 1; i < gridCols; i++) {
      const x = offsetX + i * cellSize
      this.gridGraphics.moveTo(x, offsetY)
      this.gridGraphics.lineTo(x, offsetY + gameHeight)
    }
    
    // 绘制水平网格线
    for (let j = 1; j < gridRows; j++) {
      const y = offsetY + j * cellSize
      this.gridGraphics.moveTo(offsetX, y)
      this.gridGraphics.lineTo(offsetX + gameWidth, y)
    }
    
    // 描边路径
    this.gridGraphics.strokePath()
    
    // 设置深度（在其他背景之上，游戏对象之下）
    this.gridGraphics.setDepth(1)
    
    console.log(`🔲 [GridRenderer] 网格渲染完成：${gridCols}x${gridRows} 单元格`)
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
        // 需要重新渲染网格
        this.rerender()
        break
        
      default:
        // 忽略其他事件
        break
    }
  }
}
