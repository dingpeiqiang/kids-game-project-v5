-- kidgame.creator_earnings definition

CREATE TABLE `creator_earnings` (
                                    `earnings_id` bigint NOT NULL AUTO_INCREMENT COMMENT '收益记录 ID',
                                    `creator_id` bigint NOT NULL COMMENT '创作者 ID',
                                    `theme_id` bigint NOT NULL COMMENT '主题 ID',
                                    `amount` int NOT NULL COMMENT '金额',
                                    `status` varchar(20) DEFAULT 'pending' COMMENT '状态：pending/withdrawn',
                                    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                    `withdrawn_at` datetime DEFAULT NULL COMMENT '提现时间',
                                    PRIMARY KEY (`earnings_id`),
                                    KEY `idx_creator_id` (`creator_id`),
                                    KEY `idx_theme_id` (`theme_id`),
                                    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='创作者收益表';


-- kidgame.draft definition

CREATE TABLE `draft` (
                         `draft_id` bigint NOT NULL AUTO_INCREMENT COMMENT '草稿ID',
                         `author_id` bigint NOT NULL COMMENT '作者ID',
                         `author_type` varchar(20) NOT NULL DEFAULT 'USER' COMMENT '作者类型：USER-用户, ADMIN-管理员',
                         `content_type` varchar(50) NOT NULL COMMENT '内容类型：THEME-主题, GAME_CONFIG-游戏配置, ARTICLE-文章, USER_CONFIG-用户配置等',
                         `draft_name` varchar(255) NOT NULL COMMENT '草稿名称',
                         `draft_title` varchar(255) DEFAULT NULL COMMENT '草稿标题（可选）',
                         `content_json` text NOT NULL COMMENT '草稿内容JSON',
                         `metadata_json` text COMMENT '元数据JSON，用于存储业务相关的扩展信息',
                         `thumbnail_url` varchar(500) DEFAULT NULL COMMENT '缩略图URL',
                         `related_entity_type` varchar(50) DEFAULT NULL COMMENT '关联实体类型',
                         `related_entity_id` bigint DEFAULT NULL COMMENT '关联实体ID',
                         `status` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '状态：draft-草稿, archived-已归档, published-已发布',
                         `content_size` int DEFAULT '0' COMMENT '内容大小（字节）',
                         `version` int DEFAULT '1' COMMENT '草稿版本号',
                         `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                         `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                         `published_at` datetime DEFAULT NULL COMMENT '发布时间',
                         `tags` varchar(500) DEFAULT NULL COMMENT '标签（逗号分隔）',
                         `remark` text COMMENT '备注说明',
                         PRIMARY KEY (`draft_id`),
                         KEY `idx_author` (`author_id`,`author_type`),
                         KEY `idx_content_type` (`content_type`),
                         KEY `idx_status` (`status`),
                         KEY `idx_updated_at` (`updated_at`),
                         KEY `idx_related` (`related_entity_type`,`related_entity_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='通用草稿表';


-- kidgame.draft_category definition

CREATE TABLE `draft_category` (
                                  `category_id` bigint NOT NULL AUTO_INCREMENT COMMENT '分类ID',
                                  `category_name` varchar(100) NOT NULL COMMENT '分类名称',
                                  `category_code` varchar(50) NOT NULL COMMENT '分类代码',
                                  `content_type` varchar(50) DEFAULT NULL COMMENT '支持的内容类型（空表示支持所有类型）',
                                  `parent_id` bigint DEFAULT NULL COMMENT '父分类ID',
                                  `sort_order` int DEFAULT '0' COMMENT '排序',
                                  `description` varchar(255) DEFAULT NULL COMMENT '分类描述',
                                  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                  PRIMARY KEY (`category_id`),
                                  UNIQUE KEY `category_code` (`category_code`),
                                  KEY `idx_parent` (`parent_id`),
                                  KEY `idx_content_type` (`content_type`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='草稿分类表';


-- kidgame.t_answer_record definition

CREATE TABLE `t_answer_record` (
                                   `record_id` bigint NOT NULL AUTO_INCREMENT COMMENT '记录ID',
                                   `user_id` bigint NOT NULL COMMENT '儿童用户ID',
                                   `question_id` bigint NOT NULL COMMENT '题目ID',
                                   `user_answer` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户答案',
                                   `is_correct` tinyint DEFAULT NULL COMMENT '是否正确：0-错误，1-正确',
                                   `get_points` int DEFAULT '0' COMMENT '获得游学币',
                                   `answer_time` int DEFAULT '0' COMMENT '答题时间（秒）',
                                   `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                   `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                   PRIMARY KEY (`record_id`),
                                   KEY `idx_user_id` (`user_id`),
                                   KEY `idx_question_id` (`question_id`),
                                   KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='答题记录表';


-- kidgame.t_blocked_game definition

CREATE TABLE `t_blocked_game` (
                                  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
                                  `kid_id` bigint NOT NULL COMMENT '儿童用户ID',
                                  `game_id` bigint NOT NULL COMMENT '游戏ID',
                                  `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                  `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                  PRIMARY KEY (`id`),
                                  UNIQUE KEY `uk_kid_game` (`kid_id`,`game_id`,`deleted`),
                                  KEY `idx_kid_id` (`kid_id`),
                                  KEY `idx_game_id` (`game_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='屏蔽游戏表';


-- kidgame.t_daily_stats definition

CREATE TABLE `t_daily_stats` (
                                 `stat_id` bigint NOT NULL AUTO_INCREMENT COMMENT '统计ID',
                                 `stat_date` date NOT NULL COMMENT '统计日期',
                                 `total_users` int DEFAULT '0' COMMENT '总用户数',
                                 `active_users` int DEFAULT '0' COMMENT '活跃用户数',
                                 `new_users` int DEFAULT '0' COMMENT '新增用户数',
                                 `total_game_duration` bigint DEFAULT '0' COMMENT '总游戏时长（秒）',
                                 `total_game_count` int DEFAULT '0' COMMENT '总游戏次数',
                                 `total_answer_count` int DEFAULT '0' COMMENT '总答题数',
                                 `correct_answer_count` int DEFAULT '0' COMMENT '答对数量',
                                 `total_fatigue_points` int DEFAULT '0' COMMENT '发放游学币总数',
                                 `total_consumed_points` int DEFAULT '0' COMMENT '消耗游学币总数',
                                 `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                 `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                                 `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                 PRIMARY KEY (`stat_id`),
                                 UNIQUE KEY `uk_stat_date` (`stat_date`,`deleted`)
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日统计表';


-- kidgame.t_fatigue_points_log definition

CREATE TABLE `t_fatigue_points_log` (
                                        `log_id` bigint NOT NULL AUTO_INCREMENT COMMENT '日志ID',
                                        `user_id` bigint NOT NULL COMMENT '儿童用户ID',
                                        `change_type` tinyint DEFAULT NULL COMMENT '变化类型：1-游戏消耗，2-答题获得，3-每日重置',
                                        `change_points` int DEFAULT NULL COMMENT '变化点数（正数增加，负数减少）',
                                        `current_points` int DEFAULT NULL COMMENT '变化后点数',
                                        `related_id` bigint DEFAULT NULL COMMENT '关联ID（如游戏会话ID、题目ID等）',
                                        `related_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '关联类型：GAME_SESSION-游戏会话，QUESTION-题目',
                                        `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
                                        `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                        `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                        PRIMARY KEY (`log_id`),
                                        KEY `idx_user_id` (`user_id`),
                                        KEY `idx_create_time` (`create_time`),
                                        KEY `idx_change_type` (`change_type`)
) ENGINE=InnoDB AUTO_INCREMENT=973 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游学币日志表';


-- kidgame.t_game definition

CREATE TABLE `t_game` (
                          `game_id` bigint NOT NULL AUTO_INCREMENT COMMENT '游戏ID',
                          `game_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '游戏编码',
                          `game_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '游戏名称',
                          `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '游戏分类：MATH-数学，LANGUAGE-语言，SCIENCE-科学，ART-艺术',
                          `grade` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '适龄阶段',
                          `tags` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '标签列表 (逗号分隔)',
                          `icon_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '游戏图标URL',
                          `cover_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '游戏封面URL',
                          `resource_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '游戏资源CDN地址',
                          `screenshot_urls` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '截图 URLs(JSON 数组)',
                          `game_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '游戏访问地址URL（独立部署时使用）',
                          `game_secret` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '游戏密钥（用于签名验证）',
                          `game_config` json DEFAULT NULL COMMENT '游戏配置（透传给游戏的JSON配置）',
                          `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '游戏描述',
                          `play_guide` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '玩法说明',
                          `module_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '前端模块路径',
                          `status` tinyint DEFAULT '0' COMMENT '状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回',
                          `sort_order` int DEFAULT '0' COMMENT '排序',
                          `is_featured` tinyint DEFAULT '0' COMMENT '是否推荐：0-否，1-是',
                          `consume_points_per_minute` int DEFAULT '1' COMMENT '每分钟消耗游学币',
                          `min_fatigue_to_start` int DEFAULT '0' COMMENT '启动所需最低游学币度',
                          `online_count` int DEFAULT '0' COMMENT '在线人数',
                          `total_play_count` bigint DEFAULT '0' COMMENT '总游戏次数',
                          `total_play_duration` bigint DEFAULT '0' COMMENT '总游戏时长（秒）',
                          `average_rating` decimal(3,2) DEFAULT '0.00' COMMENT '平均评分',
                          `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                          `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                          `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                          `creator_id` bigint DEFAULT NULL COMMENT '创建人 ID',
                          `publish_time` bigint DEFAULT NULL COMMENT '上架时间',
                          PRIMARY KEY (`game_id`),
                          UNIQUE KEY `game_code` (`game_code`),
                          KEY `idx_category` (`category`),
                          KEY `idx_grade` (`grade`),
                          KEY `idx_status` (`status`),
                          KEY `idx_tags` (`tags`),
                          KEY `idx_creator` (`creator_id`),
                          KEY `idx_featured` (`is_featured`)
) ENGINE=InnoDB AUTO_INCREMENT=699 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏信息表';


-- kidgame.t_game_config definition

CREATE TABLE `t_game_config` (
                                 `config_id` bigint NOT NULL AUTO_INCREMENT,
                                 `game_id` bigint NOT NULL,
                                 `config_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                                 `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)),
                                 `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)),
                                 `deleted` tinyint DEFAULT '0',
                                 PRIMARY KEY (`config_id`),
                                 UNIQUE KEY `uk_game_key` (`game_id`,`config_key`,`deleted`),
                                 KEY `idx_game_id` (`game_id`),
                                 KEY `idx_config_key` (`config_key`)
) ENGINE=InnoDB AUTO_INCREMENT=218 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- kidgame.t_game_lock_backup_20260323 definition

CREATE TABLE `t_game_lock_backup_20260323` (
                                               `lock_id` bigint NOT NULL AUTO_INCREMENT COMMENT '锁定ID',
                                               `game_id` bigint DEFAULT NULL COMMENT '游戏ID',
                                               `kid_id` bigint NOT NULL COMMENT '儿童ID',
                                               `reason` varchar(255) DEFAULT NULL COMMENT '锁定原因',
                                               `locked` int DEFAULT '1' COMMENT '是否锁定',
                                               `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
                                               `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
                                               `deleted` int DEFAULT '0' COMMENT '逻辑删除',
                                               PRIMARY KEY (`lock_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='游戏锁定表';


-- kidgame.t_game_mode_config definition

CREATE TABLE `t_game_mode_config` (
                                      `id` bigint NOT NULL AUTO_INCREMENT COMMENT '配置 ID',
                                      `game_id` bigint NOT NULL COMMENT '游戏 ID',
                                      `mode_type` varchar(50) NOT NULL COMMENT '模式类型 (single_player/local_battle/team/online_battle)',
                                      `mode_name` varchar(100) DEFAULT NULL COMMENT '模式名称',
                                      `enabled` tinyint DEFAULT '1' COMMENT '是否启用 (0-禁用，1-启用)',
                                      `config_json` text COMMENT '模式配置 (JSON 格式)',
                                      `sort_order` int DEFAULT '0' COMMENT '排序权重',
                                      `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
                                      `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
                                      `deleted` int DEFAULT '0' COMMENT '逻辑删除',
                                      PRIMARY KEY (`id`),
                                      UNIQUE KEY `uk_game_mode` (`game_id`,`mode_type`),
                                      KEY `idx_game_id` (`game_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='游戏模式配置表';


-- kidgame.t_game_permission definition

CREATE TABLE `t_game_permission` (
                                     `permission_id` bigint NOT NULL AUTO_INCREMENT COMMENT '权限ID',
                                     `user_id` bigint NOT NULL COMMENT '用户ID（儿童）',
                                     `user_type` tinyint NOT NULL DEFAULT '0' COMMENT '用户类型：0-儿童，1-家长，2-管理员',
                                     `game_id` bigint NOT NULL COMMENT '游戏ID',
                                     `resource_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GAME' COMMENT '资源类型：GAME-游戏，MODULE-模块，FEATURE-功能',
                                     `permission_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限类型：ALLOW-允许，BLOCK-屏蔽，LIMIT_TIME-限时，LIMIT_COUNT-限次',
                                     `time_limit_minutes` int DEFAULT NULL COMMENT '时间限制（分钟）',
                                     `count_limit` int DEFAULT NULL COMMENT '次数限制',
                                     `permission_params` json DEFAULT NULL COMMENT '限制参数（JSON）',
                                     `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注说明',
                                     `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                     `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                                     `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                     PRIMARY KEY (`permission_id`),
                                     UNIQUE KEY `uk_user_resource` (`user_id`,`user_type`,`resource_type`,`game_id`,`permission_type`,`deleted`),
                                     KEY `idx_user_id` (`user_id`),
                                     KEY `idx_game_id` (`game_id`),
                                     KEY `idx_permission_type` (`permission_type`),
                                     KEY `idx_user_type` (`user_type`),
                                     KEY `idx_resource_type` (`resource_type`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏权限表';


-- kidgame.t_game_permission_backup_20240308_old definition

CREATE TABLE `t_game_permission_backup_20240308_old` (
                                                         `permission_id` bigint NOT NULL DEFAULT '0' COMMENT '权限ID',
                                                         `user_id` bigint NOT NULL COMMENT '用户ID（儿童）',
                                                         `game_id` bigint NOT NULL COMMENT '游戏ID',
                                                         `permission_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限类型：ALLOW-允许，BLOCK-屏蔽，LIMIT_TIME-限时，LIMIT_COUNT-限次',
                                                         `time_limit_minutes` int DEFAULT NULL COMMENT '时间限制（分钟）',
                                                         `count_limit` int DEFAULT NULL COMMENT '次数限制',
                                                         `permission_params` json DEFAULT NULL COMMENT '限制参数（JSON）',
                                                         `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注说明',
                                                         `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                                         `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                                                         `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- kidgame.t_game_record definition

CREATE TABLE `t_game_record` (
                                 `record_id` bigint NOT NULL AUTO_INCREMENT COMMENT '记录ID',
                                 `user_id` bigint NOT NULL COMMENT '儿童用户ID',
                                 `game_id` bigint NOT NULL COMMENT '游戏ID',
                                 `session_id` bigint DEFAULT NULL COMMENT '会话ID',
                                 `duration` bigint DEFAULT '0' COMMENT '游戏时长（秒）',
                                 `score` int DEFAULT '0' COMMENT '游戏分数',
                                 `consume_points` int DEFAULT '0' COMMENT '消耗游学币',
                                 `play_date` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '游玩日期（YYYY-MM-DD）',
                                 `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                 `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                 PRIMARY KEY (`record_id`),
                                 KEY `idx_user_id` (`user_id`),
                                 KEY `idx_game_id` (`game_id`),
                                 KEY `idx_play_date` (`play_date`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏记录表';


-- kidgame.t_game_comment definition

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


-- kidgame.t_game_resource_config definition

CREATE TABLE `t_game_resource_config` (
                                          `config_id` bigint NOT NULL AUTO_INCREMENT COMMENT '配置 ID',
                                          `game_id` bigint NOT NULL COMMENT '游戏 ID',
                                          `resource_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源类型：image,audio,video,font,config',
                                          `resource_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源键名',
                                          `resource_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源 URL',
                                          `file_size` bigint DEFAULT NULL COMMENT '文件大小 (字节)',
                                          `md5_hash` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'MD5 校验值',
                                          `version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '资源版本',
                                          `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '资源说明',
                                          `status` tinyint DEFAULT '1' COMMENT '状态',
                                          `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
                                          `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
                                          `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除',
                                          PRIMARY KEY (`config_id`),
                                          UNIQUE KEY `uk_game_key` (`game_id`,`resource_key`),
                                          KEY `idx_game_id` (`game_id`),
                                          KEY `idx_resource_type` (`resource_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏资源配置表';


-- kidgame.t_game_review_record definition

CREATE TABLE `t_game_review_record` (
                                        `review_id` bigint NOT NULL AUTO_INCREMENT COMMENT '审核 ID',
                                        `game_id` bigint NOT NULL COMMENT '游戏 ID',
                                        `reviewer_id` bigint NOT NULL COMMENT '审核人 ID',
                                        `review_status` tinyint NOT NULL COMMENT '审核状态：1-通过，2-驳回',
                                        `review_comment` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审核意见',
                                        `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '驳回原因',
                                        `review_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '审核时间',
                                        `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
                                        PRIMARY KEY (`review_id`),
                                        KEY `idx_game_id` (`game_id`),
                                        KEY `idx_reviewer_id` (`reviewer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏审核记录表';


-- kidgame.t_game_session definition

CREATE TABLE `t_game_session` (
                                  `session_id` bigint NOT NULL AUTO_INCREMENT COMMENT '会话ID',
                                  `user_id` bigint NOT NULL COMMENT '儿童用户ID',
                                  `game_id` bigint NOT NULL COMMENT '游戏ID',
                                  `session_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '会话令牌（用于游戏验证）',
                                  `status` tinyint DEFAULT '1' COMMENT '会话状态：0-已结束，1-进行中，2-已暂停',
                                  `start_time` bigint DEFAULT NULL COMMENT '开始时间（毫秒时间戳）',
                                  `end_time` bigint DEFAULT NULL COMMENT '结束时间（毫秒时间戳）',
                                  `duration` bigint DEFAULT '0' COMMENT '游玩时长（秒）',
                                  `score` int DEFAULT '0' COMMENT '获得分数',
                                  `consume_points` int DEFAULT '0' COMMENT '消耗游学币',
                                  `game_data` json DEFAULT NULL COMMENT '游戏数据（JSON）',
                                  `device_info` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '设备信息',
                                  `client_version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '客户端版本',
                                  `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                  `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                                  `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                  PRIMARY KEY (`session_id`),
                                  UNIQUE KEY `session_token` (`session_token`),
                                  KEY `idx_user_id` (`user_id`),
                                  KEY `idx_game_id` (`game_id`),
                                  KEY `idx_status` (`status`),
                                  KEY `idx_start_time` (`start_time`),
                                  KEY `idx_session_token` (`session_token`)
) ENGINE=InnoDB AUTO_INCREMENT=1098 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏会话表';


-- kidgame.t_game_statistics definition

CREATE TABLE `t_game_statistics` (
                                     `stat_id` bigint NOT NULL AUTO_INCREMENT COMMENT '统计 ID',
                                     `game_id` bigint NOT NULL COMMENT '游戏 ID',
                                     `stat_date` date NOT NULL COMMENT '统计日期',
                                     `total_play_count` int DEFAULT '0' COMMENT '总游玩次数',
                                     `unique_players` int DEFAULT '0' COMMENT '独立玩家数',
                                     `total_duration` bigint DEFAULT '0' COMMENT '总时长 (秒)',
                                     `average_duration` int DEFAULT '0' COMMENT '平均时长 (秒)',
                                     `average_score` decimal(10,2) DEFAULT '0.00' COMMENT '平均分数',
                                     `max_score` int DEFAULT '0' COMMENT '最高分',
                                     `min_score` int DEFAULT '0' COMMENT '最低分',
                                     `like_count` int DEFAULT '0' COMMENT '点赞数',
                                     `dislike_count` int DEFAULT '0' COMMENT '踩数',
                                     `favorite_count` int DEFAULT '0' COMMENT '收藏数',
                                     `satisfaction_rate` decimal(5,2) DEFAULT '0.00' COMMENT '满意度 (%)',
                                     `next_day_retention` decimal(5,2) DEFAULT '0.00' COMMENT '次日留存率 (%)',
                                     `week_retention` decimal(5,2) DEFAULT '0.00' COMMENT '周留存率 (%)',
                                     `total_fatigue_consumed` int DEFAULT '0' COMMENT '总消耗游学币度',
                                     `average_fatigue_per_player` int DEFAULT '0' COMMENT '人均消耗游学币度',
                                     `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
                                     `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
                                     `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除',
                                     PRIMARY KEY (`stat_id`),
                                     UNIQUE KEY `uk_game_date` (`game_id`,`stat_date`),
                                     KEY `idx_stat_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏统计表';


-- kidgame.t_game_tag definition

CREATE TABLE `t_game_tag` (
                              `tag_id` bigint NOT NULL AUTO_INCREMENT COMMENT '标签ID',
                              `tag_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标签名称',
                              `tag_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'CATEGORY' COMMENT '标签类型：CATEGORY-分类，FEATURE-特性，RECOMMEND-推荐',
                              `sort_order` int DEFAULT '0' COMMENT '排序',
                              `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                              `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                              `tag_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '标签代码',
                              `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '所属分类',
                              `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '图标 emoji',
                              `status` tinyint DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
                              `update_time` bigint DEFAULT NULL COMMENT '更新时间',
                              PRIMARY KEY (`tag_id`),
                              UNIQUE KEY `uk_tag_name_type` (`tag_name`,`tag_type`,`deleted`),
                              KEY `idx_tag_type` (`tag_type`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏标签表';


-- kidgame.t_game_tag_relation definition

CREATE TABLE `t_game_tag_relation` (
                                       `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
                                       `game_id` bigint NOT NULL COMMENT '游戏ID',
                                       `tag_id` bigint NOT NULL COMMENT '标签ID',
                                       `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                       `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                       PRIMARY KEY (`id`),
                                       UNIQUE KEY `uk_game_tag` (`game_id`,`tag_id`,`deleted`),
                                       KEY `idx_game_id` (`game_id`),
                                       KEY `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏标签关联表';


-- kidgame.t_game_version_history definition

CREATE TABLE `t_game_version_history` (
                                          `version_id` bigint NOT NULL AUTO_INCREMENT COMMENT '版本 ID',
                                          `game_id` bigint NOT NULL COMMENT '游戏 ID',
                                          `version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '版本号',
                                          `version_description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '版本说明',
                                          `change_log` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '变更日志',
                                          `resource_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '资源 URL',
                                          `status` tinyint DEFAULT '1' COMMENT '状态：0-草稿，1-已发布',
                                          `publisher_id` bigint DEFAULT NULL COMMENT '发布人 ID',
                                          `publish_time` bigint DEFAULT NULL COMMENT '发布时间',
                                          `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
                                          `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
                                          `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除',
                                          PRIMARY KEY (`version_id`),
                                          KEY `idx_game_id` (`game_id`),
                                          KEY `idx_version` (`version`),
                                          KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏版本历史表';


-- kidgame.t_leaderboard_config definition

CREATE TABLE `t_leaderboard_config` (
                                        `config_id` bigint NOT NULL AUTO_INCREMENT COMMENT '配置 ID',
                                        `game_id` bigint NOT NULL COMMENT '游戏 ID',
                                        `dimension_code` varchar(50) NOT NULL COMMENT '维度代码：SCORE/HIGHEST_LEVEL/DURATION/ACCURACY 等',
                                        `dimension_name` varchar(100) NOT NULL COMMENT '维度名称：如"最高分"/"最高关卡"/"最长时长"/"正确率"',
                                        `sort_order` varchar(10) NOT NULL DEFAULT 'DESC' COMMENT '排序方式：ASC-升序，DESC-降序',
                                        `data_type` varchar(20) NOT NULL DEFAULT 'INT' COMMENT '数据类型：INT/LONG/DECIMAL',
                                        `icon` varchar(50) DEFAULT NULL COMMENT '维度图标',
                                        `description` varchar(255) DEFAULT NULL COMMENT '维度描述',
                                        `is_enabled` int DEFAULT '1' COMMENT '是否启用：0-否，1-是',
                                        `display_order` int DEFAULT '0' COMMENT '显示顺序',
                                        `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
                                        `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
                                        `deleted` int DEFAULT '0' COMMENT '逻辑删除',
                                        `dimension_type` varchar(20) DEFAULT NULL COMMENT '维度类型：SCORE-分数，TIME-时间，COUNT-次数',
                                        PRIMARY KEY (`config_id`),
                                        UNIQUE KEY `uk_game_dimension` (`game_id`,`dimension_code`),
                                        KEY `idx_game_id` (`game_id`),
                                        KEY `idx_enabled` (`is_enabled`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='游戏排行榜配置表';


-- kidgame.t_leaderboard_data definition

CREATE TABLE `t_leaderboard_data` (
                                      `data_id` bigint NOT NULL AUTO_INCREMENT COMMENT '数据 ID',
                                      `game_id` bigint NOT NULL COMMENT '游戏 ID',
                                      `user_id` bigint NOT NULL COMMENT '用户 ID',
                                      `username` varchar(50) NOT NULL COMMENT '用户名',
                                      `nickname` varchar(100) DEFAULT NULL COMMENT '昵称',
                                      `avatar_url` varchar(255) DEFAULT NULL COMMENT '头像 URL',
                                      `dimension_code` varchar(50) NOT NULL COMMENT '维度代码',
                                      `dimension_value` bigint NOT NULL COMMENT '维度值（统一用 BIGINT 存储，不同类型在应用层转换）',
                                      `decimal_value` decimal(10,2) DEFAULT '0.00' COMMENT '小数值（用于百分比等精度要求高的场景）',
                                      `rank_date` varchar(20) DEFAULT NULL COMMENT '排行日期（YYYY-MM-DD，用于日榜）',
                                      `rank_month` varchar(7) DEFAULT NULL COMMENT '排行月份（YYYY-MM，用于月榜）',
                                      `rank_year` varchar(4) DEFAULT NULL COMMENT '排行年份（YYYY，用于年榜）',
                                      `rank_type` varchar(20) DEFAULT 'ALL' COMMENT '排行类型：ALL-总榜，DAILY-日榜，MONTHLY-月榜，YEARLY-年榜',
                                      `extra_data` json DEFAULT NULL COMMENT '额外数据（用于存储通关时间、使用角色等扩展信息）',
                                      `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
                                      `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
                                      `deleted` int DEFAULT '0' COMMENT '逻辑删除',
                                      PRIMARY KEY (`data_id`),
                                      UNIQUE KEY `uk_game_user_dimension_rank` (`game_id`,`user_id`,`dimension_code`,`rank_type`,`rank_date`,`rank_month`,`rank_year`),
                                      KEY `idx_game_dimension` (`game_id`,`dimension_code`),
                                      KEY `idx_game_dimension_value` (`game_id`,`dimension_code`,`dimension_value`),
                                      KEY `idx_user` (`user_id`),
                                      KEY `idx_rank_type` (`rank_type`),
                                      KEY `idx_rank_date` (`rank_date`),
                                      KEY `idx_rank_month` (`rank_month`),
                                      KEY `idx_rank_year` (`rank_year`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='游戏排行榜数据表';


-- kidgame.t_leaderboard_dimension definition

CREATE TABLE `t_leaderboard_dimension` (
                                           `dimension_id` bigint NOT NULL AUTO_INCREMENT COMMENT '维度 ID',
                                           `game_id` bigint NOT NULL COMMENT '游戏 ID',
                                           `dimension_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '维度代码（如：score, time, length）',
                                           `dimension_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '维度名称（如：最高分数、最长时长）',
                                           `sort_order` int DEFAULT '0' COMMENT '排序权重',
                                           `data_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'INT' COMMENT '数据类型：INT-整数，LONG-长整数，DECIMAL-小数',
                                           `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '图标 emoji',
                                           `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '维度说明',
                                           `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                           `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                                           `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                           PRIMARY KEY (`dimension_id`),
                                           UNIQUE KEY `uk_game_dimension` (`game_id`,`dimension_code`,`deleted`),
                                           KEY `idx_game_id` (`game_id`),
                                           KEY `idx_dimension_code` (`dimension_code`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='排行榜维度表';


-- kidgame.t_notification definition

CREATE TABLE `t_notification` (
                                  `notification_id` bigint NOT NULL AUTO_INCREMENT COMMENT '通知ID',
                                  `user_id` bigint NOT NULL COMMENT '接收者用户ID',
                                  `user_type` tinyint NOT NULL COMMENT '用户类型：0-儿童, 1-家长',
                                  `type` varchar(50) NOT NULL COMMENT '通知类型',
                                  `title` varchar(255) NOT NULL COMMENT '标题',
                                  `content` text COMMENT '内容',
                                  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态：0-待处理, 1-已接受, 2-已拒绝, 3-已过期',
                                  `is_read` tinyint NOT NULL DEFAULT '0' COMMENT '通知状态：0-未读, 1-已读',
                                  `related_id` bigint DEFAULT NULL COMMENT '关联的数据ID',
                                  `sender_id` bigint DEFAULT NULL COMMENT '发送者ID',
                                  `sender_type` tinyint DEFAULT NULL COMMENT '发送者类型：0-儿童, 1-家长',
                                  `extra_data` json DEFAULT NULL COMMENT '扩展数据（JSON格式）',
                                  `create_time` bigint NOT NULL COMMENT '创建时间',
                                  `update_time` bigint NOT NULL DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
                                  `expire_time` bigint DEFAULT NULL COMMENT '过期时间',
                                  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除, 1-已删除',
                                  PRIMARY KEY (`notification_id`),
                                  KEY `idx_user` (`user_id`,`user_type`),
                                  KEY `idx_status` (`status`),
                                  KEY `idx_is_read` (`is_read`),
                                  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='通知消息表';


-- kidgame.t_permission definition

CREATE TABLE `t_permission` (
                                `permission_id` bigint NOT NULL AUTO_INCREMENT COMMENT '权限ID',
                                `permission_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限编码',
                                `permission_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限名称',
                                `permission_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'API' COMMENT '权限类型：MENU-菜单，BUTTON-按钮，API-接口',
                                `parent_id` bigint DEFAULT '0' COMMENT '父权限ID',
                                `path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '路径/URL',
                                `component` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '组件名称',
                                `sort_order` int DEFAULT '0' COMMENT '排序',
                                `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '图标',
                                `status` tinyint DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
                                `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                                `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                PRIMARY KEY (`permission_id`),
                                UNIQUE KEY `permission_code` (`permission_code`),
                                KEY `idx_parent_id` (`parent_id`),
                                KEY `idx_permission_type` (`permission_type`),
                                KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';


-- kidgame.t_question definition

CREATE TABLE `t_question` (
                              `question_id` bigint NOT NULL AUTO_INCREMENT COMMENT '题目ID',
                              `subject_id` bigint DEFAULT NULL COMMENT '学科ID',
                              `content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '题目内容',
                              `options` json DEFAULT NULL COMMENT '选项（JSON数组）',
                              `correct_answer` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '正确答案',
                              `analysis` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '答案解析',
                              `grade` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '适龄阶段',
                              `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'choice' COMMENT '题型：choice-选择，fill-填空，judgment-判断',
                              `difficulty` tinyint DEFAULT '1' COMMENT '难度：1-5',
                              `status` tinyint DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
                              `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                              `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                              `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                              PRIMARY KEY (`question_id`),
                              KEY `idx_subject_id` (`subject_id`),
                              KEY `idx_grade` (`grade`),
                              KEY `idx_type` (`type`),
                              KEY `idx_difficulty` (`difficulty`),
                              KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=862 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目表';


-- kidgame.t_relation_confirmation definition

CREATE TABLE `t_relation_confirmation` (
                                           `confirmation_id` bigint NOT NULL AUTO_INCREMENT COMMENT '确认 ID',
                                           `relation_id` bigint NOT NULL COMMENT '关系 ID',
                                           `confirmation_type` varchar(20) NOT NULL COMMENT '确认类型：BIND-绑定，UNBIND-解绑，TRANSFER-转移',
                                           `confirmor_id` bigint NOT NULL COMMENT '需要确认的用户 ID',
                                           `confirmor_type` tinyint NOT NULL COMMENT '需要确认的用户类型',
                                           `status` tinyint DEFAULT '0' COMMENT '状态：0-待确认，1-已确认，2-已拒绝，3-已过期',
                                           `token` varchar(100) DEFAULT NULL COMMENT '确认令牌',
                                           `expire_time` bigint DEFAULT NULL COMMENT '过期时间',
                                           `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
                                           `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
                                           PRIMARY KEY (`confirmation_id`),
                                           KEY `idx_relation` (`relation_id`),
                                           KEY `idx_confirmor` (`confirmor_id`,`confirmor_type`),
                                           KEY `idx_status` (`status`),
                                           KEY `idx_token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='关系确认表';


-- kidgame.t_role definition

CREATE TABLE `t_role` (
                          `role_id` bigint NOT NULL AUTO_INCREMENT COMMENT '角色ID',
                          `role_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色编码',
                          `role_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称',
                          `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '角色描述',
                          `role_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'CUSTOM' COMMENT '角色类型：SYSTEM-系统，CUSTOM-自定义',
                          `data_scope` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'SELF' COMMENT '数据权限范围：ALL-全部，DEPT-部门，SELF-个人',
                          `status` tinyint DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
                          `sort_order` int DEFAULT '0' COMMENT '排序',
                          `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                          `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                          `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                          PRIMARY KEY (`role_id`),
                          UNIQUE KEY `role_code` (`role_code`),
                          KEY `idx_status` (`status`),
                          KEY `idx_role_type` (`role_type`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';


-- kidgame.t_role_permission definition

CREATE TABLE `t_role_permission` (
                                     `role_permission_id` bigint NOT NULL AUTO_INCREMENT COMMENT '角色权限ID',
                                     `role_id` bigint NOT NULL COMMENT '角色ID',
                                     `permission_id` bigint NOT NULL COMMENT '权限ID',
                                     `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                     `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                     PRIMARY KEY (`role_permission_id`),
                                     UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`,`deleted`),
                                     KEY `idx_role_id` (`role_id`),
                                     KEY `idx_permission_id` (`permission_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';


-- kidgame.t_subject definition

CREATE TABLE `t_subject` (
                             `subject_id` bigint NOT NULL AUTO_INCREMENT COMMENT '学科ID',
                             `subject_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '学科编码',
                             `subject_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '学科名称',
                             `icon_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '学科图标',
                             `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '学科描述',
                             `sort_order` int DEFAULT '0' COMMENT '排序',
                             `status` tinyint DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
                             `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                             `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                             `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                             PRIMARY KEY (`subject_id`),
                             UNIQUE KEY `subject_code` (`subject_code`),
                             KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学科表';


-- kidgame.t_system_config definition

CREATE TABLE `t_system_config` (
                                   `config_id` bigint NOT NULL AUTO_INCREMENT COMMENT '配置ID',
                                   `config_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置键',
                                   `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '配置值',
                                   `config_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'STRING' COMMENT '配置类型：STRING-字符串，INT-整数，JSON-JSON对象',
                                   `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '配置描述',
                                   `config_group` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '配置分组 (fatigue/game/answer/system)',
                                   `status` tinyint DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
                                   `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                   `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                                   `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                   PRIMARY KEY (`config_id`),
                                   UNIQUE KEY `config_key` (`config_key`),
                                   KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';


-- kidgame.t_theme_info definition

CREATE TABLE `t_theme_info` (
                                `theme_id` bigint NOT NULL AUTO_INCREMENT COMMENT '主题 ID',
                                `author_id` bigint NOT NULL COMMENT '作者 ID',
                                `is_official` tinyint(1) DEFAULT '0' COMMENT '是否为官方主题：0-否，1-是',
                                `owner_type` varchar(20) NOT NULL DEFAULT 'APPLICATION' COMMENT '所有者类型：GAME-游戏，APPLICATION-应用',
                                `owner_id` bigint DEFAULT NULL COMMENT '所有者 ID(游戏 ID 或应用 ID)',
                                `theme_name` varchar(100) NOT NULL COMMENT '主题名称',
                                `author_name` varchar(50) DEFAULT NULL COMMENT '作者名称',
                                `price` int DEFAULT '0' COMMENT '价格（游戏币）',
                                `status` varchar(20) DEFAULT 'pending' COMMENT '状态：on_sale/offline/pending',
                                `download_count` int DEFAULT '0' COMMENT '下载次数',
                                `total_revenue` int DEFAULT '0' COMMENT '总收益',
                                `thumbnail_url` varchar(500) DEFAULT NULL COMMENT '缩略图 URL',
                                `description` text COMMENT '描述',
                                `config_json` json NOT NULL COMMENT '主题配置（包含资源/样式）',
                                `is_default` tinyint DEFAULT '0' COMMENT '是否为默认主题：0-否，1-是',
                                `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                PRIMARY KEY (`theme_id`),
                                KEY `idx_author_id` (`author_id`),
                                KEY `idx_status` (`status`),
                                KEY `idx_owner_type` (`owner_type`),
                                KEY `idx_owner_id` (`owner_id`),
                                KEY `idx_is_default` (`is_default`),
                                KEY `idx_is_official` (`is_official`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='主题信息表（独立）';


-- kidgame.t_theme_purchase definition

CREATE TABLE `t_theme_purchase` (
                                    `purchase_id` bigint NOT NULL AUTO_INCREMENT COMMENT '购买记录 ID',
                                    `theme_id` bigint NOT NULL COMMENT '主题 ID',
                                    `buyer_id` bigint NOT NULL COMMENT '购买者 ID',
                                    `price_paid` int NOT NULL COMMENT '支付价格',
                                    `purchase_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '购买时间',
                                    `is_refunded` tinyint DEFAULT '0' COMMENT '是否已退款：0-否，1-是',
                                    PRIMARY KEY (`purchase_id`),
                                    UNIQUE KEY `uk_theme_buyer` (`theme_id`,`buyer_id`),
                                    KEY `idx_theme_id` (`theme_id`),
                                    KEY `idx_buyer_id` (`buyer_id`),
                                    KEY `idx_purchase_time` (`purchase_time`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='主题购买记录表';


-- kidgame.t_user definition

CREATE TABLE `t_user` (
                          `user_id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
                          `user_type` tinyint NOT NULL COMMENT '用户类型：0-儿童，1-家长，2-管理员',
                          `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '登录账号',
                          `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '加密密码',
                          `password_salt` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '密码加密盐值',
                          `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '昵称',
                          `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '头像URL',
                          `status` tinyint DEFAULT '1' COMMENT '状态：0-禁用，1-正常，2-锁定',
                          `fatigue_points` int DEFAULT '10' COMMENT '游学币（所有用户类型通用）',
                          `daily_answer_points` int DEFAULT '0' COMMENT '每日答题获得的游学币',
                          `fatigue_update_time` bigint DEFAULT NULL COMMENT '游学币最后更新时间（毫秒时间戳）',
                          `account_expire_time` bigint DEFAULT NULL COMMENT '账号过期时间（毫秒时间戳）',
                          `password_expire_time` bigint DEFAULT NULL COMMENT '密码过期时间（毫秒时间戳）',
                          `last_login_time` bigint DEFAULT NULL COMMENT '最后登录时间（毫秒时间戳）',
                          `last_login_ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '最后登录IP',
                          `login_failure_count` int DEFAULT '0' COMMENT '登录失败次数',
                          `locked_until` bigint DEFAULT NULL COMMENT '锁定截止时间（毫秒时间戳）',
                          `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                          `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                          `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                          PRIMARY KEY (`user_id`),
                          UNIQUE KEY `uk_username_type` (`username`,`user_type`),
                          KEY `idx_user_type` (`user_type`),
                          KEY `idx_status` (`status`),
                          KEY `idx_fatigue_update_time` (`fatigue_update_time`),
                          KEY `idx_fatigue_points` (`fatigue_points`),
                          KEY `idx_t_user_status_type` (`status`,`user_type`),
                          KEY `idx_t_user_create_time` (`create_time`),
                          KEY `idx_t_user_last_login` (`last_login_time`)
) ENGINE=InnoDB AUTO_INCREMENT=145 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一用户表';


-- kidgame.t_user_achievement definition

CREATE TABLE `t_user_achievement` (
                                      `achievement_id` bigint NOT NULL AUTO_INCREMENT COMMENT '成就 ID',
                                      `user_id` bigint NOT NULL COMMENT '用户 ID',
                                      `achievement_code` varchar(50) NOT NULL COMMENT '成就编码',
                                      `achievement_name` varchar(100) NOT NULL COMMENT '成就名称',
                                      `achievement_type` varchar(20) DEFAULT 'GENERAL' COMMENT '成就类型：GENERAL-一般，STUDY-学习，GAME-游戏，SPECIAL-特殊',
                                      `description` varchar(500) DEFAULT NULL COMMENT '成就描述',
                                      `icon_url` varchar(255) DEFAULT NULL COMMENT '成就图标',
                                      `progress` int DEFAULT '0' COMMENT '进度值',
                                      `target_value` int DEFAULT '1' COMMENT '目标值',
                                      `status` tinyint DEFAULT '0' COMMENT '状态：0-进行中，1-已完成，2-已领取',
                                      `completed_time` bigint DEFAULT NULL COMMENT '完成时间',
                                      `claimed_time` bigint DEFAULT NULL COMMENT '领取时间',
                                      `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
                                      `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
                                      PRIMARY KEY (`achievement_id`),
                                      UNIQUE KEY `uk_user_achievement` (`user_id`,`achievement_code`),
                                      KEY `idx_user_id` (`user_id`),
                                      KEY `idx_status` (`status`),
                                      KEY `idx_type` (`achievement_type`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户成就表';


-- kidgame.t_user_action_log definition

CREATE TABLE `t_user_action_log` (
                                     `log_id` bigint NOT NULL AUTO_INCREMENT COMMENT '日志 ID',
                                     `user_id` bigint NOT NULL COMMENT '用户 ID',
                                     `user_type` tinyint NOT NULL COMMENT '用户类型：0-儿童，1-家长，2-管理员',
                                     `action_type` varchar(50) NOT NULL COMMENT '行为类型：LOGIN/LOGOUT/PLAY_GAME/ANSWER/PURCHASE/等',
                                     `action_desc` varchar(500) DEFAULT NULL COMMENT '行为描述',
                                     `ip_address` varchar(50) DEFAULT NULL COMMENT 'IP 地址',
                                     `device_info` varchar(255) DEFAULT NULL COMMENT '设备信息',
                                     `location` varchar(100) DEFAULT NULL COMMENT '地理位置',
                                     `extra_data` json DEFAULT NULL COMMENT '额外数据（灵活存储）',
                                     `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
                                     PRIMARY KEY (`log_id`),
                                     KEY `idx_user_time` (`user_id`,`create_time`),
                                     KEY `idx_action_type` (`action_type`),
                                     KEY `idx_ip` (`ip_address`),
                                     KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户行为日志表';


-- kidgame.t_user_control_config definition

CREATE TABLE `t_user_control_config` (
                                         `config_id` bigint NOT NULL AUTO_INCREMENT COMMENT '配置ID',
                                         `user_id` bigint NOT NULL COMMENT '儿童用户ID',
                                         `guardian_id` bigint DEFAULT NULL COMMENT '监护人用户 ID',
                                         `daily_time_limit_minutes` int DEFAULT NULL COMMENT '每日总时长限制（分钟）',
                                         `fatigue_point_minutes` int DEFAULT NULL COMMENT '游学币阈值（分钟）',
                                         `rest_duration_minutes` int DEFAULT NULL COMMENT '强制休息时长（分钟）',
                                         `fatigue_control_mode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'SOFT' COMMENT '游学币控制模式：SOFT-软模式，HARD-硬模式，OFF-关闭',
                                         `allowed_start_time` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '允许开始时间 HH:mm:ss',
                                         `allowed_end_time` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '允许结束时间 HH:mm:ss',
                                         `daily_duration` int DEFAULT '60' COMMENT '每日时长上限（分钟，保留字段）',
                                         `single_duration` int DEFAULT '30' COMMENT '单次时长上限（分钟，保留字段）',
                                         `allowed_time_start` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '06:00' COMMENT '允许游戏开始时间（保留字段）',
                                         `allowed_time_end` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '22:00' COMMENT '允许游戏结束时间（保留字段）',
                                         `answer_get_points` int DEFAULT '1' COMMENT '答对1题获得的游学币',
                                         `daily_answer_limit` int DEFAULT '10' COMMENT '每日答题赚点上限',
                                         `fatigue_point_threshold` int DEFAULT '60' COMMENT '游学币阈值（分钟）',
                                         `rest_duration` int DEFAULT '15' COMMENT '强制休息时长（分钟）',
                                         `blocked_games` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '屏蔽的游戏ID列表（JSON数组）',
                                         `game_category_whitelist` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '游戏类型白名单（JSON 数组）',
                                         `difficulty_limit` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'ALL' COMMENT '难度限制：ALL/EASY/MEDIUM/HARD',
                                         `spending_limit` int DEFAULT '0' COMMENT '消费限额（游戏币/天）',
                                         `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注说明',
                                         `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                         `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                                         `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                         `continuous_play_reminder` int DEFAULT NULL COMMENT '连续游戏提醒间隔（分钟）',
                                         `daily_game_limit` int DEFAULT NULL COMMENT '每日游戏次数限制',
                                         `game_interval` int DEFAULT NULL COMMENT '单次游戏最小间隔（分钟）',
                                         PRIMARY KEY (`config_id`),
                                         UNIQUE KEY `uk_user_guardian` (`user_id`,`guardian_id`,`deleted`),
                                         KEY `idx_user_id` (`user_id`),
                                         KEY `idx_guardian_id` (`guardian_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户管控配置表';


-- kidgame.t_user_level definition

CREATE TABLE `t_user_level` (
                                `level_id` bigint NOT NULL AUTO_INCREMENT COMMENT '等级记录 ID',
                                `user_id` bigint NOT NULL COMMENT '用户 ID',
                                `current_level` int DEFAULT '1' COMMENT '当前等级',
                                `current_exp` int DEFAULT '0' COMMENT '当前经验值',
                                `next_level_exp` int DEFAULT '100' COMMENT '下一级所需经验值',
                                `total_exp` int DEFAULT '0' COMMENT '总经验值',
                                `level_title` varchar(50) DEFAULT NULL COMMENT '等级称号',
                                `last_level_up_time` bigint DEFAULT NULL COMMENT '上次升级时间',
                                `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
                                `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
                                PRIMARY KEY (`level_id`),
                                UNIQUE KEY `uk_user` (`user_id`),
                                KEY `idx_user_id` (`user_id`),
                                KEY `idx_level` (`current_level`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户等级表';


-- kidgame.t_user_profile definition

CREATE TABLE `t_user_profile` (
                                  `profile_id` bigint NOT NULL AUTO_INCREMENT COMMENT '扩展ID',
                                  `user_id` bigint NOT NULL COMMENT '用户ID',
                                  `profile_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '扩展类型：KID_INFO-儿童信息，PARENT_INFO-家长信息',
                                  `ext_info_json` json DEFAULT NULL COMMENT '扩展信息（JSON）',
                                  `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                  `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                                  `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                  PRIMARY KEY (`profile_id`),
                                  UNIQUE KEY `uk_user_type` (`user_id`,`profile_type`),
                                  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户扩展信息表';


-- kidgame.t_user_relation definition

CREATE TABLE `t_user_relation` (
                                   `relation_id` bigint NOT NULL AUTO_INCREMENT COMMENT '关系ID',
                                   `relation_type` tinyint NOT NULL COMMENT '关系类型：1-家长儿童，2-管理员儿童，3-兄弟姐妹',
                                   `user_a` bigint NOT NULL COMMENT '用户A（家长/管理员）',
                                   `user_b` bigint NOT NULL COMMENT '用户B（儿童）',
                                   `role_type` tinyint NOT NULL COMMENT '角色：1-父亲，2-母亲，3-监护人，4-辅导员',
                                   `is_primary` tinyint DEFAULT '0' COMMENT '是否主要监护人：0-否，1-是',
                                   `permission_level` tinyint DEFAULT '3' COMMENT '权限级别：1-仅查看，2-部分控制，3-完全控制',
                                   `status` tinyint DEFAULT '1' COMMENT '关系状态：0-待确认，1-已建立，2-已取消',
                                   `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注说明',
                                   `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                                   `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
                                   `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                                   PRIMARY KEY (`relation_id`),
                                   UNIQUE KEY `uk_user_a_b` (`user_a`,`user_b`,`relation_type`,`deleted`),
                                   KEY `idx_user_a` (`user_a`),
                                   KEY `idx_user_b` (`user_b`),
                                   KEY `idx_relation_type` (`relation_type`),
                                   KEY `idx_status` (`status`),
                                   KEY `idx_t_user_relation_ab` (`user_a`,`user_b`),
                                   KEY `idx_t_user_relation_ba` (`user_b`,`user_a`),
                                   KEY `idx_t_user_relation_status` (`status`,`relation_type`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户关系表';


-- kidgame.t_user_request definition

CREATE TABLE `t_user_request` (
                                  `request_id` bigint NOT NULL AUTO_INCREMENT COMMENT '申请 ID',
                                  `requester_id` bigint NOT NULL COMMENT '申请人用户 ID',
                                  `requester_type` tinyint NOT NULL COMMENT '申请人类型：0-儿童，1-家长',
                                  `approver_id` bigint DEFAULT NULL COMMENT '审批人用户 ID（家长或管理员）',
                                  `approver_type` tinyint DEFAULT NULL COMMENT '审批人类型：0-儿童，1-家长，2-管理员',
                                  `request_type` varchar(50) NOT NULL COMMENT '申请类型：EXTEND_TIME-延长时长，UNLOCK_GAME-解锁游戏，PURCHASE_THEME-购买主题',
                                  `request_params` json DEFAULT NULL COMMENT '申请参数（JSON）',
                                  `status` tinyint DEFAULT '0' COMMENT '状态：0-待审批，1-已通过，2-已拒绝，3-已取消',
                                  `reason` varchar(500) DEFAULT NULL COMMENT '申请理由',
                                  `approval_opinion` varchar(500) DEFAULT NULL COMMENT '审批意见',
                                  `approval_time` bigint DEFAULT NULL COMMENT '审批时间',
                                  `expire_time` bigint DEFAULT NULL COMMENT '过期时间',
                                  `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
                                  `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
                                  PRIMARY KEY (`request_id`),
                                  KEY `idx_requester` (`requester_id`,`requester_type`),
                                  KEY `idx_approver` (`approver_id`,`approver_type`),
                                  KEY `idx_status` (`status`),
                                  KEY `idx_type` (`request_type`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户申请记录表';


-- kidgame.t_user_role definition

CREATE TABLE `t_user_role` (
                               `user_role_id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户角色ID',
                               `user_id` bigint NOT NULL COMMENT '用户ID',
                               `role_id` bigint NOT NULL COMMENT '角色ID',
                               `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
                               `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
                               PRIMARY KEY (`user_role_id`),
                               UNIQUE KEY `uk_user_role` (`user_id`,`role_id`,`deleted`),
                               KEY `idx_user_id` (`user_id`),
                               KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';


-- kidgame.t_user_theme_preference definition

CREATE TABLE `t_user_theme_preference` (
                                           `preference_id` bigint NOT NULL AUTO_INCREMENT COMMENT '偏好 ID',
                                           `user_id` bigint NOT NULL COMMENT '用户 ID',
                                           `owner_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '所有者类型：GAME-游戏，APPLICATION-应用',
                                           `owner_id` bigint NOT NULL COMMENT '所有者 ID（游戏 ID 或应用 ID）',
                                           `theme_id` bigint NOT NULL COMMENT '主题 ID',
                                           `is_active` tinyint DEFAULT '1' COMMENT '是否启用：0-否，1-是',
                                           `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                           `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                           PRIMARY KEY (`preference_id`),
                                           UNIQUE KEY `uk_user_owner` (`user_id`,`owner_type`,`owner_id`) COMMENT '每个用户对每个游戏/应用只有一个当前主题',
                                           KEY `idx_user_id` (`user_id`) COMMENT '用户 ID 索引',
                                           KEY `idx_theme_id` (`theme_id`) COMMENT '主题 ID 索引',
                                           KEY `idx_owner_type_owner_id` (`owner_type`,`owner_id`) COMMENT '所有者类型和 ID 索引'
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户主题偏好表';


-- kidgame.draft_category_relation definition

CREATE TABLE `draft_category_relation` (
                                           `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
                                           `draft_id` bigint NOT NULL COMMENT '草稿ID',
                                           `category_id` bigint NOT NULL COMMENT '分类ID',
                                           `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                           PRIMARY KEY (`id`),
                                           UNIQUE KEY `uk_draft_category` (`draft_id`,`category_id`),
                                           KEY `idx_draft_id` (`draft_id`),
                                           KEY `idx_category_id` (`category_id`),
                                           CONSTRAINT `draft_category_relation_ibfk_1` FOREIGN KEY (`draft_id`) REFERENCES `draft` (`draft_id`) ON DELETE CASCADE,
                                           CONSTRAINT `draft_category_relation_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `draft_category` (`category_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='草稿分类关联表';


-- kidgame.draft_version definition

CREATE TABLE `draft_version` (
                                 `version_id` bigint NOT NULL AUTO_INCREMENT COMMENT '版本ID',
                                 `draft_id` bigint NOT NULL COMMENT '草稿ID',
                                 `version` int NOT NULL COMMENT '版本号',
                                 `content_json` text NOT NULL COMMENT '快照内容JSON',
                                 `metadata_json` text COMMENT '快照元数据JSON',
                                 `change_log` varchar(255) DEFAULT NULL COMMENT '变更说明',
                                 `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                 `created_by` bigint DEFAULT NULL COMMENT '创建人ID',
                                 PRIMARY KEY (`version_id`),
                                 UNIQUE KEY `uk_draft_version` (`draft_id`,`version`),
                                 KEY `idx_draft_id` (`draft_id`),
                                 KEY `idx_created_at` (`created_at`),
                                 CONSTRAINT `draft_version_ibfk_1` FOREIGN KEY (`draft_id`) REFERENCES `draft` (`draft_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='草稿版本历史表';


-- kidgame.t_theme_assets definition

CREATE TABLE `t_theme_assets` (
                                  `asset_id` bigint NOT NULL AUTO_INCREMENT COMMENT '资产 ID',
                                  `theme_id` bigint NOT NULL COMMENT '主题 ID',
                                  `asset_key` varchar(100) NOT NULL COMMENT '资源键（如：bg_main）',
                                  `asset_type` varchar(20) NOT NULL COMMENT '资源类型：image/audio/font/other',
                                  `file_path` varchar(500) NOT NULL COMMENT '文件路径',
                                  `file_size` int DEFAULT '0' COMMENT '文件大小（字节）',
                                  `file_hash` varchar(64) DEFAULT NULL COMMENT '文件哈希（用于去重）',
                                  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                  PRIMARY KEY (`asset_id`),
                                  KEY `idx_theme_id` (`theme_id`),
                                  KEY `idx_asset_key` (`asset_key`),
                                  CONSTRAINT `fk_theme_assets_theme` FOREIGN KEY (`theme_id`) REFERENCES `t_theme_info` (`theme_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='主题资源文件表';