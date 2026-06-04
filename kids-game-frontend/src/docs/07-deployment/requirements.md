# 环境要求

## 📋 软件要求

### 必需软件

| 软件 | 版本要求 | 说明 | 下载地址 |
|------|----------|------|----------|
| Node.js | >= 18.x | 前端运行时 | https://nodejs.org/ |
| Java JDK | >= 17 | 后端运行时 | https://adoptium.net/ |
| MySQL | >= 8.0 | 数据库 | https://www.mysql.com/ |
| Redis | 最新稳定版 | 缓存服务 | https://redis.io/ |
| Maven | >= 3.6 | 后端构建工具 | https://maven.apache.org/ |
| Git | 最新稳定版 | 版本控制 | https://git-scm.com/ |

### 推荐工具

| 软件 | 说明 | 用途 |
|------|------|------|
| IntelliJ IDEA | Java IDE | 后端开发 |
| VSCode | 代码编辑器 | 前端开发 |
| Navicat | 数据库工具 | 数据库管理 |
| Postman | API 测试 | 接口调试 |
| Docker Desktop | 容器工具 | 容器化部署 |

---

## 💻 系统要求

### 开发环境

| 项目 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 4 核 | 8 核 |
| 内存 | 8 GB | 16 GB |
| 磁盘 | 20 GB 可用 | 50 GB 可用 |
| 操作系统 | Windows 10+ / macOS 10.14+ / Ubuntu 18.04+ | Windows 11 / macOS 12+ / Ubuntu 22.04+ |

### 生产环境

| 项目 | 小型部署 | 中型部署 | 大型部署 |
|------|----------|----------|----------|
| CPU | 2 核 | 4 核 | 8 核 |
| 内存 | 4 GB | 8 GB | 16 GB |
| 磁盘 | 50 GB | 100 GB | 200 GB |

---

## 🌐 网络要求

### 端口要求

确保以下端口未被占用：

| 端口 | 服务 | 说明 |
|------|------|------|
| 3306 | MySQL | 数据库端口 |
| 6379 | Redis | 缓存端口 |
| 8080 | 后端服务 | API 服务端口 |
| 5173 | 前端开发服务器 | 开发服务器端口 |
| 3001-3010 | 游戏服务 | 游戏开发端口 |

### 防火墙配置

```bash
# 开放必要端口（Linux）
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-port=5173/tcp
sudo firewall-cmd --reload
```

---

## 📦 依赖检查

### Node.js 检查

```bash
node -v
npm -v
```

### Java 检查

```bash
java -version
javac -version
echo $JAVA_HOME
```

### MySQL 检查

```bash
mysql --version
mysql -u root -p -e "SELECT VERSION();"
```

### Redis 检查

```bash
redis-cli ping
```

---

## ✅ 环境验证

### 1. 数据库连接测试

```bash
mysql -u root -p -e "SHOW DATABASES;"
```

### 2. Redis 连接测试

```bash
redis-cli
ping
```

### 3. 后端启动测试

```bash
cd kids-game-backend
mvn spring-boot:run
# 访问 http://localhost:8080
```

### 4. 前端启动测试

```bash
cd kids-game-frontend
npm run dev
# 访问 http://localhost:5173
```

---

**最后更新**: 2026-03-20
**版本**: v1.0.0
