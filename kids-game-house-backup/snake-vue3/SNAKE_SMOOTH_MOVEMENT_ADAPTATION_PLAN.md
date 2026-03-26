# 贪吃蛇平滑移动 + 动态适配方案

## 🎯 设计理念

### 核心思想
**蛇的移动不应该被网格限制，而是基于像素的平滑移动**

### 当前架构 vs 新架构

#### ❌ 当前：网格坐标系
```typescript
// 蛇位置是整数网格坐标
interface Position {
  x: number  // 0-32 的整数
  y: number  // 0-18 的整数
}

// 移动逻辑
head.x += 1  // 每次跳 1 格
head.y += 0

// 渲染时转换
pixelX = gridX * cellSize + cellSize/2
```

**问题**：
- 蛇"一格一格跳"，不流畅
- 受限于固定的 32×18 网格
- 不同设备看起来不一样大

#### ✅ 新方案：像素坐标系
```typescript
// 蛇位置是像素坐标（小数）
interface PixelPosition {
  x: number  // 可以是 123.456
  y: number  // 可以是 78.901
}

// 移动逻辑
head.x += speed * deltaTime  // 平滑移动
head.y += 0

// 渲染直接使用
pixelX = head.x
pixelY = head.y
```

**优势**：
- ✅ 蛇平滑移动，不再跳跃
- ✅ 完全适配任意屏幕尺寸
- ✅ 可以调整移动速度（更流畅）

## 📐 动态适配架构

### 三层设计

```
┌─────────────────────────────────┐
│   逻辑层 (Logic Layer)          │
│   - 蛇位置：像素坐标             │
│   - 移动速度：像素/秒            │
│   - 碰撞检测：像素级精度         │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│   适配层 (Adaptation Layer)     │
│   - 计算 cellSize                │
│   - 计算游戏区域大小             │
│   - 处理屏幕缩放                 │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│   渲染层 (Render Layer)         │
│   - 直接使用像素坐标渲染         │
│   - 元素大小按 cellSize 比例     │
│   - 背景自动拉伸适配             │
└─────────────────────────────────┘
```

## 🔧 实现步骤

### Step 1: 修改位置数据结构

```typescript
// src/types/game.ts
export interface PixelPosition {
  x: number  // 像素坐标（可以是小数）
  y: number  // 像素坐标（可以是小数）
}

// 蛇身段
export interface SnakeSegment {
  x: number  // 像素坐标
  y: number  // 像素坐标
}

// 食物
export interface Food {
  position: PixelPosition  // 像素坐标
  type: 'apple' | 'banana' | 'cherry' | 'coin'
  score: number
  color: string
}
```

### Step 2: 修改蛇移动逻辑

```typescript
// src/stores/game.ts

// 蛇的移动速度（像素/秒）
const MOVEMENT_SPEED = 200  // 200 像素/秒

// 移动蛇（平滑版本）
const moveSnake = (deltaTime: number) => {
  if (!food.value || isGameOver.value) return

  direction.value = { ...nextDirection.value }
  
  const head = { ...snake.value[0] }
  
  // 👉 关键：基于时间和速度的平滑移动
  head.x += direction.value.x * MOVEMENT_SPEED * deltaTime
  head.y += direction.value.y * MOVEMENT_SPEED * deltaTime

  // 碰撞检测（使用像素坐标）
  const gridCols = 32
  const gridRows = 18
  const cellSize = getCellSize()  // 从适配层获取
  
  // 边界检测
  if (head.x < 0 || head.x >= gridCols * cellSize || 
      head.y < 0 || head.y >= gridRows * cellSize) {
    endGame()
    return
  }

  // 身体碰撞检测（圆形碰撞，不是点碰撞）
  const snakeRadius = cellSize * 0.4  // 蛇的半径
  for (let i = 1; i < snake.value.length; i++) {
    const segment = snake.value[i]
    const dx = head.x - segment.x
    const dy = head.y - segment.y
    const distance = Math.sqrt(dx*dx + dy*dy)
    
    if (distance < snakeRadius * 2) {
      endGame()
      return
    }
  }

  snake.value.unshift(head)
  
  // 检测是否吃到食物（圆形碰撞）
  const foodRadius = cellSize * 0.35
  const dx = head.x - food.value.position.x
  const dy = head.y - food.value.position.y
  const distance = Math.sqrt(dx*dx + dy*dy)
  
  if (distance < snakeRadius + foodRadius) {
    addScore(food.value.score)
    emitEvent('eat', { position: food.value.position, score: food.value.score })
    setTimeout(() => generateFood(), 200)
  } else {
    snake.value.pop()
  }
}
```

### Step 3: 修改游戏循环

```typescript
// src/components/game/SnakeGame.vue

let lastMoveTime = 0
const MOVEMENT_SPEED = 200  // 像素/秒

function startGameLoop() {
  function loop(timestamp: number) {
    if (gameStore.isPlaying && !gameStore.isPaused && !gameStore.isGameOver) {
      const deltaTime = (timestamp - lastMoveTime) / 1000  // 转换为秒
      
      if (deltaTime > 0.016) {  // 至少 60FPS
        gameStore.moveSnake(deltaTime)  // 👈 传入时间增量
        lastMoveTime = timestamp
      }
      
      gameStore.updateParticles()
    }
    
    gameLoop = requestAnimationFrame(loop)
  }
  
  loop(0)
}
```

### Step 4: 修改渲染逻辑

