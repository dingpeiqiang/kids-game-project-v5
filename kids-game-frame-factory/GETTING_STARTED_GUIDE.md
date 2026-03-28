# 🎮 kids-game-frame-factory 快速上手指南

**版本**: v1.1.0  
**最后更新**: 2026-03-28  
**状态**: ✅ 核心架构完成，可投入使用

---

## 🚀 5 分钟快速开始

### Step 1: 安装依赖（待实现）

```bash
cd kids-game-frame-factory
npm install
```

> ⚠️ **注意**: 当前框架还在开发中，暂未发布到 NPM。可以先在 kids-game-house 项目中使用。

---

### Step 2: 创建你的第一个游戏组件

#### 示例 1: 简单的蛇移动组件

```typescript
import { ComponentBase } from './core/ComponentBase'
import { GameEvent, GameEventType } from './core/GameEvent'
import type { Direction, Position } from '../types/common'
import type { IMovableObject } from '../interfaces/movable-object'

/**
 * 🐍 蛇移动组件
 */
export class SnakeMovementComponent extends ComponentBase {
  private snake: IMovableObject
  
  constructor(scene: any) {
    super(scene, 'snake_movement', '蛇移动控制器')
    
    // 初始化蛇对象
    this.snake = {
      position: { x: 0, y: 0 },
      direction: 'right',
      speed: 200,
      enabled: true
    }
  }
  
  public init(params: any): void {
    super.init(params)
    console.log('🐍 蛇移动组件初始化完成')
  }
  
  public update(deltaTime: number): void {
    if (!this.enabled || !this.snake.enabled) return
    
    // 根据方向和速度更新位置
    const delta = (this.snake.speed * deltaTime) / 1000
    
    switch (this.snake.direction) {
      case 'up':
        this.snake.position.y -= delta
        break
      case 'down':
        this.snake.position.y += delta
        break
      case 'left':
        this.snake.position.x -= delta
        break
      case 'right':
        this.snake.position.x += delta
        break
    }
  }
  
  protected handleEvent(event: GameEvent): void {
    if (event.type === GameEventType.INPUT_DIRECTION_CHANGED) {
      const newDirection = event.payload.direction as Direction
      
      // 防止 180 度转向
      const opposites = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left'
      }
      
      if (opposites[this.snake.direction] !== newDirection) {
        this.snake.direction = newDirection
        console.log(`🔄 蛇转向：${newDirection}`)
      }
    }
  }
  
  public getSnake(): IMovableObject {
    return this.snake
  }
}
```

---

### Step 3: 组装游戏

```typescript
import { ComponentContainer } from './core/ComponentContainer'
import { EventBus } from './core/EventBus'
import { GameStateComponent } from './logic/GameStateComponent'
import { SnakeMovementComponent } from './components/SnakeMovementComponent'

// 1. 创建场景
const scene = this // Phaser.Scene

// 2. 创建组件容器
const container = new ComponentContainer()

// 3. 添加组件
const gameState = new GameStateComponent(scene)
const snakeMovement = new SnakeMovementComponent(scene)

container.add(gameState)
container.add(snakeMovement)

// 4. 初始化所有组件
container.initAll()

// 5. 开始游戏循环
scene.update = (deltaTime: number) => {
  container.updateAll(deltaTime)
}

// 6. 开始游戏
gameState.startGame()
```

---

## 📚 核心概念速查

### 1. 组件生命周期

```typescript
class MyComponent extends ComponentBase {
  // 构造函数
  constructor(scene: any) {
    super(scene, 'my_component', '我的组件')
  }
  
  // 初始化（只调用一次）
  public init(params: any): void {
    // 在这里进行初始化
  }
  
  // 每帧更新（游戏循环中调用）
  public update(deltaTime: number): void {
    // 在这里更新逻辑
  }
  
  // 处理事件
  protected handleEvent(event: GameEvent): void {
    // 在这里响应事件
  }
  
  // 销毁时清理资源
  public destroy(): void {
    // 清理资源
  }
}
```

---

### 2. 事件系统

