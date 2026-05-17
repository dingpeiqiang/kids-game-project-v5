# 阿里云部署 - 5 分钟快速参考

> **适用场景**：直接在阿里云服务器上部署，从 SSH 连接开始

---

## 🚀 快速部署命令（复制粘贴即可）

### ⚠️ 2GB 内存服务器？

如果你的服务器只有 **2GB 内存**，请使用低内存配置：

```bash
# 使用低内存配置文件
docker-compose -f docker-compose.lowmem.yml up -d
```

详见：[LOW_MEMORY_DEPLOY.md](./LOW_MEMORY_DEPLOY.md)

---

### 1. 连接到服务器后，安装 Docker

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | bash -s docker
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 配置镜像加速
mkdir -p /etc/docker
tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://docker.m.daocloud.io"]
}
EOF
systemctl restart docker
```

### 2. 上传代码

```bash
# 创建目录并克隆代码
mkdir -p /opt/apps && cd /opt/apps
git clone https://github.com/your-username/kids-game-project-v5.git
cd kids-game-project-v5
```

### 3. 配置环境变量

```bash
# 复制配置模板
cp .env.production.example .env.production

# 编辑配置（修改密码和密钥）
vim .env.production
```

**必须修改的配置：**
```bash
MYSQL_ROOT_PASSWORD=强密码
MYSQL_PASSWORD=强密码
JWT_SECRET=至少32位的随机密钥
VITE_API_BASE_URL=http://服务器IP/api

# COS 配置（可选，默认使用本地存储）
# COS_SECRET_ID=你的COS Secret ID
# COS_SECRET_KEY=你的COS Secret Key
# COS_BUCKET=kids-game-resources-app-id
```

### 4. 一键部署

```bash
chmod +x deploy.sh
./deploy.sh deploy
```

### 5. 验证访问

浏览器访问：`http://你的服务器IP`

---

## 📋 完整步骤清单

| 步骤 | 操作 | 命令/说明 |
|------|------|----------|
| 1️⃣ | 购买服务器 | 4核8GB，Ubuntu 22.04，开放 80/443/22 端口 |
| 2️⃣ | SSH 连接 | `ssh root@服务器IP` |
| 3️⃣ | 安装 Docker | 复制上面的安装命令 |
| 4️⃣ | 上传代码 | Git 克隆或 WinSCP 上传 |
| 5️⃣ | 配置环境 | 编辑 `.env.production` |
| 6️⃣ | 执行部署 | `./deploy.sh deploy` |
| 7️⃣ | 验证访问 | 浏览器访问服务器 IP |

---

## 🔍 常用维护命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend    # 后端
docker-compose logs -f frontend   # 前端

# 重启服务
docker-compose restart

# 备份数据库
./deploy.sh backup

# 更新应用
git pull && ./deploy.sh deploy

# 进入容器
docker-compose exec backend sh
```

---

## ⚠️ 注意事项

1. **密码安全**：使用强密码（至少 16 位）
2. **配置文件**：`.env.production` 不要提交到 Git
3. **防火墙**：部署后配置防火墙规则
4. **备份**：设置定时数据库备份
5. **监控**：定期检查资源使用情况

---

## 🆘 遇到问题？

```bash
# 查看详细错误日志
docker-compose logs [service-name]

# 检查配置是否正确
docker-compose config

# 查看容器状态
docker-compose ps

# 重新启动
docker-compose down && docker-compose up -d
```

---

**详细文档**：[ALIYUN_DIRECT_DEPLOY.md](./ALIYUN_DIRECT_DEPLOY.md)
