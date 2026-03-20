# 开发环境部署

## 📋 环境准备

### 1. 安装基础软件

请参考 [环境要求](./requirements.md) 安装所需软件。

### 2. 克隆代码

```bash
git clone <repository_url>
cd kids-game-project-v5
```

### 3. 配置环境变量

#### Windows

复制并编辑环境变量配置文件：

```bash
# 复制配置文件
copy set-env-vars.bat.example set-env-vars.bat
copy set-env-vars.ps1.example set-env-vars.ps1

# 编辑配置文件
notepad set-env-vars.bat
notepad set-env-vars.ps1

# 执行配置
./set-env-vars.bat
```

#### Linux/macOS

```bash
# 设置环境变量
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=kids_game
export DB_USERNAME=root
export DB_PASSWORD=your_password
export REDIS_HOST=localhost
export REDIS_PORT=6379
export JWT_SECRET=your_secret_key
```

---

## 🚀 启动服务

### 1. 启动数据库和 Redis

```bash
# 启动 MySQL
mysql.server start  # macOS
sudo systemctl start mysql  # Linux
net start mysql  # Windows

# 启动 Redis
redis-server
```

### 2. 初始化数据库

```bash
cd kids-game-backend

# 创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS kids_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 执行初始化脚本
mysql -u root -p kids_game < src/main/resources/schema.sql
mysql -u root -p kids_game < src/main/resources/data.sql
```

### 3. 启动后端服务

```bash
cd kids-game-backend

# 安装依赖并编译
mvn clean install -DskipTests

# 启动服务
cd kids-game-web
mvn spring-boot:run
```

后端将在 http://localhost:8080 启动

### 4. 启动前端服务

```bash
cd kids-game-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 http://localhost:5173 启动

### 5. 启动游戏服务（可选）

```bash
cd kids-game-house

# 安装依赖
install-dependencies.bat

# 启动所有游戏
start-all-games.bat
```

---

## 🔧 开发工具配置

### IntelliJ IDEA 配置

1. 导入 Maven 项目
2. 安装 Lombok 插件
3. 配置 SDK（Java 17）
4. 配置运行配置

### VSCode 配置

安装以下扩展：
- Volar (Vue 开发)
- ESLint
- Prettier
- TypeScript Vue Plugin

---

## ✅ 验证部署

### 1. 检查服务状态

```bash
# 检查后端
curl http://localhost:8080/api/health

# 检查前端
curl http://localhost:5173

# 检查游戏
curl http://localhost:3003
```

### 2. 登录测试

访问 http://localhost:5173

使用测试账号登录：
- 管理员: admin / admin123
- 儿童: kid1 / 123456
- 家长: parent1 / 123456

---

## 🐛 常见问题

### 问题 1：端口被占用

**解决方案**:
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <进程ID> /F

# Linux
lsof -i :8080
kill -9 <进程ID>
```

### 问题 2：数据库连接失败

**解决方案**:
1. 检查 MySQL 服务是否启动
2. 检查数据库凭据是否正确
3. 检查数据库是否存在

### 问题 3：npm install 失败

**解决方案**:
```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install
```

---

**最后更新**: 2026-03-20
**版本**: v1.0.0
