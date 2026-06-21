-- ================================================
-- 考试与试题系统重设计 v3
-- 对标粉笔/作业帮：题型扩展、知识点体系、错题本、收藏、每日练习会话、班级、教师布置任务
-- 生成时间：2026-06-20
-- 说明：本脚本为增量迁移脚本，基于 schema_v2 已存在的 t_question/t_answer_record/t_subject 表进行扩展
-- ================================================

-- ================================================
-- 一、扩展 t_question 表
-- ================================================

-- 1.1 新增字段：知识点、标签、媒体附件、分值、限时、作答模式、填空配置
ALTER TABLE `t_question`
    ADD COLUMN `knowledge_points` json DEFAULT NULL COMMENT '知识点ID数组（JSON）' AFTER `subject_id`,
    ADD COLUMN `tags` json DEFAULT NULL COMMENT '标签数组（JSON）' AFTER `knowledge_points`,
    ADD COLUMN `media_urls` json DEFAULT NULL COMMENT '媒体附件（图片/音频/视频，JSON数组）' AFTER `tags`,
    ADD COLUMN `score` int DEFAULT '1' COMMENT '分值' AFTER `difficulty`,
    ADD COLUMN `time_limit` int DEFAULT '0' COMMENT '建议答题限时（秒），0表示不限' AFTER `score`,
    ADD COLUMN `answer_mode` varchar(20) DEFAULT 'single' COMMENT '作答模式：single-单选，multiple-多选，text-文本作答' AFTER `time_limit`,
    ADD COLUMN `fill_config` json DEFAULT NULL COMMENT '填空题配置（JSON：多空、关键词、容错模式）' AFTER `answer_mode`,
    ADD COLUMN `short_answer_keywords` json DEFAULT NULL COMMENT '简答题关键词（JSON数组，用于人工阅卷辅助）' AFTER `fill_config`;

