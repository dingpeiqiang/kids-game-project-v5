// ============================================================================
// 🎨【游戏特定层】食物渲染组件 - 贪吃蛇游戏示例
// ============================================================================
// 📌 说明：封装原有的 renderFood() 方法，保持逻辑不变
// ⚠️ 注意：这是游戏特定的渲染组件，其他游戏需要实现自己的渲染器
// ============================================================================

/**
 * ⭐ 食物类型枚举 (兼容原有代码)
 */
export type FoodType = 'apple' | 'banana' | 'cherry' | 'coin'

/**
 * ⭐ 食物对象接口 (兼容原有代码)
 */
export interface Food {
  type: FoodType
  position: {
    x: number
    y: number
  }
}

/**
 * ⭐ 食物渲染组件
 * 
 * 📌 说明：封装原有的 renderFood() 方法
 * 
 * 使用方式:
 * ```typescript
 * const renderer = new FoodRenderer(scene, adaptParams)
 * renderer.renderFood(food)
 * ```
 */
export class FoodRenderer {
  private scene: Phaser.Scene | null = null
  private foodSprite: Phaser.GameObjects.Image | null = null
  private adaptParams: any

  /**
   * 构造函数
   * @param scene Phaser 场景对象
   * @param adaptParams 适配参数 (包含 screenW, screenH, cellSize, safeTop, safeBottom 等)
   */
  constructor(
    scene: Phaser.Scene | null,
    adaptParams: any
  ) {
    this.scene = scene
    this.adaptParams = adaptParams
  }

  /**
   * ⭐ 渲染食物 - 贪吃蛇游戏核心渲染方法 (保持原有逻辑不变)
   * 
   * @param food 食物对象
   */
  renderFood(food: Food | null): void {
    if (!this.scene || !food) {
      this.foodSprite?.destroy()
      this.foodSprite = null
      return
    }

    const scene = this.scene
    const cellSize = this.adaptParams.cellSize

    // 计算游戏区域偏移 (保持原有计算逻辑)
    const gameWidth = 32 * cellSize  // GRID_COLS = 32
    const gameHeight = 18 * cellSize // GRID_ROWS = 18
    const offsetX = (this.adaptParams.screenW - gameWidth) / 2
    const offsetY = this.adaptParams.safeTop + (this.adaptParams.screenH - this.adaptParams.safeTop - this.adaptParams.safeBottom - gameHeight) / 2

    const x = offsetX + food.position.x  // 👉 position 已经是中心点，直接加 offsetX
    const y = offsetY + food.position.y
    // 食物主体大小 = cellSize 的 85%，更好地填充网格
    const baseSize = cellSize * 0.85

    // 清除旧的食物精灵 (保持原有逻辑)
    if (this.foodSprite) {
      this.foodSprite.destroy()
    }

    // ⭐ 尝试使用 GTRS 食物图片 (保持原有逻辑)
    const foodKey = this.getThemeAssetKey('food', food.type)
    if (foodKey) {
      // 使用主题食物资源
      const sprite = scene.add.image(x, y, foodKey)
      const displaySize = Math.max(baseSize, 16)
      sprite.setDisplaySize(displaySize, displaySize)

      // 添加动画效果（轻微缩放）(保持原有动画逻辑)
      scene.tweens.add({
        targets: sprite,
        scaleX: displaySize * 1.1 / displaySize,
        scaleY: displaySize * 1.1 / displaySize,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      this.foodSprite = sprite
      return
    }

    // 默认绘制（程序化生成，仅当主题未提供食物图片时）(保持原有逻辑)
    const color = this.getThemeColor('food', 0xfbbf24)

    // 创建食物图形
    const graphics = scene.add.graphics()

    // 发光效果 - 按 baseSize 比例
    graphics.fillStyle(color, 0.3)
    graphics.fillCircle(x, y, baseSize)

    // 主体
    graphics.fillStyle(color, 1)

    if (food.type === 'apple') {
      // 苹果 (保持原有绘制逻辑)
      graphics.fillCircle(x, y, baseSize * 0.5)
      // 梗 - 按比例缩放
      const stemLength = baseSize * 0.3
      graphics.lineStyle(baseSize * 0.12, 0x8b4513, 1)
      graphics.moveTo(x, y - baseSize * 0.5)
      graphics.lineTo(x, y - baseSize * 0.5 - stemLength)
    } else if (food.type === 'banana') {
      // 香蕉 - 简单表示为椭圆形 (保持原有逻辑)
      graphics.fillStyle(0xfbbf24, 1)
      graphics.fillEllipse(x, y, baseSize * 0.8, baseSize * 0.5)
    } else if (food.type === 'cherry') {
      // 樱桃 - 两个圆形 (保持原有逻辑)
      graphics.fillStyle(0xef4444, 1)
      graphics.fillCircle(x - baseSize * 0.2, y, baseSize * 0.3)
      graphics.fillCircle(x + baseSize * 0.2, y, baseSize * 0.3)
      // 梗
      graphics.lineStyle(baseSize * 0.08, 0x22c55e, 1)
      graphics.moveTo(x, y - baseSize * 0.3)
      graphics.lineTo(x, y - baseSize * 0.6)
    } else {
      // 金币 (保持原有逻辑)
      graphics.fillCircle(x, y, baseSize * 0.5)
      // 外圈 - 按比例
      graphics.lineStyle(baseSize * 0.1, 0xffffff, 0.5)
      graphics.strokeCircle(x, y, baseSize * 0.5 - baseSize * 0.08)
      // 金色中心点
      graphics.fillStyle(0xffffff, 0.8)
      graphics.fillCircle(x, y, baseSize * 0.2)
    }

    this.foodSprite = graphics as any
  }

  /**
   * ⭐ 获取 GTRS 主题资源 Key (辅助方法)
   */
  private getThemeAssetKey(category: string, type?: string): string | null {
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
   * ⭐ 更新适配参数 (用于 resize 后重新计算)
   */
  setAdaptParams(adaptParams: any): void {
    this.adaptParams = adaptParams
  }

  /**
   * ⭐ 获取当前食物精灵 (用于清理)
   */
  getFoodSprite(): Phaser.GameObjects.Image | Phaser.GameObjects.Graphics | null {
    return this.foodSprite
  }

  /**
   * ⭐ 销毁食物精灵 (用于清理)
   */
  destroy(): void {
    this.foodSprite?.destroy()
    this.foodSprite = null
  }
}
