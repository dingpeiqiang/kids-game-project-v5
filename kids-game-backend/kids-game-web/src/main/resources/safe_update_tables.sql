-- ============================================================
-- 儿童游戏平台后端 - 安全的数据库表更新脚本
-- ============================================================
-- 说明: 本脚本会先检查字段/表是否存在，避免重复添加导致错误
-- 支持的数据库: MySQL 5.7+
-- ============================================================

-- ========================================
-- 第一部分: 创建系统配置表
-- ========================================

CREATE TABLE IF NOT EXISTS t_system_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value VARCHAR(500) COMMENT '配置值',
    description VARCHAR(255) COMMENT '配置描述',
    config_group VARCHAR(50) COMMENT '配置分组 (fatigue/game/answer/system)',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- 插入默认配置（使用 INSERT IGNORE 避免重复）
INSERT IGNORE INTO t_system_config (config_key, config_value, description, config_group)
VALUES
-- 疲劳点配置
('fatigue.initial_points', '10', '初始疲劳点数', 'fatigue'),
('fatigue.points_per_minute', '1', '每分钟消耗疲劳点', 'fatigue'),
('fatigue.daily_reset_time', '00:00', '每日重置时间', 'fatigue'),
('fatigue.max_daily_points', '20', '每日最大疲劳点', 'fatigue'),

-- 答题配置
('answer.points_per_correct', '1', '答对每题获得疲劳点', 'answer'),
('answer.daily_max_points', '10', '每日答题获得疲劳点上限', 'answer'),
('answer.question_count_per_request', '1', '每次请求题目数量', 'answer'),

-- 游戏配置
('game.min_fatigue_points', '1', '开始游戏所需最小疲劳点', 'game'),
('game.max_single_duration', '60', '单次游戏最大时长(分钟)', 'game'),
('game.heartbeat_interval', '60', '心跳间隔(秒)', 'game'),

-- 系统配置
('system.jwt_expiration_hours', '24', 'JWT过期时间(小时)', 'system'),
('system.api_rate_limit_per_minute', '100', 'API每分钟限流次数', 'system'),
('system.api_rate_limit_per_minute.answer', '10', '答题接口每分钟限流次数', 'system');

-- ========================================
-- 第二部分: 更新每日统计表
-- ========================================

-- 使用存储过程动态添加字段（如果不存在）
DELIMITER $$

DROP PROCEDURE IF EXISTS AddColumnIfNotExists$$

CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(100),
    IN columnName VARCHAR(100),
    IN columnDefinition TEXT
)
BEGIN
    DECLARE columnExists INT DEFAULT 0;

    SELECT COUNT(*) INTO columnExists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = tableName
      AND COLUMN_NAME = columnName;

    IF columnExists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', columnDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('字段已添加: ', tableName, '.', columnName) AS result;
    ELSE
        SELECT CONCAT('字段已存在，跳过: ', tableName, '.', columnName) AS result;
    END IF;
END$$

DELIMITER ;

-- 添加 t_daily_stats 的新字段
CALL AddColumnIfNotExists('t_daily_stats', 'new_users', 'new_users INT DEFAULT 0 COMMENT ''新增用户数'' AFTER active_users');

CALL AddColumnIfNotExists('t_daily_stats', 'total_game_count', 'total_game_count INT DEFAULT 0 COMMENT ''总游戏次数'' AFTER total_game_duration');

CALL AddColumnIfNotExists('t_daily_stats', 'correct_answer_count', 'correct_answer_count INT DEFAULT 0 COMMENT ''答对数量'' AFTER total_correct_answers');

CALL AddColumnIfNotExists('t_daily_stats', 'total_fatigue_points', 'total_fatigue_points INT DEFAULT 0 COMMENT ''发放疲劳点总数'' AFTER correct_answer_count');

CALL AddColumnIfNotExists('t_daily_stats', 'total_consumed_points', 'total_consumed_points INT DEFAULT 0 COMMENT ''消耗疲劳点总数'' AFTER total_fatigue_points');

-- 修改 stat_date 字段类型（如果当前是 VARCHAR）
DELIMITER $$

DROP PROCEDURE IF EXISTS ModifyColumnTypeIf$$

CREATE PROCEDURE ModifyColumnTypeIf(
    IN tableName VARCHAR(100),
    IN columnName VARCHAR(100),
    IN currentType VARCHAR(50),
    IN newDefinition TEXT
)
BEGIN
    DECLARE columnType VARCHAR(50);
    DECLARE canModify INT DEFAULT 0;

    SELECT DATA_TYPE INTO columnType
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = tableName
      AND COLUMN_NAME = columnName;

    IF columnType = currentType THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' MODIFY COLUMN ', newDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('字段类型已修改: ', tableName, '.', columnName, ' FROM ', currentType) AS result;
    ELSE
        SELECT CONCAT('字段类型不需要修改: ', tableName, '.', columnName, ' IS ', columnType) AS result;
    END IF;
END$$

DELIMITER ;

-- 修改 stat_date 字段类型（如果当前是 VARCHAR）
CALL ModifyColumnTypeIf('t_daily_stats', 'stat_date', 'varchar', 'stat_date DATE NOT NULL COMMENT ''统计日期''');

-- 更新现有数据的 stat_date 格式（如果原来存储的是字符串）
UPDATE t_daily_stats SET stat_date = STR_TO_DATE(stat_date, '%Y-%m-%d') WHERE stat_date LIKE '%-%-%';

-- ========================================
-- 第三部分: 更新儿童用户表
-- ========================================

-- 添加 daily_answer_points 字段
CALL AddColumnIfNotExists('t_kid', 'daily_answer_points', 'daily_answer_points INT DEFAULT 0 COMMENT ''每日答题获得的疲劳点数'' AFTER fatigue_points');

-- ========================================
-- 清理临时存储过程
-- ========================================

DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DROP PROCEDURE IF EXISTS ModifyColumnTypeIf;

-- ========================================
-- 验证脚本执行结果
-- ========================================

SELECT '========================== 系统配置表数据 ==========================' AS '';
SELECT config_group, config_key, config_value, description
FROM t_system_config
ORDER BY config_group, config_key;

SELECT '========================== 每日统计表结构 ==========================' AS '';
DESCRIBE t_daily_stats;

SELECT '========================== 儿童用户表结构 ==========================' AS '';
DESCRIBE t_kid;

SELECT '========================== 更新完成 ==========================' AS '';
SELECT '数据库更新成功完成！' AS message;
