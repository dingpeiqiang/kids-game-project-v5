-- ============================================
-- 主题系统重构 - 游戏和应用分离
-- ============================================
-- 设计原则:
-- 1. 游戏 (Game) 和应用 (Application) 独立定义
-- 2. 主题唯一归属于一个所有者 (游戏或应用)
-- 3. 在 theme_info 表上新增字段，移除关系表
-- ============================================

-- ============================================
-- 1. 修改 theme_info 表结构
-- ============================================

-- 添加所有者类型字段：GAME-游戏，APPLICATION-应用
ALTER TABLE theme_info 
ADD COLUMN owner_type VARCHAR(20) NOT NULL DEFAULT 'APPLICATION' COMMENT '所有者类型：GAME-游戏，APPLICATION-应用' AFTER author_id;

-- 添加所有者 ID 字段：关联 t_game.game_id 或未来的 t_application.app_id
ALTER TABLE theme_info 
ADD COLUMN owner_id BIGINT COMMENT '所有者 ID(游戏 ID 或应用 ID)' AFTER owner_type;

-- 为 owner_type 和 owner_id 添加索引
ALTER TABLE theme_info 
ADD INDEX idx_owner_type (owner_type);

ALTER TABLE theme_info 
ADD INDEX idx_owner_id (owner_id);

-- 可选：添加外键约束 (如果确保 t_game 一定存在)
-- ALTER TABLE theme_info 
-- ADD CONSTRAINT fk_theme_owner_game FOREIGN KEY (owner_id) REFERENCES t_game(game_id) ON DELETE CASCADE;

-- ============================================
-- 2. 数据迁移 (将旧数据转换为新格式)
-- ============================================

-- 迁移策略:
-- 1. applicable_scope = 'all' 的主题 -> owner_type = 'APPLICATION', owner_id = NULL
-- 2. applicable_scope = 'specific' 的主题 -> 需要根据 theme_game_relation 表确定归属
--    由于一对一关系，每个主题只能归属一个游戏，这里取第一个关联的游戏

-- 2.1 迁移通用主题 (applicable_scope = 'all')
UPDATE theme_info 
SET owner_type = 'APPLICATION', 
    owner_id = NULL 
WHERE applicable_scope = 'all';

-- 2.2 迁移游戏主题 (applicable_scope = 'specific')
-- 注意：这里假设每个主题只关联一个游戏，如果有多条记录，取第一条
UPDATE theme_info ti
INNER JOIN (
    SELECT theme_id, MIN(game_id) as game_id, MIN(game_code) as game_code
    FROM theme_game_relation
    GROUP BY theme_id
) tgr ON ti.theme_id = tgr.theme_id
SET ti.owner_type = 'GAME',
    ti.owner_id = tgr.game_id
WHERE ti.applicable_scope = 'specific';

-- ============================================
-- 3. 可选：删除旧字段和关系表
-- ============================================

-- 警告：执行以下操作前请务必备份数据!

-- 3.1 删除 applicable_scope 字段 (可选，建议先保留)
-- ALTER TABLE theme_info DROP COLUMN applicable_scope;

-- 3.2 删除 theme_game_relation 表 (可选，建议先保留一段时间)
-- DROP TABLE IF EXISTS theme_game_relation;

-- ============================================
-- 4. 验证迁移结果
-- ============================================

SELECT '=== 主题所有者分布 ===' as info;

SELECT 
    owner_type,
    COUNT(*) as count,
    CASE owner_type 
        WHEN 'GAME' THEN '游戏主题'
        WHEN 'APPLICATION' THEN '应用主题'
        ELSE '未知'
    END as type_name
FROM theme_info
GROUP BY owner_type;

SELECT '=== 游戏主题详情 ===' as info;

SELECT 
    ti.theme_id,
    ti.theme_name,
    ti.owner_type,
    ti.owner_id,
    g.game_code,
    g.game_name
FROM theme_info ti
LEFT JOIN t_game g ON ti.owner_id = g.game_id
WHERE ti.owner_type = 'GAME'
ORDER BY ti.theme_id;

SELECT '=== 应用主题详情 ===' as info;

SELECT 
    theme_id,
    theme_name,
    owner_type,
    owner_id,
    '适用于所有应用' as description
FROM theme_info
WHERE owner_type = 'APPLICATION'
ORDER BY theme_id;

SELECT '=== 迁移统计 ===' as info;

SELECT 
    '主题总数' as item, 
    COUNT(*) as value 
FROM theme_info
UNION ALL
SELECT 
    '游戏主题数', 
    COUNT(*) 
FROM theme_info 
WHERE owner_type = 'GAME'
UNION ALL
SELECT 
    '应用主题数', 
    COUNT(*) 
FROM theme_info 
WHERE owner_type = 'APPLICATION';
