# 后端环境变量配置说明

## 📋 概述

后端应用支持通过**环境变量**动态配置所有敏感信息和运行时参数。

---

## 🔐 敏感信息配置（必须）

### 1. 数据库配置

| 变量名 | 说明 | 示例 | 默认值 |
|--------|------|------|--------|
| `SPRING_DATASOURCE_URL` | 数据库连接 URL | `jdbc:mysql://mysql:3306/kids_game?...` | 本地开发地址 |
| `SPRING_DATASOURCE_USERNAME` | 数据库用户名 | `kidgame` | `minimalgame` |
| `SPRING_DATASOURCE_PASSWORD` | 数据库密码 | `your-secure-password` | `minimalgame123` |

**Docker Compose 配置：**
```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/kids_game?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false
  SPRING_DATASOURCE_USERNAME: ${MYSQL_USER:-kidgame}
  SPRING_DATASOURCE_PASSWORD: ${MYSQL_PASSWORD:-kidgame123}
```

---

### 2. JWT 密钥（重要！）

| 变量名 | 说明 | 示例 | 默认值 |
|--------|------|------|--------|
| `JWT_SECRET` | JWT 签名密钥（至少32字符） | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` | ⚠️ 不安全 |
| `JWT_EXPIRATION` | Token 过期时间（毫秒） | `604800000` (7天) | `604800000` |

**生成安全密钥：**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Docker Compose 配置：**
```yaml
environment:
  JWT_SECRET: ${JWT_SECRET}  # 必须在 .env 文件中设置
```

---

### 3. 腾讯云 COS 配置（可选）

| 变量名 | 说明 | 示例 | 默认值 |
|--------|------|------|--------|
| `TENCENT_COS_SECRET_ID` | COS Secret ID | `AKIDxxxxxxxxxxxxx` | 空（不使用COS） |
| `TENCENT_COS_SECRET_KEY` | COS Secret Key | `xxxxxxxxxxxxxxx` | 空 |
| `TENCENT_COS_BUCKET` | 存储桶名称 | `my-bucket-123456` | 空 |
| `TENCENT_COS_REGION` | 区域 | `ap-guangzhou` | `ap-guangzhou` |
| `TENCENT_COS_BASE_URL` | CDN 域名 | `https://cdn.example.com` | COS 默认域名 |

**注意：** 如果不使用 COS，这些变量可以留空，系统会自动使用本地存储。

---

### 4. SFTP 配置（可选）

| 变量名 | 说明 | 示例 | 默认值 |
|--------|------|------|--------|
| `SFTP_ENABLED` | 是否启用 SFTP | `true` / `false` | `false` |
| `SFTP_HOST` | SFTP 服务器地址 | `106.54.7.205` | 空 |
| `SFTP_PORT` | SFTP 端口 | `22` | `22` |
| `SFTP_USERNAME` | SFTP 用户名 | `dingsftp` | 空 |
| `SFTP_PASSWORD` | SFTP 密码 | `your-password` | 空 |
| `SFTP_BASE_DIRECTORY` | 基础目录 | `/upload` | `/upload` |
| `SFTP_BASE_URL` | 访问 URL | `http://106.54.7.205/files` | 空 |

---

## ⚙️ 运行时配置（可选）

### 5. 服务器配置

| 变量名 | 说明 | 示例 | 默认值 |
|--------|------|------|--------|
| `SERVER_PORT` | 服务端口 | `8080` | `8080` |

---

### 6. Redis 配置（可选）

| 变量名 | 说明 | 示例 | 默认值 |
|--------|------|------|--------|
| `REDIS_HOST` | Redis 主机 | `redis` | `localhost` |
| `REDIS_PORT` | Redis 端口 | `6379` | `6379` |
| `REDIS_PASSWORD` | Redis 密码 | `your-password` | 空 |
| `REDIS_DATABASE` | Redis 数据库编号 | `0` | `0` |

---

### 7. 数据库连接池配置

| 变量名 | 说明 | 示例 | 默认值 |
|--------|------|------|--------|
| `DB_MIN_IDLE` | 最小空闲连接数 | `5` | `5` |
| `DB_MAX_POOL` | 最大连接池大小 | `20` | `20` |

---

### 8. 游戏配置

| 变量名 | 说明 | 示例 | 默认值 |
|--------|------|------|--------|
| `GAME_TIME_LIMIT` | 游戏时长限制（分钟） | `30` | `30` |
| `FATIGUE_INITIAL_POINTS` | 初始疲劳点数 | `10` | `10` |
| `FATIGUE_DAILY_LIMIT` | 每日疲劳点上限 | `10` | `10` |
| `FATIGUE_POINTS_PER_ANSWER` | 每题消耗点数 | `1` | `1` |
| `PARENT_DEFAULT_PIN` | 家长默认 PIN 码 | `0000` | `0000` |

---

### 9. API 限流配置

| 变量名 | 说明 | 示例 | 默认值 |
|--------|------|------|--------|
| `API_RATE_LIMIT` | 每分钟请求限制 | `100` | `100` |

---

### 10. 日志配置

