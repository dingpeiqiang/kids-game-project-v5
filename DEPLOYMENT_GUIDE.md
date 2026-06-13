# 阿里云容器化部署指南

## 📋 目录

- [前置准备](#前置准备)
- [服务器环境配置](#服务器环境配置)
- [部署步骤](#部署步骤)
- [域名和 SSL 配置](#域名和-ssl-配置)
- [监控和维护](#监控和维护)
- [常见问题](#常见问题)

---

## 前置准备

### 1. 阿里云账号和资源

- ✅ 阿里云账号（已实名认证）
- ✅ ECS 服务器（推荐配置见下文）
- ✅ 域名（可选，建议购买并备案）
- ✅ 腾讯云 COS 账号（用于资源存储）

### 2. 推荐服务器配置

#### 小型部署（测试/开发环境）
- CPU: 2 核
- 内存: 4 GB
- 磁盘: 50 GB SSD
- 带宽: 3-5 Mbps
- 操作系统: Ubuntu 22.04 LTS / CentOS 8

#### 中型部署（生产环境）
- CPU: 4 核
- 内存: 8 GB
- 磁盘: 100 GB SSD
- 带宽: 5-10 Mbps
- 操作系统: Ubuntu 22.04 LTS / CentOS 8

#### 大型部署（高并发）
- CPU: 8 核+
- 内存: 16 GB+
- 磁盘: 200 GB+ SSD
- 带宽: 10 Mbps+
- 建议使用负载均衡 SLB + 多台 ECS

### 3. 安全组配置

在阿里云控制台配置安全组规则，开放以下端口：

| 端口 | 协议 | 说明 | 来源 |
|------|------|------|------|
| 80 | TCP | HTTP | 0.0.0.0/0 |
| 443 | TCP | HTTPS | 0.0.0.0/0 |
| 22 | TCP | SSH | 你的 IP |
| 8080 | TCP | 后端 API（可选，通过 Nginx 代理） | 内网或你的 IP |

**注意**：不要直接开放数据库端口（3306、6379）到公网！

---

## 服务器环境配置

### 1. 连接到服务器

```bash
ssh root@your-server-ip
```

### 2. 更新系统

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 3. 安装 Docker

```bash
# 使用官方脚本安装
curl -fsSL https://get.docker.com | bash -s docker

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

### 4. 安装 Docker Compose

```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 5. 配置 Docker 镜像加速（可选，加快拉取速度）

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

---

## 部署步骤

### 1. 上传项目代码

#### 方式一：使用 Git（推荐）

```bash
# 在服务器上克隆仓库
cd /opt
git clone https://your-git-repo/kids-game-project-v5.git
cd kids-game-project-v5
```

#### 方式二：使用 SCP 上传

```bash
# 在本地执行
scp -r kids-game-project-v5 root@your-server-ip:/opt/
```

### 2. 配置环境变量

```bash
cd /opt/kids-game-project-v5

# 复制环境变量模板
cp .env.production.example .env.production

# 编辑配置文件
vim .env.production
```

**必须修改的配置项：**

```bash
# 数据库密码（使用强密码）
MYSQL_ROOT_PASSWORD=your-very-secure-root-password
MYSQL_PASSWORD=your-very-secure-database-password

# 腾讯云 COS 配置
COS_SECRET_ID=your-tencent-cos-secret-id
COS_SECRET_KEY=your-tencent-cos-secret-key
COS_BUCKET=kids-game-resources-your-app-id
COS_REGION=ap-guangzhou

# JWT 密钥（至少 32 字符）
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-characters

# 前端 API 地址（如果有域名）
VITE_API_BASE_URL=https://your-domain.com/api
```

### 3. 构建并启动服务

```bash
# 赋予部署脚本执行权限
chmod +x deploy.sh

# 一键部署
./deploy.sh deploy
```

或者手动执行：

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 验证部署

```bash
# 检查所有容器是否正常运行
docker-compose ps

# 测试前端访问
curl http://localhost

# 测试后端 API
curl http://localhost:8080/actuator/health

# 查看后端日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend
```

### 5. 配置防火墙（如果使用 firewalld）

```bash
# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 域名和 SSL 配置

### 1. 域名解析

在阿里云 DNS 控制台添加 A 记录：
- 主机记录：`@` 或 `www`
- 记录类型：`A`
- 记录值：你的服务器 IP

### 2. 申请 SSL 证书

#### 方式一：阿里云免费 SSL 证书

1. 登录阿里云控制台
2. 进入 SSL 证书服务
3. 申请免费 DV 单域名证书
4. 下载 Nginx 格式的证书文件

#### 方式二：Let's Encrypt（免费自动续期）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

### 3. 配置 Nginx HTTPS

创建 SSL Nginx 配置文件 `docker/nginx/ssl.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL 证书路径
    ssl_certificate /etc/nginx/ssl/your-domain.com.pem;
    ssl_certificate_key /etc/nginx/ssl/your-domain.com.key;
    
    # SSL 优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 其他配置同 frontend.conf
    # ...
}
```

修改 `docker-compose.yml`，挂载证书：

```yaml
frontend:
  volumes:
    - ./docker/nginx/ssl:/etc/nginx/ssl:ro
    - ./docker/nginx/ssl.conf:/etc/nginx/conf.d/default.conf
```

### 4. 重启服务

```bash
docker-compose down
docker-compose up -d
```

---

## 监控和维护

### 1. 查看服务状态

```bash
# 查看所有容器状态
docker-compose ps

# 查看资源使用情况
docker stats

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 2. 备份数据库

```bash
# 手动备份
./deploy.sh backup

# 设置定时备份（每天凌晨 2 点）
crontab -e

# 添加以下内容
0 2 * * * cd /opt/kids-game-project-v5 && ./deploy.sh backup >> /var/log/db-backup.log 2>&1
```

### 3. 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose down
docker-compose build
docker-compose up -d

# 或使用部署脚本
./deploy.sh deploy
```

### 4. 清理旧镜像

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune
```

### 5. 监控告警（可选）

可以集成以下监控工具：
- **Prometheus + Grafana**：系统监控
- **ELK Stack**：日志分析
- **阿里云云监控**：云服务器监控

---

## 常见问题

### Q1: 容器启动失败

```bash
# 查看详细日志
docker-compose logs backend

# 检查配置文件
docker-compose config

# 检查端口占用
netstat -tlnp | grep 8080
```

### Q2: 数据库连接失败

```bash
# 检查 MySQL 是否启动
docker-compose ps mysql

# 查看 MySQL 日志
docker-compose logs mysql

# 测试连接
docker-compose exec mysql mysql -ukidgame -p kidgame
```

### Q3: 前端无法访问后端 API

检查 `.env.production` 中的 `VITE_API_BASE_URL` 是否正确：

```bash
VITE_API_BASE_URL=https://your-domain.com/api
```

重新构建前端：

```bash
docker-compose build frontend
docker-compose up -d frontend
```

### Q4: 内存不足

调整 JVM 参数（`Dockerfile.backend`）：

```dockerfile
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"
```

### Q5: 静态资源加载慢

1. 启用 CDN 加速（腾讯云 CDN）
2. 配置 Nginx Gzip 压缩（已配置）
3. 启用浏览器缓存（已配置）

### Q6: 游戏服务无法访问

确保启动了游戏服务：

```bash
docker-compose --profile games up -d
```

检查游戏服务日志：

```bash
docker-compose logs games
```

---

## 性能优化建议

### 1. 数据库优化

- 为常用查询字段添加索引
- 定期清理过期数据
- 使用读写分离（主从复制）

### 2. 缓存优化

- Redis 缓存热点数据
- 配置合理的缓存过期时间
- 使用 CDN 缓存静态资源

### 3. Nginx 优化

- 启用 Gzip 压缩（已配置）
- 配置静态资源缓存（已配置）
- 调整 worker_processes 和 worker_connections

### 4. JVM 优化

根据服务器内存调整 JVM 参数：

```bash
# 4GB 内存服务器
ENV JAVA_OPTS="-Xms1g -Xmx2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# 8GB 内存服务器
ENV JAVA_OPTS="-Xms2g -Xmx4g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

---

## 安全建议

1. **定期更新系统和依赖**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **使用强密码**
   - 数据库密码至少 16 位，包含大小写字母、数字、特殊字符
   - JWT Secret 至少 32 位

3. **限制 SSH 访问**
   ```bash
   # 修改 SSH 端口
   vim /etc/ssh/sshd_config
   # Port 2222
   
   # 禁用 root 登录
   PermitRootLogin no
   
   # 重启 SSH
   sudo systemctl restart sshd
   ```

4. **配置防火墙**
   ```bash
   sudo ufw enable
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 2222/tcp  # SSH 新端口
   ```

5. **定期备份**
   - 数据库每日备份
   - 配置文件版本控制
   - 重要数据异地备份

---

## 技术支持

如有问题，请查看：
- 项目文档：`kids-game-frontend/src/docs/`
- Docker 官方文档：https://docs.docker.com/
- 阿里云帮助文档：https://help.aliyun.com/

---

**祝部署顺利！** 🎉
