# 游戏配置化启动指南

## 📦 概述

游戏服务现在支持**配置化启动**，通过 `games-config.json` 文件管理所有游戏的启动配置。

---

## 🎯 核心优势

✅ **集中管理**：所有游戏配置在一个 JSON 文件中  
✅ **动态启停**：可以单独启动/停止某个游戏  
✅ **端口配置**：每个游戏独立端口，避免冲突  
✅ **状态监控**：实时查看游戏运行状态  
✅ **日志管理**：每个游戏独立日志文件  

---

## 📋 配置文件说明

### games-config.json

```json
{
  "games": [
    {
      "id": "snake",              // 游戏唯一标识
      "name": "贪吃蛇",            // 游戏名称
      "directory": "snake",        // 游戏目录名
      "port": 3001,                // 服务端口
      "enabled": true,             // 是否启用
      "description": "经典贪吃蛇游戏"  // 描述
    }
  ],
  "settings": {
    "defaultPort": 3001,           // 默认起始端口
    "portIncrement": 1,            // 端口递增
    "maxGames": 10,                // 最大游戏数
    "autoStart": true,             // 自动启动
    "healthCheck": true,           // 健康检查
    "healthCheckInterval": 30      // 检查间隔（秒）
  }
}
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd kids-game-house/games

# 安装 jq（JSON 处理工具）
apt install jq -y      # Ubuntu/Debian
# 或
yum install jq -y      # CentOS
```

### 2. 赋予执行权限

```bash
chmod +x start-games-configured.sh
chmod +x stop-games.sh
chmod +x manage-games.sh
```

### 3. 创建日志目录

```bash
mkdir -p logs
```

### 4. 启动所有游戏

```bash
./start-games-configured.sh
```

### 5. 查看状态

```bash
./manage-games.sh status
```

---

## 📖 使用命令

### 查看所有游戏状态

```bash
./manage-games.sh status
```

输出示例：
```
游戏名称               端口            状态       PID       
--------             ----            ----       ---       
贪吃蛇               3001            running    12345     
飞机大战             3002            running    12346     
植物大战僵尸         3003            stopped    dead      
坦克大战             3004            disabled   -         
```

### 列出所有游戏

```bash
./manage-games.sh list
```

### 启动所有游戏

```bash
./manage-games.sh start
# 或
./start-games-configured.sh
```

### 启动单个游戏

```bash
./manage-games.sh start snake
```

### 停止所有游戏

```bash
./manage-games.sh stop
# 或
./stop-games.sh
```

### 停止单个游戏

```bash
./manage-games.sh stop snake
```

### 重启游戏

```bash
# 重启所有
./manage-games.sh restart

# 重启单个
./manage-games.sh restart snake
```

### 查看日志

```bash
./manage-games.sh logs snake
```

---

## 🔧 配置游戏

### 添加新游戏

编辑 `games-config.json`，在 `games` 数组中添加：

```json
{
  "id": "new-game",
  "name": "新游戏",
  "directory": "new-game-folder",
  "port": 3010,
  "enabled": true,
  "description": "新游戏介绍"
}
```

### 禁用游戏

将 `enabled` 改为 `false`：

```json
{
  "id": "old-game",
  "enabled": false,  // 禁用此游戏
  ...
}
```

### 修改端口

直接修改 `port` 值：

```json
{
  "id": "snake",
  "port": 3005,  // 从 3001 改为 3005
  ...
}
```

---

## 📊 内存优化（2GB 服务器）

### 只启动必要的游戏

编辑 `games-config.json`，只启用需要的游戏：

```json
{
  "games": [
    {
      "id": "snake",
      "enabled": true   // ✅ 启动
    },
    {
      "id": "pvz",
      "enabled": false  // ❌ 不启动，节省内存
    }
  ]
}
```

### 内存估算

