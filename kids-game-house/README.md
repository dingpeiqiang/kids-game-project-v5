# Kids Game House - 独立游戏部署中心

这里是儿童游戏平台的独立游戏部署目录，每个游戏都可以独立开发、测试和部署。

## 📁 目录结构

```
kids-game-house/
├── chromosome/           # 超级染色体游戏
│   ├── src/            # 源代码
│   ├── dist/           # 构建产物
│   ├── package.json    # 依赖配置
│   ├── vite.config.ts  # Vite 配置
│   └── tsconfig.json   # TypeScript 配置
├── plane-shooter/      # 飞机大战游戏
├── snake-vue3/        # 贪吃蛇游戏
├── start-all-games.bat        # 启动所有游戏
├── stop-all-games.bat         # 停止所有游戏
├── install-dependencies.bat   # 安装所有依赖
├── build-all-games.bat        # 构建所有游戏
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
install-dependencies.bat
```

### 2. 启动所有游戏（开发模式）

```bash
start-all-games.bat
```

### 3. 访问游戏

- 超级染色体: http://localhost:3001
- 飞机大战:   http://localhost:3002
- 贪吃蛇:     http://localhost:3003

### 4. 构建生产版本

```bash
build-all-games.bat
```

## 🎮 单个游戏操作

### 贪吃蛇

```bash
# 安装依赖
cd snake-vue3
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 🔗 与平台集成

每个游戏都支持通过 URL 参数接收平台传递的信息：

### URL 参数格式

```
http://localhost:3001?session_id={sessionId}&user_id={userId}&user_name={userName}&game_config={configJson}
```

### 参数说明

- `session_id`: 游戏会话ID（必填）
- `user_id`: 用户ID（必填）
- `user_name`: 用户名（可选，默认"玩家"）
- `game_config`: 游戏配置（JSON格式，URL编码）

### 消息通信

游戏通过 `postMessage` 与平台通信：

**游戏 → 平台**

```javascript
// 游戏加载完成
window.parent.postMessage({
  type: 'GAME_LOADED',
  sessionId: sessionId
}, '*')

// 游戏状态更新
window.parent.postMessage({
  type: 'GAME_STATUS',
  sessionId: sessionId,
  data: {
    status: 'playing',
    currentScore: 100,
    timeElapsed: 60
  }
}, '*')

// 游戏结束
window.parent.postMessage({
  type: 'GAME_OVER',
  sessionId: sessionId,
  data: {
    score: 1000,
    duration: 120,
    status: 'completed'
  }
}, '*')

// 游戏错误
window.parent.postMessage({
  type: 'GAME_ERROR',
  sessionId: sessionId,
  data: {
    error: '错误信息',
    details: {},
    timestamp: Date.now()
  }
}, '*')
```

**平台 → 游戏**

```javascript
// 退出游戏
window.postMessage({
  type: 'COMMAND',
  action: 'EXIT',
  data: {}
}, '*')
```

## 📦 部署指南

### 开发环境

1. 运行 `start-all-games.bat` 启动所有游戏
2. 在前端平台中更新游戏 URL 为 `http://localhost:3001` 等

### 生产环境

1. 运行 `build-all-games.bat` 构建所有游戏
2. 将各游戏 `dist` 目录部署到 Web 服务器
3. 在前端平台中更新游戏 URL 为生产环境地址

## 🔧 开发规范

### 游戏结构要求

每个游戏必须包含：

1. **主入口文件** (`src/main.ts`)
   - 初始化 Vue 应用
   - 初始化平台通信桥

2. **根组件** (`src/App.vue`)
   - 游戏容器
   - 平台通信初始化
   - 游戏生命周期管理

3. **游戏类** (`src/game/Game.ts`)
   - 游戏核心逻辑
   - Phaser 游戏实例管理

4. **平台通信桥** (`src/utils/PlatformBridge.ts`)
   - 与平台通信
   - 消息处理
   - 数据上报

### 端口分配

- 超级染色体: 3001
- 飞机大战: 3002
- 贪吃蛇: 3003
- 新游戏: 从 3004 开始

## 🎯 未来扩展

添加新游戏时：

1. 在 `kids-game-house` 创建新的游戏目录
2. 复制现有游戏的配置文件（package.json, vite.config.ts 等）
3. 按照游戏结构要求创建必要文件
4. 更新 `start-all-games.bat` 添加新游戏启动命令
5. 更新 `install-dependencies.bat` 添加新游戏依赖安装
6. 更新 `build-all-games.bat` 添加新游戏构建命令

## 📝 注意事项

1. 确保所有游戏使用不同的端口
2. 每个游戏都应该是完全独立的，不依赖其他游戏
3. 游戏通过 URL 参数和 postMessage 与平台通信
4. 游戏应该完全控制自己的 UI 和交互逻辑
5. 平台只负责接收游戏数据，不控制游戏流程

## 🐛 常见问题

### 游戏无法启动

- 检查端口是否被占用
- 运行 `install-dependencies.bat` 重新安装依赖
- 清除缓存：删除 `node_modules` 和 `.vite` 目录

### 与平台通信失败

- 检查 URL 参数是否正确传递
- 查看浏览器控制台是否有跨域错误
- 确保平台和游戏在相同的域名下（或配置 CORS）

## 📄 许可证

Copyright © 2024 Kids Game Platform
