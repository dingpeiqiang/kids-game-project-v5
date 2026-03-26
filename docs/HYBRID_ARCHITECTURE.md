# 混合架构部署指南

## 📋 概述

本项目采用**混合架构**，兼顾开发效率和统一部署的优势：

- **开发环境**：各游戏独立部署，热重载，快速迭代
- **生产环境**：可选择独立部署或整合部署，灵活配置

## 🏗️ 架构设计

### 核心组件

1. **GameContainer 组件** (`src/components/game/GameContainer.vue`)
   - 智能路由：根据环境自动选择游戏 URL
   - 统一接口：提供标准化的消息通信
   - 错误处理：完善的加载和错误提示

2. **Shared Framework** (`kids-game-house/shared/game-framework`)
   - 平台通信桥
   - 成绩上报接口
   - 统一状态管理

### 目录结构

```
kids-game-project-v5/
├── kids-game-frontend/          # 主平台
│   ├── src/
│   │   ├── components/game/
│   │   │   └── GameContainer.vue    # 🆕 统一游戏容器
│   │   └── core/config/
│   │       └── env.ts               # 环境配置
├── kids-game-house/               # 游戏屋（独立部署）
│   ├── snake-vue3/                # 贪吃蛇 (Port 3003)
│   ├── plane-shooter/             # 飞机大战 (Port 3002)
│   ├── chromosome/                # 染色体 (Port 3001)
│   └── shared/
│       └── game-framework/        # 共享框架
└── docs/
    └── HYBRID_ARCHITECTURE.md     # 🆕 本文档
```

## 🔧 配置说明

### 1. 开发环境配置

开发环境下，GameContainer 会自动使用独立部署的地址：

```typescript
// GameContainer.vue - getStandaloneGameUrl()
const gamePortMap: Record<string, number> = {
  'SNAKE_VUE3': 3003,
  'PLANE_SHOOTER': 3002,
  'CHROMOSOME': 3001,
  'PLANTS_VS_ZOMBIE': 3004,
};
```

**启动开发服务器：**

```bash
# 1. 启动后端
cd kids-game-backend
start-backend.bat

# 2. 启动主前端
cd kids-game-frontend
npm run dev

# 3. 启动所有游戏（独立部署）
cd kids-game-house
start-all-games.bat
```

**访问地址：**
- 主平台：http://localhost:5173
- 贪吃蛇：http://localhost:3003
- 飞机大战：http://localhost:3002
- 染色体：http://localhost:3001

### 2. 生产环境配置

生产环境有两种部署策略：

#### 策略 A：CDN 分离部署（推荐大型游戏）

**优点：**
- 游戏资源独立 CDN 加速
- 按需加载，不增加主包体积
- 各游戏可独立更新

**配置步骤：**

1. 设置环境变量：
```bash
# .env.production
VITE_GAME_CDN_URL=https://cdn.kidsgame.com
```

2. Nginx 配置：
```nginx
# 主平台
location / {
    proxy_pass http://localhost:5173;
}

# 游戏资源（反向代理到 CDN 或独立服务）
location /games/ {
    proxy_pass https://cdn.kidsgame.com/games/;
}
```

#### 策略 B：静态文件整合（推荐小型游戏）

**优点：**
- 统一部署，运维简单
- 无跨域问题
- 游戏切换流畅

**配置步骤：**

1. 使用构建脚本：
```bash
# 执行整合构建
cd kids-game-house
build-integrated-games.bat
```

2. 构建产物：
```
kids-game-frontend/public/games/
├── snake-vue3/
│   └── dist/
├── plane-shooter/
│   └── dist/
└── ...
```

## 🎮 游戏添加流程

### 1. 在 kids-game-house 创建新游戏

```bash
cd kids-game-house
npm create vite@latest my-new-game -- --template vue-ts
cd my-new-game
npm install
```

### 2. 集成共享框架

```bash
# 复制共享框架到游戏项目
xcopy /E /I ..\shared\game-framework src\framework

# 或使用 symbolic link（推荐）
mklink /D src\framework ..\shared\game-framework
```

### 3. 配置端口映射

编辑 `GameContainer.vue`：

```typescript
const gamePortMap: Record<string, number> = {
  // ... 现有游戏
  'MY_NEW_GAME': 3005, // 添加新游戏
};
```

### 4. 添加到数据库

```sql
INSERT INTO game_info (game_code, game_name, category, grade, status) 
VALUES ('MY_NEW_GAME', '我的新游戏', 'ACTION', 'ELEMENTARY', 1);
```

### 5. 测试

