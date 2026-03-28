// ============================================================================
// 🎮 输入处理组件
// ============================================================================
// 
// 📌 说明:
//   负责处理玩家的输入（键盘、触摸等）
//   支持防抖和节流处理
//   发送输入事件通知其他组件
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import type Phaser from 'phaser'
import type { Direction } from '../types/common'
import { debounce } from '../utils/helpers'

/**
 * ⭐ 输入历史项
 */
interface InputHistoryItem {
  /** 输入的方向 */
  direction: Direction
  /** 输入时间戳 */
  timestamp: number
}

/**
 * ⭐ 输入处理组件参数
 */
interface InputHandlerParams {
  /** 是否启用键盘输入（可选，默认 true） */
  enableKeyboard?: boolean
  /** 是否启用触摸输入（可选，默认 true） */
  enableTouch?: boolean
  /** 输入防抖延迟（毫秒，可选，默认 50） */
  debounceDelay?: number
  /** 是否启用输入历史（可选，默认 true） */
  enableHistory?: boolean
  /** 历史记录最大长度（可选，默认 10） */
  maxHistoryLength?: number
}

/**
 * ⭐ 输入处理组件类
 * 
 * @remarks
 * 职责：
 * - 监听键盘事件
 * - 监听触摸事件
 * - 输入防抖和节流
 * - 发送方向改变事件
 * - 记录输入历史
 * 
 * @example
 * ```typescript
 * const inputHandler = new InputHandlerComponent(scene)
 * inputHandler.init({ 
 *   enableKeyboard: true,
 *   enableTouch: true,
 *   debounceDelay: 50
 * })
 * 
 * // 组件会自动监听方向键并发送 INPUT_DIRECTION_CHANGED 事件
 * ```
 */
export class InputHandlerComponent extends ComponentBase {
  /** 当前方向 */
  private currentDirection: Direction | null = null
  
  /** 输入历史 */
  private inputHistory: InputHistoryItem[] = []
  
  /** 是否启用键盘输入 */
  private keyboardEnabled: boolean = true
  
  /** 是否启用触摸输入 */
  private touchEnabled: boolean = true
  
  /** 防抖延迟（毫秒） */
  private debounceDelay: number = 50
  
  /** 防抖处理函数 */
  private debouncedEmit: ((direction: Direction) => void) | null = null
  
  /** Phaser 光标键对象 */
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null
  
  /** 最后按下的键 */
  private lastPressedKey: string | null = null
  
