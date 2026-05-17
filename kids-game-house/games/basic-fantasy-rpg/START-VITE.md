# 🚀 Basic Fantasy RPG - Vite 模式启动指南

## 快速启动

```bash
# 1. 进入游戏目录
cd kids-game-house/games/basic-fantasy-rpg

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

## 访问地址
- **游戏界面**: http://localhost:10003
- **Socket.IO 服务器**: http://localhost:8081 (可选，用于多人游戏)

## 主要文件说明

### 配置文件
- `vite.config.js` - Vite 配置文件
- `package.json` - 项目配置 (已添加 Vite 脚本)

### 入口文件
- `index.html` - Vite 模式 HTML 入口
- `main.js` - Vite 模式 JavaScript 入口

### 原文件 (保持不变)
- `src/index.html` - Webpack HTML 模板
- `src/scripts/game.js` - Webpack JavaScript 入口
- `webpack/` - Webpack 配置文件

## 可用命令

| 命令 | 说明 | 端口 |
|------|------|------|
| `npm run dev` | 启动 Vite 开发服务器 | 10003 |
| `npm run build:vite` | Vite 生产构建 | - |
| `npm run preview` | 预览 Vite 构建结果 | 随机 |
| `npm start` | 启动 Webpack 开发服务器 | 8080 |
| `npm run build` | Webpack 生产构建 | - |
| `node server.js` | 启动 Socket.IO 服务器 | 8081 |

## 开发工作流

### 推荐方式 (Vite)
```bash
npm run dev
```
- ✅ 启动速度快
- ✅ 热更新支持
- ✅ 配置简单

### 备用方式 (Webpack)
```bash
npm start
```
- ⚠️ 启动速度较慢
- ⚠️ 配置复杂
- ✅ 完全兼容原项目

## 常见问题

### 1. 端口被占用
修改 `vite.config.js` 中的 `port` 配置:
```javascript
server: {
  port: 10004, // 改为其他端口
  // ...
}
```

### 2. 依赖安装失败
```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 3. 游戏资源加载失败
确保资源路径正确，游戏使用相对路径 `./assets/`，在 Vite 模式下应该正常工作。

### 4. Socket.IO 连接失败
如需多人游戏功能，需要启动 Socket.IO 服务器:
```bash
node server.js
```

## 性能对比

| 指标 | Vite 模式 | Webpack 模式 |
|------|-----------|-------------|
| 启动时间 | < 1秒 | 5-10秒 |
| 热更新速度 | 即时 | 较慢 |
| 构建速度 | 快 | 慢 |
| 内存占用 | 较低 | 较高 |

## 下一步

1. 运行 `npm run dev` 启动游戏
2. 打开浏览器访问 http://localhost:10003
3. 如需多人游戏，运行 `node server.js`
4. 开始开发游戏功能

---

**提示**: Vite 模式提供更快的开发体验，推荐日常开发使用。Webpack 模式作为备用方案保留。