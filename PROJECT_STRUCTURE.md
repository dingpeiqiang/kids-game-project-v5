# 📁 贪吃蛇游戏 - 完整目录结构

**版本**: v1.3.0-dev  
**最后更新**: 2026-04-02  
**状态**: ✅ Phase 3 完成

---

## 🎯 项目根目录

```
kids-game-house/games/snake/
├── src/                          # 源代码目录
├── config/                       # 配置文件目录
├── public/                       # 公共资源目录
├── docs/                         # 项目文档目录
├── examples/                     # 示例代码目录
├── tests/                        # 测试文件目录
├── .idea/                        # IDE 配置（JetBrains）
├── .lingma/                      # Lingma AI 配置
├── .gitignore                    # Git 忽略规则
├── index.html                    # HTML 入口文件
├── package.json                  # npm 包配置
├── package-lock.json             # npm 依赖锁定
├── tsconfig.json                 # TypeScript 主配置
├── tsconfig.node.json            # TypeScript Node 配置
├── vite.config.ts                # Vite 构建配置
├── tailwind.config.js            # Tailwind CSS 配置
├── postcss.config.js             # PostCSS 配置
├── generate-resources.mjs        # 资源生成脚本
├── register-game.sql             # 数据库注册脚本
├── demo-level-system.html        # 关卡系统演示页面
├── FINAL_IMPLEMENTATION_SUMMARY.md   # 最终实现总结
└── RUNNING_GUIDE.md              # 运行指南
```

---

## 📂 src/ - 源代码目录

```
src/
├── scenes/                       # Phaser 场景目录
│   ├── SnakeGameLogic.ts         # 🐍 游戏核心逻辑（526 行）
│   ├── LevelComponentGameScene.ts # 关卡组件集成场景
│   └── BootScene.ts              # 启动场景
│
├── components/                   # UI 和逻辑组件目录
│   ├── ui/                       # UI 组件子目录
│   │   ├── LevelProgressBar.vue  # ⭐ 加载进度条（244 行）
│   │   ├── ObjectiveList.vue     # ⭐ 目标列表（285 行）
│   │   └── GameHUD.vue           # 游戏 HUD 组件
│   │
│   ├── logic/                    # 逻辑组件子目录
│   │   ├── FoodSpawnerComponent.ts    # 🍎 食物生成组件
│   │   ├── SnakeMovementComponent.ts  # 🐍 蛇移动组件
│   │   └── CollisionDetectionComponent.ts # 💥 碰撞检测组件
│   │
│   └── game/                     # 游戏组件子目录
│       └── SnakeGame.vue         # 游戏主组件
│
├── types/                        # TypeScript 类型定义目录
│   ├── FoodTypes.ts              # 🍎 食物类型系统（326 行）
│   ├── GameStateTypes.ts         # 游戏状态类型
│   └── ObjectiveTypes.ts         # 关卡目标类型
│
├── core/                         # 核心框架目录
│   ├── EventBus.ts               # 事件总线单例
│   ├── ComponentBase.ts          # 组件基类
│   └── GridMovementComponent.ts  # 网格移动基础组件
│
├── utils/                        # 工具函数目录
│   ├── logger.ts                 # 日志工具
│   ├── helpers.ts                # 辅助函数
│   └── constants.ts              # 常量定义
│
├── assets/                       # 资源目录
│   ├── images/                   # 图片资源
│   ├── sounds/                   # 音效资源
│   └── data/                     # 数据资源
│
├── styles/                       # 样式目录
│   ├── main.scss                 # 主样式文件
│   ├── variables.scss            # 样式变量
│   └── mixins.scss               # 样式混合
│
├── App.vue                       # Vue 根组件
├── main.ts                       # TypeScript 入口文件
├── global.d.ts                   # 全局类型声明
└── vite-env.d.ts                 # Vite 环境声明
```

---

## 📂 config/ - 配置文件目录

```
config/
├── levels/                       # 关卡配置目录
│   ├── snake_level_1.json        # 第 1 关配置
│   ├── snake_level_2.json        # 第 2 关配置
│   └── snake_level_3.json        # 第 3 关配置
│
└── game/                         # 游戏配置目录
    └── game-config.json          # 游戏全局配置
```

### 关卡配置文件示例

```json
// config/levels/snake_level_1.json
{
  "levelId": 1,
  "levelName": "入门关卡",
  "gridConfig": {
    "rows": 20,
    "cols": 20,
    "cellSize": 20
  },
  "snakeConfig": {
    "initialLength": 3,
    "moveInterval": 400,
    "startPosition": { "x": 10, "y": 10 }
  },
  "objectives": [
    {
      "id": "score_goal",
      "type": "score",
      "title": "获得分数",
      "description": "达到 100 分",
      "target": 100
    }
  ],
  "foodSpawnConfig": {
    "maxFoods": 1,
    "avoidRadius": 3
  }
}
```

