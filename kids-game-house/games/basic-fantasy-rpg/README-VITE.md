# Basic Fantasy RPG - Vite 模式

此游戏现已支持 Vite 开发模式，提供更快的启动速度和热更新功能。

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

开发服务器将在 http://localhost:10003 启动。

### 3. 构建生产版本
```bash
npm run build:vite
```

### 4. 预览构建结果
```bash
npm run preview
```

## 项目结构

```
basic-fantasy-rpg/
├── index.html          # 主 HTML 文件 (Vite 模式)
├── main.js            # 游戏入口文件 (Vite 模式)
├── vite.config.js     # Vite 配置文件
├── src/
│   ├── index.html     # 原 Webpack HTML 模板
│   ├── scripts/
│   │   ├── game.js    # 原游戏入口文件
│   │   └── scenes/    # 游戏场景
│   └── assets/        # 游戏资源
├── webpack/           # 原 Webpack 配置
└── package.json       # 项目配置
```

## 配置说明

### Vite 配置 (vite.config.js)
- 端口: 10003
- 代理: 支持 socket.io 到端口 8081
- 别名: `@` 指向 `src` 目录
- 公共目录: `src/assets`

### 游戏入口
Vite 模式使用 `main.js` 作为入口文件，支持热更新。

## 与原 Webpack 模式的对比

| 功能 | Webpack 模式 | Vite 模式 |
|------|-------------|-----------|
| 启动命令 | `npm start` | `npm run dev` |
| 构建命令 | `npm run build` | `npm run build:vite` |
| 热更新 | 支持 | 支持 |
| 启动速度 | 较慢 | 极快 |
| 配置文件 | webpack/ 目录 | vite.config.js |

## 注意事项

1. **端口冲突**: Vite 使用端口 10003，确保该端口未被占用
2. **Socket.IO 服务器**: 游戏需要 Socket.IO 服务器运行在端口 8081
3. **资源路径**: 所有资源路径已调整为相对路径，确保在 Vite 模式下正常工作
4. **兼容性**: 原 Webpack 配置仍然保留，可通过 `npm start` 启动

## 故障排除

### 1. 端口被占用
```bash
# 修改 vite.config.js 中的端口
port: 10004  # 或其他可用端口
```

### 2. 依赖安装失败
```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 3. 热更新不工作
检查浏览器控制台是否有错误，确保 `import.meta.hot` 支持正常。

## 开发建议

1. 使用 `npm run dev` 进行日常开发，享受快速的启动和热更新
2. 使用 `npm run build:vite` 构建生产版本
3. 如需测试原 Webpack 模式，仍可使用 `npm start`