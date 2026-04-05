# Mario Game - Vite 配置说明

## 概述

Mario 游戏现已支持 Vite 构建工具，提供更快的开发体验和更高效的构建性能。

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

启动开发服务器（支持热模块替换 HMR）：

```bash
npm run dev
```

开发服务器将在 http://localhost:3000 启动，并自动打开浏览器。

### 构建生产版本

```bash
npm run build
```

构建后的文件将输出到 `dist` 目录。

### 预览生产构建

```bash
npm run preview
```

## 主要改进

### 1. 更快的启动速度
- Vite 基于原生 ES 模块，无需打包即可启动开发服务器
- 冷启动时间从数秒降低到毫秒级

### 2. 即时热模块替换（HMR）
- 代码修改后立即反映在浏览器中，无需刷新页面
- 保持应用状态，提高开发效率

### 3. 优化的构建性能
- 使用 Rollup 进行生产构建，生成更优化的代码
- 更好的代码分割和树摇（tree-shaking）

### 4. 简化的配置
- 配置文件更简洁易懂
- 开箱即用的 TypeScript 支持

## 项目结构

```
mario/
├── src/
│   ├── scripts/        # TypeScript 源代码
│   │   ├── scenes/     # 游戏场景
│   │   └── game.ts     # 游戏入口
│   ├── assets/         # 游戏资源（图片、音频等）
│   └── index.html      # HTML 模板
├── dist/               # 构建输出目录
├── vite.config.ts      # Vite 配置文件
├── package.json        # 项目依赖和脚本
└── tsconfig.json       # TypeScript 配置
```

## 兼容性说明

### 保留 Webpack 配置

为了向后兼容，原有的 Webpack 配置仍然保留：

```bash
# 使用 Webpack 启动开发服务器
npm run start

# 使用 Webpack 构建
npm run build:webpack
```

### 迁移注意事项

1. **HTML 模板**：已移除 HtmlWebpackPlugin 的模板语法，改用标准 HTML
2. **模块加载**：移除了 `window.addEventListener('load')` 包装，Vite 会自动处理
3. **资源路径**：使用绝对路径（如 `/favicon.ico`）而非相对路径

## 技术栈

- **Phaser 3.52.0**: 游戏引擎（**版本已锁定**，避免 API 兼容性问题）
- **TypeScript**: 类型安全的 JavaScript 超集（**目标: ES2015**，支持装饰器和依赖注入）
- **Vite**: 下一代前端构建工具
- **Rollup**: 生产环境打包工具
- **tsyringe**: 依赖注入容器

### ⚠️ 重要说明：Phaser 版本锁定

本项目使用 Phaser 3.52.0 的特定 API（如 `ParticleEmitterManager`），该 API 在 Phaser 3.60+ 中已被移除。

**不要升级 Phaser 版本！** package.json 中已锁定版本：
```json
"phaser": "3.52.0"  // 注意：没有 ^ 前缀
```

如果需要升级到新版 Phaser，必须重写粒子系统代码。

### ⚠️ TypeScript 配置说明

**重要**：tsconfig.json 中的编译目标必须为 `ES2015` 或更高版本。

```json
{
  "compilerOptions": {
    "target": "ES2015",
    "module": "ESNext"
  }
}
```

**原因**：
- 项目使用 tsyringe 进行依赖注入
- tsyringe 需要使用 `new` 关键字实例化类
- ES5 编译会将类转换为函数，导致 "Class constructor cannot be invoked without 'new'" 错误
- ES2015+ 保持原生 class 语法，与 tsyringe 兼容

## 常见问题

### Q: 为什么选择 Vite？

A: Vite 提供了显著更好的开发体验：
- 更快的启动时间（毫秒级 vs 秒级）
- 即时的热模块替换
- 更简单的配置
- 更好的 TypeScript 支持

### Q: 我可以继续使用 Webpack 吗？

A: 可以。Webpack 配置仍然保留，你可以根据需要选择使用哪种构建工具。

### Q: 如何自定义 Vite 配置？

A: 编辑 `vite.config.ts` 文件。参考 [Vite 官方文档](https://vitejs.dev/config/) 了解更多配置选项。

## 开发建议

1. **使用现代浏览器**：Vite 开发服务器需要支持原生 ES 模块的浏览器
2. **启用 Source Maps**：已在配置中启用，便于调试
3. **利用 HMR**：修改代码后无需手动刷新，Vite 会自动更新

## 故障排除

### 端口被占用

如果 3000 端口被占用，可以在 `vite.config.ts` 中修改端口：

```typescript
server: {
  port: 8080,  // 修改为你想要的端口
}
```

### 缓存问题

如果遇到奇怪的错误，尝试清除缓存：

```bash
# 删除 node_modules 和锁文件
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

## 更多信息

- [Vite 官方文档](https://vitejs.dev/)
- [Phaser 3 文档](https://phaser.io/docs)
- [TypeScript 文档](https://www.typescriptlang.org/)
