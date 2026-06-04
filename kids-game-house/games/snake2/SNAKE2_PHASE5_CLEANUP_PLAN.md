# 🧹 Snake2 第五阶段：清理旧代码计划

**创建时间**: 2026-04-05  
**状态**: ⏳ 准备开始

---

## 📊 **需要淘汰的旧组件**

### 1. 旧的渲染方法（PhaserGame.ts）❌

这些方法将被新的实体系统替代：

```typescript
// ❌ 删除以下方法（约 300 行）
renderSnake()           // 蛇渲染 → 由 SnakeHead.render() 替代
renderFood()            // 食物渲染 → 由 Food.render() 替代
renderObstacles()       // 障碍物渲染 → 由 Obstacle.render() 替代
createExplosion()       // 粒子爆炸 → 可选，考虑保留或移除
shakeScreen()           // 屏幕震动 → 可选，考虑保留或移除
```

**影响范围**:
- `PhaserGame.ts` 文件
- `SnakeGame.vue` 中的调用方

---

### 2. 旧的道具系统（ItemSystem）❌

旧的独立道具系统将与 Food 实体合并：

```typescript
// ❌ 删除整个 ItemSystem 类
src/utils/ItemSystem.ts

// ❌ 删除相关的类型定义
src/types/item.ts
```

**替代方案**:
- 所有道具功能合并到 `Food` 实体
- 特效逻辑移动到 `handleSnakeCollision.ts`

---

### 3. 旧的碰撞检测逻辑 ❌

分散在多个文件中的碰撞检测代码：

```typescript
// ❌ 从 PhaserGame.ts 删除
update(deltaTime: number): void {
  // 旧的道具碰撞检测
  if (this.itemSystem.getIsInitialized()) {
    this.itemSystem.update(snakeData)
  }
}
```

**替代方案**:
- 统一使用 `CollisionDetector.detectCollisions()`

---

### 4. 旧的蛇身数据结构 ❌

```typescript
// ❌ 旧的 Position 数组表示
private currentSnake: Position[] = []

// ✅ 新的表示方式
private snakeHead: SnakeHead | null = null
private snakeBodySegments: SnakeBody[] = []
```

---

## ✅ **需要保留的核心能力**

### 1. GTRS 主题加载系统 ✅

```typescript
// ✅ 完整保留
private async loadTheme(themeId: string): Promise<void>
private loadGTRSImages(scene: Phaser.Scene): void
private getThemeAssetKey(gtrsKey: string, foodType?: string): string | undefined
```

**原因**: 这是项目的核心需求，必须保留

---

### 2. 屏幕自适应系统 ✅

```typescript
// ✅ 完整保留
private handleResize(gameSize: Phaser.Structs.Size): void
private recalculateAdaptParams(): void
private createAllGameElements(scene: Phaser.Scene): void
initUIParams(screenW: number, screenH: number): void
updateUIParams(screenW: number, screenH: number): void
```

**原因**: 商业级屏幕适配，必须保留

---

### 3. 音频管理系统 ✅

```typescript
// ✅ 完整保留
playBgmMain(): void
playBgmGameplay(): void
playBgmGameover(): void
playSound(soundType: string): void
stopAllBgm(): void
```

**原因**: 完整的音频管理，必须保留

---

### 4. Phaser 场景生命周期 ✅

```typescript
// ✅ 完整保留
private preload(scene: Phaser.Scene): void
private create(scene: Phaser.Scene): void
private update(time: number, delta: number): void
```

**原因**: Phaser 核心框架，但需要修改 update 内容

---

## 🔧 **重构策略**

### 方案 A: 渐进式替换（推荐）⭐

**优点**:
- ✅ 风险低，可逐步验证
- ✅ 每步都可回滚
- ✅ 不影响现有功能

**步骤**:

#### Step 1: 保留 PhaserGame 外壳，替换内部实现

```typescript
export class PhaserGame {
  // === 保留的字段 ===
  private scene: Phaser.Scene | null = null
  private Adapt: any = {}
  
  // === 新增：实体系统 ===
  private snakeGameV2: SnakePhaserGameV2 | null = null
  
  // === 删除的旧字段 ===
  // ❌ private snakeGroup: Phaser.GameObjects.Group | null = null
  // ❌ private foodSprite: Phaser.GameObjects.Graphics | null = null
  // ❌ private itemSystem: ItemSystem
}
```

