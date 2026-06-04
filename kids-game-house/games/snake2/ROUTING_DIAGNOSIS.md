# 🔧 路由问题诊断与解决方案

**版本**: v1.3.0  
**创建时间**: 2026-04-05  
**状态**: ✅ 诊断指南

---

## 🚨 问题现象

进入游戏后没有变化，可能的原因：

1. ❌ 路由配置错误
2. ❌ 访问路径不正确
3. ❌ 登录状态验证失败
4. ❌ 游戏资源加载失败

---

## 🔍 诊断步骤

### 步骤 1: 确认访问方式

#### 方式 A: 直接访问独立游戏

```bash
# 启动贪吃蛇独立项目
cd kids-game-house/games/snake
npm run dev

# 浏览器访问
http://localhost:3005/
```

**预期行为**:
- ✅ 显示开始界面（StartView）
- ✅ 点击"开始游戏" → 难度选择
- ✅ 选择难度 → 进入游戏 (`/game`)
- ✅ 游戏结束 → GameOverView

**路由流程**:
```
/ (开始) → /difficulty (难度) → /game (游戏) → /gameover (结束)
```

---

#### 方式 B: 通过主平台访问

```bash
# 启动主平台
cd kids-game-frontend
npm run dev

# 浏览器访问
http://localhost:5173/
```

**预期行为**:
- ✅ 登录后进入主平台
- ✅ 在游戏中心选择"贪吃蛇大冒险"
- ✅ 选择游戏模式（单人/本地对战）
- ✅ 进入游戏界面

**访问路径**:
```
主平台首页 → 游戏中心 → 贪吃蛇 → 游戏房间 → 游戏界面
```

---

### 步骤 2: 检查登录状态

贪吃蛇独立项目有登录验证：

```typescript
// router/index.ts
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (!token) {
    // 跳转到主平台登录页
    window.location.href = `http://localhost:3000/login?redirect=${encodeURIComponent(currentPath)}`
    return
  }
  
  next()
})
```

**检查方法**:

1. 打开浏览器控制台 (F12)
2. 输入：
   ```javascript
   localStorage.getItem('token')
   ```
3. 如果返回 `null`，说明未登录

**解决方案**:
- 先访问主平台登录：`http://localhost:3000/login`
- 或使用测试 token（如果有）

---

### 步骤 3: 查看路由配置

#### 独立游戏路由

文件位置：
```
kids-game-house/games/snake/src/router/index.ts
```

当前配置：
```typescript
const routes = [
  { path: '/', name: 'start', component: StartView },
  { path: '/difficulty', name: 'difficulty', component: DifficultyView },
  { path: '/game', name: 'game', component: SnakeGame },
  { path: '/gameover', name: 'gameover', component: GameOverView }
]
```

**验证**:
- ✅ 路由配置正确
- ✅ 组件路径正确
- ✅ 没有路由冲突

---

### 步骤 4: 检查控制台错误

打开浏览器控制台 (F12)，查看是否有以下错误：

#### 常见错误及解决方案

**错误 1**: `Uncaught SyntaxError: Cannot find module`
```
原因：组件导入路径错误
解决：检查 import 路径是否正确
```

**错误 2**: `Failed to load resource: net::ERR_CONNECTION_REFUSED`
```
原因：后端服务未启动
解决：启动后端服务器（端口 3000）
```

**错误 3**: `User denied Geolocation` 或权限相关
```
原因：浏览器权限被拒绝
解决：允许必要权限或检查代码逻辑
```

**错误 4**: `Cannot get /game` (404)
```
原因：Vite 开发服务器问题
解决：重启 npm run dev
```

---

## 💡 解决方案汇总

### 方案 1: 清除缓存重新访问

```bash
# 1. 清除浏览器缓存
Ctrl + Shift + Delete

# 2. 清除 localStorage
// 在控制台执行
localStorage.clear()

# 3. 硬刷新页面
Ctrl + F5
```

---

### 方案 2: 检查端口占用

```powershell
# Windows - 查看端口占用
netstat -ano | findstr :3005

# 如果被占用，杀掉进程或换端口
taskkill /F /PID <进程 ID>

# 或修改 vite.config.ts
server: {
  port: 3006  # 换一个端口
}
```

