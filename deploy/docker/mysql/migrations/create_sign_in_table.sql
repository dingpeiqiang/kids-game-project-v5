-- 用户签到记录表
CREATE TABLE IF NOT EXISTS `t_user_sign_in` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `sign_in_date` varchar(10) NOT NULL COMMENT '签到日期 (格式: yyyy-MM-dd)',
  `consecutive_days` int(11) NOT NULL DEFAULT '1' COMMENT '连续签到天数',
  `coins_reward` int(11) NOT NULL DEFAULT '50' COMMENT '获得的金币奖励',
  `exp_reward` int(11) NOT NULL DEFAULT '0' COMMENT '获得经验值奖励',
  `create_time` bigint(20) NOT NULL COMMENT '创建时间',
  `update_time` bigint(20) NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`user_id`, `sign_in_date`) COMMENT '用户日期唯一索引',
  KEY `idx_user_id` (`user_id`) COMMENT '用户ID索引',
  KEY `idx_sign_in_date` (`sign_in_date`) COMMENT '签到日期索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户签到记录表';