-- 1.2 扩展 type 字段注释（不改类型，仅语义扩展）：single/multiple/judge/fill/short_answer/image/audio
ALTER TABLE `t_question`
    MODIFY COLUMN `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'single' COMMENT '题型：single-单选，multiple-多选，judge-判断，fill-填空，short_answer-简答，image-图片题，audio-音频题';

-- 1.3 扩展 content 字段为支持富文本（JSON 结构），保留原纯文本兼容
ALTER TABLE `t_question`
    MODIFY COLUMN `content` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '题目内容（纯文本或富文本JSON）';

-- 1.4 新增索引
ALTER TABLE `t_question`
    ADD KEY `idx_subject_grade` (`subject_id`, `grade`);


-- ================================================
-- 二、扩展 t_answer_record 表
-- ================================================

-- 2.1 新增字段：会话ID、知识点、标记、收藏、错题标记
ALTER TABLE `t_answer_record`
    ADD COLUMN `session_id` bigint DEFAULT NULL COMMENT '每日练习会话ID（t_daily_session.session_id）' AFTER `question_id`,
    ADD COLUMN `subject_id` bigint DEFAULT NULL COMMENT '学科ID（冗余便于统计）' AFTER `session_id`,
    ADD COLUMN `knowledge_point_ids` json DEFAULT NULL COMMENT '本题知识点ID数组（冗余便于统计）' AFTER `subject_id`,
    ADD COLUMN `question_type` varchar(20) DEFAULT NULL COMMENT '题型（冗余）' AFTER `knowledge_point_ids`,
    ADD COLUMN `difficulty` tinyint DEFAULT NULL COMMENT '难度（冗余）' AFTER `question_type`,
    ADD COLUMN `is_marked` tinyint DEFAULT '0' COMMENT '是否标记：0-否，1-是' AFTER `is_correct`,
    ADD COLUMN `is_collected` tinyint DEFAULT '0' COMMENT '是否收藏：0-否，1-是' AFTER `is_marked`,
    ADD COLUMN `is_wrong` tinyint DEFAULT '0' COMMENT '是否错题：0-否，1-是（错题本来源）' AFTER `is_collected`;

-- 2.2 新增索引
ALTER TABLE `t_answer_record`
    ADD KEY `idx_session_id` (`session_id`),
    ADD KEY `idx_user_wrong` (`user_id`, `is_wrong`),
    ADD KEY `idx_user_correct` (`user_id`, `is_correct`),
    ADD KEY `idx_user_create` (`user_id`, `create_time`);


-- ================================================
-- 三、知识点体系
-- ================================================

-- 3.1 知识点表（树形结构，支持章节/知识点两级）
CREATE TABLE IF NOT EXISTS `t_knowledge_point` (
    `knowledge_point_id` bigint NOT NULL AUTO_INCREMENT COMMENT '知识点ID',
    `subject_id` bigint NOT NULL COMMENT '学科ID',
    `parent_id` bigint DEFAULT NULL COMMENT '父知识点ID（NULL为根节点）',
    `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '知识点编码（同学科内唯一）',
    `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '知识点名称',
    `chapter` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '所属章节',
    `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '知识点描述',
    `sort_order` int DEFAULT '0' COMMENT '排序',
    `status` tinyint DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
    `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
    `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (`knowledge_point_id`),
    UNIQUE KEY `uk_subject_code` (`subject_id`, `code`, `deleted`),
    KEY `idx_subject_id` (`subject_id`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识点表';


-- ================================================
-- 四、错题本
-- ================================================

CREATE TABLE IF NOT EXISTS `t_wrong_question` (
    `wrong_id` bigint NOT NULL AUTO_INCREMENT COMMENT '错题记录ID',
    `user_id` bigint NOT NULL COMMENT '儿童用户ID',
    `question_id` bigint NOT NULL COMMENT '题目ID',
    `subject_id` bigint DEFAULT NULL COMMENT '学科ID（冗余）',
    `knowledge_point_ids` json DEFAULT NULL COMMENT '知识点ID数组（冗余）',
    `wrong_count` int DEFAULT '1' COMMENT '错误次数',
    `last_wrong_time` bigint DEFAULT NULL COMMENT '最近答错时间',
    `last_wrong_answer` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '最近错误答案',
    `mastery_level` tinyint DEFAULT '0' COMMENT '掌握度：0-未掌握，1-了解，2-熟悉，3-掌握',
    `review_count` int DEFAULT '0' COMMENT '复习次数',
    `last_review_time` bigint DEFAULT NULL COMMENT '最近复习时间',
    `next_review_time` bigint DEFAULT NULL COMMENT '下次推荐复习时间',
    `status` tinyint DEFAULT '1' COMMENT '状态：0-已掌握移除，1-待复习，2-复习中',
    `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (`wrong_id`),
    UNIQUE KEY `uk_user_question` (`user_id`, `question_id`, `deleted`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_question_id` (`question_id`),
    KEY `idx_subject_id` (`subject_id`),
    KEY `idx_status` (`status`),
    KEY `idx_next_review` (`user_id`, `next_review_time`),
    KEY `idx_mastery` (`user_id`, `mastery_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='错题本';


-- ================================================
-- 五、收藏
-- ================================================

CREATE TABLE IF NOT EXISTS `t_collection` (
    `collection_id` bigint NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `question_id` bigint NOT NULL COMMENT '题目ID',
    `note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '收藏笔记',
    `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (`collection_id`),
    UNIQUE KEY `uk_user_question` (`user_id`, `question_id`, `deleted`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目收藏表';


-- ================================================
-- 六、每日练习会话
-- ================================================

CREATE TABLE IF NOT EXISTS `t_daily_session` (
    `session_id` bigint NOT NULL AUTO_INCREMENT COMMENT '会话ID',
    `user_id` bigint NOT NULL COMMENT '儿童用户ID',
    `session_date` date NOT NULL COMMENT '会话日期',
    `subject_id` bigint DEFAULT NULL COMMENT '学科ID（NULL为综合）',
    `knowledge_point_ids` json DEFAULT NULL COMMENT '本次练习知识点范围',
    `difficulty_range` varchar(20) DEFAULT 'ALL' COMMENT '难度范围：ALL/EASY/MEDIUM/HARD',
    `total_count` int DEFAULT '0' COMMENT '本次题目总数',
    `answered_count` int DEFAULT '0' COMMENT '已答题数',
    `correct_count` int DEFAULT '0' COMMENT '答对题数',
    `points_earned` int DEFAULT '0' COMMENT '本次获得游学币',
    `duration` int DEFAULT '0' COMMENT '本次用时（秒）',
    `source` varchar(20) DEFAULT 'DAILY' COMMENT '来源：DAILY-每日练习，RECOMMEND-推荐练习，WRONG_REVIEW-错题复习，ASSIGNMENT-教师任务',
    `source_id` bigint DEFAULT NULL COMMENT '来源ID（如任务ID）',
    `status` tinyint DEFAULT '0' COMMENT '状态：0-进行中，1-已完成，2-已放弃',
    `start_time` bigint DEFAULT NULL COMMENT '开始时间',
    `end_time` bigint DEFAULT NULL COMMENT '结束时间',
    `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (`session_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_user_date` (`user_id`, `session_date`),
    KEY `idx_status` (`status`),
    KEY `idx_source` (`source`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日练习会话表';


-- ================================================
-- 七、班级与班级成员
-- ================================================

CREATE TABLE IF NOT EXISTS `t_class` (
    `class_id` bigint NOT NULL AUTO_INCREMENT COMMENT '班级ID',
    `class_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '班级名称',
    `grade` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '年级',
    `school_year` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '学年（如 2025-2026）',
    `creator_id` bigint NOT NULL COMMENT '创建者ID（教师）',
    `invite_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邀请码',
    `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '班级描述',
    `status` tinyint DEFAULT '1' COMMENT '状态：0-已解散，1-正常',
    `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (`class_id`),
    KEY `idx_creator_id` (`creator_id`),
    KEY `idx_grade` (`grade`),
    KEY `idx_invite_code` (`invite_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级表';

CREATE TABLE IF NOT EXISTS `t_class_member` (
    `member_id` bigint NOT NULL AUTO_INCREMENT COMMENT '成员ID',
    `class_id` bigint NOT NULL COMMENT '班级ID',
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `role` varchar(20) NOT NULL DEFAULT 'STUDENT' COMMENT '角色：TEACHER-教师，STUDENT-学生',
    `join_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '加入时间',
    `status` tinyint DEFAULT '1' COMMENT '状态：0-已退出，1-正常',
    `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (`member_id`),
    UNIQUE KEY `uk_class_user` (`class_id`, `user_id`, `deleted`),
    KEY `idx_class_id` (`class_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级成员表';


-- ================================================
-- 八、教师布置练习任务
-- ================================================

CREATE TABLE IF NOT EXISTS `t_practice_assignment` (
    `assignment_id` bigint NOT NULL AUTO_INCREMENT COMMENT '任务ID',
    `teacher_id` bigint NOT NULL COMMENT '教师ID',
    `class_id` bigint NOT NULL COMMENT '班级ID',
    `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务标题',
    `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '任务说明',
    `subject_id` bigint DEFAULT NULL COMMENT '学科ID',
    `knowledge_point_ids` json DEFAULT NULL COMMENT '知识点范围',
    `difficulty_range` varchar(20) DEFAULT 'ALL' COMMENT '难度范围',
    `question_count` int DEFAULT '10' COMMENT '题目数量',
    `question_type` varchar(20) DEFAULT NULL COMMENT '指定题型（NULL为混合）',
    `due_time` bigint DEFAULT NULL COMMENT '截止时间',
    `points_reward` int DEFAULT '0' COMMENT '完成奖励游学币',
    `status` tinyint DEFAULT '1' COMMENT '状态：0-草稿，1-已发布，2-已截止，3-已删除',
    `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (`assignment_id`),
    KEY `idx_teacher_id` (`teacher_id`),
    KEY `idx_class_id` (`class_id`),
    KEY `idx_status` (`status`),
    KEY `idx_due_time` (`due_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师练习任务表';

-- 任务-学生完成情况
CREATE TABLE IF NOT EXISTS `t_assignment_completion` (
    `completion_id` bigint NOT NULL AUTO_INCREMENT COMMENT '完成记录ID',
    `assignment_id` bigint NOT NULL COMMENT '任务ID',
    `student_id` bigint NOT NULL COMMENT '学生ID',
    `session_id` bigint DEFAULT NULL COMMENT '关联的练习会话ID',
    `total_count` int DEFAULT '0' COMMENT '任务题目数',
    `answered_count` int DEFAULT '0' COMMENT '已答题数',
    `correct_count` int DEFAULT '0' COMMENT '答对题数',
    `points_earned` int DEFAULT '0' COMMENT '获得游学币',
    `duration` int DEFAULT '0' COMMENT '用时（秒）',
    `finish_status` tinyint DEFAULT '0' COMMENT '完成状态：0-未开始，1-进行中，2-已完成',
    `finish_time` bigint DEFAULT NULL COMMENT '完成时间',
    `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    `update_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (`completion_id`),
    UNIQUE KEY `uk_assignment_student` (`assignment_id`, `student_id`, `deleted`),
    KEY `idx_assignment_id` (`assignment_id`),
    KEY `idx_student_id` (`student_id`),
    KEY `idx_finish_status` (`finish_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务完成情况表';


-- ================================================
-- 九、数据兼容处理
-- ================================================

-- 9.1 将历史 t_question.type='choice' 迁移为 'single'（保留 choice 兼容，新数据用 single）
-- 注：不强制迁移，判分器同时兼容 choice/single
-- UPDATE t_question SET type='single' WHERE type='choice';

-- 9.2 历史答题记录补全 is_wrong 字段
UPDATE `t_answer_record` SET `is_wrong` = 1 WHERE `is_correct` = 0 AND `is_wrong` = 0;

-- 9.3 历史答对记录 is_wrong = 0（默认值已正确，无需更新）


-- ================================================
-- 十、初始化默认学科知识点（可选，按需启用）
-- ================================================
-- 示例：数学学科根知识点
-- INSERT INTO t_knowledge_point (subject_id, parent_id, code, name, chapter, sort_order, status)
-- SELECT s.subject_id, NULL, 'ROOT', '全部知识点', NULL, 0, 1
-- FROM t_subject s WHERE s.subject_code = 'MATH' AND s.deleted = 0
-- ON DUPLICATE KEY UPDATE update_time = update_time;
