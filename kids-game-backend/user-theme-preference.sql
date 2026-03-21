-- ============================================
-- 用户主题偏好表
-- 用于存储每个用户对每个游戏/应用的当前使用主题
-- Date: 2026-03-21
-- Author: AI Assistant
-- ============================================

-- 1. 创建用户主题偏好表
CREATE TABLE IF NOT EXISTS `user_theme_preference` (
  `preference_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '偏好 ID',
  `user_id` BIGINT NOT NULL COMMENT '用户 ID',
  `owner_type` VARCHAR(20) NOT NULL COMMENT '所有者类型：GAME-游戏，APPLICATION-应用',
  `owner_id` BIGINT NOT NULL COMMENT '所有者 ID（游戏 ID 或应用 ID）',
  `theme_id` BIGINT NOT NULL COMMENT '主题 ID',
  `is_active` TINYINT DEFAULT 1 COMMENT '是否启用：0-否，1-是',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_user_owner` (`user_id`, `owner_type`, `owner_id`) COMMENT '每个用户对每个游戏/应用只有一个当前主题',
  INDEX `idx_user_id` (`user_id`) COMMENT '用户 ID 索引',
  INDEX `idx_theme_id` (`theme_id`) COMMENT '主题 ID 索引',
  INDEX `idx_owner_type_owner_id` (`owner_type`, `owner_id`) COMMENT '所有者类型和 ID 索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户主题偏好表';

-- 2. 为 theme_info 表添加标签字段（如果不存在）
-- is_default: 是否为某个游戏的默认主题
ALTER TABLE `theme_info` 
ADD COLUMN IF NOT EXISTS `is_default` TINYINT DEFAULT 0 COMMENT '是否为默认主题：0-否，1-是' AFTER `config_json`;

-- 添加索引
ALTER TABLE `theme_info` 
ADD INDEX IF NOT EXISTS `idx_is_default` (`is_default`);

-- 3. 数据初始化：如果没有默认主题，将第一个上架主题设为默认
UPDATE theme_info 
SET is_default = 1 
WHERE theme_id = (
    SELECT MIN(theme_id) 
    FROM (
        SELECT theme_id 
        FROM theme_info 
        WHERE owner_type = 'GAME' 
        AND status = 'on_sale'
        AND is_default = 0
        LIMIT 1
    ) AS temp
)
AND is_default = 0;

-- 4. 初始化用户主题偏好数据（可选）
-- 为现有用户创建默认主题偏好
INSERT INTO user_theme_preference (user_id, owner_type, owner_id, theme_id)
SELECT DISTINCT 
  u.user_id,
  t.owner_type,
  t.owner_id,
  t.theme_id
FROM theme_info t
CROSS JOIN (SELECT DISTINCT user_id FROM t_user WHERE deleted = 0) u
WHERE t.is_default = 1 
AND t.owner_type = 'GAME'
ON DUPLICATE KEY UPDATE theme_id = t.theme_id;

-- 5. 验证查询
-- 查看表结构
DESCRIBE user_theme_preference;

-- 查看所有用户的主题偏好
SELECT 
  utp.preference_id,
  utp.user_id,
  utp.owner_type,
  utp.owner_id,
  utp.theme_id,
  ti.theme_name,
  ti.author_name,
  utp.is_active,
  utp.created_at,
  utp.updated_at
FROM user_theme_preference utp
LEFT JOIN theme_info ti ON utp.theme_id = ti.theme_id
ORDER BY utp.user_id, utp.owner_type, utp.owner_id;

-- 查看某个用户的主题偏好
-- SELECT * FROM user_theme_preference WHERE user_id = ?;
