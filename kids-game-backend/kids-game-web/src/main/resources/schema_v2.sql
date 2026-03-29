-- ================================================
-- 儿童游戏平台 - 数据库设计 DDL v2.1
-- 设计原则：可扩展、高性能、易维护
-- 参考：Spring Security, RBAC, Shopify, Slack
-- 版本：2.1.0
-- 更新时间：2026-03-23
-- ================================================

-- ================================================
-- 用户体系
-- ================================================

-- 统一用户表
DROP TABLE IF EXISTS t_user;
CREATE TABLE t_user (
                        user_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户 ID',
                        user_type TINYINT NOT NULL COMMENT '用户类型：0-儿童，1-家长，2-管理员',
                        username VARCHAR(50) NOT NULL COMMENT '登录账号',
                        password VARCHAR(255) NOT NULL COMMENT '加密密码',
                        nickname VARCHAR(50) NOT NULL COMMENT '昵称',
                        avatar VARCHAR(255) COMMENT '头像 URL',
                        status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常，2-锁定',
                        fatigue_points INT DEFAULT 0 COMMENT '疲劳点数（所有用户类型通用）',
                        daily_answer_points INT DEFAULT 0 COMMENT '每日答题获得的疲劳点数',
                        fatigue_update_time BIGINT COMMENT '疲劳点最后更新时间（毫秒时间戳）',
                        account_expire_time BIGINT COMMENT '账号过期时间',
                        password_expire_time BIGINT COMMENT '密码过期时间',
                        last_login_time BIGINT COMMENT '最后登录时间',
                        last_login_ip VARCHAR(50) COMMENT '最后登录 IP',
                        create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                        update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                        deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                        UNIQUE KEY uk_username_type (username, user_type),
                        INDEX idx_user_type (user_type),
                        INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='统一用户表';

-- 用户扩展信息表
DROP TABLE IF EXISTS t_user_profile;
CREATE TABLE t_user_profile (
                                profile_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '扩展 ID',
                                user_id BIGINT NOT NULL COMMENT '用户 ID',
                                profile_type VARCHAR(20) NOT NULL COMMENT '扩展类型：KID_INFO-儿童信息，PARENT_INFO-家长信息',
                                ext_info_json JSON COMMENT '扩展信息（JSON）',
                                create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                                update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                                deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                                UNIQUE KEY uk_user_type (user_id, profile_type),
                                INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户扩展信息表';

-- 用户关系表（支持多监护人）
DROP TABLE IF EXISTS t_user_relation;
CREATE TABLE t_user_relation (
                                 relation_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '关系 ID',
                                 relation_type TINYINT NOT NULL COMMENT '关系类型：1-家长儿童，2-管理员儿童，3-兄弟姐妹',
                                 user_a BIGINT NOT NULL COMMENT '用户 A（家长/管理员）',
                                 user_b BIGINT NOT NULL COMMENT '用户 B（儿童）',
                                 role_type TINYINT NOT NULL COMMENT '角色：1-父亲，2-母亲，3-监护人，4-辅导者',
                                 is_primary TINYINT DEFAULT 0 COMMENT '是否主要监护人：0-否，1-是',
                                 permission_level TINYINT DEFAULT 3 COMMENT '权限级别：1-仅查看，2-部分控制，3-完全控制',
                                 status TINYINT DEFAULT 1 COMMENT '关系状态：0-待确认，1-已建立，2-已取消',
                                 remark VARCHAR(255) COMMENT '备注说明',
                                 create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                                 update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                                 deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                                 UNIQUE KEY uk_user_a_b (user_a, user_b, relation_type, deleted),
                                 INDEX idx_user_a (user_a),
                                 INDEX idx_user_b (user_b),
                                 INDEX idx_relation_type (relation_type),
                                 INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户关系表';

-- ================================================
-- RBAC 权限模型
-- ================================================

-- 角色表
DROP TABLE IF EXISTS t_role;
CREATE TABLE t_role (
                        role_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '角色 ID',
                        role_code VARCHAR(50) UNIQUE NOT NULL COMMENT '角色编码',
                        role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
                        description VARCHAR(255) COMMENT '角色描述',
                        role_type VARCHAR(20) DEFAULT 'CUSTOM' COMMENT '角色类型：SYSTEM-系统，CUSTOM-自定义',
                        data_scope VARCHAR(20) DEFAULT 'SELF' COMMENT '数据权限范围：ALL-全部，DEPT-部门，SELF-个人',
                        status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
                        sort_order INT DEFAULT 0 COMMENT '排序',
                        create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                        update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                        deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                        INDEX idx_status (status),
                        INDEX idx_role_type (role_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 权限表
DROP TABLE IF EXISTS t_permission;
CREATE TABLE t_permission (
                              permission_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '权限 ID',
                              permission_code VARCHAR(100) UNIQUE NOT NULL COMMENT '权限编码',
                              permission_name VARCHAR(50) NOT NULL COMMENT '权限名称',
                              permission_type VARCHAR(20) DEFAULT 'API' COMMENT '权限类型：MENU-菜单，BUTTON-按钮，API-接口',
                              parent_id BIGINT DEFAULT 0 COMMENT '父权限 ID',
                              path VARCHAR(255) COMMENT '路径/URL',
                              component VARCHAR(255) COMMENT '组件名称',
                              sort_order INT DEFAULT 0 COMMENT '排序',
                              icon VARCHAR(50) COMMENT '图标',
                              status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
                              create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                              update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                              deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                              INDEX idx_parent_id (parent_id),
                              INDEX idx_permission_type (permission_type),
                              INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- 用户角色关联表
DROP TABLE IF EXISTS t_user_role;
CREATE TABLE t_user_role (
                             user_role_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户角色 ID',
                             user_id BIGINT NOT NULL COMMENT '用户 ID',
                             role_id BIGINT NOT NULL COMMENT '角色 ID',
                             create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                             deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                             UNIQUE KEY uk_user_role (user_id, role_id, deleted),
                             INDEX idx_user_id (user_id),
                             INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- 角色权限关联表
DROP TABLE IF EXISTS t_role_permission;
CREATE TABLE t_role_permission (
                                   role_permission_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '角色权限 ID',
                                   role_id BIGINT NOT NULL COMMENT '角色 ID',
                                   permission_id BIGINT NOT NULL COMMENT '权限 ID',
                                   create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                                   deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                                   UNIQUE KEY uk_role_permission (role_id, permission_id, deleted),
                                   INDEX idx_role_id (role_id),
                                   INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- ================================================
-- 游戏模块
-- ================================================

-- 游戏表（优化版）
DROP TABLE IF EXISTS t_game;
CREATE TABLE t_game (
                        game_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '游戏 ID',
                        game_code VARCHAR(50) UNIQUE NOT NULL COMMENT '游戏编码',
                        game_name VARCHAR(100) NOT NULL COMMENT '游戏名称',
                        category VARCHAR(50) COMMENT '游戏分类：MATH-数学，LANGUAGE-语言，SCIENCE-科学，ART-艺术',
                        grade VARCHAR(20) COMMENT '适龄阶段',

    -- 新增字段（游戏管理重构 v2.0 - 轻量级）
                        tags VARCHAR(500) COMMENT '标签列表（逗号分隔）',
                        is_featured TINYINT DEFAULT 0 COMMENT '是否推荐：0-否，1-是',
                        creator_id BIGINT COMMENT '创建人 ID',
                        publish_time BIGINT COMMENT '上架时间',
                        min_fatigue_to_start INT DEFAULT 0 COMMENT '启动所需最低疲劳度',

    -- 原有字段
                        icon_url VARCHAR(255) COMMENT '游戏图标 URL',
                        cover_url VARCHAR(255) COMMENT '游戏封面 URL',
                        resource_url VARCHAR(255) COMMENT '游戏资源 CDN 地址',
                        description TEXT COMMENT '游戏描述',
                        module_path VARCHAR(255) COMMENT '前端模块路径',
                        game_url VARCHAR(255) COMMENT '游戏访问地址 URL（独立部署时使用）',
                        game_secret VARCHAR(255) COMMENT '游戏密钥（用于签名验证）',
                        game_config JSON COMMENT '游戏配置（透传给游戏的 JSON 配置）',

    -- 状态字段（更新注释：5 状态）
                        status TINYINT DEFAULT 0 COMMENT '状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回',
                        sort_order INT DEFAULT 0 COMMENT '排序',
                        consume_points_per_minute INT DEFAULT 1 COMMENT '每分钟消耗疲劳点数',
                        online_count INT DEFAULT 0 COMMENT '在线人数',

    -- 删除冗余统计字段（已移至 t_game_statistics 表）
    -- total_play_count BIGINT DEFAULT 0 COMMENT '总游戏次数',
    -- total_play_duration BIGINT DEFAULT 0 COMMENT '总游戏时长（秒）',
    -- average_rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '平均评分',

                        create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                        update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                        deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',

    -- 索引
                        INDEX idx_category (category),
                        INDEX idx_grade (grade),
                        INDEX idx_status (status),
                        INDEX idx_tags (tags),
                        INDEX idx_creator (creator_id),
                        INDEX idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏信息表';

-- 游戏标签表（重构版 v2.0）
DROP TABLE IF EXISTS t_game_tag;
CREATE TABLE t_game_tag (
                            tag_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '标签 ID',
                            tag_code VARCHAR(50) UNIQUE NOT NULL COMMENT '标签代码',
                            tag_name VARCHAR(50) NOT NULL COMMENT '标签名称',
                            category VARCHAR(50) COMMENT '所属分类',
                            icon VARCHAR(50) COMMENT '图标 emoji',
                            sort_order INT DEFAULT 0 COMMENT '排序',
                            status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
                            create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                            update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                            deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                            INDEX idx_category (category),
                            INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏标签表';

-- 游戏标签关联表（重构版 v2.0）
DROP TABLE IF EXISTS t_game_tag_relation;
CREATE TABLE t_game_tag_relation (
                                     relation_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '关联 ID',
                                     game_id BIGINT NOT NULL COMMENT '游戏 ID',
                                     tag_id BIGINT NOT NULL COMMENT '标签 ID',
                                     create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                                     UNIQUE KEY uk_game_tag (game_id, tag_id),
                                     INDEX idx_game_id (game_id),
                                     INDEX idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏标签关联表';

-- 屏蔽游戏表（替代 JSON 字段）
DROP TABLE IF EXISTS t_blocked_game;
CREATE TABLE t_blocked_game (
                                id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
                                kid_id BIGINT NOT NULL COMMENT '儿童用户 ID',
                                game_id BIGINT NOT NULL COMMENT '游戏 ID',
                                create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                                deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                                UNIQUE KEY uk_kid_game (kid_id, game_id, deleted),
                                INDEX idx_kid_id (kid_id),
                                INDEX idx_game_id (game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='屏蔽游戏表';

-- 游戏权限表（细粒度权限控制）
DROP TABLE IF EXISTS t_game_permission;
CREATE TABLE t_game_permission (
                                   permission_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '权限 ID',
                                   kid_id BIGINT NOT NULL COMMENT '儿童用户 ID',
                                   game_id BIGINT NOT NULL COMMENT '游戏 ID',
                                   permission_type VARCHAR(20) NOT NULL COMMENT '权限类型：BLOCK-屏蔽，LIMIT_TIME-限时，LIMIT_COUNT-限次',
                                   permission_params JSON COMMENT '限制参数（JSON）',
                                   create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                                   update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                                   deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                                   UNIQUE KEY uk_kid_game_type (kid_id, game_id, permission_type, deleted),
                                   INDEX idx_kid_id (kid_id),
                                   INDEX idx_game_id (game_id),
                                   INDEX idx_permission_type (permission_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏权限表';

-- 游戏会话表（优化版）
DROP TABLE IF EXISTS t_game_session;
CREATE TABLE t_game_session (
                                session_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '会话 ID',
                                user_id BIGINT NOT NULL COMMENT '儿童用户 ID',
                                game_id BIGINT NOT NULL COMMENT '游戏 ID',
                                status TINYINT DEFAULT 1 COMMENT '会话状态：0-已结束，1-进行中，2-已暂停',
                                start_time BIGINT COMMENT '开始时间',
                                end_time BIGINT COMMENT '结束时间',
                                duration BIGINT DEFAULT 0 COMMENT '游玩时长（秒）',
                                score INT DEFAULT 0 COMMENT '获得分数',
                                consume_points INT DEFAULT 0 COMMENT '消耗疲劳点',
                                game_data JSON COMMENT '游戏数据（JSON）',
                                device_info VARCHAR(255) COMMENT '设备信息',
                                client_version VARCHAR(50) COMMENT '客户端版本',
                                create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                                update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                                deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                                INDEX idx_user_id (user_id),
                                INDEX idx_game_id (game_id),
                                INDEX idx_status (status),
                                INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏会话表';

-- 游戏记录表
DROP TABLE IF EXISTS t_game_record;
CREATE TABLE t_game_record (
                               record_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录 ID',
                               user_id BIGINT NOT NULL COMMENT '儿童用户 ID',
                               game_id BIGINT NOT NULL COMMENT '游戏 ID',
                               session_id BIGINT COMMENT '会话 ID',
                               duration BIGINT DEFAULT 0 COMMENT '游戏时长（秒）',
                               score INT DEFAULT 0 COMMENT '游戏分数',
                               consume_points INT DEFAULT 0 COMMENT '消耗疲劳点',
                               play_date VARCHAR(20) COMMENT '游玩日期',
                               create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                               deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                               INDEX idx_user_id (user_id),
                               INDEX idx_game_id (game_id),
                               INDEX idx_play_date (play_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏记录表';

-- ================================================
-- 答题模块
-- ================================================

-- 学科表
DROP TABLE IF EXISTS t_subject;
CREATE TABLE t_subject (
                           subject_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '学科 ID',
                           subject_code VARCHAR(50) UNIQUE NOT NULL COMMENT '学科编码',
                           subject_name VARCHAR(50) NOT NULL COMMENT '学科名称',
                           icon_url VARCHAR(255) COMMENT '学科图标',
                           description VARCHAR(255) COMMENT '学科描述',
                           sort_order INT DEFAULT 0 COMMENT '排序',
                           status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
                           create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                           update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                           deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                           INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学科表';

-- 题目表（优化版）
DROP TABLE IF EXISTS t_question;
CREATE TABLE t_question (
                            question_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '题目 ID',
                            subject_id BIGINT COMMENT '学科 ID',
                            content VARCHAR(500) NOT NULL COMMENT '题目内容',
                            options JSON COMMENT '选项（JSON 数组）',
                            correct_answer VARCHAR(100) NOT NULL COMMENT '正确答案',
                            analysis TEXT COMMENT '答案解析',
                            grade VARCHAR(20) COMMENT '适龄阶段',
                            type VARCHAR(20) DEFAULT 'choice' COMMENT '题型：choice-选择，fill-填空，judgment-判断',
                            difficulty TINYINT DEFAULT 1 COMMENT '难度 1-5',
                            status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
                            create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                            update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                            deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                            INDEX idx_subject_id (subject_id),
                            INDEX idx_grade (grade),
                            INDEX idx_type (type),
                            INDEX idx_difficulty (difficulty),
                            INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目表';

-- 答题记录表（优化版）
DROP TABLE IF EXISTS t_answer_record;
CREATE TABLE t_answer_record (
                                 record_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录 ID',
                                 user_id BIGINT NOT NULL COMMENT '儿童用户 ID',
                                 question_id BIGINT NOT NULL COMMENT '题目 ID',
                                 user_answer VARCHAR(100) COMMENT '用户答案',
                                 is_correct TINYINT COMMENT '是否正确：0-错误，1-正确',
                                 get_points INT DEFAULT 0 COMMENT '获得疲劳点',
                                 answer_time INT DEFAULT 0 COMMENT '答题时间（秒）',
                                 create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                                 deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                                 INDEX idx_user_id (user_id),
                                 INDEX idx_question_id (question_id),
                                 INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='答题记录表';

-- ================================================
-- 管控模块
-- ================================================

-- 用户管控配置表（优化版）
DROP TABLE IF EXISTS t_user_control_config;
CREATE TABLE t_user_control_config (
                                       config_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置 ID',
                                       user_id BIGINT NOT NULL COMMENT '儿童用户 ID',
                                       guardian_id BIGINT COMMENT '监护人用户 ID',
                                       daily_duration INT DEFAULT 60 COMMENT '每日时长上限（分钟）',
                                       single_duration INT DEFAULT 30 COMMENT '单次时长上限（分钟）',
                                       allowed_time_start VARCHAR(10) DEFAULT '06:00' COMMENT '允许游戏开始时间',
                                       allowed_time_end VARCHAR(10) DEFAULT '22:00' COMMENT '允许游戏结束时间',
                                       answer_get_points INT DEFAULT 1 COMMENT '答对 1 题获得的疲劳点数',
                                       daily_answer_limit INT DEFAULT 10 COMMENT '每日答题赚点上限',
                                       blocked_games TEXT COMMENT '屏蔽的游戏 ID 列表（JSON 数组）',
                                       create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                                       update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                                       deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                                       UNIQUE KEY uk_user_guardian (user_id, guardian_id, deleted),
                                       INDEX idx_user_id (user_id),
                                       INDEX idx_guardian_id (guardian_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户管控配置表';

-- ================================================
-- 统计模块
-- ================================================

-- 疲劳点日志表
DROP TABLE IF EXISTS t_fatigue_points_log;
CREATE TABLE t_fatigue_points_log (
                                      log_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志 ID',
                                      user_id BIGINT NOT NULL COMMENT '儿童用户 ID',
                                      change_type TINYINT COMMENT '变化类型：1-游戏消耗，2-答题获得，3-每日重置',
                                      change_points INT COMMENT '变化点数（正数增加，负数减少）',
                                      current_points INT COMMENT '变化后点数',
                                      related_id BIGINT COMMENT '关联 ID（如游戏会话 ID、题目 ID 等）',
                                      related_type VARCHAR(20) COMMENT '关联类型：GAME_SESSION-游戏会话，QUESTION-题目',
                                      remark VARCHAR(255) COMMENT '备注',
                                      create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                                      deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                                      INDEX idx_user_id (user_id),
                                      INDEX idx_create_time (create_time),
                                      INDEX idx_change_type (change_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='疲劳点日志表';

-- 每日统计表（优化版）
DROP TABLE IF EXISTS t_daily_stats;
CREATE TABLE t_daily_stats (
                               stat_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '统计 ID',
                               stat_date VARCHAR(20) NOT NULL COMMENT '统计日期',
                               total_users INT DEFAULT 0 COMMENT '总用户数',
                               active_users INT DEFAULT 0 COMMENT '活跃用户数',
                               new_users INT DEFAULT 0 COMMENT '新增用户数',
                               total_game_duration BIGINT DEFAULT 0 COMMENT '总游戏时长（秒）',
                               total_game_count INT DEFAULT 0 COMMENT '总游戏次数',
                               total_answers INT DEFAULT 0 COMMENT '总答题数',
                               total_correct_answers INT DEFAULT 0 COMMENT '总正确答题数',
                               create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                               update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                               deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                               UNIQUE KEY uk_stat_date (stat_date, deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日统计表';

-- ================================================
-- 主题系统模块（新增）
-- ================================================

-- 主题信息表
DROP TABLE IF EXISTS t_theme_info;
CREATE TABLE t_theme_info (
                              theme_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主题 ID',
                              author_id BIGINT NOT NULL COMMENT '作者 ID',
                              is_official TINYINT DEFAULT 0 COMMENT '是否为官方主题：0-否，1-是',
                              owner_type VARCHAR(20) NOT NULL DEFAULT 'GAME' COMMENT '所有者类型：GAME-游戏，APPLICATION-应用',
                              owner_id BIGINT NOT NULL COMMENT '所有者 ID(游戏 ID 或应用 ID)',
                              theme_name VARCHAR(100) NOT NULL COMMENT '主题名称',
                              author_name VARCHAR(50) COMMENT '作者名称',
                              price INT DEFAULT 0 COMMENT '价格（游戏币）',
                              status VARCHAR(20) DEFAULT 'on_sale' COMMENT '状态：on_sale/offline/pending',
                              download_count INT DEFAULT 0 COMMENT '下载次数',
                              total_revenue INT DEFAULT 0 COMMENT '总收益',
                              thumbnail_url VARCHAR(255) COMMENT '缩略图 URL',
                              description TEXT COMMENT '描述',
                              config_json JSON COMMENT '主题配置（包含资源/样式）',
                              is_default TINYINT DEFAULT 0 COMMENT '是否为默认主题：0-否，1-是',
                              created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                              INDEX idx_author_id (author_id),
                              INDEX idx_owner (owner_type, owner_id),
                              INDEX idx_status (status),
                              INDEX idx_is_official (is_official)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主题信息表';

-- 主题购买记录表
DROP TABLE IF EXISTS t_theme_purchase;
CREATE TABLE t_theme_purchase (
                                  purchase_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '购买 ID',
                                  user_id BIGINT NOT NULL COMMENT '用户 ID',
                                  theme_id BIGINT NOT NULL COMMENT '主题 ID',
                                  price_paid INT DEFAULT 0 COMMENT '实际支付价格',
                                  purchase_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '购买时间',
                                  status VARCHAR(20) DEFAULT 'completed' COMMENT '状态：completed/refunded',
                                  INDEX idx_user_id (user_id),
                                  INDEX idx_theme_id (theme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主题购买记录表';

-- 创作者收益表
DROP TABLE IF EXISTS t_creator_earnings;
CREATE TABLE t_creator_earnings (
                                    earnings_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '收益记录 ID',
                                    creator_id BIGINT NOT NULL COMMENT '创作者 ID',
                                    theme_id BIGINT NOT NULL COMMENT '主题 ID',
                                    amount INT NOT NULL COMMENT '金额',
                                    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending/withdrawn',
                                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                    withdrawn_at DATETIME COMMENT '提现时间',
                                    INDEX idx_creator_id (creator_id),
                                    INDEX idx_theme_id (theme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='创作者收益表';

-- 用户主题偏好表
DROP TABLE IF EXISTS t_user_theme_preference;
CREATE TABLE t_user_theme_preference (
                                         preference_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '偏好 ID',
                                         user_id BIGINT NOT NULL COMMENT '用户 ID',
                                         owner_type VARCHAR(20) NOT NULL COMMENT '所有者类型：GAME-游戏，APPLICATION-应用',
                                         owner_id BIGINT NOT NULL COMMENT '所有者 ID（游戏 ID 或应用 ID）',
                                         theme_id BIGINT NOT NULL COMMENT '主题 ID',
                                         is_active TINYINT DEFAULT 1 COMMENT '是否启用：0-否，1-是',
                                         created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                         UNIQUE KEY uk_user_owner (user_id, owner_type, owner_id) COMMENT '每个用户对每个游戏/应用只有一个当前主题',
                                         INDEX idx_user_id (user_id),
                                         INDEX idx_theme_id (theme_id),
                                         INDEX idx_owner_type_owner_id (owner_type, owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户主题偏好表';

-- ================================================
-- 草稿系统模块（新增）
-- ================================================

-- 草稿表
DROP TABLE IF EXISTS t_draft;
CREATE TABLE t_draft (
                         draft_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '草稿 ID',
                         author_id BIGINT NOT NULL COMMENT '作者 ID',
                         author_type VARCHAR(20) NOT NULL COMMENT '作者类型：USER-用户，ADMIN-管理员',
                         content_type VARCHAR(20) NOT NULL COMMENT '内容类型：THEME-主题，GAME_CONFIG-游戏配置，ARTICLE-文章等',
                         draft_name VARCHAR(100) NOT NULL COMMENT '草稿名称',
                         draft_title VARCHAR(200) COMMENT '草稿标题（可选）',
                         content_json JSON COMMENT '草稿内容 JSON',
                         metadata_json JSON COMMENT '元数据 JSON（扩展字段）',
                         thumbnail_url VARCHAR(255) COMMENT '缩略图 URL',
                         related_entity_type VARCHAR(50) COMMENT '关联实体类型',
                         related_entity_id BIGINT COMMENT '关联实体 ID',
                         status VARCHAR(20) DEFAULT 'draft' COMMENT '状态：draft-草稿，archived-已归档，published-已发布',
                         content_size INT COMMENT '内容大小（字节）',
                         version INT DEFAULT 1 COMMENT '草稿版本号',
                         created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                         published_at DATETIME COMMENT '发布时间',
                         tags VARCHAR(255) COMMENT '标签（逗号分隔）',
                         remark VARCHAR(500) COMMENT '备注说明',
                         INDEX idx_author_id (author_id),
                         INDEX idx_content_type (content_type),
                         INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='草稿表';

-- 草稿版本表
DROP TABLE IF EXISTS t_draft_version;
CREATE TABLE t_draft_version (
                                 version_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '版本 ID',
                                 draft_id BIGINT NOT NULL COMMENT '草稿 ID',
                                 version_number INT NOT NULL COMMENT '版本号',
                                 content_json JSON COMMENT '版本内容 JSON',
                                 created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                 created_by BIGINT COMMENT '创建者 ID',
                                 change_description VARCHAR(500) COMMENT '变更说明',
                                 INDEX idx_draft_id (draft_id),
                                 INDEX idx_version_number (version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='草稿版本表';

-- ================================================
-- 排行榜模块（新增）
-- ================================================

-- 游戏排行榜配置表
DROP TABLE IF EXISTS t_leaderboard_config;
CREATE TABLE t_leaderboard_config (
                                      config_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置 ID',
                                      game_id BIGINT NOT NULL COMMENT '游戏 ID',
                                      dimension_code VARCHAR(50) NOT NULL COMMENT '维度代码',
                                      dimension_name VARCHAR(100) NOT NULL COMMENT '维度名称',
                                      dimension_type VARCHAR(20) NOT NULL COMMENT '维度类型：SCORE-分数，TIME-时间，COUNT-次数',
                                      sort_order VARCHAR(10) DEFAULT 'DESC' COMMENT '排序规则：ASC-升序，DESC-降序',
                                      is_enabled TINYINT DEFAULT 1 COMMENT '是否启用：0-否，1-是',
                                      create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                                      update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                                      deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                                      UNIQUE KEY uk_game_dimension (game_id, dimension_code),
                                      INDEX idx_game_id (game_id),
                                      INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏排行榜配置表';

-- 游戏排行榜数据表
DROP TABLE IF EXISTS t_leaderboard_data;
CREATE TABLE t_leaderboard_data (
                                    data_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '数据 ID',
                                    game_id BIGINT NOT NULL COMMENT '游戏 ID',
                                    user_id BIGINT NOT NULL COMMENT '用户 ID',
                                    username VARCHAR(50) NOT NULL COMMENT '用户名',
                                    nickname VARCHAR(100) COMMENT '昵称',
                                    avatar_url VARCHAR(255) COMMENT '头像 URL',
                                    dimension_code VARCHAR(50) NOT NULL COMMENT '维度代码',
                                    dimension_value BIGINT NOT NULL COMMENT '维度值（统一用 BIGINT 存储，不同类型在应用层转换）',
                                    decimal_value DECIMAL(10,2) DEFAULT 0 COMMENT '小数值（用于百分比等精度要求高的场景）',
                                    rank_date VARCHAR(20) COMMENT '排行日期（YYYY-MM-DD，用于日榜）',
                                    rank_month VARCHAR(7) COMMENT '排行月份（YYYY-MM，用于月榜）',
                                    rank_year VARCHAR(4) COMMENT '排行年份（YYYY，用于年榜）',
                                    rank_type VARCHAR(20) DEFAULT 'ALL' COMMENT '排行类型：ALL-总榜，DAILY-日榜，MONTHLY-月榜，YEARLY-年榜',
                                    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                                    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                                    INDEX idx_game_dimension (game_id, dimension_code),
                                    INDEX idx_rank_type (rank_type),
                                    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏排行榜数据表';

-- ================================================
-- 系统配置模块（新增）
-- ================================================

-- 系统配置表
DROP TABLE IF EXISTS t_system_config;
CREATE TABLE t_system_config (
                                 id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置 ID',
                                 config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
                                 config_value VARCHAR(500) COMMENT '配置值',
                                 description VARCHAR(255) COMMENT '配置描述',
                                 config_group VARCHAR(50) COMMENT '配置分组 (fatigue/game/answer/system)',
                                 create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
                                 update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
                                 deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
                                 INDEX idx_config_key (config_key),
                                 INDEX idx_config_group (config_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- ================================================
-- 初始化数据
-- ================================================

-- 初始化角色
INSERT INTO t_role (role_code, role_name, description, role_type, data_scope) VALUES
                                                                                  ('ROLE_KID', '儿童', '普通儿童用户', 'SYSTEM', 'SELF'),
                                                                                  ('ROLE_PARENT', '家长', '普通家长用户', 'SYSTEM', 'SELF'),
                                                                                  ('ROLE_ADMIN', '管理员', '系统管理员', 'SYSTEM', 'ALL'),
                                                                                  ('ROLE_SUPER_ADMIN', '超级管理员', '超级管理员', 'SYSTEM', 'ALL');

-- 初始化权限
INSERT INTO t_permission (permission_code, permission_name, permission_type, path) VALUES
                                                                                       ('kid:game:play', '玩游戏', 'API', '/api/kid/game/play'),
                                                                                       ('kid:game:pause', '暂停游戏', 'API', '/api/kid/game/pause'),
                                                                                       ('kid:answer:submit', '提交答案', 'API', '/api/kid/answer/submit'),
                                                                                       ('kid:profile:view', '查看个人资料', 'API', '/api/kid/profile/view'),
                                                                                       ('parent:control:view', '查看控制', 'API', '/api/parent/control/view'),
                                                                                       ('parent:control:modify', '修改控制', 'API', '/api/parent/control/modify'),
                                                                                       ('parent:stats:view', '查看统计', 'API', '/api/parent/stats/view'),
                                                                                       ('admin:user:manage', '用户管理', 'MENU', '/admin/user'),
                                                                                       ('admin:game:manage', '游戏管理', 'MENU', '/admin/game'),
                                                                                       ('admin:question:manage', '题库管理', 'MENU', '/admin/question'),
                                                                                       ('admin:stats:view', '统计查看', 'MENU', '/admin/stats');

-- 初始化学科
INSERT INTO t_subject (subject_code, subject_name, icon_url, description) VALUES
                                                                              ('MATH', '数学', '/icons/math.png', '数学学科'),
                                                                              ('CHINESE', '语文', '/icons/chinese.png', '语文学科'),
                                                                              ('ENGLISH', '英语', '/icons/english.png', '英语学科'),
                                                                              ('SCIENCE', '科学', '/icons/science.png', '科学学科'),
                                                                              ('ART', '艺术', '/icons/art.png', '艺术学科');

-- 初始化系统配置
INSERT INTO t_system_config (config_key, config_value, description, config_group) VALUES
                                                                                      ('fatigue.initial_points', '10', '初始疲劳点数', 'fatigue'),
                                                                                      ('fatigue.daily_reset_time', '06:00', '每日重置时间', 'fatigue'),
                                                                                      ('fatigue.max_points', '100', '最大疲劳点数', 'fatigue'),
                                                                                      ('game.default_consume_rate', '1', '默认每分钟疲劳消耗', 'game'),
                                                                                      ('answer.points_per_correct', '1', '每答对一题获得的疲劳点', 'answer'),
                                                                                      ('answer.daily_limit', '10', '每日答题获得疲劳点上限', 'answer');

-- ================================================
-- 补充表定义 (基于实际数据库 ss.sql - 2026-03-23)
-- ================================================

-- ========================================
-- 主题资源表
-- ========================================
CREATE TABLE IF NOT EXISTS t_theme_assets (
                                              asset_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '资产 ID',
                                              theme_id BIGINT NOT NULL COMMENT '主题 ID',
                                              asset_key VARCHAR(100) NOT NULL COMMENT '资源键（如：bg_main）',
    asset_type VARCHAR(20) NOT NULL COMMENT '资源类型：image/audio/font/other',
    file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
    file_size INT DEFAULT 0 COMMENT '文件大小（字节）',
    file_hash VARCHAR(64) DEFAULT NULL COMMENT '文件哈希（用于去重）',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_theme_id (theme_id),
    INDEX idx_asset_key (asset_key),
    CONSTRAINT fk_theme_assets_theme
    FOREIGN KEY (theme_id) REFERENCES t_theme_info(theme_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='主题资源文件表';

-- ========================================
-- 游戏配置表
-- ========================================
CREATE TABLE IF NOT EXISTS t_game_config (
                                             config_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                             game_id BIGINT NOT NULL,
                                             config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    description VARCHAR(500),
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    deleted TINYINT DEFAULT 0,
    UNIQUE KEY uk_game_key (game_id, config_key, deleted),
    INDEX idx_game_id (game_id),
    INDEX idx_config_key (config_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏配置表';

-- ========================================
-- 游戏模式配置表
-- ========================================
CREATE TABLE IF NOT EXISTS t_game_mode_config (
                                                  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置 ID',
                                                  game_id BIGINT NOT NULL COMMENT '游戏 ID',
                                                  mode_type VARCHAR(50) NOT NULL COMMENT '模式类型 (single_player/local_battle/team/online_battle)',
    mode_name VARCHAR(100) COMMENT '模式名称',
    enabled TINYINT DEFAULT 1 COMMENT '是否启用 (0-禁用，1-启用)',
    config_json TEXT COMMENT '模式配置 (JSON 格式)',
    sort_order INT DEFAULT 0 COMMENT '排序权重',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_game_mode (game_id, mode_type),
    INDEX idx_game_id (game_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏模式配置表';

-- ========================================
-- 草稿分类表
-- ========================================
CREATE TABLE IF NOT EXISTS t_draft_category (
                                                category_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '分类 ID',
                                                category_name VARCHAR(100) NOT NULL COMMENT '分类名称',
    category_code VARCHAR(50) NOT NULL COMMENT '分类代码',
    content_type VARCHAR(50) COMMENT '支持的内容类型（空表示支持所有类型）',
    parent_id BIGINT DEFAULT NULL COMMENT '父分类 ID',
    sort_order INT DEFAULT 0 COMMENT '排序',
    description VARCHAR(255) COMMENT '分类描述',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_category_code (category_code),
    INDEX idx_parent (parent_id),
    INDEX idx_content_type (content_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='草稿分类表';

-- ========================================
-- 草稿分类关联表
-- ========================================
CREATE TABLE IF NOT EXISTS t_draft_category_relation (
                                                         id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
                                                         draft_id BIGINT NOT NULL COMMENT '草稿 ID',
                                                         category_id BIGINT NOT NULL COMMENT '分类 ID',
                                                         created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                                         UNIQUE KEY uk_draft_category (draft_id, category_id),
    INDEX idx_draft_id (draft_id),
    INDEX idx_category_id (category_id),
    CONSTRAINT fk_dcr_draft
    FOREIGN KEY (draft_id) REFERENCES draft(draft_id) ON DELETE CASCADE,
    CONSTRAINT fk_dcr_category
    FOREIGN KEY (category_id) REFERENCES draft_category(category_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='草稿分类关联表';

-- ========================================
-- 通知消息表
-- ========================================
CREATE TABLE IF NOT EXISTS t_notification (
                                              notification_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '通知 ID',
                                              user_id BIGINT NOT NULL COMMENT '接收者用户 ID',
                                              user_type TINYINT NOT NULL COMMENT '用户类型：0-儿童，1-家长',
                                              type VARCHAR(50) NOT NULL COMMENT '通知类型',
    title VARCHAR(255) NOT NULL COMMENT '标题',
    content TEXT COMMENT '内容',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-待处理，1-已接受，2-已拒绝，3-已过期',
    is_read TINYINT NOT NULL DEFAULT 0 COMMENT '通知状态：0-未读，1-已读',
    related_id BIGINT DEFAULT NULL COMMENT '关联的数据 ID',
    sender_id BIGINT DEFAULT NULL COMMENT '发送者 ID',
    sender_type TINYINT DEFAULT NULL COMMENT '发送者类型：0-儿童，1-家长',
    extra_data JSON DEFAULT NULL COMMENT '扩展数据（JSON 格式）',
    create_time BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    expire_time BIGINT DEFAULT NULL COMMENT '过期时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_user (user_id, user_type),
    INDEX idx_status (status),
    INDEX idx_is_read (is_read),
    INDEX idx_create_time (create_time)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知消息表';

-- ========================================
-- 用户主题偏好表
-- ========================================
CREATE TABLE IF NOT EXISTS t_user_theme_preference (
                                                       preference_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '偏好 ID',
                                                       user_id BIGINT NOT NULL COMMENT '用户 ID',
                                                       owner_type VARCHAR(20) NOT NULL COMMENT '所有者类型：GAME-游戏，APPLICATION-应用',
    owner_id BIGINT NOT NULL COMMENT '所有者 ID（游戏 ID 或应用 ID）',
    theme_id BIGINT NOT NULL COMMENT '主题 ID',
    is_active TINYINT DEFAULT 1 COMMENT '是否启用：0-否，1-是',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_user_owner (user_id, owner_type, owner_id) COMMENT '每个用户对每个游戏/应用只有一个当前主题',
    INDEX idx_user_id (user_id),
    INDEX idx_theme_id (theme_id),
    INDEX idx_owner_type_owner_id (owner_type, owner_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户主题偏好表';

-- ========================================
-- 修正现有表的字段差异
-- ========================================

-- 修正 t_game 字段长度
ALTER TABLE t_game
    MODIFY COLUMN game_url VARCHAR(500) COMMENT '游戏访问地址 URL（独立部署时使用）',
    MODIFY COLUMN game_secret VARCHAR(100) COMMENT '游戏密钥（用于签名验证）';

-- 补充 t_game 缺失字段
ALTER TABLE t_game
    ADD COLUMN IF NOT EXISTS screenshot_urls TEXT COMMENT '截图 URLs' AFTER resource_url,
    ADD COLUMN IF NOT EXISTS play_guide TEXT COMMENT '玩法指南' AFTER description;

-- 为 t_system_config 添加缺失字段
ALTER TABLE t_system_config
    ADD COLUMN IF NOT EXISTS config_type VARCHAR(20) DEFAULT 'STRING' COMMENT '配置类型：STRING-字符串，INT-整数，JSON-JSON 对象' AFTER config_value,
    ADD COLUMN IF NOT EXISTS status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用' AFTER config_group;

-- 修正 t_system_config 字段定义（与数据库保持一致）
ALTER TABLE t_system_config
    MODIFY COLUMN config_value TEXT COMMENT '配置值',
    MODIFY COLUMN description VARCHAR(255) COMMENT '配置描述';

-- 为 t_game_session 添加 session_token 字段
ALTER TABLE t_game_session
    ADD COLUMN IF NOT EXISTS session_token VARCHAR(100) COMMENT '会话令牌（用于游戏验证）' AFTER game_id;

-- 为 t_daily_stats 添加更多统计字段
ALTER TABLE t_daily_stats
    ADD COLUMN IF NOT EXISTS total_fatigue_points INT DEFAULT 0 COMMENT '发放疲劳点总数' AFTER total_answer_count,
    ADD COLUMN IF NOT EXISTS total_consumed_points INT DEFAULT 0 COMMENT '消耗疲劳点总数' AFTER total_fatigue_points;

-- 修正 t_daily_stats.stat_date 类型
ALTER TABLE t_daily_stats
    MODIFY COLUMN stat_date DATE NOT NULL COMMENT '统计日期';

-- ========================================
-- 草稿统计视图
-- ========================================
CREATE OR REPLACE VIEW v_draft_statistics AS
SELECT
    author_id,
    author_type,
    content_type,
    status,
    COUNT(*) AS draft_count,
    SUM(content_size) AS total_size,
    MIN(created_at) AS first_created_at,
    MAX(updated_at) AS last_updated_at
FROM draft
GROUP BY author_id, author_type, content_type, status;

-- ========================================
-- 清理过期草稿的存储过程
-- ========================================
DELIMITER ;;

CREATE PROCEDURE sp_cleanup_expired_drafts(
    IN p_days INT,
    IN p_author_id BIGINT,
    IN p_content_type VARCHAR(50)
)
BEGIN
    DECLARE deleted_count INT DEFAULT 0;

DELETE FROM draft
WHERE status = 'draft'
  AND updated_at < DATE_SUB(NOW(), INTERVAL p_days DAY)
  AND (p_author_id IS NULL OR author_id = p_author_id)
  AND (p_content_type IS NULL OR content_type = p_content_type);

SET deleted_count = ROW_COUNT();

SELECT deleted_count AS deleted_drafts;
END
;;

DELIMITER ;

-- ================================================
-- Schema V2 完整版 - 更新完成
-- 版本：2.1.0
-- 更新日期：2026-03-28
-- 基于：ss.sql (实际数据库导出)
-- ================================================

-- ================================================
-- 补充表定义（在实际数据库中存在但原 schema_v2.sql 中没有的表）
-- ================================================

-- ========================================
-- 游戏资源配置表
-- ========================================
CREATE TABLE IF NOT EXISTS t_game_resource_config (
                                                      config_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置 ID',
                                                      game_id BIGINT NOT NULL COMMENT '游戏 ID',
                                                      resource_type VARCHAR(50) NOT NULL COMMENT '资源类型',
    resource_key VARCHAR(100) NOT NULL COMMENT '资源键',
    resource_url VARCHAR(500) NOT NULL COMMENT '资源 URL',
    file_size BIGINT COMMENT '文件大小（字节）',
    md5_hash VARCHAR(50) COMMENT 'MD5 哈希',
    version VARCHAR(20) COMMENT '版本号',
    description VARCHAR(500) COMMENT '描述',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_game_id (game_id),
    INDEX idx_resource_type (resource_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏资源配置表';

-- ========================================
-- 游戏评价记录表
-- ========================================
CREATE TABLE IF NOT EXISTS t_game_review_record (
                                                    review_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评价 ID',
                                                    user_id BIGINT NOT NULL COMMENT '用户 ID',
                                                    game_id BIGINT NOT NULL COMMENT '游戏 ID',
                                                    rating TINYINT COMMENT '评分（1-5）',
                                                    review_text TEXT COMMENT '评价内容',
                                                    is_like TINYINT DEFAULT 1 COMMENT '是否喜欢：0-否，1-是',
                                                    is_dislike TINYINT DEFAULT 0 COMMENT '是否不喜欢：0-否，1-是',
                                                    is_favorite TINYINT DEFAULT 0 COMMENT '是否收藏：0-否，1-是',
                                                    status TINYINT DEFAULT 1 COMMENT '状态：0-隐藏，1-显示',
                                                    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_user_id (user_id),
    INDEX idx_game_id (game_id),
    INDEX idx_rating (rating)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏评价记录表';

-- ========================================
-- 游戏统计表
-- ========================================
CREATE TABLE IF NOT EXISTS t_game_statistics (
                                                 stat_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '统计 ID',
                                                 game_id BIGINT NOT NULL COMMENT '游戏 ID',
                                                 stat_date DATE NOT NULL COMMENT '统计日期',
                                                 total_play_count INT DEFAULT 0 COMMENT '总游戏次数',
                                                 unique_players INT DEFAULT 0 COMMENT '独立玩家数',
                                                 total_duration BIGINT DEFAULT 0 COMMENT '总时长（秒）',
                                                 average_duration INT DEFAULT 0 COMMENT '平均时长（秒）',
                                                 average_score DECIMAL(10,2) DEFAULT 0.00 COMMENT '平均分',
    max_score INT DEFAULT 0 COMMENT '最高分',
    min_score INT DEFAULT 0 COMMENT '最低分',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    dislike_count INT DEFAULT 0 COMMENT '踩数',
    favorite_count INT DEFAULT 0 COMMENT '收藏数',
    satisfaction_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '满意度',
    next_day_retention DECIMAL(5,2) DEFAULT 0.00 COMMENT '次日留存率',
    week_retention DECIMAL(5,2) DEFAULT 0.00 COMMENT '周留存率',
    total_fatigue_consumed INT DEFAULT 0 COMMENT '总疲劳消耗',
    average_fatigue_per_player INT DEFAULT 0 COMMENT '人均疲劳消耗',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_game_date (game_id, stat_date, deleted),
    INDEX idx_game_id (game_id),
    INDEX idx_stat_date (stat_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏统计表';

-- ========================================
-- 游戏版本历史表
-- ========================================
CREATE TABLE IF NOT EXISTS t_game_version_history (
                                                      version_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '版本 ID',
                                                      game_id BIGINT NOT NULL COMMENT '游戏 ID',
                                                      version VARCHAR(20) NOT NULL COMMENT '版本号',
    version_description VARCHAR(500) COMMENT '版本描述',
    change_log TEXT COMMENT '更新日志',
    resource_url VARCHAR(500) COMMENT '资源 URL',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    publisher_id BIGINT COMMENT '发布者 ID',
    publish_time BIGINT COMMENT '发布时间',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_game_id (game_id),
    INDEX idx_version (version)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏版本历史表';

-- ========================================
-- 排行榜维度表
-- ========================================
CREATE TABLE IF NOT EXISTS t_leaderboard_dimension (
                                                       dimension_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '维度 ID',
                                                       game_id BIGINT NOT NULL COMMENT '游戏 ID',
                                                       dimension_code VARCHAR(50) NOT NULL COMMENT '维度代码',
    dimension_name VARCHAR(100) NOT NULL COMMENT '维度名称',
    sort_order INT DEFAULT 0 COMMENT '排序',
    data_type VARCHAR(20) DEFAULT 'INT' COMMENT '数据类型：INT-整数，DECIMAL-小数',
    icon VARCHAR(50) COMMENT '图标 emoji',
    description VARCHAR(500) COMMENT '描述',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_game_dimension (game_id, dimension_code, deleted),
    INDEX idx_game_id (game_id),
    INDEX idx_dimension_code (dimension_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='排行榜维度表';

-- ========================================
-- 用户成就表
-- ========================================
CREATE TABLE IF NOT EXISTS t_user_achievement (
                                                  achievement_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '成就 ID',
                                                  user_id BIGINT NOT NULL COMMENT '用户 ID',
                                                  achievement_code VARCHAR(50) NOT NULL COMMENT '成就代码',
    achievement_name VARCHAR(100) NOT NULL COMMENT '成就名称',
    achievement_type VARCHAR(20) NOT NULL COMMENT '成就类型：GAME-游戏，ANSWER-答题，GROWTH-成长',
    achievement_level TINYINT DEFAULT 1 COMMENT '成就等级（铜/银/金）',
    progress INT DEFAULT 0 COMMENT '当前进度',
    target_value INT DEFAULT 0 COMMENT '目标值',
    reward_points INT DEFAULT 0 COMMENT '奖励积分',
    status TINYINT DEFAULT 1 COMMENT '状态：0-进行中，1-已完成，2-已领取',
    completed_time BIGINT COMMENT '完成时间',
    claim_time BIGINT COMMENT '领取时间',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_user_id (user_id),
    INDEX idx_achievement_code (achievement_code),
    INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户成就表';

-- ========================================
-- 用户行为日志表
-- ========================================
CREATE TABLE IF NOT EXISTS t_user_action_log (
                                                 log_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志 ID',
                                                 user_id BIGINT NOT NULL COMMENT '用户 ID',
                                                 action_type VARCHAR(50) NOT NULL COMMENT '行为类型',
    action_desc VARCHAR(500) COMMENT '行为描述',
    related_id BIGINT COMMENT '关联 ID（如游戏 ID、题目 ID 等）',
    related_type VARCHAR(20) COMMENT '关联类型',
    device_info VARCHAR(255) COMMENT '设备信息',
    ip_address VARCHAR(50) COMMENT 'IP 地址',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_user_id (user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_create_time (create_time)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户行为日志表';

-- ========================================
-- 用户等级表
-- ========================================
CREATE TABLE IF NOT EXISTS t_user_level (
                                            level_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '等级 ID',
                                            user_id BIGINT NOT NULL COMMENT '用户 ID',
                                            level INT DEFAULT 1 COMMENT '等级',
                                            experience INT DEFAULT 0 COMMENT '经验值',
                                            level_name VARCHAR(50) COMMENT '等级名称',
    level_icon VARCHAR(255) COMMENT '等级图标',
    privileges JSON COMMENT '特权列表',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_user (user_id, deleted),
    INDEX idx_user_id (user_id),
    INDEX idx_level (level)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户等级表';

-- ========================================
-- 用户请求表（如家长确认请求）
-- ========================================
CREATE TABLE IF NOT EXISTS t_user_request (
                                              request_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '请求 ID',
                                              requester_id BIGINT NOT NULL COMMENT '请求者 ID',
                                              receiver_id BIGINT NOT NULL COMMENT '接收者 ID',
                                              request_type VARCHAR(20) NOT NULL COMMENT '请求类型：RELATION-关系确认，PERMISSION-权限申请',
    request_params JSON COMMENT '请求参数',
    status TINYINT DEFAULT 0 COMMENT '状态：0-待处理，1-已同意，2-已拒绝，3-已取消',
    expire_time BIGINT COMMENT '过期时间',
    handle_time BIGINT COMMENT '处理时间',
    handler_remark VARCHAR(500) COMMENT '处理备注',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_requester_id (requester_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户请求表';

-- ========================================
-- 关系确认表
-- ========================================
CREATE TABLE IF NOT EXISTS t_relation_confirmation (
                                                       confirmation_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '确认 ID',
                                                       relation_id BIGINT NOT NULL COMMENT '关系 ID',
                                                       confirm_user_id BIGINT NOT NULL COMMENT '需要确认的用户 ID',
                                                       confirm_type TINYINT NOT NULL COMMENT '确认类型：1-家长确认儿童，2-儿童确认家长，3-管理员确认',
                                                       status TINYINT DEFAULT 0 COMMENT '状态：0-待确认，1-已确认，2-已拒绝，3-已过期',
                                                       token VARCHAR(100) COMMENT '确认令牌',
    expire_time BIGINT COMMENT '过期时间',
    confirm_time BIGINT COMMENT '确认时间',
    remark VARCHAR(500) COMMENT '备注',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_relation_id (relation_id),
    INDEX idx_confirm_user_id (confirm_user_id),
    INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关系确认表';
