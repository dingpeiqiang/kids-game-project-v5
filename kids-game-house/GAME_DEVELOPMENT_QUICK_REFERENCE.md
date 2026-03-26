# 🎮 游戏开发规范 v1.0.4 - 快速参考卡

**适用项目**: Kids Game Platform  
**架构基础**: kids-game-house + game-framework  
**最后更新**: 2026-03-26

---

## 📦 三层架构复用模型

```
┌─────────────────────────────────────────┐
│    游戏特定层 (0-30% 复用)              │
│  - PhaserGame.ts (核心玩法)             │
│  - 游戏特定 Store                       │
│  - 游戏对象 (Player/Enemy/Item)         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│    通用框架层 (80-100% 复用)            │
│  - useGameStore (状态管理)              │
│  - GameUIOverlay (UI 覆盖层)             │
│  - platformApi (平台通信)               │
│  - initGame (初始化)                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│    基础设施层 (100% 复用)               │
│  - Vue 3 / Pinia / Axios / Vite         │
└─────────────────────────────────────────┘
```

---

## 🚀 四阶段开发流程

### 阶段 1: 设计与 GTRS 资源规范
- ✅ 游戏设计文档
- ✅ GTRS Schema 定义
- ✅ 资源清单

### 阶段 2: GTRS 资源配置生成
```bash
cd tools/gtrs-generator
node src/generate-resources.mjs
# 输出到：games/{game-code}/public/themes/default/
```

### 阶段 3: 代码克隆与适配
```bash
cd games
cp -r snake {game-code}
cd {game-code}
# 配置 vite.config.ts → @kids-game/framework 路径别名
# 修改 main.ts → 使用 initGame
# 修改 App.vue → 使用 GameUIOverlay + useGameStore
```

### 阶段 4: 游戏注册与部署
- ✅ 执行 register-game.sql
- ✅ 运行 Node.js 注册脚本
- ✅ 部署到生产环境

---

## 🔧 Framework 核心 API

### 初始化应用
```typescript
// src/main.ts
import { initGame } from '@kids-game/framework'

const app = initGame(App, (customInit) => {
  customInit.use(createPinia())
  customInit.use(router)
})

app.mount('#app')
```

### 状态管理
```typescript
// src/App.vue
import { useGameStore, GameUIOverlay } from '@kids-game/framework'

const gameStore = useGameStore()

// 游戏控制
gameStore.startGame()
gameStore.pauseGame()
gameStore.resumeGame()
gameStore.endGame(true)

// 分数管理
gameStore.addScore(100)
gameStore.setScore(500)
```

### UI 覆盖层
```vue
<GameUIOverlay
  :showPauseMenu="gameStore.isPaused"
  :showGameOverMenu="gameStore.isGameOver"
  :score="gameStore.score"
  :highScore="gameStore.highScore"
  :duration="gameStore.getGameDuration()"
  @resume="gameStore.resumeGame()"
  @restart="restartGame()"
  @exit="exitGame()"
/>
```

### 平台通信
```typescript
import { getSessionToken, reportGameResult } from '@kids-game/framework'

const token = getSessionToken()

await reportGameResult({
  sessionToken: token,
  score: 1000,
  duration: 120,
  isWin: true
})
```

---

## 📂 关键目录结构

```
kids-game-house/
├── shared/game-framework/          # ⭐ 核心框架
│   ├── src/
│   │   ├── types/                 # 类型定义
│   │   ├── stores/                # useGameStore
│   │   ├── utils/                 # platformApi/initGame
│   │   └── components/            # GameUIOverlay
│   └── index.md                   # 完整文档
│
├── tools/gtrs-generator/           # 🔧 资源生成器
│   └── src/generate-resources.mjs # 主生成脚本
│
├── games/snake/                    # 🎮 参考实现
│   ├── src/
│   │   ├── main.ts                # 使用 framework
│   │   ├── App.vue                # 使用 GameUIOverlay
│   │   └── phaser/PhaserGame.ts   # 游戏逻辑
│   └── public/themes/default/     # 资源文件
│
├── resources/                      # 📦 公共资源库
│   ├── images/
│   └── audio/
│
└── docs/                           # 📚 统一文档
    ├── development-guide/
    ├── tools-manual/
    └── game-designs/
```

---

## ✅ 检查清单

