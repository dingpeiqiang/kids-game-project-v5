# 阿里云容器化部署 - 准备工作清单

## ✅ 已完成的准备工作

我已经为你的项目创建了完整的 Docker 容器化部署方案，包含以下内容：

### 1. Docker 配置文件 ✅

#### 核心 Dockerfile
- ✅ `Dockerfile.frontend` - 前端多阶段构建（Node.js + Nginx）
- ✅ `Dockerfile.backend` - 后端多阶段构建（Maven + JRE）
- ✅ `Dockerfile.games` - 游戏服务统一构建
- ✅ `.dockerignore` - 优化构建速度，减小镜像体积

#### Docker Compose
- ✅ `docker-compose.yml` - 完整的服务编排
  - MySQL 8.0 数据库
  - Redis 7 缓存
  - Spring Boot 后端
  - Vue 3 前端（Nginx）
  - 游戏服务（可选）

### 2. Nginx 配置 ✅

- ✅ `docker/nginx/frontend.conf` - 前端 Nginx 配置
  - SPA 路由支持
  - Gzip 压缩
  - 静态资源缓存
  - API 反向代理
  - WebSocket 支持
- ✅ `nginx.prod.conf` - 生产环境整合配置

### 3. 数据库初始化 ✅

- ✅ `docker/mysql/init.sql` - 自动初始化脚本
  - 创建所有必要的表结构
  - 插入默认管理员账号
  - 插入示例游戏数据
  - 配置索引和优化

### 4. 环境变量配置 ✅

- ✅ `.env.production.example` - 生产环境配置模板
  - 数据库配置
  - 腾讯云 COS 配置
  - JWT 密钥
  - 前端 API 地址

### 5. 部署脚本 ✅

- ✅ `deploy.sh` - Linux/Mac 一键部署脚本
  - 依赖检查
  - 配置验证
  - 构建和启动
  - 日志查看
  - 数据库备份
  - 资源清理
  
- ✅ `deploy.bat` - Windows 一键部署脚本
  - 相同功能的 Windows 版本

### 6. 完整文档 ✅

- ✅ `DEPLOYMENT_GUIDE.md` - 详细部署指南（534 行）
  - 前置准备
  - 服务器环境配置
  - 部署步骤详解
  - 域名和 SSL 配置
  - 监控和维护
  - 常见问题解答
  - 性能优化建议
  - 安全建议

- ✅ `DEPLOYMENT_CHECKLIST.md` - 部署检查清单（284 行）
  - 部署前准备
  - 服务器配置检查
  - 应用部署步骤
  - 安全配置
  - 域名和 SSL
  - 监控和维护
  - 最终验证

- ✅ `DOCKER_DEPLOYMENT.md` - 快速开始指南（262 行）
  - 快速部署命令
  - 必要配置说明
  - 服务架构图
  - 常用命令参考
  - 故障排查

---

## 📋 你需要做的事情

### 第一阶段：本地准备（在部署前完成）

#### 1. 配置敏感信息
```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 编辑并修改以下关键配置：
vim .env.production
```

**必须修改的配置：**
- [ ] `MYSQL_ROOT_PASSWORD` - 设置强密码（至少 16 位）
- [ ] `MYSQL_PASSWORD` - 设置强密码
- [ ] `COS_SECRET_ID` - 填入你的腾讯云 COS Secret ID
- [ ] `COS_SECRET_KEY` - 填入你的腾讯云 COS Secret Key
- [ ] `COS_BUCKET` - 填入你的 COS Bucket 名称
- [ ] `JWT_SECRET` - 生成至少 32 位的随机密钥
- [ ] `VITE_API_BASE_URL` - 如果有域名，填入 https://your-domain.com/api

**生成强密码和密钥的方法：**
```bash
# Linux/Mac
openssl rand -base64 32  # 生成 32 位随机密钥

# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

#### 2. 测试本地构建（可选但推荐）
```bash
# 在本地测试构建是否正常
docker-compose build

# 测试启动
docker-compose up -d

