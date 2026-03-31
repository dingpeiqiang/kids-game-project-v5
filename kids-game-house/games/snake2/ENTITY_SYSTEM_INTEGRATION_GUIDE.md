# 🐍 Phaser 实体系统集成指南

**创建时间**: 2026-04-05  
**状态**: 🔄 进行中

---

## 🎯 **集成目标**

将轻量级实体系统架构（BaseEntity + SnakeEntity + FoodEntity + ObstacleEntity）集成到现有的 Phaser 项目中，同时保留 GTRS 主题支持。

---

## 📊 **已完成的工作**

### 1. 创建类型定义 ✅

**文件**: `src/types/entity.ts` (93 行)

包含：
- `AABB` 碰撞盒接口
- `SnakeSegment` 蛇身段接口
- `FoodType` 枚举（统一所有可收集物）
- `FoodConfig` 食物配置接口
- `Direction` 方向类型
- `GameState` 游戏状态接口

**关键设计**:
```typescript
export enum FoodType {
  NORMAL = 'normal',      // 普通食物
  BONUS = 'bonus',        // 奖励食物
  SPECIAL = 'special',    // 特殊食物
  SPEED_UP = 'speed_up',  // 加速食物
  SLOW_DOWN = 'slow_down',// 减速食物
  INVINCIBLE = 'invincible' // 无敌食物
}

export interface FoodConfig {
  type: FoodType
  baseScore: number
  growsSnake: boolean
  hasEffect?: boolean      // 是否有特效
  effectType?: 'speed_change' | 'invincibility'
  effectValue?: number
  effectDuration?: number
}
```

---

### 2. 创建实体基类 ✅

**文件**: `src/components/game/entities/BaseEntity.ts` (196 行)

核心功能：
- 通用属性（id, type, x, y, width, height, visible, active）
- AABB 矩形碰撞检测
- 生命周期管理（destroy, onDestroy）
- 抽象方法（update, render）
- 工具方法（roundRect, containsPoint）

**使用示例**:
```typescript
abstract class BaseEntity implements IEntity {
  public id: string = crypto.randomUUID()
  public type: EntityType = 'unknown' as EntityType
  public x: number = 0
  public y: number = 0
  
  public abstract update(deltaTime: number): void
  public abstract render(ctx: any): void
  
  public isCollide(other: BaseEntity): boolean {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    )
  }
}
```

---

## 🚧 **待完成的工作**

### 需要创建的实体类

#### 1. SnakeEntity（蛇主体）
```typescript
class SnakeEntity extends BaseEntity {
  body: SnakeSegment[]     // 蛇身数组
  direction: Direction     // 当前方向
  speed: number           // 移动速度
  alive: boolean          // 存活状态
  
  update(deltaTime: number): void {
    // 移动逻辑
    // 碰撞检测
    // 吃食物逻辑
  }
  
  render(ctx: any): void {
    // 渲染蛇身（带渐变）
    // 渲染眼睛
  }
}
```

---

#### 2. FoodEntity（食物/道具统一类）
```typescript
class FoodEntity extends BaseEntity {
  foodType: FoodType       // 食物类型
  score: number           // 分数
  growsSnake: boolean     // 是否增长蛇身
  hasEffect?: boolean     // 是否有特效
  
  update(deltaTime: number): void {
    // 播放动画（旋转、闪烁）
    // 检查生命周期
  }
  
  render(ctx: any): void {
    // 根据类型选择颜色
    // 绘制圆形食物
    // 添加发光效果（特效食物）
    // 绘制图标
  }
}
```

---

#### 3. ObstacleEntity（障碍物）
```typescript
class ObstacleEntity extends BaseEntity {
  isStatic: boolean       // 静态物体
  
  update(deltaTime: number): void {
    // 静态物体，无需更新
  }
  
  render(ctx: any): void {
    // 绘制矩形（灰色）
    // 添加边框
  }
}
```

---

### 需要重构的现有代码

#### 1. 替换 FoodSpawnerComponent
```typescript
// ❌ 旧方式
spawnFood(): Food {
  const newFood = createFood(position)
  this.emit(FOOD_SPAWN, { food: newFood })
}

// ✅ 新方式
spawnFood(): FoodEntity {
  const config = FOOD_DATABASE[this.selectRandomType()]
  const food = new FoodEntity(x, y, config)
  this.foods.push(food)
  return food
}
```

---

#### 2. 替换 ItemManager
```typescript
// ❌ 旧的道具系统（独立）
ItemManager.spawnItem()
ItemManager.checkCollision()

// ✅ 新的统一食物系统
FoodEntity 已包含特效
PhaserGame.updateFoods()  // 统一处理
```

---

