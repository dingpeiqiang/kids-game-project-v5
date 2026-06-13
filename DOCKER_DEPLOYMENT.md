# 容器化部署说明

本文档提供快速开始指南，详细文档请查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 📦 已创建的 Docker 配置文件

### 核心配置文件
- `Dockerfile` - 多阶段构建的主 Dockerfile（不推荐使用）
- `Dockerfile.frontend` - 前端服务 Dockerfile
- `Dockerfile.backend` - 后端服务 Dockerfile
- `Dockerfile.games` - 游戏服务 Dockerfile
- `docker-compose.yml` - Docker Compose 编排配置
- `.dockerignore` - Docker 构建忽略文件

### 配置文件
- `.env.production.example` - 生产环境变量模板
- `nginx.prod.conf` - 生产环境 Nginx 配置
- `docker/nginx/frontend.conf` - 前端 Nginx 配置
- `docker/mysql/init.sql` - 数据库初始化脚本
- `docker/games/start-games.sh` - 游戏服务启动脚本

### 部署脚本
- `deploy.sh` - Linux/Mac 部署脚本
- `deploy.bat` - Windows 部署脚本

### 文档
- `DEPLOYMENT_GUIDE.md` - 完整部署指南
- `DEPLOYMENT_CHECKLIST.md` - 部署检查清单

---

## 🚀 快速开始

### 方式一：使用部署脚本（推荐）

#### Linux/Mac
```bash
# 1. 赋予执行权限
chmod +x deploy.sh

# 2. 一键部署
./deploy.sh deploy
```

#### Windows
```bash
# 双击运行或在命令行执行
deploy.bat
```

### 方式二：手动部署

```bash
# 1. 复制环境变量文件
cp .env.production.example .env.production

# 2. 编辑配置（必须修改密码和密钥）
vim .env.production

# 3. 构建镜像
docker-compose build

# 4. 启动服务
docker-compose up -d

# 5. 查看状态
docker-compose ps

# 6. 查看日志
docker-compose logs -f
```

---

## ⚙️ 必要配置

在部署前，必须编辑 `.env.production` 文件并修改以下配置：

```bash
# 数据库密码（使用强密码）
MYSQL_ROOT_PASSWORD=your-secure-password
MYSQL_PASSWORD=your-secure-password

# 腾讯云 COS 配置
COS_SECRET_ID=your-secret-id
COS_SECRET_KEY=your-secret-key
COS_BUCKET=kids-game-resources-your-app-id
COS_REGION=ap-guangzhou

# JWT 密钥（至少 32 字符）
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars

# 前端 API 地址
VITE_API_BASE_URL=https://your-domain.com/api
```

---

## 📊 服务架构

```
┌─────────────────────────────────────┐
│         Nginx (Port 80/443)         │
│      前端静态文件 + 反向代理          │
└──────────┬──────────────┬───────────┘
           │              │
    ┌──────▼──────┐  ┌───▼────────┐
    │   Frontend   │  │   Backend   │
    │   (Vue 3)    │  │ (Spring Boot)│
    │   Port 80    │  │  Port 8080   │
    └──────────────┘  └──────┬───────┘
                             │
                    ┌────────▼────────┐
                    │                 │
              ┌─────▼─────┐    ┌────▼─────┐
              │  MySQL     │    │  Redis    │
              │  Port 3306 │    │ Port 6379 │
              └────────────┘    └──────────┘
```

---

## 🔧 常用命令

### 服务管理
```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service-name]
```

### 构建和更新
```bash
# 重新构建镜像
docker-compose build

# 重新构建并启动
docker-compose up -d --build

# 更新特定服务
docker-compose up -d --no-deps --build backend
```

### 数据库操作
```bash
# 进入 MySQL 容器
docker-compose exec mysql mysql -ukidgame -p kidgame

# 备份数据库
./deploy.sh backup

# 恢复数据库
docker-compose exec -T mysql mysql -ukidgame -p kidgame < backup.sql
```

### 清理和维护
```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 完全清理（删除所有数据）
docker-compose down -v --rmi all
```

---

## 🌐 访问地址

部署成功后，可以通过以下地址访问：

- **前端**: http://localhost 或 http://your-server-ip
- **后端 API**: http://localhost:8080/api
- **Swagger 文档**: http://localhost:8080/doc.html
- **游戏服务**: http://localhost:3001-3010（如果启用）

---

## 🔍 故障排查

### 容器无法启动
```bash
# 查看详细日志
docker-compose logs [service-name]

# 检查配置
docker-compose config

# 检查端口占用
netstat -tlnp | grep [port]
```

### 数据库连接失败
```bash
# 检查 MySQL 是否运行
docker-compose ps mysql

# 查看 MySQL 日志
docker-compose logs mysql

# 测试连接
docker-compose exec mysql mysql -ukidgame -p kidgame
```

### 前端无法访问后端
1. 检查 `.env.production` 中的 `VITE_API_BASE_URL`
2. 重新构建前端：`docker-compose build frontend`
3. 重启前端：`docker-compose up -d frontend`

### 内存不足
调整 `Dockerfile.backend` 中的 JVM 参数：
```dockerfile
ENV JAVA_OPTS="-Xms256m -Xmx512m"
```

---

## 📝 下一步

1. ✅ 完成基础部署
2. 📌 配置域名和 SSL 证书（见 DEPLOYMENT_GUIDE.md）
3. 📌 设置定时数据库备份
4. 📌 配置监控和告警
5. 📌 优化性能和安全性

---

## 📚 相关文档

- [完整部署指南](./DEPLOYMENT_GUIDE.md) - 详细的阿里云部署步骤
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md) - 部署前后的检查项
- [项目总览](./README.md) - 项目介绍和架构说明

---

## 💡 提示

- **首次部署**可能需要较长时间（下载基础镜像和依赖）
- **生产环境**务必使用强密码和 HTTPS
- **定期备份**数据库和重要配置
- **监控资源**使用情况，及时调整配置
- **阅读日志**是排查问题的最佳方式

---

**祝部署顺利！** 🎉

如有问题，请查看完整文档或提交 Issue。
