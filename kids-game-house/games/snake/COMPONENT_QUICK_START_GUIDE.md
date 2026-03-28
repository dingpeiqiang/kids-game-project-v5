# 🎮 贪吃蛇组件化架构 - 快速开始指南

**版本**: v1.0 - 组件化架构  
**创建日期**: 2026-03-28  
**状态**: ✅ 核心组件已完成

---

## 📋 目录结构

```
snake/
└── src/
    └── components/
        ├── core/              # 核心组件层
        │   ├── IComponent.ts           # 组件接口定义
        │   ├── GameEvent.ts            # 事件系统定义
        │   ├── EventBus.ts             # 事件总线实现
        │   ├── ComponentBase.ts        # 组件基类
        │   ├── ComponentContainer.ts   # 组件容器
        │   └── index.ts                # 统一导出
        │
        ├── rendering/         # 渲染组件层
        │   ├── BackgroundRenderer.ts   # 背景渲染器
        │   ├── GridRenderer.ts         # 网格渲染器
        │   └── index.ts                # 统一导出（待完成）
        │
        └── logic/             # 逻辑组件层
            └── GameStateComponent.ts   # 游戏状态管理
```

---

## 🚀 五分钟快速开始

### 步骤 1: 导入组件

```typescript
import { ComponentContainer } from '@/components/core/ComponentContainer'
import { BackgroundRenderer } from '@/components/rendering/BackgroundRenderer'
import { GridRenderer } from '@/components/rendering/GridRenderer'
import { GameStateComponent } from '@/components/logic/GameStateComponent'
```

### 步骤 2: 创建组件容器

```typescript
// 在 Phaser Scene 中
export class MyGameScene extends Phaser.Scene {
  private componentContainer: ComponentContainer
  
  constructor() {
    super('MyGameScene')
    this.componentContainer = new ComponentContainer()
  }
}
```

### 步骤 3: 注册组件

```typescript
preload() {
  // 注册背景渲染器
  const bgRenderer = new BackgroundRenderer(this)
  this.componentContainer.add(bgRenderer)
  
  // 注册网格渲染器
  const gridRenderer = new GridRenderer(this)
  this.componentContainer.add(gridRenderer)
  
  // 注册游戏状态管理器
  const gameState = new GameStateComponent(this)
  this.componentContainer.add(gameState)
}
```

### 步骤 4: 初始化组件

```typescript
create() {
  // 初始化所有组件
  this.componentContainer.initAll({
    theme: loadedTheme,
    screenWidth: 720,
    screenHeight: 1280,
    cellSize: 40,
    gridCols: 32,
    gridRows: 18,
    safeTop: 44,
    safeBottom: 34
  })
  
  // 开始游戏
  const gameState = this.componentContainer.get<GameStateComponent>('game_state')
  if (gameState) {
    gameState.startGame()
  }
}
```

### 步骤 5: 更新组件

```typescript
update(time: number, delta: number) {
  // 更新所有启用的组件
  this.componentContainer.updateAll(delta)
}
```

---

## 💡 核心概念

### 1. 组件接口 (IComponent)

所有组件必须实现的基础接口：

```typescript
interface IComponent {
  readonly id: string          // 组件唯一标识
  readonly name: string        // 组件显示名称
  enabled: boolean             // 启用状态
  
  init?(params: any): void     // 初始化
  update?(deltaTime: number): void  // 更新
  destroy?(): void             // 销毁
  
  on?(event: GameEvent): void  // 接收事件
  emit?(event: GameEvent): void // 发布事件
}
```

### 2. 组件基类 (ComponentBase)

提供通用实现的抽象基类：

```typescript
export abstract class ComponentBase implements IComponent {
  protected scene: Phaser.Scene
  protected eventBus: EventBus
  
  constructor(scene: Phaser.Scene, id: string, name: string) {
    this.scene = scene
    this.id = id
    this.name = name
    this.eventBus = EventBus.getInstance()
  }
  
  // ... 默认实现的方法
}
```

### 3. 组件容器 (ComponentContainer)

统一管理所有组件的容器：

```typescript
const container = new ComponentContainer()

// 添加组件
container.add(new BackgroundRenderer(scene))

// 获取组件
const renderer = container.get<BackgroundRenderer>('background_renderer')

// 初始化所有
container.initAll(params)

// 更新所有
container.updateAll(deltaTime)

// 广播事件
container.broadcast(event)

// 销毁所有
container.destroyAll()
```

### 4. 事件系统 (EventBus)

组件间解耦通信的事件总线：

```typescript
// 获取单例
const eventBus = EventBus.getInstance()

// 订阅事件
eventBus.on(GameEventType.GAME_START, (event) => {
  console.log('游戏开始了!')
})

// 发布事件
eventBus.emit({
  type: GameEventType.GAME_START,
  payload: {},
  timestamp: Date.now()
})

// 取消订阅
eventBus.off(subscriptionId)
```

---

## 🎯 组件拔插示例

### 示例 1: 禁用网格渲染

```typescript
// 禁用网格组件
container.disable('grid_renderer')

// 稍后重新启用
container.enable('grid_renderer')

// 切换状态
container.toggle('grid_renderer')
```

### 示例 2: 替换背景渲染器