#### 3. 重构 PhaserGame.ts 中的渲染方法
```typescript
// ❌ 旧的渲染方式
renderSnake(snake: SnakeSegment[]) {
  // 遍历数组渲染
}

renderFood(food: Food | null) {
  // 单个食物渲染
}

// ✅ 新的渲染方式
renderEntities() {
  this.snakeEntity.render(this.scene)
  this.foods.forEach(food => food.render(this.scene))
  this.obstacles.forEach(obs => obs.render(this.scene))
}
```

---

## 🔧 **集成步骤**

### Step 1: 创建实体类文件

需要创建：
1. `src/components/game/entities/SnakeEntity.ts`
2. `src/components/game/entities/FoodEntity.ts`
3. `src/components/game/entities/ObstacleEntity.ts`

---

### Step 2: 更新 types/entity.ts

确保类型定义完整：
```typescript
// 已完成的
✅ AABB
✅ SnakeSegment
✅ FoodType
✅ FoodConfig
✅ Direction
✅ GameState

// 可能需要补充的
➖ GameConfig
➖ LevelConfig
```

---

### Step 3: 重构现有组件

#### 3.1 重构 FoodSpawnerComponent
```typescript
// 从
import { createFood } from '@/types/FoodTypes'

// 改为
import { FoodEntity } from './entities/FoodEntity'
import { FOOD_DATABASE } from '@/types/entity'
```

---

#### 3.2 重构 ItemSystem
```typescript
// 建议：逐步淘汰
// Phase 1: 保留但标记为 deprecated
// Phase 2: 迁移到 FoodEntity 的特效系统
// Phase 3: 完全移除
```

---

### Step 4: 更新 PhaserGame.ts

#### 4.1 添加实体管理器
```typescript
class SnakePhaserGame {
  // === 新增实体管理 ===
  private snakeEntity: SnakeEntity | null = null
  private foodEntities: FoodEntity[] = []
  private obstacleEntities: ObstacleEntity[] = []
  
  // === 更新游戏循环 ===
  update(deltaTime: number): void {
    // 更新所有实体
    this.snakeEntity?.update(deltaTime)
    this.foodEntities.forEach(food => food.update(deltaTime))
    
    // 清理销毁的食物
    this.foodEntities = this.foodEntities.filter(f => f.active)
    
    // 碰撞检测
    this.checkEntityCollisions()
  }
  
  // === 统一渲染 ===
  render(): void {
    this.snakeEntity?.render(this.scene)
    this.foodEntities.forEach(food => food.render(this.scene))
    this.obstacleEntities.forEach(obs => obs.render(this.scene))
  }
}
```

---

#### 4.2 保留 GTRS 集成
```typescript
// ✅ GTRS 主题加载保持不变
async loadTheme(themeId: string): Promise<void> {
  // 原有逻辑不变
}

// ✅ 资源映射保持不变
getThemeAssetKey(gtrsKey: string): string | undefined {
  // 原有逻辑不变
}

// ⭐ 在 FoodEntity.render() 中使用 GTRS 资源
render(ctx: any): void {
  const foodKey = this.getThemeAssetKey('food', this.foodType)
  if (foodKey) {
    // 使用主题图片
    ctx.drawImage(this.scene.textures.get(foodKey), ...)
  } else {
    // 程序化绘制（后备方案）
    ctx.fillStyle = this.color
    ctx.arc(...)
  }
}
```

---

### Step 5: 测试验证

#### 5.1 单元测试
```typescript
describe('BaseEntity', () => {
  it('should detect collision correctly', () => {
    const entity1 = new TestEntity()
    const entity2 = new TestEntity()
    
    entity1.x = 0
    entity1.width = 50
    
    entity2.x = 40
    entity2.width = 50
    
    expect(entity1.isCollide(entity2)).toBe(true)
  })
})
```

---

#### 5.2 集成测试
```typescript
describe('SnakeEntity', () => {
  it('should grow when eating food', () => {
    const snake = new SnakeEntity(100, 100)
    const food = new FoodEntity(150, 100, FOOD_DATABASE[FoodType.NORMAL])
    
    snake.update(0.016)
    
    expect(snake.length).toBe(3)
    
    // 吃食物
    snake.eatFood(food)
    
    expect(snake.length).toBe(4)
  })
})
```

---

## 📈 **迁移进度**

| 任务 | 状态 | 完成度 |
|------|------|--------|
| 创建类型定义 | ✅ 完成 | 100% |
| 创建 BaseEntity | ✅ 完成 | 100% |
| 创建 SnakeEntity | 🔄 进行中 | 0% |
| 创建 FoodEntity | 🔄 进行中 | 0% |
| 创建 ObstacleEntity | 🔄 进行中 | 0% |
| 重构 FoodSpawnerComponent | ⏳ 待开始 | 0% |
| 重构 ItemManager | ⏳ 待开始 | 0% |
| 更新 PhaserGame.ts | ⏳ 待开始 | 0% |
| 测试验证 | ⏳ 待开始 | 0% |

