-- =============================================
-- t_user_control_config 表结构检查脚本
-- 执行时间：2026-03-23
-- =============================================

USE kids_game_db;

-- 查看完整的表结构
DESC t_user_control_config;

-- 详细字段信息
SELECT 
    COLUMN_NAME AS '字段名',
    COLUMN_TYPE AS '数据类型',
    IS_NULLABLE AS '可为空',
    COLUMN_DEFAULT AS '默认值',
    COLUMN_COMMENT AS '注释',
    ORDINAL_POSITION AS '位置'
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'kids_game_db'
AND TABLE_NAME = 't_user_control_config'
ORDER BY ORDINAL_POSITION;

-- 检查疲劳控制模式的实际数据
SELECT 
    fatigue_control_mode,
    COUNT(*) AS count
FROM t_user_control_config
WHERE deleted = 0
GROUP BY fatigue_control_mode;

-- 查看所有枚举类型的字段
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'kids_game_db'
AND TABLE_NAME = 't_user_control_config'
AND (COLUMN_TYPE LIKE 'enum%' OR COLUMN_TYPE LIKE 'set%');
