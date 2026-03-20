-- 儿童游戏平台数据库初始化脚本 (MySQL版本)

-- 用户相关表
CREATE TABLE IF NOT EXISTS t_kid (
    kid_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '儿童ID',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '加密密码',
    nickname VARCHAR(50) DEFAULT '小玩家' COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像URL',
    grade VARCHAR(20) DEFAULT '1' COMMENT '学龄',
    parent_id BIGINT COMMENT '绑定家长ID',
    fatigue_points INT DEFAULT 10 COMMENT '当前疲劳点数',
    device_id VARCHAR(100) COMMENT '设备ID',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='儿童用户表';

CREATE TABLE IF NOT EXISTS t_parent (
    parent_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '家长ID',
    phone VARCHAR(20) UNIQUE NOT NULL COMMENT '手机号',
    password VARCHAR(255) NOT NULL COMMENT '加密密码',
    nickname VARCHAR(50) DEFAULT '家长' COMMENT '昵称',
    real_name VARCHAR(50) COMMENT '真实姓名',
    is_verified INT DEFAULT 0 COMMENT '实名认证状态',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家长用户表';

-- 游戏相关表
CREATE TABLE IF NOT EXISTS t_game (
    game_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '游戏ID',
    game_code VARCHAR(50) UNIQUE NOT NULL COMMENT '游戏编码',
    game_name VARCHAR(100) NOT NULL COMMENT '游戏名称',
    category VARCHAR(50) COMMENT '游戏分类',
    grade VARCHAR(20) COMMENT '适龄阶段',
    icon_url VARCHAR(255) COMMENT '游戏图标URL',
    cover_url VARCHAR(255) COMMENT '游戏封面URL',
    resource_url VARCHAR(255) COMMENT '游戏资源CDN地址',
    description TEXT COMMENT '游戏描述',
    module_path VARCHAR(255) COMMENT '前端模块路径',
    status INT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    sort_order INT DEFAULT 0 COMMENT '排序',
    consume_points_per_minute INT DEFAULT 1 COMMENT '每分钟消耗疲劳点数',
    online_count INT DEFAULT 0 COMMENT '在线人数',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏信息表';

CREATE TABLE IF NOT EXISTS t_game_session (
    session_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '会话ID',
    kid_id BIGINT NOT NULL COMMENT '儿童ID',
    game_id BIGINT NOT NULL COMMENT '游戏ID',
    status INT DEFAULT 1 COMMENT '会话状态：0-已结束，1-进行中，2-已暂停',
    start_time BIGINT COMMENT '开始时间',
    end_time BIGINT COMMENT '结束时间',
    duration BIGINT DEFAULT 0 COMMENT '游玩时长（秒）',
    score INT DEFAULT 0 COMMENT '获得分数',
    consume_points INT DEFAULT 0 COMMENT '消耗疲劳点',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏会话表';

CREATE TABLE IF NOT EXISTS t_game_record (
    record_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    kid_id BIGINT NOT NULL COMMENT '儿童ID',
    game_id BIGINT NOT NULL COMMENT '游戏ID',
    session_id BIGINT COMMENT '会话ID',
    duration BIGINT DEFAULT 0 COMMENT '游戏时长（秒）',
    score INT DEFAULT 0 COMMENT '游戏分数',
    consume_points INT DEFAULT 0 COMMENT '消耗疲劳点',
    play_date VARCHAR(20) COMMENT '游玩日期',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏记录表';

-- 管控相关表
CREATE TABLE IF NOT EXISTS t_parent_limit (
    limit_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '规则ID',
    parent_id BIGINT COMMENT '家长ID',
    kid_id BIGINT NOT NULL COMMENT '儿童ID',
    daily_duration INT DEFAULT 60 COMMENT '每日时长上限（分钟）',
    single_duration INT DEFAULT 30 COMMENT '单次时长上限（分钟）',
    allowed_time_start VARCHAR(10) DEFAULT '06:00' COMMENT '允许游戏开始时间',
    allowed_time_end VARCHAR(10) DEFAULT '22:00' COMMENT '允许游戏结束时间',
    answer_get_points INT DEFAULT 1 COMMENT '答对1题获得的疲劳点数',
    daily_answer_limit INT DEFAULT 10 COMMENT '每日答题赚点上限',
    blocked_games TEXT COMMENT '屏蔽的游戏ID列表（JSON数组）',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家长管控规则表';

CREATE TABLE IF NOT EXISTS t_game_lock (
    lock_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '锁定ID',
    game_id BIGINT COMMENT '游戏ID',
    kid_id BIGINT NOT NULL COMMENT '儿童ID',
    reason VARCHAR(255) COMMENT '锁定原因',
    locked INT DEFAULT 1 COMMENT '是否锁定',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏锁定表';

-- 答题相关表
CREATE TABLE IF NOT EXISTS t_question (
    question_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '题目ID',
    content VARCHAR(500) NOT NULL COMMENT '题目内容',
    options TEXT COMMENT '选项（JSON数组）',
    correct_answer VARCHAR(100) NOT NULL COMMENT '正确答案',
    analysis TEXT COMMENT '答案解析',
    grade VARCHAR(20) COMMENT '适龄阶段',
    type VARCHAR(20) DEFAULT 'choice' COMMENT '题型（choice/填空/judgment）',
    difficulty INT DEFAULT 1 COMMENT '难度（1-5）',
    status INT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目表';

CREATE TABLE IF NOT EXISTS t_answer_record (
    record_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    kid_id BIGINT NOT NULL COMMENT '儿童ID',
    question_id BIGINT NOT NULL COMMENT '题目ID',
    user_answer VARCHAR(100) COMMENT '用户答案',
    is_correct INT COMMENT '是否正确',
    get_points INT DEFAULT 0 COMMENT '获得疲劳点',
    answer_time INT DEFAULT 0 COMMENT '答题时间（秒）',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='答题记录表';

CREATE TABLE IF NOT EXISTS t_fatigue_points_log (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    kid_id BIGINT NOT NULL COMMENT '儿童ID',
    change_type INT COMMENT '变化类型：1-游戏消耗，2-答题获得，3-每日重置',
    change_points INT COMMENT '变化点数（正数表示增加，负数表示减少）',
    current_points INT COMMENT '变化后点数',
    related_id BIGINT COMMENT '关联ID（如游戏会话ID、题目ID等）',
    remark VARCHAR(255) COMMENT '备注',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='疲劳点日志表';

-- 统计表
CREATE TABLE IF NOT EXISTS t_daily_stats (
    stat_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '统计ID',
    stat_date VARCHAR(20) NOT NULL COMMENT '统计日期',
    total_users INT DEFAULT 0 COMMENT '总用户数',
    active_users INT DEFAULT 0 COMMENT '活跃用户数',
    total_game_duration BIGINT DEFAULT 0 COMMENT '总游戏时长（秒）',
    total_answers INT DEFAULT 0 COMMENT '总答题数',
    total_correct_answers INT DEFAULT 0 COMMENT '总正确答题数',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日统计表';
