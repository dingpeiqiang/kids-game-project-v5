# 🚀 飞机大战游戏开发 - 快速启动指南

**适用于**: 开发者想要快速生成资源并开始编码

---

## ⚡ 5 分钟快速启动

### 步骤 1️⃣: 生成所有游戏资源 (2 分钟)

```bash
# 进入项目目录
cd kids-game-house/plane-shooter-vue3

# 运行一键生成脚本
.\generate-resources.ps1
```

**脚本会自动完成**:
- ✅ 检查 Node.js 环境
- 📦 安装 Sharp 依赖 (约 30 秒)
- 🎨 生成 22 张图片和 9 首音频
- ✅ 验证输出文件完整性

### 步骤 2️⃣: 验证资源生成成功 (30 秒)

检查以下关键文件是否存在:

```bash
# Windows PowerShell
ls public\themes\default\assets\scene\background.png
ls public\themes\default\assets\sprite\player_plane.png
ls public\themes\default\assets\audio\bgm_main.wav
ls public\themes\default\GTRS.json
ls src\config\GTRS.json
```

预期输出：所有文件都存在 ✅

### 步骤 3️⃣: 复制项目框架 (1 分钟)

```bash
cd ..
copy -Recurse snake-vue3 plane-shooter-complete
```

### 步骤 4️⃣: 修改基础配置 (30 秒)

编辑 `plane-shooter-complete/package.json`:

```json
{
  "name": "plane-shooter-vue3",
  "description": "飞机大战游戏"
}
```

### 步骤 5️⃣: 实现游戏逻辑 (后续工作)

参考以下文件进行开发:
- 📖 [游戏设计文档](./game-design.md)
- 📋 [资源清单](./resource-list.md)
- 🔧 [PhaserGame.ts 参考](../snake-vue3/src/components/game/PhaserGame.ts)

---

## 🎯 完整执行流程

### 方案 A: PowerShell 一键执行 (推荐新手)

```bash
cd kids-game-house/plane-shooter-vue3
.\generate-resources.ps1
```

**优点**:
- ✅ 全自动，无需手动操作
- ✅ 包含错误检查和验证
- ✅ 友好的命令行界面

### 方案 B: 手动分步执行 (适合高级用户)

```bash
# 1. 安装依赖
cd kids-game-house/plane-shooter-vue3/scripts
npm install

# 2. 生成资源
node generate-resources.mjs

# 3. 验证输出
ls ../public/themes/default/assets/
```

---

## 📁 生成的文件结构

```
plane-shooter-vue3/
├── public/
│   └── themes/
│       └── default/
│           ├── assets/
│           │   ├── scene/          # 场景图片 (3 张)
│           │   │   ├── background.png
│           │   │   ├── stars.png
│           │   │   └── grid.png
│           │   ├── sprite/         # 精灵图片 (10 张)
│           │   │   ├── player_plane.png
│           │   │   ├── enemy_*.png (4 种敌机)
│           │   │   ├── bullet_*.png (4 种子弹)
│           │   ├── icon/           # 图标 (5 张)
│           │   │   └── powerup_*.png (5 种道具)
│           │   ├── effect/         # 特效 (4 张)
│           │   │   └── explosion_*.png (4 帧)
│           │   └── audio/          # 音频 (9 首)
│           │       ├── bgm_*.wav (4 首 BGM)
│           │       └── effect_*.wav (5 首 SFX)
│           └── GTRS.json           # 主题配置
├── src/
│   └── config/
│       └── GTRS.json               # 源代码配置
└── scripts/
    ├── generate-resources.mjs      # 资源生成脚本
    └── package.json                # NPM 配置
```

---

## 🎮 资源配置速查表

### 玩家飞机
```javascript
尺寸：60×80 像素
颜色：绿色 (#4ade80)
位置：sprite/player_plane.png
```

### 敌机类型
```javascript
小型敌机：40×40, 红色，直线飞行
中型敌机：50×60, 紫色，左右摆动
大型敌机：80×80, 金色，追踪玩家
Boss:    150×150, 紫色，复杂弹幕
```

### 道具系统
```javascript
🔫 weapon  - 武器强化 (红色)
⚡ speed   - 速度提升 (黄色)
🛡️ shield  - 护盾 (蓝色)
❤️ health  - 生命回复 (绿色)
💥 bomb    - 全屏炸弹 (紫色)
```