# 验证服务
docker-compose ps
curl http://localhost

# 停止并清理
docker-compose down
```

#### 3. 准备腾讯云 COS
- [ ] 登录腾讯云控制台
- [ ] 创建 COS Bucket
- [ ] 获取 Secret ID 和 Secret Key
- [ ] 配置 CORS 规则（允许你的域名访问）
- [ ] 记录 Bucket 名称和区域

#### 4. 代码准备
- [ ] 确保所有代码已提交到 Git
- [ ] 检查是否有硬编码的敏感信息
- [ ] 确认 `application.yml` 使用环境变量
- [ ] 测试前端构建：`npm run build`
- [ ] 测试后端构建：`mvn clean package`

---

### 第二阶段：阿里云服务器购买和初始化

#### 1. 购买 ECS 服务器
- [ ] 登录阿里云控制台
- [ ] 选择 ECS 实例
  - **推荐配置**：4核 CPU、8GB 内存、100GB SSD
  - **操作系统**：Ubuntu 22.04 LTS 或 CentOS 8
  - **地域**：选择离用户最近的地区
- [ ] 配置网络
  - **安全组规则**：开放端口 80（HTTP）、443（HTTPS）、22（SSH）
  - **带宽**：3-5 Mbps（根据预期访问量调整）
- [ ] 设置登录方式
  - 推荐使用密钥对（更安全）
  - 或设置 root 密码
- [ ] 购买并完成支付
- [ ] **记录服务器公网 IP 地址**

#### 2. 域名准备（可选但推荐）
- [ ] 购买域名（如果还没有）
- [ ] 完成 ICP 备案（中国大陆服务器必需，约需 20 天）
- [ ] 在阿里云 DNS 控制台添加 A 记录
  - 主机记录：`@` 或 `www`
  - 记录类型：`A`
  - 记录值：你的服务器公网 IP
- [ ] 等待 DNS 解析生效（通常几分钟到几小时）

#### 第三阶段：连接到服务器并安装环境

#### 1. SSH 连接到服务器

**Windows 用户：**
- 方式一：使用 PowerShell
  ```powershell
  ssh root@your-server-ip
  ```
- 方式二：使用 PuTTY（图形化工具）
  - 下载：https://www.putty.org/
  - Host Name: your-server-ip
  - Port: 22
  - Connection type: SSH
  - 点击 Open

**Mac/Linux 用户：**
```bash
ssh root@your-server-ip
```

首次连接会提示确认指纹，输入 `yes` 继续。

#### 2. 更新系统

**Ubuntu/Debian：**
```bash
apt update && apt upgrade -y
```

**CentOS/RHEL：**
```bash
yum update -y
```

#### 3. 安装 Docker

```bash
# 使用官方脚本一键安装
curl -fsSL https://get.docker.com | bash -s docker

# 启动 Docker 服务
systemctl start docker

# 设置开机自启
systemctl enable docker

# 验证安装
docker --version
```

预期输出：`Docker version 24.x.x, build xxxxxxx`

#### 4. 安装 Docker Compose

```bash
# 下载最新版本的 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

预期输出：`Docker Compose version v2.x.x`

#### 5. 配置 Docker 镜像加速（强烈推荐，加快下载速度）

```bash
# 创建 Docker 配置目录
mkdir -p /etc/docker

# 配置国内镜像源
tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://huecker.io",
    "https://dockerhub.timeweb.cloud"
  ]
}
EOF

# 重启 Docker 使配置生效
systemctl daemon-reload
systemctl restart docker

# 验证配置
docker info | grep -A 5 "Registry Mirrors"
```

---

### 第四阶段：上传代码到服务器

#### 方式一：使用 Git 克隆（推荐）

```bash
# 在服务器上创建应用目录
mkdir -p /opt/apps
cd /opt/apps

# 克隆代码仓库
git clone https://github.com/your-username/kids-game-project-v5.git

# 进入项目目录
cd kids-game-project-v5
```

