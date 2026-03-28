-- ================================================
-- schema_v2.sql 修正验证脚本
-- 执行时间：2026-03-28
-- ================================================

-- 1. 验证 t_theme_info.owner_type 默认值
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_DEFAULT,
    IS_NULLABLE,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'kidgame' 
  AND TABLE_NAME = 't_theme_info' 
  AND COLUMN_NAME = 'owner_type';
-- 预期结果：COLUMN_DEFAULT = 'GAME'

-- 2. 验证 t_user_theme_preference 结构
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'kidgame' 
  AND TABLE_NAME = 't_user_theme_preference'
ORDER BY ORDINAL_POSITION;
-- 预期结果：包含 owner_type, owner_id 字段

-- 3. 验证 t_theme_assets 外键约束
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'kidgame'
  AND TABLE_NAME = 't_theme_assets'
  AND CONSTRAINT_NAME = 'fk_theme_assets_theme';
-- 预期结果：REFERENCED_TABLE_NAME = 't_theme_info'

-- 4. 验证 t_game 字段完整性
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'kidgame' 
  AND TABLE_NAME = 't_game'
ORDER BY ORDINAL_POSITION;
-- 预期结果：包含 screenshot_urls, play_guide 字段

-- 5. 验证 t_system_config 字段完整性
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'kidgame' 
  AND TABLE_NAME = 't_system_config'
ORDER BY ORDINAL_POSITION;
-- 预期结果：包含 config_type, status 字段，config_value 为 text 类型

-- 6. 验证 t_game_session 字段完整性
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'kidgame' 
  AND TABLE_NAME = 't_game_session'
ORDER BY ORDINAL_POSITION;
-- 预期结果：包含 session_token 字段

-- 7. 验证 t_daily_stats 字段完整性
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'kidgame' 
  AND TABLE_NAME = 't_daily_stats'
ORDER BY ORDINAL_POSITION;
-- 预期结果：stat_date 为 date 类型，包含 total_fatigue_points, total_consumed_points 字段

-- 8. 统计所有表的数量
SELECT 
    COUNT(*) AS total_tables
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'kidgame' 
  AND TABLE_TYPE = 'BASE TABLE';
-- 预期结果：应该包含所有必要的表（约 50+ 个表）

-- 9. 列出所有新增的表
SELECT 
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'kidgame' 
  AND TABLE_NAME IN (
      't_game_resource_config',
      't_game_review_record',
      't_game_statistics',
      't_game_version_history',
      't_leaderboard_dimension',
      't_user_achievement',
      't_user_action_log',
      't_user_level',
      't_user_request',
      't_relation_confirmation'
  )
ORDER BY TABLE_NAME;
-- 预期结果：返回所有 10 个新增表

-- ================================================
-- 验证完成
-- ================================================
