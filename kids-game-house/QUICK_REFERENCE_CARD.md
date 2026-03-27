# 🎮 贪吃蛇游戏开发框架 - 快速参考卡

**版本**: v1.0 | **日期**: 2026-03-27 | **适用**: Phaser 3.x + Vue 3.x

---

## 📊 代码复用率概览

```
┌─────────────────────────────────────┐
│  可复用框架层 (80%) - 直接复制       │ 
│  ├─ Phaser 引擎封装 (PhaserGame.ts:1-600)
│  ├─ GTRS 主题加载系统                │
│  ├─ 屏幕自适应系统                  │
│  ├─ 音频管理系统                    │
│  ├─ 资源管理系统                    │
│  └─ 道具系统（可选）                │
├─────────────────────────────────────┤
│  游戏特定层 (20%) - 需要修改         │
│  ├─ 游戏对象渲染方法                │
│  ├─ 游戏逻辑实现                    │
│  └─ 特定规则                        │
└─────────────────────────────────────┘
```

---

## 🚀 新游戏开发 5 步曲

### Step 1: 复制框架文件
```bash
cp games/snake/src/components/game/PhaserGame.ts \
   games/your-game/src/components/game/YourGamePhaser.ts
```

### Step 2: 修改类名和配置
```typescript
export class YourGamePhaserGame {
  private readonly GRID_COLS = 20  // 👈 修改列数
  private readonly GRID_ROWS = 15  // 👈 修改行数
  private readonly BASE_CELL_SIZE = 60  // 👈 修改单元格大小
  
  // 👇 修改游戏对象引用
  private player: Phaser.GameObjects.Sprite | null = null
  private enemies: Phaser.GameObjects.Group | null = null
}
```

### Step 3: 实现渲染方法
```typescript
private renderPlayer(data: any): void {
  // 👈 实现你的玩家渲染逻辑
}

private renderEnemies(data: any): void {
  // 👈 实现你的敌人渲染逻辑
}
```

### Step 4: 创建 Vue 组件
```vue
<script setup lang="ts">
import { YourGamePhaserGame } from './YourGamePhaser'

const game = new YourGamePhaserGame(container, () => {
  console.log('游戏完成!')
})

await game.start('medium', 'theme_id')
</script>
```

### Step 5: 测试运行
```bash
npm run dev
```

---

## 📦 核心组件 API

### 1. GTRSLoader - 主题加载器
```typescript
const loader = new GTRSLoader()
await loader.loadTheme('theme_id')
const theme = loader.assertGTRS()
const assetKey = loader.getThemeAssetKey('snake_head')
```

### 2. ScreenAdapter - 屏幕适配器
```typescript
const adapter = new ScreenAdapter(
  720, 1280,    // 设计尺寸
  32, 18,       // 网格行列数
  50            // 基础单元格大小
)
adapter.calculateParams(width, height)
// 输出：adapt.cellSize, adapt.safeTop, adapt.safeBottom
```

### 3. AudioManager - 音频管理器
```typescript
const audio = new AudioManager()
audio.playBgm('main', { src: 'bgm.mp3', volume: 0.6, loop: true })
audio.playSound('eat', { src: 'eat.mp3', volume: 0.8 })
audio.setSoundEnabled(false)
```

### 4. ItemSystem - 道具系统
```typescript
const itemSystem = new ItemSystem({
  enabled: true,
  spawnInterval: 10000,
  maxActiveItems: 3,
  itemLifetime: 10000
})
itemSystem.initialize(adaptParams, GRID_COLS, GRID_ROWS)
itemSystem.setScene(scene)
itemSystem.update(snake, food)
```

---

## 🎯 关键配置项

### 游戏配置（必须修改）
```typescript
private readonly DESIGN_WIDTH = 720      // 竖屏/横屏基准
private readonly DESIGN_HEIGHT = 1280

private readonly GRID_COLS = 32          // 👈 游戏网格列数
private readonly GRID_ROWS = 18          // 👈 游戏网格行数
private readonly BASE_CELL_SIZE = 50     // 👈 单元格大小（像素）
```

### 游戏对象（必须定义）
```typescript
// 👇 根据你的游戏定义对象
private player: Phaser.GameObjects.Sprite | null = null
private enemies: Phaser.GameObjects.Group | null = null
private bullets: Phaser.GameObjects.Group | null = null
private obstacles: Phaser.GameObjects.Group | null = null
```

---

## 🔧 常用代码片段

### 屏幕适配计算（直接复制）
```typescript
private calculateAdaptParams(w: number, h: number): void {
  this.Adapt.screenW = w
  this.Adapt.screenH = h
  this.Adapt.safeTop = Math.max(44, h * 0.05)
  this.Adapt.safeBottom = Math.max(34, h * 0.08)
  
  const baseCellSize = 50
  const gameAreaWidth = this.GRID_COLS * baseCellSize
  const gameAreaHeight = this.GRID_ROWS * baseCellSize
  
  const availableWidth = (w - 20) * 0.95
  const availableHeight = (h - this.Adapt.safeTop - this.Adapt.safeBottom) * 0.9
  
  const finalScale = Math.min(
    availableWidth / gameAreaWidth,
    availableHeight / gameAreaHeight,
    1.5
  )
  this.Adapt.cellSize = baseCellSize * finalScale
}
```

