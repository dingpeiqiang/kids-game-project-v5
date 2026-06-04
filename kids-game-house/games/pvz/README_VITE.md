# PVZ Game - Vite 优化版本

这是一个使用 Phaser 框架开发的植物大战僵尸简化版游戏，已优化为使用 Vite 构建系统。

## 项目结构

```
pvz/
├── src/                  # 源代码目录
│   ├── main.js          # 游戏入口文件
│   ├── states/          # 游戏状态文件
│   │   ├── boot.js      # 启动状态
│   │   ├── title.js     # 标题状态
│   │   ├── play.js      # 游戏状态
│   │   └── over.js      # 结束状态
│   └── models/          # 游戏模型文件
│       ├── pea.js       # 豌豆射手子弹
│       ├── plant.js     # 植物模型
│       └── zombie.js    # 僵尸模型
├── assets/              # 游戏资源文件
│   ├── audio/           # 音频文件
│   ├── sprites.png      # 精灵图集
│   └── sprites.json     # 精灵图集配置
├── index.html           # HTML 入口文件
├── vite.config.js       # Vite 配置文件
└── package.json         # 项目配置文件
```

## 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

游戏将在 http://localhost:3000 启动，并自动打开浏览器。

### 3. 构建生产版本
```bash
npm run build
```

### 4. 预览生产版本
```bash
npm run preview
```

## 游戏说明

- 点击屏幕开始游戏
- 点击草地放置植物
- 植物会自动射击接近的僵尸
- 如果僵尸到达左侧边界，游戏结束

## 技术栈

- **Phaser 3.60.0**: 游戏框架（最新版本）
- **Vite**: 构建工具和开发服务器
- **JavaScript (ES6+)**: 编程语言（从 CoffeeScript 转换）

### 🎉 Phaser 3 升级完成

本项目已成功从 Phaser 2 升级到 Phaser 3，带来以下优势：
- ✅ 现代化 Scene 系统替代旧的 State 系统
- ✅ 完整的 ES Modules 支持
- ✅ 更好的性能和 WebGL 渲染
- ✅ 活跃的社区和持续维护

详细升级报告请查看：
- [PHASER3_UPGRADE_REPORT.md](PHASER3_UPGRADE_REPORT.md) - 完整升级报告
- [PHASER3_MIGRATION_GUIDE.md](PHASER3_MIGRATION_GUIDE.md) - 快速迁移指南

## 优化内容

1. **构建系统迁移**: 从 Grunt 迁移到 Vite，提供更快的开发体验
2. **代码现代化**: 将 CoffeeScript 转换为现代 JavaScript
3. **模块化结构**: 使用 ES6 模块系统组织代码
4. **开发体验**: 支持热模块替换和快速重载
5. **依赖管理**: 简化的依赖配置

## 调试功能

- Vite 提供强大的开发者工具
- 支持源代码映射
- 实时错误显示
- 快速的热更新

## 注意事项

- 确保所有资源文件路径正确
- 游戏需要现代浏览器支持
- 音频文件可能需要用户交互后才能播放