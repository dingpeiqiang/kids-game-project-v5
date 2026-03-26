# 🎯 混合架构快速参考卡

## 📋 核心概念

**混合架构 = 开发独立部署 + 生产灵活部署**

| 环境 | 部署方式 | 优势 |
|------|---------|------|
| **开发** | 独立部署（每个游戏独立端口） | 热重载、快速迭代、故障隔离 |
| **生产** | 可选择整合或分离 | 用户体验、运维简化、CDN 加速 |

---

## 🚀 一键启动

### 开发模式
```bash
start-dev-all.bat
```
- ✅ 自动启动后端、前端、所有游戏
- 🌐 访问：http://localhost:5173

### 生产构建
```bash
build-production.bat
```
- 📦 构建并整合所有游戏到 frontend
- 📁 输出：`kids-game-frontend/dist/`

### 清理构建
```bash
cleanup-build.bat
```
- 🧹 清理所有构建产物和缓存

---

## 🔧 核心组件

### 1. GameContainer 组件
**位置**: `kids-game-frontend/src/components/game/GameContainer.vue`

**功能**:
- 🎯 智能路由：自动选择游戏 URL
- 💬 统一消息通信
- ⚠️ 错误处理和加载提示

**使用示例**:
```vue
<template>
  <GameContainer 
    game-code="SNAKE_VUE3"
    @game-loaded="handleLoaded"
    @game-error="handleError"
    @game-exit="handleExit"
  />
</template>
```

---

## 📊 游戏端口映射

| 游戏代码 | 游戏名称 | 开发端口 | 生产路径 |
|---------|---------|---------|---------|
| SNAKE_VUE3 | 贪吃蛇 | 3003 | /games/snake-vue3/ |
| PLANE_SHOOTER | 飞机大战 | 3002 | /games/plane-shooter/ |
| CHROMOSOME | 染色体 | 3001 | /games/chromosome/ |
| PLANTS_VS_ZOMBIE | 植物大战僵尸 | 3004 | /games/plants-vs-zombie/ |

---

## 🏗️ 架构图

```
┌─────────────────────────────────────┐
│   kids-game-frontend (主平台)       │
│   Port: 5173                        │
│                                     │
│   ┌──────────────────────┐          │
│   │ GameContainer        │          │
│   │ - 智能路由           │          │
│   │ - 消息通信           │          │
│   │ - 错误处理           │          │
│   └──────────────────────┘          │
└──────────────┬──────────────────────┘
               │ iframe + postMessage
               ↓
┌─────────────────────────────────────┐
│   kids-game-house (游戏屋)          │
│   ┌──────────┐ ┌──────────┐        │
│   │ Snake    │ │ Plane    │        │
│   │ :3003    │ │ :3002    │        │
│   └──────────┘ └──────────┘        │
│   ┌──────────┐ ┌──────────┐        │
│   │ Chromo.  │ │ PVZ      │        │
│   │ :3001    │ │ :3004    │        │
│   └──────────┘ └──────────┘        │
└─────────────────────────────────────┘
```

---

## 🎮 添加新游戏流程

### 1. 创建游戏
```bash
cd kids-game-house
npm create vite@latest my-game -- --template vue-ts
```

### 2. 集成框架
```bash
xcopy /E /I shared\game-framework my-game\src\framework
```

### 3. 配置端口
编辑 `GameContainer.vue`:
```typescript
const gamePortMap: Record<string, number> = {
  'MY_GAME': 3005, // 新增
};
```

### 4. 数据库注册
```sql
INSERT INTO game_info 
(game_code, game_name, category, grade, status) 
VALUES ('MY_GAME', '我的游戏', 'ACTION', 'ELEMENTARY', 1);
```

### 5. 测试
```bash
cd kids-game-house/my-game
npm run dev
# 访问 http://localhost:5173/game/MY_GAME
```

---

## 🔍 调试技巧

### 检查运行模式
```javascript
// 浏览器控制台
import.meta.env.DEV  // true = 开发，false = 生产
```

### 监听消息
```javascript
window.addEventListener('message', (e) => {
  console.log('收到消息:', e.data);
});
```

### 发送测试消息
```javascript
document.querySelector('iframe')
  .contentWindow.postMessage({
    type: 'COMMAND',
    action: 'EXIT'
  }, '*');
```

---

## 📦 Nginx 配置要点

### 整合部署（默认）
```nginx
location /games/ {
    root /var/www/kids-game-frontend/public;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### CDN 分离部署
```nginx
location /games/ {
    proxy_pass https://cdn.kidsgame.com/games/;
    expires 30d;
}
```

---

## ❓ 常见问题速查

### Q: 游戏无法加载？
- [ ] 检查游戏服务是否启动
- [ ] 验证端口是否被占用
- [ ] 查看 CORS 配置

### Q: 成绩无法提交？
- [ ] 确认 sessionId 已传递
- [ ] 检查后端 API 状态
- [ ] 查看网络请求日志

### Q: 切换环境后 URL 错误？
- [ ] 清除浏览器缓存
- [ ] 检查 `.env` 配置
- [ ] 重新构建项目

---

## 📝 环境变量配置

### 开发环境 (.env.development)
```bash
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
VITE_RESOURCE_URL=http://localhost:8080/resources
```

### 生产环境 (.env.production)
```bash
VITE_API_URL=https://api.kidsgame.com
VITE_WS_URL=wss://api.kidsgame.com
VITE_GAME_CDN_URL=https://cdn.kidsgame.com
```

---

## 🎯 最佳实践清单

### ✅ 推荐
- [x] 开发使用独立部署
- [x] 测试使用整合部署
- [x] 生产根据游戏大小选择
- [x] 优先使用 shared/framework
- [x] 统一错误处理

### ❌ 避免
- [ ] 直接共享状态
- [ ] 硬编码 URL
- [ ] 忽略错误处理
- [ ] 混用环境配置

---

## 📚 详细文档

- 📖 [混合架构完整指南](./HYBRID_ARCHITECTURE.md)
- 🔧 [Nginx 配置示例](../nginx.conf.example)
- 🎮 [游戏部署指南](../kids-game-house/README.md)

---

**最后更新**: 2026-03-25  
**维护者**: Kids Game Team
