# 快速启动指南

## 🚀 快速启动

### 1. 环境检查

确保已安装以下软件：
- Node.js >= 18
- Java 17
- MySQL 8.0+
- Redis
- Maven 3.8+

### 2. 配置环境变量

```bash
# Windows
set-env-vars.bat

# PowerShell
.\set-env-vars.ps1
```

### 3. 启动服务

#### 方案 A：逐个启动

**后端**：
```bash
cd kids-game-backend
mvn clean install -DskipTests
cd kids-game-web
mvn spring-boot:run
```

**前端**：
```bash
cd kids-game-frontend
npm install
npm run dev
```

**游戏（可选）**：
```bash
cd kids-game-house
install-dependencies.bat
start-all-games.bat
```

#### 方案 B：使用脚本

```bash
# 启动后端
cd kids-game-backend
start-backend.bat

# 启动前端（新终端）
cd kids-game-frontend
npm run dev

# 启动游戏（新终端）
cd kids-game-house
start-all-games.bat
```

---

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端首页 | http://localhost:5173 | 儿童游戏平台主页 |
| 管理后台 | http://localhost:5173/admin/dashboard | 运营后台管理系统 |
| 后端 API | http://localhost:8080 | RESTful API 服务 |
| API 文档 | http://localhost:8080/doc.html | Knife4j 接口文档 |
| 贪吃蛇游戏 | http://localhost:3003 | 贪吃蛇游戏 |
| PVZ 游戏 | http://localhost:3004 | 植物大战僵尸游戏 |

---

## 🎯 默认账号

### 管理员账号
- 用户名：`admin`
- 密码：`admin123`

### 儿童账号
- 用户名：`kid1`
- 密码：`123456`

### 家长账号
- 用户名：`parent1`
- 密码：`123456`

---

## 🔧 常见问题

### 端口被占用

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <进程ID> /F
```

### 数据库连接失败

检查 MySQL 服务：
```bash
mysql -u root -p -e "SHOW DATABASES;"
```

### 前端依赖安装失败

```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### 清理缓存

```bash
# Vite 缓存
cd kids-game-frontend
rm -rf node_modules/.vite dist

# 重新安装
npm install
npm run dev
```

---

## 📖 下一步

- 阅读 [详细开发指南](./03-development/index.md)
- 了解 [项目架构](./04-architecture/index.md)
- 查看 [API 文档](./02-api-reference/index.md)
- 学习 [主题系统](./05-guides/gtrs-overview.md)

---

**最后更新**: 2026-03-20
**版本**: v2.0.0
