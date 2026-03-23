-- =====================================================
-- Schema V2 补充脚本 - 添加缺失的表
-- =====================================================
-- 基于实际数据库 (ss.sql) 补充缺失的表定义
-- 执行时间：2026-03-23
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ========================================
-- 1. 主题资源表 (高优先级 - 生产环境正在使用)
-- ========================================
CREATE TABLE IF NOT EXISTS theme_assets (
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
        FOREIGN KEY (theme_id) REFERENCES theme_info(theme_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='主题资源文件表';

-- ========================================
-- 2. 游戏配置表 (高优先级 - 游戏配置依赖)
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
-- 3. 游戏模式配置表
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
-- 4. 草稿分类表 (中优先级 - 草稿功能需要)
-- ========================================
CREATE TABLE IF NOT EXISTS draft_category (
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
-- 5. 草稿分类关联表
-- ========================================
CREATE TABLE IF NOT EXISTS draft_category_relation (
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
-- 6. 通知消息表 (中优先级 - 通知功能需要)
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
    create_time BIGINT NOT NULL COMMENT '创建时间',
    update_time BIGINT NOT NULL COMMENT '更新时间',
    expire_time BIGINT DEFAULT NULL COMMENT '过期时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_user (user_id, user_type),
    INDEX idx_status (status),
    INDEX idx_is_read (is_read),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知消息表';

-- ========================================
-- 7. 用户主题偏好表
-- ========================================
CREATE TABLE IF NOT EXISTS user_theme_preference (
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
-- 8. 修正现有表的字段差异
-- ========================================

-- 8.1 修正 t_game 字段长度
ALTER TABLE t_game 
MODIFY COLUMN game_url VARCHAR(500) COMMENT '游戏访问地址 URL（独立部署时使用）',
MODIFY COLUMN game_secret VARCHAR(100) COMMENT '游戏密钥（用于签名验证）';

-- 8.2 为 t_system_config 添加缺失字段
ALTER TABLE t_system_config
ADD COLUMN IF NOT EXISTS config_type VARCHAR(20) DEFAULT 'STRING' COMMENT '配置类型：STRING-字符串，INT-整数，JSON-JSON对象' AFTER config_value,
ADD COLUMN IF NOT EXISTS status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用' AFTER config_group;

-- 8.3 为 t_game_session 添加 session_token 字段
ALTER TABLE t_game_session
ADD COLUMN IF NOT EXISTS session_token VARCHAR(100) COMMENT '会话令牌（用于游戏验证）' AFTER game_id;

-- 8.4 为 t_daily_stats 添加更多统计字段
ALTER TABLE t_daily_stats
ADD COLUMN IF NOT EXISTS total_fatigue_points INT DEFAULT 0 COMMENT '发放疲劳点总数' AFTER correct_answer_count,
ADD COLUMN IF NOT EXISTS total_consumed_points INT DEFAULT 0 COMMENT '消耗疲劳点总数' AFTER total_fatigue_points;

-- ========================================
-- 9. 创建草稿统计视图
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
-- 10. 创建清理过期草稿的存储过程
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

-- ========================================
-- 完成提示
-- ========================================
SELECT 'Schema 补充完成！已添加以下表:' AS message;
SELECT '1. theme_assets (主题资源表)' AS table_added
UNION ALL SELECT '2. t_game_config (游戏配置表)'
UNION ALL SELECT '3. t_game_mode_config (游戏模式配置表)'
UNION ALL SELECT '4. draft_category (草稿分类表)'
UNION ALL SELECT '5. draft_category_relation (草稿分类关联表)'
UNION ALL SELECT '6. t_notification (通知消息表)'
UNION ALL SELECT '7. user_theme_preference (用户主题偏好表)'
UNION ALL SELECT '8. v_draft_statistics (草稿统计视图)'
UNION ALL SELECT '9. sp_cleanup_expired_drafts (清理存储过程)';

SET FOREIGN_KEY_CHECKS = 1;