---

## 📂 docs/ - 项目文档目录

```
docs/
├── GCRS_SPEC.md                  # GCRS 规范文档
├── ARCHITECTURE.md               # 架构设计文档
├── COMPONENT_GUIDE.md            # 组件开发指南
├── EVENT_SYSTEM.md               # 事件系统文档
├── FOOD_SYSTEM.md                # 食物系统文档
├── UI_COMPONENTS.md              # UI 组件文档
├── LEVEL_DESIGN.md               # 关卡设计文档
├── PERFORMANCE.md                # 性能优化文档
├── TESTING_GUIDE.md              # 测试指南
└── DEPLOYMENT.md                 # 部署指南
```

---

## 📂 examples/ - 示例代码目录

```
examples/
├── basic-snake-game.ts           # 基础贪吃蛇示例
├── custom-level.ts               # 自定义关卡示例
├── event-handling.ts             # 事件处理示例
├── custom-objectives.ts          # 自定义目标示例
├── food-effects.ts               # 食物效果示例
├── ui-integration.ts             # UI 集成示例
└── complete-game.ts              # 完整游戏示例
```

### 示例代码：基础贪吃蛇

```typescript
// examples/basic-snake-game.ts
import { SnakeGameLogic } from '../src/scenes/SnakeGameLogic'
import { EventBus } from '../src/core/EventBus'

// 创建游戏实例
const scene = new Phaser.Scene('SnakeGame')
const gameLogic = new SnakeGameLogic(scene)

// 监听事件
const eventBus = EventBus.getInstance()
eventBus.on(GameEventType.SCORE_CHANGED, (event) => {
  console.log('新分数:', event.payload.score)
})

// 启动游戏
gameLogic.startGame()
```

---

## 📂 tests/ - 测试文件目录

```
tests/
├── unit/                         # 单元测试目录
│   ├── SnakeGameLogic.test.ts    # 游戏逻辑测试
│   ├── FoodTypes.test.ts         # 食物类型测试
│   ├── FoodSpawnerComponent.test.ts
│   └── EventBus.test.ts          # 事件总线测试
│
├── integration/                  # 集成测试目录
│   ├── UI-Game-Integration.test.ts
│   ├── Event-System.test.ts
│   └── Level-Loading.test.ts
│
└── e2e/                          # 端到端测试目录
    ├── game-flow.spec.ts         # 游戏流程测试
    └── level-completion.spec.ts  # 关卡完成测试
```

### 单元测试示例

```typescript
// tests/unit/FoodTypes.test.ts
import { createFood, FoodType } from '../../src/types/FoodTypes'

describe('FoodTypes', () => {
  it('should create normal food with correct score', () => {
    const food = createFood({ x: 5, y: 5 }, FoodType.NORMAL)
    expect(food.score).toBe(10)
    expect(food.type).toBe('normal')
  })

  it('should create bonus food with correct score', () => {
    const food = createFood({ x: 5, y: 5 }, FoodType.BONUS)
    expect(food.score).toBe(50)
    expect(food.type).toBe('bonus')
  })
})
```

---

## 🔧 核心文件详解

### 1. SnakeGameLogic.ts (526 行)

**位置**: `src/scenes/SnakeGameLogic.ts`  
**作用**: 游戏核心逻辑控制器

**主要功能**:
```typescript
export class SnakeGameLogic {
  // 网格系统
  private grid: Grid
  
  // 蛇系统
  private snake: SnakeSegment[]
  private currentDirection: Direction
  
  // 食物系统
  private foodSpawner: FoodSpawnerComponent
  
  // 碰撞检测
  private collisionDetector: CollisionDetectionComponent
  
  // 游戏状态
  private gameState: GameState
  
  // 核心方法
  startGame(): void
  update(delta: number): void
  spawnFood(): void
  checkCollisions(): void
  gameOver(): void
}
```

---

### 2. FoodTypes.ts (326 行)

**位置**: `src/types/FoodTypes.ts`  
**作用**: 食物类型系统定义

**核心内容**:
```typescript
// 食物类型枚举
enum FoodType {
  NORMAL = 'normal',
  BONUS = 'bonus',
  SPECIAL = 'special',
  SPEED_UP = 'speed_up',
  SLOW_DOWN = 'slow_down',
  INVINCIBLE = 'invincible'
}

// 食物配置接口
interface FoodConfig {
  type: FoodType
  baseScore: number
  color: string
  spawnProbability: number
  growsSnake: boolean
  effect?: FoodEffect
}

// 配置数据库
const FOOD_DATABASE: Record<FoodType, FoodConfig> = { ... }

// 工厂函数
export function createFood(position: Position, type?: FoodType): Food
```

