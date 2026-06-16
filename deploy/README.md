# 构建部署脚本目录

## 目录结构

```
deploy/
├── README.md                    # 本说明文档
├── deploy.cmd                   # 统一入口（交互式菜单）
├── deploy.bat                   # Docker 部署脚本（Windows）
├── deploy.sh                    # Docker 部署脚本（Linux/Mac）
├── start-dev-all.bat            # 本地开发环境一键启动（Windows）
├── build-production.bat         # 生产环境构建脚本（Windows）
├── DEPLOYMENT_GUIDE.md          # 详细部署指南
├── ALIYUN_DIRECT_DEPLOY.md      # 阿里云直接部署指南
├── ALIYUN_DEPLOYMENT_PREPARATION.md  # 阿里云部署准备清单
├── LOW_MEMORY_DEPLOY.md         # 低内存环境部署指南
└── docker/                      # Docker 部署配置
    ├── docker-compose.yml       # 主 Docker Compose 配置
    ├── docker-compose.lowmem.yml # 低内存 Docker Compose 配置
    ├── .env.example             # 环境变量示例
    ├── .env.production.example  # 生产环境变量示例
    ├── Dockerfile.backend       # 后端 Dockerfile
    ├── Dockerfile.backend.lowmem # 后端低内存版 Dockerfile
    ├── Dockerfile.frontend      # 前端 Dockerfile
    ├── Dockerfile.games         # 游戏服务 Dockerfile
    ├── Dockerfile.kids-game-simple # 简易游戏 Dockerfile
    ├── nginx/                   # Nginx 配置
    │   ├── frontend.conf        # 管理端 Nginx 配置
    │   ├── kids-game-simple.conf # 游戏终端 Nginx 配置
    │   └── ssl/                 # SSL 证书
    ├── mysql/                   # MySQL 初始化脚本
    │   └── init.sql             # 数据库初始化
    ├── games/                   # 游戏启动脚本
    │   └── start-games.sh       # 游戏服务启动脚本
    ├── scripts/                 # Docker 辅助脚本
    │   ├── deploy-from-images.sh # 从镜像部署
    │   ├── docker-entrypoint.sh  # Docker 入口脚本
    │   ├── health-check.sh       # 健康检查
    │   ├── manage-logs.sh        # 日志管理
    │   ├── manage-service.sh     # 服务管理
    │   ├── setup-logging.sh      # 日志配置
    │   └── verify.sh             # 部署验证
    └── build-images.ps1         # PowerShell 构建脚本
```

## 快速指南

### 本地开发

```powershell
# Windows PowerShell
.\deploy\start-dev-all.ps1
```

### 生产部署

```powershell
# Windows PowerShell
.\deploy\deploy.ps1

# Linux/Mac
./deploy/deploy.sh deploy
```

### Docker 部署

```bash
cd deploy/docker
cp .env.example .env
# 编辑 .env 配置
docker-compose up -d
```

## 文件用途说明

### 入口脚本

| 文件 | 用途 | 平台 |
|------|------|------|
| `deploy.ps1` | Docker 一键部署（含环境检查） | Windows |
| `start-dev-all.ps1` | 启动本地开发环境（后端+管理端+终端） | Windows |
| `build-production.ps1` | 生产环境构建 | Windows |
| `deploy.sh` | Docker 一键部署（含环境检查） | Linux/Mac |

### 部署文档

| 文件 | 用途 |
|------|------|
| `DEPLOYMENT_GUIDE.md` | 详细部署指南 |
| `ALIYUN_DIRECT_DEPLOY.md` | 阿里云直接部署步骤 |
| `ALIYUN_DEPLOYMENT_PREPARATION.md` | 阿里云部署准备清单 |
| `LOW_MEMORY_DEPLOY.md` | 2GB 内存服务器部署优化 |

### Docker 配置

| 文件 | 用途 |
|------|------|
| `docker/docker-compose.yml` | 标准环境 Docker 配置 |
| `docker/docker-compose.lowmem.yml` | 低内存环境 Docker 配置 |
| `docker/.env.example` | 环境变量示例（开发/测试） |
| `docker/.env.production.example` | 环境变量示例（生产） |

### 脚本说明

| 文件 | 用途 |
|------|------|
| `docker/scripts/deploy-from-images.sh` | 从预构建镜像快速部署 |
| `docker/scripts/manage-service.sh` | 服务启动/停止/重启管理 |
| `docker/scripts/manage-logs.sh` | 日志查看和清理 |
| `docker/scripts/verify.sh` | 部署后验证 |

## 端口说明

| 服务 | 端口 | 地址 |
|------|------|------|
| 后端服务 | 8080 | http://localhost:8080 |
| 管理端 | 3000 | http://localhost:3000 |
| 游戏终端 | 3001 | http://localhost:3001 |

## 使用场景

| 场景 | 推荐脚本 |
|------|----------|
| 日常开发 | `start-dev-all.ps1` |
| 测试环境部署 | `deploy.ps1` / `deploy.sh` |
| 生产环境部署 | `deploy.ps1` / `deploy.sh` + `LOW_MEMORY_DEPLOY.md` |
| 生产构建 | `build-production.ps1` |
| 快速验证 | `docker/scripts/verify.sh` |