### GTRS 主题加载（直接复制）
```typescript
private async loadTheme(themeId: string): Promise<void> {
  const themeStore = useThemeStore()
  let configJsonStr: string
  
  if (themeStore.gtrsRawJson) {
    configJsonStr = themeStore.gtrsRawJson
  } else {
    const token = localStorage.getItem('token')
    const response = await fetch(
      `http://localhost:8080/api/theme/download?id=${themeId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    const result = await response.json()
    configJsonStr = result.data
  }
  
  const validationResult = validateGTRSTheme(configJsonStr)
  if (!validationResult.valid) {
    throw new Error(`GTRS 校验失败：${validationResult.message}`)
  }
  
  applyGTRS(JSON.parse(configJsonStr))
}
```

### 资源加载进度监听（直接复制）
```typescript
scene.load.on('filecomplete', () => {
  loadedResources++
  const progress = (loadedResources / totalResourcesToLoad) * 100
  this.onProgress?.(progress)
})

scene.load.on('complete', () => {
  this.onProgress?.(100)
})
```

---

## ⚠️ 常见陷阱与解决方案

### ❌ 错误：在 Phaser 中调用 Pinia
```typescript
// ❌ 错误
const gameStore = useGameStore()
gameStore.setScore(100)

// ✅ 正确：通过回调注入
this.setItemEffectCallback((type) => {
  gameStore.applyItemEffect(type)
})
```

### ❌ 错误：硬编码颜色值
```typescript
// ❌ 错误
const color = 0x4ade80

// ✅ 正确：从主题读取
const color = this.themeColors.snakeBody
```

### ❌ 错误：忽略屏幕适配
```typescript
// ❌ 错误
const size = 50

// ✅ 正确：使用动态 cellSize
const size = this.Adapt.cellSize * 0.7
```

### ❌ 错误：容器未添加到 DOM
```typescript
// ❌ 错误
const container = document.createElement('div')
await game.preload(container)  // clientWidth = 0

// ✅ 正确：先添加到 DOM
document.body.appendChild(container)
await game.preload(container)  // 有正确的尺寸
```

---

## 📋 检查清单

### 启动前检查
- [ ] 容器元素已添加到 DOM
- [ ] 容器元素有正确的尺寸
- [ ] 用户已登录（如果需要加载主题）
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

## 🎨 游戏类型推荐配置

### 竖屏游戏（贪吃蛇、俄罗斯方块）
```typescript
DESIGN_WIDTH = 720
DESIGN_HEIGHT = 1280
GRID_COLS = 32
GRID_ROWS = 18
BASE_CELL_SIZE = 50
```

### 横屏游戏（飞机大战、坦克大战）
```typescript
DESIGN_WIDTH = 1280
DESIGN_HEIGHT = 720
GRID_COLS = 20
GRID_ROWS = 12
BASE_CELL_SIZE = 60
```

### 棋盘类游戏（扑克、棋类）
```typescript
DESIGN_WIDTH = 1000
DESIGN_HEIGHT = 1000
GRID_COLS = 10
GRID_ROWS = 10
BASE_CELL_SIZE = 80
```

---

## 📚 详细文档索引

| 文档 | 用途 | 位置 |
|------|------|------|
| [REUSABLE_GAME_FRAMEWORK.md](./REUSABLE_GAME_FRAMEWORK.md) | 完整框架指南 | kids-game-house/ |
| [SNAKE_CODE_REFERENCE.md](./SNAKE_CODE_REFERENCE.md) | 详细代码注释 | kids-game-house/ |
| [GAME_DEVELOPMENT_STANDARD.md](./GAME_DEVELOPMENT_STANDARD.md) | 开发标准 | kids-game-house/ |
| [COMPONENT_USAGE_GUIDE.md](./games/snake/src/components/game/components/COMPONENT_USAGE_GUIDE.md) | 组件使用 | games/snake/src/components/game/components/ |

---

## 💡 最佳实践

### ✅ 推荐
- 保持框架层代码不变（PhaserGame.ts 前 600 行）
- 使用组件化架构（GTRSLoader, ScreenAdapter 等）
- 优先从主题读取资源配置
- 提供降级方案（无主题时的备选）
- 详细的注释和日志输出

### ❌ 避免
- 修改框架层代码
- 硬编码配置值
- 在 Phaser class 内部直接调用 Pinia
- 忽略屏幕适配计算
- 缺少错误处理

---

## 🔗 快速链接

### 核心文件
- [PhaserGame.ts](./games/snake/src/components/game/PhaserGame.ts) - 游戏主类
- [SnakeGame.vue](./games/snake/src/components/game/SnakeGame.vue) - Vue 组件示例
- [ItemSystem.ts](./games/snake/src/components/game/components/ItemSystem.ts) - 道具系统

### 工具函数
- [gtrs-validator.ts](./games/snake/src/utils/gtrs-validator.ts) - GTRS 校验
- [uiResponsive.ts](./games/snake/src/utils/uiResponsive.ts) - UI 响应式

### 类型定义
- [game.ts](./games/snake/src/types/game.ts) - 游戏类型定义
- [GTRSTheme](./shared/game-framework/src/types/gtrs.ts) - GTRS 主题类型

---

**最后更新**: 2026-03-27  
**维护者**: Sitech AI Team  
**反馈**: 如有问题请提交 Issue 或联系开发团队
