# 2GB 内存服务器部署指南

## ⚠️ 重要说明

**2GB 内存非常紧张**，需要进行特殊优化。本指南提供低内存部署方案。

---

## 📊 内存分配方案

| 服务 | 内存限制 | 说明 |
|------|---------|------|
| MySQL | 400MB | 数据库服务 |
| Redis | 100MB | 缓存服务 |
| Backend (JVM) | 512MB | Spring Boot 应用 |
| Frontend (Nginx) | 64MB | 静态文件服务 |
| 系统预留 | ~900MB | 操作系统和 Docker |
| **总计** | **~2GB** | - |

---

## 🚀 快速部署（2GB 内存）

### 1. 连接到服务器

```bash
ssh root@your-server-ip
```

### 2. 安装 Docker

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | bash -s docker
systemctl start docker
systemctl enable docker

# 安装 Docker Compose V2（插件，勿用旧版 docker-compose v1，Docker 24+ 会报 ContainerConfig）
apt-get update && apt-get install -y docker-compose-plugin
docker compose version

# 配置镜像加速
mkdir -p /etc/docker
tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://docker.m.daocloud.io"]
}
EOF
systemctl restart docker
```

### 3. 上传代码

```bash
mkdir -p /opt/apps && cd /opt/apps
git clone https://github.com/your-username/kids-game-project-v5.git
cd kids-game-project-v5
```

### 4. 配置环境变量

```bash
cp .env.production.example .env.production
vim .env.production
```

**最小化配置：**
```bash
MYSQL_ROOT_PASSWORD=强密码
MYSQL_PASSWORD=强密码
JWT_SECRET=至少32位密钥
VITE_API_BASE_URL=http://服务器IP/api
```

### 5. 使用低内存配置部署

```bash
cd deploy/docker
cp .env.lowmem.example .env
# 按需合并 .env.production 中的 MYSQL/JWT 等
docker compose up -d
```

### 6. 验证部署

```bash
cd deploy/docker
docker compose ps

# 查看资源使用
docker stats

# 测试访问
curl http://localhost
```

---

## 🔧 关键优化点

### 1. JVM 参数优化

```bash
-Xms128m              # 初始堆内存 128MB
-Xmx256m              # 最大堆内存 256MB
-XX:MetaspaceSize=64m     # 元空间初始 64MB
-XX:MaxMetaspaceSize=128m # 元空间最大 128MB
-XX:+UseSerialGC      # 串行 GC（适合低内存）
```

**为什么这样配置？**
- 小堆内存使用 Serial GC 更高效
- 减少 GC 停顿时间
- 降低内存开销

### 2. MySQL 优化

```yaml
command: >
  mysqld
  --innodb-buffer-pool-size=128M    # InnoDB 缓冲池 128MB
  --innodb-log-file-size=48M        # 日志文件 48MB
  --performance-schema=OFF          # 关闭性能监控
  --max-connections=50              # 最大连接数 50
  --table-open-cache=2000           # 表缓存 2000
  --thread-cache-size=8             # 线程缓存 8
```

**优化效果：**
- 减少 MySQL 内存占用到 400MB 以内
- 关闭不必要的功能
- 限制连接数防止内存溢出

### 3. Redis 优化

```yaml
command: >
  redis-server
  --maxmemory 80mb                  # 最大内存 80MB
  --maxmemory-policy allkeys-lru    # LRU 淘汰策略
  --appendonly yes                  # 持久化
```

**优化效果：**
- 严格限制内存使用
- 自动淘汰旧数据
- 保持数据持久化

### 4. Docker 资源限制

```yaml
mem_limit: 512m        # 硬限制
mem_reservation: 256m  # 软限制（预留）
```

**作用：**
- 防止单个容器占用过多内存
- 保证系统稳定性
- 避免 OOM（内存溢出）

---

## 📈 监控和维护

### 实时监控内存使用

```bash
# 实时查看容器内存使用
docker stats

# 查看系统内存
free -h

# 查看内存使用情况
htop  # 如果已安装
```

### 预期内存使用

```
CONTAINER ID   NAME                MEM USAGE / LIMIT
xxx            kids-game-mysql     300MB / 400MB
xxx            kids-game-redis     50MB / 100MB
xxx            kids-game-backend   400MB / 512MB
xxx            kids-game-frontend  20MB / 64MB
```

**总使用**: ~770MB（容器）+ ~500MB（系统）= ~1.3GB  
**剩余**: ~700MB（用于缓存和突发）

---

## ⚡ 性能优化建议

### 1. 启用 Swap（交换空间）

```bash
# 创建 2GB swap 文件
dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 永久启用
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 调整 swappiness（降低使用 swap 的倾向）
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.conf
```

**作用：**
- 防止 OOM Killer 杀死进程
- 提供额外的虚拟内存
- 注意：swap 速度慢，仅作应急

### 2. 禁用不必要的服务

```bash
# 停止不需要的系统服务
systemctl stop cups
systemctl disable cups

systemctl stop avahi-daemon
systemctl disable avahi-daemon

# 查看正在运行的服务
systemctl list-units --type=service --state=running
```

### 3. 清理 Docker 资源

```bash
# 定期清理未使用的镜像和容器
docker system prune -a -f

