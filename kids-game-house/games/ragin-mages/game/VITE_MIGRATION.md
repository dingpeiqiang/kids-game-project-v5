# Ragin' Mages - Vite 版本

## 项目说明

本项目已从 Gulp + Browserify 迁移到 Vite 构建系统，提供更快的开发体验和更好的模块化支持。

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式启动

```bash
npm start
```

开发服务器将在 http://localhost:3006 启动，并自动打开浏览器。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `build` 目录。

### 预览生产构建

```bash
npm run preview
```

## 主要变更

### 1. 构建工具迁移
- **之前**: Gulp + Browserify + Babel
- **现在**: Vite

### 2. 模块系统
- 使用 ES Modules (ESM) 替代 CommonJS
- Phaser 和 Socket.IO 通过 npm 包导入

### 3. 依赖更新
- 移除了所有 Gulp 相关插件
- 添加了 `vite`、`socket.io-client`、`eventemitter3`

### 4. 项目结构优化
- 静态资源移至 `public/` 目录
- 源代码保持在 `src/` 目录
- 构建输出到 `build/` 目录

### 5. 配置优化
- Vite 自动处理模块转换和热更新
- 配置了路径别名简化导入
- 优化了依赖预构建

## 技术栈

- **游戏引擎**: Phaser 3.3.0
- **实时通信**: Socket.IO Client 4.x
- **事件处理**: EventEmitter3 5.x
- **构建工具**: Vite 4.x

## 开发注意事项

1. **导入路径**: 使用配置的路径别名
   ```javascript
   import BootScene from 'scenes/BootScene';  // 自动解析到 src/js/scenes/BootScene
   ```

2. **CSS 导入**: 在 JS 文件中导入 CSS
   ```javascript
   import '../css/main.css';
   ```

3. **静态资源**: 放在 `public/` 目录的文件可以直接通过根路径访问
   ```html
   <link rel="icon" href="/favicon.ico">
   ```

4. **Socket.IO**: 已从全局 `io` 改为模块导入
   ```javascript
   import io from 'socket.io-client';
   ```

## 端口配置

开发服务器默认运行在 **3006** 端口。如需修改，请编辑 `vite.config.js` 中的 `server.port` 配置。

## 故障排除

### 问题: 模块找不到
确保已运行 `npm install` 安装所有依赖。

### 问题: 端口被占用
修改 `vite.config.js` 中的 `server.port` 为其他可用端口。

### 问题: 热更新不工作
清除浏览器缓存或重启开发服务器。

## 迁移参考

如需了解从 Gulp 迁移到 Vite 的详细信息，请参考项目根目录的文档。
