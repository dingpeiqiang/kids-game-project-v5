-- ============================================
-- 创建 t_game_config 表 - 游戏配置表
-- 用途：存储游戏的各种参数配置（如难度、速度、伤害等）
-- ============================================

DROP TABLE IF EXISTS t_game_config;
CREATE TABLE t_game_config (
   config_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
   config_key VARCHAR(100) NOT NULL COMMENT '配置键名',
   config_value TEXT NOT NULL COMMENT '配置值',
   description VARCHAR(500) COMMENT '配置说明',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间（毫秒时间戳）',
   deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
   UNIQUE KEY uk_game_key (game_id, config_key, deleted),
    INDEX idx_game_id (game_id),
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏配置表';

-- ============================================
-- 创建 t_leaderboard_dimension 表 - 排行榜维度表
-- 用途：定义游戏的多个排行榜维度（如最高分、最长时长等）
-- ============================================

DROP TABLE IF EXISTS t_leaderboard_dimension;
CREATE TABLE t_leaderboard_dimension(
    dimension_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '维度 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    dimension_code VARCHAR(50) NOT NULL COMMENT '维度代码（如：score, time, length）',
    dimension_name VARCHAR(100) NOT NULL COMMENT '维度名称（如：最高分数、最长时长）',
   sort_order INT DEFAULT 0 COMMENT '排序权重',
    data_type VARCHAR(20) DEFAULT 'INT' COMMENT '数据类型：INT-整数，LONG-长整数，DECIMAL-小数',
    icon VARCHAR(50) COMMENT '图标 emoji',
   description VARCHAR(500) COMMENT '维度说明',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间（毫秒时间戳）',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间（毫秒时间戳）',
   deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
   UNIQUE KEY uk_game_dimension (game_id, dimension_code, deleted),
    INDEX idx_game_id (game_id),
    INDEX idx_dimension_code (dimension_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='排行榜维度表';

-- ============================================
-- 创建 t_game_mode_config 表 - 游戏模式配置表
-- 用途：定义游戏的不同玩法模式（如单机、本地对战、在线对战等）
-- ============================================

DROP TABLE IF EXISTS t_game_mode_config;
CREATE TABLE t_game_mode_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
   mode_type VARCHAR(50) NOT NULL COMMENT '模式类型：single_player-单机，local_battle-本地对战，team-组队，online_battle-在线对战',
   mode_name VARCHAR(100) COMMENT '模式名称',
   enabled TINYINT DEFAULT 1 COMMENT '是否启用：0-禁用，1-启用',
   config_json TEXT COMMENT '模式配置（JSON 格式）',
   sort_order INT DEFAULT 0 COMMENT '排序权重',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
   deleted INT DEFAULT 0 COMMENT '逻辑删除',
   UNIQUE KEY uk_game_mode (game_id, mode_type),
    INDEX idx_game_id (game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏模式配置表';

-- ============================================
-- 验证表已创建
-- ============================================
SELECT 'Tables created successfully!' AS status;
SHOW TABLES LIKE 't_game%';
