# 部署指南

本文档提供项目的部署和运维指南，包括开发环境、测试环境和生产环境的部署方法。

---

## 📚 目录

| 文档 | 说明 |
|------|------|
| [环境要求](./requirements.md) | 部署环境要求 |
| [开发环境部署](./dev-environment.md) | 开发环境搭建 |
| [生产环境部署](./production.md) | 生产环境部署 |
| [Docker 部署](./docker.md) | Docker 容器化部署 |

---

## 🏠 部署架构

```
                    ┌─────────────────┐
                    │   Nginx/CDN     │
                    │  (反向代理)     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌────────────┐ ┌────────────┐ ┌────────────┐
     │   前端     │ │   后端     │ │   游戏     │
     │  Vue 3     │ │ Spring Boot│ │  Phaser 3  │
     │  :5173     │ │   :8080    │ │  :3001-30xx│
     └────────────┘ └─────┬──────┘ └────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   数据库集群     │
                 │  MySQL + Redis  │
                 └─────────────────┘
```

---

## 📋 快速部署

### 一键部署脚本（开发环境）

```bash
# 1. 启动后端
cd kids-game-backend
mvn clean install -DskipTests
cd kids-game-web
mvn spring-boot:run

# 2. 启动前端
cd kids-game-frontend
npm install
npm run dev

# 3. 启动游戏（可选）
cd kids-game-house
install-dependencies.bat
start-all-games.bat
```

---

## 🌐 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端开发服务器 | 5173 | Vue 3 开发服务器 |
| 后端 API | 8080 | Spring Boot 服务 |
| 数据库 | 3306 | MySQL 数据库 |
| Redis | 6379 | Redis 缓存 |
| 贪吃蛇游戏 | 3003 | Phaser 游戏 |
| PVZ 游戏 | 3004 | Phaser 游戏 |

---

## 🔒 环境变量

### 后端环境变量

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kidgame
DB_USERNAME=root
DB_PASSWORD=your_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT 配置
JWT_SECRET=your_secret_key
JWT_EXPIRATION=604800000
```

### 前端环境变量

```bash
# API 地址
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=儿童游戏平台
```

---

## 📦 构建产物

### 后端构建

```bash
cd kids-game-backend
mvn clean package -DskipTests

# 产物位置
kids-game-web/target/kids-game-web.jar
```

### 前端构建

```bash
cd kids-game-frontend
npm run build

# 产物位置
dist/
```

### 游戏构建

```bash
cd kids-game-house/snake-vue3
npm run build

# 产物位置
dist/
```

---

**最后更新**: 2026-03-20
**版本**: v1.0.0
