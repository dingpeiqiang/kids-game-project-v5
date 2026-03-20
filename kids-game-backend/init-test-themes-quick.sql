-- ========================================
-- 初始化测试主题数据 (快速验证版)
-- 用于快速测试创作者中心功能
-- ========================================

-- 1. 插入测试主题
INSERT INTO theme_info (
    author_id,
    theme_name,
    applicable_scope,
    author_name,
    price,
    status,
    download_count,
    total_revenue,
    thumbnail_url,
    description,
    config_json,
    created_at,
    updated_at
) VALUES
(
    1,
    '经典默认主题',
    'all',
    '系统',
    0,
    'on_sale',
    0,
    0,
    '/images/themes/default/thumbnail.png',
    '适用于所有游戏的经典主题，简洁大方的设计风格。',
    '{"version": "1.0", "author": "系统"}',
    NOW(),
    NOW()
),
(
    1,
    '贪吃蛇专属主题 - 清新绿',
    'specific',
    '系统',
    100,
    'on_sale',
    0,
    0,
    '/images/themes/snake/green/thumbnail.png',
    '专为贪吃蛇设计的清新绿色主题，让游戏体验更加舒适。',
    '{"version": "1.0", "colorScheme": "green"}',
    NOW(),
    NOW()
),
(
    1,
    '植物大战僵尸 - 阳光主题',
    'specific',
    '系统',
    150,
    'on_sale',
    0,
    0,
    '/images/themes/pvz/sunshine/thumbnail.png',
    '充满阳光活力的植物大战僵尸专属主题，色彩明快。',
    '{"version": "1.0", "colorScheme": "sunshine"}',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    theme_name = VALUES(theme_name),
    status = VALUES(status),
    description = VALUES(description),
    updated_at = VALUES(updated_at);

-- 2. 为主题建立游戏关联
-- 注意：这部分会在 init-houses-games.sql 中自动执行
-- 这里仅提供手动执行的选项

-- 删除旧的关联关系 (可选)
-- DELETE FROM theme_game_relation 
-- WHERE game_id IN (
--     SELECT game_id FROM t_game 
--     WHERE game_code IN ('SNAKE_VUE3', 'PLANTS_VS_ZOMBIE')
-- );

-- 插入新的关联关系
INSERT INTO theme_game_relation (
    theme_id,
    game_id,
    game_code,
    is_default,
    create_time,
    update_time
)
SELECT 
    ti.theme_id,
    g.game_id,
    g.game_code,
    CASE 
        WHEN ti.theme_name LIKE '%默认%' THEN 1
        ELSE 0
    END as is_default,
    UNIX_TIMESTAMP(NOW()) * 1000 as create_time,
    UNIX_TIMESTAMP(NOW()) * 1000 as update_time
FROM theme_info ti
CROSS JOIN t_game g
WHERE g.game_code IN ('SNAKE_VUE3', 'PLANTS_VS_ZOMBIE')
AND NOT EXISTS (
    SELECT 1 FROM theme_game_relation tgr 
    WHERE tgr.game_id = g.game_id 
    AND tgr.theme_id = ti.theme_id
);

-- 更新已存在的关联关系
UPDATE theme_game_relation tgr
INNER JOIN t_game g ON tgr.game_id = g.game_id
SET tgr.update_time = UNIX_TIMESTAMP(NOW()) * 1000
WHERE g.game_code IN ('SNAKE_VUE3', 'PLANTS_VS_ZOMBIE');

-- 3. 验证插入结果
SELECT 
    '=== 主题数据 ===' as info;

SELECT 
    ti.theme_id,
    ti.theme_name,
    ti.applicable_scope,
    ti.status,
    ti.price,
    ti.description
FROM theme_info ti
ORDER BY ti.theme_id;

SELECT 
    '=== 主题 - 游戏关联关系 ===' as info;

SELECT 
    ti.theme_id,
    ti.theme_name,
    tgr.game_id,
    g.game_code,
    g.game_name,
    tgr.is_default,
    CASE tgr.is_default 
        WHEN 1 THEN '✓ 默认主题'
        ELSE '○ 普通主题'
    END as default_status
FROM theme_info ti
INNER JOIN theme_game_relation tgr ON ti.theme_id = tgr.theme_id
INNER JOIN t_game g ON tgr.game_id = g.game_id
WHERE g.game_code IN ('SNAKE_VUE3', 'PLANTS_VS_ZOMBIE')
ORDER BY ti.theme_id, g.game_id;

SELECT 
    '=== 统计信息 ===' as info;

SELECT 
    '主题总数' as item, 
    COUNT(*) as value 
FROM theme_info
UNION ALL
SELECT 
    '上架主题', 
    COUNT(*) 
FROM theme_info 
WHERE status = 'on_sale'
UNION ALL
SELECT 
    '关联关系数', 
    COUNT(*) 
FROM theme_game_relation
UNION ALL
SELECT 
    '游戏数', 
    COUNT(*) 
FROM t_game 
WHERE game_code IN ('SNAKE_VUE3', 'PLANTS_VS_ZOMBIE');