---

### 3. LevelProgressBar.vue (244 行)

**位置**: `src/components/ui/LevelProgressBar.vue`  
**作用**: 加载进度条 UI 组件

**主要特性**:
```vue
<template>
  <div class="progress-container">
    <div class="progress-bar-bg">
      <div class="progress-bar-fill" :style="{ width: progress + '%' }">
        <div class="progress-gradient"></div>
        <div class="progress-breath"></div>
      </div>
      <div class="progress-text">{{ Math.round(progress) }}%</div>
    </div>
    <div class="loading-hint">{{ loadingText }}</div>
  </div>
</template>

<script lang="ts">
export default defineComponent({
  props: {
    progress: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
    loadingText: { type: String, default: '正在加载...' },
    autoHideDelay: { type: Number, default: 500 }
  },
  emits: ['update:visible', 'complete']
})
</script>
```

---

### 4. EventBus.ts

**位置**: `src/core/EventBus.ts`  
**作用**: 全局事件总线单例

**实现**:
```typescript
export class EventBus {
  private static instance: EventBus
  private emitter: EventEmitter
  
  private constructor() {
    this.emitter = new EventEmitter()
  }
  
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }
  
  emit(event: GameEvent): void {
    this.emitter.emit(event.type, event)
  }
  
  on(type: GameEventType, callback: (event: GameEvent) => void): void {
    this.emitter.on(type, callback)
  }
}
```

---

## 📊 文件大小统计

| 类别 | 文件数 | 总大小 | 平均大小 |
|------|--------|--------|----------|
| TypeScript (.ts) | 15 | ~25 KB | ~1.7 KB |
| Vue (.vue) | 8 | ~18 KB | ~2.3 KB |
| JSON (.json) | 10 | ~5 KB | ~0.5 KB |
| JavaScript (.js/.mjs) | 5 | ~20 KB | ~4 KB |
| Markdown (.md) | 25 | ~150 KB | ~6 KB |
| HTML (.html) | 2 | ~20 KB | ~10 KB |
| **总计** | **65** | **~238 KB** | **~3.7 KB** |

---

## 🎯 代码行数统计

| 目录 | 文件数 | 代码行数 | 说明 |
|------|--------|----------|------|
| src/scenes/ | 3 | ~600 行 | 游戏场景 |
| src/components/ui/ | 3 | ~550 行 | UI 组件 |
| src/components/logic/ | 3 | ~100 行 | 逻辑组件 |
| src/types/ | 3 | ~400 行 | 类型定义 |
| src/core/ | 3 | ~200 行 | 核心框架 |
| src/utils/ | 3 | ~100 行 | 工具函数 |
| docs/ | 25 | ~12000 行 | 项目文档 |
| examples/ | 7 | ~500 行 | 示例代码 |
| tests/ | 10 | ~800 行 | 测试代码 |
| **总计** | **60** | **~15250 行** | **完整项目** |

---

## 🚀 快速导航

### 想了解游戏逻辑？
👉 查看 [`src/scenes/SnakeGameLogic.ts`](./src/scenes/SnakeGameLogic.ts)

### 想了解食物系统？
👉 查看 [`src/types/FoodTypes.ts`](./src/types/FoodTypes.ts)

### 想了解 UI 组件？
👉 查看 [`src/components/ui/`](./src/components/ui/)

### 想了解核心框架？
👉 查看 [`src/core/`](./src/core/)

### 想了解关卡配置？
👉 查看 [`config/levels/`](./config/levels/)

### 想了解示例代码？
👉 查看 [`examples/`](./examples/)

### 想了解测试用例？
👉 查看 [`tests/`](./tests/)

### 想了解项目文档？
👉 查看 [`docs/`](./docs/)

---

## 📞 相关文档

- 📚 **[DOCUMENT_INDEX.md](../../DOCUMENT_INDEX.md)** - 完整文档索引
- 🚀 **[QUICK_START.md](../../QUICK_START.md)** - 快速启动指南
- 📊 **[FINAL_SUMMARY_REPORT.md](../../FINAL_SUMMARY_REPORT.md)** - 最终总结报告
- 🎨 **[POSTER_CONTENT.md](../../POSTER_CONTENT.md)** - 项目成果海报
- 🏆 **[MILESTONES.md](../../MILESTONES.md)** - 项目里程碑

---

**最后更新**: 2026-04-02  
**维护者**: GCRS 开发团队  
**版本**: v1.3.0-dev  
**状态**: ✅ Phase 3 完成，准备进入 Phase 4
