# 📚 飞机大战项目文档索引

欢迎使用飞机大战游戏开发框架！本文档索引帮助您快速找到所需信息。

---

## 🎯 我想...

### 快速开始游戏
👉 查看 [QUICK_START.md](./QUICK_START.md) - 30 秒快速启动指南

### 了解游戏完整信息
👉 查看 [README.md](./README.md) - 完整项目说明文档

### 查看游戏设计细节
👉 查看 [GAME_DESIGN_DOCUMENT.md](./GAME_DESIGN_DOCUMENT.md) - 游戏设计文档

### 了解开发过程
👉 查看 [DEVELOPMENT_SUMMARY.md](./DEVELOPMENT_SUMMARY.md) - 开发总结报告

---

## 📖 文档分类

### 🚀 入门文档
| 文档 | 用途 | 适合人群 |
|------|------|---------|
| [QUICK_START.md](./QUICK_START.md) | 快速启动和基础操作 | 所有用户 ⭐⭐⭐⭐⭐ |
| [README.md](./README.md) | 完整项目说明 | 所有用户 ⭐⭐⭐⭐ |

### 📋 设计文档
| 文档 | 用途 | 适合人群 |
|------|------|---------|
| [GAME_DESIGN_DOCUMENT.md](./GAME_DESIGN_DOCUMENT.md) | 游戏设计和数值规划 | 策划人员、开发者 ⭐⭐⭐⭐ |
| [DEVELOPMENT_SUMMARY.md](./DEVELOPMENT_SUMMARY.md) | 开发过程和成果总结 | 项目管理者 ⭐⭐⭐ |
| [REGISTER_GUIDE.md](./REGISTER_GUIDE.md) | 游戏注册到平台指南 | 运维人员 ⭐⭐⭐⭐⭐ |

### 💻 技术文档（代码内）
| 位置 | 内容 | 适合人群 |
|------|------|---------|
| `src/scenes/PlaneShooterScene.ts` | 游戏核心逻辑实现 | 开发者 ⭐⭐⭐⭐⭐ |
| `src/components/game/PhaserGame.vue` | Phaser 集成组件 | 开发者 ⭐⭐⭐ |
| `scripts/generate-resources.mjs` | 资源生成脚本 | 美术/开发者 ⭐⭐⭐ |

---

## 🔍 快速查找

### 游戏操作
- **键盘控制**: 方向键或 WASD 移动
- **自动射击**: 无需按键
- **道具系统**: 4 种不同效果