```typescript
// src/components/game/PhaserGame.ts

renderSnake(snake: SnakeSegment[]): void {
  if (!this.scene || !this.snakeGroup) return

  const scene = this.scene
  const group = this.snakeGroup
  const cellSize = this.Adapt.cellSize

  // 计算游戏区域偏移
  const gameWidth = this.GRID_COLS * cellSize
  const gameHeight = this.GRID_ROWS * cellSize
  const offsetX = (this.Adapt.screenW - gameWidth) / 2
  const offsetY = this.Adapt.safeTop + (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom - gameHeight) / 2

  group.clear(true, true)

  snake.forEach((segment, index) => {
    // 👉 直接使用像素坐标，不需要转换
    const x = offsetX + segment.x + cellSize / 2
    const y = offsetY + segment.y + cellSize / 2
    
    // 蛇身大小 = cellSize 的 95%
    const size = cellSize * 0.95

    // ... 渲染逻辑不变
  })
}
```

### Step 5: 动态适配计算

```typescript
// src/components/game/PhaserGame.ts

private recalculateAdaptParams(): void {
  // 设计基准
  const DESIGN_WIDTH = 720
  const DESIGN_HEIGHT = 1280
  
  // 网格配置（可以动态调整）
  const TARGET_GRID_SIZE = 50  // 目标网格大小（像素）
  
  // 可用空间
  const availableWidth = (this.Adapt.screenW - 20) * 0.95
  const availableHeight = (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom) * 0.9
  
  // 计算最佳网格列数和行数
  const idealCols = Math.floor(availableWidth / TARGET_GRID_SIZE)
  const idealRows = Math.floor(availableHeight / TARGET_GRID_SIZE)
  
  // 取整到合适的值（例如保持 16:9 或 32:18）
  this.GRID_COLS = Math.min(idealCols, 32)  // 最大 32 列
  this.GRID_ROWS = Math.min(idealRows, 18)  // 最大 18 行
  
  // 重新计算 cellSize
  this.Adapt.cellSize = availableWidth / this.GRID_COLS
  
  console.log('🔢 动态适配参数:', {
    screen: `${this.Adapt.screenW} × ${this.Adapt.screenH}`,
    grid: `${this.GRID_COLS} × ${this.GRID_ROWS}`,
    cellSize: this.Adapt.cellSize.toFixed(2)
  })
}
```

## 🎮 游戏体验提升

### 平滑移动效果

**移动速度分级**：
- 简单难度：150 像素/秒
- 中等难度：250 像素/秒
- 困难难度：350 像素/秒

**帧率独立**：
- 60 FPS 设备：每帧移动约 4.17 像素
- 120 FPS 设备：每帧移动约 2.08 像素
- 结果：相同时间内移动距离相同

### 动态适配效果

**小屏手机**（iPhone SE）：
- 屏幕：375 × 667
- 网格：24 × 14
- cellSize: ~15px

**大屏手机**（iPhone 14 Pro Max）：
- 屏幕：430 × 932
- 网格：28 × 16
- cellSize: ~15px

**平板**（iPad Air）：
- 屏幕：1080 × 1366
- 网格：32 × 24
- cellSize: ~34px

**桌面浏览器**：
- 屏幕：1920 × 1080
- 网格：32 × 18
- cellSize: ~60px

## 📊 技术对比

| 特性 | 网格坐标系统 | 像素坐标系统 |
|------|-------------|-------------|
| 移动方式 | 跳跃式 | 平滑式 |
| 位置精度 | 整数（1 格） | 小数（亚像素） |
| 碰撞检测 | 网格对齐 | 圆形/矩形 |
| 适配难度 | 困难 | 容易 |
| 代码复杂度 | 低 | 中 |
| 游戏体验 | 一般 | 优秀 |

## ⚠️ 注意事项

### 性能优化

1. **碰撞检测优化**
   - 使用空间分区（四叉树）
   - 只检测附近的蛇身段
   - 避免 O(n²) 复杂度

2. **渲染优化**
   - 只渲染可见区域
   - 使用对象池复用图形
   - 避免频繁创建销毁

3. **内存管理**
   - 及时清理旧蛇身
   - 缓存常用资源
   - 避免内存泄漏

### 兼容性考虑

1. **低端设备**
   - 降低帧率上限（30 FPS）
   - 减少粒子效果
   - 简化碰撞检测

2. **高端设备**
   - 支持 120+ FPS
   - 开启抗锯齿
   - 增加视觉特效

## 🎯 实施建议

### 渐进式重构

**阶段 1**：保持网格逻辑，改为像素渲染
- 最小改动
- 风险低
- 视觉效果改善

**阶段 2**：改为平滑移动
- 修改移动逻辑
- 调整碰撞检测
- 测试游戏平衡

**阶段 3**：完全动态适配
- 移除固定网格
- 自适应屏幕
- 优化性能

### 测试计划

1. **功能测试**
   - [ ] 蛇能正常移动和转向
   - [ ] 能吃食物并变长
   - [ ] 撞墙/撞自己会死

2. **适配测试**
   - [ ] 小屏手机正常
   - [ ] 大屏手机正常
   - [ ] 平板正常
   - [ ] 桌面正常

3. **性能测试**
   - [ ] 60 FPS 稳定
   - [ ] 无明显卡顿
   - [ ] 内存占用合理

---

**文档创建时间**: 2026-03-24  
**目标**: 实现真正的平滑移动 + 全设备适配  
**预计工作量**: 2-3 天（包括测试和优化）