### 游戏参数
```javascript
GAME_WIDTH = 720
GAME_HEIGHT = 1280
GRID_SIZE = 40
GRID_COLS = 18
GRID_ROWS = 32
```

---

## ✅ 验收检查清单

### 资源生成检查
- [ ] 背景图片存在且尺寸为 720×1280
- [ ] 玩家飞机 sprite 存在且尺寸为 60×80
- [ ] 4 种敌机 sprite 都存在
- [ ] 4 种子弹 sprite 都存在
- [ ] 5 种道具图标都存在
- [ ] 4 帧爆炸特效都存在
- [ ] 4 首 BGM 音频都存在
- [ ] 5 首 SFX 音效都存在
- [ ] GTRS.json 在两个位置都存在

### 文件完整性检查
```bash
# 复制此脚本并执行
$files = @(
  "public\themes\default\assets\scene\background.png",
  "public\themes\default\assets\sprite\player_plane.png",
  "public\themes\default\assets\audio\bgm_main.wav",
  "public\themes\default\GTRS.json",
  "src\config\GTRS.json"
)

foreach ($file in $files) {
  if (Test-Path $file) {
    Write-Host "✅ $file" -ForegroundColor Green
  } else {
    Write-Host "❌ $file 缺失" -ForegroundColor Red
  }
}
```

---

## 🔧 常见问题解答

### Q1: Sharp 安装失败怎么办？

**A**: 尝试以下方法:
```bash
# 方法 1: 使用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install

# 方法 2: 全局安装 sharp
npm install -g sharp
```

### Q2: 资源生成脚本报错怎么办？

**A**: 按顺序检查:
1. Node.js 版本 >= 16 (`node --version`)
2. npm 网络畅通
3. 有写入权限
4. 查看具体错误信息

### Q3: GTRS 配置校验失败？

**A**: 检查以下几点:
1. JSON 格式是否正确 (使用 JSON 验证器)
2. 资源路径是否真实存在
3. 路径格式是否为 `/themes/default/assets/` 开头

### Q4: 如何修改资源样式？

**A**: 编辑 `scripts/generate-resources.mjs` 中的绘制函数:
```javascript
// 例如：修改玩家飞机颜色
function drawPlayerPlane(x, y, w, h) {
  // 修改这里的颜色值
  return rgba(59, 130, 246, 255); // 改为蓝色
}
```

---

## 📚 下一步学习路径

### 第 1 天：理解设计文档
- [ ] 阅读 [game-design.md](./game-design.md)
- [ ] 理解游戏参数和规则
- [ ] 熟悉 GTRS Schema

### 第 2 天：研究参考代码
- [ ] 分析贪吃蛇的 PhaserGame.ts
- [ ] 理解资源加载机制
- [ ] 学习状态管理模式

### 第 3 天：开始编码实现
- [ ] 创建 PlaneShooterScene.ts
- [ ] 实现玩家控制逻辑
- [ ] 添加敌机生成系统

### 第 4 天：完善游戏功能
- [ ] 实现碰撞检测
- [ ] 添加道具系统
- [ ] 实现得分和 UI

### 第 5 天：测试和优化
- [ ] 功能测试
- [ ] 性能优化
- [ ] Bug 修复

---

## 🎯 成功标志

当你看到以下输出时，说明资源生成成功:

```
========================================
🎉 所有资源生成成功！

📂 输出位置:
  - 公共资源：public/themes/default
  - 配置文件：src/config

下一步操作:
  1. 复制 plane-shooter-vue3 整个项目目录
  2. 修改 package.json 中的游戏名称
  3. 实现 Phaser 游戏逻辑
  4. 执行 register-game.sql 注册到数据库
========================================
```

---

## 📞 获取帮助

### 文档资源
- 📖 [完整 README](./README.md)
- 📋 [资源清单](./resource-list.md)
- 🎮 [游戏设计文档](./game-design.md)
- ✨ [阶段总结](./PHASE_1_2_COMPLETE.md)

### 参考项目
- 🐍 [贪吃蛇实现](../snake-vue3/)
- 📚 [游戏开发规范](../../../GAME_DEVELOPMENT_STANDARD.md)

### 技术栈文档
- [Vue 3](https://vuejs.org/)
- [Phaser 3](https://photonstorm.github.io/phaser3-docs/)
- [Sharp](https://sharp.pixelplumbing.com/)

---

**最后更新**: 2026-03-26  
**适用版本**: v1.0.0