```typescript
// 创建新的背景渲染器
const newBgRenderer = new CartoonBackgroundRenderer(scene)

// 替换旧组件
container.remove('background_renderer')
container.add(newBgRenderer)

console.log('✅ 背景已替换为卡通风格')
```

### 示例 3: 动态加载组件

```typescript
// 游戏升级到 V2.0：添加粒子效果
if (!container.has('particle_renderer')) {
  const particleRenderer = new ParticleRenderer(scene)
  container.add(particleRenderer)
  particleRenderer.init({ theme: currentTheme })
  console.log('✨ 粒子系统已加载')
}
```

---

## 📊 组件统计信息

```typescript
// 获取容器统计
const stats = container.getStats()
console.log(stats)
// 输出:
// {
//   total: 5,           // 总组件数
//   active: 4,          // 启用组件数
//   disabled: 1,        // 禁用组件数
//   componentIds: [...] // 所有组件 ID
// }

// 获取事件总线统计
const eventStats = eventBus.getStats()
console.log(eventStats)
// 输出:
// {
//   totalEventTypes: 15,
//   totalSubscriptions: 8,
//   eventTypes: ['GAME_START', 'SNAKE_MOVE', ...]
// }
```

---

## 🔍 调试技巧

### 1. 查看组件日志

所有组件都有详细的日志输出：

```
🧩 [ComponentBase] 组件已创建：背景渲染器 (background_renderer)
✅ [ComponentContainer] 添加组件：背景渲染器 (background_renderer)
🔧 [ComponentBase] 初始化组件：背景渲染器
✅ [BackgroundRenderer] 背景渲染器初始化完成
🖼️ [BackgroundRenderer] 使用图片背景：scene_bg_fullscreen
```

### 2. 监控事件流

```typescript
// 监听所有事件
eventBus.on('*', (event) => {
  console.log(`📡 事件：${event.type}`, event.payload)
})
```

### 3. 性能分析

```typescript
// 统计组件更新时间
const start = performance.now()
container.updateAll(delta)
const end = performance.now()
console.log(`⏱️ 组件更新耗时：${(end - start).toFixed(2)}ms`)
```

---

## ⚠️ 注意事项

### 1. 组件生命周期

```typescript
// ✅ 正确：按顺序调用
container.add(component)
container.initAll(params)
container.updateAll(delta)
container.destroyAll()

// ❌ 错误：跳过初始化直接更新
container.add(component)
container.updateAll(delta)  // ⚠️ 组件尚未初始化！
```

### 2. 事件处理

```typescript
// ✅ 推荐：在 handleEvent 中处理
protected handleEvent(event: GameEvent): void {
  switch (event.type) {
    case GameEventType.SNAKE_MOVE:
      this.renderSnake(event.payload)
      break
  }
}

// ❌ 不推荐：直接在 on 方法中处理
on(event: GameEvent): void {
  if (event.type === GameEventType.SNAKE_MOVE) {
    this.renderSnake(event.payload)
  }
}
```

### 3. 资源清理

```typescript
// ✅ 必须：在 destroy 中清理资源
destroy(): void {
  super.destroy()
  
  if (this.graphics) {
    this.graphics.destroy()
    this.graphics = null
  }
}

// ❌ 禁止：不清理资源导致内存泄漏
destroy(): void {
  // ⚠️ 没有清理 Phaser 对象！
}
```

---

## 📚 下一步

### 已完成组件 ✅
- [x] IComponent - 组件接口
- [x] GameEvent - 事件系统
- [x] EventBus - 事件总线
- [x] ComponentBase - 组件基类
- [x] ComponentContainer - 组件容器
- [x] BackgroundRenderer - 背景渲染器
- [x] GridRenderer - 网格渲染器
- [x] GameStateComponent - 游戏状态管理

### 待开发组件 ⏳
- [ ] SnakeRenderer - 蛇渲染器
- [ ] FoodRenderer - 食物渲染器
- [ ] ParticleRenderer - 粒子渲染器
- [ ] ItemRenderer - 道具渲染器
- [ ] SnakeMovementComponent - 蛇移动逻辑
- [ ] CollisionDetectionComponent - 碰撞检测
- [ ] FoodSpawnerComponent - 食物生成器
- [ ] ScoreManagerComponent - 分数管理
- [ ] InputHandlerComponent - 输入处理

---

## 🎉 总结

通过组件化架构，我们实现了：

1. **真正的即插即用**: 组件可以自由添加、移除、替换
2. **高度解耦**: 通过事件总线实现组件间通信
3. **易于测试**: 每个组件可独立测试
4. **渐进式升级**: 通过添加新组件实现功能升级，无需重写代码

**复用现有组件**:
```typescript
// 只需 3 行代码即可添加背景渲染功能
const bgRenderer = new BackgroundRenderer(scene)
container.add(bgRenderer)
bgRenderer.init(params)
```

**扩展新功能**:
```typescript
// 创建新组件并注册
class MyCustomComponent extends ComponentBase {
  // ... 实现自定义逻辑
}

container.add(new MyCustomComponent(scene))
```

---

**最后更新**: 2026-03-28  
**维护者**: Lingma AI Assistant  
**状态**: ✅ 核心架构已完成
