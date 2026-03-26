# 🎮 坦克大战 (Tank Battle)

经典坦克大战游戏 - 基于 Vue3 + Phaser 3 开发

[![状态](https://img.shields.io/badge/状态-框架完成-brightgreen)]()
[![版本](https://img.shields.io/badge/版本-v1.0.0-blue)]()
[![技术栈](https://img.shields.io/badge/技术栈-Vue3%20%2B%20Phaser3-orange)]()

---

## 📖 简介

**坦克大战**是一款经典的坦克射击游戏，玩家控制绿色坦克，保护基地，消灭所有红色敌方坦克。游戏支持多种地形、道具和敌人类型，提供丰富的关卡挑战。

### ✨ 核心特性

- 🎯 经典坦克大战玩法，童年回忆重现
- 🎨 精美的像素风格画面，程序自动生成
- 🔊 沉浸式音效和背景音乐
- 🎮 流畅的操作体验，支持键盘控制
- 🏆 规划 20 个精心设计的关卡
- 💥 多种敌人类型和强力道具
- 📱 响应式设计，支持多种设备

---

## 🚀 快速开始

### ⚡ 5 分钟启动游戏

```bash
# 1. 进入游戏目录
cd kids-game-house/tank-battle-vue3

# 2. 安装依赖
npm install

# 3. 安装脚本依赖并生成资源
cd scripts
npm install
cd ..
node generate-resources.mjs

# 4. 启动开发服务器
npm run dev
```

**浏览器访问**: http://localhost:3002

### 🪟 Windows 用户

使用批处理脚本更简单:

```bash
# 生成资源
generate-resources.bat

# 然后安装依赖并启动
npm install
npm run dev
```

---

## 🎯 游戏操作

| 按键 | 功能 |
|------|------|
| **W / ↑** | 向上移动 |
| **S / ↓** | 向下移动 |
| **A / ←** | 向左移动 |
| **D / →** | 向右移动 |
| **J / 空格** | 开火射击 |
| **ESC** | 暂停游戏 |

---

## 🎮 游戏元素

### 🟢 玩家坦克
- **颜色**: 绿色
- **速度**: 中等 (180 像素/秒)
- **生命**: 3 条
- **武器**: 标准子弹

### 🔴 敌方坦克

#### 普通坦克 (Basic)
- **颜色**: 红色
- **速度**: 慢
- **生命**: 1
- **分数**: 100

#### 快速坦克 (Fast)
- **颜色**: 黄色
- **速度**: 快
- **生命**: 1
- **分数**: 200

#### 重型坦克 (Heavy)
- **颜色**: 灰色
- **速度**: 很慢
- **生命**: 3
- **分数**: 300

### 🗺️ 地形

- 🧱 **砖墙**: 可被子弹摧毁
- ⬜ **钢墙**: 不可摧毁，银色金属
- 🌿 **草地**: 可穿过，提供掩护
- 💧 **水域**: 坦克不能通过
- 🦅 **基地**: 需要保护的鹰标，被毁则游戏结束

### 🎁 道具

- ⭐ **三星**: 武器升级，提升火力
- 🕐 **时钟**: 冻结所有敌人 5 秒
- 🛡️ **铲子**: 基地周围钢墙保护 10 秒
- ❤️ **生命**: 额外增加 1 条生命

---

## 📁 项目结构

```
tank-battle-vue3/
├── 📄 文档
│   ├── README.md                    # 本文件
│   ├── QUICK_START.md               # 5 分钟快速开始
│   ├── DEVELOPMENT_GUIDE.md         # 开发者指南
│   ├── PROJECT_SUMMARY.md           # 项目总结
│   ├── PROJECT_STRUCTURE.md         # 目录结构
│   ├── DEVELOPMENT_COMPLETE.md      # 完成公告
│   ├── game-design.md               # 游戏设计
│   └── resource-list.md             # 资源清单
│
├── 📁 src/                          # 源代码
│   ├── config/GTRS.json            # GTRS 配置
│   ├── stores/game.ts              # 状态管理
│   ├── scenes/TankGameScene.ts     # Phaser 场景
│   ├── views/GameView.vue          # 游戏视图
│   ├── main.ts                     # 应用入口
│   ├── App.vue                     # 根组件
│   └── router.ts                   # 路由配置
│
├── 📁 scripts/                      # 工具脚本
│   ├── generate-resources.mjs      # 资源生成主脚本
│   ├── generate-images.mjs         # PNG 图片生成
│   └── generate-audio.mjs          # MP3 音频生成
│
├── 📁 public/themes/default/       # GTRS 资源 (自动生成)
│   ├── audio/                       # 音频资源
│   └── images/                      # 图片资源
│
├── ⚙️ 配置文件
│   ├── package.json                # 项目依赖
│   ├── vite.config.ts              # Vite 构建配置
│   └── tsconfig.json               # TypeScript 配置
│
└── 🚀 工具脚本
    ├── generate-resources.bat      # Windows 资源生成
    ├── register-game.sql           # 数据库注册 SQL
    └── register-game.bat           # Windows 注册工具
```

---

## 🛠️ 技术栈

### 前端框架
- **Vue 3.4** - 渐进式 JavaScript 框架
- **TypeScript 5.3** - 类型安全的 JavaScript 超集
- **Pinia 2.1** - Vue 官方状态管理库
- **Vue Router 4.2** - 官方路由管理器

### 游戏引擎
- **Phaser 3.70** - 强大的 HTML5 游戏框架
- **Arcade Physics** - 2D 物理引擎

### 构建工具
- **Vite 5.0** - 下一代前端构建工具
- **@vitejs/plugin-vue** - Vue 单文件编译器

### 资源生成
- **Canvas API** - 程序生成 PNG 图片
- **node-wav** - WAV 音频编码
- **FFmpeg** - MP3 音频转换

---

## 📚 文档导航

### 🌟 新手必读
1. **[QUICK_START.md](./QUICK_START.md)** - 5 分钟快速开始指南
2. **[README.md](./README.md)** - 项目说明和操作手册
3. **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - 完整开发指南

### 📖 深入学习
4. **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - 项目开发总结
5. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - 目录结构详解
6. **[game-design.md](./game-design.md)** - 完整游戏设计文档
7. **[resource-list.md](./resource-list.md)** - 详细资源清单
8. **[DEVELOPMENT_COMPLETE.md](./DEVELOPMENT_COMPLETE.md)** - 开发完成公告

---

## 🔧 开发指南

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0
- FFmpeg (可选，用于生成 MP3)

### 安装依赖
```bash
npm install
```

### 生成资源
```bash
cd scripts
npm install
node generate-resources.mjs
```

### 开发模式
```bash
npm run dev
# 访问 http://localhost:3002
```

### 生产构建
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

### 注册到数据库
```bash
# MySQL 中执行
mysql -u root -p < register-game.sql
```

---

## 📊 项目统计

### 代码规模
- **总文件数**: 26 个
- **总代码行数**: ~5350 行
- **TypeScript**: ~1500 行
- **Vue 组件**: ~500 行
- **脚本工具**: ~1000 行
- **文档**: ~1540 行

### 资源规模
- **PNG 图片**: 38 张 (程序生成)
- **MP3 音频**: 11 首 (程序合成)
- **GTRS 配置**: 1 份 (严格符合规范)

---

## 🎯 功能完成度

| 功能模块 | 完成度 | 说明 |
|---------|--------|------|
| **游戏框架** | ✅ 100% | Vue3 + Phaser 完整架构 |
| **状态管理** | ✅ 100% | Pinia Store 完整实现 |
| **玩家控制** | ✅ 100% | 移动和开火控制 |
| **敌人 AI** | ⚠️ 60% | 基础随机移动，待优化 |
| **碰撞检测** | ⚠️ 80% | 基础碰撞已实现 |
| **道具系统** | ⚠️ 50% | 数据结构完成，效果待实现 |
| **关卡设计** | ⚠️ 30% | 框架完成，具体关卡待设计 |
| **UI 界面** | ✅ 90% | 菜单/HUD/暂停界面 |
| **音频系统** | ✅ 100% | BGM 和 SFX 完整 |
| **资源配置** | ✅ 100% | GTRS 规范完整 |

---

## 🐛 已知问题

1. **TypeScript 类型错误**
   - 原因：未安装依赖包
   - 解决：运行 `npm install`

2. **FFmpeg 未找到**
   - 原因：未安装 FFmpeg
   - 解决：安装 FFmpeg 或使用 WAV 格式

3. **敌人 AI 简单**
   - 当前为随机移动
   - 计划实现寻路和战术 AI

4. **关卡数量不足**
   - 当前为随机生成地形
   - 计划设计 20 个精心关卡

---

## 🚀 下一步计划

### 高优先级 (1-2 周)
- [ ] 实现完整的 20 个关卡
- [ ] 优化敌人 AI (寻路算法、战术配合)
- [ ] Boss 战机制设计
- [ ] 道具效果具体实现
- [ ] UI/UX 优化

### 中优先级 (1 个月)
- [ ] 对象池实现
- [ ] 触屏控制支持
- [ ] 存档系统
- [ ] 性能优化

### 低优先级 (未来)
- [ ] 双人合作模式
- [ ] 排行榜集成
- [ ] 成就系统
- [ ] 自定义关卡编辑器

---

## 💡 技术亮点

### 🎨 自动化资源生成
- **Canvas 绘图**: 程序生成所有 PNG 图片
- **音频合成**: 程序生成背景音乐和音效
- **一键生成**: 批处理脚本自动完成

### 📦 GTRS 规范实现
- **严格校验**: 完全符合 GTRS v1.0.0 要求
- **双份输出**: GTRS.json 同时输出到 src 和 public
- **路径统一**: 所有资源使用 `/themes/default/` 前缀

### 🎮 现代化架构
- **Vue3 Composition API**: 最先进的 Vue 开发体验
- **TypeScript 严格模式**: 类型安全的代码质量
- **Pinia 状态管理**: 简洁高效的全局状态
- **Phaser 物理引擎**: Arcade Physics 完整集成

---

## 📞 支持与反馈

如有任何问题或建议:

1. 查阅相关文档 (`QUICK_START.md`, `DEVELOPMENT_GUIDE.md`)
2. 检查常见问题解答
3. 联系技术支持团队

---

## 🎊 致谢

感谢以下开源项目:

- [Vue.js](https://vuejs.org/)
- [Phaser](https://phaser.io/)
- [Vite](https://vitejs.dev/)
- [Pinia](https://pinia.vuejs.org/)

---

## 📜 许可证

Internal Use Only - Kids Game Platform Team

---

## 🎮 开始游戏吧!

```bash
cd kids-game-house/tank-battle-vue3
npm install
cd scripts && npm install && cd ..
node generate-resources.mjs
npm run dev
```

**访问 http://localhost:3002**

🎯 **保护基地，消灭所有敌人!** 🎯

---

**版本**: v1.0.0  
**创建日期**: 2026-03-26  
**开发团队**: Kids Game Platform Team  
**状态**: 框架完成，欢迎测试体验 ✅