# 清理未使用的卷
docker volume prune -f

# 设置定时清理（每周日凌晨 3 点）
crontab -e
# 添加：0 3 * * 0 docker system prune -a -f >> /var/log/docker-cleanup.log 2>&1
```

### 4. 优化 Spring Boot 应用

在 `application.yml` 中添加：

```yaml
spring:
  # 禁用 DevTools
  devtools:
    restart:
      enabled: false
  
  # 简化 Jackson 配置
  jackson:
    default-property-inclusion: non_null

# Tomcat 优化
server:
  tomcat:
    max-threads: 50        # 减少线程数
    min-spare-threads: 10
    accept-count: 50
```

---

## 🚫 不要做的事情

### ❌ 不要启动游戏服务

```bash
# 错误：内存不足
docker-compose --profile games up -d

# 正确：只运行核心服务
docker compose up -d
```

### ❌ 不要同时运行多个 Java 应用

每个 Java 应用至少需要 256MB 内存，2GB 服务器只能运行一个。

### ❌ 不要禁用健康检查

虽然健康检查会消耗少量资源，但能帮助及时发现服务异常。

### ❌ 不要使用大型基础镜像

使用 `alpine` 版本可以节省磁盘空间和内存。

---

## 🔍 故障排查

### 问题 1：容器被 OOM Killer 杀死

**症状：**
```bash
docker ps
# 某些容器频繁重启
```

**解决：**
```bash
# 查看系统日志
dmesg | grep -i "out of memory"

# 增加 swap 空间
# 或升级服务器内存
```

### 问题 2：应用启动缓慢

**原因：** JVM 初始化需要时间

**解决：**
```bash
# 增加健康检查的启动等待时间
healthcheck:
  start_period: 120s  # 增加到 2 分钟
```

### 问题 3：MySQL 连接失败

**原因：** 内存不足导致 MySQL 启动失败

**解决：**
```bash
# 查看 MySQL 日志
docker compose logs mysql

# 进一步减少 MySQL 内存
# 编辑 docker-compose.yml / MySQL command，调整 innodb-buffer-pool-size
```

### 问题 4：响应速度慢

**原因：** 内存紧张导致频繁 GC

**解决：**
```bash
# 监控 GC 情况
docker compose logs backend | grep GC

# 考虑升级内存或优化代码
```

---

## 📊 性能基准

### 2GB 服务器预期性能

| 指标 | 预期值 |
|------|--------|
| 并发用户数 | 50-100 |
| API 响应时间 | 200-500ms |
| 页面加载时间 | 1-3 秒 |
| 数据库查询 | 50-200ms |
| 正常运行时间 | 99%+ |

### 监控命令

```bash
# 每分钟记录一次资源使用
while true; do
  echo "$(date): $(free -m | grep Mem)" >> /var/log/memory-usage.log
  sleep 60
done &
```

---

## 🎯 升级建议

如果遇到问题，考虑以下升级方案：

### 方案 1：升级到 4GB 内存（推荐）

**优势：**
- 更充足的内存空间
- 可以启用更多优化
- 支持更多并发用户

**成本：**
- 阿里云 ECS 4核4GB：约 ¥200-300/月

### 方案 2：使用外部数据库

**做法：**
- 使用阿里云 RDS MySQL
- 本地只运行后端和前端

**优势：**
- 减轻本地内存压力
- 数据库更稳定

**成本：**
- RDS MySQL 基础版：约 ¥100-200/月

### 方案 3：分离服务

**做法：**
- 服务器 1：MySQL + Redis
- 服务器 2：Backend + Frontend

**优势：**
- 资源隔离
- 更好的性能

**成本：**
- 两台低配服务器：约 ¥200-400/月

---

## ✅ 部署检查清单

- [ ] 使用 `deploy/docker/.env.lowmem.example` 复制为 `.env`（低内存 JVM）
- [ ] JVM 参数设置为 `-Xmx256m`
- [ ] MySQL 缓冲池设置为 128MB
- [ ] Redis 最大内存设置为 80MB
- [ ] 启用了 swap 空间（可选但推荐）
- [ ] 禁用了不必要的系统服务
- [ ] 设置了 Docker 资源限制
- [ ] 监控内存使用情况
- [ ] 没有启动游戏服务
- [ ] 定期清理 Docker 资源

---

## 📚 相关文档

- [标准部署指南](./ALIYUN_DIRECT_DEPLOY.md)
- [Docker 配置说明](./DOCKER_DEPLOYMENT.md)
- [资源上传配置](./RESOURCE_UPLOAD_CONFIG.md)

---

## 💡 总结

**2GB 内存可以运行，但需要注意：**

✅ **可以做：**
- 运行核心服务（前端 + 后端 + MySQL + Redis）
- 支持 50-100 并发用户
- 正常使用所有功能

❌ **不要做：**
- 启动游戏服务
- 运行其他大型应用
- 期望高性能

⚡ **优化要点：**
1. 使用 `deploy/docker/docker-compose.yml` + `.env.lowmem.example`
2. 启用 swap 空间
3. 严格限制各服务内存
4. 定期监控和清理

**如果预算允许，强烈建议升级到 4GB 内存！**
