// ============================================================================
// ⌨️ 输入处理组件
// ============================================================================
// 
// 📌 说明:
//   负责处理键盘输入
//   支持方向键和 WASD 键
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import type { Direction } from '../logic/SnakeMovementComponent'

/**
 * 输入处理组件参数
 */
interface InputHandlerParams {
  /** 是否启用方向键（默认 true） */
  enableArrowKeys?: boolean
  /** 是否启用 WASD 键（默认 true） */
  enableWASDKeys?: boolean
}

/**
 * 键盘映射配置
 */
interface KeyMapping {
  [keyCode: string]: Direction
}

/**
 * 输入处理组件类
 * 
 * @remarks
 * 职责：
 * - 监听键盘事件
 * - 处理方向输入
 * - 发射方向改变事件
 * - 防止重复输入
 * 
 * @example
 * ```typescript
 * const inputHandler = new InputHandlerComponent(scene)
 * container.add(inputHandler)
 * 
 * inputHandler.init({
 *   enableArrowKeys: true,
 *   enableWASDKeys: true
 * })
 * 
 * // 自动发射 INPUT_DIRECTION_CHANGED 事件
 * ```
 */
export class InputHandlerComponent extends ComponentBase {
  /** 当前参数 */
  private params: InputHandlerParams | null = null
  
  /** 键盘映射表 */
  private keyMapping: KeyMapping = {}
  
  /** 最后按下的时间（防止重复） */
  private lastKeyPressTime: number = 0
  
  /** 按键冷却时间（毫秒） */
  private readonly KEY_COOLDOWN = 50
  
  /** 当前方向（用于防止 180 度掉头检测） */
  private currentDirection: Direction = 'right'
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'input_handler', '输入处理器')
  }
  
  /**
   * 初始化输入处理组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as InputHandlerParams
    
    // 设置默认值
    if (this.params.enableArrowKeys === undefined) {
      this.params.enableArrowKeys = true
    }
    if (this.params.enableWASDKeys === undefined) {
      this.params.enableWASDKeys = true
    }
    
    // 建立键盘映射
    this.setupKeyMapping()
    
    // 注册键盘监听
    this.setupKeyboardListeners()
    
    console.log(`✅ [InputHandler] 输入处理组件初始化完成`)
  }
  
  /**
   * 销毁输入处理组件
   */
  public destroy(): void {
    super.destroy()
    
    // 移除键盘监听
    if (this.scene?.input?.keyboard) {
      this.scene.input.keyboard.removeAllListeners()
    }
    
    console.log(`🗑️ [InputHandler] 输入处理组件已销毁`)
  }
  
  /**
   * 设置当前方向（用于防反向检测）
   * 
   * @param direction - 当前移动方向
   * 
   * @public
   */
  public setCurrentDirection(direction: Direction): void {
    this.currentDirection = direction
  }
  
  /**
   * 建立键盘映射
   * 
   * @private
   */
  private setupKeyMapping(): void {
    // 方向键映射
    if (this.params?.enableArrowKeys) {
      this.keyMapping['ArrowUp'] = 'up'
      this.keyMapping['ArrowDown'] = 'down'
      this.keyMapping['ArrowLeft'] = 'left'
      this.keyMapping['ArrowRight'] = 'right'
    }
    
    // WASD 键映射
    if (this.params?.enableWASDKeys) {
      this.keyMapping['KeyW'] = 'up'
      this.keyMapping['KeyS'] = 'down'
      this.keyMapping['KeyA'] = 'left'
      this.keyMapping['KeyD'] = 'right'
    }
    
    console.log(`🎹 [InputHandler] 键盘映射已建立：${Object.keys(this.keyMapping).length} 个按键`)
  }
  
  /**
   * 设置键盘监听器
   * 
   * @private
   */
  private setupKeyboardListeners(): void {
    if (!this.scene?.input?.keyboard) {
      console.warn('⚠️ [InputHandler] 无法访问键盘输入')
      return
    }
    
    // 监听按键按下事件
    this.scene.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      this.handleKeyDown(event)
    })
    
    console.log(`👂 [InputHandler] 键盘监听器已设置`)
  }
  
  /**
   * 处理按键按下事件
   * 
   * @param event - 键盘事件
   * 
   * @private
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // 检查冷却时间
    const now = Date.now()
    if (now - this.lastKeyPressTime < this.KEY_COOLDOWN) {
      return // 冷却期内，忽略
    }
    
    // 查找对应的方向
    const direction = this.keyMapping[event.code]
    if (!direction) {
      return // 不是我们关心的按键
    }
    
    // 防止 180 度掉头
    if (this.isOppositeDirection(direction)) {
      console.warn(`⚠️ [InputHandler] 阻止反向输入：${direction}`)
      return
    }
    
    // 更新最后按键时间
    this.lastKeyPressTime = now
    
    // 发射方向改变事件
    this.emit({
      type: GameEventType.INPUT_DIRECTION_CHANGED,
      payload: {
        direction,
        code: event.code,
        timestamp: now
      },
      timestamp: now
    })
    
    console.log(`⌨️ [InputHandler] 检测到输入：${event.code} → ${direction}`)
  }
  
  /**
   * 检查是否是相反方向
   * 
   * @param newDirection - 新方向
   * @returns 是否是相反方向
   * 
   * @private
   */
  private isOppositeDirection(newDirection: Direction): boolean {
    const opposites: Record<Direction, Direction> = {
      'up': 'down',
      'down': 'up',
      'left': 'right',
      'right': 'left'
    }
    
    return opposites[this.currentDirection] === newDirection
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
        // 更新当前方向（用于防反向检测）
        this.currentDirection = event.payload.direction
        break
        
      case GameEventType.GAME_OVER:
        // 游戏结束，重置状态
        this.lastKeyPressTime = 0
        this.currentDirection = 'right'
        break
        
      default:
        // 忽略其他事件
        break
    }
  }
}
