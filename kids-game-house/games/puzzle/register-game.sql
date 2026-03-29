-- ============================================================
-- 拼图游戏 注册 SQL 脚本（对应 schema_v2.sql）
-- ============================================================
-- ⚠️ 执行前请替换：
--   __GAME_URL__   → 实际部署地址，如 http://localhost:5173
--   __CREATOR_ID__ → 创建人用户 ID（无后台账号则保持 NULL）
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 第 1 步：插入/更新游戏记录
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
    create_time,
    update_time,
    deleted,
    creator_id,
    publish_time
)
VALUES (
    'puzzle',
    '拼图游戏',
    'PUZZLE',
    '一年级',
    '益智,休闲',
    NULL,                               -- 图标 URL（部署后填写实际路径）
    NULL,                               -- 封面 URL（部署后填写实际路径）
    NULL,
    '__GAME_URL__',                     -- ⚠️ 请替换为实际地址
    NULL,
    NULL,
    '经典拼图游戏，将打散的图片块还原成完整图案，锻炼空间思维和专注力！',
    NULL,
    NULL,
    0,                                  -- 0=草稿，测试通过后改 2
    0,
    0,
    1,
    0,
    0,
    UNIX_TIMESTAMP(NOW()) * 1000,
    UNIX_TIMESTAMP(NOW()) * 1000,
    0,
    NULL,                               -- ⚠️ 可替换为实际 creator_id
    NULL
)
ON DUPLICATE KEY UPDATE
    game_name                = VALUES(game_name),
    category                 = VALUES(category),
    grade                    = VALUES(grade),
    game_url                 = VALUES(game_url),
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
-- 第 3 步：注册默认主题（可选）
-- ────────────────────────────────────────────────────────────
-- 取消注释前请先将 config_json 替换为 src/config/GTRS.json 的压缩内容
--
-- INSERT INTO theme_info (
--     author_id, is_official, owner_type, owner_id,
--     theme_name, author_name, price, status,
--     download_count, total_revenue, thumbnail_url, description,
--     config_json, is_default, created_at, updated_at
-- )
-- VALUES (
--     0, 1, 'GAME', @game_id,
--     '拼图游戏 - 默认主题', '官方团队', 0, 'on_sale',
--     0, 0, '', '拼图游戏官方默认主题',
--     '请将 GTRS.json 内容粘贴于此',
--     1, NOW(), NOW()
-- );
-- SET @theme_id = LAST_INSERT_ID();
-- SELECT CONCAT('✅ theme_id = ', @theme_id) AS result;

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
