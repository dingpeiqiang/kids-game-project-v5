# ⚠️ 已废弃 (Deprecated)

> **此 Skill 已废弃，请勿使用。**
>
> 游戏开发指南已内嵌到游戏模板本身。
> AI 开发新游戏时，请直接阅读模板目录下的：
>
> ```
> kids-game-house/games/{gameId}/AI_INSTRUCTIONS.md
> ```
>
> 该文件是 AI 开发游戏的唯一入口，包含完整的约束规则和接口规范。

---

# game-dev - 儿童游戏开发指南（已废弃）

## 核心理念

**零耦合 + 模板驱动 + 一键初始化**

- **游戏完全独立**：从模板复制后，新游戏不依赖任何框架运行时
- **模板驱动**：从 `game-template` 初始化，所有可复用代码开箱即用
- **snake 作为参考**：理解实现方式，但不复制代码

---

## ⚡ 快速开始

### 方式一：一键脚本（推荐）

```powershell
# Windows PowerShell
.\kids-game-frame-factory\scripts\init-game.ps1 -GameId my-puzzle -GameName 拼图游戏

# macOS/Linux
bash kids-game-frame-factory/scripts/init-game.sh my-puzzle 拼图游戏
```

脚本自动完成：复制模板 → 替换占位符 → npm install

### 方式二：手动复制

```bash
cp -r kids-game-frame-factory/templates/game-template kids-game-house/games/my-game
cd kids-game-house/games/my-game
# 手动替换 __GAME_ID__ 和 __GAME_NAME__ 占位符
npm install
```

---

## 架构设计

```
kids-game-frame-factory/
├── scripts/             # 一键初始化脚本（init-game.ps1 / init-game.sh）
├── templates/
│   └── game-template/  # ⭐ 游戏项目完整模板（复制后独立运行）
└── docs/               # 开发文档

kids-game-house/games/
├── snake/              # ✅ 最佳实践参考（只读，不复制）
├── tank-battle/        # ✅ 多人对战参考
└── my-new-game/        # ← 你的新游戏（从模板初始化）
```

---

## 游戏模板结构（v5.0 - 完整功能版）

模板已完整复刻贪吃蛇游戏的全部流程，开箱即用：

| 功能 | 说明 |
|------|------|
| **Vue Router** | 4 条路由（首页/难度/游戏/结束）+ 全局守卫 |
| **资源检测** | 4 步检测（登录→音频→GTRS→引擎），带 loading 遮罩 |
| **关卡系统** | 20 关内置，score 触发升级，LevelTransitionOverlay 动画 |
| **WebAudio BGM** | 无需外部音频文件，纯代码合成 7 种音效 + Mario 旋律 |
| **响应式 UI** | `useResponsiveUI()` / `uiScaleRef`，720×1280 基准自动缩放 |
| **暂停/恢复** | 全屏遮罩 + BGM 暂停 |
| **难度设置** | 主题选择 + 三档难度 + 高级折叠设置（速度/分数） |
| **成绩持久化** | localStorage + 平台成绩上报 |

```
game-template/src/
├── router/
│   └── index.ts               # ⭐ Vue Router 路由配置（含登录守卫）
├── App.vue                    # router-view + fade 过渡 + resize 监听
├── main.ts                    # 入口（Vue3 + Pinia + Vue Router）
│
├── config/
│   ├── GTRS.json             # ⭐ 主题资源配置（需修改）
│   ├── difficulty.json       # ⭐ 难度配置（需修改）
│   ├── game-config.json      # ⭐ 游戏参数（需修改）
│   └── game.config.ts        # 游戏 ID、名称、API 地址常量
│
├── scenes/
│   └── GameScene.ts          # ⭐ 游戏场景（需重写 gameLoop 等方法）
│
├── views/                    # ✅ 可直接复用
│   ├── StartView.vue         # 开始界面
│   ├── DifficultyView.vue    # 难度选择
│   ├── GameView.vue          # 游戏界面（含 HUD/暂停弹窗）
│   └── GameOverView.vue      # 结束界面
│
├── components/
│   ├── game/PhaserGame.vue   # ✅ Phaser 容器（管理生命周期+事件转发）
│   └── ui/                   # ✅ 可复用 UI 组件
│       ├── GameButton.vue
│       ├── ScorePanel.vue
│       ├── DifficultySelector.vue
│       ├── PauseButton.vue
│       ├── SoundToggle.vue          # 音效开关（HUD 内嵌 / 独立使用）
│       ├── LevelTransitionOverlay.vue # 关卡升级动画遮罩
│       └── ThemeSelector.vue        # 主题选择面板
│
├── utils/
│   ├── uiResponsive.ts       # ⭐ 响应式 UI 缩放（720×1280 基准，全局单例）
│   └── gtrs-validator.ts     # GTRS 校验工具（内联版，无外部依赖）
│
├── types/
│   └── level.ts              # ⭐ 关卡系统（LevelConfig, 20关参数表）
│
├── composables/
│   └── useResponsiveUI.ts    # 转发到 utils 版本（向后兼容）
│
└── stores/                   # ✅ 状态管理（Pinia Composition API）
    ├── game.ts               # ⭐ 游戏状态（生命周期+关卡系统+事件）
    ├── audio.ts              # ⭐ WebAudio 音效（无需外部文件）
    ├── theme.ts              # 主题/GTRS 管理
    └── settings.ts           # 用户设置（难度/静音/震动）
```

