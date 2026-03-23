-- =============================================
-- t_user_control_config 表字段补充脚本
-- 执行时间：2026-03-23
-- 说明：添加实体类中定义但数据库中缺失的字段
-- =============================================

USE kids_game_db;

-- 检查并添加 continuous_play_reminder 字段
ALTER TABLE t_user_control_config 
ADD COLUMN IF NOT EXISTS continuous_play_reminder INT DEFAULT NULL COMMENT '连续游戏提醒间隔（分钟）';

-- 检查并添加 daily_game_limit 字段
ALTER TABLE t_user_control_config 
ADD COLUMN IF NOT EXISTS daily_game_limit INT DEFAULT NULL COMMENT '每日游戏次数限制';

-- 检查并添加 game_interval 字段
ALTER TABLE t_user_control_config 
ADD COLUMN IF NOT EXISTS game_interval INT DEFAULT NULL COMMENT '单次游戏最小间隔（分钟）';

-- 验证字段是否添加成功
DESC t_user_control_config;

-- 查看表结构
SELECT 
    COLUMN_NAME AS '字段名',
    COLUMN_TYPE AS '类型',
    IS_NULLABLE AS '可为空',
    COLUMN_DEFAULT AS '默认值',
    COLUMN_COMMENT AS '注释'
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'kids_game_db'
AND TABLE_NAME = 't_user_control_config'
ORDER BY ORDINAL_POSITION;
