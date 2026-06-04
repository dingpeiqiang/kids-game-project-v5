# 📖 GCRS 关卡系统 - API 参考文档

**版本**: v1.3.0-dev  
**创建时间**: 2026-04-02  
**状态**: ✅ Phase 3 完成

---

## 📋 目录

1. [核心类](#核心类)
2. [组件](#组件)
3. [类型定义](#类型定义)
4. [事件系统](#事件系统)
5. [工具函数](#工具函数)
6. [配置接口](#配置接口)

---

## 🔧 核心类

### SnakeGameLogic

游戏核心逻辑控制器

**位置**: `src/scenes/SnakeGameLogic.ts`

#### 构造函数

```typescript
constructor(scene: any)
```

**参数**:
- `scene`: Phaser.Scene - Phaser 场景实例

**示例**:
```typescript
const scene = new Phaser.Scene('SnakeGame')
const gameLogic = new SnakeGameLogic(scene)
```

---

#### 方法

##### startGame()

启动游戏

```typescript
public startGame(): void
```

**副作用**:
- 初始化蛇
- 生成第一个食物
- 设置游戏状态为 PLAYING
- 发射 GAME_START 事件

**示例**:
```typescript
gameLogic.startGame()
```

---

##### update(delta: number)

游戏主循环（每帧调用）

```typescript
public update(delta: number): void
```

**参数**:
- `delta`: number - 距离上一帧的时间间隔（毫秒）

**执行流程**:
1. 累积时间
2. 达到移动间隔时更新蛇位置
3. 检测碰撞
4. 处理食物效果

**示例**:
```typescript
// 在 Scene 的 update 方法中调用
update(time: number, delta: number) {
  this.gameLogic.update(delta)
}
```

---

##### spawnFood()

生成食物

```typescript
public spawnFood(x?: number, y?: number, type?: FoodType): void
```

**参数**:
- `x?`: number - 可选的 X 坐标（网格坐标）
- `y?`: number - 可选的 Y 坐标
- `type?`: FoodType - 可选的食物类型

**行为**:
- 如果未指定坐标，则随机生成
- 如果指定了类型，则生成该类型的食物
- 发射 FOOD_SPAWN 事件

**示例**:
```typescript
// 随机生成普通食物
gameLogic.spawnFood()

// 在指定位置生成奖励食物
gameLogic.spawnFood(5, 5, FoodType.BONUS)
```

---

##### changeDirection(direction: Direction)

改变蛇的移动方向

```typescript
public changeDirection(direction: Direction): void
```

**参数**:
- `direction`: Direction - 新方向（'up' | 'down' | 'left' | 'right'）

**限制**:
- 不能直接反向（如从 up 直接变为 down）
- 使用缓冲机制防止快速连续转向导致的误操作

**示例**:
```typescript
gameLogic.changeDirection('left')
```

---

##### gameOver()

结束游戏

```typescript
public gameOver(): void
```

**行为**:
- 设置游戏状态为 GAME_OVER
- 停止游戏循环
- 发射 GAME_OVER 事件

**示例**:
```typescript
if (collisionDetected) {
  gameLogic.gameOver()
}
```

---

##### restart()

重新开始游戏

```typescript
public restart(): void
```

**行为**:
- 重置所有状态
- 重新初始化蛇
- 重新开始游戏循环

**示例**:
```typescript
// 游戏结束后重新开始
gameLogic.gameOver()
setTimeout(() => gameLogic.restart(), 1000)
```

---

#### 属性

##### gameState

当前游戏状态

```typescript
public get gameState(): GameState
```

**返回值**: GameState - 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'

**示例**:
```typescript
if (gameLogic.gameState === 'PLAYING') {
  console.log('游戏进行中')
}
```

---

##### score

当前分数

```typescript
public get score(): number
```

**示例**:
```typescript
console.log(`当前分数：${gameLogic.score}`)
```

---

##### snake

蛇身体数组

```typescript
public get snake(): SnakeSegment[]
```

**返回值**: SnakeSegment[] - 蛇身体段数组

**示例**:
```typescript
const head = gameLogic.snake[0]
console.log(`蛇头位置：${head.x}, ${head.y}`)
```

---

### EventBus

全局事件总线（单例模式）

**位置**: `src/core/EventBus.ts`

#### 静态方法

##### getInstance()

获取 EventBus 单例实例

```typescript
public static getInstance(): EventBus
```

**返回值**: EventBus - 全局唯一的 EventBus 实例

**示例**:
```typescript
const eventBus = EventBus.getInstance()
```

---

#### 实例方法

##### emit(event: GameEvent)

发射事件

```typescript
public emit(event: GameEvent): void
```

**参数**:
- `event`: GameEvent - 事件对象

**GameEvent 结构**:
```typescript
interface GameEvent {
  type: GameEventType
  payload: any
  timestamp: number
  source?: string
}
```

**示例**:
```typescript
eventBus.emit({
  type: GameEventType.SCORE_CHANGED,
  payload: { score: 100 },
  timestamp: Date.now(),
  source: 'SnakeGameLogic'
})
```

---

##### on(type: GameEventType, callback: Function)

监听事件

```typescript
public on(type: GameEventType, callback: (event: GameEvent) => void): void
```

**参数**:
- `type`: GameEventType - 事件类型
- `callback`: (event: GameEvent) => void - 回调函数

**示例**:
```typescript
eventBus.on(GameEventType.SCORE_CHANGED, (event) => {
  console.log(`分数变化：${event.payload.score}`)
})
```

---

##### off(type: GameEventType, callback?: Function)

取消事件监听

```typescript
public off(type: GameEventType, callback?: Function): void
```

**参数**:
- `type`: GameEventType - 事件类型
- `callback?`: Function - 可选的回调函数，不传则移除该类型的所有监听

**示例**:
```typescript
// 移除特定监听器
eventBus.off(GameEventType.SCORE_CHANGED, myCallback)

// 移除所有该类型的监听
eventBus.off(GameEventType.SCORE_CHANGED)
```

---

## 🧩 组件

### FoodSpawnerComponent

食物生成组件

**位置**: `src/components/logic/FoodSpawnerComponent.ts`

#### 构造函数

```typescript
constructor(scene: any)
```

---

#### 方法

##### spawnFood(snake: SnakeSegment[], obstacles: Obstacle[]): Food

生成食物

```typescript
public spawnFood(
  snake: SnakeSegment[],
  obstacles: Obstacle[] = []
): Food
```

**参数**:
- `snake`: SnakeSegment[] - 蛇身体数组
- `obstacles`: Obstacle[] - 可选的障碍物数组

**返回值**: Food - 生成的食物对象

**行为**:
1. 寻找有效位置（不与蛇和障碍物重叠）
2. 根据概率选择食物类型
3. 创建食物对象
4. 发射 FOOD_SPAWN 事件

**示例**:
```typescript
const food = foodSpawner.spawnFood(gameLogic.snake)
console.log(`食物生成在：${food.x}, ${food.y}`)
```

---

##### setProbability(type: FoodType, probability: number)

设置食物生成概率

```typescript
public setProbability(type: FoodType, probability: number): void
```

**参数**:
- `type`: FoodType - 食物类型
- `probability`: number - 概率值（0-1）

**示例**:
```typescript
foodSpawner.setProbability(FoodType.BONUS, 0.2)
```

---

### SnakeMovementComponent

蛇移动组件

**位置**: `src/components/logic/SnakeMovementComponent.ts`

#### 方法

##### move(snake: SnakeSegment[], direction: Direction): void

移动蛇

```typescript
public move(
  snake: SnakeSegment[],
  direction: Direction
): void
```

**参数**:
- `snake`: SnakeSegment[] - 蛇身体数组
- `direction`: Direction - 移动方向

**行为**:
- 计算新头部位置
- 更新蛇身体数组
- 返回新的蛇状态

**示例**:
```typescript
movementComponent.move(snake, 'right')
```

---

### CollisionDetectionComponent

碰撞检测组件

**位置**: `src/components/logic/CollisionDetectionComponent.ts`

#### 方法

##### checkWallCollision(head: Position, grid: Grid): boolean

检测撞墙

```typescript
public checkWallCollision(
  head: Position,
  grid: Grid
): boolean
```

**参数**:
- `head`: Position - 蛇头位置
- `grid`: Grid - 网格配置

**返回值**: boolean - 是否撞墙

**示例**:
```typescript
if (collisionDetector.checkWallCollision(head, grid)) {
  console.log('撞墙了！')
}
```

---

##### checkSelfCollision(head: Position, snake: SnakeSegment[]): boolean

检测撞自己

```typescript
public checkSelfCollision(
  head: Position,
  snake: SnakeSegment[]
): boolean
```

**参数**:
- `head`: Position - 蛇头位置
- `snake`: SnakeSegment[] - 蛇身体数组

**返回值**: boolean - 是否撞到自己

---

##### checkFoodCollision(head: Position, food: Food): boolean

检测吃食物

```typescript
public checkFoodCollision(
  head: Position,
  food: Food
): boolean
```

**参数**:
- `head`: Position - 蛇头位置
- `food`: Food - 食物对象

**返回值**: boolean - 是否吃到食物

---

## 📝 类型定义

### FoodType

食物类型枚举

```typescript
enum FoodType {
  NORMAL = 'normal',      // 普通食物
  BONUS = 'bonus',        // 奖励食物
  SPECIAL = 'special',    // 特殊食物
  SPEED_UP = 'speed_up',  // 加速食物
  SLOW_DOWN = 'slow_down',// 减速食物
  INVINCIBLE = 'invincible' // 无敌食物
}
```

---

### Food

食物接口

```typescript
interface Food {
  position: Position      // 位置
  type: FoodType          // 类型
  score: number           // 分数
  isActive: boolean       // 是否激活
  effect?: FoodEffect     // 可选的效果
}
```

---

### FoodEffect

食物效果接口

```typescript
interface FoodEffect {
  type: 'speed_change' | 'length_change' | 'invincibility' | 'score_multiplier'
  value: number           // 效果值
  duration: number        // 持续时间（毫秒）
}
```

---

### SnakeSegment

蛇身体段接口

```typescript
interface SnakeSegment {
  x: number              // X 坐标（网格坐标）
  y: number              // Y 坐标
}
```

---

### Position

位置接口

```typescript
interface Position {
  x: number
  y: number
}
```

---

### Direction

方向类型

```typescript
type Direction = 'up' | 'down' | 'left' | 'right'
```

---

### GameState

游戏状态类型

```typescript
type GameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'
```

---

### Objective

关卡目标接口

```typescript
interface Objective {
  id: string                    // 唯一标识
  type: string                  // 目标类型
  title: string                 // 标题
  description: string           // 描述
  target: number                // 目标值
  current: number               // 当前值
  completed: boolean            // 是否完成
}
```

---

## 🎯 事件系统

### GameEventType

游戏事件类型枚举

```typescript
enum GameEventType {
  // 游戏状态
  GAME_START,
  GAME_OVER,
  PAUSE,
  RESUME,
  
  // 蛇相关
  SNAKE_MOVE,
  SNAKE_EAT,
  SNAKE_GROW,
  SNAKE_COLLIDE_WALL,
  SNAKE_COLLIDE_SELF,
  
  // 食物相关
  FOOD_SPAWN,
  FOOD_CONSUMED,
  
  // UI 相关
  SCORE_CHANGED,
  LEVEL_COMPLETE,
  LOAD_PROGRESS,
  LEVEL_LOADED,
  
  // 目标相关
  OBJECTIVE_UPDATED,
  OBJECTIVE_COMPLETE
}
```

---

### 事件格式规范

所有事件遵循统一格式：

```typescript
{
  type: GameEventType,      // 事件类型
  payload: any,             // 事件数据
  timestamp: number,        // 时间戳
  source?: string           // 事件来源（可选）
}
```

---

### 常用事件示例

#### GAME_START

```typescript
eventBus.emit({
  type: GameEventType.GAME_START,
  payload: { level: 1 },
  timestamp: Date.now()
})
```

#### SCORE_CHANGED

```typescript
eventBus.emit({
  type: GameEventType.SCORE_CHANGED,
  payload: { 
    score: 100,
    previousScore: 80,
    delta: 20
  },
  timestamp: Date.now()
})
```

#### FOOD_SPAWN

```typescript
eventBus.emit({
  type: GameEventType.FOOD_SPAWN,
  payload: {
    food: {
      position: { x: 5, y: 5 },
      type: FoodType.BONUS,
      score: 50
    }
  },
  timestamp: Date.now()
})
```

#### LOAD_PROGRESS

```typescript
eventBus.emit({
  type: GameEventType.LOAD_PROGRESS,
  payload: {
    progress: 75,  // 0-100
    message: '正在加载资源...'
  },
  timestamp: Date.now()
})
```

---

## 🔨 工具函数

### FoodTypes 模块

#### createFood(position, type?)

创建食物对象

```typescript
export function createFood(
  position: Position,
  type?: FoodType
): Food
```

**参数**:
- `position`: Position - 食物位置
- `type?`: FoodType - 可选的食物类型，不传则随机选择

**返回值**: Food - 创建的食物对象

**示例**:
```typescript
import { createFood } from './types/FoodTypes'

const food = createFood({ x: 5, y: 5 })
const bonusFood = createFood({ x: 10, y: 10 }, FoodType.BONUS)
```

---

#### getFoodConfig(type)

获取食物配置

```typescript
export function getFoodConfig(type: FoodType): FoodConfig
```

**参数**:
- `type`: FoodType - 食物类型

**返回值**: FoodConfig - 食物配置对象

**示例**:
```typescript
const config = getFoodConfig(FoodType.NORMAL)
console.log(`普通食物分数：${config.baseScore}`)
```

---

#### selectRandomFoodType()

随机选择食物类型

```typescript
export function selectRandomFoodType(): FoodType
```

**返回值**: FoodType - 根据概率分布随机选择的食物类型

**示例**:
```typescript
const type = selectRandomFoodType()
const food = createFood(position, type)
```

---

#### applyFoodEffect(food, gameState)

应用食物效果

```typescript
export function applyFoodEffect(
  food: Food,
  gameState: GameState
): void
```

**参数**:
- `food`: Food - 食物对象
- `gameState`: GameState - 游戏状态对象

**行为**:
- 根据食物类型应用不同效果
- 设置效果的持续时间
- 返回效果描述

**示例**:
```typescript
applyFoodEffect(food, {
  speed: 1.0,
  invincible: false,
  scoreMultiplier: 1.0
})
```

---

## ⚙️ 配置接口

### LevelConfig

关卡配置接口

```typescript
interface LevelConfig {
  levelId: number
  levelName: string
  gridConfig: {
    rows: number
    cols: number
    cellSize: number
  }
  snakeConfig: {
    initialLength: number
    moveInterval: number
    startPosition: Position
  }
  objectives: Objective[]
  foodSpawnConfig: {
    maxFoods: number
    avoidRadius: number
  }
}
```

---

### GameConfig

游戏全局配置

```typescript
interface GameConfig {
  version: string
  debug: boolean
  autoSave: boolean
  saveInterval: number
  maxHistory: number
}
```

---

## 📊 性能指标

### 推荐性能标准

```typescript
interface PerformanceMetrics {
  fps: number              // 帧率，推荐 >= 60
  loadTime: number         // 加载时间，推荐 < 100ms
  memoryUsage: number      // 内存占用，推荐 < 200MB
  renderTime: number       // 渲染时间，推荐 < 16ms
}
```

---

### 性能监控示例

```typescript
// 监控 FPS
let frameCount = 0
let lastTime = performance.now()

function monitorFPS() {
  frameCount++
  const currentTime = performance.now()
  
  if (currentTime - lastTime >= 1000) {
    console.log(`FPS: ${frameCount}`)
    frameCount = 0
    lastTime = currentTime
  }
  
  requestAnimationFrame(monitorFPS)
}

monitorFPS()
```

---

## 🐛 常见问题

### Q1: 如何自定义食物类型？

**A**: 在 FoodTypes.ts 中添加新的枚举值和配置：

```typescript
enum FoodType {
  // ... 现有类型
  CUSTOM = 'custom'  // 添加新类型
}

FOOD_DATABASE[FoodType.CUSTOM] = {
  type: FoodType.CUSTOM,
  baseScore: 150,
  color: '#ff00ff',
  spawnProbability: 0.01,
  growsSnake: true,
  lengthIncrease: 2,
  effect: {
    type: 'score_multiplier',
    value: 2,
    duration: 10000
  }
}
```

---

### Q2: 如何修改蛇的移动速度？

**A**: 在 SnakeGameLogic 中调整 moveInterval：

```typescript
constructor(scene: any) {
  this.moveInterval = 200  // 改为 200ms（更快）
  // this.moveInterval = 400  // 原速度
}
```

---

### Q3: 如何实现新的游戏状态？

**A**: 扩展 GameState 类型并实现相应逻辑：

```typescript
type GameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'CUSTOM_STATE'

// 在 SnakeGameLogic 中处理
case 'CUSTOM_STATE':
  // 自定义状态逻辑
  break
```

---

## 📞 相关文档

- 📚 **[KNOWLEDGE_MAP.md](./KNOWLEDGE_MAP.md)** - 知识地图
- 📚 **[LEARNING_PATH.md](./LEARNING_PATH.md)** - 学习路径
- 📚 **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - 项目结构
- 📚 **[QUICK_START.md](./QUICK_START.md)** - 快速开始

---

**最后更新**: 2026-04-02  
**维护者**: GCRS 开发团队  
**版本**: v1.3.0-dev  
**状态**: Phase 3 完成，准备进入 Phase 4
