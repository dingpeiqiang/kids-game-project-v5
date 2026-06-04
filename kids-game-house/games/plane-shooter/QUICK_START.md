# 🚀 飞机大战 - 快速启动指南

## ⚡ 30 秒快速开始

### 1️⃣ 进入项目目录
```bash
cd kids-game-house/games/plane-shooter
```

### 2️⃣ 安装依赖（首次运行）
```bash
npm install
```

### 3️⃣ 启动开发服务器
```bash
npm run dev
```

### 4️⃣ 打开浏览器
访问：**http://localhost:5173/**

---

## 🎮 游戏操作

### 键盘控制
- **方向键 ↑↓←→** 或 **WASD** - 移动飞机
- **自动射击** - 无需按键，自动发射

### 游戏规则
1. ✈️ 控制飞机左右上下移动
2. 🎯 自动射击击落敌机
3. 💥 躲避敌机子弹和撞击
4. 🎁 拾取掉落道具获得强化
5. ⏱️ 生存更长时间获得更高分数

---

## 🛠️ 常用命令

### 开发模式
```bash
npm run dev          # 启动开发服务器（热重载）
```

### 生成资源
```bash
npm run generate-resources   # 重新生成所有图片资源
```

### 构建生产版本
```bash
npm run build        # 构建发布版本
npm run preview      # 预览构建结果
```

---

## 📁 项目结构速览

```
plane-shooter/
├── src/
│   ├── scenes/PlaneShooterScene.ts    # 🎮 游戏核心逻辑
│   ├── components/game/PhaserGame.vue # 🖼️ 游戏容器
│   └── views/                         # 📄 页面视图
├── public/themes/                     # 🎨 资源文件
├── scripts/generate-resources.mjs     # 🖼️ 资源生成脚本
└── package.json                       # 📦 项目配置
```

---

## 🔧 快速修改

### 调整游戏难度
编辑 `src/scenes/PlaneShooterScene.ts` 第 95-102 行：
```typescript
if (difficultyValue === 'easy') {
  this.difficultyMultiplier = 0.8   // 简单模式速度
} else if (difficultyValue === 'hard') {
  this.difficultyMultiplier = 1.2   // 困难模式速度
}
```

### 修改射击间隔
编辑 `src/scenes/PlaneShooterScene.ts` 第 56 行：
```typescript
private shootInterval: number = 300  // 毫秒，越小越快
```

### 调整道具掉率
编辑 `src/scenes/PlaneShooterScene.ts` 第 52 行：
```typescript
private propDropChance: number = 0.15  // 15% 概率
```

---

## 🐛 常见问题

### Q: 游戏画面空白？
**A**: 检查控制台是否有错误，确认：
1. 资源文件存在（public/themes/...）
2. GTRS.json 配置正确
3. 浏览器支持 WebGL

### Q: 无法移动或射击？
**A**: 检查键盘输入是否正常，尝试：
1. 使用方向键或 WASD
2. 确保游戏窗口获得焦点
3. 检查控制台是否有输入错误

### Q: 如何重新生成资源？
**A**: 运行以下命令：
```bash
npm run generate-resources
```

---

## 📖 完整文档

- 📄 [README.md](./README.md) - 完整项目说明
- 📄 [GAME_DESIGN_DOCUMENT.md](./GAME_DESIGN_DOCUMENT.md) - 游戏设计文档
- 📄 [DEVELOPMENT_SUMMARY.md](./DEVELOPMENT_SUMMARY.md) - 开发总结

---

## 🎯 游戏技巧

### 得分技巧
- 🎯 优先击落中型和大型敌机（分数更高）
- 💎 尽量拾取所有道具
- ⏱️ 存活时间越长，难度越高，得分机会越多

### 生存技巧
- 🛡️ 合理使用道具（护盾挡致命伤害）
- 💗 保持生命值健康（及时拾取爱心）
- 🚀 不要贪分，躲避优先

---

## 🌟 游戏特色

✨ **程序化生成的精美资源** - 所有图片用代码绘制  
✨ **流畅的 60FPS 体验** - 基于 Phaser 3.90 引擎  
✨ **丰富的道具系统** - 4 种不同效果的道具  
✨ **动态难度递增** - 每 30 秒自动增加挑战性  
✨ **完整的音效支持** - 射击、爆炸、拾取等音效  

---

**祝你游戏愉快！🎮✨**

如有问题，请查看控制台日志或联系开发者。
