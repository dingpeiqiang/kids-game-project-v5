# 游戏注册之主题注册完整指南

## 📋 为什么需要注册主题？

### 问题背景

在之前的版本中，只注册了游戏信息到 `t_game` 表，但**没有注册主题信息**。这导致：

❌ **问题**：
- 游戏没有默认主题可用
- 主题商城找不到这个游戏
- GTRS 资源配置无法生效
- 游戏界面缺少主题支持

✅ **解决方案**：
- 同时注册游戏和主题
- 主题与游戏关联（通过 `owner_id`）
- 提供 GTRS 配置模板

---

## 🎯 贪吃蛇的真实示例

### 完整的 SQL 语句

```sql
-- 1. 注册游戏
INSERT INTO t_game (...) VALUES (...);

-- 2. 注册主题（这是缺失的部分！）
INSERT INTO t_theme_info (
    author_id, is_official, owner_type, owner_id, theme_name,
    author_name, price, status, download_count, total_revenue,
    thumbnail_url, description, config_json, is_default,
    created_at, updated_at
) VALUES (
    0,                              -- author_id: 系统创建
    0,                              -- is_official: 非官方
    'GAME',                         -- owner_type: GAME
    665,                            -- owner_id: 游戏 ID（实际值）
    '贪吃蛇 - 清新绿',              -- theme_name
    '官方团队',                     -- author_name
    0,                              -- price: 免费
    'on_sale',                      -- status: 在售
    0,                              -- download_count
    0,                              -- total_revenue
    '/themes/snake/snake-default-thumb.png',  -- thumbnail_url
    '贪吃蛇官方默认主题...',       -- description
    '{GTRS v1.0.0 JSON}',          -- config_json
    1,                              -- is_default: 是默认主题
    '2026-03-17 17:13:18',         -- created_at
    '2026-03-22 16:39:28'          -- updated_at
);
```

---

## 🔧 如何在模板中使用

### 步骤 1：复制模板

```bash
cp .lingma/skills/game-dev/templates/register-game.template.sql \
   kids-game-house/games/my-game/register-game.sql
```

### 步骤 2：执行游戏注册

```sql
-- 先执行游戏 INSERT
INSERT INTO t_game (...) VALUES (...);

-- 获取游戏 ID
SET @game_id = LAST_INSERT_ID();
```

### 步骤 3：取消主题注册注释

找到第 5 步的代码：
```sql
/*
-- 如果数据库中有 t_theme_info 表，取消下面的注释
-- 并将 OWNER_ID 替换为 @game_id
INSERT INTO t_theme_info (...)
*/
```

修改为：
```sql
-- 删除 /* 和 */ 注释符号
INSERT INTO t_theme_info (
    ...
    @game_id,                       -- owner_id: 使用上面获取的游戏 ID
    ...
) VALUES (...);
```

### 步骤 4：修改主题配置

```sql
-- 修改这些字段为你的游戏信息
'__GAME_NAME__ - 默认主题'     → '我的游戏 - 清新绿'
'/themes/__GAME_ID__/...'      → '/themes/my-game/my-game-default-thumb.png'
'__GAME_NAME__官方默认主题...' → '我的游戏官方默认主题...'
```

### 步骤 5：修改 GTRS JSON 配置

```json
{
    "$comment": "GTRS v1.0.0 我的游戏内置默认主题",
    "specMeta": {
        "specName": "GTRS",
        "specVersion": "1.0.0",
        "compatibleVersion": "1.0.0"
    },
    "resources": {
        "audio": {
            "bgm": {
                "bgm_main": {
                    "src": "/themes/default/audio/bgm_main.mp3",
                    "type": "mp3",
                    "alias": "主菜单背景音乐",
                    "volume": 0.6
                }
            },
            "effect": {}
        },
        "images": {
            "scene": {
                "background": {
                    "src": "/themes/default/images/scene/background.png",
                    "type": "png",
                    "alias": "游戏背景"
                }
            }
        }
    },
    "globalStyle": {
        "bgColor": "#1a1a2e",
        "textColor": "#ffffff",
        "primaryColor": "#4ade80"
    }
}
```

---

## 📊 主题字段说明

### 基础信息字段

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `author_id` | BIGINT | 是 | 作者 ID | `0`（系统创建） |
| `is_official` | TINYINT | 是 | 是否官方主题 | `0`-否，`1`-是 |
| `owner_type` | VARCHAR | 是 | 所有者类型 | `'GAME'` |
| `owner_id` | BIGINT | 是 | 游戏 ID（关联） | `@game_id` |
| `theme_name` | VARCHAR | 是 | 主题名称 | `'我的游戏 - 清新绿'` |
| `author_name` | VARCHAR | 是 | 作者名称 | `'官方团队'` |

### 商业字段

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `price` | INT | 是 | 价格（分） | `0`（免费） |
| `status` | VARCHAR | 是 | 销售状态 | `'on_sale'` / `'off_sale'` |
| `download_count` | INT | 是 | 下载次数 | `0`（初始） |
| `total_revenue` | INT | 是 | 总收入（分） | `0`（初始） |

### 资源字段

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `thumbnail_url` | VARCHAR | 是 | 缩略图 URL | `'/themes/my-game/thumb.png'` |
| `description` | TEXT | 是 | 主题描述 | `'官方默认主题...'` |
| `config_json` | JSON | 是 | GTRS 配置 | `{...}` |

### 状态字段

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `is_default` | TINYINT | 是 | 是否默认主题 | `1`-是，`0`-否 |
| `created_at` | DATETIME | 是 | 创建时间 | `NOW()` |
| `updated_at` | DATETIME | 是 | 更新时间 | `NOW()` |

---