**总体进度**: 2/9 = **22%**

---

## 🎯 **下一步行动**

### 立即执行（按优先级排序）

#### 1. 创建 SnakeEntity.ts ⭐⭐⭐
```bash
# 文件位置
src/components/game/entities/SnakeEntity.ts

# 内容大纲
- 继承 BaseEntity
- 添加蛇专属属性（body, direction, speed）
- 实现 update() - 移动逻辑
- 实现 render() - 渲染逻辑
- 实现 eatFood() - 吃食物
- 实现 checkCollision() - 碰撞检测
```

---

#### 2. 创建 FoodEntity.ts ⭐⭐⭐
```bash
# 文件位置
src/components/game/entities/FoodEntity.ts

# 内容大纲
- 继承 BaseEntity
- 添加食物专属属性（foodType, score, hasEffect）
- 实现 update() - 动画和生命周期
- 实现 render() - 渲染（支持 GTRS 主题）
- 实现 applyEffect() - 应用特效
```

---

#### 3. 创建 ObstacleEntity.ts ⭐⭐
```bash
# 文件位置
src/components/game/entities/ObstacleEntity.ts

# 内容大纲
- 继承 BaseEntity
- 添加 isStatic 属性
- 实现 update() - 空实现（静态物体）
- 实现 render() - 简单矩形
```

---

#### 4. 重构 FoodSpawnerComponent ⭐⭐
```typescript
// 修改导入
- import { createFood } from '@/types/FoodTypes'
+ import { FoodEntity } from './entities/FoodEntity'

// 修改生成逻辑
spawnFood() {
  const config = FOOD_DATABASE[type]
  const food = new FoodEntity(x, y, config)
  return food
}
```

---

#### 5. 更新 PhaserGame.ts ⭐⭐⭐
```typescript
// 添加实体管理
private snakeEntity: SnakeEntity | null = null
private foodEntities: FoodEntity[] = []

// 更新游戏循环
update(deltaTime: number) {
  this.snakeEntity?.update(deltaTime)
  this.foodEntities.forEach(f => f.update(deltaTime))
}

// 统一渲染
render() {
  this.snakeEntity?.render(this.scene)
  this.foodEntities.forEach(f => f.render(this.scene))
}
```

---

## 💡 **架构优势**

### 对比旧架构

| 方面 | 旧架构 | 新架构 | 改进 |
|------|--------|--------|------|
| **代码复用** | 低（重复代码多） | 高（基类统一） | ⬆️ 50% |
| **职责分离** | 模糊 | 清晰 | ⬆️ |
| **扩展性** | 困难 | 容易 | ⬆️ |
| **维护成本** | 高 | 低 | ⬇️ 50% |
| **性能** | 一般 | 最优（AABB） | ⬆️ |

---

### 核心价值

✅ **统一实体管理**: 所有对象都是实体，统一管理
✅ **清晰的职责**: 每个类只负责自己的逻辑
✅ **易于扩展**: 新增实体只需继承基类
✅ **保留 GTRS 支持**: 主题系统完全兼容

---

## 📝 **注意事项**

### ⚠️ 兼容性

1. **保留旧代码**: 新架构验证通过前，不要删除旧代码
2. **渐进式迁移**: 逐步替换，而不是一次性重写
3. **回归测试**: 每步迁移后都要测试

---

### 🎯 GTRS 集成

确保 FoodEntity.render() 中正确使用 GTRS 资源：

```typescript
render(scene: Phaser.Scene): void {
  // 1. 尝试使用主题资源
  const foodKey = this.getThemeAssetKey('food', this.foodType)
  
  if (foodKey && scene.textures.exists(foodKey)) {
    // 使用主题图片
    scene.add.image(this.x, this.y, foodKey)
  } else {
    // 2. 后备方案：程序化绘制
    scene.add.circle(this.x, this.y, this.radius, this.color)
  }
}
```

---

## 🚀 **预计完成时间**

| 阶段 | 任务 | 时间估算 |
|------|------|----------|
| **Phase 1** | 创建实体类（3 个文件） | 2 小时 |
| **Phase 2** | 重构现有组件 | 2 小时 |
| **Phase 3** | 更新 PhaserGame.ts | 1 小时 |
| **Phase 4** | 测试验证 | 1 小时 |
| **总计** | - | **6 小时** |

---

**准备开始实施！** 🤖

需要我立即创建 SnakeEntity、FoodEntity 和 ObstacleEntity 吗？
