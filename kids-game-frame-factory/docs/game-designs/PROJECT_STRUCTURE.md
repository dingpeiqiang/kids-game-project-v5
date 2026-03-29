# 📂 坦克大战项目目录结构

## 完整目录树

```
tank-battle-vue3/
│
├── 📄 game-design.md                    # 游戏设计文档 (260 行)
├── 📄 resource-list.md                  # 资源清单 (115 行)
├── 📖 README.md                         # 项目说明文档 (240 行)
├── 📖 DEVELOPMENT_GUIDE.md              # 开发指南 (254 行)
├── 📖 QUICK_START.md                    # 快速开始指南 (170 行)
├── 📖 PROJECT_SUMMARY.md                # 项目总结 (476 行)
│
├── 🌐 index.html                        # HTML 入口文件
├── 📦 package.json                      # 项目依赖配置
├── ⚙️ vite.config.ts                    # Vite 构建配置
├── 🔧 tsconfig.json                     # TypeScript 配置
├── 🔧 tsconfig.node.json                # TypeScript Node 配置
│
├── 🚀 generate-resources.bat            # Windows 资源生成脚本
├── 💾 register-game.sql                 # 数据库注册 SQL
├── 🚀 register-game.bat                 # Windows 注册脚本
│
├── 📁 scripts/                          # 资源生成脚本目录
│   ├── 📦 package.json                  # 脚本依赖配置
│   ├── 🔧 generate-resources.mjs        # 主资源生成脚本 (214 行)
│   ├── 🖼️ generate-images.mjs           # PNG 图片生成脚本 (597 行)
│   └── 🎵 generate-audio.mjs            # MP3 音频生成脚本 (164 行)
│
├── 📁 public/                           # 公共资源目录 (自动生成)
│   └── 📁 themes/
│       └── 📁 default/                  # GTRS 默认主题目录
│           ├── 📄 GTRS.json             # GTRS 配置文件 (自动生成)
│           ├── 📁 audio/                # 音频资源目录
│           │   ├── 🎵 bgm_main.mp3      # 主菜单音乐
│           │   ├── 🎵 bgm_gameplay.mp3  # 游戏背景音乐
│           │   ├── 🎵 bgm_victory.mp3   # 胜利音乐
│           │   ├── 🎵 bgm_defeat.mp3    # 失败音乐
│           │   ├── 🔊 sfx_fire.mp3      # 开火音效
│           │   ├── 🔊 sfx_explosion.mp3 # 爆炸音效
│           │   ├── 🔊 sfx_hit.mp3       # 击中音效
│           │   ├── 🔊 sfx_powerup_appear.mp3    # 道具出现音效
│           │   ├── 🔊 sfx_powerup_pickup.mp3    # 拾取道具音效
│           │   └── 🔊 sfx_base_destroyed.mp3    # 基地被毁音效
│           │
│           └── 📁 images/               # 图片资源目录
│               ├── 📁 scene/            # 场景图片
│               │   ├── 🖼️ background.png        # 游戏主背景 (720×1280)
│               │   ├── 🖼️ grid.png              # 网格背景 (720×1280)
│               │   ├── 🖼️ wall_brick.png        # 砖墙 (30×30)
│               │   ├── 🖼️ wall_steel.png        # 钢墙 (30×30)
│               │   ├── 🖼️ grass.png             # 草地 (30×30)
│               │   ├── 🖼️ water.png             # 水域 (30×30)
│               │   ├── 🖼️ base.png              # 基地完好 (60×60)
│               │   └── 🖼️ base_destroyed.png    # 基地被毁 (60×60)
│               │
│               ├── 📁 sprite/           # 精灵图片
│               │   ├── 🖼️ player_tank_up.png     # 玩家坦克向上 (48×48)
│               │   ├── 🖼️ player_tank_down.png   # 玩家坦克向下 (48×48)
│               │   ├── 🖼️ player_tank_left.png   # 玩家坦克向左 (48×48)
│               │   ├── 🖼️ player_tank_right.png  # 玩家坦克向右 (48×48)
│               │   │
│               │   ├── 🖼️ enemy_basic_up.png     # 普通坦克向上 (48×48)
│               │   ├── 🖼️ enemy_basic_down.png   # 普通坦克向下 (48×48)
│               │   ├── 🖼️ enemy_basic_left.png   # 普通坦克向左 (48×48)
│               │   ├── 🖼️ enemy_basic_right.png  # 普通坦克向右 (48×48)
│               │   │
│               │   ├── 🖼️ enemy_fast_up.png      # 快速坦克向上 (42×42)
│               │   ├── 🖼️ enemy_fast_down.png    # 快速坦克向下 (42×42)
│               │   ├── 🖼️ enemy_fast_left.png    # 快速坦克向左 (42×42)
│               │   ├── 🖼️ enemy_fast_right.png   # 快速坦克向右 (42×42)
│               │   │
│               │   ├── 🖼️ enemy_heavy_up.png     # 重型坦克向上 (54×54)
│               │   ├── 🖼️ enemy_heavy_down.png   # 重型坦克向下 (54×54)
│               │   ├── 🖼️ enemy_heavy_left.png   # 重型坦克向左 (54×54)
│               │   ├── 🖼️ enemy_heavy_right.png  # 重型坦克向右 (54×54)
│               │   │
│               │   ├── 🖼️ bullet_player.png      # 玩家子弹 (12×12)
│               │   └── 🖼️ bullet_enemy.png       # 敌人子弹 (12×12)
│               │
│               ├── 📁 icon/             # 图标图片 (道具)
│               │   ├── 🖼️ powerup_star.png       # 武器升级道具 (30×30)
│               │   ├── 🖼️ powerup_clock.png      # 时间冻结道具 (30×30)
│               │   ├── 🖼️ powerup_shovel.png     # 基地加固道具 (30×30)
│               │   └── 🖼️ powerup_life.png       # 额外生命道具 (30×30)
│               │
│               └── 📁 effect/           # 特效图片
│                   ├── 🖼️ explosion_1.png        # 爆炸帧 1 (60×60)
│                   ├── 🖼️ explosion_2.png        # 爆炸帧 2 (60×60)
│                   ├── 🖼️ explosion_3.png        # 爆炸帧 3 (60×60)
│                   └── 🖼️ explosion_4.png        # 爆炸帧 4 (60×60)
│
└── 📁 src/                              # 源代码目录
    ├── 📁 config/
    │   └── 📄 GTRS.json                 # GTRS 配置文件 (183 行)
    │
    ├── 📁 stores/
    │   └── 📦 game.ts                   # 游戏状态管理 (329 行)
    │       ├── 游戏状态 (menu/playing/paused/gameover/victory)
    │       ├── 玩家坦克数据
    │       ├── 敌方坦克数据
    │       ├── 子弹系统
    │       ├── 墙壁/地形系统
    │       ├── 道具系统
    │       └── 关卡和分数管理
    │
    ├── 📁 scenes/
    │   └── 🎮 TankGameScene.ts          # Phaser 游戏场景 (577 行)
    │       ├── preload() - 加载资源
    │       ├── create() - 初始化游戏
    │       ├── update() - 游戏循环
    │       ├── 玩家控制
    │       ├── 敌人 AI
    │       ├── 碰撞检测
    │       └── 物理引擎
    │
    ├── 📁 views/
    │   └── 🖥️ GameView.vue              # 游戏视图组件 (312 行)
    │       ├── 菜单界面 UI
    │       ├── 游戏 HUD 界面
    │       ├── 暂停菜单
    │       ├── 游戏结束界面
    │       ├── 胜利界面
    │       └── Phaser 画布集成
    │
    ├── 📄 main.ts                       # 应用入口 (12 行)
    ├── 📄 App.vue                       # 根组件 (26 行)
    └── 📄 router.ts                     # 路由配置 (16 行)
```