## ⚠️ 关键注意事项

### 1. owner_id 必须是实际的游戏 ID

```sql
-- ❌ 错误：使用占位符
owner_id: __GAME_ID__

-- ✅ 正确：使用变量
SET @game_id = LAST_INSERT_ID();
owner_id: @game_id

-- ✅ 或者：使用具体数字
owner_id: 665  -- 贪吃蛇的 game_id
```

### 2. GTRS JSON 必须严格校验

```json
// ✅ 正确：包含所有必填字段
{
    "$comment": "...",
    "specMeta": {
        "specName": "GTRS",
        "specVersion": "1.0.0"
    },
    "resources": {...},
    "globalStyle": {...}
}

// ❌ 错误：缺少必填字段
{
    "specMeta": {...}
    // 缺少 resources 和 globalStyle
}
```

### 3. 主题名称格式

```sql
-- ✅ 推荐格式
'我的游戏 - 清新绿'
'我的游戏 - 赛博朋克'
'我的游戏 - 卡通风格'

-- ❌ 避免
'主题 1'           -- 太简单
'My Game Theme'    -- 建议用中文
```

### 4. 资源路径规范

```sql
-- ✅ 推荐路径
'/themes/my-game/my-game-default-thumb.png'
'/themes/my-game/images/scene/background.png'

-- ❌ 避免
'/images/theme.png'           -- 没有主题目录
'themes/my-game/thumb.png'    -- 缺少前导斜杠
```

---

## 🔍 验证主题注册成功

### 检查主题表

```sql
-- 查询某个游戏的所有主题
SELECT 
    theme_id, theme_name, owner_id, 
    is_default, status, author_name
FROM t_theme_info
WHERE owner_type = 'GAME' 
  AND owner_id = 665;  -- 替换为你的 game_id

-- 查询默认主题
SELECT * FROM t_theme_info
WHERE owner_type = 'GAME' 
  AND owner_id = 665
  AND is_default = 1;
```

### 验证 GTRS 配置

```sql
-- 检查 JSON 是否有效
SELECT 
    theme_id, 
    theme_name,
    JSON_VALID(config_json) AS is_valid,
    JSON_EXTRACT(config_json, '$.specMeta.specVersion') AS version
FROM t_theme_info
WHERE owner_id = 665;

-- 查看完整配置
SELECT 
    theme_name,
    config_json
FROM t_theme_info
WHERE owner_id = 665;
```

---

## 📝 完整示例（贪吃蛇）

```sql
-- =============================================
-- 1. 注册游戏
-- =============================================
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
    '经典贪吃蛇游戏，控制小蛇吃食物，不断变长，挑战最高分！',
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

-- 获取游戏 ID
SET @game_id = LAST_INSERT_ID();

-- =============================================
-- 2. 注册主题（重要！）
-- =============================================
INSERT INTO t_theme_info (
    author_id, is_official, owner_type, owner_id, theme_name,
    author_name, price, status, download_count, total_revenue,
    thumbnail_url, description, config_json, is_default,
    created_at, updated_at
) VALUES (
    0,
    0,
    'GAME',
    @game_id,                    -- 使用变量
    '贪吃蛇 - 清新绿',
    '官方团队',
    0,
    'on_sale',
    0,
    0,
    '/themes/snake/snake-default-thumb.png',
    '贪吃蛇官方默认主题，清新的绿色风格，适合所有年龄段',
    '{
        "$comment": "GTRS v1.0.0 贪吃蛇游戏内置默认主题。此文件随游戏代码一起发布，必须通过 GTRS 严格校验。禁止删除或损坏任何必填字段。",
        "specMeta": {
            "specName": "GTRS",
            "specVersion": "1.0.0",
            "compatibleVersion": "1.0.0"
        },
        "resources": {
            "audio": {
                "bgm": {
                    "bgm_main": {
                        "src": "/themes/default/audio/bgm_main.mp3",
                        "type": "mp3",
                        "alias": "主菜单背景音乐",
                        "volume": 0.6
                    }
                },
                "effect": {}
            },
            "images": {
                "scene": {
                    "food_apple": {
                        "src": "/themes/default/images/scene/food_apple.png",
                        "type": "png",
                        "alias": "苹果"
                    },
                    "snake_head": {
                        "src": "/themes/default/images/scene/snake_head.png",
                        "type": "png",
                        "alias": "蛇头"
                    }
                }
            }
        },
        "globalStyle": {
            "bgColor": "#1a1a2e",
            "textColor": "#ffffff",
            "fontFamily": "Arial, sans-serif",
            "borderRadius": "8px",
            "primaryColor": "#4ade80",
            "secondaryColor": "#22c55e"
        }
    }',
    1,
    NOW(),
    NOW()
);
```

---

## 🎯 总结

### 为什么之前会缺失主题注册？

1. **历史原因**: 早期版本可能没有 `t_theme_info` 表
2. **设计变更**: 后来增加了主题商城功能
3. **文档滞后**: 模板没有及时更新

### 现在的最佳实践

✅ **必须同时注册**：
1. 游戏信息 → `t_game`
2. 游戏配置 → `t_game_config`
3. 排行榜配置 → `t_leaderboard_config`
4. 游戏模式 → `t_game_mode_config`
5. **主题信息** → `t_theme_info` ⭐ 新增！

### 不注册主题的后果

❌ **问题**：
- 游戏没有默认主题可用
- 用户无法在主题商城找到主题
- GTRS 配置无法生效
- 游戏界面可能显示异常

✅ **解决**：
- 使用模板的第 5 步
- 取消注释并修改参数
- 确保 GTRS JSON 格式正确

---

**主题注册已完成！** 🎉

现在你的游戏将拥有完整的主题支持！
