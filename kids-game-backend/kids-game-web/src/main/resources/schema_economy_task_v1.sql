-- 经济与任务系统扩展 v1
-- 执行前请备份数据库

-- MySQL 8.0.12+ 支持 IF NOT EXISTS；若报错请手动执行下方两条 ALTER
ALTER TABLE `t_user` ADD COLUMN `coins` int NOT NULL DEFAULT 0 COMMENT '金币' AFTER `fatigue_points`;
ALTER TABLE `t_user` ADD COLUMN `exp` int NOT NULL DEFAULT 0 COMMENT '经验值' AFTER `coins`;

ALTER TABLE `t_user_sign_in` ADD COLUMN `study_coins_reward` int DEFAULT 0 COMMENT '游学币奖励' AFTER `exp_reward`;

-- 签到奖励配置（管理员可配）
CREATE TABLE IF NOT EXISTS `t_sign_in_reward_config` (
    `config_id` bigint NOT NULL AUTO_INCREMENT,
    `day_index` int NOT NULL COMMENT '连续签到第几天(1-7循环)',
    `coins_reward` int NOT NULL DEFAULT 50,
    `study_coins_reward` int NOT NULL DEFAULT 0,
    `exp_reward` int NOT NULL DEFAULT 0,
    `enabled` tinyint NOT NULL DEFAULT 1,
    `update_time` bigint DEFAULT NULL,
    PRIMARY KEY (`config_id`),
    UNIQUE KEY `uk_day_index` (`day_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='签到奖励配置';

INSERT INTO `t_sign_in_reward_config` (`day_index`, `coins_reward`, `study_coins_reward`, `exp_reward`, `enabled`, `update_time`)
SELECT 1, 30, 0, 10, 1, UNIX_TIMESTAMP()*1000 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM t_sign_in_reward_config WHERE day_index=1);
INSERT INTO `t_sign_in_reward_config` (`day_index`, `coins_reward`, `study_coins_reward`, `exp_reward`, `enabled`, `update_time`)
SELECT 2, 35, 0, 10, 1, UNIX_TIMESTAMP()*1000 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM t_sign_in_reward_config WHERE day_index=2);
INSERT INTO `t_sign_in_reward_config` (`day_index`, `coins_reward`, `study_coins_reward`, `exp_reward`, `enabled`, `update_time`)
SELECT 3, 40, 1, 15, 1, UNIX_TIMESTAMP()*1000 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM t_sign_in_reward_config WHERE day_index=3);
INSERT INTO `t_sign_in_reward_config` (`day_index`, `coins_reward`, `study_coins_reward`, `exp_reward`, `enabled`, `update_time`)
SELECT 4, 45, 0, 15, 1, UNIX_TIMESTAMP()*1000 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM t_sign_in_reward_config WHERE day_index=4);
INSERT INTO `t_sign_in_reward_config` (`day_index`, `coins_reward`, `study_coins_reward`, `exp_reward`, `enabled`, `update_time`)
SELECT 5, 50, 0, 20, 1, UNIX_TIMESTAMP()*1000 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM t_sign_in_reward_config WHERE day_index=5);
INSERT INTO `t_sign_in_reward_config` (`day_index`, `coins_reward`, `study_coins_reward`, `exp_reward`, `enabled`, `update_time`)
SELECT 6, 55, 1, 20, 1, UNIX_TIMESTAMP()*1000 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM t_sign_in_reward_config WHERE day_index=6);
INSERT INTO `t_sign_in_reward_config` (`day_index`, `coins_reward`, `study_coins_reward`, `exp_reward`, `enabled`, `update_time`)
SELECT 7, 80, 2, 30, 1, UNIX_TIMESTAMP()*1000 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM t_sign_in_reward_config WHERE day_index=7);

-- 游戏游学币消耗与关卡奖励配置
CREATE TABLE IF NOT EXISTS `t_game_economy_config` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `game_id` bigint NOT NULL,
    `study_coin_cost` int NOT NULL DEFAULT 1 COMMENT '每局消耗游学币',
    `level_rewards_json` text COMMENT '关卡奖励JSON [{level:1,coins:5,exp:3},...]',
    `enabled` tinyint NOT NULL DEFAULT 1,
    `update_time` bigint DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_game_id` (`game_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏经济配置';

-- 单局排行榜（每局一条，取前100）
CREATE TABLE IF NOT EXISTS `t_game_session_score` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `game_id` bigint NOT NULL,
    `user_id` bigint NOT NULL,
    `username` varchar(50) DEFAULT NULL,
    `nickname` varchar(50) DEFAULT NULL,
    `avatar` varchar(255) DEFAULT NULL,
    `score` int NOT NULL,
    `level_reached` int DEFAULT 0,
    `create_time` bigint NOT NULL,
    `deleted` tinyint DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_game_score` (`game_id`, `score` DESC),
    KEY `idx_user_game` (`user_id`, `game_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='单局游戏得分记录';

-- 任务定义
CREATE TABLE IF NOT EXISTS `t_task_definition` (
    `task_id` bigint NOT NULL AUTO_INCREMENT,
    `task_code` varchar(64) NOT NULL,
    `task_name` varchar(100) NOT NULL,
    `task_desc` varchar(500) DEFAULT NULL,
    `task_type` varchar(32) NOT NULL DEFAULT 'DAILY' COMMENT 'DAILY/WEEKLY/ONCE',
    `target_value` int NOT NULL DEFAULT 1,
    `metric` varchar(64) NOT NULL COMMENT 'SIGN_IN/PLAY_GAME/ANSWER_CORRECT等',
    `coins_reward` int NOT NULL DEFAULT 0,
    `exp_reward` int NOT NULL DEFAULT 0,
    `owner_type` varchar(16) NOT NULL DEFAULT 'SYSTEM' COMMENT 'SYSTEM/PARENT/ADMIN',
    `owner_id` bigint DEFAULT NULL COMMENT '家长或管理员ID',
    `kid_id` bigint DEFAULT NULL COMMENT '指定儿童，空为全局',
    `enabled` tinyint NOT NULL DEFAULT 1,
    `sort_order` int DEFAULT 0,
    `create_time` bigint DEFAULT NULL,
    `update_time` bigint DEFAULT NULL,
    `deleted` tinyint DEFAULT 0,
    PRIMARY KEY (`task_id`),
    UNIQUE KEY `uk_task_code_owner` (`task_code`, `owner_type`, `owner_id`, `kid_id`, `deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务定义';

-- 用户任务进度
CREATE TABLE IF NOT EXISTS `t_user_task_progress` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` bigint NOT NULL,
    `task_id` bigint NOT NULL,
    `progress` int NOT NULL DEFAULT 0,
    `status` tinyint NOT NULL DEFAULT 0 COMMENT '0进行中 1可领取 2已领取',
    `period_key` varchar(32) NOT NULL COMMENT '日期或周标识',
    `claimed_time` bigint DEFAULT NULL,
    `update_time` bigint DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_task_period` (`user_id`, `task_id`, `period_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户任务进度';

-- 称号定义
CREATE TABLE IF NOT EXISTS `t_title_definition` (
    `title_id` bigint NOT NULL AUTO_INCREMENT,
    `title_code` varchar(64) NOT NULL,
    `title_name` varchar(100) NOT NULL,
    `requirement_type` varchar(64) NOT NULL COMMENT 'LEVEL/EXP/TASK_COUNT/GAME_SCORE等',
    `requirement_value` int NOT NULL DEFAULT 1,
    `sort_order` int DEFAULT 0,
    `enabled` tinyint NOT NULL DEFAULT 1,
    PRIMARY KEY (`title_id`),
    UNIQUE KEY `uk_title_code` (`title_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='称号定义';

CREATE TABLE IF NOT EXISTS `t_user_title` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` bigint NOT NULL,
    `title_id` bigint NOT NULL,
    `obtained_time` bigint NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_title` (`user_id`, `title_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户已获得称号';

-- 商城商品
CREATE TABLE IF NOT EXISTS `t_shop_product` (
    `product_id` bigint NOT NULL AUTO_INCREMENT,
    `product_code` varchar(64) NOT NULL,
    `product_name` varchar(100) NOT NULL,
    `product_type` varchar(32) NOT NULL COMMENT 'EXCHANGE_STUDY_COIN',
    `price_coins` int NOT NULL DEFAULT 100,
    `grant_study_coins` int NOT NULL DEFAULT 1,
    `enabled` tinyint NOT NULL DEFAULT 1,
    `sort_order` int DEFAULT 0,
    `update_time` bigint DEFAULT NULL,
    PRIMARY KEY (`product_id`),
    UNIQUE KEY `uk_product_code` (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商城商品';

INSERT INTO `t_shop_product` (`product_code`, `product_name`, `product_type`, `price_coins`, `grant_study_coins`, `enabled`, `sort_order`, `update_time`)
SELECT 'gold_to_study_1', '金币兑换游学币', 'EXCHANGE_STUDY_COIN', 100, 1, 1, 1, UNIX_TIMESTAMP()*1000
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM t_shop_product WHERE product_code='gold_to_study_1');

-- 默认任务
INSERT INTO `t_task_definition` (`task_code`, `task_name`, `task_desc`, `task_type`, `target_value`, `metric`, `coins_reward`, `exp_reward`, `owner_type`, `enabled`, `sort_order`, `create_time`, `update_time`)
SELECT 'daily_sign_in', '每日签到', '完成今日签到', 'DAILY', 1, 'SIGN_IN', 20, 5, 'SYSTEM', 1, 1, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM t_task_definition WHERE task_code='daily_sign_in' AND owner_type='SYSTEM');
INSERT INTO `t_task_definition` (`task_code`, `task_name`, `task_desc`, `task_type`, `target_value`, `metric`, `coins_reward`, `exp_reward`, `owner_type`, `enabled`, `sort_order`, `create_time`, `update_time`)
SELECT 'daily_play_3', '每日玩3局', '今日完成3局游戏', 'DAILY', 3, 'PLAY_GAME', 40, 10, 'SYSTEM', 1, 2, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM t_task_definition WHERE task_code='daily_play_3' AND owner_type='SYSTEM');

INSERT INTO `t_title_definition` (`title_code`, `title_name`, `requirement_type`, `requirement_value`, `sort_order`, `enabled`)
SELECT 'lv_3', '进阶玩家', 'LEVEL', 3, 1, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM t_title_definition WHERE title_code='lv_3');
INSERT INTO `t_title_definition` (`title_code`, `title_name`, `requirement_type`, `requirement_value`, `sort_order`, `enabled`)
SELECT 'lv_5', '游戏达人', 'LEVEL', 5, 2, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM t_title_definition WHERE title_code='lv_5');