#### 发送事件

```typescript
// 通过组件发送
this.emit({
  type: GameEventType.SCORE_CHANGED,
  payload: {
    score: 100,
    combo: 5
  },
  timestamp: Date.now()
})

// 或通过 EventBus 发送
EventBus.getInstance().emit({
  type: GameEventType.GAME_START,
  payload: { difficulty: 'normal' },
  timestamp: Date.now()
})
```

#### 监听事件

```typescript
// 在组件中监听
protected handleEvent(event: GameEvent): void {
  switch (event.type) {
    case GameEventType.GAME_START:
      console.log('游戏开始了！')
      break
      
    case GameEventType.SCORE_CHANGED:
      console.log(`分数变化：${event.payload.score}`)
      break
      
    case GameEventType.INPUT_DIRECTION_CHANGED:
      console.log(`方向改变：${event.payload.direction}`)
      break
  }
}
```

---

### 3. 常用事件类型

```typescript
GameEventType.GAME_START          // 游戏开始
GameEventType.GAME_OVER           // 游戏结束
GameEventType.PAUSE               // 暂停游戏
GameEventType.RESUME              // 恢复游戏
GameEventType.SCORE_CHANGED       // 分数变化
GameEventType.INPUT_DIRECTION_CHANGED  // 输入方向改变
GameEventType.COLLISION_DETECTED  // 碰撞检测
GameEventType.ITEM_SPAWNED        // 物品生成
GameEventType.ITEM_COLLECTED      // 物品收集
```

---

## 🎯 实战示例

### 示例 2: 分数管理组件

```typescript
import { ComponentBase } from './core/ComponentBase'
import { GameEvent, GameEventType } from './core/GameEvent'

/**
 * 📊 分数管理组件
 */
export class ScoreManagerComponent extends ComponentBase {
  private score: number = 0
  private highScore: number = 0
  
  constructor(scene: any) {
    super(scene, 'score_manager', '分数管理器')
  }
  
  public init(params: any): void {
    super.init(params)
    this.score = 0
    console.log(`📊 分数管理器初始化完成`)
  }
  
  /**
   * 增加分数
   */
  public addScore(points: number): void {
    this.score += points
    
    // 发送分数变化事件
    this.emit({
      type: GameEventType.SCORE_CHANGED,
      payload: {
        score: this.score,
        pointsAdded: points
      },
      timestamp: Date.now()
    })
    
    console.log(`➕ 分数 +${points}, 总分：${this.score}`)
  }
  
  /**
   * 检查是否刷新最高分
   */
  public checkHighScore(): boolean {
    if (this.score > this.highScore) {
      this.highScore = this.score
      
      this.emit({
        type: GameEventType.HIGH_SCORE_UPDATED,
        payload: {
          highScore: this.highScore
        },
        timestamp: Date.now()
      })
      
      console.log(`🏆 新纪录！${this.highScore}`)
      return true
    }
    return false
  }
  
  public getCurrentScore(): number {
    return this.score
  }
  
  public getHighScore(): number {
    return this.highScore
  }
  
  public reset(): void {
    this.score = 0
  }
  
  protected handleEvent(event: GameEvent): void {
    if (event.type === GameEventType.GAME_OVER) {
      this.checkHighScore()
    }
  }
}
```

---

### 示例 3: 物品生成器组件

