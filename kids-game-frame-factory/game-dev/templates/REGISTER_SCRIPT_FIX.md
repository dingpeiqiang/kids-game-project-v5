# register-game.sql 严重错误修复

## 🚨 发现的严重错误

### 错误概述
模板脚本使用了**完全错误的表结构和字段**,与真实数据库 schema 不匹配。

---

## ❌ 原脚本错误详情

### 错误 1: **表名错误**

```sql
-- ❌ 错误：使用不存在的表名
INSERT IGNORE INTO game (...)
INSERT IGNORE INTO game_difficulty (...)
INSERT IGNORE INTO theme (...)

-- ✅ 正确：真实的表名
INSERT INTO t_game (...)
INSERT INTO t_game_config (...)
INSERT INTO t_leaderboard_config (...)
INSERT INTO t_game_mode_config (...)
```

### 错误 2: **字段结构完全不匹配**

| ❌ 错误字段 | ✅ 真实字段 | 说明 |
|-----------|-----------|------|
| `id` | `game_id` | 主键是 BIGINT 自增 |
| `code` | `game_code` | 游戏编码 VARCHAR(50) |
| `icon` | `icon_url` | 图标 URL VARCHAR(255) |
| `difficulty_count` | **不存在** | 该字段已删除 |
| `created_at` | `create_time` | BIGINT 毫秒时间戳 |
| `updated_at` | `update_time` | BIGINT 毫秒时间戳 |

### 错误 3: **时间戳格式错误**

```sql
-- ❌ 错误：使用 NOW()
NOW()

-- ✅ 正确：毫秒级时间戳
UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000
```

**原因**: 数据库 schema 中定义的时间戳类型是 BIGINT，存储毫秒级时间戳。

### 错误 4: **缺少核心配置表**

原脚本只有简单的 3 个表，实际需要配置 4 个表：

```sql
✅ 必须配置的表：
1. t_game                  - 游戏基本信息
2. t_game_config          - 游戏参数配置（JSON 格式）
3. t_leaderboard_config   - 排行榜维度配置
4. t_game_mode_config     - 游戏模式配置

❌ 原脚本中的错误表：
- game (不存在)
- game_difficulty (不存在)
- theme (不存在此表，或已废弃)
```

---

## ✅ 修复后的脚本

### 1. 正确的游戏注册

```sql
SET @GAME_CODE = 'MY_GAME';
SET @GAME_NAME = '我的游戏';
SET @GAME_CATEGORY = 'puzzle';
SET @GAME_GRADE = 'primary';
SET @GAME_ICON = '/images/games/game_icon.png';
SET @GAME_DESCRIPTION = '游戏描述...';
SET @MODULE_PATH = '../games/my_game/GameContainer';
SET @CREATOR_ID = 1;

INSERT INTO t_game(
    game_code, 
    game_name, 
    category, 
    grade, 
    icon_url, 
    cover_url, 
    description, 
    status, 
    sort_order, 
    consume_points_per_minute, 
    module_path,
    creator_id,
    create_time, 
    update_time
)
VALUES(
    @GAME_CODE,
    @GAME_NAME,
    @GAME_CATEGORY,
    @GAME_GRADE,
    @GAME_ICON,
    @GAME_ICON,
    @GAME_DESCRIPTION,
    2,  -- ON_SALE
    10,
    1,
    @MODULE_PATH,
    @CREATOR_ID,
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000
);

SET @game_id = LAST_INSERT_ID();
```

### 2. 游戏参数配置（JSON 格式）

```sql
INSERT INTO t_game_config(game_id, config_key, config_value, description, create_time, update_time) VALUES
-- 基础参数
(@game_id, 'grid_width', '30', '游戏区域宽度 (格子)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'grid_height', '20', '游戏区域高度 (格子)', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),

-- 难度配置（JSON）
(@game_id, 'easy_mode', '{"speed": 150, "score_multiplier": 1.0}', '简单模式', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'normal_mode', '{"speed": 100, "score_multiplier": 1.5}', '普通模式', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'hard_mode', '{"speed": 60, "score_multiplier": 2.0}', '困难模式', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),

-- 积分配置（JSON）
(@game_id, 'points_config', '{"item1": 10, "item2": 20}', '积分配置', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),

-- 颜色配置（JSON）
(@game_id, 'colors_config', '{"primary": "#4CAF50", "background": "#FFFFFF"}', '颜色配置', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),

-- 控制配置
(@game_id, 'enable_touch_control', '1', '触摸控制', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'enable_keyboard_control', '1', '键盘控制', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);
```

