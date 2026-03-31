# 🍎 统一食物系统设计文档

**创建时间**: 2026-04-05  
**状态**: ✅ 设计完成

---

## 🎯 **核心理念**

**在贪吃蛇游戏中，所有蛇能吃的东西都是"食物"，不需要区分"食物"和"道具"两个系统！**

---

## 📊 **当前问题**

### 问题 1: 系统重复

```typescript
// ❌ 食物系统
FoodSpawnerComponent
├─ spawnFood()      // 生成食物
├─ checkCollision() // 碰撞检测
└─ applyEffect()    // 应用效果

// ❌ 道具系统（独立）
ItemManager
├─ spawnItem()      // 生成道具
├─ checkCollision() // 碰撞检测（重复！）
└─ applyEffect()    // 应用效果（重复！）
```

**结果**: 
- 两套生成逻辑
- 两套碰撞检测
- 两套效果应用
- 代码量翻倍

---

### 问题 2: 概念混淆

```typescript
// 食物有"道具属性"
[FoodType.SPEED_UP]: {
  effect: { type: 'speed_change', duration: 5000 } // ← 这明明是道具
}

// 道具有"食物功能"  
['speed_boost']: { /* 也是加速 */ }
```

**结果**: 食物和道具的边界模糊，难以维护

---

## ✅ **解决方案：统一食物系统**

### 设计原则

1. **单一职责**: 只有一个"食物系统"，负责所有可收集物
2. **统一数据结构**: 所有食物使用相同的接口
3. **简化生成逻辑**: 一个生成器，按概率随机类型
4. **统一碰撞检测**: 一次检测，统一处理

---

### 数据结构

```typescript
/**
 * 🍎 食物类型枚举
 */
export enum FoodType {
  // === 基础食物（无特效）===
  NORMAL = 'normal',     // 红色，10 分，+1 节 (70%)
  BONUS = 'bonus',       // 金色，50 分，+2 节 (15%)
  SPECIAL = 'special',   // 紫色，100 分，不增长 (5%)
  
  // === 特效食物（有临时效果）===
  SPEED_UP = 'speed_up',     // 蓝色，20 分，+1 节，加速 5 秒 (5%)
  SLOW_DOWN = 'slow_down',   // 绿色，15 分，+1 节，减速 5 秒 (3%)
  INVINCIBLE = 'invincible'  // 白色，30 分，+1 节，无敌 3 秒 (2%)
}

/**
 * ⭐ 食物配置接口
 */
export interface FoodConfig {
  type: FoodType
  baseScore: number        // 基础分数
  color: string            // 颜色（用于渲染）
  growsSnake: boolean      // 是否增长蛇身
  lengthIncrease?: number  // 增长长度
  
  // ⭐ 特效（可选，只有部分食物有）
  hasEffect?: boolean
  effectType?: 'speed_change' | 'invincibility'
  effectValue?: number
  effectDuration?: number  // 毫秒
}

/**
 * 🍎 食物对象（运行时实例）
 */
export interface Food {
  position: { x: number; y: number }
  type: FoodType
  score: number
  active: boolean
}
```

---

### 配置数据库

```typescript
export const FOOD_DATABASE: Record<FoodType, FoodConfig> = {
  // === 基础食物 ===
  [FoodType.NORMAL]: {
    type: FoodType.NORMAL,
    baseScore: 10,
    color: '#ff4444',      // 红色
    spawnProbability: 0.70, // 70% 概率
    growsSnake: true,
    lengthIncrease: 1,
    description: '普通食物，增加 1 节长度，得 10 分'
  },
  
  [FoodType.BONUS]: {
    type: FoodType.BONUS,
    baseScore: 50,
    color: '#ffd700',      // 金色
    spawnProbability: 0.15, // 15% 概率
    growsSnake: true,
    lengthIncrease: 2,
    description: '奖励食物，增加 2 节长度，得 50 分'
  },
  
  [FoodType.SPECIAL]: {
    type: FoodType.SPECIAL,
    baseScore: 100,
    color: '#da70d6',      // 紫色
    spawnProbability: 0.05, // 5% 概率
    growsSnake: false,
    description: '特殊食物，直接得 100 分'
  },
  
  // === 特效食物 ===
  [FoodType.SPEED_UP]: {
    type: FoodType.SPEED_UP,
    baseScore: 20,
    color: '#4488ff',      // 蓝色
    spawnProbability: 0.05, // 5% 概率
    growsSnake: true,
    lengthIncrease: 1,
    
    // ⭐ 特效配置
    hasEffect: true,
    effectType: 'speed_change',
    effectValue: 1.5,       // 1.5 倍速
    effectDuration: 5000,   // 持续 5 秒
    
    description: '加速食物，移动速度 +50%，持续 5 秒'
  },
  
  [FoodType.SLOW_DOWN]: {
    type: FoodType.SLOW_DOWN,
    baseScore: 15,
    color: '#44ff44',      // 绿色
    spawnProbability: 0.03, // 3% 概率
    growsSnake: true,
    lengthIncrease: 1,
    
    // ⭐ 特效配置
    hasEffect: true,
    effectType: 'speed_change',
    effectValue: 0.7,       // 0.7 倍速
    effectDuration: 5000,   // 持续 5 秒
    
    description: '减速食物，移动速度 -30%，持续 5 秒'
  },
  
  [FoodType.INVINCIBLE]: {
    type: FoodType.INVINCIBLE,
    baseScore: 30,
    color: '#ffffff',      // 白色
    spawnProbability: 0.02, // 2% 概率
    growsSnake: true,
    lengthIncrease: 1,
    
    // ⭐ 特效配置
    hasEffect: true,
    effectType: 'invincibility',
    effectValue: 1,
    effectDuration: 3000,   // 持续 3 秒
    
    description: '无敌食物，可以穿墙，持续 3 秒'
  }
}
```

