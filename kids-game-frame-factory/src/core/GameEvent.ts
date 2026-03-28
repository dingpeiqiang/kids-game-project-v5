// ============================================================================
// 🎮 游戏事件系统定义
// ============================================================================
// 
// 📌 说明:
//   定义所有游戏组件间通信使用的事件类型和结构
//   采用事件驱动架构实现组件解耦
// ============================================================================

/**
 * 游戏事件类型枚举
 * 
 * @remarks
 * 所有组件事件必须使用此枚举定义的类型
 * 按功能模块分组命名，便于管理和查找
 */
export enum GameEventType {
  // ========== 游戏状态事件 ==========
  /** 游戏开始 */
  GAME_START = 'GAME_START',
  /** 游戏结束 */
  GAME_OVER = 'GAME_OVER',
  /** 游戏暂停 */
  PAUSE = 'PAUSE',
  /** 游戏恢复 */
  RESUME = 'RESUME',
  
  // ========== 蛇相关事件 ==========
  /** 蛇移动 */
  SNAKE_MOVE = 'SNAKE_MOVE',
  /** 蛇吃到食物 */
  SNAKE_EAT = 'SNAKE_EAT',
  /** 蛇撞到墙壁 */
  SNAKE_COLLIDE_WALL = 'SNAKE_COLLIDE_WALL',
  /** 蛇撞到自身 */
  SNAKE_COLLIDE_SELF = 'SNAKE_COLLIDE_SELF',
  /** 蛇撞到障碍物 */
  SNAKE_COLLIDE_OBSTACLE = 'SNAKE_COLLIDE_OBSTACLE',
  
  // ========== 食物相关事件 ==========
  /** 食物生成 */
  FOOD_SPAWN = 'FOOD_SPAWN',
  /** 食物被消耗 */
  FOOD_CONSUMED = 'FOOD_CONSUMED',
  
  // ========== 道具相关事件 ==========
  /** 道具生成 */
  ITEM_SPAWN = 'ITEM_SPAWN',
  /** 道具被收集 */
  ITEM_COLLECTED = 'ITEM_COLLECTED',
  /** 道具效果激活 */
  ITEM_EFFECT_ACTIVATED = 'ITEM_EFFECT_ACTIVATED',
  /** 道具效果消失 */
  ITEM_EFFECT_EXPIRED = 'ITEM_EFFECT_EXPIRED',
  
  // ========== 分数事件 ==========
  /** 分数改变 */
  SCORE_CHANGED = 'SCORE_CHANGED',
  /** 最高分更新 */
  HIGH_SCORE_UPDATED = 'HIGH_SCORE_UPDATED',
  
  // ========== 输入事件 ==========
  /** 输入方向改变 */
  INPUT_DIRECTION_CHANGED = 'INPUT_DIRECTION_CHANGED',
  
  // ========== 碰撞事件 ==========
  /** 检测到碰撞 */
  COLLISION_DETECTED = 'COLLISION_DETECTED',
  
  // ========== UI 事件 ==========
  /** UI 刷新 */
  UI_REFRESH = 'UI_REFRESH',
  /** 显示消息 */
  SHOW_MESSAGE = 'SHOW_MESSAGE',
  
  // ========== 渲染事件 ==========
  /** 渲染器初始化完成 */
  RENDERER_READY = 'RENDERER_READY',
  /** 需要重新渲染 */
  NEED_RERENDER = 'NEED_RERENDER'
}

/**
 * 游戏事件接口
 * 
 * @remarks
 * 所有组件事件必须符合此接口规范
 * 包含事件类型、负载数据和时间戳
 * 
 * @example
 * ```typescript
 * // 创建一个蛇移动事件
 * const event: GameEvent = {
 *   type: GameEventType.SNAKE_MOVE,
 *   payload: {
 *     snake: snakeSegments,
 *     direction: Direction.RIGHT
 *   },
 *   timestamp: Date.now()
 * }
 * 
 * // 发布事件
 * this.emit(event)
 * ```
 */
export interface GameEvent {
  /**
   * 事件类型
   * 
   * @remarks
   * 必须从 GameEventType 枚举中选择
   */
  type: GameEventType
  
  /**
   * 事件负载数据
   * 
   * @remarks
   * 包含事件相关的数据
   * 具体结构由事件类型决定
   * 
   * @example
   * - SNAKE_MOVE: { snake: SnakeSegment[], direction: Direction }
   * - FOOD_SPAWN: { food: Food }
   * - SCORE_CHANGED: { score: number, previousScore: number }
   */
  payload?: any
  
  /**
   * 事件时间戳
   * 
   * @remarks
   * 记录事件发生的精确时间（毫秒）
   * 用于调试和性能分析
   */
  timestamp: number
}

/**
 * 事件监听器回调函数类型
 * 
 * @param event - 接收到的事件对象
 */
export type EventListener = (event: GameEvent) => void

/**
 * 事件订阅配置
 * 
 * @remarks
 * 用于高级事件订阅场景
 */
export interface EventSubscription {
  /** 订阅 ID（用于取消订阅） */
  subscriptionId: string
  /** 事件类型 */
  eventType: GameEventType
  /** 监听器函数 */
  listener: EventListener
  /** 是否只触发一次 */
  once?: boolean
}

/**
 * 游戏事件负载类型映射
 * 
 * @remarks
 * 定义每种事件类型对应的 payload 数据结构
 */
export interface GameEventPayload {
  [GameEventType.GAME_START]: { difficulty: string }
  [GameEventType.GAME_OVER]: { score: number; reason: string }
  [GameEventType.PAUSE]: { pausedAt: number }
  [GameEventType.RESUME]: { resumedAt: number }
  [GameEventType.SNAKE_MOVE]: { snake: any[]; direction: string }
  [GameEventType.SNAKE_EAT]: { food: any; score: number }
  [GameEventType.SNAKE_COLLIDE_WALL]: { position: { x: number; y: number } }
  [GameEventType.SNAKE_COLLIDE_SELF]: { position: { x: number; y: number } }
  [GameEventType.SNAKE_COLLIDE_OBSTACLE]: { obstacle: any }
  [GameEventType.FOOD_SPAWN]: { food: any }
  [GameEventType.FOOD_CONSUMED]: { foodType: string; score: number }
  [GameEventType.ITEM_SPAWN]: { item: any }
  [GameEventType.ITEM_COLLECTED]: { item: any; score: number }
  [GameEventType.ITEM_EFFECT_ACTIVATED]: { itemId: string; effect: string }
  [GameEventType.ITEM_EFFECT_EXPIRED]: { itemId: string }
  [GameEventType.SCORE_CHANGED]: { score: number; previousScore: number }
  [GameEventType.HIGH_SCORE_UPDATED]: { highScore: number; previousHighScore: number }
  [GameEventType.INPUT_DIRECTION_CHANGED]: { direction: string }
  [GameEventType.UI_REFRESH]: {}
  [GameEventType.SHOW_MESSAGE]: { message: string; type: string }
  [GameEventType.RENDERER_READY]: { rendererId: string }
  [GameEventType.NEED_RERENDER]: { reason: string }
}
