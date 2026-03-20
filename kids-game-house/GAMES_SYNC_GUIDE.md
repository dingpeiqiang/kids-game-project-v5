# 🎮 Kids Game House 游戏同步指南

**更新时间**: 2026-03-17  
**状态**: ✅ 已完成

---

## 📋 目录结构

Kids Game House 目录包含以下两款游戏:

```
kids-game-house/
├── snake-vue3/              # 贪吃蛇大冒险
│   ├── src/                 # 源代码
│   ├── public/              # 公共资源
│   ├── package.json         # 依赖配置
│   └── vite.config.ts       # Vite 配置
├── plants-vs-zombie/        # 植物大战僵尸
│   ├── src/                 # 源代码
│   ├── public/              # 公共资源
│   ├── package.json         # 依赖配置
│   └── vite.config.ts       # Vite 配置
├── build-all-games.bat      # 构建所有游戏
├── start-all-games.bat      # 启动所有游戏
└── stop-all-games.bat       # 停止所有游戏
```

---

## 🗄️ 数据库配置

### Step 1: 执行 SQL 脚本

**方式一：使用批处理文件 (推荐)**

```bash
cd kids-game-backend
init-houses-games.bat
```

**方式二：手动执行 SQL**

在 MySQL Workbench、Navicat 或其他 MySQL 客户端中执行:

```bash
mysql -u root -p kids_game < init-houses-games.sql
```

**方式三：直接复制 SQL 内容**

打开 `init-houses-games.sql` 文件，复制内容并在 MySQL 客户端中执行。

---

### Step 2: 验证数据

执行成功后，应该看到类似输出:

```
========================================
✅ 游戏数据初始化成功!
========================================

已添加的游戏:
  1. SNAKE_VUE3 - 贪吃蛇大冒险 (http://localhost:3003)
  2. PLANTS_VS_ZOMBIE - 植物大战僵尸 (http://localhost:3004)
```

**查询验证**:
```sql
SELECT 
    game_id, 
    game_code, 
    game_name, 
    category, 
    game_url, 
    status
FROM t_game
WHERE game_code IN ('SNAKE_VUE3', 'PLANTS_VS_ZOMBIE')
ORDER BY sort_order;
```

**预期结果**:
| game_id | game_code | game_name | category | game_url | status |
|---------|-----------|-----------|----------|----------|--------|
| 1 | SNAKE_VUE3 | 贪吃蛇大冒险 | PUZZLE | http://localhost:3003 | 1 |
| 2 | PLANTS_VS_ZOMBIE | 植物大战僵尸 | PUZZLE | http://localhost:3004 | 1 |

---

## 🚀 启动游戏

### 方式一：单独启动

#### 启动贪吃蛇

```bash
cd kids-game-house/snake-vue3
npm install  # 首次运行需要安装依赖
npm run dev
```

**访问**: http://localhost:3003

#### 启动植物大战僵尸

```bash
cd kids-game-house/plants-vs-zombie
npm install  # 首次运行需要安装依赖
npm run dev
```

**访问**: http://localhost:3004

---

### 方式二：批量启动

**启动所有游戏**:
```bash
cd kids-game-house
start-all-games.bat
```

**停止所有游戏**:
```bash
cd kids-game-house
stop-all-games.bat
```

**构建所有游戏**:
```bash
cd kids-game-house
build-all-games.bat
```

---

## 🔧 配置文件说明

### 贪吃蛇 (snake-vue3)

**vite.config.ts**:
```typescript
export default defineConfig({
  server: {
    port: 3003,  // 贪吃蛇端口
  },
  // ... 其他配置
})
```

