# register-game.sql 问题排查清单

## 🔍 请逐项检查以下问题

### 1️⃣ 执行时报什么错误？

```bash
mysql -u root -p kids_game < register-game.sql
```

**常见错误及解决方案：**

#### ❌ ERROR 1146 (42S02): Table 'kids_game.game' doesn't exist
- **原因**: 使用了错误的表名
- **解决**: 使用 `t_game` 而不是 `game`
- **状态**: ✅ 模板已修复

#### ❌ ERROR 1054 (42S22): Unknown column 'id' in 'field list'
- **原因**: 字段名错误，应该是 `game_id`
- **解决**: 使用正确的字段名
- **状态**: ✅ 模板已修复

#### ❌ ERROR 1054 (42S22): Unknown column 'created_at' in 'field list'
- **原因**: 应该是 `create_time`（BIGINT 毫秒时间戳）
- **解决**: 使用 `UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000`
- **状态**: ✅ 模板已修复

#### ❌ ERROR 1054 (42S22): Unknown column 'code' in 'field list'
- **原因**: 应该是 `game_code`
- **解决**: 使用正确的字段名
- **状态**: ✅ 模板已修复

---

### 2️⃣ 你的脚本是从哪里复制的？

#### ❌ 从旧的 template 复制
- **问题**: 可能包含错误的表名和字段
- **解决**: 重新从最新模板复制

```bash
# 复制最新模板
cp .lingma/skills/game-dev/templates/register-game.template.sql \
   kids-game-house/games/my-game/register-game.sql
```

#### ✅ 从贪吃蛇示例复制
- **参考**: `kids-game-house/games/snake/register-game.sql`
- **说明**: 这是经过验证的正确脚本

---

### 3️⃣ 检查你的 SQL 脚本

#### 表名检查
```sql
-- ❌ 错误
INSERT INTO game (...)
INSERT INTO game_difficulty (...)

-- ✅ 正确
INSERT INTO t_game (...)
INSERT INTO t_game_config (...)
INSERT INTO t_leaderboard_config (...)
INSERT INTO t_game_mode_config (...)
```

#### 字段检查
```sql
-- ❌ 错误
id, code, icon, created_at, updated_at

-- ✅ 正确
game_id, game_code, icon_url, create_time, update_time
```

#### 时间戳检查
```sql
-- ❌ 错误
NOW(), CURRENT_TIMESTAMP

-- ✅ 正确
UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000
```

---

### 4️⃣ 完整的正确脚本结构

```sql
-- =============================================
-- 1. 设置游戏配置变量
-- =============================================
SET @GAME_CODE = 'MY_GAME';
SET @GAME_NAME = '我的游戏';
SET @GAME_CATEGORY = 'puzzle';
SET @GAME_GRADE = 'primary';
SET @GAME_ICON = '/images/games/game_icon.png';
SET @GAME_DESCRIPTION = '游戏描述...';
SET @MODULE_PATH = '../games/my_game/GameContainer';
SET @CREATOR_ID = 1;
SET @STATUS = 2;

-- =============================================
-- 2. 创建游戏记录（t_game 表）
-- =============================================
INSERT INTO t_game(
    game_code, game_name, category, grade, 
    icon_url, cover_url, description, 
    status, sort_order, consume_points_per_minute, 
    module_path, creator_id, create_time, update_time
)
VALUES(
    @GAME_CODE, @GAME_NAME, @GAME_CATEGORY, @GAME_GRADE,
    @GAME_ICON, @GAME_ICON, @GAME_DESCRIPTION,
    @STATUS, 10, 1,
    @MODULE_PATH, @CREATOR_ID,
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000
);

SET @game_id = LAST_INSERT_ID();

-- =============================================
-- 3. 游戏参数配置（t_game_config 表）
-- =============================================
INSERT INTO t_game_config(game_id, config_key, config_value, description, create_time, update_time) VALUES
(@game_id, 'grid_width', '30', '游戏区域宽度', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'grid_height', '20', '游戏区域高度', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'easy_mode', '{"speed": 150}', '简单模式', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- =============================================
-- 4. 排行榜配置（t_leaderboard_config 表）
-- =============================================
INSERT INTO t_leaderboard_config(game_id, dimension_code, dimension_name, dimension_type, sort_order, is_enabled, create_time, update_time) VALUES
(@game_id, 'highest_score', '最高分数', 'SCORE', 'DESC', 1, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- =============================================
-- 5. 游戏模式配置（t_game_mode_config 表）
-- =============================================
INSERT INTO t_game_mode_config(game_id, mode_type, mode_name, enabled, config_json, sort_order, create_time, update_time) VALUES
(@game_id, 'single_player', '单机模式', 1, '{"difficulty": "normal"}', 1, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- =============================================
-- 6. 验证查询
-- =============================================
SELECT '✅ 游戏注册完成！' AS status;
SELECT * FROM t_game WHERE game_code = @GAME_CODE;
SELECT * FROM t_game_config WHERE game_id = @game_id;
```

