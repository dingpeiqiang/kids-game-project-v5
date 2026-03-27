# 🎮 游戏框架代码抽取指南

**日期**: 2026-03-27  
**目标**: 将贪吃蛇游戏的可复用框架代码抽取到 `shared/game-framework/` 目录

---

## 📋 抽取策略

### 原则
1. ✅ **保持引用关系清晰**: 框架代码不依赖具体游戏
2. ✅ **TypeScript 类型完整**: 提供完整的类型定义
3. ✅ **Vue 3 兼容**: 支持 Composition API
4. ✅ **Phaser 3 集成**: 无缝集成 Phaser 游戏引擎
5. ✅ **按需导入**: 支持 Tree Shaking，只引入需要的部分

---

## 🗂️ 目标目录结构

```
shared/game-framework/src/
├── core/                      # 核心游戏引擎
│   ├── GameEngine.ts         # ⭐ Phaser 游戏引擎封装（核心）
│   ├── GameLoop.ts           # 游戏循环管理
│   └── GameState.ts          # 游戏状态管理
├── components/                # 可复用组件
│   ├── GTRSLoader.ts         # ⭐ GTRS 主题加载器
│   ├── ScreenAdapter.ts      # ⭐ 屏幕适配器
│   ├── AudioManager.ts       # ⭐ 音频管理器
│   ├── ItemSystem.ts         # ⭐ 道具系统
│   ├── ParticleSystem.ts     # 粒子系统（可选）
│   └── index.ts              # 组件统一导出
├── stores/                    # Pinia Store
│   ├── game.store.ts         # 游戏状态 Store
│   └── theme.store.ts        # 主题 Store
├── types/                     # 类型定义
│   ├── game.types.ts         # 游戏通用类型
│   ├── gtrs.types.ts         # GTRS 主题类型
│   ├── item.types.ts         # 道具类型
│   └── index.ts              # 类型统一导出
├── utils/                     # 工具函数
│   ├── gtrs-validator.ts     # ⭐ GTRS 校验工具
│   ├── color-utils.ts        # 颜色转换工具
│   ├── math-utils.ts         # 数学工具
│   └── index.ts              # 工具统一导出
├── config/                    # 配置常量
│   ├── game.config.ts        # 游戏配置
│   └── default.config.ts     # 默认配置
├── composables/               # Vue Composables（可选）
│   ├── useGame.ts            # 游戏 Hook
│   └── useTheme.ts           # 主题 Hook
└── index.ts                   # 统一导出入口
```

---

## 📦 需要抽取的文件清单

### 从 games/snake/ 抽取

| 源文件 | 目标位置 | 说明 | 优先级 |
|-------|---------|------|--------|
| `games/snake/src/components/game/PhaserGame.ts` (1-600 行) | `core/GameEngine.ts` | ⭐ 核心框架 | 🔴 高 |
| `games/snake/src/components/game/components/GTRSLoader.ts` | `components/GTRSLoader.ts` | ⭐ GTRS 加载器 | 🔴 高 |
| `games/snake/src/components/game/components/ScreenAdapter.ts` | `components/ScreenAdapter.ts` | ⭐ 屏幕适配 | 🔴 高 |
| `games/snake/src/components/game/components/AudioManager.ts` | `components/AudioManager.ts` | ⭐ 音频管理 | 🔴 高 |
| `games/snake/src/components/game/components/ItemSystem.ts` | `components/ItemSystem.ts` | ⭐ 道具系统 | 🟡 中 |
| `games/snake/src/components/game/components/ItemManager.ts` | `components/ItemManager.ts` | 道具管理 | 🟡 中 |
| `games/snake/src/utils/gtrs-validator.ts` | `utils/gtrs-validator.ts` | ⭐ GTRS 校验 | 🔴 高 |
| `games/snake/src/types/game.ts` | `types/game.types.ts` | 游戏类型 | 🟡 中 |
| `games/snake/src/stores/theme.ts` | `stores/theme.store.ts` | 主题 Store | 🟢 低 |
| `games/snake/src/stores/game.ts` | `stores/game.store.ts` | 游戏 Store | 🟢 低 |

---

## 🔧 修改步骤

### Step 1: 复制核心文件

