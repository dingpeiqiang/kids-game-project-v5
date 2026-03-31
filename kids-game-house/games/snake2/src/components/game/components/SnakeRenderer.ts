// ============================================================================
// 🎨【游戏特定层】蛇渲染组件 - 贪吃蛇游戏示例
// ============================================================================
// 📌 说明：封装原有的 renderSnake() 和 createSnakeHead() 方法，保持逻辑不变
// ⚠️ 注意：这是游戏特定的渲染组件，其他游戏需要实现自己的渲染器
// ============================================================================

/**
 * ⭐ 蛇分段类型定义 (兼容原有代码)
 */
export interface SnakeSegment {
  x: number
  y: number
}

/**
 * ⭐ 蛇渲染组件
 * 
 * 📌 说明：封装原有的 renderSnake() 和 createSnakeHead() 方法
 * 
 * 使用方式:
 * ```typescript
 * const renderer = new SnakeRenderer(scene, snakeGroup, adaptParams)
 * renderer.renderSnake(snake, headRotation)
 * ```
 */
export class SnakeRenderer {
  private scene: Phaser.Scene | null = null
  private snakeGroup: Phaser.GameObjects.Group | null = null
  private adaptParams: any

  /**
   * 构造函数
   * @param scene Phaser 场景对象
   * @param snakeGroup 蛇群组
   * @param adaptParams 适配参数 (包含 screenW, screenH, cellSize, safeTop, safeBottom 等)
   */
  constructor(
    scene: Phaser.Scene | null,
    snakeGroup: Phaser.GameObjects.Group | null,
    adaptParams: any
  ) {
    this.scene = scene
    this.snakeGroup = snakeGroup
    this.adaptParams = adaptParams
  }

  /**
   * ⭐ 渲染蛇 - 贪吃蛇游戏核心渲染方法 (保持原有逻辑不变)
   * 
   * @param snake 蛇身数组
   * @param headRotation 蛇头旋转角度（弧度）
   */
  renderSnake(snake: SnakeSegment[], headRotation: number = 0): void {
    if (!this.scene || !this.snakeGroup) return

    const scene = this.scene
    const group = this.snakeGroup
    const cellSize = this.adaptParams.cellSize

    // 计算游戏区域偏移 (保持原有计算逻辑)
    const gameWidth = 32 * cellSize  // GRID_COLS = 32
    const gameHeight = 18 * cellSize // GRID_ROWS = 18
    const offsetX = (this.adaptParams.screenW - gameWidth) / 2
    const offsetY = this.adaptParams.safeTop + (this.adaptParams.screenH - this.adaptParams.safeTop - this.adaptParams.safeBottom - gameHeight) / 2

    // 清除旧的蛇 (保持原有逻辑)
    group.clear(true, true)

    // 绘制蛇身 (保持原有遍历逻辑)
    snake.forEach((segment, index) => {
      // 👉 segment.x 已经是中心点坐标，直接加上 offsetX 即可
      const x = offsetX + segment.x
      const y = offsetY + segment.y
      // 蛇身大小 = cellSize 的 70%，留出明显间隙（配合距离约束）
      const size = cellSize * 0.70

      if (index === 0) {
        // 蛇头 - 直接使用 GTRS key "snake_head"
        const headKey = this.getThemeAssetKey('snake_head')
        if (headKey) {
          const sprite = scene.add.image(x, y, headKey)
          const displaySize = Math.max(size, 16)
          sprite.setDisplaySize(displaySize, displaySize)
          // 👉 应用旋转角度（转换为度数，Phaser 使用度数）
          sprite.setRotation(headRotation)
          group.add(sprite)
        } else {
          this.createSnakeHead(scene, x, y, size)
        }
      } else if (index === snake.length - 1) {
        // 蛇尾 - 直接使用 GTRS key "snake_tail"
        const tailKey = this.getThemeAssetKey('snake_tail')
        if (tailKey) {
          const sprite = scene.add.image(x, y, tailKey)
          const displaySize = Math.max(size * 0.7, 16)  // 蛇尾更小，渐变效果
          sprite.setDisplaySize(displaySize, displaySize)
          group.add(sprite)
        } else {
          // 蛇尾 - 渐变透明效果
          const alpha = 1 - (index / snake.length) * 0.5
          const color = this.getThemeColor('snakeBody', 0x4ade80)
          const circle = scene.add.circle(x, y, size / 2 * 0.9, color, alpha)
          group.add(circle)
        }
      } else {
        // 蛇身 - 直接使用 GTRS key "snake_body"
        const bodyKey = this.getThemeAssetKey('snake_body')
        if (bodyKey) {
          const sprite = scene.add.image(x, y, bodyKey)
          const displaySize = Math.max(size * 0.9, 16)
          sprite.setDisplaySize(displaySize, displaySize)
          group.add(sprite)
        } else {
          // 蛇身 - 渐变透明效果
          const alpha = 1 - (index / snake.length) * 0.5
          const color = this.getThemeColor('snakeBody', 0x4ade80)
          const circle = scene.add.circle(x, y, size / 2, color, alpha)
          group.add(circle)
        }
      }
    })
  }

