# 🎮 Kids Game Framework

**版本**: v1.0.0  
**描述**: 儿童游戏开发通用框架 - 基于 Phaser 3 + Vue 3 + Pinia  
**作者**: Kids Game Platform Team

---

## 📦 安装

```bash
npm install @kids-game/framework
```

**依赖要求**:
- Node.js >= 16
- Vue >= 3.4.0
- Pinia >= 2.1.0
- Phaser >= 3.70.0
- Axios >= 1.13.6

---

## 🚀 快速开始

### 1. 基础使用

```typescript
import { GameEngine } from '@kids-game/framework'

// 创建游戏引擎实例
const game = new GameEngine(
  containerElement,
  () => console.log('游戏完成!'),
  {
    designWidth: 720,
    designHeight: 1280,
    gridCols: 32,
    gridRows: 18,
    baseCellSize: 50
  }
)

// 启动游戏
await game.start('medium', 'snake_default')

// 访问框架功能
const cellSize = game.getCellSize()
const gtrs = game.getGTRS()
```

---

### 2. 继承扩展（推荐）

```typescript
import { GameEngine } from '@kids-game/framework'

export class MyGame extends GameEngine {
  private player: Phaser.GameObjects.Sprite | null = null
  
  constructor(element: HTMLElement, onGameComplete?: () => void) {
    super(element, onGameComplete, {
      designWidth: 720,
      designHeight: 1280,
      gridCols: 20,
      gridRows: 15,
      baseCellSize: 60
    })
  }
  
  // 重写预加载方法
  protected preload(scene: Phaser.Scene): void {
    super.preload(scene)
    // 添加游戏特定资源
    this.load.image('player', 'assets/player.png')
  }
  
  // 重写创建场景方法
  protected create(scene: Phaser.Scene): void {
    super.create(scene)
    // 创建游戏对象
    this.player = scene.add.sprite(100, 100, 'player')
  }
  
  // 重写游戏循环方法
  protected update(time: number, delta: number): void {
    super.update(time, delta)
    // 游戏逻辑更新
    if (this.player) {
      this.player.x += 5
    }
  }
}
```

---

## 📚 核心模块

### 🎯 GameEngine - 游戏引擎

核心功能：
- ✅ Phaser 引擎初始化
- ✅ GTRS 主题加载
- ✅ 屏幕自适应
- ✅ 音频管理
- ✅ 资源加载进度监听

```typescript
import { GameEngine } from '@kids-game/framework'

const game = new GameEngine(container, callback, {
  designWidth: 720,
  designHeight: 1280,
  gridCols: 32,
  gridRows: 18,
  baseCellSize: 50
})

await game.start('medium', 'theme_id')
```

---

### 📦 可复用组件

#### GTRSLoader - 主题加载器

```typescript
import { GTRSLoader } from '@kids-game/framework'

const loader = new GTRSLoader()
await loader.loadTheme('theme_id')
const theme = loader.assertGTRS()
const assetKey = loader.getThemeAssetKey('player')
```

---

#### ScreenAdapter - 屏幕适配器

```typescript
import { ScreenAdapter } from '@kids-game/framework'

const adapter = new ScreenAdapter(
  720,   // 设计宽度
  1280,  // 设计高度
  32,    // 网格列数
  18,    // 网格行数
  50     // 基础单元格大小
)

adapter.calculateParams(containerWidth, containerHeight)
console.log('cellSize:', adapter.adapt.cellSize)
```

---

#### AudioManager - 音频管理器

```typescript
import { AudioManager } from '@kids-game/framework'

const audio = new AudioManager()

// 播放 BGM
audio.playBgm('main', {
  src: 'bgm.mp3',
  volume: 0.6,
  loop: true
})

// 播放音效
audio.playSound('jump', {
  src: 'jump.wav',
  volume: 0.8
})

// 静音控制
audio.setSoundEnabled(false)
```

---

#### ItemSystem - 道具系统

