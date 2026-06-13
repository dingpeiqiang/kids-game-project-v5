# 独立游戏部署指南

## 概述

Kids Game House 是独立的游戏部署中心，包含多款小游戏，支持独立开发和部署。

## 目录结构

```
kids-game-house/
├── snake-vue3/              # 贪吃蛇大冒险
│   ├── src/                 # 源代码
│   ├── public/              # 公共资源
│   ├── package.json         # 依赖配置
│   └── vite.config.ts       # Vite 配置
├── plants-vs-zombie/        # 植物大战僵尸
│   ├── src/                 # 源代码
│   ├── public/              # 公共资源
│   ├── package.json         # 依赖配置
│   └── vite.config.ts       # Vite 配置
├── build-all-games.bat      # 构建所有游戏
├── start-all-games.bat      # 启动所有游戏
└── stop-all-games.bat       # 停止所有游戏
```

## 游戏列表

| 游戏代码 | 游戏名称 | 端口 | 访问地址 |
|---------|---------|------|----------|
| SNAKE_VUE3 | 贪吃蛇大冒险 | 3003 | http://localhost:3003 |
| PLANTS_VS_ZOMBIE | 植物大战僵尸 | 3004 | http://localhost:3004 |

## 快速开始

### 1. 数据库初始化

```bash
cd kids-game-backend
init-houses-games.bat
```

或在 MySQL 客户端执行：
```bash
mysql -u root -p kidgame < init-houses-games.sql
```

### 2. 安装依赖

```bash
cd kids-game-house
npm install
```

### 3. 启动游戏

**单独启动：**
```bash
cd kids-game-house/snake-vue3
npm run dev
```

**批量启动：**
```bash
cd kids-game-house
start-all-games.bat
```

## 平台通信

游戏与主平台通过 URL 参数和 postMessage 通信。

### URL 参数

| 参数 | 说明 | 示例 |
|------|------|------|
| session_id | 会话 ID | `?session_id=test123` |
| user_id | 用户 ID | `&user_id=001` |
| user_name | 用户名称 | `&user_name=小明` |

### 通信消息

```javascript
// 监听来自游戏的消息
window.addEventListener('message', (event) => {
  console.log('收到游戏消息:', event.data);
});

// 游戏发送的消息类型
const messageTypes = {
  GAME_LOADED: 'GAME_LOADED',     // 游戏加载完成
  GAME_START: 'GAME_START',       // 游戏开始
  GAME_OVER: 'GAME_OVER',         // 游戏结束
  GAME_ERROR: 'GAME_ERROR',       // 游戏错误
  SCORE_UPDATE: 'SCORE_UPDATE',   // 分数更新
};
```

## 添加新游戏

### 1. 创建游戏目录

```bash
cd kids-game-house
mkdir new-game
```

### 2. 初始化项目

```bash
cd new-game
npm init vue@latest
```

### 3. 配置端口

修改 `vite.config.ts`：
```typescript
export default defineConfig({
  server: {
    port: 3005  // 使用新端口
  }
})
```

### 4. 添加到数据库

修改 `init-houses-games.sql`，添加新的 INSERT 语句。

### 5. 重启后端

```bash
cd kids-game-backend
mvn spring-boot:run
```

## 测试指南

### 基础功能测试

- [ ] 依赖安装成功
- [ ] 单个游戏可以独立启动
- [ ] 所有游戏可以同时启动
- [ ] 游戏端口不冲突
- [ ] 游戏在浏览器中正常加载

### 平台通信测试

- [ ] URL 参数正确解析
- [ ] GAME_LOADED 消息正确发送
- [ ] GAME_OVER 消息正确发送

### iframe 嵌入测试

创建测试页面：
```html
<iframe
  src="http://localhost:3003?session_id=test&user_id=001"
  frameborder="0"
  allowfullscreen>
</iframe>
```

## 故障排查

### 端口被占用

```bash
# 查找占用端口的进程
netstat -ano | findstr :3003

# 结束进程
taskkill /PID <PID> /F
```

### 依赖安装失败

```bash
npm cache clean --force
rmdir /s /q node_modules
npm install
```

---

**版本**: v1.0.0
**最后更新**: 2026-03-20
