-- ============================================================
-- 贪吃蛇大冒险 注册 SQL 脚本（对应 schema_v2.sql）
-- game_code: snake-vue3
-- 创建时间：2026-03-29（基于真实数据校对）
-- ============================================================
-- ⚠️ 执行前请替换：
--   __GAME_URL__   → 实际部署地址（如：http://localhost:3005）
--   __CREATOR_ID__ → 创建人用户 ID（无后台账号保持 NULL）
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
    'snake-vue3',                         -- game_code
    '贪吃蛇大冒险',                       -- game_name
    'PUZZLE',                             -- category
    '一年级',                             -- grade
    NULL,                                 -- tags
    '/images/games/snake-vue3/snake-icon.png', -- icon_url
    '',                                   -- cover_url（暂时留空）
    NULL,                                 -- resource_url
    NULL,                                 -- screenshot_urls
    '__GAME_URL__',                       -- ⚠️ 请替换（如 http://localhost:3005）
    NULL,                                 -- game_secret
    NULL,                                 -- game_config
    '经典贪吃蛇游戏，控制小蛇吃食物，不断变长，挑战最高分！支持多种难度和稀有食物。',
    NULL,                                 -- play_guide
    NULL,                                 -- module_path
    2,                                    -- status=2 直接上架
    3,                                    -- sort_order
    0,                                    -- is_featured
    1,                                    -- consume_points_per_minute
    0,                                    -- min_fatigue_to_start
    0,                                    -- online_count（运行时维护）
    0,                                    -- total_play_count
    0,                                    -- total_play_duration
    0.00,                                 -- average_rating
    1773399695000,                        -- create_time（原始创建时间，保持不变）
    UNIX_TIMESTAMP(NOW()) * 1000,         -- update_time
    0,                                    -- deleted
    NULL,                                 -- ⚠️ 可替换为 creator_id
    UNIX_TIMESTAMP(NOW()) * 1000          -- publish_time（直接上架需填写）
)
ON DUPLICATE KEY UPDATE
    game_name                = VALUES(game_name),
    category                 = VALUES(category),
    grade                    = VALUES(grade),
    game_url                 = VALUES(game_url),
    icon_url                 = VALUES(icon_url),
    cover_url                = VALUES(cover_url),
    description              = VALUES(description),
    status                   = VALUES(status),
    sort_order               = VALUES(sort_order),
    update_time              = UNIX_TIMESTAMP(NOW()) * 1000;

-- ────────────────────────────────────────────────────────────
-- 第 2 步：查询游戏 ID
-- ────────────────────────────────────────────────────────────
SET @game_id = (
    SELECT game_id FROM t_game
    WHERE game_code = 'snake-vue3' AND deleted = 0
    LIMIT 1
);
SELECT CONCAT('✅ game_id = ', IFNULL(@game_id, '❌ 未找到，请检查 game_code')) AS result;