### 3. 排行榜配置

```sql
INSERT INTO t_leaderboard_config(game_id, dimension_code, dimension_name, dimension_type, sort_order, is_enabled, create_time, update_time) VALUES
(@game_id, 'highest_score', '最高分数', 'SCORE', 'DESC', 1, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'total_score', '累计分数', 'SCORE', 'DESC', 1, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'games_played', '游戏次数', 'COUNT', 'DESC', 1, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);
```

### 4. 游戏模式配置

```sql
INSERT INTO t_game_mode_config(game_id, mode_type, mode_name, enabled, config_json, sort_order, create_time, update_time) VALUES
(@game_id, 'single_player', '单机模式', 1, 
 '{"difficulty": "normal", "time_limit": 0, "max_players": 1}', 
 1,
 UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,
 UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);
```

---

## 📊 对比总结

### 原脚本问题

| 方面 | 问题 |
|------|------|
| **表名** | ❌ 使用错误的简写名称（game 而非 t_game） |
| **字段** | ❌ 字段名与实际 schema 完全不匹配 |
| **时间戳** | ❌ 使用 NOW() 而非毫秒时间戳 |
| **配置表** | ❌ 缺少 t_game_config 等核心表 |
| **JSON 配置** | ❌ 没有 JSON 格式的配置 |
| **验证查询** | ❌ 查询不存在的表 |

### 修复后改进

| 方面 | 改进 |
|------|------|
| **表名** | ✅ 使用正确的表名（t_game, t_game_config 等） |
| **字段** | ✅ 完全匹配实际 schema 定义 |
| **时间戳** | ✅ 使用 UNIX_TIMESTAMP * 1000 |
| **配置表** | ✅ 包含所有 4 个必需的表 |
| **JSON 配置** | ✅ 支持难度、积分、颜色等 JSON 配置 |
| **验证查询** | ✅ 查询所有相关表确认注册成功 |

---

## 🔧 使用说明

### 执行步骤

1. **修改配置变量**
   ```sql
   SET @GAME_CODE = 'MY_GAME';
   SET @GAME_NAME = '我的游戏';
   SET @MODULE_PATH = '../games/my_game/GameContainer';
   ```

2. **调整游戏参数**
   ```sql
   -- 根据你的游戏类型修改 grid_width, grid_height 等
   -- 修改难度配置、积分配置等 JSON
   ```

3. **执行脚本**
   ```bash
   mysql -u root -p kids_game < register-game.sql
   ```

4. **验证结果**
   ```sql
   SELECT * FROM t_game WHERE game_code = 'MY_GAME';
   SELECT * FROM t_game_config WHERE game_id = xxx;
   ```

---

## ⚠️ 注意事项

1. **game_code 必须唯一且大写**
   - 例如：`SNAKE_VUE3`, `PLANE_SHOOTER`

2. **module_path 指向 GameContainer**
   - 格式：`../games/{game_id}/GameContainer`

3. **所有时间戳必须是毫秒级**
   - `UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000`
   - 不能用 `NOW()` 或 `CURRENT_TIMESTAMP`

4. **JSON 配置要符合 MySQL JSON 格式**
   - 使用双引号：`{"key": "value"}`
   - 不能用单引号

5. **status 状态值**
   - 0: 草稿
   - 1: 待审核
   - 2: 已上架 ✅
   - 3: 已下架
   - 4: 审核驳回

---

## 📚 参考文档

- **数据库 Schema**: `kids-game-backend/kids-game-web/src/main/resources/schema_v2.sql`
- **贪吃蛇示例**: `kids-game-house/games/snake/register-game.sql`
- **修复后模板**: `.lingma/skills/game-dev/templates/register-game.template.sql`

---

## ✅ 验证清单

执行脚本后，确保：

- [ ] `t_game` 表中有一条新记录
- [ ] `t_game_config` 表中有至少 10 条配置记录
- [ ] `t_leaderboard_config` 表中有至少 3 条记录
- [ ] `t_game_mode_config` 表中有至少 1 条记录
- [ ] 所有记录的 `game_id` 都相同
- [ ] 时间戳都是毫秒级（13 位数字）
- [ ] JSON 配置能被 MySQL 解析

---

**修复完成时间**: 2026-03-28  
**影响范围**: 所有使用该模板创建的新游戏  
**严重程度**: 🔴 严重（会导致游戏注册失败）
