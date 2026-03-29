-- ============================================================
-- 飞机大战 注册 SQL 脚本（对应 schema_v2.sql）
-- game_code: plane-shooter
-- 创建时间：2026-03-29
-- ============================================================
-- ⚠️ 执行前请替换：
--   __GAME_URL__   → 实际部署地址（如：http://localhost:5173）
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
    'plane-shooter',                      -- game_code
    '飞机大战',                           -- game_name
    'ACTION',                             -- category: 动作类游戏
    '一年级',                             -- grade
    NULL,                                 -- tags
    '/themes/plane_shooter_default/images/player.png', -- icon_url（使用玩家飞机图标）
    '',                                   -- cover_url（暂时留空）
    NULL,                                 -- resource_url
    NULL,                                 -- screenshot_urls
    '__GAME_URL__',                       -- ⚠️ 请替换（如 http://localhost:5173）
    NULL,                                 -- game_secret
    NULL,                                 -- game_config
    '经典飞机大战游戏，控制战斗机击落敌机，躲避子弹和撞击，收集强化道具，挑战最高分！支持多种难度等级。',
    NULL,                                 -- play_guide
    NULL,                                 -- module_path
    2,                                    -- status=2 直接上架（可见状态）
    4,                                    -- sort_order
    0,                                    -- is_featured
    1,                                    -- consume_points_per_minute
    0,                                    -- min_fatigue_to_start
    0,                                    -- online_count（运行时维护）
    0,                                    -- total_play_count
    0,                                    -- total_play_duration
    0.00,                                 -- average_rating
    UNIX_TIMESTAMP(NOW()) * 1000,         -- create_time
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
    WHERE game_code = 'plane-shooter' AND deleted = 0
    LIMIT 1
);
SELECT CONCAT('✅ game_id = ', IFNULL(@game_id, '❌ 未找到，请检查 game_code')) AS result;

-- ────────────────────────────────────────────────────────────
-- 第 3 步：注册默认主题（幂等，重复执行安全）
-- ────────────────────────────────────────────────────────────
-- ⚠️ 注意：
--   1. 主题表是 t_theme_info（有 t_ 前缀）
--   2. created_at / updated_at 是 DATETIME 类型，填 NOW()（不是毫秒时间戳！）
--   3. config_json 来自 public/themes/plane_shooter_default/GTRS.json（压缩为单行 JSON）
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
    '飞机大战 - 星空蓝',                  -- theme_name
    '官方团队',                            -- author_name
    0,                                    -- price=0 免费
    'on_sale',                            -- status: on_sale=上架
    0,                                    -- download_count
    0,                                    -- total_revenue
    '/themes/plane_shooter_default/images/bg_main.png', -- thumbnail_url（使用背景图）
    '飞机大战官方默认主题，星空蓝风格，包含完整的飞机、敌机、子弹和道具资源',
    -- config_json: 完整 GTRS v1.0.0 JSON（来自 public/themes/plane_shooter_default/GTRS.json，压缩为单行）
    '{"$comment":"GTRS v1.0.0 飞机大战游戏内置默认主题。此文件随游戏代码一起发布，必须通过 GTRS 严格校验。禁止删除或损坏任何必填字段。","specMeta":{"specName":"GTRS","specVersion":"1.0.0","compatibleVersion":"1.0.0"},"themeInfo":{"themeCode":"plane_shooter_default","themeName":"飞机大战默认主题","gameId":"plane-shooter","ownerType":"GAME","ownerId":"plane-shooter","isDefault":true,"author":"AI Assistant","version":"1.0.0"},"globalStyle":{"primaryColor":"#3b82f6","secondaryColor":"#1e40af","bgColor":"#0f172a","textColor":"#ffffff","fontFamily":"Arial, sans-serif","borderRadius":"8px"},"resources":{"images":{"scene":{"bg_main":{"alias":"游戏背景","src":"/themes/plane_shooter_default/images/bg_main.png","type":"png"},"player":{"alias":"玩家飞机","src":"/themes/plane_shooter_default/images/player.png","type":"png"},"enemy_small":{"alias":"小型敌机","src":"/themes/plane_shooter_default/images/enemy_small.png","type":"png"},"enemy_medium":{"alias":"中型敌机","src":"/themes/plane_shooter_default/images/enemy_medium.png","type":"png"},"enemy_large":{"alias":"大型敌机","src":"/themes/plane_shooter_default/images/enemy_large.png","type":"png"},"bullet_player":{"alias":"玩家子弹","src":"/themes/plane_shooter_default/images/bullet_player.png","type":"png"},"bullet_enemy":{"alias":"敌机子弹","src":"/themes/plane_shooter_default/images/bullet_enemy.png","type":"png"},"prop_double":{"alias":"双发子弹","src":"/themes/plane_shooter_default/images/prop_double.png","type":"png"},"prop_shield":{"alias":"护盾","src":"/themes/plane_shooter_default/images/prop_shield.png","type":"png"},"prop_heart":{"alias":"生命恢复","src":"/themes/plane_shooter_default/images/prop_heart.png","type":"png"},"prop_bomb":{"alias":"炸弹","src":"/themes/plane_shooter_default/images/prop_bomb.png","type":"png"}},"ui":{},"icon":{},"effect":{"explosion":{"alias":"爆炸特效","src":"/themes/plane_shooter_default/images/explosion.png","type":"png"}}},"audio":{"bgm":{"bgm_main":{"alias":"背景音乐","src":"/themes/plane_shooter_default/audio/bgm_main.mp3","type":"mp3","volume":0.6}},"effect":{"sfx_shoot":{"alias":"射击音效","src":"/themes/plane_shooter_default/audio/sfx_shoot.mp3","type":"mp3","volume":0.8},"sfx_explosion":{"alias":"爆炸音效","src":"/themes/plane_shooter_default/audio/sfx_explosion.mp3","type":"mp3","volume":0.8},"sfx_hit":{"alias":"被击中音效","src":"/themes/plane_shooter_default/audio/sfx_hit.mp3","type":"mp3","volume":0.8},"sfx_prop":{"alias":"拾取道具音效","src":"/themes/plane_shooter_default/audio/sfx_prop.mp3","type":"mp3","volume":0.8},"sfx_gameover":{"alias":"游戏结束音效","src":"/themes/plane_shooter_default/audio/sfx_gameover.mp3","type":"mp3","volume":0.8}},"voice":{}},"video":{}}}',
    1,                                    -- is_default=1 默认主题
    NOW(),                                -- created_at
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
-- WHERE  game_code = 'plane-shooter' AND deleted = 0;

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
WHERE g.game_code = 'plane-shooter' AND g.deleted = 0;

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

-- ============================================================
-- ✅ 注册完成！
-- 
-- 使用说明：
-- 1. 将 __GAME_URL__ 替换为实际地址（如 http://localhost:5173）
-- 2. 在 MySQL 客户端执行：source register-game.sql
-- 3. 检查输出确认 game_id 和 theme_id
-- 4. 访问游戏平台验证是否显示
-- ============================================================
