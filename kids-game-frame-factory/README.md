# kids-game-frame-factory

## 🎮 儿童游戏开发框架

**核心理念**：零耦合 + 模板驱动 + 一键初始化

> 从模板复制的游戏完全独立，不依赖任何框架运行时。  
> **框架定位：给 AI 使用**——约束 AI 在框架规范下快速开发新游戏。

---

## 🤖 AI 开发者入口（必读）

**如果你是 AI，请按以下顺序阅读：**

| 步骤 | 文档 | 说明 |
|------|------|------|
| 1️⃣ 本文档 | `README.md` | 了解框架全貌（你正在读）|
| 2️⃣ 开发指南 | `templates/game-template/AI_INSTRUCTIONS.md` | ⭐ **完整开发指南，必须完整阅读** |
| 3️⃣ 设计模板 | `docs/GAME_DESIGN_TEMPLATE.md` | GDD 编写模板 |

> ⚠️ **不要从 `kids-game-house/games/snake/` 复制代码**——会留下贪吃蛇逻辑残留。  
> ✅ **正确做法**：使用 `init-game.ps1` 初始化，只重写 `MyGameScene.ts`。

---

## 📁 目录结构

```
kids-game-frame-factory/
│
├── scripts/                        # 🛠️ 初始化脚本
│   ├── init-game.ps1              # 一键初始化（Windows PowerShell）
│   └── init-game.sh               # 一键初始化（macOS/Linux）
│
├── templates/                      # 📋 模板文件
│   ├── game-template/             # ⭐ 游戏项目完整模板（核心）
│   │   ├── AI_INSTRUCTIONS.md     # AI 开发完整指南（必读）
│   │   ├── register-game.sql      # 数据库注册脚本模板
│   │   └── src/scenes/
│   │       ├── GameScene.ts       # 框架抽象基类（禁止修改）
│   │       └── MyGameScene.ts     # ⭐ AI 只需重写这一个文件
│   │
│   ├── GTRS.template.json         # GTRS 主题资源配置模板
│   ├── difficulty.template.json   # 难度参数配置模板
│   └── generate-resources.template.mjs  # 资源生成脚本模板
│
├── docs/                           # 📚 参考文档
│   ├── GAME_DESIGN_TEMPLATE.md    # GDD 游戏设计文档模板
│   ├── GTRS_GUIDE.md              # GTRS 资源配置规范
│   ├── CHECKLIST.md               # 开发验收检查清单
│   └── SQL_SCRIPT_WRITING_GUIDE.md # 数据库注册 SQL 规范
│
└── tools/                          # 🧰 工具集
    ├── gtrs-generator/            # GTRS + Sharp 资源生成器
    ├── audio-converter/           # WAV → MP3 批量转换工具
    └── theme-resource-generator/  # ❌ 已废弃（只生成灰色占位符）
```

---

## 🚀 快速开始（3 步）

### 第 1 步：初始化游戏项目

```powershell
# Windows PowerShell（在项目根目录执行）
.\kids-game-frame-factory\scripts\init-game.ps1 -GameId my-puzzle -GameName 拼图游戏

# macOS / Linux
bash kids-game-frame-factory/scripts/init-game.sh my-puzzle 拼图游戏
```

脚本自动完成：
1. 复制 `game-template/` 到 `kids-game-house/games/my-puzzle/`
2. 替换所有 `__GAME_CODE__` / `__GAME_NAME__` 占位符
3. 执行 `npm install` 安装依赖

### 第 2 步：阅读 AI_INSTRUCTIONS.md

```
kids-game-house/games/my-puzzle/AI_INSTRUCTIONS.md
```

这是完整的开发指南，包含：资源生成 → 配置文件 → 游戏逻辑 → 数据库注册。

### 第 3 步：启动开发服务器

```bash
cd kids-game-house/games/my-puzzle
npm run dev
# 访问 http://localhost:5173
```

---

## 🗂️ 框架开箱即用的功能

初始化后，以下功能**无需任何开发**：

| 功能 | 实现文件 |
|------|------|
| 游戏首页（游戏名/最高分/开始）| `StartView.vue` |
| 难度选择 + 主题皮肤切换 | `DifficultyView.vue` |
| 资源加载进度遮罩 | `GameView.vue` + `PhaserGame.vue` |
| 游戏 HUD（分数/关卡/暂停）| `GameView.vue` |
| 暂停弹窗 | `GameView.vue` |
| 20 关渐进式关卡系统 | `stores/game.ts` + `types/level.ts` |
| 关卡升级过渡动画 | `LevelTransitionOverlay.vue` |
| 游戏结束界面 | `GameOverView.vue` |
| WebAudio 合成音效（无需外部文件）| `stores/audio.ts` |
| 主题皮肤系统（GTRS）| `stores/theme.ts` |
| 响应式屏幕适配（720×1280 基准）| `utils/uiResponsive.ts` |

---

## 🔧 AI 开发新游戏只需做这些

