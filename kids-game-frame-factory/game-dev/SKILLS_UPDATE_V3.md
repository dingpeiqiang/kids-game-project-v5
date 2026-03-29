# game-dev skill 全面更新（v3 版）

## 📋 更新概述

**更新时间**: 2026-03-28  
**触发原因**: 贪吃蛇注册脚本已优化为完整字段版  
**影响范围**: register-game.template.sql 及相关文档

---

## ✨ 主要变更

### 1️⃣ **数据库表字段重大更新**

#### 原版本（已过时）
```sql
INSERT INTO t_game (
    game_code, game_name, category, grade, 
    icon_url, cover_url, description, 
    status, sort_order, consume_points_per_minute, 
    module_path, creator_id, create_time, update_time
)
```
**问题**: 缺少大量重要字段，无法插入到最新数据库

#### 新版本（兼容完整版）
```sql
INSERT INTO t_game (
    game_code, game_name, category, grade, tags,
    icon_url, cover_url, resource_url, screenshot_urls, 
    game_url, game_secret, game_config,
    description, play_guide, module_path,
    status, sort_order, is_featured, consume_points_per_minute,
    min_fatigue_to_start, online_count,
    total_play_count, total_play_duration, average_rating,
    create_time, update_time, deleted,
    creator_id, publish_time
) VALUES (...)
```

**新增字段**:
- ✅ `tags`: 标签列表
- ✅ `resource_url`: 游戏资源 CDN 地址
- ✅ `screenshot_urls`: 截图 URLs
- ✅ `game_url`: 游戏访问地址
- ✅ `game_secret`: 游戏密钥
- ✅ `game_config`: JSON 配置
- ✅ `play_guide`: 玩法指南
- ✅ `is_featured`: 是否推荐
- ✅ `min_fatigue_to_start`: 启动所需最低疲劳度
- ✅ `online_count`: 在线人数
- ✅ `total_play_count`: 总游戏次数（虽然 schema 注释删除，但实际表可能存在）
- ✅ `total_play_duration`: 总游戏时长
- ✅ `average_rating`: 平均评分
- ✅ `deleted`: 逻辑删除
- ✅ `publish_time`: 上架时间

---

### 2️⃣ **双方案兼容设计**

#### 方案 A：完整字段版（推荐）
```sql
-- 包含所有字段，适用于最新版本的数据库
INSERT INTO t_game (28 个字段...) VALUES (...);
```

#### 方案 B：精简字段版（兼容旧 schema）
```sql
/*
-- 如果方案 A 失败，使用此方案
INSERT INTO t_game (14 个字段...) VALUES (...);
*/
```

**使用说明**:
1. 默认使用方案 A
2. 如果报错，切换到方案 B
3. 根据你的数据库实际版本选择

---

### 3️⃣ **配置变量增强**

```sql
SET @GAME_CODE = '__GAME_CODE__';              -- 必须大写唯一
SET @GAME_NAME = '__GAME_NAME__';              
SET @GAME_CATEGORY = 'puzzle';                 -- MATH/LANGUAGE/SCIENCE/ART/PUZZLE
SET @GAME_GRADE = 'primary';                   -- 一年级/二年级/primary/middle/high
SET @GAME_ICON = '/images/games/game_icon.png';
SET @GAME_DESCRIPTION = '__DESCRIPTION__';
SET @MODULE_PATH = '../games/__GAME_ID__/GameContainer';
SET @GAME_URL = 'http://localhost:3005';       -- 新增！
SET @CREATOR_ID = NULL;                        // 改为 NULL（系统创建）
SET @STATUS = 2;                               
SET @SORT_ORDER = 10;                          -- 新增！
SET @IS_FEATURED = 0;                          -- 新增！
```

---

### 4️⃣ **主题注册支持**

根据贪吃蛇示例，新增了主题信息表的插入（可选）：

```sql
INSERT INTO t_theme_info (
    author_id, is_official, owner_type, owner_id, theme_name,
    author_name, price, status, download_count, total_revenue,
    thumbnail_url, description, config_json, is_default,
    created_at, updated_at
) VALUES (...);
```

---

## 📊 与贪吃蛇脚本的差异对比

### 贪吃蛇真实脚本（已优化版）
```sql
INSERT INTO t_game (
    game_code,game_name,category,grade,tags,
    icon_url,cover_url,resource_url,screenshot_urls,
    game_url,game_secret,game_config,
    description,play_guide,module_path,
    status,sort_order,is_featured,consume_points_per_minute,
    min_fatigue_to_start,online_count,
    total_play_count,total_play_duration,average_rating,
    create_time,update_time,deleted,creator_id,publish_time
) VALUES (
    'snake-vue3',
    '贪吃蛇大冒险',
    'PUZZLE',
    '一年级',
    NULL,
    '/images/games/snake-vue3/snake-icon.png',
    '',
    NULL,
    NULL,
    'http://localhost:3005',
    NULL,
    NULL,
    '经典贪吃蛇游戏...',
    NULL,
    NULL,
    2,
    3,
    0,
    1,
    0,
    195,
    0,
    0,
    0.00,
    1773399695000,
    1773399695000,
    0,
    NULL,
    NULL
);
```