---

## 实现游戏逻辑

编辑 `src/scenes/GameScene.ts`，GameScene 继承自 `Phaser.Scene`：

```typescript
import Phaser from 'phaser'
import { useThemeStore } from '@/stores/theme'
import GameScene from './GameScene'  // 继承模板基类

export default class MyGameScene extends GameScene {
  // 1. 加载资源
  preload(): void {
    const themeStore = useThemeStore()
    const img = themeStore.getImageUrl('player')
    if (img) this.load.image('player', img)
  }

  // 2. 创建游戏对象（必须调用 super.create()）
  create(): void {
    super.create()          // ⚠️ 初始化屏幕适配 + ESC 监听
    this.createObjects()    // 创建游戏特定对象
  }

  // 3. 游戏主循环（每帧调用，已排除暂停/结束状态）
  protected gameLoop(time: number, delta: number): void {
    this.updateLogic(delta)
    this.checkCollisions()
  }

  // 4. 游戏结束
  protected handleGameOver(): void {
    super.handleGameOver()  // 触发 'gameover' 事件 → PhaserGame.vue → App.vue
  }

  private createObjects(): void {
    // 使用基类提供的适配参数：
    // this.cellSize, this.offsetX, this.offsetY, this.gridCols, this.gridRows
    // this.gridToPixelCenter(col, row) → { x, y }
    // this.addScore(10)  → 加分（自动应用难度倍率）
  }
}
```

---

## Vue ↔ Phaser 通信

| 方向 | 事件/方法 | 说明 |
|------|---------|------|
| Scene → Vue | `this.game.events.emit('ready')` | 游戏就绪 |
| Scene → Vue | `this.game.events.emit('score', score)` | 分数变化 |
| Scene → Vue | `this.game.events.emit('gameover', score)` | 游戏结束 |
| Scene → Vue | `this.game.events.emit('paused')` | 暂停 |
| Vue → Scene | `phaserGame.scene.getScene('GameScene')` | 获取场景实例 |
| Vue → Scene | `scene.pauseGame()` / `scene.resumeGame()` | 暂停/恢复 |

---

## 屏幕适配（4 层必须完整）

1. **index.html**: `<meta viewport-fit=cover>`
2. **App.vue**: `.game-app { width: 100vw; height: 100vh; overflow: hidden }`
3. **GameView.vue**: 铺满父容器
4. **Phaser**: `Scale.RESIZE` 模式

---

## 技术规范

- **Phaser 导入**：`import Phaser from 'phaser'`（不用 `declare const Phaser`）
- **IDE 沙箱**：禁止 `confirm()`/`alert()`，用 `ElMessageBox`/`ElMessage`
- **音频格式**：统一 `.mp3`
- **类型检查**：`npx tsc --noEmit`
- **GTRS 路径**：不含 `/public/` 前缀，以 `/` 开头

---

## 参考文档

| 文档 | 路径 |
|------|------|
| 完整开发指南 | `kids-game-frame-factory/docs/GAME_DEV_GUIDE.md` |
| GTRS 资源规范 | `kids-game-frame-factory/docs/GTRS_GUIDE.md` |
| 开发检查清单 | `kids-game-frame-factory/docs/CHECKLIST.md` |
| 框架 README | `kids-game-frame-factory/README.md` |
| 贪吃蛇参考 | `kids-game-house/games/snake/src/scenes/ComponentGameScene.ts` |
