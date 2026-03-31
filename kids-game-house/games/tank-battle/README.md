# 🎮 坦克大战 - 快速开始指南

## 📦 项目结构

```
tank-battle/
├── src/                      # 源代码目录
│   ├── scenes/              # Phaser 游戏场景
│   │   ├── GameScene.ts     # 基类场景
│   │   └── TankGameScene.ts # 坦克大战主场景
│   ├── views/               # Vue 组件
│   │   ├── LoadingView.vue  # 加载页面
│   │   ├── StartView.vue    # 开始页面
│   │   ├── DifficultyView.vue # 难度选择
│   │   ├── GameView.vue     # 游戏页面
│   │   └── GameOverView.vue # 结束页面
│   ├── stores/              # Pinia 状态管理
│   │   ├── game.ts         # 游戏状态
│   │   └── config.ts       # 配置状态
│   ├── router/             # 路由配置
│   │   └── index.ts
│   ├── config/             # 配置文件
│   │   └── GTRS.json       # 资源配置
│   ├── App.vue            # 根组件
│   └── main.ts            # 入口文件
├── public/                 # 静态资源
│   └── themes/            # 主题资源
│       └── tank_default/
│           └── assets/
│               ├── scene/  # 图片资源
│               └── audio/  # 音频资源
├── generate-resources.mjs  # 资源生成脚本
├── package.json           # 项目配置
├── vite.config.ts        # Vite 配置
├── tsconfig.json         # TypeScript 配置
└── README.md            # 本文件
```

---

## ⚡ 快速开始

### 步骤 1: 安装依赖

```bash
cd kids-game-house/games/tank-battle
npm install
```

**依赖说明**:
- Vue 3.4+
- Phaser 3.90+
- Pinia 2.1+
- Vue Router 4.2+
- TypeScript 5.3+
- Vite 5.0+
- Sharp (用于资源生成)

### 步骤 2: 生成资源文件

```bash
npm run generate:resources
```

这将自动生成所有游戏图片资源到 `public/themes/tank_default/assets/` 目录。

### 步骤 3: 启动开发服务器

```bash
npm run dev
```

浏览器会自动打开 http://localhost:5175

---

## 🎮 游戏操作

### 键盘控制
- **方向键 (↑↓←→)** 或 **WASD**: 移动坦克
- **空格键 (Space)** 或 **J 键**: 发射子弹
- **P 键** 或 **ESC**: 暂停/继续游戏

### 游戏目标
1. 消灭所有敌方坦克
2. 保护基地不被摧毁
3. 获得最高分数

---

## 🛠️ 开发工具

### 生成资源
```bash
npm run generate:resources
```

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

---

## 📋 游戏特性

### 难度系统
- **简单**: 5 个敌人，慢速，5 条生命
- **中等**: 10 个敌人，正常速度，3 条生命，限时 180 秒
- **困难**: 15 个敌人，快速，2 条生命，限时 120 秒
- **专家**: 20 个敌人，超快速，1 条生命，限时 90 秒

### 游戏元素
- 🎯 玩家坦克（蓝色）
- 👾 三种敌人坦克（红/黄/深红）
- 🧱 可摧毁的砖墙
- ⬜ 不可摧毁的钢墙
- 🏠 基地（需要保护）
- 💥 爆炸特效
- ⭐ 道具系统（扩展功能）

---

## 🔧 自定义配置

### 修改 GTRS 配置

编辑 `src/config/GTRS.json` 可以调整：
- 主题颜色
- 资源路径
- 全局样式

### 修改游戏参数

编辑 `src/stores/config.ts` 中的 `DIFFICULTY_PRESETS`:

```typescript
{
  key: 'custom',
  name: '自定义',
  enemyCount: 12,
  spawnInterval: 2200,
  enemySpeed: 220,
  timeLimit: 150,
  playerLives: 4,
}
```

---

## 🐛 常见问题

### Q1: 游戏画面空白？
**A**: 检查控制台是否有错误，确认资源已正确生成。

### Q2: 无法移动或射击？
**A**: 确认游戏窗口已获得焦点，点击游戏画布激活键盘输入。

### Q3: 资源加载失败？
**A**: 运行 `npm run generate:resources` 重新生成资源。

### Q4: TypeScript 报错？
**A**: 这些是类型检查错误，不影响运行。安装完整依赖后会消失。

---

## 📞 技术支持

遇到问题时的排查顺序：

1. **检查 Node.js 版本**: 确保 >= 18.x
2. **清理缓存**: 
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. **查看控制台**: 打开浏览器开发者工具查看错误
4. **验证文件完整性**: 确认所有必需文件都已创建

---

## 🎯 下一步优化

### P1 - 增强功能
- [ ] 添加真实的音频文件
- [ ] 实现双人合作模式
- [ ] 添加更多关卡设计
- [ ] 实现 Boss 战

### P2 - 性能优化
- [ ] 对象池优化子弹管理
- [ ] 资源预加载优化
- [ ] 碰撞检测优化

### P3 - 视觉效果
- [ ] 更精细的坦克动画
- [ ] 粒子系统增强
- [ ] 动态光影效果

---

## 📄 许可证

本项目为学习交流使用，请勿用于商业用途。

---

**🎊 祝你游戏愉快！**

*最后更新：2026-03-31*  
*版本：1.0.0*
