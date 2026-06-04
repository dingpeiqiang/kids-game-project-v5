# 数据库初始化脚本修正说明

## ✅ 已修正的问题

### 1. **表名和字段与 schema_v2.sql 不一致**

**之前的问题：**
- ❌ 使用了 `sys_user`、`sys_role` 等旧表名
- ❌ 字段定义与实际 Java 实体类不匹配
- ❌ 时间字段使用 `DATETIME`，实际应该用 `BIGINT`（毫秒时间戳）
- ❌ 缺少 `deleted` 逻辑删除字段

**修正后：**
- ✅ 使用 `t_user`、`t_role`、`t_game` 等标准表名
- ✅ 字段完全对齐 `schema_v2.sql`
- ✅ 时间字段使用 `BIGINT` + `UNIX_TIMESTAMP() * 1000`
- ✅ 所有表都有 `deleted` 字段支持逻辑删除

---

### 2. **游戏状态值错误**

**之前的问题：**
```sql
-- ❌ 错误：status=1 表示待审核，不是已上架
INSERT INTO game (..., status) VALUES (..., 1);
```

**修正后：**
```sql
-- ✅ 正确：status=2 表示已上架
INSERT INTO t_game (..., status) VALUES (..., 2);
```

**状态值说明：**
- `0` - 草稿
- `1` - 待审核
- `2` - 已上架 ✅
- `3` - 已下架
- `4` - 审核驳回

---

### 3. **缺少 USE 语句位置说明**

**规范要求：**
根据记忆中的规范，SQL 脚本必须在文件开头明确指定目标数据库。

**修正后：**
```sql
CREATE DATABASE IF NOT EXISTS kids_game 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE kids_game;  -- ✅ 在创建表之前指定数据库
```

---

### 4. **游戏 URL 格式错误**

**之前的问题：**
```sql
-- ❌ 可能缺少协议头或使用相对路径
game_url VARCHAR(255)
```

**修正后：**
```sql
-- ✅ 完整的 HTTP URL
INSERT INTO t_game (game_url) VALUES 
('http://localhost:3001'),
('http://localhost:3002');
```

---

## 📋 修正后的表结构

### 核心表清单

1. **t_user** - 统一用户表
   - 支持三种用户类型：儿童(0)、家长(1)、管理员(2)
   - 包含疲劳点数、最后登录时间等字段

2. **t_role** - 角色表
   - 超级管理员、家长、儿童三种角色

3. **t_user_role** - 用户角色关联表
   - 支持 RBAC 权限模型

4. **t_game** - 游戏信息表
   - 完整的游戏管理字段
   - 支持标签、推荐、分类等功能
   - **status=2 表示已上架**

5. **t_game_record** - 游戏记录表
   - 记录用户游戏时长、分数、消耗疲劳点

---

## 🔍 与 schema_v2.sql 的对比

| 特性 | 旧脚本 | 新脚本 | schema_v2.sql |
|------|--------|--------|---------------|
| 表名前缀 | sys_ / 无前缀 | t_ | t_ ✅ |
| 时间字段类型 | DATETIME | BIGINT | BIGINT ✅ |
| 逻辑删除 | ❌ 无 | ✅ deleted 字段 | ✅ deleted 字段 |
| 游戏状态值 | 1（错误） | 2（已上架） | 2（已上架）✅ |
| URL 格式 | 不明确 | 完整 HTTP URL | 完整 URL ✅ |
| 字段对齐 | ❌ 不匹配 | ✅ 完全匹配 | 标准定义 |

---

## 🎯 初始数据说明

### 1. 默认角色
```sql
INSERT INTO t_role (role_code, role_name, description, status, sort_order) VALUES 
('SUPER_ADMIN', '超级管理员', '拥有所有权限', 1, 1),
('PARENT', '家长', '家长用户', 1, 2),
('KID', '儿童', '儿童用户', 1, 3);
```

### 2. 默认管理员
```sql
-- 用户名: admin
-- 密码: admin123 (BCrypt 加密)
-- 用户类型: 2 (管理员)
INSERT INTO t_user (user_type, username, password, nickname, status) VALUES 
(2, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '管理员', 1);
```

**⚠️ 生产环境必须修改密码！**

### 3. 示例游戏
```sql
-- 4 个示例游戏，status=2（已上架）
INSERT INTO t_game (game_code, game_name, category, description, game_url, status, sort_order, is_featured) VALUES 
('snake', '贪吃蛇', 'CLASSIC', '经典贪吃蛇游戏', 'http://localhost:3001', 2, 1, 1),
('plane-shooter', '飞机大战', 'SHOOTING', '射击类游戏', 'http://localhost:3002', 2, 2, 1),
('pvz', '植物大战僵尸', 'STRATEGY', '策略塔防游戏', 'http://localhost:3003', 2, 3, 1),
('tank-battle', '坦克大战', 'ACTION', '经典坦克对战', 'http://localhost:3004', 2, 4, 0);
```

---

## 📝 使用建议

### Docker 部署时
脚本会在 MySQL 容器首次启动时自动执行，无需手动操作。

### 本地开发时
如果需要重新初始化数据库：
```bash
# 进入 MySQL 容器
docker-compose exec mysql bash

# 执行初始化脚本
mysql -ukidgame -p kids_game < /docker-entrypoint-initdb.d/init.sql
```

### 生产环境注意事项
1. **修改管理员密码**
   ```sql
   UPDATE t_user 
   SET password = '$2a$10$新生成的BCrypt哈希' 
   WHERE username = 'admin';
   ```

2. **修改游戏 URL**
   ```sql
   UPDATE t_game 
   SET game_url = REPLACE(game_url, 'localhost', 'your-domain.com');
   ```

3. **删除示例数据（可选）**
   ```sql
   DELETE FROM t_game WHERE game_code IN ('snake', 'plane-shooter', 'pvz', 'tank-battle');
   ```

---

## 🔗 相关文档

- [schema_v2.sql](../kids-game-backend/kids-game-web/src/main/resources/schema_v2.sql) - 完整的数据库设计
- [register-game.sql 规范](./DEVELOPMENT_STANDARDS.md) - 游戏注册 SQL 编写规范
- [Docker 部署指南](./ALIYUN_DIRECT_DEPLOY.md) - 阿里云部署指南

---

## ✅ 验证清单

部署后验证数据库是否正确初始化：

```bash
# 进入 MySQL
docker-compose exec mysql mysql -ukidgame -p kids_game

# 检查表是否存在
SHOW TABLES;
# 应该看到：t_user, t_role, t_user_role, t_game, t_game_record

# 检查管理员用户
SELECT * FROM t_user WHERE username = 'admin';

# 检查角色
SELECT * FROM t_role;

# 检查游戏数据
SELECT game_code, game_name, status FROM t_game;
# status 应该都是 2（已上架）
```

---

**修正完成时间**: 2026-04-23  
**基于版本**: schema_v2.sql v2.1.0
