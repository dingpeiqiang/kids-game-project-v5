-- 修复 t_daily_stats 表结构
-- 添加所有缺失的字段，并统一字段命名

-- 添加 new_users 字段（如果不存在）
SET @sql = (
    SELECT IF(
        EXISTS (SELECT 1 FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 't_daily_stats' 
                AND COLUMN_NAME = 'new_users'),
        'SELECT 1',
        'ALTER TABLE t_daily_stats ADD COLUMN new_users INT DEFAULT 0 COMMENT ''新增用户数'' AFTER active_users'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加 total_game_count 字段（如果不存在）
SET @sql = (
    SELECT IF(
        EXISTS (SELECT 1 FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 't_daily_stats' 
                AND COLUMN_NAME = 'total_game_count'),
        'SELECT 1',
        'ALTER TABLE t_daily_stats ADD COLUMN total_game_count INT DEFAULT 0 COMMENT ''总游戏次数'' AFTER total_game_duration'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加 total_answer_count 字段（重命名/添加）
-- 先检查 total_answers 是否存在，如果存在则重命名为 total_answer_count
SET @sql = (
    SELECT IF(
        EXISTS (SELECT 1 FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 't_daily_stats' 
                AND COLUMN_NAME = 'total_answers'),
        'ALTER TABLE t_daily_stats CHANGE COLUMN total_answers total_answer_count INT DEFAULT 0 COMMENT ''总答题数''',
        'ALTER TABLE t_daily_stats ADD COLUMN total_answer_count INT DEFAULT 0 COMMENT ''总答题数'' AFTER total_game_count'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加 correct_answer_count 字段（重命名/添加）
-- 先检查 total_correct_answers 是否存在，如果存在则重命名为 correct_answer_count
SET @sql = (
    SELECT IF(
        EXISTS (SELECT 1 FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 't_daily_stats' 
                AND COLUMN_NAME = 'total_correct_answers'),
        'ALTER TABLE t_daily_stats CHANGE COLUMN total_correct_answers correct_answer_count INT DEFAULT 0 COMMENT ''答对数量''',
        'ALTER TABLE t_daily_stats ADD COLUMN correct_answer_count INT DEFAULT 0 COMMENT ''答对数量'' AFTER total_answer_count'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加 total_fatigue_points 字段（如果不存在）
SET @sql = (
    SELECT IF(
        EXISTS (SELECT 1 FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 't_daily_stats' 
                AND COLUMN_NAME = 'total_fatigue_points'),
        'SELECT 1',
        'ALTER TABLE t_daily_stats ADD COLUMN total_fatigue_points INT DEFAULT 0 COMMENT ''发放疲劳点总数'' AFTER correct_answer_count'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加 total_consumed_points 字段（如果不存在）
SET @sql = (
    SELECT IF(
        EXISTS (SELECT 1 FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 't_daily_stats' 
                AND COLUMN_NAME = 'total_consumed_points'),
        'SELECT 1',
        'ALTER TABLE t_daily_stats ADD COLUMN total_consumed_points INT DEFAULT 0 COMMENT ''消耗疲劳点总数'' AFTER total_fatigue_points'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 更新 stat_date 字段类型为 DATE（如果是 VARCHAR）
SET @sql = (
    SELECT IF(
        EXISTS (SELECT 1 FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 't_daily_stats' 
                AND COLUMN_NAME = 'stat_date'
                AND DATA_TYPE = 'varchar'),
        'ALTER TABLE t_daily_stats MODIFY COLUMN stat_date DATE NOT NULL COMMENT ''统计日期''',
        'SELECT 1'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 验证表结构
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 't_daily_stats'
ORDER BY ORDINAL_POSITION;
