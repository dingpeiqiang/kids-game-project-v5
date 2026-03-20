-- 更新每日统计表，添加缺失的字段
-- 注意: MySQL 的 ALTER TABLE 不支持 IF NOT EXISTS 语法
-- 如果字段已存在，需要手动跳过或先检查

-- 检查字段是否存在，不存在则添加
-- 方式1: 直接添加（如果已存在会报错，需要根据情况处理）

-- 添加 new_users 字段
ALTER TABLE t_daily_stats
ADD COLUMN new_users INT DEFAULT 0 COMMENT '新增用户数' AFTER active_users;

-- 添加 total_game_count 字段
ALTER TABLE t_daily_stats
ADD COLUMN total_game_count INT DEFAULT 0 COMMENT '总游戏次数' AFTER total_game_duration;

-- 添加 correct_answer_count 字段
ALTER TABLE t_daily_stats
ADD COLUMN correct_answer_count INT DEFAULT 0 COMMENT '答对数量' AFTER total_correct_answers;

-- 添加 total_fatigue_points 字段
ALTER TABLE t_daily_stats
ADD COLUMN total_fatigue_points INT DEFAULT 0 COMMENT '发放疲劳点总数' AFTER correct_answer_count;

-- 添加 total_consumed_points 字段
ALTER TABLE t_daily_stats
ADD COLUMN total_consumed_points INT DEFAULT 0 COMMENT '消耗疲劳点总数' AFTER total_fatigue_points;

-- 更新字段类型 - 将 stat_date 改为 DATE 类型（原来是 VARCHAR）
ALTER TABLE t_daily_stats
MODIFY COLUMN stat_date DATE NOT NULL COMMENT '统计日期';

-- 更新现有数据的 stat_date 格式（如果原来存储的是字符串）
-- 注意: 这步执行前需要先确保有数据，否则会报错
UPDATE t_daily_stats SET stat_date = STR_TO_DATE(stat_date, '%Y-%m-%d') WHERE stat_date LIKE '%-%-%';
