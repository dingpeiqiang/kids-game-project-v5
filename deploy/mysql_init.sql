-- ================================================
-- 儿童游戏平台 - 完整数据库初始化脚本 v1.0
-- 生成时间：2026-06-28
-- 包含所有 40+ 张表定义 + 初始数据
-- ================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS kidgame
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE kidgame;

-- 创建/更新用户并授予权限
CREATE USER IF NOT EXISTS 'kidgame'@'%' IDENTIFIED WITH mysql_native_password BY 'kidgame123';
GRANT ALL PRIVILEGES ON kidgame.* TO 'kidgame'@'%';
CREATE USER IF NOT EXISTS 'kidgame'@'localhost' IDENTIFIED WITH mysql_native_password BY 'kidgame123';
GRANT ALL PRIVILEGES ON kidgame.* TO 'kidgame'@'localhost';
ALTER USER IF EXISTS 'kidgame'@'%' IDENTIFIED WITH mysql_native_password BY 'kidgame123';
ALTER USER IF EXISTS 'kidgame'@'localhost' IDENTIFIED WITH mysql_native_password BY 'kidgame123';
FLUSH PRIVILEGES;

-- ================================================
-- 1. 用户体系
-- ================================================

-- 统一用户表
DROP TABLE IF EXISTS t_user;
CREATE TABLE t_user (
    user_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    user_type TINYINT NOT NULL COMMENT '用户类型：0-儿童，1-家长，2-管理员',
    username VARCHAR(50) NOT NULL COMMENT '登录账号',
    password VARCHAR(255) NOT NULL COMMENT '加密密码',
    password_salt VARCHAR(50) DEFAULT NULL COMMENT '密码加密盐值',
    nickname VARCHAR(50) NOT NULL COMMENT '昵称',
    avatar VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    status TINYINT DEFAULT '1' COMMENT '状态：0-禁用，1-正常，2-锁定',
    fatigue_points INT DEFAULT '10' COMMENT '游学币（所有用户类型通用）',
    coins INT NOT NULL DEFAULT 0 COMMENT '金币',
    exp INT NOT NULL DEFAULT 0 COMMENT '经验值',
    daily_answer_points INT DEFAULT '0' COMMENT '每日答题获得的游学币',
    fatigue_update_time BIGINT DEFAULT NULL COMMENT '游学币最后更新时间（毫秒时间戳）',
    account_expire_time BIGINT DEFAULT NULL COMMENT '账号过期时间（毫秒时间戳）',
    password_expire_time BIGINT DEFAULT NULL COMMENT '密码过期时间（毫秒时间戳）',
    last_login_time BIGINT DEFAULT NULL COMMENT '最后登录时间（毫秒时间戳）',
    last_login_ip VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
    login_failure_count INT DEFAULT '0' COMMENT '登录失败次数',
    locked_until BIGINT DEFAULT NULL COMMENT '锁定截止时间（毫秒时间戳）',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_username_type (username, user_type),
    KEY idx_user_type (user_type),
    KEY idx_status (status),
    KEY idx_fatigue_update_time (fatigue_update_time),
    KEY idx_fatigue_points (fatigue_points),
    KEY idx_t_user_status_type (status, user_type),
    KEY idx_t_user_create_time (create_time),
    KEY idx_t_user_last_login (last_login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一用户表';

-- 角色表
DROP TABLE IF EXISTS t_role;
CREATE TABLE t_role (
    role_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '角色ID',
    role_code VARCHAR(50) NOT NULL COMMENT '角色编码',
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    description VARCHAR(255) DEFAULT NULL COMMENT '角色描述',
    role_type VARCHAR(20) DEFAULT 'CUSTOM' COMMENT '角色类型：SYSTEM-系统，CUSTOM-自定义',
    data_scope VARCHAR(20) DEFAULT 'SELF' COMMENT '数据权限范围：ALL-全部，DEPT-部门，SELF-个人',
    status TINYINT DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
    sort_order INT DEFAULT '0' COMMENT '排序',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (role_id),
    UNIQUE KEY role_code (role_code),
    KEY idx_status (status),
    KEY idx_role_type (role_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 用户角色关联表
DROP TABLE IF EXISTS t_user_role;
CREATE TABLE t_user_role (
    user_role_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户角色ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (user_role_id),
    UNIQUE KEY uk_user_role (user_id, role_id, deleted),
    KEY idx_user_id (user_id),
    KEY idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- 权限表
DROP TABLE IF EXISTS t_permission;
CREATE TABLE t_permission (
    permission_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '权限ID',
    permission_code VARCHAR(100) NOT NULL COMMENT '权限编码',
    permission_name VARCHAR(50) NOT NULL COMMENT '权限名称',
    permission_type VARCHAR(20) DEFAULT 'API' COMMENT '权限类型：MENU-菜单，BUTTON-按钮，API-接口',
    parent_id BIGINT DEFAULT '0' COMMENT '父权限ID',
    path VARCHAR(255) DEFAULT NULL COMMENT '路径/URL',
    component VARCHAR(255) DEFAULT NULL COMMENT '组件名称',
    sort_order INT DEFAULT '0' COMMENT '排序',
    icon VARCHAR(50) DEFAULT NULL COMMENT '图标',
    status TINYINT DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (permission_id),
    UNIQUE KEY permission_code (permission_code),
    KEY idx_parent_id (parent_id),
    KEY idx_permission_type (permission_type),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 角色权限关联表
DROP TABLE IF EXISTS t_role_permission;
CREATE TABLE t_role_permission (
    role_permission_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '角色权限ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (role_permission_id),
    UNIQUE KEY uk_role_permission (role_id, permission_id, deleted),
    KEY idx_role_id (role_id),
    KEY idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- 用户扩展信息表
DROP TABLE IF EXISTS t_user_profile;
CREATE TABLE t_user_profile (
    profile_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '扩展ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    profile_type VARCHAR(20) NOT NULL COMMENT '扩展类型：KID_INFO-儿童信息，PARENT_INFO-家长信息',
    ext_info_json JSON DEFAULT NULL COMMENT '扩展信息（JSON）',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (profile_id),
    UNIQUE KEY uk_user_type (user_id, profile_type),
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户扩展信息表';

-- 用户关系表
DROP TABLE IF EXISTS t_user_relation;
CREATE TABLE t_user_relation (
    relation_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '关系ID',
    relation_type TINYINT NOT NULL COMMENT '关系类型：1-家长儿童，2-管理员儿童，3-兄弟姐妹',
    user_a BIGINT NOT NULL COMMENT '用户A（家长/管理员）',
    user_b BIGINT NOT NULL COMMENT '用户B（儿童）',
    role_type TINYINT NOT NULL COMMENT '角色：1-父亲，2-母亲，3-监护人，4-辅导员',
    is_primary TINYINT DEFAULT '0' COMMENT '是否主要监护人：0-否，1-是',
    permission_level TINYINT DEFAULT '3' COMMENT '权限级别：1-仅查看，2-部分控制，3-完全控制',
    status TINYINT DEFAULT '1' COMMENT '关系状态：0-待确认，1-已建立，2-已取消',
    remark VARCHAR(255) DEFAULT NULL COMMENT '备注说明',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (relation_id),
    UNIQUE KEY uk_user_a_b (user_a, user_b, relation_type, deleted),
    KEY idx_user_a (user_a),
    KEY idx_user_b (user_b),
    KEY idx_relation_type (relation_type),
    KEY idx_status (status),
    KEY idx_t_user_relation_ab (user_a, user_b),
    KEY idx_t_user_relation_ba (user_b, user_a),
    KEY idx_t_user_relation_status (status, relation_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户关系表';

-- 关系确认表
DROP TABLE IF EXISTS t_relation_confirmation;
CREATE TABLE t_relation_confirmation (
    confirmation_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '确认 ID',
    relation_id BIGINT NOT NULL COMMENT '关系 ID',
    confirmation_type VARCHAR(20) NOT NULL COMMENT '确认类型：BIND-绑定，UNBIND-解绑，TRANSFER-转移',
    confirmor_id BIGINT NOT NULL COMMENT '需要确认的用户 ID',
    confirmor_type TINYINT NOT NULL COMMENT '需要确认的用户类型',
    status TINYINT DEFAULT '0' COMMENT '状态：0-待确认，1-已确认，2-已拒绝，3-已过期',
    token VARCHAR(100) DEFAULT NULL COMMENT '确认令牌',
    expire_time BIGINT DEFAULT NULL COMMENT '过期时间',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    PRIMARY KEY (confirmation_id),
    KEY idx_relation (relation_id),
    KEY idx_confirmor (confirmor_id, confirmor_type),
    KEY idx_status (status),
    KEY idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关系确认表';

-- 用户申请记录表
DROP TABLE IF EXISTS t_user_request;
CREATE TABLE t_user_request (
    request_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '申请 ID',
    requester_id BIGINT NOT NULL COMMENT '申请人用户 ID',
    requester_type TINYINT NOT NULL COMMENT '申请人类型：0-儿童，1-家长',
    approver_id BIGINT DEFAULT NULL COMMENT '审批人用户 ID（家长或管理员）',
    approver_type TINYINT DEFAULT NULL COMMENT '审批人类型：0-儿童，1-家长，2-管理员',
    request_type VARCHAR(50) NOT NULL COMMENT '申请类型：EXTEND_TIME-延长时长，UNLOCK_GAME-解锁游戏，PURCHASE_THEME-购买主题',
    request_params JSON DEFAULT NULL COMMENT '申请参数（JSON）',
    status TINYINT DEFAULT '0' COMMENT '状态：0-待审批，1-已通过，2-已拒绝，3-已取消',
    reason VARCHAR(500) DEFAULT NULL COMMENT '申请理由',
    approval_opinion VARCHAR(500) DEFAULT NULL COMMENT '审批意见',
    approval_time BIGINT DEFAULT NULL COMMENT '审批时间',
    expire_time BIGINT DEFAULT NULL COMMENT '过期时间',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    PRIMARY KEY (request_id),
    KEY idx_requester (requester_id, requester_type),
    KEY idx_approver (approver_id, approver_type),
    KEY idx_status (status),
    KEY idx_type (request_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户申请记录表';

-- 用户管控配置表
DROP TABLE IF EXISTS t_user_control_config;
CREATE TABLE t_user_control_config (
    config_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '配置ID',
    user_id BIGINT NOT NULL COMMENT '儿童用户ID',
    guardian_id BIGINT DEFAULT NULL COMMENT '监护人用户 ID',
    daily_time_limit_minutes INT DEFAULT NULL COMMENT '每日总时长限制（分钟）',
    fatigue_point_minutes INT DEFAULT NULL COMMENT '游学币阈值（分钟）',
    rest_duration_minutes INT DEFAULT NULL COMMENT '强制休息时长（分钟）',
    fatigue_control_mode VARCHAR(20) DEFAULT 'SOFT' COMMENT '游学币控制模式：SOFT-软模式，HARD-硬模式，OFF-关闭',
    allowed_start_time VARCHAR(10) DEFAULT NULL COMMENT '允许开始时间 HH:mm:ss',
    allowed_end_time VARCHAR(10) DEFAULT NULL COMMENT '允许结束时间 HH:mm:ss',
    daily_duration INT DEFAULT '60' COMMENT '每日时长上限（分钟，保留字段）',
    single_duration INT DEFAULT '30' COMMENT '单次时长上限（分钟，保留字段）',
    allowed_time_start VARCHAR(10) DEFAULT '06:00' COMMENT '允许游戏开始时间（保留字段）',
    allowed_time_end VARCHAR(10) DEFAULT '22:00' COMMENT '允许游戏结束时间（保留字段）',
    answer_get_points INT DEFAULT '1' COMMENT '答对1题获得的游学币',
    daily_answer_limit INT DEFAULT '10' COMMENT '每日答题赚点上限',
    fatigue_point_threshold INT DEFAULT '60' COMMENT '游学币阈值（分钟）',
    rest_duration INT DEFAULT '15' COMMENT '强制休息时长（分钟）',
    blocked_games TEXT DEFAULT NULL COMMENT '屏蔽的游戏ID列表（JSON数组）',
    game_category_whitelist TEXT DEFAULT NULL COMMENT '游戏类型白名单（JSON 数组）',
    difficulty_limit VARCHAR(10) DEFAULT 'ALL' COMMENT '难度限制：ALL/EASY/MEDIUM/HARD',
    spending_limit INT DEFAULT '0' COMMENT '消费限额（游戏币/天）',
    remark VARCHAR(255) DEFAULT NULL COMMENT '备注说明',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    continuous_play_reminder INT DEFAULT NULL COMMENT '连续游戏提醒间隔（分钟）',
    daily_game_limit INT DEFAULT NULL COMMENT '每日游戏次数限制',
    game_interval INT DEFAULT NULL COMMENT '单次游戏最小间隔（分钟）',
    PRIMARY KEY (config_id),
    UNIQUE KEY uk_user_guardian (user_id, guardian_id, deleted),
    KEY idx_user_id (user_id),
    KEY idx_guardian_id (guardian_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户管控配置表';

-- 用户等级表
DROP TABLE IF EXISTS t_user_level;
CREATE TABLE t_user_level (
    level_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '等级记录 ID',
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    current_level INT DEFAULT '1' COMMENT '当前等级',
    current_exp INT DEFAULT '0' COMMENT '当前经验值',
    next_level_exp INT DEFAULT '100' COMMENT '下一级所需经验值',
    total_exp INT DEFAULT '0' COMMENT '总经验值',
    level_title VARCHAR(50) DEFAULT NULL COMMENT '等级称号',
    last_level_up_time BIGINT DEFAULT NULL COMMENT '上次升级时间',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    PRIMARY KEY (level_id),
    UNIQUE KEY uk_user (user_id),
    KEY idx_user_id (user_id),
    KEY idx_level (current_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户等级表';

-- 用户成就表
DROP TABLE IF EXISTS t_user_achievement;
CREATE TABLE t_user_achievement (
    achievement_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '成就 ID',
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    achievement_code VARCHAR(50) NOT NULL COMMENT '成就编码',
    achievement_name VARCHAR(100) NOT NULL COMMENT '成就名称',
    achievement_type VARCHAR(20) DEFAULT 'GENERAL' COMMENT '成就类型：GENERAL-一般，STUDY-学习，GAME-游戏，SPECIAL-特殊',
    description VARCHAR(500) DEFAULT NULL COMMENT '成就描述',
    icon_url VARCHAR(255) DEFAULT NULL COMMENT '成就图标',
    progress INT DEFAULT '0' COMMENT '进度值',
    target_value INT DEFAULT '1' COMMENT '目标值',
    status TINYINT DEFAULT '0' COMMENT '状态：0-进行中，1-已完成，2-已领取',
    completed_time BIGINT DEFAULT NULL COMMENT '完成时间',
    claimed_time BIGINT DEFAULT NULL COMMENT '领取时间',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    PRIMARY KEY (achievement_id),
    UNIQUE KEY uk_user_achievement (user_id, achievement_code),
    KEY idx_user_id (user_id),
    KEY idx_status (status),
    KEY idx_type (achievement_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户成就表';

-- 用户行为日志表
DROP TABLE IF EXISTS t_user_action_log;
CREATE TABLE t_user_action_log (
    log_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '日志 ID',
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    user_type TINYINT NOT NULL COMMENT '用户类型：0-儿童，1-家长，2-管理员',
    action_type VARCHAR(50) NOT NULL COMMENT '行为类型：LOGIN/LOGOUT/PLAY_GAME/ANSWER/PURCHASE/等',
    action_desc VARCHAR(500) DEFAULT NULL COMMENT '行为描述',
    ip_address VARCHAR(50) DEFAULT NULL COMMENT 'IP 地址',
    device_info VARCHAR(255) DEFAULT NULL COMMENT '设备信息',
    location VARCHAR(100) DEFAULT NULL COMMENT '地理位置',
    extra_data JSON DEFAULT NULL COMMENT '额外数据（灵活存储）',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    PRIMARY KEY (log_id),
    KEY idx_user_time (user_id, create_time),
    KEY idx_action_type (action_type),
    KEY idx_ip (ip_address),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户行为日志表';

-- ================================================
-- 2. 游戏模块
-- ================================================

-- 游戏信息表
DROP TABLE IF EXISTS t_game;
CREATE TABLE t_game (
    game_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '游戏ID',
    game_code VARCHAR(50) NOT NULL COMMENT '游戏编码',
    game_name VARCHAR(100) NOT NULL COMMENT '游戏名称',
    category VARCHAR(50) DEFAULT NULL COMMENT '游戏分类：MATH-数学，LANGUAGE-语言，SCIENCE-科学，ART-艺术',
    grade VARCHAR(20) DEFAULT NULL COMMENT '适龄阶段',
    tags VARCHAR(500) DEFAULT NULL COMMENT '标签列表 (逗号分隔)',
    icon_url VARCHAR(255) DEFAULT NULL COMMENT '游戏图标URL',
    cover_url VARCHAR(255) DEFAULT NULL COMMENT '游戏封面URL',
    resource_url VARCHAR(255) DEFAULT NULL COMMENT '游戏资源CDN地址',
    screenshot_urls TEXT DEFAULT NULL COMMENT '截图 URLs(JSON 数组)',
    game_url VARCHAR(500) DEFAULT NULL COMMENT '游戏访问地址URL（独立部署时使用）',
    game_secret VARCHAR(100) DEFAULT NULL COMMENT '游戏密钥（用于签名验证）',
    game_config JSON DEFAULT NULL COMMENT '游戏配置（透传给游戏的JSON配置）',
    description TEXT DEFAULT NULL COMMENT '游戏描述',
    play_guide TEXT DEFAULT NULL COMMENT '玩法说明',
    module_path VARCHAR(255) DEFAULT NULL COMMENT '前端模块路径',
    status TINYINT DEFAULT '0' COMMENT '状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回',
    sort_order INT DEFAULT '0' COMMENT '排序',
    is_featured TINYINT DEFAULT '0' COMMENT '是否推荐：0-否，1-是',
    consume_points_per_minute INT DEFAULT '1' COMMENT '每分钟消耗游学币',
    min_fatigue_to_start INT DEFAULT '0' COMMENT '启动所需最低游学币度',
    online_count INT DEFAULT '0' COMMENT '在线人数',
    total_play_count BIGINT DEFAULT '0' COMMENT '总游戏次数',
    total_play_duration BIGINT DEFAULT '0' COMMENT '总游戏时长（秒）',
    average_rating DECIMAL(3,2) DEFAULT '0.00' COMMENT '平均评分',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    creator_id BIGINT DEFAULT NULL COMMENT '创建人 ID',
    publish_time BIGINT DEFAULT NULL COMMENT '上架时间',
    PRIMARY KEY (game_id),
    UNIQUE KEY game_code (game_code),
    KEY idx_category (category),
    KEY idx_grade (grade),
    KEY idx_status (status),
    KEY idx_tags (tags),
    KEY idx_creator (creator_id),
    KEY idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏信息表';

-- 游戏配置表
DROP TABLE IF EXISTS t_game_config;
CREATE TABLE t_game_config (
    config_id BIGINT NOT NULL AUTO_INCREMENT,
    game_id BIGINT NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    description VARCHAR(500) DEFAULT NULL,
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    deleted TINYINT DEFAULT '0',
    PRIMARY KEY (config_id),
    UNIQUE KEY uk_game_key (game_id, config_key, deleted),
    KEY idx_game_id (game_id),
    KEY idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏配置表';

-- 游戏模式配置表
DROP TABLE IF EXISTS t_game_mode_config;
CREATE TABLE t_game_mode_config (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '配置 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    mode_type VARCHAR(50) NOT NULL COMMENT '模式类型 (single_player/local_battle/team/online_battle)',
    mode_name VARCHAR(100) DEFAULT NULL COMMENT '模式名称',
    enabled TINYINT DEFAULT '1' COMMENT '是否启用 (0-禁用，1-启用)',
    config_json TEXT DEFAULT NULL COMMENT '模式配置 (JSON 格式)',
    sort_order INT DEFAULT '0' COMMENT '排序权重',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted INT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_game_mode (game_id, mode_type),
    KEY idx_game_id (game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏模式配置表';

-- 游戏资源配置表
DROP TABLE IF EXISTS t_game_resource_config;
CREATE TABLE t_game_resource_config (
    config_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '配置 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    resource_type VARCHAR(50) NOT NULL COMMENT '资源类型：image,audio,video,font,config',
    resource_key VARCHAR(100) NOT NULL COMMENT '资源键名',
    resource_url VARCHAR(500) NOT NULL COMMENT '资源 URL',
    file_size BIGINT DEFAULT NULL COMMENT '文件大小 (字节)',
    md5_hash VARCHAR(50) DEFAULT NULL COMMENT 'MD5 校验值',
    version VARCHAR(20) DEFAULT NULL COMMENT '资源版本',
    description VARCHAR(500) DEFAULT NULL COMMENT '资源说明',
    status TINYINT DEFAULT '1' COMMENT '状态',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (config_id),
    UNIQUE KEY uk_game_key (game_id, resource_key),
    KEY idx_game_id (game_id),
    KEY idx_resource_type (resource_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏资源配置表';

-- 游戏评论表
DROP TABLE IF EXISTS t_game_comment;
CREATE TABLE t_game_comment (
    comment_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '评论 ID',
    user_id BIGINT NOT NULL COMMENT '儿童用户 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    content TEXT NOT NULL COMMENT '评论内容',
    score INT NOT NULL COMMENT '评分（1-5）',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (comment_id),
    KEY idx_user_id (user_id),
    KEY idx_game_id (game_id),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏评论表';

-- 游戏权限表
DROP TABLE IF EXISTS t_game_permission;
CREATE TABLE t_game_permission (
    permission_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '权限ID',
    user_id BIGINT NOT NULL COMMENT '用户ID（儿童）',
    user_type TINYINT NOT NULL DEFAULT '0' COMMENT '用户类型：0-儿童，1-家长，2-管理员',
    game_id BIGINT NOT NULL COMMENT '游戏ID',
    resource_type VARCHAR(20) NOT NULL DEFAULT 'GAME' COMMENT '资源类型：GAME-游戏，MODULE-模块，FEATURE-功能',
    permission_type VARCHAR(20) NOT NULL COMMENT '权限类型：ALLOW-允许，BLOCK-屏蔽，LIMIT_TIME-限时，LIMIT_COUNT-限次',
    time_limit_minutes INT DEFAULT NULL COMMENT '时间限制（分钟）',
    count_limit INT DEFAULT NULL COMMENT '次数限制',
    permission_params JSON DEFAULT NULL COMMENT '限制参数（JSON）',
    remark VARCHAR(255) DEFAULT NULL COMMENT '备注说明',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (permission_id),
    UNIQUE KEY uk_user_resource (user_id, user_type, resource_type, game_id, permission_type, deleted),
    KEY idx_user_id (user_id),
    KEY idx_game_id (game_id),
    KEY idx_permission_type (permission_type),
    KEY idx_user_type (user_type),
    KEY idx_resource_type (resource_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏权限表';

-- 游戏记录表
DROP TABLE IF EXISTS t_game_record;
CREATE TABLE t_game_record (
    record_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    user_id BIGINT NOT NULL COMMENT '儿童用户ID',
    game_id BIGINT NOT NULL COMMENT '游戏ID',
    session_id BIGINT DEFAULT NULL COMMENT '会话ID',
    duration BIGINT DEFAULT '0' COMMENT '游戏时长（秒）',
    score INT DEFAULT '0' COMMENT '游戏分数',
    consume_points INT DEFAULT '0' COMMENT '消耗游学币',
    play_date VARCHAR(20) DEFAULT NULL COMMENT '游玩日期（YYYY-MM-DD）',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (record_id),
    KEY idx_user_id (user_id),
    KEY idx_game_id (game_id),
    KEY idx_play_date (play_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏记录表';

-- 游戏会话表
DROP TABLE IF EXISTS t_game_session;
CREATE TABLE t_game_session (
    session_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '会话ID',
    user_id BIGINT NOT NULL COMMENT '儿童用户ID',
    game_id BIGINT NOT NULL COMMENT '游戏ID',
    session_token VARCHAR(100) DEFAULT NULL COMMENT '会话令牌（用于游戏验证）',
    status TINYINT DEFAULT '1' COMMENT '会话状态：0-已结束，1-进行中，2-已暂停',
    start_time BIGINT DEFAULT NULL COMMENT '开始时间（毫秒时间戳）',
    end_time BIGINT DEFAULT NULL COMMENT '结束时间（毫秒时间戳）',
    duration BIGINT DEFAULT '0' COMMENT '游玩时长（秒）',
    score INT DEFAULT '0' COMMENT '获得分数',
    consume_points INT DEFAULT '0' COMMENT '消耗游学币',
    game_data JSON DEFAULT NULL COMMENT '游戏数据（JSON）',
    device_info VARCHAR(255) DEFAULT NULL COMMENT '设备信息',
    client_version VARCHAR(50) DEFAULT NULL COMMENT '客户端版本',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (session_id),
    UNIQUE KEY session_token (session_token),
    KEY idx_user_id (user_id),
    KEY idx_game_id (game_id),
    KEY idx_status (status),
    KEY idx_start_time (start_time),
    KEY idx_session_token (session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏会话表';

-- 游戏审核记录表
DROP TABLE IF EXISTS t_game_review_record;
CREATE TABLE t_game_review_record (
    review_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '审核 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    reviewer_id BIGINT NOT NULL COMMENT '审核人 ID',
    review_status TINYINT NOT NULL COMMENT '审核状态：1-通过，2-驳回',
    review_comment VARCHAR(500) DEFAULT NULL COMMENT '审核意见',
    reject_reason VARCHAR(500) DEFAULT NULL COMMENT '驳回原因',
    review_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '审核时间',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    PRIMARY KEY (review_id),
    KEY idx_game_id (game_id),
    KEY idx_reviewer_id (reviewer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏审核记录表';

-- 游戏统计表
DROP TABLE IF EXISTS t_game_statistics;
CREATE TABLE t_game_statistics (
    stat_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '统计 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    total_play_count INT DEFAULT '0' COMMENT '总游玩次数',
    unique_players INT DEFAULT '0' COMMENT '独立玩家数',
    total_duration BIGINT DEFAULT '0' COMMENT '总时长 (秒)',
    average_duration INT DEFAULT '0' COMMENT '平均时长 (秒)',
    average_score DECIMAL(10,2) DEFAULT '0.00' COMMENT '平均分数',
    max_score INT DEFAULT '0' COMMENT '最高分',
    min_score INT DEFAULT '0' COMMENT '最低分',
    like_count INT DEFAULT '0' COMMENT '点赞数',
    dislike_count INT DEFAULT '0' COMMENT '踩数',
    favorite_count INT DEFAULT '0' COMMENT '收藏数',
    satisfaction_rate DECIMAL(5,2) DEFAULT '0.00' COMMENT '满意度 (%)',
    next_day_retention DECIMAL(5,2) DEFAULT '0.00' COMMENT '次日留存率 (%)',
    week_retention DECIMAL(5,2) DEFAULT '0.00' COMMENT '周留存率 (%)',
    total_fatigue_consumed INT DEFAULT '0' COMMENT '总消耗游学币度',
    average_fatigue_per_player INT DEFAULT '0' COMMENT '人均消耗游学币度',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (stat_id),
    UNIQUE KEY uk_game_date (game_id, stat_date),
    KEY idx_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏统计表';

-- 游戏版本历史表
DROP TABLE IF EXISTS t_game_version_history;
CREATE TABLE t_game_version_history (
    version_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '版本 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    version VARCHAR(20) NOT NULL COMMENT '版本号',
    version_description VARCHAR(500) DEFAULT NULL COMMENT '版本说明',
    change_log TEXT DEFAULT NULL COMMENT '变更日志',
    resource_url VARCHAR(500) DEFAULT NULL COMMENT '资源 URL',
    status TINYINT DEFAULT '1' COMMENT '状态：0-草稿，1-已发布',
    publisher_id BIGINT DEFAULT NULL COMMENT '发布人 ID',
    publish_time BIGINT DEFAULT NULL COMMENT '发布时间',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (version_id),
    KEY idx_game_id (game_id),
    KEY idx_version (version),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏版本历史表';

-- 游戏标签表
DROP TABLE IF EXISTS t_game_tag;
CREATE TABLE t_game_tag (
    tag_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '标签ID',
    tag_name VARCHAR(50) NOT NULL COMMENT '标签名称',
    tag_type VARCHAR(20) DEFAULT 'CATEGORY' COMMENT '标签类型：CATEGORY-分类，FEATURE-特性，RECOMMEND-推荐',
    sort_order INT DEFAULT '0' COMMENT '排序',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    tag_code VARCHAR(50) DEFAULT NULL COMMENT '标签代码',
    category VARCHAR(50) DEFAULT NULL COMMENT '所属分类',
    icon VARCHAR(50) DEFAULT NULL COMMENT '图标 emoji',
    status TINYINT DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
    update_time BIGINT DEFAULT NULL COMMENT '更新时间',
    PRIMARY KEY (tag_id),
    UNIQUE KEY uk_tag_name_type (tag_name, tag_type, deleted),
    KEY idx_tag_type (tag_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏标签表';

-- 游戏标签关联表
DROP TABLE IF EXISTS t_game_tag_relation;
CREATE TABLE t_game_tag_relation (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
    game_id BIGINT NOT NULL COMMENT '游戏ID',
    tag_id BIGINT NOT NULL COMMENT '标签ID',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_game_tag (game_id, tag_id, deleted),
    KEY idx_game_id (game_id),
    KEY idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏标签关联表';

-- 屏蔽游戏表
DROP TABLE IF EXISTS t_blocked_game;
CREATE TABLE t_blocked_game (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
    kid_id BIGINT NOT NULL COMMENT '儿童用户ID',
    game_id BIGINT NOT NULL COMMENT '游戏ID',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_kid_game (kid_id, game_id, deleted),
    KEY idx_kid_id (kid_id),
    KEY idx_game_id (game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='屏蔽游戏表';

-- 用户收藏表
DROP TABLE IF EXISTS t_user_favorite;
CREATE TABLE t_user_favorite (
    favorite_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '收藏 ID',
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    create_time BIGINT NOT NULL COMMENT '创建时间（时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (favorite_id),
    UNIQUE KEY uk_user_game (user_id, game_id),
    KEY idx_user_id (user_id),
    KEY idx_game_id (game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';

-- ================================================
-- 3. 排行榜模块
-- ================================================

-- 排行榜配置表
DROP TABLE IF EXISTS t_leaderboard_config;
CREATE TABLE t_leaderboard_config (
    config_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '配置 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    dimension_code VARCHAR(50) NOT NULL COMMENT '维度代码：SCORE/HIGHEST_LEVEL/DURATION/ACCURACY 等',
    dimension_name VARCHAR(100) NOT NULL COMMENT '维度名称：如"最高分"/"最高关卡"/"最长时长"/"正确率"',
    sort_order VARCHAR(10) NOT NULL DEFAULT 'DESC' COMMENT '排序方式：ASC-升序，DESC-降序',
    data_type VARCHAR(20) NOT NULL DEFAULT 'INT' COMMENT '数据类型：INT/LONG/DECIMAL',
    icon VARCHAR(50) DEFAULT NULL COMMENT '维度图标',
    description VARCHAR(255) DEFAULT NULL COMMENT '维度描述',
    is_enabled INT DEFAULT '1' COMMENT '是否启用：0-否，1-是',
    display_order INT DEFAULT '0' COMMENT '显示顺序',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted INT DEFAULT '0' COMMENT '逻辑删除',
    dimension_type VARCHAR(20) DEFAULT NULL COMMENT '维度类型：SCORE-分数，TIME-时间，COUNT-次数',
    PRIMARY KEY (config_id),
    UNIQUE KEY uk_game_dimension (game_id, dimension_code),
    KEY idx_game_id (game_id),
    KEY idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏排行榜配置表';

-- 排行榜数据表
DROP TABLE IF EXISTS t_leaderboard_data;
CREATE TABLE t_leaderboard_data (
    data_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '数据 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    nickname VARCHAR(100) DEFAULT NULL COMMENT '昵称',
    avatar_url VARCHAR(255) DEFAULT NULL COMMENT '头像 URL',
    dimension_code VARCHAR(50) NOT NULL COMMENT '维度代码',
    dimension_value BIGINT NOT NULL COMMENT '维度值（统一用 BIGINT 存储，不同类型在应用层转换）',
    decimal_value DECIMAL(10,2) DEFAULT '0.00' COMMENT '小数值（用于百分比等精度要求高的场景）',
    rank_date VARCHAR(20) DEFAULT NULL COMMENT '排行日期（YYYY-MM-DD，用于日榜）',
    rank_month VARCHAR(7) DEFAULT NULL COMMENT '排行月份（YYYY-MM，用于月榜）',
    rank_year VARCHAR(4) DEFAULT NULL COMMENT '排行年份（YYYY，用于年榜）',
    rank_type VARCHAR(20) DEFAULT 'ALL' COMMENT '排行类型：ALL-总榜，DAILY-日榜，MONTHLY-月榜，YEARLY-年榜',
    extra_data JSON DEFAULT NULL COMMENT '额外数据（用于存储通关时间、使用角色等扩展信息）',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted INT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (data_id),
    UNIQUE KEY uk_game_user_dimension_rank (game_id, user_id, dimension_code, rank_type, rank_date, rank_month, rank_year),
    KEY idx_game_dimension (game_id, dimension_code),
    KEY idx_game_dimension_value (game_id, dimension_code, dimension_value),
    KEY idx_user (user_id),
    KEY idx_rank_type (rank_type),
    KEY idx_rank_date (rank_date),
    KEY idx_rank_month (rank_month),
    KEY idx_rank_year (rank_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏排行榜数据表';

-- 排行榜维度表
DROP TABLE IF EXISTS t_leaderboard_dimension;
CREATE TABLE t_leaderboard_dimension (
    dimension_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '维度 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    dimension_code VARCHAR(50) NOT NULL COMMENT '维度代码（如：score, time, length）',
    dimension_name VARCHAR(100) NOT NULL COMMENT '维度名称（如：最高分数、最长时长）',
    sort_order INT DEFAULT '0' COMMENT '排序权重',
    data_type VARCHAR(20) DEFAULT 'INT' COMMENT '数据类型：INT-整数，LONG-长整数，DECIMAL-小数',
    icon VARCHAR(50) DEFAULT NULL COMMENT '图标 emoji',
    description VARCHAR(500) DEFAULT NULL COMMENT '维度说明',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (dimension_id),
    UNIQUE KEY uk_game_dimension (game_id, dimension_code, deleted),
    KEY idx_game_id (game_id),
    KEY idx_dimension_code (dimension_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='排行榜维度表';

-- ================================================
-- 4. 学科与试题模块
-- ================================================

-- 学科表
DROP TABLE IF EXISTS t_subject;
CREATE TABLE t_subject (
    subject_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '学科ID',
    subject_code VARCHAR(50) NOT NULL COMMENT '学科编码',
    subject_name VARCHAR(50) NOT NULL COMMENT '学科名称',
    icon_url VARCHAR(255) DEFAULT NULL COMMENT '学科图标',
    description VARCHAR(255) DEFAULT NULL COMMENT '学科描述',
    sort_order INT DEFAULT '0' COMMENT '排序',
    status TINYINT DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (subject_id),
    UNIQUE KEY subject_code (subject_code),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学科表';

-- 知识点表
DROP TABLE IF EXISTS t_knowledge_point;
CREATE TABLE t_knowledge_point (
    knowledge_point_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '知识点ID',
    subject_id BIGINT NOT NULL COMMENT '学科ID',
    parent_id BIGINT DEFAULT NULL COMMENT '父知识点ID（NULL为根节点）',
    code VARCHAR(50) NOT NULL COMMENT '知识点编码（同学科内唯一）',
    name VARCHAR(100) NOT NULL COMMENT '知识点名称',
    chapter VARCHAR(100) DEFAULT NULL COMMENT '所属章节',
    description VARCHAR(500) DEFAULT NULL COMMENT '知识点描述',
    sort_order INT DEFAULT '0' COMMENT '排序',
    status TINYINT DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (knowledge_point_id),
    UNIQUE KEY uk_subject_code (subject_id, code, deleted),
    KEY idx_subject_id (subject_id),
    KEY idx_parent_id (parent_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识点表';

-- 题目表
DROP TABLE IF EXISTS t_question;
CREATE TABLE t_question (
    question_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '题目ID',
    subject_id BIGINT DEFAULT NULL COMMENT '学科ID',
    knowledge_points JSON DEFAULT NULL COMMENT '知识点ID数组（JSON）',
    tags JSON DEFAULT NULL COMMENT '标签数组（JSON）',
    media_urls JSON DEFAULT NULL COMMENT '媒体附件（图片/音频/视频，JSON数组）',
    content VARCHAR(2000) NOT NULL COMMENT '题目内容（纯文本或富文本JSON）',
    options JSON DEFAULT NULL COMMENT '选项（JSON数组）',
    correct_answer VARCHAR(100) NOT NULL COMMENT '正确答案',
    analysis TEXT DEFAULT NULL COMMENT '答案解析',
    grade VARCHAR(20) DEFAULT NULL COMMENT '适龄阶段',
    type VARCHAR(20) DEFAULT 'single' COMMENT '题型：single-单选，multiple-多选，judge-判断，fill-填空，short_answer-简答，image-图片题，audio-音频题',
    difficulty TINYINT DEFAULT '1' COMMENT '难度：1-5',
    score INT DEFAULT '1' COMMENT '分值',
    time_limit INT DEFAULT '0' COMMENT '建议答题限时（秒），0表示不限',
    answer_mode VARCHAR(20) DEFAULT 'single' COMMENT '作答模式：single-单选，multiple-多选，text-文本作答',
    fill_config JSON DEFAULT NULL COMMENT '填空题配置（JSON：多空、关键词、容错模式）',
    short_answer_keywords JSON DEFAULT NULL COMMENT '简答题关键词（JSON数组，用于人工阅卷辅助）',
    status TINYINT DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (question_id),
    KEY idx_subject_id (subject_id),
    KEY idx_subject_grade (subject_id, grade),
    KEY idx_grade (grade),
    KEY idx_type (type),
    KEY idx_difficulty (difficulty),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目表';

-- 答题记录表
DROP TABLE IF EXISTS t_answer_record;
CREATE TABLE t_answer_record (
    record_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    user_id BIGINT NOT NULL COMMENT '儿童用户ID',
    question_id BIGINT NOT NULL COMMENT '题目ID',
    session_id BIGINT DEFAULT NULL COMMENT '每日练习会话ID（t_daily_session.session_id）',
    subject_id BIGINT DEFAULT NULL COMMENT '学科ID（冗余便于统计）',
    knowledge_point_ids JSON DEFAULT NULL COMMENT '本题知识点ID数组（冗余便于统计）',
    question_type VARCHAR(20) DEFAULT NULL COMMENT '题型（冗余）',
    difficulty TINYINT DEFAULT NULL COMMENT '难度（冗余）',
    user_answer VARCHAR(100) DEFAULT NULL COMMENT '用户答案',
    is_correct TINYINT DEFAULT NULL COMMENT '是否正确：0-错误，1-正确',
    is_marked TINYINT DEFAULT '0' COMMENT '是否标记：0-否，1-是',
    is_collected TINYINT DEFAULT '0' COMMENT '是否收藏：0-否，1-是',
    is_wrong TINYINT DEFAULT '0' COMMENT '是否错题：0-否，1-是（错题本来源）',
    get_points INT DEFAULT '0' COMMENT '获得游学币',
    answer_time INT DEFAULT '0' COMMENT '答题时间（秒）',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间（毫秒时间戳）',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (record_id),
    KEY idx_user_id (user_id),
    KEY idx_question_id (question_id),
    KEY idx_session_id (session_id),
    KEY idx_user_wrong (user_id, is_wrong),
    KEY idx_user_correct (user_id, is_correct),
    KEY idx_user_create (user_id, create_time),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='答题记录表';

-- 错题本
DROP TABLE IF EXISTS t_wrong_question;
CREATE TABLE t_wrong_question (
    wrong_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '错题记录ID',
    user_id BIGINT NOT NULL COMMENT '儿童用户ID',
    question_id BIGINT NOT NULL COMMENT '题目ID',
    subject_id BIGINT DEFAULT NULL COMMENT '学科ID（冗余）',
    knowledge_point_ids JSON DEFAULT NULL COMMENT '知识点ID数组（冗余）',
    wrong_count INT DEFAULT '1' COMMENT '错误次数',
    last_wrong_time BIGINT DEFAULT NULL COMMENT '最近答错时间',
    last_wrong_answer VARCHAR(500) DEFAULT NULL COMMENT '最近错误答案',
    mastery_level TINYINT DEFAULT '0' COMMENT '掌握度：0-未掌握，1-了解，2-熟悉，3-掌握',
    review_count INT DEFAULT '0' COMMENT '复习次数',
    last_review_time BIGINT DEFAULT NULL COMMENT '最近复习时间',
    next_review_time BIGINT DEFAULT NULL COMMENT '下次推荐复习时间',
    status TINYINT DEFAULT '1' COMMENT '状态：0-已掌握移除，1-待复习，2-复习中',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (wrong_id),
    UNIQUE KEY uk_user_question (user_id, question_id, deleted),
    KEY idx_user_id (user_id),
    KEY idx_question_id (question_id),
    KEY idx_subject_id (subject_id),
    KEY idx_status (status),
    KEY idx_next_review (user_id, next_review_time),
    KEY idx_mastery (user_id, mastery_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='错题本';

-- 题目收藏表
DROP TABLE IF EXISTS t_collection;
CREATE TABLE t_collection (
    collection_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    question_id BIGINT NOT NULL COMMENT '题目ID',
    note VARCHAR(500) DEFAULT NULL COMMENT '收藏笔记',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (collection_id),
    UNIQUE KEY uk_user_question (user_id, question_id, deleted),
    KEY idx_user_id (user_id),
    KEY idx_question_id (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目收藏表';

-- 每日练习会话表
DROP TABLE IF EXISTS t_daily_session;
CREATE TABLE t_daily_session (
    session_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '会话ID',
    user_id BIGINT NOT NULL COMMENT '儿童用户ID',
    session_date DATE NOT NULL COMMENT '会话日期',
    subject_id BIGINT DEFAULT NULL COMMENT '学科ID（NULL为综合）',
    knowledge_point_ids JSON DEFAULT NULL COMMENT '本次练习知识点范围',
    difficulty_range VARCHAR(20) DEFAULT 'ALL' COMMENT '难度范围：ALL/EASY/MEDIUM/HARD',
    total_count INT DEFAULT '0' COMMENT '本次题目总数',
    answered_count INT DEFAULT '0' COMMENT '已答题数',
    correct_count INT DEFAULT '0' COMMENT '答对题数',
    points_earned INT DEFAULT '0' COMMENT '本次获得游学币',
    duration INT DEFAULT '0' COMMENT '本次用时（秒）',
    source VARCHAR(20) DEFAULT 'DAILY' COMMENT '来源：DAILY-每日练习，RECOMMEND-推荐练习，WRONG_REVIEW-错题复习，ASSIGNMENT-教师任务',
    source_id BIGINT DEFAULT NULL COMMENT '来源ID（如任务ID）',
    status TINYINT DEFAULT '0' COMMENT '状态：0-进行中，1-已完成，2-已放弃',
    start_time BIGINT DEFAULT NULL COMMENT '开始时间',
    end_time BIGINT DEFAULT NULL COMMENT '结束时间',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (session_id),
    KEY idx_user_id (user_id),
    KEY idx_user_date (user_id, session_date),
    KEY idx_status (status),
    KEY idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日练习会话表';

-- ================================================
-- 5. 班级与任务模块
-- ================================================

-- 班级表
DROP TABLE IF EXISTS t_class;
CREATE TABLE t_class (
    class_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '班级ID',
    class_name VARCHAR(50) NOT NULL COMMENT '班级名称',
    grade VARCHAR(20) DEFAULT NULL COMMENT '年级',
    school_year VARCHAR(20) DEFAULT NULL COMMENT '学年（如 2025-2026）',
    creator_id BIGINT NOT NULL COMMENT '创建者ID（教师）',
    invite_code VARCHAR(20) DEFAULT NULL COMMENT '邀请码',
    description VARCHAR(255) DEFAULT NULL COMMENT '班级描述',
    status TINYINT DEFAULT '1' COMMENT '状态：0-已解散，1-正常',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (class_id),
    KEY idx_creator_id (creator_id),
    KEY idx_grade (grade),
    KEY idx_invite_code (invite_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级表';

-- 班级成员表
DROP TABLE IF EXISTS t_class_member;
CREATE TABLE t_class_member (
    member_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '成员ID',
    class_id BIGINT NOT NULL COMMENT '班级ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT' COMMENT '角色：TEACHER-教师，STUDENT-学生',
    join_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '加入时间',
    status TINYINT DEFAULT '1' COMMENT '状态：0-已退出，1-正常',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (member_id),
    UNIQUE KEY uk_class_user (class_id, user_id, deleted),
    KEY idx_class_id (class_id),
    KEY idx_user_id (user_id),
    KEY idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级成员表';

-- 教师练习任务表
DROP TABLE IF EXISTS t_practice_assignment;
CREATE TABLE t_practice_assignment (
    assignment_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '任务ID',
    teacher_id BIGINT NOT NULL COMMENT '教师ID',
    class_id BIGINT NOT NULL COMMENT '班级ID',
    title VARCHAR(100) NOT NULL COMMENT '任务标题',
    description VARCHAR(500) DEFAULT NULL COMMENT '任务说明',
    subject_id BIGINT DEFAULT NULL COMMENT '学科ID',
    knowledge_point_ids JSON DEFAULT NULL COMMENT '知识点范围',
    difficulty_range VARCHAR(20) DEFAULT 'ALL' COMMENT '难度范围',
    question_count INT DEFAULT '10' COMMENT '题目数量',
    question_type VARCHAR(20) DEFAULT NULL COMMENT '指定题型（NULL为混合）',
    due_time BIGINT DEFAULT NULL COMMENT '截止时间',
    points_reward INT DEFAULT '0' COMMENT '完成奖励游学币',
    status TINYINT DEFAULT '1' COMMENT '状态：0-草稿，1-已发布，2-已截止，3-已删除',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (assignment_id),
    KEY idx_teacher_id (teacher_id),
    KEY idx_class_id (class_id),
    KEY idx_status (status),
    KEY idx_due_time (due_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师练习任务表';

-- 任务完成情况表
DROP TABLE IF EXISTS t_assignment_completion;
CREATE TABLE t_assignment_completion (
    completion_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '完成记录ID',
    assignment_id BIGINT NOT NULL COMMENT '任务ID',
    student_id BIGINT NOT NULL COMMENT '学生ID',
    session_id BIGINT DEFAULT NULL COMMENT '关联的练习会话ID',
    total_count INT DEFAULT '0' COMMENT '任务题目数',
    answered_count INT DEFAULT '0' COMMENT '已答题数',
    correct_count INT DEFAULT '0' COMMENT '答对题数',
    points_earned INT DEFAULT '0' COMMENT '获得游学币',
    duration INT DEFAULT '0' COMMENT '用时（秒）',
    finish_status TINYINT DEFAULT '0' COMMENT '完成状态：0-未开始，1-进行中，2-已完成',
    finish_time BIGINT DEFAULT NULL COMMENT '完成时间',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (completion_id),
    UNIQUE KEY uk_assignment_student (assignment_id, student_id, deleted),
    KEY idx_assignment_id (assignment_id),
    KEY idx_student_id (student_id),
    KEY idx_finish_status (finish_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务完成情况表';

-- ================================================
-- 6. 经济与任务系统
-- ================================================

-- 用户签到记录表
DROP TABLE IF EXISTS t_user_sign_in;
CREATE TABLE t_user_sign_in (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    sign_in_date VARCHAR(10) NOT NULL COMMENT '签到日期 (格式: yyyy-MM-dd)',
    consecutive_days INT NOT NULL DEFAULT '1' COMMENT '连续签到天数',
    coins_reward INT NOT NULL DEFAULT '50' COMMENT '获得的金币奖励',
    exp_reward INT NOT NULL DEFAULT '0' COMMENT '获得经验值奖励',
    study_coins_reward INT DEFAULT 0 COMMENT '游学币奖励',
    create_time BIGINT NOT NULL COMMENT '创建时间',
    update_time BIGINT NOT NULL COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_date (user_id, sign_in_date),
    KEY idx_user_id (user_id),
    KEY idx_sign_in_date (sign_in_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户签到记录表';

-- 签到奖励配置表
DROP TABLE IF EXISTS t_sign_in_reward_config;
CREATE TABLE t_sign_in_reward_config (
    config_id BIGINT NOT NULL AUTO_INCREMENT,
    day_index INT NOT NULL COMMENT '连续签到第几天(1-7循环)',
    coins_reward INT NOT NULL DEFAULT 50,
    study_coins_reward INT NOT NULL DEFAULT 0,
    exp_reward INT NOT NULL DEFAULT 0,
    enabled TINYINT NOT NULL DEFAULT 1,
    update_time BIGINT DEFAULT NULL,
    PRIMARY KEY (config_id),
    UNIQUE KEY uk_day_index (day_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='签到奖励配置';

-- 游戏经济配置表
DROP TABLE IF EXISTS t_game_economy_config;
CREATE TABLE t_game_economy_config (
    id BIGINT NOT NULL AUTO_INCREMENT,
    game_id BIGINT NOT NULL,
    study_coin_cost INT NOT NULL DEFAULT 1 COMMENT '每局消耗游学币',
    level_rewards_json TEXT COMMENT '关卡奖励JSON [{level:1,coins:5,exp:3},...]',
    enabled TINYINT NOT NULL DEFAULT 1,
    update_time BIGINT DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_game_id (game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏经济配置';

-- 单局游戏得分记录表
DROP TABLE IF EXISTS t_game_session_score;
CREATE TABLE t_game_session_score (
    id BIGINT NOT NULL AUTO_INCREMENT,
    game_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    username VARCHAR(50) DEFAULT NULL,
    nickname VARCHAR(50) DEFAULT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    score INT NOT NULL,
    level_reached INT DEFAULT 0,
    create_time BIGINT NOT NULL,
    deleted TINYINT DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_game_score (game_id, score DESC),
    KEY idx_user_game (user_id, game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='单局游戏得分记录';

-- 任务定义表
DROP TABLE IF EXISTS t_task_definition;
CREATE TABLE t_task_definition (
    task_id BIGINT NOT NULL AUTO_INCREMENT,
    task_code VARCHAR(64) NOT NULL COMMENT '任务编码',
    task_name VARCHAR(100) NOT NULL COMMENT '任务名称',
    task_desc VARCHAR(500) DEFAULT NULL COMMENT '任务描述',
    task_type VARCHAR(32) NOT NULL DEFAULT 'DAILY' COMMENT 'DAILY/WEEKLY/ONCE',
    target_value INT NOT NULL DEFAULT 1 COMMENT '目标值',
    metric VARCHAR(64) NOT NULL COMMENT 'SIGN_IN/PLAY_GAME/ANSWER_CORRECT等',
    coins_reward INT NOT NULL DEFAULT 0 COMMENT '奖励金币',
    exp_reward INT NOT NULL DEFAULT 0 COMMENT '奖励经验',
    owner_type VARCHAR(16) NOT NULL DEFAULT 'SYSTEM' COMMENT 'SYSTEM/PARENT/ADMIN',
    owner_id BIGINT DEFAULT NULL COMMENT '家长或管理员ID',
    kid_id BIGINT DEFAULT NULL COMMENT '指定儿童，空为全局',
    enabled TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_time BIGINT DEFAULT NULL,
    update_time BIGINT DEFAULT NULL,
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (task_id),
    UNIQUE KEY uk_task_code_owner (task_code, owner_type, owner_id, kid_id, deleted),
    KEY idx_task_type (task_type),
    KEY idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务定义表';

-- 用户任务进度表
DROP TABLE IF EXISTS t_user_task_progress;
CREATE TABLE t_user_task_progress (
    progress_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    task_id BIGINT NOT NULL COMMENT '任务ID',
    task_code VARCHAR(50) NOT NULL COMMENT '任务编码（冗余）',
    current_value INT DEFAULT '0' COMMENT '当前进度值',
    target_value INT DEFAULT '1' COMMENT '目标值',
    status TINYINT DEFAULT '0' COMMENT '状态：0-进行中，1-已完成，2-已领取',
    completed_time BIGINT DEFAULT NULL COMMENT '完成时间',
    claimed_time BIGINT DEFAULT NULL COMMENT '领取时间',
    reset_time BIGINT DEFAULT NULL COMMENT '下次重置时间',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    PRIMARY KEY (progress_id),
    UNIQUE KEY uk_user_task (user_id, task_id),
    KEY idx_user_id (user_id),
    KEY idx_task_id (task_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户任务进度表';

-- 头衔定义表
DROP TABLE IF EXISTS t_title_definition;
CREATE TABLE t_title_definition (
    title_id BIGINT NOT NULL AUTO_INCREMENT,
    title_code VARCHAR(50) NOT NULL COMMENT '头衔编码',
    title_name VARCHAR(100) NOT NULL COMMENT '头衔名称',
    description VARCHAR(500) DEFAULT NULL COMMENT '头衔描述',
    icon_url VARCHAR(255) DEFAULT NULL COMMENT '头衔图标',
    min_exp INT DEFAULT '0' COMMENT '最低经验值',
    min_level INT DEFAULT '0' COMMENT '最低等级',
    min_coins INT DEFAULT '0' COMMENT '最低金币',
    color VARCHAR(20) DEFAULT '#FFD700' COMMENT '头衔颜色',
    rarity VARCHAR(20) DEFAULT 'COMMON' COMMENT '稀有度：COMMON-普通，RARE-稀有，EPIC-史诗，LEGENDARY-传说',
    status TINYINT DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
    sort_order INT DEFAULT '0' COMMENT '排序',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    PRIMARY KEY (title_id),
    UNIQUE KEY uk_title_code (title_code),
    KEY idx_rarity (rarity),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='头衔定义表';

-- 用户头衔表
DROP TABLE IF EXISTS t_user_title;
CREATE TABLE t_user_title (
    user_title_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    title_id BIGINT NOT NULL COMMENT '头衔ID',
    title_code VARCHAR(50) NOT NULL COMMENT '头衔编码（冗余）',
    obtain_time BIGINT DEFAULT NULL COMMENT '获得时间',
    is_active TINYINT DEFAULT '0' COMMENT '是否使用中：0-否，1-是',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    PRIMARY KEY (user_title_id),
    UNIQUE KEY uk_user_title (user_id, title_id),
    KEY idx_user_id (user_id),
    KEY idx_title_id (title_id),
    KEY idx_active (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户头衔表';

-- 商城商品表
DROP TABLE IF EXISTS t_shop_product;
CREATE TABLE t_shop_product (
    product_id BIGINT NOT NULL AUTO_INCREMENT,
    product_code VARCHAR(50) NOT NULL COMMENT '商品编码',
    product_name VARCHAR(100) NOT NULL COMMENT '商品名称',
    product_type VARCHAR(20) NOT NULL COMMENT '商品类型：COINS-金币，EXP-经验，THEME-主题，TITLE-头衔，POINTS-游学币',
    description VARCHAR(500) DEFAULT NULL COMMENT '商品描述',
    icon_url VARCHAR(255) DEFAULT NULL COMMENT '商品图标',
    price_type VARCHAR(20) NOT NULL COMMENT '支付类型：COINS-金币，REAL-人民币',
    price DECIMAL(10,2) DEFAULT '0.00' COMMENT '价格',
    discount_price DECIMAL(10,2) DEFAULT NULL COMMENT '折扣价格',
    stock INT DEFAULT '-1' COMMENT '库存（-1表示无限）',
    sold_count INT DEFAULT '0' COMMENT '销量',
    status TINYINT DEFAULT '1' COMMENT '状态：0-下架，1-上架',
    is_featured TINYINT DEFAULT '0' COMMENT '是否推荐：0-否，1-是',
    sort_order INT DEFAULT '0' COMMENT '排序',
    start_time BIGINT DEFAULT NULL COMMENT '上架开始时间',
    end_time BIGINT DEFAULT NULL COMMENT '上架结束时间',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    PRIMARY KEY (product_id),
    UNIQUE KEY uk_product_code (product_code),
    KEY idx_product_type (product_type),
    KEY idx_price_type (price_type),
    KEY idx_status (status),
    KEY idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商城商品表';

-- 商品配置表
DROP TABLE IF EXISTS t_product_config;
CREATE TABLE t_product_config (
    config_id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NOT NULL COMMENT '商品ID',
    config_key VARCHAR(50) NOT NULL COMMENT '配置键',
    config_value VARCHAR(255) NOT NULL COMMENT '配置值',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    PRIMARY KEY (config_id),
    UNIQUE KEY uk_product_key (product_id, config_key),
    KEY idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品配置表';

-- 用户购买记录表
DROP TABLE IF EXISTS t_user_purchase;
CREATE TABLE t_user_purchase (
    purchase_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    product_code VARCHAR(50) NOT NULL COMMENT '商品编码（冗余）',
    product_name VARCHAR(100) NOT NULL COMMENT '商品名称（冗余）',
    price_type VARCHAR(20) NOT NULL COMMENT '支付类型',
    price DECIMAL(10,2) DEFAULT '0.00' COMMENT '支付金额',
    quantity INT DEFAULT '1' COMMENT '购买数量',
    total_price DECIMAL(10,2) DEFAULT '0.00' COMMENT '总价',
    status TINYINT DEFAULT '0' COMMENT '状态：0-待支付，1-已支付，2-已完成，3-已取消',
    transaction_id VARCHAR(100) DEFAULT NULL COMMENT '交易ID',
    pay_time BIGINT DEFAULT NULL COMMENT '支付时间',
    receive_time BIGINT DEFAULT NULL COMMENT '到账时间',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)),
    PRIMARY KEY (purchase_id),
    KEY idx_user_id (user_id),
    KEY idx_product_id (product_id),
    KEY idx_status (status),
    KEY idx_transaction_id (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户购买记录表';

-- ================================================
-- 7. 主题系统
-- ================================================

-- 主题信息表
DROP TABLE IF EXISTS t_theme_info;
CREATE TABLE t_theme_info (
    theme_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主题ID',
    theme_name VARCHAR(100) NOT NULL COMMENT '主题名称',
    theme_code VARCHAR(50) NOT NULL COMMENT '主题编码',
    theme_type VARCHAR(20) DEFAULT 'GAME' COMMENT '主题类型：GAME-游戏主题，UI-界面主题',
    owner_type VARCHAR(20) NOT NULL DEFAULT 'GAME' COMMENT '所有者类型：GAME-游戏，APPLICATION-应用',
    owner_id BIGINT DEFAULT NULL COMMENT '所有者ID',
    cover_image_url VARCHAR(255) DEFAULT NULL COMMENT '封面图片',
    description VARCHAR(500) DEFAULT NULL COMMENT '描述',
    tags VARCHAR(500) DEFAULT NULL COMMENT '标签',
    price DECIMAL(10,2) DEFAULT '0.00' COMMENT '价格（金币）',
    is_free TINYINT DEFAULT '0' COMMENT '是否免费：0-否，1-是',
    status TINYINT DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
    sort_order INT DEFAULT '0' COMMENT '排序',
    download_count INT DEFAULT '0' COMMENT '下载次数',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (theme_id),
    UNIQUE KEY uk_theme_code (theme_code),
    KEY idx_owner (owner_type, owner_id),
    KEY idx_theme_type (theme_type),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='主题信息表';

-- 主题资源表
DROP TABLE IF EXISTS t_theme_assets;
CREATE TABLE t_theme_assets (
    asset_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '资源ID',
    theme_id BIGINT NOT NULL COMMENT '主题ID',
    asset_type VARCHAR(20) NOT NULL COMMENT '资源类型：IMAGE-图片，AUDIO-音频，CONFIG-配置',
    asset_key VARCHAR(100) NOT NULL COMMENT '资源键名',
    asset_url VARCHAR(500) NOT NULL COMMENT '资源URL',
    file_size BIGINT DEFAULT NULL COMMENT '文件大小',
    md5_hash VARCHAR(50) DEFAULT NULL COMMENT 'MD5校验值',
    version VARCHAR(20) DEFAULT NULL COMMENT '版本号',
    description VARCHAR(255) DEFAULT NULL COMMENT '描述',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (asset_id),
    UNIQUE KEY uk_theme_key (theme_id, asset_key),
    KEY idx_theme_id (theme_id),
    KEY idx_asset_type (asset_type),
    CONSTRAINT fk_theme_assets_theme FOREIGN KEY (theme_id) REFERENCES t_theme_info(theme_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='主题资源表';

-- 用户主题偏好表
DROP TABLE IF EXISTS t_user_theme_preference;
CREATE TABLE t_user_theme_preference (
    preference_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '偏好ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    theme_id BIGINT NOT NULL COMMENT '主题ID',
    owner_type VARCHAR(20) NOT NULL COMMENT '所有者类型：GAME-游戏，APPLICATION-应用',
    owner_id BIGINT NOT NULL COMMENT '所有者ID',
    is_active TINYINT DEFAULT '0' COMMENT '是否使用中：0-否，1-是',
    obtain_time BIGINT DEFAULT NULL COMMENT '获取时间',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (preference_id),
    UNIQUE KEY uk_user_theme (user_id, theme_id),
    KEY idx_user_id (user_id),
    KEY idx_theme_id (theme_id),
    KEY idx_active (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户主题偏好表';

-- ================================================
-- 8. 系统模块
-- ================================================

-- 系统配置表
DROP TABLE IF EXISTS t_system_config;
CREATE TABLE t_system_config (
    config_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '配置ID',
    config_key VARCHAR(100) NOT NULL COMMENT '配置键',
    config_value TEXT NOT NULL COMMENT '配置值',
    config_type VARCHAR(20) DEFAULT 'STRING' COMMENT '配置类型：STRING-字符串，NUMBER-数字，JSON-JSON对象',
    description VARCHAR(255) DEFAULT NULL COMMENT '配置描述',
    status TINYINT DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
    sort_order INT DEFAULT '0' COMMENT '排序',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (config_id),
    UNIQUE KEY uk_config_key (config_key, deleted),
    KEY idx_config_type (config_type),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 通知表
DROP TABLE IF EXISTS t_notification;
CREATE TABLE t_notification (
    notification_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '通知ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    title VARCHAR(100) NOT NULL COMMENT '通知标题',
    content TEXT NOT NULL COMMENT '通知内容',
    notification_type VARCHAR(20) DEFAULT 'SYSTEM' COMMENT '通知类型：SYSTEM-系统通知，GAME-游戏通知，TASK-任务通知，MARKET-商城通知',
    source_id BIGINT DEFAULT NULL COMMENT '来源ID（如游戏ID、任务ID）',
    source_type VARCHAR(20) DEFAULT NULL COMMENT '来源类型',
    is_read TINYINT DEFAULT '0' COMMENT '是否已读：0-未读，1-已读',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    PRIMARY KEY (notification_id),
    KEY idx_user_id (user_id),
    KEY idx_type (notification_type),
    KEY idx_is_read (is_read),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- 每日统计快照表
DROP TABLE IF EXISTS t_daily_stats;
CREATE TABLE t_daily_stats (
    stat_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '统计ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    stat_date VARCHAR(20) NOT NULL COMMENT '统计日期（YYYY-MM-DD）',
    total_fatigue_points INT DEFAULT '0' COMMENT '总游学币消耗',
    total_consumed_points INT DEFAULT '0' COMMENT '总消耗游学币',
    game_duration INT DEFAULT '0' COMMENT '游戏时长（分钟）',
    game_count INT DEFAULT '0' COMMENT '游戏次数',
    answer_count INT DEFAULT '0' COMMENT '答题次数',
    correct_count INT DEFAULT '0' COMMENT '答对次数',
    coins_earned INT DEFAULT '0' COMMENT '获得金币',
    coins_spent INT DEFAULT '0' COMMENT '消耗金币',
    exp_earned INT DEFAULT '0' COMMENT '获得经验',
    create_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    update_time BIGINT DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '更新时间',
    deleted TINYINT DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (stat_id),
    UNIQUE KEY uk_user_date (user_id, stat_date),
    KEY idx_user_id (user_id),
    KEY idx_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日统计快照表';

-- ================================================
-- 9. 草稿系统
-- ================================================

-- 草稿表
DROP TABLE IF EXISTS t_draft;
CREATE TABLE t_draft (
    draft_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '草稿ID',
    author_id BIGINT NOT NULL COMMENT '作者ID',
    author_type VARCHAR(20) DEFAULT 'USER' COMMENT '作者类型：USER-用户，ADMIN-管理员',
    content_type VARCHAR(50) NOT NULL COMMENT '内容类型：THEME-主题，GAME_CONFIG-游戏配置，ARTICLE-文章',
    draft_name VARCHAR(100) NOT NULL COMMENT '草稿名称',
    draft_title VARCHAR(200) DEFAULT NULL COMMENT '草稿标题',
    content_json TEXT DEFAULT NULL COMMENT '草稿内容JSON',
    metadata_json TEXT DEFAULT NULL COMMENT '元数据JSON',
    thumbnail_url VARCHAR(255) DEFAULT NULL COMMENT '缩略图URL',
    related_entity_type VARCHAR(50) DEFAULT NULL COMMENT '关联实体类型',
    related_entity_id BIGINT DEFAULT NULL COMMENT '关联实体ID',
    status VARCHAR(20) DEFAULT 'draft' COMMENT '状态：draft-草稿，archived-已归档，published-已发布',
    content_size INT DEFAULT '0' COMMENT '内容大小（字节）',
    version INT DEFAULT '1' COMMENT '草稿版本号',
    tags VARCHAR(500) DEFAULT NULL COMMENT '标签（逗号分隔）',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注说明',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    published_at DATETIME DEFAULT NULL COMMENT '发布时间',
    PRIMARY KEY (draft_id),
    KEY idx_author (author_id, author_type),
    KEY idx_content_type (content_type),
    KEY idx_status (status),
    KEY idx_related (related_entity_type, related_entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='草稿表';

-- 草稿分类表
DROP TABLE IF EXISTS t_draft_category;
CREATE TABLE t_draft_category (
    category_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '分类ID',
    category_name VARCHAR(100) NOT NULL COMMENT '分类名称',
    category_code VARCHAR(50) NOT NULL COMMENT '分类代码',
    content_type VARCHAR(50) DEFAULT NULL COMMENT '支持的内容类型',
    parent_id BIGINT DEFAULT NULL COMMENT '父分类ID',
    sort_order INT DEFAULT '0' COMMENT '排序',
    description VARCHAR(500) DEFAULT NULL COMMENT '分类描述',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (category_id),
    UNIQUE KEY uk_category_code (category_code),
    KEY idx_parent_id (parent_id),
    KEY idx_content_type (content_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='草稿分类表';

-- 草稿分类关联表
DROP TABLE IF EXISTS t_draft_category_relation;
CREATE TABLE t_draft_category_relation (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    draft_id BIGINT NOT NULL COMMENT '草稿ID',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_draft_category (draft_id, category_id),
    KEY idx_draft_id (draft_id),
    KEY idx_category_id (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='草稿分类关联表';

-- 草稿版本历史表
DROP TABLE IF EXISTS t_draft_version;
CREATE TABLE t_draft_version (
    version_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '版本ID',
    draft_id BIGINT NOT NULL COMMENT '草稿ID',
    version INT DEFAULT '1' COMMENT '版本号',
    content_json TEXT DEFAULT NULL COMMENT '快照内容JSON',
    metadata_json TEXT DEFAULT NULL COMMENT '快照元数据JSON',
    change_log VARCHAR(500) DEFAULT NULL COMMENT '变更说明',
    created_by BIGINT DEFAULT NULL COMMENT '创建人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (version_id),
    KEY idx_draft_id (draft_id),
    KEY idx_version (draft_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='草稿版本历史表';

-- 创作者收益表
DROP TABLE IF EXISTS t_creator_earnings;
CREATE TABLE t_creator_earnings (
    earnings_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '收益记录ID',
    creator_id BIGINT NOT NULL COMMENT '创作者ID',
    theme_id BIGINT DEFAULT NULL COMMENT '主题ID',
    amount INT DEFAULT '0' COMMENT '金额',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending-待提现，withdrawn-已提现',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    withdrawn_at DATETIME DEFAULT NULL COMMENT '提现时间',
    PRIMARY KEY (earnings_id),
    KEY idx_creator_id (creator_id),
    KEY idx_theme_id (theme_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='创作者收益表';

-- ================================================
-- 初始数据
-- ================================================

-- 初始角色数据
INSERT INTO t_role (role_code, role_name, description, role_type, data_scope, status) VALUES
('ADMIN', '管理员', '系统管理员，拥有所有权限', 'SYSTEM', 'ALL', 1),
('PARENT', '家长', '家长用户，可管理儿童账号', 'SYSTEM', 'DEPT', 1),
('KID', '儿童', '儿童用户，可游玩游戏和答题', 'SYSTEM', 'SELF', 1),
('TEACHER', '教师', '教师用户，可创建班级和任务', 'SYSTEM', 'DEPT', 1);

-- 初始管理员用户
INSERT INTO t_user (user_type, username, password, password_salt, nickname, avatar, status, fatigue_points, coins, exp) VALUES
(2, 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq', 'salt123', '超级管理员', '/avatar/admin.png', 1, 1000, 10000, 10000);

-- 管理员角色关联
INSERT INTO t_user_role (user_id, role_id) VALUES
(1, 1);

-- 初始学科数据
INSERT INTO t_subject (subject_code, subject_name, icon_url, sort_order, status) VALUES
('MATH', '数学', '/subject/math.png', 1, 1),
('CHINESE', '语文', '/subject/chinese.png', 2, 1),
('ENGLISH', '英语', '/subject/english.png', 3, 1),
('SCIENCE', '科学', '/subject/science.png', 4, 1),
('ART', '美术', '/subject/art.png', 5, 1);

-- 初始系统配置
INSERT INTO t_system_config (config_key, config_value, config_type, description, status) VALUES
('system.name', '儿童游戏平台', 'STRING', '系统名称', 1),
('system.version', '1.0.0', 'STRING', '系统版本', 1),
('fatigue.default_points', '10', 'NUMBER', '新用户默认游学币', 1),
('fatigue.max_points', '120', 'NUMBER', '游学币上限（分钟）', 1),
('fatigue.recover_rate', '0.5', 'NUMBER', '每分钟恢复游学币数', 1),
('answer.points_per_correct', '1', 'NUMBER', '答对一题获得游学币', 1),
('answer.daily_limit', '10', 'NUMBER', '每日答题赚点上限', 1),
('game.consume_points_per_minute', '1', 'NUMBER', '游戏每分钟消耗游学币', 1),
('signin.enabled', 'true', 'STRING', '是否启用签到', 1),
('leaderboard.top_count', '100', 'NUMBER', '排行榜显示数量', 1);

-- 初始签到奖励配置
INSERT INTO t_sign_in_reward_config (day_index, coins_reward, study_coins_reward, exp_reward) VALUES
(1, 50, 0, 10),
(2, 60, 0, 15),
(3, 70, 1, 20),
(4, 80, 1, 25),
(5, 100, 2, 30),
(6, 120, 2, 40),
(7, 150, 5, 50);

-- 初始游戏数据
INSERT INTO t_game (game_code, game_name, category, grade, icon_url, cover_url, description, status, sort_order, is_featured, consume_points_per_minute, min_fatigue_to_start) VALUES
('snake', '贪吃蛇', 'COORDINATION', 'ALL', '/game/snake/icon.png', '/game/snake/cover.png', '经典贪吃蛇游戏，锻炼反应能力', 2, 1, 1, 1, 0),
('tank', '坦克大战', 'COORDINATION', 'ALL', '/game/tank/icon.png', '/game/tank/cover.png', '经典坦克大战，保卫家园', 2, 2, 1, 1, 0),
('minesweeper', '扫雷', 'LOGIC', 'ALL', '/game/minesweeper/icon.png', '/game/minesweeper/cover.png', '经典扫雷游戏，锻炼逻辑思维', 2, 3, 0, 1, 0),
('memory', '记忆力挑战', 'MEMORY', 'ALL', '/game/memory/icon.png', '/game/memory/cover.png', '翻牌记忆游戏，锻炼记忆力', 2, 4, 0, 1, 0),
('dino', '恐龙快跑', 'COORDINATION', 'ALL', '/game/dino/icon.png', '/game/dino/cover.png', '经典恐龙跑酷游戏', 2, 5, 1, 1, 0),
('maze', '迷宫冒险', 'LOGIC', 'ALL', '/game/maze/icon.png', '/game/maze/cover.png', '迷宫解谜游戏', 2, 6, 0, 1, 0),
('tetris', '俄罗斯方块', 'COORDINATION', 'ALL', '/game/tetris/icon.png', '/game/tetris/cover.png', '经典俄罗斯方块', 2, 7, 1, 1, 0),
('sudoku', '数独', 'LOGIC', 'ALL', '/game/sudoku/icon.png', '/game/sudoku/cover.png', '经典数独游戏', 2, 8, 0, 1, 0),
('mathQuiz', '数学闯关', 'MATH', 'ALL', '/game/mathQuiz/icon.png', '/game/mathQuiz/cover.png', '数学趣味答题游戏', 2, 9, 1, 1, 0),
('wordPuzzle', '字谜游戏', 'LANGUAGE', 'ALL', '/game/wordPuzzle/icon.png', '/game/wordPuzzle/cover.png', '汉字字谜游戏', 2, 10, 0, 1, 0);

-- 初始任务定义
INSERT INTO t_task_definition (task_code, task_name, task_desc, task_type, target_value, metric, coins_reward, exp_reward, owner_type, enabled, sort_order, create_time, update_time) VALUES
('daily_sign_in', '每日签到', '完成今日签到', 'DAILY', 1, 'SIGN_IN', 20, 5, 'SYSTEM', 1, 1, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('daily_play_3', '每日玩3局', '今日完成3局游戏', 'DAILY', 3, 'PLAY_GAME', 40, 10, 'SYSTEM', 1, 2, UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000);

-- 初始头衔定义
INSERT INTO t_title_definition (title_code, title_name, description, min_exp, min_level, min_coins, color, rarity, status, sort_order) VALUES
('newbie', '新手玩家', '刚刚开始游戏的新手', 0, 1, 0, '#999999', 'COMMON', 1, 1),
('bronze', '青铜玩家', '游戏入门者', 100, 2, 100, '#CD7F32', 'COMMON', 1, 2),
('silver', '白银玩家', '有一定经验的玩家', 500, 5, 500, '#C0C0C0', 'RARE', 1, 3),
('gold', '黄金玩家', '资深玩家', 2000, 10, 2000, '#FFD700', 'EPIC', 1, 4),
('diamond', '钻石玩家', '顶级玩家', 10000, 20, 10000, '#BBDDF0', 'LEGENDARY', 1, 5);

-- 初始排行榜配置
INSERT INTO t_leaderboard_config (game_id, dimension_code, dimension_name, sort_order, data_type, is_enabled, display_order) VALUES
(1, 'SCORE', '最高分', 'DESC', 'INT', 1, 1),
(1, 'DURATION', '最长时长', 'DESC', 'INT', 1, 2),
(2, 'SCORE', '最高分', 'DESC', 'INT', 1, 1),
(2, 'LEVEL', '最高关卡', 'DESC', 'INT', 1, 2),
(3, 'TIME', '最短时间', 'ASC', 'INT', 1, 1),
(3, 'ACCURACY', '正确率', 'DESC', 'DECIMAL', 1, 2),
(5, 'SCORE', '最高分', 'DESC', 'INT', 1, 1),
(5, 'DISTANCE', '最远距离', 'DESC', 'INT', 1, 2),
(7, 'SCORE', '最高分', 'DESC', 'INT', 1, 1),
(7, 'LEVEL', '最高关卡', 'DESC', 'INT', 1, 2),
(9, 'SCORE', '最高分', 'DESC', 'INT', 1, 1),
(9, 'ACCURACY', '正确率', 'DESC', 'DECIMAL', 1, 2);

-- 初始商城商品
INSERT INTO t_shop_product (product_code, product_name, product_type, description, icon_url, price_type, price, stock, status, is_featured, sort_order) VALUES
('coins_100', '金币100', 'COINS', '购买100金币', '/shop/coins.png', 'REAL', 1.00, -1, 1, 1, 1),
('coins_500', '金币500', 'COINS', '购买500金币', '/shop/coins.png', 'REAL', 5.00, -1, 1, 1, 2),
('coins_1000', '金币1000', 'COINS', '购买1000金币', '/shop/coins.png', 'REAL', 9.00, -1, 1, 0, 3),
('points_30', '游学币30分钟', 'POINTS', '购买30分钟游学币', '/shop/points.png', 'COINS', 100, -1, 1, 0, 4),
('points_60', '游学币60分钟', 'POINTS', '购买60分钟游学币', '/shop/points.png', 'COINS', 180, -1, 1, 1, 5),
('theme_classic', '经典主题', 'THEME', '经典游戏主题', '/shop/theme_classic.png', 'COINS', 500, -1, 1, 0, 6),
('theme_cute', '可爱主题', 'THEME', '可爱风格主题', '/shop/theme_cute.png', 'COINS', 800, -1, 1, 1, 7);

-- 初始游戏标签
INSERT INTO t_game_tag (tag_name, tag_type, tag_code, sort_order, status) VALUES
('数学', 'CATEGORY', 'MATH', 1, 1),
('语文', 'CATEGORY', 'LANGUAGE', 2, 1),
('英语', 'CATEGORY', 'ENGLISH', 3, 1),
('科学', 'CATEGORY', 'SCIENCE', 4, 1),
('艺术', 'CATEGORY', 'ART', 5, 1),
('益智', 'FEATURE', 'PUZZLE', 6, 1),
('反应', 'FEATURE', 'REACTION', 7, 1),
('记忆', 'FEATURE', 'MEMORY', 8, 1),
('推荐', 'RECOMMEND', 'RECOMMENDED', 9, 1),
('热门', 'RECOMMEND', 'HOT', 10, 1);

-- 游戏标签关联
INSERT INTO t_game_tag_relation (game_id, tag_id) VALUES
(1, 6), (1, 7), (1, 9),
(2, 6), (2, 7),
(3, 6), (3, 10),
(4, 6), (4, 8),
(5, 6), (5, 7), (5, 9),
(6, 6),
(7, 6), (7, 7), (7, 9),
(8, 6), (8, 10),
(9, 1), (9, 6), (9, 9),
(10, 2), (10, 6);

-- ================================================
-- 初始化完成
-- ================================================
SELECT 'Database initialization completed successfully!' AS message;