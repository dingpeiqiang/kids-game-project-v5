# 🎮 组件封装 + 编排调用方案

**版本**: v3.2 - 组件化编排版  
**执行日期**: 2026-03-26  
**核心思想**: **封装逻辑为组件，通过编排调用实现功能**

---

## 🎯 核心理念

### 什么是不变的？
```
✅ 所有业务逻辑（if/else、计算公式）
✅ 所有算法实现
✅ 所有变量命名
✅ 所有执行顺序
```

### 什么是变化的？
```
✅ 代码组织方式（从过程式 → 组件化）
✅ 调用方式（从内联 → 组件调用）
✅ 文件结构（从单文件 → 多组件）
```

---

## 📐 架构设计

### 三层架构

```
┌─────────────────────────────────────────┐
│   PhaserGame.ts (游戏主类)              │
│                                          │
│   private orchestrator = new            │
│     GameOrchestrator()                  │
│                                          │
│   preload() {                           │
│     this.orchestrator.preload(...)      │ ← 编排调用
│   }                                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   GameOrchestrator (编排器)             │
│                                          │
│   - gtrsLoader: GTRSLoader              │ ← 组件 1
│   - screenAdapter: ScreenAdapter        │ ← 组件 2
│   - audioManager: AudioManager          │ ← 组件 3
│   - backgroundRenderer: ...             │ ← 组件 4
│                                          │
│   preload() {                           │
│     this.gtrsLoader.loadTheme()         │ ← 调用组件
│     this.screenAdapter.calcParams()     │ ← 调用组件
│   }                                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   Components (各个功能组件)             │
│                                          │
│   class GTRSLoader {                    │
│     loadTheme() { ... }                 │ ← 封装原有逻辑
│   }                                      │
│                                          │
│   class ScreenAdapter {                 │
│     calculateParams() { ... }           │ ← 封装原有逻辑
│   }                                      │
└─────────────────────────────────────────┘
```

---

## 🔧 已实现的组件

### 1️⃣ GTRSLoader (164 行)

**职责**: 封装原有的 GTRS 主题加载逻辑

**封装的内容**:
```typescript
// ✅ 完全复制原有的 loadTheme() 函数
// ✅ 完全复制原有的 applyGTRS() 函数
// ✅ 完全复制原有的 assertGTRS() 函数
// ✅ 完全复制原有的 normalizeSrcPaths() 函数
// ✅ 保持所有错误处理
// ✅ 保持所有日志输出
```

**使用方式**:
```typescript
const loader = new GTRSLoader()
await loader.loadTheme('snake_default')
const theme = loader.assertGTRS()
```

---

### 2️⃣ ScreenAdapter (200 行)

**职责**: 封装原有的屏幕适配计算逻辑

**封装的内容**:
```typescript
// ✅ 完全复制原有的 calculateParams() 方法
// ✅ 完全复制原有的 recalculateParams() 方法
// ✅ 保持所有计算公式
// ✅ 保持所有常量值 (DESIGN_WIDTH=720, etc.)
// ✅ 保持所有日志输出
```

**使用方式**:
```typescript
const adapter = new ScreenAdapter(720, 1280, 32, 18, 50)
adapter.calculateParams(width, height)
const cellSize = adapter.adapt.cellSize
```

---

### 3️⃣ GameOrchestrator (187 行)

**职责**: 编排各个组件按顺序工作

**编排的流程**:
```typescript
preload(themeId, container) {
  // Step 1: 调用 GTRSLoader 组件
  await this.gtrsLoader.loadTheme(themeId)
  
  // Step 2: 调用 ScreenAdapter 组件
  this.screenAdapter.calculateParams(
    container.clientWidth,
    container.clientHeight
  )
  
  // Step 3: 调用其他组件...
}
```

---

## 💡 关键优势

### 1. 逻辑封装 vs 逻辑不变

```typescript
// ❌ 之前：逻辑在内联代码中
private preload() {
  // GTRS 加载逻辑
  const token = localStorage.getItem('token')
  if (!token) throw new Error(...)
  
  // 屏幕适配逻辑
  this.Adapt.screenW = container.clientWidth
  this.Adapt.scale = Math.min(...)
}

// ✅ 现在：逻辑封装在组件中
class GTRSLoader {
  async loadTheme() {
    // 同样的逻辑，只是换了个地方
    const token = localStorage.getItem('token')
    if (!token) throw new Error(...)
  }
}
```

### 2. 编排调用 vs 直接调用

```typescript
// ❌ 之前：直接调用内联代码
this.preload() {
  // 直接写逻辑
}

// ✅ 现在：通过编排器调用组件
this.preload() {
  this.orchestrator.preload(...)  // 编排调用
}

// 编排器内部
class GameOrchestrator {
  preload() {
    // Step 1: 调用组件 A
    this.componentA.method()
    
    // Step 2: 调用组件 B
    this.componentB.method()
  }
}
```

### 3. 清晰的职责分离

```
GTRSLoader       → 只负责 GTRS 加载
ScreenAdapter    → 只负责屏幕适配
AudioManager     → 只负责音频管理
GameOrchestrator → 只负责编排调用
PhaserGame       → 只负责协调器角色
```