**package.json**:
```json
{
  "name": "snake-vue3",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

### 植物大战僵尸 (plants-vs-zombie)

**vite.config.ts**:
```typescript
export default defineConfig({
  server: {
    port: 3004,  // 植物大战僵尸端口
  },
  // ... 其他配置
})
```

**package.json**:
```json
{
  "name": "pvz-defend-vue3-game",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

---

## 🌐 前端集成

### 主前端会自动加载游戏

访问主前端页面后，系统会:

1. **调用后端 API**: `/api/game/list`
2. **获取游戏列表**: 包含 SNAKE_VUE3 和 PLANTS_VS_ZOMBIE
3. **显示游戏卡片**: 在儿童首页展示
4. **点击开始游戏**: 跳转到对应的游戏 URL

### 游戏 URL 映射

| 游戏代码 | 游戏名称 | 访问地址 |
|---------|---------|---------|
| SNAKE_VUE3 | 贪吃蛇大冒险 | http://localhost:3003 |
| PLANTS_VS_ZOMBIE | 植物大战僵尸 | http://localhost:3004 |

---

## 🔍 故障排查

### 问题 1: 数据库执行失败

**错误**: `Can't connect to MySQL server`

**解决方案**:
1. 检查 MySQL 服务是否运行
2. 确认数据库 `kids_game` 存在
3. 检查用户名密码是否正确

```bash
# 检查 MySQL 服务状态 (Windows)
net start | findstr MySQL

# 启动 MySQL 服务 (如果需要管理员权限)
net start MySQL80
```

---

### 问题 2: 游戏无法启动

**错误**: `npm: command not found`

**解决方案**:
1. 安装 Node.js (https://nodejs.org/)
2. 确保 npm 已添加到 PATH

```bash
# 检查 Node.js 和 npm 版本
node -v
npm -v
```

---

### 问题 3: 端口被占用

**错误**: `Port 3003 is already in use`

**解决方案**:
```bash
# Windows: 查找占用端口的进程
netstat -ano | findstr :3003

# 杀死进程 (替换 PID)
taskkill /PID <PID> /F

# 或者修改 vite.config.ts 中的端口
server: {
  port: 3005  # 改用其他端口
}
```

---

### 问题 4: 前端看不到游戏

**检查步骤**:

1. **验证后端 API**
   ```bash
   curl http://localhost:8080/api/game/list
   ```

2. **检查浏览器控制台**
   - 打开开发者工具 (F12)
   - 查看 Network 标签
   - 检查 `/api/game/list` 请求

3. **验证游戏数据**
   ```sql
   SELECT * FROM t_game WHERE status = 1;
   ```

---

## 📊 游戏数据结构

### 数据库表：t_game

| 字段 | 类型 | 说明 |
|------|------|------|
| game_id | BIGINT | 游戏 ID (主键) |
| game_code | VARCHAR(50) | 游戏代码 (唯一) |
| game_name | VARCHAR(100) | 游戏名称 |
| category | VARCHAR(50) | 分类 (PUZZLE/ACTION 等) |
| grade | VARCHAR(50) | 适用年级 |
| icon_url | VARCHAR(500) | 图标 URL |
| cover_url | VARCHAR(500) | 封面 URL |
| description | TEXT | 游戏描述 |
| game_url | VARCHAR(500) | 游戏访问地址 |
| module_path | VARCHAR(500) | 模块路径 (可选) |
| status | INT | 状态 (0=下架，1=上架) |
| sort_order | INT | 排序顺序 |
| consume_points_per_minute | INT | 每分钟消耗疲劳点 |

---

## 🎯 下一步

### 开发新游戏

如果要添加第三款游戏:

1. **创建游戏目录**
   ```bash
   cd kids-game-house
   mkdir new-game
   ```

2. **初始化项目**
   ```bash
   cd new-game
   npm init vue@latest
   ```

3. **配置端口**
   修改 `vite.config.ts`:
   ```typescript
   server: {
     port: 3005  // 使用新端口
   }
   ```

4. **添加到数据库**
   修改 `init-houses-games.sql`,添加新的 INSERT 语句:
   ```sql
   INSERT INTO t_game (...) VALUES (...);
   ```

5. **重启后端**
   ```bash
   cd kids-game-backend
   mvn spring-boot:run
   ```

---

## 📝 经验总结

### 关键点

1. **数据库优先**: 先在游戏数据库中注册游戏
2. **独立部署**: 每个游戏独立运行，通过 URL 访问
3. **端口管理**: 为每个游戏分配固定端口
4. **配置集中**: 游戏信息统一在数据库管理

### 最佳实践

1. **使用批处理**: 创建 `.bat` 或 `.sh` 脚本简化操作
2. **文档化**: 记录所有配置和步骤
3. **自动化**: 尽可能使用脚本自动执行
4. **验证**: 每次操作后都要验证结果

---

## 🔗 相关文档

- [QUICK_START.md](./QUICK_START.md) - 快速开始指南
- [README.md](./README.md) - 项目说明
- [TEST_GUIDE.md](./TEST_GUIDE.md) - 测试指南

---

*文档更新于 2026-03-17*  
*状态：✅ 已完成并验证*