```typescript
import { ComponentBase } from './core/ComponentBase'
import { GameEvent, GameEventType } from './core/GameEvent'
import type { Position } from '../types/common'

/**
 * 🎁 物品生成器组件
 */
export class ItemSpawnerComponent extends ComponentBase {
  private spawnInterval: number = 5000  // 毫秒
  private lastSpawnTime: number = 0
  private enabled: boolean = true
  
  constructor(scene: any) {
    super(scene, 'item_spawner', '物品生成器')
  }
  
  public init(params: any): void {
    super.init(params)
    if (params?.spawnInterval) {
      this.spawnInterval = params.spawnInterval
    }
    console.log(`🎁 物品生成器初始化，间隔：${this.spawnInterval}ms`)
  }
  
  public update(deltaTime: number): void {
    if (!this.enabled) return
    
    const now = Date.now()
    if (now - this.lastSpawnTime >= this.spawnInterval) {
      this.spawnItem()
      this.lastSpawnTime = now
    }
  }
  
  private spawnItem(): void {
    // 随机位置
    const position: Position = {
      x: Math.random() * 800,
      y: Math.random() * 600
    }
    
    // 发送物品生成事件
    this.emit({
      type: GameEventType.ITEM_SPAWNED,
      payload: {
        itemType: 'food',
        position,
        value: 10
      },
      timestamp: Date.now()
    })
    
    console.log(`🎁 生成物品：(${position.x}, ${position.y})`)
  }
  
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
  
  public setSpawnInterval(interval: number): void {
    this.spawnInterval = interval
  }
  
  protected handleEvent(event: GameEvent): void {
    if (event.type === GameEventType.GAME_OVER) {
      this.enabled = false
    }
  }
}
```

---

## 🔧 高级用法

### 1. 自定义事件类型

```typescript
// 扩展 GameEventType
export enum CustomGameEventType {
  PLAYER_DASH = 'player_dash',
  ENEMY_DEFEATED = 'enemy_defeated',
  POWER_UP_ACTIVATED = 'power_up_activated'
}

// 在 Payload 映射中添加
interface CustomGameEventPayload {
  [CustomGameEventType.PLAYER_DASH]: {
    distance: number
    direction: string
  }
  [CustomGameEventType.ENEMY_DEFEATED]: {
    enemyId: string
    score: number
  }
}
```

---

### 2. 组合多个组件

```typescript
// 创建复杂的游戏逻辑
class SnakeGameScene extends Phaser.Scene {
  private container: ComponentContainer
  private gameState: GameStateComponent
  private snakeMovement: SnakeMovementComponent
  private scoreManager: ScoreManagerComponent
  private itemSpawner: ItemSpawnerComponent
  
  constructor() {
    super('SnakeGame')
    this.container = new ComponentContainer()
  }
  
  create() {
    // 创建并添加所有组件
    this.gameState = new GameStateComponent(this)
    this.snakeMovement = new SnakeMovementComponent(this)
    this.scoreManager = new ScoreManagerComponent(this)
    this.itemSpawner = new ItemSpawnerComponent(this)
    
    this.container.add(this.gameState)
    this.container.add(this.snakeMovement)
    this.container.add(this.scoreManager)
    this.container.add(this.itemSpawner)
    
    // 初始化
    this.container.initAll()
    
    // 开始游戏
    this.gameState.startGame()
  }
  
  update(time: number, delta: number) {
    // 更新所有组件
    this.container.updateAll(delta)
  }
}
```

---

### 3. 组件间通信

```typescript
// 方式 1: 通过事件通信（推荐）
class ComponentA extends ComponentBase {
  doSomething() {
    this.emit({
      type: GameEventType.SOME_EVENT,
      payload: { data: 'hello' }
    })
  }
}

class ComponentB extends ComponentBase {
  protected handleEvent(event: GameEvent): void {
    if (event.type === GameEventType.SOME_EVENT) {
      console.log('收到消息:', event.payload.data)
    }
  }
}

// 方式 2: 通过容器获取其他组件
class ComponentC extends ComponentBase {
  useOtherComponent() {
    const otherComp = this.container.get<ComponentD>('component_d_id')
    if (otherComp) {
      otherComp.doSomething()
    }
  }
}
```

---

## 📖 API 参考

### ComponentBase

| 方法 | 说明 | 参数 |
|------|------|------|
| `constructor(scene, id, name)` | 构造函数 | scene: 场景对象<br>id: 组件 ID<br>name: 组件名称 |
| `init(params)` | 初始化组件 | params: 任意参数 |
| `update(deltaTime)` | 每帧更新 | deltaTime: 帧间隔 (ms) |
| `destroy()` | 销毁组件 | - |
| `on(event)` | 接收事件 | event: GameEvent |
| `emit(event)` | 发送事件 | event: GameEvent |