---

### 5️⃣ 数据库表结构验证

```sql
-- 检查 t_game 表是否存在
SHOW TABLES LIKE 't_game';

-- 检查 t_game 表结构
DESC t_game;

-- 检查 t_game_config 表是否存在
SHOW TABLES LIKE 't_game_config';

-- 检查 t_leaderboard_config 表是否存在
SHOW TABLES LIKE 't_leaderboard_config';

-- 检查 t_game_mode_config 表是否存在
SHOW TABLES LIKE 't_game_mode_config';
```

如果以上任何表不存在，说明数据库 schema 未正确初始化。

**解决方案**:
```bash
# 重新初始化数据库
mysql -u root -p kids_game < kids-game-backend/kids-game-web/src/main/resources/schema_v2.sql
```

---

### 6️⃣ 执行步骤验证

#### 步骤 1: 复制正确的模板
```bash
cd kids-game-house/games/my-game
cp ../../.lingma/skills/game-dev/templates/register-game.template.sql ./register-game.sql
```

#### 步骤 2: 修改配置变量
```sql
SET @GAME_CODE = 'MY_GAME';              -- 改成你的游戏代码
SET @GAME_NAME = '我的游戏';             -- 改成你的游戏名称
SET @MODULE_PATH = '../games/my_game/GameContainer';
```

#### 步骤 3: 执行脚本
```bash
mysql -u root -p kids_game < register-game.sql
```

#### 步骤 4: 验证结果
```sql
-- 应该看到类似输出
+------------------+
| status           |
+------------------+
| ✅ 游戏注册完成！  |
+------------------+

-- 查看游戏记录
SELECT * FROM t_game WHERE game_code = 'MY_GAME';

-- 查看配置记录
SELECT COUNT(*) FROM t_game_config WHERE game_id = xxx;
```

---

### 7️⃣ 如果还是报错

请提供以下信息：

1. **完整的错误信息**
   ```
   ERROR XXXX (XXXXX): XXXXXXXXX
   ```

2. **你执行的命令**
   ```bash
   mysql -u root -p kids_game < register-game.sql
   ```

3. **你的 SQL 脚本内容**（前 30 行）
   ```sql
   -- 粘贴你的脚本
   ```

4. **数据库版本**
   ```sql
   SELECT VERSION();
   ```

5. **表是否存在**
   ```sql
   SHOW TABLES LIKE 't_game';
   ```

---

### 8️⃣ 常见错误速查表

| 错误代码 | 错误信息 | 原因 | 解决方案 |
|---------|---------|------|---------|
| 1146 | Table doesn't exist | 表名错误 | 使用 `t_game` 而非 `game` |
| 1054 | Unknown column | 字段名错误 | 检查字段名（如 `game_id` 非 `id`） |
| 1062 | Duplicate entry | 重复的游戏代码 | 修改 `game_code` 为大写唯一值 |
| 1048 | Column cannot be NULL | 必填字段为空 | 确保所有必填字段有值 |
| 1292 | Incorrect datetime value | 时间戳格式错误 | 使用 `UNIX_TIMESTAMP * 1000` |

---

### 9️⃣ 参考文档

- **修复后的模板**: [register-game.template.sql](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\.lingma\skills\game-dev\templates\register-game.template.sql)
- **详细修复说明**: [REGISTER_SCRIPT_FIX.md](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\.lingma\skills\game-dev\templates\REGISTER_SCRIPT_FIX.md)
- **完整总结报告**: [REGISTER_SCRIPT_CRITICAL_FIX.md](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\.lingma\skills\game-dev\REGISTER_SCRIPT_CRITICAL_FIX.md)
- **贪吃蛇示例**: `kids-game-house/games/snake/register-game.sql`
- **数据库 Schema**: `kids-game-backend/kids-game-web/src/main/resources/schema_v2.sql`

---

### 📞 需要帮助？

请告诉我：
1. 具体的错误信息
2. 你使用的脚本来源
3. 执行的具体命令

我会帮你定位具体问题！
