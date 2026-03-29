-- ============================================================
-- 拼图游戏 注册 SQL 脚本（对应 schema_v2.sql）
-- game_code: puzzle
-- ============================================================
-- ⚠️ 执行前请替换：
--   __GAME_URL__   → 实际部署地址（如：http://localhost:5173）
--   __GTRS_JSON__  → 将 src/config/GTRS.json 压缩为单行后粘贴于此
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 第 1 步：插入/更新游戏记录（幂等，重复执行安全）
-- ────────────────────────────────────────────────────────────
INSERT INTO t_game (
    game_code,
    game_name,
    category,
    grade,
    tags,
    icon_url,
    cover_url,
    resource_url,
    screenshot_urls,
    game_url,
    game_secret,
    game_config,
    description,
    play_guide,
    module_path,
    status,
    sort_order,
    is_featured,
    consume_points_per_minute,
    min_fatigue_to_start,
    online_count,
    total_play_count,
    total_play_duration,
    average_rating,
    create_time,
    update_time,
    deleted,
    creator_id,
    publish_time
)
VALUES (
    'puzzle',                             -- game_code
    '拼图游戏',                           -- game_name
    'PUZZLE',                             -- category
    '一年级',                             -- grade
    '益智,休闲',                          -- tags
    NULL,                                 -- icon_url（部署后填写实际路径）
    NULL,                                 -- cover_url
    NULL,                                 -- resource_url
    NULL,                                 -- screenshot_urls
    '__GAME_URL__',                       -- ⚠️ 请替换为实际地址
    NULL,                                 -- game_secret
    NULL,                                 -- game_config
    '经典拼图游戏，将打散的图片块还原成完整图案，锻炼空间思维和专注力！',
    NULL,                                 -- play_guide
    NULL,                                 -- module_path
    0,                                    -- status=0 草稿（测试通过后改 2）
    0,                                    -- sort_order
    0,                                    -- is_featured
    1,                                    -- consume_points_per_minute
    0,                                    -- min_fatigue_to_start
    0,                                    -- online_count
    0,                                    -- total_play_count
    0,                                    -- total_play_duration
    0.00,                                 -- average_rating
    UNIX_TIMESTAMP(NOW()) * 1000,         -- create_time
    UNIX_TIMESTAMP(NOW()) * 1000,         -- update_time
    0,                                    -- deleted
    NULL,                                 -- ⚠️ 可替换为 creator_id
    NULL                                  -- publish_time（上架时填写）
)
ON DUPLICATE KEY UPDATE
    game_name                = VALUES(game_name),
    category                 = VALUES(category),
    grade                    = VALUES(grade),
    game_url                 = VALUES(game_url),
    icon_url                 = VALUES(icon_url),
    cover_url                = VALUES(cover_url),
    description              = VALUES(description),
    update_time              = UNIX_TIMESTAMP(NOW()) * 1000;

-- ────────────────────────────────────────────────────────────
-- 第 2 步：查询游戏 ID
-- ────────────────────────────────────────────────────────────
SET @game_id = (
    SELECT game_id FROM t_game
    WHERE game_code = 'puzzle' AND deleted = 0
    LIMIT 1
);
SELECT CONCAT('✅ game_id = ', IFNULL(@game_id, '❌ 未找到，请检查 game_code')) AS result;

-- ────────────────────────────────────────────────────────────
-- 第 3 步：注册默认主题（幂等，重复执行安全）
-- ────────────────────────────────────────────────────────────
-- ⚠️ 执行前请将 __GTRS_JSON__ 替换为 src/config/GTRS.json 的压缩单行内容
-- ⚠️ 主题表是 t_theme_info（有 t_ 前缀）
INSERT INTO t_theme_info (
    author_id,
    is_official,
    owner_type,
    owner_id,
    theme_name,
    author_name,
    price,
    status,
    download_count,
    total_revenue,
    thumbnail_url,
    description,
    config_json,
    is_default,
    created_at,
    updated_at
)
VALUES (
    0,                                    -- author_id（内置主题填 0）
    0,                                    -- is_official=0（游戏方维护，非平台级官方）
    'GAME',                               -- owner_type 固定填 GAME
    @game_id,                             -- owner_id = 第 2 步查到的 game_id
    '拼图游戏 - 默认主题',                 -- theme_name
    '官方团队',                            -- author_name
    0,                                    -- price=0 免费
    'on_sale',                            -- status: on_sale=上架
    0,                                    -- download_count
    0,                                    -- total_revenue
    '',                                   -- thumbnail_url（可填实际路径）
    '拼图游戏官方默认主题',
    '__GTRS_JSON__',                      -- ⚠️ 替换为 src/config/GTRS.json 压缩单行内容
    1,                                    -- is_default=1 默认主题
    NOW(),                                -- created_at（DATETIME 类型，填 NOW()）
    NOW()                                 -- updated_at
)
ON DUPLICATE KEY UPDATE
    theme_name    = VALUES(theme_name),
    description   = VALUES(description),
    thumbnail_url = VALUES(thumbnail_url),
    config_json   = VALUES(config_json),
    updated_at    = NOW();

SET @theme_id = (
    SELECT theme_id FROM t_theme_info
    WHERE owner_type = 'GAME' AND owner_id = @game_id AND is_default = 1
    LIMIT 1
);
SELECT CONCAT('✅ theme_id = ', IFNULL(@theme_id, '❌ 主题插入失败')) AS result;

-- ────────────────────────────────────────────────────────────
-- 第 4 步：上架游戏（测试通过后执行）
-- ────────────────────────────────────────────────────────────
-- UPDATE t_game
-- SET    status = 2, publish_time = UNIX_TIMESTAMP(NOW()) * 1000, update_time = UNIX_TIMESTAMP(NOW()) * 1000
-- WHERE  game_code = 'puzzle' AND deleted = 0;

-- ────────────────────────────────────────────────────────────
-- 第 5 步：验证
-- ────────────────────────────────────────────────────────────
SELECT
    game_id, game_code, game_name, category, grade, game_url,
    CASE status WHEN 0 THEN '草稿' WHEN 2 THEN '已上架' ELSE CONCAT('状态', status) END AS status_text,
    FROM_UNIXTIME(create_time / 1000) AS created_at
FROM t_game
WHERE game_code = 'puzzle' AND deleted = 0;

-- 验证主题
SELECT
    theme_id,
    theme_name,
    owner_type,
    owner_id,
    status AS theme_status,
    is_default,
    created_at
FROM t_theme_info
WHERE owner_type = 'GAME' AND owner_id = @game_id;
