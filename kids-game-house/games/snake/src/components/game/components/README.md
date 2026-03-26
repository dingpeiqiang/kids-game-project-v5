# 🎮 游戏引擎组件库

**版本**: v3.2 - 组件化编排版  
**目标**: 封装代码逻辑为组件，通过编排调用实现功能

---

## 📦 组件列表

### ✅ 已完成组件

| 组件 | 文件 | 行数 | 职责 | 使用示例 |
|------|------|------|------|---------|
| **GTRSLoader** | [GTRSLoader.ts](./GTRSLoader.ts) | 164 行 | GTRS 主题加载 | `loader.loadTheme('theme_id')` |
| **ScreenAdapter** | [ScreenAdapter.ts](./ScreenAdapter.ts) | 200 行 | 屏幕适配计算 | `adapter.calculateParams(w, h)` |
| **AudioManager** | [AudioManager.ts](./AudioManager.ts) | 257 行 | 音频播放管理 | `audio.playBgm('main', config)` |
| **GameOrchestrator** | [GameOrchestrator.ts](./GameOrchestrator.ts) | 197 行 | 编排所有组件 | `orchestrator.preload()` |

### ⏳ 待创建组件

| 组件 | 预计行数 | 职责 | 优先级 |
|------|---------|------|--------|
| **BackgroundRenderer** | ~200 行 | 背景渲染 | ⭐⭐ |
| **GridRenderer** | ~150 行 | 网格渲染 | ⭐⭐ |
| **ParticleRenderer** | ~150 行 | 粒子效果 | ⭐ |
| **SnakeRenderer** | ~300 行 | 蛇渲染 (示例) | ⭐⭐⭐ |
| **FoodRenderer** | ~200 行 | 食物渲染 (示例) | ⭐⭐⭐ |

---

## 🚀 快速开始

### 方式 1: 使用编排器 (推荐)

```typescript
import { GameOrchestrator } from './components'

const orchestrator = new GameOrchestrator({
  designWidth: 720,
  designHeight: 1280,
  gridCols: 32,
  gridRows: 18,
  baseCellSize: 50
})

// 预加载阶段
await orchestrator.preload('snake_default', containerElement)

// 创建场景阶段
await orchestrator.create(scene)

// 访问具体组件
orchestrator.getAudioManager().playBgm('main', {
  src: 'bgm.mp3',
  volume: 0.6,
  loop: true
})
```

### 方式 2: 直接使用单个组件

```typescript
// 只使用 GTRS 加载
import { GTRSLoader } from './components'
const loader = new GTRSLoader()
await loader.loadTheme('snake_default')

// 只使用屏幕适配
import { ScreenAdapter } from './components'
const adapter = new ScreenAdapter(720, 1280, 32, 18, 50)
adapter.calculateParams(width, height)

// 只使用音频管理
import { AudioManager } from './components'
const audio = new AudioManager()
audio.playBgm('main', { src: 'bgm.mp3', volume: 0.6 })
```

---

## 📐 架构设计

### 三层架构

```
┌─────────────────────────────────────┐
│   PhaserGame.ts (游戏主类)          │
│      ↓ 使用编排器                   │
├─────────────────────────────────────┤
│   GameOrchestrator (编排器)         │
│      ↓ 组合 + 按顺序调用            │
├─────────────────────────────────────┤
│   Components (功能组件)             │
│   ├─ GTRSLoader                     │
│   ├─ ScreenAdapter                  │
│   ├─ AudioManager                   │
│   └─ ...                            │
└─────────────────────────────────────┘
```

### 执行流程

```
preload() 阶段:
  1. GTRSLoader.loadTheme(themeId)
     ↓
  2. ScreenAdapter.calculateParams()
     ↓
  3. TODO: 图片资源加载
  
create() 阶段:
  1. TODO: BackgroundRenderer.render()
     ↓
  2. TODO: GridRenderer.render()
     ↓
  3. TODO: SnakeRenderer.render()
```

---

## 📚 详细文档

- 📖 **[COMPONENT_USAGE_GUIDE.md](../COMPONENT_USAGE_GUIDE.md)** - 完整使用指南
- 📖 **[COMPONENT_ORCHESTRATION_COMPLETE.md](../COMPONENT_ORCHESTRATION_COMPLETE.md)** - 完成报告
- 📖 **[FINAL_COMPONENT_REFACTOR_REPORT.md](../FINAL_COMPONENT_REFACTOR_REPORT.md)** - 最终总结

