# 🎮 组件化引擎使用指南

**版本**: v3.2  
**日期**: 2026-03-26  
**目标**: 通过组件封装和编排调用，保持原有逻辑不变

---

## 📦 快速开始

### 方式 1: 使用编排器 (推荐)

```typescript
import { GameOrchestrator } from './components'

// 创建编排器
const orchestrator = new GameOrchestrator({
  designWidth: 720,
  designHeight: 1280,
  gridCols: 32,
  gridRows: 18,
  baseCellSize: 50
})

// 预加载阶段 (自动按顺序调用各组件)
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
// 只使用 GTRS 加载功能
import { GTRSLoader } from './components'

const loader = new GTRSLoader()
await loader.loadTheme('snake_default')
const theme = loader.assertGTRS()

// 只使用屏幕适配功能
import { ScreenAdapter } from './components'

const adapter = new ScreenAdapter(720, 1280, 32, 18, 50)
adapter.calculateParams(width, height)
console.log(adapter.adapt.cellSize)

// 只使用音频管理功能
import { AudioManager } from './components'

const audio = new AudioManager()
audio.playBgm('main', { src: 'bgm.mp3', volume: 0.6 })
```

---

## 🏗️ 架构说明

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
│   └─ ... (待完成)                   │
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

## 📚 API 文档

### GameOrchestrator (编排器)

#### 构造函数

```typescript
new GameOrchestrator(config?: {
  designWidth?: number       // 设计宽度，默认 720
  designHeight?: number      // 设计高度，默认 1280
  gridCols?: number          // 网格列数，默认 32
  gridRows?: number          // 网格行数，默认 18
  baseCellSize?: number      // 基础单元格大小，默认 50
})
```

#### 主要方法

```typescript
// 预加载阶段
async preload(themeId: string, containerElement: HTMLElement): Promise<void>

// 创建场景阶段
async create(scene: Phaser.Scene): Promise<void>

// 处理 resize
handleResize(newWidth: number, newHeight: number): void

// 获取组件实例
getGTRSLoader(): GTRSLoader
getScreenAdapter(): ScreenAdapter
getAudioManager(): AudioManager
```

---

### GTRSLoader (GTRS 加载器)

#### 主要方法

```typescript
// 加载主题
async loadTheme(themeId: string): Promise<GTRSTheme>

// 获取已加载的主题
assertGTRS(): GTRSTheme

// 获取图片缓存
getImageCache(): Map<string, HTMLImageElement | HTMLCanvasElement>
```

---

### ScreenAdapter (屏幕适配器)

#### 构造函数

```typescript
new ScreenAdapter(
  designWidth: number = 720,
  designHeight: number = 1280,
  gridCols: number = 32,
  gridRows: number = 18,
  baseCellSize: number = 50
)
```

#### 主要方法

```typescript
// 计算适配参数
calculateParams(containerWidth: number, containerHeight: number): void

// 重新计算适配参数 (resize 时)
recalculateParams(newWidth: number, newHeight: number): void

// 获取游戏区域偏移
getGameAreaOffset(): { x: number, y: number }

// 获取网格线宽度
getGridLineWidth(): number

// 获取边框宽度
getBorderWidth(): number

// 获取粒子缩放系数
getParticleScale(): number

// 获取适配参数
get adapt(): AdaptParams
```

---

### AudioManager (音频管理器)

#### 主要方法

```typescript
// 播放背景音乐
playBgm(type: BgmType, config: AudioConfig): void

// 播放音效
playSound(config: AudioConfig): void

// 停止所有 BGM
stopAllBgm(): void

// 暂停所有音频
pauseAll(): void

// 恢复播放
resumeAll(): void

// 切换声音开关
toggleSound(): boolean

// 设置音量
setBgmVolume(volume: number): void

// 预加载音频
preloadAudio(configs: AudioConfig[]): Promise<void>
```

---

## 💡 使用示例

### 示例 1: 完整的贪吃蛇游戏