---

### 方案 3: 重新安装依赖

```bash
# 删除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 重新启动
npm run dev
```

---

### 方案 4: 检查 TypeScript 编译

```bash
# 运行类型检查
npm run type-check

# 如果有错误，修复后重试
```

---

### 方案 5: 查看详细日志

在 `vite.config.ts` 中添加调试信息：

```typescript
export default defineConfig({
  // ...
  server: {
    port: 3005,
    host: true,
    hmr: {
      overlay: true,
      clientPort: 3005  // 明确指定 HMR 端口
    }
  },
  // 添加自定义插件输出日志
  plugins: [
    vue(),
    {
      name: 'debug-plugin',
      configureServer(server) {
        server.httpServer?.on('listening', () => {
          console.log('🎮 贪吃蛇服务器已启动：http://localhost:3005')
        })
      }
    }
  ]
})
```

---

## 🎯 快速测试方法

### 测试 1: 最简方式（绕过登录）

临时移除路由守卫，直接测试游戏：

```typescript
// src/router/index.ts
router.beforeEach((to, from, next) => {
  // ⭐ 临时注释掉登录检查
  // const token = localStorage.getItem('token')
  // if (!token) { ... }
  
  next()  // 直接放行
})
```

**注意**: 仅用于测试，不要提交到生产环境！

---

### 测试 2: 使用 Postman 测试 API

如果怀疑是后端问题：

```bash
# 测试后端是否正常运行
GET http://localhost:3000/api/health

# 预期响应
{ "status": "ok", "message": "服务正常" }
```

---

### 测试 3: 单独测试游戏组件

创建测试页面直接加载游戏：

```html
<!-- test-game.html -->
<!DOCTYPE html>
<html>
<head>
  <title>游戏测试</title>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    import { createApp } from 'vue'
    import SnakeGame from './src/components/game/SnakeGame.vue'
    
    const app = createApp(SnakeGame)
    app.mount('#app')
  </script>
</body>
</html>
```

---

## 📊 完整诊断清单

按顺序检查以下各项：

### 基础检查
- [ ] Node.js 版本 >= 18.x
- [ ] npm 版本 >= 9.x
- [ ] 依赖已安装 (`node_modules` 存在)
- [ ] 开发服务器已启动 (`npm run dev`)

### 网络检查
- [ ] 端口 3005 可访问
- [ ] 没有被防火墙阻止
- [ ] localhost 解析正常

### 登录检查
- [ ] localStorage 中有 token
- [ ] token 格式正确
- [ ] 后端服务正常运行（端口 3000）

### 路由检查
- [ ] router/index.ts 配置正确
- [ ] 所有组件文件存在
- [ ] import 路径正确

### 资源检查
- [ ] Phaser 已正确加载（CDN 或本地）
- [ ] 图片资源存在
- [ ] 音频资源存在

### 浏览器检查
- [ ] 使用现代浏览器（Chrome/Firefox/Edge）
- [ ] JavaScript 已启用
- [ ] 没有安装阻止脚本的扩展

---

## 🔗 相关文档

- 📖 [QUICK_TEST_START.md](./QUICK_TEST_START.md) - 快速测试指南
- 📖 [PORT_CONFIGURATION.md](./PORT_CONFIGURATION.md) - 端口配置说明
- 📖 [MANUAL_TESTING_CHECKLIST.md](./MANUAL_TESTING_CHECKLIST.md) - 手动测试清单
- 📖 [TESTING_GUIDE.md](./TESTING_GUIDE.md) - 完整测试指南

---

## 💬 获取帮助

如果以上方法都无法解决：

1. **查看完整日志**:
   ```bash
   npm run dev -- --debug
   ```

2. **检查系统信息**:
   ```bash
   node -v
   npm -v
   echo $PATH  # Linux/Mac
   echo %PATH% # Windows
   ```

3. **提供以下信息**:
   - 操作系统版本
   - Node.js 版本
   - 浏览器版本
   - 完整的错误信息
   - 已尝试的解决方案

---

**最后更新**: 2026-04-05  
**维护者**: GCRS 开发团队  
**版本**: v1.3.0
