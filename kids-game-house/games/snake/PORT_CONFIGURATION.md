# 📡 贪吃蛇游戏 - 端口配置说明

**版本**: v1.3.0  
**创建时间**: 2026-04-05  

---

## 🎯 端口配置详情

### 当前配置

| 服务 | 端口 | 配置文件 | 说明 |
|------|------|----------|------|
| **贪吃蛇游戏** | 3005 | vite.config.ts | Vite 开发服务器 |
| **主前端平台** | 5173 | nginx.dev.conf.example | Nginx 代理（默认） |
| **后端 API** | 8080 | nginx.dev.conf.example | Spring Boot 后端 |
| **Nginx 反向代理** | 80 | nginx.dev.conf.example | 统一入口 |

---

## 🔍 为什么是 3005 端口？

### 配置文件位置

```
kids-game-house/games/snake/vite.config.ts
```

### 配置内容

```typescript
export default defineConfig({
  // ... 其他配置
  
  server: {
    port: 3005,        // ⭐ 配置的端口
    host: true,        // 允许外部访问
    hmr: {
      overlay: true    // 显示错误遮罩
    },
    // ... 其他配置
  }
})
```

---

## 📊 完整端口映射体系

### 开发环境

```
┌─────────────────────────────────────┐
│         浏览器访问                   │
│         http://localhost:80         │
└──────────────┬──────────────────────┘
               │
        ┌──────▼───────┐
        │   Nginx      │ Port 80
        │ (反向代理)   │
        └──────┬───────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    │          │          │
┌───▼───┐  ┌───▼───┐  ┌──▼────┐
│主前端 │  │贪吃蛇 │  │ API   │
│:5173  │  │:3005  │  │:8080  │
└───────┘  └───────┘  └───────┘
   (Vite)   (Vite)   (Spring Boot)
```

### 直接访问（推荐开发时使用）

```
浏览器 → http://localhost:3005/ → 贪吃蛇游戏
```

### 通过 Nginx 访问（多游戏统一入口）

```
浏览器 → http://localhost/snake → Nginx(80) → 贪吃蛇 (3005)
```

---

## 🔧 如何修改端口？

### 方法 1: 修改配置文件（永久）

编辑 `vite.config.ts`:

```typescript
server: {
  port: 3005,  // 改成你想要的端口
}
```

---

### 方法 2: 命令行指定（临时）

```bash
# 使用 3006 端口
npm run dev -- --port 3006

# 使用 8080 端口
npm run dev -- --port 8080
```

---

### 方法 3: 自动检测可用端口

```bash
# 如果 3005 被占用，Vite 会自动尝试 3006, 3007...
npm run dev
```

---

## 🚨 端口冲突解决

### 检查端口占用（Windows）

```powershell
# 查看 3005 端口的占用情况
netstat -ano | findstr :3005

# 示例输出：
# TCP    0.0.0.0:3005           0.0.0.0:0              LISTENING       12345
# 
# PID 是 12345
```

### 杀掉占用进程（Windows）

```powershell
# 强制结束进程
taskkill /F /PID 12345
```

### 查看进程详情

```powershell
# 查看是哪个程序占用了端口
Get-Process -Id 12345
```

---

## 💡 常用端口列表

| 端口 | 用途 | 服务 |
|------|------|------|
| 80 | HTTP | Nginx 统一入口 |
| 443 | HTTPS | 安全连接 |
| 3000 | 主前端备用 | Vite |
| 3005 | **贪吃蛇** | **Vite** |
| 3006 | 飞机大战 | Vite |
| 3007 | 坦克大战 | Vite |
| 5173 | Vite 默认 | Vite |
| 8080 | 后端 API | Spring Boot |
| 8081 | 后端备用 | Spring Boot |

---

## 🎯 推荐的开发方式

### 单游戏开发（推荐）

直接访问各个游戏的独立端口：

```bash
# 贪吃蛇
http://localhost:3005/

# 飞机大战
http://localhost:3006/

# 坦克大战
http://localhost:3007/
```

**优点**:
- ✅ 快速启动
- ✅ 无需 Nginx
- ✅ 独立开发互不干扰

---

### 多游戏统一访问

通过 Nginx 整合所有游戏：

```bash
# 配置 Nginx
nginx -c nginx.dev.conf

# 统一访问
http://localhost/snake        # 贪吃蛇
http://localhost/plane        # 飞机大战
http://localhost/tank         # 坦克大战
```

**优点**:
- ✅ 统一入口
- ✅ 模拟生产环境
- ✅ 方便演示

---

## 📝 测试时的端口选择

### 本地快速测试

```bash
# 直接使用 Vite 端口
http://localhost:3005/
```

### 集成测试

```bash
# 通过 Nginx 访问
http://localhost/snake
```

### 性能测试

```bash
# 直接访问避免 Nginx 开销
http://localhost:3005/
```

---

## ❓ 常见问题

### Q1: 为什么我的是 5173 端口？

**A**: 如果你的 `vite.config.ts` 中没有配置 `port`，Vite 会使用默认的 5173 端口。

**解决方案**:
```typescript
// vite.config.ts
server: {
  port: 3005,  // 明确指定端口
}
```

---

### Q2: 端口冲突怎么办？

**A**: 有三种选择：
1. 杀掉占用进程
2. 换一个端口
3. 让 Vite 自动选择

---

### Q3: 如何在局域网中访问？

**A**: 在 `vite.config.ts` 中添加：

```typescript
server: {
  host: '0.0.0.0',  // 允许外部访问
  port: 3005,
}
```

然后使用你的 IP 地址访问：
```
http://192.168.x.xxx:3005/
```

---

## 🔗 相关文档

- 📖 [QUICK_TEST_START.md](./QUICK_TEST_START.md) - 快速测试指南
- 📖 [RUNNING_GUIDE.md](./RUNNING_GUIDE.md) - 运行指南
- 📖 [../../nginx.dev.conf.example](../../nginx.dev.conf.example) - Nginx 配置

---

**最后更新**: 2026-04-05  
**维护者**: GCRS 开发团队  
**版本**: v1.3.0
