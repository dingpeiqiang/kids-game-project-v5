# 日志查看指南

## 📍 日志位置

### 后端日志

```
kids-game-backend/kids-game-web/logs/
├── application.log      # 应用日志
├── error.log          # 错误日志
└── access.log         # 访问日志
```

### 前端日志

前端日志主要通过浏览器控制台查看：
- 打开浏览器开发者工具（F12）
- 切换到 Console 标签

### 游戏日志

各游戏日志位于对应目录的 `logs/` 子目录：
- `kids-game-house/snake-vue3/logs/`
- `kids-game-house/plants-vs-zombie/logs/`

---

## 🔍 查看日志命令

### 实时查看日志

```bash
# 实时查看后端应用日志
tail -f kids-game-backend/kids-game-web/logs/application.log

# 实时查看错误日志
tail -f kids-game-backend/kids-game-web/logs/error.log

# 实时查看所有日志
tail -f kids-game-backend/kids-game-web/logs/*.log
```

### 查看最近日志

```bash
# 查看最后 100 行
tail -100 kids-game-backend/kids-game-web/logs/application.log

# 查看最后 50 行错误日志
tail -50 kids-game-backend/kids-game-web/logs/error.log
```

### 搜索日志内容

```bash
# 搜索包含 "ERROR" 的日志
grep "ERROR" kids-game-backend/kids-game-web/logs/application.log

# 搜索包含特定关键词的日志
grep "userId=123" kids-game-backend/kids-game-web/logs/application.log

# 搜索某个时间段的日志
grep "2024-03-20 10:" kids-game-backend/kids-game-web/logs/application.log

# 统计错误数量
grep -c "ERROR" kids-game-backend/kids-game-web/logs/application.log
```

---

## 📝 日志级别

| 级别 | 说明 | 使用场景 |
|------|------|----------|
| ERROR | 错误 | 功能异常、需要修复的问题 |
| WARN | 警告 | 潜在问题、性能警告 |
| INFO | 信息 | 重要业务操作记录 |
| DEBUG | 调试 | 开发调试信息 |

---

## 🎯 常见日志分析

### 用户登录问题

```bash
# 搜索登录相关日志
grep "login\|Login\|LOGIN" kids-game-backend/kids-game-web/logs/application.log

# 搜索认证失败日志
grep "auth\|Auth\|AUTH\|fail\|Fail" kids-game-backend/kids-game-web/logs/application.log
```

### 数据库问题

```bash
# 搜索 SQL 执行日志
grep "sql\|SQL\|JdbcTemplate" kids-game-backend/kids-game-web/logs/application.log

# 搜索连接池日志
grep "pool\|Pool\|connection" kids-game-backend/kids-game-web/logs/application.log
```

### API 调用问题

```bash
# 搜索 API 请求日志
grep "api\|Api\|API" kids-game-backend/kids-game-web/logs/application.log

# 搜索控制器日志
grep "Controller" kids-game-backend/kids-game-web/logs/application.log
```

---

## 🛠️ 日志配置

### 修改日志级别

编辑 `application.yml` 或 `logback-spring.xml`：

```xml
<!-- 日志级别配置 -->
<logger name="com.kidgame" level="DEBUG"/>
<logger name="org.springframework" level="INFO"/>
<logger name="com.baomidou.mybatisplus" level="DEBUG"/>
```

### 日志文件轮转

日志文件默认按天轮转，保留 30 天。

---

**最后更新**: 2026-03-20
**版本**: v1.0.0
