-- 更新儿童用户表，添加每日答题获得疲劳点字段

-- 添加 daily_answer_points 字段
ALTER TABLE t_kid
ADD COLUMN daily_answer_points INT DEFAULT 0 COMMENT '每日答题获得的疲劳点数' AFTER fatigue_points;