👉 详见：[QUICK_START.md - 游戏操作](./QUICK_START.md#-游戏操作)

### 修改游戏参数
- **难度调整**: 修改速度系数
- **射击频率**: 修改射击间隔
- **道具掉率**: 修改概率值

👉 详见：[QUICK_START.md - 快速修改](./QUICK_START.md#-快速修改)

### 技术问题排查
- **画面空白**: 检查资源和控制台
- **无法操作**: 检查输入和焦点
- **编译错误**: 检查依赖和语法

👉 详见：[QUICK_START.md - 常见问题](./QUICK_START.md#-常见问题)

---

## 📂 文件结构

```
plane-shooter/
│
├── 📄 README.md                      # 完整项目说明
├── 📄 QUICK_START.md                 # 快速启动指南 ⭐
├── 📄 REGISTER_GUIDE.md              # 游戏注册指南 ⭐⭐⭐⭐⭐
├── 📄 DEVELOPMENT_SUMMARY.md         # 开发总结
├── 📄 GAME_DESIGN_DOCUMENT.md        # 游戏设计文档
│
├── 📦 package.json                   # 项目配置和依赖
├── 🖼️ scripts/generate-resources.mjs # 资源生成脚本
├── 📝 register-game.sql              # SQL 注册脚本 ⭐
├── 📝 register-game-api.js           # Node.js 注册脚本 ⭐
│
└── 📁 src/
    ├── 🎮 scenes/PlaneShooterScene.ts    # 游戏核心逻辑 ⭐
    ├── 🖼️ components/game/PhaserGame.vue # 游戏容器组件
    ├── 📄 views/                         # 页面视图组件
    └── ⚙️ config/GTRS.json               # 资源配置
```

---

## 🎮 游戏元素速查

### 敌机类型
| 类型 | 颜色 | 生命 | 得分 | 特点 |
|------|------|------|------|------|
| 小型 | 红色 | 1 | 100 | 速度快，无攻击 |
| 中型 | 绿色 | 3 | 300 | 可发射子弹 |
| 大型 | 紫色 | 5 | 500 | 可发射子弹，速度慢 |

👉 详见：[README.md - 敌机类型](./README.md#敌机类型)

### 道具效果
| 道具 | 效果 | 持续时间 | 掉率 |
|------|------|---------|------|
| 🔶 双发子弹 | 同时发射两枚子弹 | 10 秒 | 15% |
| 🛡️ 护盾 | 抵挡一次伤害 | 一次性 | 10% |
| ❤️ 生命恢复 | 恢复 1 点生命 | 立即 | 8% |
| 💣 炸弹 | 待实现主动技能 | - | 5% |

👉 详见：[README.md - 道具系统](./README.md#道具系统)

---

## 🛠️ 开发工作流

### 1. 环境准备
```bash
npm install              # 安装依赖
```

### 2. 启动开发
```bash
npm run dev              # 启动热重载服务器
```

### 3. 修改代码
编辑 `src/scenes/PlaneShooterScene.ts`  
→ 浏览器自动刷新预览

### 4. 测试验证
访问 http://localhost:5173/  
→ 测试游戏功能

### 5. 构建发布
```bash
npm run build            # 生产环境构建
```

👉 详见：[QUICK_START.md - 常用命令](./QUICK_START.md#-常用命令)

---

## 🎯 常见使用场景

### 场景 1: 我只是想玩游戏
1. 打开 [QUICK_START.md](./QUICK_START.md)
2. 按照"30 秒快速开始"操作
3. 享受游戏！

### 场景 2: 我想修改游戏难度
1. 打开 [QUICK_START.md](./QUICK_START.md)
2. 查看"快速修改 - 调整游戏难度"
3. 编辑指定文件行号
4. 保存后浏览器自动刷新

### 场景 3: 我想了解游戏设计思路
1. 打开 [GAME_DESIGN_DOCUMENT.md](./GAME_DESIGN_DOCUMENT.md)
2. 查看各章节详细设计
3. 参考数值和规则说明

### 场景 4: 我是开发者，想扩展功能
1. 查看 [DEVELOPMENT_SUMMARY.md](./DEVELOPMENT_SUMMARY.md) 了解架构
2. 阅读 `src/scenes/PlaneShooterScene.ts` 源码
3. 参考"待优化功能"列表进行扩展

---

## 📞 获取帮助

### 遇到问题？
1. **游戏问题** → 查看 [QUICK_START.md - 常见问题](./QUICK_START.md#-常见问题)
2. **技术问题** → 查看 [README.md - 技术架构](./README.md#技术架构)
3. **设计问题** → 查看 [GAME_DESIGN_DOCUMENT.md](./GAME_DESIGN_DOCUMENT.md)

### 如何修改？
1. **修改参数** → [QUICK_START.md - 快速修改](./QUICK_START.md#-快速修改)
2. **添加功能** → 阅读源码注释
3. **重新生成资源** → `npm run generate-resources`

---

## 🌟 推荐阅读顺序

### 新手玩家
1. [QUICK_START.md](./QUICK_START.md) ⭐⭐⭐⭐⭐
2. [README.md - 游戏简介](./README.md#-游戏简介) ⭐⭐⭐⭐

### 进阶玩家
1. [README.md](./README.md) ⭐⭐⭐⭐⭐
2. [QUICK_START.md - 游戏技巧](./QUICK_START.md#-游戏技巧) ⭐⭐⭐⭐

### 开发者
1. [DEVELOPMENT_SUMMARY.md](./DEVELOPMENT_SUMMARY.md) ⭐⭐⭐⭐⭐
2. [GAME_DESIGN_DOCUMENT.md](./GAME_DESIGN_DOCUMENT.md) ⭐⭐⭐⭐⭐
3. 源代码 `src/scenes/PlaneShooterScene.ts` ⭐⭐⭐⭐⭐

### 策划人员
1. [GAME_DESIGN_DOCUMENT.md](./GAME_DESIGN_DOCUMENT.md) ⭐⭐⭐⭐⭐
2. [README.md - 游戏数值设计](./README.md#游戏数值设计) ⭐⭐⭐⭐

---

## 🎊 项目亮点

✨ **完整的文档体系** - 从快速入门到详细设计，应有尽有  
✨ **清晰的代码结构** - 每个文件都有详细的中文注释  
✨ **模块化设计** - 易于理解和扩展  
✨ **自动化资源生成** - 程序化绘制所有图片资源  
✨ **遵循最佳实践** - 符合项目开发规范  

---

## 📊 文档统计

| 类型 | 数量 | 总行数 |
|------|------|--------|
| Markdown 文档 | 4 个 | ~1000 行 |
| TypeScript 代码 | 1 个核心文件 | 754 行 |
| Vue 组件 | 6 个 | ~600 行 |
| 资源脚本 | 1 个 | 494 行 |
| **总计** | **12 个** | **~2850 行** |

---

**祝您使用愉快！🎮✨**

如有任何问题，请查阅对应文档或联系开发者。