---

#### Step 2: 重写 update 方法

```typescript
// ✅ 保留 Phaser 的 update 框架
update(time: number, delta: number): void {
  if (this._isPaused) return
  
  // ❌ 删除旧的更新逻辑
  // if (this.itemSystem) { ... }
  
  // ✅ 新增：调用实体系统更新
  const deltaTime = delta / 1000  // 毫秒转秒
  this.snakeGameV2?.update(deltaTime)
  
  // ✅ 保留：GTRS 相关逻辑
  // ... GTRS 主题更新等
}
```

---

#### Step 3: 添加渲染桥接

```typescript
// ✅ 新增方法：将 Phaser Graphics 转换为实体系统可用的上下文
renderEntities(): void {
  if (!this.scene || !this.snakeGameV2) return
  
  // 创建一个临时的 Graphics 对象作为渲染上下文
  const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false })
  
  // 调用实体系统渲染
  this.snakeGameV2.render(graphics)
  
  // 将 Graphics 绘制到场景
  graphics.generateTexture('entities_texture', 1600, 900)
  const sprite = this.scene.add.image(800, 450, 'entities_texture')
  sprite.setDepth(10)
}
```

---

#### Step 4: 迁移用户输入处理

```typescript
// ✅ 在 PhaserGame.ts 中添加
setSnakeDirection(direction: Direction): void {
  this.snakeGameV2?.setSnakeDirection(direction)
}

// SnakeGame.vue 中的调用保持不变
phaserGame.setSnakeDirection('up')
```

---

### 方案 B: 完全替换（激进）⚠️

**优点**:
- ✅ 代码更简洁
- ✅ 完全摆脱历史包袱

**缺点**:
- ❌ 风险高
- ❌ 需要重写大量代码
- ❌ 可能破坏现有功能

**不推荐**,除非方案 A 验证失败

---

## 📝 **详细清理清单**

### 文件级别清理

#### 需要删除的文件 ❌

| 文件 | 原因 | 替代方案 |
|------|------|----------|
| `src/utils/ItemSystem.ts` | 功能合并到 Food 实体 | Food.ts + handleSnakeCollision.ts |
| `src/types/item.ts` | 不再需要 | FoodType enum |
| `src/components/game/ItemManager.ts` (如果有) | 功能合并 | - |

---

#### 需要大幅修改的文件 ⚠️

| 文件 | 修改内容 | 预计删除行数 |
|------|----------|--------------|
| `PhaserGame.ts` | 删除旧渲染方法、道具系统 | ~400 行 |
| `SnakeGame.vue` | 更新调用方式 | ~50 行 |

---

#### 需要小幅修改的文件 🔧

| 文件 | 修改内容 |
|------|----------|
| `src/stores/game.ts` | 删除道具相关状态，改用 Food 实体 |
| `src/types/game.ts` | 删除 Food 类型定义，使用新的 FoodType |

---

### 代码级别清理

#### PhaserGame.ts 中的清理

```typescript
// ============================================================================
// ❌ 删除：旧的道具系统字段
// ============================================================================
// private itemSystem: ItemSystem  ❌ 删除

// ============================================================================
// ✅ 新增：实体系统字段
// ============================================================================
private snakeGameV2: SnakePhaserGameV2 | null = null

// ============================================================================
// ❌ 删除：旧的渲染方法（约 300 行）
// ============================================================================
// renderSnake() {...}  ❌
// renderFood() {...}   ❌
// renderObstacles() {...}  ❌

// ============================================================================
// ✅ 保留：GTRS 相关方法
// ============================================================================
private loadTheme(themeId: string): Promise<void>  ✅
private loadGTRSImages(scene: Phaser.Scene): void  ✅
private getThemeAssetKey(gtrsKey: string): string | undefined  ✅

// ============================================================================
// ✅ 保留：屏幕自适应方法
// ============================================================================
private handleResize(gameSize: Phaser.Structs.Size): void  ✅
private recalculateAdaptParams(): void  ✅

// ============================================================================
// ✅ 保留：音频管理方法
// ============================================================================
playBgmMain(): void  ✅
playBgmGameplay(): void  ✅
playBgmGameover(): void  ✅
```

