# kids-game-frame-factory

## 🎮 儿童游戏开发框架

**核心理念**：零耦合 + 模板驱动 + 最佳实践验证

```
frame-factory 是游戏开发的「一站式」解决方案
所有工具、模板、文档都统一在这里
```

---

## 📁 目录结构

```
kids-game-frame-factory/
├── docs/                           # 📚 开发文档
│   ├── GAME_DEV_GUIDE.md          # 游戏开发完整指南
│   ├── GTRS_GUIDE.md              # GTRS 资源配置规范
│   └── CHECKLIST.md               # 开发检查清单
│
├── templates/                       # 📋 配置模板
│   ├── game-template/             # ⭐ 游戏项目模板
│   ├── GTRS.template.json         # GTRS 配置模板
│   ├── difficulty.template.json   # 难度配置模板
│   ├── i18n.template.json          # 国际化模板
│   ├── register-game.template.sql # 数据库注册模板
│   └── generate-resources.mjs     # 资源生成脚本
│
├── README.md                       # 本文档
└── package.json                    # 框架配置
```

---

## 🚀 快速开始

### 创建新游戏

```bash
# 1. 复制游戏模板
cp -r kids-game-frame-factory/templates/game-template games/my-game

# 2. 全局重命名（IDE 重构）
# - 目录名 my-game
# - package.json 中的 name
# - App.vue 组件名
# - src/config/game-config.json 中的 gameId

# 3. 配置游戏
# - src/config/GTRS.json      # 主题资源
# - src/config/difficulty.json # 难度配置

# 4. 实现游戏逻辑（重写 scenes/GameScene.ts）
# - 参考 kids-game-house/games/snake/

# 5. 注册游戏
# - 执行 register-game.sql
```

---

## 📚 开发文档

| 文档 | 说明 |
|------|------|
| [GAME_DEV_GUIDE.md](./docs/GAME_DEV_GUIDE.md) | 游戏开发完整指南 |
| [GTRS_GUIDE.md](./docs/GTRS_GUIDE.md) | GTRS 资源配置规范 |
| [CHECKLIST.md](./docs/CHECKLIST.md) | 开发检查清单 |

---

## 📋 配置模板

| 模板 | 用途 |
|------|------|
| `game-template/` | 游戏项目完整模板 |
| `GTRS.template.json` | 主题资源配置模板 |
| `difficulty.template.json` | 难度配置模板 |
| `i18n.template.json` | 国际化配置模板 |
| `register-game.template.sql` | 数据库注册 SQL 模板 |
| `generate-resources.mjs` | 资源自动生成脚本 |

---

## 🗂️ 模板内容

### game-template/src/

```
├── App.vue                    # 游戏主组件（需重命名）
├── main.ts                    # 入口文件
├── config/
│   ├── GTRS.json             # 主题资源配置（需修改）
│   ├── difficulty.json       # 难度配置（需修改）
│   └── game-config.json      # 游戏参数（需修改）
├── views/
│   ├── StartView.vue         # 开始界面 ✅ 可复用
│   ├── DifficultyView.vue    # 难度选择 ✅ 可复用
│   ├── GameView.vue          # 游戏界面 ✅ 可复用
│   └── GameOverView.vue      # 结束界面 ✅ 可复用
├── components/
│   ├── game/
│   │   └── PhaserGame.vue    # Phaser 容器 ✅ 可复用
│   └── ui/
│       ├── GameButton.vue    # 游戏按钮 ✅ 可复用
│       ├── ScorePanel.vue    # 分数面板 ✅ 可复用
│       ├── DifficultySelector.vue ✅ 可复用
│       └── PauseButton.vue   # 暂停按钮 ✅ 可复用
├── scenes/
│   └── GameScene.ts          # 游戏场景 ⚠️ 需重写
└── stores/
    ├── game.ts              # 游戏状态 ✅ 可复用
    ├── audio.ts             # 音频管理 ✅ 可复用
    ├── theme.ts             # 主题管理 ✅ 可复用
    └── settings.ts          # 设置管理 ✅ 可复用
```

---

## 🎯 与其他项目的关系

| 项目 | 作用 |
|------|------|
| `kids-game-house/games/snake/` | **最佳实践**：成熟完整的游戏实现，用于参考 |
| `kids-game-house/games/tank-battle/` | **最佳实践**：多人对战实现，用于参考 |
| `.workbuddy/skills/game-dev/` | **Skill**：游戏开发指南（在 IDE 中使用 `/game-dev`）|

**重要原则**：
- ❌ 不要从 snake 复制代码创建新游戏（会导致残留）
- ✅ 从 `game-template/` 初始化新游戏

---

## ⚙️ 屏幕适配

4 层配合确保全屏适配：

1. **index.html**: `viewport-fit=cover` + `env(safe-area-inset-*)`
2. **App.vue**: `100vw × 100vh` + `overflow: hidden`
3. **GameView.vue**: `h-screen w-full overflow-hidden`
4. **Phaser config**: `mode: RESIZE` + `width: '100%', height: '100%'`

---

## 📖 详细指南

### GTRS 资源配置

详见 [GTRS_GUIDE.md](./docs/GTRS_GUIDE.md)

```json
{
  "specMeta": { "gameId": "my-game" },
  "themeInfo": { "name": "游戏主题" },
  "globalStyle": { "backgroundColor": "#1a1a2e" },
  "resources": {
    "images": { "scene": {} },
    "audio": { "bgm": {}, "effect": {} }
  }
}
```

### 游戏场景模板

详见 [GAME_DEV_GUIDE.md](./docs/GAME_DEV_GUIDE.md)

```typescript
export class GameScene extends Phaser.Scene {
  create(): void {
    this.createGameObjects();
    this.setupInput();
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;
    this.updateGame(time, delta);
  }

  // ⚠️ 需要重写
  protected createGameObjects(): void { /* ... */ }
  protected updateGame(time: number, delta: number): void { /* ... */ }
}
```

---

## 🔧 开发工具

### 资源生成脚本

```bash
# 生成资源配置文件
node templates/generate-resources.mjs --game my-game --output ./output
```

### 类型检查

```bash
cd games/my-game
npx tsc --noEmit
```

---

## 📝 技术规范

- **IDE 沙箱**：禁止原生 `confirm()`/`alert()`，用 ElMessageBox/ElMessage
- **音频格式**：统一 `.mp3`
- **类型检查**：用 `npx tsc --noEmit`
- **UI 缩放**：用 `useResponsiveUI()` 工具函数（设计基准 720×1280）
