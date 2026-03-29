# 🎮 坦克大战 (Tank Battle)

经典坦克大战游戏 - 基于 Vue3 + Phaser 3 开发

## 📖 游戏简介

控制你的坦克，保护基地，消灭所有敌方坦克！支持多种地形、道具和敌人类型。

## ✨ 特性

- 🎯 经典坦克大战玩法
- 🎨 精美的像素风格画面
- 🔊 沉浸式音效和背景音乐
- 🎮 流畅的操作体验
- 🏆 20 个关卡挑战
- 💥 多种敌人类型和道具

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
cd kids-game-house/tank-battle-vue3
npm install
```

### 生成游戏资源

```bash
# 在 scripts 目录下执行
cd scripts
npm install
node generate-resources.mjs
```

或者直接运行批处理脚本 (Windows):

```bash
generate-resources.bat
```

### 开发模式

```bash
npm run dev
```

游戏将在 http://localhost:3002 启动

### 生产构建

```bash
npm run build
```

## 🎯 游戏操作

| 按键 | 功能 |
|------|------|
| W / ↑ | 向上移动 |
| S / ↓ | 向下移动 |
| A / ← | 向左移动 |
| D / → | 向右移动 |
| J / 空格 | 开火 |
| ESC | 暂停游戏 |

## 🎮 游戏元素

### 坦克类型

#### 玩家坦克
- 颜色：绿色
- 速度：中等
- 生命：3

#### 敌方坦克
1. **普通坦克** (红色)
   - 速度：慢
   - 生命：1
   - 分数：100

2. **快速坦克** (黄色)
   - 速度：快
   - 生命：1
   - 分数：200

3. **重型坦克** (灰色)
   - 速度：很慢
   - 生命：3
   - 分数：300

### 地形

- 🧱 **砖墙**: 可被子弹摧毁
- ⬜ **钢墙**: 不可摧毁
- 🌿 **草地**: 可穿过，提供掩护
- 💧 **水域**: 坦克不能通过
- 🦅 **基地**: 需要保护的目标

### 道具

- ⭐ **三星**: 武器升级
- 🕐 **时钟**: 冻结敌人 5 秒
- 🛡️ **铲子**: 基地加固 10 秒
- ❤️ **生命**: 额外生命

## 📁 项目结构

```
tank-battle-vue3/
├── public/
│   └── themes/
│       └── default/
│           ├── audio/          # 音频资源
│           └── images/         # 图片资源
├── scripts/
│   ├── generate-audio.mjs      # 音频生成脚本
│   ├── generate-images.mjs     # 图片生成脚本
│   └── generate-resources.mjs  # 资源生成主脚本
├── src/
│   ├── config/
│   │   └── GTRS.json          # GTRS 配置
│   ├── scenes/
│   │   └── TankGameScene.ts   # Phaser 游戏场景
│   ├── stores/
│   │   └── game.ts            # 状态管理
│   ├── views/
│   │   └── GameView.vue       # 游戏视图
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🛠️ 开发说明

### GTRS 资源配置

游戏使用 GTRS (Game Theme Resource Specification) 规范组织资源:

- 所有资源位于 `public/themes/default/`
- 图片分为：scene, sprite, icon, effect
- 音频分为：bgm (背景音乐), effect (音效)
- 配置文件：`src/config/GTRS.json`

### 资源生成

资源生成脚本会自动创建:

1. **PNG 图片**: 使用 Canvas API 绘制
   - 坦克 (玩家 + 敌人)
   - 地形元素
   - 道具图标
   - 爆炸特效

2. **MP3 音频**: 使用 node-wav + FFmpeg
   - 背景音乐
   - 游戏音效

### Phaser 游戏场景

主要游戏逻辑在 `src/scenes/TankGameScene.ts`:

- `preload()`: 加载资源
- `create()`: 初始化游戏对象
- `update()`: 游戏循环更新

### 状态管理

使用 Pinia 管理游戏状态:

- 游戏状态 (菜单/进行中/暂停/结束)
- 玩家和敌人数据
- 子弹和地形
- 分数和关卡

## 📝 待办事项

目前项目框架已完成，但还需要:

1. ⚠️ **安装依赖**: 需要运行 `npm install`
2. ⚠️ **测试运行**: 启动开发服务器验证
3. ⚠️ **完善碰撞检测**: 优化物理引擎
4. ⚠️ **AI 改进**: 更智能的敌人行为
5. ⚠️ **关卡设计**: 精心设计的关卡布局
6. ⚠️ **UI 优化**: 更精美的界面

## 🎯 下一步

### 立即执行

```bash
# 1. 安装主项目依赖
npm install

# 2. 安装脚本依赖
cd scripts
npm install
cd ..

# 3. 生成资源
node scripts/generate-resources.mjs

# 4. 启动开发服务器
npm run dev
```

### 注册到数据库

执行 SQL 脚本将游戏注册到平台:

```bash
# 在数据库中执行
mysql -u root -p < register-game.sql
```

## 📚 参考文档

- [游戏开发规范](../../GAME_DEVELOPMENT_STANDARD.md)
- [GTRS 统一校验架构](../../GTRS_UNIFIED_VALIDATION_ARCHITECTURE.md)
- [Vue3 官方文档](https://vuejs.org/)
- [Phaser3 官方文档](https://photonstorm.github.io/phaser3-docs/)

## 🎊 致谢

感谢使用本规范开发新游戏!

---

**版本**: v1.0.0  
**创建日期**: 2026-03-26  
**开发团队**: Kids Game Platform Team