```typescript
import { ItemSystem } from '@kids-game/framework'

const itemSystem = new ItemSystem({
  enabled: true,
  spawnInterval: 10000,    // 10 秒生成一个
  maxActiveItems: 3,       // 最多 3 个活跃道具
  itemLifetime: 10000,     // 道具存活 10 秒
  debugMode: true
})

itemSystem.initialize(adaptParams, GRID_COLS, GRID_ROWS)
itemSystem.setScene(scene)
itemSystem.update(player, enemies)
```

---

### 🛠️ 工具函数

#### 颜色工具

```typescript
import { hexToNumber, lerpColor, adjustBrightness } from '@kids-game/framework/utils'

// Hex 转数字
const red = hexToNumber('#ff0000') // 16711680

// 颜色渐变
const purple = lerpColor(red, 0x0000ff, 0.5)

// 调整亮度
const brightRed = adjustBrightness(red, 0.2)
```

---

#### 数学工具

```typescript
import { lerp, clamp, randomInt, distance } from '@kids-game/framework/utils'

// 线性插值
const pos = lerp(0, 100, 0.5) // 50

// 限制范围
const speed = clamp(150, 0, 100) // 100

// 随机整数
const dice = randomInt(1, 6)

// 距离计算
const dist = distance(0, 0, 3, 4) // 5
```

---

### ⚙️ 配置常量

```typescript
import { 
  GAME_CODE, 
  DIFFICULTY_CONFIGS, 
  DEFAULT_GAME_CONFIG,
  AUDIO_CONFIG 
} from '@kids-game/framework/config'

console.log(GAME_CODE.SNAKE) // 'snake'
console.log(DIFFICULTY_CONFIGS.medium.speed) // 5
console.log(DEFAULT_GAME_CONFIG.cellSize) // 50
console.log(AUDIO_CONFIG.defaultBgmVolume) // 0.6
```

---

## 🏗️ 架构设计

### 三层架构

```
┌─────────────────────────────────────┐
│  Vue 组件层                          │ ← 用户交互、UI 渲染
├─────────────────────────────────────┤
│  Phaser 游戏层                       │ ← 游戏引擎、渲染
│  ├─ 可复用框架层 (80%)              │
│  └─ 游戏特定层 (20%)                │
├─────────────────────────────────────┤
│  组件库层                            │ ← 功能组件化
└─────────────────────────────────────┘
```

---

## 📋 新游戏开发流程

### Step 1: 复制框架（5 分钟）

```bash
cp games/snake/src/components/game/PhaserGame.ts \
   games/my-game/src/components/game/MyGamePhaser.ts
```

### Step 2: 修改配置（10 分钟）

```typescript
export class MyGamePhaserGame extends GameEngine {
  constructor(element: HTMLElement, onGameComplete?: () => void) {
    super(element, onGameComplete, {
      designWidth: 1280,  // 👈 横屏游戏
      designHeight: 720,
      gridCols: 20,       // 👈 你的网格列数
      gridRows: 12,       // 👈 你的网格行数
      baseCellSize: 60    // 👈 你的单元格大小
    })
  }
}
```

### Step 3: 实现渲染（30 分钟）

```typescript
protected create(scene: Phaser.Scene): void {
  super.create(scene)
  // 实现你的渲染逻辑
  this.renderPlayer()
  this.renderEnemies()
}

private renderPlayer(): void {
  // 👈 玩家渲染
}

private renderEnemies(): void {
  // 👈 敌人渲染
}
```

### Step 4: 创建 Vue 组件（20 分钟）

```vue
<script setup lang="ts">
import { MyGamePhaserGame } from './MyGamePhaser'

const game = new MyGamePhaserGame(container, () => {
  console.log('游戏完成!')
})

await game.start('medium', 'my_theme_id')
</script>
```

### Step 5: 测试运行（10 分钟）

```bash
npm run dev
```

**总计**: 约 75 分钟即可创建一个新游戏！🚀