```bash
# 1. 创建目录结构
cd kids-game-house/shared/game-framework/src
mkdir -p core components stores types utils config composables

# 2. 复制核心组件（从 snake 项目）
cp ../../../games/snake/src/components/game/components/GTRSLoader.ts ./components/
cp ../../../games/snake/src/components/game/components/ScreenAdapter.ts ./components/
cp ../../../games/snake/src/components/game/components/AudioManager.ts ./components/
cp ../../../games/snake/src/components/game/components/ItemSystem.ts ./components/
cp ../../../games/snake/src/components/game/components/ItemManager.ts ./components/

# 3. 复制工具函数
cp ../../../games/snake/src/utils/gtrs-validator.ts ./utils/

# 4. 复制类型定义
cp ../../../games/snake/src/types/game.ts ./types/game.types.ts
```

---

### Step 2: 提取 GameEngine 核心代码

从 `PhaserGame.ts` 提取前 600 行到 `core/GameEngine.ts`:

```typescript
// ============================================================================
// 🎮【核心框架】Phaser 游戏引擎封装 - shared/game-framework/src/core/GameEngine.ts
// ============================================================================
// 
// 📌 使用说明:
//   ✅ 这是所有游戏通用的核心框架
//   ✅ 包含：GTRS 主题系统、Phaser 初始化、屏幕适配、音频管理、资源加载
//   ✅ 无需修改，直接复用到其他游戏项目
//
// ============================================================================

import type { Difficulty } from '../types/game.types'
import { GTRSLoader } from '../components/GTRSLoader'
import { ScreenAdapter } from '../components/ScreenAdapter'
import { AudioManager } from '../components/AudioManager'
import { validateGTRSTheme, type GTRSTheme as BaseGTRSTheme } from '../utils/gtrs-validator'
import { useThemeStore } from '../stores/theme.store'

// 👉 声明全局 Phaser 变量（解决 TypeScript 编译问题）
declare const Phaser: any

// ============================================================================
// 📦【类型定义】
// ============================================================================

/**
 * ⭐ GTRSTheme 扩展类型
 */
export interface GTRSTheme extends BaseGTRSTheme {
  themeInfo?: {
    themeId: string
    themeName: string
    isDefault: boolean
    author?: string
    description?: string
  }
}

// ⭐ 运行时主题对象
let GTRS: GTRSTheme | null = null

// ⭐ 全局图片资源缓存 Map
const imageCache = new Map<string, HTMLImageElement | HTMLCanvasElement>()

// ============================================================================
// 🛠️【工具函数】
// ============================================================================

/**
 * Hex 颜色字符串转数字
 */
function hexToNumber(hex: string): number {
  if (!hex) return 0x000000
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return 0x000000
  const num = parseInt(clean, 16)
  return isNaN(num) ? 0x000000 : num
}

/**
 * ⭐ 断言 GTRS 已加载
 */
function assertGTRS(): GTRSTheme {
  if (!GTRS) {
    throw new Error('[GTRS] 主题未加载！请先调用 loadTheme() 获取主题后再启动游戏。')
  }
  return GTRS
}

// ============================================================================
// 🎮【GameEngine 主类】
// ============================================================================

export interface GameEngineConfig {
  designWidth?: number
  designHeight?: number
  gridCols?: number
  gridRows?: number
  baseCellSize?: number
}

export class GameEngine {
  // ============================================================================
  // 🔧【游戏配置】
  // ============================================================================
  
  private config: Phaser.Types.Core.GameConfig
  private game: Phaser.Game | null = null
  private scene: Phaser.Scene | null = null
  
  // 👉 设计基准
  private readonly DESIGN_WIDTH: number
  private readonly DESIGN_HEIGHT: number
  
  // 👉 游戏网格配置
  private readonly GRID_COLS: number
  private readonly GRID_ROWS: number
  
  // 👉 基础单元格大小
  private readonly BASE_CELL_SIZE: number
  
  // ============================================================================
  // 🔧【全局适配参数】
  // ============================================================================
  
  protected Adapt = {
    screenW: 0,
    screenH: 0,
    scale: 1,
    safeTop: 0,
    safeBottom: 0,
    cellSize: 0,
    gameAreaX: 0,
    gameAreaY: 0
  }
  
  // ============================================================================
  // 🔧【组件实例】
  // ============================================================================
  
  protected gtrsLoader: GTRSLoader
  protected screenAdapter: ScreenAdapter
  protected audioManager: AudioManager
  
  // ============================================================================
  // 🔧【回调与状态】
  // ============================================================================
  
  protected onGameComplete?: () => void
  protected onProgress?: (progress: number) => void
  protected containerElement: HTMLElement | null = null
  
  // ============================================================================
  // 🔧【构造函数】
  // ============================================================================
  
  constructor(
    element: HTMLElement,
    onGameComplete?: () => void,
    config: GameEngineConfig = {}
  ) {
    this.onGameComplete = onGameComplete
    this.containerElement = element
    
    // 👉 应用配置
    this.DESIGN_WIDTH = config.designWidth ?? 720
    this.DESIGN_HEIGHT = config.designHeight ?? 1280
    this.GRID_COLS = config.gridCols ?? 32
    this.GRID_ROWS = config.gridRows ?? 18
    this.BASE_CELL_SIZE = config.baseCellSize ?? 50
    
    // 👉 初始化组件
    this.gtrsLoader = new GTRSLoader()
    this.screenAdapter = new ScreenAdapter(
      this.DESIGN_WIDTH,
      this.DESIGN_HEIGHT,
      this.GRID_COLS,
      this.GRID_ROWS,
      this.BASE_CELL_SIZE
    )
    this.audioManager = new AudioManager()
    
    console.log('📐 游戏设计基准:', {
      designSize: `${this.DESIGN_WIDTH} × ${this.DESIGN_HEIGHT}`,
      gridConfig: `${this.GRID_COLS}列 × ${this.GRID_ROWS}行`,
      cellSize: `${this.BASE_CELL_SIZE}px`
    })
    
    // 👉 初始化 Phaser 配置
    this.initPhaserConfig()
  }
  
  // ============================================================================
  // 🚀【公共 API】
  // ============================================================================
  
  /**
   * ⭐ 启动游戏
   */
  async start(difficulty: Difficulty, themeId: string): Promise<void> {
    if (this.game) {
      this.game.destroy(true)
    }

    if (!themeId) {
      throw new Error('[GameEngine] 必须提供 themeId 才能启动游戏。')
    }

    // ⭐ 先加载主题
    console.log('[GameEngine] 🚀 开始加载主题...')
    await this.loadTheme(themeId)
    console.log('[GameEngine] ✅ 主题加载完成，准备启动 Phaser')

    // ⭐ 初始化 Phaser 游戏实例
    this.game = new Phaser.Game(this.config)
  }
  
  /**
   * 👉 获取当前 cellSize
   */
  getCellSize(): number {
    return this.Adapt.cellSize
  }
  
  /**
   * 👉 获取 GTRS 主题对象
   */
  getGTRS(): GTRSTheme {
    return assertGTRS()
  }
  
  /**
   * 👉 设置资源加载进度回调
   */
  setProgressCallback(callback: (progress: number) => void): void {
    this.onProgress = callback
  }
  
  // ============================================================================
  // 🔧【Protected 方法 - 子类可重写】
  // ============================================================================
  
  /**
   * ⭐ 加载主题
   */
  protected async loadTheme(themeId: string): Promise<void> {
    await this.gtrsLoader.loadTheme(themeId)
    // TODO: 实现主题加载逻辑
  }
  
  /**
   * ⭐ 预加载资源
   */
  protected preload(scene: Phaser.Scene): void {
    // TODO: 实现资源加载
  }
  
  /**
   * ⭐ 创建场景
   */
  protected create(scene: Phaser.Scene): void {
    // TODO: 实现场景创建
  }
  
  /**
   * ⭐ 游戏循环
   */
  protected update(time: number, delta: number): void {
    // TODO: 实现游戏逻辑
  }
  
  // ============================================================================
  // 🔧【Private 方法】
  // ============================================================================
  
  /**
   * 初始化 Phaser 配置
   */
  private initPhaserConfig(): void {
    const self = this
    
    this.config = {
      type: Phaser.AUTO,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
      },
      parent: this.containerElement!,
      backgroundColor: '#1a1a2e',
      scene: {
        preload() {
          self.preload.call(self, this)
        },
        create() {
          self.create.call(self, this)
        },
        update(time: number, delta: number) {
          self.update.call(self, time, delta)
        }
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      }
    }
  }
}
```

