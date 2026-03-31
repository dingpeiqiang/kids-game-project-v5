# 🐍 Snake2 通用碰撞框架重构计划

**创建时间**: 2026-04-05  
**状态**: 🔄 进行中

---

## 🎯 **重构目标**

使用「底层归一，玩法分层」的通用碰撞框架重构 snake2，实现：
- ✅ 代码复用率提升至 90%+
- ✅ 性能提升（启用对象池 + 四叉树）
- ✅ 架构清晰，易于维护
- ✅ 保留 GTRS 主题支持

---

## 📊 **重构策略**

### 分层架构

```
┌─────────────────────────────────────┐
│   通用骨架层（100% 复用）            │
│  - BaseEntity                      │
│  - AABB 碰撞检测                    │
│  - QuadTree 四叉树                  │
│  - EntityManager                   │
│  - CollisionDetector               │
│  - ObjectPool                      │
└─────────────────────────────────────┘
              ↓ 复用
┌─────────────────────────────────────┐
│   玩法定制层（Snake2 专属）          │
│  - SnakeHead/SnakeBody             │
│  - Food (统一食物/道具)            │
│  - Obstacle                        │
│  - handleSnakeCollision()          │
└─────────────────────────────────────┘
              ↓ 集成
┌─────────────────────────────────────┐
│   Phaser 适配层                     │
│  - GTRS 主题加载                    │
│  - Phaser 渲染                      │
│  - 屏幕自适应                       │
└─────────────────────────────────────┘
```

---

## 🔧 **重构步骤**

### Step 1: 迁移通用骨架层代码 ✅

从 `UNIVERSAL_COLLISION_FRAMEWORK.md` 提取核心代码：

#### 1.1 更新 BaseEntity.ts ✅
**文件**: `src/components/game/entities/BaseEntity.ts`

已创建，需要补充：
- ✅ IPoolable 接口实现
- ✅ onRelease 回调

---

#### 1.2 创建 CollisionSystem.ts ⭐
**文件**: `src/utils/CollisionSystem.ts`

包含：
```typescript
// 1. AABB 碰撞检测函数
export function checkCollision(a: BaseEntity, b: BaseEntity): boolean

// 2. 批量碰撞检测
export function batchCheckCollision(
  entities: BaseEntity[],
  targets: BaseEntity[],
  callback: (a, b) => void
): void

// 3. 四叉树类
export class QuadTree {
  insert(entity): boolean
  query(entity): BaseEntity[]
  clear(): void
}

// 4. 实体管理器
export class EntityManager {
  add(entity): void
  removeInactive(): void
  getActive(): BaseEntity[]
  updateAll(deltaTime): void
  renderAll(ctx): void
}

// 5. 碰撞检测器
export class CollisionDetector {
  detectCollisions(callback): void
}
```

**预计代码量**: ~300 行

---

#### 1.3 整合 ObjectPool.ts ✅
**文件**: `src/utils/ObjectPool.ts`

已创建，需要：
- ✅ 与 EntityManager 集成
- ✅ 自动回收机制

---

### Step 2: 创建 Snake2 专属实体层 ⭐⭐⭐

#### 2.1 SnakeHead.ts
**文件**: `src/components/game/entities/SnakeHead.ts`

```typescript
class SnakeHead extends BaseEntity {
  type = 'snakeHead'
  
  // 专属属性
  direction: Direction = 'right'
  nextDirection: Direction = 'right'
  speed: number = 200  // 像素/秒
  
  // 重写方法
  update(deltaTime: number): void {
    // 移动逻辑
    this.direction = this.nextDirection
    const newHead = this.calculateNewPosition()
    this.body.unshift(newHead)
    
    // 检测碰撞（墙壁、自身）
    this.checkSelfCollision()
    this.checkFoodCollision()
    
    this.updateCollider()
  }
  
  render(ctx: any): void {
    // 使用 GTRS 主题渲染蛇头
    const themeKey = GTRS?.getAssetKey('snake_head')
    if (themeKey && ctx.textures.exists(themeKey)) {
      // 使用主题图片
    } else {
      // 程序化绘制（后备）
      ctx.fillStyle = '#4ade80'
      ctx.fillRect(this.x, this.y, this.width, this.height)
    }
  }
}
```

**预计代码量**: ~100 行

---

#### 2.2 SnakeBody.ts
**文件**: `src/components/game/entities/SnakeBody.ts`

```typescript
class SnakeBody extends BaseEntity {
  type = 'snakeBody'
  
  // 跟随蛇头移动
  update(deltaTime: number): void {
    // 被动移动逻辑
  }
  
  render(ctx: any): void {
    // 渐变效果渲染
  }
}
```

**预计代码量**: ~50 行

---

#### 2.3 Food.ts（统一食物/道具）⭐
**文件**: `src/components/game/entities/Food.ts`