```typescript
import { GameOrchestrator } from './components'

export class SnakePhaserGame {
  private orchestrator: GameOrchestrator
  private scene: Phaser.Scene | null = null
  
  constructor() {
    this.orchestrator = new GameOrchestrator({
      gridCols: 32,
      gridRows: 18,
      baseCellSize: 50
    })
  }
  
  private async preload(scene: Phaser.Scene): Promise<void> {
    this.scene = scene
    
    // 使用编排器自动按顺序调用
    await this.orchestrator.preload(
      'snake_default',
      this.containerElement
    )
    
    // 手动调用图片加载 (TODO: 未来集成到编排器)
    // this.loadGTRSImages(scene)
  }
  
  private async create(scene: Phaser.Scene): Promise<void> {
    await this.orchestrator.create(scene)
    
    // 播放背景音乐
    const audio = this.orchestrator.getAudioManager()
    audio.playBgm('gameplay', {
      src: this.getThemeAssetKey('bgm_gameplay'),
      volume: 0.6,
      loop: true
    })
  }
  
  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.orchestrator.handleResize(
      gameSize.width,
      gameSize.height
    )
  }
}
```

### 示例 2: 自定义配置

```typescript
// 飞机大战配置
const planeOrchestrator = new GameOrchestrator({
  designWidth: 720,
  designHeight: 1280,
  gridCols: 20,      // 20 列
  gridRows: 15,      // 15 行
  baseCellSize: 60   // 60px 单元格
})

// 坦克大战配置
const tankOrchestrator = new GameOrchestrator({
  designWidth: 720,
  designHeight: 1280,
  gridCols: 24,      // 24 列
  gridRows: 20,      // 20 行
  baseCellSize: 40   // 40px 单元格
})
```

### 示例 3: 独立使用组件

```typescript
// 只在需要时加载 GTRS
import { GTRSLoader } from './components'

const loader = new GTRSLoader()

// 在 Vue 组件中
onMounted(async () => {
  try {
    await loader.loadTheme('snake_default')
    console.log('主题加载成功:', loader.assertGTRS())
  } catch (error) {
    console.error('主题加载失败:', error)
  }
})

// 只在需要时计算屏幕适配
import { ScreenAdapter } from './components'

const adapter = new ScreenAdapter()

// 监听窗口 resize
window.addEventListener('resize', () => {
  adapter.recalculateParams(window.innerWidth, window.innerHeight)
  console.log('新的 cellSize:', adapter.adapt.cellSize)
})
```

---

## 🔍 调试技巧

### 查看详细的日志输出

所有组件都包含详细的 console.log 输出:

```typescript
// 预加载阶段会输出:
🎬 [编排器] 开始预加载阶段...
[步骤 1/3] 加载 GTRS 主题...
[GTRSLoader] ✅ GTRS 主题已加载：Snake Default (id=snake_default)
[步骤 2/3] 计算屏幕适配参数...
[ScreenAdapter] ✅ 自动计算适配参数完成
[步骤 3/3] 加载图片资源...
✅ [编排器] 预加载阶段完成
```

### 访问组件内部状态

```typescript
const orchestrator = new GameOrchestrator()

// 查看 GTRS 加载器状态
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

### 1. 必须等待 preload 完成后再调用其他方法

```typescript
// ❌ 错误：在 preload 完成前访问
const orchestrator = new GameOrchestrator()
const theme = orchestrator.getGTRSLoader().assertGTRS() // 可能抛出异常

// ✅ 正确：等待 preload 完成
await orchestrator.preload('snake_default', container)
const theme = orchestrator.getGTRSLoader().assertGTRS() // 安全访问
```

### 2. 容器元素必须有尺寸

```typescript
// ❌ 错误：容器未添加到 DOM
const container = document.createElement('div')
await orchestrator.preload('theme', container) // container.clientWidth = 0

// ✅ 正确：先添加到 DOM
document.body.appendChild(container)
await orchestrator.preload('theme', container) // 有正确的尺寸
```

### 3. Phaser 场景必须在 create 阶段调用

```typescript
// ✅ 正确：在 Phaser 的 create 回调中调用
private create(scene: Phaser.Scene): void {
  this.orchestrator.create(scene)
}
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
