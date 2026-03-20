-- 系统配置表
CREATE TABLE IF NOT EXISTS t_system_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value VARCHAR(500) COMMENT '配置值',
    description VARCHAR(255) COMMENT '配置描述',
    config_group VARCHAR(50) COMMENT '配置分组 (fatigue/game/answer/system)',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- 插入默认配置
INSERT INTO t_system_config (config_key, config_value, description, config_group)
VALUES
-- 疲劳点配置
('fatigue.initial_points', '10', '初始疲劳点数', 'fatigue'),
('fatigue.points_per_minute', '1', '每分钟消耗疲劳点', 'fatigue'),
('fatigue.daily_reset_time', '00:00', '每日重置时间', 'fatigue'),
('fatigue.max_daily_points', '20', '每日最大疲劳点', 'fatigue'),

-- 答题配置
('answer.points_per_correct', '1', '答对每题获得疲劳点', 'answer'),
('answer.daily_max_points', '10', '每日答题获得疲劳点上限', 'answer'),
('answer.question_count_per_request', '1', '每次请求题目数量', 'answer'),

-- 游戏配置
('game.min_fatigue_points', '1', '开始游戏所需最小疲劳点', 'game'),
('game.max_single_duration', '60', '单次游戏最大时长(分钟)', 'game'),
('game.heartbeat_interval', '60', '心跳间隔(秒)', 'game'),

-- 系统配置
('system.jwt_expiration_hours', '24', 'JWT过期时间(小时)', 'system'),
('system.api_rate_limit_per_minute', '100', 'API每分钟限流次数', 'system'),
('system.api_rate_limit_per_minute.answer', '10', '答题接口每分钟限流次数', 'system')
ON DUPLICATE KEY UPDATE update_time = UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000;
