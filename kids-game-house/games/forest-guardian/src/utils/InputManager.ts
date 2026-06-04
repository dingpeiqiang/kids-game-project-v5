// ============================================================================
// 🎮 统一输入管理器 - InputManager.ts
// ============================================================================
//
// 📌 说明:
//   统一封装键盘、触摸、鼠标输入，提供方向控制 + 自定义按键映射。
//   解决各游戏各自实现输入导致的代码重复问题。
//
// 🎯 适用场景:
//   - 方向控制（四方向/八方向移动）
//   - 自定义按键绑定（跳跃、攻击、技能等）
//   - 防抖/冷却/反向检测
//
// ⚠️ 使用前提:
//   在 GameScene 的 create() 中初始化，shutdown() 中销毁
//
// 📖 使用示例见 AI_INSTRUCTIONS.md
// ============================================================================

/**
 * 方向枚举
 */
export type Direction4 = 'up' | 'down' | 'left' | 'right'

/**
 * 按键绑定配置
 */
export interface KeyBinding {
  /** 按键码（如 'ArrowUp', 'KeyW', 'Space'） */
  code: string
  /** 绑定的动作名称（如 'up', 'jump', 'attack'） */
  action: string
}

/**
 * 输入管理器配置
 */
export interface InputManagerConfig {
  /** Phaser 场景 */
  scene: Phaser.Scene
  /** 是否启用方向键（默认 true） */
  enableArrowKeys?: boolean
  /** 是否启用 WASD 键（默认 true） */
  enableWASDKeys?: boolean
  /** 按键冷却时间（毫秒，默认 0 = 无冷却） */
  keyCooldown?: number
  /** 是否启用触摸输入（默认 true） */
  enableTouch?: boolean
  /** 触摸方向判定阈值（像素，默认 30） */
  touchThreshold?: number
  /** 自定义按键绑定 */
  customBindings?: KeyBinding[]
}

/**
 * 输入事件回调
 */
export type InputCallback = (action: string, code: string) => void

/**
 * 方向相反映射表
 */
const OPPOSITES: Record<Direction4, Direction4> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

/**
 * 统一输入管理器
 *
 * 封装键盘/触摸输入，提供防抖、反向检测、自定义动作绑定。
 *
 * @example
 * ```typescript
 * // 1. 在 createGameObjects() 中初始化
 * this.inputManager = new InputManager({
 *   scene: this,
 *   enableArrowKeys: true,
 *   enableWASDKeys: true,
 *   keyCooldown: 100,
 * })
 *
 * // 2. 监听方向变化
 * this.inputManager.onDirection((direction) => {
 *   this.moveDirection = direction
 * })
 *
 * // 3. 监听自定义动作
 * this.inputManager.onAction('jump', () => {
 *   this.playerJump()
 * })
 *
 * // 4. 在 shutdown() 中销毁
 * this.inputManager?.destroy()
 * ```
 */
export class InputManager {
  private scene: Phaser.Scene
  private keyCooldown: number
  private touchThreshold: number

  /** 自定义按键映射表 */
  private actionToCodes: Map<string, string[]> = new Map()
  private codeToAction: Map<string, string> = new Map()

  /** 当前方向（用于反向检测） */
  private currentDirection: Direction4 = 'right'

  /** 方向回调列表 */
  private directionCallbacks: ((direction: Direction4) => void)[] = []

  /** 动作回调列表 */
  private actionCallbacks: Map<string, InputCallback[]> = new Map()

  /** 按键冷却追踪 */
  private lastKeyTime: Map<string, number> = new Map()

  /** 方向键 → 方向映射 */
  private directionKeys: Map<string, Direction4> = new Map()

  /** Phaser 按键引用缓存 */
  private phaserKeys: Map<string, Phaser.Input.Keyboard.Key> = new Map()

  /** 按键状态（当前帧是否按下） */
  private justPressed: Map<string, boolean> = new Map()

  /** 触摸输入相关 */
  private enableTouch: boolean
  private touchStartX: number = 0
  private touchStartY: number = 0