## 📊 统计信息

### 文件数量
- **总文件数**: 24 个
- **源代码文件**: 7 个
- **配置文件**: 5 个
- **脚本工具**: 4 个
- **文档**: 6 个
- **SQL 脚本**: 1 个
- **批处理**: 2 个

### 代码行数
| 类别 | 行数 | 占比 |
|------|------|------|
| **TypeScript** | ~1500 | 31% |
| **Vue 组件** | ~500 | 10% |
| **HTML/CSS** | ~400 | 8% |
| **配置/JSON** | ~300 | 6% |
| **脚本工具** | ~1000 | 21% |
| **文档** | ~1200 | 24% |
| **总计** | ~4900 | 100% |

### 资源文件 (自动生成后)
- **PNG 图片**: 38 张
  - Scene: 8 张
  - Sprite: 22 张
  - Icon: 4 张
  - Effect: 4 张
- **MP3 音频**: 11 首
  - BGM: 4 首
  - SFX: 7 首
- **GTRS 配置**: 1 份

## 🗂️ 目录说明

### 📁 `scripts/` - 资源生成脚本
存放所有自动化脚本:
- **generate-resources.mjs**: 主生成脚本，协调整个流程
- **generate-images.mjs**: 使用 Canvas API 绘制所有 PNG 图片
- **generate-audio.mjs**: 使用 node-wav + FFmpeg 生成音频