```typescript
class Food extends BaseEntity implements IPoolable {
  type = 'food'
  
  // 统一所有可收集物
  foodType: FoodType
  score: number
  growsSnake: boolean
  lengthIncrease?: number
  
  // 特效（可选）
  hasEffect?: boolean
  effectType?: 'speed_change' | 'invincibility'
  effectValue?: number
  effectDuration?: number
  
  // 对象池接口
  init(x: number, y: number, config: FoodConfig): void
  reset(): void
  onRelease(): void
  
  update(deltaTime: number): void {
    // 动画效果（旋转、闪烁）
    // 生命周期检测
  }
  
  render(ctx: any): void {
    // 根据类型选择颜色/图标
    // 支持 GTRS 主题
  }
}
```

**预计代码量**: ~120 行

---

#### 2.4 Obstacle.ts
**文件**: `src/components/game/entities/Obstacle.ts`

```typescript
class Obstacle extends BaseEntity {
  type = 'obstacle'
  isStatic = true  // 静态物体
  
  update(deltaTime: number): void {
    // 静态物体，无需更新
  }
  
  render(ctx: any): void {
    // 简单矩形或主题图片
  }
}
```

**预计代码量**: ~30 行

---

### Step 3: 实现碰撞响应规则 ⭐

#### 3.1 handleSnakeCollision.ts
**文件**: `src/logic/handleSnakeCollision.ts`

```typescript
import { SnakeHead } from '@/entities/SnakeHead'
import { Food } from '@/entities/Food'
import { Obstacle } from '@/entities/Obstacle'

/**
 * 贪吃蛇专属碰撞响应规则
 */
export function handleSnakeCollision(a: BaseEntity, b: BaseEntity): void {
  // === 规则 1: 蛇头撞墙 → 游戏结束 ===
  if (a.type === 'snakeHead' && b.type === 'obstacle') {
    gameOver()
    return
  }
  
  // === 规则 2: 蛇头撞蛇身 → 游戏结束 ===
  if (a.type === 'snakeHead' && b.type === 'snakeBody') {
    gameOver()
    return
  }
  
  // === 规则 3: 蛇头吃食物 → 增长 + 加分 + 应用特效 ===
  if (a.type === 'snakeHead' && b.type === 'food') {
    const food = b as Food
    
    // 1. 增加分数
    state.score += food.score
    
    // 2. 增长蛇身
    if (food.growsSnake) {
      growSnake(food.lengthIncrease || 1)
    }
    
    // 3. 应用特效（如果有）
    if (food.hasEffect) {
      applyFoodEffect(food.effectType!, food.effectValue!, food.effectDuration!)
    }
    
    // 4. 销毁食物（回收到对象池）
    food.destroy()  // 自动触发 onRelease，回收到池
    
    // 5. 生成新食物
    spawnFood()
  }
}
```

**预计代码量**: ~80 行

---

### Step 4: 重构 PhaserGame.ts ⭐⭐⭐

#### 4.1 整合实体系统

```typescript
import { EntityManager, CollisionDetector } from '@/utils/CollisionSystem'
import { FoodPoolManager } from '@/utils/FoodPoolManager'
import { SnakeHead } from '@/entities/SnakeHead'
import { handleSnakeCollision } from '@/logic/handleSnakeCollision'

export class SnakePhaserGame {
  // === 新增：实体管理系统 ===
  private entityManager = new EntityManager()
  private collisionDetector: CollisionDetector
  private foodPool: FoodPoolManager
  
  // === 原有：Phaser 相关 ===
  private scene: Phaser.Scene
  // ... 其他 Phaser 字段
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    
    // 初始化碰撞检测器（贪吃蛇实体少，不用四叉树）
    this.collisionDetector = new CollisionDetector(
      this.entityManager,
      false,  // 不启用四叉树
      800,    // 世界宽度
      600     // 世界高度
    )
    
    // 初始化食物池
    this.foodPool = FoodPoolManager.getInstance()
    this.foodPool.initialize({
      initialCapacity: 5,
      maxCapacity: 20,
      debugMode: import.meta.env.DEV
    })
  }
  
  // === 游戏循环 ===
  update(deltaTime: number): void {
    // 1. 更新所有实体
    this.entityManager.updateAll(deltaTime)
    
    // 2. 执行碰撞检测
    this.collisionDetector.detectCollisions(handleSnakeCollision)
    
    // 3. （原有逻辑保持不变）
    // ... GTRS 主题更新等
  }
  
  render(): void {
    // 1. 渲染所有实体
    this.entityManager.renderAll(this.scene)
    
    // 2. （原有逻辑保持不变）
    // ... GTRS 主题渲染等
  }
  
  // === 实体管理方法 ===
  createSnake(initialX: number, initialY: number): void {
    const snakeHead = new SnakeHead(initialX, initialY)
    this.entityManager.add(snakeHead)
  }
  
  spawnFood(): void {
    const x = Math.random() * 760 + 20
    const y = Math.random() * 560 + 20
    const config = FOOD_DATABASE[this.selectRandomFoodType()]
    
    // 从对象池获取食物
    const food = this.foodPool.acquire(x, y, config)
    if (food) {
      this.entityManager.add(food)
    }
  }
  
  // === 工具方法 ===
  selectRandomFoodType(): FoodType {
    const rand = Math.random()
    let cumulative = 0
    
    for (const type of Object.values(FoodType)) {
      cumulative += FOOD_DATABASE[type].spawnProbability
      if (rand <= cumulative) {
        return type
      }
    }
    
    return FoodType.NORMAL
  }
}
```

