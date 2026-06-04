# Slots-Machine 快速启动指南

## 前置要求

- Node.js >= 16.0.0
- npm >= 7.0.0

## 安装依赖

```bash
npm install
```

## 开发模式

启动开发服务器（支持热更新）：

```bash
npm run dev
```

浏览器会自动打开 http://localhost:3005/

## 生产构建

生成优化的生产版本：

```bash
npm run build
```

构建产物会输出到 `dist/` 目录。

## 预览生产构建

在本地预览生产构建结果：

```bash
npm run preview
```

默认在 http://localhost:3006/ 打开。

## 清理构建

删除构建输出目录：

```bash
npm run clean
```

## 项目结构

```
slots-machine/
├── assets/           # 静态资源（图片、音频、字体等）
├── src/              # 游戏源代码
│   ├── base_classes/ # 基础类
│   ├── base_scenes/  # 游戏场景（Preload, Boot, Game）
│   ├── config.js     # Phaser 配置
│   ├── index.js      # 入口文件
│   └── options.js    # 游戏选项
├── dist/             # 构建输出（自动生成）
├── index.html        # HTML 模板
├── vite.config.js    # Vite 配置
└── package.json      # 项目配置
```

## 技术栈

- **Phaser 3.60.0**: 游戏引擎
- **Vite 4.5**: 构建工具
- **JavaScript (ES6+)**: 编程语言

## 常见问题

### 端口被占用

如果端口 3005 被占用，Vite 会自动尝试下一个可用端口。

### 资源加载失败

确保资源路径正确：
- HTML 中使用 `/css/style.css` 而不是 `/assets/css/style.css`
- JavaScript 中使用 `this.load.path = '/'` 

### 构建失败

尝试清理缓存后重新构建：

```bash
npm run clean
npm run build
```

## 更多信息

详细的迁移说明请查看 [VITE_MIGRATION.md](./VITE_MIGRATION.md)
