# 阿里云服务器直接部署指南

> **说明**：本指南适用于**直接在阿里云服务器上操作部署**，无需从本地远程部署。

---

## 📋 部署流程概览

```
1. 购买阿里云 ECS 服务器
2. SSH 连接到服务器
3. 安装 Docker 环境
4. 上传代码到服务器
5. 配置环境变量
6. 一键部署
7. 验证访问
```

---

## 第一步：购买和准备阿里云服务器

### 1.1 购买 ECS 实例

登录 [阿里云控制台](https://ecs.console.aliyun.com/)，购买 ECS 服务器：

**推荐配置：**
- **CPU**: 4 核
- **内存**: 8 GB
- **磁盘**: 100 GB SSD
- **操作系统**: Ubuntu 22.04 LTS（推荐）或 CentOS 8
- **带宽**: 3-5 Mbps
- **地域**: 选择离用户最近的地区

**安全组配置（重要）：**
- ✅ 开放端口 **80**（HTTP）
- ✅ 开放端口 **443**（HTTPS）
- ✅ 开放端口 **22**（SSH，建议限制为你的 IP）

**记录服务器信息：**
- 📝 公网 IP 地址：`your-server-ip`
- 📝 登录密码或密钥对

---

## 第二步：SSH 连接到服务器

### Windows 用户

**方式一：使用 PowerShell（推荐）**
```powershell
ssh root@your-server-ip
```

**方式二：使用 PuTTY**
1. 下载 PuTTY：https://www.putty.org/
2. 配置连接：
   - Host Name: `your-server-ip`
   - Port: `22`
   - Connection type: `SSH`
3. 点击 Open，输入密码

### Mac/Linux 用户

```bash
ssh root@your-server-ip
```

首次连接会提示确认指纹，输入 `yes` 继续。

---

## 第三步：在服务器上安装 Docker 环境

连接到服务器后，依次执行以下命令：

### 3.1 更新系统

```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/RHEL
yum update -y
```

### 3.2 安装 Docker

```bash
# 一键安装 Docker
curl -fsSL https://get.docker.com | bash -s docker

# 启动 Docker
systemctl start docker

# 设置开机自启
systemctl enable docker

# 验证安装
docker --version
```

预期输出：`Docker version 24.x.x`

### 3.3 安装 Docker Compose

```bash
# 下载 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

预期输出：`Docker Compose version v2.x.x`

### 3.4 配置 Docker 镜像加速（强烈推荐）

```bash
# 创建配置目录
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

# 重启 Docker
systemctl daemon-reload
systemctl restart docker
```

---

## 第四步：上传代码到服务器

### 方式一：使用 Git 克隆（推荐）

```bash
# 创建应用目录
mkdir -p /opt/apps
cd /opt/apps

# 克隆代码仓库
git clone https://github.com/your-username/kids-game-project-v5.git

# 进入项目目录
cd kids-game-project-v5
```

**如果是私有仓库：**
```bash
# 使用 Personal Access Token
git clone https://username:token@github.com/your-username/kids-game-project-v5.git

# 或配置 SSH Key
ssh-keygen -t ed25519 -C "your-email@example.com"
cat ~/.ssh/id_ed25519.pub
# 复制公钥到 GitHub/Gitee 的 SSH Keys
git clone git@github.com:your-username/kids-game-project-v5.git
```

### 方式二：从本地上传文件

**Windows 用户使用 WinSCP：**
1. 下载 WinSCP：https://winscp.net/
2. 连接服务器：
   - Protocol: SFTP
   - Host: `your-server-ip`
   - Username: `root`
   - Password: 你的密码
3. 左侧选择本地项目文件夹
4. 右侧导航到 `/opt/apps/`
5. 拖拽上传

**Mac/Linux 用户使用 SCP：**
```bash
# 在本地终端执行（不是在服务器上）
scp -r kids-game-project-v5 root@your-server-ip:/opt/apps/
```

### 验证上传成功

```bash
ls -la /opt/apps/kids-game-project-v5
```

应该能看到项目文件和文件夹。

---

## 第五步：在服务器上配置环境变量

```bash
# 进入项目目录
cd /opt/apps/kids-game-project-v5

# 复制环境变量模板
cp .env.production.example .env.production

# 编辑配置文件
vim .env.production
```

### 使用 vim 编辑器

**基本操作：**
- 按 `i` 进入编辑模式
- 修改配置值
- 按 `Esc` 退出编辑模式
- 输入 `:wq` 保存并退出

**或使用 nano（更简单）：**
```bash
nano .env.production
# 修改后按 Ctrl+O 保存，Ctrl+X 退出
```

### 必须修改的配置

```bash
# ========================================
# 数据库密码（使用强密码）
# ========================================
MYSQL_ROOT_PASSWORD=your-very-secure-root-password
MYSQL_PASSWORD=your-very-secure-database-password

# ========================================
# JWT 密钥（至少 32 字符）
# ========================================
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars

# ========================================
# 前端 API 地址
# ========================================
# 如果有域名：
VITE_API_BASE_URL=https://your-domain.com/api

# 如果没有域名，使用服务器 IP：
VITE_API_BASE_URL=http://your-server-ip/api

# ========================================
# 资源上传配置（可选）
# ========================================
# 默认使用本地存储，无需额外配置
# 如果想使用腾讯云 COS，请取消注释并填写：
# COS_SECRET_ID=your-tencent-cos-secret-id
# COS_SECRET_KEY=your-tencent-cos-secret-key
# COS_BUCKET=kids-game-resources-your-app-id
# COS_REGION=ap-guangzhou
```

### 生成强密码和密钥

```bash
# 生成 32 位随机密钥
openssl rand -base64 32

# 生成强密码
openssl rand -base64 24
```

### 保护配置文件

```bash
# 设置文件权限（只有 root 可读）
chmod 600 .env.production

# 确保 .env.production 在 .gitignore 中
echo ".env.production" >> .gitignore
```

---

## 第六步：一键部署

```bash
# 赋予部署脚本执行权限
chmod +x deploy.sh

# 开始部署
./deploy.sh deploy
```

### 部署过程

脚本会自动执行：

1. ✅ 检查 Docker 和 Docker Compose
2. ✅ 验证 `.env.production` 配置文件
3. ✅ 构建 Docker 镜像（首次需要 10-20 分钟）
   - 下载基础镜像
   - 编译前端代码
   - 编译后端代码
4. ✅ 启动所有容器服务
5. ✅ 显示服务状态

### 是否启动游戏服务？

脚本会提示：
```
是否启动游戏服务？(y/n，默认n):
```

- 输入 `n`：只启动核心服务（推荐首次部署）
- 输入 `y`：同时启动游戏服务（需要更多资源）

### 查看部署结果

部署完成后，会显示服务状态：

```
NAME                STATUS          PORTS
kids-game-mysql     Up 2 minutes    3306/tcp
kids-game-redis     Up 2 minutes    6379/tcp
kids-game-backend   Up 2 minutes    0.0.0.0:8080->8080/tcp
kids-game-frontend  Up 2 minutes    0.0.0.0:80->80/tcp
```

**所有服务的 STATUS 应该是 `Up`**

---

## 第七步：验证部署

### 7.1 在服务器上测试

```bash
# 查看所有容器状态
docker-compose ps

# 查看后端日志
docker-compose logs backend
# 应该看到：Started KidsGameWebApplication in xx seconds

# 测试前端
curl http://localhost

# 测试后端健康检查
curl http://localhost:8080/actuator/health
# 应该返回：{"status":"UP"}
```

### 7.2 从浏览器访问

在你的电脑浏览器中输入：

```
http://your-server-ip
```

**应该能看到网站首页！**

### 7.3 测试功能

- [ ] 网站首页正常显示
- [ ] 用户可以注册/登录
- [ ] 游戏列表正常显示
- [ ] 游戏可以加载和游玩
- [ ] API 接口响应正常

---

## 第八步：配置防火墙（增强安全）

### Ubuntu 使用 UFW

```bash
# 启用防火墙
ufw enable

# 允许 HTTP、HTTPS、SSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp

# 查看规则
ufw status
```

### CentOS 使用 firewalld

```bash
# 启动防火墙
systemctl start firewalld
systemctl enable firewalld

# 开放端口
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh

# 重载配置
firewall-cmd --reload
```

---

## 第九步：后续维护

### 查看日志

```bash
# 实时查看后端日志
docker-compose logs -f backend

# 实时查看前端日志
docker-compose logs -f frontend

# 查看最近 100 行日志
docker-compose logs --tail=100 backend
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启单个服务
docker-compose restart backend
```

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新部署
./deploy.sh deploy
```

### 备份数据库

```bash
# 手动备份
./deploy.sh backup

# 设置定时备份（每天凌晨 2 点）
crontab -e

# 添加以下内容：
0 2 * * * cd /opt/apps/kids-game-project-v5 && ./deploy.sh backup >> /var/log/db-backup.log 2>&1
```

### 监控资源

```bash
# 查看容器资源使用
docker stats

# 查看磁盘空间
df -h

# 查看内存使用
free -h
```

---

## 🔧 常见问题排查

### 问题 1：容器启动失败

```bash
# 查看详细日志
docker-compose logs backend

# 检查配置
docker-compose config

# 检查端口占用
netstat -tlnp | grep 8080
```

### 问题 2：无法访问网站

```bash
# 检查容器是否运行
docker-compose ps

# 检查防火墙
ufw status  # Ubuntu
firewall-cmd --list-all  # CentOS

# 检查安全组（在阿里云控制台）
# 确认 80 端口已开放
```

### 问题 3：数据库连接失败

```bash
# 检查 MySQL 是否运行
docker-compose ps mysql

# 查看 MySQL 日志
docker-compose logs mysql

# 测试连接
docker-compose exec mysql mysql -ukidgame -p kids_game
```

### 问题 4：内存不足

调整 JVM 参数（编辑 `Dockerfile.backend`）：

```dockerfile
ENV JAVA_OPTS="-Xms256m -Xmx512m"
```

然后重新构建：

```bash
docker-compose build backend
docker-compose up -d backend
```

---

## 📊 常用命令速查

```bash
# === 服务管理 ===
docker-compose up -d              # 启动服务
docker-compose down               # 停止服务
docker-compose restart            # 重启服务
docker-compose ps                 # 查看状态

# === 日志查看 ===
docker-compose logs -f            # 查看所有日志
docker-compose logs -f backend    # 查看后端日志
docker-compose logs -f frontend   # 查看前端日志

# === 进入容器 ===
docker-compose exec backend sh    # 进入后端容器
docker-compose exec mysql mysql -ukidgame -p kids_game  # 进入数据库

# === 构建和更新 ===
docker-compose build              # 重新构建
docker-compose up -d --build      # 重新构建并启动
git pull && ./deploy.sh deploy    # 更新代码并部署

# === 清理和维护 ===
docker system prune -a            # 清理未使用的镜像
docker volume prune               # 清理未使用的卷
./deploy.sh backup                # 备份数据库
```

---

## ✅ 部署完成检查清单

- [ ] 服务器已购买并启动
- [ ] SSH 可以正常连接
- [ ] Docker 和 Docker Compose 已安装
- [ ] 代码已上传到服务器
- [ ] `.env.production` 已配置
- [ ] 所有容器状态为 `Up`
- [ ] 可以通过浏览器访问网站
- [ ] 用户可以注册和登录
- [ ] 游戏可以正常加载
- [ ] 防火墙已配置
- [ ] 数据库备份已设置

---

## 🎯 下一步优化

部署成功后，可以考虑：

1. **配置域名和 SSL**
   - 申请域名并完成备案
   - 申请 SSL 证书
   - 配置 HTTPS

2. **性能优化**
   - 配置 CDN 加速静态资源
   - 优化数据库查询
   - 调整 JVM 参数

3. **监控告警**
   - 配置 Prometheus + Grafana
   - 设置日志收集（ELK）
   - 配置告警通知

4. **高可用**
   - 配置数据库主从复制
   - 使用负载均衡
   - 多实例部署

---

## 📚 相关文档

- [完整部署指南](./DEPLOYMENT_GUIDE.md) - 详细的部署步骤和配置
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md) - 确保没有遗漏
- [快速开始](./DOCKER_DEPLOYMENT.md) - 常用命令参考
- [系统架构](./ARCHITECTURE_AND_DEPLOYMENT.md) - 架构图和数据流

---

**祝部署顺利！** 🎉

如有问题，查看日志是最快的排查方式：
```bash
docker-compose logs -f [service-name]
```
