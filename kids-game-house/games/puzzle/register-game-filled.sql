-- ============================================================
-- 快乐拼图屋 - 游戏注册 SQL 脚本
-- 生成时间：2026-03-29
-- ============================================================
-- 游戏信息：
--   - 游戏代码：puzzle
--   - 游戏名称：快乐拼图屋
--   - 主题：动物主题
--   - 适龄：3-8 岁儿童
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
    'puzzle',                           -- game_code: 拼图游戏唯一编码
    '快乐拼图屋',                       -- game_name: 中文名称
    'PUZZLE',                           -- category: 拼图类
    '3-8 岁',                           -- grade: 适龄阶段
    NULL,                               -- tags: 标签（益智，休闲，动物）
    NULL,                               -- icon_url: 图标 URL
    NULL,                               -- cover_url: 封面 URL
    NULL,                               -- resource_url: 资源 CDN 地址
    NULL,                               -- screenshot_urls: 截图 URL 列表
    'http://localhost:5173',            -- game_url: 本地开发地址
    NULL,                               -- game_secret: 游戏密钥（暂不启用）
    NULL,                               -- game_config: 透传配置
    '适合 3-8 岁儿童的动物主题拼图游戏，通过点击交换拼图块还原完整图案，培养观察力和逻辑思维能力。包含猫咪、小狗、小兔等多种可爱动物主题，支持 3 个难度等级。', -- description: 游戏描述
    NULL,                               -- play_guide: 操作说明
    NULL,                               -- module_path: 模块路径（独立部署填 NULL）
    0,                                  -- status: 0=草稿（开发中），发布后改 2
    0,                                  -- sort_order: 排序权重
    0,                                  -- is_featured: 是否推荐
    1,                                  -- consume_points_per_minute: 每分钟疲劳点
    0,                                  -- min_fatigue_to_start: 启动所需疲劳度
    0,                                  -- online_count: 在线人数
    0,                                  -- total_play_count: 累计游玩次数
    0,                                  -- total_play_duration: 累计时长（秒）
    0.00,                               -- average_rating: 平均评分
    UNIX_TIMESTAMP(NOW()) * 1000,       -- create_time: 创建时间（毫秒）
    UNIX_TIMESTAMP(NOW()) * 1000,       -- update_time: 更新时间（毫秒）
    0,                                  -- deleted: 逻辑删除
    NULL,                               -- creator_id: 创建人 ID
    NULL                                -- publish_time: 上架时间（草稿为 NULL）
)
ON DUPLICATE KEY UPDATE
    game_name                = VALUES(game_name),
    category                 = VALUES(category),
    grade                    = VALUES(grade),
    game_url                 = VALUES(game_url),
    icon_url                 = VALUES(icon_url),
    cover_url                = VALUES(cover_url),
    resource_url             = VALUES(resource_url),
    screenshot_urls          = VALUES(screenshot_urls),
    description              = VALUES(description),
    play_guide               = VALUES(play_guide),
    game_config              = VALUES(game_config),
    tags                     = VALUES(tags),
    sort_order               = VALUES(sort_order),
    is_featured              = VALUES(is_featured),
    consume_points_per_minute= VALUES(consume_points_per_minute),
    min_fatigue_to_start     = VALUES(min_fatigue_to_start),
    update_time              = UNIX_TIMESTAMP(NOW()) * 1000;

-- ────────────────────────────────────────────────────────────
-- 第 2 步：验证游戏记录已插入
-- ────────────────────────────────────────────────────────────
SELECT 
    game_code, 
    game_name, 
    category, 
    grade, 
    game_url, 
    status,
    FROM_UNIXTIME(create_time / 1000) AS create_time_cn
FROM t_game 
WHERE game_code = 'puzzle' AND deleted = 0;

-- ────────────────────────────────────────────────────────────
-- 第 3 步：插入/更新主题配置记录（使用 DATETIME 类型）
-- ────────────────────────────────────────────────────────────
-- 说明：t_theme_info 表主键是 theme_id (自增)，通过 owner_type='GAME' + owner_id + is_default 来唯一标识
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
    0,                                   -- author_id: 官方主题填 0
    0,                                   -- is_official: 0=游戏方维护
    'GAME',                              -- owner_type: 游戏方主题
    (SELECT game_id FROM t_game WHERE game_code = 'puzzle' AND deleted = 0 LIMIT 1), -- owner_id: 关联游戏 ID
    '快乐拼图屋 - 动物主题默认主题',      -- theme_name: 主题名称
    'AI Assistant',                      -- author_name: 作者名称
    0,                                   -- price: 免费
    'on_sale',                           -- status: on_sale=上架
    0,                                   -- download_count
    0,                                   -- total_revenue
    '',                                  -- thumbnail_url: 缩略图
    '快乐拼图屋动物主题默认主题，包含猫咪、小狗、小兔等可爱动物图案', -- description: 描述
    '{"specMeta":{"specName":"GTRS","specVersion":"1.0.0","compatibleVersion":"1.0.0"},"themeInfo":{"themeCode":"puzzle_animal_default","themeName":"快乐拼图屋 - 动物主题默认主题","gameId":"puzzle","ownerType":"GAME","ownerId":"puzzle","isDefault":true,"author":"AI Assistant","version":"1.0.0"},"globalStyle":{"primaryColor":"#FFB347","secondaryColor":"#FFA500","bgColor":"#87CEEB","textColor":"#ffffff","fontFamily":"Arial, sans-serif","borderRadius":"12px"},"resources":{"images":{"scene":{},"ui":{},"icon":{},"effect":{}},"audio":{"bgm":{},"effect":{},"voice":{}},"video":{}}}', -- config_json: GTRS 配置（压缩为单行）
    1,                                   -- is_default: 1=默认主题
    NOW(),                               -- created_at: DATETIME 类型
    NOW()                                -- updated_at: DATETIME 类型
)
ON DUPLICATE KEY UPDATE
    theme_name    = VALUES(theme_name),
    description   = VALUES(description),
    thumbnail_url = VALUES(thumbnail_url),
    config_json   = VALUES(config_json),
    updated_at    = NOW();

-- ────────────────────────────────────────────────────────────
-- 第 4 步：验证主题配置已插入
-- ────────────────────────────────────────────────────────────
-- 说明：通过 owner_type + owner_id + is_default 查询主题
SELECT 
    theme_id,
    theme_name,
    owner_type,
    owner_id,
    is_default,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at_cn
FROM t_theme_info 
WHERE owner_type = 'GAME' 
  AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'puzzle' AND deleted = 0 LIMIT 1)
  AND is_default = 1;

-- ============================================================
-- 🎉 游戏注册完成！
-- ============================================================
-- 下一步：
-- 1. 在浏览器中访问 http://localhost:5173 测试游戏
-- 2. 测试通过后，执行以下 SQL 上架游戏：
--
-- UPDATE t_game
-- SET status = 2,  -- 2=已上架
--     publish_time = UNIX_TIMESTAMP(NOW()) * 1000
-- WHERE game_code = 'puzzle' AND deleted = 0;
-- ============================================================