---

## 💡 核心特性

### 1. 逻辑封装 vs 逻辑不变

```typescript
// ✅ 逻辑封装在组件中，但逻辑本身不变
class GTRSLoader {
  async loadTheme() {
    // 完全复制原有的代码
    // 只是换了个文件存放
  }
}
```

### 2. 编排调用 vs 直接调用

```typescript
// ✅ 通过编排器按顺序调用组件
class GameOrchestrator {
  async preload() {
    // Step 1: 调用 GTRSLoader 组件
    await this.gtrsLoader.loadTheme()
    
    // Step 2: 调用 ScreenAdapter 组件
    this.screenAdapter.calculateParams()
  }
}
```

### 3. 清晰的职责分离

```
GTRSLoader       → 只负责 GTRS 加载
ScreenAdapter    → 只负责屏幕适配
AudioManager     → 只负责音频管理
GameOrchestrator → 只负责编排调用
```

---

## 🔍 调试技巧

### 查看详细日志

所有组件都包含详细的 console.log 输出:

```typescript
// 预加载阶段会输出:
🎬 [编排器] 开始预加载阶段...
[步骤 1/3] 加载 GTRS 主题...
[GTRSLoader] ✅ GTRS 主题已加载：Snake Default
[步骤 2/3] 计算屏幕适配参数...
[ScreenAdapter] ✅ 自动计算适配参数完成
✅ [编排器] 预加载阶段完成
```

### 访问组件内部状态

```typescript
const orchestrator = new GameOrchestrator()

// 查看 GTRS 状态
const loader = orchestrator.getGTRSLoader()
console.log('GTRS 已加载:', loader.assertGTRS())

// 查看屏幕适配参数
const adapter = orchestrator.getScreenAdapter()
console.log('当前 cellSize:', adapter.adapt.cellSize)

// 查看音频状态
const audio = orchestrator.getAudioManager()
console.log('声音已启用:', audio.isSoundEnabled())
```

---

## ⚠️ 注意事项

### 必须等待 preload 完成

```typescript
// ❌ 错误：在 preload 完成前访问
const orchestrator = new GameOrchestrator()
const theme = orchestrator.getGTRSLoader().assertGTRS() // 可能抛出异常

// ✅ 正确：等待 preload 完成
await orchestrator.preload('snake_default', container)
const theme = orchestrator.getGTRSLoader().assertGTRS() // 安全访问
```

### 容器元素必须有尺寸

```typescript
// ❌ 错误：容器未添加到 DOM
const container = document.createElement('div')
await orchestrator.preload('theme', container) // clientWidth = 0

// ✅ 正确：先添加到 DOM
document.body.appendChild(container)
await orchestrator.preload('theme', container) // 有正确的尺寸
```

---

## 📋 检查清单

### 使用前检查

- [ ] 容器元素已添加到 DOM
- [ ] 容器元素有正确的尺寸
- [ ] 用户已登录 (如果需要从后端加载主题)
- [ ] Phaser 场景已正确初始化

### 预加载阶段检查

- [ ] 等待 preload() 完成
- [ ] 检查控制台无错误日志
- [ ] 确认 GTRS 主题已加载
- [ ] 确认屏幕适配参数已计算

### 创建场景阶段检查

- [ ] 在 Phaser create 回调中调用
- [ ] 检查所有游戏元素已创建
- [ ] 确认音频开始播放

---

## 🎯 下一步计划

### 待完成的组件

- [ ] BackgroundRenderer - 背景渲染
- [ ] GridRenderer - 网格渲染
- [ ] ParticleRenderer - 粒子渲染
- [ ] SnakeRenderer - 蛇渲染 (示例)
- [ ] FoodRenderer - 食物渲染 (示例)

### 待集成的功能

- [ ] 图片资源加载集成到编排器
- [ ] 渲染组件集成到编排器
- [ ] 完整的单元测试
- [ ] 性能优化

---

**最后更新**: 2026-03-26  
**状态**: ✅ 核心组件已完成 (40%)  
**完成度**: ████████░░░░ 40%  
**下一步**: 继续创建剩余的渲染组件
