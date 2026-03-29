# game-dev - 儿童游戏开发指南

## 核心理念

**纯净框架 + 模板驱动 + snake作为最佳实践验证**

- **框架本身是纯净的**：不包含任何游戏特定逻辑
- **模板用于初始化新游戏**：避免复制snake导致的残留问题
- **snake作为最佳实践**：用于验证框架可行性，但不可直接复制

## 快速开始

### 创建新游戏（推荐方式）

```bash
# 1. 从模板初始化
cp -r kids-game-frame-factory/templates/game-template games/my-game

# 2. 全局重命名（用 IDE 重构功能）
# - 目录名: my-game
# - package.json name
# - App.vue 中的组件名

# 3. 配置游戏
# - 编辑 config/GTRS.json（资源配置）
# - 编辑 config/difficulty.json（难度配置）
# - 编辑 config/game-config.json（游戏参数）

# 4. 实现游戏逻辑
# - 编辑 scenes/GameScene.ts 中的 gameLoop() 方法
# - 参考 kids-game-house/games/snake/ 的实现方式

# 5. 注册游戏
# - 编辑 register-game.sql，然后执行
```

### 不再复制snake

**⚠️ 重要变化**：不再使用 `cp -r kids-game-house/games/snake` 的方式创建新游戏！

原因：
1. 复制snake会导致snake特定的逻辑残留
2. 需要大量重命名工作，容易出错
3. 新游戏会继承snake的"味道"，不纯净

新方式：
- 从 `game-template` 模板初始化
- 游戏逻辑从零开始编写（或参考snake）
- 保证新游戏代码纯净

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│  【框架层】纯净的、通用的、可直接复用                          │
│                                                             │
│  kids-game-frame-factory/src/                               │
│  ├── engine/          游戏引擎基类（Phaser封装）              │
│  ├── types/          通用类型定义                            │
│  └── utils/          工具函数（GTRS/UI响应式/音频）          │
├─────────────────────────────────────────────────────────────┤
│  【模板层】用于初始化新游戏                                   │
│                                                             │
│  kids-game-frame-factory/templates/game-template/            │
│  ├── src/                                                 │
│  │   ├── config/      配置模板（GTRS/difficulty/game）       │
│  │   ├── views/       页面模板（Start/Difficulty/GameOver）  │
│  │   ├── components/  UI组件和游戏组件模板                    │
│  │   ├── scenes/      游戏场景模板（需重写gameLoop）         │
│  │   └── stores/      状态管理模板                            │
│  └── register-game.sql                                      │
├─────────────────────────────────────────────────────────────┤
│  【最佳实践】验证框架可行性                                   │
│                                                             │
│  kids-game-house/games/snake/                               │
│  ├── 完整实现，不用于复制                                     │
│  └── 作用：验证框架 + 指导新游戏开发                          │
└─────────────────────────────────────────────────────────────┘
```

## 项目结构

```
game-template/src/
├── App.vue              # 游戏主应用（需重命名）
├── main.ts             # 入口文件
├── config/
│   ├── GTRS.json       # GTRS资源配置（需修改）
│   ├── difficulty.json # 难度配置（需修改）
│   └── game-config.json# 游戏参数（需修改）
├── views/              # 页面视图
│   ├── StartView.vue   # 开始界面 ✅ 可复用
│   ├── DifficultyView.vue  # 难度选择 ✅ 可复用
│   ├── GameView.vue    # 游戏界面 ✅ 可复用
│   └── GameOverView.vue   # 结束界面 ✅ 可复用
├── components/
│   ├── game/
│   │   └── PhaserGame.vue  # 游戏容器 ✅ 可复用
│   └── ui/             # UI组件
│       ├── GameButton.vue     ✅ 可复用
│       ├── ScorePanel.vue     ✅ 可复用
│       ├── DifficultySelector.vue  ✅ 可复用
│       └── PauseButton.vue    ✅ 可复用
├── scenes/
│   └── GameScene.ts    # 游戏场景 ⚠️ 需重写逻辑
└── stores/             # 状态管理 ✅ 可复用
    ├── game.ts
    ├── audio.ts
    ├── settings.ts
    └── theme.ts
