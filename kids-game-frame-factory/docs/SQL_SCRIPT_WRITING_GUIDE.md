# 游戏注册 SQL 脚本编写规范

**版本**: v1.0  
**创建时间**: 2026-03-27  
**基于问题**: 飞机大战游戏注册 SQL 脚本多次修改经验总结

---

## 📋 目录

1. [数据库表结构概览](#数据库表结构概览)
2. [游戏部署模式与字段选择](#游戏部署模式与字段选择)
3. [SQL 脚本编写常见错误](#sql 脚本编写常见错误)
4. [标准 SQL 脚本模板](#标准 sql 脚本模板)
5. [检查清单](#检查清单)

---

## 数据库表结构概览

### t_game 表（游戏信息表）

**关键字段**：
```sql
game_id BIGINT AUTO_INCREMENT PRIMARY KEY
game_code VARCHAR(50) UNIQUE NOT NULL
game_name VARCHAR(100) NOT NULL
...
module_path VARCHAR(255) COMMENT '前端模块路径（内嵌模式使用）'
game_url VARCHAR(255) COMMENT '游戏访问地址 URL（独立部署使用）'
...
status TINYINT DEFAULT 0 COMMENT '状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回'
```

**字段选择规则**：
- **独立部署游戏**（有独立 HTTP 服务器）：使用 `game_url`
- **内嵌模式游戏**（Vue 组件集成）：使用 `module_path`

---

### t_leaderboard_config 表（排行榜配置表）

**表结构**：
```sql
CREATE TABLE t_leaderboard_config (
    config_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_id BIGINT NOT NULL,
    dimension_code VARCHAR(50) NOT NULL,
    dimension_name VARCHAR(100) NOT NULL,
    dimension_type VARCHAR(20) NOT NULL COMMENT '维度类型：SCORE-分数，TIME-时间，COUNT-次数',
    sort_order VARCHAR(10) DEFAULT 'DESC' COMMENT '排序规则：ASC-升序，DESC-降序',
    is_enabled TINYINT DEFAULT 1,
    create_time BIGINT,
    update_time BIGINT
);
```

**⚠️ 注意事项**：
1. **表名不是** `t_leaderboard_dimension`（不存在的表）
2. `dimension_type` 是枚举值：`'SCORE'`, `'TIME'`, `'COUNT'`
3. `sort_order` 是排序规则：`'DESC'`（降序）或 `'ASC'`（升序），**不是数字**

---

### t_theme_info 表（主题信息表）

**完整表结构（16 个需要插入的字段）**：
```sql
CREATE TABLE theme_info (
    theme_id BIGINT AUTO_INCREMENT PRIMARY KEY,        -- 自增主键，不需要插入
    author_id BIGINT NOT NULL,                         -- 1. 作者 ID
    is_official TINYINT DEFAULT 0,                     -- 2. 是否官方主题
    owner_type VARCHAR(20) NOT NULL,                   -- 3. 所有者类型：GAME/APPLICATION
    owner_id BIGINT NOT NULL,                          -- 4. 所有者 ID（游戏 ID）
    theme_name VARCHAR(100) NOT NULL,                  -- 5. 主题名称
    author_name VARCHAR(50),                           -- 6. 作者名称
    price INT DEFAULT 0,                               -- 7. 价格
    status VARCHAR(20) DEFAULT 'on_sale',              -- 8. 状态：on_sale/offline/pending
    download_count INT DEFAULT 0,                      -- 9. 下载次数
    total_revenue INT DEFAULT 0,                       -- 10. 总收益
    thumbnail_url VARCHAR(255),                        -- 11. 缩略图 URL
    description TEXT,                                  -- 12. 描述
    config_json JSON,                                  -- 13. GTRS 配置（必须合法 JSON）
    is_default TINYINT DEFAULT 0,                      -- 14. 是否默认主题
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,     -- 15. 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP      -- 16. 更新时间
);
```

**⚠️ 重要**：
- 必须列出**所有 16 个字段**（除自增主键外）
- 字段顺序必须与表结构定义一致
- VALUES 中的值顺序必须与字段列表顺序严格对应

---

## 游戏部署模式与字段选择

### 独立部署模式

**特征**：
- 游戏部署在独立的 HTTP 服务器上
- 有完整的 Web 服务器（如 Vite、Nginx）
- 通过 URL 访问（如 `http://localhost:8085/`）

**数据库字段**：
```sql
INSERT INTO t_game(..., game_url, ...) 
VALUES(..., 'http://localhost:8085/', ...);
```

**示例**：飞机大战、坦克大战等 Phaser 游戏

---

### 内嵌模式

**特征**：
- 游戏作为 Vue 组件集成到主应用中
- 没有独立的 HTTP 服务器
- 通过模块路径加载（如 `../games/snake/SnakeGame`）

**数据库字段**：
```sql
INSERT INTO t_game(..., module_path, ...) 
VALUES(..., '../games/snake/SnakeGame', ...);
```

**示例**：贪吃蛇（Vue3 + Canvas 实现）

---

## SQL 脚本编写常见错误

### ❌ 错误 1: 混淆 game_url 和 module_path

```sql
-- ❌ 错误：独立部署游戏使用了 module_path
INSERT INTO t_game(..., module_path, ...) 
VALUES(..., 'http://localhost:8085/', ...);

-- ✅ 正确：独立部署游戏使用 game_url
INSERT INTO t_game(..., game_url, ...) 
VALUES(..., 'http://localhost:8085/', ...);
```

**后果**：游戏无法正常加载，前端会尝试从 HTTP URL 加载 Vue 组件

---

### ❌ 错误 2: 使用错误的表名

```sql
-- ❌ 错误：不存在的表名
INSERT INTO t_leaderboard_dimension(...);

-- ✅ 正确：正确的表名
INSERT INTO t_leaderboard_config(...);
```

**后果**：SQL 执行失败，报错 "Table 'xxx' doesn't exist"

---

### ❌ 错误 3: 字段顺序与值顺序不匹配

```sql
-- ❌ 错误：列出的字段顺序与 VALUES 中的值顺序不一致
INSERT INTO t_theme_info(theme_name, author_id, owner_type, owner_id)
VALUES(1, 'theme_name', 'GAME', @game_id);  -- 值顺序反了！

-- ✅ 正确：字段顺序与值顺序严格一致
INSERT INTO t_theme_info(author_id, is_official, owner_type, owner_id, theme_name, ...)
VALUES(1, 0, 'GAME', @game_id, 'theme_name', ...);
```

**后果**：数据插入到错误的字段，导致数据混乱

---

### ❌ 错误 4: 遗漏必填字段

```sql
-- ❌ 错误：只列出了部分字段，导致 "Column count doesn't match value count"
INSERT INTO t_theme_info(theme_name, author_id, config_json, status)
VALUES(...);

-- ✅ 正确：列出所有 16 个需要插入的字段
INSERT INTO t_theme_info(
    author_id, is_official, owner_type, owner_id, 
    theme_name, author_name, price, status, 
    download_count, total_revenue, thumbnail_url, description, 
    config_json, is_default, created_at, updated_at
) VALUES(...);
```

**后果**：SQL 执行失败，报错 "Column count doesn't match value count at row X"

---

### ❌ 错误 5: dimension_type 和 sort_order 类型错误

```sql
-- ❌ 错误：dimension_type 使用了 INT，sort_order 使用了数字
INSERT INTO t_leaderboard_config(..., dimension_type, sort_order, ...)
VALUES(..., 1, 2, ...);  -- 类型错误！

-- ✅ 正确：dimension_type 是枚举字符串，sort_order 是 'ASC'/'DESC'
INSERT INTO t_leaderboard_config(..., dimension_type, sort_order, ...)
VALUES(..., 'SCORE', 'DESC', ...);
```

**后果**：SQL 执行失败或数据语义错误

---

### ❌ 错误 6: 时间格式混用

```sql
-- ❌ 错误：同一张表中混用时间格式
INSERT INTO t_theme_info(..., created_at, updated_at)
VALUES(..., UNIX_TIMESTAMP() * 1000, NOW());  -- 一个毫秒时间戳，一个 DATETIME

-- ✅ 正确：根据表结构定义选择合适的时间格式
-- t_game 表使用时间戳：UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000
-- t_theme_info 表使用 DATETIME: NOW()
```

**后果**：时间格式不一致，可能导致查询和统计错误

---

## 标准 SQL 脚本模板

### 模板 1: 独立部署游戏注册脚本

```sql
-- ============================================
-- {游戏名称} 游戏注册 SQL 脚本
-- 部署模式：独立部署（HTTP 服务器）
-- 创建时间：{日期}
-- ============================================

-- 1. 创建游戏记录
INSERT INTO t_game(
    game_code, game_name, category, grade, 
    icon_url, cover_url, description, 
    status, sort_order, consume_points_per_minute, 
    game_url,  -- ⭐ 独立部署使用 game_url
    create_time, update_time
)
VALUES(
    '{GAME_CODE}', 
    '{游戏名称}', 
    '{category}', 
    '{grade}',
    '{icon_url}',
    '{cover_url}',
    '{游戏描述}',
    2,  -- status: 2=已上架
    {sort_order},
    {consume_points},
    '{http://localhost:8085/}',  -- ⭐ 独立部署的 HTTP 地址
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000
);

-- 获取刚插入的游戏 ID
SET @game_id = LAST_INSERT_ID();

-- 2. 游戏基础参数配置
INSERT INTO t_game_config(game_id, config_key, config_value, description, create_time, update_time) VALUES
(@game_id, 'config_key_1', 'value_1', '配置说明 1', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'config_key_2', 'value_2', '配置说明 2', UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- 3. 排行榜维度配置
-- ⚠️ 注意：表名是 t_leaderboard_config，不是 t_leaderboard_dimension
INSERT INTO t_leaderboard_config(
    game_id, dimension_code, dimension_name, dimension_type, sort_order, is_enabled, 
    create_time, update_time
) VALUES
(@game_id, 'highest_score', '最高分数', 'SCORE', 'DESC', 1, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'total_kills', '总击落数', 'COUNT', 'DESC', 1, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
(@game_id, 'games_played', '游戏次数', 'COUNT', 'DESC', 1, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- 4. 游戏模式配置
INSERT INTO t_game_mode_config(
    game_id, mode_type, mode_name, enabled, config_json, sort_order, 
    create_time, update_time
) VALUES
(@game_id, 'single_player', '单机模式', 1, '{"difficulty": "normal"}', 1, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000);

-- 5. GTRS 主题资源配置
-- ⚠️ 重要：t_theme_info 表有 16 个字段需要插入（除自增主键外）
INSERT INTO t_theme_info(
    author_id, is_official, owner_type, owner_id, 
    theme_name, author_name, price, status, 
    download_count, total_revenue, thumbnail_url, description, 
    config_json, is_default, created_at, updated_at
) VALUES(
    1,                              -- author_id: 作者 ID
    0,                              -- is_official: 是否官方主题
    'GAME',                         -- owner_type: GAME-游戏
    @game_id,                       -- owner_id: 关联游戏 ID
    '{theme_name}',                 -- theme_name: 主题名称
    '{author_name}',                -- author_name: 作者名称
    0,                              -- price: 价格
    'on_sale',                      -- status: on_sale
    0,                              -- download_count: 下载次数
    0,                              -- total_revenue: 总收益
    '{thumbnail_url}',              -- thumbnail_url: 缩略图
    '{description}',                -- description: 描述
    '{json_config}',                -- config_json: GTRS 配置（必须合法 JSON）
    1,                              -- is_default: 是否默认主题
    NOW(),                          -- created_at: DATETIME
    NOW()                           -- updated_at: DATETIME
);

-- ============================================
-- 验证查询
-- ============================================
SELECT * FROM t_game WHERE game_code = '{GAME_CODE}';
SELECT * FROM t_game_config WHERE game_id = @game_id ORDER BY config_key;
SELECT * FROM t_leaderboard_config WHERE game_id = @game_id;
SELECT * FROM t_game_mode_config WHERE game_id = @game_id;
SELECT * FROM t_theme_info WHERE owner_type = 'GAME' AND owner_id = @game_id;
```

---

### 模板 2: 内嵌模式游戏注册脚本

```sql
-- ============================================
-- {游戏名称} 游戏注册 SQL 脚本
-- 部署模式：内嵌模式（Vue 组件）
-- 创建时间：{日期}
-- ============================================

-- 1. 创建游戏记录
INSERT INTO t_game(
    game_code, game_name, category, grade, 
    icon_url, cover_url, description, 
    status, sort_order, consume_points_per_minute, 
    module_path,  -- ⭐ 内嵌模式使用 module_path
    create_time, update_time
)
VALUES(
    '{GAME_CODE}', 
    '{游戏名称}', 
    '{category}', 
    '{grade}',
    '{icon_url}',
    '{cover_url}',
    '{游戏描述}',
    2,  -- status: 2=已上架
    {sort_order},
    {consume_points},
    '../games/{game-dir}/{GameComponent}',  -- ⭐ 内嵌模式的模块路径
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000
);

-- 后续步骤与独立部署模式相同...
```

---

## 检查清单

### 编写前准备

- [ ] 确认游戏部署模式（独立部署 vs 内嵌）
- [ ] 准备好 schema_v2.sql 文件（核对表结构）
- [ ] 确定游戏基本信息（名称、分类、适用年龄等）
- [ ] 准备资源 URL（图标、封面等）

### SQL 编写检查

- [ ] 选择正确的字段（game_url vs module_path）
- [ ] 检查表名是否正确（t_leaderboard_config）
- [ ] 确保字段顺序与表结构定义一致
- [ ] 确保 VALUES 中的值顺序与字段列表顺序对应
- [ ] 列出所有必填字段，不要省略
- [ ] 检查数据类型（VARCHAR/INT/TINYINT/DATETIME）
- [ ] 验证 JSON 格式（config_json 必须是合法 JSON）
- [ ] 统一时间格式（时间戳 vs DATETIME）

### 执行前验证

- [ ] 在测试环境执行 SQL
- [ ] 验证查询确认数据正确插入
- [ ] 检查游戏是否能正常加载
- [ ] 测试排行榜功能
- [ ] 验证主题配置是否生效

### 常见陷阱提醒

- ⚠️ **不要使用** `t_leaderboard_dimension`（不存在的表）
- ⚠️ **不要混用** time 戳和 DATETIME
- ⚠️ **不要省略** t_theme_info 的任何字段
- ⚠️ **不要搞反** field 顺序和 value 顺序
- ⚠️ **不要搞混** game_url 和 module_path

---

## 参考资料

- **项目数据库基准版本**: `kids-game-backend/kids-game-web/src/main/resources/schema_v2.sql`
- **可复用游戏开发框架**: `REUSABLE_GAME_FRAMEWORK.md`
- **飞机大战注册脚本示例**: `kids-game-house/games/plane-shooter/register-game.sql`
- **贪吃蛇注册脚本示例**: `kids-game-house/games/snake/register-game.sql`

---

**最后更新**: 2026-03-27  
**维护者**: Kids Game Platform Team
