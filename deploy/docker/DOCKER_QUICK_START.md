# Docker 快速部署指南

## 📦 文件位置说明

所有 Docker 相关文件已统一移动到 `docker/` 目录：

```
项目根目录/
└── docker/                          # Docker 相关文件
    ├── build-images.ps1             # 本地镜像构建 + 一键部署脚本
    ├── DOCKER_QUICK_START.md       # 快速部署指南
    ├── scripts/                     # 部署脚本
    │   └── deploy-from-images.sh   # 服务器端部署脚本
    ├── mysql/                       # MySQL 配置
    │   └── init.sql                # 数据库初始化脚本
    ├── nginx/                       # Nginx 配置
    │   └── frontend.conf           # 前端 Nginx 配置
    ├── Dockerfile.frontend         # 前端构建配置
    ├── Dockerfile.backend.lowmem   # 后端构建配置
    ├── docker-compose.lowmem.yml   # Docker Compose 配置
    └── .env.production.example     # 环境变量示例
```

---

## 🚀 快速部署（2 步完成）

### 步骤 1：构建并部署

```powershell
cd docker
.\build-images.ps1
```

脚本会询问是否立即部署到服务器：
- 输入 `y` - 自动上传镜像和配置，并远程执行部署
- 输入 `n` - 仅构建镜像，稍后手动上传

---

### 步骤 2：验证部署

访问服务器 IP 查看应用是否正常运行。

---

## 🔧 常用命令速查

### 本地构建

```powershell
# 进入 docker 目录
cd docker

# 构建镜像（可选择是否立即部署）
.\build-images.ps1

# 清理旧镜像
docker system prune -f
```

### 服务器操作

```bash
# SSH 登录
ssh root@服务器IP

# 进入部署目录
cd ~/workspace/kids-game-project-v5/docker/scripts

# 使用服务管理工具（推荐）
./manage-service.sh backend restart    # 重启后端
./manage-service.sh frontend logs      # 查看前端日志
./manage-service.sh all status         # 查看所有服务状态

# 或直接使用 docker compose
docker compose --file ../docker-compose.lowmem.yml ps           # 查看状态
docker compose --file ../docker-compose.lowmem.yml restart     # 重启所有
docker compose --file ../docker-compose.lowmem.yml logs -f     # 查看所有日志
```

---

## 📝 日志管理

部署后，日志会自动分离到 `docker/logs/` 目录：

```
docker/logs/
├── backend.log    # 后端日志
├── frontend.log   # 前端日志
├── mysql.log      # MySQL 日志
└── redis.log      # Redis 日志
```

查看日志：

```bash
# 实时查看后端日志
tail -f ../logs/backend.log

# 查看最近 100 行
tail -n 100 ../logs/backend.log

# 搜索错误
grep "ERROR" ../logs/backend.log
```

---

## ⚠️ 重要提示

1. **内存限制：** 服务器只有 2GB 内存，使用 `docker-compose.lowmem.yml`
2. **配置文件：** 首次部署前必须编辑 `.env` 文件设置密码
3. **端口占用：** 确保 80、3306、6379、8080 端口空闲
4. **Docker Compose V2：** 使用 `docker compose` 命令（带空格）

---

## 🆘 遇到问题？

1. 检查服务日志：`docker logs <容器名>`
2. 查看项目根目录的 `DEPLOYMENT_OPTIMIZATION.md`
3. 查看 `docker/` 目录下的详细文档