```

## 配置说明

### 1. GTRS.json - 主题资源配置

定义游戏使用的图片、音频资源。

```json
{
  "specMeta": {
    "schemaVersion": "1.0.0",
    "gameId": "my-game",
    "gameType": "my-game"
  },
  "themeInfo": {
    "themeId": "my-game_default",
    "themeName": "我的游戏"
  },
  "resources": {
    "images": {
      "scene": {
        "player": { "src": "" }
      }
    },
    "audio": {
      "bgm": { "bgm_main": { "src": "" } },
      "effect": { "effect_hit": { "src": "" } }
    }
  }
}
```

### 2. difficulty.json - 难度配置

定义不同难度级别的游戏参数。

```json
{
  "difficulties": [
    { "id": "easy", "label": "简单", "gridCols": 20, "gridRows": 15, "speed": 200 },
    { "id": "normal", "label": "普通", "gridCols": 25, "gridRows": 18, "speed": 150 },
    { "id": "hard", "label": "困难", "gridCols": 32, "gridRows": 20, "speed": 100 }
  ]
}
```

### 3. game-config.json - 游戏特定配置

定义游戏网格大小、实体参数等。

```json
{
  "gameType": "my-game",
  "grid": { "cols": 32, "rows": 18, "baseCellSize": 50 },
  "entities": { "player": { "initialLives": 3, "speed": 120 } },
  "ui": { "showScore": true, "showPause": true }
}
```

## 实现游戏逻辑

### GameScene.ts 模板

```typescript
import Phaser from 'phaser'
import { useGameStore } from '@/stores/game'

export default class GameScene extends Phaser.Scene {
  private score: number = 0
  private isPaused: boolean = false
  private gameOver: boolean = false

  create(): void {
    this.initGame()
    this.game.events.emit('ready')
  }

  update(time: number, delta: number): void {
    if (this.isPaused || this.gameOver) return
    this.gameLoop(time, delta)
  }

  protected gameLoop(time: number, delta: number): void {
    // ⚠️ 需要重写游戏主循环
    // 参考: kids-game-house/games/snake/src/scenes/ComponentGameScene.ts
  }

  protected handleGameOver(): void {
    if (this.gameOver) return
    this.gameOver = true
    this.game.events.emit('gameover', this.score)
  }

  protected addScore(points: number): void {
    const gameStore = useGameStore()
    const multiplier = gameStore.currentDifficultyConfig.scoreMultiplier || 1
    this.score += Math.floor(points * multiplier)
  }
}
```

### 参考snake但不要复制

snake 游戏的作用：
1. ✅ 验证框架可行性
2. ✅ 理解如何实现游戏逻辑
3. ✅ 理解如何加载 GTRS 资源
4. ✅ 理解如何处理碰撞和计分

但不要：
1. ❌ 复制snake代码到新游戏
2. ❌ 基于snake修改后变成新游戏
3. ❌ 继承snake的类

## 与snake的关系

| 操作 | snake | frame-factory 模板 |
|------|-------|-------------------|
| 创建新游戏 | ❌ 复制 | ✅ 从模板初始化 |
| 实现游戏逻辑 | 参考 | 重写 |
| UI组件 | 可复用 | 可复用 |
| 状态管理 | 可复用 | 可复用 |
| GTRS配置 | 参考 | 复制修改 |

## 技术规范

- **IDE 沙箱**：禁止原生 `confirm()`/`alert()`，用 ElMessageBox/ElMessage
- **音频格式**：统一 `.mp3`
- **类型检查**：用 `npx tsc --noEmit`
- **组件导入**：游戏 UI 组件用 `@/components/ui/` 本地导入

## 参考文档

- 游戏开发完整指南：[docs/GAME_DEV_GUIDE.md](./docs/GAME_DEV_GUIDE.md)
- GTRS 资源规范：[docs/GTRS_GUIDE.md](./docs/GTRS_GUIDE.md)
- 贪吃蛇游戏源码：`kids-game-house/games/snake/`
- 框架源码：`kids-game-frame-factory/`