  /** 历史记录最大长度 */
  private maxHistoryLength: number = 10
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'input_handler', '输入处理器')
  }
  
  /**
   * ⭐ 初始化输入处理组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    const typedParams = params as InputHandlerParams
    
    // 配置输入方式
    this.keyboardEnabled = typedParams.enableKeyboard ?? true
    this.touchEnabled = typedParams.enableTouch ?? true
    
    // 配置防抖
    this.debounceDelay = typedParams.debounceDelay ?? 50
    this.debouncedEmit = debounce((direction: Direction) => {
      this.emitDirectionChange(direction)
    }, this.debounceDelay)
    
    // 配置输入历史
    const enableHistory = typedParams.enableHistory ?? true
    const maxHistoryLength = typedParams.maxHistoryLength ?? 10
    
    if (enableHistory) {
      this.inputHistory = []
      this.maxHistoryLength = maxHistoryLength
    }
    
    // 设置键盘监听
    if (this.keyboardEnabled) {
      this.setupKeyboard()
    }
    
    // 设置触摸监听
    if (this.touchEnabled) {
      this.setupTouch()
    }
    
    console.log(`✅ [InputHandler] 输入处理器初始化完成`)
    console.log(`   键盘：${this.keyboardEnabled ? '✓' : '✗'}`)
    console.log(`   触摸：${this.touchEnabled ? '✓' : '✗'}`)
    console.log(`   防抖：${this.debounceDelay}ms`)
  }
  
  /**
   * ⭐ 每帧更新（检查连续输入）
   * 
   * @param deltaTime - 距离上一帧的时间间隔（毫秒）
   */
  public update(_deltaTime: number): void {
    if (!this.enabled || !this.keyboardEnabled) return
    
    // 检查光标键（持续检测）
    if (this.cursors) {
      if (this.cursors.left.isDown) {
        this.handleDirectionInput('left', 'ArrowLeft')
      } else if (this.cursors.right.isDown) {
        this.handleDirectionInput('right', 'ArrowRight')
      } else if (this.cursors.up.isDown) {
        this.handleDirectionInput('up', 'ArrowUp')
      } else if (this.cursors.down.isDown) {
        this.handleDirectionInput('down', 'ArrowDown')
      }
    }
  }
  
  /**
   * ⭐ 获取当前方向
   * 
   * @returns 当前输入方向，如果没有则为 null
   */
  public getCurrentDirection(): Direction | null {
    return this.currentDirection
  }
  
  /**
   * ⭐ 获取输入历史
   * 
   * @returns 输入历史数组
   */
  public getInputHistory(): InputHistoryItem[] {
    return [...this.inputHistory]
  }
  
  /**
   * ⭐ 清除输入历史
   */
  public clearHistory(): void {
    this.inputHistory = []
    console.log(`🗑️ [InputHandler] 输入历史已清除`)
  }
  
  /**
   * ⭐ 禁用某种输入方式
   * 
   * @param inputType - 输入类型 ('keyboard' | 'touch')
   */
  public disableInput(inputType: 'keyboard' | 'touch'): void {
    if (inputType === 'keyboard') {
      this.keyboardEnabled = false
      console.log(`⏸️ [InputHandler] 键盘输入已禁用`)
    } else if (inputType === 'touch') {
      this.touchEnabled = false
      console.log(`⏸️ [InputHandler] 触摸输入已禁用`)
    }
  }
  
  /**
   * ⭐ 启用某种输入方式
   * 
   * @param inputType - 输入类型 ('keyboard' | 'touch')
   */
  public enableInput(inputType: 'keyboard' | 'touch'): void {
    if (inputType === 'keyboard') {
      this.keyboardEnabled = true
      console.log(`▶️ [InputHandler] 键盘输入已启用`)
    } else if (inputType === 'touch') {
      this.touchEnabled = true
      console.log(`▶️ [InputHandler] 触摸输入已启用`)
    }
  }
  
  /**
   * ⭐ 设置键盘监听
   * 
   * @protected
   */
  protected setupKeyboard(): void {
    // 创建光标键对象
    this.cursors = this.scene.input.keyboard!.createCursorKeys()
    
    // 监听键盘按下事件
    this.scene.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      this.handleKeyDown(event)
    })
    
    console.log(`⌨️ [InputHandler] 键盘监听已设置`)
  }
  
  /**
   * ⭐ 处理键盘按下事件
   * 
   * @param event - 键盘事件
   * @protected
   */
  protected handleKeyDown(event: KeyboardEvent): void {
    const keyMap: Record<string, Direction> = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'KeyW': 'up',
      'KeyS': 'down',
      'KeyA': 'left',
      'KeyD': 'right'
    }
    
    const direction = keyMap[event.code]
    
    if (direction) {
      this.lastPressedKey = event.code
      this.handleDirectionInput(direction, event.code)
    }
  }
  
  /**
   * ⭐ 处理方向输入
   * 
   * @param direction - 方向
   * @param keyCode - 按键代码
   * @protected
   */
  protected handleDirectionInput(direction: Direction, keyCode: string): void {
    // 防止重复触发相同的键
    if (this.lastPressedKey === keyCode && this.currentDirection === direction) {
      return
    }
    
    // 使用防抖处理
    if (this.debouncedEmit) {
      this.debouncedEmit(direction)
    }
  }
  
  /**
   * ⭐ 设置触摸监听
   * 
   * @protected
   */
  protected setupTouch(): void {
    // 触摸滑动检测
    let touchStartX: number = 0
    let touchStartY: number = 0
    
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      touchStartX = pointer.x
      touchStartY = pointer.y
    })
    
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const deltaX = pointer.x - touchStartX
      const deltaY = pointer.y - touchStartY
      const minSwipeDistance = 30 // 最小滑动距离
      
      // 判断滑动方向
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (Math.abs(deltaX) > minSwipeDistance) {
          const direction = deltaX > 0 ? 'right' : 'left'
          this.handleDirectionInput(direction, 'Touch')
        }
      } else {
        // 垂直滑动
        if (Math.abs(deltaY) > minSwipeDistance) {
          const direction = deltaY > 0 ? 'down' : 'up'
          this.handleDirectionInput(direction, 'Touch')
        }
      }
    })
    
    console.log(`👆 [InputHandler] 触摸监听已设置`)
  }
  
  /**
   * ⭐ 发送方向改变事件
   * 
   * @param direction - 新的方向
   * @protected
   */
  protected emitDirectionChange(direction: Direction): void {
    const oldDirection = this.currentDirection
    this.currentDirection = direction
    
    // 添加到输入历史
    this.addToHistory(direction)
    
    // 发送事件
    this.emit({
      type: GameEventType.INPUT_DIRECTION_CHANGED,
      payload: {
        oldDirection,
        newDirection: direction
      },
      timestamp: Date.now()
    })
    
    console.log(`🔄 [InputHandler] 方向改变：${oldDirection ?? 'none'} → ${direction}`)
  }
  
  /**
   * ⭐ 添加到输入历史
   * 
   * @param direction - 方向
   * @protected
   */
  protected addToHistory(direction: Direction): void {
    if (this.inputHistory.length >= this.maxHistoryLength) {
      this.inputHistory.shift() // 移除最旧的记录
    }
    
    this.inputHistory.push({
      direction,
      timestamp: Date.now()
    })
  }
  
  /**
   * ⭐ 获取统计信息
   * 
   * @returns 统计信息对象
   */
  public getStats(): {
    currentDirection: Direction | null
    historyLength: number
    keyboardEnabled: boolean
    touchEnabled: boolean
    lastPressedKey: string | null
  } {
    return {
      currentDirection: this.currentDirection,
      historyLength: this.inputHistory.length,
      keyboardEnabled: this.keyboardEnabled,
      touchEnabled: this.touchEnabled,
      lastPressedKey: this.lastPressedKey
    }
  }
  
  /**
   * ⭐ 处理事件（实现基类的抽象方法）
   * 
   * @param event - 游戏事件
   * @protected
   */
  protected handleEvent(_event: GameEvent): void {
    // 可以响应游戏状态变化来禁用/启用输入
    switch (_event.type) {
      case GameEventType.PAUSE:
        this.disableInput('keyboard')
        break
        
      case GameEventType.RESUME:
        this.enableInput('keyboard')
        break
        
      case GameEventType.GAME_OVER:
        this.disableInput('keyboard')
        this.disableInput('touch')
        break
    }
  }
}