---

## 🎯 **执行计划**

### Phase 5.1: 备份现有代码 (1 小时)

```bash
# 创建 git 分支
git checkout -b feature/snake2-entity-system-refactor

# 备份关键文件
cp src/components/game/PhaserGame.ts src/components/game/PhaserGame.ts.backup
cp src/components/game/SnakeGame.vue src/components/game/SnakeGame.vue.backup
```

---

### Phase 5.2: 删除旧组件 (2 小时)

1. ❌ 删除 `ItemSystem.ts` 及相关文件
2. ❌ 删除 `PhaserGame.ts` 中的旧渲染方法
3. ❌ 删除旧的碰撞检测逻辑

---

### Phase 5.3: 集成实体系统 (3 小时)

1. ✅ 在 `PhaserGame.ts` 中添加 `snakeGameV2` 字段
2. ✅ 重写 `update()` 方法调用实体系统
3. ✅ 实现渲染桥接（将实体渲染到 Phaser 画布）
4. ✅ 迁移用户输入处理

---

### Phase 5.4: 测试验证 (2 小时)

1. ✅ 基本功能测试（蛇移动、吃食物）
2. ✅ 碰撞检测测试
3. ✅ GTRS 主题加载测试
4. ✅ 屏幕自适应测试

---

### Phase 5.5: 清理 Store 和类型 (1 小时)

1. ✅ 更新 `game.ts` 中的状态管理
2. ✅ 清理旧的类型定义
3. ✅ 更新导入路径

---

## 📊 **预期成果**

### 代码量对比

| 项目 | 重构前 | 重构后 | 变化 |
|------|--------|--------|------|
| **PhaserGame.ts** | ~1800 行 | ~1400 行 | ⬇️ 400 行 |
| **SnakeGame.vue** | ~600 行 | ~550 行 | ⬇️ 50 行 |
| **ItemSystem.ts** | ~400 行 | 删除 | ⬇️ 400 行 |
| **新增实体系统** | - | ~1600 行 | ⬆️ 1600 行 |
| **总计** | ~2800 行 | ~3550 行 | ⬆️ 750 行 |

**注**: 虽然总代码量增加，但复用率从 <30% 提升到 >95%

---

### 性能提升预期

| 指标 | 重构前 | 重构后 | 提升 |
|------|--------|--------|------|
| 内存分配 | 频繁 | 对象池复用 | ⬇️ 90% |
| GC 频率 | 高 | 极低 | ⬇️ 95% |
| 碰撞检测 | O(n²) | O(n log n) | ⬆️ 10-50 倍 |
| 代码复用率 | <30% | >95% | ⬆️ 217% |

---

## 🚨 **风险评估**

### 高风险项 ⚠️

1. **GTRS 主题兼容性**
   - 风险：新架构可能破坏现有主题加载
   - 缓解：保留所有 GTRS 相关代码，仅替换渲染部分

2. **屏幕自适应失效**
   - 风险：resize 后实体位置不正确
   - 缓解：保留 `handleResize()` 和 `recalculateAdaptParams()`

3. **道具系统功能丢失**
   - 风险：新 Food 实体未完全覆盖旧道具功能
   - 缓解：详细对比测试，确保功能对等

---

### 低风险项 ✅

1. **蛇移动逻辑** - 已完全测试
2. **碰撞检测** - 有完整的单元测试
3. **用户输入** - 简单直接，风险低

---

## ✅ **成功标准**

### 功能完整性

- [ ] 蛇可以正常移动和转向
- [ ] 食物生成和食用正常工作
- [ ] 碰撞检测准确（撞墙、撞蛇身、吃食物）
- [ ] 道具效果生效（加速、减速、无敌）
- [ ] GTRS 主题正常加载
- [ ] 屏幕自适应正常

---

### 性能指标

- [ ] 内存占用降低 50%
- [ ] GC 频率降低 95%
- [ ] 帧率稳定在 60fps
- [ ] 无明显的卡顿或延迟

---

### 代码质量

- [ ] TypeScript 编译无错误
- [ ] ESLint 检查通过
- [ ] 关键函数有 JSDoc 注释
- [ ] 重要逻辑有单元测试

---

**准备好开始执行了吗？** 🤖