---

### ComponentContainer

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `add(component)` | 添加组件 | 组件实例 |
| `remove(id)` | 移除组件 | void |
| `get<T>(id)` | 获取组件 | T \\| undefined |
| `getAll()` | 获取所有组件 | IComponent[] |
| `initAll(params)` | 初始化所有组件 | void |
| `updateAll(deltaTime)` | 更新所有组件 | void |
| `broadcast(event)` | 广播事件 | void |
| `setEnabled(enabled, ids?)` | 启用/禁用组件 | void |
| `has(id)` | 检查组件是否存在 | boolean |
| `count()` | 组件数量 | number |

---

### EventBus

| 方法 | 说明 | 参数 |
|------|------|------|
| `getInstance()` | 获取单例 | - |
| `on(type, listener, once?)` | 监听事件 | type: 事件类型<br>listener: 回调函数<br>once: 是否一次性 |
| `once(type, listener)` | 一次性监听 | type: 事件类型<br>listener: 回调函数 |
| `off(subscriptionId)` | 取消订阅 | subscriptionId: 订阅 ID |
| `offAll(type)` | 取消某事件的所有订阅 | type: 事件类型 |
| `emit(event)` | 发送事件 | event: GameEvent |
| `clearAll()` | 清空所有订阅 | - |

---

## 🎨 最佳实践

### 1. 组件设计原则

✅ **单一职责**: 一个组件只做一件事
```typescript
// ✅ 好的设计
class SnakeMovementComponent {}  // 只负责移动
class SnakeRenderer {}            // 只负责渲染
class CollisionDetectionComponent {} // 只负责碰撞检测

// ❌ 不好的设计
class SnakeComponent {  // 什么都做
  updatePosition() {}
  render() {}
  checkCollision() {}
  manageScore() {}
}
```

---

### 2. 事件命名规范

✅ **使用过去式**: 表示已经发生的事
```typescript
GameEventType.SCORE_CHANGED      // ✅
GameEventType.CHANGE_SCORE       // ❌

GameEventType.ITEM_COLLECTED     // ✅
GameEventType.COLLECT_ITEM       // ❌
```

---

### 3. 日志输出规范

✅ **使用 Emoji 前缀**: 便于快速识别
```typescript
console.log('✅ 组件初始化完成')
console.log('❌ 发生错误')
console.log('⚠️ 警告信息')
console.log('🔄 状态改变')
console.log('🎮 游戏开始')
console.log('💀 游戏结束')
console.log('🏆 新纪录')
```

---

### 4. 错误处理

✅ **包裹 try-catch**
```typescript
public update(deltaTime: number): void {
  try {
    // 可能出错的代码
    this.riskyOperation()
  } catch (error) {
    console.error(`❌ [${this.name}] 更新失败:`, error)
  }
}
```

---

## 🔍 调试技巧

### 1. 查看组件状态

```typescript
// 获取组件统计信息
const stats = container.getStats()
console.log(stats)
// 输出：{ total: 5, active: 4, disabled: 1 }

// 查看所有组件
container.getAll().forEach(comp => {
  console.log(`${comp.id}: ${comp.name} (${comp.enabled ? 'active' : 'disabled'})`)
})
```

### 2. 跟踪事件流

```typescript
// 监听所有事件
EventBus.getInstance().on('*', (event) => {
  console.log(`📨 事件：${event.type}`, event.payload)
})
```

### 3. 性能分析

```typescript
// 记录更新时间
const start = performance.now()
container.updateAll(deltaTime)
const end = performance.now()
console.log(`⏱️ 更新耗时：${end - start}ms`)
```

---

## 📚 更多资源

- 📖 [README.md](./README.md) - 框架介绍
- 🚀 [QUICK_START.md](./docs/QUICK_START.md) - 详细教程
- 📊 [FRAMEWORK_CORE_ARCHITECTURE_COMPLETE.md](./FRAMEWORK_CORE_ARCHITECTURE_COMPLETE.md) - 架构报告

---

**祝你编码愉快！** 🎉