### 📁 `public/themes/default/` - GTRS 资源
按照 GTRS 规范组织的资源文件:
- **audio/**: 所有音频资源 (BGM + SFX)
- **images/scene/**: 场景相关图片 (背景、地形)
- **images/sprite/**: 游戏对象精灵 (坦克、子弹)
- **images/icon/**: 道具图标
- **images/effect/**: 特效图片
- **GTRS.json**: 资源配置描述文件

### 📁 `src/config/` - 配置文件
- **GTRS.json**: GTRS 配置，与 public 目录中的同步

### 📁 `src/stores/` - 状态管理
使用 Pinia 进行全局状态管理:
- **game.ts**: 游戏完整状态 (玩家、敌人、子弹、地形、分数等)

### 📁 `src/scenes/` - Phaser 游戏场景
- **TankGameScene.ts**: 核心游戏逻辑，Phaser Scene 实现

### 📁 `src/views/` - Vue 组件
- **GameView.vue**: 游戏主界面，包含所有 UI 层

### 📄 根目录文档
- **game-design.md**: 详细的游戏设计文档
- **resource-list.md**: 完整的资源清单
- **README.md**: 项目使用说明
- **DEVELOPMENT_GUIDE.md**: 开发者指南
- **QUICK_START.md**: 5 分钟快速开始
- **PROJECT_SUMMARY.md**: 项目开发总结

## 🔄 资源生成流程

```
执行 generate-resources.mjs
         ↓
1. 创建目录结构 (public/themes/default/...)
         ↓
2. 调用 generate-images.mjs
   ├─ 生成场景图片 (background, grid, walls, etc.)
   ├─ 生成精灵图片 (tanks, bullets)
   ├─ 生成图标图片 (powerups)
   └─ 生成特效图片 (explosions)
         ↓
3. 调用 generate-audio.mjs
   ├─ 生成 WAV 音频
   ├─ 转换为 MP3 (需要 FFmpeg)
   └─ 清理临时 WAV 文件
         ↓
4. 生成 GTRS.json
   ├─ 写入 src/config/GTRS.json
   └─ 复制到 public/themes/default/GTRS.json
         ↓
✅ 完成！所有资源就绪
```

## 🎯 关键文件说明

### ⭐ 核心文件
1. **`src/scenes/TankGameScene.ts`**
   - 游戏的"心脏"，所有游戏逻辑都在这里
   - 负责加载资源、创建对象、游戏循环、碰撞检测

2. **`src/stores/game.ts`**
   - 游戏的"大脑"，管理所有状态数据
   - Vue 组件和 Phaser 场景通过它通信

3. **`src/views/GameView.vue`**
   - 游戏的"外表"，用户看到的所有界面
   - 包含菜单、HUD、暂停等 UI

### ⭐ 配置文件
1. **`vite.config.ts`**
   - 开发服务器端口：3002
   - API 代理配置
   - 构建优化

2. **`GTRS.json`**
   - 所有资源的映射关系
   - 平台识别游戏资源的依据

### ⭐ 工具脚本
1. **`generate-resources.mjs`**
   - 一键生成所有资源
   - 无需手动准备美术和音频素材

2. **`register-game.sql`**
   - 将游戏注册到数据库
   - 平台才能识别和加载游戏

---

**最后更新**: 2026-03-26  
**版本**: v1.0.0