  constructor(config: InputManagerConfig) {
    this.scene = config.scene
    this.keyCooldown = config.keyCooldown ?? 0
    this.touchThreshold = config.touchThreshold ?? 30
    this.enableTouch = config.enableTouch ?? true

    // 1. 注册方向键映射
    if (config.enableArrowKeys !== false) {
      this.registerDirectionKey('ArrowUp', 'up')
      this.registerDirectionKey('ArrowDown', 'down')
      this.registerDirectionKey('ArrowLeft', 'left')
      this.registerDirectionKey('ArrowRight', 'right')
    }
    if (config.enableWASDKeys !== false) {
      this.registerDirectionKey('KeyW', 'up')
      this.registerDirectionKey('KeyS', 'down')
      this.registerDirectionKey('KeyA', 'left')
      this.registerDirectionKey('KeyD', 'right')
    }

    // 2. 注册自定义按键绑定
    for (const binding of config.customBindings ?? []) {
      this.registerAction(binding.code, binding.action)
    }

    // 3. 设置 Phaser 键盘监听
    this.setupKeyboardListener()

    // 4. 设置触摸监听
    if (this.enableTouch) {
      this.setupTouchListener()
    }

    console.log(
      `[InputManager] 初始化完成: 方向键=${this.directionKeys.size}, 自定义动作=${this.actionToCodes.size}`,
    )
  }

  /**
   * 注册方向键
   */
  private registerDirectionKey(code: string, direction: Direction4): void {
    this.directionKeys.set(code, direction)
    this.codeToAction.set(code, direction)

    // 也注册到 action 映射
    if (!this.actionToCodes.has(direction)) {
      this.actionToCodes.set(direction, [])
    }
    this.actionToCodes.get(direction)!.push(code)
  }

  /**
   * 注册自定义动作按键
   */
  private registerAction(code: string, action: string): void {
    this.codeToAction.set(code, action)

    if (!this.actionToCodes.has(action)) {
      this.actionToCodes.set(action, [])
    }
    this.actionToCodes.get(action)!.push(code)
  }