**如果使用私有仓库，需要配置认证：**
```bash
# 方式 1：使用 HTTPS + Personal Access Token
git clone https://username:token@github.com/your-username/kids-game-project-v5.git

# 方式 2：配置 SSH Key
ssh-keygen -t ed25519 -C "your-email@example.com"
cat ~/.ssh/id_ed25519.pub
# 复制输出的公钥，添加到 GitHub/Gitee 的 SSH Keys
git clone git@github.com:your-username/kids-game-project-v5.git
```

#### 方式二：从本地上传文件

**Windows 用户使用 WinSCP（推荐）：**
1. 下载 WinSCP：https://winscp.net/
2. 连接到服务器：
   - File protocol: SFTP
   - Host name: your-server-ip
   - User name: root
   - Password: 你的服务器密码
3. 左侧选择本地项目文件夹
4. 右侧导航到 `/opt/apps/`
5. 拖拽上传整个项目文件夹

**Mac/Linux 用户使用 SCP 命令：**
```bash
# 在本地终端执行（不是在服务器上）
scp -r kids-game-project-v5 root@your-server-ip:/opt/apps/
```

#### 方式三：使用 rz 命令（适合小文件）

```bash
# 在服务器上安装 lrzsz
apt install lrzsz -y  # Ubuntu
# 或
yum install lrzsz -y  # CentOS

# 上传压缩包
rz
# 会弹出文件选择窗口，选择项目的 zip 文件

# 解压
unzip kids-game-project-v5.zip
```

#### 验证上传成功
```bash
# 查看文件是否上传成功
ls -la /opt/apps/kids-game-project-v5

# 应该能看到项目文件和文件夹
```

---

### 第五阶段：在服务器上配置环境变量

```bash
# 进入项目目录
cd /opt/apps/kids-game-project-v5

# 复制环境变量模板
cp .env.production.example .env.production

# 编辑配置文件
vim .env.production
```

**使用 vim 编辑器的基本操作：**
- 按 `i` 进入编辑模式
- 修改配置值
- 按 `Esc` 退出编辑模式
- 输入 `:wq` 保存并退出
- 输入 `:q!` 不保存退出

**或者使用 nano（更简单）：**
```bash
nano .env.production
# 修改后按 Ctrl+O 保存，Ctrl+X 退出
```

**必须修改的配置项：**
```bash
# 数据库密码（使用之前在本地准备好的强密码）
MYSQL_ROOT_PASSWORD=your-secure-root-password
MYSQL_PASSWORD=your-secure-database-password

# 腾讯云 COS 配置（使用之前准备好的信息）
COS_SECRET_ID=your-tencent-cos-secret-id
COS_SECRET_KEY=your-tencent-cos-secret-key
COS_BUCKET=kids-game-resources-your-app-id
COS_REGION=ap-guangzhou

# JWT 密钥（使用之前在本地生成的密钥）
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars

# 前端 API 地址（如果有域名）
VITE_API_BASE_URL=https://your-domain.com/api
# 如果没有域名，暂时使用服务器 IP
VITE_API_BASE_URL=http://your-server-ip/api
```

**⚠️ 重要：保护配置文件**
```bash
# 设置文件权限，只有 root 可读
chmod 600 .env.production

# 确认 .env.production 在 .gitignore 中
grep ".env.production" .gitignore
# 如果没有，添加它
echo ".env.production" >> .gitignore
```

#### 3. 一键部署
```bash
# 赋予执行权限
chmod +x deploy.sh

# 开始部署
./deploy.sh deploy
```

#### 4. 验证部署
```bash
# 查看所有容器状态
docker-compose ps

# 应该看到所有服务都是 "Up" 状态

# 测试前端
curl http://localhost

# 测试后端
curl http://localhost:8080/actuator/health

# 查看日志
docker-compose logs -f
```

---

### 第四阶段：配置域名和 SSL（可选但强烈推荐）

#### 1. 申请 SSL 证书