  /**
   * ⭐ 创建蛇头 - 贪吃蛇游戏特定渲染辅助方法 (保持原有逻辑不变)
   * 
   * @param scene Phaser 场景对象
   * @param x X 坐标
   * @param y Y 坐标
   * @param size 大小
   */
  private createSnakeHead(scene: Phaser.Scene, x: number, y: number, size: number): void {
    const graphics = scene.add.graphics()
    
    // 头部圆形 (保持原有逻辑)
    graphics.fillStyle(0x22c55e, 1)
    graphics.fillCircle(x, y, size / 2)
    
    // 眼睛 - 按头部大小比例 (保持原有比例)
    const eyeSize = size * 0.18  // 眼睛占头部 18%
    const eyeOffset = size * 0.25  // 眼睛间距 25%
    graphics.fillStyle(0xffffff, 1)
    graphics.fillCircle(x - eyeOffset, y - eyeOffset * 0.3, eyeSize)
    graphics.fillCircle(x + eyeOffset, y - eyeOffset * 0.3, eyeSize)
    
    // 瞳孔 - 按眼睛比例 (保持原有逻辑)
    graphics.fillStyle(0x000000, 1)
    graphics.fillCircle(x - eyeOffset, y - eyeOffset * 0.3, eyeSize * 0.5)
    graphics.fillCircle(x + eyeOffset, y - eyeOffset * 0.3, eyeSize * 0.5)
    
    // 舌头 - 按头部比例 (保持原有逻辑)
    const tongueWidth = size * 0.3
    graphics.lineStyle(size * 0.08, 0xef4444, 1)
    graphics.moveTo(x + size * 0.3, y)
    graphics.lineTo(x + size * 0.5, y)
    
    // 将图形添加到群组并保存引用以便后续清理
    this.snakeGroup?.add(graphics)
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
   * ⭐ 获取主题颜色 (辅助方法)
   */
  private getThemeColor(colorType: string, defaultColor: number): number {
    // TODO: 需要从外部传入主题颜色或提供获取方法
    return defaultColor
  }

  /**
   * ⭐ 更新场景引用 (用于 resize 后重新绑定)
   */
  setScene(scene: Phaser.Scene): void {
    this.scene = scene
  }

  /**
   * ⭐ 更新蛇群组引用 (用于 resize 后重新绑定)
   */
  setSnakeGroup(snakeGroup: Phaser.GameObjects.Group): void {
    this.snakeGroup = snakeGroup
  }

  /**
   * ⭐ 更新适配参数 (用于 resize 后重新计算)
   */
  setAdaptParams(adaptParams: any): void {
    this.adaptParams = adaptParams
  }
}