  /**
   * 设置键盘监听
   */
  private setupKeyboardListener(): void {
    if (!this.scene.input.keyboard) {
      console.warn('[InputManager] 键盘输入不可用')
      return
    }

    // 创建 Phaser Key 对象（用于 isDown 状态检查）
    const allCodes = new Set([...this.directionKeys.keys(), ...this.codeToAction.keys()])
    for (const code of allCodes) {
      this.phaserKeys.set(code, this.scene.input.keyboard.addKey(code))
    }

    // 监听按键按下
    this.scene.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      this.handleKeyDown(event.code)
    })
  }

  /**
   * 设置触摸监听
   */
  private setupTouchListener(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.touchStartX = pointer.x
      this.touchStartY = pointer.y
    })

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.handleTouchSwipe(pointer.x, pointer.y)
    })
  }

  /**
   * 处理按键按下
   */
  private handleKeyDown(code: string): void {
    // 冷却检查
    if (this.keyCooldown > 0) {
      const now = Date.now()
      const lastTime = this.lastKeyTime.get(code) ?? 0
      if (now - lastTime < this.keyCooldown) return
      this.lastKeyTime.set(code, now)
    }

    const action = this.codeToAction.get(code)
    if (!action) return

    this.justPressed.set(code, true)

    // 方向键 → 反向检测 + 方向回调
    if (this.directionKeys.has(code)) {
      const direction = this.directionKeys.get(code)!

      // 反向检测（仅对方向键生效）
      if (OPPOSITES[this.currentDirection] !== direction) {
        this.currentDirection = direction
        this.fireDirectionCallbacks(direction)
      }
    }

    // 触发动作回调
    this.fireActionCallbacks(action, code)
  }

  /**
   * 处理触摸滑动
   */
  private handleTouchSwipe(endX: number, endY: number): void {
    const dx = endX - this.touchStartX
    const dy = endY - this.touchStartY
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    // 滑动距离不足则忽略
    if (Math.max(absDx, absDy) < this.touchThreshold) return

    let direction: Direction4
    if (absDx > absDy) {
      direction = dx > 0 ? 'right' : 'left'
    } else {
      direction = dy > 0 ? 'down' : 'up'
    }

    // 反向检测
    if (OPPOSITES[this.currentDirection] !== direction) {
      this.currentDirection = direction
      this.fireDirectionCallbacks(direction)
    }
  }

  // ─── 公共 API ──────────────────────────────────────────────

  /**
   * 注册方向变化回调
   *
   * @param callback  回调函数，参数为当前方向
   * @returns 取消注册函数
   *
   * @example
   *   const unsubscribe = this.inputManager.onDirection((dir) => {
   *     console.log('方向:', dir)
   *   })
   *   // 不需要时取消
   *   unsubscribe()
   */
  onDirection(callback: (direction: Direction4) => void): () => void {
    this.directionCallbacks.push(callback)
    return () => {
      this.directionCallbacks = this.directionCallbacks.filter((cb) => cb !== callback)
    }
  }

  /**
   * 注册动作回调
   *
   * @param action    动作名称（如 'jump', 'attack'）
   * @param callback  回调函数
   * @returns 取消注册函数
   *
   * @example
   *   // 先注册按键
   *   inputManager.registerAction('Space', 'jump')
   *   // 再监听
   *   const unsub = inputManager.onAction('jump', () => {
   *     player.setVelocityY(-300)
   *   })
   */
  onAction(action: string, callback: InputCallback): () => void {
    if (!this.actionCallbacks.has(action)) {
      this.actionCallbacks.set(action, [])
    }
    this.actionCallbacks.get(action)!.push(callback)

    return () => {
      const callbacks = this.actionCallbacks.get(action)
      if (callbacks) {
        this.actionCallbacks.set(
          action,
          callbacks.filter((cb) => cb !== callback),
        )
      }
    }
  }

  /**
   * 注册新的自定义按键绑定（运行时动态添加）
   *
   * @param code    按键码
   * @param action  动作名称
   *
   * @example
   *   this.inputManager.registerAction('Space', 'jump')
   */
  registerAction(code: string, action: string): void {
    this.codeToAction.set(code, action)

    if (!this.actionToCodes.has(action)) {
      this.actionToCodes.set(action, [])
    }
    this.actionToCodes.get(action)!.push(code)

    // 如果是 Phaser 键盘可用，添加 Key 对象
    if (this.scene.input.keyboard && !this.phaserKeys.has(code)) {
      this.phaserKeys.set(code, this.scene.input.keyboard.addKey(code))
    }
  }

  /**
   * 检查某个动作是否当前被按下（持续检测）
   *
   * 适用于 update/gameLoop 中的持续移动（如按住方向键持续走）。
   *
   * @param action  动作名称
   * @returns 是否按下
   *
   * @example
   *   // 在 gameLoop 中：
   *   if (this.inputManager.isDown('left')) {
   *     this.player.setVelocityX(-200)
   *   } else if (this.inputManager.isDown('right')) {
   *     this.player.setVelocityX(200)
   *   }
   */
  isDown(action: string): boolean {
    const codes = this.actionToCodes.get(action)
    if (!codes || codes.length === 0) return false

    return codes.some((code) => {
      const key = this.phaserKeys.get(code)
      return key?.isDown ?? false
    })
  }

  /**
   * 检查某动作是否在当前帧刚被按下（单次触发）
   *
   * 每帧结束时需要调用 clearFrameState()。
   *
   * @param action  动作名称
   * @returns 是否刚按下
   */
  isJustPressed(action: string): boolean {
    const codes = this.actionToCodes.get(action)
    if (!codes || codes.length === 0) return false

    return codes.some((code) => this.justPressed.get(code) === true)
  }

  /**
   * 获取当前方向
   */
  getCurrentDirection(): Direction4 {
    return this.currentDirection
  }

  /**
   * 手动设置当前方向（用于非 InputManager 驱动的移动后同步状态）
   *
   * @param direction  当前方向
   */
  setCurrentDirection(direction: Direction4): void {
    this.currentDirection = direction
  }

  /**
   * 清除本帧的按键状态（在 update 末尾调用）
   *
   * @example
   *   update(time, delta) {
   *     // 处理输入...
   *     this.inputManager.clearFrameState()
   *   }
   */
  clearFrameState(): void {
    this.justPressed.clear()
  }

  /**
   * 销毁输入管理器（释放所有监听器）
   */
  destroy(): void {
    // 移除 Phaser 按键
    for (const [, key] of this.phaserKeys) {
      key?.destroy()
    }
    this.phaserKeys.clear()

    // 清空回调
    this.directionCallbacks = []
    this.actionCallbacks.clear()
    this.justPressed.clear()
    this.lastKeyTime.clear()

    console.log('[InputManager] 已销毁')
  }

  // ─── 私有方法 ──────────────────────────────────────────────

  private fireDirectionCallbacks(direction: Direction4): void {
    for (const cb of this.directionCallbacks) {
      cb(direction)
    }
  }

  private fireActionCallbacks(action: string, code: string): void {
    const callbacks = this.actionCallbacks.get(action)
    if (callbacks) {
      for (const cb of callbacks) {
        cb(action, code)
      }
    }
  }
}