**方式一：阿里云免费证书**
- [ ] 登录阿里云控制台
- [ ] 进入 SSL 证书服务
- [ ] 申请免费 DV 单域名证书
- [ ] 下载 Nginx 格式证书

**方式二：Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

#### 2. 配置 HTTPS
- [ ] 上传证书到服务器
- [ ] 修改 Nginx 配置启用 SSL
- [ ] 重启服务
- [ ] 测试 HTTPS 访问

---

### 第五阶段：后续维护

#### 1. 设置数据库备份
```bash
# 测试备份
./deploy.sh backup

# 设置定时备份（每天凌晨 2 点）
crontab -e
# 添加：0 2 * * * cd /opt/kids-game-project-v5 && ./deploy.sh backup >> /var/log/db-backup.log 2>&1
```

#### 2. 监控服务
```bash
# 查看资源使用
docker stats

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 检查磁盘空间
df -h
```

#### 3. 更新应用
```bash
# 拉取最新代码
git pull

# 重新部署
./deploy.sh deploy
```

---

## 🔐 安全注意事项

### 必须做到的安全措施

1. **使用强密码**
   - 数据库密码至少 16 位
   - 包含大小写字母、数字、特殊字符
   - 不要使用默认密码

2. **保护敏感信息**
   - `.env.production` 不要提交到 Git
   - 添加到 `.gitignore`
   - 妥善保管备份文件

3. **配置防火墙**
   ```bash
   sudo ufw enable
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   ```

4. **定期更新**
   - 每月更新系统和依赖
   - 关注安全公告
   - 及时修补漏洞

5. **备份策略**
   - 每日自动备份数据库
   - 每周备份配置文件
   - 保留至少 7 天的备份

---

## 📊 预期资源使用

### 内存使用（估算）
- MySQL: ~500MB
- Redis: ~50MB
- Backend (JVM): ~512MB - 1GB
- Frontend (Nginx): ~50MB
- Games (如果启用): ~200-500MB
- **总计**: ~1.3 - 2GB

### 磁盘使用（估算）
- Docker 镜像: ~2-3GB
- 数据库: ~100MB - 1GB（取决于数据量）
- 日志文件: ~100MB/月
- 上传资源: 取决于使用情况
- **总计**: ~3-5GB 起步

### CPU 使用
- 空闲时: < 10%
- 正常访问: 10-30%
- 高并发时: 50-80%

---

## 🎯 成功标准

部署成功的标志：

- [ ] 所有容器状态为 "Up"
- [ ] 可以通过浏览器访问网站首页
- [ ] 用户可以注册和登录
- [ ] 游戏列表正常显示
- [ ] 游戏可以正常加载
- [ ] API 接口响应正常（< 500ms）
- [ ] 数据库备份功能正常
- [ ] 日志无严重错误
- [ ] HTTPS 正常工作（如果配置）

---

## 🆘 需要帮助？

### 文档资源
- 📖 [完整部署指南](./DEPLOYMENT_GUIDE.md)
- ✅ [部署检查清单](./DEPLOYMENT_CHECKLIST.md)
- 🚀 [快速开始](./DOCKER_DEPLOYMENT.md)

### 常见问题
- 查看 `DEPLOYMENT_GUIDE.md` 的"常见问题"章节
- 使用 `docker-compose logs [service]` 查看详细错误
- 检查 `.env.production` 配置是否正确

### 技术支持
- 项目 Issues
- 阿里云帮助文档
- Docker 官方文档

---

## 📝 总结

你已经拥有了：
✅ 完整的 Docker 容器化配置
✅ 一键部署脚本（Linux/Windows）
✅ 详细的部署文档和检查清单
✅ 数据库自动初始化
✅ Nginx 反向代理配置
✅ 生产环境最佳实践

**下一步行动：**
1. 在本地测试构建
2. 准备阿里云服务器
3. 配置环境变量
4. 执行部署
5. 配置域名和 SSL
6. 设置监控和备份

**预计时间：**
- 首次部署：1-2 小时
- 后续更新：10-15 分钟

祝你部署顺利！🎉