---

### Step 3: 创建统一导出文件

创建 `src/index.ts`:

```typescript
/**
 * 🎮 Kids Game Framework
 * 
 * 儿童游戏开发通用框架
 * 基于 Phaser 3 + Vue 3 + Pinia
 */

// ============================================================================
// 🎯 核心引擎
// ============================================================================
export { GameEngine } from './core/GameEngine'
export type { GameEngineConfig } from './core/GameEngine'

// ============================================================================
// 📦 可复用组件
// ============================================================================
export { GTRSLoader } from './components/GTRSLoader'
export { ScreenAdapter } from './components/ScreenAdapter'
export { AudioManager } from './components/AudioManager'
export { ItemSystem } from './components/ItemSystem'
export { ItemManager } from './components/ItemManager'

// ============================================================================
// 📊 Store
// ============================================================================
export { useGameStore } from './stores/game.store'
export { useThemeStore } from './stores/theme.store'

// ============================================================================
// 📝 类型定义
// ============================================================================
export * from './types/game.types'
export * from './types/gtrs.types'
export * from './types/item.types'

// ============================================================================
// 🛠️ 工具函数
// ============================================================================
export { validateGTRSTheme } from './utils/gtrs-validator'
export type { GTRSTheme, GTRSValidationResult } from './utils/gtrs-validator'
export * from './utils/color-utils'
export * from './utils/math-utils'

// ============================================================================
// ⚙️ 配置
// ============================================================================
export * from './config/game.config'
export * from './config/default.config'
```

