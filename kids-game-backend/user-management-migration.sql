-- ================================================
-- 用户管理系统 - 数据库迁移脚本
-- 版本：v1.0.0
-- 日期：2026-03-23
-- 说明：基于现有 schema_v2.sql 扩展用户管理功能
-- ================================================

-- ================================================
-- 1. 扩展现有表结构
-- ================================================

-- 1.1 为 t_user 添加管理员相关字段（已有，无需修改）
-- 检查 user_type 字段是否支持 3 种类型：0-儿童，1-家长，2-管理员
-- 已在 schema_v2.sql 中定义，无需变更

-- 1.2 为 t_user 添加更多安全和审计字段
ALTER TABLE t_user
ADD COLUMN IF NOT EXISTS password_salt VARCHAR(50) COMMENT '密码加密盐值' AFTER password,
ADD COLUMN IF NOT EXISTS login_failure_count INT DEFAULT 0 COMMENT '登录失败次数' AFTER last_login_ip,
ADD COLUMN IF NOT EXISTS locked_until BIGINT COMMENT '锁定截止时间（毫秒时间戳）' AFTER login_failure_count;

-- 1.3 优化 t_user_profile 结构，使其更适合存储儿童/家长扩展信息
-- 现有 structure 已支持，添加一些常用字段到 ext_info_json 的说明
-- ext_info_json 推荐结构：
-- 儿童：{ "grade": "三年级", "school": "XX 小学", "birthday": "2015-05-20", "interests": ["数学", "绘画"] }
-- 家长：{ "children": [123, 456], "occupation": "工程师", "phone": "13800138000" }

-- ================================================
-- 2. 新增表结构
-- ================================================

