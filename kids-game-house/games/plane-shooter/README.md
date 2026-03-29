# ✈️ 飞机大战 (Plane Shooter)

一款基于 kids-game-frame-factory 游戏模板开发的经典射击类网页小游戏。

## 🎮 游戏简介

玩家控制一架战斗机，通过键盘方向键或触屏拖动来移动飞机位置。飞机会自动发射子弹攻击从上方不断出现的敌机。玩家需要击落尽可能多的敌机，同时躲避敌机的子弹和撞击。游戏随着时间推移难度逐渐增加，生存更长时间获得更高分数。

### 游戏特色

- ✅ **简单易懂的操作** - 单指拖动或方向键控制，自动射击
- ✅ **丰富的道具系统** - 击落敌机随机掉落强化道具
- ✅ **渐进式难度** - 三种难度等级，适合不同年龄段儿童
- ✅ **精美的视觉效果** - 程序化生成的星空背景和卡通风格飞机
- ✅ **完整的音效系统** - 射击、爆炸、拾取道具等音效

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- npm >= 9.x

### 安装依赖

```bash
cd kids-game-house/games/plane-shooter
npm install
```

### 开发模式

```bash
npm run dev
```

启动后访问：http://localhost:5174

### 生成资源（可选）

如果需要重新生成游戏资源：

```bash
npm run generate-resources
```

### 构建生产版本

```bash
npm run build
```

## 🎯 游戏操作

### 键盘控制

- **方向键 ↑↓←→** 或 **WASD** - 控制飞机移动
- **自动射击** - 无需按键，自动发射子弹

### 触屏控制（移动端）

- **手指拖动** - 控制飞机移动

## 📋 游戏元素

### 玩家飞机

- 生命值：3 点
- 自动射击：每 0.3 秒发射一次
- 移动速度：300px/s

### 敌机类型

| 类型 | 生命值 | 得分 | 出现条件 |
|------|--------|------|---------|
| 小型敌机 | 1 | 100 | 随时出现 |
| 中型敌机 | 3 | 300 | 15 秒后，20% 概率 |
| 大型敌机 | 5 | 500 | 30 秒后，10% 概率 |

### 道具系统

| 道具 | 效果 | 掉率 |
|------|------|------|
| 双发子弹 (🔶) | 同时发射两枚子弹，持续 10 秒 | 15% |
| 护盾 (🛡️) | 抵挡一次伤害 | 10% |
| 生命恢复 (❤️) | 恢复 1 点生命 | 8% |
| 炸弹 (💣) | 清除全屏敌人（暂未实现主动使用） | 5% |

## 🏗️ 技术架构

### 核心技术栈

- **Phaser 3.90** - 游戏引擎
- **Vue 3 + TypeScript** - 前端框架
- **Pinia** - 状态管理
- **Vite 5** - 构建工具
- **TailwindCSS** - UI 样式

### 项目结构

```
plane-shooter/
├── src/
│   ├── scenes/
│   │   ├── GameScene.ts           # 游戏场景基类
│   │   └── PlaneShooterScene.ts   # 飞机大战场景实现 ⭐
│   ├── components/
│   │   └── game/
│   │       └── PhaserGame.vue     # Phaser 游戏容器
│   ├── views/
│   │   ├── LoadingView.vue        # 加载页面
│   │   ├── StartView.vue          # 开始页面
│   │   ├── DifficultyView.vue     # 难度选择
│   │   ├── GameView.vue           # 游戏页面
│   │   └── GameOverView.vue       # 结束页面
│   ├── stores/
│   │   ├── game.ts                # 游戏状态
│   │   ├── theme.ts               # 主题状态
│   │   └── audio.ts               # 音频状态
│   └── config/
│       └── GTRS.json              # 资源配置文件
├── public/
│   └── themes/
│       └── plane_shooter_default/ # 游戏主题资源
│           ├── images/            # 图片资源
│           ├── audio/             # 音频资源（需单独准备）
│           └── GTRS.json          # 资源配置
├── scripts/
│   └── generate-resources.mjs     # 资源生成脚本
├── GAME_DESIGN_DOCUMENT.md        # 游戏设计文档
└── package.json
```

## 🎨 资源说明

### 图片资源

所有图片资源均通过 Sharp 库程序化生成，包括：

- 背景：深蓝色星空渐变 + 随机星星
- 玩家飞机：蓝白色战斗机
- 敌机：小型（红色）、中型（绿色）、大型（紫色）
- 子弹：玩家（蓝色）、敌机（红色）
- 道具：双发、护盾、生命、炸弹
- 特效：爆炸动画

### 音频资源

音频资源需要单独准备或使用框架内置合成音。推荐准备以下音效：

- `bgm_main` - 背景音乐
- `sfx_shoot` - 射击音效
- `sfx_explosion` - 爆炸音效
- `sfx_hit` - 被击中音效
- `sfx_prop` - 拾取道具音效
- `sfx_gameover` - 游戏结束音效

## 📊 游戏数值设计

### 基础配置

```typescript
GRID_COLS = 10        // 横向 10 格
GRID_ROWS = 16        // 纵向 16 格
BASE_CELL_SIZE = 80   // 基础单元格 80px
```

### 难度系数

- **简单 (easy)** - 0.8x 速度
- **普通 (medium)** - 1.0x 速度（默认）
- **困难 (hard)** - 1.2x 速度

### 难度递增机制

每 30 秒自动增加难度：

- 敌机生成速度 +10%
- 敌机移动速度 +10%
- 生成间隔减少 100ms（最低 500ms）

## 🐛 已知问题与待优化

### P0 - 核心功能

- [x] 玩家移动和射击
- [x] 敌机生成和 AI
- [x] 碰撞检测
- [x] 道具系统
- [x] 分数系统
- [x] 游戏结束判定

### P1 - 增强功能（待实现）

- [ ] 炸弹主动使用技能（按空格键触发）
- [ ] Boss 战（每 60 秒出现）
- [ ] 连击系统
- [ ] 成就系统
- [ ] 排行榜

### P2 - 优化项

- [ ] 粒子效果增强
- [ ] 屏幕震动效果
- [ ] 更多敌机类型
- [ ] 关卡系统
- [ ] 音频资源完整替换

## 📖 开发指南

### 如何修改游戏逻辑

1. 编辑 `src/scenes/PlaneShooterScene.ts`
2. 修改对应的游戏参数和方法
3. 运行 `npm run dev` 实时预览

### 如何添加新道具

1. 在 `PlaneShooterScene.ts` 中添加新的 propType
2. 生成或添加道具图片到资源目录
3. 更新 `GTRS.json` 配置
4. 在 `collectProp()` 方法中添加道具效果逻辑

### 如何调整数值

在 `PlaneShooterScene.ts` 中修改以下常量：

```typescript
private shootInterval: number = 300        // 射击间隔（毫秒）
private enemySpawnInterval: number = 1500  // 敌机生成间隔（毫秒）
private propDropChance: number = 0.15      // 道具掉率
```

## 📝 许可证

本项目作为 kids-game-project-v5 的一部分，遵循项目整体许可协议。

## 🙏 致谢

- 基于 kids-game-frame-factory 模板开发
- 使用 Phaser 3 游戏引擎
- 使用 Vue 3 + TypeScript 技术栈

---

**开发完成日期**: 2026-03-29  
**版本**: v1.0.0  
**作者**: AI Assistant