| 变量名 | 说明 | 示例 | 默认值 |
|--------|------|------|--------|
| `LOG_LEVEL_ROOT` | 根日志级别 | `INFO` / `DEBUG` | `INFO` |
| `LOG_LEVEL_APP` | 应用日志级别 | `INFO` / `DEBUG` | `INFO` |
| `LOG_LEVEL_MYBATIS` | MyBatis 日志级别 | `WARN` / `DEBUG` | `WARN` |
| `LOG_FILE_PATH` | 日志文件路径 | `/app/logs/application.log` | `/app/logs/application.log` |

---

## 📝 完整配置示例

### `.env` 文件（生产环境）

```bash
# ========================================
# 数据库配置
# ========================================
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/kids_game?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false
SPRING_DATASOURCE_USERNAME=kidgame
SPRING_DATASOURCE_PASSWORD=SecureDbPassword123!

# ========================================
# JWT 配置（必须修改为安全的随机字符串）
# ========================================
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRATION=604800000

# ========================================
# Redis 配置（如果使用）
# ========================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=RedisPassword123!

# ========================================
# 腾讯云 COS 配置（可选）
# ========================================
# TENCENT_COS_SECRET_ID=AKIDxxxxxxxxxxxxx
# TENCENT_COS_SECRET_KEY=xxxxxxxxxxxxxxx
# TENCENT_COS_BUCKET=my-bucket-123456
# TENCENT_COS_REGION=ap-guangzhou

# ========================================
# SFTP 配置（可选）
# ========================================
# SFTP_ENABLED=true
# SFTP_HOST=106.54.7.205
# SFTP_USERNAME=dingsftp
# SFTP_PASSWORD=SftpPassword123!

# ========================================
# 其他配置
# ========================================
SERVER_PORT=8080
DB_MIN_IDLE=5
DB_MAX_POOL=20
API_RATE_LIMIT=100
LOG_LEVEL_ROOT=INFO
LOG_LEVEL_APP=INFO
```

---

## 🚀 使用方法

### 方法 1：Docker Compose（推荐）

在 `docker-compose.yml` 中：

```yaml
services:
  backend:
    environment:
      SPRING_DATASOURCE_URL: ${SPRING_DATASOURCE_URL}
      SPRING_DATASOURCE_PASSWORD: ${SPRING_DATASOURCE_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      # ... 其他变量
```

启动时自动读取 `.env` 文件。

### 方法 2：命令行指定

```bash
docker run -e JWT_SECRET=my-secret \
           -e SPRING_DATASOURCE_PASSWORD=db-pass \
           kids-game-backend
```

### 方法 3：Kubernetes ConfigMap/Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: kids-game-secrets
type: Opaque
data:
  jwt-secret: bXktc2VjcmV0LWtleQ==  # base64 编码
  db-password: ZGItcGFzc3dvcmQ=
```

---

## 🔍 验证配置

### 1. 查看容器环境变量

```bash
docker-compose exec backend env | grep JWT
docker-compose exec backend env | grep SPRING_DATASOURCE
```

### 2. 检查应用启动日志

```bash
docker-compose logs backend | grep "Started"
docker-compose logs backend | grep "HikariPool"
```

### 3. 测试 API

```bash
curl http://localhost:8080/actuator/health
```

---

## ⚠️ 安全注意事项

### ❌ 不要做的事情

1. **不要将 `.env` 文件提交到 Git**
   ```bash
   echo ".env" >> .gitignore
   ```

2. **不要在代码中硬编码密码**
   ```yaml
   # ❌ 错误
   password: my-password
   
   # ✅ 正确
   password: ${DB_PASSWORD}
   ```

3. **不要使用弱密钥**
   ```bash
   # ❌ 错误
   JWT_SECRET=123456
   
   # ✅ 正确
   JWT_SECRET=$(openssl rand -base64 32)
   ```

### ✅ 最佳实践

1. **使用强密码和密钥**
2. **定期轮换密钥**
3. **不同环境使用不同的 `.env` 文件**
4. **生产环境使用 Docker Secrets 或 Vault**

---

## 📊 配置优先级

Spring Boot 读取配置的优先级（从高到低）：

1. 命令行参数：`--jwt.secret=xxx`
2. JVM 系统属性：`-Djwt.secret=xxx`
3. **操作系统环境变量** ← Docker 注入的在这里
4. `application-{profile}.yml`
5. `application.yml`

---

## 🎯 快速开始

### 步骤 1：创建 `.env` 文件

```bash
cp .env.production.example .env
vim .env
```

### 步骤 2：填写必要配置

```bash
# 必须修改的配置
JWT_SECRET=生成一个随机密钥
SPRING_DATASOURCE_PASSWORD=设置数据库密码
```

### 步骤 3：启动服务

```bash
docker-compose up -d
```

### 步骤 4：验证

```bash
docker-compose logs backend | tail -20
```

---

## 📚 相关文档

- [Docker 部署指南](../ALIYUN_DIRECT_DEPLOY.md)
- [低内存部署](../LOW_MEMORY_DEPLOY.md)
- [资源上传配置](../RESOURCE_UPLOAD_CONFIG.md)

---

## 💡 提示

1. **开发环境**可以使用默认值，方便快速启动
2. **生产环境**必须修改所有敏感配置
3. **定期更新**密钥和密码
4. **备份** `.env` 文件但不要提交到 Git