---

### Step 4: 更新 package.json

```json
{
  "name": "@kids-game/framework",
  "version": "1.0.0",
  "description": "儿童游戏通用框架 - 提供核心游戏功能和平台集成",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./core": {
      "import": "./dist/core/index.js",
      "types": "./dist/core/index.d.ts"
    },
    "./components": {
      "import": "./dist/components/index.js",
      "types": "./dist/components/index.d.ts"
    },
    "./stores": {
      "import": "./dist/stores/index.js",
      "types": "./dist/stores/index.d.ts"
    },
    "./types": {
      "import": "./dist/types/index.js",
      "types": "./dist/types/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils/index.js",
      "types": "./dist/utils/index.d.ts"
    }
  },
  "peerDependencies": {
    "axios": "^1.13.6",
    "pinia": "^2.1.0",
    "vue": "^3.4.0",
    "phaser": "^3.70.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vue-tsc": "^1.8.0",
    "@types/phaser": "^3.60.0"
  },
  "scripts": {
    "build": "tsc && vue-tsc --noEmit",
    "type-check": "vue-tsc --noEmit",
    "dev": "tsc --watch"
  }
}
```

---

## 📋 检查清单

### 文件抽取 ✅
- [ ] 复制 GTRSLoader.ts 到 `components/`
- [ ] 复制 ScreenAdapter.ts 到 `components/`
- [ ] 复制 AudioManager.ts 到 `components/`
- [ ] 复制 ItemSystem.ts 到 `components/`
- [ ] 复制 ItemManager.ts 到 `components/`
- [ ] 提取 GameEngine.ts 到 `core/`
- [ ] 复制 gtrs-validator.ts 到 `utils/`
- [ ] 复制类型定义到 `types/`

### 代码调整 ✅
- [ ] 修改 import 路径（使用相对路径）
- [ ] 移除游戏特定代码（renderSnake 等）
- [ ] 添加完整的 TypeScript 类型
- [ ] 添加 JSDoc 注释
- [ ] 统一命名规范

### 构建配置 ✅
- [ ] 创建 tsconfig.json
- [ ] 配置 rollup/vite 打包
- [ ] 设置 peerDependencies
- [ ] 配置 exports 字段

### 文档 ✅
- [ ] 创建 README.md
- [ ] 编写使用示例
- [ ] API 文档
- [ ] 迁移指南

---

## 🎯 使用示例

### 在贪吃蛇游戏中使用框架

```typescript
// games/snake/src/components/game/SnakeGame.vue

<script setup lang="ts">
import { GameEngine, GTRSLoader, ScreenAdapter } from '@kids-game/framework'

// 创建游戏引擎实例
const game = new GameEngine(
  gameContainer.value!,
  () => {
    console.log('游戏完成!')
  },
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

// 访问框架组件
const gtrs = game.getGTRS()
const cellSize = game.getCellSize()
</script>
```

---

## 💡 下一步

1. ✅ 完成文件抽取
2. ✅ 安装依赖并测试
3. ✅ 在贪吃蛇项目中试用新框架
4. ✅ 修复发现的问题
5. ✅ 完善文档

是否需要我帮你执行具体的抽取操作？