-- ────────────────────────────────────────────────────────────
-- 第 3 步：注册默认主题（幂等，重复执行安全）
-- ────────────────────────────────────────────────────────────
-- ⚠️ 注意：
--   1. 主题表是 t_theme_info（有 t_ 前缀）
--   2. created_at / updated_at 是 DATETIME 类型，填 NOW()（不是毫秒时间戳！）
--   3. config_json 来自 src/config/GTRS.json（压缩为单行 JSON）
--   4. is_official=0 表示非平台官方（游戏方维护的主题）
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
    0,                                    -- author_id（官方/内置主题填 0）
    0,                                    -- is_official=0（游戏方维护，非平台官方）
    'GAME',                               -- owner_type 固定填 GAME
    @game_id,                             -- owner_id = 第 2 步查到的 game_id
    '贪吃蛇 - 清新绿',                    -- theme_name
    '官方团队',                            -- author_name
    0,                                    -- price=0 免费
    'on_sale',                            -- status: on_sale=上架
    0,                                    -- download_count
    0,                                    -- total_revenue
    '/themes/snake/snake-default-thumb.png', -- thumbnail_url
    '贪吃蛇官方默认主题，清新的绿色风格，适合所有年龄段',
    -- config_json: 完整 GTRS v1.0.0 JSON（来自 src/config/GTRS.json，压缩为单行）
    '{"$comment":"GTRS v1.0.0 贪吃蛇游戏内置默认主题。此文件随游戏代码一起发布，必须通过 GTRS 严格校验。禁止删除或损坏任何必填字段。","specMeta":{"specName":"GTRS","specVersion":"1.0.0","compatibleVersion":"1.0.0"},"resources":{"audio":{"bgm":{"bgm_main":{"src":"/themes/default/audio/bgm_main.mp3","type":"mp3","alias":"主菜单背景音乐","volume":0.6},"bgm_gameover":{"src":"/themes/default/audio/bgm_gameover.mp3","type":"mp3","alias":"游戏结束音乐","volume":0.5},"bgm_gameplay":{"src":"/themes/default/audio/bgm_gameplay.mp3","type":"mp3","alias":"游戏中背景音乐","volume":0.7}},"voice":{},"effect":{"effect_eat":{"src":"/themes/default/audio/eat.mp3","type":"mp3","alias":"吃到食物音效","volume":0.5},"effect_crash":{"src":"/themes/default/audio/crash.mp3","type":"mp3","alias":"碰撞音效","volume":0.6},"effect_levelup":{"src":"/themes/default/audio/levelup.mp3","type":"mp3","alias":"升级音效","volume":0.6},"effect_gameover":{"src":"/themes/default/audio/gameover.mp3","type":"mp3","alias":"游戏结束音效","volume":0.7},"effect_button_click":{"src":"/themes/default/audio/button_click.mp3","type":"mp3","alias":"按钮点击音效","volume":0.5}}},"video":{},"images":{"ui":{},"icon":{},"login":{},"scene":{"food_apple":{"src":"/themes/default/images/scene/food_apple.png","type":"png","alias":"苹果"},"snake_body":{"src":"/themes/default/images/scene/snake_body.png","type":"png","alias":"蛇身"},"snake_head":{"src":"/themes/default/images/scene/snake_head.png","type":"png","alias":"蛇头"},"snake_tail":{"src":"/themes/default/images/scene/snake_tail.png","type":"png","alias":"蛇尾"},"food_banana":{"src":"/themes/default/images/scene/food_banana.png","type":"png","alias":"香蕉"},"food_cherry":{"src":"/themes/default/images/scene/food_cherry.png","type":"png","alias":"樱桃"},"obstacle_rock":{"src":"/themes/default/images/scene/obstacle_rock.png","type":"png","alias":"石头障碍物"},"obstacle_wall":{"src":"/themes/default/images/scene/obstacle_wall.png","type":"png","alias":"墙壁障碍物"},"scene_bg_grid":{"src":"/themes/default/images/scene/grid.png","type":"png","alias":"网格背景"},"scene_bg_main":{"src":"/themes/default/images/scene/background.png","type":"png","alias":"游戏主背景"}},"effect":{}}},"globalStyle":{"bgColor":"#1a1a2e","textColor":"#ffffff","fontFamily":"Arial, sans-serif","borderRadius":"8px","primaryColor":"#4ade80","secondaryColor":"#22c55e"}}',
    1,                                    -- is_default=1 默认主题
    '2026-03-17 17:13:18',                -- created_at（原始创建时间，保持不变）
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
-- 第 4 步：上架游戏（本脚本第 1 步已直接设 status=2，此步可跳过）
-- 如果第 1 步改为 status=0（草稿），测试通过后执行以下语句：
-- ────────────────────────────────────────────────────────────
-- UPDATE t_game
-- SET    status       = 2,
--        publish_time = UNIX_TIMESTAMP(NOW()) * 1000,
--        update_time  = UNIX_TIMESTAMP(NOW()) * 1000
-- WHERE  game_code = 'snake-vue3' AND deleted = 0;

-- ────────────────────────────────────────────────────────────
-- 第 5 步：验证注册结果
-- ────────────────────────────────────────────────────────────
SELECT
    g.game_id,
    g.game_code,
    g.game_name,
    g.category,
    g.grade,
    g.game_url,
    g.icon_url,
    CASE g.status
        WHEN 0 THEN '草稿'
        WHEN 1 THEN '待审核'
        WHEN 2 THEN '已上架'
        WHEN 3 THEN '已下架'
        WHEN 4 THEN '审核驳回'
        ELSE CONCAT('未知(', g.status, ')')
    END AS status_text,
    g.sort_order,
    FROM_UNIXTIME(g.create_time / 1000) AS created_at
FROM t_game g
WHERE g.game_code = 'snake-vue3' AND g.deleted = 0;

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
