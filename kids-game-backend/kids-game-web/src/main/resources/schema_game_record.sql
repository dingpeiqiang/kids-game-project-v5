-- kidgame.user_game_record definition

CREATE TABLE `user_game_record` (
                                    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '记录ID',
                                    `user_id` bigint NOT NULL COMMENT '用户ID',
                                    `game_id` int NOT NULL COMMENT '游戏ID',
                                    `score` int NOT NULL COMMENT '得分',
                                    `is_new_best` tinyint(1) DEFAULT '0' COMMENT '是否新纪录',
                                    `played_at` datetime NOT NULL COMMENT '游玩时间',
                                    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                    PRIMARY KEY (`id`),
                                    KEY `idx_user_id` (`user_id`),
                                    KEY `idx_game_id` (`game_id`),
                                    KEY `idx_played_at` (`played_at`),
                                    KEY `idx_user_game` (`user_id`,`game_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户游戏记录表';
