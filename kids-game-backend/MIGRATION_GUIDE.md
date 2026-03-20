# 游戏平台解耦 - 数据库迁移指南

## 概述

本文档说明如何手动执行数据库迁移，为游戏平台解耦功能添加必要的数据库字段和索引。

## 迁移内容

### 1. t_game 表扩展

添加以下字段以支持独立部署的游戏：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| game_url | VARCHAR(500) | 游戏访问地址URL（独立部署时使用） |
| game_secret | VARCHAR(100) | 游戏密钥（用于签名验证） |
| game_config | JSON | 游戏配置（透传给游戏的JSON配置） |

### 2. t_game_session 表扩展

添加以下字段用于游戏会话管理：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| session_token | VARCHAR(100) UNIQUE | 会话令牌（用于游戏验证） |

### 3. 索引

为 `session_token` 字段添加索引以提升查询性能。

## 方法一：使用 MySQL 客户端（推荐）

### Windows 命令行

```cmd
cd c:\Users\a1521\Desktop\kids-game-project\kids-game-backend
mysql -h 106.54.7.205 -u kidsgame -p kidgame < migration-game-decoupling.sql
```

输入密码：`Kidsgame2026!Secure`

### 使用批处理脚本（已创建）

直接双击运行 `run-migration.bat` 文件：

```cmd
cd c:\Users\a1521\Desktop\kids-game-project\kids-game-backend
run-migration.bat
```

## 方法二：使用数据库管理工具

### 使用 Navicat / DBeaver / MySQL Workbench

1. 连接到数据库：`106.54.7.205:3306/kidgame`
2. 用户名：`kidsgame`
3. 密码：`Kidsgame2026!Secure`
4. 打开查询编辑器
5. 复制 `migration-game-decoupling.sql` 的内容
6. 执行 SQL

### 使用 phpMyAdmin

1. 访问 phpMyAdmin（如果有配置）
2. 选择 `kidgame` 数据库
3. 点击"SQL"标签
4. 粘贴 SQL 内容
5. 点击"执行"

## 方法三：使用 Spring Boot 自动迁移

已创建自动迁移任务类 `GameDecouplingMigrationTask.java`。

### 启用自动迁移

1. 确保 `t_system_config` 表存在（已包含在 `system_config_schema.sql` 中）
2. 重启 Spring Boot 应用

迁移任务会在应用启动时自动执行：
- 检查是否已执行过迁移（通过 `t_system_config` 表）
- 如果未执行，则自动添加字段和索引
- 标记迁移已执行

### 跳过自动迁移

如果需要跳过自动迁移，设置 JVM 参数：

```bash
java -Dskip.game.decoupling.migration=true -jar kids-game-web.jar
```

或者在 IDE 中运行配置：
- VM Options: `-Dskip.game.decoupling.migration=true`

## 验证迁移结果

### 方法一：查看表结构

```sql
-- 查看 t_game 表结构
DESC t_game;

-- 应该包含以下新字段：
-- game_url      VARCHAR(500)
-- game_secret   VARCHAR(100)
-- game_config   JSON

-- 查看 t_game_session 表结构
DESC t_game_session;

-- 应该包含以下新字段：
-- session_token VARCHAR(100)
```

### 方法二：查询迁移状态

```sql
-- 检查迁移标记
SELECT * FROM t_system_config WHERE config_key = 'GAME_DECOUPLING_MIGRATION_V1';
```

### 方法三：测试新字段

```sql
-- 测试添加游戏 URL
UPDATE t_game 
SET game_url = 'https://example.com/game1'
WHERE game_code = 'snake';

-- 查询结果
SELECT game_id, game_code, game_name, game_url, game_config 
FROM t_game 
WHERE game_url IS NOT NULL;
```

## 回滚迁移（如需要）

如果需要回滚迁移，执行以下 SQL：

```sql
ALTER TABLE t_game DROP COLUMN game_url;
ALTER TABLE t_game DROP COLUMN game_secret;
ALTER TABLE t_game DROP COLUMN game_config;
ALTER TABLE t_game_session DROP COLUMN session_token;
ALTER TABLE t_game_session DROP INDEX idx_session_token;
```

## 故障排查

### 问题 1：MySQL 客户端版本不兼容

**错误信息**：`Authentication plugin 'mysql_native_password' cannot be loaded`

**解决方案**：
- 使用数据库管理工具（Navicat、DBeaver 等）手动执行 SQL
- 或者使用 Spring Boot 自动迁移

### 问题 2：字段已存在错误

**错误信息**：`Duplicate column name 'game_url'`

**解决方案**：
- 这是正常的，说明字段已存在
- 迁移任务会自动检查并跳过已存在的字段

### 问题 3：权限不足

**错误信息**：`Access denied for user`

**解决方案**：
- 确认数据库用户有 ALTER TABLE 权限
- 使用 root 用户执行：
  ```sql
  GRANT ALL PRIVILEGES ON kidgame.* TO 'kidsgame'@'%';
  ```

## 下一步

迁移完成后，继续执行以下步骤：

1. ✅ 数据库迁移（本文档）
2. ⏳ 后端代码编译
3. ⏳ 后端 API 测试
4. ⏳ 创建 GameFrame 组件
5. ⏳ 扩展 API 服务
6. ⏳ 修改游戏页面
7. ⏳ 完成功能测试

## 相关文档

- [游戏平台解耦设计文档](GAME_PLATFORM_DECOUPLING_DESIGN.md)
- [实施指南](IMPLEMENTATION_GUIDE.md)
- [迁移脚本](migration-game-decoupling.sql)
