# kids-game-frame-factory

## 🎮 儿童游戏开发框架

**核心理念**：零耦合 + 模板驱动 + 一键初始化

> 从模板复制的游戏完全独立，不依赖任何框架运行时。  
> **框架定位：给 AI 使用**——约束 AI 在框架规范下开发新游戏。

---

## 📁 目录结构

```
kids-game-frame-factory/
│
├── scripts/                        # 🛠️  初始化脚本
│   ├── init-game.ps1              # 一键初始化（Windows PowerShell）
│   └── init-game.sh               # 一键初始化（macOS/Linux）
│
├── templates/                      # 📋 模板文件
│   ├── game-template/             # ⭐ 游戏项目完整模板（核心）
│   │   ├── AI_INSTRUCTIONS.md     # AI 开发入口文档（必读）
│   │   ├── register-game.sql      # 数据库注册脚本（对齐 t_game）
│   │   └── src/scenes/
│   │       ├── GameScene.ts       # 框架基类（禁止修改）
│   │       └── MyGameScene.ts     # ⭐ AI 只需重写这一个文件
│   │
│   ├── GTRS.template.json         # GTRS 主题资源配置模板
│   ├── difficulty.template.json   # 难度参数配置模板
│   └── generate-resources.template.mjs  # 资源生成脚本模板
│
├── docs/                           # 📚 开发文档
│   ├── GAME_DEV_GUIDE.md          # 游戏开发完整指南
│   ├── GTRS_GUIDE.md              # GTRS 资源配置规范
│   ├── CHECKLIST.md               # 开发检查清单
│   ├── SQL_SCRIPT_WRITING_GUIDE.md # 数据库注册 SQL 指南
│   ├── GAME_DESIGN_TEMPLATE.md    # 游戏设计文档（GDD）模板
│   ├── DESIGN_REVIEW_CHECKLIST.md # 设计评审检查清单
│   └── README_DESIGN_FIRST.md     # 设计先行快速参考
│
└── tools/                          # 🧰 工具集
    ├── gtrs-generator/            # GTRS 资源生成器（含示例主题资源）
    ├── audio-converter/           # WAV → MP3 批量转换工具
    ├── theme-resource-generator/  # 主题资源生成器（Canvas 绘制）
    └── README.md
```

---

## 🚀 快速开始

### 一键初始化（推荐）

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

### 手动复制

```bash
cp -r kids-game-frame-factory/templates/game-template kids-game-house/games/my-puzzle
cd kids-game-house/games/my-puzzle
# 手动替换 __GAME_CODE__ → my-puzzle, __GAME_NAME__ → 拼图游戏
npm install
```

---

## 🗂️ 框架提供的功能

初始化后，以下功能**开箱即用，无需任何开发**：

| 功能 | 文件 |
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

## 🔧 开发指南

**AI 开发新游戏只需做 4 件事：**

| 步骤 | 文件 | 说明 |
|------|------|------|
| 1 | `src/config/difficulty.json` | 调整难度参数（gridCols/gridRows/speed 等）|
| 2 | `src/config/GTRS.json` | 填写资源路径（图片/音频）|
| 3 | `src/scenes/MyGameScene.ts` | ⭐ **重写游戏逻辑（唯一必须开发的文件）** |
| 4 | `register-game.sql` | 替换占位符，注册到数据库 |

详细说明见 `templates/game-template/AI_INSTRUCTIONS.md`。

### 核心 API

```typescript
// MyGameScene.ts 中可用的框架方法
this.addScore(10)       // 加分 → 自动同步 HUD + 检测升关 + 触发动画
this.handleGameOver()   // 游戏结束 → 跳转结束界面
this.togglePause()      // 切换暂停状态
this.initAdapt()        // 读取难度配置，初始化坐标系
this.gridToPixelCenter(col, row)  // 格子坐标 → 像素坐标（中心点）

// 音效
const audio = useAudioStore()
audio.playClickSound()  // 点击音
audio.playWinSound()    // 胜利音
audio.playDieSound()    // 失败音
```

---

## ⚙️ 屏幕适配

4 层配合，实现全平台全屏适配：

| 层级 | 配置 |
|------|------|
| `index.html` | `viewport-fit=cover` + `safe-area-inset` padding |
| `App.vue` | `100vw × 100vh + overflow:hidden` |
| `GameView.vue` | `h-screen w-full overflow-hidden + touch-action:none` |
| Phaser | `Scale.RESIZE`（自适应容器大小）|

---

## 📡 Vue ↔ Phaser 事件协议

| 方向 | 事件名 | 数据 | 说明 |
|------|--------|------|------|
| Scene → Vue | `ready` | - | 游戏就绪 |
| Scene → Vue | `score` | `number` | 分数变化 |
| Scene → Vue | `gameover` | `number` | 游戏结束（携带最终分数）|
| Scene → Vue | `paused` | - | 游戏暂停 |
| Scene → Vue | `resumed` | - | 游戏恢复 |
| Vue → Scene | `scene.pauseGame()` | - | 暂停 |
| Vue → Scene | `scene.resumeGame()` | - | 恢复 |

---

## 🗄️ 数据库注册

游戏注册脚本对齐真实表结构 `t_game`（非旧版 `game` 表）。

关键字段：`game_code` / `game_name` / `game_url` / `category` / `grade` / `creator_id`  
时间戳：`UNIX_TIMESTAMP(NOW()) * 1000`（毫秒）  
状态：`status=0`（草稿），测试通过后执行 `UPDATE status=2`（上架）

详见 `docs/SQL_SCRIPT_WRITING_GUIDE.md`。

---

## 📚 文档索引

| 文档 | 说明 |
|------|------|
| `templates/game-template/AI_INSTRUCTIONS.md` | ⭐ **AI 开发入口，优先阅读** |
| `docs/GAME_DEV_GUIDE.md` | 游戏开发完整指南 |
| `docs/GTRS_GUIDE.md` | 主题资源配置规范 |
| `docs/CHECKLIST.md` | 开发验收检查清单 |
| `docs/SQL_SCRIPT_WRITING_GUIDE.md` | 数据库注册 SQL 规范 |
| `docs/GAME_DESIGN_TEMPLATE.md` | 游戏设计文档（GDD）模板 |

---

## 🎯 与其他项目的关系

| 项目 | 作用 |
|------|------|
| `kids-game-house/games/snake/` | **最佳实践参考**——成熟完整的游戏实现 |
| `kids-game-house/games/puzzle/` | **拼图游戏参考**——v5.0 框架验证实现 |
| `.workbuddy/skills/game-dev/` | IDE Skill（已废弃，指向本框架）|

**重要原则**：
- ❌ 不要从 `snake/` 复制代码创建新游戏（会留下 snake 逻辑残留）
- ✅ 用 `init-game.ps1` 初始化，参考 snake 的**思路**重新实现

---

## 📝 技术规范

- **IDE 沙箱**：禁止 `confirm()`/`alert()`，使用 `ElMessageBox`/`ElMessage`
- **音频格式**：统一 `.mp3`
- **类型检查**：`npx tsc --noEmit`
- **Phaser 导入**：`import Phaser from 'phaser'`
- **事件通信**：`this.game.events.emit()` 从 Phaser 传递到 Vue