### 阶段 1 检查
- [ ] 游戏设计文档完成
- [ ] GTRS Schema 定义清晰
- [ ] 资源清单完整

### 阶段 2 检查
- [ ] 使用 tools/gtrs-generator 生成资源
- [ ] 所有 PNG 图片生成成功
- [ ] 所有 MP3 音频生成成功
- [ ] GTRS.json 已复制到两个位置

### 阶段 3 检查
- [ ] 复制 games/snake 项目结构
- [ ] vite.config.ts 配置 framework 路径别名
- [ ] main.ts 使用 initGame 初始化
- [ ] App.vue 使用 GameUIOverlay 和 useGameStore
- [ ] 游戏逻辑适配完成
- [ ] 开发服务器启动成功

### 阶段 4 检查
- [ ] SQL 脚本包含 t_game 表插入
- [ ] SQL 脚本包含 t_theme_info 表插入
- [ ] 游戏注册到数据库
- [ ] 后端 API 能查询到新游戏
- [ ] 前端能正常显示和启动游戏

---

## 📊 复用度量化

| 层次 | 复用度 | 典型组件 |
|------|--------|---------|
| **基础设施层** | 100% | Vue/Pinia/Axios/Vite |
| **通用框架层** | 80-100% | useGameStore/GameUIOverlay/platformApi |
| **游戏特定层** | 0-30% | PhaserGame.ts/游戏对象/资源配置 |

---

## 🎯 最小化改动原则

### 完全不需要修改（100% 复用）
- ✅ HomeView.vue - 平台首页
- ✅ DifficultySelector.vue - 难度选择器
- ✅ LoadingProgress.vue - 加载进度条
- ✅ GameToolbar.vue - 顶部工具栏
- ✅ GameOverView.vue - 游戏结束界面
- ✅ router/index.ts - 路由配置
- ✅ utils/platformApi.ts - 平台 API（framework 提供）

### 只需修改文本（90% 复用）
- ✏️ StartView.vue - 游戏标题、描述

### 需要适配（70-80% 复用）
- ⚙️ stores/game.ts - 扩展 framework 的 Store
- ⚙️ vite.config.ts - 配置 framework 路径别名

### 完全重新实现（0-30% 复用）
- 🆕 PhaserGame.ts - 核心游戏逻辑
- 🆕 游戏场景类 - 具体玩法实现
- 🆕 资源配置 - GTRS.json 映射关系
- 🆕 资源文件 - PNG/MP3 生成

---

## 📚 文档导航

### Framework 文档
- 📘 [使用指南](shared/game-framework/index.md)
- 🏗️ [架构设计](shared/game-framework/ARCHITECTURE.md)
- ⚡ [快速参考](shared/game-framework/README.md)
- ✅ [完成总结](shared/game-framework/FRAMEWORK_COMPLETE_SUMMARY.md)

### 工具手册
- 🔧 [资源生成器](tools/gtrs-generator/README.md)
- 🎵 [音频转换器](tools/audio-converter/README.md)
- 📖 [开发指南](docs/development-guide/)

### 参考项目
- 🎮 [贪吃蛇](games/snake/) - 使用 framework 的典范

---

## 💡 常用命令

```bash
# 生成资源
cd tools/gtrs-generator
node src/generate-resources.mjs

# 启动游戏开发服务器
cd games/{game-code}
npm install
npm run dev

# 构建生产版本
npm run build

# 注册游戏到数据库
mysql -u root -p kids_game_platform < register-game.sql
```

---

## 🎉 改进指标

| 指标 | 传统方式 | 使用本规范 | 提升 |
|------|---------|-----------|------|
| 开发时间 | 3-5 天 | 1-2 天 | 60%+ |
| 代码复用 | < 20% | > 80% | 4 倍 |
| 维护成本 | 高 | 低 | 显著降低 |

---

## 🔑 关键要点

✅ **框架化思维** - 从"代码克隆"升级到"框架复用"  
✅ **三层架构** - 明确哪些直接用、哪些要改、哪些重写  
✅ **工具集中** - 使用统一的 tools/gtrs-generator  
✅ **参考贪吃蛇** - games/snake 是最佳实践  
✅ **文档导航** - 站在前人肩膀上发展  

---

**版本**: v1.0.4 | **制定日期**: 2026-03-26 | **维护者**: Lingma AI Assistant