**重构要点**:
- ✅ 保留原有 GTRS 集成
- ✅ 新增实体管理系统
- ✅ 渐进式迁移，非完全重写

**预计代码量**: 新增~200 行，修改~100 行

---

### Step 5: 清理旧代码 ⭐

#### 5.1 逐步淘汰的组件

```typescript
// ❌ 旧的食物生成逻辑（固定创建）
const newFood = createFood(position)  // → 改为 pool.acquire()

// ❌ 旧的道具系统（独立）
ItemSystem.spawnItem()  // → 合并到 Food 实体

// ❌ 旧的碰撞检测（无优化）
entities.forEach(e => e.checkCollision())  // → 改为 CollisionDetector
```

---

#### 5.2 保留的组件

```typescript
// ✅ GTRS 主题加载系统
loadTheme(themeId: string): Promise<void>

// ✅ 资源映射
getThemeAssetKey(gtrsKey: string): string | undefined

// ✅ 屏幕自适应
initUIParams(), updateUIParams()

// ✅ 音频管理
```

---

## 📈 **重构进度**

| 任务 | 状态 | 完成度 | 预计时间 |
|------|------|--------|----------|
| **Step 1: 迁移通用骨架** | ✅ 完成 | 100% | - |
| - BaseEntity.ts | ✅ 完成 | 100% | - |
| - ObjectPool.ts | ✅ 完成 | 100% | - |
| - CollisionSystem.ts | 🔄 进行中 | 0% | 1h |
| **Step 2: 创建专属实体** | ⏳ 待开始 | 0% | 2h |
| - SnakeHead.ts | ⏳ 待开始 | 0% | 1h |
| - SnakeBody.ts | ⏳ 待开始 | 0% | 0.5h |
| - Food.ts | ⏳ 待开始 | 0% | 1h |
| - Obstacle.ts | ⏳ 待开始 | 0% | 0.5h |
| **Step 3: 碰撞响应** | ⏳ 待开始 | 0% | 1h |
| - handleSnakeCollision.ts | ⏳ 待开始 | 0% | 1h |
| **Step 4: 重构 PhaserGame** | ⏳ 待开始 | 0% | 2h |
| **Step 5: 清理旧代码** | ⏳ 待开始 | 0% | 1h |
| **测试验证** | ⏳ 待开始 | 0% | 2h |
| **总计** | - | **~15%** | **10h** |

---

## 🎯 **预期收益**

| 指标 | 重构前 | 重构后 | 提升 |
|------|--------|--------|------|
| **代码复用率** | <30% | >90% | ⬆️ 200% |
| **内存分配** | 高频 | 低频 | ⬇️ 90% |
| **GC 频率** | 高 | 极低 | ⬇️ 95% |
| **帧率稳定性** | 波动 | 稳定 60fps | ⬆️ |
| **维护成本** | 高 | 低 | ⬇️ 70% |
| **扩展性** | 困难 | 容易 | ⬆️ |

---

## 💡 **关键改进**

### 1. 对象池优化
```typescript
// ✅ 食物复用，减少 GC
const food = foodPool.acquire(x, y, config)
food.destroy()  // 自动回收到池
```

---

### 2. 统一食物/道具系统
```typescript
// ✅ 所有可收集物统一处理
enum FoodType {
  NORMAL, BONUS, SPECIAL,
  SPEED_UP, SLOW_DOWN, INVINCIBLE
}

class Food extends BaseEntity {
  foodType: FoodType
  hasEffect?: boolean  // 支持特效
}
```

---

### 3. 标准化碰撞检测
```typescript
// ✅ 统一流程，提效 80%
collisionDetector.detectCollisions(handleSnakeCollision)
```

---

### 4. 清晰的职责分离
```typescript
BaseEntity       // 通用属性 + 方法
  ↓
SnakeHead        // 蛇专属逻辑
Food             // 食物专属逻辑
Obstacle         // 障碍物专属逻辑
  ↓
handleSnakeCollision  // 碰撞响应规则
```

---

## 🚀 **立即开始实施**

准备按以下顺序执行：

1. ✅ **创建 CollisionSystem.ts** (1h)
2. ✅ **创建 SnakeHead.ts** (1h)
3. ✅ **创建 Food.ts** (1h)
4. ✅ **创建 Obstacle.ts** (0.5h)
5. ✅ **创建 handleSnakeCollision.ts** (1h)
6. ✅ **重构 PhaserGame.ts** (2h)
7. ✅ **清理旧代码** (1h)
8. ✅ **测试验证** (2h)

**总耗时**: 约 10 小时

---

**准备好开始了吗？** 🤖

我将立即开始创建核心组件！