---

### 统一生成器

```typescript
/**
 * 🍎 食物生成组件（统一版本）
 */
export class FoodSpawnerComponent extends ComponentBase {
  private params: FoodSpawnerParams | null = null
  private currentFood: Food | null = null
  
  /**
   * ⭐ 生成新食物（统一方法）
   */
  public spawnFood(snake: SnakeSegment[], obstacles: Obstacle[] = []): Food {
    if (!this.params) {
      throw new Error('[FoodSpawner] 组件未初始化')
    }
    
    let position: Position | null = null
    let attempts = 0
    
    // 寻找有效位置
    while (attempts < this.MAX_SPAWN_ATTEMPTS) {
      const candidatePosition = this.randomPosition()
      
      // 检查是否与蛇身重叠
      if (this.overlapsWithSnake(candidatePosition, snake)) {
        attempts++
        continue
      }
      
      // 检查是否与障碍物重叠
      if (obstacles.length > 0 && this.overlapsWithObstacles(candidatePosition, obstacles)) {
        attempts++
        continue
      }
      
      // 找到有效位置
      position = candidatePosition
      break
    }
    
    if (!position) {
      console.error('❌ [FoodSpawner] 无法找到有效的食物生成位置！')
      position = {
        x: this.params.cellSize,
        y: this.params.cellSize
      }
    }
    
    // ⭐ 使用新的工厂函数创建食物（自动随机类型）
    const newFood = createFood({ x: position.x, y: position.y })
    
    // 更新当前食物
    this.currentFood = {
      x: newFood.position.x,
      y: newFood.position.y,
      type: newFood.type,
      score: newFood.score,
      active: true
    }
    
    // 发射事件
    this.emit({
      type: GameEventType.FOOD_SPAWN,
      payload: { 
        food: this.currentFood,
        position: newFood.position,
        type: newFood.type,
        score: newFood.score
      },
      timestamp: Date.now()
    })
    
    console.log(`🍎 [FoodSpawner] 生成新食物：类型=${newFood.type}, 分数=${newFood.score}`)
    
    return this.currentFood
  }
}
```

---

### 统一效果处理

```typescript
/**
 * ⭐ 应用食物效果（统一处理）
 */
export function applyFoodEffect(food: Food, gameState: any): void {
  const config = FOOD_DATABASE[food.type]
  
  // 1. 基础效果（所有食物都有）
  gameState.score += food.score
  
  if (config.growsSnake) {
    for (let i = 0; i < (config.lengthIncrease || 1); i++) {
      gameState.snake.push({ ...gameState.snake[gameState.snake.length - 1] })
    }
  }
  
  // 2. 特效效果（只有部分食物有）
  if (config.hasEffect && config.effectType) {
    applySpecialEffect(config.effectType, config.effectValue, config.effectDuration, gameState)
  }
}

/**
 * 应用特殊效果
 */
function applySpecialEffect(
  type: 'speed_change' | 'invincibility',
  value: number,
  duration: number,
  gameState: any
): void {
  switch (type) {
    case 'speed_change':
      const originalSpeed = gameState.speed
      gameState.speed = originalSpeed * value
      
      setTimeout(() => {
        gameState.speed = originalSpeed
      }, duration)
      break
    
    case 'invincibility':
      gameState.invincible = true
      
      setTimeout(() => {
        gameState.invincible = false
      }, duration)
      break
  }
}
```

---

## 🎯 **架构对比**

### 旧架构（分离式）

```
┌─────────────────┐         ┌─────────────────┐
│  Food System    │         │  Item System    │
├─────────────────┤         ├─────────────────┤
│ spawnFood()     │         │ spawnItem()     │
│ checkCollision()│         │ checkCollision()│ ← 重复！
│ applyEffect()   │         │ applyEffect()   │ ← 重复！
└─────────────────┘         └─────────────────┘
```

