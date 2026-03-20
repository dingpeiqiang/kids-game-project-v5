-- ============================================
-- 主题系统重构 - 快速验证脚本
-- ============================================
-- 用于验证新的主题系统设计是否正常工作
-- ============================================

-- ============================================
-- 1. 测试应用主题 (通用主题)
-- ============================================

INSERT INTO theme_info (
    author_id,
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
    created_at,
    updated_at
) VALUES (
    1,
    'APPLICATION',  -- 应用主题
    NULL,           -- 不特定属于任何游戏
    '经典默认主题',
    '系统',
    0,
    'on_sale',
    0,
    0,
    '/images/themes/default/thumbnail.png',
    '适用于所有应用的经典主题，简洁大方的设计风格。',
    '{"version": "1.0", "author": "系统"}',
    NOW(),
    NOW()
);

-- ============================================
-- 2. 测试游戏主题 - 贪吃蛇
-- ============================================

INSERT INTO theme_info (
    author_id,
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
    created_at,
    updated_at
) 
SELECT 
    1 as author_id,
    'GAME' as owner_type,
    g.game_id as owner_id,
    '贪吃蛇专属主题 - 清新绿' as theme_name,
    '系统' as author_name,
    100 as price,
    'on_sale' as status,
    0 as download_count,
    0 as total_revenue,
    '/images/themes/snake/green/thumbnail.png' as thumbnail_url,
    '专为贪吃蛇设计的清新绿色主题，让游戏体验更加舒适。' as description,
    '{"version": "1.0", "colorScheme": "green"}' as config_json,
    NOW() as created_at,
    NOW() as updated_at
FROM t_game g
WHERE g.game_code = 'SNAKE_VUE3'
LIMIT 1;

-- ============================================
-- 3. 测试游戏主题 - 植物大战僵尸
-- ============================================

INSERT INTO theme_info (
    author_id,
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
    created_at,
    updated_at
) 
SELECT 
    1 as author_id,
    'GAME' as owner_type,
    g.game_id as owner_id,
    '植物大战僵尸 - 阳光主题' as theme_name,
    '系统' as author_name,
    150 as price,
    'on_sale' as status,
    0 as download_count,
    0 as total_revenue,
    '/images/themes/pvz/sunshine/thumbnail.png' as thumbnail_url,
    '充满阳光活力的植物大战僵尸专属主题，色彩明快。' as description,
    '{"version": "1.0", "colorScheme": "sunshine"}' as config_json,
    NOW() as created_at,
    NOW() as updated_at
FROM t_game g
WHERE g.game_code = 'PLANTS_VS_ZOMBIE'
LIMIT 1;

-- ============================================
-- 4. 验证查询结果
-- ============================================

SELECT '=== 所有主题列表 ===' as info;

SELECT 
    theme_id,
    theme_name,
    owner_type,
    CASE owner_type 
        WHEN 'GAME' THEN '游戏主题'
        WHEN 'APPLICATION' THEN '应用主题'
        ELSE '未知'
    END as type_name,
    owner_id,
    author_name,
    price,
    status
FROM theme_info
ORDER BY theme_id;

SELECT '=== 应用主题详情 ===' as info;

SELECT 
    ti.theme_id,
    ti.theme_name,
    ti.author_name,
    ti.price,
    ti.description,
    '适用于所有应用' as scope
FROM theme_info ti
WHERE ti.owner_type = 'APPLICATION'
ORDER BY ti.theme_id;

SELECT '=== 游戏主题详情 ===' as info;

SELECT 
    ti.theme_id,
    ti.theme_name,
    ti.owner_id as game_id,
    g.game_code,
    g.game_name,
    ti.author_name,
    ti.price,
    ti.description
FROM theme_info ti
INNER JOIN t_game g ON ti.owner_id = g.game_id
WHERE ti.owner_type = 'GAME'
ORDER BY ti.theme_id;

SELECT '=== 按游戏统计主题数量 ===' as info;

SELECT 
    g.game_code,
    g.game_name,
    COUNT(ti.theme_id) as theme_count
FROM t_game g
LEFT JOIN theme_info ti ON g.game_id = ti.owner_id AND ti.owner_type = 'GAME'
GROUP BY g.game_id, g.game_code, g.game_name
ORDER BY theme_count DESC;

SELECT '=== 主题类型分布 ===' as info;

SELECT 
    owner_type,
    COUNT(*) as count,
    CASE owner_type 
        WHEN 'GAME' THEN '游戏主题'
        WHEN 'APPLICATION' THEN '应用主题'
        ELSE '未知'
    END as type_name,
    CONCAT(COUNT(*), ' 个') as description
FROM theme_info
GROUP BY owner_type
UNION ALL
SELECT 
    'TOTAL' as owner_type,
    COUNT(*) as count,
    '总计' as type_name,
    CONCAT(COUNT(*), ' 个') as description
FROM theme_info;

-- ============================================
-- 5. 测试查询特定游戏的主题
-- ============================================

SELECT '=== 测试：查询贪吃蛇的主题 ===' as info;

SELECT 
    ti.theme_id,
    ti.theme_name,
    ti.owner_type,
    ti.owner_id,
    ti.price,
    ti.status
FROM theme_info ti
WHERE ti.owner_type = 'GAME' 
  AND ti.owner_id = (
      SELECT game_id FROM t_game WHERE game_code = 'SNAKE_VUE3' LIMIT 1
  )
ORDER BY ti.created_at DESC;

SELECT '=== 测试：查询所有可用主题 (应用主题 + 特定游戏主题) ===' as info;

-- 查询某个游戏可以使用的主题 (包括应用主题和该游戏的专属主题)
SELECT 
    ti.theme_id,
    ti.theme_name,
    ti.owner_type,
    CASE ti.owner_type 
        WHEN 'APPLICATION' THEN '所有游戏可用'
        WHEN 'GAME' THEN CONCAT('专属游戏：', g.game_name)
        ELSE '未知'
    END as availability,
    ti.price,
    ti.status
FROM theme_info ti
LEFT JOIN t_game g ON ti.owner_id = g.game_id AND ti.owner_type = 'GAME'
WHERE ti.owner_type = 'APPLICATION'  -- 应用主题
   OR (ti.owner_type = 'GAME' AND ti.owner_id = (
       SELECT game_id FROM t_game WHERE game_code = 'SNAKE_VUE3' LIMIT 1
   ))
ORDER BY ti.owner_type, ti.theme_id;

-- ============================================
-- 6. 清理测试数据 (可选)
-- ============================================

-- 警告：执行以下语句将删除所有测试数据!
-- 如需清理，请取消以下注释:

/*
DELETE FROM theme_info 
WHERE theme_name IN (
    '经典默认主题',
    '贪吃蛇专属主题 - 清新绿',
    '植物大战僵尸 - 阳光主题'
);
*/