```bash
# 启动新游戏
cd kids-game-house/my-new-game
npm run dev

# 在主平台访问
http://localhost:5173/game/MY_NEW_GAME
```

## 📦 部署脚本

### 开发环境一键启动

```bash
# start-dev-all.bat
@echo off
echo Starting Kids Game Platform (Development Mode)...

# 1. 启动后端
start "Backend" cmd /k "cd kids-game-backend && start-backend.bat"
timeout /t 3

# 2. 启动主前端
start "Frontend" cmd /k "cd kids-game-frontend && npm run dev"
timeout /t 3

# 3. 启动所有游戏
start "Games" cmd /k "cd kids-game-house && start-all-games.bat"

echo All services started!
```

### 生产环境构建

```bash
# build-production.bat
@echo off
echo Building Kids Game Platform (Production Mode)...

# 1. 构建所有游戏
cd kids-game-house
call build-all-games.bat

# 2. 整合到 frontend
for %%d in (snake-vue3 plane-shooter chromosome) do (
  echo Integrating %%d...
  xcopy /E /I /Y %%d\dist ..\kids-game-frontend\public\games\%%d\
)

# 3. 构建主前端
cd ..\kids-game-frontend
npm run build

echo Build complete! Output: dist/
```

## 🔍 调试技巧

### 1. 检查运行模式

在浏览器控制台：

```javascript
// 查看当前环境
import.meta.env.DEV  // true = 开发环境，false = 生产环境

// 查看游戏 URL
console.log('[Debug] Game URL:', document.querySelector('iframe').src);
```

### 2. 跨域问题解决

**开发环境：**
- 确保所有游戏服务允许 CORS
- 检查 vite.config.ts 的 server.proxy 配置

**生产环境：**
- 使用同域名路径（整合部署）
- 配置正确的 CORS 头（分离部署）

### 3. 消息通信调试

```javascript
// 监听 postMessage
window.addEventListener('message', (event) => {
  console.log('[Message] Received:', event.data);
});

// 发送测试消息到游戏
document.querySelector('iframe').contentWindow.postMessage({
  type: 'COMMAND',
  action: 'EXIT'
}, '*');
```

## 📊 性能优化建议

### 1. 按需加载

```vue
<!-- 使用动态导入 -->
<script setup lang="ts">
const GameContainer = defineAsyncComponent(() => 
  import('@/components/game/GameContainer.vue')
);
</script>
```

### 2. 预加载策略

```html
<!-- 在首页预加载热门游戏 -->
<link rel="prefetch" href="/games/snake-vue3/">
<link rel="prefetch" href="/games/plane-shooter/">
```

### 3. CDN 缓存

```nginx
# Nginx 缓存配置
location /games/ {
  expires 30d;
  add_header Cache-Control "public, immutable";
}
```

## 🚀 最佳实践

### ✅ 推荐做法

1. **开发阶段**：使用独立部署，享受热重载
2. **测试阶段**：使用整合部署，模拟生产环境
3. **生产部署**：
   - 小型游戏 (< 2MB)：整合部署
   - 大型游戏 (> 5MB)：CDN 分离部署
4. **代码复用**：优先使用 shared/framework
5. **错误处理**：统一在 GameContainer 层处理

### ❌ 避免做法

1. ~~直接在游戏间共享状态~~（使用 postMessage）
2. ~~硬编码游戏 URL~~（使用 getGameUrl 方法）
3. ~~忽略错误处理~~（实现完善的错误提示）
4.~~混用开发和生产配置~~（严格区分环境）

## 🐛 常见问题

### Q1: 游戏无法加载？

**检查清单：**
- [ ] 游戏服务是否启动？
- [ ] 端口是否被占用？
- [ ] CORS 配置是否正确？
- [ ] 游戏代码是否匹配？

### Q2: 成绩无法提交？

**排查步骤：**
1. 检查 sessionId 是否传递
2. 验证后端 API 是否可用
3. 查看网络请求是否有误

### Q3: 切换环境后游戏 URL 错误？

**解决方案：**
- 清除浏览器缓存
- 检查 `.env` 文件配置
- 重新构建项目

## 📝 总结

混合架构结合了独立部署和统一部署的优势：

| 特性 | 开发环境 | 生产环境 |
|------|---------|---------|
| 部署方式 | 独立部署 | 灵活选择 |
| 热重载 | ✅ 支持 | ❌ 不支持 |
| 调试效率 | 高 | 中 |
| 部署复杂度 | 低 | 可选 |
| 用户体验 | 好 | 最优 |

通过 GameContainer 的智能路由，我们可以在不同环境下自动选择最优的部署策略，实现开发效率和用户体验的完美平衡！🎯
