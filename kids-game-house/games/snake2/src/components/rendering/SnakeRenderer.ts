// ============================================================================
// 🎨 蛇渲染组件
// ============================================================================
// 
// 📌 说明:
//   负责渲染贪吃蛇的整个身体（包括蛇头和蛇身）
//   支持转向效果、颜色渐变等视觉特性
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'

/**
 * 方向枚举类型
 */
type Direction = 'up' | 'down' | 'left' | 'right'

/**
 * 蛇分段接口
 */
interface SnakeSegment {
  x: number
  y: number
}

/**
 * 蛇渲染组件参数
 */
interface SnakeRendererParams {
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
 * 蛇渲染组件类
 * 
 * @remarks
 * 职责：
 * - 渲染蛇头（带转向效果）
 * - 渲染蛇身（带颜色渐变）
 * - 响应蛇移动事件更新位置
 * - 处理粒子效果触发
 * 
 * @example
 * ```typescript
 * const snakeRenderer = new SnakeRenderer(scene)
 * container.add(snakeRenderer)
 * 
 * snakeRenderer.init({
 *   theme: loadedTheme,
 *   cellSize: 40,
 *   screenWidth: 720,
 *   screenHeight: 1280
 * })
 * 
 * // 在 SNAKE_MOVE 事件中自动更新渲染
 * ```
 */
export class SnakeRenderer extends ComponentBase {
  /** 蛇头精灵 */
  private headSprite: Phaser.GameObjects.Sprite | null = null
  
  /** 蛇身容器 */
  private bodyGroup: Phaser.GameObjects.Group | null = null
  
  /** 当前参数 */
  private params: SnakeRendererParams | null = null
  
