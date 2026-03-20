# 运维手册

本文档包含项目日常运维相关的操作指南和最佳实践。

---

## 📚 目录

### 1. 日常运维

| 文档 | 说明 |
|------|------|
| [日志查看](./logs.md) | 如何查看和分析系统日志 |
| [性能监控](./monitoring.md) | 系统性能监控和指标 |
| [备份恢复](./backup-restore.md) | 数据备份和恢复操作 |

### 2. 数据库运维

| 文档 | 说明 |
|------|------|
| [数据库维护](./database-maintenance.md) | 数据库日常维护操作 |
| [SQL 脚本使用](./sql-scripts.md) | 项目 SQL 脚本使用指南 |

### 3. 缓存运维

| 文档 | 说明 |
|------|------|
| [Redis 管理](./redis-management.md) | Redis 缓存管理操作 |

### 4. 监控告警

| 文档 | 说明 |
|------|------|
| [告警配置](./alerts.md) | 告警规则配置 |
| [故障处理](./troubleshooting.md) | 常见故障处理指南 |

---

## 🔧 常用运维命令

### 后端服务

```bash
# 重启后端服务
cd kids-game-backend/kids-game-web
mvn spring-boot:run

# 查看后端日志
tail -f logs/application.log

# 清理后端构建
mvn clean
```

### 前端服务

```bash
# 重启前端开发服务器
cd kids-game-frontend
npm run dev

# 清理 Vite 缓存
npm run clear-cache

# 重新安装依赖
rm -rf node_modules
npm install
```

### 游戏服务

```bash
# 重启所有游戏
cd kids-game-house
./stop-all-games.bat
./start-all-games.bat
```

---

## 📊 健康检查

### 服务状态检查

```bash
# 检查后端健康
curl http://localhost:8080/api/health

# 检查前端
curl http://localhost:5173

# 检查数据库连接
mysql -u root -p -e "SELECT 1"

# 检查 Redis 连接
redis-cli ping
```

### 日志关键词

- `ERROR` - 需要立即处理的错误
- `WARN` - 警告信息
- `FATAL` - 致命错误

---

**最后更新**: 2026-03-20
**版本**: v1.0.0
