# Slots-Machine Vite 优化说明

## 概述

Slots-Machine 游戏已从 Webpack 迁移到 Vite 构建系统，以获得更快的开发体验和更好的性能。

## 主要变更

### 1. 构建工具迁移
- **从**: Webpack 4 + babel-loader
- **到**: Vite 4.5

### 2. 依赖更新
- **Phaser**: 从 `3.15.1` 升级到 `^3.60.0`
- **移除**: 所有 Webpack 相关依赖（babel-loader, webpack, webpack-cli, webpack-dev-server 等）
- **新增**: 
  - `vite@^4.5.0`
  - `terser@^5.26.0` (用于代码压缩)
  - `rimraf@^5.0.5` (用于清理构建目录)

### 3. 脚本命令更新

#### 开发模式
```bash
npm run dev
```
- 启动 Vite 开发服务器
- 默认端口: 3005
- 支持热模块替换 (HMR)
- 自动打开浏览器

#### 生产构建
```bash
npm run build
```
- 生成优化的生产构建
- 输出目录: `dist/`
- 代码分割和压缩

#### 预览生产构建
```bash
npm run preview
```
- 在本地预览生产构建
- 默认端口: 3006

#### 清理构建
```bash
npm run clean
```
- 删除 `dist/` 目录

### 4. 配置文件

#### vite.config.js
- **publicDir**: 设置为 `assets`，使静态资源可直接访问
- **assetsInclude**: 包含所有游戏资源文件类型（图片、音频、字体等）
- **server**: 
  - 端口: 3005
  - 主机: true (允许外部访问)
  - 自动打开浏览器
  - HMR 启用
- **build**:
  - 目标: es2020
  - 代码分割: vendor-phaser chunk
  - 压缩: terser
  - Sourcemap: 禁用（生产环境）

### 5. 资源路径调整

由于 Vite 的 `publicDir` 配置，所有 assets 目录中的文件都会被复制到根目录：

#### HTML 文件
- `/assets/favicon.png` → `/favicon.png`
- `/assets/css/style.css` → `/css/style.css`

#### CSS 文件
- `url(../fonts/...)` → `url(/fonts/...)`

#### JavaScript 文件 (Preload.js)
- `this.load.path = '../../assets/'` → `this.load.path = '/'`

### 6. 目录结构

```
slots-machine/
├── assets/           # 公共资源目录（Vite publicDir）
│   ├── audio/        # 音频文件
│   ├── css/          # 样式文件
│   ├── fonts/        # 字体文件
│   └── images/       # 图片资源
├── src/              # 源代码
│   ├── base_classes/ # 基础类
│   ├── base_scenes/  # 游戏场景
│   ├── config.js     # Phaser 配置
│   ├── index.js      # 入口文件
│   └── options.js    # 游戏选项
├── dist/             # 构建输出（gitignore）
├── index.html        # HTML 模板
├── package.json      # 项目依赖
├── vite.config.js    # Vite 配置
└── .gitignore        # Git 忽略规则
```

## 优势

### 开发体验
1. **更快的启动速度**: Vite 使用原生 ES 模块，无需打包即可启动
2. **即时热更新**: HMR 响应速度更快
3. **按需编译**: 只编译请求的模块

### 生产构建
1. **优化的代码分割**: 自动将 Phaser 库分离为独立 chunk
2. **更好的压缩**: 使用 Terser 进行代码压缩
3. **更小的包体积**: 通过 tree-shaking 移除未使用的代码

### 维护性
1. **更少的配置**: Vite 开箱即用，配置更简单
2. **现代化工具链**: 使用最新的构建技术
3. **更好的生态系统**: Vite 插件生态丰富

## 注意事项

1. **Phaser 版本**: 已升级到 3.60.0，确保游戏逻辑与新版本兼容
2. **资源路径**: 所有资源路径已更新为 Vite 兼容格式
3. **浏览器兼容性**: 目标为 es2020，支持现代浏览器

## 故障排除

### 端口被占用
如果端口 3005 被占用，Vite 会自动尝试下一个可用端口（3006, 3007...）

### 资源加载失败
检查控制台是否有资源路径相关的警告，确保路径以 `/` 开头

### 构建错误
运行 `npm run clean` 清理构建缓存后重新构建

## 迁移完成日期

2026-04-10