-- 2.1 用户行为日志表（新增）
DROP TABLE IF EXISTS t_user_action_log;
CREATE TABLE t_user_action_log (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志 ID',
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    user_type TINYINT NOT NULL COMMENT '用户类型：0-儿童，1-家长，2-管理员',
    action_type VARCHAR(50) NOT NULL COMMENT '行为类型：LOGIN/LOGOUT/PLAY_GAME/ANSWER/PURCHASE/等',
    action_desc VARCHAR(500) COMMENT '行为描述',
    ip_address VARCHAR(50) COMMENT 'IP 地址',
    device_info VARCHAR(255) COMMENT '设备信息',
    location VARCHAR(100) COMMENT '地理位置',
    extra_data JSON COMMENT '额外数据（灵活存储）',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    INDEX idx_user_time (user_id, create_time),
    INDEX idx_action_type (action_type),
    INDEX idx_ip (ip_address),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户行为日志表';

-- 2.2 通知消息表增强版（基于现有 t_notification 优化）
-- 已有 t_notification，检查是否需要扩展
-- 检查字段：extra_data JSON 已存在，支持扩展

-- 2.3 申请审批记录表（新增）
-- ⚠️ 注意：申请记录是历史数据，不支持删除，因此没有 deleted 字段
DROP TABLE IF EXISTS t_user_request;
CREATE TABLE t_user_request (
    request_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '申请 ID',
    requester_id BIGINT NOT NULL COMMENT '申请人用户 ID',
    requester_type TINYINT NOT NULL COMMENT '申请人类型：0-儿童，1-家长',
    approver_id BIGINT COMMENT '审批人用户 ID（家长或管理员）',
    approver_type TINYINT COMMENT '审批人类型：0-儿童，1-家长，2-管理员',
    request_type VARCHAR(50) NOT NULL COMMENT '申请类型：EXTEND_TIME-延长时长，UNLOCK_GAME-解锁游戏，PURCHASE_THEME-购买主题',
    request_params JSON COMMENT '申请参数（JSON）',
    status TINYINT DEFAULT 0 COMMENT '状态：0-待审批，1-已通过，2-已拒绝，3-已取消',
    reason VARCHAR(500) COMMENT '申请理由',
    approval_opinion VARCHAR(500) COMMENT '审批意见',
    approval_time BIGINT COMMENT '审批时间',
    expire_time BIGINT COMMENT '过期时间',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    INDEX idx_requester (requester_id, requester_type),
    INDEX idx_approver (approver_id, approver_type),
    INDEX idx_status (status),
    INDEX idx_type (request_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户申请记录表';

-- 2.4 成就系统表（新增）
DROP TABLE IF EXISTS t_user_achievement;
CREATE TABLE t_user_achievement (
    achievement_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '成就 ID',
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    achievement_code VARCHAR(50) NOT NULL COMMENT '成就编码',
    achievement_name VARCHAR(100) NOT NULL COMMENT '成就名称',
    achievement_type VARCHAR(20) DEFAULT 'GENERAL' COMMENT '成就类型：GENERAL-一般，STUDY-学习，GAME-游戏，SPECIAL-特殊',
    description VARCHAR(500) COMMENT '成就描述',
    icon_url VARCHAR(255) COMMENT '成就图标',
    progress INT DEFAULT 0 COMMENT '进度值',
    target_value INT DEFAULT 1 COMMENT '目标值',
    status TINYINT DEFAULT 0 COMMENT '状态：0-进行中，1-已完成，2-已领取',
    completed_time BIGINT COMMENT '完成时间',
    claimed_time BIGINT COMMENT '领取时间',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    UNIQUE KEY uk_user_achievement (user_id, achievement_code),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_type (achievement_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户成就表';

-- 2.5 用户等级表（新增）
DROP TABLE IF EXISTS t_user_level;
CREATE TABLE t_user_level (
    level_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '等级记录 ID',
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    current_level INT DEFAULT 1 COMMENT '当前等级',
    current_exp INT DEFAULT 0 COMMENT '当前经验值',
    next_level_exp INT DEFAULT 100 COMMENT '下一级所需经验值',
    total_exp INT DEFAULT 0 COMMENT '总经验值',
    level_title VARCHAR(50) COMMENT '等级称号',
    last_level_up_time BIGINT COMMENT '上次升级时间',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    UNIQUE KEY uk_user (user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_level (current_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户等级表';

-- 2.6 管控配置增强表（补充 t_user_control_config）
-- 现有 t_user_control_config 缺少疲劳控制模式、内容管控等字段
ALTER TABLE t_user_control_config
ADD COLUMN IF NOT EXISTS fatigue_point_threshold INT DEFAULT 60 COMMENT '疲劳点阈值（分钟）' AFTER daily_answer_limit,
ADD COLUMN IF NOT EXISTS rest_duration INT DEFAULT 15 COMMENT '强制休息时长（分钟）' AFTER fatigue_point_threshold,
ADD COLUMN IF NOT EXISTS fatigue_control_mode VARCHAR(10) DEFAULT 'SOFT' COMMENT '疲劳控制模式：SOFT/HARD/OFF' AFTER rest_duration,
ADD COLUMN IF NOT EXISTS game_category_whitelist TEXT COMMENT '游戏类型白名单（JSON 数组）' AFTER blocked_games,
ADD COLUMN IF NOT EXISTS difficulty_limit VARCHAR(10) DEFAULT 'ALL' COMMENT '难度限制：ALL/EASY/MEDIUM/HARD' AFTER game_category_whitelist,
ADD COLUMN IF NOT EXISTS spending_limit INT DEFAULT 0 COMMENT '消费限额（游戏币/天）' AFTER difficulty_limit;

-- 2.7 关系确认表（新增，用于关系转移确认流程）
DROP TABLE IF EXISTS t_relation_confirmation;
CREATE TABLE t_relation_confirmation (
    confirmation_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '确认 ID',
    relation_id BIGINT NOT NULL COMMENT '关系 ID',
    confirmation_type VARCHAR(20) NOT NULL COMMENT '确认类型：BIND-绑定，UNBIND-解绑，TRANSFER-转移',
    confirmor_id BIGINT NOT NULL COMMENT '需要确认的用户 ID',
    confirmor_type TINYINT NOT NULL COMMENT '需要确认的用户类型',
    status TINYINT DEFAULT 0 COMMENT '状态：0-待确认，1-已确认，2-已拒绝，3-已过期',
    token VARCHAR(100) COMMENT '确认令牌',
    expire_time BIGINT COMMENT '过期时间',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    INDEX idx_relation (relation_id),
    INDEX idx_confirmor (confirmor_id, confirmor_type),
    INDEX idx_status (status),
    INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='关系确认表';

-- ================================================
-- 3. 索引优化
-- ================================================

-- 3.1 为现有表添加缺失的索引
CREATE INDEX IF NOT EXISTS idx_t_user_status_type ON t_user(status, user_type);
CREATE INDEX IF NOT EXISTS idx_t_user_create_time ON t_user(create_time);
CREATE INDEX IF NOT EXISTS idx_t_user_last_login ON t_user(last_login_time);

-- 3.2 为 t_user_relation 添加组合索引
CREATE INDEX IF NOT EXISTS idx_t_user_relation_ab ON t_user_relation(user_a, user_b);
CREATE INDEX IF NOT EXISTS idx_t_user_relation_ba ON t_user_relation(user_b, user_a);
CREATE INDEX IF NOT EXISTS idx_t_user_relation_status ON t_user_relation(status, relation_type);

-- ================================================
-- 4. 视图和统计
-- ================================================

-- 4.1 用户关系统计视图
CREATE OR REPLACE VIEW v_user_relation_stats AS
SELECT 
    user_a AS guardian_id,
    COUNT(DISTINCT user_b) AS kid_count,
    SUM(CASE WHEN is_primary = 1 THEN 1 ELSE 0 END) AS primary_kid_count,
    SUM(CASE WHEN permission_level = 3 THEN 1 ELSE 0 END) AS full_permission_count
FROM t_user_relation
WHERE deleted = 0 AND status = 1
GROUP BY user_a;

-- 4.2 儿童监护人统计视图
CREATE OR REPLACE VIEW v_kid_guardian_stats AS
SELECT 
    user_b AS kid_id,
    COUNT(DISTINCT user_a) AS guardian_count,
    MAX(CASE WHEN is_primary = 1 THEN user_a ELSE NULL END) AS primary_guardian_id,
    GROUP_CONCAT(DISTINCT role_type SEPARATOR ',') AS role_types
FROM t_user_relation
WHERE deleted = 0 AND status = 1
GROUP BY user_b;

-- 4.3 用户活跃度统计视图
-- ⚠️ 注意：t_user_action_log 没有 deleted 字段，直接关联查询
CREATE OR REPLACE VIEW v_user_activity_stats AS
SELECT 
    u.user_id,
    u.user_type,
    u.username,
    u.nickname,
    u.status,
    COUNT(DISTINCT DATE(FROM_UNIXTIME(al.create_time / 1000))) AS active_days,
    COUNT(al.log_id) AS action_count,
    MAX(al.create_time) AS last_action_time
FROM t_user u
LEFT JOIN t_user_action_log al ON u.user_id = al.user_id
WHERE u.deleted = 0
GROUP BY u.user_id, u.user_type, u.username, u.nickname, u.status;

-- ================================================
-- 5. 初始化数据
-- ================================================

-- 5.1 初始化用户等级配置
INSERT INTO t_system_config (config_key, config_value, description, config_group) VALUES
('level.exp_per_game_minute', '1', '每分钟游戏获得的经验值', 'level'),
('level.exp_per_answer', '2', '每次答题获得的经验值', 'level'),
('level.base_exp_multiplier', '1.0', '基础经验倍率', 'level');

-- 5.2 初始化成就配置
INSERT INTO t_system_config (config_key, config_value, description, config_group) VALUES
('achievement.first_login', '{"name":"初次登录","desc":"首次登录系统","icon":"/achievements/first_login.png","exp":10}', '初次登录成就', 'achievement'),
('achievement.first_answer', '{"name":"初次答题","desc":"首次答对题目","icon":"/achievements/first_answer.png","exp":20}', '初次答题成就', 'achievement'),
('achievement.game_master', '{"name":"游戏大师","desc":"累计游戏 10 小时","icon":"/achievements/game_master.png","exp":100}', '游戏大师成就', 'achievement');

-- 5.3 初始化默认管控规则（全局）
INSERT INTO t_system_config (config_key, config_value, description, config_group) VALUES
('control.default_daily_duration', '60', '默认每日游戏时长（分钟）', 'control'),
('control.default_single_duration', '30', '默认单次游戏时长（分钟）', 'control'),
('control.default_allowed_start', '06:00', '默认允许开始时间', 'control'),
('control.default_allowed_end', '22:00', '默认允许结束时间', 'control'),
('control.default_fatigue_threshold', '60', '默认疲劳点阈值（分钟）', 'control'),
('control.default_rest_duration', '15', '默认强制休息时长（分钟）', 'control');

-- ================================================
-- 6. 业务逻辑说明（使用编码实现）
-- ================================================

-- ⚠️ 注意：以下功能使用 Java 编码实现，不使用数据库对象
-- 
-- 6.1 用户注册初始化逻辑
--   - 位置：UserService.register() 方法
--   - 功能：自动初始化疲劳点（10 点）、用户等级、成就追踪
--   - 替代方案：@Transactional + Service 层调用
--
-- 6.2 用户等级计算逻辑
--   - 位置：UserLevelService.calculateLevel(totalExp) 方法
--   - 功能：根据总经验值计算等级
--   - 算法：level = floor(sqrt(totalExp / 100)) + 1
--
-- 6.3 过期申请清理逻辑
--   - 位置：RequestCleanupScheduler 定时任务
--   - 功能：每天凌晨清理过期未处理的申请
--   - 替代方案：@Scheduled(cron = "0 0 2 * * ?")
--
-- 6.4 疲劳点每日重置逻辑
--   - 位置：FatigueResetScheduler 定时任务
--   - 功能：每天 06:00 重置所有用户的疲劳点
--   - 替代方案：@Scheduled(cron = "0 0 6 * * ?")
--
-- ================================================

-- ================================================
-- 7. 数据初始化（可选）
-- ================================================

-- 8.1 如果有旧的 kid 表，可以迁移到统一用户表
-- 注意：这是示例，实际迁移需要根据具体情况调整
/*
INSERT INTO t_user (user_type, username, password, nickname, avatar, status, fatigue_points, create_time, update_time)
SELECT 0 AS user_type, k.username, k.password, k.nickname, k.avatar, k.status, 10 AS fatigue_points, 
       k.create_time, k.update_time
FROM t_kid k
WHERE NOT EXISTS (
    SELECT 1 FROM t_user u WHERE u.username = k.username AND u.user_type = 0
);
*/

-- ================================================
-- 8. 完成提示
-- ================================================

SELECT '用户管理系统数据库迁移完成！' AS migration_status,
       NOW() AS completion_time,
       'v1.0.0' AS version;
