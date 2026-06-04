# 端口配置说明

## 📊 正确的端口配置

根据 `vite.config.ts` 的实际配置：

| 服务 | 端口 | 配置文件 | 访问地址 |
|------|------|----------|----------|
| **主系统前端** | **3000** | `kids-game-frontend/vite.config.ts` (第18行) | http://localhost:3000 |
| **贪吃蛇游戏** | **3005** | `kids-game-house/snake-vue3/vite.config.ts` (第13行) | http://localhost:3005 |
| **后端 API** | 8080 | `application.yml` | http://localhost:8080 |
| **MySQL** | 3306 | 数据库配置 | localhost:3306 |

## 🔗 访问地址

### 主系统（端口 3000）
- **首页**：http://localhost:3000
- **登录页**：http://localhost:3000/login
- **儿童首页**：http://localhost:3000/home
- **家长管控**：http://localhost:3000/parent

### 贪吃蛇游戏（端口 3005）
- **游戏主页**：http://localhost:3005
- **游戏页面**：http://localhost:3005/game
- **难度选择**：http://localhost:3005/difficulty

### 后端 API（端口 8080）
- **API 文档**：http://localhost:8080/doc.html
- **主题列表**：http://localhost:8080/api/theme/list
- **游戏列表**：http://localhost:8080/api/game/list

## 🔄 用户访问流程

### 未登录用户访问贪吃蛇游戏

```
访问 http://localhost:3005 (贪吃蛇游戏)
  ↓
路由守卫检查 token（不存在）
  ↓
跳转到 http://localhost:3000/login?redirect=http://localhost:3005
  ↓
用户在主系统登录
  ↓
登录成功后跳转回 http://localhost:3005
```

### 已登录用户访问贪吃蛇游戏

```
访问 http://localhost:3005 (贪吃蛇游戏)
  ↓
路由守卫检查 token（存在）
  ↓
继续访问，加载主题
  ↓
调用 http://localhost:8080/api/theme/list
  ↓
正常显示游戏
```

## 🚀 启动服务

### 启动主系统
```bash
cd kids-game-frontend
npm run dev
# 访问 http://localhost:3000
```

### 启动贪吃蛇游戏
```bash
cd kids-game-house/snake-vue3
npm run dev
# 访问 http://localhost:3005
```

### 启动后端
```bash
cd kids-game-backend
mvn spring-boot:run
# 访问 http://localhost:8080
```

## ⚠️ 重要提示

1. **不要混淆端口号**：
   - ❌ 错误：5173, 5174（这是 Vite 默认端口）
   - ✅ 正确：3000, 3005（实际配置端口）

2. **跨域访问**：
   - 贪吃蛇游戏 (3005) 访问后端 (8080) 需要配置 CORS
   - 主系统 (3000) 也访问后端 (8080)

3. **登录跳转**：
   - 未登录时从贪吃蛇游戏跳转到主系统登录页
   - 使用 `redirect` 参数保存当前路径
   - 登录成功后跳转回来

4. **Token 存储**：
   - Token 存储在 localStorage
   - 两个系统共享同一个 localStorage（同域名）
   - Token 过期时自动跳转到登录页

## 📝 配置文件位置

### 主系统配置
```javascript
// kids-game-frontend/vite.config.ts
server: {
  port: 3000,  // ✅ 主系统端口
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    }
  }
}
```

### 贪吃蛇游戏配置
```javascript
// kids-game-house/snake-vue3/vite.config.ts
server: {
  port: 3005,  // ✅ 贪吃蛇游戏端口
}
```

### 后端配置
```yaml
# kids-game-backend/src/main/resources/application.yml
server:
  port: 8080  # ✅ 后端端口
```

## 🧪 测试端口

### 测试主系统
```bash
curl http://localhost:3000
# 应该返回 HTML 页面
```

### 测试贪吃蛇游戏
```bash
curl http://localhost:3005
# 应该返回 HTML 页面
```

### 测试后端
```bash
curl http://localhost:8080/api/game/list
# 应该返回 JSON 数据
```

## 总结

✅ **正确配置**：
- 主系统：http://localhost:3000
- 贪吃蛇游戏：http://localhost:3005
- 后端 API：http://localhost:8080

所有跳转地址已修正为正确的端口号！
