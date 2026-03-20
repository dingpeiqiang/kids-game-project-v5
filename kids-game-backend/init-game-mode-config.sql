-- 游戏模式配置表
CREATE TABLE IF NOT EXISTS t_game_mode_config(
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
   mode_type VARCHAR(50) NOT NULL COMMENT '模式类型 (single_player/local_battle/team/online_battle)',
   mode_name VARCHAR(100) COMMENT '模式名称',
   enabled TINYINT DEFAULT 1 COMMENT '是否启用 (0-禁用，1-启用)',
   config_json TEXT COMMENT '模式配置 (JSON 格式)',
    sort_order INT DEFAULT 0 COMMENT '排序权重',
   create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_game_mode (game_id, mode_type),
    INDEX idx_game_id (game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏模式配置表';

-- 插入默认模式配置（为所有现有游戏添加单机模式和本地对抗模式）
INSERT INTO t_game_mode_config(game_id, mode_type, mode_name, enabled, config_json, sort_order)
SELECT 
    game_id,
    'single_player' AS mode_type,
    '单机模式' AS mode_name,
    1 AS enabled,
    '{"aiDifficulty": "medium", "aiResponseDelay": 2000, "aiErrorRate": 0.2}' AS config_json,
    1 AS sort_order
FROM t_game
WHERE deleted = 0
ON DUPLICATE KEY UPDATE update_time = UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000;

INSERT INTO t_game_mode_config(game_id, mode_type, mode_name, enabled, config_json, sort_order)
SELECT 
    game_id,
    'local_battle' AS mode_type,
    '本地对抗' AS mode_name,
   1 AS enabled,
    '{"maxRounds": 3, "timeLimit": 0}' AS config_json,
   2 AS sort_order
FROM t_game
WHERE deleted = 0
ON DUPLICATE KEY UPDATE update_time = UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000;