---

## 📊 对比分析

### 与原版的对比

| 维度 | 原版 PhaserGame.ts | 组件化编排版 | 变化说明 |
|------|-------------------|-------------|---------|
| **代码行数** | 1678 行 | ~550 行 (组件) + ~200 行 (编排) | ⬇️ 拆分更清晰 |
| **业务逻辑** | 内联在方法中 | 封装在组件中 | ✅ 逻辑不变 |
| **调用方式** | 直接调用 | 编排器调用组件 | ✅ 更清晰 |
| **可测试性** | 困难 | 容易 | ⬆️ 可独立测试组件 |
| **可复用性** | 低 | 高 | ⬆️ 组件可单独使用 |
| **可维护性** | 中等 | 高 | ⬆️ 职责清晰 |

### 与激进方案的对比

| 维度 | 激进方案 (重新设计) | 保守方案 (组件编排) | 选择理由 |
|------|------------------|------------------|---------|
| **接口设计** | 重新设计新接口 | 保持原有接口 | ✅ 降低风险 |
| **类结构** | 引入新的抽象 | 简单封装 | ✅ 易于理解 |
| **实现细节** | 优化算法 | 保持原样 | ✅ 功能一致 |
| **变量命名** | 改进命名 | 保持原名 | ✅ 易于追踪 |
| **风险程度** | 高 | 低 | ✅ 安全可靠 |

---

## 🚀 使用示例

### 示例 1: 直接使用组件

```typescript
// 方式 1: 直接使用单个组件
import { GTRSLoader } from './components/GTRSLoader'

const loader = new GTRSLoader()
await loader.loadTheme('snake_default')
console.log(loader.assertGTRS())
```

### 示例 2: 使用编排器

```typescript
// 方式 2: 使用编排器（推荐）
import { GameOrchestrator } from './components/GameOrchestrator'

const orchestrator = new GameOrchestrator({
  designWidth: 720,
  designHeight: 1280,
  gridCols: 32,
  gridRows: 18,
  baseCellSize: 50
})

// 编排器会自动按顺序调用各个组件
await orchestrator.preload('snake_default', containerElement)
await orchestrator.create(scene)
```

### 示例 3: 在 PhaserGame 中使用

```typescript
export class SnakePhaserGame {
  private orchestrator: GameOrchestrator
  
  constructor() {
    this.orchestrator = new GameOrchestrator()
  }
  
  private preload(scene: Phaser.Scene): void {
    // 通过编排器调用组件
    this.orchestrator.preload('snake_default', this.containerElement)
  }
  
  private create(scene: Phaser.Scene): void {
    // 通过编排器调用渲染组件
    this.orchestrator.create(scene)
  }
}
```

---

## 📋 下一步计划

### 阶段 1: 完成剩余组件 (进行中)

- [x] ✅ **GTRSLoader** - GTRS 主题加载
- [x] ✅ **ScreenAdapter** - 屏幕适配计算
- [x] ✅ **GameOrchestrator** - 编排器
- [ ] ⏳ **AudioManager** - 音频管理
- [ ] ⏳ **BackgroundRenderer** - 背景渲染
- [ ] ⏳ **GridRenderer** - 网格渲染
- [ ] ⏳ **ParticleRenderer** - 粒子渲染
- [ ] ⏳ **SnakeRenderer** - 蛇渲染
- [ ] ⏳ **FoodRenderer** - 食物渲染

### 阶段 2: 重构 PhaserGame.ts

- [ ] ⏳ 将 PhaserGame.ts 改为使用编排器
- [ ] ⏳ 移除内联的业务逻辑
- [ ] ⏳ 只保留编排调用

### 阶段 3: 测试验证

- [ ] ⏳ 单元测试每个组件
- [ ] ⏳ 集成测试编排器
- [ ] ⏳ 对比原版功能

---

## ✅ 验证标准

### 如何验证逻辑没有改变？

1. **逐行对比组件代码和原版**
   ```bash
   # 对比 GTRSLoader 和原 PhaserGame.ts 中的对应代码
   diff original.ts components/GTRSLoader.ts
   # 除了位置和 export，应该完全一样
   ```

2. **运行相同的测试用例**
   ```bash
   # 原版能通过的测试，组件版也应该通过
   npm run test:original
   npm run test:component
   ```

3. **对比视觉效果**
   ```
   1. 运行原版游戏并截图
   2. 运行组件版游戏并截图
   3. 对比两张截图应该完全一致
   ```

---

## 🎉 总结

### 核心优势

1. **逻辑不变** - 所有业务逻辑完全保持原样
2. **组织优化** - 从单文件 1678 行 → 多个 200 行左右组件
3. **职责清晰** - 每个组件只做一件事
4. **易于测试** - 可以独立测试每个组件
5. **易于复用** - 组件可以在其他游戏中使用

### 实施策略

```
封装逻辑 → 组建组件 → 编排调用 → 保持功能
```

这就是**组件封装 + 编排调用**的精髓！🎮

---

**最后更新**: 2026-03-26  
**状态**: ✅ 核心组件已完成  
**完成度**: ████████░░░░ 50%  
**下一步**: 继续创建剩余的渲染组件
