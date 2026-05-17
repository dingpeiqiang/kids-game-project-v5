# 超级玛丽Web版

<a href="https://ffx0s.github.io/mario-html5/dist/" target="_blank">https://ffx0s.github.io/mario-html5/dist/</a>

<br />
<img src="https://static.webfed.cn/Xnip2020-12-31_22-49-39.jpg">
<br />
<br />

## 🚀 快速开始

### 使用 Vite（推荐）

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

开发服务器将在 http://localhost:3000 启动。

### 使用 Webpack（兼容模式）

```bash
# 启动开发服务器
npm run start

# 构建生产版本
npm run build:webpack
```

## 📚 文档

- [Vite 配置说明](./VITE_SETUP.md) - 详细的 Vite 使用指南
- [快速参考](./QUICK_REFERENCE.md) - 常用命令和配置
- [迁移报告](./MARIO_VITE_MIGRATION_COMPLETE.md) - 完整的迁移细节

## ✨ 特性

- 🎮 基于 Phaser 3 游戏引擎
- 💻 TypeScript 类型安全
- ⚡ Vite 极速开发体验
- 🔥 即时热模块替换（HMR）
- 📦 优化的生产构建
- 🎯 像素级精确渲染

## 🛠️ 技术栈

- **Phaser 3.52.0** - HTML5 游戏框架（**版本已锁定**）
- **TypeScript ES2015** - 类型系统（**编译目标: ES2015**，支持依赖注入）
- **Vite 5.4.21** - 构建工具
- **Webpack 4.43.0** - 备选构建工具
- **tsyringe** - 依赖注入容器

### ⚠️ 重要提示

**不要升级 Phaser 版本！** 本项目使用 Phaser 3.52.0 的特定 API，在更高版本中已被移除。

**TypeScript 配置**：编译目标必须为 ES2015+，以支持 tsyringe 依赖注入。

详细信息请查看：
- [PHASER_VERSION_NOTE.md](./PHASER_VERSION_NOTE.md) - Phaser 版本说明
- [TYPESCRIPT_CONFIG_NOTE.md](./TYPESCRIPT_CONFIG_NOTE.md) - TypeScript 配置说明