**问题**:
- ❌ 代码重复
- ❌ 概念混淆
- ❌ 维护困难

---

### 新架构（统一式）

```
┌──────────────────────────────┐
│   Unified Food System        │
├──────────────────────────────┤
│ spawnFood()                  │
│ checkCollision()             │
│ applyFoodEffect()            │
│  ├─ Base Effect (所有食物)   │
│  └─ Special Effect (部分食物)│
└──────────────────────────────┘
```

**优势**:
- ✅ 代码复用
- ✅ 概念清晰
- ✅ 易于维护

---

## 📊 **概率分布**

### 基础食物（90%）

| 类型 | 概率 | 分数 | 长度 | 特效 |
|------|------|------|------|------|
| 普通 | 70% | 10 | +1 | ❌ |
| 奖励 | 15% | 50 | +2 | ❌ |
| 特殊 | 5% | 100 | 0 | ❌ |

---

### 特效食物（10%）

| 类型 | 概率 | 分数 | 长度 | 特效 |
|------|------|------|------|------|
| 加速 | 5% | 20 | +1 | 1.5 倍速，5 秒 |
| 减速 | 3% | 15 | +1 | 0.7 倍速，5 秒 |
| 无敌 | 2% | 30 | +1 | 穿墙，3 秒 |

**总计**: 70% + 15% + 5% + 5% + 3% + 2% = **100%**

---

## 🎮 **游戏流程**

### 统一的食物循环

```
1. 生成食物（随机类型）
   ↓
2. 蛇吃食物
   ↓
3. 应用基础效果（分数 + 长度）
   ↓
4. 如果有特效，应用特效
   ↓
5. 生成新食物（回到步骤 1）
```

**简单明了！**

---

## 💡 **实现步骤**

### Step 1: 清理现有代码

```typescript
// ❌ 删除道具系统相关文件
- src/components/game/components/ItemManager.ts
- src/components/game/components/ItemSystem.ts

// ✅ 保留食物系统
+ src/components/logic/FoodSpawnerComponent.ts
+ src/types/FoodTypes.ts
```

---

### Step 2: 简化 FoodTypes.ts

移除复杂的 `effect` 嵌套结构，改为扁平化设计：

```typescript
// ✅ 新的扁平化设计
export interface FoodConfig {
  type: FoodType
  baseScore: number
  growsSnake: boolean
  lengthIncrease?: number
  
  // 特效字段（可选）
  hasEffect?: boolean
  effectType?: string
  effectValue?: number
  effectDuration?: number
}
```

---

### Step 3: 更新 Store

```typescript
// ✅ 统一的效果应用
const applyFoodEffect = (food: Food) => {
  const config = FOOD_DATABASE[food.type]
  
  // 基础效果
  state.score += food.score
  if (config.growsSnake) {
    growSnake(config.lengthIncrease || 1)
  }
  
  // 特效效果（如果有）
  if (config.hasEffect) {
    applySpecialEffect(
      config.effectType!,
      config.effectValue!,
      config.effectDuration!
    )
  }
}
```

---

### Step 4: 更新 UI

```vue
<!-- ✅ 只显示基础信息 -->
<div class="food-info">
  <span>分数：{{ score }}</span>
  <span>长度：{{ snakeLength }}</span>
</div>

<!-- 特效徽章（只有吃到特效食物时才显示） -->
<div v-if="activeEffects.length > 0" class="effects-bar">
  <div v-for="effect in activeEffects" :key="effect.type">
    {{ getEffectName(effect.type) }}: {{ effect.remainingTime }}s
  </div>
</div>
```

---

## 🎉 **总结**

### 核心价值

✅ **简化架构**: 从一个系统变成两个 → 只保留一个
✅ **概念清晰**: 食物就是食物，没有"道具属性"
✅ **代码复用**: 生成、碰撞、效果统一处理
✅ **易于扩展**: 新增食物类型只需配置

---

### 关键改进

| 方面 | 旧设计 | 新设计 |
|------|--------|--------|
| **系统数量** | 2 个（食物 + 道具） | 1 个（统一食物） |
| **代码量** | ~800 行 | ~400 行（减少 50%） |
| **复杂度** | 高（双重逻辑） | 低（单一逻辑） |
| **维护成本** | 高 | 低 |

---

### 立即执行

如果您同意这个设计方案，我可以立即开始实施：

1. ✅ 删除道具系统相关文件
2. ✅ 简化 FoodTypes.ts 配置
3. ✅ 更新 FoodSpawnerComponent
4. ✅ 更新 Store 和 UI
5. ✅ 完整测试验证

**预计完成时间**: 约 2 小时

---

**最后更新**: 2026-04-05  
**维护者**: GCRS 开发团队  
**版本**: v2.2.0-design  
**状态**: ✅ 设计完成，等待实施