---

## 💡 最佳实践

### ✅ 推荐做法

1. **保持框架纯净**
   - 框架层不包含具体游戏逻辑
   - 游戏特定代码在游戏项目中实现
   - 通过继承扩展功能

2. **使用类型安全**
   ```typescript
   import type { Difficulty } from '@kids-game/framework'
   
   const difficulty: Difficulty = 'medium'
   ```

3. **详细注释**
   ```typescript
   /**
    * ⭐ 渲染玩家角色
    * @param data 玩家数据
    */
   private renderPlayer(data: any): void {
     // ...
   }
   ```

### ❌ 避免的做法

1. **硬编码配置**
   ```typescript
   // ❌ 错误
   const color = 0x4ade80
   
   // ✅ 正确
   const color = this.themeColors.player
   ```

2. **忽略屏幕适配**
   ```typescript
   // ❌ 错误
   const size = 50
   
   // ✅ 正确
   const size = this.Adapt.cellSize * 0.7
   ```

3. **在 Phaser 中直接调用 Pinia**
   ```typescript
   // ❌ 错误
   const gameStore = useGameStore()
   
   // ✅ 正确
   this.setItemEffectCallback((type) => {
     gameStore.applyItemEffect(type)
   })
   ```

---

## 📊 代码统计

| 指标 | 数值 |
|------|------|
| 总行数 | ~2,500 行 |
| 核心组件 | 5 个 |
| 工具函数 | 15+ 个 |
| 配置常量 | 4 组 |
| 预计复用率 | 80% |
| 新游戏开发时间 | 75 分钟 |

---

## 🔧 开发指南

### 本地开发

```bash
cd kids-game-house/shared/game-framework
npm install
npm run type-check
```

### 构建（待实现）

```bash
npm run build
```

### 测试（待实现）

```bash
npm test
```

---

## 📚 相关文档

- [REUSABLE_GAME_FRAMEWORK.md](./REUSABLE_GAME_FRAMEWORK.md) - 完整框架指南
- [GAME_FRAMEWORK_EXTRACTION_GUIDE.md](./GAME_FRAMEWORK_EXTRACTION_GUIDE.md) - 抽取指南
- [GAME_FRAMEWORK_EXTRACTION_STATUS.md](./GAME_FRAMEWORK_EXTRACTION_STATUS.md) - 状态报告
- [QUICK_REFERENCE_CARD.md](./QUICK_REFERENCE_CARD.md) - 快速参考

---

## 🎯 特性列表

### ✅ 已实现

- [x] GameEngine 核心引擎
- [x] GTRS 主题加载系统
- [x] 屏幕自适应系统
- [x] 音频管理系统
- [x] 道具系统
- [x] 颜色工具函数
- [x] 数学工具函数
- [x] 配置常量
- [x] TypeScript 类型定义

### ⏳ 计划中

- [ ] 粒子系统
- [ ] 物理引擎封装
- [ ] 网络对战支持
- [ ] 性能监控
- [ ] 单元测试
- [ ] 性能测试
- [ ] 示例项目

---

## 🤝 贡献指南

### 提交代码

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 编写详细的 JSDoc 注释
- 添加单元测试

---

## 📄 许可证

MIT License

---

## 🎉 总结

Kids Game Framework 是一个**专为儿童游戏开发设计的通用框架**，具有以下特点：

- 🚀 **快速开发**: 75 分钟即可创建一个新游戏
- 📦 **高度复用**: 80% 代码可直接复用
- 🏗️ **清晰架构**: 三层架构，职责分离
- 🛠️ **工具齐全**: 丰富的工具函数和组件
- 📚 **文档完善**: 详细的使用指南和示例

**立即开始创造精彩的儿童游戏吧！** 🎮✨

---

**最后更新**: 2026-03-27  
**维护者**: Sitech AI Team  
**反馈**: 如有问题请提交 Issue 或联系开发团队