| 游戏 | 内存占用 | 建议 |
|------|---------|------|
| 每个 Vite 开发服务器 | ~150-200MB | 2GB 服务器最多启动 3-4 个 |
| Nginx 代理 | ~20MB | 必须 |

**2GB 服务器建议：**
- 只启动 2-3 个常用游戏
- 其他游戏设置为 `enabled: false`
- 需要时再手动启动

---

## 🔍 故障排查

### 问题 1：游戏启动失败

```bash
# 查看日志
./manage-games.sh logs snake

# 检查端口是否被占用
netstat -tlnp | grep 3001

# 手动启动测试
cd snake
npm run dev
```

### 问题 2：jq 未安装

```bash
# Ubuntu/Debian
apt install jq -y

# CentOS
yum install jq -y

# Mac
brew install jq
```

### 问题 3：端口冲突

```bash
# 查找占用端口的进程
lsof -i :3001

# 修改 games-config.json 中的端口
# 然后重启游戏
./manage-games.sh restart snake
```

### 问题 4：游戏无法访问

```bash
# 检查防火墙
ufw allow 3001/tcp  # Ubuntu
firewall-cmd --add-port=3001/tcp  # CentOS

# 检查游戏是否运行
./manage-games.sh status

# 测试本地访问
curl http://localhost:3001
```

---

## 🐳 Docker 集成

### 方式 1：使用启动脚本

在 Dockerfile.games 中：

```dockerfile
COPY kids-game-house/games /app/games
WORKDIR /app/games

RUN chmod +x start-games-configured.sh

CMD ["./start-games-configured.sh"]
```

### 方式 2：使用 Docker Compose

```yaml
services:
  games:
    build:
      context: .
      dockerfile: Dockerfile.games
    ports:
      - "3001:3001"
      - "3002:3002"
      - "3003:3003"
    volumes:
      - ./kids-game-house/games/games-config.json:/app/games/games-config.json
```

---

## 📝 最佳实践

### 1. 定期清理日志

```bash
# 清理超过 7 天的日志
find logs/ -name "*.log" -mtime +7 -delete
```

### 2. 监控资源使用

```bash
# 查看游戏进程资源使用
ps aux | grep vite

# 或使用 htop
htop
```

### 3. 备份配置

```bash
cp games-config.json games-config.json.backup
```

### 4. 使用环境变量覆盖

创建 `.env` 文件：

```bash
GAME_SNAKE_ENABLED=true
GAME_PVZ_ENABLED=false
DEFAULT_PORT=3001
```

---

## 🎯 低内存服务器部署方案

### 方案 A：只启动核心游戏

```json
{
  "games": [
    {"id": "snake", "enabled": true},
    {"id": "pvz", "enabled": true},
    {"id": "plane-shooter", "enabled": false},
    {"id": "tank-battle", "enabled": false}
  ]
}
```

### 方案 B：按需启动

```bash
# 平时只启动 1-2 个游戏
./manage-games.sh start snake

# 需要时再启动其他
./manage-games.sh start pvz

# 不需要时停止
./manage-games.sh stop pvz
```

### 方案 C：使用生产构建

```bash
# 构建生产版本（更省内存）
cd snake
npm run build
npm run preview -- --host 0.0.0.0 --port 3001
```

生产版本比开发版本节省约 50% 内存。

---

## 📚 相关文件

- [`games-config.json`](./games-config.json) - 游戏配置文件
- [`start-games-configured.sh`](./start-games-configured.sh) - 启动脚本
- [`stop-games.sh`](./stop-games.sh) - 停止脚本
- [`manage-games.sh`](./manage-games.sh) - 管理脚本

---

## 💡 提示

1. **首次启动**会比较慢（需要安装依赖）
2. **2GB 内存**建议只启动 2-3 个游戏
3. **生产环境**建议使用 `npm run build` + `preview`
4. **定期检查**日志文件大小
5. **备份配置**文件以防丢失

---

**祝游戏运营顺利！** 🎮