  /** 游戏区域偏移量 */
  private offsetX: number = 0
  private offsetY: number = 0
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'snake_renderer', '蛇渲染器')
  }
  
  /**
   * 初始化蛇渲染器
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as SnakeRendererParams
    this.calculateOffset()
    this.createSnakeSprites()
    
    console.log(`✅ [SnakeRenderer] 蛇渲染器初始化完成`)
  }
  
  /**
   * 销毁蛇渲染器
   */
  public destroy(): void {
    super.destroy()
    
    if (this.headSprite) {
      this.headSprite.destroy()
      this.headSprite = null
    }
    
    if (this.bodyGroup) {
      this.bodyGroup.clear(true, true)
      this.bodyGroup = null
    }
    
    console.log(`🗑️ [SnakeRenderer] 蛇渲染器已销毁`)
  }
  
  /**
   * 渲染蛇
   * 
   * @param snake - 蛇身体分段数组
   * @param direction - 当前移动方向
   * 
   * @public
   */
  public renderSnake(snake: SnakeSegment[], direction: Direction): void {
    if (!this.params || !this.scene || snake.length === 0) {
      return
    }
    
    // 更新蛇头位置和旋转
    this.updateHead(snake[0], direction)
    
    // 更新蛇身位置
    this.updateBody(snake.slice(1))
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
   * 创建蛇的精灵对象
   * 
   * @private
   */
  private createSnakeSprites(): void {
    if (!this.params || !this.scene) return
    
    // 创建蛇头精灵（使用主题中的蛇头图片）
    const headTextureKey = this.getThemeAssetKey('snake_head')
    
    if (headTextureKey && this.scene.textures.exists(headTextureKey)) {
      this.headSprite = this.scene.add.sprite(0, 0, headTextureKey)
      this.headSprite.setOrigin(0.5)
      this.headSprite.setDepth(10)
      this.headSprite.setVisible(false) // 初始隐藏
    } else {
      // 使用默认圆形作为蛇头
      const graphics = this.scene.add.graphics()
      graphics.fillStyle(0x4ade80, 1)
      graphics.fillCircle(
        this.params.cellSize / 2,
        this.params.cellSize / 2,
        this.params.cellSize * 0.45
      )
      
      const textureKey = 'snake_head_default'
      graphics.generateTexture(textureKey, this.params.cellSize, this.params.cellSize)
      graphics.destroy()
      
      this.headSprite = this.scene.add.sprite(0, 0, textureKey)
      this.headSprite.setOrigin(0.5)
      this.headSprite.setDepth(10)
      this.headSprite.setVisible(false)
    }
    
    // 创建蛇身组
    this.bodyGroup = this.scene.add.group()
    
    console.log(`🐍 [SnakeRenderer] 蛇精灵创建完成`)
  }
  
  /**
   * 更新蛇头位置和旋转
   * 
   * @param segment - 蛇头分段
   * @param direction - 移动方向
   * 
   * @private
   */
  private updateHead(segment: SnakeSegment, direction: Direction): void {
    if (!this.headSprite) return
    
    // 计算像素位置（加中心点偏移）
    const x = this.offsetX + segment.x * this.params!.cellSize + this.params!.cellSize / 2
    const y = this.offsetY + segment.y * this.params!.cellSize + this.params!.cellSize / 2
    
    this.headSprite.setPosition(x, y)
    this.headSprite.setVisible(true)
    
    // 根据方向旋转蛇头
    this.rotateHead(direction)
  }
  
  /**
   * 旋转蛇头以匹配移动方向
   * 
   * @param direction - 移动方向
   * 
   * @private
   */
  private rotateHead(direction: Direction): void {
    if (!this.headSprite) return
    
    let rotation = 0
    
    switch (direction) {
      case 'up':
        rotation = -Math.PI / 2
        break
      case 'down':
        rotation = Math.PI / 2
        break
      case 'left':
        rotation = Math.PI
        break
      case 'right':
        rotation = 0
        break
    }
    
    this.headSprite.setRotation(rotation)
  }
  
  /**
   * 更新蛇身位置
   * 
   * @param segments - 蛇身分段数组（不包含蛇头）
   * 
   * @private
   */
  private updateBody(segments: SnakeSegment[]): void {
    if (!this.bodyGroup) return
    
    // 确保蛇身组有足够的精灵
    while (this.bodyGroup.getLength() < segments.length) {
      const bodySprite = this.createBodySegment(this.bodyGroup.getLength())
      this.bodyGroup.add(bodySprite)
    }
    
    // 移除多余的精灵
    while (this.bodyGroup.getLength() > segments.length) {
      const lastSprite = this.bodyGroup.getLast()
      if (lastSprite) {
        this.bodyGroup.remove(lastSprite, true, true)
      }
    }
    
    // 更新每个蛇身的位置
    const children = this.bodyGroup.getChildren()
    segments.forEach((segment, index) => {
      const sprite = children[index] as Phaser.GameObjects.Sprite
      if (sprite) {
        const x = this.offsetX + segment.x * this.params!.cellSize + this.params!.cellSize / 2
        const y = this.offsetY + segment.y * this.params!.cellSize + this.params!.cellSize / 2
        sprite.setPosition(x, y)
        sprite.setVisible(true)
      }
    })
  }
  
  /**
   * 创建单个蛇身分段
   * 
   * @param index - 分段索引（用于颜色渐变）
   * @returns 蛇身精灵
   * 
   * @private
   */
  private createBodySegment(index: number): Phaser.GameObjects.Sprite {
    if (!this.params || !this.scene) {
      throw new Error('[SnakeRenderer] 参数未初始化')
    }
    
    // 尝试使用主题中的蛇身图片
    const bodyTextureKey = this.getThemeAssetKey('snake_body')
    
    if (bodyTextureKey && this.scene.textures.exists(bodyTextureKey)) {
      const sprite = this.scene.add.sprite(0, 0, bodyTextureKey)
      sprite.setOrigin(0.5)
      sprite.setDepth(9) // 略低于蛇头
      sprite.setVisible(false)
      return sprite
    }
    
    // 使用默认圆形作为蛇身（带颜色渐变）
    const color = this.getBodyColor(index)
    const graphics = this.scene.add.graphics()
    graphics.fillStyle(color, 1)
    graphics.fillCircle(
      this.params.cellSize / 2,
      this.params.cellSize / 2,
      this.params.cellSize * 0.4
    )
    
    const textureKey = `snake_body_${index}`
    graphics.generateTexture(textureKey, this.params.cellSize, this.params.cellSize)
    graphics.destroy()
    
    const sprite = this.scene.add.sprite(0, 0, textureKey)
    sprite.setOrigin(0.5)
    sprite.setDepth(9)
    sprite.setVisible(false)
    
    return sprite
  }
  
  /**
   * 获取蛇身颜色（渐变效果）
   * 
   * @param index - 分段索引
   * @returns 颜色值（数字格式）
   * 
   * @private
   */
  private getBodyColor(index: number): number {
    // 基础绿色，每 5 节稍微变深一点
    const baseGreen = 0x4ade80
    const darkenFactor = Math.floor(index / 5) * 0.1
    const green = Math.max(0x22c55e, baseGreen - darkenFactor * 0x20)
    return Math.floor(green)
  }
  
  /**
   * 从主题获取资源键
   * 
   * @param assetType - 资源类型
   * @returns 资源键（不存在则返回 null）
   * 
   * @private
   */
  private getThemeAssetKey(assetType: string): string | null {
    if (!this.params?.theme) return null
    
    const assets = this.params.theme.assets ?? []
    const asset = assets.find((a: any) => a.assetType === assetType)
    return asset?.src ?? null
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
      case GameEventType.SNAKE_MOVE:
        // 收到蛇移动事件，更新渲染
        this.renderSnake(event.payload.snake, event.payload.direction)
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
