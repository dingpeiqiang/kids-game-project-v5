-- 初始化 houses 目录下的两款游戏数据
-- 1. 贪吃蛇大冒险 (snake-vue3)
-- 2. 植物大战僵尸 (plants-vs-zombie)

-- ========================================
-- 1. 贪吃蛇大冒险
-- ========================================
INSERT INTO t_game (
    game_code,
    game_name,
    category,
    grade,
    icon_url,
    cover_url,
    description,
    game_url,
    module_path,
    status,
    sort_order,
    consume_points_per_minute,
    create_time,
    update_time
) VALUES (
    'SNAKE_VUE3',
    '贪吃蛇大冒险',
    'PUZZLE',
    '一年级',
    '/images/games/snake-vue3/snake-icon.png',
    '',
    '经典贪吃蛇游戏，控制小蛇吃食物，不断变长，挑战最高分！支持多种难度和稀有食物。',
    'http://localhost:3003',
    NULL,
    1,
    1,
    1,
    UNIX_TIMESTAMP() * 1000,
    UNIX_TIMESTAMP() * 1000
) ON DUPLICATE KEY UPDATE
    game_name = VALUES(game_name),
    category = VALUES(category),
    grade = VALUES(grade),
    icon_url = VALUES(icon_url),
    description = VALUES(description),
    game_url = VALUES(game_url),
    status = VALUES(status),
    sort_order = VALUES(sort_order),
    update_time = VALUES(update_time);

-- ========================================
-- 2. 植物大战僵尸
-- ========================================
INSERT INTO t_game (
    game_code,
    game_name,
    category,
    grade,
    icon_url,
    cover_url,
    description,
    game_url,
    module_path,
    status,
    sort_order,
    consume_points_per_minute,
    create_time,
    update_time
) VALUES (
    'PLANTS_VS_ZOMBIE',
    '植物大战僵尸',
    'PUZZLE',
    '一年级',
    '/images/games/plants-vs-zombie/icon.png',
    '',
    '经典塔防游戏，种植各种植物抵御僵尸进攻！保护你的家园，享受策略乐趣。',
    'http://localhost:3004',
    NULL,
    1,
    2,
    1,
    UNIX_TIMESTAMP() * 1000,
    UNIX_TIMESTAMP() * 1000
) ON DUPLICATE KEY UPDATE
    game_name = VALUES(game_name),
    category = VALUES(category),
    grade = VALUES(grade),
    icon_url = VALUES(icon_url),
    description = VALUES(description),
    game_url = VALUES(game_url),
    status = VALUES(status),
    sort_order = VALUES(sort_order),
    update_time = VALUES(update_time);

-- ========================================
-- 验证插入结果
-- ========================================
SELECT 
    game_id, 
    game_code, 
    game_name, 
    category, 
    grade, 
    game_url, 
    status,
    sort_order
FROM t_game
WHERE game_code IN ('SNAKE_VUE3', 'PLANTS_VS_ZOMBIE')
ORDER BY sort_order;

-- ========================================
-- 为主题关联游戏 (如果主题系统已初始化)
-- ========================================
-- 注意：以下 SQL 仅在 theme_info 表已有数据时执行
-- 为每个游戏创建一个默认主题，并建立关联

-- 检查 theme_info 表是否存在
SET @theme_table_exists = (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'kids_game' 
    AND table_name = 'theme_info'
);

-- 如果 theme_info 表存在，则为主题建立游戏关联
SET @sql = IF(@theme_table_exists > 0,
    'INSERT INTO theme_game_relation (theme_id, game_id, game_code, is_default, create_time, update_time)
     SELECT 
         ti.theme_id,
         g.game_id,
         g.game_code,
         1 as is_default,
         UNIX_TIMESTAMP() * 1000 as create_time,
         UNIX_TIMESTAMP() * 1000 as update_time
     FROM t_game g
     CROSS JOIN theme_info ti
     WHERE g.game_code IN (''SNAKE_VUE3'', ''PLANTS_VS_ZOMBIE'')
     AND NOT EXISTS (
         SELECT 1 FROM theme_game_relation tgr 
         WHERE tgr.game_id = g.game_id 
         AND tgr.theme_id = ti.theme_id
     )',
    'SELECT "Theme info table does not exist, skipping relation creation" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 如果 theme_info 表存在，执行更新操作
SET @update_sql = IF(@theme_table_exists > 0,
    'UPDATE theme_game_relation tgr
     INNER JOIN t_game g ON tgr.game_id = g.game_id
     SET tgr.update_time = UNIX_TIMESTAMP() * 1000
     WHERE g.game_code IN (''SNAKE_VUE3'', ''PLANTS_VS_ZOMBIE'')',
    'SELECT "Skipping update" as message'
);

PREPARE stmt FROM @update_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 显示主题 - 游戏关联信息
SELECT 
    tgr.relation_id,
    tgr.theme_id,
    ti.theme_name,
    tgr.game_id,
    g.game_code,
    g.game_name,
    tgr.is_default,
    tgr.create_time
FROM theme_game_relation tgr
INNER JOIN t_game g ON tgr.game_id = g.game_id
LEFT JOIN theme_info ti ON tgr.theme_id = ti.theme_id
WHERE g.game_code IN (''SNAKE_VUE3'', ''PLANTS_VS_ZOMBIE'')
ORDER BY tgr.relation_id;
