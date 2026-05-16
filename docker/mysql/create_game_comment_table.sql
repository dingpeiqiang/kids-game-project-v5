-- ========================================
-- 创建游戏评论表 t_game_comment
-- 使用方法：在 MySQL 客户端中执行此脚本
-- ========================================

USE kids_game;

-- 如果表已存在则先删除
DROP TABLE IF EXISTS t_game_comment;

-- 创建游戏评论表
CREATE TABLE `t_game_comment` (
    `comment_id` bigint NOT NULL AUTO_INCREMENT COMMENT '评论 ID',
    `user_id` bigint NOT NULL COMMENT '儿童用户 ID',
    `game_id` bigint NOT NULL COMMENT '游戏 ID',
    `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '评论内容',
    `score` int NOT NULL COMMENT '评分（1-5）',
    `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (`comment_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_game_id` (`game_id`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏评论表';

-- 验证表是否创建成功
SELECT 'Table t_game_comment created successfully!' AS status;
SHOW TABLES LIKE 't_game_comment';
DESCRIBE t_game_comment;