| # | 文件 | 操作 |
|---|------|------|
| 1 | `GAME_DESIGN_DOCUMENT.md` | 编写游戏设计文档（GDD） |
| 2 | `generate-resources.mjs` | 用 Sharp 生成图片 + Node.js WAV 生成音频 |
| 3 | `src/config/GTRS.json` | 复制生成的 GTRS.json |
| 4 | `src/config/difficulty.json` | 调整难度参数 |
| 5 | `src/scenes/MyGameScene.ts` | ⭐ **重写游戏逻辑（唯一核心工作）** |
| 6 | `src/components/game/PhaserGame.vue` | 改一行：引用你的场景类 |
| 7 | `register-game-filled.sql` | 生成并执行 SQL 注册游戏 |

### 核心 API（MyGameScene.ts 可用）

```typescript
// ─── 必须实现的三个抽象方法 ──────────────────────────────
protected createGameObjects(): void     // 创建游戏对象
protected gameLoop(time, delta): void   // 游戏主循环（每帧）
protected handleGameOver(): void        // 游戏结束处理

// ─── 框架提供的工具 ──────────────────────────────────────
this.addScore(10)                       // 加分（自动同步 HUD + 升关）
this.cellSize                           // 格子像素大小
this.gridCols / this.gridRows          // 格子数（来自难度配置）
this.offsetX / this.offsetY            // 游戏区域偏移（居中用）
this.gridToPixelCenter(col, row)       // 格子坐标 → 像素中心坐标
this.pauseGame() / this.resumeGame()   // 暂停/恢复
this.isPaused / this.isGameOver        // 状态标志

// ─── 游戏结束（必须手动 emit） ──────────────────────────
this.game.events.emit('gameover', this.score)

// ─── 音效（框架内置，无需外部文件） ─────────────────────
const audio = useAudioStore()
audio.playClickSound() / audio.playWinSound() / audio.playDieSound()
```

---

## 📌 资源生成规范（关键）

| 方案 | 推荐度 | 说明 |
|------|--------|------|
| **Sharp + Node.js WAV** | ✅ 必须使用 | 程序化生成真实图案 PNG + WAV 音频 → MP3 |
| AI 图像生成（image_gen）| ⭐ 可选辅助 | 需要精美插画时使用 |
| theme-resource-generator | ❌ 严禁使用 | 只生成灰色矩形 + 文字，质量极差 |

**资源路径规范**：
- 资源放在游戏包内：`public/themes/{game_code}_default/assets/scene/*.png`
- GTRS.json 中不含 `/public/` 前缀：`/themes/{game_code}_default/assets/scene/bg.png`
- 默认主题命名：`{game_code}_default`（如 `puzzle_default`）

---

## 📡 Vue ↔ Phaser 事件协议

| 方向 | 事件名 | 数据 | 触发时机 |
|------|--------|------|---------|
| Scene → Vue | `ready` | - | 游戏就绪（框架自动发送）|
| Scene → Vue | `score` | `number` | `addScore()` 时自动发送 |
| Scene → Vue | `gameover` | `number` | **你需要手动 emit** |
| Scene → Vue | `paused` | - | `pauseGame()` 时自动发送 |
| Scene → Vue | `resumed` | - | `resumeGame()` 时自动发送 |

---

## ⚙️ 屏幕适配（4 层）

| 层级 | 配置 |
|------|------|
| `index.html` | `viewport-fit=cover` + `safe-area-inset` padding |
| `App.vue` | `100vw × 100vh + overflow:hidden` |
| `GameView.vue` | `h-screen w-full overflow-hidden + touch-action:none` |
| Phaser | `Scale.RESIZE`（自适应容器大小）|

---

## 🗄️ 数据库注册

游戏表：**`t_game`**（不是 `game`）  
主题表：**`t_theme_info`**（有 `t_` 前缀）  
状态流程：`status=0`（草稿）→ 测试通过 → `UPDATE status=2`（上架）

详见 `AI_INSTRUCTIONS.md` 第7节 和 `docs/SQL_SCRIPT_WRITING_GUIDE.md`。

---

## 🎯 与其他项目的关系

| 项目 | 作用 |
|------|------|
| `kids-game-house/games/snake/` | **参考实现**——成熟的游戏实现，可看思路，不能复制 |
| `kids-game-house/games/puzzle/` | **v5.0 框架验证实现**——Sharp 生成资源的完整示例 |

---

## 📚 文档索引

| 文档 | 说明 |
|------|------|
| `templates/game-template/AI_INSTRUCTIONS.md` | ⭐ **AI 开发完整指南（必读）** |
| `docs/GAME_DESIGN_TEMPLATE.md` | GDD 游戏设计文档模板 |
| `docs/GTRS_GUIDE.md` | GTRS 主题资源配置规范详解 |
| `docs/CHECKLIST.md` | 开发验收检查清单 |
| `docs/SQL_SCRIPT_WRITING_GUIDE.md` | 数据库注册 SQL 规范 |
| `docs/DESIGN_REVIEW_CHECKLIST.md` | 设计评审检查清单 |