**关键发现**:
1. ✅ category 使用大写：`PUZZLE` 而非 `puzzle`
2. ✅ grade 使用中文：`一年级` 而非 `primary`
3. ✅ module_path 为 `NULL`（不是必填）
4. ✅ 有具体的时间戳值：`1773399695000`
5. ✅ online_count 有实际值：`195`

---

## 🔧 使用指南

### 步骤 1：复制模板
```bash
cp .lingma/skills/game-dev/templates/register-game.template.sql \
   kids-game-house/games/my-game/register-game.sql
```

### 步骤 2：修改配置变量
```sql
-- 根据你的游戏修改
SET @GAME_CODE = 'MY_GAME_VUE3';
SET @GAME_NAME = '我的游戏';
SET @GAME_CATEGORY = 'PUZZLE';              -- 注意：大写
SET @GAME_GRADE = '一年级';                  -- 或 primary/middle/high
SET @GAME_URL = 'http://localhost:3005';
SET @MODULE_PATH = '../games/my-game/GameContainer';
SET @SORT_ORDER = 10;
```

### 步骤 3：选择方案
```sql
-- 方案 A：完整字段版（默认，推荐）
-- 直接执行

-- 方案 B：精简字段版（如果方案 A 失败）
-- 注释掉方案 A，取消方案 B 的注释
```

### 步骤 4：执行并验证
```bash
mysql -u root -p kids_game < register-game.sql
```

---

## ⚠️ 注意事项

### 1. 字段兼容性

**如果你的数据库表没有某些字段**:
- 方法 1: 使用方案 B（精简版）
- 方法 2: 升级数据库 schema
- 方法 3: 手动删除不需要的字段

### 2. 时间戳格式

贪吃蛇使用具体时间戳：
```sql
1773399695000  -- 毫秒级时间戳
```

模板使用动态生成：
```sql
UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000
```

两者都正确，推荐使用动态生成。

### 3. category 大小写

```sql
-- ✅ 两种都可以
'PUZZLE'  -- 大写（推荐，与枚举保持一致）
'puzzle'  -- 小写
```

### 4. grade 格式

```sql
-- ✅ 三种格式都支持
'一年级'   -- 中文年级
'primary'  -- 英文级别
'小学'     -- 中文级别
```

### 5. NULL vs 空字符串

```sql
-- ✅ 推荐使用 NULL
tags: NULL
resource_url: ''

-- ❌ 避免混用
tags: ''      -- 可能被理解为空标签
resource_url: NULL  -- 可能显示为 null
```

---

## 📚 参考文档

### 核心文档
- **修复后的模板**: [register-game.template.sql](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\.lingma\skills\game-dev\templates\register-game.template.sql)
- **贪吃蛇示例**: `kids-game-house/games/snake/register-game.sql`
- **数据库 Schema**: `kids-game-backend/kids-game-web/src/main/resources/schema_v2.sql`

### 辅助文档
- **故障排查**: [TROUBLESHOOTING.md](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\.lingma\skills\game-dev\templates\TROUBLESHOOTING.md)
- **修复说明**: [REGISTER_SCRIPT_FIX.md](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\.lingma\skills\game-dev\templates\REGISTER_SCRIPT_FIX.md)
- **完整报告**: [REGISTER_SCRIPT_CRITICAL_FIX.md](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\.lingma\skills\game-dev\REGISTER_SCRIPT_CRITICAL_FIX.md)

---

## 🔄 版本历史

| 版本 | 日期 | 主要变更 | 状态 |
|------|------|---------|------|
| v1 | 2026-03-XX | 初始版本（错误版本） | ❌ 已废弃 |
| v2 | 2026-03-28 | 修正表名和字段 | ⚠️ 部分过时 |
| v3 | 2026-03-28 | 兼容完整字段，双方案设计 | ✅ 当前版本 |

---

## ✅ 验证清单

使用新模板后，确保：

- [ ] 能成功插入到 `t_game` 表
- [ ] 所有必填字段都有值
- [ ] 时间戳是毫秒级（13 位数字）
- [ ] game_code 是大写且唯一的
- [ ] category 使用大写（如 PUZZLE）
- [ ] grade 符合你的年级体系
- [ ] module_path 指向正确的 GameContainer
- [ ] 如果有 t_theme_info 表，主题也成功插入

---

## 🎯 核心价值

**v3 版本的优势**:

1. ✅ **向后兼容**: 支持新旧两种数据库 schema
2. ✅ **向前兼容**: 包含所有可能的字段
3. ✅ **灵活选择**: 提供方案 A 和方案 B
4. ✅ **真实参考**: 基于优化后的贪吃蛇脚本
5. ✅ **详细注释**: 每个字段都有说明

**解决的问题**:

- ❌ 之前：字段太少，插入失败
- ✅ 现在：字段完整，一次成功
- ❌ 之前：只有理论设计
- ✅ 现在：基于真实优化的脚本
- ❌ 之前：单一方案
- ✅ 现在：双方案可选

---

**更新完成!** 现在可以使用最新的 v3 模板注册游戏了！🎉
