// ============================================================================
// 🎨 食物渲染组件
// ============================================================================
// 
// 📌 说明:
//   负责渲染各种类型的食物
//   支持不同食物类型的外观差异
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'

/**
 * 食物类型枚举
 */
type FoodType = 'normal' | 'bonus' | 'special'

/**
 * 食物接口
 */
interface Food {
  /** X 坐标（网格） */
  x: number
  /** Y 坐标（网格） */
  y: number
  /** 食物类型 */
  type: FoodType
}

/**
 * 食物渲染组件参数
 */
interface FoodRendererParams {
  /** GTRS 主题对象 */
  theme: any
  /** 单元格大小（像素） */
  cellSize: number
  /** 屏幕宽度 */
  screenWidth: number
  /** 屏幕高度 */
  screenHeight: number
  /** 安全区域顶部 */
  safeTop: number
  /** 安全区域底部 */
  safeBottom: number
  /** 网格列数 */
  gridCols: number
  /** 网格行数 */
  gridRows: number
}

/**
 * 食物渲染组件类
 * 
 * @remarks
 * 职责：
 * - 根据食物类型渲染不同外观
 * - 响应食物生成事件
 * - 响应食物消耗事件
 * - 处理食物动画效果
 * 
 * @example
 * ```typescript
 * const foodRenderer = new FoodRenderer(scene)
 * container.add(foodRenderer)
 * 
 * foodRenderer.init({
 *   theme: loadedTheme,
 *   cellSize: 40,
 *   screenWidth: 720,
 *   screenHeight: 1280
 * })
 * ```
 */
export class FoodRenderer extends ComponentBase {
  /** 食物精灵 */
  private foodSprite: Phaser.GameObjects.Sprite | null = null
  
  /** 当前食物对象 */
  private currentFood: Food | null = null
  
  /** 当前参数 */
  private params: FoodRendererParams | null = null
  
  /** 游戏区域偏移量 */
  private offsetX: number = 0
  private offsetY: number = 0
  
  /** 食物纹理键值映射 */
  private textureKeys: Map<FoodType, string> = new Map()
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'food_renderer', '食物渲染器')
  }
  
  /**
   * 初始化食物渲染器
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as FoodRendererParams
    this.calculateOffset()
    this.createFoodSprites()
    
    console.log(`✅ [FoodRenderer] 食物渲染器初始化完成`)
  }
  
  /**
   * 销毁食物渲染器
   */
  public destroy(): void {
    super.destroy()
    
    if (this.foodSprite) {
      this.foodSprite.destroy()
      this.foodSprite = null
    }
    
    console.log(`🗑️ [FoodRenderer] 食物渲染器已销毁`)
  }
  
  /**
   * 渲染食物
   * 
   * @param food - 食物对象
   * 
   * @public
   */
  public render(food: Food): void {
    if (!this.params || !this.scene || !this.foodSprite) {
      return
    }
    
    this.currentFood = food
    
    // 计算像素位置
    const x = this.offsetX + food.x * this.params.cellSize + this.params.cellSize / 2
    const y = this.offsetY + food.y * this.params.cellSize + this.params.cellSize / 2
    
    // 设置位置
    this.foodSprite.setPosition(x, y)
    
    // 根据食物类型切换纹理
    const textureKey = this.getTextureForFoodType(food.type)
    if (textureKey && this.scene.textures.exists(textureKey)) {
      this.foodSprite.setTexture(textureKey)
    }
    
    // 显示食物
    this.foodSprite.setVisible(true)
    
    // 添加缩放动画效果
    this.playSpawnAnimation()
    
    console.log(`🍎 [FoodRenderer] 食物已渲染：类型=${food.type}, 位置=(${food.x}, ${food.y})`)
  }
  
  /**
   * 隐藏食物（被吃掉时）
   * 
   * @public
   */
  public hide(): void {
    if (this.foodSprite) {
      this.foodSprite.setVisible(false)
    }
    this.currentFood = null
  }
  
  /**
   * 计算游戏区域偏移量
   * 
   * @private
   */
  private calculateOffset(): void {
    if (!this.params) return
    
    const { cellSize, gridCols, gridRows, screenWidth, screenHeight, safeTop, safeBottom } = this.params
    
    const gameWidth = gridCols * cellSize
    const gameHeight = gridRows * cellSize
    this.offsetX = (screenWidth - gameWidth) / 2
    this.offsetY = safeTop + (screenHeight - safeTop - safeBottom - gameHeight) / 2
  }
  
  /**
   * 创建食物精灵
   * 
   * @private
   */
  private createFoodSprites(): void {
    if (!this.params || !this.scene) return
    
    // 为每种食物类型创建纹理
    this.createFoodTexture('normal', 0xef4444) // 红色普通食物
    this.createFoodTexture('bonus', 0xf59e0b)  // 金色奖励食物
    this.createFoodTexture('special', 0x8b5cf6) // 紫色特殊食物
    
    // 创建食物精灵（默认使用普通食物纹理）
    const defaultTexture = this.textureKeys.get('normal')
    if (defaultTexture) {
      this.foodSprite = this.scene.add.sprite(0, 0, defaultTexture)
      this.foodSprite.setOrigin(0.5)
      this.foodSprite.setDepth(8)
      this.foodSprite.setVisible(false) // 初始隐藏
    }
    
    console.log(`🍽️ [FoodRenderer] 食物精灵创建完成`)
  }
  
  /**
   * 创建指定类型的食物纹理
   * 
   * @param type - 食物类型
   * @param color - 颜色值
   * 
   * @private
   */
  private createFoodTexture(type: FoodType, color: number): void {
    if (!this.params || !this.scene) return
    
    const textureKey = `food_${type}`
    const graphics = this.scene.add.graphics()
    
    // 绘制圆形食物
    const radius = this.params.cellSize * 0.4
    graphics.fillStyle(color, 1)
    graphics.fillCircle(
      this.params.cellSize / 2,
      this.params.cellSize / 2,
      radius
    )
    
    // 添加高光效果
    graphics.fillStyle(0xffffff, 0.3)
    graphics.fillCircle(
      this.params.cellSize / 2 - radius * 0.3,
      this.params.cellSize / 2 - radius * 0.3,
      radius * 0.3
    )
    
    // 生成纹理
    graphics.generateTexture(textureKey, this.params.cellSize, this.params.cellSize)
    graphics.destroy()
    
    // 保存纹理键值
    this.textureKeys.set(type, textureKey)
  }
  
  /**
   * 根据食物类型获取纹理键值
   * 
   * @param type - 食物类型
   * @returns 纹理键值
   * 
   * @private
   */
  private getTextureForFoodType(type: FoodType): string | null {
    return this.textureKeys.get(type) ?? null
  }
  
  /**
   * 播放食物生成动画
   * 
   * @private
   */
  private playSpawnAnimation(): void {
    if (!this.foodSprite) return
    
    // 从 0 缩放开始
    this.foodSprite.setScale(0)
    
    // 缩放到正常大小
    this.scene.tweens.add({
      targets: this.foodSprite,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
      easeParams: [1.5]
    })
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
      case GameEventType.FOOD_SPAWN:
        // 收到食物生成事件，渲染新食物
        this.render(event.payload.food)
        break
        
      case GameEventType.FOOD_CONSUMED:
        // 收到食物消耗事件，隐藏食物
        this.hide()
        break
        
      case GameEventType.NEED_RERENDER:
        // 需要重新渲染
        if (this.params) {
          this.calculateOffset()
        }
        break
        
      default:
        // 忽略其他事件
        break
    }
  }
}
