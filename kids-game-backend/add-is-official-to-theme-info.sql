-- 添加 is_official 字段到主题表
-- Date: 2026-03-21

USE kids_game;

-- 1. 添加 is_official 字段（如果不存在）
ALTER TABLE theme_info
ADD COLUMN IF NOT EXISTS `is_official` TINYINT(1) DEFAULT 0 COMMENT '是否为官方主题：0-否，1-是' AFTER `author_id`;

-- 2. 为新字段添加索引
ALTER TABLE theme_info
ADD INDEX IF NOT EXISTS idx_is_official (is_official);

-- 3. 查看更新后的表结构
DESCRIBE theme_info;

-- 4. 查看现有数据（用于验证）
SELECT
    theme_id,
    theme_name,
    author_name,
    is_official,
    status,
    owner_type,
    owner_id
FROM theme_info
ORDER BY theme_id;
